import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { Skill } from '../skills/entities/skill.entity';
import { SkillsService } from '../skills/skills.service';
import { CreatePlayerSkillDto } from './dto/create-player-skill.dto';
import { PlayerSkillResponseDto } from './dto/player-skill-response.dto';
import { PlayerSkill } from './entities/player-skill.entity';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';

const WITH_PLAYER_AND_SKILL = { player: true, skill: true } as const;

// HU-GD-07: habilidades asignadas a cada jugador
@Injectable()
export class PlayerSkillsService {
  constructor(
    @InjectRepository(PlayerSkill) private readonly playerSkillsRepository: Repository<PlayerSkill>,
    private readonly playersService: PlayersService,
    private readonly skillsService: SkillsService,
    private readonly playerSkillMapper: PlayerSkillMapper,
  ) {}

  async assign(dto: CreatePlayerSkillDto): Promise<PlayerSkillResponseDto> {
    const player = await this.playersService.findActiveOrFail(dto.playerId);
    const skill = await this.skillsService.findActiveOrFail(dto.skillId);
    await this.ensureNotAssigned(player, skill);
    const saved = await this.playerSkillsRepository.save(this.playerSkillMapper.toEntity(player, skill));
    return this.playerSkillMapper.toResponseDto(saved);
  }

  // Retira la habilidad del jugador sin eliminarla del catálogo
  async unassign(playerId: number, skillId: number): Promise<{ message: string }> {
    const assignment = await this.playerSkillsRepository.findOne({
      where: { player: { id: playerId }, skill: { id: skillId } },
      relations: WITH_PLAYER_AND_SKILL,
    });
    if (!assignment) {
      throw new NotFoundException('El jugador no tiene asignada esa habilidad');
    }
    await this.playerSkillsRepository.remove(assignment);
    return { message: `Se retiró "${assignment.skill.name}" del jugador` };
  }

  async findByPlayer(playerId: number): Promise<PlayerSkillResponseDto[]> {
    await this.playersService.findOrFail(playerId);
    const assignments = await this.playerSkillsRepository.find({
      where: { player: { id: playerId } },
      relations: WITH_PLAYER_AND_SKILL,
      order: { skill: { name: 'ASC' } },
    });
    return this.playerSkillMapper.toResponseDtoList(assignments);
  }

  async findBySkill(skillId: number): Promise<PlayerSkillResponseDto[]> {
    await this.skillsService.findOrFail(skillId);
    const assignments = await this.playerSkillsRepository.find({
      where: { skill: { id: skillId } },
      relations: WITH_PLAYER_AND_SKILL,
      order: { player: { lastName: 'ASC' } },
    });
    return this.playerSkillMapper.toResponseDtoList(assignments);
  }

  private async ensureNotAssigned(player: Player, skill: Skill): Promise<void> {
    const assigned = await this.playerSkillsRepository.existsBy({
      player: { id: player.id },
      skill: { id: skill.id },
    });
    if (assigned) {
      throw new ConflictException(`${player.firstName} ${player.lastName} ya tiene la habilidad "${skill.name}"`);
    }
  }
}
