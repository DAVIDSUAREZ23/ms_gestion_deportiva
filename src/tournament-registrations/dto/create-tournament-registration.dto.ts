import { IsInt, Min } from 'class-validator';

export class CreateTournamentRegistrationDto {
  @IsInt({ message: 'El torneo debe ser un id numérico' })
  @Min(1, { message: 'El torneo debe ser un id válido' })
  tournamentId!: number;

  @IsInt({ message: 'El equipo debe ser un id numérico' })
  @Min(1, { message: 'El equipo debe ser un id válido' })
  teamId!: number;
}
