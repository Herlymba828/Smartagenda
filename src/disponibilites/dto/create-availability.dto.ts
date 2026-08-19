import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de création d'une disponibilité — corps attendu pour POST /availabilities.
 *
 * ownerId doit correspondre à un utilisateur existant (vérifié dans le service).
 * Les dates sont validées comme ISO 8601 par @IsDateString().
 */
export class CreateAvailabilityDto {
  @ApiProperty({ example: 1, description: 'Owner user ID (teacher)' })
  @IsNumber()
  ownerId!: number;

  @ApiProperty({
    example: '2026-08-07T09:00:00.000Z',
    description: 'Availability start time (ISO 8601)',
  })
  @IsNotEmpty()
  @IsDateString()
  startAt!: string;

  @ApiProperty({
    example: '2026-08-07T10:00:00.000Z',
    description: 'Availability end time (ISO 8601)',
  })
  @IsNotEmpty()
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({
    example: 'Office Hours',
    description: 'Availability title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  /** Type de créneau — valeur libre (ex: 'standard', 'office-hours', 'tutorial'). */
  @ApiPropertyOptional({ example: 'meeting', description: 'Availability type' })
  @IsOptional()
  @IsString()
  type?: string;
}
