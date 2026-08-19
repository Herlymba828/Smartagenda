import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

/**
 * Contrôleur des notifications.
 *
 * Endpoints :
 * - GET   /notifications      — liste toutes les notifications
 * - GET   /notifications/:id  — détail d'une notification
 * - PATCH /notifications/:id/read — marque une notification comme lue
 *
 * Note : il n'y a pas d'endpoint POST public — les notifications sont créées
 * programmatiquement par NotificationsService lors d'événements métier
 * (confirmation de RDV, annulation, etc.).
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — retourne toutes les notifications avec la relation user. */
  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  findAll() {
    return this.notificationsService.findAll();
  }

  /** GET /notifications/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(Number(id));
  }

  /**
   * PATCH /notifications/:id/read
   * Marque une notification comme lue (read = true).
   * Idempotent : appeler plusieurs fois n'a pas d'effet supplémentaire.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(Number(id));
  }
}
