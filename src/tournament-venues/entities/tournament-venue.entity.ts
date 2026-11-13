import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Venue } from '../../venues/entities/venue.entity';

// Escenario habilitado para los partidos de un torneo (N:N explícita "Escenario Torneo")
@Entity('tournament_venues')
@Unique('uk_tournament_venue', ['tournament', 'venue'])
export class TournamentVenue {
  @PrimaryGeneratedColumn()
  id!: number;

  // Al eliminar un torneo (solo posible sin inscripciones ni fases) se eliminan también sus asignaciones de escenarios
  @ManyToOne(() => Tournament, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Venue, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue;
}
