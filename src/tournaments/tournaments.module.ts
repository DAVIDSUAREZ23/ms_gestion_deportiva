import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from '../phases/entities/phase.entity';
import { SportsModule } from '../sports/sports.module';
import { TournamentRegistration } from '../tournament-registrations/entities/tournament-registration.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, TournamentRegistration, Phase]), SportsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentMapper],
  exports: [TournamentsService, TournamentMapper],
})
export class TournamentsModule {}
