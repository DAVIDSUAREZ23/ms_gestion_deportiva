import { Injectable } from '@nestjs/common';
import { FanMapper } from '../../fans/mappers/fan.mapper';
import { Match } from '../../matches/entities/match.entity';
import { PaymentGatewayMapper } from '../../payments/mappers/payment-gateway.mapper';
import { PaymentMethodMapper } from '../../payments/mappers/payment-method.mapper';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { VenueMapper } from '../../venues/mappers/venue.mapper';
import { BetMatchDto, BetResponseDto, UpcomingBetMatchDto } from '../dto/bet-response.dto';
import { Bet } from '../entities/bet.entity';
import { OddMapper } from './odd.mapper';

@Injectable()
export class BetMapper {
  constructor(
    private readonly teamMapper: TeamMapper,
    private readonly venueMapper: VenueMapper,
    private readonly paymentMethodMapper: PaymentMethodMapper,
    private readonly paymentGatewayMapper: PaymentGatewayMapper,
    private readonly fanMapper: FanMapper,
    private readonly oddMapper: OddMapper,
  ) {}

  // Requiere el partido con su torneo, equipos y escenario cargados
  toMatchDto(match: Match): BetMatchDto {
    return {
      id: match.id,
      tournamentName: match.phase.tournament.name,
      homeTeam: this.teamMapper.toSummaryDto(match.homeTeam),
      awayTeam: this.teamMapper.toSummaryDto(match.awayTeam),
      scheduledAt: new Date(match.scheduledAt).toISOString(),
      venue: match.venue ? this.venueMapper.toSummaryDto(match.venue) : null,
    };
  }

  // Requiere el partido con sus cuotas cargadas
  toUpcomingMatchDto(match: Match): UpcomingBetMatchDto {
    const activeOdds = (match.odds ?? []).filter((odd) => odd.active);
    return { ...this.toMatchDto(match), odds: this.oddMapper.toResponseDtoListForMatch(activeOdds, match) };
  }

  toResponseDto(bet: Bet, withFan = false): BetResponseDto {
    return {
      id: bet.id,
      code: bet.code,
      match: this.toMatchDto(bet.match),
      selection: bet.selection,
      amount: bet.amount,
      odds: bet.odds,
      potentialPayout: bet.potentialPayout,
      status: bet.status,
      paymentMethod: this.paymentMethodMapper.toSummaryDto(bet.paymentMethod),
      paymentGateway: this.paymentGatewayMapper.toSummaryDto(bet.paymentGateway),
      paymentReference: bet.paymentReference,
      placedAt: (bet.placedAt ?? new Date()).toISOString(),
      paidAt: bet.paidAt ? new Date(bet.paidAt).toISOString() : null,
      settledAt: bet.settledAt ? new Date(bet.settledAt).toISOString() : null,
      ...(withFan && { fan: this.fanMapper.toSummaryDto(bet.fan) }),
    };
  }
}
