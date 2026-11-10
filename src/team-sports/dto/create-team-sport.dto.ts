import { IsInt, Min } from 'class-validator';

export class CreateTeamSportDto {
  @IsInt({ message: 'El equipo debe ser un id numérico' })
  @Min(1, { message: 'El equipo debe ser un id válido' })
  teamId!: number;

  @IsInt({ message: 'El deporte debe ser un id numérico' })
  @Min(1, { message: 'El deporte debe ser un id válido' })
  sportId!: number;
}
