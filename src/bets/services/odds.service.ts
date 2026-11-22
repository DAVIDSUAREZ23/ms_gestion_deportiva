import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Match, MatchStatus } from '../../matches/entities/match.entity';
import { OddResponseDto } from '../dto/odd-response.dto';
import { SetOddDto } from '../dto/set-odd.dto';
import { UpdateOddDto } from '../dto/update-odd.dto';
import { BetSelection, MatchOdd } from '../entities/match-odd.entity';
import { OddMapper } from '../mappers/odd.mapper';

// Cuotas de cada partido: las administra el administrador y solo se editan mientras el partido está programado
@Injectable()
export class OddsService {
  constructor(
    @InjectRepository(MatchOdd) private readonly oddsRepository: Repository<MatchOdd>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly oddMapper: OddMapper,
  ) {}

  async findByMatch(matchId: number): Promise<OddResponseDto[]> {
    await this.findMatchOrFail(matchId);
    const odds = await this.oddsRepository.find({
      where: { match: { id: matchId } },
      relations: { match: true },
      order: { selection: 'ASC' },
    });
    return this.oddMapper.toResponseDtoList(odds);
  }

  async create(matchId: number, dto: SetOddDto): Promise<OddResponseDto> {
    const match = await this.findMatchOrFail(matchId);
    this.ensureScheduled(match);
    const taken = await this.oddsRepository.existsBy({
      match: { id: matchId },
      selection: dto.selection,
    });
    if (taken) {
      throw new ConflictException('Ese resultado ya tiene una cuota para el partido');
    }
    const saved = await this.oddsRepository.save(Object.assign(new MatchOdd(), { match, ...dto }));
    return this.oddMapper.toResponseDto(saved);
  }

  async update(id: number, dto: UpdateOddDto): Promise<OddResponseDto> {
    if (dto.odds === undefined && dto.active === undefined) {
      throw new BadRequestException('Debes enviar la cuota o el estado');
    }
    const odd = await this.oddsRepository.findOne({ where: { id }, relations: { match: true } });
    if (!odd) {
      throw new NotFoundException(`Cuota con id ${id} no encontrada`);
    }
    this.ensureScheduled(odd.match);
    if (dto.odds !== undefined) odd.odds = dto.odds;
    if (dto.active !== undefined) odd.active = dto.active;
    return this.oddMapper.toResponseDto(await this.oddsRepository.save(odd));
  }

  // Guarda el set completo: crea o actualiza las selecciones enviadas y desactiva las que no vienen
  async replaceForMatch(
    matchId: number,
    items: SetOddDto[],
    manager?: EntityManager,
  ): Promise<OddResponseDto[]> {
    const matchesRepository = manager ? manager.getRepository(Match) : this.matchesRepository;
    const oddsRepository = manager ? manager.getRepository(MatchOdd) : this.oddsRepository;

    const match = await matchesRepository.findOneBy({ id: matchId });
    if (!match) {
      throw new NotFoundException(`Partido con id ${matchId} no encontrado`);
    }
    this.ensureScheduled(match);

    const existing = await oddsRepository.find({
      where: { match: { id: matchId } },
      relations: { match: true },
    });
    const sentSelections = new Set(items.map((item) => item.selection));
    const toSave = items.map((item) => {
      const odd =
        existing.find((candidate) => candidate.selection === item.selection) ??
        Object.assign(new MatchOdd(), { match, selection: item.selection });
      odd.odds = item.odds;
      odd.active = true;
      return odd;
    });
    for (const odd of existing) {
      if (!sentSelections.has(odd.selection)) {
        odd.active = false;
        toSave.push(odd);
      }
    }

    await oddsRepository.save(toSave);
    const saved = await oddsRepository.find({
      where: { match: { id: matchId } },
      relations: { match: true },
      order: { selection: 'ASC' },
    });
    return this.oddMapper.toResponseDtoList(saved);
  }

  // Usado por las apuestas: debe existir una cuota activa para la selección
  async findActiveOrFail(matchId: number, selection: BetSelection): Promise<MatchOdd> {
    const odd = await this.oddsRepository.findOne({
      where: { match: { id: matchId }, selection, active: true },
      relations: { match: true },
    });
    if (!odd) {
      throw new BadRequestException('No hay una cuota activa para ese resultado en este partido');
    }
    return odd;
  }

  private async findMatchOrFail(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOneBy({ id });
    if (!match) {
      throw new NotFoundException(`Partido con id ${id} no encontrado`);
    }
    return match;
  }

  private ensureScheduled(match: Match): void {
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Solo se pueden administrar las cuotas de un partido programado');
    }
  }
}
