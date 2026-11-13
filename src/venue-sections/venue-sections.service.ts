import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { Venue } from '../venues/entities/venue.entity';
import { VenuesService } from '../venues/venues.service';
import { CreateVenueSectionDto } from './dto/create-venue-section.dto';
import { UpdateVenueSectionDto } from './dto/update-venue-section.dto';
import { VenueSectionResponseDto } from './dto/venue-section-response.dto';
import { VenueSection } from './entities/venue-section.entity';
import { VenueSectionMapper } from './mappers/venue-section.mapper';

// Localidad: zonas de cada escenario con su cupo y su precio
@Injectable()
export class VenueSectionsService {
  constructor(
    @InjectRepository(VenueSection) private readonly sectionsRepository: Repository<VenueSection>,
    @InjectRepository(Ticket) private readonly ticketsRepository: Repository<Ticket>,
    private readonly venuesService: VenuesService,
    private readonly sectionMapper: VenueSectionMapper,
  ) {}

  async create(dto: CreateVenueSectionDto): Promise<VenueSectionResponseDto> {
    const venue = await this.venuesService.findOrFail(dto.venueId);
    await this.ensureNameIsAvailable(venue, dto.name);
    await this.ensureFitsVenueCapacity(venue, dto.capacity);
    const saved = await this.sectionsRepository.save(this.sectionMapper.toEntity(dto, venue));
    return this.sectionMapper.toResponseDto(saved);
  }

  async findByVenue(venueId: number): Promise<VenueSectionResponseDto[]> {
    await this.venuesService.findOrFail(venueId);
    const sections = await this.sectionsRepository.find({
      where: { venue: { id: venueId } },
      relations: { venue: true },
      order: { price: 'DESC', name: 'ASC' },
    });
    return this.sectionMapper.toResponseDtoList(sections);
  }

  async update(id: number, dto: UpdateVenueSectionDto): Promise<VenueSectionResponseDto> {
    const section = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(section.venue, dto.name, id);
    }
    if (dto.capacity !== undefined) {
      await this.ensureCapacityChangeAllowed(section, dto.capacity);
      await this.ensureFitsVenueCapacity(section.venue, dto.capacity, id);
    }
    const saved = await this.sectionsRepository.save(this.sectionMapper.mergeEntity(section, dto));
    return this.sectionMapper.toResponseDto(saved);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<VenueSectionResponseDto> {
    const section = await this.findOrFail(id);
    section.active = dto.active;
    return this.sectionMapper.toResponseDto(await this.sectionsRepository.save(section));
  }

  async remove(id: number): Promise<{ message: string }> {
    const section = await this.findOrFail(id);
    if (await this.ticketsRepository.existsBy({ section: { id } })) {
      throw new ConflictException(`No se puede eliminar "${section.name}" porque tiene boletos vendidos. Puedes desactivarla.`);
    }
    await this.sectionsRepository.remove(section);
    return { message: `Localidad "${section.name}" eliminada correctamente` };
  }

  async findOrFail(id: number): Promise<VenueSection> {
    const section = await this.sectionsRepository.findOne({ where: { id }, relations: { venue: true } });
    if (!section) {
      throw new NotFoundException(`Localidad con id ${id} no encontrada`);
    }
    return section;
  }

  private async ensureNameIsAvailable(venue: Venue, name: string, excludeId?: number): Promise<void> {
    const taken = await this.sectionsRepository.existsBy({
      venue: { id: venue.id },
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`"${venue.name}" ya tiene una localidad llamada "${name}"`);
    }
  }

  // La suma de cupos de las localidades no puede superar la capacidad del escenario (si está definida)
  private async ensureFitsVenueCapacity(venue: Venue, capacity: number, excludeId?: number): Promise<void> {
    if (!venue.capacity) return;
    const others = await this.sectionsRepository.find({
      where: { venue: { id: venue.id }, ...(excludeId !== undefined && { id: Not(excludeId) }) },
    });
    const total = others.reduce((sum, section) => sum + section.capacity, 0) + capacity;
    if (total > venue.capacity) {
      throw new BadRequestException(
        `Las localidades sumarían ${total.toLocaleString('es-CO')} cupos y "${venue.name}" tiene capacidad para ${venue.capacity.toLocaleString('es-CO')}`,
      );
    }
  }

  // Con boletos vendidos el cupo solo puede aumentar, para no dejar boletos por encima del cupo
  private async ensureCapacityChangeAllowed(section: VenueSection, capacity: number): Promise<void> {
    const hasSoldTickets = await this.ticketsRepository.existsBy({ section: { id: section.id }, status: TicketStatus.ACTIVE });
    if (capacity < section.capacity && hasSoldTickets) {
      throw new ConflictException(`"${section.name}" tiene boletos vendidos: su cupo solo puede aumentar`);
    }
  }
}
