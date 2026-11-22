import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { Match } from '../matches/entities/match.entity';
import { PaymentsModule } from '../payments/payments.module';
import { TeamsModule } from '../teams/teams.module';
import { VenuesModule } from '../venues/venues.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BetsController } from './bets.controller';
import { Bet } from './entities/bet.entity';
import { MatchOdd } from './entities/match-odd.entity';
import { BetMapper } from './mappers/bet.mapper';
import { OddMapper } from './mappers/odd.mapper';
import { OddsController } from './odds.controller';
import { BetsService } from './services/bets.service';
import { OddsService } from './services/odds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet, Match, MatchOdd]),
    FansModule,
    PaymentsModule,
    TeamsModule,
    VenuesModule,
    WalletsModule,
  ],
  controllers: [BetsController, OddsController],
  providers: [BetsService, OddsService, BetMapper, OddMapper],
  exports: [BetsService, OddsService, OddMapper],
})
export class BetsModule {}
