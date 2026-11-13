import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { Match } from '../matches/entities/match.entity';
import { TournamentVenue } from '../tournament-venues/entities/tournament-venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
import { Venue } from './entities/venue.entity';
import { VenueMapper } from './mappers/venue.mapper';

// Catálogo de escenarios donde se disputan los partidos (HU-GC-06)
@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue) private readonly venuesRepository: Repository<Venue>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectRepository(TournamentVenue) private readonly tournamentVenuesRepository: Repository<TournamentVenue>,
    private readonly venueMapper: VenueMapper,
  ) {}

  async create(dto: CreateVenueDto): Promise<VenueResponseDto> {
    await this.ensureNameIsAvailable(dto.name);
    const saved = await this.venuesRepository.save(this.venueMapper.toEntity(dto));
    return this.venueMapper.toResponseDto(saved);
  }

  async findAll(): Promise<VenueResponseDto[]> {
    const venues = await this.venuesRepository.find({ order: { name: 'ASC' } });
    return this.venueMapper.toResponseDtoList(venues);
  }

  async findOne(id: number): Promise<VenueResponseDto> {
    return this.venueMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateVenueDto): Promise<VenueResponseDto> {
    const venue = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(dto.name, id);
    }
    const saved = await this.venuesRepository.save(this.venueMapper.mergeEntity(venue, dto));
    return this.venueMapper.toResponseDto(saved);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<VenueResponseDto> {
    const venue = await this.findOrFail(id);
    venue.active = dto.active;
    return this.venueMapper.toResponseDto(await this.venuesRepository.save(venue));
  }

  async remove(id: number): Promise<{ message: string }> {
    const venue = await this.findOrFail(id);
    const [hasMatches, hasTournaments] = await Promise.all([
      this.matchesRepository.existsBy({ venue: { id } }),
      this.tournamentVenuesRepository.existsBy({ venue: { id } }),
    ]);
    if (hasMatches || hasTournaments) {
      throw new ConflictException(
        `No se puede eliminar "${venue.name}" porque tiene partidos o torneos asignados. Puedes desactivarlo.`,
      );
    }
    await this.venuesRepository.remove(venue);
    return { message: `Escenario "${venue.name}" eliminado correctamente` };
  }

  async findOrFail(id: number): Promise<Venue> {
    const venue = await this.venuesRepository.findOneBy({ id });
    if (!venue) {
      throw new NotFoundException(`Escenario con id ${id} no encontrado`);
    }
    return venue;
  }

  // Usado por los partidos: el escenario debe existir y estar activo
  async findActiveOrFail(id: number): Promise<Venue> {
    const venue = await this.findOrFail(id);
    if (!venue.active) {
      throw new BadRequestException(`El escenario "${venue.name}" está inactivo`);
    }
    return venue;
  }

  private async ensureNameIsAvailable(name: string, excludeId?: number): Promise<void> {
    const taken = await this.venuesRepository.existsBy({
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un escenario llamado "${name}"`);
    }
  }
}
