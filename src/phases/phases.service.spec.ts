import { BadRequestException, ConflictException } from '@nestjs/common';
import { buildPhase, buildTournament } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Match } from '../matches/entities/match.entity';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { TournamentsService } from '../tournaments/tournaments.service';
import { Final, FinalRound } from './entities/final.entity';
import { Phase, PhaseType } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesService } from './phases.service';

describe('PhasesService (HU-GC-03 y HU-GC-05 con entidad Final)', () => {
  let phasesRepository: RepositoryMock<Phase>;
  let finalsRepository: RepositoryMock<Final>;
  let groupsRepository: RepositoryMock<CompetitionGroup>;
  let service: PhasesService;

  beforeEach(() => {
    phasesRepository = createRepositoryMock<Phase>();
    finalsRepository = createRepositoryMock<Final>();
    groupsRepository = createRepositoryMock<CompetitionGroup>();
    const tournamentsService = { findActiveOrFail: jest.fn().mockResolvedValue(buildTournament()) };
    service = new PhasesService(
      asRepository(phasesRepository),
      asRepository(finalsRepository),
      asRepository(groupsRepository),
      asRepository(createRepositoryMock<Match>()),
      tournamentsService as unknown as TournamentsService,
      new PhaseMapper(new TournamentMapper(new SportMapper())),
    );
  });

  it('create de una fase final guarda su entidad Final con la ronda', async () => {
    phasesRepository.findOne.mockResolvedValue(buildPhase(PhaseType.KNOCKOUT));

    await service.create({ tournamentId: 5, name: 'Semifinal', type: PhaseType.KNOCKOUT, order: 2, round: FinalRound.SEMI_FINAL });

    const saved = phasesRepository.save.mock.calls[0][0] as Phase;
    expect(saved.final?.round).toBe(FinalRound.SEMI_FINAL);
  });

  it('create de una fase final sin ronda responde solicitud inválida', async () => {
    await expect(service.create({ tournamentId: 5, name: 'Final', type: PhaseType.KNOCKOUT, order: 2 })).rejects.toThrow(BadRequestException);
    expect(phasesRepository.save).not.toHaveBeenCalled();
  });

  it('create de una fase de grupos con ronda responde solicitud inválida', async () => {
    await expect(
      service.create({ tournamentId: 5, name: 'Grupos', type: PhaseType.GROUP_STAGE, order: 1, round: FinalRound.FINAL }),
    ).rejects.toThrow(BadRequestException);
  });

  it('create con orden repetido responde conflicto', async () => {
    phasesRepository.existsBy.mockResolvedValue(true);

    await expect(service.create({ tournamentId: 5, name: 'Grupos', type: PhaseType.GROUP_STAGE, order: 1 })).rejects.toThrow(ConflictException);
  });

  it('update que convierte una fase final en fase de grupos elimina su entidad Final', async () => {
    const final = Object.assign(new Final(), { id: 9, round: FinalRound.FINAL });
    phasesRepository.findOne.mockResolvedValue(buildPhase(PhaseType.KNOCKOUT, { final }));

    await service.update(20, { type: PhaseType.GROUP_STAGE });

    expect(finalsRepository.remove).toHaveBeenCalledWith(final);
  });

  it('update del tipo de una fase con grupos responde conflicto', async () => {
    phasesRepository.findOne.mockResolvedValue(buildPhase(PhaseType.GROUP_STAGE, { final: null }));
    groupsRepository.existsBy.mockResolvedValue(true);

    await expect(service.update(20, { type: PhaseType.KNOCKOUT, round: FinalRound.FINAL })).rejects.toThrow(ConflictException);
  });
});
