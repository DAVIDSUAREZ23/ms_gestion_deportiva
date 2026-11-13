import { TeamSummaryDto } from '../../teams/dto/team-response.dto';
import { TournamentSummaryDto } from '../../tournaments/dto/tournament-response.dto';

export class TournamentRegistrationResponseDto {
  id!: number;
  tournament!: TournamentSummaryDto;
  team!: TeamSummaryDto;
  registeredAt!: string;
  message?: string;
}
