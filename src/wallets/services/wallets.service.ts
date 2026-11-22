import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { roundMoney } from '../../common/utils/money.utils';
import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { Fan } from '../../fans/entities/fan.entity';
import { PaymentGateway } from '../../payments/entities/payment-gateway.entity';
import { PaymentMethod } from '../../payments/entities/payment-method.entity';
import { PAYMENT_GATEWAY } from '../../payments/gateways/payment-gateway.port';
import type { PaymentGatewayPort } from '../../payments/gateways/payment-gateway.port';
import { PaymentGatewaysService } from '../../payments/services/payment-gateways.service';
import { PaymentMethodsService } from '../../payments/services/payment-methods.service';
import { AdjustWalletDto } from '../dto/adjust-wallet.dto';
import { FindWalletMovementsQueryDto } from '../dto/find-wallet-movements-query.dto';
import { RechargeWalletDto } from '../dto/recharge-wallet.dto';
import {
  WalletDetailResponseDto,
  WalletMovementResponseDto,
  WalletResponseDto,
} from '../dto/wallet-response.dto';
import { WalletMovement, WalletMovementType } from '../entities/wallet-movement.entity';
import { Wallet } from '../entities/wallet.entity';
import { WalletMapper } from '../mappers/wallet.mapper';
import { WALLET_MOVEMENTS_LIMIT, WALLET_MOVEMENTS_PAGE_DEFAULT } from '../wallets.constants';

// Tipos de movimiento que puede aplicar el monedero
type MovementInput = {
  type: WalletMovementType;
  // Positivo si entra dinero, negativo si sale
  delta: number;
  bet?: Bet | null;
  paymentMethod?: PaymentMethod | null;
  paymentGateway?: PaymentGateway | null;
  reference?: string | null;
  reason?: string | null;
  // Solo los reversos pueden dejar el saldo en negativo
  allowNegative?: boolean;
};

