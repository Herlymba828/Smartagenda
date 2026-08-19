import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/**
 * Guard JWT pour la protection des endpoints.
 *
 * Étend AuthGuard('jwt') de Passport pour déclencher automatiquement
 * la stratégie JwtStrategy sur les routes décorées avec @UseGuards(JwtAuthGuard).
 *
 * Comportement :
 * - Token valide et non expiré → req.user est peuplé, la requête continue
 * - Token absent, malformé ou expiré → retourne 401 Unauthorized
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('me')
 * getProfile(@Request() req) { return req.user; }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
