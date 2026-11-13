import { Injectable, Logger } from '@nestjs/common';

export type MatchNotification = {
  matchId: number;
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
// Por ahora no hay destinatarios (boletos y apuestas llegan con HU-GC-11) y el ms de correo no está conectado:
// se registra en el log qué se enviaría. Para activarlo basta con implementar findRecipients y deliver.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Partido nuevo: aficionados que han seguido partidos anteriores de cualquiera de los dos equipos
  async notifyMatchCreated(match: MatchNotification): Promise<void> {
    const recipients = await this.findRecipients('MATCH_CREATED', match.matchId);
    await this.deliver(recipients, `Nuevo partido: ${match.homeTeam} vs ${match.awayTeam}`);
  }

  // Anotación registrada: aficionados con boleto o apuesta sobre el partido
  async notifyAnnotation(annotation: AnnotationNotification): Promise<void> {
    const recipients = await this.findRecipients('ANNOTATION', annotation.matchId);
    await this.deliver(
      recipients,
      `Anotación de ${annotation.playerName} (${annotation.teamName}) al minuto ${annotation.minute}`,
    );
  }

  // Resultado final: resumen del encuentro para aficionados con boleto o apuesta
  async notifyMatchResult(result: ResultNotification): Promise<void> {
    const recipients = await this.findRecipients('MATCH_RESULT', result.matchId);
    const scorers = result.scorers.length > 0 ? ` · Anotaron: ${result.scorers.join(', ')}` : '';
    await this.deliver(
      recipients,
      `Final: ${result.homeTeam} ${result.homeScore} - ${result.awayScore} ${result.awayTeam}${scorers}`,
    );
  }

  // Aún no existen boletos ni apuestas, así que no hay aficionados a quienes avisar
  private async findRecipients(_event: string, _matchId: number): Promise<string[]> {
    return [];
  }

  private async deliver(recipients: string[], message: string): Promise<void> {
    this.logger.log(`[notificación] ${message} → ${recipients.length} destinatario(s)`);
  }
}
