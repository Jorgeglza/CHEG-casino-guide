// Monte Carlo engine for the Simulator tab. Every hand is played with perfect Basic
// Strategy — decisions come from the same getBasicStrategyAction() the chart and Hand
// Trainer use, so "perfect play" here can never quietly drift from what the app teaches
// elsewhere. Betting strategy (flat / martingale / paroli / 1-3-2-6) only controls how the
// wager is sized round to round; it never influences a single playing decision.
//
// Two deliberate simplifications keep this fast enough for tens of thousands of trials in
// the browser:
// 1. Cards are drawn from an idealized infinite shoe (each of the 13 ranks equally likely
//    on every draw, matching the fixed composition basic strategy itself is computed
//    against) rather than a depleting multi-deck shoe. The `decks` rule therefore doesn't
//    change simulated results — only H17/S17, DAS, and surrender do.
// 2. A pair is split at most once (no re-splitting), matching the Hand Trainer/Rules tabs.
//    If a split hand is dealt into another pair, it's played out as an ordinary hard/soft
//    total instead of being split again.

import { getBasicStrategyAction } from './basicStrategy';
import type { BlackjackAction, BlackjackRules, DealerUpcard, StrategyCell } from '../types/blackjack';

export type BlackjackBettingStrategy = 'flat' | 'martingale' | 'paroli' | '1-3-2-6';

// Card values only (11 = Ace) — no suit — since the simulator never renders individual
// cards, this avoids allocating Card/Suit objects across what can be millions of draws.
const RANK_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];

function defaultDraw(): number {
  return RANK_VALUES[Math.floor(Math.random() * RANK_VALUES.length)];
}

function evalHand(cards: number[]): { total: number; soft: boolean } {
  let total = cards.reduce((sum, c) => sum + c, 0);
  let acesAsEleven = cards.filter((c) => c === 11).length;
  while (total > 21 && acesAsEleven > 0) {
    total -= 10;
    acesAsEleven -= 1;
  }
  return { total, soft: acesAsEleven > 0 };
}

function rankKey(value: number): DealerUpcard {
  return (value === 11 ? 'A' : String(value)) as DealerUpcard;
}

function pairRankKey(value: number): string {
  return value === 11 ? 'A' : String(value);
}

interface Eligibility {
  split: boolean;
  double: boolean;
  surrender: boolean;
}

// Applies which special actions are actually legal at this decision point on top of the
// chart's rules-based resolution — e.g. a chart cell can say "surrender" because late
// surrender is on at this table, but surrender is still illegal on a post-split hand or
// after the player has already hit once. Falls back to the abbreviation's own fallback
// (Rh -> hit, Rs -> stand, Ds -> stand) exactly as the printed chart's legend describes.
function resolveEligibleAction(cell: StrategyCell, eligible: Eligibility): BlackjackAction {
  if (cell.action === 'split' && !eligible.split) return 'hit';
  if (cell.action === 'double' && !eligible.double) return cell.abbreviation === 'Ds' ? 'stand' : 'hit';
  if (cell.action === 'surrender' && !eligible.surrender) return cell.abbreviation === 'Rs' ? 'stand' : 'hit';
  return cell.action;
}

interface SubHandResult {
  total: number;
  busted: boolean;
  wager: number;
  surrendered: boolean;
}

