import { BadRequestException } from '@nestjs/common';
import { buildMatch, buildPhase, HOME, PLAYER } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { MatchStatus } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PhaseType } from '../phases/entities/phase.entity';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { PlayerMapper } from '../players/mappers/player.mapper';
import { PlayersService } from '../players/players.service';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { MatchAnnotation } from './entities/match-annotation.entity';
import { MatchAnnotationMapper } from './mappers/match-annotation.mapper';
import { MatchAnnotationsService } from './match-annotations.service';

const PHASE = buildPhase(PhaseType.GROUP_STAGE);

describe('MatchAnnotationsService (HU-GC-07 anotaciones)', () => {
  let annotationsRepository: RepositoryMock<MatchAnnotation>;
  let contractsRepository: RepositoryMock<PlayerContract>;
  let matchesService: { findOrFail: jest.Mock };
  let notificationsService: { notifyAnnotation: jest.Mock };
  let service: MatchAnnotationsService;

  beforeEach(() => {
    annotationsRepository = createRepositoryMock<MatchAnnotation>();
    contractsRepository = createRepositoryMock<PlayerContract>();
    contractsRepository.findOne.mockResolvedValue(Object.assign(new PlayerContract(), { team: HOME }));
    matchesService = { findOrFail: jest.fn().mockResolvedValue(buildMatch(PHASE)) };
    notificationsService = { notifyAnnotation: jest.fn() };
    const playersService = { findOrFail: jest.fn().mockResolvedValue(PLAYER) };
    service = new MatchAnnotationsService(
      asRepository(annotationsRepository),
      asRepository(contractsRepository),
      matchesService as unknown as MatchesService,
      playersService as unknown as PlayersService,
      notificationsService as unknown as NotificationsService,
      new MatchAnnotationMapper(new PlayerMapper(), new TeamMapper()),
    );
  });

  it('create registra la anotación con el equipo del jugador y notifica', async () => {
    const result = await service.create({ matchId: 50, playerId: PLAYER.id, minute: 23 });

    expect(result.team.name).toBe(HOME.name);
    expect(notificationsService.notifyAnnotation).toHaveBeenCalled();
  });

  it('create con un jugador que no pertenece a ninguno de los dos equipos responde solicitud inválida', async () => {
    contractsRepository.findOne.mockResolvedValue(null);

    await expect(service.create({ matchId: 50, playerId: PLAYER.id, minute: 23 })).rejects.toThrow(BadRequestException);
    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('create en un partido cancelado responde solicitud inválida', async () => {
    matchesService.findOrFail.mockResolvedValue(buildMatch(PHASE, { status: MatchStatus.CANCELLED }));

    await expect(service.create({ matchId: 50, playerId: PLAYER.id, minute: 23 })).rejects.toThrow(BadRequestException);
  });

  it('remove elimina solo la anotación', async () => {
    const annotation = Object.assign(new MatchAnnotation(), { id: 70, match: buildMatch(PHASE), player: PLAYER, team: HOME });
    annotationsRepository.findOne.mockResolvedValue(annotation);

    await service.remove(70);

    expect(annotationsRepository.remove).toHaveBeenCalledWith(annotation);
  });
});
