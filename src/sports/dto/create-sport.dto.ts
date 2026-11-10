import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateSportDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del deporte es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(255, { message: 'La descripción no puede superar 255 caracteres' })
  description?: string | null;

  // Deporte padre cuando se registra un subdeporte; null lo deja como deporte principal
  @IsOptional()
  @IsInt({ message: 'El deporte padre debe ser un id numérico' })
  @Min(1, { message: 'El deporte padre debe ser un id válido' })
  parentId?: number | null;
}
