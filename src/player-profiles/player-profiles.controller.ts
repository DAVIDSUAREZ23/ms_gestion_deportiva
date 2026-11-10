import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlayerProfilesService } from './player-profiles.service';

@Controller('players')
export class PlayerProfilesController {
  constructor(private readonly playerProfilesService: PlayerProfilesService) {}

  @Get(':playerId/profile')
  getProfile(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.playerProfilesService.getProfile(playerId);
  }
}
