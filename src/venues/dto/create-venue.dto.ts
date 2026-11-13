import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreateVenueDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del escenario es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar 120 caracteres' })
  name!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(100, { message: 'La ciudad no puede superar 100 caracteres' })
  city?: string | null;

  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @Min(1, { message: 'La capacidad debe ser mayor que cero' })
  @Max(500000, { message: 'La capacidad no puede superar 500.000 personas' })
  capacity?: number | null;
}
