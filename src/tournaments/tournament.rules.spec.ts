import { buildTournament } from '../common/testing/competition.fixtures';
import { isRegistrationOpen, stageOf } from './tournament.rules';

const TOURNAMENT = buildTournament({ registrationDeadline: '2026-05-10', startDate: '2026-05-15', endDate: '2026-06-30' });

describe('tournament.rules (HU-GC-01 y HU-GC-02)', () => {
  it('las inscripciones están abiertas hasta la fecha límite inclusive', () => {
    expect(isRegistrationOpen(TOURNAMENT, '2026-05-10')).toBe(true);
    expect(isRegistrationOpen(TOURNAMENT, '2026-05-11')).toBe(false);
  });

  it('las inscripciones se cierran cuando el torneo inicia aunque la fecha límite sea el mismo día', () => {
    const sameDay = buildTournament({ registrationDeadline: '2026-05-15', startDate: '2026-05-15' });

    expect(isRegistrationOpen(sameDay, '2026-05-15')).toBe(false);
  });

  it('calcula la etapa según la fecha', () => {
    expect(stageOf(TOURNAMENT, '2026-05-01')).toBe('REGISTRATION_OPEN');
    expect(stageOf(TOURNAMENT, '2026-05-12')).toBe('REGISTRATION_CLOSED');
    expect(stageOf(TOURNAMENT, '2026-06-01')).toBe('IN_PROGRESS');
    expect(stageOf(TOURNAMENT, '2026-07-01')).toBe('FINISHED');
  });
});
