import { BadRequestException, ConflictException } from '@nestjs/common';
import { AWAY, buildGroup, buildPhase, HOME } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Match } from '../matches/entities/match.entity';
import { PhaseType } from '../phases/entities/phase.entity';
import { PhaseMapper } from '../phases/mappers/phase.mapper';
import { PhasesService } from '../phases/phases.service';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { TournamentRegistrationsService } from '../tournament-registrations/tournament-registrations.service';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { CompetitionGroup } from './entities/competition-group.entity';
import { GroupTeam } from './entities/group-team.entity';
import { GroupMapper } from './mappers/group.mapper';
import { GroupsService } from './groups.service';

const GROUP_PHASE = buildPhase(PhaseType.GROUP_STAGE);

describe('GroupsService (HU-GC-04)', () => {
  let groupsRepository: RepositoryMock<CompetitionGroup>;
  let groupTeamsRepository: RepositoryMock<GroupTeam>;
  let phasesService: { findOrFail: jest.Mock };
  let teamsService: { findActiveOrFail: jest.Mock };
  let registrationsService: { ensureRegistered: jest.Mock };
  let service: GroupsService;

  beforeEach(() => {
    groupsRepository = createRepositoryMock<CompetitionGroup>();
    groupTeamsRepository = createRepositoryMock<GroupTeam>();
    groupTeamsRepository.findOne.mockResolvedValue(null);
    phasesService = { findOrFail: jest.fn().mockResolvedValue(GROUP_PHASE) };
    teamsService = { findActiveOrFail: jest.fn().mockResolvedValue(AWAY) };
    registrationsService = { ensureRegistered: jest.fn().mockResolvedValue(undefined) };
    const phaseMapper = new PhaseMapper(new TournamentMapper(new SportMapper()));
    service = new GroupsService(
      asRepository(groupsRepository),
      asRepository(groupTeamsRepository),
      asRepository(createRepositoryMock<Match>()),
      phasesService as unknown as PhasesService,
      teamsService as unknown as TeamsService,
      registrationsService as unknown as TournamentRegistrationsService,
      new GroupMapper(phaseMapper, new TeamMapper()),
    );
  });

  it('create en una fase final responde solicitud inválida', async () => {
    phasesService.findOrFail.mockResolvedValue(buildPhase(PhaseType.KNOCKOUT));

    await expect(service.create({ phaseId: 20, name: 'Grupo A' })).rejects.toThrow(BadRequestException);
  });

  it('create con nombre repetido en la fase responde conflicto', async () => {
    groupsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create({ phaseId: 20, name: 'Grupo A' })).rejects.toThrow(ConflictException);
  });

  it('assignTeam agrega un equipo inscrito al grupo', async () => {
    groupsRepository.findOne.mockResolvedValue(buildGroup(GROUP_PHASE, [HOME]));

    await service.assignTeam({ groupId: 30, teamId: AWAY.id });

    expect(registrationsService.ensureRegistered).toHaveBeenCalled();
    expect(groupTeamsRepository.save).toHaveBeenCalled();
  });

  it('assignTeam de un equipo que ya está en el grupo responde conflicto', async () => {
    groupsRepository.findOne.mockResolvedValue(buildGroup(GROUP_PHASE, [HOME, AWAY]));

    await expect(service.assignTeam({ groupId: 30, teamId: AWAY.id })).rejects.toThrow(ConflictException);
  });

  it('assignTeam de un equipo que ya está en otro grupo de la misma fase responde conflicto', async () => {
    groupsRepository.findOne.mockResolvedValue(buildGroup(GROUP_PHASE, [HOME]));
    groupTeamsRepository.findOne.mockResolvedValue(
      Object.assign(new GroupTeam(), { group: Object.assign(new CompetitionGroup(), { name: 'Grupo B' }) }),
    );

    await expect(service.assignTeam({ groupId: 30, teamId: AWAY.id })).rejects.toThrow(ConflictException);
    expect(groupTeamsRepository.save).not.toHaveBeenCalled();
  });

  it('assignTeam de un equipo no inscrito en el torneo responde solicitud inválida', async () => {
    groupsRepository.findOne.mockResolvedValue(buildGroup(GROUP_PHASE, [HOME]));
    registrationsService.ensureRegistered.mockRejectedValue(new BadRequestException('no inscrito'));

    await expect(service.assignTeam({ groupId: 30, teamId: AWAY.id })).rejects.toThrow(BadRequestException);
  });
});
