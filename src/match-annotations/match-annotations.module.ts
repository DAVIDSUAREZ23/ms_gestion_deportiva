import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveEventsModule } from '../gateways/live-events/live-events.module';
import { MatchesModule } from '../matches/matches.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { MatchAnnotation } from './entities/match-annotation.entity';
import { MatchAnnotationMapper } from './mappers/match-annotation.mapper';
import { MatchAnnotationsController } from './match-annotations.controller';
import { MatchAnnotationsService } from './match-annotations.service';
import { MatchAnnotationsRepository } from './repositories/match-annotations.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchAnnotation, PlayerContract]),
    MatchesModule,
    PlayersModule,
    TeamsModule,
    NotificationsModule,
    LiveEventsModule,
  ],
  controllers: [MatchAnnotationsController],
  providers: [MatchAnnotationsService, MatchAnnotationMapper, MatchAnnotationsRepository],
  exports: [MatchAnnotationMapper, MatchAnnotationsRepository],
})
export class MatchAnnotationsModule {}
