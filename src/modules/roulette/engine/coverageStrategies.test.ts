import { describe, expect, it } from 'vitest';
import { computeCoverageOutcome, coverageNumbers, coverageProfitIfNumberHits, coverageTotalUnits, getCoverageStrategy } from './coverageStrategies';

describe('Two Dozens Covered', () => {
  const def = getCoverageStrategy('two-dozens');

  it('covers exactly 24 numbers (two full dozens, no overlap)', () => {
    expect(coverageNumbers(def).length).toBe(24);
  });

  it('has a 24/37 chance of hitting on European and carries the standard 2.70% edge', () => {
    const outcome = computeCoverageOutcome(def, 'european', 20);
    expect(outcome.numbersCovered).toBe(24);
    expect(outcome.hitProbability).toBeCloseTo(24 / 37, 10);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });

  it('carries the standard 5.26% edge on American', () => {
    const outcome = computeCoverageOutcome(def, 'american', 20);
    expect(outcome.hitProbability).toBeCloseTo(24 / 38, 10);
    expect(outcome.houseEdgePct).toBeCloseTo(5.2632, 3);
  });

  it('losing every leg on a miss equals the full total stake', () => {
    const outcome = computeCoverageOutcome(def, 'european', 20);
    expect(outcome.worstCaseLoss).toBe(20);
  });

  it('a hit returns 2:1 profit on its own leg\'s stake and loses the other leg\'s stake', () => {
    // $20 total, 2 units -> $10/leg. Hitting leg profit = 10*2 = 20, minus the other leg's 10 lost = +10.
    const outcome = computeCoverageOutcome(def, 'european', 20);
    expect(outcome.averageProfitIfHit).toBeCloseTo(10, 10);
    expect(outcome.bestCaseProfit).toBeCloseTo(10, 10);
  });
});

describe('Voisins du Zero', () => {
  const def = getCoverageStrategy('voisins-du-zero');

  it('covers the classic 17 numbers around zero with no overlap between legs', () => {
    const numbers = coverageNumbers(def);
    expect(numbers.length).toBe(17);
    expect(numbers).toContain(0);
  });

  it('carries the standard 2.70% edge on European despite the mixed leg sizes', () => {
    const outcome = computeCoverageOutcome(def, 'european', 18);
    expect(outcome.numbersCovered).toBe(17);
    expect(outcome.hitProbability).toBeCloseTo(17 / 37, 10);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });

  it('every legs stake sums to the total stake, so a miss loses the full amount', () => {
    const outcome = computeCoverageOutcome(def, 'european', 18);
    expect(outcome.worstCaseLoss).toBe(18);
  });
});

describe('Two Columns Covered', () => {
  const def = getCoverageStrategy('two-columns');

  it('covers 24 numbers with the standard edge, same as Two Dozens', () => {
    const outcome = computeCoverageOutcome(def, 'european', 20);
    expect(outcome.numbersCovered).toBe(24);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });
});

describe('Two Six-Lines Covered', () => {
  const def = getCoverageStrategy('two-six-lines');

  it('covers 12 scattered numbers at 5:1 odds, still the standard edge', () => {
    const outcome = computeCoverageOutcome(def, 'european', 10);
    expect(outcome.numbersCovered).toBe(12);
    expect(outcome.hitProbability).toBeCloseTo(12 / 37, 10);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });

  it('the two rows do not overlap', () => {
    const numbers = coverageNumbers(def) as number[];
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});

describe('Tiers du Cylindre', () => {
  const def = getCoverageStrategy('tiers-du-cylindre');

  it('covers the classic 12 numbers via six non-overlapping splits', () => {
    expect(coverageTotalUnits(def)).toBe(6);
    const outcome = computeCoverageOutcome(def, 'european', 12);
    expect(outcome.numbersCovered).toBe(12);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });
});

describe('Orphelins', () => {
  const def = getCoverageStrategy('orphelins');

  it('covers exactly 8 distinct numbers even though 17 is double-covered', () => {
    const numbers = coverageNumbers(def);
    expect(numbers.length).toBe(8);
    expect(numbers).toContain(17);
    expect(coverageTotalUnits(def)).toBe(5);
  });

  it('pays out on both overlapping splits when 17 hits', () => {
    // $5 total, 5 units -> $1/unit. Split 14-17 wins 17, split 17-20 wins 17, three
    // other legs (straight 1, split 6-9, split 31-34) lose their $1 stake each.
    const profit = coverageProfitIfNumberHits(def, 5, 17);
    expect(profit).toBeCloseTo(17 + 17 - 3, 10);
  });

  it('still carries the standard 2.70% edge despite the overlap', () => {
    const outcome = computeCoverageOutcome(def, 'european', 5);
    expect(outcome.houseEdgePct).toBeCloseTo(2.7027, 3);
  });
});
