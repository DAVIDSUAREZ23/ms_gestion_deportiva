import { FanSummaryDto } from '../../fans/dto/fan-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';
import { VenueSectionSummaryDto } from '../../venue-sections/dto/venue-section-response.dto';
import { VenueSummaryDto } from '../../venues/dto/venue-response.dto';
import { TicketStatus } from '../entities/ticket.entity';

// Partido visto desde la boletería
export class TicketMatchDto {
  id!: number;
  tournamentName!: string;
  homeTeam!: TeamSummaryDto;
  awayTeam!: TeamSummaryDto;
  scheduledAt!: string;
  venue!: VenueSummaryDto | null;
}

export class TicketResponseDto {
  id!: number;
  code!: string;
  match!: TicketMatchDto;
  section!: VenueSectionSummaryDto;
  price!: number;
  status!: TicketStatus;
  purchasedAt!: string;
  cancelledAt!: string | null;
  // Solo en la consulta del administrador
  fan?: FanSummaryDto;
}

// Disponibilidad de una localidad para un partido
export class SectionAvailabilityDto {
  section!: VenueSectionSummaryDto;
  capacity!: number;
  sold!: number;
  available!: number;
}
