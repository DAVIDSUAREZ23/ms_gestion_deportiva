import { SportSummaryDto } from '../../sports/dto/sport-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';

export class TeamSportResponseDto {
  id!: number;
  team!: TeamSummaryDto;
  sport!: SportSummaryDto;
}
