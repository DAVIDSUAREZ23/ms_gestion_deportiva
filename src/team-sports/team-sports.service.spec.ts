import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Sport } from '../sports/entities/sport.entity';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { SportsService } from '../sports/sports.service';
import { Team } from '../teams/entities/team.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';
import { TeamSportsService } from './team-sports.service';

const TEAM = Object.assign(new Team(), { id: 1, name: 'Once Caldas', active: true });
const SPORT = Object.assign(new Sport(), { id: 2, name: 'Fútbol', active: true });

describe('TeamSportsService (HU-GD-03)', () => {
  let teamSportsRepository: RepositoryMock<TeamSport>;
  let teamsService: jest.Mocked<Pick<TeamsService, 'findActiveOrFail' | 'findOrFail'>>;
  let sportsService: jest.Mocked<Pick<SportsService, 'findActiveOrFail' | 'findOrFail'>>;
  let service: TeamSportsService;

  beforeEach(() => {
    teamSportsRepository = createRepositoryMock<TeamSport>();
    teamsService = { findActiveOrFail: jest.fn().mockResolvedValue(TEAM), findOrFail: jest.fn().mockResolvedValue(TEAM) };
    sportsService = { findActiveOrFail: jest.fn().mockResolvedValue(SPORT), findOrFail: jest.fn().mockResolvedValue(SPORT) };
    service = new TeamSportsService(
      asRepository(teamSportsRepository),
      teamsService as unknown as TeamsService,
      sportsService as unknown as SportsService,
      new TeamSportMapper(new TeamMapper(), new SportMapper()),
    );
  });

  it('assign con equipo y deporte activos crea la asociación', async () => {
    const result = await service.assign({ teamId: 1, sportId: 2 });

    expect(result.team.name).toBe('Once Caldas');
    expect(result.sport.name).toBe('Fútbol');
  });

  it('assign repetido responde conflicto', async () => {
    teamSportsRepository.existsBy.mockResolvedValue(true);

    await expect(service.assign({ teamId: 1, sportId: 2 })).rejects.toThrow(ConflictException);
    expect(teamSportsRepository.save).not.toHaveBeenCalled();
  });

  it('assign con deporte inactivo responde solicitud inválida', async () => {
    sportsService.findActiveOrFail.mockRejectedValue(new BadRequestException('inactivo'));

    await expect(service.assign({ teamId: 1, sportId: 2 })).rejects.toThrow(BadRequestException);
  });

  it('unassign de una asociación inexistente responde no encontrado', async () => {
    teamSportsRepository.findOne.mockResolvedValue(null);

    await expect(service.unassign(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('unassign elimina solo la asociación', async () => {
    const link = Object.assign(new TeamSport(), { id: 5, team: TEAM, sport: SPORT });
    teamSportsRepository.findOne.mockResolvedValue(link);

    await service.unassign(1, 2);

    expect(teamSportsRepository.remove).toHaveBeenCalledWith(link);
  });
});
