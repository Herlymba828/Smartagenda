import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RendezvousModule } from './rendezvous/rendezvous.module';
import { DisponibilitesModule } from './disponibilites/disponibilites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';

/**
 * Module racine de l'application SmartAgenda.
 *
 * Assemble tous les modules fonctionnels et configure les modules d'infrastructure :
 * - ConfigModule  : chargement des variables d'environnement depuis .env
 * - ThrottlerModule : rate-limiting global (configurable via RATE_LIMIT_TTL / RATE_LIMIT_LIMIT)
 * - TypeOrmModule : connexion PostgreSQL avec chargement automatique des entités
 */
@Module({
  imports: [
    // Variables d'environnement disponibles globalement via ConfigService
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate-limiting global — les controllers peuvent surcharger avec @Throttle()
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000, // en ms
            limit: configService.get<number>('RATE_LIMIT_LIMIT', 100),
          },
        ],
      }),
    }),

    // Connexion PostgreSQL configurée depuis les variables d'environnement
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<number>('DB_PORT', 5432)),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'smartagenda'),
        synchronize: false, // Toujours false en production — utiliser les migrations
        logging: configService.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true, // Charge automatiquement les entités enregistrées via forFeature()
        migrations: ['dist/migrations/*.js'],
        entities: ['dist/**/*.entity.js'],
        migrationsRun: false, // Migrations lancées manuellement via npm run migration:run
      }),
    }),

    // Modules fonctionnels
    EmailModule, // Service d'envoi d'emails (SMTP ou mock en développement)
    UsersModule, // Gestion des utilisateurs
    AuthModule, // Authentification JWT
    RendezvousModule, // Rendez-vous (appointments)
    DisponibilitesModule, // Disponibilités des enseignants
    NotificationsModule, // Notifications in-app et emails
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applique le rate-limiting à toutes les routes — sans ce guard,
    // les décorateurs @Throttle() des controllers restent sans effet.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
