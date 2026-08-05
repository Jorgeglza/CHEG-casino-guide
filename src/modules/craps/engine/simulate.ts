import { rollDice } from './dice';
import { oddsWinAmount, placeWinAmount, getStrategy, type Point, type StrategyId } from './bets';
import { getStakingStrategy, stakingStateLabel, type CrapsStakingStrategy, type StakingState } from './strategyEngine';

export interface SimConfig {
  startingBankroll: number;
  baseUnit: number; // base wager size the staking strategy scales up/down from
  oddsMultiple: number;
  tableMax: number;
  maxRolls: number;
  trials: number; // used by the legacy synchronous runMonteCarlo() batch size
  strategy: StrategyId; // which bets are working (bet-selection axis, see ./bets.ts)
  stakingStrategy: CrapsStakingStrategy; // how the Pass Line wager is sized round to round
  paroliCap: number;
  stopLoss?: number;
  stopWin?: number;
}

export type RollOutcome = 'win' | 'lose' | 'neutral';

export type RollStageKey =
  | 'naturalWin'
  | 'crapsLoss'
  | 'pointEstablished'
  | 'pointMade'
  | 'sevenOut'
  | 'placeWin'
  | 'noAction';

export const ROLL_STAGES: Record<RollStageKey, { label: string; outcome: RollOutcome }> = {
  naturalWin: { label: 'Natural (7 or 11 on come-out)', outcome: 'win' },
  crapsLoss: { label: 'Craps (2, 3, or 12 on come-out)', outcome: 'lose' },
  pointEstablished: { label: 'Point established (come-out)', outcome: 'neutral' },
  pointMade: { label: 'Point made (hit the point)', outcome: 'win' },
  sevenOut: { label: 'Seven-out', outcome: 'lose' },
  placeWin: { label: 'Place bet win', outcome: 'win' },
  noAction: { label: 'Point working, no bet resolved', outcome: 'neutral' },
};

export type RollTally = Record<number, Record<RollStageKey, number>>;

export type StopReason = 'max-rolls' | 'stop-loss' | 'stop-win' | 'ruin' | 'table-max-exceeded';

export interface RollRecord {
  rollNumber: number;
  die1: number;
  die2: number;
  total: number;
  point: Point | null;
  stage: RollStageKey;
  wager: number;
  oddsBet: number;
  profit: number;
  bankrollAfter: number;
  stakingStateLabel: string;
}

export interface TrialResult {
  trajectory: number[]; // bankroll after each roll (or held flat once stopped)
  rollHistory: RollRecord[];
  finalBankroll: number;
  ruined: boolean;
  stopReason: StopReason;
  maxDrawdown: number;
  largestWager: number;
  totalWagered: number;
  rollsCompleted: number;
}

function newRollTally(): RollTally {
  const tally: RollTally = {};
  for (let total = 2; total <= 12; total++) {
    tally[total] = { naturalWin: 0, crapsLoss: 0, pointEstablished: 0, pointMade: 0, sevenOut: 0, placeWin: 0, noAction: 0 };
  }
  return tally;
}

