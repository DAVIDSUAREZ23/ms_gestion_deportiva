import { Injectable } from '@nestjs/common';
import { todayIsoDate } from '../../common/utils/date.utils';
import { Player } from '../../players/entities/player.entity';
import { PlayerMapper } from '../../players/mappers/player.mapper';
import { Team } from '../../teams/entities/team.entity';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { CreatePlayerContractDto } from '../dto/create-player-contract.dto';
import { PlayerContractResponseDto } from '../dto/player-contract-response.dto';
import { PlayerContract } from '../entities/player-contract.entity';

@Injectable()
export class PlayerContractMapper {
  constructor(
    private readonly playerMapper: PlayerMapper,
    private readonly teamMapper: TeamMapper,
  ) {}

  toEntity(dto: CreatePlayerContractDto, player: Player, team: Team): PlayerContract {
    const contract = new PlayerContract();
    contract.player = player;
    contract.team = team;
    contract.startDate = dto.startDate;
    contract.endDate = dto.endDate;
    contract.releasedAt = null;
    return contract;
  }

  toResponseDto(contract: PlayerContract): PlayerContractResponseDto {
    return {
      id: contract.id,
      player: this.playerMapper.toSummaryDto(contract.player),
      team: this.teamMapper.toSummaryDto(contract.team),
      startDate: contract.startDate,
      endDate: contract.endDate,
      releasedAt: contract.releasedAt ? contract.releasedAt.toISOString() : null,
      current: isCurrent(contract),
    };
  }

  toResponseDtoList(contracts: PlayerContract[]): PlayerContractResponseDto[] {
    return contracts.map((contract) => this.toResponseDto(contract));
  }
}

// Un contrato está vigente si no se ha retirado y su fecha de fin no ha pasado
export function isCurrent(contract: PlayerContract): boolean {
  return contract.releasedAt === null && contract.endDate >= todayIsoDate();
}
