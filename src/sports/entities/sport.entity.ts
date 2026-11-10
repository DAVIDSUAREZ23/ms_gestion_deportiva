import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

// Disciplina deportiva; puede tener subdeportes (p. ej. Fútbol → Fútbol de salón)
@Entity('sports')
export class Sport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Sport, (sport) => sport.subSports, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'parent_id' })
  parent!: Sport | null;

  @OneToMany(() => Sport, (sport) => sport.parent)
  subSports!: Sport[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.sport)
  teamSports!: TeamSport[];
}
