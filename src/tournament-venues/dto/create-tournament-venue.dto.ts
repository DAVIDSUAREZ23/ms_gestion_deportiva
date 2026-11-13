import { IsInt, Min } from 'class-validator';

export class CreateTournamentVenueDto {
  @IsInt({ message: 'El torneo debe ser un id numérico' })
  @Min(1, { message: 'El torneo debe ser un id válido' })
  tournamentId!: number;

  @IsInt({ message: 'El escenario debe ser un id numérico' })
  @Min(1, { message: 'El escenario debe ser un id válido' })
  venueId!: number;
}
