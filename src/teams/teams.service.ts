import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';

// HU-GD-02: gestión de equipos
@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamSport) private readonly teamSportsRepository: Repository<TeamSport>,
    @InjectRepository(PlayerContract) private readonly contractsRepository: Repository<PlayerContract>,
    private readonly teamMapper: TeamMapper,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    await this.ensureNameIsAvailable(dto.name);
    const saved = await this.teamsRepository.save(this.teamMapper.toEntity(dto));
    return this.teamMapper.toResponseDto(saved);
  }

  async findAll(): Promise<TeamResponseDto[]> {
    const teams = await this.teamsRepository.find({ order: { name: 'ASC' } });
    return this.teamMapper.toResponseDtoList(teams);
  }

  async findOne(id: number): Promise<TeamResponseDto> {
    return this.teamMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    const team = await this.findOrFail(id);
    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(dto.name, id);
    }
    const saved = await this.teamsRepository.save(this.teamMapper.mergeEntity(team, dto));
    return this.teamMapper.toResponseDto(saved);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<TeamResponseDto> {
    const team = await this.findOrFail(id);
    team.active = dto.active;
    return this.teamMapper.toResponseDto(await this.teamsRepository.save(team));
  }

  async remove(id: number): Promise<{ message: string }> {
    const team = await this.findOrFail(id);
    await this.ensureHasNoDependencies(team);
    await this.teamsRepository.remove(team);
    return { message: `Equipo "${team.name}" eliminado correctamente` };
  }

  async findOrFail(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOneBy({ id });
    if (!team) {
      throw new NotFoundException(`Equipo con id ${id} no encontrado`);
    }
    return team;
  }

  // Usado por las asociaciones: el equipo debe existir y estar activo
  async findActiveOrFail(id: number): Promise<Team> {
    const team = await this.findOrFail(id);
    if (!team.active) {
      throw new BadRequestException(`El equipo "${team.name}" está inactivo`);
    }
    return team;
  }

  private async ensureNameIsAvailable(name: string, excludeId?: number): Promise<void> {
    const taken = await this.teamsRepository.existsBy({
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un equipo llamado "${name}"`);
    }
  }

  private async ensureHasNoDependencies(team: Team): Promise<void> {
    const [hasSports, hasContracts] = await Promise.all([
      this.teamSportsRepository.existsBy({ team: { id: team.id } }),
      this.contractsRepository.existsBy({ team: { id: team.id } }),
    ]);
    if (hasSports || hasContracts) {
      throw new ConflictException(
        `No se puede eliminar "${team.name}" porque tiene deportes o jugadores asociados. Puedes desactivarlo.`,
      );
    }
  }
}
