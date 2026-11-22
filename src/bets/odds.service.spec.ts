import { BadRequestException, NotFoundException } from '@nestjs/common';
import { buildMatch, buildPhase } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { PhaseType } from '../phases/entities/phase.entity';
import { BetSelection, MatchOdd } from './entities/match-odd.entity';
import { OddMapper } from './mappers/odd.mapper';
import { OddsService } from './services/odds.service';

const PHASE = buildPhase(PhaseType.GROUP_STAGE);
const MATCH = buildMatch(PHASE);

function buildOdd(overrides: Partial<MatchOdd> = {}): MatchOdd {
  return Object.assign(new MatchOdd(), {
    id: 1,
    match: MATCH,
    selection: BetSelection.HOME,
    odds: 2.1,
    active: true,
    ...overrides,
  });
}

describe('OddsService (cuotas del partido)', () => {
  let oddsRepository: RepositoryMock<MatchOdd>;
  let matchesRepository: RepositoryMock<Match>;
  let service: OddsService;

  beforeEach(() => {
    oddsRepository = createRepositoryMock<MatchOdd>();
    matchesRepository = createRepositoryMock<Match>();
    matchesRepository.findOneBy.mockResolvedValue(MATCH);
    service = new OddsService(asRepository(oddsRepository), asRepository(matchesRepository), new OddMapper());
  });

  it('replaceForMatch crea las tres cuotas activas', async () => {
    const home = buildOdd({ id: 1, selection: BetSelection.HOME });
    const draw = buildOdd({ id: 2, selection: BetSelection.DRAW, odds: 3.2 });
    const away = buildOdd({ id: 3, selection: BetSelection.AWAY, odds: 3.5 });
    oddsRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([away, draw, home]);

    const result = await service.replaceForMatch(MATCH.id, [
      { selection: BetSelection.HOME, odds: 2.1 },
      { selection: BetSelection.DRAW, odds: 3.2 },
      { selection: BetSelection.AWAY, odds: 3.5 },
    ]);

    const saved = oddsRepository.save.mock.calls[0][0] as unknown as MatchOdd[];
    expect(saved).toHaveLength(3);
    expect(saved.every((odd) => odd.active)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('replaceForMatch actualiza una cuota existente y desactiva las no enviadas', async () => {
    const home = buildOdd({ id: 1, selection: BetSelection.HOME, odds: 2 });
    const draw = buildOdd({ id: 2, selection: BetSelection.DRAW, odds: 3.2 });
    oddsRepository.find.mockResolvedValueOnce([home, draw]).mockResolvedValueOnce([home, draw]);

    await service.replaceForMatch(MATCH.id, [{ selection: BetSelection.HOME, odds: 2.5 }]);

    expect(home.odds).toBe(2.5);
    expect(home.active).toBe(true);
    expect(draw.active).toBe(false);
  });

  it('replaceForMatch reactiva una cuota que estaba inactiva', async () => {
    const home = buildOdd({ id: 1, selection: BetSelection.HOME, active: false });
    oddsRepository.find.mockResolvedValueOnce([home]).mockResolvedValueOnce([home]);

    await service.replaceForMatch(MATCH.id, [{ selection: BetSelection.HOME, odds: 2.4 }]);

    expect(home.active).toBe(true);
    expect(home.odds).toBe(2.4);
  });

  it('replaceForMatch de un partido no programado responde solicitud inválida', async () => {
    matchesRepository.findOneBy.mockResolvedValue(buildMatch(PHASE, { status: MatchStatus.FINISHED }));

    await expect(
      service.replaceForMatch(MATCH.id, [{ selection: BetSelection.HOME, odds: 2.1 }]),
    ).rejects.toThrow(BadRequestException);
    expect(oddsRepository.save).not.toHaveBeenCalled();
  });

  it('replaceForMatch de un partido inexistente responde no encontrado', async () => {
    matchesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.replaceForMatch(999, [{ selection: BetSelection.HOME, odds: 2.1 }]),
    ).rejects.toThrow(NotFoundException);
  });
});
