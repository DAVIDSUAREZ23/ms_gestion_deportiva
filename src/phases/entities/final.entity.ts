import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Phase } from './phase.entity';

// Ronda de una fase final por eliminación
export enum FinalRound {
  ROUND_OF_16 = 'ROUND_OF_16',
  QUARTER_FINAL = 'QUARTER_FINAL',
  SEMI_FINAL = 'SEMI_FINAL',
  THIRD_PLACE = 'THIRD_PLACE',
  FINAL = 'FINAL',
}

// Especialización "Final" de una fase (subclase de Fase en el modelo): existe solo para fases KNOCKOUT
@Entity('finals')
export class Final {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Phase, (phase) => phase.final, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phase_id' })
  phase!: Phase;

  @Column({ type: 'enum', enum: FinalRound })
  round!: FinalRound;
}
