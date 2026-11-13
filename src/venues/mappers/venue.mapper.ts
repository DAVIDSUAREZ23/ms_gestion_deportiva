import { Injectable } from '@nestjs/common';
import { CreateVenueDto } from '../dto/create-venue.dto';
import { UpdateVenueDto } from '../dto/update-venue.dto';
import { VenueResponseDto, VenueSummaryDto } from '../dto/venue-response.dto';
import { Venue } from '../entities/venue.entity';

@Injectable()
export class VenueMapper {
  toEntity(dto: CreateVenueDto): Venue {
    const venue = new Venue();
    venue.name = dto.name;
    venue.city = dto.city ?? null;
    venue.capacity = dto.capacity ?? null;
    return venue;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(venue: Venue, dto: UpdateVenueDto): Venue {
    if (dto.name !== undefined) venue.name = dto.name;
    if (dto.city !== undefined) venue.city = dto.city;
    if (dto.capacity !== undefined) venue.capacity = dto.capacity;
    return venue;
  }

  toSummaryDto(venue: Venue): VenueSummaryDto {
    return { id: venue.id, name: venue.name, city: venue.city };
  }

  toResponseDto(venue: Venue): VenueResponseDto {
    return { ...this.toSummaryDto(venue), capacity: venue.capacity, active: venue.active };
  }

  toResponseDtoList(venues: Venue[]): VenueResponseDto[] {
    return venues.map((venue) => this.toResponseDto(venue));
  }
}
