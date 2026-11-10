import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from '../dto/create-team.dto';
import { TeamResponseDto, TeamSummaryDto } from '../dto/team-response.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { Team } from '../entities/team.entity';

@Injectable()
export class TeamMapper {
  toEntity(dto: CreateTeamDto): Team {
    const team = new Team();
    team.name = dto.name;
    team.city = dto.city ?? null;
    team.foundedAt = dto.foundedAt ?? null;
    team.description = dto.description ?? null;
    return team;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(team: Team, dto: UpdateTeamDto): Team {
    if (dto.name !== undefined) team.name = dto.name;
    if (dto.city !== undefined) team.city = dto.city;
    if (dto.foundedAt !== undefined) team.foundedAt = dto.foundedAt;
    if (dto.description !== undefined) team.description = dto.description;
    return team;
  }

  toSummaryDto(team: Team): TeamSummaryDto {
    return { id: team.id, name: team.name, active: team.active };
  }

  toResponseDto(team: Team): TeamResponseDto {
    return {
      ...this.toSummaryDto(team),
      city: team.city,
      foundedAt: team.foundedAt,
      description: team.description,
    };
  }

  toResponseDtoList(teams: Team[]): TeamResponseDto[] {
    return teams.map((team) => this.toResponseDto(team));
  }
}
