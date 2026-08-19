import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Applique la configuration commune à toutes les instances de l'application
 * (serveur HTTP réel et applications de test) : validation des DTOs et
 * normalisation des réponses d'erreur.
 *
 * Sans cet appel, les DTOs ne sont pas validés : les requêtes invalides
 * atteignent les services au lieu de renvoyer un 400.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non listées dans le DTO
      forbidNonWhitelisted: true, // Retourne 400 si des propriétés inconnues sont envoyées
      transform: true, // Convertit automatiquement les types (ex: string → number)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  return app;
}
