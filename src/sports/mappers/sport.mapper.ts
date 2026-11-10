import { Injectable } from '@nestjs/common';
import { CreateSportDto } from '../dto/create-sport.dto';
import { SportDetailResponseDto, SportResponseDto, SportSummaryDto } from '../dto/sport-response.dto';
import { UpdateSportDto } from '../dto/update-sport.dto';
import { Sport } from '../entities/sport.entity';

@Injectable()
export class SportMapper {
  toEntity(dto: CreateSportDto, parent: Sport | null): Sport {
    const sport = new Sport();
    sport.name = dto.name;
    sport.description = dto.description ?? null;
    sport.parent = parent;
    return sport;
  }

  // Aplica solo los campos enviados; parent undefined significa "no cambiar el padre"
  mergeEntity(sport: Sport, dto: UpdateSportDto, parent: Sport | null | undefined): Sport {
    if (dto.name !== undefined) sport.name = dto.name;
    if (dto.description !== undefined) sport.description = dto.description;
    if (parent !== undefined) sport.parent = parent;
    return sport;
  }

  toSummaryDto(sport: Sport): SportSummaryDto {
    return { id: sport.id, name: sport.name, active: sport.active };
  }

  toResponseDto(sport: Sport): SportResponseDto {
    return {
      ...this.toSummaryDto(sport),
      description: sport.description,
      parentId: sport.parent?.id ?? null,
      parentName: sport.parent?.name ?? null,
    };
  }

  toResponseDtoList(sports: Sport[]): SportResponseDto[] {
    return sports.map((sport) => this.toResponseDto(sport));
  }

  toDetailResponseDto(sport: Sport): SportDetailResponseDto {
    return {
      ...this.toResponseDto(sport),
      subSports: (sport.subSports ?? []).map((subSport) => this.toSummaryDto(subSport)),
    };
  }
}
