import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CompetitionGroup } from '../../groups/entities/competition-group.entity';
import { Final } from './final.entity';
import { Match } from '../../matches/entities/match.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

// Tipo de etapa: fase de grupos o fase final por eliminación (llaves)
export enum PhaseType {
  GROUP_STAGE = 'GROUP_STAGE',
  KNOCKOUT = 'KNOCKOUT',
}

// Etapa de un torneo; "order" define en qué orden se juegan las fases
@Entity('phases')
@Unique('uk_phase_order', ['tournament', 'order'])
export class Phase {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.phases, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @Column({ length: 80 })
  name!: string;

  @Column({ type: 'enum', enum: PhaseType })
  type!: PhaseType;

  @Column({ name: 'phase_order', type: 'int' })
  order!: number;

  @OneToMany(() => CompetitionGroup, (group) => group.phase)
  groups!: CompetitionGroup[];

  @OneToMany(() => Match, (match) => match.phase)
  matches!: Match[];

  // Datos propios de la fase final (ronda); null en fases de grupos
  @OneToOne(() => Final, (final) => final.phase, { cascade: true })
  final!: Final | null;
}
