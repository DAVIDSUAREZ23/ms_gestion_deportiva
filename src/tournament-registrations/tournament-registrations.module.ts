import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupTeam } from '../groups/entities/group-team.entity';
import { Match } from '../matches/entities/match.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { TournamentRegistrationMapper } from './mappers/tournament-registration.mapper';
import { TournamentRegistrationsController } from './tournament-registrations.controller';
import { TournamentRegistrationsService } from './tournament-registrations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentRegistration, TeamSport, GroupTeam, Match]),
    TournamentsModule,
    TeamsModule,
  ],
  controllers: [TournamentRegistrationsController],
  providers: [TournamentRegistrationsService, TournamentRegistrationMapper],
  exports: [TournamentRegistrationsService],
})
export class TournamentRegistrationsModule {}
