import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlayerContract } from '../../player-contracts/entities/player-contract.entity';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

// Organización que participa en competencias
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'founded_at', type: 'date', nullable: true })
  foundedAt!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team)
  teamSports!: TeamSport[];

  @OneToMany(() => PlayerContract, (contract) => contract.team)
  contracts!: PlayerContract[];
}
