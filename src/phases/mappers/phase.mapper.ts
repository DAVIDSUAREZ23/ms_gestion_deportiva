import { Injectable } from '@nestjs/common';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { TournamentMapper } from '../../tournaments/mappers/tournament.mapper';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { PhaseResponseDto, PhaseSummaryDto } from '../dto/phase-response.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { Phase } from '../entities/phase.entity';

@Injectable()
export class PhaseMapper {
  constructor(private readonly tournamentMapper: TournamentMapper) {}

  toEntity(dto: CreatePhaseDto, tournament: Tournament): Phase {
    const phase = new Phase();
    phase.tournament = tournament;
    phase.name = dto.name;
    phase.type = dto.type;
    phase.order = dto.order;
    return phase;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(phase: Phase, dto: UpdatePhaseDto): Phase {
    if (dto.name !== undefined) phase.name = dto.name;
    if (dto.type !== undefined) phase.type = dto.type;
    if (dto.order !== undefined) phase.order = dto.order;
    return phase;
  }

  toSummaryDto(phase: Phase): PhaseSummaryDto {
    return { id: phase.id, name: phase.name, type: phase.type, order: phase.order };
  }

  toResponseDto(phase: Phase): PhaseResponseDto {
    return { ...this.toSummaryDto(phase), tournament: this.tournamentMapper.toSummaryDto(phase.tournament) };
  }

  toResponseDtoList(phases: Phase[]): PhaseResponseDto[] {
    return phases.map((phase) => this.toResponseDto(phase));
  }
}
