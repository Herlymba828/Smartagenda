import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { DisponibilitesService } from './disponibilites.service';

/**
 * Contrôleur des disponibilités.
 *
 * Endpoints :
 * - POST   /availabilities      — publie un créneau de disponibilité
 * - GET    /availabilities      — liste toutes les disponibilités (avec owner peuplé)
 * - GET    /availabilities/:id  — détail d'une disponibilité
 * - DELETE /availabilities/:id  — supprime physiquement la disponibilité
 *
 * Contrairement aux rendez-vous, la suppression est physique ici
 * car les créneaux n'ont pas d'historique à préserver.
 */
@ApiTags('availabilities')
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
  create(@Body() dto: CreateAvailabilityDto) {
    return this.disponibilitesService.create(dto);
  }

  /** GET /availabilities — liste toutes les disponibilités avec la relation owner. */
  @Get()
  @ApiOperation({ summary: 'Get all availabilities' })
  @ApiResponse({ status: 200, description: 'List of availabilities' })
  findAll() {
    return this.disponibilitesService.findAll();
  }

  /** GET /availabilities/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get availability by ID' })
  @ApiResponse({ status: 200, description: 'Availability details' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  findOne(@Param('id') id: string) {
    return this.disponibilitesService.findOne(Number(id));
  }

  /** DELETE /availabilities/:id — suppression physique du créneau. */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an availability' })
  @ApiResponse({ status: 200, description: 'Availability deleted' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  remove(@Param('id') id: string) {
    return this.disponibilitesService.remove(Number(id));
  }
}
