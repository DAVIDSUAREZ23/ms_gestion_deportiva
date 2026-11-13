import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { FanTeam } from '../fans/entities/fan-team.entity';
import { Fan } from '../fans/entities/fan.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsService } from './notifications.service';

const follow = (email: string) => Object.assign(new FanTeam(), { fan: Object.assign(new Fan(), { email, active: true }) });

describe('NotificationsService (aviso de partido nuevo a seguidores)', () => {
  let fanTeamsRepository: RepositoryMock<FanTeam>;
  let ticketsRepository: RepositoryMock<Ticket>;
  let service: NotificationsService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    fanTeamsRepository = createRepositoryMock<FanTeam>();
    ticketsRepository = createRepositoryMock<Ticket>();
    service = new NotificationsService(asRepository(fanTeamsRepository), asRepository(ticketsRepository));
    logSpy = jest.spyOn((service as unknown as { logger: { log: () => void } }).logger, 'log').mockImplementation();
  });

  it('notifyMatchCreated avisa una sola vez a cada seguidor de cualquiera de los dos equipos', async () => {
    fanTeamsRepository.find.mockResolvedValue([follow('ana@correo.com'), follow('ana@correo.com'), follow('luis@correo.com')]);

    await service.notifyMatchCreated({ matchId: 1, homeTeamId: 10, awayTeamId: 11, homeTeam: 'A', awayTeam: 'B' });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2 destinatario(s): ana@correo.com, luis@correo.com'));
  });

  it('notifyAnnotation avisa a los aficionados con boleto vigente para el partido', async () => {
    const ticket = Object.assign(new Ticket(), { fan: Object.assign(new Fan(), { email: 'boleta@correo.com', active: true }) });
    ticketsRepository.find.mockResolvedValue([ticket, ticket]);

    await service.notifyAnnotation({ matchId: 1, homeTeamId: 10, awayTeamId: 11, homeTeam: 'A', awayTeam: 'B', playerName: 'Ana', teamName: 'A', minute: 10 });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1 destinatario(s): boleta@correo.com'));
  });
});
