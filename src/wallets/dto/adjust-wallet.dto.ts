import { IsNumber, IsString, Length, Max, Min, NotEquals } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';
import { MAX_WALLET_MOVEMENT_AMOUNT } from '../wallets.constants';

// Ajuste manual del administrador: el signo del monto indica si suma o resta saldo
export class AdjustWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo dos decimales' })
  @Min(-MAX_WALLET_MOVEMENT_AMOUNT, {
    message: `El ajuste no puede restar más de ${MAX_WALLET_MOVEMENT_AMOUNT} COP`,
  })
  @Max(MAX_WALLET_MOVEMENT_AMOUNT, { message: `El ajuste no puede sumar más de ${MAX_WALLET_MOVEMENT_AMOUNT} COP` })
  @NotEquals(0, { message: 'El monto del ajuste no puede ser cero' })
  amount!: number;

  @Trim()
  @IsString({ message: 'El motivo debe ser texto' })
  @Length(5, 255, { message: 'El motivo debe tener entre 5 y 255 caracteres' })
  reason!: string;
}
