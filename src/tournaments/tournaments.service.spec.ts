import { BadRequestException, ConflictException } from '@nestjs/common';
import { buildTournament, SPORT } from '../common/testing/competition.fixtures';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { Phase } from '../phases/entities/phase.entity';
import { SportMapper } from '../sports/mappers/sport.mapper';
import { SportsService } from '../sports/sports.service';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsService } from './tournaments.service';

const VALID: CreateTournamentDto = {
  name: 'Copa Caldas',
  sportId: 1,
  registrationDeadline: '2999-01-31',
  startDate: '2999-02-01',
  endDate: '2999-03-31',
};

describe('TournamentsService (HU-GC-01)', () => {
  let tournamentsRepository: RepositoryMock<Tournament>;
  let registrationsRepository: RepositoryMock<TournamentRegistration>;
  let phasesRepository: RepositoryMock<Phase>;
  let service: TournamentsService;

  beforeEach(() => {
    tournamentsRepository = createRepositoryMock<Tournament>();
    registrationsRepository = createRepositoryMock<TournamentRegistration>();
    phasesRepository = createRepositoryMock<Phase>();
    tournamentsRepository.findOne.mockResolvedValue(buildTournament());
    const sportsService = { findActiveOrFail: jest.fn().mockResolvedValue(SPORT) };
    service = new TournamentsService(
      asRepository(tournamentsRepository),
      asRepository(registrationsRepository),
      asRepository(phasesRepository),
      sportsService as unknown as SportsService,
      new TournamentMapper(new SportMapper()),
    );
  });

  it('create con datos válidos guarda el torneo asociado al deporte', async () => {
    const result = await service.create(VALID);

    expect(tournamentsRepository.save).toHaveBeenCalled();
    expect(result.sport.name).toBe('Fútbol');
  });

  it('create con cierre de inscripciones posterior al inicio responde solicitud inválida', async () => {
    await expect(service.create({ ...VALID, registrationDeadline: '2999-02-05' })).rejects.toThrow(BadRequestException);
    expect(tournamentsRepository.save).not.toHaveBeenCalled();
  });

  it('create con inicio posterior al fin responde solicitud inválida', async () => {
    await expect(service.create({ ...VALID, endDate: '2999-01-15' })).rejects.toThrow(BadRequestException);
  });

  it('create con nombre repetido responde conflicto', async () => {
    tournamentsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create(VALID)).rejects.toThrow(ConflictException);
  });

  it('remove con fases responde conflicto y no elimina', async () => {
    phasesRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(5)).rejects.toThrow(ConflictException);
    expect(tournamentsRepository.remove).not.toHaveBeenCalled();
  });

  it('update que cambia el deporte de un torneo con inscripciones responde conflicto', async () => {
    registrationsRepository.existsBy.mockResolvedValue(true);

    await expect(service.update(5, { sportId: 2 })).rejects.toThrow(ConflictException);
  });
});
