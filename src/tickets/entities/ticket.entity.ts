import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Fan } from '../../fans/entities/fan.entity';
import { Match } from '../../matches/entities/match.entity';
import { VenueSection } from '../../venue-sections/entities/venue-section.entity';

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

// Boleto de un aficionado para un partido en una localidad del escenario; se conserva aunque se cancele
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  // Código que presenta el aficionado en la entrada
  @Column({ length: 20, unique: true })
  code!: string;

  @ManyToOne(() => Match, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @ManyToOne(() => Fan, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'fan_id' })
  fan!: Fan;

  @ManyToOne(() => VenueSection, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'section_id' })
  section!: VenueSection;

  // Precio de la localidad al momento de la compra (no cambia si luego cambia el precio)
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  price!: number;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
  status!: TicketStatus;

  @CreateDateColumn({ name: 'purchased_at', type: 'datetime' })
  purchasedAt!: Date;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt!: Date | null;
}
