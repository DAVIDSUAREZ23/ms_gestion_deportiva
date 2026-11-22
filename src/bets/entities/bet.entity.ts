import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Fan } from '../../fans/entities/fan.entity';
import { Match } from '../../matches/entities/match.entity';
import { PaymentGateway } from '../../payments/entities/payment-gateway.entity';
import { PaymentMethod } from '../../payments/entities/payment-method.entity';
import { BetSelection } from './match-odd.entity';

export enum BetStatus {
  // Creada y enviada a la pasarela; se espera su respuesta
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  // Pago aprobado: la apuesta está viva
  ACTIVE = 'ACTIVE',
  // La pasarela rechazó el pago: el aficionado puede volver a apostar
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  WON = 'WON',
  LOST = 'LOST',
  // El partido se canceló y la apuesta se anula
  VOID = 'VOID',
}

// Apuesta de un aficionado a un resultado de un partido, pagada con un método y una pasarela
@Entity('bets')
@Index('idx_bets_fan_match', ['fan', 'match'])
export class Bet {
  @PrimaryGeneratedColumn()
  id!: number;

  // Código corto que identifica la apuesta, p. ej. AP-9F3A61C2
  @Column({ length: 20, unique: true })
  code!: string;

  @ManyToOne(() => Fan, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'fan_id' })
  fan!: Fan;

  @ManyToOne(() => Match, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ type: 'enum', enum: BetSelection })
  selection!: BetSelection;

  // Monto apostado en COP
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  amount!: number;

  // Cuota congelada al momento de apostar
  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: DecimalTransformer })
  odds!: number;

  // amount * odds, calculado en el servidor
  @Column({ name: 'potential_payout', type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  potentialPayout!: number;

  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.PENDING_PAYMENT })
  status!: BetStatus;

  @ManyToOne(() => PaymentMethod, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod!: PaymentMethod;

  @ManyToOne(() => PaymentGateway, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'payment_gateway_id' })
  paymentGateway!: PaymentGateway;

  // Referencia que devuelve la pasarela; única para no cobrar dos veces el mismo pago
  @Column({ name: 'payment_reference', type: 'varchar', length: 100, unique: true, nullable: true })
  paymentReference!: string | null;

  @CreateDateColumn({ name: 'placed_at', type: 'datetime' })
  placedAt!: Date;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'settled_at', type: 'datetime', nullable: true })
  settledAt!: Date | null;
}
