import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';
import { User } from '../users/entities/user.entity';
import { DisponibilitesController } from './disponibilites.controller';
import { DisponibilitesService } from './disponibilites.service';
import { UsersModule } from '../users/users.module';

/**
 * Module des disponibilités.
 *
 * Importe l'entité User car DisponibilitesService doit résoudre
 * l'ownerId pour peupler la relation owner lors de la création.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Availability, User]), UsersModule],
  controllers: [DisponibilitesController],
  providers: [DisponibilitesService],
  exports: [DisponibilitesService],
})
export class DisponibilitesModule {}
