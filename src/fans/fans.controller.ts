import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { CreateFanProfileDto } from './dto/create-fan-profile.dto';
import { FollowTeamDto } from './dto/follow-team.dto';
import { UpdateFanProfileDto } from './dto/update-fan-profile.dto';
import { FanTeamsService } from './fan-teams.service';
import { FansService } from './fans.service';

// Rutas "me" (portal del aficionado) declaradas antes que las de administración con :id
@Controller()
export class FansController {
  constructor(
    private readonly fansService: FansService,
    private readonly fanTeamsService: FanTeamsService,
  ) {}

  @Get('fans/me')
  getMyProfile(@CurrentUserId() userId: number) {
    return this.fansService.getMyProfile(userId);
  }

  @Post('fans/me')
  createMyProfile(@CurrentUserId() userId: number, @Body() dto: CreateFanProfileDto) {
    return this.fansService.createMyProfile(userId, dto);
  }

  @Patch('fans/me')
  updateMyProfile(@CurrentUserId() userId: number, @Body() dto: UpdateFanProfileDto) {
    return this.fansService.updateMyProfile(userId, dto);
  }

  @Get('fans/me/teams')
  findMyTeams(@CurrentUserId() userId: number) {
    return this.fanTeamsService.findMyTeams(userId);
  }

  @Post('fans/me/teams')
  follow(@CurrentUserId() userId: number, @Body() dto: FollowTeamDto) {
    return this.fanTeamsService.follow(userId, dto.teamId);
  }

  @Delete('fans/me/teams/:teamId')
  unfollow(@CurrentUserId() userId: number, @Param('teamId', ParseIntPipe) teamId: number) {
    return this.fanTeamsService.unfollow(userId, teamId);
  }

  @Get('fans')
  findAll() {
    return this.fansService.findAll();
  }

  @Get('fans/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fansService.findOne(id);
  }

  @Patch('fans/:id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.fansService.updateStatus(id, dto);
  }

  @Get('teams/:teamId/fans')
  findFollowersOfTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.fanTeamsService.findFollowersOfTeam(teamId);
  }
}
