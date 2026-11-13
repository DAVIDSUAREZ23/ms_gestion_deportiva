import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { CompetitionGroup } from './competition-group.entity';

// Equipo asignado a un grupo (N:N explícita)
@Entity('group_teams')
@Unique('uk_group_team', ['group', 'team'])
export class GroupTeam {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompetitionGroup, (group) => group.groupTeams, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'group_id' })
  group!: CompetitionGroup;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;
}
