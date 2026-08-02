import type { RoulettePocket, RouletteVariant } from '../types/roulette';
import { buildWheel } from './wheelOrder';

// The only impure engine file — every other engine module is pure and deterministic.
function randomUnit(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 2 ** 32;
  }
  return Math.random();
}

export function spinWheel(variant: RouletteVariant): RoulettePocket {
  const wheel = buildWheel(variant);
  const index = Math.floor(randomUnit() * wheel.length);
  return wheel[Math.min(index, wheel.length - 1)];
}
