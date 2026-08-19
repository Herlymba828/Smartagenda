import { Injectable } from '@nestjs/common';

/**
 * Service racine de l'application.
 * Utilisé uniquement pour le health-check via AppController.
 */
@Injectable()
export class AppService {
  /** Retourne le message de santé de l'application. */
  getHello(): string {
    return 'Hello World!';
  }
}
