import type { BetParams, CoverageStrategyDef, RouletteBetType, RouletteCoverageStrategy, RouletteStrategy, RouletteVariant, SpecialRulesConfig } from '../types/roulette';
import { betCoverage, houseEdgeOf, resolveBet } from './rouletteMath';
import { spinWheel } from './rng';
import { getStrategyDef, isBetCompatible, strategyStateLabel, type StrategyParams, type StrategyState, JAMES_BOND_SPREAD } from './strategyEngine';
import { computeCoverageOutcome, coverageProfitIfNumberHits, coverageTotalUnits, getCoverageStrategy } from './coverageStrategies';

export interface RouletteSimConfig {
  variant: RouletteVariant;
  startingBankroll: number;
  baseUnit: number;
  betMode: 'single' | 'coverage';
  strategy: RouletteStrategy; // used when betMode === 'single'
  betType: RouletteBetType; // used when betMode === 'single' and strategy !== 'james-bond'
  betParams?: BetParams;
  coverageStrategyId?: RouletteCoverageStrategy; // used when betMode === 'coverage'
  maxSpins: number;
  stopLoss?: number; // bankroll floor — stop if bankroll falls to/below this
  stopWin?: number; // bankroll ceiling — stop if bankroll rises to/above this
  tableMax: number;
  specialRules: SpecialRulesConfig;
  strategyParams?: StrategyParams;
}

export type StopReason =
  | 'max-spins'
  | 'stop-loss'
  | 'stop-win'
  | 'ruin'
  | 'table-max-exceeded'
  | 'labouchere-complete';

export interface SpinRecord {
  spinNumber: number;
  winningNumber: number | '00';
  wager: number;
  outcome: 'win' | 'loss';
  profit: number;
  bankrollAfter: number;
  strategyStateLabel: string;
}

export interface RouletteTrialResult {
  trajectory: number[];
  spinHistory: SpinRecord[];
  finalBankroll: number;
  ruined: boolean;
  stopReason: StopReason;
  maxDrawdown: number;
  largestWager: number;
  spinsCompleted: number;
  totalWagered: number;
  wins: number;
  losses: number;
}

// Resolves one round of betting. For every strategy except James Bond this is a single
// bet; James Bond places its fixed three-way spread every spin instead of a scalar wager.
function resolveRound(
  config: RouletteSimConfig,
  wager: number,
  winningNumber: number | '00',
): { profit: number; outcome: 'win' | 'loss' } {
  if (config.strategy === 'james-bond') {
    let profit = 0;
    for (const leg of JAMES_BOND_SPREAD) {
      const stake = wager * leg.fraction;
      const numbers = betCoverage(leg.betType, leg.params);
      const result = resolveBet(leg.betType, numbers, stake, winningNumber, config.specialRules);
      profit += result.profit;
    }
    return { profit, outcome: profit > 0 ? 'win' : 'loss' };
  }

  const numbers = betCoverage(config.betType, config.betParams);
  const result = resolveBet(config.betType, numbers, wager, winningNumber, config.specialRules);

  if (result.result === 'imprisoned') {
    // En Prison: the stake rides on one additional spin with no new wager. Simplification
    // (standard for browser simulators): a double-zero landing again does not re-imprison.
    const prisonSpin = spinWheel(config.variant);
    const survived = numbers.includes(prisonSpin.value);
    return { profit: survived ? 0 : -wager, outcome: survived ? 'win' : 'loss' };
  }

  return { profit: result.profit, outcome: result.result === 'win' ? 'win' : 'loss' };
}

// Resolves one spin of a fixed number-coverage spread (Two Dozens, Voisins du Zero, etc.)
// by reusing the exact same per-leg profit math the Strategy tab's cards display, so the
// simulator and the descriptive stats can never drift apart.
function resolveCoverageRound(
  def: CoverageStrategyDef,
  wager: number,
  winningNumber: number | '00',
): { profit: number; outcome: 'win' | 'loss' } {
  const profit = coverageProfitIfNumberHits(def, wager, winningNumber);
  return { profit, outcome: profit > 0 ? 'win' : 'loss' };
}

