import { Injectable } from '@nestjs/common';
import { WalletMovement } from '../entities/wallet-movement.entity';
import { Wallet } from '../entities/wallet.entity';
import { WalletDetailResponseDto, WalletMovementResponseDto, WalletResponseDto } from '../dto/wallet-response.dto';

@Injectable()
export class WalletMapper {
  toResponseDto(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      fanId: wallet.fan.id,
      balance: wallet.balance,
      availableBalance: Math.max(wallet.balance, 0),
      active: wallet.active,
      createdAt: isoOrNow(wallet.createdAt),
      updatedAt: isoOrNow(wallet.updatedAt),
    };
  }

  toDetailResponseDto(wallet: Wallet, movements: WalletMovement[]): WalletDetailResponseDto {
    return {
      ...this.toResponseDto(wallet),
      movements: movements.map((movement) => this.toMovementDto(movement, wallet.id)),
    };
  }

  toMovementDto(movement: WalletMovement, walletId: number): WalletMovementResponseDto {
    return {
      id: movement.id,
      walletId,
      type: movement.type,
      amount: movement.amount,
      balanceAfter: movement.balanceAfter,
      betId: movement.bet?.id ?? null,
      reference: movement.reference,
      reason: movement.reason,
      createdAt: isoOrNow(movement.createdAt),
    };
  }
}

// Fecha ISO; si la base aún no devolvió la fecha generada, se usa el momento actual
function isoOrNow(date: Date | undefined): string {
  return (date ?? new Date()).toISOString();
}
