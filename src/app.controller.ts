import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Contrôleur racine de l'application.
 *
 * Expose uniquement l'endpoint GET / utilisé comme health-check basique.
 * Vérifie que le serveur répond sans nécessiter d'authentification.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /
   * Health-check — retourne 'Hello World!' pour confirmer que le serveur est opérationnel.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
