import { PlayerContractResponseDto } from '../../player-contracts/dto/player-contract-response.dto';
import { PlayerResponseDto } from '../../players/dto/player-response.dto';
import { SkillSummaryDto } from '../../skills/dto/skill-response.dto';

// HU-GD-08: vista centralizada del jugador; las listas vacías indican que no tiene equipos o habilidades
export class PlayerProfileResponseDto {
  player!: PlayerResponseDto;
  currentContract!: PlayerContractResponseDto | null;
  contracts!: PlayerContractResponseDto[];
  skills!: SkillSummaryDto[];
}
