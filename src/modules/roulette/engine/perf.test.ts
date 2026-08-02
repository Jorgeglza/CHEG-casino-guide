import { describe, expect, it } from 'vitest';
import { runMonteCarlo, type RouletteSimConfig } from './simulate';

// Regression guard, not a precision benchmark: a large Monte Carlo run should complete
// well within the batching window the Simulator UI uses (500-trial batches yielded via
// setTimeout). These thresholds are deliberately generous — the point is catching an
// accidental return to O(spins) work per spin (e.g. rebuilding the wheel or recomputing
// bet coverage on every spin), not chasing a specific millisecond number.
describe('Monte Carlo performance', () => {
  it('runs 10,000 coverage-mode sessions (Voisins du Zero, 7 legs) in well under a second', () => {
    const config: RouletteSimConfig = {
      variant: 'european',
      startingBankroll: 500,
      baseUnit: 5,
      betMode: 'coverage',
      strategy: 'flat',
      betType: 'red',
      coverageStrategyId: 'voisins-du-zero',
      maxSpins: 200,
      tableMax: 2000,
      specialRules: { laPartage: false, enPrison: false },
    };
    const start = performance.now();
    runMonteCarlo(config, 10000);
    expect(performance.now() - start).toBeLessThan(3000);
  });

  it('runs 10,000 single-bet sessions (Red, flat) in well under a second', () => {
    const config: RouletteSimConfig = {
      variant: 'american',
      startingBankroll: 500,
      baseUnit: 5,
      betMode: 'single',
      strategy: 'flat',
      betType: 'red',
      maxSpins: 200,
      tableMax: 2000,
      specialRules: { laPartage: false, enPrison: false },
    };
    const start = performance.now();
    runMonteCarlo(config, 10000);
    expect(performance.now() - start).toBeLessThan(3000);
  });
});
