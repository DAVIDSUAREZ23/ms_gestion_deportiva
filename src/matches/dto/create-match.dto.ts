import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class CreateMatchDto {
  @IsInt({ message: 'La fase debe ser un id numérico' })
  @Min(1, { message: 'La fase debe ser un id válido' })
  phaseId!: number;

  // Obligatorio en fase de grupos; no aplica en fase final
  @IsOptional()
  @IsInt({ message: 'El grupo debe ser un id numérico' })
  @Min(1, { message: 'El grupo debe ser un id válido' })
  groupId?: number | null;

  @IsInt({ message: 'El equipo local debe ser un id numérico' })
  @Min(1, { message: 'El equipo local debe ser un id válido' })
  homeTeamId!: number;

  @IsInt({ message: 'El equipo visitante debe ser un id numérico' })
  @Min(1, { message: 'El equipo visitante debe ser un id válido' })
  awayTeamId!: number;

  @IsISO8601({}, { message: 'La fecha y hora debe tener el formato AAAA-MM-DDTHH:mm' })
  scheduledAt!: string;

  @IsOptional()
  @IsInt({ message: 'El escenario debe ser un id numérico' })
  @Min(1, { message: 'El escenario debe ser un id válido' })
  venueId?: number | null;

  // Posición en las llaves de la fase final (1, 2, 3...); no aplica en fase de grupos
  @IsOptional()
  @IsInt({ message: 'La posición en la llave debe ser un número entero' })
  @Min(1, { message: 'La posición en la llave debe ser mayor o igual a 1' })
  @Max(128, { message: 'La posición en la llave no puede superar 128' })
  bracketPosition?: number | null;
}
