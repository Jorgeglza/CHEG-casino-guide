// Single source of truth for Basic Strategy decisions. Every cell is encoded as a base
// action plus (where relevant) a documented fallback, so the Strategy chart and the Hand
// Trainer both call getBasicStrategyAction() and can never disagree.
//
// Tables reflect the standard multi-deck (6-8 deck) reference chart. Dealer-hits-soft-17
// changes a small, well-known set of cells relative to dealer-stands-soft-17; those cells
// are encoded with an explicit h17Override rather than derived at runtime, so the numbers
// are auditable against a printed reference chart.

import type { BlackjackAction, BlackjackRules, DealerUpcard, StrategyAbbreviation, StrategyCell } from '../types/blackjack';

export const DEALER_COLUMNS: DealerUpcard[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

type BaseAction = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'Ph' | 'Rh' | 'Rs';

// row -> per-dealer-column base action (S17 baseline). 'h17:X' overrides are listed separately.
const HARD_TOTALS: Record<number, BaseAction[]> = {
  //           2    3    4    5    6    7    8    9    10   A
  8: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  9: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  10: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  11: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
  12: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  13: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  14: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  15: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'Rh', 'H'],
  16: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'Rh', 'Rh', 'Rh'],
  17: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};
// Hard 5-7 are always Hit regardless of dealer card; hard 18-21 are always Stand.
const HARD_ALWAYS_HIT = [5, 6, 7];
const HARD_ALWAYS_STAND = [18, 19, 20, 21];

// H17 (dealer hits soft 17) makes a few plays slightly more aggressive than S17.
const HARD_H17_OVERRIDES: Record<number, Partial<Record<DealerUpcard, BaseAction>>> = {
  11: { A: 'D' },
  15: { A: 'Rh' },
  17: { A: 'Rs' },
};

const SOFT_TOTALS: Record<number, BaseAction[]> = {
  // soft total (A+n) ->            2    3    4    5    6    7    8    9    10   A
  13: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,2
  14: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,3
  15: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,4
  16: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,5
  17: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,6
  18: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'], // A,7
  19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,8
  20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9
};

const SOFT_H17_OVERRIDES: Record<number, Partial<Record<DealerUpcard, BaseAction>>> = {
  17: { 2: 'D' }, // A,6 vs 2 becomes Double under H17
  18: { 2: 'Ds' }, // A,7 vs 2 becomes Double-or-stand under H17
};

// Pair rank -> per-dealer-column base action. '10' covers any two ten-value cards.
const PAIRS: Record<string, BaseAction[]> = {
  '2': ['Ph', 'Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '3': ['Ph', 'Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '4': ['H', 'H', 'H', 'Ph', 'Ph', 'H', 'H', 'H', 'H', 'H'],
  '5': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  '6': ['Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  '7': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '8': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  '9': ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
  '10': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  A: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
};

// Doubling itself has no rule toggle in this module (RuleControls only exposes decks,
// S17/H17, double-after-split, and late surrender) — a first-action double is always
// available, so 'D'/'Ds' always resolve to 'double'. The distinct abbreviations are kept
// because they carry different meaning on a printed chart (Ds falls back to Stand, not
// Hit, at tables where doubling is restricted) and the legend explains that fallback.
function baseToActionAndAbbreviation(
  base: BaseAction,
  rules: BlackjackRules,
): { action: BlackjackAction; abbreviation: StrategyAbbreviation } {
  switch (base) {
    case 'H':
      return { action: 'hit', abbreviation: 'H' };
    case 'S':
      return { action: 'stand', abbreviation: 'S' };
    case 'D':
      return { action: 'double', abbreviation: 'D' };
    case 'Ds':
      return { action: 'double', abbreviation: 'Ds' };
    case 'P':
      return { action: 'split', abbreviation: 'P' };
    case 'Ph':
      return rules.doubleAfterSplit
        ? { action: 'split', abbreviation: 'Ph' }
        : { action: 'hit', abbreviation: 'Ph' };
    case 'Rh':
      return rules.lateSurrender
        ? { action: 'surrender', abbreviation: 'Rh' }
        : { action: 'hit', abbreviation: 'Rh' };
    case 'Rs':
      return rules.lateSurrender
        ? { action: 'surrender', abbreviation: 'Rs' }
        : { action: 'stand', abbreviation: 'Rs' };
    default:
      return { action: 'hit', abbreviation: 'H' };
  }
}

function dealerIndex(dealerUpcard: DealerUpcard): number {
  return DEALER_COLUMNS.indexOf(dealerUpcard);
}

export interface StrategyHandInput {
  type: 'hard' | 'soft' | 'pair';
  /** Hard/soft: the hand total. Pair: unused. */
  total?: number;
  /** Pair rank key: '2'-'9', '10' (any ten-value card), or 'A'. */
  pairRank?: string;
}

export function getBasicStrategyAction(hand: StrategyHandInput, dealerUpcard: DealerUpcard, rules: BlackjackRules): StrategyCell {
  const col = dealerIndex(dealerUpcard);
  const h17 = rules.dealerHitsSoft17;

  if (hand.type === 'pair') {
    const row = PAIRS[hand.pairRank ?? '10'];
    const base = row[col];
    const { action, abbreviation } = baseToActionAndAbbreviation(base, rules);
    return { action, abbreviation };
  }

  if (hand.type === 'soft') {
    const total = hand.total ?? 13;
    const row = SOFT_TOTALS[total] ?? SOFT_TOTALS[13];
    let base = row[col];
    if (h17) {
      const override = SOFT_H17_OVERRIDES[total]?.[dealerUpcard];
      if (override) base = override;
    }
    const { action, abbreviation } = baseToActionAndAbbreviation(base, rules);
    return { action, abbreviation };
  }

  // hard
  const total = hand.total ?? 8;
  if (HARD_ALWAYS_HIT.includes(total) || total < 5) {
    return { action: 'hit', abbreviation: 'H' };
  }
  if (HARD_ALWAYS_STAND.includes(total) || total > 21) {
    return { action: 'stand', abbreviation: 'S' };
  }
  const row = HARD_TOTALS[total] ?? HARD_TOTALS[17];
  let base = row[col];
  if (h17) {
    const override = HARD_H17_OVERRIDES[total]?.[dealerUpcard];
    if (override) base = override;
  }
  const { action, abbreviation } = baseToActionAndAbbreviation(base, rules);
  return { action, abbreviation };
}

export const ABBREVIATION_LABELS: Record<StrategyAbbreviation, string> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double if allowed, otherwise Hit',
  Ds: 'Double if allowed, otherwise Stand',
  P: 'Split',
  Ph: 'Split if double after split is allowed, otherwise Hit',
  Rh: 'Surrender if allowed, otherwise Hit',
  Rs: 'Surrender if allowed, otherwise Stand',
};
