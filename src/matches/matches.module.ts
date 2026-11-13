import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsModule } from '../groups/groups.module';
import { MatchAnnotation } from '../match-annotations/entities/match-annotation.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PhasesModule } from '../phases/phases.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentRegistrationsModule } from '../tournament-registrations/tournament-registrations.module';
import { VenuesModule } from '../venues/venues.module';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchAnnotation]),
    PhasesModule,
    GroupsModule,
    TeamsModule,
    VenuesModule,
    TournamentRegistrationsModule,
    NotificationsModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchMapper],
  exports: [MatchesService, MatchMapper],
})
export class MatchesModule {}