function simulateTrial(config: SimConfig, rollTally: RollTally | null, trackHistory: boolean): TrialResult {
  const { startingBankroll, oddsMultiple, maxRolls, tableMax } = config;
  const betStrategy = getStrategy(config.strategy);
  const staking = getStakingStrategy(config.stakingStrategy);
  let stakingState: StakingState = staking.initState(config.baseUnit);

  let bankroll = startingBankroll;
  let peak = bankroll;
  let maxDrawdown = 0;
  let largestWager = 0;
  let totalWagered = 0;
  let point: Point | null = null;
  let currentWager = stakingState.currentWager; // wager for the next/current come-out decision
  let activeWager = 0; // pass line wager locked in while a point is active
  let oddsBet = 0;
  let activePlaceNumbers: Point[] = [];
  const trajectory: number[] = [bankroll];
  const rollHistory: RollRecord[] = [];
  let ruined = false;
  let stopReason: StopReason = 'max-rolls';
  let rollsCompleted = 0;

  for (let i = 0; i < maxRolls; i++) {
    if (point === null) {
      if (currentWager > tableMax) {
        stopReason = 'table-max-exceeded';
        break;
      }
      if (currentWager > bankroll) {
        stopReason = 'ruin';
        ruined = true;
        break;
      }
    }

    const bankrollBefore = bankroll;
    const roll = rollDice();
    const total = roll.total;
    let stage: RollStageKey;
    let recordWager = 0;
    let recordOdds = 0;
    let resolutionOutcome: 'win' | 'loss' | null = null;
    let stakingStop = false;

    if (point === null) {
      const wager = currentWager;
      recordWager = wager;
      totalWagered += wager;
      largestWager = Math.max(largestWager, wager);

      if (total === 7 || total === 11) {
        bankroll += wager;
        stage = 'naturalWin';
        resolutionOutcome = 'win';
      } else if (total === 2 || total === 3 || total === 12) {
        bankroll -= wager;
        stage = 'crapsLoss';
        resolutionOutcome = 'loss';
      } else {
        point = total as Point;
        activeWager = wager;
        const desiredOdds = wager * oddsMultiple;
        oddsBet = Math.min(desiredOdds, Math.max(bankroll - wager, 0));
        activePlaceNumbers = betStrategy.placeNumbers.filter((n) => n !== point && bankroll - wager - oddsBet >= wager);
        totalWagered += oddsBet + activePlaceNumbers.length * wager;
        largestWager = Math.max(largestWager, wager + oddsBet + activePlaceNumbers.length * wager);
        stage = 'pointEstablished';
      }
    } else {
      const wager = activeWager;
      recordWager = wager;
      recordOdds = oddsBet;

      if (total === point) {
        bankroll += wager + oddsWinAmount(point, oddsBet);
        stage = 'pointMade';
        resolutionOutcome = 'win';
        point = null;
        oddsBet = 0;
        activePlaceNumbers = [];
      } else if (total === 7) {
        bankroll -= wager + oddsBet + activePlaceNumbers.length * wager;
        stage = 'sevenOut';
        resolutionOutcome = 'loss';
        point = null;
        oddsBet = 0;
        activePlaceNumbers = [];
      } else if (activePlaceNumbers.includes(total as Point)) {
        bankroll += placeWinAmount(total as Point, wager);
        stage = 'placeWin';
      } else {
        stage = 'noAction';
      }
    }

    if (resolutionOutcome) {
      const res = staking.nextWager(stakingState, resolutionOutcome, config.baseUnit, tableMax, { paroliCap: config.paroliCap });
      stakingState = res.nextState;
      currentWager = res.wager;
      stakingStop = res.stop === true;
    }

    bankroll = Math.max(0, bankroll);
    peak = Math.max(peak, bankroll);
    maxDrawdown = Math.max(maxDrawdown, peak - bankroll);
    rollsCompleted += 1;

    if (rollTally) rollTally[total][stage] += 1;
    trajectory.push(bankroll);

    if (trackHistory) {
      rollHistory.push({
        rollNumber: i + 1,
        die1: roll.die1,
        die2: roll.die2,
        total,
        point,
        stage,
        wager: recordWager,
        oddsBet: recordOdds,
        profit: bankroll - bankrollBefore,
        bankrollAfter: bankroll,
        stakingStateLabel: stakingStateLabel(config.stakingStrategy, stakingState, config.baseUnit),
      });
    }

    if (bankroll === 0) {
      stopReason = 'ruin';
      ruined = true;
      break;
    }
    if (stakingStop && point === null) {
      stopReason = 'table-max-exceeded';
      break;
    }
    if (point === null && config.stopLoss !== undefined && bankroll <= config.stopLoss) {
      stopReason = 'stop-loss';
      break;
    }
    if (point === null && config.stopWin !== undefined && bankroll >= config.stopWin) {
      stopReason = 'stop-win';
      break;
    }
    if (i === maxRolls - 1) {
      stopReason = 'max-rolls';
    }
  }

  return {
    trajectory,
    rollHistory,
    finalBankroll: trajectory[trajectory.length - 1] ?? startingBankroll,
    ruined,
    stopReason,
    maxDrawdown,
    largestWager,
    totalWagered,
    rollsCompleted,
  };
}

export function simulateSingleRun(config: SimConfig): TrialResult {
  return simulateTrial(config, null, true);
}

