import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailModule } from '../email/email.module';

/**
 * Module des notifications.
 *
 * Importe EmailModule pour que NotificationsService puisse
 * déclencher des emails lors de la création de notifications
 * avec le canal NotificationChannel.EMAIL.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification]), EmailModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
