import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MAX_ODDS, MIN_ODDS } from '../bets.constants';

export class UpdateOddDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cuota debe ser un número con máximo dos decimales' })
  @Min(MIN_ODDS, { message: `La cuota mínima es ${MIN_ODDS}` })
  @Max(MAX_ODDS, { message: `La cuota máxima es ${MAX_ODDS}` })
  odds?: number;

  // Desactivar la cuota impide apostar por ese resultado sin borrar el historial
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  active?: boolean;
}
