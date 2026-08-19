import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../utils/hash.util';
import { User } from '../users/entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { RegisterDto } from './dto/register.dto';

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

  /**
   * Inscrit un nouvel utilisateur et le connecte immédiatement.
   *
   * Rôle et profession étant obligatoires au niveau du DTO, le profil est
   * considéré comme complet dès l'inscription.
   *
   * @returns { access_token, user } — l'utilisateur créé sans son mot de passe
   * @throws ConflictException si l'email est déjà utilisé
   */
  async register(dto: RegisterDto) {
    const created = await this.usersService.create({
      ...dto,
      profileCompleted: true,
    });
    const { password, ...user } = created;
    void password;
    return { ...this.login(user), user };
  }

  /**
   * Renseigne le rôle technique et la profession d'un compte existant.
   *
   * Un nouveau JWT est émis car le rôle fait partie du payload : sans cela le
   * client conserverait un token portant son ancien rôle.
   *
   * @returns { access_token, user } — le profil complété sans son mot de passe
   */
  async completeProfile(userId: number, dto: CompleteProfileDto) {
    const updated = await this.usersService.completeProfile(userId, dto);
    return { ...this.login(updated), user: updated };
  }
}
