import { PlayerSummaryDto } from '../../players/dto/player-response.dto';
import { SkillSummaryDto } from '../../skills/dto/skill-response.dto';

export class PlayerSkillResponseDto {
  id!: number;
  player!: PlayerSummaryDto;
  skill!: SkillSummaryDto;
}
