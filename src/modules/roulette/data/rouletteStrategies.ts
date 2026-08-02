import type { ComplexityLevel, RiskLevel, RouletteStrategy, StrategyCategory } from '../types/roulette';

export interface StrategyMeta {
  id: RouletteStrategy;
  label: string;
  category: StrategyCategory;
  categoryLabel: string;
  recommendedBet: string;
  startingUnit: string;
  winRule: string;
  lossRule: string;
  resetCondition: string;
  riskLevel: RiskLevel;
  complexityLevel: ComplexityLevel;
  exampleProgression: number[]; // in units
  advantages: string[];
  limitations: string[];
  bankrollWarning: string;
  volatility: 'low' | 'moderate' | 'high' | 'very high';
  betGrowth: 'flat' | 'slow' | 'fast' | 'exponential';
  bankrollDemand: 'low' | 'moderate' | 'high' | 'very high';
  lossChasing: 'none' | 'mild' | 'aggressive';
  bestUseCase: string;
  maxDownside: string;
}

export const STRATEGY_META: StrategyMeta[] = [
  {
    id: 'flat',
    label: 'Flat Betting',
    category: 'flat',
    categoryLabel: 'Flat',
    recommendedBet: 'Any bet type — works with inside or outside bets alike',
    startingUnit: '1 unit',
    winRule: 'Keep betting the same unit size.',
    lossRule: 'Keep betting the same unit size.',
    resetCondition: 'Never needs resetting — the wager never changes.',
    riskLevel: 'low',
    complexityLevel: 'low',
    exampleProgression: [1, 1, 1, 1, 1, 1],
    advantages: [
      'Lowest operational complexity of any approach.',
      'Bankroll drains at a predictable, steady rate.',
      'Works identically on any bet type, inside or outside.',
    ],
    limitations: [
      'Never recovers losses faster than it accumulates them.',
      'No mechanism to capitalize on winning streaks.',
    ],
    bankrollWarning: 'Even at a constant wager, the house edge still applies to every spin — a long session can still lose steadily.',
    volatility: 'low',
    betGrowth: 'flat',
    bankrollDemand: 'low',
    lossChasing: 'none',
    bestUseCase: 'Disciplined, long sessions where predictable pacing matters more than chasing a comeback.',
    maxDownside: 'Bounded by session length × unit size — no runaway wagers.',
  },
  {
    id: 'martingale',
    label: 'Martingale',
    category: 'negative-progression',
    categoryLabel: 'Negative progression',
    recommendedBet: 'Even-money outside bets only (Red/Black, Odd/Even, 1-18/19-36)',
    startingUnit: '1 unit',
    winRule: 'Reset to 1 unit after any win.',
    lossRule: 'Double the wager after every loss.',
    resetCondition: 'Resets to the starting unit on the next spin after a win.',
    riskLevel: 'very-high',
    complexityLevel: 'low',
    exampleProgression: [1, 2, 4, 8, 16, 32],
    advantages: [
      'Simple to follow — one rule for losses, one for wins.',
      'A single win at any point recovers all prior losses in the run plus one unit of profit.',
    ],
    limitations: [
      'A short losing streak escalates the wager exponentially.',
      'Table maximums cap how many times you can double, capping the recovery.',
      'Requires a very large bankroll relative to the starting unit to survive realistic losing streaks.',
    ],
    bankrollWarning: 'A run of just 6-7 consecutive losses (well within normal variance) can require a wager 32-128x your starting unit — this is the single highest-risk strategy on this page.',
    volatility: 'very high',
    betGrowth: 'exponential',
    bankrollDemand: 'very high',
    lossChasing: 'aggressive',
    bestUseCase: 'Short sessions with a firm stop-loss and a table/bankroll limit understood in advance — not for extended play.',
    maxDownside: 'Can hit the table maximum or exhaust the bankroll within a single losing streak.',
  },
  {
    id: 'dalembert',
    label: "D'Alembert",
    category: 'negative-progression',
    categoryLabel: 'Negative progression',
    recommendedBet: 'Even-money outside bets only',
    startingUnit: '1 unit',
    winRule: 'Decrease the wager by 1 unit after a win, never below the base unit.',
    lossRule: 'Increase the wager by 1 unit after a loss.',
    resetCondition: 'Wager floors at the base unit — never resets fully like Martingale does.',
    riskLevel: 'moderate',
    complexityLevel: 'low',
    exampleProgression: [1, 2, 3, 2, 3, 4],
    advantages: [
      'Grows much more slowly than Martingale — arithmetic, not exponential.',
      'Easier to sustain through a moderate losing streak.',
    ],
    limitations: [
      'A long losing streak still steadily raises the wager with no cap.',
      'Slower growth does not change the underlying negative expected value.',
    ],
    bankrollWarning: 'The wager increases every loss with no ceiling — a prolonged cold streak still requires a growing bankroll to sustain.',
    volatility: 'moderate',
    betGrowth: 'slow',
    bankrollDemand: 'moderate',
    lossChasing: 'mild',
    bestUseCase: 'Players who want a gentler alternative to Martingale on the same even-money bets.',
    maxDownside: 'Grows linearly with losing-streak length — much slower ruin than Martingale, but not bounded.',
  },
  {
    id: 'fibonacci',
    label: 'Fibonacci',
    category: 'negative-progression',
    categoryLabel: 'Negative progression',
    recommendedBet: 'Even-money outside bets only',
    startingUnit: '1 unit',
    winRule: 'Move back two positions in the sequence after a win (never below the start).',
    lossRule: 'Move forward one position in the Fibonacci sequence after a loss.',
    resetCondition: 'Effectively resets once retreating two steps returns you to the start of the sequence.',
    riskLevel: 'high',
    complexityLevel: 'moderate',
    exampleProgression: [1, 1, 2, 3, 5, 8, 13],
    advantages: [
      'Grows slower than Martingale during a losing streak.',
      'The two-steps-back rule on a win recovers stakes faster than raw D’Alembert.',
    ],
    limitations: [
      'Requires tracking a position in a sequence, more bookkeeping than flat/D’Alembert.',
      'A long losing streak can still produce a large wager relative to the base unit.',
    ],
    bankrollWarning: 'Stakes can grow substantially during an extended losing sequence — a 10-spin losing streak reaches 55 units before any win.',
    volatility: 'high',
    betGrowth: 'fast',
    bankrollDemand: 'high',
    lossChasing: 'aggressive',
    bestUseCase: 'Players comfortable tracking a sequence who want faster loss recovery than D’Alembert without Martingale’s doubling.',
    maxDownside: 'Bounded only by the length of the Fibonacci table and the table maximum.',
  },
  {
    id: 'labouchere',
    label: 'Labouchère',
    category: 'negative-progression',
    categoryLabel: 'Negative progression',
    recommendedBet: 'Even-money outside bets only',
    startingUnit: 'Sum of the first and last numbers in a configurable sequence (e.g. 1-2-3-4 → 5 units)',
    winRule: 'Cross off the first and last numbers of the sequence.',
    lossRule: 'Append the lost wager (in units) to the end of the sequence.',
    resetCondition: 'The cycle completes — and a new sequence can begin — once the list is empty.',
    riskLevel: 'high',
    complexityLevel: 'high',
    exampleProgression: [5, 5, 6, 5],
    advantages: [
      'Aims to recover an entire target sequence, not just the most recent loss.',
      'Configurable starting sequence lets a player size the target profit and risk tolerance.',
    ],
    limitations: [
      'The most complex system here to track by hand — the sequence changes shape every spin.',
      'A losing streak can grow the sequence (and the wager) substantially before it shrinks.',
    ],
    bankrollWarning: 'Because losses extend the sequence rather than just doubling a single number, a bad run can produce a long tail of escalating wagers before the cycle completes.',
    volatility: 'high',
    betGrowth: 'fast',
    bankrollDemand: 'high',
    lossChasing: 'aggressive',
    bestUseCase: 'Players who want a defined target profit per cycle and are comfortable tracking a changing list.',
    maxDownside: 'Sequence length is unbounded in theory — a losing run can grow the list and the wager together.',
  },
  {
    id: 'paroli',
    label: 'Paroli (Reverse Martingale)',
    category: 'positive-progression',
    categoryLabel: 'Positive progression',
    recommendedBet: 'Even-money outside bets only',
    startingUnit: '1 unit',
    winRule: 'Double the wager after a win, up to a configured cap (e.g. 3 wins in a row).',
    lossRule: 'Reset to 1 unit after any loss.',
    resetCondition: 'Resets to the starting unit after a loss, or automatically after reaching the win cap.',
    riskLevel: 'moderate',
    complexityLevel: 'low',
    exampleProgression: [1, 2, 4, 1, 1, 2],
    advantages: [
      'A single loss only costs the base unit — losses never compound.',
      'Tries to ride winning streaks with only house money at risk once ahead.',
    ],
    limitations: [
      'Does not change the underlying probability of winning any individual spin.',
      'A capped win streak means the biggest wins are self-limited.',
    ],
    bankrollWarning: 'Because the wager resets to the base unit on any loss, this strategy cannot produce the runaway losses Martingale can — but it also cannot guarantee a winning streak will occur.',
    volatility: 'moderate',
    betGrowth: 'fast',
    bankrollDemand: 'low',
    lossChasing: 'none',
    bestUseCase: 'Players who prefer their risk concentrated in win streaks rather than loss streaks.',
    maxDownside: 'Bounded at one base unit per loss — the safest progression system on this page.',
  },
  {
    id: 'james-bond',
    label: 'James Bond',
    category: 'coverage-system',
    categoryLabel: 'Coverage system',
    recommendedBet: 'Fixed spread: 19-36, the 13-18 six line, and straight-up 0 (European only)',
    startingUnit: '200 units total (140 / 50 / 10 split)',
    winRule: 'Repeat the same fixed spread every spin — no progression.',
    lossRule: 'Repeat the same fixed spread every spin — no progression.',
    resetCondition: 'Not applicable — the spread never changes spin to spin.',
    riskLevel: 'high',
    complexityLevel: 'moderate',
    exampleProgression: [200, 200, 200, 200],
    advantages: [
      'Covers 25 of 37 European numbers every spin (1-12 and 0 are the only misses).',
      'No wager growth — the total stake is the same every spin.',
    ],
    limitations: [
      'Requires a large flat bankroll per spin (200 units) relative to a 1-unit strategy.',
      'Any of 1-12 landing loses the entire 200-unit stake for that spin.',
      "Presented here for European roulette only — the split needs re-deriving for American's extra pocket.",
    ],
    bankrollWarning: 'A single spin risks the full 200-unit stake, and numbers 1 through 12 (12 of 37 pockets) are not covered at all.',
    volatility: 'high',
    betGrowth: 'flat',
    bankrollDemand: 'very high',
    lossChasing: 'none',
    bestUseCase: 'Players who want broad number coverage per spin and are comfortable staking a large flat amount each time.',
    maxDownside: 'Bounded at 200 units per spin — no progression, but a large single-spin exposure.',
  },
];

export function getStrategyMeta(id: RouletteStrategy): StrategyMeta {
  return STRATEGY_META.find((s) => s.id === id) ?? STRATEGY_META[0];
}

export const HOUSE_EDGE_DISCLAIMER =
  'A betting system can change the distribution and timing of wins and losses, but it does not remove the roulette house edge.';

export const RESPONSIBLE_GAMBLING_NOTICE = [
  'Roulette outcomes are random and independent — no spin is influenced by any previous spin.',
  'Previous spins do not predict future spins ("hot" and "cold" numbers are a myth).',
  'Betting systems do not change the house edge; they only reshape when and how wins and losses happen.',
  'Progression systems (Martingale, Fibonacci, Labouchère) can produce rapidly increasing wagers during a losing streak.',
  'Set a spending limit and a time limit before you start playing, and stop when you reach either.',
  'Treat roulette as entertainment, not as an income strategy.',
];
