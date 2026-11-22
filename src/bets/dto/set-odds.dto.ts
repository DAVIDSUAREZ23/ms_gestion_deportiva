import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, ValidateNested } from 'class-validator';
import { SetOddDto } from './set-odd.dto';

// Set completo de cuotas de un partido: se envían las selecciones que quedan activas
export class SetOddsDto {
  @IsArray({ message: 'Las cuotas deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debes enviar al menos una cuota' })
  @ArrayMaxSize(3, { message: 'Solo se permiten las cuotas de HOME, DRAW y AWAY' })
  @ArrayUnique((item: SetOddDto) => item.selection, { message: 'No se puede repetir la misma selección' })
  @ValidateNested({ each: true })
  @Type(() => SetOddDto)
  odds!: SetOddDto[];
}