function playHand(
  cards: number[],
  dealerUpcardValue: number,
  rules: BlackjackRules,
  wager: number,
  eligible: Eligibility,
  draw: () => number,
): SubHandResult[] {
  const { total, soft } = evalHand(cards);
  const dealerRank = rankKey(dealerUpcardValue);
  const isPairHand = eligible.split && cards.length === 2 && cards[0] === cards[1];

  const cell = isPairHand
    ? getBasicStrategyAction({ type: 'pair', pairRank: pairRankKey(cards[0]) }, dealerRank, rules)
    : getBasicStrategyAction({ type: soft ? 'soft' : 'hard', total }, dealerRank, rules);

  const action = resolveEligibleAction(cell, eligible);

  if (action === 'stand') return [{ total, busted: false, wager, surrendered: false }];
  if (action === 'surrender') return [{ total, busted: false, wager, surrendered: true }];

  if (action === 'split') {
    const rank = cards[0];
    const hand1 = [rank, draw()];
    const hand2 = [rank, draw()];

    if (rank === 11) {
      // Split aces: one card each, no further hitting/doubling/re-splitting.
      return [
        { total: evalHand(hand1).total, busted: false, wager, surrendered: false },
        { total: evalHand(hand2).total, busted: false, wager, surrendered: false },
      ];
    }

    const subEligible: Eligibility = { split: false, double: rules.doubleAfterSplit, surrender: false };
    return [
      ...playHand(hand1, dealerUpcardValue, rules, wager, subEligible, draw),
      ...playHand(hand2, dealerUpcardValue, rules, wager, subEligible, draw),
    ];
  }

  if (action === 'double') {
    const doubledCards = [...cards, draw()];
    const { total: t } = evalHand(doubledCards);
    return [{ total: t, busted: t > 21, wager: wager * 2, surrendered: false }];
  }

  // hit
  const nextCards = [...cards, draw()];
  const { total: nt } = evalHand(nextCards);
  if (nt > 21) return [{ total: nt, busted: true, wager, surrendered: false }];
  if (nt === 21) return [{ total: nt, busted: false, wager, surrendered: false }];
  return playHand(nextCards, dealerUpcardValue, rules, wager, { split: false, double: false, surrender: false }, draw);
}

function playDealer(upcard: number, hole: number, rules: BlackjackRules, draw: () => number): { total: number; busted: boolean } {
  let cards = [upcard, hole];
  for (;;) {
    const { total, soft } = evalHand(cards);
    if (total > 21) return { total, busted: true };
    if (total > 17) return { total, busted: false };
    if (total === 17) {
      if (soft && rules.dealerHitsSoft17) {
        cards = [...cards, draw()];
        continue;
      }
      return { total, busted: false };
    }
    cards = [...cards, draw()];
  }
}

export interface RoundResult {
  profit: number;
  outcome: 'win' | 'loss' | 'push';
  wagered: number;
  isBlackjack: boolean;
}

export function playRound(rules: BlackjackRules, baseWager: number, draw: () => number = defaultDraw): RoundResult {
  const player = [draw(), draw()];
  const dealerUp = draw();
  const dealerHole = draw();

  const dealerHasBlackjack = evalHand([dealerUp, dealerHole]).total === 21;
  const playerHasBlackjack = evalHand(player).total === 21;

  if (dealerHasBlackjack || playerHasBlackjack) {
    if (dealerHasBlackjack && playerHasBlackjack) {
      return { profit: 0, outcome: 'push', wagered: baseWager, isBlackjack: true };
    }
    if (playerHasBlackjack) {
      return { profit: baseWager * 1.5, outcome: 'win', wagered: baseWager, isBlackjack: true };
    }
    return { profit: -baseWager, outcome: 'loss', wagered: baseWager, isBlackjack: false };
  }

  const subHands = playHand(player, dealerUp, rules, baseWager, { split: true, double: true, surrender: true }, draw);
  const activeHands = subHands.filter((h) => !h.busted && !h.surrendered);

  let dealerTotal = 0;
  let dealerBusted = false;
  if (activeHands.length > 0) {
    const dealer = playDealer(dealerUp, dealerHole, rules, draw);
    dealerTotal = dealer.total;
    dealerBusted = dealer.busted;
  }

  let profit = 0;
  let wagered = 0;
  for (const h of subHands) {
    wagered += h.wager;
    if (h.surrendered) {
      profit -= h.wager / 2;
    } else if (h.busted) {
      profit -= h.wager;
    } else if (dealerBusted) {
      profit += h.wager;
    } else if (h.total > dealerTotal) {
      profit += h.wager;
    } else if (h.total < dealerTotal) {
      profit -= h.wager;
    }
  }

  const outcome: RoundResult['outcome'] = profit > 0 ? 'win' : profit < 0 ? 'loss' : 'push';
  return { profit, outcome, wagered, isBlackjack: false };
}

export interface BettingState {
  multiple: number;
  step: number; // strategy-specific: paroli win-streak count, or 1-3-2-6 sequence index
}

const ONE_THREE_TWO_SIX = [1, 3, 2, 6];

export function initBettingState(): BettingState {
  return { multiple: 1, step: 0 };
}

