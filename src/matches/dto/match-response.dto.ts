import { GroupSummaryDto } from '../../groups/dto/group-response.dto';
import { PhaseSummaryDto } from '../../phases/dto/phase-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';
import { VenueSummaryDto } from '../../venues/dto/venue-response.dto';
import { MatchStatus } from '../entities/match.entity';

export class MatchResponseDto {
  id!: number;
  phase!: PhaseSummaryDto;
  group!: GroupSummaryDto | null;
  homeTeam!: TeamSummaryDto;
  awayTeam!: TeamSummaryDto;
  scheduledAt!: string;
  venue!: VenueSummaryDto | null;
  status!: MatchStatus;
  homeScore!: number | null;
  awayScore!: number | null;
  bracketPosition!: number | null;
  // true cuando el partido ya tiene resultado oficial registrado
  hasResult!: boolean;
}
