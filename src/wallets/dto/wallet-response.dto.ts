import { WalletMovementType } from '../entities/wallet-movement.entity';

export class WalletResponseDto {
  id!: number;
  fanId!: number;
  // Saldo real; puede ser negativo si se revirtió una ganancia ya gastada
  balance!: number;
  // Saldo que el aficionado puede usar: nunca se muestra negativo
  availableBalance!: number;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class WalletMovementResponseDto {
  id!: number;
  walletId!: number;
  type!: WalletMovementType;
  // Positivo si entra dinero, negativo si sale
  amount!: number;
  balanceAfter!: number;
  betId!: number | null;
  reference!: string | null;
  reason!: string | null;
  createdAt!: string;
}

export class WalletDetailResponseDto extends WalletResponseDto {
  movements!: WalletMovementResponseDto[];
}
