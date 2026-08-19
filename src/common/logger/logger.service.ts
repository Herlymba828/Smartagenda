import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as Winston from 'winston';

/**
 * Service de logging Winston — implémente l'interface NestLoggerService.
 *
 * Fournit un logger structuré avec :
 * - Sortie console (tous niveaux)
 * - Fichier `logs/error.log` (erreurs uniquement, rotation 5 fichiers × 5 MB)
 * - Fichier `logs/combined.log` (tous niveaux, même rotation)
 *
 * En développement (NODE_ENV=development) : format lisible colorisé en console.
 * En production : format JSON pour faciliter l'ingestion par des outils de log.
 *
 * Scope.TRANSIENT : une instance par classe qui l'injecte (contexte distinct par service).
 *
 * Note : ce service est déclaré mais non injecté par défaut dans les modules NestJS.
 * Les services utilisent directement `new Logger(NomService.name)` de @nestjs/common.
 * Pour l'utiliser, l'enregistrer dans un module et l'injecter via le constructeur.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private readonly logger: Winston.Logger;

  constructor() {
    const logLevel     = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV === 'development';

    const formats: Winston.Logform.Format[] = [
      Winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      Winston.format.errors({ stack: true }),
      Winston.format.splat(),
      Winston.format.json(),
    ];

    // Format lisible en développement
    if (isDevelopment) {
      formats.push(
        Winston.format.colorize(),
        Winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
          let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        }),
      );
    }

    this.logger = Winston.createLogger({
      level: logLevel,
      format: Winston.format.combine(...formats),
      transports: [
        // Console — tous les niveaux
        new Winston.transports.Console({
          handleExceptions: true,
          handleRejections: true,
        }),
        // Fichier erreurs uniquement (rotation : 5 fichiers de 5 MB max)
        new Winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          handleExceptions: true,
          handleRejections: true,
          maxsize: 5242880, // 5 MB
          maxFiles: 5,
        }),
        // Fichier tous niveaux (rotation : 5 fichiers de 5 MB max)
        new Winston.transports.File({
          filename: 'logs/combined.log',
          handleExceptions: true,
          handleRejections: true,
          maxsize: 5242880, // 5 MB
          maxFiles: 5,
        }),
      ],
      exitOnError: false, // Ne pas quitter le processus sur une erreur de log
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /** Définit un contexte par défaut pour tous les logs de cette instance. */
  setContext(context: string) {
    this.logger.defaultMeta = { context };
  }
}