export function runTrial(config: RouletteSimConfig, trackHistory: boolean): RouletteTrialResult {
  const usingCoverage = config.betMode === 'coverage';
  const coverageDef = usingCoverage ? getCoverageStrategy(config.coverageStrategyId ?? 'two-dozens') : null;
  // Coverage strategies are always flat — the same fixed spread every spin, no
  // progression — so the wager never changes across the trial.
  const coverageWager = coverageDef ? coverageTotalUnits(coverageDef) * config.baseUnit : 0;

  const strategyDef = usingCoverage ? null : getStrategyDef(config.strategy);
  let state: StrategyState | null = strategyDef ? strategyDef.initState(config.baseUnit, config.strategyParams) : null;
  let bankroll = config.startingBankroll;
  let peak = bankroll;
  let maxDrawdown = 0;
  let largestWager = 0;
  let totalWagered = 0;
  let wins = 0;
  let losses = 0;
  const trajectory: number[] = [bankroll];
  const spinHistory: SpinRecord[] = [];
  let stopReason: StopReason = 'max-spins';
  let ruined = false;
  let spinsCompleted = 0;

  for (let i = 0; i < config.maxSpins; i++) {
    const wager = usingCoverage ? coverageWager : (state as StrategyState).currentWager;

    if (wager > config.tableMax) {
      stopReason = 'table-max-exceeded';
      break;
    }
    if (wager > bankroll) {
      stopReason = 'ruin';
      ruined = true;
      break;
    }

    const pocket = spinWheel(config.variant);
    const { profit, outcome } = usingCoverage
      ? resolveCoverageRound(coverageDef!, wager, pocket.value)
      : resolveRound(config, wager, pocket.value);

    bankroll += profit;
    bankroll = Math.max(0, bankroll);
    totalWagered += wager;
    largestWager = Math.max(largestWager, wager);
    if (outcome === 'win') wins++;
    else losses++;
    spinsCompleted++;

    peak = Math.max(peak, bankroll);
    maxDrawdown = Math.max(maxDrawdown, peak - bankroll);
    trajectory.push(bankroll);

    const next = usingCoverage
      ? null
      : (strategyDef as NonNullable<typeof strategyDef>).nextWager(state as StrategyState, outcome, config.baseUnit, config.tableMax, config.strategyParams);
    if (trackHistory) {
      spinHistory.push({
        spinNumber: i + 1,
        winningNumber: pocket.value,
        wager,
        outcome,
        profit,
        bankrollAfter: bankroll,
        strategyStateLabel: usingCoverage ? coverageDef!.label : strategyStateLabel(config.strategy, state as StrategyState),
      });
    }
    if (next) state = next.nextState;

    if (bankroll === 0) {
      stopReason = 'ruin';
      ruined = true;
      break;
    }
    if (config.stopLoss !== undefined && bankroll <= config.stopLoss) {
      stopReason = 'stop-loss';
      break;
    }
    if (config.stopWin !== undefined && bankroll >= config.stopWin) {
      stopReason = 'stop-win';
      break;
    }
    if (next?.stop) {
      stopReason = config.strategy === 'labouchere' ? 'labouchere-complete' : 'table-max-exceeded';
      break;
    }
    if (i === config.maxSpins - 1) {
      stopReason = 'max-spins';
    }
  }

  return {
    trajectory,
    spinHistory,
    finalBankroll: bankroll,
    ruined,
    stopReason,
    maxDrawdown,
    largestWager,
    spinsCompleted,
    totalWagered,
    wins,
    losses,
  };
}

export function simulateSingleRun(config: RouletteSimConfig): RouletteTrialResult {
  return runTrial(config, true);
}

