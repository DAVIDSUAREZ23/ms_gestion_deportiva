import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

// Filtros del listado de partidos (usado por la pantalla de cuotas)
export class FindMatchesQueryDto {
  @IsOptional()
  @IsEnum(MatchStatus, { message: 'El estado debe ser SCHEDULED, FINISHED o CANCELLED' })
  status?: MatchStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El torneo debe ser un id numérico' })
  @Min(1, { message: 'El torneo debe ser un id válido' })
  tournamentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La fase debe ser un id numérico' })
  @Min(1, { message: 'La fase debe ser un id válido' })
  phaseId?: number;
}
