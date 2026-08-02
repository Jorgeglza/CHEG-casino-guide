// Pure hand-math helpers — no React, no UI. Single source of truth for totals, softness,
// blackjack/pair detection, and legal actions, reused by the Strategy chart, Hand Trainer,
// and Bet Reference tabs alike.

import type { BlackjackAction, BlackjackHandType, BlackjackRules, Card, DealerUpcard, HandTotal } from '../types/blackjack';

export function cardValue(rank: Card['rank']): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

// Aces start counted as 11 and are demoted to 1 one at a time until the total is 21 or
// under. "Soft" means at least one ace is still being counted as 11.
export function handTotal(cards: Card[]): HandTotal {
  let total = cards.reduce((sum, c) => sum + cardValue(c.rank), 0);
  let acesAsEleven = cards.filter((c) => c.rank === 'A').length;

  while (total > 21 && acesAsEleven > 0) {
    total -= 10;
    acesAsEleven -= 1;
  }

  return { total, isSoft: acesAsEleven > 0 };
}

// A natural blackjack is exactly two cards totaling 21 — a three-card 21 is not one.
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

// Any two same-value cards can be split, including any two ten-value cards (10/J/Q/K mixed).
export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cardValue(cards[0].rank) === cardValue(cards[1].rank);
}

export function handType(cards: Card[]): BlackjackHandType {
  if (isPair(cards)) return 'pair';
  return handTotal(cards).isSoft ? 'soft' : 'hard';
}

// Strategy-table key for a pair: '2'-'9' or 'A' as-is, any ten-value card collapses to '10'.
export function pairRankKey(cards: Card[]): string {
  const rank = cards[0].rank;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return '10';
  return rank;
}

export function dealerUpcardRank(card: Card): DealerUpcard {
  if (card.rank === 'A') return 'A';
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return '10';
  return card.rank as DealerUpcard;
}

export function availableActions(cards: Card[], rules: BlackjackRules, isFirstAction: boolean): BlackjackAction[] {
  const actions: BlackjackAction[] = ['hit', 'stand'];

  if (isFirstAction && cards.length === 2) {
    actions.push('double');
    if (isPair(cards)) actions.push('split');
    if (rules.lateSurrender) actions.push('surrender');
  }

  return actions;
}
