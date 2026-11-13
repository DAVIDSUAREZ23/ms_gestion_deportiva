import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupTeam } from '../groups/entities/group-team.entity';
import { Match } from '../matches/entities/match.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { isRegistrationOpen } from '../tournaments/tournament.rules';
import { TournamentsService } from '../tournaments/tournaments.service';
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { TournamentRegistrationResponseDto } from './dto/tournament-registration-response.dto';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { TournamentRegistrationMapper } from './mappers/tournament-registration.mapper';

const WITH_TOURNAMENT_AND_TEAM = { tournament: true, team: true } as const;

// HU-GC-02: inscripción de equipos en torneos
@Injectable()
export class TournamentRegistrationsService {
  constructor(
    @InjectRepository(TournamentRegistration) private readonly registrationsRepository: Repository<TournamentRegistration>,
    @InjectRepository(TeamSport) private readonly teamSportsRepository: Repository<TeamSport>,
    @InjectRepository(GroupTeam) private readonly groupTeamsRepository: Repository<GroupTeam>,
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    private readonly tournamentsService: TournamentsService,
    private readonly teamsService: TeamsService,
    private readonly registrationMapper: TournamentRegistrationMapper,
  ) {}

  async register(dto: CreateTournamentRegistrationDto): Promise<TournamentRegistrationResponseDto> {
    const tournament = await this.tournamentsService.findActiveOrFail(dto.tournamentId);
    this.ensureRegistrationIsOpen(tournament);
    const team = await this.teamsService.findActiveOrFail(dto.teamId);
    await this.ensureTeamPlaysSport(team, tournament);
    await this.ensureNotRegistered(tournament, team);
    const saved = await this.registrationsRepository.save(this.registrationMapper.toEntity(tournament, team));
    return {
      ...this.registrationMapper.toResponseDto(saved),
      message: `"${team.name}" quedó inscrito en "${tournament.name}"`,
    };
  }

  // Retira la inscripción sin eliminar el equipo ni el torneo
  async withdraw(tournamentId: number, teamId: number): Promise<{ message: string }> {
    const registration = await this.registrationsRepository.findOne({
      where: { tournament: { id: tournamentId }, team: { id: teamId } },
      relations: WITH_TOURNAMENT_AND_TEAM,
    });
    if (!registration) {
      throw new NotFoundException('El equipo no está inscrito en ese torneo');
    }
    this.ensureRegistrationIsOpen(registration.tournament);
    await this.ensureTeamHasNoCompetitionData(tournamentId, teamId);
    await this.registrationsRepository.remove(registration);
    return { message: `Se retiró la inscripción de "${registration.team.name}" en "${registration.tournament.name}"` };
  }

  async findTeamsByTournament(tournamentId: number): Promise<TournamentRegistrationResponseDto[]> {
    await this.tournamentsService.findOrFail(tournamentId);
    const registrations = await this.registrationsRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: WITH_TOURNAMENT_AND_TEAM,
      order: { team: { name: 'ASC' } },
    });
    return this.registrationMapper.toResponseDtoList(registrations);
  }

  async findTournamentsByTeam(teamId: number): Promise<TournamentRegistrationResponseDto[]> {
    await this.teamsService.findOrFail(teamId);
    const registrations = await this.registrationsRepository.find({
      where: { team: { id: teamId } },
      relations: WITH_TOURNAMENT_AND_TEAM,
      order: { tournament: { startDate: 'DESC' } },
    });
    return this.registrationMapper.toResponseDtoList(registrations);
  }

  // Usado por grupos y partidos: el equipo debe estar inscrito en el torneo
  async ensureRegistered(tournament: Tournament, team: Team): Promise<void> {
    const registered = await this.registrationsRepository.existsBy({
      tournament: { id: tournament.id },
      team: { id: team.id },
    });
    if (!registered) {
      throw new BadRequestException(`"${team.name}" no está inscrito en "${tournament.name}"`);
    }
  }

  private ensureRegistrationIsOpen(tournament: Tournament): void {
    if (!isRegistrationOpen(tournament)) {
      throw new BadRequestException(
        `Las inscripciones de "${tournament.name}" están cerradas o el torneo ya inició`,
      );
    }
  }

  private async ensureTeamPlaysSport(team: Team, tournament: Tournament): Promise<void> {
    const playsSport = await this.teamSportsRepository.existsBy({
      team: { id: team.id },
      sport: { id: tournament.sport.id },
    });
    if (!playsSport) {
      throw new BadRequestException(`"${team.name}" no está asociado al deporte "${tournament.sport.name}"`);
    }
  }

  private async ensureNotRegistered(tournament: Tournament, team: Team): Promise<void> {
    const registered = await this.registrationsRepository.existsBy({
      tournament: { id: tournament.id },
      team: { id: team.id },
    });
    if (registered) {
      throw new ConflictException(`"${team.name}" ya está inscrito en "${tournament.name}"`);
    }
  }

  // No se retira un equipo que ya está en un grupo o tiene partidos en el torneo
  private async ensureTeamHasNoCompetitionData(tournamentId: number, teamId: number): Promise<void> {
    const inTournament = { phase: { tournament: { id: tournamentId } } };
    const [inGroup, hasMatches] = await Promise.all([
      this.groupTeamsRepository.existsBy({ team: { id: teamId }, group: inTournament }),
      this.matchesRepository.exists({
        where: [
          { ...inTournament, homeTeam: { id: teamId } },
          { ...inTournament, awayTeam: { id: teamId } },
        ],
      }),
    ]);
    if (inGroup || hasMatches) {
      throw new ConflictException('No se puede retirar: el equipo ya está asignado a un grupo o tiene partidos en el torneo');
    }
  }
}
