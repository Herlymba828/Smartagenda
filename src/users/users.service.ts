import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../utils/hash.util';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

/**
 * Service de gestion des utilisateurs.
 *
 * Fournit toutes les opérations CRUD sur les utilisateurs ainsi qu'une
 * méthode utilitaire pour s'assurer qu'un compte admin existe au démarrage.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Crée un nouvel utilisateur en hashant son mot de passe.
   * Le hash est calculé de manière asynchrone (scrypt) pour ne pas bloquer l'event loop.
   */
  async create(dto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user account email=${dto.email} role=${dto.role}`);

    try {
      const existingUser = await this.findOneByEmail(dto.email);
      if (existingUser) {
        this.logger.warn(`User account creation rejected: email already exists email=${dto.email}`);
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }

      const user = this.usersRepository.create({
        ...dto,
        password: await hashPassword(dto.password),
      });
      const savedUser = await this.usersRepository.save(user);
      this.logger.log(`User account created id=${savedUser.id} email=${savedUser.email}`);
      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`User account creation failed email=${dto.email}: ${message}`);
      throw error;
    }
  }

  /** Retourne tous les utilisateurs (le champ password est exclu via select:false). */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Recherche un utilisateur par email.
   *
   * @param email - Email à rechercher.
   * @param includePassword - Si true, inclut le champ password dans le résultat
   *                          (nécessaire uniquement pour la validation du login).
   * @returns L'utilisateur trouvé ou null.
   */
  async findOneByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    // Ajoute explicitement password au SELECT car il est select:false par défaut
    if (includePassword) {
      query.addSelect('user.password');
    }
    return query.getOne();
  }

  /**
   * Recherche un utilisateur par ID.
   * @throws NotFoundException si l'utilisateur n'existe pas.
   */
  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  /**
   * Crée automatiquement un compte administrateur au démarrage si ADMIN_EMAIL est défini.
   * Utilisé pour initialiser la plateforme en production sans passer par le seed.
   * Idempotent : ne crée le compte que s'il n'existe pas encore.
   */
  async ensureAdminExists(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return; // Variable non définie — aucune action
    }
    const existing = await this.findOneByEmail(adminEmail);
    if (!existing) {
      const admin = this.usersRepository.create({
        email: adminEmail,
        password: await hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
        firstName: 'Admin',
        role: UserRole.ADMIN,
      });
      await this.usersRepository.save(admin);
    }
  }
}
