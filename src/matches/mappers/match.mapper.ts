import { Injectable } from '@nestjs/common';
import { GroupMapper } from '../../groups/mappers/group.mapper';
import { PhaseMapper } from '../../phases/mappers/phase.mapper';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { VenueMapper } from '../../venues/mappers/venue.mapper';
import { MatchResponseDto } from '../dto/match-response.dto';
import { Match, MatchStatus } from '../entities/match.entity';

@Injectable()
export class MatchMapper {
  constructor(
    private readonly phaseMapper: PhaseMapper,
    private readonly groupMapper: GroupMapper,
    private readonly teamMapper: TeamMapper,
    private readonly venueMapper: VenueMapper,
  ) {}

  // Requiere el partido con fase, grupo, equipos y escenario cargados
  toResponseDto(match: Match): MatchResponseDto {
    return {
      id: match.id,
      phase: this.phaseMapper.toSummaryDto(match.phase),
      group: match.group ? this.groupMapper.toSummaryDto(match.group) : null,
      homeTeam: this.teamMapper.toSummaryDto(match.homeTeam),
      awayTeam: this.teamMapper.toSummaryDto(match.awayTeam),
      scheduledAt: new Date(match.scheduledAt).toISOString(),
      venue: match.venue ? this.venueMapper.toSummaryDto(match.venue) : null,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      bracketPosition: match.bracketPosition,
      hasResult: match.status === MatchStatus.FINISHED,
    };
  }

  toResponseDtoList(matches: Match[]): MatchResponseDto[] {
    return matches.map((match) => this.toResponseDto(match));
  }
}
