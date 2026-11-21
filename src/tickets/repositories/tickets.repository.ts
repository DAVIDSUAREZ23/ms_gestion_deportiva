import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TicketStatus } from '../entities/ticket.entity';

// Consultas en SQL puro de boletería; la compra y cancelación usan Repository<Ticket>
@Injectable()
export class TicketsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Boletos activos vendidos de un partido, agrupados por localidad
  async countActiveByMatchAndSection(matchId: number): Promise<Map<number, number>> {
    const rows = await this.dataSource.query(
      `SELECT section_id AS sectionId, COUNT(*) AS sold
       FROM tickets
       WHERE match_id = ? AND status = ?
       GROUP BY section_id`,
      [matchId, TicketStatus.ACTIVE],
    );
    return new Map((rows as { sectionId: number; sold: string }[]).map((row) => [Number(row.sectionId), Number(row.sold)]));
  }
}
