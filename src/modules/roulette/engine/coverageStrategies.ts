import type { CoverageOutcome, CoverageStrategyDef, RouletteVariant } from '../types/roulette';
import { betCoverage, PAYOUT_TABLE } from './rouletteMath';
import { wheelSize } from './wheelOrder';

// Number-coverage strategies: fixed sets of simultaneous bets that together cover a
// chunk of the wheel in one spin. Built entirely from standard bet types/payouts, so
// their house edge is derived the same way as any single bet — no separate hardcoding.
// Grouped roughly simple-to-advanced: two outside-bet pairs and one inside-bet pair
// first, then the three classic European "racetrack" neighbor bets.

export const COVERAGE_STRATEGIES: CoverageStrategyDef[] = [
  {
    id: 'two-dozens',
    label: 'Two Dozens Covered',
    description:
      'Bet equally on two of the three dozens at once. Covers 24 of 37 (or 38) numbers, leaving the third dozen and the zero(s) exposed. Works identically on either wheel, and any two dozens are interchangeable by symmetry — this card uses the 1st and 2nd for illustration.',
    variant: 'both',
    legs: [
      { betType: 'dozen', params: { dozenIndex: 1 }, label: '1st dozen (1-12)', units: 1 },
      { betType: 'dozen', params: { dozenIndex: 2 }, label: '2nd dozen (13-24)', units: 1 },
    ],
    defaultTotalStake: 20,
  },
  {
    id: 'two-columns',
    label: 'Two Columns Covered',
    description:
      'The column equivalent of Two Dozens: bet equally on two of the three columns. Same 24-number coverage and same math, just grouped by column instead of dozen — a useful side-by-side comparison of the two outside-bet groupings.',
    variant: 'both',
    legs: [
      { betType: 'column', params: { columnIndex: 1 }, label: 'Column 1', units: 1 },
      { betType: 'column', params: { columnIndex: 2 }, label: 'Column 2', units: 1 },
    ],
    defaultTotalStake: 20,
  },
  {
    id: 'two-six-lines',
    label: 'Two Six-Lines Covered',
    description:
      'An inside-bet alternative to a dozen: two separate six-line (double street) bets on non-adjacent rows, covering 12 scattered numbers at 5:1 instead of the 12 consecutive numbers a single dozen covers at 2:1. Same idea as the outside-bet pairs above, but with inside-bet odds.',
    variant: 'both',
    legs: [
      { betType: 'six-line', params: { rowStart: 1 }, label: 'Six line 1-6', units: 1 },
      { betType: 'six-line', params: { rowStart: 19 }, label: 'Six line 19-24', units: 1 },
    ],
    defaultTotalStake: 10,
  },
  {
    id: 'voisins-du-zero',
    label: 'Voisins du Zero',
    description:
      "The classic European ‘racetrack’ neighbors bet: nine chips spread across the numbers physically closest to zero on a single-zero wheel, using a trio, five splits, and a corner. European wheel only — the neighbor relationships don't hold on the American wheel's different pocket order.",
    variant: 'european',
    legs: [
      { betType: 'trio', params: { numbers: [0, 2, 3] }, label: 'Trio 0-2-3', units: 2 },
      { betType: 'split', params: { numbers: [4, 7] }, label: 'Split 4-7', units: 1 },
      { betType: 'split', params: { numbers: [12, 15] }, label: 'Split 12-15', units: 1 },
      { betType: 'split', params: { numbers: [18, 21] }, label: 'Split 18-21', units: 1 },
      { betType: 'split', params: { numbers: [19, 22] }, label: 'Split 19-22', units: 1 },
      { betType: 'corner', params: { cornerTopLeft: 25 }, label: 'Corner 25-26-28-29', units: 2 },
      { betType: 'split', params: { numbers: [32, 35] }, label: 'Split 32-35', units: 1 },
    ],
    defaultTotalStake: 18,
  },
  {
    id: 'tiers-du-cylindre',
    label: 'Tiers du Cylindre',
    description:
      'The classic bet on the third of the wheel directly opposite zero: six splits covering the 12 numbers from 27 through 33 in wheel order. European wheel only, like Voisins — it relies on physical wheel adjacency, not the layout.',
    variant: 'european',
    legs: [
      { betType: 'split', params: { numbers: [5, 8] }, label: 'Split 5-8', units: 1 },
      { betType: 'split', params: { numbers: [10, 11] }, label: 'Split 10-11', units: 1 },
      { betType: 'split', params: { numbers: [13, 16] }, label: 'Split 13-16', units: 1 },
      { betType: 'split', params: { numbers: [23, 24] }, label: 'Split 23-24', units: 1 },
      { betType: 'split', params: { numbers: [27, 30] }, label: 'Split 27-30', units: 1 },
      { betType: 'split', params: { numbers: [33, 36] }, label: 'Split 33-36', units: 1 },
    ],
    defaultTotalStake: 12,
  },
  {
    id: 'orphelins',
    label: 'Orphelins',
    description:
      "The classic \"orphans\" bet: the 8 numbers left over once Voisins and Tiers are placed, covered with 1 straight-up chip on 0's opposite neighbor (1) plus four splits. Number 17 sits in two overlapping splits, so it pays out twice if it hits — the largest single-number payout this bet offers. European wheel only.",
    variant: 'european',
    legs: [
      { betType: 'straight', params: { numbers: [1] }, label: 'Straight 1', units: 1 },
      { betType: 'split', params: { numbers: [6, 9] }, label: 'Split 6-9', units: 1 },
      { betType: 'split', params: { numbers: [14, 17] }, label: 'Split 14-17', units: 1 },
      { betType: 'split', params: { numbers: [17, 20] }, label: 'Split 17-20', units: 1 },
      { betType: 'split', params: { numbers: [31, 34] }, label: 'Split 31-34', units: 1 },
    ],
    defaultTotalStake: 5,
  },
];

