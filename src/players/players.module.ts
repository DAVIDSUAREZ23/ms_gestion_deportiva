import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  imports: [TypeOrmModule.forFeature([Player, PlayerContract, PlayerSkill])],
  controllers: [PlayersController],
  providers: [PlayersService, PlayerMapper],
  exports: [PlayersService, PlayerMapper],
})
export class PlayersModule {}
