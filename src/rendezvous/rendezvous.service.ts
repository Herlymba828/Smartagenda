import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentDecision } from './dto/update-appointment-status.dto';
import { User } from '../users/entities/user.entity';
import { AuthenticatedUser, isAdmin } from '../common/types/jwt-request';
import { isProviderRole } from '../users/role.util';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Service de gestion des rendez-vous.
 *
 * Orchestre les opérations CRUD sur les rendez-vous en résolvant
 * les relations avec les utilisateurs (student et teacher), en appliquant
 * le cloisonnement par utilisateur et en notifiant l'autre participant
 * à chaque étape du cycle de vie du rendez-vous.
 */
@Injectable()
export class RendezvousService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Crée un rendez-vous après avoir résolu les IDs student et teacher.
   *
   * Un client ne peut réserver que pour lui-même et un prestataire ne peut
   * créer un rendez-vous que sur son propre agenda ; l'administrateur n'est
   * pas restreint. Le prestataire concerné reçoit une notification.
   *
   * @throws NotFoundException si l'un des deux utilisateurs est introuvable.
   * @throws ForbiddenException si l'auteur n'est pas partie prenante du rendez-vous.
   */
  async create(
    dto: CreateAppointmentDto,
    actor: AuthenticatedUser,
  ): Promise<Appointment> {
    if (
      !isAdmin(actor) &&
      actor.userId !== dto.studentId &&
      actor.userId !== dto.teacherId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez créer un rendez-vous que pour vous-même',
      );
    }

    const [student, teacher] = await Promise.all([
      this.userRepository.findOne({ where: { id: dto.studentId } }),
      this.userRepository.findOne({ where: { id: dto.teacherId } }),
    ]);

    if (!student || !teacher) {
      throw new NotFoundException('Client ou prestataire introuvable');
    }

    // Le côté `teacher` du rendez-vous porte le prestataire : un compte qui ne
    // publie pas de créneaux ne peut pas y être placé.
    if (!isProviderRole(teacher.role)) {
      throw new ForbiddenException(
        'Le professionnel choisi ne propose pas de rendez-vous',
      );
    }

    const appointment = this.appointmentRepository.create({
      student,
      teacher,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      subject: dto.subject,
      description: dto.description,
      isVirtual: dto.isVirtual ?? false,
      status: dto.status ?? undefined, // Par défaut : PENDING (valeur par défaut de l'entité)
    });
    const saved = await this.appointmentRepository.save(appointment);

    await this.notificationsService.create({
      user: teacher,
      title: 'Nouvelle demande de rendez-vous',
      message: `${student.firstName} demande un rendez-vous « ${saved.subject} » le ${saved.startAt.toLocaleString('fr-FR')}.`,
    });

    return saved;
  }

  /**
   * Retourne les rendez-vous visibles par l'utilisateur : ceux auxquels il
   * participe comme étudiant ou enseignant, ou la totalité pour un admin.
   */
  async findAllForUser(actor: AuthenticatedUser): Promise<Appointment[]> {
    if (isAdmin(actor)) {
      return this.appointmentRepository.find({
        relations: { student: true, teacher: true },
      });
    }

    return this.appointmentRepository.find({
      where: [
        { student: { id: actor.userId } },
        { teacher: { id: actor.userId } },
      ],
      relations: { student: true, teacher: true },
    });
  }

  /**
   * Retourne un rendez-vous par ID avec ses relations.
   * @throws NotFoundException si le rendez-vous n'existe pas.
   */
  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: { student: true, teacher: true },
    });
    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    return appointment;
  }

  /**
   * Retourne un rendez-vous en vérifiant que l'utilisateur y participe.
   * @throws ForbiddenException si l'utilisateur n'est ni participant ni admin.
   */
  async findOneForUser(
    id: number,
    actor: AuthenticatedUser,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (!this.isParticipant(appointment, actor)) {
      throw new ForbiddenException('Ce rendez-vous ne vous est pas accessible');
    }
    return appointment;
  }

  /**
   * Confirme ou annule un rendez-vous et notifie l'autre participant.
   *
   * La confirmation est réservée au prestataire concerné (ou à un admin) ;
   * l'annulation est ouverte aux deux participants.
   *
   * @throws ForbiddenException si l'utilisateur n'a pas le droit d'appliquer ce statut.
   */
  async updateStatus(
    id: number,
    status: AppointmentDecision,
    actor: AuthenticatedUser,
  ): Promise<Appointment> {
    const appointment = await this.findOneForUser(id, actor);

    const isProviderOfAppointment = appointment.teacher.id === actor.userId;
    if (
      status === AppointmentStatus.CONFIRMED &&
      !isProviderOfAppointment &&
      !isAdmin(actor)
    ) {
      throw new ForbiddenException(
        'Seul le prestataire peut confirmer ce rendez-vous',
      );
    }

    appointment.status = status;
    const saved = await this.appointmentRepository.save(appointment);
    await this.notifyCounterpart(saved, actor, status);
    return saved;
  }

  /**
   * Annule un rendez-vous en passant son statut à CANCELLED.
   * N'effectue pas de suppression physique pour préserver l'historique.
   *
   * @throws NotFoundException si le rendez-vous n'existe pas.
   * @throws ForbiddenException si l'utilisateur n'y participe pas.
   */
  async cancel(id: number, actor: AuthenticatedUser): Promise<Appointment> {
    return this.updateStatus(id, AppointmentStatus.CANCELLED, actor);
  }

  /** Vérifie que l'utilisateur est étudiant, enseignant du rendez-vous, ou admin. */
  private isParticipant(
    appointment: Appointment,
    actor: AuthenticatedUser,
  ): boolean {
    return (
      isAdmin(actor) ||
      appointment.student.id === actor.userId ||
      appointment.teacher.id === actor.userId
    );
  }

  /** Notifie le participant qui n'est pas à l'origine du changement de statut. */
  private async notifyCounterpart(
    appointment: Appointment,
    actor: AuthenticatedUser,
    status: AppointmentDecision,
  ): Promise<void> {
    const recipient =
      appointment.student.id === actor.userId
        ? appointment.teacher
        : appointment.student;
    const title =
      status === AppointmentStatus.CONFIRMED
        ? 'Rendez-vous confirmé'
        : 'Rendez-vous annulé';

    await this.notificationsService.create({
      user: recipient,
      title,
      message: `Le rendez-vous « ${appointment.subject} » du ${appointment.startAt.toLocaleString('fr-FR')} est ${status === AppointmentStatus.CONFIRMED ? 'confirmé' : 'annulé'}.`,
    });
  }
}
