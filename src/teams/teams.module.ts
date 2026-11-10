import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamSport, PlayerContract])],
  controllers: [TeamsController],
  providers: [TeamsService, TeamMapper],
  exports: [TeamsService, TeamMapper],
})
export class TeamsModule {}
