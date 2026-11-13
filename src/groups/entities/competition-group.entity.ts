import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Phase } from '../../phases/entities/phase.entity';
import { GroupTeam } from './group-team.entity';

// Grupo de una fase de grupos (la tabla no se llama "groups" porque es palabra reservada en SQL)
@Entity('competition_groups')
@Unique('uk_group_name', ['phase', 'name'])
export class CompetitionGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Phase, (phase) => phase.groups, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'phase_id' })
  phase!: Phase;

  @Column({ length: 50 })
  name!: string;

  @OneToMany(() => GroupTeam, (groupTeam) => groupTeam.group)
  groupTeams!: GroupTeam[];
}
