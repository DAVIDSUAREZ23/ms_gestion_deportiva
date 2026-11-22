import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { MAX_ODDS, MIN_ODDS } from '../bets.constants';
import { BetSelection } from '../entities/match-odd.entity';

// Cuota que define el administrador para un resultado del partido
export class SetOddDto {
  @IsEnum(BetSelection, { message: 'La selección debe ser HOME, DRAW o AWAY' })
  selection!: BetSelection;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cuota debe ser un número con máximo dos decimales' })
  @Min(MIN_ODDS, { message: `La cuota mínima es ${MIN_ODDS}` })
  @Max(MAX_ODDS, { message: `La cuota máxima es ${MAX_ODDS}` })
  odds!: number;
}
