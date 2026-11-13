import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';

// Anotación de un partido (gol, punto, canasta...) hecha por un jugador de uno de los dos equipos
@Entity('match_annotations')
export class MatchAnnotation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Match, (match) => match.annotations, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @ManyToOne(() => Player, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  // Equipo por el que anotó, guardado para conservar el historial aunque el jugador cambie de equipo
  @ManyToOne(() => Team, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ type: 'int' })
  minute!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;
}
