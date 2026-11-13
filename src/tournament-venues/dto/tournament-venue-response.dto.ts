import { TournamentSummaryDto } from '../../tournaments/dto/tournament-response.dto';
import { VenueResponseDto } from '../../venues/dto/venue-response.dto';

export class TournamentVenueResponseDto {
  id!: number;
  tournament!: TournamentSummaryDto;
  venue!: VenueResponseDto;
}
