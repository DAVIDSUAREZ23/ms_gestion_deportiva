import { ConflictException, NotFoundException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsService } from './teams.service';

const TEAM = Object.assign(new Team(), { id: 1, name: 'Once Caldas', active: true });

describe('TeamsService (HU-GD-02)', () => {
  let teamsRepository: RepositoryMock<Team>;
  let teamSportsRepository: RepositoryMock<TeamSport>;
  let contractsRepository: RepositoryMock<PlayerContract>;
  let registrationsRepository: RepositoryMock<TournamentRegistration>;
  let service: TeamsService;

  beforeEach(() => {
    teamsRepository = createRepositoryMock<Team>();
    teamSportsRepository = createRepositoryMock<TeamSport>();
    contractsRepository = createRepositoryMock<PlayerContract>();
    registrationsRepository = createRepositoryMock<TournamentRegistration>();
    service = new TeamsService(
      asRepository(teamsRepository),
      asRepository(teamSportsRepository),
      asRepository(contractsRepository),
      asRepository(registrationsRepository),
      new TeamMapper(),
    );
  });

  it('create con nombre repetido responde conflicto', async () => {
    teamsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create({ name: 'Once Caldas' })).rejects.toThrow(ConflictException);
  });

  it('findOne de un equipo que no existe responde no encontrado', async () => {
    teamsRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('remove con jugadores (contratos) responde conflicto y no elimina', async () => {
    teamsRepository.findOneBy.mockResolvedValue(TEAM);
    contractsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(teamsRepository.remove).not.toHaveBeenCalled();
  });

  it('remove con deportes asociados responde conflicto y no elimina', async () => {
    teamsRepository.findOneBy.mockResolvedValue(TEAM);
    teamSportsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(teamsRepository.remove).not.toHaveBeenCalled();
  });

  it('remove con inscripciones en torneos responde conflicto y no elimina', async () => {
    teamsRepository.findOneBy.mockResolvedValue(TEAM);
    registrationsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(teamsRepository.remove).not.toHaveBeenCalled();
  });

  it('updateStatus desactiva el equipo', async () => {
    teamsRepository.findOneBy.mockResolvedValue({ ...TEAM });

    const result = await service.updateStatus(1, { active: false });

    expect(result.active).toBe(false);
  });
});
