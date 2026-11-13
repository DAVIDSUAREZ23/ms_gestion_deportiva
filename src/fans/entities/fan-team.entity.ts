import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Fan } from './fan.entity';

// Aficionado Equipo: equipo que sigue un aficionado (destinatarios de los avisos de partidos nuevos)
@Entity('fan_teams')
@Unique('uk_fan_team', ['fan', 'team'])
export class FanTeam {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Fan, (fan) => fan.followedTeams, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'fan_id' })
  fan!: Fan;

  // Si un equipo se elimina (solo posible sin datos deportivos), sus seguidores dejan de seguirlo
  @ManyToOne(() => Team, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @CreateDateColumn({ name: 'followed_at', type: 'datetime' })
  followedAt!: Date;
}
