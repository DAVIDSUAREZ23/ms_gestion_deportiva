import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class CreateGroupDto {
  @IsInt({ message: 'La fase debe ser un id numérico' })
  @Min(1, { message: 'La fase debe ser un id válido' })
  phaseId!: number;

  @Trim()
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del grupo es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
  name!: string;
}
