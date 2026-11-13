import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamsService } from '../teams/teams.service';
import { FollowedTeamDto, TeamFollowerDto } from './dto/fan-response.dto';
import { FanTeam } from './entities/fan-team.entity';
import { FansService } from './fans.service';
import { FanMapper } from './mappers/fan.mapper';

// Aficionado Equipo: equipos que sigue cada aficionado
@Injectable()
export class FanTeamsService {
  constructor(
    @InjectRepository(FanTeam) private readonly fanTeamsRepository: Repository<FanTeam>,
    private readonly fansService: FansService,
    private readonly teamsService: TeamsService,
    private readonly fanMapper: FanMapper,
  ) {}

  async findMyTeams(userId: number): Promise<FollowedTeamDto[]> {
    const fanTeams = await this.fanTeamsRepository.find({
      where: { fan: { userId } },
      relations: { team: true },
      order: { team: { name: 'ASC' } },
    });
    return fanTeams.map((fanTeam) => this.fanMapper.toFollowedTeamDto(fanTeam));
  }

  async follow(userId: number, teamId: number): Promise<FollowedTeamDto> {
    const fan = await this.fansService.findActiveByUserOrFail(userId);
    const team = await this.teamsService.findActiveOrFail(teamId);
    if (await this.fanTeamsRepository.existsBy({ fan: { id: fan.id }, team: { id: team.id } })) {
      throw new ConflictException(`Ya sigues a "${team.name}"`);
    }
    const saved = await this.fanTeamsRepository.save(Object.assign(new FanTeam(), { fan, team }));
    return this.fanMapper.toFollowedTeamDto({ ...saved, team });
  }

  async unfollow(userId: number, teamId: number): Promise<{ message: string }> {
    const fanTeam = await this.fanTeamsRepository.findOne({
      where: { fan: { userId }, team: { id: teamId } },
      relations: { team: true },
    });
    if (!fanTeam) {
      throw new NotFoundException('No sigues a ese equipo');
    }
    await this.fanTeamsRepository.remove(fanTeam);
    return { message: `Dejaste de seguir a "${fanTeam.team.name}"` };
  }

  async findFollowersOfTeam(teamId: number): Promise<TeamFollowerDto[]> {
    await this.teamsService.findOrFail(teamId);
    const fanTeams = await this.fanTeamsRepository.find({
      where: { team: { id: teamId } },
      relations: { fan: true },
      order: { fan: { displayName: 'ASC' } },
    });
    return fanTeams.map((fanTeam) => this.fanMapper.toTeamFollowerDto(fanTeam));
  }
}
