import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Skill } from '../../skills/entities/skill.entity';

// Habilidad que posee un jugador (N:N explícita)
@Entity('player_skills')
@Unique('uk_player_skill', ['player', 'skill'])
export class PlayerSkill {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Player, (player) => player.playerSkills, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Skill, (skill) => skill.playerSkills, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;
}
