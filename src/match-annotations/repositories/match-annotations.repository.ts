import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type TopScorerRow = {
  playerId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamName: string;
  annotations: number;
};

// Reportes en SQL puro; el CRUD de anotaciones sigue usando Repository<MatchAnnotation>
@Injectable()
export class MatchAnnotationsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Jugadores con más anotaciones en los partidos de un torneo (desempata por apellido)
  async findTopScorers(tournamentId: number, limit: number): Promise<TopScorerRow[]> {
    const rows = await this.dataSource.query(
      `SELECT p.id AS playerId, p.first_name AS firstName, p.last_name AS lastName,
              t.id AS teamId, t.name AS teamName, COUNT(*) AS annotations
       FROM match_annotations a
       JOIN matches m ON m.id = a.match_id
       JOIN phases ph ON ph.id = m.phase_id
       JOIN players p ON p.id = a.player_id
       JOIN teams t ON t.id = a.team_id
       WHERE ph.tournament_id = ?
       GROUP BY p.id, p.first_name, p.last_name, t.id, t.name
       ORDER BY annotations DESC, p.last_name ASC, p.first_name ASC
       LIMIT ?`,
      [tournamentId, limit],
    );
    return (rows as Record<string, unknown>[]).map((row) => ({
      playerId: Number(row.playerId),
      firstName: String(row.firstName),
      lastName: String(row.lastName),
      teamId: Number(row.teamId),
      teamName: String(row.teamName),
      annotations: Number(row.annotations),
    }));
  }
}
