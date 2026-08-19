import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import type { JwtRequest } from '../common/types/jwt-request';
import { SKIP_PROFILE_COMPLETION } from './skip-profile-completion.decorator';

/** Code d'erreur renvoyé au frontend pour déclencher l'écran de complétion. */
export const PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE';

/**
 * Bloque les routes authentifiées tant que le profil n'est pas complété.
 *
 * S'utilise après JwtAuthGuard : `@UseGuards(JwtAuthGuard, ProfileCompletionGuard)`.
 * L'état est relu en base à chaque appel pour qu'un JWT émis avant la complétion
 * cesse d'être bloqué dès que le profil est renseigné. Le guard s'ajoute à la
 * chaîne sans modifier la logique du JwtAuthGuard ni des décorateurs de rôles.
 */
@Injectable()
export class ProfileCompletionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_PROFILE_COMPLETION,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Partial<JwtRequest>>();
    const actor = request.user;
    if (!actor) {
      return true;
    }

    const user = await this.usersService.findOneById(actor.userId);
    if (!user.profileCompleted) {
      throw new ForbiddenException({
        statusCode: 403,
        code: PROFILE_INCOMPLETE,
        message:
          'Complétez votre profil (rôle et profession) avant d’utiliser l’application',
      });
    }

    return true;
  }
}
