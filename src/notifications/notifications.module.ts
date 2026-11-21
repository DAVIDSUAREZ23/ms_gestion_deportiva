import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { NotificationsClient } from './notifications.client';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [NotificationsService, NotificationsClient],
  exports: [NotificationsService],
})
export class NotificationsModule {}
