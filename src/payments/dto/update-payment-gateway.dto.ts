import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Trim, UpperTrim } from '../../common/transformers/trim.transformer';

export class UpdatePaymentGatewayDto {
  @IsOptional()
  @UpperTrim()
  @IsString({ message: 'El código debe ser texto' })
  @IsNotEmpty({ message: 'El código de la pasarela no puede quedar vacío' })
  @MaxLength(30, { message: 'El código no puede superar 30 caracteres' })
  @Matches(/^[A-Z0-9_]+$/, { message: 'El código solo admite letras, números y guion bajo' })
  code?: string;

  @IsOptional()
  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la pasarela no puede quedar vacío' })
  @MaxLength(60, { message: 'El nombre no puede superar 60 caracteres' })
  name?: string;

  @IsOptional()
  @IsBoolean({ message: 'El modo de pruebas debe ser verdadero o falso' })
  sandbox?: boolean;
}
