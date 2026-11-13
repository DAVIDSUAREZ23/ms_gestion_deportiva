import { TournamentSummaryDto } from '../../tournaments/dto/tournament-response.dto';
import { PhaseType } from '../entities/phase.entity';

// Datos mínimos de una fase para mostrarla dentro de grupos y partidos
export class PhaseSummaryDto {
  id!: number;
  name!: string;
  type!: PhaseType;
  order!: number;
}

export class PhaseResponseDto extends PhaseSummaryDto {
  tournament!: TournamentSummaryDto;
}
