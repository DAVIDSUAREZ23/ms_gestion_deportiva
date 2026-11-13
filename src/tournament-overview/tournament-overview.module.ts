import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { MatchAnnotation } from '../match-annotations/entities/match-annotation.entity';
import { MatchAnnotationsModule } from '../match-annotations/match-annotations.module';
import { Match } from '../matches/entities/match.entity';
import { MatchesModule } from '../matches/matches.module';
import { Phase } from '../phases/entities/phase.entity';
import { PhasesModule } from '../phases/phases.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentOverviewController } from './tournament-overview.controller';
import { TournamentOverviewService } from './tournament-overview.service';

// Módulo de solo lectura que arma la vista del torneo a partir de los demás módulos de competencias
@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentRegistration, Phase, CompetitionGroup, Match, MatchAnnotation]),
    TournamentsModule,
    PhasesModule,
    TeamsModule,
    MatchesModule,
    MatchAnnotationsModule,
  ],
  controllers: [TournamentOverviewController],
  providers: [TournamentOverviewService],
})
export class TournamentOverviewModule {}
