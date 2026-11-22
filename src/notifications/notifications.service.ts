import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Bet, BetStatus } from '../bets/entities/bet.entity';
import { MatchStatus } from '../matches/entities/match.entity';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { NotificationsClient } from './notifications.client';

export type MatchNotification = {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
};

export type MatchCreatedNotification = MatchNotification & {
  scheduledAt: Date;
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
  // true cuando el partido ya estaba finalizado y solo se corrige el marcador
  corrected?: boolean;
};

// El ms de notificaciones limita cada solicitud a 500 destinatarios
const MAX_RECIPIENTS_PER_REQUEST = 500;

// Punto único de avisos a aficionados (HU-GC-06 y HU-GC-07). Aquí se decide A QUIÉN avisar con los datos de
// negocio; el envío del correo lo hace el ms de notificaciones, al que se le pasa la lista de destinatarios.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Ticket) private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Bet) private readonly betsRepository: Repository<Bet>,
    private readonly notificationsClient: NotificationsClient,
  ) {}

  // Partido nuevo (GC-06): aficionados que ya participaron en partidos anteriores de alguno de los dos equipos
  async notifyMatchCreated(match: MatchCreatedNotification): Promise<void> {
    const recipients = await this.previousAttendeesOf([match.homeTeamId, match.awayTeamId], match.scheduledAt);
    const title = `${match.homeTeam} vs ${match.awayTeam}`;
    this.deliver(recipients, `Nuevo partido: ${title}`, `Se programó un nuevo partido: ${title}.`, [
      `Fecha: ${this.formatDate(match.scheduledAt)}`,
    ]);
  }

  // Anotación registrada (GC-07): aficionados con boleto o apuesta sobre el partido
  async notifyAnnotation(annotation: AnnotationNotification): Promise<void> {
    const recipients = await this.holdersOf(annotation.matchId);
    const title = `${annotation.homeTeam} vs ${annotation.awayTeam}`;
    this.deliver(recipients, `Anotación en ${title}`, `Anotó ${annotation.playerName} (${annotation.teamName}) al minuto ${annotation.minute}.`, []);
  }

  // Resultado final (GC-07): resumen del encuentro para aficionados con boleto o apuesta
  async notifyMatchResult(result: ResultNotification): Promise<void> {
    const recipients = await this.holdersOf(result.matchId);
    const score = `${result.homeTeam} ${result.homeScore} - ${result.awayScore} ${result.awayTeam}`;
    const details = result.scorers.length > 0 ? [`Anotaron: ${result.scorers.join(', ')}`] : ['Sin anotaciones registradas'];
    if (result.corrected) {
      this.deliver(recipients, `Resultado corregido: ${score}`, `Se corrigió el resultado del partido: ${score}.`, details);
      return;
    }
    this.deliver(recipients, `Final: ${score}`, `Terminó el partido: ${score}.`, details);
  }

  // Correos (sin repetir) de aficionados activos con boleto vigente en un partido finalizado, anterior al nuevo,
  // en el que jugó alguno de los dos equipos
  private async previousAttendeesOf(teamIds: number[], before: Date): Promise<string[]> {
    const finishedEarlier = { status: MatchStatus.FINISHED, scheduledAt: LessThan(before) };
    const tickets = await this.ticketsRepository.find({
      where: [
        { status: TicketStatus.ACTIVE, fan: { active: true }, match: { ...finishedEarlier, homeTeam: { id: In(teamIds) } } },
        { status: TicketStatus.ACTIVE, fan: { active: true }, match: { ...finishedEarlier, awayTeam: { id: In(teamIds) } } },
      ],
      relations: { fan: true },
    });
    return this.uniqueEmails(tickets.map((ticket) => ticket.fan.email));
  }

  // Correos (sin repetir) de los aficionados activos con boleto vigente o apuesta pagada para el partido
  private async holdersOf(matchId: number): Promise<string[]> {
    const [tickets, bets] = await Promise.all([
      this.ticketsRepository.find({
        where: { match: { id: matchId }, status: TicketStatus.ACTIVE, fan: { active: true } },
        relations: { fan: true },
      }),
      this.betsRepository.find({
        where: {
          match: { id: matchId },
          status: In([BetStatus.ACTIVE, BetStatus.WON, BetStatus.LOST]),
          fan: { active: true },
        },
        relations: { fan: true },
      }),
    ]);
    return this.uniqueEmails([
      ...tickets.map((ticket) => ticket.fan.email),
      ...bets.map((bet) => bet.fan.email),
    ]);
  }

  private uniqueEmails(emails: string[]): string[] {
    return [...new Set(emails)];
  }

  // Pide el envío sin esperar la respuesta: crear un partido o registrar una anotación no debe tardar por los correos
  private deliver(recipients: string[], subject: string, message: string, details: string[]): void {
    if (recipients.length === 0) {
      this.logger.log(`[notificación] ${subject} → sin destinatarios`);
      return;
    }
    this.logger.log(`[notificación] ${subject} → ${recipients.length} destinatario(s)`);
    for (let start = 0; start < recipients.length; start += MAX_RECIPIENTS_PER_REQUEST) {
      void this.notificationsClient.sendMatchNotification({
        recipients: recipients.slice(start, start + MAX_RECIPIENTS_PER_REQUEST),
        subject,
        message,
        details,
      });
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' });
  }
}
