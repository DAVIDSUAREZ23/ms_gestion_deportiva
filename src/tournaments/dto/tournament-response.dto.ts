import { SportSummaryDto } from '../../sports/dto/sport-response.dto';
import type { TournamentStage } from '../tournament.rules';

// Datos mínimos de un torneo para mostrarlo dentro de otros recursos
export class TournamentSummaryDto {
  id!: number;
  name!: string;
  stage!: TournamentStage;
}

export class TournamentResponseDto extends TournamentSummaryDto {
  description!: string | null;
  sport!: SportSummaryDto;
  registrationDeadline!: string;
  startDate!: string;
  endDate!: string;
  active!: boolean;
}
