import { Appointment } from '../../rendezvous/entities/appointment.entity';
import { Availability } from '../../disponibilites/entities/availability.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Rôles disponibles dans l'application.
 * Détermine les accès aux routes et aux fonctionnalités.
 */
export enum UserRole {
  STUDENT = 'student', // Peut créer des rendez-vous et consulter les disponibilités
  TEACHER = 'teacher', // Peut publier des disponibilités et gérer les demandes de RDV
  ADMIN   = 'admin',   // Accès complet à la gestion des utilisateurs
}

/**
 * Entité User — table `users` en base de données.
 *
 * Représente un compte utilisateur de la plateforme SmartAgenda.
 * Le champ `password` est exclu des requêtes SELECT par défaut (select: false)
 * pour éviter toute fuite accidentelle du hash dans les réponses API.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  /** Email unique utilisé comme identifiant de connexion. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180, unique: true })
  email!: string;

  /**
   * Hash scrypt du mot de passe (format: `salt.derivedKey`).
   * `select: false` : ce champ n'est jamais inclus dans les SELECT sauf explicitement demandé.
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 120 })
  firstName!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName?: string;

  /** Rôle de l'utilisateur — stocké comme enum PostgreSQL natif. */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  /** Disponibilités publiées par cet utilisateur (si enseignant). */
  @OneToMany(() => Availability, (availability) => availability.owner)
  availabilities!: Availability[];

  /** Rendez-vous dont cet utilisateur est l'étudiant. */
  @OneToMany(() => Appointment, (appointment) => appointment.student)
  appointmentsAsStudent!: Appointment[];

  /** Rendez-vous dont cet utilisateur est l'enseignant. */
  @OneToMany(() => Appointment, (appointment) => appointment.teacher)
  appointmentsAsTeacher!: Appointment[];

  /** Notifications reçues par cet utilisateur. */
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
