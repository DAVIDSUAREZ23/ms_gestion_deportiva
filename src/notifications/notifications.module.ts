import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FanTeam } from '../fans/entities/fan-team.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([FanTeam])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
