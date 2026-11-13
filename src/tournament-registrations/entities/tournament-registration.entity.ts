import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

// Inscripción de un equipo en un torneo (N:N explícita)
@Entity('tournament_registrations')
@Unique('uk_tournament_team', ['tournament', 'team'])
export class TournamentRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @CreateDateColumn({ name: 'registered_at', type: 'datetime' })
  registeredAt!: Date;
}
