import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Match } from '../matches/entities/match.entity';
import { Phase, PhaseType } from '../phases/entities/phase.entity';
import { PhasesService } from '../phases/phases.service';
import { Team } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { TournamentRegistrationsService } from '../tournament-registrations/tournament-registrations.service';
import { CreateGroupTeamDto } from './dto/create-group-team.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CompetitionGroup } from './entities/competition-group.entity';
import { GroupTeam } from './entities/group-team.entity';
import { GroupMapper } from './mappers/group.mapper';

const WITH_PHASE_AND_TEAMS = { phase: { tournament: { sport: true } }, groupTeams: { team: true } } as const;

// HU-GC-04: grupos de una fase de grupos y los equipos que los conforman
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(CompetitionGroup) private readonly groupsRepository: Repository<CompetitionGroup>,
    @InjectRepository(GroupTeam) private readonly groupTeamsRepository: Repository<GroupTeam>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly phasesService: PhasesService,
    private readonly teamsService: TeamsService,
    private readonly registrationsService: TournamentRegistrationsService,
    private readonly groupMapper: GroupMapper,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupResponseDto> {
    const phase = await this.phasesService.findOrFail(dto.phaseId);
    this.ensureIsGroupStage(phase);
    await this.ensureNameIsAvailable(phase, dto.name);
    const saved = await this.groupsRepository.save(this.groupMapper.toEntity(dto, phase));
    return this.findOne(saved.id);
  }

  async findByPhase(phaseId: number): Promise<GroupResponseDto[]> {
    await this.phasesService.findOrFail(phaseId);
    const groups = await this.groupsRepository.find({
      where: { phase: { id: phaseId } },
      relations: WITH_PHASE_AND_TEAMS,
      order: { name: 'ASC' },
    });
    return this.groupMapper.toResponseDtoList(groups);
  }

  async findOne(id: number): Promise<GroupResponseDto> {
    return this.groupMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const group = await this.findOrFail(id);
    await this.ensureNameIsAvailable(group.phase, dto.name, id);
    group.name = dto.name;
    await this.groupsRepository.save(group);
    return this.findOne(id);
  }

  // Elimina el grupo y sus asignaciones, nunca los equipos de la plataforma
  async remove(id: number): Promise<{ message: string }> {
    const group = await this.findOrFail(id);
    if (await this.matchesRepository.existsBy({ group: { id } })) {
      throw new ConflictException(`No se puede eliminar el grupo "${group.name}" porque ya tiene partidos`);
    }
    await this.groupsRepository.manager.transaction(async (manager) => {
      await manager.delete(GroupTeam, { group: { id } });
      await manager.delete(CompetitionGroup, { id });
    });
    return { message: `Grupo "${group.name}" eliminado correctamente` };
  }

  async assignTeam(dto: CreateGroupTeamDto): Promise<GroupResponseDto> {
    const group = await this.findOrFail(dto.groupId);
    const team = await this.teamsService.findActiveOrFail(dto.teamId);
    await this.registrationsService.ensureRegistered(group.phase.tournament, team);
    this.ensureNotInGroup(group, team);
    await this.ensureNotInOtherGroupOfPhase(group, team);
    await this.groupTeamsRepository.save(this.groupMapper.toGroupTeamEntity(group, team));
    return this.findOne(group.id);
  }

  async unassignTeam(groupId: number, teamId: number): Promise<{ message: string }> {
    const group = await this.findOrFail(groupId);
    const groupTeam = group.groupTeams.find((assignment) => assignment.team.id === teamId);
    if (!groupTeam) {
      throw new NotFoundException(`El equipo no pertenece al grupo "${group.name}"`);
    }
    if (await this.teamHasMatchesInGroup(groupId, teamId)) {
      throw new ConflictException(`"${groupTeam.team.name}" ya tiene partidos en el grupo "${group.name}"`);
    }
    await this.groupTeamsRepository.remove(groupTeam);
    return { message: `"${groupTeam.team.name}" salió del grupo "${group.name}"` };
  }

  // Usado por los partidos: el grupo debe existir y ambos equipos deben pertenecer a él
  async findOrFail(id: number): Promise<CompetitionGroup> {
    const group = await this.groupsRepository.findOne({ where: { id }, relations: WITH_PHASE_AND_TEAMS });
    if (!group) {
      throw new NotFoundException(`Grupo con id ${id} no encontrado`);
    }
    return group;
  }

  private ensureIsGroupStage(phase: Phase): void {
    if (phase.type !== PhaseType.GROUP_STAGE) {
      throw new BadRequestException(`"${phase.name}" no es una fase de grupos`);
    }
  }

  private async ensureNameIsAvailable(phase: Phase, name: string, excludeId?: number): Promise<void> {
    const taken = await this.groupsRepository.existsBy({
      phase: { id: phase.id },
      name,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`La fase "${phase.name}" ya tiene un grupo llamado "${name}"`);
    }
  }

  private ensureNotInGroup(group: CompetitionGroup, team: Team): void {
    if (group.groupTeams.some((assignment) => assignment.team.id === team.id)) {
      throw new ConflictException(`"${team.name}" ya pertenece al grupo "${group.name}"`);
    }
  }

  // Un equipo no puede estar al mismo tiempo en dos grupos de la misma fase
  private async ensureNotInOtherGroupOfPhase(group: CompetitionGroup, team: Team): Promise<void> {
    const other = await this.groupTeamsRepository.findOne({
      where: { team: { id: team.id }, group: { phase: { id: group.phase.id } } },
      relations: { group: true },
    });
    if (other) {
      throw new ConflictException(`"${team.name}" ya está en el grupo "${other.group.name}" de esta fase`);
    }
  }

  private teamHasMatchesInGroup(groupId: number, teamId: number): Promise<boolean> {
    return this.matchesRepository.exists({
      where: [
        { group: { id: groupId }, homeTeam: { id: teamId } },
        { group: { id: groupId }, awayTeam: { id: teamId } },
      ],
    });
  }
}
