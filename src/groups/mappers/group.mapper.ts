import { Injectable } from '@nestjs/common';
import { Phase } from '../../phases/entities/phase.entity';
import { PhaseMapper } from '../../phases/mappers/phase.mapper';
import { Team } from '../../teams/entities/team.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupResponseDto, GroupSummaryDto } from '../dto/group-response.dto';
import { CompetitionGroup } from '../entities/competition-group.entity';
import { GroupTeam } from '../entities/group-team.entity';

@Injectable()
export class GroupMapper {
  constructor(
    private readonly phaseMapper: PhaseMapper,
    private readonly teamMapper: TeamMapper,
  ) {}

  toEntity(dto: CreateGroupDto, phase: Phase): CompetitionGroup {
    const group = new CompetitionGroup();
    group.phase = phase;
    group.name = dto.name;
    return group;
  }

  toGroupTeamEntity(group: CompetitionGroup, team: Team): GroupTeam {
    const groupTeam = new GroupTeam();
    groupTeam.group = group;
    groupTeam.team = team;
    return groupTeam;
  }

  toSummaryDto(group: CompetitionGroup): GroupSummaryDto {
    return { id: group.id, name: group.name };
  }

  // Requiere el grupo con su fase y sus equipos cargados
  toResponseDto(group: CompetitionGroup): GroupResponseDto {
    const teams = (group.groupTeams ?? [])
      .map((groupTeam) => this.teamMapper.toSummaryDto(groupTeam.team))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { ...this.toSummaryDto(group), phase: this.phaseMapper.toSummaryDto(group.phase), teams };
  }

  toResponseDtoList(groups: CompetitionGroup[]): GroupResponseDto[] {
    return groups.map((group) => this.toResponseDto(group));
  }
}
