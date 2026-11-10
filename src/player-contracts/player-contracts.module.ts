import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { PlayerContract } from './entities/player-contract.entity';
import { PlayerContractMapper } from './mappers/player-contract.mapper';
import { PlayerContractsController } from './player-contracts.controller';
import { PlayerContractsService } from './player-contracts.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerContract]), PlayersModule, TeamsModule],
  controllers: [PlayerContractsController],
  providers: [PlayerContractsService, PlayerContractMapper],
  exports: [PlayerContractsService],
})
export class PlayerContractsModule {}
