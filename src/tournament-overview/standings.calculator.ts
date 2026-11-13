export const POINTS_PER_WIN = 3;
export const POINTS_PER_DRAW = 1;

export type StandingTeam = { id: number; name: string };

export type FinishedMatch = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
};

export type StandingRow = {
  position: number;
  team: StandingTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type Tally = Omit<StandingRow, 'position' | 'goalDifference' | 'points'>;

// Tabla de posiciones: 3 puntos por victoria, 1 por empate; desempata diferencia de gol, goles a favor y nombre
export function calculateStandings(teams: StandingTeam[], matches: FinishedMatch[]): StandingRow[] {
  const tallies = new Map<number, Tally>(teams.map((team) => [team.id, emptyTally(team)]));

  for (const match of matches) {
    const home = tallies.get(match.homeTeamId);
    const away = tallies.get(match.awayTeamId);
    if (!home || !away) continue;
    recordMatch(home, match.homeScore, match.awayScore);
    recordMatch(away, match.awayScore, match.homeScore);
  }

  return [...tallies.values()]
    .map(toRow)
    .sort(byRanking)
    .map((row, index) => ({ ...row, position: index + 1 }));
}

function emptyTally(team: StandingTeam): Tally {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
}

function recordMatch(tally: Tally, scored: number, conceded: number): void {
  tally.played += 1;
  tally.goalsFor += scored;
  tally.goalsAgainst += conceded;
  if (scored > conceded) tally.won += 1;
  else if (scored === conceded) tally.drawn += 1;
  else tally.lost += 1;
}

function toRow(tally: Tally): StandingRow {
  return {
    ...tally,
    position: 0,
    goalDifference: tally.goalsFor - tally.goalsAgainst,
    points: tally.won * POINTS_PER_WIN + tally.drawn * POINTS_PER_DRAW,
  };
}

function byRanking(a: StandingRow, b: StandingRow): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.name.localeCompare(b.team.name)
  );
}
