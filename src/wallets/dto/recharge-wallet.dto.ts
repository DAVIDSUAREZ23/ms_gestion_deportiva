import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { MAX_WALLET_MOVEMENT_AMOUNT, MIN_RECHARGE_AMOUNT } from '../wallets.constants';

// Recarga del monedero: se cobra con la pasarela y el saldo se acredita si el pago se aprueba
export class RechargeWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo dos decimales' })
  @Min(MIN_RECHARGE_AMOUNT, { message: `La recarga mínima es ${MIN_RECHARGE_AMOUNT} COP` })
  @Max(MAX_WALLET_MOVEMENT_AMOUNT, { message: `La recarga máxima por operación es ${MAX_WALLET_MOVEMENT_AMOUNT} COP` })
  amount!: number;

  @IsInt({ message: 'El método de pago debe ser un id numérico' })
  @Min(1, { message: 'El método de pago debe ser un id válido' })
  paymentMethodId!: number;

  @IsInt({ message: 'La pasarela debe ser un id numérico' })
  @Min(1, { message: 'La pasarela debe ser un id válido' })
  paymentGatewayId!: number;
}
