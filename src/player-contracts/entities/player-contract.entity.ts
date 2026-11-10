import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';

// Contrato de un jugador con un equipo; al retirarlo se conserva como historial de traspasos
@Entity('player_contracts')
export class PlayerContract {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Player, (player) => player.contracts, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Team, (team) => team.contracts, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'released_at', type: 'datetime', nullable: true })
  releasedAt!: Date | null;
}