export function nextBettingState(
  strategy: BlackjackBettingStrategy,
  state: BettingState,
  outcome: RoundResult['outcome'],
  paroliCap: number,
): BettingState {
  if (outcome === 'push') return state; // a push replays the same wager

  switch (strategy) {
    case 'flat':
      return { multiple: 1, step: 0 };
    case 'martingale':
      return outcome === 'win' ? { multiple: 1, step: 0 } : { multiple: state.multiple * 2, step: 0 };
    case 'paroli': {
      if (outcome === 'loss') return { multiple: 1, step: 0 };
      const streak = state.step + 1;
      if (streak >= paroliCap) return { multiple: 1, step: 0 };
      return { multiple: state.multiple * 2, step: streak };
    }
    case '1-3-2-6': {
      if (outcome === 'loss') return { multiple: 1, step: 0 };
      const nextIndex = (state.step + 1) % ONE_THREE_TWO_SIX.length;
      return { multiple: ONE_THREE_TWO_SIX[nextIndex], step: nextIndex };
    }
    default:
      return state;
  }
}

export interface BlackjackSimConfig {
  rules: BlackjackRules;
  bettingStrategy: BlackjackBettingStrategy;
  startingBankroll: number;
  baseUnit: number;
  tableMax: number;
  maxHands: number;
  stopLoss?: number;
  stopWin?: number;
  paroliCap: number;
}

export type BlackjackStopReason = 'max-hands' | 'stop-loss' | 'stop-win' | 'ruin' | 'table-max-exceeded';

export interface HandRecord {
  handNumber: number;
  wager: number;
  wagered: number;
  outcome: 'win' | 'loss' | 'push';
  profit: number;
  bankrollAfter: number;
  bettingStateLabel: string;
}

export interface BlackjackTrialResult {
  trajectory: number[];
  handHistory: HandRecord[];
  finalBankroll: number;
  ruined: boolean;
  stopReason: BlackjackStopReason;
  maxDrawdown: number;
  largestWager: number;
  handsCompleted: number;
  totalWagered: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
}

export function runTrial(config: BlackjackSimConfig, trackHistory: boolean): BlackjackTrialResult {
  let bettingState = initBettingState();
  let bankroll = config.startingBankroll;
  let peak = bankroll;
  let maxDrawdown = 0;
  let largestWager = 0;
  let totalWagered = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let blackjacks = 0;
  const trajectory: number[] = [bankroll];
  const handHistory: HandRecord[] = [];
  let stopReason: BlackjackStopReason = 'max-hands';
  let ruined = false;
  let handsCompleted = 0;

  for (let i = 0; i < config.maxHands; i++) {
    const wager = bettingState.multiple * config.baseUnit;

    if (wager > config.tableMax) {
      stopReason = 'table-max-exceeded';
      break;
    }
    if (wager > bankroll) {
      stopReason = 'ruin';
      ruined = true;
      break;
    }

    const round = playRound(config.rules, wager);
    bankroll += round.profit;
    bankroll = Math.max(0, bankroll);
    totalWagered += round.wagered;
    largestWager = Math.max(largestWager, round.wagered);
    if (round.outcome === 'win') wins += 1;
    else if (round.outcome === 'loss') losses += 1;
    else pushes += 1;
    if (round.isBlackjack && round.outcome === 'win') blackjacks += 1;
    handsCompleted += 1;

    peak = Math.max(peak, bankroll);
    maxDrawdown = Math.max(maxDrawdown, peak - bankroll);
    trajectory.push(bankroll);

    if (trackHistory) {
      handHistory.push({
        handNumber: i + 1,
        wager,
        wagered: round.wagered,
        outcome: round.outcome,
        profit: round.profit,
        bankrollAfter: bankroll,
        bettingStateLabel: `${bettingState.multiple}x unit`,
      });
    }

    bettingState = nextBettingState(config.bettingStrategy, bettingState, round.outcome, config.paroliCap);

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
    if (i === config.maxHands - 1) {
      stopReason = 'max-hands';
    }
  }

  return {
    trajectory,
    handHistory,
    finalBankroll: bankroll,
    ruined,
    stopReason,
    maxDrawdown,
    largestWager,
    handsCompleted,
    totalWagered,
    wins,
    losses,
    pushes,
    blackjacks,
  };
}

export function simulateSingleRun(config: BlackjackSimConfig): BlackjackTrialResult {
  return runTrial(config, true);
}

