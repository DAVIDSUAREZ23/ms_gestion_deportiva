import { TeamSummaryDto } from '../../teams/dto/team-response.dto';

// Datos mínimos de un aficionado (lista de seguidores de un equipo)
export class FanSummaryDto {
  id!: number;
  displayName!: string;
  email!: string;
  active!: boolean;
}

export class FanResponseDto extends FanSummaryDto {
  userId!: number;
  phone!: string | null;
  city!: string | null;
  createdAt!: string;
  followedTeamsCount!: number;
}

// Equipo seguido por un aficionado y desde cuándo
export class FollowedTeamDto {
  team!: TeamSummaryDto;
  followedAt!: string;
}

// Seguidor de un equipo y desde cuándo
export class TeamFollowerDto {
  fan!: FanSummaryDto;
  followedAt!: string;
}

export class FanDetailResponseDto extends FanResponseDto {
  followedTeams!: FollowedTeamDto[];
}
