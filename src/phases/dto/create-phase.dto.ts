import { IsEnum, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';
import { PhaseType } from '../entities/phase.entity';

export class CreatePhaseDto {
  @IsInt({ message: 'El torneo debe ser un id numérico' })
  @Min(1, { message: 'El torneo debe ser un id válido' })
  tournamentId!: number;

  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la fase es obligatorio' })
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres' })
  name!: string;

  @IsEnum(PhaseType, { message: 'El tipo debe ser GROUP_STAGE (fase de grupos) o KNOCKOUT (fase final)' })
  type!: PhaseType;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden debe ser mayor o igual a 1' })
  @Max(50, { message: 'El orden no puede superar 50' })
  order!: number;
}
