import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';

/**
 * Module d'authentification.
 *
 * Configure Passport avec la stratégie JWT et expose AuthService
 * aux autres modules (ex: RendezvousModule pourrait en avoir besoin).
 *
 * La clé JWT est lue depuis la variable d'environnement JWT_SECRET.
 * L'absence de cette variable provoque une erreur au démarrage pour éviter
 * de démarrer avec un secret par défaut connu.
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Erreur au boot si JWT_SECRET est absent — pas de fallback non sécurisé
        secret:
          configService.get<string>('JWT_SECRET') ||
          (() => {
            throw new Error('JWT_SECRET environment variable is required');
          })(),
        signOptions: {
          // Durée de vie configurable via JWT_EXPIRATION (ex: '8h', '7d')
          expiresIn: configService.get<string>('JWT_EXPIRATION', '8h') as '8h',
        },
      }),
    }),
    UsersModule, // Nécessaire pour que AuthService puisse chercher les utilisateurs
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
