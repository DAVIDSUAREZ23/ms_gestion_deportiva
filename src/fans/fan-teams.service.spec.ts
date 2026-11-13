import { ConflictException, NotFoundException } from '@nestjs/common';
import { HOME } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { FanTeam } from './entities/fan-team.entity';
import { Fan } from './entities/fan.entity';
import { FanTeamsService } from './fan-teams.service';
import { FansService } from './fans.service';
import { FanMapper } from './mappers/fan.mapper';

const FAN = Object.assign(new Fan(), { id: 1, userId: 7, displayName: 'Ana', email: 'ana@correo.com', active: true });

describe('FanTeamsService (Aficionado Equipo)', () => {
  let fanTeamsRepository: RepositoryMock<FanTeam>;
  let service: FanTeamsService;

  beforeEach(() => {
    fanTeamsRepository = createRepositoryMock<FanTeam>();
    fanTeamsRepository.save.mockImplementation((entity) => Promise.resolve({ ...entity, id: 3, followedAt: new Date() } as FanTeam));
    const fansService = { findActiveByUserOrFail: jest.fn().mockResolvedValue(FAN) };
    const teamsService = { findActiveOrFail: jest.fn().mockResolvedValue(HOME), findOrFail: jest.fn().mockResolvedValue(HOME) };
    service = new FanTeamsService(
      asRepository(fanTeamsRepository),
      fansService as unknown as FansService,
      teamsService as unknown as TeamsService,
      new FanMapper(new TeamMapper()),
    );
  });

  it('follow agrega el equipo a los que sigue el aficionado', async () => {
    const result = await service.follow(7, HOME.id);

    expect(result.team.name).toBe(HOME.name);
  });

  it('follow de un equipo que ya sigue responde conflicto', async () => {
    fanTeamsRepository.existsBy.mockResolvedValue(true);

    await expect(service.follow(7, HOME.id)).rejects.toThrow(ConflictException);
    expect(fanTeamsRepository.save).not.toHaveBeenCalled();
  });

  it('unfollow de un equipo que no sigue responde no encontrado', async () => {
    fanTeamsRepository.findOne.mockResolvedValue(null);

    await expect(service.unfollow(7, HOME.id)).rejects.toThrow(NotFoundException);
  });
});
