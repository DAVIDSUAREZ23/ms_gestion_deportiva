import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateBetDto } from './dto/create-bet.dto';
import { BetsService } from './services/bets.service';

@Controller()
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Get('bets/upcoming-matches')
  findUpcomingMatches() {
    return this.betsService.findUpcomingMatches();
  }

  @Post('fans/me/bets')
  create(@CurrentUserId() userId: number, @Body() dto: CreateBetDto) {
    return this.betsService.create(userId, dto);
  }

  @Get('fans/me/bets')
  findMine(@CurrentUserId() userId: number) {
    return this.betsService.findMine(userId);
  }

  @Get('fans/me/bets/:id')
  findOne(@CurrentUserId() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.betsService.findOneMine(userId, id);
  }

  @Post('fans/me/bets/:id/pay')
  retryPayment(@CurrentUserId() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.betsService.retryPayment(userId, id);
  }

  @Get('matches/:matchId/bets')
  findByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.betsService.findByMatch(matchId);
  }
}
