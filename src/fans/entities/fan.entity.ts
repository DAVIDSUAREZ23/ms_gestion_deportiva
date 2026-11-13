import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FanTeam } from './fan-team.entity';

// Aficionado: perfil deportivo de un usuario del ms de seguridad (rol AFICIONADO), enlazado por su id
@Entity('fans')
export class Fan {
  @PrimaryGeneratedColumn()
  id!: number;

  // Id del usuario en segurity_ms_Depor (claim "sub" del JWT); un usuario tiene un solo perfil
  @Column({ name: 'user_id', type: 'int', unique: true })
  userId!: number;

  @Column({ name: 'display_name', length: 100 })
  displayName!: string;

  @Column({ length: 120 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @OneToMany(() => FanTeam, (fanTeam) => fanTeam.fan)
  followedTeams!: FanTeam[];
}
