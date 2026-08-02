import { describe, expect, it } from 'vitest';
import {
  betCoverage,
  columnOf,
  dozenOf,
  houseEdgeOf,
  isBlack,
  isEven,
  isEvenMoneyBet,
  isGreen,
  isHigh,
  isLow,
  isOdd,
  isRed,
  probabilityOf,
  resolveBet,
} from './rouletteMath';

describe('number properties', () => {
  it('excludes 0 and 00 from parity, range, dozen, and column', () => {
    for (const z of [0, '00'] as const) {
      expect(isOdd(z)).toBe(false);
      expect(isEven(z)).toBe(false);
      expect(isLow(z)).toBe(false);
      expect(isHigh(z)).toBe(false);
      expect(isGreen(z)).toBe(true);
      expect(dozenOf(z)).toBe(null);
      expect(columnOf(z)).toBe(null);
    }
  });

  it('classifies dozens correctly', () => {
    expect(dozenOf(1)).toBe(1);
    expect(dozenOf(12)).toBe(1);
    expect(dozenOf(13)).toBe(2);
    expect(dozenOf(24)).toBe(2);
    expect(dozenOf(25)).toBe(3);
    expect(dozenOf(36)).toBe(3);
  });

  it('classifies columns correctly', () => {
    expect(columnOf(1)).toBe(1);
    expect(columnOf(2)).toBe(2);
    expect(columnOf(3)).toBe(3);
    expect(columnOf(34)).toBe(1);
    expect(columnOf(35)).toBe(2);
    expect(columnOf(36)).toBe(3);
  });

  it('red and black are mutually exclusive and cover all 1-36', () => {
    for (let n = 1; n <= 36; n++) {
      expect(isRed(n) !== isBlack(n)).toBe(true);
    }
  });
});

describe('betCoverage', () => {
  it('covers exactly 18 numbers for each even-money bet', () => {
    for (const type of ['red', 'black', 'odd', 'even', 'low', 'high'] as const) {
      expect(betCoverage(type).length).toBe(18);
    }
  });

  it('covers exactly 12 numbers for dozen and column', () => {
    expect(betCoverage('dozen', { dozenIndex: 1 })).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(betCoverage('column', { columnIndex: 1 }).length).toBe(12);
  });

  it('covers exactly 1 number for straight, including 00', () => {
    expect(betCoverage('straight', { numbers: [17] })).toEqual([17]);
    expect(betCoverage('straight', { numbers: ['00'] })).toEqual(['00']);
  });

  it('street/corner/six-line cover the correct anchored numbers', () => {
    expect(betCoverage('street', { rowStart: 16 })).toEqual([16, 17, 18]);
    expect(betCoverage('corner', { cornerTopLeft: 17 })).toEqual([17, 18, 20, 21]);
    expect(betCoverage('six-line', { rowStart: 16 })).toEqual([16, 17, 18, 19, 20, 21]);
  });

  it('basket covers the 5-number American-only set', () => {
    expect(betCoverage('basket')).toEqual([0, '00', 1, 2, 3]);
  });
});

describe('probabilityOf and houseEdgeOf', () => {
  it('probability = coverage / wheel size, computed dynamically', () => {
    expect(probabilityOf('straight', { numbers: [17] }, 'european')).toBeCloseTo(1 / 37, 10);
    expect(probabilityOf('straight', { numbers: [17] }, 'american')).toBeCloseTo(1 / 38, 10);
  });

  it('matches the standard reference house edges', () => {
    expect(houseEdgeOf('straight', { numbers: [17] }, 'european')).toBeCloseTo(2.7027, 3);
    expect(houseEdgeOf('straight', { numbers: [17] }, 'american')).toBeCloseTo(5.2632, 3);
    expect(houseEdgeOf('red', undefined, 'european')).toBeCloseTo(2.7027, 3);
    expect(houseEdgeOf('red', undefined, 'american')).toBeCloseTo(5.2632, 3);
    expect(houseEdgeOf('dozen', { dozenIndex: 1 }, 'european')).toBeCloseTo(2.7027, 3);
  });

  it('identifies the standard even-money bets', () => {
    expect(isEvenMoneyBet('red')).toBe(true);
    expect(isEvenMoneyBet('dozen')).toBe(false);
    expect(isEvenMoneyBet('straight')).toBe(false);
  });
});

describe('resolveBet', () => {
  it('pays profit-only ratios and returns the stake separately on a win', () => {
    const result = resolveBet('straight', [17], 10, 17);
    expect(result.result).toBe('win');
    expect(result.profit).toBe(350); // 35:1 on a 10-unit stake
  });

  it('loses the full stake on an ordinary loss', () => {
    const result = resolveBet('red', betCoverage('red'), 10, 2); // 2 is black
    expect(result.result).toBe('loss');
    expect(result.profit).toBe(-10);
  });

  it('loses ordinary even-money bets on zero with no special rules', () => {
    const result = resolveBet('red', betCoverage('red'), 10, 0);
    expect(result.result).toBe('loss');
    expect(result.profit).toBe(-10);
  });

  it('applies La Partage: half stake back on zero for even-money bets', () => {
    const result = resolveBet('red', betCoverage('red'), 10, 0, { laPartage: true, enPrison: false });
    expect(result.result).toBe('push');
    expect(result.profit).toBe(-5);
  });

  it('marks En Prison bets as imprisoned rather than resolved on zero', () => {
    const result = resolveBet('red', betCoverage('red'), 10, 0, { laPartage: false, enPrison: true });
    expect(result.result).toBe('imprisoned');
    expect(result.profit).toBe(0);
  });

  it('never applies special rules to non-even-money bets', () => {
    const result = resolveBet('straight', [17], 10, 0, { laPartage: true, enPrison: true });
    expect(result.result).toBe('loss');
    expect(result.profit).toBe(-10);
  });

  it('stores 00 as a distinct literal, never coerced to 0', () => {
    const result = resolveBet('straight', [0], 10, '00');
    expect(result.result).toBe('loss');
  });
});
