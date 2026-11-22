import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { buildMatch, buildPhase } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Fan } from '../fans/entities/fan.entity';
import { FansService } from '../fans/fans.service';
import { FanMapper } from '../fans/mappers/fan.mapper';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { PaymentGateway } from '../payments/entities/payment-gateway.entity';
import { PaymentMethod } from '../payments/entities/payment-method.entity';
import { PaymentGatewayMapper } from '../payments/mappers/payment-gateway.mapper';
import { PaymentMethodMapper } from '../payments/mappers/payment-method.mapper';
import { PaymentGatewaysService } from '../payments/services/payment-gateways.service';
import { PaymentMethodsService } from '../payments/services/payment-methods.service';
import { PhaseType } from '../phases/entities/phase.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { VenueMapper } from '../venues/mappers/venue.mapper';
import { Bet, BetStatus } from './entities/bet.entity';
import { BetSelection, MatchOdd } from './entities/match-odd.entity';
import { PaymentGatewayPort } from './gateways/payment-gateway.port';
import { BetMapper } from './mappers/bet.mapper';
import { OddMapper } from './mappers/odd.mapper';
import { BetsService } from './services/bets.service';
import { OddsService } from './services/odds.service';

const PHASE = buildPhase(PhaseType.GROUP_STAGE);
const MATCH = buildMatch(PHASE, { scheduledAt: new Date('2999-02-10T15:00:00') });
const FAN = Object.assign(new Fan(), { id: 4, userId: 7, displayName: 'Ana', email: 'ana@correo.com', active: true });
const ODD = Object.assign(new MatchOdd(), { id: 1, match: MATCH, selection: BetSelection.HOME, odds: 2.5, active: true });
const PAYMENT_METHOD = Object.assign(new PaymentMethod(), { id: 1, code: 'CARD', name: 'Tarjeta', active: true });
const PAYMENT_GATEWAY = Object.assign(new PaymentGateway(), { id: 1, code: 'WOMPI', name: 'Wompi', active: true, sandbox: true });

function buildBet(overrides: Partial<Bet> = {}): Bet {
  return Object.assign(new Bet(), {
    id: 1,
    code: 'AP-1',
    fan: FAN,
    match: MATCH,
    selection: BetSelection.HOME,
    amount: 10000,
    odds: 2.5,
    potentialPayout: 25000,
    status: BetStatus.ACTIVE,
    paymentMethod: PAYMENT_METHOD,
    paymentGateway: PAYMENT_GATEWAY,
    paymentReference: 'SIM-1',
    placedAt: new Date('2999-02-01T15:00:00'),
    paidAt: new Date('2999-02-01T15:00:00'),
    settledAt: null,
    ...overrides,
  });
}

