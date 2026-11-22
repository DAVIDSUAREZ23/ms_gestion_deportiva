import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';
import { FindWalletMovementsQueryDto } from './dto/find-wallet-movements-query.dto';
import { RechargeWalletDto } from './dto/recharge-wallet.dto';
import { WalletsService } from './services/wallets.service';

// Rutas "me" (portal del aficionado) declaradas antes que las de administración con :fanId
@Controller()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('fans/me/wallet')
  createMine(@CurrentUserId() userId: number) {
    return this.walletsService.createForUser(userId);
  }

  @Get('fans/me/wallet')
  getMine(@CurrentUserId() userId: number) {
    return this.walletsService.getMine(userId);
  }

  @Get('fans/me/wallet/movements')
  findMyMovements(@CurrentUserId() userId: number, @Query() query: FindWalletMovementsQueryDto) {
    return this.walletsService.findMyMovements(userId, query);
  }

  @Post('fans/me/wallet/recharges')
  recharge(@CurrentUserId() userId: number, @Body() dto: RechargeWalletDto) {
    return this.walletsService.recharge(userId, dto);
  }

  @Get('fans/:fanId/wallet')
  getByFan(@Param('fanId', ParseIntPipe) fanId: number) {
    return this.walletsService.getByFan(fanId);
  }

  @Post('wallets/:id/adjustments')
  adjust(@Param('id', ParseIntPipe) id: number, @Body() dto: AdjustWalletDto) {
    return this.walletsService.adjust(id, dto);
  }

  @Patch('wallets/:id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.walletsService.updateStatus(id, dto);
  }

  @Delete('wallets/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.walletsService.remove(id);
  }
}
