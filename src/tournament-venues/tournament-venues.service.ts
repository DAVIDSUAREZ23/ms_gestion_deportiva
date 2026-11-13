import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matches/entities/match.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentsService } from '../tournaments/tournaments.service';
import { Venue } from '../venues/entities/venue.entity';
import { VenuesService } from '../venues/venues.service';
import { CreateTournamentVenueDto } from './dto/create-tournament-venue.dto';
import { TournamentVenueResponseDto } from './dto/tournament-venue-response.dto';
import { TournamentVenue } from './entities/tournament-venue.entity';
import { TournamentVenueMapper } from './mappers/tournament-venue.mapper';

const WITH_TOURNAMENT_AND_VENUE = { tournament: true, venue: true } as const;

// Escenario Torneo: escenarios habilitados para los partidos de cada torneo
@Injectable()
export class TournamentVenuesService {
  constructor(
    @InjectRepository(TournamentVenue) private readonly tournamentVenuesRepository: Repository<TournamentVenue>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly tournamentsService: TournamentsService,
    private readonly venuesService: VenuesService,
    private readonly tournamentVenueMapper: TournamentVenueMapper,
  ) {}

  async assign(dto: CreateTournamentVenueDto): Promise<TournamentVenueResponseDto> {
    const tournament = await this.tournamentsService.findActiveOrFail(dto.tournamentId);
    const venue = await this.venuesService.findActiveOrFail(dto.venueId);
    await this.ensureNotAssigned(tournament, venue);
    const saved = await this.tournamentVenuesRepository.save(this.tournamentVenueMapper.toEntity(tournament, venue));
    return this.tournamentVenueMapper.toResponseDto(saved);
  }

  // Retira el escenario del torneo si ningún partido del torneo se juega en él
  async unassign(tournamentId: number, venueId: number): Promise<{ message: string }> {
    const link = await this.tournamentVenuesRepository.findOne({
      where: { tournament: { id: tournamentId }, venue: { id: venueId } },
      relations: WITH_TOURNAMENT_AND_VENUE,
    });
    if (!link) {
      throw new NotFoundException('El escenario no está asignado a ese torneo');
    }
    const inUse = await this.matchesRepository.existsBy({
      venue: { id: venueId },
      phase: { tournament: { id: tournamentId } },
    });
    if (inUse) {
      throw new ConflictException(`"${link.venue.name}" tiene partidos programados en "${link.tournament.name}"`);
    }
    await this.tournamentVenuesRepository.remove(link);
    return { message: `"${link.venue.name}" ya no es escenario de "${link.tournament.name}"` };
  }

  async findByTournament(tournamentId: number): Promise<TournamentVenueResponseDto[]> {
    await this.tournamentsService.findOrFail(tournamentId);
    const links = await this.tournamentVenuesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: WITH_TOURNAMENT_AND_VENUE,
      order: { venue: { name: 'ASC' } },
    });
    return this.tournamentVenueMapper.toResponseDtoList(links);
  }

  // Usado por los partidos: si el torneo tiene escenarios asignados, el partido debe jugarse en uno de ellos
  async ensureVenueAllowed(tournament: Tournament, venue: Venue): Promise<void> {
    const assigned = await this.tournamentVenuesRepository.find({
      where: { tournament: { id: tournament.id } },
      relations: { venue: true },
    });
    if (assigned.length > 0 && !assigned.some((link) => link.venue.id === venue.id)) {
      throw new BadRequestException(`"${venue.name}" no está entre los escenarios del torneo "${tournament.name}"`);
    }
  }

  private async ensureNotAssigned(tournament: Tournament, venue: Venue): Promise<void> {
    const assigned = await this.tournamentVenuesRepository.existsBy({
      tournament: { id: tournament.id },
      venue: { id: venue.id },
    });
    if (assigned) {
      throw new ConflictException(`"${venue.name}" ya es escenario de "${tournament.name}"`);
    }
  }
}
