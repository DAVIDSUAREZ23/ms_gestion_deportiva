import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { RegisterResultDto } from './dto/register-result.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchesService } from './matches.service';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('matches')
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Get('phases/:phaseId/matches')
  findByPhase(@Param('phaseId', ParseIntPipe) phaseId: number) {
    return this.matchesService.findByPhase(phaseId);
  }

  @Get('matches/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Patch('matches/:id/result')
  registerResult(@Param('id', ParseIntPipe) id: number, @Body() dto: RegisterResultDto) {
    return this.matchesService.registerResult(id, dto);
  }

  @Patch('matches/:id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.cancel(id);
  }

  @Patch('matches/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(id, dto);
  }

  @Delete('matches/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.remove(id);
  }
}
