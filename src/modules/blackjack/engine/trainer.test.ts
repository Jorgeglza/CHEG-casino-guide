import { describe, expect, it } from 'vitest';
import { evaluateAnswer, generateQuestion } from './trainer';
import { getBasicStrategyAction } from './basicStrategy';
import { dealerUpcardRank, handTotal, handType, pairRankKey } from './handMath';
import { DEFAULT_RULES } from '../types/blackjack';

describe('generateQuestion', () => {
  it('generates a pair hand when filtered to pairs', () => {
    const q = generateQuestion('pairs', DEFAULT_RULES);
    expect(q.handType).toBe('pair');
    expect(q.playerCards).toHaveLength(2);
  });

  it('generates a soft hand when filtered to soft', () => {
    const q = generateQuestion('soft', DEFAULT_RULES);
    expect(q.handType).toBe('soft');
    expect(q.playerCards.some((c) => c.rank === 'A')).toBe(true);
  });

  it('generates a hard hand when filtered to hard', () => {
    const q = generateQuestion('hard', DEFAULT_RULES);
    expect(q.handType).toBe('hard');
  });

  it('"all" filter reaches every hand type over many draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      seen.add(generateQuestion('all', DEFAULT_RULES).handType);
    }
    expect(seen.has('hard')).toBe(true);
    expect(seen.has('soft')).toBe(true);
    expect(seen.has('pair')).toBe(true);
  });
});

describe('evaluateAnswer — agrees with the strategy engine', () => {
  it('matches getBasicStrategyAction for 200 random questions', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion('all', DEFAULT_RULES);
      const type = handType(q.playerCards);
      const { total } = handTotal(q.playerCards);
      const dealer = dealerUpcardRank(q.dealerUpcard);
      const expected =
        type === 'pair'
          ? getBasicStrategyAction({ type: 'pair', pairRank: pairRankKey(q.playerCards) }, dealer, DEFAULT_RULES)
          : getBasicStrategyAction({ type, total }, dealer, DEFAULT_RULES);

      const result = evaluateAnswer(q, expected.action, DEFAULT_RULES);
      expect(result.correct).toBe(true);
      expect(result.correctAction).toBe(expected.action);
    }
  });

  it('reports incorrect when the chosen action differs from strategy', () => {
    const q = generateQuestion('hard', DEFAULT_RULES);
    const result = evaluateAnswer(q, 'split', DEFAULT_RULES);
    expect(result.correct).toBe(false);
  });
});
