import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { PaymentGatewaysService } from './services/payment-gateways.service';

@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Post()
  create(@Body() dto: CreatePaymentGatewayDto) {
    return this.paymentGatewaysService.create(dto);
  }

  @Get()
  findAll() {
    return this.paymentGatewaysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentGatewaysService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.paymentGatewaysService.updateStatus(id, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentGatewayDto) {
    return this.paymentGatewaysService.update(id, dto);
  }
}
