import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';
import { PaymentMethodResponseDto } from '../dto/payment-catalog-response.dto';
import { UpdatePaymentMethodDto } from '../dto/update-payment-method.dto';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodMapper } from '../mappers/payment-method.mapper';

// Catálogo de métodos de pago que el aficionado puede elegir al apostar
@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod) private readonly methodsRepository: Repository<PaymentMethod>,
    private readonly methodMapper: PaymentMethodMapper,
  ) {}

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    await this.ensureCodeIsAvailable(dto.code);
    const saved = await this.methodsRepository.save(this.methodMapper.toEntity(dto));
    return this.findOne(saved.id);
  }

  async findAll(): Promise<PaymentMethodResponseDto[]> {
    const methods = await this.methodsRepository.find({ order: { name: 'ASC' } });
    return this.methodMapper.toResponseDtoList(methods);
  }

  async findOne(id: number): Promise<PaymentMethodResponseDto> {
    return this.methodMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const method = await this.findOrFail(id);
    if (dto.code !== undefined) {
      await this.ensureCodeIsAvailable(dto.code, id);
    }
    await this.methodsRepository.save(this.methodMapper.mergeEntity(method, dto));
    return this.findOne(id);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<PaymentMethodResponseDto> {
    const method = await this.findOrFail(id);
    method.active = dto.active;
    await this.methodsRepository.save(method);
    return this.findOne(id);
  }

  // Usado por las apuestas: el método debe existir y estar activo
  async findActiveOrFail(id: number): Promise<PaymentMethod> {
    const method = await this.findOrFail(id);
    if (!method.active) {
      throw new BadRequestException(`El método de pago "${method.name}" está inactivo`);
    }
    return method;
  }

  // Usado internamente para sembrar el método WALLET al pagar con el monedero
  async findActiveByCodeOrFail(code: string): Promise<PaymentMethod> {
    const method = await this.methodsRepository.findOneBy({ code });
    if (!method) {
      throw new NotFoundException(`Método de pago con código "${code}" no encontrado`);
    }
    if (!method.active) {
      throw new BadRequestException(`El método de pago "${method.name}" está inactivo`);
    }
    return method;
  }

  async findOrFail(id: number): Promise<PaymentMethod> {
    const method = await this.methodsRepository.findOneBy({ id });
    if (!method) {
      throw new NotFoundException(`Método de pago con id ${id} no encontrado`);
    }
    return method;
  }

  private async ensureCodeIsAvailable(code: string, excludeId?: number): Promise<void> {
    const taken = await this.methodsRepository.existsBy({
      code,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un método de pago con el código "${code}"`);
    }
  }
}
