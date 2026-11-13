import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { FansService } from '../fans/fans.service';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { MATCH_RELATIONS, MatchesService } from '../matches/matches.service';
import { VenueSection } from '../venue-sections/entities/venue-section.entity';
import { VenueSectionMapper } from '../venue-sections/mappers/venue-section.mapper';
import { VenueSectionsService } from '../venue-sections/venue-sections.service';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { SectionAvailabilityDto, TicketMatchDto, TicketResponseDto } from './dto/ticket-response.dto';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketMapper } from './mappers/ticket.mapper';

const TICKET_RELATIONS = {
  match: MATCH_RELATIONS,
  section: true,
} as const;

// Boleto: compra y cancelación del aficionado, disponibilidad por localidad y consulta del administrador
@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectRepository(VenueSection) private readonly sectionsRepository: Repository<VenueSection>,
    private readonly fansService: FansService,
    private readonly matchesService: MatchesService,
    private readonly sectionsService: VenueSectionsService,
    private readonly sectionMapper: VenueSectionMapper,
    private readonly ticketMapper: TicketMapper,
  ) {}

  // Partidos con boletería abierta: programados, futuros, con escenario y de un torneo activo
  async findUpcomingMatches(): Promise<TicketMatchDto[]> {
    const matches = await this.matchesRepository.find({
      where: { status: MatchStatus.SCHEDULED, scheduledAt: MoreThan(new Date()), phase: { tournament: { active: true } } },
      relations: MATCH_RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
    return matches.filter((match) => match.venue !== null).map((match) => this.ticketMapper.toMatchDto(match));
  }

  // Cupos vendidos y disponibles de cada localidad activa del escenario del partido
  async getAvailability(matchId: number): Promise<SectionAvailabilityDto[]> {
    const match = await this.matchesService.findOrFail(matchId);
    if (!match.venue) return [];
    const sections = await this.sectionsRepository.find({
      where: { venue: { id: match.venue.id }, active: true },
      order: { price: 'DESC' },
    });
    const sold = await this.countSoldBySection(matchId);
    return sections.map((section) => {
      const soldInSection = sold.get(section.id) ?? 0;
      return {
        section: this.sectionMapper.toSummaryDto(section),
        capacity: section.capacity,
        sold: soldInSection,
        available: Math.max(section.capacity - soldInSection, 0),
      };
    });
  }

  async buy(userId: number, dto: BuyTicketDto): Promise<TicketResponseDto> {
    const fan = await this.fansService.findActiveByUserOrFail(userId);
    const match = await this.matchesService.findOrFail(dto.matchId);
    this.ensureOnSale(match);
    const section = await this.sectionsService.findOrFail(dto.sectionId);
    this.ensureSectionOfMatchVenue(match, section);
    await this.ensureSeatsLeft(match, section);

    const ticket = Object.assign(new Ticket(), {
      code: this.generateCode(),
      match,
      fan,
      section,
      price: section.price,
      status: TicketStatus.ACTIVE,
      cancelledAt: null,
    });
    const saved = await this.ticketsRepository.save(ticket);
    return this.ticketMapper.toResponseDto(saved);
  }

  async findMine(userId: number): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsRepository.find({
      where: { fan: { userId } },
      relations: TICKET_RELATIONS,
      order: { purchasedAt: 'DESC', id: 'DESC' },
    });
    return tickets.map((ticket) => this.ticketMapper.toResponseDto(ticket));
  }

  // El aficionado cancela su boleto antes de que empiece el partido; queda como historial
  async cancelMine(userId: number, ticketId: number): Promise<TicketResponseDto> {
    const ticket = await this.ticketsRepository.findOne({ where: { id: ticketId, fan: { userId } }, relations: TICKET_RELATIONS });
    if (!ticket) {
      throw new NotFoundException('No tienes un boleto con ese id');
    }
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('El boleto ya está cancelado');
    }
    if (!this.isOnSale(ticket.match)) {
      throw new BadRequestException('El partido ya empezó o no está programado: el boleto no se puede cancelar');
    }
    ticket.status = TicketStatus.CANCELLED;
    ticket.cancelledAt = new Date();
    return this.ticketMapper.toResponseDto(await this.ticketsRepository.save(ticket));
  }

  async findByMatch(matchId: number): Promise<TicketResponseDto[]> {
    await this.matchesService.findOrFail(matchId);
    const tickets = await this.ticketsRepository.find({
      where: { match: { id: matchId } },
      relations: { ...TICKET_RELATIONS, fan: true },
      order: { purchasedAt: 'DESC' },
    });
    return tickets.map((ticket) => this.ticketMapper.toResponseDto(ticket, true));
  }

  private isOnSale(match: Match): boolean {
    return match.status === MatchStatus.SCHEDULED && new Date(match.scheduledAt) > new Date();
  }

  private ensureOnSale(match: Match): void {
    if (!this.isOnSale(match)) {
      throw new BadRequestException('La boletería de este partido está cerrada: ya empezó, terminó o fue cancelado');
    }
    if (!match.venue) {
      throw new BadRequestException('El partido aún no tiene escenario asignado');
    }
  }

  private ensureSectionOfMatchVenue(match: Match, section: VenueSection): void {
    if (section.venue.id !== match.venue?.id) {
      throw new BadRequestException(`"${section.name}" no es una localidad de ${match.venue?.name}`);
    }
    if (!section.active) {
      throw new BadRequestException(`La localidad "${section.name}" está inactiva`);
    }
  }

  private async ensureSeatsLeft(match: Match, section: VenueSection): Promise<void> {
    const sold = await this.ticketsRepository.countBy({
      match: { id: match.id },
      section: { id: section.id },
      status: TicketStatus.ACTIVE,
    });
    if (sold >= section.capacity) {
      throw new ConflictException(`La localidad "${section.name}" está agotada para este partido`);
    }
  }

  private async countSoldBySection(matchId: number): Promise<Map<number, number>> {
    const rows = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .select('ticket.section_id', 'sectionId')
      .addSelect('COUNT(*)', 'sold')
      .where('ticket.match_id = :matchId', { matchId })
      .andWhere('ticket.status = :status', { status: TicketStatus.ACTIVE })
      .groupBy('ticket.section_id')
      .getRawMany<{ sectionId: number; sold: string }>();
    return new Map(rows.map((row) => [Number(row.sectionId), Number(row.sold)]));
  }

  // Código corto y difícil de adivinar, p. ej. TK-9F3A61C2
  private generateCode(): string {
    return `TK-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
