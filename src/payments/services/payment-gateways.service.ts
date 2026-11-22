import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { CreatePaymentGatewayDto } from '../dto/create-payment-gateway.dto';
import { PaymentGatewayResponseDto } from '../dto/payment-catalog-response.dto';
import { UpdatePaymentGatewayDto } from '../dto/update-payment-gateway.dto';
import { PaymentGateway } from '../entities/payment-gateway.entity';
import { PaymentGatewayMapper } from '../mappers/payment-gateway.mapper';

// Catálogo de pasarelas de pago con las que se puede cobrar una apuesta
@Injectable()
export class PaymentGatewaysService {
  constructor(
    @InjectRepository(PaymentGateway) private readonly gatewaysRepository: Repository<PaymentGateway>,
    private readonly gatewayMapper: PaymentGatewayMapper,
  ) {}

  async create(dto: CreatePaymentGatewayDto): Promise<PaymentGatewayResponseDto> {
    await this.ensureCodeIsAvailable(dto.code);
    const saved = await this.gatewaysRepository.save(this.gatewayMapper.toEntity(dto));
    return this.findOne(saved.id);
  }

  async findAll(): Promise<PaymentGatewayResponseDto[]> {
    const gateways = await this.gatewaysRepository.find({ order: { name: 'ASC' } });
    return this.gatewayMapper.toResponseDtoList(gateways);
  }

  async findOne(id: number): Promise<PaymentGatewayResponseDto> {
    return this.gatewayMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdatePaymentGatewayDto): Promise<PaymentGatewayResponseDto> {
    const gateway = await this.findOrFail(id);
    if (dto.code !== undefined) {
      await this.ensureCodeIsAvailable(dto.code, id);
    }
    await this.gatewaysRepository.save(this.gatewayMapper.mergeEntity(gateway, dto));
    return this.findOne(id);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<PaymentGatewayResponseDto> {
    const gateway = await this.findOrFail(id);
    gateway.active = dto.active;
    await this.gatewaysRepository.save(gateway);
    return this.findOne(id);
  }

  // Usado por las apuestas: la pasarela debe existir y estar activa
  async findActiveOrFail(id: number): Promise<PaymentGateway> {
    const gateway = await this.findOrFail(id);
    if (!gateway.active) {
      throw new BadRequestException(`La pasarela "${gateway.name}" está inactiva`);
    }
    return gateway;
  }

  async findOrFail(id: number): Promise<PaymentGateway> {
    const gateway = await this.gatewaysRepository.findOneBy({ id });
    if (!gateway) {
      throw new NotFoundException(`Pasarela de pago con id ${id} no encontrada`);
    }
    return gateway;
  }

  private async ensureCodeIsAvailable(code: string, excludeId?: number): Promise<void> {
    const taken = await this.gatewaysRepository.existsBy({
      code,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe una pasarela con el código "${code}"`);
    }
  }
}
