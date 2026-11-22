import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { SetOddDto } from './dto/set-odd.dto';
import { SetOddsDto } from './dto/set-odds.dto';
import { UpdateOddDto } from './dto/update-odd.dto';
import { OddsService } from './services/odds.service';

@Controller()
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('matches/:matchId/odds')
  findByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.oddsService.findByMatch(matchId);
  }

  @Post('matches/:matchId/odds')
  create(@Param('matchId', ParseIntPipe) matchId: number, @Body() dto: SetOddDto) {
    return this.oddsService.create(matchId, dto);
  }

  // Guarda el set completo de cuotas del partido desde la pantalla de cuotas
  @Put('matches/:matchId/odds')
  replace(@Param('matchId', ParseIntPipe) matchId: number, @Body() dto: SetOddsDto) {
    return this.oddsService.replaceForMatch(matchId, dto.odds);
  }

  @Patch('odds/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOddDto) {
    return this.oddsService.update(id, dto);
  }
}
