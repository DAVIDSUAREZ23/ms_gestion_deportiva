// Datos mínimos de un equipo para mostrarlo dentro de otros recursos
export class TeamSummaryDto {
  id!: number;
  name!: string;
  active!: boolean;
}

export class TeamResponseDto extends TeamSummaryDto {
  city!: string | null;
  foundedAt!: string | null;
  description!: string | null;
}
