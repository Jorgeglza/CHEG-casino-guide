import type { CrapsStakingStrategy } from '../engine/strategyEngine';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

export interface StakingStrategyMeta {
  id: CrapsStakingStrategy;
  label: string;
  riskLevel: RiskLevel;
  riskLabel: string;
  winRule: string;
  lossRule: string;
  advantages: string[];
  limitations: string[];
  bestUseCase: string;
}

export const STAKING_STRATEGY_META: StakingStrategyMeta[] = [
  {
    id: 'flat',
    label: 'Flat',
    riskLevel: 'low',
    riskLabel: 'Low',
    winRule: 'Keep wagering the same base unit.',
    lossRule: 'Keep wagering the same base unit.',
    advantages: [
      'Lowest operational complexity — the wager never needs recalculating between decisions.',
      'Bankroll drains at a steady, predictable rate.',
    ],
    limitations: [
      'No mechanism to press a winning streak or contain a losing one.',
    ],
    bestUseCase: 'Disciplined, longer sessions where predictable pacing matters more than chasing a comeback.',
  },
  {
    id: 'martingale',
    label: 'Martingale',
    riskLevel: 'very-high',
    riskLabel: 'Very high',
    winRule: 'Reset to the base unit after any Pass Line win.',
    lossRule: 'Double the wager after every Pass Line loss (craps or seven-out).',
    advantages: [
      'A single win at any point recovers every prior loss in the run plus one unit of profit.',
    ],
    limitations: [
      'A short losing streak escalates the wager exponentially — 6-7 straight losses (well within normal variance) demands 32-128x the base unit.',
      'Table maximums cap how many times the wager can double, capping the recovery.',
    ],
    bestUseCase: 'Short sessions with a firm stop-loss and a table/bankroll limit understood in advance.',
  },
  {
    id: 'paroli',
    label: 'Paroli',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
    winRule: 'Double the wager after each Pass Line win, up to a configured cap of consecutive wins.',
    lossRule: 'Reset to the base unit after any Pass Line loss.',
    advantages: [
      'A single loss only ever costs the base unit — losses never compound.',
      'Tries to ride winning streaks with increasingly more of the casino’s money at risk, rather than your own.',
    ],
    limitations: [
      'Does not change the probability that any individual point is made.',
      'The capped win streak means the biggest wins are self-limited.',
    ],
    bestUseCase: 'Players who prefer their risk concentrated in win streaks rather than loss streaks.',
  },
  {
    id: 'dalembert',
    label: "D'Alembert",
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
    winRule: 'Decrease the wager by one unit after a win, never below the base unit.',
    lossRule: 'Increase the wager by one unit after a loss.',
    advantages: [
      'Grows arithmetically rather than exponentially — much gentler than Martingale.',
      'Easier to sustain through a moderate losing streak.',
    ],
    limitations: [
      'A long losing streak still raises the wager every time, with no cap.',
      'Slower growth does not change the underlying negative expected value.',
    ],
    bestUseCase: 'Players who want a gentler alternative to Martingale on the same Pass Line bet.',
  },
];

export function getStakingStrategyMeta(id: CrapsStakingStrategy): StakingStrategyMeta {
  return STAKING_STRATEGY_META.find((s) => s.id === id) ?? STAKING_STRATEGY_META[0];
}

export const HOUSE_EDGE_DISCLAIMER =
  'A staking system can change the size and timing of individual wagers, but it does not remove the craps house edge — every bet on the table keeps the same edge no matter how much is riding on it.';

export const RESPONSIBLE_GAMBLING_NOTICE = [
  'Dice rolls are random and independent — no roll is influenced by any previous roll ("the table is due" is a myth).',
  'Staking systems do not change the house edge; they only reshape when and how wins and losses happen.',
  'Progression systems (Martingale) can produce rapidly increasing wagers during a losing streak.',
  'Set a spending limit and a time limit before you start playing, and stop when you reach either.',
  'Treat craps as entertainment, not as an income strategy.',
];
