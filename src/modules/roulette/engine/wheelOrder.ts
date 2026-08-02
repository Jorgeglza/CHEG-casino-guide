import type { PocketColor, RoulettePocket, RouletteVariant } from '../types/roulette';

// Authentic wheel pocket order, not a naive 0-36 sequence.
export const EUROPEAN_WHEEL_ORDER: (number | '00')[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const AMERICAN_WHEEL_ORDER: (number | '00')[] = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12,
  8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function pocketColorOf(value: number | '00'): PocketColor {
  if (value === '00' || value === 0) return 'green';
  return RED_NUMBERS.has(value) ? 'red' : 'black';
}

export function wheelOrderFor(variant: RouletteVariant): (number | '00')[] {
  return variant === 'european' ? EUROPEAN_WHEEL_ORDER : AMERICAN_WHEEL_ORDER;
}

export function wheelSize(variant: RouletteVariant): number {
  return variant === 'european' ? 37 : 38;
}

// The wheel layout is fixed per variant, so build it once and reuse the same array/objects
// on every call — spinWheel() calls this on every single spin, and Monte Carlo runs call
// spinWheel up to millions of times per run, so re-allocating 37-38 objects each time was
// the dominant cost of a large simulation. Nothing mutates the returned pockets.
const wheelCache = new Map<RouletteVariant, RoulettePocket[]>();

export function buildWheel(variant: RouletteVariant): RoulettePocket[] {
  let wheel = wheelCache.get(variant);
  if (!wheel) {
    wheel = wheelOrderFor(variant).map((value, wheelIndex) => ({
      value,
      color: pocketColorOf(value),
      wheelIndex,
    }));
    wheelCache.set(variant, wheel);
  }
  return wheel;
}
