import { Injectable } from '@nestjs/common';
import { Sport } from '../../sports/entities/sport.entity';
import { SportMapper } from '../../sports/mappers/sport.mapper';
import { Team } from '../../teams/entities/team.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { TeamSportResponseDto } from '../dto/team-sport-response.dto';
import { TeamSport } from '../entities/team-sport.entity';

@Injectable()
export class TeamSportMapper {
  constructor(
    private readonly teamMapper: TeamMapper,
    private readonly sportMapper: SportMapper,
  ) {}

  toEntity(team: Team, sport: Sport): TeamSport {
    const teamSport = new TeamSport();
    teamSport.team = team;
    teamSport.sport = sport;
    return teamSport;
  }

  toResponseDto(teamSport: TeamSport): TeamSportResponseDto {
    return {
      id: teamSport.id,
      team: this.teamMapper.toSummaryDto(teamSport.team),
      sport: this.sportMapper.toSummaryDto(teamSport.sport),
    };
  }

  toResponseDtoList(teamSports: TeamSport[]): TeamSportResponseDto[] {
    return teamSports.map((teamSport) => this.toResponseDto(teamSport));
  }
}
