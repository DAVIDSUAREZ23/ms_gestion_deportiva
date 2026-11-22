import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Bet, BetStatus } from '../bets/entities/bet.entity';
import { BetSelection } from '../bets/entities/match-odd.entity';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Fan } from '../fans/entities/fan.entity';
import { PaymentGateway } from '../payments/entities/payment-gateway.entity';
import { PaymentMethod } from '../payments/entities/payment-method.entity';
import { PaymentGatewayPort } from '../payments/gateways/payment-gateway.port';
import { PaymentGatewaysService } from '../payments/services/payment-gateways.service';
import { PaymentMethodsService } from '../payments/services/payment-methods.service';
import { WalletMovement, WalletMovementType } from './entities/wallet-movement.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletMapper } from './mappers/wallet.mapper';
import { WalletsService } from './services/wallets.service';

const FAN = Object.assign(new Fan(), { id: 4, userId: 7, displayName: 'Ana', email: 'ana@correo.com', active: true });
const METHOD = Object.assign(new PaymentMethod(), { id: 1, code: 'CARD', name: 'Tarjeta', active: true });
const GATEWAY = Object.assign(new PaymentGateway(), { id: 1, code: 'WOMPI', name: 'Wompi', active: true, sandbox: true });
const BET = Object.assign(new Bet(), {
  id: 9,
  code: 'AP-1',
  fan: FAN,
  selection: BetSelection.HOME,
  amount: 4000,
  odds: 2,
  potentialPayout: 8000,
  status: BetStatus.ACTIVE,
});

function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return Object.assign(new Wallet(), {
    id: 1,
    fan: FAN,
    balance: 10000,
    active: true,
    createdAt: new Date('2026-11-01T10:00:00'),
    updatedAt: new Date('2026-11-01T10:00:00'),
    ...overrides,
  });
}

function buildMovement(overrides: Partial<WalletMovement> = {}): WalletMovement {
  return Object.assign(new WalletMovement(), {
    id: 1,
    wallet: buildWallet(),
    type: WalletMovementType.RECHARGE,
    amount: 10000,
    balanceAfter: 20000,
    bet: null,
    paymentMethod: null,
    paymentGateway: null,
    reference: 'SIM-1',
    reason: null,
    createdAt: new Date('2026-11-01T10:00:00'),
    ...overrides,
  });
}

