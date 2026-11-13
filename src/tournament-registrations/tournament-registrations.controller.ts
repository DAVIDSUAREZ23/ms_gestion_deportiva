import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { TournamentRegistrationsService } from './tournament-registrations.service';

// Rutas de las inscripciones, consultables desde el torneo o desde el equipo
@Controller()
export class TournamentRegistrationsController {
  constructor(private readonly registrationsService: TournamentRegistrationsService) {}

  @Post('tournament-registrations')
  register(@Body() dto: CreateTournamentRegistrationDto) {
    return this.registrationsService.register(dto);
  }

  @Delete('tournament-registrations/:tournamentId/:teamId')
  withdraw(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.registrationsService.withdraw(tournamentId, teamId);
  }

  @Get('tournaments/:tournamentId/teams')
  findTeamsByTournament(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.registrationsService.findTeamsByTournament(tournamentId);
  }

  @Get('teams/:teamId/tournaments')
  findTournamentsByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.registrationsService.findTournamentsByTeam(teamId);
  }
}
