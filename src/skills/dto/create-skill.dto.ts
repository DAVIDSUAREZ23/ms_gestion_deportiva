import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateSkillDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la habilidad es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(255, { message: 'La descripción no puede superar 255 caracteres' })
  description?: string | null;
}
