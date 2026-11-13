import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('tickets/upcoming-matches')
  findUpcomingMatches() {
    return this.ticketsService.findUpcomingMatches();
  }

  @Get('matches/:matchId/availability')
  getAvailability(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.ticketsService.getAvailability(matchId);
  }

  @Get('matches/:matchId/tickets')
  findByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.ticketsService.findByMatch(matchId);
  }

  @Post('fans/me/tickets')
  buy(@CurrentUserId() userId: number, @Body() dto: BuyTicketDto) {
    return this.ticketsService.buy(userId, dto);
  }

  @Get('fans/me/tickets')
  findMine(@CurrentUserId() userId: number) {
    return this.ticketsService.findMine(userId);
  }

  @Patch('fans/me/tickets/:ticketId/cancel')
  cancelMine(@CurrentUserId() userId: number, @Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.ticketsService.cancelMine(userId, ticketId);
  }
}
