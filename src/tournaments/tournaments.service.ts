import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { Phase } from '../phases/entities/phase.entity';
import { Sport } from '../sports/entities/sport.entity';
import { SportsService } from '../sports/sports.service';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';

type TournamentDates = Pick<Tournament, 'registrationDeadline' | 'startDate' | 'endDate'>;

// HU-GC-01: gestión de torneos
@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TournamentRegistration) private readonly registrationsRepository: Repository<TournamentRegistration>,
    @InjectRepository(Phase) private readonly phasesRepository: Repository<Phase>,
    private readonly sportsService: SportsService,
    private readonly tournamentMapper: TournamentMapper,
  ) {}

  async create(dto: CreateTournamentDto): Promise<TournamentResponseDto> {
    this.ensureValidDates(dto);
    await this.ensureNameIsAvailable(dto.name);
    const sport = await this.sportsService.findActiveOrFail(dto.sportId);
    const saved = await this.tournamentsRepository.save(this.tournamentMapper.toEntity(dto, sport));
    return this.findOne(saved.id);
  }

  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentsRepository.find({
      relations: { sport: true },
      order: { startDate: 'DESC', name: 'ASC' },
    });
    return this.tournamentMapper.toResponseDtoList(tournaments);
  }

  async findOne(id: number): Promise<TournamentResponseDto> {
    return this.tournamentMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateTournamentDto): Promise<TournamentResponseDto> {
    const tournament = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(dto.name, id);
    }
    const sport = await this.resolveSportChange(tournament, dto.sportId);
    this.ensureValidDates({ ...this.datesOf(tournament), ...this.definedDates(dto) });
    await this.tournamentsRepository.save(this.tournamentMapper.mergeEntity(tournament, dto, sport));
    return this.findOne(id);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<TournamentResponseDto> {
    const tournament = await this.findOrFail(id);
    tournament.active = dto.active;
    await this.tournamentsRepository.save(tournament);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tournament = await this.findOrFail(id);
    if (await this.hasDependencies(id)) {
      throw new ConflictException(
        `No se puede eliminar "${tournament.name}" porque tiene equipos inscritos, fases o partidos. Puedes desactivarlo.`,
      );
    }
    await this.tournamentsRepository.remove(tournament);
    return { message: `Torneo "${tournament.name}" eliminado correctamente` };
  }

  async findOrFail(id: number): Promise<Tournament> {
    const tournament = await this.tournamentsRepository.findOne({ where: { id }, relations: { sport: true } });
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }
    return tournament;
  }

  // Usado por inscripciones y fases: el torneo debe existir y estar activo
  async findActiveOrFail(id: number): Promise<Tournament> {
    const tournament = await this.findOrFail(id);
    if (!tournament.active) {
      throw new BadRequestException(`El torneo "${tournament.name}" está inactivo`);
    }
    return tournament;
  }

  // El cierre de inscripciones no puede ser posterior al inicio, ni el inicio posterior al fin
  private ensureValidDates({ registrationDeadline, startDate, endDate }: TournamentDates): void {
    if (registrationDeadline > startDate) {
      throw new BadRequestException('El cierre de inscripciones debe ser igual o anterior a la fecha de inicio');
    }
    if (startDate > endDate) {
      throw new BadRequestException('La fecha de inicio debe ser igual o anterior a la fecha de fin');
    }
  }

  // El deporte solo se cambia mientras el torneo no tenga inscripciones ni fases
  private async resolveSportChange(tournament: Tournament, sportId?: number): Promise<Sport | undefined> {
    if (sportId === undefined || sportId === tournament.sport.id) {
      return undefined;
    }
    if (await this.hasDependencies(tournament.id)) {
      throw new ConflictException('No se puede cambiar el deporte de un torneo con equipos inscritos o fases');
    }
    return this.sportsService.findActiveOrFail(sportId);
  }

  private async hasDependencies(tournamentId: number): Promise<boolean> {
    const [hasRegistrations, hasPhases] = await Promise.all([
      this.registrationsRepository.existsBy({ tournament: { id: tournamentId } }),
      this.phasesRepository.existsBy({ tournament: { id: tournamentId } }),
    ]);
    return hasRegistrations || hasPhases;
  }

  private async ensureNameIsAvailable(name: string, excludeId?: number): Promise<void> {
    const taken = await this.tournamentsRepository.existsBy({
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un torneo llamado "${name}"`);
    }
  }

  private datesOf(tournament: Tournament): TournamentDates {
    const { registrationDeadline, startDate, endDate } = tournament;
    return { registrationDeadline, startDate, endDate };
  }

  private definedDates(dto: UpdateTournamentDto): Partial<TournamentDates> {
    return Object.fromEntries(
      Object.entries({
        registrationDeadline: dto.registrationDeadline,
        startDate: dto.startDate,
        endDate: dto.endDate,
      }).filter(([, value]) => value !== undefined),
    );
  }
}
