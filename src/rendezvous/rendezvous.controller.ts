import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RendezvousService } from './rendezvous.service';

/**
 * Contrôleur des rendez-vous.
 *
 * Endpoints :
 * - POST   /appointments      — crée un rendez-vous (rate-limité)
 * - GET    /appointments      — liste tous les rendez-vous
 * - GET    /appointments/:id  — détail d'un rendez-vous
 * - DELETE /appointments/:id  — annule un rendez-vous (passe status à 'cancelled')
 *
 * Note : DELETE ne supprime pas physiquement l'enregistrement — il met
 * uniquement le statut à CANCELLED pour conserver l'historique.
 */
@ApiTags('appointments')
@Controller('appointments')
export class RendezvousController {
  constructor(private readonly rendezvousService: RendezvousService) {}

  /**
   * POST /appointments
   * Crée un rendez-vous entre un étudiant et un enseignant.
   * Rate-limité à 10 créations par minute.
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.rendezvousService.create(dto);
  }

  /** GET /appointments — retourne tous les rendez-vous avec student et teacher peuplés. */
  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  findAll() {
    return this.rendezvousService.findAll();
  }

  /** GET /appointments/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.rendezvousService.findOne(Number(id));
  }

  /**
   * DELETE /appointments/:id
   * Annule le rendez-vous (status → CANCELLED) sans le supprimer physiquement.
   * Rate-limité à 5 annulations par minute.
   */
  @Delete(':id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  cancel(@Param('id') id: string) {
    return this.rendezvousService.cancel(Number(id));
  }
}
