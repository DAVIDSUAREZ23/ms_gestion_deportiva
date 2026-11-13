import { CompetitionGroup } from '../../groups/entities/competition-group.entity';
import { GroupTeam } from '../../groups/entities/group-team.entity';
import { Match, MatchStatus } from '../../matches/entities/match.entity';
import { Phase, PhaseType } from '../../phases/entities/phase.entity';
import { Player } from '../../players/entities/player.entity';
import { Sport } from '../../sports/entities/sport.entity';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

// Datos de prueba reutilizables para las pruebas del módulo de competencias
export const SPORT = Object.assign(new Sport(), { id: 1, name: 'Fútbol', active: true });

export function buildTeam(id: number, name: string): Team {
  return Object.assign(new Team(), { id, name, active: true });
}

export const HOME = buildTeam(10, 'Once Caldas');
export const AWAY = buildTeam(11, 'Deportes Tolima');
export const OUTSIDER = buildTeam(12, 'Millonarios');

export function buildTournament(overrides: Partial<Tournament> = {}): Tournament {
  return Object.assign(new Tournament(), {
    id: 5,
    name: 'Copa Caldas',
    sport: SPORT,
    registrationDeadline: '2999-01-31',
    startDate: '2999-02-01',
    endDate: '2999-03-31',
    active: true,
    ...overrides,
  });
}

export function buildPhase(type: PhaseType, overrides: Partial<Phase> = {}): Phase {
  return Object.assign(new Phase(), {
    id: 20,
    name: type === PhaseType.GROUP_STAGE ? 'Fase de grupos' : 'Final',
    type,
    order: 1,
    tournament: buildTournament(),
    ...overrides,
  });
}

export function buildGroup(phase: Phase, teams: Team[]): CompetitionGroup {
  const group = Object.assign(new CompetitionGroup(), { id: 30, name: 'Grupo A', phase });
  group.groupTeams = teams.map((team, index) => Object.assign(new GroupTeam(), { id: 40 + index, group, team }));
  return group;
}

export function buildMatch(phase: Phase, overrides: Partial<Match> = {}): Match {
  return Object.assign(new Match(), {
    id: 50,
    phase,
    group: null,
    homeTeam: HOME,
    awayTeam: AWAY,
    scheduledAt: new Date('2999-02-10T15:00:00'),
    venue: null,
    status: MatchStatus.SCHEDULED,
    homeScore: null,
    awayScore: null,
    bracketPosition: null,
    ...overrides,
  });
}

export const PLAYER = Object.assign(new Player(), {
  id: 60,
  firstName: 'Ana',
  lastName: 'Gómez',
  documentNumber: '123456',
  position: null,
  active: true,
});
