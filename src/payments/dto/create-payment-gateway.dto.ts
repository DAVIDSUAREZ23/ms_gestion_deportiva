import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Trim, UpperTrim } from '../../common/transformers/trim.transformer';

export class CreatePaymentGatewayDto {
  @UpperTrim()
  @IsString({ message: 'El código debe ser texto' })
  @IsNotEmpty({ message: 'El código de la pasarela es obligatorio' })
  @MaxLength(30, { message: 'El código no puede superar 30 caracteres' })
  @Matches(/^[A-Z0-9_]+$/, { message: 'El código solo admite letras, números y guion bajo' })
  code!: string;

  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la pasarela es obligatorio' })
  @MaxLength(60, { message: 'El nombre no puede superar 60 caracteres' })
  name!: string;

  // Por defecto una pasarela nueva se registra en modo de pruebas
  @IsOptional()
  @IsBoolean({ message: 'El modo de pruebas debe ser verdadero o falso' })
  sandbox?: boolean;
}
