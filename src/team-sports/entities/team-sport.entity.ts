import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Sport } from '../../sports/entities/sport.entity';
import { Team } from '../../teams/entities/team.entity';

// Deporte en el que participa un equipo (N:N explícita)
@Entity('team_sports')
@Unique('uk_team_sport', ['team', 'sport'])
export class TeamSport {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Team, (team) => team.teamSports, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => Sport, (sport) => sport.teamSports, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sport_id' })
  sport!: Sport;
}
