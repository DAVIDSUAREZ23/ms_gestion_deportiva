import { BadRequestException, ConflictException } from '@nestjs/common';
import { asRepository, createRepositoryMock, RepositoryMock } from '../common/testing/repository.mock';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import { PlayersService } from './players.service';

const VALID_PLAYER: CreatePlayerDto = {
  documentNumber: '1053000111',
  firstName: 'Ana',
  lastName: 'Gómez',
  birthDate: '2000-05-10',
};

describe('PlayersService (HU-GD-04)', () => {
  let playersRepository: RepositoryMock<Player>;
  let contractsRepository: RepositoryMock<PlayerContract>;
  let playerSkillsRepository: RepositoryMock<PlayerSkill>;
  let service: PlayersService;

  beforeEach(() => {
    playersRepository = createRepositoryMock<Player>();
    contractsRepository = createRepositoryMock<PlayerContract>();
    playerSkillsRepository = createRepositoryMock<PlayerSkill>();
    service = new PlayersService(
      asRepository(playersRepository),
      asRepository(contractsRepository),
      asRepository(playerSkillsRepository),
      new PlayerMapper(),
    );
  });

  it('create con datos válidos guarda el jugador', async () => {
    const result = await service.create(VALID_PLAYER);

    expect(playersRepository.save).toHaveBeenCalled();
    expect(result.fullName).toBe('Ana Gómez');
  });

  it('create con documento repetido responde conflicto', async () => {
    playersRepository.existsBy.mockResolvedValue(true);

    await expect(service.create(VALID_PLAYER)).rejects.toThrow(ConflictException);
  });

  it('create con fecha de nacimiento futura responde solicitud inválida', async () => {
    await expect(service.create({ ...VALID_PLAYER, birthDate: '2999-01-01' })).rejects.toThrow(BadRequestException);
    expect(playersRepository.save).not.toHaveBeenCalled();
  });

  it('remove con habilidades asignadas responde conflicto y no elimina', async () => {
    playersRepository.findOneBy.mockResolvedValue(Object.assign(new Player(), { id: 1, ...VALID_PLAYER }));
    playerSkillsRepository.existsBy.mockResolvedValue(true);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(playersRepository.remove).not.toHaveBeenCalled();
  });
});
