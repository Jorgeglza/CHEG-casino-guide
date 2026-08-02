export const POINT_NUMBERS = [4, 5, 6, 8, 9, 10] as const;
export type Point = (typeof POINT_NUMBERS)[number];

// True-odds payout ratio [win, stake] for the odds bet behind a Pass Line bet, by point.
export const ODDS_PAYOUT: Record<Point, [number, number]> = {
  4: [2, 1],
  10: [2, 1],
  5: [3, 2],
  9: [3, 2],
  6: [6, 5],
  8: [6, 5],
};

export function oddsWinAmount(point: Point, oddsBet: number): number {
  const [win, stake] = ODDS_PAYOUT[point];
  return (oddsBet * win) / stake;
}

// Place-bet payout ratio [win, stake] by number.
export const PLACE_PAYOUT: Record<Point, [number, number]> = {
  4: [9, 5],
  10: [9, 5],
  5: [7, 5],
  9: [7, 5],
  6: [7, 6],
  8: [7, 6],
};

export function placeWinAmount(point: Point, placeBet: number): number {
  const [win, stake] = PLACE_PAYOUT[point];
  return (placeBet * win) / stake;
}

export type StrategyId = 'pass-odds' | 'pass-odds-6-8' | 'pass-odds-all';

export interface StrategyDef {
  id: StrategyId;
  label: string;
  description: string;
  placeNumbers: Point[]; // extra numbers placed once a point is established (point number itself is excluded automatically)
}

export const STRATEGIES: StrategyDef[] = [
  {
    id: 'pass-odds',
    label: 'Pass Line + Odds',
    description: 'Bet the Pass Line, back it with max Odds once a point is set. No other numbers working.',
    placeNumbers: [],
  },
  {
    id: 'pass-odds-6-8',
    label: 'Pass Line + Odds + Place 6 & 8',
    description: 'Pass Line + Odds, plus Place bets on 6 and 8 (excluding whichever is the point) for extra numbers at a low 1.52% edge.',
    placeNumbers: [6, 8],
  },
  {
    id: 'pass-odds-all',
    label: 'Pass Line + Odds + Place all numbers',
    description: 'Pass Line + Odds, plus Place bets on every other point number (4,5,6,8,9,10) — maximum action, but drags in the weaker 4/10 and 5/9 edges.',
    placeNumbers: [4, 5, 6, 8, 9, 10],
  },
];

export function getStrategy(id: StrategyId): StrategyDef {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];
}

export const PASS_LINE_HOUSE_EDGE = 1.41;

export function combinedHouseEdge(oddsMultiple: number): number {
  // Approximate blended house edge for Pass Line + working odds, per standard reference tables.
  const table: Record<number, number> = {
    0: 1.41,
    1: 0.85,
    2: 0.61,
    3: 0.47,
    5: 0.33,
    10: 0.18,
  };
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (k <= oddsMultiple) closest = k;
  }
  return table[closest];
}
