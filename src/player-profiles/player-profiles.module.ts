import { Module } from '@nestjs/common';
import { PlayerContractsModule } from '../player-contracts/player-contracts.module';
import { PlayerSkillsModule } from '../player-skills/player-skills.module';
import { PlayersModule } from '../players/players.module';
import { PlayerProfilesController } from './player-profiles.controller';
import { PlayerProfilesService } from './player-profiles.service';

// Módulo propio para el perfil: depende de jugadores, contratos y habilidades sin crear ciclos
@Module({
  imports: [PlayersModule, PlayerContractsModule, PlayerSkillsModule],
  controllers: [PlayerProfilesController],
  providers: [PlayerProfilesService],
})
export class PlayerProfilesModule {}
