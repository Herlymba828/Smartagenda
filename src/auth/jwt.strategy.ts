import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/** Structure du payload contenu dans le token JWT signé. */
interface JwtPayload {
  sub: number; // ID de l'utilisateur (subject)
  email: string;
  role: string;
}

/**
 * Stratégie JWT Passport pour la validation des tokens.
 *
 * Utilisée par JwtAuthGuard pour décoder et valider automatiquement
 * le token Bearer présent dans le header Authorization de chaque requête protégée.
 *
 * La méthode `validate` est appelée après vérification de la signature et de
 * l'expiration du token. Son retour est injecté dans `req.user` par Passport.
 *
 * Sécurité : JWT_SECRET est requis au démarrage — erreur explicite si absent.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extrait le token depuis le header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Les tokens expirés sont rejetés (renvoie 401)
      ignoreExpiration: false,
      // Clé secrète obligatoire — erreur au démarrage si absente
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        (() => {
          throw new Error('JWT_SECRET environment variable is required');
        })(),
    });
  }

  /**
   * Transforme le payload JWT décodé en objet user injecté dans req.user.
   * Appelé par Passport après validation réussie de la signature et de l'expiration.
   *
   * @param payload - Payload JWT décodé (sub, email, role)
   * @returns Objet disponible dans les contrôleurs via @Request() req.user
   */
  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
