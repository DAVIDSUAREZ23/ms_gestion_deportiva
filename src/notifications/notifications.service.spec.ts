import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Bet } from '../bets/entities/bet.entity';
import { Fan } from '../fans/entities/fan.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsClient } from './notifications.client';
import { NotificationsService } from './notifications.service';

const ticketOf = (email: string) => Object.assign(new Ticket(), { fan: Object.assign(new Fan(), { email, active: true }) });
const betOf = (email: string) => Object.assign(new Bet(), { fan: Object.assign(new Fan(), { email, active: true }) });
const match = { matchId: 1, homeTeamId: 10, awayTeamId: 11, homeTeam: 'Once Caldas', awayTeam: 'Nacional' };

describe('NotificationsService (a quién se avisa y qué se envía al ms de notificaciones)', () => {
  let ticketsRepository: RepositoryMock<Ticket>;
  let betsRepository: RepositoryMock<Bet>;
  let client: { sendMatchNotification: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    ticketsRepository = createRepositoryMock<Ticket>();
    betsRepository = createRepositoryMock<Bet>();
    betsRepository.find.mockResolvedValue([]);
    client = { sendMatchNotification: jest.fn().mockResolvedValue(undefined) };
    service = new NotificationsService(
      asRepository(ticketsRepository),
      asRepository(betsRepository),
      client as unknown as NotificationsClient,
    );
    jest.spyOn((service as unknown as { logger: { log: () => void } }).logger, 'log').mockImplementation();
  });

  it('partido nuevo: avisa una sola vez a quienes tuvieron boleto en partidos anteriores de cualquiera de los dos equipos', async () => {
    ticketsRepository.find.mockResolvedValue([ticketOf('ana@correo.com'), ticketOf('ana@correo.com'), ticketOf('luis@correo.com')]);

    await service.notifyMatchCreated({ ...match, scheduledAt: new Date('2026-12-01T20:00:00Z') });

    expect(client.sendMatchNotification).toHaveBeenCalledTimes(1);
    expect(client.sendMatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: ['ana@correo.com', 'luis@correo.com'],
        subject: 'Nuevo partido: Once Caldas vs Nacional',
      }),
    );
  });

  it('partido nuevo: busca partidos finalizados y anteriores donde jugó el local o el visitante', async () => {
    ticketsRepository.find.mockResolvedValue([]);

    await service.notifyMatchCreated({ ...match, scheduledAt: new Date('2026-12-01T20:00:00Z') });

    const { where } = ticketsRepository.find.mock.calls[0][0] as { where: Array<{ match: Record<string, unknown> }> };
    expect(where).toHaveLength(2);
    expect(where[0].match).toHaveProperty('homeTeam');
    expect(where[1].match).toHaveProperty('awayTeam');
    expect(where[0].match).toMatchObject({ status: 'FINISHED' });
  });

  it('partido nuevo: si nadie participó antes no pide ningún envío', async () => {
    ticketsRepository.find.mockResolvedValue([]);

    await service.notifyMatchCreated({ ...match, scheduledAt: new Date('2026-12-01T20:00:00Z') });

    expect(client.sendMatchNotification).not.toHaveBeenCalled();
  });

  it('anotación: avisa a los aficionados con boleto vigente para el partido, sin repetirlos', async () => {
    ticketsRepository.find.mockResolvedValue([ticketOf('boleta@correo.com'), ticketOf('boleta@correo.com')]);

    await service.notifyAnnotation({ ...match, playerName: 'Ana Gómez', teamName: 'Once Caldas', minute: 10 });

    expect(client.sendMatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: ['boleta@correo.com'],
        message: 'Anotó Ana Gómez (Once Caldas) al minuto 10.',
      }),
    );
  });

  it('anotación: incluye a los apostadores activos del partido sin repetir correos', async () => {
    ticketsRepository.find.mockResolvedValue([ticketOf('boleta@correo.com')]);
    betsRepository.find.mockResolvedValue([betOf('apuesta@correo.com'), betOf('boleta@correo.com')]);

    await service.notifyAnnotation({ ...match, playerName: 'Ana Gómez', teamName: 'Once Caldas', minute: 10 });

    expect(client.sendMatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipients: ['boleta@correo.com', 'apuesta@correo.com'] }),
    );
  });

  it('resultado: envía el resumen con el marcador y quiénes anotaron', async () => {
    ticketsRepository.find.mockResolvedValue([ticketOf('boleta@correo.com')]);

    await service.notifyMatchResult({ ...match, homeScore: 2, awayScore: 1, scorers: ['Ana Gómez', 'Luis Pérez'] });

    expect(client.sendMatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Final: Once Caldas 2 - 1 Nacional',
        details: ['Anotaron: Ana Gómez, Luis Pérez'],
      }),
    );
  });

  it('resultado corregido: el asunto indica que es una corrección, no un nuevo final', async () => {
    ticketsRepository.find.mockResolvedValue([ticketOf('boleta@correo.com')]);

    await service.notifyMatchResult({ ...match, homeScore: 3, awayScore: 1, scorers: [], corrected: true });

    expect(client.sendMatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Resultado corregido: Once Caldas 3 - 1 Nacional', message: expect.stringContaining('corrigió') }),
    );
  });

  it('divide los destinatarios en solicitudes de máximo 500', async () => {
    const tickets = Array.from({ length: 501 }, (_, index) => ticketOf(`fan${index}@correo.com`));
    ticketsRepository.find.mockResolvedValue(tickets);

    await service.notifyMatchResult({ ...match, homeScore: 0, awayScore: 0, scorers: [] });

    expect(client.sendMatchNotification).toHaveBeenCalledTimes(2);
    expect(client.sendMatchNotification.mock.calls[0][0].recipients).toHaveLength(500);
    expect(client.sendMatchNotification.mock.calls[1][0].recipients).toHaveLength(1);
  });
});
