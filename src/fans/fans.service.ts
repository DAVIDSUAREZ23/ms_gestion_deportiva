import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { CreateFanProfileDto } from './dto/create-fan-profile.dto';
import { FanDetailResponseDto, FanResponseDto } from './dto/fan-response.dto';
import { UpdateFanProfileDto } from './dto/update-fan-profile.dto';
import { Fan } from './entities/fan.entity';
import { FanMapper } from './mappers/fan.mapper';

const WITH_FOLLOWED_TEAMS = { followedTeams: { team: true } } as const;

// Aficionado: el usuario gestiona su propio perfil ("me") y el administrador los consulta y modera
@Injectable()
export class FansService {
  constructor(
    @InjectRepository(Fan) private readonly fansRepository: Repository<Fan>,
    private readonly fanMapper: FanMapper,
  ) {}

  async getMyProfile(userId: number): Promise<FanDetailResponseDto> {
    return this.fanMapper.toDetailResponseDto(await this.findByUserOrFail(userId));
  }

  // Cada usuario tiene un solo perfil de aficionado
  async createMyProfile(userId: number, dto: CreateFanProfileDto): Promise<FanDetailResponseDto> {
    if (await this.fansRepository.existsBy({ userId })) {
      throw new ConflictException('Ya tienes un perfil de aficionado');
    }
    await this.fansRepository.save(this.fanMapper.toEntity(userId, dto));
    return this.getMyProfile(userId);
  }

  async updateMyProfile(userId: number, dto: UpdateFanProfileDto): Promise<FanDetailResponseDto> {
    const fan = await this.findByUserOrFail(userId);
    await this.fansRepository.save(this.fanMapper.mergeEntity(fan, dto));
    return this.getMyProfile(userId);
  }

  async findAll(): Promise<FanResponseDto[]> {
    const fans = await this.fansRepository.find({ relations: { followedTeams: true }, order: { displayName: 'ASC' } });
    return fans.map((fan) => this.fanMapper.toResponseDto(fan, fan.followedTeams.length));
  }

  async findOne(id: number): Promise<FanDetailResponseDto> {
    const fan = await this.fansRepository.findOne({ where: { id }, relations: WITH_FOLLOWED_TEAMS });
    if (!fan) {
      throw new NotFoundException(`Aficionado con id ${id} no encontrado`);
    }
    return this.fanMapper.toDetailResponseDto(fan);
  }

  // Un aficionado desactivado conserva su información pero no puede operar ni recibe avisos
  async updateStatus(id: number, dto: UpdateStatusDto): Promise<FanDetailResponseDto> {
    const fan = await this.fansRepository.findOneBy({ id });
    if (!fan) {
      throw new NotFoundException(`Aficionado con id ${id} no encontrado`);
    }
    fan.active = dto.active;
    await this.fansRepository.save(fan);
    return this.findOne(id);
  }

  // Usado por las operaciones del aficionado (seguir equipos, boletos, apuestas): debe existir y estar activo
  async findActiveByUserOrFail(userId: number): Promise<Fan> {
    const fan = await this.findByUserOrFail(userId);
    if (!fan.active) {
      throw new BadRequestException('Tu perfil de aficionado está desactivado');
    }
    return fan;
  }

  private async findByUserOrFail(userId: number): Promise<Fan> {
    const fan = await this.fansRepository.findOne({ where: { userId }, relations: WITH_FOLLOWED_TEAMS });
    if (!fan) {
      throw new NotFoundException('Aún no tienes perfil de aficionado');
    }
    return fan;
  }
}
