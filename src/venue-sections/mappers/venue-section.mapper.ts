import { Injectable } from '@nestjs/common';
import { Venue } from '../../venues/entities/venue.entity';
import { VenueMapper } from '../../venues/mappers/venue.mapper';
import { CreateVenueSectionDto } from '../dto/create-venue-section.dto';
import { UpdateVenueSectionDto } from '../dto/update-venue-section.dto';
import { VenueSectionResponseDto, VenueSectionSummaryDto } from '../dto/venue-section-response.dto';
import { VenueSection } from '../entities/venue-section.entity';

@Injectable()
export class VenueSectionMapper {
  constructor(private readonly venueMapper: VenueMapper) {}

  toEntity(dto: CreateVenueSectionDto, venue: Venue): VenueSection {
    const section = new VenueSection();
    section.venue = venue;
    section.name = dto.name;
    section.capacity = dto.capacity;
    section.price = dto.price;
    return section;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(section: VenueSection, dto: UpdateVenueSectionDto): VenueSection {
    if (dto.name !== undefined) section.name = dto.name;
    if (dto.capacity !== undefined) section.capacity = dto.capacity;
    if (dto.price !== undefined) section.price = dto.price;
    return section;
  }

  toSummaryDto(section: VenueSection): VenueSectionSummaryDto {
    return { id: section.id, name: section.name, price: section.price };
  }

  toResponseDto(section: VenueSection): VenueSectionResponseDto {
    return {
      ...this.toSummaryDto(section),
      venue: this.venueMapper.toSummaryDto(section.venue),
      capacity: section.capacity,
      active: section.active,
    };
  }

  toResponseDtoList(sections: VenueSection[]): VenueSectionResponseDto[] {
    return sections.map((section) => this.toResponseDto(section));
  }
}
