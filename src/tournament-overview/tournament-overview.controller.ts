import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TournamentOverviewService } from './tournament-overview.service';

@Controller('tournaments')
export class TournamentOverviewController {
  constructor(private readonly overviewService: TournamentOverviewService) {}

  @Get(':tournamentId/overview')
  getOverview(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.overviewService.getOverview(tournamentId);
  }

  @Get(':tournamentId/top-scorers')
  getTopScorers(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.overviewService.getTopScorers(tournamentId, Math.min(Math.max(limit ?? 10, 1), 50));
  }
}
