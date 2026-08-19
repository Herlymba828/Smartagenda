import { IsEnum, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

/** Statuts pouvant être appliqués à un rendez-vous existant. */
export type AppointmentDecision =
  AppointmentStatus.CONFIRMED | AppointmentStatus.CANCELLED;

/**
 * DTO de mise à jour du statut — corps attendu pour PATCH /appointments/:id/status.
 *
 * Seules la confirmation et l'annulation sont exposées : un rendez-vous ne peut
 * pas revenir à l'état `pending` une fois traité.
 */
export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  @IsIn([AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED], {
    message: 'status must be one of the following values: confirmed, cancelled',
  })
  status!: AppointmentDecision;
}
