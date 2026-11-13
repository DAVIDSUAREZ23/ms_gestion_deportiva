import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Phase } from '../../phases/entities/phase.entity';
import { Sport } from '../../sports/entities/sport.entity';
import { TournamentRegistration } from '../../tournament-registrations/entities/tournament-registration.entity';

// Competencia de un deporte con su periodo de inscripciones y de juego
@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @ManyToOne(() => Sport, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sport_id' })
  sport!: Sport;

  @Column({ name: 'registration_deadline', type: 'date' })
  registrationDeadline!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => TournamentRegistration, (registration) => registration.tournament)
  registrations!: TournamentRegistration[];

  @OneToMany(() => Phase, (phase) => phase.tournament)
  phases!: Phase[];
}
