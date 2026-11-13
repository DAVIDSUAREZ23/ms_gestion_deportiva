import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { VenuesModule } from '../venues/venues.module';
import { TournamentVenue } from './entities/tournament-venue.entity';
import { TournamentVenueMapper } from './mappers/tournament-venue.mapper';
import { TournamentVenuesController } from './tournament-venues.controller';
import { TournamentVenuesService } from './tournament-venues.service';

@Module({
  imports: [TypeOrmModule.forFeature([TournamentVenue, Match]), TournamentsModule, VenuesModule],
  controllers: [TournamentVenuesController],
  providers: [TournamentVenuesService, TournamentVenueMapper],
  exports: [TournamentVenuesService],
})
export class TournamentVenuesModule {}
