import { todayIsoDate } from '../common/utils/date.utils';
import { Tournament } from './entities/tournament.entity';

export type TournamentStage = 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'FINISHED';

// Las inscripciones están abiertas hasta la fecha límite y siempre antes de que inicie el torneo
export function isRegistrationOpen(tournament: Tournament, today = todayIsoDate()): boolean {
  return today <= tournament.registrationDeadline && today < tournament.startDate;
}

// Etapa actual del torneo según las fechas de hoy
export function stageOf(tournament: Tournament, today = todayIsoDate()): TournamentStage {
  if (today > tournament.endDate) return 'FINISHED';
  if (today >= tournament.startDate) return 'IN_PROGRESS';
  return isRegistrationOpen(tournament, today) ? 'REGISTRATION_OPEN' : 'REGISTRATION_CLOSED';
}
