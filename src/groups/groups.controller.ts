import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateGroupTeamDto } from './dto/create-group-team.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

// Rutas de los grupos y de la asignación de equipos a cada grupo
@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('groups')
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get('phases/:phaseId/groups')
  findByPhase(@Param('phaseId', ParseIntPipe) phaseId: number) {
    return this.groupsService.findByPhase(phaseId);
  }

  @Get('groups/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Patch('groups/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete('groups/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  @Post('group-teams')
  assignTeam(@Body() dto: CreateGroupTeamDto) {
    return this.groupsService.assignTeam(dto);
  }

  @Delete('group-teams/:groupId/:teamId')
  unassignTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.groupsService.unassignTeam(groupId, teamId);
  }
}
