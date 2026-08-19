import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre d'exception global — normalise toutes les réponses d'erreur de l'API.
 *
 * Enregistré dans main.ts via `app.useGlobalFilters(new HttpExceptionFilter())`.
 * Le décorateur `@Catch()` sans argument intercepte TOUTES les exceptions,
 * y compris les erreurs non-HTTP (ex: crash TypeORM, erreurs inattendues).
 *
 * Format uniforme de la réponse d'erreur :
 * {
 *   statusCode: number,
 *   timestamp: string (ISO 8601),
 *   path: string,
 *   method: string,
 *   message: string,
 *   stack?: string  (uniquement en NODE_ENV=development)
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Détermine le code HTTP : utilise le code de l'HttpException ou 500 par défaut
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Preserve the detailed validation or conflict message from NestJS.
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const responseMessage = exceptionResponse.message;
        message = Array.isArray(responseMessage)
          ? responseMessage.join(' ')
          : String(responseMessage);
      } else {
        message = exception.message;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      // Stack trace exposée uniquement en développement pour faciliter le debug
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    const technicalMessage =
      exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${technicalMessage}`,
      stack,
    );

    response.status(status).json(errorResponse);
  }
}
