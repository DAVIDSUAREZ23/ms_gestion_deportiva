import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';

// Escenario deportivo donde se disputan los partidos
@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Match, (match) => match.venue)
  matches!: Match[];
}
