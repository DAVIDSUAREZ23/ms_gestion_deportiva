import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CompetitionGroup } from '../../groups/entities/competition-group.entity';
import { MatchAnnotation } from '../../match-annotations/entities/match-annotation.entity';
import { Phase } from '../../phases/entities/phase.entity';
import { Team } from '../../teams/entities/team.entity';
import { Venue } from '../../venues/entities/venue.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

// Encuentro entre dos equipos dentro de una fase; en fase de grupos pertenece a un grupo
@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Phase, (phase) => phase.matches, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'phase_id' })
  phase!: Phase;

  @ManyToOne(() => CompetitionGroup, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'group_id' })
  group!: CompetitionGroup | null;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam!: Team;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam!: Team;

  @Column({ name: 'scheduled_at', type: 'datetime' })
  scheduledAt!: Date;

  @ManyToOne(() => Venue, (venue) => venue.matches, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue | null;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status!: MatchStatus;

  @Column({ name: 'home_score', type: 'int', nullable: true })
  homeScore!: number | null;

  @Column({ name: 'away_score', type: 'int', nullable: true })
  awayScore!: number | null;

  // Posición dentro de las llaves de una fase final (1, 2, 3...); null en fase de grupos
  @Column({ name: 'bracket_position', type: 'int', nullable: true })
  bracketPosition!: number | null;

  @OneToMany(() => MatchAnnotation, (annotation) => annotation.match)
  annotations!: MatchAnnotation[];
}
