import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { Match } from '../matches/entities/match.entity';
import { MatchesModule } from '../matches/matches.module';
import { TeamsModule } from '../teams/teams.module';
import { VenueSection } from '../venue-sections/entities/venue-section.entity';
import { VenueSectionsModule } from '../venue-sections/venue-sections.module';
import { VenuesModule } from '../venues/venues.module';
import { Ticket } from './entities/ticket.entity';
import { TicketMapper } from './mappers/ticket.mapper';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Match, VenueSection]),
    FansModule,
    MatchesModule,
    VenueSectionsModule,
    TeamsModule,
    VenuesModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketMapper],
})
export class TicketsModule {}
