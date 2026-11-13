import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { VenuesModule } from '../venues/venues.module';
import { VenueSection } from './entities/venue-section.entity';
import { VenueSectionMapper } from './mappers/venue-section.mapper';
import { VenueSectionsController } from './venue-sections.controller';
import { VenueSectionsService } from './venue-sections.service';

@Module({
  imports: [TypeOrmModule.forFeature([VenueSection, Ticket]), VenuesModule],
  controllers: [VenueSectionsController],
  providers: [VenueSectionsService, VenueSectionMapper],
  exports: [VenueSectionsService, VenueSectionMapper],
})
export class VenueSectionsModule {}
