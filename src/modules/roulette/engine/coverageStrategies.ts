import type { CoverageOutcome, CoverageStrategyDef, RouletteVariant } from '../types/roulette';
import { betCoverage, PAYOUT_TABLE } from './rouletteMath';
import { wheelSize } from './wheelOrder';

// Number-coverage strategies: fixed sets of simultaneous bets that together cover a
// chunk of the wheel in one spin. Built entirely from standard bet types/payouts, so
// their house edge is derived the same way as any single bet — no separate hardcoding.

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
    id: 'voisins-du-zero',
    label: 'Voisins du Zero',
    description:
      "The classic European ‘racetrack’ neighbors bet: nine chips spread across the numbers physically closest to zero on a single-zero wheel, using a trio, four splits, and a corner. European wheel only — the neighbor relationships don't hold on the American wheel's different pocket order.",
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
];

export function getCoverageStrategy(id: CoverageStrategyDef['id']): CoverageStrategyDef {
  return COVERAGE_STRATEGIES.find((s) => s.id === id) ?? COVERAGE_STRATEGIES[0];
}

// Union of numbers covered by every leg (each leg's coverage is disjoint for both
// strategies defined above, so no leg's win is ever double-counted).
export function coverageNumbers(def: CoverageStrategyDef): (number | '00')[] {
  const seen = new Set<number | '00'>();
  for (const leg of def.legs) {
    for (const n of betCoverage(leg.betType, leg.params)) seen.add(n);
  }
  return Array.from(seen);
}

const totalUnits = (def: CoverageStrategyDef) => def.legs.reduce((a, l) => a + l.units, 0);

// Full outcome breakdown for a given total stake, split across legs proportional to
// their unit weight. A miss loses everything staked across every leg; a hit returns the
// profit from the one winning leg while every other leg's stake is still lost.
export function computeCoverageOutcome(def: CoverageStrategyDef, variant: RouletteVariant, totalStake: number): CoverageOutcome {
  const stakePerUnit = totalStake / totalUnits(def);
  const size = wheelSize(variant);

  const perNumberPayout: CoverageOutcome['perNumberPayout'] = [];
  const seen = new Set<number | '00'>();
  for (const leg of def.legs) {
    const legStake = leg.units * stakePerUnit;
    const [win, stakeRatio] = PAYOUT_TABLE[leg.betType];
    const profitOnWin = (legStake * win) / stakeRatio;
    for (const n of betCoverage(leg.betType, leg.params)) {
      if (seen.has(n)) continue;
      seen.add(n);
      perNumberPayout.push({ number: n, profit: profitOnWin - (totalStake - legStake) });
    }
  }

  const profits = perNumberPayout.map((p) => p.profit);
  const hitProbability = perNumberPayout.length / size;
  const missCount = size - perNumberPayout.length;
  const expectedValue =
    (profits.reduce((a, b) => a + b, 0) + missCount * -totalStake) / size;

  return {
    numbersCovered: perNumberPayout.length,
    hitProbability,
    houseEdgePct: totalStake > 0 ? (-expectedValue / totalStake) * 100 : 0,
    totalStake,
    worstCaseLoss: totalStake,
    bestCaseProfit: profits.length ? Math.max(...profits) : 0,
    averageProfitIfHit: profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
    perNumberPayout,
  };
}
