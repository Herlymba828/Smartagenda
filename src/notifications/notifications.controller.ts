import {
  Controller,
  Get,
  Param,
  Patch,
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
import type { JwtRequest } from '../common/types/jwt-request';
import { NotificationsService } from './notifications.service';

/**
 * Contrôleur des notifications.
 *
 * Endpoints (tous protégés par JWT) :
 * - GET   /notifications      — notifications de l'utilisateur connecté
 * - GET   /notifications/:id  — détail d'une de ses notifications
 * - PATCH /notifications/:id/read — marque une de ses notifications comme lue
 *
 * Note : il n'y a pas d'endpoint POST public — les notifications sont créées
 * programmatiquement par NotificationsService lors d'événements métier
 * (confirmation de RDV, annulation, etc.).
 */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — notifications du destinataire connecté (toutes pour un admin). */
  @Get()
  @ApiOperation({ summary: 'Get notifications of the current user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: JwtRequest) {
    return this.notificationsService.findAllForUser(req.user);
  }

  /** GET /notifications/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string, @Request() req: JwtRequest) {
    return this.notificationsService.findOneForUser(Number(id), req.user);
  }

  /**
   * PATCH /notifications/:id/read
   * Marque une notification comme lue (read = true).
   * Idempotent : appeler plusieurs fois n'a pas d'effet supplémentaire.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markRead(@Param('id') id: string, @Request() req: JwtRequest) {
    return this.notificationsService.markRead(Number(id), req.user);
  }
}
