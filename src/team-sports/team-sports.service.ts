import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sport } from '../sports/entities/sport.entity';
import { SportsService } from '../sports/sports.service';
import { Team } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { CreateTeamSportDto } from './dto/create-team-sport.dto';
import { TeamSportResponseDto } from './dto/team-sport-response.dto';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';

// HU-GD-03: asociación entre equipos y los deportes en los que participan
@Injectable()
export class TeamSportsService {
  constructor(
    @InjectRepository(TeamSport) private readonly teamSportsRepository: Repository<TeamSport>,
    private readonly teamsService: TeamsService,
    private readonly sportsService: SportsService,
    private readonly teamSportMapper: TeamSportMapper,
  ) {}

  async assign(dto: CreateTeamSportDto): Promise<TeamSportResponseDto> {
    const team = await this.teamsService.findActiveOrFail(dto.teamId);
    const sport = await this.sportsService.findActiveOrFail(dto.sportId);
    await this.ensureNotLinked(team, sport);
    const saved = await this.teamSportsRepository.save(this.teamSportMapper.toEntity(team, sport));
    return this.teamSportMapper.toResponseDto(saved);
  }

  // Retira la asociación sin eliminar el equipo ni el deporte
  async unassign(teamId: number, sportId: number): Promise<{ message: string }> {
    const link = await this.teamSportsRepository.findOne({
      where: { team: { id: teamId }, sport: { id: sportId } },
      relations: { team: true, sport: true },
    });
    if (!link) {
      throw new NotFoundException('El equipo no está asociado a ese deporte');
    }
    await this.teamSportsRepository.remove(link);
    return { message: `"${link.team.name}" ya no participa en "${link.sport.name}"` };
  }

  async findByTeam(teamId: number): Promise<TeamSportResponseDto[]> {
    await this.teamsService.findOrFail(teamId);
    const links = await this.teamSportsRepository.find({
      where: { team: { id: teamId } },
      relations: { team: true, sport: true },
      order: { sport: { name: 'ASC' } },
    });
    return this.teamSportMapper.toResponseDtoList(links);
  }

  async findBySport(sportId: number): Promise<TeamSportResponseDto[]> {
    await this.sportsService.findOrFail(sportId);
    const links = await this.teamSportsRepository.find({
      where: { sport: { id: sportId } },
      relations: { team: true, sport: true },
      order: { team: { name: 'ASC' } },
    });
    return this.teamSportMapper.toResponseDtoList(links);
  }

  private async ensureNotLinked(team: Team, sport: Sport): Promise<void> {
    const linked = await this.teamSportsRepository.existsBy({ team: { id: team.id }, sport: { id: sport.id } });
    if (linked) {
      throw new ConflictException(`"${team.name}" ya está asociado a "${sport.name}"`);
    }
  }
}
