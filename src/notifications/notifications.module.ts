import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from '../bets/entities/bet.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsClient } from './notifications.client';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Bet])],
  providers: [NotificationsService, NotificationsClient],
  exports: [NotificationsService],
})
export class NotificationsModule {}
