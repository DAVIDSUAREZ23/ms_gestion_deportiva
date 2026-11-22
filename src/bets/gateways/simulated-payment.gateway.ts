import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PaymentChargeRequest, PaymentChargeResult, PaymentGatewayPort } from './payment-gateway.port';

// Pasarela simulada del Paso 2: aprueba todos los pagos y devuelve una referencia propia.
// Permite probar el flujo completo de la apuesta sin credenciales reales.
@Injectable()
export class SimulatedPaymentGateway implements PaymentGatewayPort {
  async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    return {
      approved: true,
      reference: `SIM-${randomBytes(6).toString('hex').toUpperCase()}-${request.betCode}`,
    };
  }
}