// Monedero del aficionado: recargas, ajustes y movimientos que genera el ciclo de las apuestas
@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletMovement) private readonly movementsRepository: Repository<WalletMovement>,
    @InjectRepository(Fan) private readonly fansRepository: Repository<Fan>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
    private readonly walletMapper: WalletMapper,
  ) {}

  // El aficionado crea su monedero una sola vez; queda asociado a su perfil
  async createForUser(userId: number): Promise<WalletResponseDto> {
    const fan = await this.fansRepository.findOneBy({ userId });
    if (!fan) {
      throw new NotFoundException('Aún no tienes perfil de aficionado');
    }
    return this.createForFan(fan.id);
  }

  // Usado también al crear el perfil del aficionado
  async createForFan(fanId: number): Promise<WalletResponseDto> {
    const fan = await this.fansRepository.findOneBy({ id: fanId });
    if (!fan) {
      throw new NotFoundException(`Aficionado con id ${fanId} no encontrado`);
    }
    if (await this.walletsRepository.existsBy({ fan: { id: fanId } })) {
      throw new ConflictException('El aficionado ya tiene un monedero');
    }
    const saved = await this.walletsRepository.save(Object.assign(new Wallet(), { fan, balance: 0, active: true }));
    return this.walletMapper.toResponseDto(saved);
  }

  async getMine(userId: number): Promise<WalletDetailResponseDto> {
    const wallet = await this.findByUserOrFail(userId);
    const movements = await this.findMovementsOfWallet(wallet.id, WALLET_MOVEMENTS_LIMIT);
    return this.walletMapper.toDetailResponseDto(wallet, movements);
  }

  async findMyMovements(userId: number, query: FindWalletMovementsQueryDto): Promise<WalletMovementResponseDto[]> {
    const wallet = await this.findByUserOrFail(userId);
    const movements = await this.movementsRepository.find({
      where: {
        wallet: { id: wallet.id },
        ...(query.type !== undefined && { type: query.type }),
      },
      relations: { bet: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: query.offset ?? 0,
      take: query.limit ?? WALLET_MOVEMENTS_PAGE_DEFAULT,
    });
    return movements.map((movement) => this.walletMapper.toMovementDto(movement, wallet.id));
  }

  async getByFan(fanId: number): Promise<WalletDetailResponseDto> {
    const wallet = await this.walletsRepository.findOne({
      where: { fan: { id: fanId } },
      relations: { fan: true },
    });
    if (!wallet) {
      throw new NotFoundException(`El aficionado con id ${fanId} no tiene monedero`);
    }
    const movements = await this.findMovementsOfWallet(wallet.id, WALLET_MOVEMENTS_LIMIT);
    return this.walletMapper.toDetailResponseDto(wallet, movements);
  }

  // Recarga: primero se cobra con la pasarela y solo si se aprueba se acredita el saldo
  async recharge(userId: number, dto: RechargeWalletDto): Promise<WalletResponseDto> {
    const wallet = await this.findByUserOrFail(userId);
    this.ensureActive(wallet);
    const [paymentMethod, paymentGateway] = await Promise.all([
      this.paymentMethodsService.findActiveOrFail(dto.paymentMethodId),
      this.paymentGatewaysService.findActiveOrFail(dto.paymentGatewayId),
    ]);

    const result = await this.paymentGateway.charge({
      reference: this.generateRechargeReference(),
      amount: dto.amount,
      paymentMethodCode: paymentMethod.code,
      gatewayCode: paymentGateway.code,
    });
    if (!result.approved) {
      throw new BadRequestException('El pago fue rechazado; no se cargó saldo al monedero');
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockByIdOrFail(manager, wallet.id);
      this.ensureActive(locked);
      return this.applyMovement(manager, locked, {
        type: WalletMovementType.RECHARGE,
        delta: dto.amount,
        paymentMethod,
        paymentGateway,
        reference: result.reference,
      });
    });
    return this.walletMapper.toResponseDto(updated);
  }

  // Ajuste manual del administrador, siempre con un motivo auditado
  async adjust(id: number, dto: AdjustWalletDto): Promise<WalletResponseDto> {
    const updated = await this.dataSource.transaction(async (manager) => {
      const wallet = await this.lockByIdOrFail(manager, id);
      this.ensureActive(wallet);
      return this.applyMovement(manager, wallet, {
        type: WalletMovementType.ADJUSTMENT,
        delta: dto.amount,
        reason: dto.reason,
      });
    });
    return this.walletMapper.toResponseDto(updated);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<WalletResponseDto> {
    const wallet = await this.findByIdOrFail(id);
    wallet.active = dto.active;
    const saved = await this.walletsRepository.save(wallet);
    return this.walletMapper.toResponseDto(saved);
  }

  // Un monedero con saldo o con movimientos no se borra: se desactiva para conservar el historial
  async remove(id: number): Promise<{ message: string }> {
    const wallet = await this.findByIdOrFail(id);
    if (wallet.balance !== 0) {
      throw new ConflictException('No se puede eliminar un monedero con saldo. Puedes desactivarlo.');
    }
    if (await this.movementsRepository.existsBy({ wallet: { id } })) {
      throw new ConflictException('No se puede eliminar un monedero con movimientos. Puedes desactivarlo.');
    }
    await this.walletsRepository.remove(wallet);
    return { message: 'Monedero eliminado correctamente' };
  }

  // Bloquea el monedero del aficionado dentro de una transacción abierta
  async lockOrFail(manager: EntityManager, fanId: number): Promise<Wallet> {
    const locked = await manager.query('SELECT id FROM wallets WHERE fan_id = ? FOR UPDATE', [fanId]);
    if (!locked?.length) {
      throw new NotFoundException('El aficionado no tiene monedero');
    }
    const wallet = await manager.getRepository(Wallet).findOne({
      where: { fan: { id: fanId } },
      relations: { fan: true },
    });
    if (!wallet) {
      throw new NotFoundException('El aficionado no tiene monedero');
    }
    return wallet;
  }

  // Debita el monto de una apuesta; falla si el saldo no alcanza
  async debitForBet(manager: EntityManager, fanId: number, amount: number, bet: Bet): Promise<Wallet> {
    const wallet = await this.lockOrFail(manager, fanId);
    this.ensureActive(wallet);
    if (wallet.balance < amount) {
      throw new BadRequestException(
        `Saldo insuficiente: tu monedero tiene ${wallet.balance} COP y la apuesta es de ${amount} COP`,
      );
    }
    return this.applyMovement(manager, wallet, {
      type: WalletMovementType.BET_DEBIT,
      delta: -amount,
      bet,
    });
  }

  // Acredita la ganancia de una apuesta acertada
  async creditBetWin(manager: EntityManager, fanId: number, amount: number, bet: Bet): Promise<Wallet> {
    const wallet = await this.lockOrFail(manager, fanId);
    return this.applyMovement(manager, wallet, {
      type: WalletMovementType.BET_WIN,
      delta: amount,
      bet,
    });
  }

  // Revierte una ganancia ya acreditada cuando se corrige el resultado
  async reverseBetWin(manager: EntityManager, fanId: number, amount: number, bet: Bet): Promise<Wallet> {
    const wallet = await this.lockOrFail(manager, fanId);
    return this.applyMovement(manager, wallet, {
      type: WalletMovementType.BET_WIN_REVERSAL,
      delta: -amount,
      bet,
      allowNegative: true,
    });
  }

  // Devuelve el monto apostado cuando el partido se anula
  async refundBet(manager: EntityManager, fanId: number, amount: number, bet: Bet): Promise<Wallet> {
    const wallet = await this.lockOrFail(manager, fanId);
    return this.applyMovement(manager, wallet, {
      type: WalletMovementType.BET_REFUND,
      delta: amount,
      bet,
    });
  }

  // Aplica el movimiento sobre un monedero ya bloqueado y guarda el historial
  private async applyMovement(manager: EntityManager, wallet: Wallet, input: MovementInput): Promise<Wallet> {
    const delta = roundMoney(input.delta);
    const balanceAfter = roundMoney(wallet.balance + delta);
    if (!input.allowNegative && balanceAfter < 0) {
      throw new BadRequestException('Saldo insuficiente en el monedero');
    }

    wallet.balance = balanceAfter;
    const saved = await manager.getRepository(Wallet).save(wallet);
    const movement = Object.assign(new WalletMovement(), {
      wallet: saved,
      type: input.type,
      amount: delta,
      balanceAfter,
      bet: input.bet ?? null,
      paymentMethod: input.paymentMethod ?? null,
      paymentGateway: input.paymentGateway ?? null,
      reference: input.reference ?? null,
      reason: input.reason ?? null,
    });
    await manager.getRepository(WalletMovement).save(movement);
    return saved;
  }

  private async findMovementsOfWallet(walletId: number, limit: number): Promise<WalletMovement[]> {
    return this.movementsRepository.find({
      where: { wallet: { id: walletId } },
      relations: { bet: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });
  }

  private async findByUserOrFail(userId: number): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: { fan: { userId } },
      relations: { fan: true },
    });
    if (!wallet) {
      throw new NotFoundException('Aún no tienes monedero');
    }
    return wallet;
  }

  private async findByIdOrFail(id: number): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({ where: { id }, relations: { fan: true } });
    if (!wallet) {
      throw new NotFoundException(`Monedero con id ${id} no encontrado`);
    }
    return wallet;
  }

  private async lockByIdOrFail(manager: EntityManager, id: number): Promise<Wallet> {
    const locked = await manager.query('SELECT id FROM wallets WHERE id = ? FOR UPDATE', [id]);
    if (!locked?.length) {
      throw new NotFoundException(`Monedero con id ${id} no encontrado`);
    }
    const wallet = await manager.getRepository(Wallet).findOne({ where: { id }, relations: { fan: true } });
    if (!wallet) {
      throw new NotFoundException(`Monedero con id ${id} no encontrado`);
    }
    return wallet;
  }

  private ensureActive(wallet: Wallet): void {
    if (!wallet.active) {
      throw new BadRequestException('El monedero está inactivo');
    }
  }

  // Referencia del intento de recarga antes de llamar a la pasarela
  private generateRechargeReference(): string {
    return `RC-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
