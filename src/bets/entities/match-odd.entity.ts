import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Match } from '../../matches/entities/match.entity';

// Resultado al que se apuesta en un partido
export enum BetSelection {
  HOME = 'HOME',
  DRAW = 'DRAW',
  AWAY = 'AWAY',
}

// Cuota que el administrador define para cada resultado posible de un partido
@Entity('match_odds')
@Unique('uk_match_odd_selection', ['match', 'selection'])
export class MatchOdd {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Match, (match) => match.odds, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ type: 'enum', enum: BetSelection })
  selection!: BetSelection;

  // Ganancia por cada peso apostado (2.10 paga 2.10 veces lo apostado)
  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: DecimalTransformer })
  odds!: number;

  // Las cuotas no se borran: se desactivan para que no admitan apuestas nuevas
  @Column({ default: true })
  active!: boolean;
}
