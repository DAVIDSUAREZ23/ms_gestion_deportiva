import { PlayerSummaryDto } from '../../players/dto/player-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';

export class MatchAnnotationResponseDto {
  id!: number;
  matchId!: number;
  player!: PlayerSummaryDto;
  team!: TeamSummaryDto;
  minute!: number;
  notes!: string | null;
}
