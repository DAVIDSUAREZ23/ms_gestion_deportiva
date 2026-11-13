import { Injectable } from '@nestjs/common';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { TournamentMapper } from '../../tournaments/mappers/tournament.mapper';
import { Venue } from '../../venues/entities/venue.entity';
import { VenueMapper } from '../../venues/mappers/venue.mapper';
import { TournamentVenueResponseDto } from '../dto/tournament-venue-response.dto';
import { TournamentVenue } from '../entities/tournament-venue.entity';

@Injectable()
export class TournamentVenueMapper {
  constructor(
    private readonly tournamentMapper: TournamentMapper,
    private readonly venueMapper: VenueMapper,
  ) {}

  toEntity(tournament: Tournament, venue: Venue): TournamentVenue {
    const tournamentVenue = new TournamentVenue();
    tournamentVenue.tournament = tournament;
    tournamentVenue.venue = venue;
    return tournamentVenue;
  }

  toResponseDto(tournamentVenue: TournamentVenue): TournamentVenueResponseDto {
    return {
      id: tournamentVenue.id,
      tournament: this.tournamentMapper.toSummaryDto(tournamentVenue.tournament),
      venue: this.venueMapper.toResponseDto(tournamentVenue.venue),
    };
  }

  toResponseDtoList(tournamentVenues: TournamentVenue[]): TournamentVenueResponseDto[] {
    return tournamentVenues.map((tournamentVenue) => this.toResponseDto(tournamentVenue));
  }
}
