import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { buildMatch, buildPhase } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Fan } from '../fans/entities/fan.entity';
import { FansService } from '../fans/fans.service';
import { FanMapper } from '../fans/mappers/fan.mapper';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { PhaseType } from '../phases/entities/phase.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { VenueSection } from '../venue-sections/entities/venue-section.entity';
import { VenueSectionMapper } from '../venue-sections/mappers/venue-section.mapper';
import { VenueSectionsService } from '../venue-sections/venue-sections.service';
import { Venue } from '../venues/entities/venue.entity';
import { VenueMapper } from '../venues/mappers/venue.mapper';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketMapper } from './mappers/ticket.mapper';
import { TicketsService } from './tickets.service';

const VENUE = Object.assign(new Venue(), { id: 1, name: 'Palogrande', city: 'Manizales', active: true });
const OTHER_VENUE = Object.assign(new Venue(), { id: 2, name: 'Otro', city: null, active: true });
const SECTION = Object.assign(new VenueSection(), { id: 3, name: 'Oriental', capacity: 2, price: 50000, active: true, venue: VENUE });
const FAN = Object.assign(new Fan(), { id: 4, userId: 7, displayName: 'Ana', email: 'ana@correo.com', active: true });
const PHASE = buildPhase(PhaseType.KNOCKOUT);
const UPCOMING = buildMatch(PHASE, { venue: VENUE, scheduledAt: new Date('2999-02-10T15:00:00') });

describe('TicketsService (Boleto)', () => {
  let ticketsRepository: RepositoryMock<Ticket>;
  let matchesService: { findOrFail: jest.Mock };
  let sectionsService: { findOrFail: jest.Mock };
  let service: TicketsService;

  beforeEach(() => {
    ticketsRepository = createRepositoryMock<Ticket>();
    (ticketsRepository as unknown as { countBy: jest.Mock }).countBy = jest.fn().mockResolvedValue(0);
    matchesService = { findOrFail: jest.fn().mockResolvedValue(UPCOMING) };
    sectionsService = { findOrFail: jest.fn().mockResolvedValue(SECTION) };
    const fansService = { findActiveByUserOrFail: jest.fn().mockResolvedValue(FAN) };
    const venueMapper = new VenueMapper();
    service = new TicketsService(
      asRepository(ticketsRepository),
      asRepository(createRepositoryMock<Match>()),
      asRepository(createRepositoryMock<VenueSection>()),
      fansService as unknown as FansService,
      matchesService as unknown as MatchesService,
      sectionsService as unknown as VenueSectionsService,
      new VenueSectionMapper(venueMapper),
      new TicketMapper(new TeamMapper(), venueMapper, new VenueSectionMapper(venueMapper), new FanMapper(new TeamMapper())),
    );
  });

  it('buy emite un boleto con código y el precio vigente de la localidad', async () => {
    const ticket = await service.buy(7, { matchId: UPCOMING.id, sectionId: SECTION.id });

    expect(ticket.code).toMatch(/^TK-[0-9A-F]{8}$/);
    expect(ticket.price).toBe(50000);
    expect(ticket.status).toBe(TicketStatus.ACTIVE);
  });

  it('buy con la localidad agotada responde conflicto', async () => {
    (ticketsRepository as unknown as { countBy: jest.Mock }).countBy.mockResolvedValue(2);

    await expect(service.buy(7, { matchId: UPCOMING.id, sectionId: SECTION.id })).rejects.toThrow(ConflictException);
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('buy de una localidad de otro escenario responde solicitud inválida', async () => {
    sectionsService.findOrFail.mockResolvedValue({ ...SECTION, venue: OTHER_VENUE });

    await expect(service.buy(7, { matchId: UPCOMING.id, sectionId: SECTION.id })).rejects.toThrow(BadRequestException);
  });

  it('buy para un partido finalizado responde solicitud inválida', async () => {
    matchesService.findOrFail.mockResolvedValue(buildMatch(PHASE, { venue: VENUE, status: MatchStatus.FINISHED }));

    await expect(service.buy(7, { matchId: UPCOMING.id, sectionId: SECTION.id })).rejects.toThrow(BadRequestException);
  });

  it('cancelMine marca el boleto como cancelado y lo conserva', async () => {
    const ticket = Object.assign(new Ticket(), { id: 9, code: 'TK-1', match: UPCOMING, section: SECTION, price: 50000, status: TicketStatus.ACTIVE, cancelledAt: null });
    ticketsRepository.findOne.mockResolvedValue(ticket);

    const result = await service.cancelMine(7, 9);

    expect(result.status).toBe(TicketStatus.CANCELLED);
    expect(result.cancelledAt).not.toBeNull();
    expect(ticketsRepository.remove).not.toHaveBeenCalled();
  });

  it('cancelMine de un boleto ajeno o inexistente responde no encontrado', async () => {
    ticketsRepository.findOne.mockResolvedValue(null);

    await expect(service.cancelMine(7, 99)).rejects.toThrow(NotFoundException);
  });
});
