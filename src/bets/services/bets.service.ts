import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { FansService } from '../../fans/fans.service';
import { Match, MatchStatus } from '../../matches/entities/match.entity';
import { PaymentGatewaysService } from '../../payments/services/payment-gateways.service';
import { PaymentMethodsService } from '../../payments/services/payment-methods.service';
import { MAX_BET_AMOUNT, MIN_BET_AMOUNT } from '../bets.constants';
import { BetResponseDto, UpcomingBetMatchDto } from '../dto/bet-response.dto';
import { CreateBetDto } from '../dto/create-bet.dto';
import { Bet, BetStatus } from '../entities/bet.entity';
import { BetSelection } from '../entities/match-odd.entity';
import { PAYMENT_GATEWAY } from '../gateways/payment-gateway.port';
import type { PaymentGatewayPort } from '../gateways/payment-gateway.port';
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

// Apuestas de los aficionados: una apuesta viva por partido, pago simulado y liquidación con el resultado
@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    @InjectRepository(Bet) private readonly betsRepository: Repository<Bet>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly fansService: FansService,
    private readonly oddsService: OddsService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
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
    const paymentMethod = await this.paymentMethodsService.findActiveOrFail(dto.paymentMethodId);
    const paymentGateway = await this.paymentGatewaysService.findActiveOrFail(dto.paymentGatewayId);

    const bet = Object.assign(new Bet(), {
      code: this.generateCode(),
      fan,
      match,
      selection: dto.selection,
      amount: dto.amount,
      odds: odd.odds,
      potentialPayout: roundMoney(dto.amount * odd.odds),
      status: BetStatus.PENDING_PAYMENT,
      paymentMethod,
      paymentGateway,
      paymentReference: null,
      paidAt: null,
      settledAt: null,
    });

    // El bloqueo sobre el aficionado serializa dos apuestas simultáneas al mismo partido
    const saved = await this.saveWithFanLock(bet, fan.id);
    return this.charge(saved);
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

  // Reintento del pago de una apuesta rechazada; no crea una apuesta nueva
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
    // Antes de cobrar se marca pendiente con el bloqueo del aficionado: si mientras tanto creó otra
    // apuesta viva para el partido, el reintento se rechaza.
    await this.markPendingWithFanLock(bet);
    return this.charge(bet);
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
    });
    if (bets.length === 0) return;

    const outcome = outcomeOf(homeScore, awayScore);
    const settledAt = new Date();
    for (const bet of bets) {
      bet.status = bet.selection === outcome ? BetStatus.WON : BetStatus.LOST;
      bet.settledAt = settledAt;
    }
    await this.betsRepository.save(bets);
  }

  // Anula las apuestas vivas cuando el partido se cancela
  async voidMatch(matchId: number): Promise<void> {
    const bets = await this.betsRepository.find({
      where: {
        match: { id: matchId },
        status: In([BetStatus.PENDING_PAYMENT, BetStatus.ACTIVE]),
      },
    });
    if (bets.length === 0) return;

    const settledAt = new Date();
    for (const bet of bets) {
      bet.status = BetStatus.VOID;
      bet.settledAt = settledAt;
    }
    await this.betsRepository.save(bets);
  }

  // Usado por el partido: no se puede eliminar ni cambiar de equipos si tiene apuestas
  hasBets(matchId: number): Promise<boolean> {
    return this.betsRepository.existsBy({ match: { id: matchId } });
  }

  private saveWithFanLock(bet: Bet, fanId: number): Promise<Bet> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM fans WHERE id = ? FOR UPDATE', [fanId]);
      const blocking = await manager.getRepository(Bet).existsBy({
        fan: { id: fanId },
        match: { id: bet.match.id },
        status: In([BetStatus.PENDING_PAYMENT, BetStatus.ACTIVE]),
      });
      if (blocking) {
        throw new ConflictException('Ya tienes una apuesta pendiente o activa para este partido');
      }
      return manager.getRepository(Bet).save(bet);
    });
  }

  // Reintento de pago: vuelve a dejar la apuesta pendiente y valida que no haya otra apuesta viva
  private async markPendingWithFanLock(bet: Bet): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM fans WHERE id = ? FOR UPDATE', [bet.fan.id]);
      const blocking = await manager.getRepository(Bet).existsBy({
        fan: { id: bet.fan.id },
        match: { id: bet.match.id },
        status: In([BetStatus.PENDING_PAYMENT, BetStatus.ACTIVE]),
      });
      if (blocking) {
        throw new ConflictException('Ya tienes una apuesta pendiente o activa para este partido');
      }
      bet.status = BetStatus.PENDING_PAYMENT;
      await manager.getRepository(Bet).save(bet);
    });
  }

  // Cobra con la pasarela y deja la apuesta activa o rechazada
  private async charge(bet: Bet): Promise<BetResponseDto> {
    try {
      const result = await this.paymentGateway.charge({
        betCode: bet.code,
        amount: bet.amount,
        paymentMethodCode: bet.paymentMethod.code,
        gatewayCode: bet.paymentGateway.code,
      });
      bet.paymentReference = result.reference;
      if (result.approved) {
        bet.status = BetStatus.ACTIVE;
        bet.paidAt = new Date();
      } else {
        bet.status = BetStatus.PAYMENT_FAILED;
        bet.paidAt = null;
      }
    } catch (error) {
      // Un fallo de la pasarela no rompe la apuesta: queda rechazada y se puede reintentar
      this.logger.error(`No se pudo cobrar la apuesta ${bet.code}: ${(error as Error).message}`);
      bet.status = BetStatus.PAYMENT_FAILED;
      bet.paidAt = null;
    }
    return this.betMapper.toResponseDto(await this.betsRepository.save(bet));
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

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function outcomeOf(homeScore: number, awayScore: number): BetSelection {
  if (homeScore > awayScore) return BetSelection.HOME;
  if (awayScore > homeScore) return BetSelection.AWAY;
  return BetSelection.DRAW;
}
