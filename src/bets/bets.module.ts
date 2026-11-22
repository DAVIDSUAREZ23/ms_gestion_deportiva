import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { Match } from '../matches/entities/match.entity';
import { PaymentsModule } from '../payments/payments.module';
import { TeamsModule } from '../teams/teams.module';
import { VenuesModule } from '../venues/venues.module';
import { BetsController } from './bets.controller';
import { Bet } from './entities/bet.entity';
import { MatchOdd } from './entities/match-odd.entity';
import { PAYMENT_GATEWAY } from './gateways/payment-gateway.port';
import { SimulatedPaymentGateway } from './gateways/simulated-payment.gateway';
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
  ],
  controllers: [BetsController, OddsController],
  providers: [
    BetsService,
    OddsService,
    BetMapper,
    OddMapper,
    { provide: PAYMENT_GATEWAY, useClass: SimulatedPaymentGateway },
  ],
  exports: [BetsService, OddsService, OddMapper],
})
export class BetsModule {}
