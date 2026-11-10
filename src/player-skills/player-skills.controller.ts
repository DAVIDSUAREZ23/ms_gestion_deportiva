import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreatePlayerSkillDto } from './dto/create-player-skill.dto';
import { PlayerSkillsService } from './player-skills.service';

// Rutas de la asignación jugador–habilidad, consultables desde cualquiera de los dos lados
@Controller()
export class PlayerSkillsController {
  constructor(private readonly playerSkillsService: PlayerSkillsService) {}

  @Post('player-skills')
  assign(@Body() dto: CreatePlayerSkillDto) {
    return this.playerSkillsService.assign(dto);
  }

  @Delete('player-skills/:playerId/:skillId')
  unassign(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
  ) {
    return this.playerSkillsService.unassign(playerId, skillId);
  }

  @Get('players/:playerId/skills')
  findByPlayer(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.playerSkillsService.findByPlayer(playerId);
  }

  @Get('skills/:skillId/players')
  findBySkill(@Param('skillId', ParseIntPipe) skillId: number) {
    return this.playerSkillsService.findBySkill(skillId);
  }
}
