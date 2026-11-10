import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsModule } from '../sports/sports.module';
import { TeamsModule } from '../teams/teams.module';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';
import { TeamSportsController } from './team-sports.controller';
import { TeamSportsService } from './team-sports.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamSport]), TeamsModule, SportsModule],
  controllers: [TeamSportsController],
  providers: [TeamSportsService, TeamSportMapper],
})
export class TeamSportsModule {}
