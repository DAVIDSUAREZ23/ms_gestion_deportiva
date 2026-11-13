import { IsInt, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class CreateVenueSectionDto {
  @IsInt({ message: 'El escenario debe ser un id numérico' })
  @Min(1, { message: 'El escenario debe ser un id válido' })
  venueId!: number;

  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la localidad es obligatorio' })
  @MaxLength(60, { message: 'El nombre no puede superar 60 caracteres' })
  name!: string;

  @IsInt({ message: 'El cupo debe ser un número entero' })
  @Min(1, { message: 'El cupo debe ser mayor que cero' })
  @Max(500000, { message: 'El cupo no puede superar 500.000' })
  capacity!: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(100000000, { message: 'El precio no puede superar 100.000.000' })
  price!: number;
}
