import { Injectable } from '@nestjs/common';
import { FanMapper } from '../../fans/mappers/fan.mapper';
import { Match } from '../../matches/entities/match.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { VenueSectionMapper } from '../../venue-sections/mappers/venue-section.mapper';
import { VenueMapper } from '../../venues/mappers/venue.mapper';
import { TicketMatchDto, TicketResponseDto } from '../dto/ticket-response.dto';
import { Ticket } from '../entities/ticket.entity';

@Injectable()
export class TicketMapper {
  constructor(
    private readonly teamMapper: TeamMapper,
    private readonly venueMapper: VenueMapper,
    private readonly sectionMapper: VenueSectionMapper,
    private readonly fanMapper: FanMapper,
  ) {}

  // Requiere el partido con su torneo, equipos y escenario cargados
  toMatchDto(match: Match): TicketMatchDto {
    return {
      id: match.id,
      tournamentName: match.phase.tournament.name,
      homeTeam: this.teamMapper.toSummaryDto(match.homeTeam),
      awayTeam: this.teamMapper.toSummaryDto(match.awayTeam),
      scheduledAt: new Date(match.scheduledAt).toISOString(),
      venue: match.venue ? this.venueMapper.toSummaryDto(match.venue) : null,
    };
  }

  toResponseDto(ticket: Ticket, withFan = false): TicketResponseDto {
    return {
      id: ticket.id,
      code: ticket.code,
      match: this.toMatchDto(ticket.match),
      section: this.sectionMapper.toSummaryDto(ticket.section),
      price: ticket.price,
      status: ticket.status,
      purchasedAt: (ticket.purchasedAt ?? new Date()).toISOString(),
      cancelledAt: ticket.cancelledAt ? ticket.cancelledAt.toISOString() : null,
      ...(withFan && { fan: this.fanMapper.toSummaryDto(ticket.fan) }),
    };
  }
}
