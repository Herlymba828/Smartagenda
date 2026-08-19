import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Statuts possibles d'un rendez-vous tout au long de son cycle de vie. */
export enum AppointmentStatus {
  PENDING = 'pending', // En attente de confirmation par l'enseignant
  CONFIRMED = 'confirmed', // Confirmé
  CANCELLED = 'cancelled', // Annulé (par l'étudiant ou l'enseignant)
}

/**
 * Entité Appointment — table `appointments`.
 *
 * Représente un rendez-vous planifié entre un étudiant et un enseignant.
 * Les deux FK (studentId, teacherId) référencent la même table users
 * via des relations ManyToOne distinctes.
 */
@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  /** Étudiant ayant demandé le rendez-vous. */
  @ManyToOne(() => User, (user) => user.appointmentsAsStudent, {
    nullable: false,
  })
  student!: User;

  /** Enseignant concerné par le rendez-vous. */
  @ManyToOne(() => User, (user) => user.appointmentsAsTeacher, {
    nullable: false,
  })
  teacher!: User;

  @Column({ type: 'timestamp' })
  startAt!: Date;

  @Column({ type: 'timestamp' })
  endAt!: Date;

  /** Sujet ou objet du rendez-vous (ex: "Aide en mathématiques"). */
  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  /**
   * Indique si le rendez-vous se tient en ligne (visioconférence)
   * ou en présentiel. Indexé pour faciliter les filtres côté backend.
   */
  @Index()
  @Column({ type: 'boolean', default: false })
  isVirtual!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
