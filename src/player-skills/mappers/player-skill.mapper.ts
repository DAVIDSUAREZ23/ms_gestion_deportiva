import { Injectable } from '@nestjs/common';
import { Player } from '../../players/entities/player.entity';
import { PlayerMapper } from '../../players/mappers/player.mapper';
import { Skill } from '../../skills/entities/skill.entity';
import { SkillMapper } from '../../skills/mappers/skill.mapper';
import { PlayerSkillResponseDto } from '../dto/player-skill-response.dto';
import { PlayerSkill } from '../entities/player-skill.entity';

@Injectable()
export class PlayerSkillMapper {
  constructor(
    private readonly playerMapper: PlayerMapper,
    private readonly skillMapper: SkillMapper,
  ) {}

  toEntity(player: Player, skill: Skill): PlayerSkill {
    const playerSkill = new PlayerSkill();
    playerSkill.player = player;
    playerSkill.skill = skill;
    return playerSkill;
  }

  toResponseDto(playerSkill: PlayerSkill): PlayerSkillResponseDto {
    return {
      id: playerSkill.id,
      player: this.playerMapper.toSummaryDto(playerSkill.player),
      skill: this.skillMapper.toSummaryDto(playerSkill.skill),
    };
  }

  toResponseDtoList(playerSkills: PlayerSkill[]): PlayerSkillResponseDto[] {
    return playerSkills.map((playerSkill) => this.toResponseDto(playerSkill));
  }
}
