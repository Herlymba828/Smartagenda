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
 * Rôle technique de l'utilisateur — pilote le comportement système.
 *
 * Deux comportements seulement, valables quel que soit le secteur d'activité :
 * un prestataire publie des créneaux, un client réserve. La profession réelle
 * (médecin, coiffeur, enseignant…) est portée par le champ `profession` et
 * reste purement descriptive.
 *
 * Les valeurs `student`, `teacher` et `utilisateur` sont conservées pour les
 * comptes existants ; elles sont traitées comme leur équivalent technique via
 * `isProviderRole()` / `isClientRole()` et ne sont plus proposées à l'inscription.
 */
export enum UserRole {
  CLIENT = 'client', // Réserve des créneaux publiés par les prestataires
  PROVIDER = 'prestataire', // Publie des créneaux et traite les demandes de RDV
  ADMIN = 'admin', // Accès complet à la gestion des utilisateurs
  STUDENT = 'student', // Hérité — équivalent de `client`
  TEACHER = 'teacher', // Hérité — équivalent de `prestataire`
  LEGACY_USER = 'utilisateur', // Hérité — rôle générique, profil à compléter
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

  /**
   * Profession déclarée (médecin, coiffeur, avocat, enseignant…).
   * Purement descriptive : sert à l'affichage et à la recherche, jamais aux
   * autorisations, qui reposent uniquement sur `role`.
   */
  @Column({ type: 'varchar', length: 120, nullable: true })
  profession?: string;

  /**
   * Faux tant que l'utilisateur n'a pas déclaré son rôle technique et sa
   * profession. Les comptes créés avant cette évolution restent à false et
   * sont redirigés vers PATCH /auth/complete-profile.
   */
  @Column({ type: 'boolean', default: false })
  profileCompleted!: boolean;

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
