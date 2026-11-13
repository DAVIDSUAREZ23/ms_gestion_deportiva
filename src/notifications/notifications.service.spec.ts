import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { FanTeam } from '../fans/entities/fan-team.entity';
import { Fan } from '../fans/entities/fan.entity';
import { NotificationsService } from './notifications.service';

const follow = (email: string) => Object.assign(new FanTeam(), { fan: Object.assign(new Fan(), { email, active: true }) });

describe('NotificationsService (aviso de partido nuevo a seguidores)', () => {
  let fanTeamsRepository: RepositoryMock<FanTeam>;
  let service: NotificationsService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    fanTeamsRepository = createRepositoryMock<FanTeam>();
    service = new NotificationsService(asRepository(fanTeamsRepository));
    logSpy = jest.spyOn((service as unknown as { logger: { log: () => void } }).logger, 'log').mockImplementation();
  });

  it('notifyMatchCreated avisa una sola vez a cada seguidor de cualquiera de los dos equipos', async () => {
    fanTeamsRepository.find.mockResolvedValue([follow('ana@correo.com'), follow('ana@correo.com'), follow('luis@correo.com')]);

    await service.notifyMatchCreated({ matchId: 1, homeTeamId: 10, awayTeamId: 11, homeTeam: 'A', awayTeam: 'B' });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2 destinatario(s): ana@correo.com, luis@correo.com'));
  });
});
