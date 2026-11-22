import { FanSummaryDto } from '../../fans/dto/fan-response.dto';
import {
  PaymentGatewaySummaryDto,
  PaymentMethodSummaryDto,
} from '../../payments/dto/payment-catalog-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';
import { VenueSummaryDto } from '../../venues/dto/venue-response.dto';
import { BetStatus } from '../entities/bet.entity';
import { BetSelection } from '../entities/match-odd.entity';
import { OddResponseDto } from './odd-response.dto';

// Partido visto desde las apuestas
export class BetMatchDto {
  id!: number;
  tournamentName!: string;
  homeTeam!: TeamSummaryDto;
  awayTeam!: TeamSummaryDto;
  scheduledAt!: string;
  venue!: VenueSummaryDto | null;
}

// Partido con las cuotas activas, para la lista de próximos partidos
export class UpcomingBetMatchDto extends BetMatchDto {
  odds!: OddResponseDto[];
}

export class BetResponseDto {
  id!: number;
  code!: string;
  match!: BetMatchDto;
  selection!: BetSelection;
  amount!: number;
  odds!: number;
  potentialPayout!: number;
  status!: BetStatus;
  paymentMethod!: PaymentMethodSummaryDto;
  paymentGateway!: PaymentGatewaySummaryDto;
  paymentReference!: string | null;
  placedAt!: string;
  paidAt!: string | null;
  settledAt!: string | null;
  // Solo en la consulta del administrador
  fan?: FanSummaryDto;
}
