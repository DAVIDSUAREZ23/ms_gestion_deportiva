import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Fan } from '../../fans/entities/fan.entity';

// Monedero de un aficionado: saldo disponible para apostar y recibir ganancias
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  // Un aficionado tiene un solo monedero
  @OneToOne(() => Fan, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fan_id' })
  fan!: Fan;

  // Saldo en COP. Solo puede quedar negativo al revertir una ganancia ya acreditada
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: DecimalTransformer })
  balance!: number;

  // Un monedero inactivo no permite recargas, ajustes ni apuestas
  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
