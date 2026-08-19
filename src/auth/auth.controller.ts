import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Contrôleur d'authentification.
 *
 * Expose l'inscription POST /auth/register et la connexion POST /auth/login.
 * Protégé par un rate-limiter strict pour prévenir les attaques par force
 * brute et la création massive de comptes.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * Valide les identifiants et retourne un token JWT en cas de succès.
   * Rate-limité à 5 requêtes par minute par IP.
   *
   * @returns { access_token: string } — JWT signé à utiliser dans les requêtes suivantes
   * @throws 401 si les identifiants sont incorrects
   * @throws 429 si le rate-limit est dépassé
   */
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({ summary: 'Login user and return JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  /**
   * POST /auth/register
   *
   * Inscription publique : crée le compte puis retourne directement un JWT
   * pour que le frontend n'ait pas à enchaîner avec un login.
   * Rate-limité à 5 inscriptions par heure par IP.
   *
   * @returns { access_token: string, user: User } — utilisateur sans mot de passe
   * @throws 400 si le corps est invalide
   * @throws 409 si l'email est déjà utilisé
   * @throws 429 si le rate-limit est dépassé
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 inscriptions par heure
  @ApiOperation({ summary: 'Register a new account and return a JWT token' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
