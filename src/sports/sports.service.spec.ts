import { BadRequestException, ConflictException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SportsService } from './sports.service';

function buildSport(overrides: Partial<Sport> = {}): Sport {
  return Object.assign(new Sport(), {
    id: 1,
    name: 'Fútbol',
    description: null,
    active: true,
    parent: null,
    subSports: [],
    ...overrides,
  });
}

describe('SportsService (HU-GD-01)', () => {
  let sportsRepository: RepositoryMock<Sport>;
  let teamSportsRepository: RepositoryMock<TeamSport>;
  let service: SportsService;

  beforeEach(() => {
    sportsRepository = createRepositoryMock<Sport>();
    teamSportsRepository = createRepositoryMock<TeamSport>();
    service = new SportsService(asRepository(sportsRepository), asRepository(teamSportsRepository), new SportMapper());
  });

  it('create con nombre repetido responde conflicto', async () => {
    sportsRepository.existsBy.mockResolvedValue(true);

    await expect(service.create({ name: 'Fútbol' })).rejects.toThrow(ConflictException);
    expect(sportsRepository.save).not.toHaveBeenCalled();
  });

  it('create de un subdeporte cuyo padre ya es subdeporte responde solicitud inválida', async () => {
    const futbol = buildSport();
    sportsRepository.findOne.mockResolvedValue(buildSport({ id: 2, name: 'Fútbol sala', parent: futbol }));

    await expect(service.create({ name: 'Futsal playa', parentId: 2 })).rejects.toThrow(BadRequestException);
  });

  it('update que pone al deporte como su propio padre responde solicitud inválida', async () => {
    sportsRepository.findOne.mockResolvedValue(buildSport());

    await expect(service.update(1, { parentId: 1 })).rejects.toThrow(BadRequestException);
  });

  it('update que convierte en subdeporte a un deporte con subdeportes responde solicitud inválida', async () => {
    const futbol = buildSport({ subSports: [buildSport({ id: 3, name: 'Fútbol sala' })] });
    sportsRepository.findOne.mockResolvedValueOnce(futbol).mockResolvedValueOnce(buildSport({ id: 4, name: 'Deportes de balón' }));

    await expect(service.update(1, { parentId: 4 })).rejects.toThrow(BadRequestException);
  });

  it('remove con subdeportes responde conflicto y no elimina', async () => {
    sportsRepository.findOne.mockResolvedValue(buildSport({ subSports: [buildSport({ id: 3 })] }));

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(sportsRepository.remove).not.toHaveBeenCalled();
  });

  it('remove con equipos asociados responde conflicto y no elimina', async () => {
    sportsRepository.findOne.mockResolvedValue(buildSport());
    teamSportsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(sportsRepository.remove).not.toHaveBeenCalled();
  });

  it('remove sin información asociada elimina el deporte', async () => {
    const sport = buildSport();
    sportsRepository.findOne.mockResolvedValue(sport);

    await service.remove(1);

    expect(sportsRepository.remove).toHaveBeenCalledWith(sport);
  });

  it('findActiveOrFail con deporte inactivo responde solicitud inválida', async () => {
    sportsRepository.findOne.mockResolvedValue(buildSport({ active: false }));

    await expect(service.findActiveOrFail(1)).rejects.toThrow(BadRequestException);
  });
});
