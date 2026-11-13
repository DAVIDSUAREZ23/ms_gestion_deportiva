import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../teams/teams.module';
import { FanTeam } from './entities/fan-team.entity';
import { Fan } from './entities/fan.entity';
import { FanTeamsService } from './fan-teams.service';
import { FansController } from './fans.controller';
import { FansService } from './fans.service';
import { FanMapper } from './mappers/fan.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([Fan, FanTeam]), TeamsModule],
  controllers: [FansController],
  providers: [FansService, FanTeamsService, FanMapper],
  exports: [FansService, FanMapper],
})
export class FansModule {}
