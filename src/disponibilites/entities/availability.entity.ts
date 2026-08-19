import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entité Availability — table `availabilities`.
 *
 * Représente un créneau de disponibilité publié par un enseignant.
 * Les étudiants consultent ces créneaux pour planifier leurs rendez-vous.
 */
@Entity({ name: 'availabilities' })
export class Availability {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  /** Enseignant propriétaire de ce créneau. */
  @ManyToOne(() => User, (user) => user.availabilities, { nullable: false })
  owner!: User;

  @Column({ type: 'timestamp' })
  startAt!: Date;

  @Column({ type: 'timestamp' })
  endAt!: Date;

  /** Titre descriptif du créneau (ex: "Permanence mathématiques"). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  /** Type de créneau (ex: 'standard', 'office-hours', 'tutorial'). */
  @Column({ type: 'varchar', length: 50, default: 'standard' })
  type!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
