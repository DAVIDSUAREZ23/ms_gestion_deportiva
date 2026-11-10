import { BadRequestException, ConflictException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Player } from '../players/entities/player.entity';
import { PlayerMapper } from '../players/mappers/player.mapper';
import { PlayersService } from '../players/players.service';
import { Team } from '../teams/entities/team.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { CreatePlayerContractDto } from './dto/create-player-contract.dto';
import { PlayerContract } from './entities/player-contract.entity';
import { PlayerContractMapper } from './mappers/player-contract.mapper';
import { PlayerContractsService } from './player-contracts.service';

const PLAYER = Object.assign(new Player(), { id: 1, firstName: 'Ana', lastName: 'Gómez', documentNumber: '123456', position: null, active: true });
const TEAM = Object.assign(new Team(), { id: 2, name: 'Once Caldas', active: true });
const OTHER_TEAM = Object.assign(new Team(), { id: 3, name: 'Deportes Tolima', active: true });
const CONTRACT: CreatePlayerContractDto = { playerId: 1, teamId: 2, startDate: '2026-01-01', endDate: '2999-12-31' };

function buildContract(overrides: Partial<PlayerContract> = {}): PlayerContract {
  return Object.assign(new PlayerContract(), {
    id: 10,
    player: PLAYER,
    team: TEAM,
    startDate: '2026-01-01',
    endDate: '2999-12-31',
    releasedAt: null,
    ...overrides,
  });
}

describe('PlayerContractsService (HU-GD-05)', () => {
  let contractsRepository: RepositoryMock<PlayerContract>;
  let service: PlayerContractsService;

  beforeEach(() => {
    contractsRepository = createRepositoryMock<PlayerContract>();
    contractsRepository.findOne.mockResolvedValue(null);
    const playersService = { findActiveOrFail: jest.fn().mockResolvedValue(PLAYER), findOrFail: jest.fn().mockResolvedValue(PLAYER) };
    const teamsService = { findActiveOrFail: jest.fn().mockResolvedValue(TEAM), findOrFail: jest.fn().mockResolvedValue(TEAM) };
    service = new PlayerContractsService(
      asRepository(contractsRepository),
      playersService as unknown as PlayersService,
      teamsService as unknown as TeamsService,
      new PlayerContractMapper(new PlayerMapper(), new TeamMapper()),
    );
  });

  it('sign con un jugador libre crea un contrato vigente', async () => {
    const result = await service.sign(CONTRACT);

    expect(result.current).toBe(true);
    expect(result.team.name).toBe('Once Caldas');
  });

  it('sign con fecha de fin anterior a la de inicio responde solicitud inválida', async () => {
    await expect(service.sign({ ...CONTRACT, endDate: '2025-12-31' })).rejects.toThrow(BadRequestException);
    expect(contractsRepository.save).not.toHaveBeenCalled();
  });

  it('sign con un jugador que ya tiene contrato vigente responde conflicto', async () => {
    contractsRepository.findOne.mockResolvedValue(buildContract({ team: OTHER_TEAM }));

    await expect(service.sign(CONTRACT)).rejects.toThrow(ConflictException);
    expect(contractsRepository.save).not.toHaveBeenCalled();
  });

  it('release cierra el contrato vigente y lo conserva como historial', async () => {
    contractsRepository.findOne.mockResolvedValue(buildContract());

    const result = await service.release(10);

    expect(result.releasedAt).not.toBeNull();
    expect(result.current).toBe(false);
    expect(contractsRepository.remove).not.toHaveBeenCalled();
  });

  it('release de un contrato ya retirado responde solicitud inválida', async () => {
    contractsRepository.findOne.mockResolvedValue(buildContract({ releasedAt: new Date('2026-05-01') }));

    await expect(service.release(10)).rejects.toThrow(BadRequestException);
  });
});
