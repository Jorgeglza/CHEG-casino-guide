// Builds the full Basic Strategy chart (hard / soft / pairs sections) from the same
// getBasicStrategyAction() the Hand Trainer uses, so the printed chart and the trainer's
// "correct answer" can never drift apart.

import { DEALER_COLUMNS, getBasicStrategyAction } from './basicStrategy';
import type { BlackjackRules, StrategyChart } from '../types/blackjack';

const HARD_ROWS = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
const SOFT_ROWS = [20, 19, 18, 17, 16, 15, 14, 13]; // A,9 down to A,2
const SOFT_LABELS: Record<number, string> = {
  20: 'A,9',
  19: 'A,8',
  18: 'A,7',
  17: 'A,6',
  16: 'A,5',
  15: 'A,4',
  14: 'A,3',
  13: 'A,2',
};
const PAIR_ROWS = ['A', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const PAIR_LABELS: Record<string, string> = {
  A: 'A,A',
  '10': '10,10',
  '9': '9,9',
  '8': '8,8',
  '7': '7,7',
  '6': '6,6',
  '5': '5,5',
  '4': '4,4',
  '3': '3,3',
  '2': '2,2',
};

export function buildStrategyChart(rules: BlackjackRules): StrategyChart {
  return {
    hard: {
      rowLabels: HARD_ROWS.map(String),
      cells: HARD_ROWS.map((total) => DEALER_COLUMNS.map((dealer) => getBasicStrategyAction({ type: 'hard', total }, dealer, rules))),
    },
    soft: {
      rowLabels: SOFT_ROWS.map((total) => SOFT_LABELS[total]),
      cells: SOFT_ROWS.map((total) => DEALER_COLUMNS.map((dealer) => getBasicStrategyAction({ type: 'soft', total }, dealer, rules))),
    },
    pairs: {
      rowLabels: PAIR_ROWS.map((rank) => PAIR_LABELS[rank]),
      cells: PAIR_ROWS.map((rank) => DEALER_COLUMNS.map((dealer) => getBasicStrategyAction({ type: 'pair', pairRank: rank }, dealer, rules))),
    },
  };
}
