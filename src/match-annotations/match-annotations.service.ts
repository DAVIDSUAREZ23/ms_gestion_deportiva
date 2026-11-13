import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { toIsoDate } from '../common/utils/date.utils';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayerContract } from '../player-contracts/entities/player-contract.entity';
import { Player } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { Team } from '../teams/entities/team.entity';
import { CreateMatchAnnotationDto } from './dto/create-match-annotation.dto';
import { MatchAnnotationResponseDto } from './dto/match-annotation-response.dto';
import { UpdateMatchAnnotationDto } from './dto/update-match-annotation.dto';
import { MatchAnnotation } from './entities/match-annotation.entity';
import { MatchAnnotationMapper } from './mappers/match-annotation.mapper';

const WITH_MATCH_PLAYER_AND_TEAM = { match: { homeTeam: true, awayTeam: true }, player: true, team: true } as const;

// HU-GC-07: anotaciones de un partido hechas por jugadores de los equipos participantes
@Injectable()
export class MatchAnnotationsService {
  constructor(
    @InjectRepository(MatchAnnotation) private readonly annotationsRepository: Repository<MatchAnnotation>,
    @InjectRepository(PlayerContract) private readonly contractsRepository: Repository<PlayerContract>,
    private readonly matchesService: MatchesService,
    private readonly playersService: PlayersService,
    private readonly notificationsService: NotificationsService,
    private readonly annotationMapper: MatchAnnotationMapper,
  ) {}

  async create(dto: CreateMatchAnnotationDto): Promise<MatchAnnotationResponseDto> {
    const match = await this.matchesService.findOrFail(dto.matchId);
    this.ensureAcceptsAnnotations(match);
    const player = await this.playersService.findOrFail(dto.playerId);
    const team = await this.findTeamOfPlayerInMatch(match, player);
    const saved = await this.annotationsRepository.save(
      this.annotationMapper.toEntity(match, player, team, dto.minute, dto.notes ?? null),
    );
    await this.notificationsService.notifyAnnotation({
      matchId: match.id,
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      playerName: `${player.firstName} ${player.lastName}`,
      teamName: team.name,
      minute: dto.minute,
    });
    return this.annotationMapper.toResponseDto(saved);
  }

  async findByMatch(matchId: number): Promise<MatchAnnotationResponseDto[]> {
    await this.matchesService.findOrFail(matchId);
    const annotations = await this.annotationsRepository.find({
      where: { match: { id: matchId } },
      relations: WITH_MATCH_PLAYER_AND_TEAM,
      order: { minute: 'ASC', id: 'ASC' },
    });
    return this.annotationMapper.toResponseDtoList(annotations);
  }

  async update(id: number, dto: UpdateMatchAnnotationDto): Promise<MatchAnnotationResponseDto> {
    const annotation = await this.findOrFail(id);
    const match = await this.matchesService.findOrFail(annotation.match.id);
    this.ensureAcceptsAnnotations(match);
    if (dto.playerId !== undefined && dto.playerId !== annotation.player.id) {
      annotation.player = await this.playersService.findOrFail(dto.playerId);
      annotation.team = await this.findTeamOfPlayerInMatch(match, annotation.player);
    }
    if (dto.minute !== undefined) annotation.minute = dto.minute;
    if (dto.notes !== undefined) annotation.notes = dto.notes;
    return this.annotationMapper.toResponseDto(await this.annotationsRepository.save(annotation));
  }

  // Elimina solo la anotación; el jugador y el partido se conservan
  async remove(id: number): Promise<{ message: string }> {
    const annotation = await this.findOrFail(id);
    await this.annotationsRepository.remove(annotation);
    return { message: 'Anotación eliminada correctamente' };
  }

  private async findOrFail(id: number): Promise<MatchAnnotation> {
    const annotation = await this.annotationsRepository.findOne({ where: { id }, relations: WITH_MATCH_PLAYER_AND_TEAM });
    if (!annotation) {
      throw new NotFoundException(`Anotación con id ${id} no encontrada`);
    }
    return annotation;
  }

  private ensureAcceptsAnnotations(match: Match): void {
    if (match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('No se pueden registrar anotaciones en un partido cancelado');
    }
  }

  // El jugador debe tener contrato con uno de los dos equipos vigente en la fecha del partido
  private async findTeamOfPlayerInMatch(match: Match, player: Player): Promise<Team> {
    const matchDay = toIsoDate(new Date(match.scheduledAt));
    const contractOnMatchDay = {
      player: { id: player.id },
      team: { id: In([match.homeTeam.id, match.awayTeam.id]) },
      startDate: LessThanOrEqual(matchDay),
      endDate: MoreThanOrEqual(matchDay),
    };
    const contract = await this.contractsRepository.findOne({
      where: [
        { ...contractOnMatchDay, releasedAt: IsNull() },
        { ...contractOnMatchDay, releasedAt: MoreThanOrEqual(new Date(`${matchDay}T00:00:00`)) },
      ],
      relations: { team: true },
    });
    if (!contract) {
      throw new BadRequestException(
        `${player.firstName} ${player.lastName} no pertenece a ${match.homeTeam.name} ni a ${match.awayTeam.name} en la fecha del partido`,
      );
    }
    return contract.team;
  }
}
