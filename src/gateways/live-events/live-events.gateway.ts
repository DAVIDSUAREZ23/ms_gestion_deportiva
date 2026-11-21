import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export type LiveEventType = 'match_created' | 'match_result' | 'match_cancelled' | 'match_annotation';

// Datos públicos (marcadores y anotaciones): se envían a todos los clientes conectados
export type LiveEvent = {
  type: LiveEventType;
  message: string;
  tournamentId: number;
  matchId: number;
  data?: Record<string, unknown>;
};

export const LIVE_EVENT_NAME = 'new_notification';

// Canal en tiempo real (Socket.IO) que comparte el mismo puerto HTTP del microservicio.
// Cada evento trae su tournamentId para que el cliente decida si le interesa.
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',') },
})
export class LiveEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LiveEventsGateway.name);

  @WebSocketServer()
  server?: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado: ${client.id}`);
    client.emit(LIVE_EVENT_NAME, { type: 'connected', message: 'Conectado a los eventos en vivo' });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: unknown): string {
    this.logger.log(`Mensaje recibido: ${JSON.stringify(data)}`);
    return 'Mensaje recibido correctamente';
  }

  // Los servicios de negocio publican sin conocer detalles de Socket.IO
  broadcast(event: LiveEvent): void {
    this.server?.emit(LIVE_EVENT_NAME, event);
  }
}
