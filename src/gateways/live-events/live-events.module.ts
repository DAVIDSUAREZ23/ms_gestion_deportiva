import { Module } from '@nestjs/common';
import { LiveEventsGateway } from './live-events.gateway';

@Module({
  providers: [LiveEventsGateway],
  exports: [LiveEventsGateway],
})
export class LiveEventsModule {}
