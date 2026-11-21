import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const SEND_MATCH_NOTIFICATION_PATH = '/send-match-notification';
const INTERNAL_KEY_HEADER = 'X-Internal-Key';
// El ms de notificaciones envía un correo por destinatario, así que la llamada puede tardar
const REQUEST_TIMEOUT_MS = 60_000;

export type MatchNotificationPayload = {
  recipients: string[];
  subject: string;
  message: string;
  details: string[];
};

// Cliente del ms de notificaciones (Flask). Se identifica con la clave interna compartida (X-Internal-Key).
// Un fallo al avisar nunca debe romper la operación de negocio que lo originó, por eso no lanza errores.
@Injectable()
export class NotificationsClient {
  private readonly logger = new Logger(NotificationsClient.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMatchNotification(payload: MatchNotificationPayload): Promise<void> {
    const baseUrl = this.configService.get<string>('MS_NOTIFICATIONS');
    const internalKey = this.configService.get<string>('NOTIFICATIONS_INTERNAL_KEY');
    if (!baseUrl || !internalKey) {
      this.logger.warn('MS_NOTIFICATIONS o NOTIFICATIONS_INTERNAL_KEY no están configuradas: no se envía la notificación');
      return;
    }

    try {
      await axios.post(`${baseUrl.replace(/\/$/, '')}${SEND_MATCH_NOTIFICATION_PATH}`, payload, {
        headers: { [INTERNAL_KEY_HEADER]: internalKey },
        timeout: REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar la notificación "${payload.subject}": ${(error as Error).message}`);
    }
  }
}
