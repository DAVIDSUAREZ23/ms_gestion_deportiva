import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { MatchAnnotation } from '../match-annotations/entities/match-annotation.entity';
import { MatchAnnotationMapper } from '../match-annotations/mappers/match-annotation.mapper';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { MatchMapper } from '../matches/mappers/match.mapper';
import { MATCH_RELATIONS } from '../matches/matches.service';
import { Phase, PhaseType } from '../phases/entities/phase.entity';
import { PhaseMapper } from '../phases/mappers/phase.mapper';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { TournamentsService } from '../tournaments/tournaments.service';
import {
  OverviewGroupDto,
  OverviewMatchDto,
  OverviewPhaseDto,
  TournamentOverviewResponseDto,
} from './dto/tournament-overview-response.dto';
import { calculateStandings } from './standings.calculator';

// HU-GC-08: estructura y desarrollo de un torneo (fases, grupos con tabla, llaves, partidos y anotaciones)
@Injectable()
export class TournamentOverviewService {
  constructor(
    @InjectRepository(TournamentRegistration) private readonly registrationsRepository: Repository<TournamentRegistration>,
    @InjectRepository(Phase) private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(CompetitionGroup) private readonly groupsRepository: Repository<CompetitionGroup>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectRepository(MatchAnnotation) private readonly annotationsRepository: Repository<MatchAnnotation>,
    private readonly tournamentsService: TournamentsService,
    private readonly tournamentMapper: TournamentMapper,
    private readonly phaseMapper: PhaseMapper,
    private readonly teamMapper: TeamMapper,
    private readonly matchMapper: MatchMapper,
    private readonly annotationMapper: MatchAnnotationMapper,
  ) {}

  async getOverview(tournamentId: number): Promise<TournamentOverviewResponseDto> {
    const tournament = await this.tournamentsService.findOrFail(tournamentId);
    const inTournament = { tournament: { id: tournamentId } };
    const [registrations, phases, groups, matches] = await Promise.all([
      this.registrationsRepository.find({ where: inTournament, relations: { team: true }, order: { team: { name: 'ASC' } } }),
      this.phasesRepository.find({ where: inTournament, relations: { final: true }, order: { order: 'ASC' } }),
      this.groupsRepository.find({
        where: { phase: inTournament },
        relations: { phase: true, groupTeams: { team: true } },
        order: { name: 'ASC' },
      }),
      this.matchesRepository.find({
        where: { phase: inTournament },
        relations: MATCH_RELATIONS,
        order: { bracketPosition: 'ASC', scheduledAt: 'ASC' },
      }),
    ]);
    const overviewMatches = await this.withAnnotations(matches);

    return {
      tournament: this.tournamentMapper.toResponseDto(tournament),
      registeredTeams: registrations.map((registration) => this.teamMapper.toSummaryDto(registration.team)),
      phases: phases.map((phase) => this.buildPhase(phase, groups, overviewMatches)),
    };
  }

  private buildPhase(phase: Phase, groups: CompetitionGroup[], matches: OverviewMatchDto[]): OverviewPhaseDto {
    const phaseMatches = matches.filter((match) => match.phase.id === phase.id);
    const phaseGroups =
      phase.type === PhaseType.GROUP_STAGE
        ? groups.filter((group) => group.phase.id === phase.id).map((group) => this.buildGroup(group, phaseMatches))
        : [];
    const playedMatches = phaseMatches.filter((match) => match.hasResult).length;

    return {
      ...this.phaseMapper.toSummaryDto(phase),
      round: phase.final?.round ?? null,
      groups: phaseGroups,
      matches: phaseMatches,
      playedMatches,
      pendingMatches: phaseMatches.filter((match) => match.status === MatchStatus.SCHEDULED).length,
    };
  }

  private buildGroup(group: CompetitionGroup, phaseMatches: OverviewMatchDto[]): OverviewGroupDto {
    const teams = group.groupTeams
      .map((groupTeam) => this.teamMapper.toSummaryDto(groupTeam.team))
      .sort((a, b) => a.name.localeCompare(b.name));
    const groupMatches = phaseMatches.filter((match) => match.group?.id === group.id);
    const finished = groupMatches
      .filter((match) => match.hasResult)
      .map((match) => ({
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        homeScore: match.homeScore ?? 0,
        awayScore: match.awayScore ?? 0,
      }));

    return {
      id: group.id,
      name: group.name,
      teams,
      standings: calculateStandings(teams, finished),
      matches: groupMatches,
    };
  }

  // Agrega a cada partido sus anotaciones con una sola consulta
  private async withAnnotations(matches: Match[]): Promise<OverviewMatchDto[]> {
    const ids = matches.map((match) => match.id);
    const annotations = ids.length
      ? await this.annotationsRepository
          .createQueryBuilder('annotation')
          .leftJoinAndSelect('annotation.match', 'match')
          .leftJoinAndSelect('annotation.player', 'player')
          .leftJoinAndSelect('annotation.team', 'team')
          .where('match.id IN (:...ids)', { ids })
          .orderBy('annotation.minute', 'ASC')
          .getMany()
      : [];

    return matches.map((match) => ({
      ...this.matchMapper.toResponseDto(match),
      annotations: this.annotationMapper.toResponseDtoList(
        annotations.filter((annotation) => annotation.match.id === match.id),
      ),
    }));
  }
}
