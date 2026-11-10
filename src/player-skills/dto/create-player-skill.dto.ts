import { IsInt, Min } from 'class-validator';

export class CreatePlayerSkillDto {
  @IsInt({ message: 'El jugador debe ser un id numérico' })
  @Min(1, { message: 'El jugador debe ser un id válido' })
  playerId!: number;

  @IsInt({ message: 'La habilidad debe ser un id numérico' })
  @Min(1, { message: 'La habilidad debe ser un id válido' })
  skillId!: number;
}