export function getCoverageStrategy(id: CoverageStrategyDef['id']): CoverageStrategyDef {
  return COVERAGE_STRATEGIES.find((s) => s.id === id) ?? COVERAGE_STRATEGIES[0];
}

// Union of numbers covered by every leg (each number counted once here even if two legs
// both cover it — this is the "how many distinct numbers" count, not a payout total).
export function coverageNumbers(def: CoverageStrategyDef): (number | '00')[] {
  const seen = new Set<number | '00'>();
  for (const leg of def.legs) {
    for (const n of betCoverage(leg.betType, leg.params)) seen.add(n);
  }
  return Array.from(seen);
}

export function coverageTotalUnits(def: CoverageStrategyDef): number {
  return def.legs.reduce((a, l) => a + l.units, 0);
}

// Net profit if `winningNumber` lands, given a total stake split across legs by unit
// weight. Sums every leg that covers the number (so a number covered by two legs, like
// Orphelins' 17, pays out on both) and subtracts the stake on every leg that doesn't.
// This is the single primitive reused by both the live Strategy-tab stats table and the
// Monte Carlo simulator's per-spin resolution, so the two can never drift apart.
export function coverageProfitIfNumberHits(def: CoverageStrategyDef, totalStake: number, winningNumber: number | '00'): number {
  const stakePerUnit = totalStake / coverageTotalUnits(def);
  let profit = 0;
  for (const leg of def.legs) {
    const legStake = leg.units * stakePerUnit;
    const covered = betCoverage(leg.betType, leg.params);
    if (covered.includes(winningNumber)) {
      const [win, stakeRatio] = PAYOUT_TABLE[leg.betType];
      profit += (legStake * win) / stakeRatio;
    } else {
      profit -= legStake;
    }
  }
  return profit;
}

// Full outcome breakdown for a given total stake — used by the Strategy tab's cards.
export function computeCoverageOutcome(def: CoverageStrategyDef, variant: RouletteVariant, totalStake: number): CoverageOutcome {
  const size = wheelSize(variant);
  const numbers = coverageNumbers(def);
  const perNumberPayout: CoverageOutcome['perNumberPayout'] = numbers.map((n) => ({
    number: n,
    profit: coverageProfitIfNumberHits(def, totalStake, n),
  }));

  const profits = perNumberPayout.map((p) => p.profit);
  const hitProbability = numbers.length / size;
  const missCount = size - numbers.length;
  const expectedValue = (profits.reduce((a, b) => a + b, 0) + missCount * -totalStake) / size;

  return {
    numbersCovered: numbers.length,
    hitProbability,
    houseEdgePct: totalStake > 0 ? (-expectedValue / totalStake) * 100 : 0,
    totalStake,
    worstCaseLoss: totalStake,
    bestCaseProfit: profits.length ? Math.max(...profits) : 0,
    averageProfitIfHit: profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
    perNumberPayout,
  };
}
