import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateTournamentDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del torneo es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar 120 caracteres' })
  name!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(255, { message: 'La descripción no puede superar 255 caracteres' })
  description?: string | null;

  @IsInt({ message: 'El deporte debe ser un id numérico' })
  @Min(1, { message: 'El deporte debe ser un id válido' })
  sportId!: number;

  @IsDateString({}, { message: 'El cierre de inscripciones debe tener el formato AAAA-MM-DD' })
  registrationDeadline!: string;

  @IsDateString({}, { message: 'La fecha de inicio debe tener el formato AAAA-MM-DD' })
  startDate!: string;

  @IsDateString({}, { message: 'La fecha de fin debe tener el formato AAAA-MM-DD' })
  endDate!: string;
}
