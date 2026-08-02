import { describe, expect, it } from 'vitest';
import { computeCoverageOutcome, coverageNumbers, getCoverageStrategy } from './coverageStrategies';

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
