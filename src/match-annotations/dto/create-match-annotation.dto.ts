import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateMatchAnnotationDto {
  @IsInt({ message: 'El partido debe ser un id numérico' })
  @Min(1, { message: 'El partido debe ser un id válido' })
  matchId!: number;

  @IsInt({ message: 'El jugador debe ser un id numérico' })
  @Min(1, { message: 'El jugador debe ser un id válido' })
  playerId!: number;

  @IsInt({ message: 'El minuto debe ser un número entero' })
  @Min(0, { message: 'El minuto no puede ser negativo' })
  @Max(300, { message: 'El minuto no puede superar 300' })
  minute!: number;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La nota debe ser texto' })
  @MaxLength(255, { message: 'La nota no puede superar 255 caracteres' })
  notes?: string | null;
}
