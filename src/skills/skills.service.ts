import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';

// HU-GD-06: catálogo de habilidades deportivas
@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(PlayerSkill) private readonly playerSkillsRepository: Repository<PlayerSkill>,
    private readonly skillMapper: SkillMapper,
  ) {}

  async create(dto: CreateSkillDto): Promise<SkillResponseDto> {
    await this.ensureNameIsAvailable(dto.name);
    const saved = await this.skillsRepository.save(this.skillMapper.toEntity(dto));
    return this.skillMapper.toResponseDto(saved);
  }

  async findAll(): Promise<SkillResponseDto[]> {
    const skills = await this.skillsRepository.find({ order: { name: 'ASC' } });
    return this.skillMapper.toResponseDtoList(skills);
  }

  async findOne(id: number): Promise<SkillResponseDto> {
    return this.skillMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateSkillDto): Promise<SkillResponseDto> {
    const skill = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(dto.name, id);
    }
    const saved = await this.skillsRepository.save(this.skillMapper.mergeEntity(skill, dto));
    return this.skillMapper.toResponseDto(saved);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<SkillResponseDto> {
    const skill = await this.findOrFail(id);
    skill.active = dto.active;
    return this.skillMapper.toResponseDto(await this.skillsRepository.save(skill));
  }

  async remove(id: number): Promise<{ message: string }> {
    const skill = await this.findOrFail(id);
    await this.ensureIsNotAssigned(skill);
    await this.skillsRepository.remove(skill);
    return { message: `Habilidad "${skill.name}" eliminada correctamente` };
  }

  async findOrFail(id: number): Promise<Skill> {
    const skill = await this.skillsRepository.findOneBy({ id });
    if (!skill) {
      throw new NotFoundException(`Habilidad con id ${id} no encontrada`);
    }
    return skill;
  }

  // Usado por las asignaciones: la habilidad debe existir y estar activa
  async findActiveOrFail(id: number): Promise<Skill> {
    const skill = await this.findOrFail(id);
    if (!skill.active) {
      throw new BadRequestException(`La habilidad "${skill.name}" está inactiva`);
    }
    return skill;
  }

  private async ensureNameIsAvailable(name: string, excludeId?: number): Promise<void> {
    const taken = await this.skillsRepository.existsBy({
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe una habilidad llamada "${name}"`);
    }
  }

  private async ensureIsNotAssigned(skill: Skill): Promise<void> {
    const isAssigned = await this.playerSkillsRepository.existsBy({ skill: { id: skill.id } });
    if (isAssigned) {
      throw new ConflictException(
        `No se puede eliminar "${skill.name}" porque está asignada a jugadores. Puedes desactivarla.`,
      );
    }
  }
}
