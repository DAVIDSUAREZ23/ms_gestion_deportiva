import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { PhasesModule } from '../phases/phases.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentRegistrationsModule } from '../tournament-registrations/tournament-registrations.module';
import { CompetitionGroup } from './entities/competition-group.entity';
import { GroupTeam } from './entities/group-team.entity';
import { GroupMapper } from './mappers/group.mapper';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompetitionGroup, GroupTeam, Match]),
    PhasesModule,
    TeamsModule,
    TournamentRegistrationsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMapper],
  exports: [GroupsService, GroupMapper],
})
export class GroupsModule {}
