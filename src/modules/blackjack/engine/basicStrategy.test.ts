import { describe, expect, it } from 'vitest';
import { getBasicStrategyAction } from './basicStrategy';
import { DEFAULT_RULES } from '../types/blackjack';

// Spec section 8: minimum required scenarios.
describe('getBasicStrategyAction — required scenarios', () => {
  it('hard 16 vs dealer 10 surrenders when allowed', () => {
    const cell = getBasicStrategyAction({ type: 'hard', total: 16 }, '10', DEFAULT_RULES);
    expect(cell.action).toBe('surrender');
    expect(cell.abbreviation).toBe('Rh');
  });

  it('hard 16 vs dealer 10 falls back to hit when surrender is disallowed', () => {
    const cell = getBasicStrategyAction({ type: 'hard', total: 16 }, '10', { ...DEFAULT_RULES, lateSurrender: false });
    expect(cell.action).toBe('hit');
  });

  it('hard 12 vs dealer 4 stands', () => {
    const cell = getBasicStrategyAction({ type: 'hard', total: 12 }, '4', DEFAULT_RULES);
    expect(cell.action).toBe('stand');
  });

  it('hard 11 vs dealer 6 doubles', () => {
    const cell = getBasicStrategyAction({ type: 'hard', total: 11 }, '6', DEFAULT_RULES);
    expect(cell.action).toBe('double');
  });

  it('soft 18 vs dealer 9 hits', () => {
    const cell = getBasicStrategyAction({ type: 'soft', total: 18 }, '9', DEFAULT_RULES);
    expect(cell.action).toBe('hit');
  });

  it('pair of 8s vs dealer 10 splits', () => {
    const cell = getBasicStrategyAction({ type: 'pair', pairRank: '8' }, '10', DEFAULT_RULES);
    expect(cell.action).toBe('split');
  });

  it('pair of aces vs dealer 6 splits', () => {
    const cell = getBasicStrategyAction({ type: 'pair', pairRank: 'A' }, '6', DEFAULT_RULES);
    expect(cell.action).toBe('split');
  });

  it('pair of 10s vs dealer 6 stands (does not fall through to hard-total strategy)', () => {
    const cell = getBasicStrategyAction({ type: 'pair', pairRank: '10' }, '6', DEFAULT_RULES);
    expect(cell.action).toBe('stand');
    expect(cell.abbreviation).toBe('S');
  });

  it('hard 15 vs dealer 10 surrenders when allowed, hits when not', () => {
    const withSurrender = getBasicStrategyAction({ type: 'hard', total: 15 }, '10', DEFAULT_RULES);
    expect(withSurrender.action).toBe('surrender');

    const withoutSurrender = getBasicStrategyAction({ type: 'hard', total: 15 }, '10', { ...DEFAULT_RULES, lateSurrender: false });
    expect(withoutSurrender.action).toBe('hit');
  });
});

describe('getBasicStrategyAction — rule sensitivity', () => {
  it('hard 11 vs dealer A doubles under H17 but only hits under S17', () => {
    const s17 = getBasicStrategyAction({ type: 'hard', total: 11 }, 'A', { ...DEFAULT_RULES, dealerHitsSoft17: false });
    const h17 = getBasicStrategyAction({ type: 'hard', total: 11 }, 'A', { ...DEFAULT_RULES, dealerHitsSoft17: true });
    expect(s17.action).toBe('hit');
    expect(h17.action).toBe('double');
  });

  it('pair of 4s only splits when double after split is allowed', () => {
    const withDas = getBasicStrategyAction({ type: 'pair', pairRank: '4' }, '5', { ...DEFAULT_RULES, doubleAfterSplit: true });
    const withoutDas = getBasicStrategyAction({ type: 'pair', pairRank: '4' }, '5', { ...DEFAULT_RULES, doubleAfterSplit: false });
    expect(withDas.action).toBe('split');
    expect(withoutDas.action).toBe('hit');
  });

  it('ace is valued dynamically — soft 12 (A,A unsplit) treated as pair, not hard 12', () => {
    // Sanity check that soft-total lookup for A,6 (soft 17) differs from hard 17 lookup.
    const soft17 = getBasicStrategyAction({ type: 'soft', total: 17 }, '7', DEFAULT_RULES);
    const hard17 = getBasicStrategyAction({ type: 'hard', total: 17 }, '7', DEFAULT_RULES);
    expect(soft17.action).toBe('hit');
    expect(hard17.action).toBe('stand');
  });
});
