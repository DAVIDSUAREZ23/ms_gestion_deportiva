import { ConflictException, NotFoundException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Player } from '../players/entities/player.entity';
import { PlayerMapper } from '../players/mappers/player.mapper';
import { PlayersService } from '../players/players.service';
import { Skill } from '../skills/entities/skill.entity';
import { SkillMapper } from '../skills/mappers/skill.mapper';
import { SkillsService } from '../skills/skills.service';
import { PlayerSkill } from './entities/player-skill.entity';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';
import { PlayerSkillsService } from './player-skills.service';

const PLAYER = Object.assign(new Player(), { id: 1, firstName: 'Ana', lastName: 'Gómez', documentNumber: '123456', position: null, active: true });
const SKILL = Object.assign(new Skill(), { id: 3, name: 'Velocidad', active: true });

describe('PlayerSkillsService (HU-GD-07)', () => {
  let playerSkillsRepository: RepositoryMock<PlayerSkill>;
  let service: PlayerSkillsService;

  beforeEach(() => {
    playerSkillsRepository = createRepositoryMock<PlayerSkill>();
    const playersService = { findActiveOrFail: jest.fn().mockResolvedValue(PLAYER), findOrFail: jest.fn().mockResolvedValue(PLAYER) };
    const skillsService = { findActiveOrFail: jest.fn().mockResolvedValue(SKILL), findOrFail: jest.fn().mockResolvedValue(SKILL) };
    service = new PlayerSkillsService(
      asRepository(playerSkillsRepository),
      playersService as unknown as PlayersService,
      skillsService as unknown as SkillsService,
      new PlayerSkillMapper(new PlayerMapper(), new SkillMapper()),
    );
  });

  it('assign agrega la habilidad al jugador', async () => {
    const result = await service.assign({ playerId: 1, skillId: 3 });

    expect(result.skill.name).toBe('Velocidad');
  });

  it('assign de una habilidad que el jugador ya tiene responde conflicto', async () => {
    playerSkillsRepository.existsBy.mockResolvedValue(true);

    await expect(service.assign({ playerId: 1, skillId: 3 })).rejects.toThrow(ConflictException);
  });

  it('unassign de una habilidad no asignada responde no encontrado', async () => {
    playerSkillsRepository.findOne.mockResolvedValue(null);

    await expect(service.unassign(1, 3)).rejects.toThrow(NotFoundException);
  });
});