export interface BlackjackSimSummary {
  trajectoryPercentiles: { hand: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  histogram: { bucket: string; bucketStart: number; count: number; winning: boolean }[];
  averageFinal: number;
  medianFinal: number;
  profitablePct: number;
  ruinPct: number;
  avgMaxDrawdown: number;
  avgLargestWager: number;
  avgHandsSurvived: number;
  avgHandWinRate: number;
  avgHandPushRate: number;
  avgTotalWagered: number;
  avgBlackjacksPerTrial: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function summarize(config: BlackjackSimConfig, trials: BlackjackTrialResult[]): BlackjackSimSummary {
  const handCount = config.maxHands;
  const trajectoryPercentiles: BlackjackSimSummary['trajectoryPercentiles'] = [];
  const sampleStride = Math.max(1, Math.floor(handCount / 200));

  for (let h = 0; h < handCount; h += sampleStride) {
    const valuesAtHand = trials.map((tr) => tr.trajectory[h] ?? tr.finalBankroll).sort((a, b) => a - b);
    trajectoryPercentiles.push({
      hand: h + 1,
      p5: percentile(valuesAtHand, 5),
      p25: percentile(valuesAtHand, 25),
      p50: percentile(valuesAtHand, 50),
      p75: percentile(valuesAtHand, 75),
      p95: percentile(valuesAtHand, 95),
    });
  }

  const finalBankrolls = trials.map((tr) => tr.finalBankroll);
  const sortedFinals = [...finalBankrolls].sort((a, b) => a - b);
  const positiveCount = finalBankrolls.filter((b) => b > config.startingBankroll).length;
  const ruins = trials.filter((tr) => tr.ruined).length;
  const averageFinal = finalBankrolls.reduce((a, b) => a + b, 0) / finalBankrolls.length;
  const medianFinal = percentile(sortedFinals, 50);

  const min = 0;
  const max = Math.max(...finalBankrolls, config.startingBankroll);
  const bucketCount = 12;
  const bucketSize = Math.max(1, (max - min) / bucketCount);
  const buckets = new Array(bucketCount).fill(0);
  finalBankrolls.forEach((b) => {
    const idx = Math.min(bucketCount - 1, Math.floor((b - min) / bucketSize));
    buckets[idx] += 1;
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

  const avgMaxDrawdown = trials.reduce((a, t) => a + t.maxDrawdown, 0) / trials.length;
  const avgLargestWager = trials.reduce((a, t) => a + t.largestWager, 0) / trials.length;
  const avgHandsSurvived = trials.reduce((a, t) => a + t.handsCompleted, 0) / trials.length;
  const avgHandWinRate =
    trials.reduce((a, t) => a + (t.handsCompleted > 0 ? t.wins / t.handsCompleted : 0), 0) / trials.length;
  const avgHandPushRate =
    trials.reduce((a, t) => a + (t.handsCompleted > 0 ? t.pushes / t.handsCompleted : 0), 0) / trials.length;
  const avgTotalWagered = trials.reduce((a, t) => a + t.totalWagered, 0) / trials.length;
  const avgBlackjacksPerTrial = trials.reduce((a, t) => a + t.blackjacks, 0) / trials.length;

  return {
    trajectoryPercentiles,
    histogram,
    averageFinal,
    medianFinal,
    profitablePct: (positiveCount / trials.length) * 100,
    ruinPct: (ruins / trials.length) * 100,
    avgMaxDrawdown,
    avgLargestWager,
    avgHandsSurvived,
    avgHandWinRate: avgHandWinRate * 100,
    avgHandPushRate: avgHandPushRate * 100,
    avgTotalWagered,
    avgBlackjacksPerTrial,
  };
}

// Synchronous Monte Carlo — used internally by runInBatches for each batch's work.
export function runMonteCarlo(config: BlackjackSimConfig, runs: number): BlackjackSimSummary {
  const trials: BlackjackTrialResult[] = [];
  for (let t = 0; t < runs; t++) {
    trials.push(runTrial(config, false));
  }
  return summarize(config, trials);
}

// Chunked Monte Carlo runner so large run counts (up to 10,000) don't freeze the tab —
// yields to the event loop between batches via setTimeout(...,0), same approach as the
// Roulette and Craps simulators.
export function runInBatches(
  config: BlackjackSimConfig,
  totalRuns: number,
  onProgress: (pct: number) => void,
  onDone: (summary: BlackjackSimSummary) => void,
): void {
  const batchSize = 300;
  const trials: BlackjackTrialResult[] = [];

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
      onDone(summarize(config, trials));
    }
  }

  step();
}
