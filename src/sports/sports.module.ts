import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sport, TeamSport, Tournament])],
  controllers: [SportsController],
  providers: [SportsService, SportMapper],
  exports: [SportsService, SportMapper],
})
export class SportsModule {}
