import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { TeamMapper } from '../teams/mappers/team.mapper';
import { Fan } from './entities/fan.entity';
import { FansService } from './fans.service';
import { FanMapper } from './mappers/fan.mapper';

function buildFan(overrides: Partial<Fan> = {}): Fan {
  return Object.assign(new Fan(), {
    id: 1,
    userId: 7,
    displayName: 'Ana Hincha',
    email: 'ana@correo.com',
    phone: null,
    city: 'Manizales',
    active: true,
    createdAt: new Date('2026-11-01T10:00:00'),
    followedTeams: [],
    ...overrides,
  });
}

describe('FansService (Aficionado)', () => {
  let fansRepository: RepositoryMock<Fan>;
  let service: FansService;

  beforeEach(() => {
    fansRepository = createRepositoryMock<Fan>();
    service = new FansService(asRepository(fansRepository), new FanMapper(new TeamMapper()));
  });

  it('createMyProfile crea el perfil enlazado al usuario del token', async () => {
    fansRepository.findOne.mockResolvedValue(buildFan());

    const profile = await service.createMyProfile(7, { displayName: 'Ana Hincha', email: 'ana@correo.com' });

    const saved = fansRepository.save.mock.calls[0][0] as Fan;
    expect(saved.userId).toBe(7);
    expect(profile.displayName).toBe('Ana Hincha');
  });

  it('createMyProfile de un usuario que ya tiene perfil responde conflicto', async () => {
    fansRepository.existsBy.mockResolvedValue(true);

    await expect(service.createMyProfile(7, { displayName: 'Ana', email: 'ana@correo.com' })).rejects.toThrow(ConflictException);
    expect(fansRepository.save).not.toHaveBeenCalled();
  });

  it('getMyProfile sin perfil responde no encontrado', async () => {
    fansRepository.findOne.mockResolvedValue(null);

    await expect(service.getMyProfile(7)).rejects.toThrow(NotFoundException);
  });

  it('findActiveByUserOrFail con el perfil desactivado responde solicitud inválida', async () => {
    fansRepository.findOne.mockResolvedValue(buildFan({ active: false }));

    await expect(service.findActiveByUserOrFail(7)).rejects.toThrow(BadRequestException);
  });
});
