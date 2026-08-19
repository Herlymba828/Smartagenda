import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { RendezvousController } from './rendezvous.controller';
import { RendezvousService } from './rendezvous.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

/**
 * Module des rendez-vous (appointments).
 *
 * Importe l'entité User en plus d'Appointment car RendezvousService
 * doit résoudre les IDs student et teacher lors de la création d'un RDV,
 * ainsi que NotificationsModule pour prévenir le participant concerné
 * à la création et à chaque changement de statut.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, User]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [RendezvousController],
  providers: [RendezvousService],
  exports: [RendezvousService],
})
export class RendezvousModule {}
