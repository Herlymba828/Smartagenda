import { IsEnum, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';
import { SELF_SERVICE_ROLES } from '../../users/role.util';
import type { SelfServiceRole } from './register.dto';

/**
 * DTO de complétion de profil — corps attendu pour PATCH /auth/complete-profile.
 *
 * Utilisé par les comptes créés avant l'introduction du rôle technique :
 * ils déclarent leur comportement (client/prestataire) et leur profession.
 */
export class CompleteProfileDto {
  @ApiProperty({
    enum: SELF_SERVICE_ROLES,
    example: UserRole.PROVIDER,
    description:
      'Technical role — client books slots, prestataire publishes them',
  })
  @IsEnum(UserRole)
  @IsIn(SELF_SERVICE_ROLES, {
    message: 'role must be one of the following values: client, prestataire',
  })
  role!: SelfServiceRole;

  @ApiProperty({ example: 'Coiffeur', description: 'Declared profession' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  profession!: string;
}
