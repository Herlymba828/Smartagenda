import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de connexion — corps attendu pour POST /auth/login.
 *
 * Validé automatiquement par le ValidationPipe global.
 * Les propriétés non déclarées ici sont rejetées (forbidNonWhitelisted: true).
 */
export class LoginDto {
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
  @IsNotEmpty()
  password!: string;
}
