import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Module de gestion des utilisateurs.
 *
 * Enregistre le repository TypeORM de l'entité User via forFeature()
 * et exporte UsersService pour qu'AuthModule puisse l'utiliser
 * lors de la validation des identifiants.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Exporté pour AuthModule
})
export class UsersModule {}
