import { BetSelection } from '../entities/match-odd.entity';

export class OddResponseDto {
  id!: number;
  matchId!: number;
  selection!: BetSelection;
  odds!: number;
  active!: boolean;
}
