import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateTournamentVenueDto } from './dto/create-tournament-venue.dto';
import { TournamentVenuesService } from './tournament-venues.service';

@Controller()
export class TournamentVenuesController {
  constructor(private readonly tournamentVenuesService: TournamentVenuesService) {}

  @Post('tournament-venues')
  assign(@Body() dto: CreateTournamentVenueDto) {
    return this.tournamentVenuesService.assign(dto);
  }

  @Delete('tournament-venues/:tournamentId/:venueId')
  unassign(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('venueId', ParseIntPipe) venueId: number,
  ) {
    return this.tournamentVenuesService.unassign(tournamentId, venueId);
  }

  @Get('tournaments/:tournamentId/venues')
  findByTournament(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.tournamentVenuesService.findByTournament(tournamentId);
  }
}
