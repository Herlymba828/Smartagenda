import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Point d'entrée de l'application NestJS SmartAgenda.
 *
 * Configure et démarre le serveur HTTP avec :
 * - Validation globale des DTOs (class-validator)
 * - Filtre d'exception global uniforme
 * - CORS restreint à l'origine du frontend
 * - Documentation Swagger interactive
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Niveaux de log activés — verbose en développement, à restreindre en production
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = new Logger('Bootstrap');

  // Keep the API namespace consistent with the frontend and reverse proxy.
  app.setGlobalPrefix('api');

  // ValidationPipe global : strip des propriétés non déclarées dans les DTOs,
  // rejet des propriétés inconnues, et transformation automatique des types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non listées dans le DTO
      forbidNonWhitelisted: true, // Retourne 400 si des propriétés inconnues sont envoyées
      transform: true, // Convertit automatiquement les types (ex: string → number)
    }),
  );

  // Filtre d'exception global : normalise toutes les réponses d'erreur
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS : restreint aux requêtes provenant du frontend configuré
  // FRONTEND_URL doit être défini en production pour ne pas exposer l'API à toutes origines
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Configuration Swagger — documentation interactive disponible sur /api/docs
  const config = new DocumentBuilder()
    .setTitle('SmartAgenda API')
    .setDescription(
      'API for SmartAgenda - Academic appointment scheduling system',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('appointments', 'Appointment scheduling')
    .addTag('availabilities', 'Availability management')
    .addTag('notifications', 'Notification system')
    .addBearerAuth() // Active l'interface de saisie du token JWT dans Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
