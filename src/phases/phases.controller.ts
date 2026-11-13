import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { PhasesService } from './phases.service';

@Controller()
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Post('phases')
  create(@Body() dto: CreatePhaseDto) {
    return this.phasesService.create(dto);
  }

  @Get('tournaments/:tournamentId/phases')
  findByTournament(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.phasesService.findByTournament(tournamentId);
  }

  @Get('phases/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.phasesService.findOne(id);
  }

  @Patch('phases/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePhaseDto) {
    return this.phasesService.update(id, dto);
  }

  @Delete('phases/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.phasesService.remove(id);
  }
}
