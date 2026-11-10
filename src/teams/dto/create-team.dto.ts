import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateTeamDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(100, { message: 'La ciudad no puede superar 100 caracteres' })
  city?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fundación debe tener el formato AAAA-MM-DD' })
  foundedAt?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(255, { message: 'La descripción no puede superar 255 caracteres' })
  description?: string | null;
}
