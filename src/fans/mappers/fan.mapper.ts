import { Injectable } from '@nestjs/common';
import { TeamMapper } from '../../teams/mappers/team.mapper';
import { CreateFanProfileDto } from '../dto/create-fan-profile.dto';
import { FanDetailResponseDto, FanResponseDto, FanSummaryDto, FollowedTeamDto, TeamFollowerDto } from '../dto/fan-response.dto';
import { UpdateFanProfileDto } from '../dto/update-fan-profile.dto';
import { FanTeam } from '../entities/fan-team.entity';
import { Fan } from '../entities/fan.entity';

@Injectable()
export class FanMapper {
  constructor(private readonly teamMapper: TeamMapper) {}

  toEntity(userId: number, dto: CreateFanProfileDto): Fan {
    const fan = new Fan();
    fan.userId = userId;
    fan.displayName = dto.displayName;
    fan.email = dto.email;
    fan.phone = dto.phone ?? null;
    fan.city = dto.city ?? null;
    return fan;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(fan: Fan, dto: UpdateFanProfileDto): Fan {
    if (dto.displayName !== undefined) fan.displayName = dto.displayName;
    if (dto.email !== undefined) fan.email = dto.email;
    if (dto.phone !== undefined) fan.phone = dto.phone;
    if (dto.city !== undefined) fan.city = dto.city;
    return fan;
  }

  toSummaryDto(fan: Fan): FanSummaryDto {
    return { id: fan.id, displayName: fan.displayName, email: fan.email, active: fan.active };
  }

  toResponseDto(fan: Fan, followedTeamsCount: number): FanResponseDto {
    return {
      ...this.toSummaryDto(fan),
      userId: fan.userId,
      phone: fan.phone,
      city: fan.city,
      createdAt: fan.createdAt.toISOString(),
      followedTeamsCount,
    };
  }

  // Requiere el aficionado con sus equipos seguidos cargados
  toDetailResponseDto(fan: Fan): FanDetailResponseDto {
    const followedTeams = (fan.followedTeams ?? []).map((fanTeam) => this.toFollowedTeamDto(fanTeam));
    return { ...this.toResponseDto(fan, followedTeams.length), followedTeams };
  }

  toFollowedTeamDto(fanTeam: FanTeam): FollowedTeamDto {
    return { team: this.teamMapper.toSummaryDto(fanTeam.team), followedAt: isoOrNow(fanTeam.followedAt) };
  }

  toTeamFollowerDto(fanTeam: FanTeam): TeamFollowerDto {
    return { fan: this.toSummaryDto(fanTeam.fan), followedAt: isoOrNow(fanTeam.followedAt) };
  }
}

// Fecha ISO; si la base aún no devolvió la fecha generada, se usa el momento actual
function isoOrNow(date: Date | undefined): string {
  return (date ?? new Date()).toISOString();
}
