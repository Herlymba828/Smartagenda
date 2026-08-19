import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Module d'envoi d'emails.
 *
 * Fournit EmailService à tout module qui l'importe.
 * Actuellement consommé par NotificationsModule.
 *
 * En développement (sans SMTP_HOST configuré), EmailService s'initialise
 * en mode mock et logue les emails dans la console sans les envoyer.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
