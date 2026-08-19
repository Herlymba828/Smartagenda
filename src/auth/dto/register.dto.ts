import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

/** Rôles qu'un visiteur peut choisir lui-même à l'inscription. */
export type SelfServiceRole = UserRole.STUDENT | UserRole.TEACHER;

/**
 * DTO d'inscription — corps attendu pour POST /auth/register.
 *
 * Contrairement à CreateUserDto, `role` est optionnel (student par défaut)
 * et ne peut pas valoir `admin` : un compte administrateur ne se crée pas
 * en libre-service.
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

  @ApiPropertyOptional({
    enum: [UserRole.STUDENT, UserRole.TEACHER],
    default: UserRole.STUDENT,
    description: 'Requested role — admin cannot be self-assigned',
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsIn([UserRole.STUDENT, UserRole.TEACHER], {
    message: 'role must be one of the following values: student, teacher',
  })
  role?: SelfServiceRole;
}
