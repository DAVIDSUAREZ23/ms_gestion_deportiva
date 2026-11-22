import { OddResponseDto } from '../../bets/dto/odd-response.dto';
import { MatchResponseDto } from './match-response.dto';

// Partido con sus cuotas, para la pantalla de administración de cuotas
export class MatchWithOddsResponseDto extends MatchResponseDto {
  odds!: OddResponseDto[];
}
