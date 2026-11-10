import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

export class CreatePlayerDto {
  @Trim()
  @IsString({ message: 'El documento debe ser texto' })
  @Matches(/^[A-Za-z0-9-]{4,20}$/, {
    message: 'El documento debe tener entre 4 y 20 letras, números o guiones',
  })
  documentNumber!: string;

  @Trim()
  @IsString({ message: 'Los nombres deben ser texto' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @MaxLength(80, { message: 'Los nombres no pueden superar 80 caracteres' })
  firstName!: string;

  @Trim()
  @IsString({ message: 'Los apellidos deben ser texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @MaxLength(80, { message: 'Los apellidos no pueden superar 80 caracteres' })
  lastName!: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato AAAA-MM-DD' })
  birthDate!: string;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La posición debe ser texto' })
  @MaxLength(50, { message: 'La posición no puede superar 50 caracteres' })
  position?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La nacionalidad debe ser texto' })
  @MaxLength(60, { message: 'La nacionalidad no puede superar 60 caracteres' })
  nationality?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(120, { message: 'El correo no puede superar 120 caracteres' })
  email?: string | null;

  @TrimToNull()
  @IsOptional()
  @Matches(/^[0-9+()\s-]{7,20}$/, { message: 'El teléfono debe tener entre 7 y 20 dígitos' })
  phone?: string | null;
}
