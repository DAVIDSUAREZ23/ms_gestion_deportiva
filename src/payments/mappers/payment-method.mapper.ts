import { Injectable } from '@nestjs/common';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';
import { PaymentMethodResponseDto, PaymentMethodSummaryDto } from '../dto/payment-catalog-response.dto';
import { UpdatePaymentMethodDto } from '../dto/update-payment-method.dto';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodMapper {
  toEntity(dto: CreatePaymentMethodDto): PaymentMethod {
    const method = new PaymentMethod();
    method.code = dto.code;
    method.name = dto.name;
    return method;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(method: PaymentMethod, dto: UpdatePaymentMethodDto): PaymentMethod {
    if (dto.code !== undefined) method.code = dto.code;
    if (dto.name !== undefined) method.name = dto.name;
    return method;
  }

  toSummaryDto(method: PaymentMethod): PaymentMethodSummaryDto {
    return { id: method.id, code: method.code, name: method.name };
  }

  toResponseDto(method: PaymentMethod): PaymentMethodResponseDto {
    return { ...this.toSummaryDto(method), active: method.active };
  }

  toResponseDtoList(methods: PaymentMethod[]): PaymentMethodResponseDto[] {
    return methods.map((method) => this.toResponseDto(method));
  }
}
