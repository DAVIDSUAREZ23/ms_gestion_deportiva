import { ConflictException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import { SkillsService } from './skills.service';

const SKILL = Object.assign(new Skill(), { id: 1, name: 'Velocidad', description: null, active: true });

describe('SkillsService (HU-GD-06)', () => {
  let skillsRepository: RepositoryMock<Skill>;
  let playerSkillsRepository: RepositoryMock<PlayerSkill>;
  let service: SkillsService;

  beforeEach(() => {
    skillsRepository = createRepositoryMock<Skill>();
    playerSkillsRepository = createRepositoryMock<PlayerSkill>();
    service = new SkillsService(asRepository(skillsRepository), asRepository(playerSkillsRepository), new SkillMapper());
  });

  it('create con nombre repetido responde conflicto', async () => {
    skillsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create({ name: 'Velocidad' })).rejects.toThrow(ConflictException);
  });

  it('remove de una habilidad asignada a jugadores responde conflicto y no elimina', async () => {
    skillsRepository.findOneBy.mockResolvedValue(SKILL);
    playerSkillsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(skillsRepository.remove).not.toHaveBeenCalled();
  });

  it('remove de una habilidad sin asignar la elimina', async () => {
    skillsRepository.findOneBy.mockResolvedValue(SKILL);

    await service.remove(1);

    expect(skillsRepository.remove).toHaveBeenCalledWith(SKILL);
  });
});
