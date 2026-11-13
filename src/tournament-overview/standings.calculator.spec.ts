import { calculateStandings } from './standings.calculator';

const A = { id: 1, name: 'Alfa' };
const B = { id: 2, name: 'Beta' };
const C = { id: 3, name: 'Gamma' };

describe('calculateStandings (HU-GC-08 tabla de posiciones)', () => {
  it('sin partidos jugados deja a todos en cero, ordenados por nombre', () => {
    const table = calculateStandings([C, A, B], []);

    expect(table.map((row) => row.team.name)).toEqual(['Alfa', 'Beta', 'Gamma']);
    expect(table.every((row) => row.points === 0 && row.played === 0)).toBe(true);
  });

  it('suma 3 puntos por victoria y 1 por empate', () => {
    const table = calculateStandings([A, B, C], [
      { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0 },
      { homeTeamId: 2, awayTeamId: 3, homeScore: 1, awayScore: 1 },
    ]);

    const byName = Object.fromEntries(table.map((row) => [row.team.name, row]));
    expect(byName.Alfa).toMatchObject({ points: 3, won: 1, goalsFor: 2, goalsAgainst: 0, position: 1 });
    expect(byName.Beta).toMatchObject({ points: 1, drawn: 1, lost: 1, goalDifference: -2 });
    expect(byName.Gamma).toMatchObject({ points: 1, drawn: 1, goalDifference: 0 });
  });

  it('con igualdad de puntos desempata por diferencia de gol y luego por goles a favor', () => {
    const table = calculateStandings([A, B, C], [
      { homeTeamId: 1, awayTeamId: 3, homeScore: 1, awayScore: 0 },
      { homeTeamId: 2, awayTeamId: 3, homeScore: 3, awayScore: 0 },
      { homeTeamId: 1, awayTeamId: 2, homeScore: 0, awayScore: 0 },
    ]);

    expect(table.map((row) => row.team.name)).toEqual(['Beta', 'Alfa', 'Gamma']);
  });

  it('ignora partidos de equipos que no están en el grupo', () => {
    const table = calculateStandings([A, B], [{ homeTeamId: 1, awayTeamId: 99, homeScore: 5, awayScore: 0 }]);

    expect(table.every((row) => row.played === 0)).toBe(true);
  });
});
