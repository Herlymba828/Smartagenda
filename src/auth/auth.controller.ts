import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * Contrôleur d'authentification.
 *
 * Expose l'endpoint de connexion POST /auth/login.
 * Protégé par un rate-limiter strict (5 tentatives/minute) pour prévenir
 * les attaques par force brute.
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
}
