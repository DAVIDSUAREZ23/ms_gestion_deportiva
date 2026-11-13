import { MatchAnnotationResponseDto } from '../../match-annotations/dto/match-annotation-response.dto';
import { MatchResponseDto } from '../../matches/dto/match-response.dto';
import { PhaseSummaryDto } from '../../phases/dto/phase-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';
import { TournamentResponseDto } from '../../tournaments/dto/tournament-response.dto';
import type { StandingRow } from '../standings.calculator';

export class OverviewMatchDto extends MatchResponseDto {
  annotations!: MatchAnnotationResponseDto[];
}

export class OverviewGroupDto {
  id!: number;
  name!: string;
  teams!: TeamSummaryDto[];
  standings!: StandingRow[];
  matches!: OverviewMatchDto[];
}

// Fase de grupos: trae grupos con tabla; fase final: trae los partidos ordenados como llaves
export class OverviewPhaseDto extends PhaseSummaryDto {
  groups!: OverviewGroupDto[];
  matches!: OverviewMatchDto[];
  playedMatches!: number;
  pendingMatches!: number;
}

export class TournamentOverviewResponseDto {
  tournament!: TournamentResponseDto;
  registeredTeams!: TeamSummaryDto[];
  phases!: OverviewPhaseDto[];
}
