import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';

// Capacidad deportiva del catálogo que se asigna a los jugadores
@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.skill)
  playerSkills!: PlayerSkill[];
}
