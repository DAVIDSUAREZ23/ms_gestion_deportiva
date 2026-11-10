import { Injectable } from '@nestjs/common';
import { CreatePlayerDto } from '../dto/create-player.dto';
import { PlayerResponseDto, PlayerSummaryDto } from '../dto/player-response.dto';
import { UpdatePlayerDto } from '../dto/update-player.dto';
import { Player } from '../entities/player.entity';

@Injectable()
export class PlayerMapper {
  toEntity(dto: CreatePlayerDto): Player {
    const player = new Player();
    player.documentNumber = dto.documentNumber;
    player.firstName = dto.firstName;
    player.lastName = dto.lastName;
    player.birthDate = dto.birthDate;
    player.position = dto.position ?? null;
    player.nationality = dto.nationality ?? null;
    player.email = dto.email ?? null;
    player.phone = dto.phone ?? null;
    return player;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(player: Player, dto: UpdatePlayerDto): Player {
    if (dto.documentNumber !== undefined) player.documentNumber = dto.documentNumber;
    if (dto.firstName !== undefined) player.firstName = dto.firstName;
    if (dto.lastName !== undefined) player.lastName = dto.lastName;
    if (dto.birthDate !== undefined) player.birthDate = dto.birthDate;
    if (dto.position !== undefined) player.position = dto.position;
    if (dto.nationality !== undefined) player.nationality = dto.nationality;
    if (dto.email !== undefined) player.email = dto.email;
    if (dto.phone !== undefined) player.phone = dto.phone;
    return player;
  }

  toSummaryDto(player: Player): PlayerSummaryDto {
    return {
      id: player.id,
      documentNumber: player.documentNumber,
      fullName: `${player.firstName} ${player.lastName}`,
      position: player.position,
      active: player.active,
    };
  }

  toResponseDto(player: Player): PlayerResponseDto {
    return {
      ...this.toSummaryDto(player),
      firstName: player.firstName,
      lastName: player.lastName,
      birthDate: player.birthDate,
      nationality: player.nationality,
      email: player.email,
      phone: player.phone,
    };
  }

  toResponseDtoList(players: Player[]): PlayerResponseDto[] {
    return players.map((player) => this.toResponseDto(player));
  }
}
