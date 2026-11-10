import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { CreateSportDto } from './dto/create-sport.dto';
import { SportDetailResponseDto, SportResponseDto } from './dto/sport-response.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';

// HU-GD-01: gestión de deportes y subdeportes
@Injectable()
export class SportsService {
  constructor(
    @InjectRepository(Sport) private readonly sportsRepository: Repository<Sport>,
    @InjectRepository(TeamSport) private readonly teamSportsRepository: Repository<TeamSport>,
    private readonly sportMapper: SportMapper,
  ) {}

  async create(dto: CreateSportDto): Promise<SportDetailResponseDto> {
    await this.ensureNameIsAvailable(dto.name);
    const parent = await this.resolveParent(dto.parentId);
    const saved = await this.sportsRepository.save(this.sportMapper.toEntity(dto, parent));
    return this.findOne(saved.id);
  }

  async findAll(): Promise<SportResponseDto[]> {
    const sports = await this.sportsRepository.find({ relations: { parent: true }, order: { name: 'ASC' } });
    return this.sportMapper.toResponseDtoList(sports);
  }

  async findOne(id: number): Promise<SportDetailResponseDto> {
    return this.sportMapper.toDetailResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateSportDto): Promise<SportDetailResponseDto> {
    const sport = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(dto.name, id);
    }
    const parent = dto.parentId === undefined ? undefined : await this.resolveParent(dto.parentId, sport);
    await this.sportsRepository.save(this.sportMapper.mergeEntity(sport, dto, parent));
    return this.findOne(id);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<SportDetailResponseDto> {
    const sport = await this.findOrFail(id);
    sport.active = dto.active;
    await this.sportsRepository.save(sport);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const sport = await this.findOrFail(id);
    await this.ensureHasNoDependencies(sport);
    await this.sportsRepository.remove(sport);
    return { message: `Deporte "${sport.name}" eliminado correctamente` };
  }

  // Usado por las asociaciones: el deporte debe existir y estar activo
  async findActiveOrFail(id: number): Promise<Sport> {
    const sport = await this.findOrFail(id);
    if (!sport.active) {
      throw new BadRequestException(`El deporte "${sport.name}" está inactivo`);
    }
    return sport;
  }

  async findOrFail(id: number): Promise<Sport> {
    const sport = await this.sportsRepository.findOne({
      where: { id },
      relations: { parent: true, subSports: true },
    });
    if (!sport) {
      throw new NotFoundException(`Deporte con id ${id} no encontrado`);
    }
    return sport;
  }

  private async ensureNameIsAvailable(name: string, excludeId?: number): Promise<void> {
    const taken = await this.sportsRepository.existsBy({
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un deporte llamado "${name}"`);
    }
  }

  // Valida el deporte padre: existe, no es el mismo deporte y solo se permite un nivel de subdeportes
  private async resolveParent(parentId: number | null | undefined, child?: Sport): Promise<Sport | null> {
    if (parentId === null || parentId === undefined) {
      return null;
    }
    if (child && parentId === child.id) {
      throw new BadRequestException('Un deporte no puede ser subdeporte de sí mismo');
    }
    const parent = await this.findOrFail(parentId);
    if (parent.parent) {
      throw new BadRequestException(`"${parent.name}" ya es un subdeporte; solo se permite un nivel`);
    }
    if (child && child.subSports.length > 0) {
      throw new BadRequestException(`"${child.name}" tiene subdeportes y no puede convertirse en subdeporte`);
    }
    return parent;
  }

  private async ensureHasNoDependencies(sport: Sport): Promise<void> {
    const hasTeams = await this.teamSportsRepository.existsBy({ sport: { id: sport.id } });
    if (sport.subSports.length > 0 || hasTeams) {
      throw new ConflictException(
        `No se puede eliminar "${sport.name}" porque tiene subdeportes o equipos asociados. Puedes desactivarlo.`,
      );
    }
  }
}
