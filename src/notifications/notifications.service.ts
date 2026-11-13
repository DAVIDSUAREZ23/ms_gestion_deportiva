import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FanTeam } from '../fans/entities/fan-team.entity';

export type MatchNotification = {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
};

export type AnnotationNotification = MatchNotification & {
  playerName: string;
  teamName: string;
  minute: number;
};

export type ResultNotification = MatchNotification & {
  homeScore: number;
  awayScore: number;
  scorers: string[];
};

// Punto único de envío de notificaciones a aficionados (HU-GC-06 y HU-GC-07).
// El envío de correo aún no está conectado al ms de notificaciones: se registra en el log qué se enviaría y a quién.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectRepository(FanTeam) private readonly fanTeamsRepository: Repository<FanTeam>) {}

  // Partido nuevo: aficionados activos que siguen a cualquiera de los dos equipos (Aficionado Equipo)
  async notifyMatchCreated(match: MatchNotification): Promise<void> {
    const recipients = await this.followersOf([match.homeTeamId, match.awayTeamId]);
    await this.deliver(recipients, `Nuevo partido: ${match.homeTeam} vs ${match.awayTeam}`);
  }

  // Anotación registrada: aficionados con boleto o apuesta sobre el partido (llegan con boletos y apuestas)
  async notifyAnnotation(annotation: AnnotationNotification): Promise<void> {
    const recipients = await this.holdersOf(annotation.matchId);
    await this.deliver(
      recipients,
      `Anotación de ${annotation.playerName} (${annotation.teamName}) al minuto ${annotation.minute}`,
    );
  }

  // Resultado final: resumen del encuentro para aficionados con boleto o apuesta
  async notifyMatchResult(result: ResultNotification): Promise<void> {
    const recipients = await this.holdersOf(result.matchId);
    const scorers = result.scorers.length > 0 ? ` · Anotaron: ${result.scorers.join(', ')}` : '';
    await this.deliver(
      recipients,
      `Final: ${result.homeTeam} ${result.homeScore} - ${result.awayScore} ${result.awayTeam}${scorers}`,
    );
  }

  // Correos (sin repetir) de los aficionados activos que siguen alguno de los equipos
  private async followersOf(teamIds: number[]): Promise<string[]> {
    const follows = await this.fanTeamsRepository.find({
      where: { team: { id: In(teamIds) }, fan: { active: true } },
      relations: { fan: true },
    });
    return [...new Set(follows.map((follow) => follow.fan.email))];
  }

  // Aún no existen boletos ni apuestas (fases 3 y 4), así que no hay aficionados a quienes avisar
  private async holdersOf(_matchId: number): Promise<string[]> {
    return [];
  }

  private async deliver(recipients: string[], message: string): Promise<void> {
    const to = recipients.length > 0 ? `: ${recipients.join(', ')}` : '';
    this.logger.log(`[notificación] ${message} → ${recipients.length} destinatario(s)${to}`);
  }
}
