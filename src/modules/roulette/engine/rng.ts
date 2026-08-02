import type { RoulettePocket, RouletteVariant } from '../types/roulette';
import { buildWheel } from './wheelOrder';

// The only impure engine file — every other engine module is pure and deterministic.
//
// crypto.getRandomValues is relatively expensive per call. A Monte Carlo run can spin
// the wheel millions of times, and calling it once per spin (each allocating its own
// Uint32Array) was the dominant cost of a large simulation. Instead, refill a batch of
// random values in one call and hand them out one at a time — same randomness source,
// amortized cost.
const POOL_SIZE = 4096;
const pool = new Uint32Array(POOL_SIZE);
let poolIndex = POOL_SIZE;
const hasCrypto = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';

function nextRandomUint32(): number {
  if (!hasCrypto) {
    // Math.random() returns a float in [0,1); scale it to a uint32 to share the same
    // consumer logic below.
    return Math.floor(Math.random() * 2 ** 32);
  }
  if (poolIndex >= POOL_SIZE) {
    crypto.getRandomValues(pool);
    poolIndex = 0;
  }
  return pool[poolIndex++];
}

function randomUnit(): number {
  return nextRandomUint32() / 2 ** 32;
}

export function spinWheel(variant: RouletteVariant): RoulettePocket {
  const wheel = buildWheel(variant);
  const index = Math.floor(randomUnit() * wheel.length);
  return wheel[Math.min(index, wheel.length - 1)];
}
