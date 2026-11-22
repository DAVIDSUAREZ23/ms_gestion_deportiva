import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PaymentChargeRequest, PaymentChargeResult, PaymentGatewayPort } from './payment-gateway.port';

// Pasarela simulada: aprueba todos los pagos y devuelve una referencia propia.
// Permite probar el flujo completo de recarga del monedero sin credenciales reales.
@Injectable()
export class SimulatedPaymentGateway implements PaymentGatewayPort {
  async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    return {
      approved: true,
      reference: `SIM-${randomBytes(6).toString('hex').toUpperCase()}-${request.reference}`,
    };
  }
}
