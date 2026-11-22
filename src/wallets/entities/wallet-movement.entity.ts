import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { PaymentGateway } from '../../payments/entities/payment-gateway.entity';
import { PaymentMethod } from '../../payments/entities/payment-method.entity';
import { Wallet } from './wallet.entity';

export enum WalletMovementType {
  // Recarga con una pasarela de pago
  RECHARGE = 'RECHARGE',
  // Dinero que sale del monedero para pagar una apuesta
  BET_DEBIT = 'BET_DEBIT',
  // Ganancia de una apuesta acertada
  BET_WIN = 'BET_WIN',
  // Reverso de una ganancia cuando se corrige el resultado
  BET_WIN_REVERSAL = 'BET_WIN_REVERSAL',
  // Devolución del monto apostado cuando el partido se anula
  BET_REFUND = 'BET_REFUND',
  // Ajuste manual del administrador, con motivo
  ADJUSTMENT = 'ADJUSTMENT',
}

// Cada cambio de saldo queda registrado; el saldo del monedero siempre es la suma de sus movimientos
@Entity('wallet_movements')
@Index('idx_wallet_movements_wallet', ['wallet'])
@Index('idx_wallet_movements_bet', ['bet'])
export class WalletMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Wallet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ type: 'enum', enum: WalletMovementType })
  type!: WalletMovementType;

  // Variación del saldo: positiva si entra dinero, negativa si sale
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  amount!: number;

  // Saldo resultante después de aplicar el movimiento
  @Column({ name: 'balance_after', type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  balanceAfter!: number;

  @ManyToOne(() => Bet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bet_id' })
  bet!: Bet | null;

  // Solo en recargas: con qué método y pasarela se pagó
  @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod!: PaymentMethod | null;

  @ManyToOne(() => PaymentGateway, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_gateway_id' })
  paymentGateway!: PaymentGateway | null;

  // Referencia de la pasarela; única para no acreditar dos veces la misma recarga
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  reference!: string | null;

  // Motivo del ajuste manual
  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
