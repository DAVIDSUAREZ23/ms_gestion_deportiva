import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transformers/trim.transformer';

// Datos con los que el usuario crea su perfil de aficionado (el userId sale del JWT, nunca del cuerpo)
export class CreateFanProfileDto {
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre para mostrar es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  displayName!: string;

  @Trim()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(120, { message: 'El correo no puede superar 120 caracteres' })
  email!: string;

  @TrimToNull()
  @IsOptional()
  @Matches(/^[0-9+()\s-]{7,20}$/, { message: 'El teléfono debe tener entre 7 y 20 dígitos' })
  phone?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(100, { message: 'La ciudad no puede superar 100 caracteres' })
  city?: string | null;
}
