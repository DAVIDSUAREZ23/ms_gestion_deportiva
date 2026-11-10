import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePlayerContractDto } from './dto/create-player-contract.dto';
import { PlayerContractsService } from './player-contracts.service';

// Rutas de los contratos: firmar, retirar, plantilla del equipo e historial del jugador
@Controller()
export class PlayerContractsController {
  constructor(private readonly contractsService: PlayerContractsService) {}

  @Post('player-contracts')
  sign(@Body() dto: CreatePlayerContractDto) {
    return this.contractsService.sign(dto);
  }

  @Patch('player-contracts/:id/release')
  release(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.release(id);
  }

  @Get('teams/:teamId/players')
  findCurrentByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.contractsService.findCurrentByTeam(teamId);
  }

  @Get('players/:playerId/contracts')
  findHistoryByPlayer(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.contractsService.findHistoryByPlayer(playerId);
  }
}
