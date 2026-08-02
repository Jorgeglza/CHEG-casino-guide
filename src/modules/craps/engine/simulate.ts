import { rollDice } from './dice';
import { oddsWinAmount, placeWinAmount, getStrategy, type Point, type StrategyId } from './bets';

export interface SimConfig {
  startingBankroll: number;
  betSize: number;
  oddsMultiple: number;
  maxRolls: number;
  trials: number;
  strategy: StrategyId;
}

export interface TrialResult {
  trajectory: number[]; // bankroll after each roll (or held flat once ruined)
  finalBankroll: number;
  ruined: boolean;
}

function simulateTrial(config: SimConfig): TrialResult {
  const { startingBankroll, betSize, oddsMultiple, maxRolls } = config;
  const strategy = getStrategy(config.strategy);
  let bankroll = startingBankroll;
  let point: Point | null = null;
  let oddsBet = 0;
  let activePlaceNumbers: Point[] = [];
  const trajectory: number[] = [];
  let ruined = false;

  for (let i = 0; i < maxRolls; i++) {
    if (point === null && bankroll < betSize) {
      ruined = true;
      trajectory.push(bankroll);
      continue;
    }

    const roll = rollDice();
    const total = roll.total;

    if (point === null) {
      if (total === 7 || total === 11) {
        bankroll += betSize;
      } else if (total === 2 || total === 3 || total === 12) {
        bankroll -= betSize;
      } else {
        point = total as Point;
        const desiredOdds = betSize * oddsMultiple;
        oddsBet = Math.min(desiredOdds, Math.max(bankroll, 0));
        activePlaceNumbers = strategy.placeNumbers.filter((n) => n !== point && bankroll >= betSize);
      }
    } else {
      if (total === point) {
        bankroll += betSize + oddsWinAmount(point, oddsBet);
        point = null;
        oddsBet = 0;
        activePlaceNumbers = [];
      } else if (total === 7) {
        bankroll -= betSize + oddsBet + activePlaceNumbers.length * betSize;
        point = null;
        oddsBet = 0;
        activePlaceNumbers = [];
      } else if (activePlaceNumbers.includes(total as Point)) {
        bankroll += placeWinAmount(total as Point, betSize);
      }
      // any other roll: point still working, no bankroll change
    }

    trajectory.push(bankroll);
  }

  return { trajectory, finalBankroll: trajectory[trajectory.length - 1] ?? startingBankroll, ruined };
}

export interface SimSummary {
  trajectoryPercentiles: { roll: number; p10: number; p50: number; p90: number }[];
  finalBankrolls: number[];
  histogram: { bucket: string; count: number }[];
  winRate: number; // % of trials ending above starting bankroll
  riskOfRuin: number; // % of trials that hit zero
  averageFinal: number;
  theoreticalHouseEdge: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export function runMonteCarlo(config: SimConfig): SimSummary {
  const trials: TrialResult[] = [];
  for (let t = 0; t < config.trials; t++) {
    trials.push(simulateTrial(config));
  }

  const rollCount = config.maxRolls;
  const trajectoryPercentiles: SimSummary['trajectoryPercentiles'] = [];
  const sampleStride = Math.max(1, Math.floor(rollCount / 200)); // cap chart points for perf

  for (let r = 0; r < rollCount; r += sampleStride) {
    const valuesAtRoll = trials.map((tr) => tr.trajectory[r] ?? tr.finalBankroll).sort((a, b) => a - b);
    trajectoryPercentiles.push({
      roll: r + 1,
      p10: percentile(valuesAtRoll, 10),
      p50: percentile(valuesAtRoll, 50),
      p90: percentile(valuesAtRoll, 90),
    });
  }

  const finalBankrolls = trials.map((tr) => tr.finalBankroll);
  const wins = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const ruins = trials.filter((tr) => tr.ruined).length;
  const averageFinal = finalBankrolls.reduce((a, b) => a + b, 0) / finalBankrolls.length;

  const min = Math.min(...finalBankrolls);
  const max = Math.max(...finalBankrolls);
  const bucketCount = 12;
  const bucketSize = Math.max(1, (max - min) / bucketCount);
  const buckets = new Array(bucketCount).fill(0);
  finalBankrolls.forEach((b) => {
    const idx = Math.min(bucketCount - 1, Math.floor((b - min) / bucketSize));
    buckets[idx]++;
  });
  const histogram = buckets.map((count, i) => ({
    bucket: `$${Math.round(min + i * bucketSize)}`,
    count,
  }));

  return {
    trajectoryPercentiles,
    finalBankrolls,
    histogram,
    winRate: (wins / trials.length) * 100,
    riskOfRuin: (ruins / trials.length) * 100,
    averageFinal,
    theoreticalHouseEdge: config.betSize > 0 ? (1.41 * config.betSize) / (config.betSize + config.betSize * config.oddsMultiple || 1) : 1.41,
  };
}
