import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../utils/hash.util';
import { User } from '../users/entities/user.entity';

/** Type utilitaire : utilisateur sans le champ password (qui est select:false). */
type AuthenticatedUser = Omit<User, 'password'>;

/**
 * Service d'authentification.
 *
 * Deux responsabilités :
 * 1. Valider les identifiants email/mot de passe
 * 2. Générer le token JWT après validation réussie
 *
 * Le message d'erreur est intentionnellement générique ('Identifiants invalides')
 * pour ne pas révéler si c'est l'email ou le mot de passe qui est incorrect
 * (prévention de l'énumération des comptes).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Vérifie qu'un utilisateur existe et que son mot de passe est correct.
   *
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe en clair soumis
   * @returns L'utilisateur sans son mot de passe si la validation réussit
   * @throws UnauthorizedException si l'email est introuvable ou le mot de passe incorrect
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    // Charge l'utilisateur avec le champ password (select:false par défaut)
    const user = await this.usersService.findOneByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    if (!(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    // Supprime le mot de passe avant de retourner l'objet
    const { password: storedPassword, ...result } = user;
    void storedPassword;
    return result;
  }

  /**
   * Génère et retourne un token JWT signé pour l'utilisateur authentifié.
   *
   * Payload du token : { email, sub (id), role }
   * La durée de validité est configurée dans AuthModule via JWT_EXPIRATION.
   *
   * @param user - Utilisateur authentifié (sans mot de passe)
   * @returns Objet { access_token: string }
   */
  login(user: AuthenticatedUser) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
