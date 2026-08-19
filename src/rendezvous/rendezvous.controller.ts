import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileCompletionGuard } from '../auth/profile-completion.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RendezvousService } from './rendezvous.service';

/**
 * Contrôleur des rendez-vous.
 *
 * Endpoints (tous protégés par JWT) :
 * - POST   /appointments             — crée un rendez-vous (rate-limité)
 * - GET    /appointments             — liste les rendez-vous de l'utilisateur connecté
 * - GET    /appointments/:id         — détail d'un rendez-vous auquel il participe
 * - PATCH  /appointments/:id/status  — confirme ou annule un rendez-vous
 * - DELETE /appointments/:id         — annule un rendez-vous (passe status à 'cancelled')
 *
 * Les données sont cloisonnées par utilisateur : un étudiant ou un enseignant ne
 * voit que ses propres rendez-vous, seul un administrateur voit l'ensemble.
 */
@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProfileCompletionGuard)
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  create(@Body() dto: CreateAppointmentDto, @Request() req: JwtRequest) {
    return this.rendezvousService.create(dto, req.user);
  }

  /** GET /appointments — rendez-vous de l'utilisateur connecté (tous pour un admin). */
  @Get()
  @ApiOperation({ summary: 'Get appointments visible to the current user' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: JwtRequest) {
    return this.rendezvousService.findAllForUser(req.user);
  }

  /** GET /appointments/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string, @Request() req: JwtRequest) {
    return this.rendezvousService.findOneForUser(Number(id), req.user);
  }

  /**
   * PATCH /appointments/:id/status
   * Confirme (enseignant du rendez-vous ou admin) ou annule (tout participant).
   */
  @Patch(':id/status')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm or cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @Request() req: JwtRequest,
  ) {
    return this.rendezvousService.updateStatus(
      Number(id),
      dto.status,
      req.user,
    );
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  cancel(@Param('id') id: string, @Request() req: JwtRequest) {
    return this.rendezvousService.cancel(Number(id), req.user);
  }
}
