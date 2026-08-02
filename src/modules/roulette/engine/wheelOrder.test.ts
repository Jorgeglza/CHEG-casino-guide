import { describe, expect, it } from 'vitest';
import { AMERICAN_WHEEL_ORDER, EUROPEAN_WHEEL_ORDER, buildWheel, pocketColorOf, wheelSize } from './wheelOrder';

describe('wheelOrder', () => {
  it('has 37 pockets for European and 38 for American', () => {
    expect(EUROPEAN_WHEEL_ORDER.length).toBe(37);
    expect(AMERICAN_WHEEL_ORDER.length).toBe(38);
    expect(wheelSize('european')).toBe(37);
    expect(wheelSize('american')).toBe(38);
  });

  it('European wheel contains 0-36 exactly once each, no 00', () => {
    const numbers = EUROPEAN_WHEEL_ORDER.filter((v) => v !== '00').sort((a, b) => (a as number) - (b as number));
    expect(numbers).toEqual(Array.from({ length: 37 }, (_, i) => i));
    expect(EUROPEAN_WHEEL_ORDER.includes('00')).toBe(false);
  });

  it('American wheel contains 0-36 exactly once each, plus a single 00', () => {
    const numbers = AMERICAN_WHEEL_ORDER.filter((v) => v !== '00').sort((a, b) => (a as number) - (b as number));
    expect(numbers).toEqual(Array.from({ length: 37 }, (_, i) => i));
    expect(AMERICAN_WHEEL_ORDER.filter((v) => v === '00').length).toBe(1);
  });

  it('matches the exact European wheel sequence from the spec', () => {
    expect(EUROPEAN_WHEEL_ORDER.slice(0, 5)).toEqual([0, 32, 15, 19, 4]);
    expect(EUROPEAN_WHEEL_ORDER.slice(-3)).toEqual([35, 3, 26]);
  });

  it('matches the exact American wheel sequence from the spec, with 00 distinct from 0', () => {
    expect(AMERICAN_WHEEL_ORDER.slice(0, 5)).toEqual([0, 28, 9, 26, 30]);
    expect(AMERICAN_WHEEL_ORDER[19]).toBe('00');
    expect(AMERICAN_WHEEL_ORDER[0]).toBe(0);
  });

  it('assigns the standard red/black number sets and green to zeros', () => {
    expect(pocketColorOf(0)).toBe('green');
    expect(pocketColorOf('00')).toBe('green');
    expect(pocketColorOf(1)).toBe('red');
    expect(pocketColorOf(2)).toBe('black');
    expect(pocketColorOf(32)).toBe('red');
  });

  it('buildWheel assigns wheelIndex matching array position', () => {
    const wheel = buildWheel('european');
    expect(wheel[1].value).toBe(32);
    expect(wheel[1].wheelIndex).toBe(1);
  });

  it('has exactly 18 red and 18 black pockets on each variant', () => {
    for (const variant of ['european', 'american'] as const) {
      const wheel = buildWheel(variant);
      expect(wheel.filter((p) => p.color === 'red').length).toBe(18);
      expect(wheel.filter((p) => p.color === 'black').length).toBe(18);
    }
  });
});
