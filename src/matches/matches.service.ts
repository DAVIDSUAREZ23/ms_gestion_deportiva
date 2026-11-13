import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { toIsoDate } from '../common/utils/date.utils';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { GroupsService } from '../groups/groups.service';
import { MatchAnnotation } from '../match-annotations/entities/match-annotation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Phase, PhaseType } from '../phases/entities/phase.entity';
import { PhasesService } from '../phases/phases.service';
import { Team } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { TournamentRegistrationsService } from '../tournament-registrations/tournament-registrations.service';
import { TournamentVenuesService } from '../tournament-venues/tournament-venues.service';
import { Venue } from '../venues/entities/venue.entity';
import { VenuesService } from '../venues/venues.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { RegisterResultDto } from './dto/register-result.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchStatus } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';

export const MATCH_RELATIONS = {
  phase: { tournament: { sport: true } },
  group: true,
  homeTeam: true,
  awayTeam: true,
  venue: true,
} as const;

// Datos ya validados con los que se programa un partido
type MatchPlan = {
  phase: Phase;
  group: CompetitionGroup | null;
  homeTeam: Team;
  awayTeam: Team;
  scheduledAt: Date;
  venue: Venue | null;
  bracketPosition: number | null;
};

// HU-GC-06 y resultados de HU-GC-07: partidos de cada fase
@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectRepository(MatchAnnotation) private readonly annotationsRepository: Repository<MatchAnnotation>,
    private readonly phasesService: PhasesService,
    private readonly groupsService: GroupsService,
    private readonly teamsService: TeamsService,
    private readonly venuesService: VenuesService,
    private readonly registrationsService: TournamentRegistrationsService,
    private readonly tournamentVenuesService: TournamentVenuesService,
    private readonly notificationsService: NotificationsService,
    private readonly matchMapper: MatchMapper,
  ) {}

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    const plan = await this.resolvePlan(dto);
    const saved = await this.matchesRepository.save(Object.assign(new Match(), plan));
    await this.notificationsService.notifyMatchCreated({
      matchId: saved.id,
      homeTeam: plan.homeTeam.name,
      awayTeam: plan.awayTeam.name,
    });
    return this.findOne(saved.id);
  }

  async findByPhase(phaseId: number): Promise<MatchResponseDto[]> {
    await this.phasesService.findOrFail(phaseId);
    const matches = await this.matchesRepository.find({
      where: { phase: { id: phaseId } },
      relations: MATCH_RELATIONS,
      order: { bracketPosition: 'ASC', scheduledAt: 'ASC' },
    });
    return this.matchMapper.toResponseDtoList(matches);
  }

  async findOne(id: number): Promise<MatchResponseDto> {
    return this.matchMapper.toResponseDto(await this.findOrFail(id));
  }

  // Solo se edita un partido programado; cambiar equipos exige que no tenga anotaciones
  async update(id: number, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const match = await this.findOrFail(id);
    this.ensureIsScheduled(match);
    if (this.changesTeams(match, dto) && (await this.hasAnnotations(id))) {
      throw new ConflictException('No se pueden cambiar los equipos de un partido que ya tiene anotaciones');
    }
    const plan = await this.resolvePlan(
      {
        phaseId: match.phase.id,
        groupId: dto.groupId !== undefined ? dto.groupId : (match.group?.id ?? null),
        homeTeamId: dto.homeTeamId ?? match.homeTeam.id,
        awayTeamId: dto.awayTeamId ?? match.awayTeam.id,
        scheduledAt: dto.scheduledAt ?? new Date(match.scheduledAt).toISOString(),
        venueId: dto.venueId !== undefined ? dto.venueId : (match.venue?.id ?? null),
        bracketPosition: dto.bracketPosition !== undefined ? dto.bracketPosition : match.bracketPosition,
      },
      id,
    );
    await this.matchesRepository.save(Object.assign(match, plan));
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const match = await this.findOrFail(id);
    if (match.status === MatchStatus.FINISHED || (await this.hasAnnotations(id))) {
      throw new ConflictException('No se puede eliminar un partido con resultado o anotaciones registradas');
    }
    await this.matchesRepository.remove(match);
    return { message: `Partido ${match.homeTeam.name} vs ${match.awayTeam.name} eliminado correctamente` };
  }

  // Registra o corrige el resultado oficial; el partido queda finalizado
  async registerResult(id: number, dto: RegisterResultDto): Promise<MatchResponseDto> {
    const match = await this.findOrFail(id);
    if (match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('No se puede registrar el resultado de un partido cancelado');
    }
    if (match.phase.type === PhaseType.KNOCKOUT && dto.homeScore === dto.awayScore) {
      throw new BadRequestException('En una fase final el partido debe tener un ganador; registra el marcador definitivo');
    }
    Object.assign(match, { homeScore: dto.homeScore, awayScore: dto.awayScore, status: MatchStatus.FINISHED });
    await this.matchesRepository.save(match);
    await this.notificationsService.notifyMatchResult({
      matchId: id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: dto.homeScore,
      awayScore: dto.awayScore,
      scorers: await this.scorerNames(id),
    });
    return this.findOne(id);
  }

  async cancel(id: number): Promise<MatchResponseDto> {
    const match = await this.findOrFail(id);
    this.ensureIsScheduled(match);
    match.status = MatchStatus.CANCELLED;
    await this.matchesRepository.save(match);
    return this.findOne(id);
  }

  // Usado por las anotaciones
  async findOrFail(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({ where: { id }, relations: MATCH_RELATIONS });
    if (!match) {
      throw new NotFoundException(`Partido con id ${id} no encontrado`);
    }
    return match;
  }

  // Valida todas las reglas de programación y devuelve las entidades listas para guardar
  private async resolvePlan(input: CreateMatchDto, excludeId?: number): Promise<MatchPlan> {
    const phase = await this.phasesService.findOrFail(input.phaseId);
    if (!phase.tournament.active) {
      throw new BadRequestException(`El torneo "${phase.tournament.name}" está inactivo`);
    }
    const [homeTeam, awayTeam] = await this.resolveTeams(phase, input.homeTeamId, input.awayTeamId);
    const scheduledAt = this.resolveSchedule(phase, input.scheduledAt);
    const venue = input.venueId ? await this.resolveVenue(phase, input.venueId) : null;

    if (phase.type === PhaseType.GROUP_STAGE) {
      const group = await this.resolveGroup(phase, input, homeTeam, awayTeam);
      return { phase, group, homeTeam, awayTeam, scheduledAt, venue, bracketPosition: null };
    }
    const bracketPosition = await this.resolveBracketPosition(phase, input, excludeId);
    return { phase, group: null, homeTeam, awayTeam, scheduledAt, venue, bracketPosition };
  }

  // Ambos equipos deben ser distintos, estar activos e inscritos en el torneo
  private async resolveTeams(phase: Phase, homeTeamId: number, awayTeamId: number): Promise<[Team, Team]> {
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException('Un equipo no puede jugar contra sí mismo');
    }
    const teams = await Promise.all([
      this.teamsService.findActiveOrFail(homeTeamId),
      this.teamsService.findActiveOrFail(awayTeamId),
    ]);
    for (const team of teams) {
      await this.registrationsService.ensureRegistered(phase.tournament, team);
    }
    return teams;
  }

  // El escenario debe estar activo y, si el torneo tiene escenarios asignados, ser uno de ellos
  private async resolveVenue(phase: Phase, venueId: number): Promise<Venue> {
    const venue = await this.venuesService.findActiveOrFail(venueId);
    await this.tournamentVenuesService.ensureVenueAllowed(phase.tournament, venue);
    return venue;
  }

  private resolveSchedule(phase: Phase, scheduledAt: string): Date {
    const date = new Date(scheduledAt);
    const day = toIsoDate(date);
    const { startDate, endDate, name } = phase.tournament;
    if (day < startDate || day > endDate) {
      throw new BadRequestException(`La fecha del partido debe estar entre ${startDate} y ${endDate} (fechas de "${name}")`);
    }
    return date;
  }

  // En fase de grupos el partido pertenece a un grupo de la fase y ambos equipos deben estar en él
  private async resolveGroup(phase: Phase, input: CreateMatchDto, home: Team, away: Team): Promise<CompetitionGroup> {
    if (!input.groupId) {
      throw new BadRequestException('En una fase de grupos debes indicar el grupo del partido');
    }
    if (input.bracketPosition) {
      throw new BadRequestException('La posición en la llave solo aplica a partidos de fase final');
    }
    const group = await this.groupsService.findOrFail(input.groupId);
    if (group.phase.id !== phase.id) {
      throw new BadRequestException(`El grupo "${group.name}" no pertenece a la fase "${phase.name}"`);
    }
    const memberIds = group.groupTeams.map((groupTeam) => groupTeam.team.id);
    const outsider = [home, away].find((team) => !memberIds.includes(team.id));
    if (outsider) {
      throw new BadRequestException(`"${outsider.name}" no pertenece al grupo "${group.name}"`);
    }
    return group;
  }

  // En fase final el partido ocupa una posición única dentro de las llaves
  private async resolveBracketPosition(phase: Phase, input: CreateMatchDto, excludeId?: number): Promise<number> {
    if (input.groupId) {
      throw new BadRequestException('Los partidos de una fase final no pertenecen a un grupo');
    }
    if (!input.bracketPosition) {
      throw new BadRequestException('En una fase final debes indicar la posición del partido en la llave');
    }
    const taken = await this.matchesRepository.existsBy({
      phase: { id: phase.id },
      bracketPosition: input.bracketPosition,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`La posición ${input.bracketPosition} de la llave ya tiene un partido en "${phase.name}"`);
    }
    return input.bracketPosition;
  }

  private ensureIsScheduled(match: Match): void {
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Solo se puede modificar o cancelar un partido programado');
    }
  }

  private changesTeams(match: Match, dto: UpdateMatchDto): boolean {
    return (
      (dto.homeTeamId !== undefined && dto.homeTeamId !== match.homeTeam.id) ||
      (dto.awayTeamId !== undefined && dto.awayTeamId !== match.awayTeam.id)
    );
  }

  private hasAnnotations(matchId: number): Promise<boolean> {
    return this.annotationsRepository.existsBy({ match: { id: matchId } });
  }

  private async scorerNames(matchId: number): Promise<string[]> {
    const annotations = await this.annotationsRepository.find({
      where: { match: { id: matchId } },
      relations: { player: true },
      order: { minute: 'ASC' },
    });
    return annotations.map(({ player, minute }) => `${player.firstName} ${player.lastName} ${minute}'`);
  }
}
