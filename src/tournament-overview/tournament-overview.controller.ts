import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TournamentOverviewService } from './tournament-overview.service';

@Controller('tournaments')
export class TournamentOverviewController {
  constructor(private readonly overviewService: TournamentOverviewService) {}

  @Get(':tournamentId/overview')
  getOverview(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.overviewService.getOverview(tournamentId);
  }
}
