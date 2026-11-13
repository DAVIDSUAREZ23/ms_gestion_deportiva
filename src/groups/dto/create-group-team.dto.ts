import { IsInt, Min } from 'class-validator';

export class CreateGroupTeamDto {
  @IsInt({ message: 'El grupo debe ser un id numérico' })
  @Min(1, { message: 'El grupo debe ser un id válido' })
  groupId!: number;

  @IsInt({ message: 'El equipo debe ser un id numérico' })
  @Min(1, { message: 'El equipo debe ser un id válido' })
  teamId!: number;
}
