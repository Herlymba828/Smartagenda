import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';

/**
 * Service de gestion des rendez-vous.
 *
 * Orchestre les opérations CRUD sur les rendez-vous en résolvant
 * les relations avec les utilisateurs (student et teacher).
 */
@Injectable()
export class RendezvousService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crée un rendez-vous après avoir résolu les IDs student et teacher.
   *
   * Les deux recherches d'utilisateurs sont parallélisées avec Promise.all
   * pour réduire la latence (deux SELECT simultanés au lieu de séquentiels).
   *
   * @throws NotFoundException si l'un des deux utilisateurs est introuvable.
   */
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const [student, teacher] = await Promise.all([
      this.userRepository.findOne({ where: { id: dto.studentId } }),
      this.userRepository.findOne({ where: { id: dto.teacherId } }),
    ]);

    if (!student || !teacher) {
      throw new NotFoundException('Étudiant ou enseignant introuvable');
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
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Retourne tous les rendez-vous avec les relations student et teacher peuplées.
   * Le frontend filtre ensuite côté client selon le rôle de l'utilisateur connecté.
   */
  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
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
   * Annule un rendez-vous en passant son statut à CANCELLED.
   * N'effectue pas de suppression physique pour préserver l'historique.
   *
   * @throws NotFoundException si le rendez-vous n'existe pas.
   */
  async cancel(id: number): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepository.save(appointment);
  }
}
