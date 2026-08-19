import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
} from './entities/notification.entity';
import { EmailService } from '../email/email.service';

/**
 * Service de gestion des notifications.
 *
 * Deux responsabilités :
 * 1. Persistance des notifications en base (create, findAll, findOne, markRead)
 * 2. Déclenchement d'emails via EmailService pour les événements métier
 *    (confirmation de RDV, annulation, nouvelle demande)
 *
 * Les erreurs d'envoi d'email sont loggées mais ne font pas échouer l'opération
 * principale (comportement non-bloquant) — une notification peut exister en base
 * même si l'email n'a pas pu être envoyé.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crée et persiste une notification.
   * Si le canal est EMAIL et que l'utilisateur est défini, tente d'envoyer un email.
   * L'échec de l'email ne fait pas échouer la création de la notification.
   */
  async create(notification: Partial<Notification>): Promise<Notification> {
    const entity = this.notificationRepository.create(notification);
    const savedNotification = await this.notificationRepository.save(entity);

    // Envoi email non-bloquant — erreur loggée mais ignorée
    if (
      notification.channel === NotificationChannel.EMAIL &&
      notification.user
    ) {
      try {
        await this.emailService.sendEmail(
          notification.user.email,
          notification.title || 'Notification',
          notification.message || '',
        );
        this.logger.log(
          `Email notification sent to ${notification.user.email}`,
        );
      } catch (error) {
        this.logger.error(`Failed to send email notification:`, error);
      }
    }

    return savedNotification;
  }

  /** Retourne toutes les notifications avec la relation user peuplée. */
  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({ relations: { user: true } });
  }

  /**
   * Retourne une notification par ID.
   * @throws NotFoundException si la notification n'existe pas.
   */
  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }
    return notification;
  }

  /**
   * Marque une notification comme lue (read = true).
   * @throws NotFoundException si la notification n'existe pas.
   */
  async markRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Envoie un email de confirmation de rendez-vous.
   * Non-bloquant : l'erreur est loggée sans être propagée.
   */
  async sendAppointmentConfirmation(
    userEmail: string,
    userName: string,
    appointmentDetails: { subject: string; date: string; time: string },
  ): Promise<void> {
    try {
      await this.emailService.sendAppointmentConfirmation(
        userEmail,
        userName,
        appointmentDetails,
      );
      this.logger.log(`Appointment confirmation email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send appointment confirmation email:`,
        error,
      );
    }
  }

  /**
   * Envoie un email d'annulation de rendez-vous.
   * Non-bloquant : l'erreur est loggée sans être propagée.
   */
  async sendAppointmentCancellation(
    userEmail: string,
    userName: string,
    appointmentDetails: { subject: string; date: string },
  ): Promise<void> {
    try {
      await this.emailService.sendAppointmentCancellation(
        userEmail,
        userName,
        appointmentDetails,
      );
      this.logger.log(`Appointment cancellation email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send appointment cancellation email:`,
        error,
      );
    }
  }

  /**
   * Envoie un email de nouvelle demande de rendez-vous à l'enseignant.
   * Non-bloquant : l'erreur est loggée sans être propagée.
   */
  async sendNewAppointmentRequest(
    teacherEmail: string,
    teacherName: string,
    appointmentDetails: {
      studentName: string;
      subject: string;
      date: string;
      time: string;
    },
  ): Promise<void> {
    try {
      await this.emailService.sendNewAppointmentRequest(
        teacherEmail,
        teacherName,
        appointmentDetails,
      );
      this.logger.log(`New appointment request email sent to ${teacherEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send new appointment request email:`, error);
    }
  }
}
