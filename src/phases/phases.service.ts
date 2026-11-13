import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Match } from '../matches/entities/match.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentsService } from '../tournaments/tournaments.service';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { Final, FinalRound } from './entities/final.entity';
import { Phase, PhaseType } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';

const PHASE_RELATIONS = { tournament: { sport: true }, final: true } as const;

// HU-GC-03 y HU-GC-05: fases de un torneo (de grupos o finales por eliminación) y su orden.
// Las fases finales tienen su propia entidad Final con la ronda (octavos, cuartos, semifinal...).
@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase) private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(Final) private readonly finalsRepository: Repository<Final>,
    @InjectRepository(CompetitionGroup) private readonly groupsRepository: Repository<CompetitionGroup>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly tournamentsService: TournamentsService,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  async create(dto: CreatePhaseDto): Promise<PhaseResponseDto> {
    const tournament = await this.tournamentsService.findActiveOrFail(dto.tournamentId);
    await this.ensureOrderIsAvailable(tournament, dto.order);
    const phase = this.phaseMapper.toEntity(dto, tournament);
    phase.final = this.buildFinal(dto.type, dto.round);
    const saved = await this.phasesRepository.save(phase);
    return this.findOne(saved.id);
  }

  async findByTournament(tournamentId: number): Promise<PhaseResponseDto[]> {
    await this.tournamentsService.findOrFail(tournamentId);
    const phases = await this.phasesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: PHASE_RELATIONS,
      order: { order: 'ASC' },
    });
    return this.phaseMapper.toResponseDtoList(phases);
  }

  async findOne(id: number): Promise<PhaseResponseDto> {
    return this.phaseMapper.toResponseDto(await this.findOrFail(id));
  }

  // Modificar una fase no afecta a las demás fases ni al torneo
  async update(id: number, dto: UpdatePhaseDto): Promise<PhaseResponseDto> {
    const phase = await this.findOrFail(id);
    if (dto.order !== undefined) {
      await this.ensureOrderIsAvailable(phase.tournament, dto.order, id);
    }
    if (dto.type !== undefined && dto.type !== phase.type && (await this.hasDependencies(id))) {
      throw new ConflictException('No se puede cambiar el tipo de una fase que ya tiene grupos o partidos');
    }
    const type = dto.type ?? phase.type;
    const round = dto.round !== undefined ? dto.round : (phase.final?.round ?? null);
    await this.syncFinal(phase, type, round);
    await this.phasesRepository.save(this.phaseMapper.mergeEntity(phase, dto));
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const phase = await this.findOrFail(id);
    if (await this.hasDependencies(id)) {
      throw new ConflictException(`No se puede eliminar la fase "${phase.name}" porque tiene grupos o partidos`);
    }
    await this.phasesRepository.remove(phase);
    return { message: `Fase "${phase.name}" eliminada correctamente` };
  }

  async findOrFail(id: number): Promise<Phase> {
    const phase = await this.phasesRepository.findOne({ where: { id }, relations: PHASE_RELATIONS });
    if (!phase) {
      throw new NotFoundException(`Fase con id ${id} no encontrada`);
    }
    return phase;
  }

  // Una fase final siempre lleva ronda; una fase de grupos nunca
  private buildFinal(type: PhaseType, round: FinalRound | null | undefined): Final | null {
    if (type === PhaseType.GROUP_STAGE) {
      if (round) {
        throw new BadRequestException('La ronda solo aplica a fases finales');
      }
      return null;
    }
    if (!round) {
      throw new BadRequestException('Indica la ronda de la fase final (octavos, cuartos, semifinal, tercer puesto o final)');
    }
    return Object.assign(new Final(), { round });
  }

  // Crea, actualiza o elimina la entidad Final según el tipo resultante de la fase
  private async syncFinal(phase: Phase, type: PhaseType, round: FinalRound | null): Promise<void> {
    const wanted = this.buildFinal(type, type === PhaseType.GROUP_STAGE ? null : round);
    if (!wanted && phase.final) {
      await this.finalsRepository.remove(phase.final);
      phase.final = null;
    } else if (wanted && phase.final) {
      phase.final.round = wanted.round;
    } else {
      phase.final = wanted;
    }
  }

  private async ensureOrderIsAvailable(tournament: Tournament, order: number, excludeId?: number): Promise<void> {
    const taken = await this.phasesRepository.existsBy({
      tournament: { id: tournament.id },
      order,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`El torneo "${tournament.name}" ya tiene una fase en la posición ${order}`);
    }
  }

  private async hasDependencies(phaseId: number): Promise<boolean> {
    const [hasGroups, hasMatches] = await Promise.all([
      this.groupsRepository.existsBy({ phase: { id: phaseId } }),
      this.matchesRepository.existsBy({ phase: { id: phaseId } }),
    ]);
    return hasGroups || hasMatches;
  }
}
