import { BadRequestException, ConflictException } from '@nestjs/common';
import { AWAY, buildGroup, buildMatch, buildPhase, HOME, OUTSIDER } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { GroupMapper } from '../groups/mappers/group.mapper';
import { GroupsService } from '../groups/groups.service';
import { MatchAnnotation } from '../match-annotations/entities/match-annotation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PhaseType } from '../phases/entities/phase.entity';
import { PhaseMapper } from '../phases/mappers/phase.mapper';
import { PhasesService } from '../phases/phases.service';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { Team } from '../teams/entities/team.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { TournamentRegistrationsService } from '../tournament-registrations/tournament-registrations.service';
import { TournamentVenuesService } from '../tournament-venues/tournament-venues.service';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { VenueMapper } from '../venues/mappers/venue.mapper';
import { VenuesService } from '../venues/venues.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { Match, MatchStatus } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesService } from './matches.service';

const GROUP_PHASE = buildPhase(PhaseType.GROUP_STAGE);
const KNOCKOUT_PHASE = buildPhase(PhaseType.KNOCKOUT, { id: 21 });
const TEAMS: Record<number, Team> = { [HOME.id]: HOME, [AWAY.id]: AWAY, [OUTSIDER.id]: OUTSIDER };
const GROUP_MATCH: CreateMatchDto = {
  phaseId: 20,
  groupId: 30,
  homeTeamId: HOME.id,
  awayTeamId: AWAY.id,
  scheduledAt: '2999-02-10T15:00:00',
};

describe('MatchesService (HU-GC-06 y resultados HU-GC-07)', () => {
  let matchesRepository: RepositoryMock<Match>;
  let phasesService: { findOrFail: jest.Mock };
  let groupsService: { findOrFail: jest.Mock };
  let notificationsService: { notifyMatchCreated: jest.Mock; notifyMatchResult: jest.Mock };
  let service: MatchesService;

  beforeEach(() => {
    matchesRepository = createRepositoryMock<Match>();
    const annotationsRepository = createRepositoryMock<MatchAnnotation>();
    annotationsRepository.find.mockResolvedValue([]);
    phasesService = { findOrFail: jest.fn().mockResolvedValue(GROUP_PHASE) };
    groupsService = { findOrFail: jest.fn().mockResolvedValue(buildGroup(GROUP_PHASE, [HOME, AWAY])) };
    notificationsService = { notifyMatchCreated: jest.fn(), notifyMatchResult: jest.fn() };
    const teamsService = { findActiveOrFail: jest.fn((id: number) => Promise.resolve(TEAMS[id])) };
    const registrationsService = { ensureRegistered: jest.fn().mockResolvedValue(undefined) };
    const phaseMapper = new PhaseMapper(new TournamentMapper(new SportMapper()));
    service = new MatchesService(
      asRepository(matchesRepository),
      asRepository(annotationsRepository),
      phasesService as unknown as PhasesService,
      groupsService as unknown as GroupsService,
      teamsService as unknown as TeamsService,
      {} as VenuesService,
      registrationsService as unknown as TournamentRegistrationsService,
      { ensureVenueAllowed: jest.fn() } as unknown as TournamentVenuesService,
      notificationsService as unknown as NotificationsService,
      new MatchMapper(phaseMapper, new GroupMapper(phaseMapper, new TeamMapper()), new TeamMapper(), new VenueMapper()),
    );
  });

  it('create en fase de grupos programa el partido y notifica', async () => {
    matchesRepository.findOne.mockResolvedValue(buildMatch(GROUP_PHASE));

    await service.create(GROUP_MATCH);

    expect(matchesRepository.save).toHaveBeenCalled();
    expect(notificationsService.notifyMatchCreated).toHaveBeenCalled();
  });

  it('create con un equipo contra sí mismo responde solicitud inválida', async () => {
    await expect(service.create({ ...GROUP_MATCH, awayTeamId: HOME.id })).rejects.toThrow(BadRequestException);
    expect(matchesRepository.save).not.toHaveBeenCalled();
  });

  it('create con un equipo que no pertenece al grupo responde solicitud inválida', async () => {
    await expect(service.create({ ...GROUP_MATCH, awayTeamId: OUTSIDER.id })).rejects.toThrow(BadRequestException);
  });

  it('create en fase de grupos sin grupo responde solicitud inválida', async () => {
    await expect(service.create({ ...GROUP_MATCH, groupId: null })).rejects.toThrow(BadRequestException);
  });

  it('create con fecha fuera del torneo responde solicitud inválida', async () => {
    await expect(service.create({ ...GROUP_MATCH, scheduledAt: '2999-05-01T15:00:00' })).rejects.toThrow(BadRequestException);
  });

  it('create en fase final con posición de llave ocupada responde conflicto', async () => {
    phasesService.findOrFail.mockResolvedValue(KNOCKOUT_PHASE);
    matchesRepository.existsBy.mockResolvedValue(true);

    await expect(
      service.create({ ...GROUP_MATCH, phaseId: 21, groupId: null, bracketPosition: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('registerResult guarda el marcador, finaliza el partido y notifica el resumen', async () => {
    const match = buildMatch(GROUP_PHASE);
    matchesRepository.findOne.mockResolvedValue(match);

    await service.registerResult(50, { homeScore: 2, awayScore: 1 });

    expect(match.status).toBe(MatchStatus.FINISHED);
    expect(notificationsService.notifyMatchResult).toHaveBeenCalled();
  });

  it('registerResult con empate en fase final responde solicitud inválida', async () => {
    matchesRepository.findOne.mockResolvedValue(buildMatch(KNOCKOUT_PHASE, { bracketPosition: 1 }));

    await expect(service.registerResult(50, { homeScore: 1, awayScore: 1 })).rejects.toThrow(BadRequestException);
  });

  it('update de un partido finalizado responde solicitud inválida', async () => {
    matchesRepository.findOne.mockResolvedValue(buildMatch(GROUP_PHASE, { status: MatchStatus.FINISHED }));

    await expect(service.update(50, { scheduledAt: '2999-02-11T15:00:00' })).rejects.toThrow(BadRequestException);
  });

  it('remove de un partido con resultado responde conflicto', async () => {
    matchesRepository.findOne.mockResolvedValue(buildMatch(GROUP_PHASE, { status: MatchStatus.FINISHED }));

    await expect(service.remove(50)).rejects.toThrow(ConflictException);
    expect(matchesRepository.remove).not.toHaveBeenCalled();
  });
});
