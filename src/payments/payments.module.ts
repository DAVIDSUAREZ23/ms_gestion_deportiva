import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGateway } from './entities/payment-gateway.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PAYMENT_GATEWAY } from './gateways/payment-gateway.port';
import { SimulatedPaymentGateway } from './gateways/simulated-payment.gateway';
import { PaymentGatewayMapper } from './mappers/payment-gateway.mapper';
import { PaymentMethodMapper } from './mappers/payment-method.mapper';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentGatewaysService } from './services/payment-gateways.service';
import { PaymentMethodsService } from './services/payment-methods.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod, PaymentGateway])],
  controllers: [PaymentMethodsController, PaymentGatewaysController],
  providers: [
    PaymentMethodsService,
    PaymentGatewaysService,
    PaymentMethodMapper,
    PaymentGatewayMapper,
    { provide: PAYMENT_GATEWAY, useClass: SimulatedPaymentGateway },
  ],
  exports: [
    PaymentMethodsService,
    PaymentGatewaysService,
    PaymentMethodMapper,
    PaymentGatewayMapper,
    PAYMENT_GATEWAY,
  ],
})
export class PaymentsModule {}
