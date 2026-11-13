import { PhaseSummaryDto } from '../../phases/dto/phase-response.dto';
import { TeamSummaryDto } from '../../teams/dto/team-response.dto';

// Datos mínimos de un grupo para mostrarlo dentro de un partido
export class GroupSummaryDto {
  id!: number;
  name!: string;
}

export class GroupResponseDto extends GroupSummaryDto {
  phase!: PhaseSummaryDto;
  teams!: TeamSummaryDto[];
}
