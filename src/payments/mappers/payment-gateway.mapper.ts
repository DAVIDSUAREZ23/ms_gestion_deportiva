import { Injectable } from '@nestjs/common';
import { CreatePaymentGatewayDto } from '../dto/create-payment-gateway.dto';
import { PaymentGatewayResponseDto, PaymentGatewaySummaryDto } from '../dto/payment-catalog-response.dto';
import { UpdatePaymentGatewayDto } from '../dto/update-payment-gateway.dto';
import { PaymentGateway } from '../entities/payment-gateway.entity';

@Injectable()
export class PaymentGatewayMapper {
  toEntity(dto: CreatePaymentGatewayDto): PaymentGateway {
    const gateway = new PaymentGateway();
    gateway.code = dto.code;
    gateway.name = dto.name;
    gateway.sandbox = dto.sandbox ?? true;
    return gateway;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(gateway: PaymentGateway, dto: UpdatePaymentGatewayDto): PaymentGateway {
    if (dto.code !== undefined) gateway.code = dto.code;
    if (dto.name !== undefined) gateway.name = dto.name;
    if (dto.sandbox !== undefined) gateway.sandbox = dto.sandbox;
    return gateway;
  }

  toSummaryDto(gateway: PaymentGateway): PaymentGatewaySummaryDto {
    return { id: gateway.id, code: gateway.code, name: gateway.name };
  }

  toResponseDto(gateway: PaymentGateway): PaymentGatewayResponseDto {
    return { ...this.toSummaryDto(gateway), active: gateway.active, sandbox: gateway.sandbox };
  }

  toResponseDtoList(gateways: PaymentGateway[]): PaymentGatewayResponseDto[] {
    return gateways.map((gateway) => this.toResponseDto(gateway));
  }
}