describe('BetsService (Apuestas)', () => {
  let betsRepository: RepositoryMock<Bet>;
  let matchesRepository: RepositoryMock<Match>;
  let fansService: { findActiveByUserOrFail: jest.Mock };
  let oddsService: { findActiveOrFail: jest.Mock };
  let paymentMethodsService: { findActiveOrFail: jest.Mock };
  let paymentGatewaysService: { findActiveOrFail: jest.Mock };
  let paymentGateway: PaymentGatewayPort;
  let service: BetsService;

  beforeEach(() => {
    betsRepository = createRepositoryMock<Bet>();
    matchesRepository = createRepositoryMock<Match>();
    matchesRepository.findOne.mockResolvedValue(MATCH);

    fansService = { findActiveByUserOrFail: jest.fn().mockResolvedValue(FAN) };
    oddsService = { findActiveOrFail: jest.fn().mockResolvedValue(ODD) };
    paymentMethodsService = { findActiveOrFail: jest.fn().mockResolvedValue(PAYMENT_METHOD) };
    paymentGatewaysService = { findActiveOrFail: jest.fn().mockResolvedValue(PAYMENT_GATEWAY) };
    paymentGateway = { charge: jest.fn().mockResolvedValue({ approved: true, reference: 'SIM-1' }) };

    const manager = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn(() => betsRepository),
    };
    const dataSource = { transaction: jest.fn((callback) => callback(manager)) } as unknown as DataSource;

    const teamMapper = new TeamMapper();
    service = new BetsService(
      asRepository(betsRepository),
      asRepository(matchesRepository),
      dataSource,
      fansService as unknown as FansService,
      oddsService as unknown as OddsService,
      paymentMethodsService as unknown as PaymentMethodsService,
      paymentGatewaysService as unknown as PaymentGatewaysService,
      paymentGateway,
      new BetMapper(
        teamMapper,
        new VenueMapper(),
        new PaymentMethodMapper(),
        new PaymentGatewayMapper(),
        new FanMapper(teamMapper),
        new OddMapper(),
      ),
    );
  });

  const createDto = {
    matchId: MATCH.id,
    selection: BetSelection.HOME,
    amount: 10000,
    paymentMethodId: PAYMENT_METHOD.id,
    paymentGatewayId: PAYMENT_GATEWAY.id,
  };

  it('create cobra con la pasarela y deja la apuesta activa con la cuota congelada', async () => {
    const bet = await service.create(7, createDto);

    expect(bet.code).toMatch(/^AP-[0-9A-F]{8}$/);
    expect(bet.odds).toBe(2.5);
    expect(bet.potentialPayout).toBe(25000);
    expect(bet.status).toBe(BetStatus.ACTIVE);
    expect(paymentGateway.charge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000, paymentMethodCode: 'CARD', gatewayCode: 'WOMPI' }),
    );
  });

  it('create con una apuesta pendiente o activa en el partido responde conflicto', async () => {
    betsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create(7, createDto)).rejects.toThrow(ConflictException);
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });

  it('create sin cuota activa para la selección responde solicitud inválida', async () => {
    oddsService.findActiveOrFail.mockRejectedValue(new BadRequestException('sin cuota'));

    await expect(service.create(7, createDto)).rejects.toThrow(BadRequestException);
  });

  it('create con el partido finalizado responde solicitud inválida', async () => {
    matchesRepository.findOne.mockResolvedValue(buildMatch(PHASE, { status: MatchStatus.FINISHED }));

    await expect(service.create(7, createDto)).rejects.toThrow(BadRequestException);
  });

  it('create con un monto fuera de los topes responde solicitud inválida', async () => {
    await expect(service.create(7, { ...createDto, amount: 500 })).rejects.toThrow(BadRequestException);
  });

  it('create con el pago rechazado deja la apuesta como PAYMENT_FAILED', async () => {
    (paymentGateway.charge as jest.Mock).mockResolvedValue({ approved: false, reference: 'SIM-2' });

    const bet = await service.create(7, createDto);

    expect(bet.status).toBe(BetStatus.PAYMENT_FAILED);
  });

  it('findUpcomingMatches devuelve solo las cuotas activas del partido', async () => {
    const active = Object.assign(new MatchOdd(), {
      id: 1,
      selection: BetSelection.HOME,
      odds: 2.5,
      active: true,
    });
    const inactive = Object.assign(new MatchOdd(), {
      id: 2,
      selection: BetSelection.DRAW,
      odds: 3,
      active: false,
    });
    matchesRepository.find.mockResolvedValue([buildMatch(PHASE, { odds: [active, inactive] })]);

    const result = await service.findUpcomingMatches();

    expect(result).toHaveLength(1);
    expect(result[0].odds).toHaveLength(1);
    expect(result[0].odds[0].matchId).toBe(50);
  });

  it('settleMatch marca WON al acertar y LOST al fallar', async () => {
    const winner = buildBet({ id: 1, selection: BetSelection.HOME });
    const loser = buildBet({ id: 2, selection: BetSelection.AWAY });
    betsRepository.find.mockResolvedValue([winner, loser]);

    await service.settleMatch(MATCH.id, 2, 1);

    expect(winner.status).toBe(BetStatus.WON);
    expect(loser.status).toBe(BetStatus.LOST);
    expect(winner.settledAt).not.toBeNull();
    expect(betsRepository.save).toHaveBeenCalledWith([winner, loser]);
  });

  it('voidMatch anula las apuestas vivas del partido cancelado', async () => {
    const pending = buildBet({ id: 1, status: BetStatus.PENDING_PAYMENT });
    betsRepository.find.mockResolvedValue([pending]);

    await service.voidMatch(MATCH.id);

    expect(pending.status).toBe(BetStatus.VOID);
    expect(pending.settledAt).not.toBeNull();
  });

  it('retryPayment solo se permite sobre una apuesta rechazada', async () => {
    betsRepository.findOne.mockResolvedValue(buildBet({ status: BetStatus.ACTIVE }));

    await expect(service.retryPayment(7, 1)).rejects.toThrow(BadRequestException);
  });

  it('retryPayment vuelve a cobrar una apuesta rechazada', async () => {
    betsRepository.findOne.mockResolvedValue(buildBet({ status: BetStatus.PAYMENT_FAILED }));

    const bet = await service.retryPayment(7, 1);

    expect(paymentGateway.charge).toHaveBeenCalled();
    expect(bet.status).toBe(BetStatus.ACTIVE);
  });

  it('retryPayment con otra apuesta viva en el partido responde conflicto', async () => {
    betsRepository.findOne.mockResolvedValue(buildBet({ status: BetStatus.PAYMENT_FAILED }));
    betsRepository.existsBy.mockResolvedValue(true);

    await expect(service.retryPayment(7, 1)).rejects.toThrow(ConflictException);
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });
});
