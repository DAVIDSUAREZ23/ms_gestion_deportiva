import { BadRequestException, ConflictException } from '@nestjs/common';
import { buildTournament } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Match } from '../matches/entities/match.entity';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { TournamentsService } from '../tournaments/tournaments.service';
import { Venue } from '../venues/entities/venue.entity';
import { VenueMapper } from '../venues/mappers/venue.mapper';
import { VenuesService } from '../venues/venues.service';
import { TournamentVenue } from './entities/tournament-venue.entity';
import { TournamentVenueMapper } from './mappers/tournament-venue.mapper';
import { TournamentVenuesService } from './tournament-venues.service';

const TOURNAMENT = buildTournament();
const PALOGRANDE = Object.assign(new Venue(), { id: 1, name: 'Palogrande', city: 'Manizales', capacity: 36000, active: true });
const OTHER = Object.assign(new Venue(), { id: 2, name: 'Manuel Murillo Toro', city: 'Ibagué', capacity: 28000, active: true });

describe('TournamentVenuesService (Escenario Torneo)', () => {
  let tournamentVenuesRepository: RepositoryMock<TournamentVenue>;
  let matchesRepository: RepositoryMock<Match>;
  let service: TournamentVenuesService;

  beforeEach(() => {
    tournamentVenuesRepository = createRepositoryMock<TournamentVenue>();
    matchesRepository = createRepositoryMock<Match>();
    const tournamentsService = { findActiveOrFail: jest.fn().mockResolvedValue(TOURNAMENT), findOrFail: jest.fn().mockResolvedValue(TOURNAMENT) };
    const venuesService = { findActiveOrFail: jest.fn().mockResolvedValue(PALOGRANDE) };
    service = new TournamentVenuesService(
      asRepository(tournamentVenuesRepository),
      asRepository(matchesRepository),
      tournamentsService as unknown as TournamentsService,
      venuesService as unknown as VenuesService,
      new TournamentVenueMapper(new TournamentMapper(new SportMapper()), new VenueMapper()),
    );
  });

  it('assign asigna el escenario al torneo', async () => {
    const result = await service.assign({ tournamentId: TOURNAMENT.id, venueId: PALOGRANDE.id });

    expect(result.venue.name).toBe('Palogrande');
  });

  it('assign repetido responde conflicto', async () => {
    tournamentVenuesRepository.existsBy.mockResolvedValue(true);

    await expect(service.assign({ tournamentId: TOURNAMENT.id, venueId: PALOGRANDE.id })).rejects.toThrow(ConflictException);
  });

  it('unassign de un escenario con partidos del torneo responde conflicto', async () => {
    tournamentVenuesRepository.findOne.mockResolvedValue(Object.assign(new TournamentVenue(), { id: 3, tournament: TOURNAMENT, venue: PALOGRANDE }));
    matchesRepository.existsBy.mockResolvedValue(true);

    await expect(service.unassign(TOURNAMENT.id, PALOGRANDE.id)).rejects.toThrow(ConflictException);
    expect(tournamentVenuesRepository.remove).not.toHaveBeenCalled();
  });

  it('ensureVenueAllowed permite cualquier escenario si el torneo no tiene escenarios asignados', async () => {
    tournamentVenuesRepository.find.mockResolvedValue([]);

    await expect(service.ensureVenueAllowed(TOURNAMENT, OTHER)).resolves.toBeUndefined();
  });

  it('ensureVenueAllowed rechaza un escenario que no está entre los del torneo', async () => {
    tournamentVenuesRepository.find.mockResolvedValue([Object.assign(new TournamentVenue(), { venue: PALOGRANDE })]);

    await expect(service.ensureVenueAllowed(TOURNAMENT, OTHER)).rejects.toThrow(BadRequestException);
  });
});