describe('WalletsService (Monedero)', () => {
  let walletsRepository: RepositoryMock<Wallet>;
  let movementsRepository: RepositoryMock<WalletMovement>;
  let fansRepository: RepositoryMock<Fan>;
  let paymentMethodsService: { findActiveOrFail: jest.Mock };
  let paymentGatewaysService: { findActiveOrFail: jest.Mock };
  let paymentGateway: PaymentGatewayPort;
  let manager: { query: jest.Mock; getRepository: jest.Mock };
  let service: WalletsService;

  beforeEach(() => {
    walletsRepository = createRepositoryMock<Wallet>();
    movementsRepository = createRepositoryMock<WalletMovement>();
    fansRepository = createRepositoryMock<Fan>();
    walletsRepository.findOne.mockResolvedValue(buildWallet());
    fansRepository.findOneBy.mockResolvedValue(FAN);

    paymentMethodsService = { findActiveOrFail: jest.fn().mockResolvedValue(METHOD) };
    paymentGatewaysService = { findActiveOrFail: jest.fn().mockResolvedValue(GATEWAY) };
    paymentGateway = { charge: jest.fn().mockResolvedValue({ approved: true, reference: 'SIM-1-RC-1' }) };

    const localManager = {
      query: jest.fn().mockResolvedValue([{ id: 1 }]),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Wallet) return walletsRepository;
        return movementsRepository;
      }),
    };
    manager = localManager;
    const dataSource = { transaction: jest.fn((callback) => callback(localManager)) } as unknown as DataSource;

    service = new WalletsService(
      asRepository(walletsRepository),
      asRepository(movementsRepository),
      asRepository(fansRepository),
      dataSource,
      paymentMethodsService as unknown as PaymentMethodsService,
      paymentGatewaysService as unknown as PaymentGatewaysService,
      paymentGateway,
      new WalletMapper(),
    );
  });

  it('createForUser crea un monedero en cero para el aficionado', async () => {
    const wallet = await service.createForUser(7);

    const saved = walletsRepository.save.mock.calls[0][0] as Wallet;
    expect(saved.fan.id).toBe(FAN.id);
    expect(saved.balance).toBe(0);
    expect(wallet.fanId).toBe(FAN.id);
  });

  it('createForUser con un monedero existente responde conflicto', async () => {
    walletsRepository.existsBy.mockResolvedValue(true);

    await expect(service.createForUser(7)).rejects.toThrow(ConflictException);
  });

  it('createForUser sin perfil de aficionado responde no encontrado', async () => {
    fansRepository.findOneBy.mockResolvedValue(null);

    await expect(service.createForUser(7)).rejects.toThrow(NotFoundException);
  });

  it('recharge acredita el saldo y deja el movimiento con la referencia de la pasarela', async () => {
    const wallet = await service.recharge(7, { amount: 5000, paymentMethodId: 1, paymentGatewayId: 1 });

    expect(wallet.balance).toBe(15000);
    expect(paymentGateway.charge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, paymentMethodCode: 'CARD', gatewayCode: 'WOMPI' }),
    );
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.RECHARGE);
    expect(movement.amount).toBe(5000);
    expect(movement.balanceAfter).toBe(15000);
    expect(movement.reference).toBe('SIM-1-RC-1');
  });

  it('recharge rechazada no acredita saldo', async () => {
    (paymentGateway.charge as jest.Mock).mockResolvedValue({ approved: false, reference: 'SIM-2' });

    await expect(service.recharge(7, { amount: 5000, paymentMethodId: 1, paymentGatewayId: 1 })).rejects.toThrow(
      BadRequestException,
    );
    expect(walletsRepository.save).not.toHaveBeenCalled();
    expect(movementsRepository.save).not.toHaveBeenCalled();
  });

  it('recharge de un monedero inactivo responde solicitud inválida', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ active: false }));

    await expect(service.recharge(7, { amount: 5000, paymentMethodId: 1, paymentGatewayId: 1 })).rejects.toThrow(
      BadRequestException,
    );
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });

  it('adjust suma saldo y guarda el motivo', async () => {
    const wallet = await service.adjust(1, { amount: 2500, reason: 'Bono de bienvenida' });

    expect(wallet.balance).toBe(12500);
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.ADJUSTMENT);
    expect(movement.amount).toBe(2500);
    expect(movement.reason).toBe('Bono de bienvenida');
  });

  it('adjust que deja el saldo negativo responde solicitud inválida', async () => {
    await expect(service.adjust(1, { amount: -15000, reason: 'Corrección de saldo' })).rejects.toThrow(
      BadRequestException,
    );
    expect(walletsRepository.save).not.toHaveBeenCalled();
  });

  it('updateStatus activa o desactiva el monedero', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ active: true }));

    const wallet = await service.updateStatus(1, { active: false });

    expect(wallet.active).toBe(false);
    expect(walletsRepository.save).toHaveBeenCalled();
  });

  it('remove no permite borrar un monedero con saldo', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ balance: 5000 }));

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
  });

  it('remove no permite borrar un monedero con movimientos', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ balance: 0 }));
    movementsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
  });

  it('remove borra un monedero en cero y sin movimientos', async () => {
    const wallet = buildWallet({ balance: 0 });
    walletsRepository.findOne.mockResolvedValue(wallet);

    const result = await service.remove(1);

    expect(walletsRepository.remove).toHaveBeenCalledWith(wallet);
    expect(result.message).toContain('eliminado');
  });

  it('debitForBet descuenta el monto y registra el movimiento', async () => {
    const wallet = await service.debitForBet(manager as unknown as EntityManager, FAN.id, 4000, BET);

    expect(wallet.balance).toBe(6000);
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.BET_DEBIT);
    expect(movement.amount).toBe(-4000);
    expect(movement.bet).toBe(BET);
  });

  it('debitForBet sin saldo suficiente responde solicitud inválida', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ balance: 1000 }));

    await expect(service.debitForBet(manager as unknown as EntityManager, FAN.id, 4000, BET)).rejects.toThrow(BadRequestException);
    expect(walletsRepository.save).not.toHaveBeenCalled();
  });

  it('debitForBet con el monedero inactivo responde solicitud inválida', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ active: false }));

    await expect(service.debitForBet(manager as unknown as EntityManager, FAN.id, 4000, BET)).rejects.toThrow(BadRequestException);
  });

  it('creditBetWin acredita la ganancia', async () => {
    const wallet = await service.creditBetWin(manager as unknown as EntityManager, FAN.id, 8000, BET);

    expect(wallet.balance).toBe(18000);
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.BET_WIN);
    expect(movement.amount).toBe(8000);
  });

  it('reverseBetWin permite dejar el saldo negativo', async () => {
    walletsRepository.findOne.mockResolvedValue(buildWallet({ balance: 1000 }));

    const wallet = await service.reverseBetWin(manager as unknown as EntityManager, FAN.id, 8000, BET);

    expect(wallet.balance).toBe(-7000);
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.BET_WIN_REVERSAL);
  });

  it('refundBet devuelve el monto apostado', async () => {
    const wallet = await service.refundBet(manager as unknown as EntityManager, FAN.id, 4000, BET);

    expect(wallet.balance).toBe(14000);
    const movement = movementsRepository.save.mock.calls[0][0] as WalletMovement;
    expect(movement.type).toBe(WalletMovementType.BET_REFUND);
  });

  it('getMine incluye los últimos movimientos', async () => {
    movementsRepository.find.mockResolvedValue([buildMovement({ bet: BET })]);

    const detail = await service.getMine(7);

    expect(detail.fanId).toBe(FAN.id);
    expect(detail.movements).toHaveLength(1);
    expect(detail.movements[0].betId).toBe(BET.id);
  });

  it('findMyMovements filtra por tipo y aplica la paginación', async () => {
    movementsRepository.find.mockResolvedValue([buildMovement()]);

    const movements = await service.findMyMovements(7, { type: WalletMovementType.RECHARGE, limit: 5, offset: 10 });

    expect(movementsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { wallet: { id: 1 }, type: WalletMovementType.RECHARGE },
        skip: 10,
        take: 5,
      }),
    );
    expect(movements).toHaveLength(1);
  });
});
