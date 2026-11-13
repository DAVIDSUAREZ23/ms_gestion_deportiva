import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateMatchAnnotationDto } from './dto/create-match-annotation.dto';
import { UpdateMatchAnnotationDto } from './dto/update-match-annotation.dto';
import { MatchAnnotationsService } from './match-annotations.service';

@Controller()
export class MatchAnnotationsController {
  constructor(private readonly annotationsService: MatchAnnotationsService) {}

  @Post('match-annotations')
  create(@Body() dto: CreateMatchAnnotationDto) {
    return this.annotationsService.create(dto);
  }

  @Get('matches/:matchId/annotations')
  findByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.annotationsService.findByMatch(matchId);
  }

  @Patch('match-annotations/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatchAnnotationDto) {
    return this.annotationsService.update(id, dto);
  }

  @Delete('match-annotations/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.annotationsService.remove(id);
  }
}
