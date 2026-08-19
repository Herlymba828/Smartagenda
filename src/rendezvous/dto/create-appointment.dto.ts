import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

/**
 * DTO de création d'un rendez-vous — corps attendu pour POST /appointments.
 *
 * Les champs studentId et teacherId doivent correspondre à des utilisateurs
 * existants — une NotFoundException est levée par le service si ce n'est pas le cas.
 *
 * Les dates sont validées comme ISO 8601 par @IsDateString().
 */
export class CreateAppointmentDto {
  @ApiProperty({ example: 1, description: 'Student user ID' })
  @IsNumber()
  studentId!: number;

  @ApiProperty({ example: 2, description: 'Teacher user ID' })
  @IsNumber()
  teacherId!: number;

  @ApiProperty({
    example: '2026-08-10T14:00:00.000Z',
    description: 'Appointment start time (ISO 8601)',
  })
  @IsNotEmpty()
  @IsDateString()
  startAt!: string;

  @ApiProperty({
    example: '2026-08-10T14:30:00.000Z',
    description: 'Appointment end time (ISO 8601)',
  })
  @IsNotEmpty()
  @IsDateString()
  endAt!: string;

  @ApiProperty({ example: 'Math Tutoring', description: 'Appointment subject' })
  @IsString()
  subject!: string;

  @ApiPropertyOptional({
    example: 'Bring calculus textbook',
    description: 'Additional details',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Is virtual meeting' })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  /** Optionnel : le statut par défaut est 'pending' si non fourni. */
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
