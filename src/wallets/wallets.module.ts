import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fan } from '../fans/entities/fan.entity';
import { PaymentsModule } from '../payments/payments.module';
import { WalletMovement } from './entities/wallet-movement.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletMapper } from './mappers/wallet.mapper';
import { WalletsService } from './services/wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletMovement, Fan]), PaymentsModule],
  controllers: [WalletsController],
  providers: [WalletsService, WalletMapper],
  exports: [WalletsService],
})
export class WalletsModule {}
