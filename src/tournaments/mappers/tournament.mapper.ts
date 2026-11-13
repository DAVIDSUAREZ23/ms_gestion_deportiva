import { Injectable } from '@nestjs/common';
import { Sport } from '../../sports/entities/sport.entity';
import { SportMapper } from '../../sports/mappers/sport.mapper';
import { CreateTournamentDto } from '../dto/create-tournament.dto';
import { TournamentResponseDto, TournamentSummaryDto } from '../dto/tournament-response.dto';
import { UpdateTournamentDto } from '../dto/update-tournament.dto';
import { Tournament } from '../entities/tournament.entity';
import { stageOf } from '../tournament.rules';

@Injectable()
export class TournamentMapper {
  constructor(private readonly sportMapper: SportMapper) {}

  toEntity(dto: CreateTournamentDto, sport: Sport): Tournament {
    const tournament = new Tournament();
    tournament.name = dto.name;
    tournament.description = dto.description ?? null;
    tournament.sport = sport;
    tournament.registrationDeadline = dto.registrationDeadline;
    tournament.startDate = dto.startDate;
    tournament.endDate = dto.endDate;
    return tournament;
  }

  // Aplica solo los campos enviados; sport undefined significa "no cambiar el deporte"
  mergeEntity(tournament: Tournament, dto: UpdateTournamentDto, sport?: Sport): Tournament {
    if (dto.name !== undefined) tournament.name = dto.name;
    if (dto.description !== undefined) tournament.description = dto.description;
    if (dto.registrationDeadline !== undefined) tournament.registrationDeadline = dto.registrationDeadline;
    if (dto.startDate !== undefined) tournament.startDate = dto.startDate;
    if (dto.endDate !== undefined) tournament.endDate = dto.endDate;
    if (sport) tournament.sport = sport;
    return tournament;
  }

  toSummaryDto(tournament: Tournament): TournamentSummaryDto {
    return { id: tournament.id, name: tournament.name, stage: stageOf(tournament) };
  }

  toResponseDto(tournament: Tournament): TournamentResponseDto {
    return {
      ...this.toSummaryDto(tournament),
      description: tournament.description,
      sport: this.sportMapper.toSummaryDto(tournament.sport),
      registrationDeadline: tournament.registrationDeadline,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      active: tournament.active,
    };
  }

  toResponseDtoList(tournaments: Tournament[]): TournamentResponseDto[] {
    return tournaments.map((tournament) => this.toResponseDto(tournament));
  }
}
