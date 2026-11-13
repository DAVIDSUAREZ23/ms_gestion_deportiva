import { IsInt, Min } from 'class-validator';

export class FollowTeamDto {
  @IsInt({ message: 'El equipo debe ser un id numérico' })
  @Min(1, { message: 'El equipo debe ser un id válido' })
  teamId!: number;
}
