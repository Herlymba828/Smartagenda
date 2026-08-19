import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/** Canal de livraison d'une notification. */
export enum NotificationChannel {
  EMAIL = 'email', // Envoyée par email via SMTP
  SMS = 'sms', // Réservé à un usage futur
  SYSTEM = 'system', // Notification in-app uniquement
}

/**
 * Entité Notification — table `notifications`.
 *
 * Représente une notification envoyée à un utilisateur.
 * Chaque notification est liée à un seul utilisateur (destinataire)
 * et dispose d'un statut de lecture (read).
 *
 * La date d'envoi est gérée automatiquement par @CreateDateColumn().
 */
@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  /** Utilisateur destinataire de la notification. */
  @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
  user!: User;

  /** Canal par lequel la notification a été (ou sera) envoyée. */
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.SYSTEM,
  })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  /** false par défaut — passe à true après PATCH /notifications/:id/read. */
  @Column({ type: 'boolean', default: false })
  read!: boolean;

  /** Date d'envoi définie automatiquement à la création. */
  @CreateDateColumn()
  sentAt!: Date;
}
