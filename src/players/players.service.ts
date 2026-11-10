import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { todayIsoDate } from '../common/utils/date.utils';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerResponseDto } from './dto/player-response.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';

// HU-GD-04: gestión de jugadores
@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player) private readonly playersRepository: Repository<Player>,
    @InjectRepository(PlayerContract) private readonly contractsRepository: Repository<PlayerContract>,
    @InjectRepository(PlayerSkill) private readonly playerSkillsRepository: Repository<PlayerSkill>,
    private readonly playerMapper: PlayerMapper,
  ) {}

  async create(dto: CreatePlayerDto): Promise<PlayerResponseDto> {
    this.ensureBirthDateIsPast(dto.birthDate);
    await this.ensureDocumentIsAvailable(dto.documentNumber);
    const saved = await this.playersRepository.save(this.playerMapper.toEntity(dto));
    return this.playerMapper.toResponseDto(saved);
  }

  async findAll(): Promise<PlayerResponseDto[]> {
    const players = await this.playersRepository.find({ order: { lastName: 'ASC', firstName: 'ASC' } });
    return this.playerMapper.toResponseDtoList(players);
  }

  async findOne(id: number): Promise<PlayerResponseDto> {
    return this.playerMapper.toResponseDto(await this.findOrFail(id));
  }

  async update(id: number, dto: UpdatePlayerDto): Promise<PlayerResponseDto> {
    const player = await this.findOrFail(id);
    if (dto.birthDate !== undefined) {
      this.ensureBirthDateIsPast(dto.birthDate);
    }
    if (dto.documentNumber !== undefined) {
      await this.ensureDocumentIsAvailable(dto.documentNumber, id);
    }
    const saved = await this.playersRepository.save(this.playerMapper.mergeEntity(player, dto));
    return this.playerMapper.toResponseDto(saved);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<PlayerResponseDto> {
    const player = await this.findOrFail(id);
    player.active = dto.active;
    return this.playerMapper.toResponseDto(await this.playersRepository.save(player));
  }

  async remove(id: number): Promise<{ message: string }> {
    const player = await this.findOrFail(id);
    await this.ensureHasNoDependencies(player);
    await this.playersRepository.remove(player);
    return { message: `Jugador "${player.firstName} ${player.lastName}" eliminado correctamente` };
  }

  async findOrFail(id: number): Promise<Player> {
    const player = await this.playersRepository.findOneBy({ id });
    if (!player) {
      throw new NotFoundException(`Jugador con id ${id} no encontrado`);
    }
    return player;
  }

  // Usado por las asociaciones: el jugador debe existir y estar activo
  async findActiveOrFail(id: number): Promise<Player> {
    const player = await this.findOrFail(id);
    if (!player.active) {
      throw new BadRequestException(`El jugador "${player.firstName} ${player.lastName}" está inactivo`);
    }
    return player;
  }

  private ensureBirthDateIsPast(birthDate: string): void {
    if (birthDate >= todayIsoDate()) {
      throw new BadRequestException('La fecha de nacimiento debe ser anterior a hoy');
    }
  }

  private async ensureDocumentIsAvailable(documentNumber: string, excludeId?: number): Promise<void> {
    const taken = await this.playersRepository.existsBy({
      documentNumber,
      ...(excludeId !== undefined && { id: Not(excludeId) }),
    });
    if (taken) {
      throw new ConflictException(`Ya existe un jugador con el documento ${documentNumber}`);
    }
  }

  private async ensureHasNoDependencies(player: Player): Promise<void> {
    const [hasContracts, hasSkills] = await Promise.all([
      this.contractsRepository.existsBy({ player: { id: player.id } }),
      this.playerSkillsRepository.existsBy({ player: { id: player.id } }),
    ]);
    if (hasContracts || hasSkills) {
      throw new ConflictException(
        `No se puede eliminar a "${player.firstName} ${player.lastName}" porque tiene equipos o habilidades asociados. Puedes desactivarlo.`,
      );
    }
  }
}
