import { BadRequestException, ConflictException } from '@nestjs/common';
import { buildTournament, HOME } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { GroupTeam } from '../groups/entities/group-team.entity';
import { Match } from '../matches/entities/match.entity';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { TeamsService } from '../teams/teams.service';
import { TournamentMapper } from '../tournaments/mappers/tournament.mapper';
import { TournamentsService } from '../tournaments/tournaments.service';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { TournamentRegistrationMapper } from './mappers/tournament-registration.mapper';
import { TournamentRegistrationsService } from './tournament-registrations.service';

const OPEN = buildTournament();
const CLOSED = buildTournament({ registrationDeadline: '2020-01-01', startDate: '2020-01-02', endDate: '2020-02-01' });

describe('TournamentRegistrationsService (HU-GC-02)', () => {
  let registrationsRepository: RepositoryMock<TournamentRegistration>;
  let teamSportsRepository: RepositoryMock<TeamSport>;
  let groupTeamsRepository: RepositoryMock<GroupTeam>;
  let matchesRepository: RepositoryMock<Match>;
  let tournamentsService: { findActiveOrFail: jest.Mock; findOrFail: jest.Mock };
  let service: TournamentRegistrationsService;

  beforeEach(() => {
    registrationsRepository = createRepositoryMock<TournamentRegistration>();
    teamSportsRepository = createRepositoryMock<TeamSport>();
    teamSportsRepository.existsBy.mockResolvedValue(true);
    groupTeamsRepository = createRepositoryMock<GroupTeam>();
    matchesRepository = createRepositoryMock<Match>();
    tournamentsService = { findActiveOrFail: jest.fn().mockResolvedValue(OPEN), findOrFail: jest.fn().mockResolvedValue(OPEN) };
    const teamsService = { findActiveOrFail: jest.fn().mockResolvedValue(HOME), findOrFail: jest.fn().mockResolvedValue(HOME) };
    service = new TournamentRegistrationsService(
      asRepository(registrationsRepository),
      asRepository(teamSportsRepository),
      asRepository(groupTeamsRepository),
      asRepository(matchesRepository),
      tournamentsService as unknown as TournamentsService,
      teamsService as unknown as TeamsService,
      new TournamentRegistrationMapper(new TournamentMapper(new SportMapper()), new TeamMapper()),
    );
  });

  it('register inscribe el equipo e informa al usuario', async () => {
    const result = await service.register({ tournamentId: 5, teamId: 10 });

    expect(registrationsRepository.save).toHaveBeenCalled();
    expect(result.message).toContain('quedó inscrito');
  });

  it('register de un equipo que no practica el deporte del torneo responde solicitud inválida', async () => {
    teamSportsRepository.existsBy.mockResolvedValue(false);

    await expect(service.register({ tournamentId: 5, teamId: 10 })).rejects.toThrow(BadRequestException);
  });

  it('register repetido responde conflicto', async () => {
    registrationsRepository.existsBy.mockResolvedValue(true);

    await expect(service.register({ tournamentId: 5, teamId: 10 })).rejects.toThrow(ConflictException);
  });

  it('register con inscripciones cerradas responde solicitud inválida', async () => {
    tournamentsService.findActiveOrFail.mockResolvedValue(CLOSED);

    await expect(service.register({ tournamentId: 5, teamId: 10 })).rejects.toThrow(BadRequestException);
    expect(registrationsRepository.save).not.toHaveBeenCalled();
  });

  it('withdraw con el torneo ya iniciado responde solicitud inválida', async () => {
    registrationsRepository.findOne.mockResolvedValue(
      Object.assign(new TournamentRegistration(), { id: 1, tournament: CLOSED, team: HOME }),
    );

    await expect(service.withdraw(5, 10)).rejects.toThrow(BadRequestException);
    expect(registrationsRepository.remove).not.toHaveBeenCalled();
  });

  it('withdraw de un equipo que ya está en un grupo responde conflicto', async () => {
    registrationsRepository.findOne.mockResolvedValue(
      Object.assign(new TournamentRegistration(), { id: 1, tournament: OPEN, team: HOME }),
    );
    groupTeamsRepository.existsBy.mockResolvedValue(true);

    await expect(service.withdraw(5, 10)).rejects.toThrow(ConflictException);
  });

  it('withdraw permitido elimina solo la inscripción', async () => {
    const registration = Object.assign(new TournamentRegistration(), { id: 1, tournament: OPEN, team: HOME });
    registrationsRepository.findOne.mockResolvedValue(registration);

    const result = await service.withdraw(5, 10);

    expect(registrationsRepository.remove).toHaveBeenCalledWith(registration);
    expect(result.message).toContain('Se retiró');
  });
});
