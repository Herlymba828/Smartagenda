import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileCompletionGuard } from '../auth/profile-completion.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { DisponibilitesService } from './disponibilites.service';

/**
 * Contrôleur des disponibilités.
 *
 * Endpoints (tous protégés par JWT) :
 * - POST   /availabilities      — publie un créneau sur son propre agenda
 * - GET    /availabilities      — liste toutes les disponibilités (avec owner peuplé)
 * - GET    /availabilities/:id  — détail d'une disponibilité
 * - DELETE /availabilities/:id  — supprime un de ses créneaux
 *
 * Les créneaux restent visibles par tous les utilisateurs connectés : les
 * étudiants en ont besoin pour réserver. Seul le propriétaire (ou un admin)
 * peut créer ou supprimer un créneau.
 *
 * Contrairement aux rendez-vous, la suppression est physique ici
 * car les créneaux n'ont pas d'historique à préserver.
 */
@ApiTags('availabilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProfileCompletionGuard)
@Controller('availabilities')
export class DisponibilitesController {
  constructor(private readonly disponibilitesService: DisponibilitesService) {}

  /** POST /availabilities — crée un créneau de disponibilité. */
  @Post()
  @ApiOperation({ summary: 'Create a new availability' })
  @ApiResponse({
    status: 201,
    description: 'Availability created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateAvailabilityDto, @Request() req: JwtRequest) {
    return this.disponibilitesService.create(dto, req.user);
  }

  /** GET /availabilities — liste toutes les disponibilités avec la relation owner. */
  @Get()
  @ApiOperation({ summary: 'Get all availabilities' })
  @ApiResponse({ status: 200, description: 'List of availabilities' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.disponibilitesService.findAll();
  }

  /** GET /availabilities/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get availability by ID' })
  @ApiResponse({ status: 200, description: 'Availability details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  findOne(@Param('id') id: string) {
    return this.disponibilitesService.findOne(Number(id));
  }

  /** DELETE /availabilities/:id — suppression physique du créneau. */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an availability' })
  @ApiResponse({ status: 200, description: 'Availability deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  remove(@Param('id') id: string, @Request() req: JwtRequest) {
    return this.disponibilitesService.remove(Number(id), req.user);
  }
}
