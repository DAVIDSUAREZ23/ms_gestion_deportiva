import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Match } from '../matches/entities/match.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentsService } from '../tournaments/tournaments.service';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';

// HU-GC-03 y HU-GC-05: fases de un torneo (de grupos o finales por eliminación) y su orden
@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase) private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(CompetitionGroup) private readonly groupsRepository: Repository<CompetitionGroup>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly tournamentsService: TournamentsService,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  async create(dto: CreatePhaseDto): Promise<PhaseResponseDto> {
    const tournament = await this.tournamentsService.findActiveOrFail(dto.tournamentId);
    await this.ensureOrderIsAvailable(tournament, dto.order);
    const saved = await this.phasesRepository.save(this.phaseMapper.toEntity(dto, tournament));
    return this.findOne(saved.id);
  }

  async findByTournament(tournamentId: number): Promise<PhaseResponseDto[]> {
    await this.tournamentsService.findOrFail(tournamentId);
    const phases = await this.phasesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: { tournament: { sport: true } },
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
    const phase = await this.phasesRepository.findOne({ where: { id }, relations: { tournament: { sport: true } } });
    if (!phase) {
      throw new NotFoundException(`Fase con id ${id} no encontrada`);
    }
    return phase;
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
