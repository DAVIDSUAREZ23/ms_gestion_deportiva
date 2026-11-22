import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { WalletMovementType } from '../entities/wallet-movement.entity';
import { WALLET_MOVEMENTS_PAGE_MAX } from '../wallets.constants';

// Filtros del historial de movimientos del monedero
export class FindWalletMovementsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(WALLET_MOVEMENTS_PAGE_MAX, { message: `El límite no puede superar ${WALLET_MOVEMENTS_PAGE_MAX}` })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El desplazamiento debe ser un número entero' })
  @Min(0, { message: 'El desplazamiento no puede ser negativo' })
  offset?: number;

  @IsOptional()
  @IsEnum(WalletMovementType, { message: 'El tipo de movimiento no es válido' })
  type?: WalletMovementType;
}