export interface SimSummary {
  trajectoryPercentiles: { roll: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  finalBankrolls: number[];
  histogram: { bucket: string; bucketStart: number; count: number; winning: boolean }[];
  rollDistribution: {
    total: number;
    win: number;
    lose: number;
    neutral: number;
    stages: { key: RollStageKey; label: string; outcome: RollOutcome; count: number }[];
  }[];
  winRate: number; // % of trials ending above starting bankroll
  riskOfRuin: number; // % of trials that hit zero
  averageFinal: number;
  avgMaxDrawdown: number;
  avgLargestWager: number;
  avgTotalWagered: number;
  theoreticalHouseEdge: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function summarize(config: SimConfig, trials: TrialResult[], rollTally: RollTally): SimSummary {
  const rollCount = config.maxRolls;
  const trajectoryPercentiles: SimSummary['trajectoryPercentiles'] = [];
  const sampleStride = Math.max(1, Math.floor(rollCount / 200)); // cap chart points for perf

  for (let r = 0; r < rollCount; r += sampleStride) {
    const valuesAtRoll = trials.map((tr) => tr.trajectory[r] ?? tr.finalBankroll).sort((a, b) => a - b);
    trajectoryPercentiles.push({
      roll: r + 1,
      p5: percentile(valuesAtRoll, 5),
      p25: percentile(valuesAtRoll, 25),
      p50: percentile(valuesAtRoll, 50),
      p75: percentile(valuesAtRoll, 75),
      p95: percentile(valuesAtRoll, 95),
    });
  }

  const finalBankrolls = trials.map((tr) => tr.finalBankroll);
  const wins = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const ruins = trials.filter((tr) => tr.ruined).length;
  const averageFinal = finalBankrolls.reduce((a, b) => a + b, 0) / finalBankrolls.length;
  const avgMaxDrawdown = trials.reduce((a, t) => a + t.maxDrawdown, 0) / trials.length;
  const avgLargestWager = trials.reduce((a, t) => a + t.largestWager, 0) / trials.length;
  const avgTotalWagered = trials.reduce((a, t) => a + t.totalWagered, 0) / trials.length;

  const positiveCount = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const negativeCount = finalBankrolls.filter((b) => b < config.startingBankroll).length;
  const neutralCount = finalBankrolls.length - positiveCount - negativeCount;

  // bankroll can never go negative (clamped in simulateTrial), so bucket from 0
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

  const rollDistribution = Object.entries(rollTally)
    .map(([total, tally]) => {
      const stages = (Object.keys(tally) as RollStageKey[])
        .filter((key) => tally[key] > 0)
        .map((key) => ({ key, label: ROLL_STAGES[key].label, outcome: ROLL_STAGES[key].outcome, count: tally[key] }))
        .sort((a, b) => b.count - a.count);
      const win = stages.filter((s) => s.outcome === 'win').reduce((a, s) => a + s.count, 0);
      const lose = stages.filter((s) => s.outcome === 'lose').reduce((a, s) => a + s.count, 0);
      const neutral = stages.filter((s) => s.outcome === 'neutral').reduce((a, s) => a + s.count, 0);
      return { total: Number(total), win, lose, neutral, stages };
    })
    .sort((a, b) => a.total - b.total);

  return {
    trajectoryPercentiles,
    finalBankrolls,
    histogram,
    rollDistribution,
    winRate: (wins / trials.length) * 100,
    riskOfRuin: (ruins / trials.length) * 100,
    averageFinal,
    avgMaxDrawdown,
    avgLargestWager,
    avgTotalWagered,
    theoreticalHouseEdge:
      config.baseUnit > 0 ? (1.41 * config.baseUnit) / (config.baseUnit + config.baseUnit * config.oddsMultiple || 1) : 1.41,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePct: (positiveCount / trials.length) * 100,
    neutralPct: (neutralCount / trials.length) * 100,
    negativePct: (negativeCount / trials.length) * 100,
  };
}

// Synchronous Monte Carlo — fine for smaller trial counts (e.g. the reference runs used
// by the Strategy Guide tab, which cache their result once per page load).
export function runMonteCarlo(config: SimConfig, runs: number = config.trials): SimSummary {
  const rollTally = newRollTally();
  const trials: TrialResult[] = [];
  for (let t = 0; t < runs; t++) {
    trials.push(simulateTrial(config, rollTally, false));
  }
  return summarize(config, trials, rollTally);
}

// Chunked Monte Carlo runner so large run counts don't freeze the tab — yields to the
// event loop between batches via setTimeout(...,0), same approach as Blackjack/Roulette.
export function runInBatches(
  config: SimConfig,
  totalRuns: number,
  onProgress: (pct: number) => void,
  onDone: (summary: SimSummary) => void,
): void {
  const batchSize = 300;
  const rollTally = newRollTally();
  const trials: TrialResult[] = [];

  function step() {
    const remaining = totalRuns - trials.length;
    const thisBatch = Math.min(batchSize, remaining);
    for (let i = 0; i < thisBatch; i++) {
      trials.push(simulateTrial(config, rollTally, false));
    }
    onProgress(Math.round((trials.length / totalRuns) * 100));

    if (trials.length < totalRuns) {
      setTimeout(step, 0);
    } else {
      onDone(summarize(config, trials, rollTally));
    }
  }

  step();
}
