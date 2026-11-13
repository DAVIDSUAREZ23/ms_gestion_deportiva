import { Injectable } from '@nestjs/common';
import { Match } from '../../matches/entities/match.entity';
import { Player } from '../../players/entities/player.entity';
import { PlayerMapper } from '../../players/mappers/player.mapper';
import { Team } from '../../teams/entities/team.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { MatchAnnotationResponseDto } from '../dto/match-annotation-response.dto';
import { MatchAnnotation } from '../entities/match-annotation.entity';

@Injectable()
export class MatchAnnotationMapper {
  constructor(
    private readonly playerMapper: PlayerMapper,
    private readonly teamMapper: TeamMapper,
  ) {}

  toEntity(match: Match, player: Player, team: Team, minute: number, notes: string | null): MatchAnnotation {
    const annotation = new MatchAnnotation();
    annotation.match = match;
    annotation.player = player;
    annotation.team = team;
    annotation.minute = minute;
    annotation.notes = notes;
    return annotation;
  }

  toResponseDto(annotation: MatchAnnotation): MatchAnnotationResponseDto {
    return {
      id: annotation.id,
      matchId: annotation.match.id,
      player: this.playerMapper.toSummaryDto(annotation.player),
      team: this.teamMapper.toSummaryDto(annotation.team),
      minute: annotation.minute,
      notes: annotation.notes,
    };
  }

  toResponseDtoList(annotations: MatchAnnotation[]): MatchAnnotationResponseDto[] {
    return annotations.map((annotation) => this.toResponseDto(annotation));
  }
}
