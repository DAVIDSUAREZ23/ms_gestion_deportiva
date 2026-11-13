import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { Venue } from './entities/venue.entity';
import { VenueMapper } from './mappers/venue.mapper';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venue, Match])],
  controllers: [VenuesController],
  providers: [VenuesService, VenueMapper],
  exports: [VenuesService, VenueMapper],
})
export class VenuesModule {}
