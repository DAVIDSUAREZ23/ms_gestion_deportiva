import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, MoreThan, Repository } from 'typeorm';
import { roundMoney } from '../../common/utils/money.utils';
import { FansService } from '../../fans/fans.service';
import { Match, MatchStatus } from '../../matches/entities/match.entity';
import { PaymentGatewaysService } from '../../payments/services/payment-gateways.service';
import { PaymentMethodsService } from '../../payments/services/payment-methods.service';
import { NO_PAYMENT_GATEWAY_CODE, WALLET_PAYMENT_METHOD_CODE } from '../../wallets/wallets.constants';
import { WalletsService } from '../../wallets/services/wallets.service';
import { MAX_BET_AMOUNT, MIN_BET_AMOUNT } from '../bets.constants';
import { BetResponseDto, UpcomingBetMatchDto } from '../dto/bet-response.dto';
import { CreateBetDto } from '../dto/create-bet.dto';
import { Bet, BetStatus } from '../entities/bet.entity';
import { BetSelection } from '../entities/match-odd.entity';
import { BetMapper } from '../mappers/bet.mapper';
import { OddsService } from './odds.service';

const BET_MATCH_RELATIONS = {
  phase: { tournament: true },
  homeTeam: true,
  awayTeam: true,
  venue: true,
} as const;

const BET_RELATIONS = {
  fan: true,
  paymentMethod: true,
  paymentGateway: true,
  match: BET_MATCH_RELATIONS,
} as const;

const UPCOMING_MATCH_RELATIONS = {
  ...BET_MATCH_RELATIONS,
  odds: true,
} as const;

