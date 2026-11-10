import { PlayerSummaryDto } from '../../players/dto/player-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';

export class PlayerContractResponseDto {
  id!: number;
  player!: PlayerSummaryDto;
  team!: TeamSummaryDto;
  startDate!: string;
  endDate!: string;
  releasedAt!: string | null;
  // true mientras no se haya retirado y la fecha de fin no haya pasado
  current!: boolean;
}
