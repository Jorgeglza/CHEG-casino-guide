import { describe, expect, it } from 'vitest';
import { runMonteCarlo, runTrial, type RouletteSimConfig } from './simulate';
import { coverageTotalUnits, getCoverageStrategy } from './coverageStrategies';

const baseConfig: RouletteSimConfig = {
  variant: 'european',
  startingBankroll: 1000,
  baseUnit: 5,
  betMode: 'single',
  strategy: 'flat',
  betType: 'red',
  maxSpins: 50,
  tableMax: 500,
  specialRules: { laPartage: false, enPrison: false },
};

describe('runTrial — single bet mode (unaffected by the coverage-mode addition)', () => {
  it('completes the requested number of spins with a flat wager', () => {
    const result = runTrial(baseConfig, true);
    expect(result.spinsCompleted).toBe(50);
    expect(result.spinHistory).toHaveLength(50);
    expect(result.spinHistory.every((s) => s.wager === 5)).toBe(true);
  });
});

describe('runTrial — coverage mode', () => {
  const def = getCoverageStrategy('two-dozens');
  const coverageConfig: RouletteSimConfig = {
    ...baseConfig,
    betMode: 'coverage',
    coverageStrategyId: 'two-dozens',
  };

  it('stakes the full coverage spread every spin with no progression', () => {
    const result = runTrial(coverageConfig, true);
    const expectedWager = coverageTotalUnits(def) * coverageConfig.baseUnit;
    expect(result.spinHistory.every((s) => s.wager === expectedWager)).toBe(true);
    expect(result.totalWagered).toBe(expectedWager * result.spinsCompleted);
  });

  it('labels every spin history row with the coverage strategy name, not a staking-system label', () => {
    const result = runTrial(coverageConfig, true);
    expect(result.spinHistory.every((s) => s.strategyStateLabel === def.label)).toBe(true);
  });

  it('stops with table-max-exceeded when the coverage spread cannot fit under the table max', () => {
    const result = runTrial({ ...coverageConfig, tableMax: 5 }, true); // spread needs $20
    expect(result.spinsCompleted).toBe(0);
    expect(result.stopReason).toBe('table-max-exceeded');
  });

  it('runs to completion for every coverage strategy without throwing', () => {
    for (const id of ['two-dozens', 'two-columns', 'two-six-lines', 'voisins-du-zero', 'tiers-du-cylindre', 'orphelins'] as const) {
      const result = runTrial({ ...coverageConfig, coverageStrategyId: id, maxSpins: 20 }, false);
      expect(result.spinsCompleted).toBeGreaterThan(0);
    }
  });
});

describe('runMonteCarlo — guide-page aggregate stats', () => {
  it('computes avgSpinsSurvived, avgWinRatePerSpin, avgTotalWagered, and theoreticalExpectedBankroll', () => {
    const summary = runMonteCarlo({ ...baseConfig, maxSpins: 30, stopLoss: undefined, stopWin: undefined }, 200);
    expect(summary.avgSpinsSurvived).toBeGreaterThan(0);
    expect(summary.avgSpinsSurvived).toBeLessThanOrEqual(30);
    expect(summary.avgWinRatePerSpin).toBeGreaterThan(0);
    expect(summary.avgWinRatePerSpin).toBeLessThan(100);
    expect(summary.avgTotalWagered).toBeGreaterThan(0);
    // Over 200 trials the theoretical (closed-form) expected bankroll should land close
    // to the simulated average — that convergence is the pedagogical point of showing both.
    expect(Math.abs(summary.theoreticalExpectedBankroll - summary.averageFinal)).toBeLessThan(200);
  });
});
