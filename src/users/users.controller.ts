import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

/**
 * Type du request NestJS enrichi par la stratégie JWT Passport.
 * Injecté via @Request() dans les handlers protégés par JwtAuthGuard.
 */
interface JwtRequest {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Contrôleur de gestion des utilisateurs.
 *
 * Endpoints :
 * - GET  /users/me — profil de l'utilisateur connecté (protégé JWT)
 * - GET  /users    — liste tous les utilisateurs (protégé JWT)
 * - POST /users    — crée un utilisateur (public, rate-limité)
 *
 * Note : le champ `password` est systématiquement exclu des réponses
 * par déstructuration, en plus de la protection select:false sur l'entité.
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Retourne le profil complet de l'utilisateur authentifié.
   * Requiert un token JWT valide (injecté par authInterceptor côté frontend).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: JwtRequest) {
    const user = await this.usersService.findOneById(req.user.userId);
    const { password, ...result } = user;
    void password; // Évite l'avertissement TypeScript sur la variable non utilisée
    return result;
  }

  /**
   * GET /users
   * Retourne la liste de tous les utilisateurs sans leurs mots de passe.
   * Requiert un token JWT valide.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      const { password, ...result } = user;
      void password;
      return result;
    });
  }

  /**
   * POST /users
   * Crée un nouvel utilisateur (inscription publique).
   * Rate-limité à 3 créations par heure pour prévenir les abus.
   */
  @Post()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 comptes créés par heure maximum
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const { password, ...result } = user;
    void password;
    return result;
  }
}
