import { describe, expect, it } from 'vitest';
import { availableActions, dealerUpcardRank, handTotal, handType, isBlackjack, isPair } from './handMath';
import { DEFAULT_RULES } from '../types/blackjack';
import type { Card } from '../types/blackjack';

const card = (rank: Card['rank'], suit: Card['suit'] = 'spades'): Card => ({ rank, suit });

describe('handTotal', () => {
  it('sums hard totals with no ace', () => {
    expect(handTotal([card('10'), card('6')])).toEqual({ total: 16, isSoft: false });
  });

  it('counts a single ace as 11 when it fits (soft total)', () => {
    expect(handTotal([card('A'), card('7')])).toEqual({ total: 18, isSoft: true });
  });

  it('demotes an ace to 1 when 11 would bust', () => {
    expect(handTotal([card('A'), card('9'), card('5')])).toEqual({ total: 15, isSoft: false });
  });

  it('handles two aces (soft 12)', () => {
    expect(handTotal([card('A'), card('A')])).toEqual({ total: 12, isSoft: true });
  });
});

describe('isBlackjack', () => {
  it('recognizes a natural two-card 21', () => {
    expect(isBlackjack([card('A'), card('K')])).toBe(true);
  });

  it('does not treat a three-card 21 as blackjack', () => {
    expect(isBlackjack([card('7'), card('7'), card('7')])).toBe(false);
  });
});

describe('isPair / handType', () => {
  it('identifies equal-rank pairs', () => {
    expect(isPair([card('8'), card('8')])).toBe(true);
  });

  it('treats any two ten-value cards as a pair', () => {
    expect(isPair([card('K'), card('Q')])).toBe(true);
  });

  it('classifies pair before hard/soft', () => {
    expect(handType([card('A'), card('A')])).toBe('pair');
    expect(handType([card('A'), card('6')])).toBe('soft');
    expect(handType([card('9'), card('7')])).toBe('hard');
  });
});

describe('dealerUpcardRank', () => {
  it('collapses face cards to 10 and keeps ace as A', () => {
    expect(dealerUpcardRank(card('Q'))).toBe('10');
    expect(dealerUpcardRank(card('A'))).toBe('A');
    expect(dealerUpcardRank(card('6'))).toBe('6');
  });
});

describe('availableActions', () => {
  it('offers hit/stand/double/split/surrender on a first-action pair when surrender is allowed', () => {
    const actions = availableActions([card('8'), card('8')], DEFAULT_RULES, true);
    expect(actions).toEqual(['hit', 'stand', 'double', 'split', 'surrender']);
  });

  it('omits surrender when late surrender is disallowed', () => {
    const actions = availableActions([card('10'), card('6')], { ...DEFAULT_RULES, lateSurrender: false }, true);
    expect(actions).not.toContain('surrender');
  });

  it('only offers hit/stand after the first action', () => {
    const actions = availableActions([card('10'), card('6'), card('2')], DEFAULT_RULES, false);
    expect(actions).toEqual(['hit', 'stand']);
  });
});