export interface RouletteSimSummary {
  trajectoryPercentiles: { spin: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  finalBankrolls: number[];
  histogram: { bucket: string; bucketStart: number; count: number; winning: boolean }[];
  winRate: number;
  riskOfRuin: number;
  averageFinal: number;
  medianFinal: number;
  theoreticalHouseEdge: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  avgMaxDrawdown: number;
  avgLargestWager: number;
  stopReasonBreakdown: Record<StopReason, number>;
  profitablePct: number;
  ruinPct: number;
  avgSpinsSurvived: number;
  avgWinRatePerSpin: number; // average, across trials, of (wins / spins completed) — "how often a spin wins," distinct from profitablePct's "did the session end up"
  avgTotalWagered: number;
  theoreticalExpectedBankroll: number; // startingBankroll - avgTotalWagered * theoreticalHouseEdge, for comparing the empirical average against the closed-form expectation
  vsFlatBetting?: { flatAvgFinal: number; flatRiskOfRuin: number };
}

function theoreticalHouseEdgeFor(config: RouletteSimConfig): number {
  if (config.betMode === 'coverage') {
    const def = getCoverageStrategy(config.coverageStrategyId ?? 'two-dozens');
    return computeCoverageOutcome(def, config.variant, coverageTotalUnits(def) * config.baseUnit).houseEdgePct;
  }
  return houseEdgeOf(config.betType, config.betParams, config.variant);
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

const EMPTY_STOP_BREAKDOWN: Record<StopReason, number> = {
  'max-spins': 0,
  'stop-loss': 0,
  'stop-win': 0,
  ruin: 0,
  'table-max-exceeded': 0,
  'labouchere-complete': 0,
};

function summarize(config: RouletteSimConfig, trials: RouletteTrialResult[]): RouletteSimSummary {
  const rollCount = config.maxSpins;
  const trajectoryPercentiles: RouletteSimSummary['trajectoryPercentiles'] = [];
  const sampleStride = Math.max(1, Math.floor(rollCount / 200));

  for (let r = 0; r < rollCount; r += sampleStride) {
    const valuesAtRoll = trials.map((tr) => tr.trajectory[r] ?? tr.finalBankroll).sort((a, b) => a - b);
    trajectoryPercentiles.push({
      spin: r + 1,
      p5: percentile(valuesAtRoll, 5),
      p25: percentile(valuesAtRoll, 25),
      p50: percentile(valuesAtRoll, 50),
      p75: percentile(valuesAtRoll, 75),
      p95: percentile(valuesAtRoll, 95),
    });
  }

  const finalBankrolls = trials.map((tr) => tr.finalBankroll);
  const sortedFinals = [...finalBankrolls].sort((a, b) => a - b);
  const wins = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const ruins = trials.filter((tr) => tr.ruined).length;
  const averageFinal = finalBankrolls.reduce((a, b) => a + b, 0) / finalBankrolls.length;
  const medianFinal = percentile(sortedFinals, 50);

  const positiveCount = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const negativeCount = finalBankrolls.filter((b) => b < config.startingBankroll).length;
  const neutralCount = finalBankrolls.length - positiveCount - negativeCount;

  const min = 0;
  const max = Math.max(...finalBankrolls, config.startingBankroll);
  const bucketCount = 12;
  const bucketSize = Math.max(1, (max - min) / bucketCount);
  const buckets = new Array(bucketCount).fill(0);
  finalBankrolls.forEach((b) => {
    const idx = Math.min(bucketCount - 1, Math.floor((b - min) / bucketSize));
    buckets[idx]++;
  });
  const histogram = buckets.map((count, i) => {
    const bucketStart = min + i * bucketSize;
    return {
      bucket: `$${Math.round(bucketStart)}`,
      bucketStart,
      count,
      winning: bucketStart + bucketSize >= config.startingBankroll,
    };
  });

  const stopReasonBreakdown: Record<StopReason, number> = { ...EMPTY_STOP_BREAKDOWN };
  trials.forEach((t) => {
    stopReasonBreakdown[t.stopReason]++;
  });

  const avgMaxDrawdown = trials.reduce((a, t) => a + t.maxDrawdown, 0) / trials.length;
  const avgLargestWager = trials.reduce((a, t) => a + t.largestWager, 0) / trials.length;
  const avgSpinsSurvived = trials.reduce((a, t) => a + t.spinsCompleted, 0) / trials.length;
  const avgWinRatePerSpin =
    trials.reduce((a, t) => a + (t.spinsCompleted > 0 ? t.wins / t.spinsCompleted : 0), 0) / trials.length;
  const avgTotalWagered = trials.reduce((a, t) => a + t.totalWagered, 0) / trials.length;
  const theoreticalHouseEdge = theoreticalHouseEdgeFor(config);
  const theoreticalExpectedBankroll = config.startingBankroll - avgTotalWagered * (theoreticalHouseEdge / 100);

  return {
    trajectoryPercentiles,
    finalBankrolls,
    histogram,
    winRate: (wins / trials.length) * 100,
    riskOfRuin: (ruins / trials.length) * 100,
    averageFinal,
    medianFinal,
    theoreticalHouseEdge,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePct: (positiveCount / trials.length) * 100,
    neutralPct: (neutralCount / trials.length) * 100,
    negativePct: (negativeCount / trials.length) * 100,
    avgMaxDrawdown,
    avgLargestWager,
    stopReasonBreakdown,
    profitablePct: (positiveCount / trials.length) * 100,
    ruinPct: (ruins / trials.length) * 100,
    avgSpinsSurvived,
    avgWinRatePerSpin: avgWinRatePerSpin * 100,
    avgTotalWagered,
    theoreticalExpectedBankroll,
  };
}

// Synchronous Monte Carlo — fine for small run counts, used internally by runInBatches'
// per-batch work and directly for the vs-flat-betting comparison run.
export function runMonteCarlo(config: RouletteSimConfig, runs: number): RouletteSimSummary {
  const trials: RouletteTrialResult[] = [];
  for (let t = 0; t < runs; t++) {
    trials.push(runTrial(config, false));
  }
  const summary = summarize(config, trials);

  if (config.betMode === 'single' && config.strategy !== 'flat') {
    const flatTrials: RouletteTrialResult[] = [];
    for (let t = 0; t < Math.min(runs, 500); t++) {
      flatTrials.push(runTrial({ ...config, strategy: 'flat' }, false));
    }
    const flatFinals = flatTrials.map((tr) => tr.finalBankroll);
    const flatAvgFinal = flatFinals.reduce((a, b) => a + b, 0) / flatFinals.length;
    const flatRuins = flatTrials.filter((tr) => tr.ruined).length;
    summary.vsFlatBetting = { flatAvgFinal, flatRiskOfRuin: (flatRuins / flatTrials.length) * 100 };
  }

  return summary;
}

// Chunked Monte Carlo runner so large run counts (up to 10,000) don't freeze the tab —
// yields to the event loop between batches via setTimeout(...,0).
export function runInBatches(
  config: RouletteSimConfig,
  totalRuns: number,
  onProgress: (pct: number) => void,
  onDone: (summary: RouletteSimSummary) => void,
): void {
  const batchSize = 500;
  const trials: RouletteTrialResult[] = [];

  function step() {
    const remaining = totalRuns - trials.length;
    const thisBatch = Math.min(batchSize, remaining);
    for (let i = 0; i < thisBatch; i++) {
      trials.push(runTrial(config, false));
    }
    onProgress(Math.round((trials.length / totalRuns) * 100));

    if (trials.length < totalRuns) {
      setTimeout(step, 0);
    } else {
      const summary = summarize(config, trials);
      if (config.betMode === 'single' && config.strategy !== 'flat') {
        const flatTrials: RouletteTrialResult[] = [];
        for (let t = 0; t < Math.min(totalRuns, 500); t++) {
          flatTrials.push(runTrial({ ...config, strategy: 'flat' }, false));
        }
        const flatFinals = flatTrials.map((tr) => tr.finalBankroll);
        const flatAvgFinal = flatFinals.reduce((a, b) => a + b, 0) / flatFinals.length;
        const flatRuins = flatTrials.filter((tr) => tr.ruined).length;
        summary.vsFlatBetting = { flatAvgFinal, flatRiskOfRuin: (flatRuins / flatTrials.length) * 100 };
      }
      onDone(summary);
    }
  }

  step();
}

export { isBetCompatible };
