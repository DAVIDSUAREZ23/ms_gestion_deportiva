import { Injectable } from '@nestjs/common';
import { PlayerContractsService } from '../player-contracts/player-contracts.service';
import { PlayerSkillsService } from '../player-skills/player-skills.service';
import { PlayersService } from '../players/players.service';
import { PlayerProfileResponseDto } from './dto/player-profile-response.dto';

// HU-GD-08: arma el perfil deportivo reutilizando los servicios de jugadores, contratos y habilidades
@Injectable()
export class PlayerProfilesService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly contractsService: PlayerContractsService,
    private readonly playerSkillsService: PlayerSkillsService,
  ) {}

  async getProfile(playerId: number): Promise<PlayerProfileResponseDto> {
    const player = await this.playersService.findOne(playerId);
    const [contracts, playerSkills] = await Promise.all([
      this.contractsService.findHistoryByPlayer(playerId),
      this.playerSkillsService.findByPlayer(playerId),
    ]);

    return {
      player,
      currentContract: contracts.find((contract) => contract.current) ?? null,
      contracts,
      skills: playerSkills.map((playerSkill) => playerSkill.skill),
    };
  }
}
