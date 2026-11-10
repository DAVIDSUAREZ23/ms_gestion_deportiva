import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { todayIsoDate } from '../common/utils/date.utils';
import { Player } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { TeamsService } from '../teams/teams.service';
import { CreatePlayerContractDto } from './dto/create-player-contract.dto';
import { PlayerContractResponseDto } from './dto/player-contract-response.dto';
import { PlayerContract } from './entities/player-contract.entity';
import { isCurrent, PlayerContractMapper } from './mappers/player-contract.mapper';

const WITH_PLAYER_AND_TEAM = { player: true, team: true } as const;

// HU-GD-05: contratos jugador–equipo; un jugador tiene un solo equipo vigente y conserva su historial
@Injectable()
export class PlayerContractsService {
  constructor(
    @InjectRepository(PlayerContract) private readonly contractsRepository: Repository<PlayerContract>,
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    private readonly contractMapper: PlayerContractMapper,
  ) {}

  async sign(dto: CreatePlayerContractDto): Promise<PlayerContractResponseDto> {
    this.ensureValidPeriod(dto.startDate, dto.endDate);
    const player = await this.playersService.findActiveOrFail(dto.playerId);
    const team = await this.teamsService.findActiveOrFail(dto.teamId);
    await this.ensurePlayerIsFree(player);
    const saved = await this.contractsRepository.save(this.contractMapper.toEntity(dto, player, team));
    return this.contractMapper.toResponseDto(saved);
  }

  // Retira al jugador del equipo: cierra el contrato y lo deja como historial de traspasos
  async release(id: number): Promise<PlayerContractResponseDto> {
    const contract = await this.findOrFail(id);
    if (!isCurrent(contract)) {
      throw new BadRequestException('El contrato ya no está vigente');
    }
    contract.releasedAt = new Date();
    return this.contractMapper.toResponseDto(await this.contractsRepository.save(contract));
  }

  // Plantilla actual del equipo
  async findCurrentByTeam(teamId: number): Promise<PlayerContractResponseDto[]> {
    await this.teamsService.findOrFail(teamId);
    const contracts = await this.contractsRepository.find({
      where: this.currentContractsWhere({ team: { id: teamId } }),
      relations: WITH_PLAYER_AND_TEAM,
      order: { player: { lastName: 'ASC' } },
    });
    return this.contractMapper.toResponseDtoList(contracts);
  }

  // Historial completo del jugador, del contrato más reciente al más antiguo
  async findHistoryByPlayer(playerId: number): Promise<PlayerContractResponseDto[]> {
    await this.playersService.findOrFail(playerId);
    const contracts = await this.contractsRepository.find({
      where: { player: { id: playerId } },
      relations: WITH_PLAYER_AND_TEAM,
      order: { startDate: 'DESC', id: 'DESC' },
    });
    return this.contractMapper.toResponseDtoList(contracts);
  }

  private async findOrFail(id: number): Promise<PlayerContract> {
    const contract = await this.contractsRepository.findOne({ where: { id }, relations: WITH_PLAYER_AND_TEAM });
    if (!contract) {
      throw new NotFoundException(`Contrato con id ${id} no encontrado`);
    }
    return contract;
  }

  private ensureValidPeriod(startDate: string, endDate: string): void {
    if (endDate <= startDate) {
      throw new BadRequestException('La fecha de fin del contrato debe ser posterior a la de inicio');
    }
    if (endDate < todayIsoDate()) {
      throw new BadRequestException('La fecha de fin del contrato no puede estar en el pasado');
    }
  }

  private async ensurePlayerIsFree(player: Player): Promise<void> {
    const current = await this.contractsRepository.findOne({
      where: this.currentContractsWhere({ player: { id: player.id } }),
      relations: { team: true },
    });
    if (current) {
      throw new ConflictException(
        `${player.firstName} ${player.lastName} ya tiene contrato vigente con "${current.team.name}". Retíralo primero.`,
      );
    }
  }

  // Condición de contrato vigente (sin retiro y con fecha de fin desde hoy) aplicada a un filtro
  private currentContractsWhere(filter: FindOptionsWhere<PlayerContract>): FindOptionsWhere<PlayerContract> {
    return { ...filter, releasedAt: IsNull(), endDate: MoreThanOrEqual(todayIsoDate()) };
  }
}