// Apuestas de los aficionados: una apuesta viva por partido, pagada con el monedero y liquidada con el resultado
@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet) private readonly betsRepository: Repository<Bet>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly fansService: FansService,
    private readonly oddsService: OddsService,
    private readonly walletsService: WalletsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly betMapper: BetMapper,
  ) {}

  // Partidos programados y futuros que tienen al menos una cuota activa
  async findUpcomingMatches(): Promise<UpcomingBetMatchDto[]> {
    const matches = await this.matchesRepository.find({
      where: { status: MatchStatus.SCHEDULED, scheduledAt: MoreThan(new Date()) },
      relations: UPCOMING_MATCH_RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
    return matches
      .filter((match) => (match.odds ?? []).some((odd) => odd.active))
      .map((match) => this.betMapper.toUpcomingMatchDto(match));
  }

  async create(userId: number, dto: CreateBetDto): Promise<BetResponseDto> {
    const fan = await this.fansService.findActiveByUserOrFail(userId);
    const match = await this.findMatchOrFail(dto.matchId);
    this.ensureOpenForBetting(match);
    const odd = await this.oddsService.findActiveOrFail(match.id, dto.selection);
    this.ensureAmount(dto.amount);
    const [paymentMethod, paymentGateway] = await this.findWalletFunding();

    const bet = Object.assign(new Bet(), {
      code: this.generateCode(),
      fan,
      match,
      selection: dto.selection,
      amount: dto.amount,
      odds: odd.odds,
      potentialPayout: roundMoney(dto.amount * odd.odds),
      status: BetStatus.ACTIVE,
      paymentMethod,
      paymentGateway,
      paymentReference: null,
      paidAt: new Date(),
      settledAt: null,
    });

    // El bloqueo del aficionado serializa dos apuestas simultáneas y el del monedero evita gastar dos veces el saldo
    const saved = await this.saveWithFunds(bet, fan.id);
    return this.betMapper.toResponseDto(saved);
  }

  async findMine(userId: number): Promise<BetResponseDto[]> {
    const bets = await this.betsRepository.find({
      where: { fan: { userId } },
      relations: BET_RELATIONS,
      order: { placedAt: 'DESC', id: 'DESC' },
    });
    return bets.map((bet) => this.betMapper.toResponseDto(bet));
  }

  async findOneMine(userId: number, betId: number): Promise<BetResponseDto> {
    const bet = await this.betsRepository.findOne({
      where: { id: betId, fan: { userId } },
      relations: BET_RELATIONS,
    });
    if (!bet) {
      throw new NotFoundException('No tienes una apuesta con ese id');
    }
    return this.betMapper.toResponseDto(bet);
  }

  // Reintento del pago de una apuesta antigua que quedó rechazada; ahora se cobra del monedero
  async retryPayment(userId: number, betId: number): Promise<BetResponseDto> {
    const bet = await this.betsRepository.findOne({
      where: { id: betId, fan: { userId } },
      relations: BET_RELATIONS,
    });
    if (!bet) {
      throw new NotFoundException('No tienes una apuesta con ese id');
    }
    if (bet.status !== BetStatus.PAYMENT_FAILED) {
      throw new BadRequestException('Solo se puede reintentar el pago de una apuesta rechazada');
    }
    this.ensureOpenForBetting(bet.match);
    const [paymentMethod, paymentGateway] = await this.findWalletFunding();
    bet.paymentMethod = paymentMethod;
    bet.paymentGateway = paymentGateway;
    return this.betMapper.toResponseDto(await this.retryWithFunds(bet));
  }

  async findByMatch(matchId: number): Promise<BetResponseDto[]> {
    await this.findMatchOrFail(matchId);
    const bets = await this.betsRepository.find({
      where: { match: { id: matchId } },
      relations: BET_RELATIONS,
      order: { placedAt: 'DESC', id: 'DESC' },
    });
    return bets.map((bet) => this.betMapper.toResponseDto(bet, true));
  }

  // Liquida las apuestas cuando se registra o corrige el resultado del partido
  async settleMatch(matchId: number, homeScore: number, awayScore: number): Promise<void> {
    const bets = await this.betsRepository.find({
      where: {
        match: { id: matchId },
        status: In([BetStatus.ACTIVE, BetStatus.WON, BetStatus.LOST]),
      },
      relations: { fan: true, paymentMethod: true },
    });
    if (bets.length === 0) return;

    const outcome = outcomeOf(homeScore, awayScore);
    const settledAt = new Date();
    await this.dataSource.transaction(async (manager) => {
      for (const bet of bets) {
        const nextStatus = bet.selection === outcome ? BetStatus.WON : BetStatus.LOST;
        if (bet.paymentMethod?.code === WALLET_PAYMENT_METHOD_CODE) {
          await this.syncWalletWithResult(bet, nextStatus, manager);
        }
        bet.status = nextStatus;
        bet.settledAt = settledAt;
      }
      await manager.getRepository(Bet).save(bets);
    });
  }

  // Anula las apuestas vivas cuando el partido se cancela y devuelve el monto al monedero
  async voidMatch(matchId: number): Promise<void> {
    const bets = await this.betsRepository.find({
      where: {
        match: { id: matchId },
        status: In([BetStatus.PENDING_PAYMENT, BetStatus.ACTIVE]),
      },
      relations: { fan: true, paymentMethod: true },
    });
    if (bets.length === 0) return;

    const settledAt = new Date();
    await this.dataSource.transaction(async (manager) => {
      for (const bet of bets) {
        // Solo se devuelve lo que salió del monedero; las apuestas viejas con pasarela no se reembolsan aquí
        if (bet.status === BetStatus.ACTIVE && bet.paymentMethod?.code === WALLET_PAYMENT_METHOD_CODE) {
          await this.walletsService.refundBet(manager, bet.fan.id, bet.amount, bet);
        }
        bet.status = BetStatus.VOID;
        bet.settledAt = settledAt;
      }
      await manager.getRepository(Bet).save(bets);
    });
  }

  // Usado por el partido: no se puede eliminar ni cambiar de equipos si tiene apuestas
  hasBets(matchId: number): Promise<boolean> {
    return this.betsRepository.existsBy({ match: { id: matchId } });
  }

  // Método y pasarela con los que se registra una apuesta pagada con el monedero
  private findWalletFunding() {
    return Promise.all([
      this.paymentMethodsService.findActiveByCodeOrFail(WALLET_PAYMENT_METHOD_CODE),
      this.paymentGatewaysService.findActiveByCodeOrFail(NO_PAYMENT_GATEWAY_CODE),
    ] as const);
  }

  // Debita el saldo y guarda la apuesta en la misma transacción
  private saveWithFunds(bet: Bet, fanId: number): Promise<Bet> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM fans WHERE id = ? FOR UPDATE', [fanId]);
      await this.ensureNoLiveBet(manager, fanId, bet.match.id);
      const saved = await manager.getRepository(Bet).save(bet);
      await this.walletsService.debitForBet(manager, fanId, saved.amount, saved);
      return saved;
    });
  }

  // Reintento de pago: vuelve a dejar la apuesta activa cobrando del monedero
  private retryWithFunds(bet: Bet): Promise<Bet> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM fans WHERE id = ? FOR UPDATE', [bet.fan.id]);
      await this.ensureNoLiveBet(manager, bet.fan.id, bet.match.id);
      await this.walletsService.debitForBet(manager, bet.fan.id, bet.amount, bet);
      bet.status = BetStatus.ACTIVE;
      bet.paidAt = new Date();
      bet.paymentReference = null;
      return manager.getRepository(Bet).save(bet);
    });
  }

  private async ensureNoLiveBet(manager: EntityManager, fanId: number, matchId: number): Promise<void> {
    const blocking = await manager.getRepository(Bet).existsBy({
      fan: { id: fanId },
      match: { id: matchId },
      status: In([BetStatus.PENDING_PAYMENT, BetStatus.ACTIVE]),
    });
    if (blocking) {
      throw new ConflictException('Ya tienes una apuesta pendiente o activa para este partido');
    }
  }

  // Ajusta el saldo según la transición de la apuesta: paga al ganar y revierte si una ganancia se convierte en derrota
  private async syncWalletWithResult(
    bet: Bet,
    nextStatus: BetStatus,
    manager: EntityManager,
  ): Promise<void> {
    if (nextStatus === BetStatus.WON && bet.status !== BetStatus.WON) {
      await this.walletsService.creditBetWin(manager, bet.fan.id, bet.potentialPayout, bet);
    } else if (nextStatus === BetStatus.LOST && bet.status === BetStatus.WON) {
      await this.walletsService.reverseBetWin(manager, bet.fan.id, bet.potentialPayout, bet);
    }
  }

  private async findMatchOrFail(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({ where: { id }, relations: BET_MATCH_RELATIONS });
    if (!match) {
      throw new NotFoundException(`Partido con id ${id} no encontrado`);
    }
    return match;
  }

  private ensureOpenForBetting(match: Match): void {
    if (match.status !== MatchStatus.SCHEDULED || new Date(match.scheduledAt) <= new Date()) {
      throw new BadRequestException('Las apuestas para este partido están cerradas: ya empezó, terminó o fue cancelado');
    }
  }

  private ensureAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < MIN_BET_AMOUNT || amount > MAX_BET_AMOUNT) {
      throw new BadRequestException(
        `El monto de la apuesta debe estar entre ${MIN_BET_AMOUNT} y ${MAX_BET_AMOUNT} COP`,
      );
    }
  }

  // Código corto y difícil de adivinar, p. ej. AP-9F3A61C2
  private generateCode(): string {
    return `AP-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

function outcomeOf(homeScore: number, awayScore: number): BetSelection {
  if (homeScore > awayScore) return BetSelection.HOME;
  if (awayScore > homeScore) return BetSelection.AWAY;
  return BetSelection.DRAW;
}
