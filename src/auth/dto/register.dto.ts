import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';
import { SELF_SERVICE_ROLES } from '../../users/role.util';

/** Rôles techniques qu'un visiteur peut choisir lui-même à l'inscription. */
export type SelfServiceRole = UserRole.CLIENT | UserRole.PROVIDER;

/**
 * DTO d'inscription — corps attendu pour POST /auth/register.
 *
 * `role` porte le comportement système (client = réserve, prestataire = publie)
 * et `profession` la profession déclarée, purement descriptive. Les rôles
 * hérités (`student`, `teacher`, `utilisateur`) et `admin` sont refusés :
 * un compte administrateur ne se crée pas en libre-service.
 */
export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    enum: SELF_SERVICE_ROLES,
    example: UserRole.CLIENT,
    description:
      'Technical role — client books slots, prestataire publishes them',
  })
  @IsEnum(UserRole)
  @IsIn(SELF_SERVICE_ROLES, {
    message: 'role must be one of the following values: client, prestataire',
  })
  role!: SelfServiceRole;

  @ApiProperty({
    example: 'Médecin généraliste',
    description:
      'Declared profession — descriptive only, never used for access control',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  profession!: string;
}
