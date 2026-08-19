import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { User } from '../users/entities/user.entity';
import { AuthenticatedUser, isAdmin } from '../common/types/jwt-request';

/**
 * Service de gestion des disponibilités.
 *
 * Gère les créneaux publiés par les enseignants.
 * Contrairement aux rendez-vous, les suppressions sont physiques
 * car les disponibilités n'ont pas d'historique à conserver.
 */
@Injectable()
export class DisponibilitesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crée un créneau de disponibilité après avoir résolu l'owner.
   *
   * Un utilisateur ne peut publier un créneau que sur son propre agenda ;
   * seul un administrateur peut le faire pour un tiers.
   *
   * @throws NotFoundException si l'utilisateur propriétaire n'existe pas.
   * @throws ForbiddenException si l'auteur publie pour un autre utilisateur.
   */
  async create(
    dto: CreateAvailabilityDto,
    actor: AuthenticatedUser,
  ): Promise<Availability> {
    if (!isAdmin(actor) && dto.ownerId !== actor.userId) {
      throw new ForbiddenException(
        'Vous ne pouvez publier un créneau que sur votre propre agenda',
      );
    }

    const owner = await this.userRepository.findOne({
      where: { id: dto.ownerId },
    });
    if (!owner) {
      throw new NotFoundException('Propriétaire de disponibilité introuvable');
    }

    const availability = this.availabilityRepository.create({
      owner,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      title: dto.title,
      type: dto.type,
    });
    return this.availabilityRepository.save(availability);
  }

  /** Retourne toutes les disponibilités avec la relation owner peuplée. */
  async findAll(): Promise<Availability[]> {
    return this.availabilityRepository.find({ relations: { owner: true } });
  }

  /**
   * Retourne une disponibilité par ID avec son owner.
   * @throws NotFoundException si la disponibilité n'existe pas.
   */
  async findOne(id: number): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!availability) {
      throw new NotFoundException('Disponibilité introuvable');
    }
    return availability;
  }

  /**
   * Supprime physiquement une disponibilité.
   * @throws NotFoundException si la disponibilité n'existe pas.
   * @throws ForbiddenException si l'utilisateur n'en est pas propriétaire.
   */
  async remove(id: number, actor: AuthenticatedUser): Promise<void> {
    const availability = await this.findOne(id);
    if (!isAdmin(actor) && availability.owner.id !== actor.userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres créneaux',
      );
    }
    await this.availabilityRepository.remove(availability);
  }
}
