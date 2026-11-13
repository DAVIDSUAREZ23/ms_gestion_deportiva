import { Injectable } from '@nestjs/common';
import { Team } from '../../teams/entities/team.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { TournamentMapper } from '../../tournaments/mappers/tournament.mapper';
import { TournamentRegistrationResponseDto } from '../dto/tournament-registration-response.dto';
import { TournamentRegistration } from '../entities/tournament-registration.entity';

@Injectable()
export class TournamentRegistrationMapper {
  constructor(
    private readonly tournamentMapper: TournamentMapper,
    private readonly teamMapper: TeamMapper,
  ) {}

  toEntity(tournament: Tournament, team: Team): TournamentRegistration {
    const registration = new TournamentRegistration();
    registration.tournament = tournament;
    registration.team = team;
    return registration;
  }

  toResponseDto(registration: TournamentRegistration): TournamentRegistrationResponseDto {
    return {
      id: registration.id,
      tournament: this.tournamentMapper.toSummaryDto(registration.tournament),
      team: this.teamMapper.toSummaryDto(registration.team),
      registeredAt: registration.registeredAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  toResponseDtoList(registrations: TournamentRegistration[]): TournamentRegistrationResponseDto[] {
    return registrations.map((registration) => this.toResponseDto(registration));
  }
}
