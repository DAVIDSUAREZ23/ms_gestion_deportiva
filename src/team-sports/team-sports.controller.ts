import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateTeamSportDto } from './dto/create-team-sport.dto';
import { TeamSportsService } from './team-sports.service';

// Rutas de la asociación equipo–deporte, consultables desde cualquiera de los dos lados
@Controller()
export class TeamSportsController {
  constructor(private readonly teamSportsService: TeamSportsService) {}

  @Post('team-sports')
  assign(@Body() dto: CreateTeamSportDto) {
    return this.teamSportsService.assign(dto);
  }

  @Delete('team-sports/:teamId/:sportId')
  unassign(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('sportId', ParseIntPipe) sportId: number,
  ) {
    return this.teamSportsService.unassign(teamId, sportId);
  }

  @Get('teams/:teamId/sports')
  findByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamSportsService.findByTeam(teamId);
  }

  @Get('sports/:sportId/teams')
  findBySport(@Param('sportId', ParseIntPipe) sportId: number) {
    return this.teamSportsService.findBySport(sportId);
  }
}
