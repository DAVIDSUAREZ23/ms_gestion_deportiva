import { PlayerContractResponseDto } from '../player-contracts/dto/player-contract-response.dto';
import { PlayerContractsService } from '../player-contracts/player-contracts.service';
import { PlayerSkillsService } from '../player-skills/player-skills.service';
import { PlayerResponseDto } from '../players/dto/player-response.dto';
import { PlayersService } from '../players/players.service';
import { PlayerProfilesService } from './player-profiles.service';

const PLAYER = { id: 1, fullName: 'Ana Gómez' } as PlayerResponseDto;

function buildContract(id: number, current: boolean): PlayerContractResponseDto {
  return { id, current } as PlayerContractResponseDto;
}

describe('PlayerProfilesService (HU-GD-08)', () => {
  const playersService = { findOne: jest.fn().mockResolvedValue(PLAYER) };
  const contractsService = { findHistoryByPlayer: jest.fn() };
  const playerSkillsService = { findByPlayer: jest.fn() };
  const service = new PlayerProfilesService(
    playersService as unknown as PlayersService,
    contractsService as unknown as PlayerContractsService,
    playerSkillsService as unknown as PlayerSkillsService,
  );

  it('jugador sin equipos ni habilidades devuelve listas vacías y sin contrato vigente', async () => {
    contractsService.findHistoryByPlayer.mockResolvedValue([]);
    playerSkillsService.findByPlayer.mockResolvedValue([]);

    const profile = await service.getProfile(1);

    expect(profile.player).toBe(PLAYER);
    expect(profile.currentContract).toBeNull();
    expect(profile.contracts).toEqual([]);
    expect(profile.skills).toEqual([]);
  });

  it('jugador con historial muestra el contrato vigente y sus habilidades', async () => {
    contractsService.findHistoryByPlayer.mockResolvedValue([buildContract(2, true), buildContract(1, false)]);
    playerSkillsService.findByPlayer.mockResolvedValue([{ skill: { id: 3, name: 'Velocidad', active: true } }]);

    const profile = await service.getProfile(1);

    expect(profile.currentContract?.id).toBe(2);
    expect(profile.contracts).toHaveLength(2);
    expect(profile.skills).toEqual([{ id: 3, name: 'Velocidad', active: true }]);
  });
});
