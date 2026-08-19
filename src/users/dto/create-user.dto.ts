import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

/**
 * DTO de création d'utilisateur — corps attendu pour POST /users.
 *
 * Validé automatiquement par le ValidationPipe global.
 * Le champ `role` accepte toutes les valeurs de l'enum UserRole.
 * En production, l'accès à cet endpoint devrait être restreint
 * pour empêcher la création de comptes admin sans authentification.
 */
export class CreateUserDto {
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
    enum: UserRole,
    example: UserRole.CLIENT,
    description: 'User role',
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: 'Médecin généraliste',
    description: 'Declared profession — descriptive only',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  profession?: string;
}
