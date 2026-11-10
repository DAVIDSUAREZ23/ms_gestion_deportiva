import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlayerContract } from '../../player-contracts/entities/player-contract.entity';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';

// Persona que puede integrar las plantillas de los equipos
@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'document_number', length: 20, unique: true })
  documentNumber!: string;

  @Column({ name: 'first_name', length: 80 })
  firstName!: string;

  @Column({ name: 'last_name', length: 80 })
  lastName!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  nationality!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => PlayerContract, (contract) => contract.player)
  contracts!: PlayerContract[];

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.player)
  playerSkills!: PlayerSkill[];
}
