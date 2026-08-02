// Centralized types for the Blackjack module. The Strategy chart, Hand Trainer, and
// Bet Reference tabs all consume these, so keeping them in one file (like Roulette does)
// avoids the chart and trainer ever silently disagreeing about a hand's shape.

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type BlackjackAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export type BlackjackHandType = 'hard' | 'soft' | 'pair';

export interface BlackjackRules {
  decks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  lateSurrender: boolean;
}

export const DEFAULT_RULES: BlackjackRules = {
  decks: 6,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  lateSurrender: true,
};

// Dealer upcard is always shown as a rank 2-10 or 'A' — face cards collapse to '10'.
export type DealerUpcard = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';

export interface HandTotal {
  total: number;
  isSoft: boolean;
}

// A resolved strategy chart cell: the action to display plus which rule it depended on,
// so the UI can render "surrender if allowed" style captions without re-deriving logic.
export interface StrategyCell {
  action: BlackjackAction;
  /** The raw abbreviation the printed chart uses, e.g. 'Rh', 'Ds', 'Ph'. */
  abbreviation: StrategyAbbreviation;
}

export type StrategyAbbreviation = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'Ph' | 'Rh' | 'Rs';

export interface StrategyChart {
  hard: { rowLabels: string[]; cells: StrategyCell[][] };
  soft: { rowLabels: string[]; cells: StrategyCell[][] };
  pairs: { rowLabels: string[]; cells: StrategyCell[][] };
}

export type TrainerFilter = 'hard' | 'soft' | 'pairs' | 'all';

export interface TrainerQuestion {
  playerCards: Card[];
  dealerUpcard: Card;
  handType: BlackjackHandType;
}

export interface TrainerStats {
  correct: number;
  total: number;
}
