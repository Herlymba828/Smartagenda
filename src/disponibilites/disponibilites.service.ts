import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { User } from '../users/entities/user.entity';

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
   * @throws NotFoundException si l'utilisateur propriétaire n'existe pas.
   */
  async create(dto: CreateAvailabilityDto): Promise<Availability> {
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
   */
  async remove(id: number): Promise<void> {
    const availability = await this.findOne(id);
    await this.availabilityRepository.remove(availability);
  }
}
