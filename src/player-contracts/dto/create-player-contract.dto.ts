import { IsDateString, IsInt, Min } from 'class-validator';

export class CreatePlayerContractDto {
  @IsInt({ message: 'El jugador debe ser un id numérico' })
  @Min(1, { message: 'El jugador debe ser un id válido' })
  playerId!: number;

  @IsInt({ message: 'El equipo debe ser un id numérico' })
  @Min(1, { message: 'El equipo debe ser un id válido' })
  teamId!: number;

  @IsDateString({}, { message: 'La fecha de inicio debe tener el formato AAAA-MM-DD' })
  startDate!: string;

  @IsDateString({}, { message: 'La fecha de fin debe tener el formato AAAA-MM-DD' })
  endDate!: string;
}
