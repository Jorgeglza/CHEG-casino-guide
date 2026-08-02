import type { Point } from './bets';

// Ways to roll each total with two dice, out of 36 combinations.
export const WAYS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};
const TOTAL_COMBOS = 36;

export function rollProbability(total: number): number {
  return (WAYS[total] / TOTAL_COMBOS) * 100;
}

// --- Come-out roll (before the point is set) ---

export const COME_OUT_NATURAL_WIN = ((WAYS[7] + WAYS[11]) / TOTAL_COMBOS) * 100; // 7 or 11
export const COME_OUT_CRAPS_LOSE = ((WAYS[2] + WAYS[3] + WAYS[12]) / TOTAL_COMBOS) * 100; // 2, 3, 12
export const COME_OUT_POINT_SET = 100 - COME_OUT_NATURAL_WIN - COME_OUT_CRAPS_LOSE; // 4,5,6,8,9,10

export const FIELD_WIN_PROBABILITY =
  ((WAYS[2] + WAYS[3] + WAYS[4] + WAYS[9] + WAYS[10] + WAYS[11] + WAYS[12]) / TOTAL_COMBOS) * 100;

export const ANY_CRAPS_PROBABILITY = ((WAYS[2] + WAYS[3] + WAYS[12]) / TOTAL_COMBOS) * 100;
export const ANY_SEVEN_PROBABILITY = (WAYS[7] / TOTAL_COMBOS) * 100;

// --- After the point is set ---

// Probability the point repeats before a 7 ("makes the point").
export function pointRepeatProbability(point: Point): number {
  return (WAYS[point] / (WAYS[point] + WAYS[7])) * 100;
}

// Probability of a seven-out before the point repeats.
export function sevenOutProbability(point: Point): number {
  return 100 - pointRepeatProbability(point);
}

// House edge for a Place bet on a given number.
export const PLACE_EDGE_BY_NUMBER: Record<Point, number> = {
  4: 6.67,
  10: 6.67,
  5: 4.0,
  9: 4.0,
  6: 1.52,
  8: 1.52,
};

export const BUY_EDGE_BY_NUMBER: Partial<Record<Point, number>> = {
  4: 4.76,
  10: 4.76,
};
