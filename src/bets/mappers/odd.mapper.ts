import { Injectable } from '@nestjs/common';
import { Match } from '../../matches/entities/match.entity';
import { OddResponseDto } from '../dto/odd-response.dto';
import { MatchOdd } from '../entities/match-odd.entity';

@Injectable()
export class OddMapper {
  toResponseDto(odd: MatchOdd): OddResponseDto {
    return {
      id: odd.id,
      matchId: odd.match.id,
      selection: odd.selection,
      odds: odd.odds,
      active: odd.active,
    };
  }

  toResponseDtoList(odds: MatchOdd[]): OddResponseDto[] {
    return odds.map((odd) => this.toResponseDto(odd));
  }

  // Cuando las cuotas vienen cargadas como hijos del partido, TypeORM no llena odd.match
  toResponseDtoListForMatch(odds: MatchOdd[], match: Match): OddResponseDto[] {
    return odds.map((odd) => {
      odd.match = match;
      return this.toResponseDto(odd);
    });
  }
}
