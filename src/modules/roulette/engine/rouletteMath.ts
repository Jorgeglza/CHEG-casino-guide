import type { BetParams, BetPayoutInfo, RouletteBetType, RouletteVariant, SpecialRulesConfig } from '../types/roulette';
import { pocketColorOf, wheelSize } from './wheelOrder';

// Single source of truth for roulette math — reused by table highlighting, the bet
// reference table, the simulator, and the rules tab's worked examples, so numbers can
// never drift between them.

export function isRed(n: number | '00'): boolean {
  return pocketColorOf(n) === 'red';
}

export function isBlack(n: number | '00'): boolean {
  return pocketColorOf(n) === 'black';
}

export function isGreen(n: number | '00'): boolean {
  return pocketColorOf(n) === 'green';
}

export function isOdd(n: number | '00'): boolean {
  return typeof n === 'number' && n >= 1 && n % 2 === 1;
}

export function isEven(n: number | '00'): boolean {
  return typeof n === 'number' && n >= 2 && n % 2 === 0;
}

export function isLow(n: number | '00'): boolean {
  return typeof n === 'number' && n >= 1 && n <= 18;
}

export function isHigh(n: number | '00'): boolean {
  return typeof n === 'number' && n >= 19 && n <= 36;
}

export function dozenOf(n: number | '00'): 1 | 2 | 3 | null {
  if (typeof n !== 'number' || n < 1 || n > 36) return null;
  if (n <= 12) return 1;
  if (n <= 24) return 2;
  return 3;
}

export function columnOf(n: number | '00'): 1 | 2 | 3 | null {
  if (typeof n !== 'number' || n < 1 || n > 36) return null;
  const mod = n % 3;
  if (mod === 1) return 1;
  if (mod === 2) return 2;
  return 3;
}

const ALL_NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1);

// Central coverage function: the numbers a given bet selection wins on. Drives both
// payout resolution and table-highlighting — never duplicated elsewhere.
export function betCoverage(type: RouletteBetType, params?: BetParams): (number | '00')[] {
  switch (type) {
    case 'straight':
      return params?.numbers ? params.numbers.slice(0, 1) : [];
    case 'split':
      return params?.numbers ? params.numbers.slice(0, 2) : [];
    case 'trio':
      return params?.numbers ? params.numbers.slice(0, 3) : [];
    case 'basket':
      return [0, '00', 1, 2, 3];
    case 'street': {
      const start = params?.rowStart;
      if (!start) return [];
      return [start, start + 1, start + 2];
    }
    case 'six-line': {
      const start = params?.rowStart;
      if (!start) return [];
      return [start, start + 1, start + 2, start + 3, start + 4, start + 5];
    }
    case 'corner': {
      const tl = params?.cornerTopLeft;
      if (!tl) return [];
      return [tl, tl + 1, tl + 3, tl + 4];
    }
    case 'dozen': {
      const idx = params?.dozenIndex ?? 1;
      const start = (idx - 1) * 12 + 1;
      return ALL_NUMBERS.slice(start - 1, start + 11);
    }
    case 'column': {
      const idx = params?.columnIndex ?? 1;
      return ALL_NUMBERS.filter((n) => columnOf(n) === idx);
    }
    case 'red':
      return ALL_NUMBERS.filter(isRed);
    case 'black':
      return ALL_NUMBERS.filter(isBlack);
    case 'odd':
      return ALL_NUMBERS.filter(isOdd);
    case 'even':
      return ALL_NUMBERS.filter(isEven);
    case 'low':
      return ALL_NUMBERS.filter(isLow);
    case 'high':
      return ALL_NUMBERS.filter(isHigh);
    default:
      return [];
  }
}

// Profit-only ratios [win, stake] — win units of profit per stake units wagered. The
// original stake is always returned separately on a win, never double-counted.
export const PAYOUT_TABLE: Record<RouletteBetType, [number, number]> = {
  straight: [35, 1],
  split: [17, 1],
  street: [11, 1],
  corner: [8, 1],
  'six-line': [5, 1],
  trio: [11, 1],
  basket: [6, 1],
  dozen: [2, 1],
  column: [2, 1],
  red: [1, 1],
  black: [1, 1],
  odd: [1, 1],
  even: [1, 1],
  low: [1, 1],
  high: [1, 1],
};

export const EVEN_MONEY_BET_TYPES: RouletteBetType[] = ['red', 'black', 'odd', 'even', 'low', 'high'];

export function isEvenMoneyBet(type: RouletteBetType): boolean {
  return EVEN_MONEY_BET_TYPES.includes(type);
}

export function probabilityOf(type: RouletteBetType, params: BetParams | undefined, variant: RouletteVariant): number {
  return betCoverage(type, params).length / wheelSize(variant);
}

// House edge derived from payout + probability, so the standard 2.70%/5.26% figures
// fall out of the math rather than being hardcoded separately (doubles as a correctness
// self-check against the reference tables in the spec).
export function houseEdgeOf(type: RouletteBetType, params: BetParams | undefined, variant: RouletteVariant): number {
  const probability = probabilityOf(type, params, variant);
  const [win, stake] = PAYOUT_TABLE[type];
  const edge = 1 - probability * (1 + win / stake);
  return edge * 100;
}

export type Volatility = 'low' | 'medium' | 'high';

// Sample params sufficient to compute coverage count for each bet type, independent of
// any specific table position — only the count (not the exact numbers) matters here.
const SAMPLE_PARAMS: Partial<Record<RouletteBetType, BetParams>> = {
  straight: { numbers: [1] },
  split: { numbers: [1, 2] },
  trio: { numbers: [0, 1, 2] },
  street: { rowStart: 1 },
  corner: { cornerTopLeft: 1 },
  'six-line': { rowStart: 1 },
  dozen: { dozenIndex: 1 },
  column: { columnIndex: 1 },
};

export function volatilityOf(type: RouletteBetType): Volatility {
  const covered = betCoverage(type, SAMPLE_PARAMS[type]).length;
  if (covered <= 3) return 'high';
  if (covered <= 6) return 'medium';
  return 'low';
}

export interface ResolveBetResult {
  result: 'win' | 'loss' | 'push' | 'imprisoned';
  profit: number; // net change to bankroll (excluding the stake itself, which is assumed already deducted)
}

// Resolves one placed bet against a winning number. Zero/00 lose ordinary bets by
// default (they're never included in outside-bet coverage) unless La Partage / En Prison
// is explicitly enabled for an even-money outside bet.
export function resolveBet(
  type: RouletteBetType,
  numbers: (number | '00')[],
  stake: number,
  winningNumber: number | '00',
  specialRules?: SpecialRulesConfig,
): ResolveBetResult {
  if (numbers.includes(winningNumber)) {
    const [win, stakeRatio] = PAYOUT_TABLE[type];
    return { result: 'win', profit: (stake * win) / stakeRatio };
  }

  if (isEvenMoneyBet(type) && isGreen(winningNumber) && specialRules) {
    if (specialRules.laPartage) {
      return { result: 'push', profit: -stake / 2 };
    }
    if (specialRules.enPrison) {
      return { result: 'imprisoned', profit: 0 };
    }
  }

  return { result: 'loss', profit: -stake };
}

export const BASKET_AMERICAN_HOUSE_EDGE = houseEdgeOfBasket();

function houseEdgeOfBasket(): number {
  const probability = 5 / 38;
  const [win, stake] = PAYOUT_TABLE.basket;
  return (1 - probability * (1 + win / stake)) * 100;
}

// Exact physical chip-placement instructions for the live selection currently on the
// table — distinct from data/rouletteBets.ts's static reference examples, this reflects
// the actual number(s)/index the player picked, not a fixed illustrative sample.
export function placementDescription(type: RouletteBetType, params?: BetParams): string {
  switch (type) {
    case 'straight':
      return `Place your chip directly on the number ${params?.numbers?.[0] ?? '?'}.`;
    case 'split':
      return `Place your chip on the line shared by ${params?.numbers?.[0] ?? '?'} and ${params?.numbers?.[1] ?? '?'}.`;
    case 'trio':
      return `Place your chip on the corner shared by ${(params?.numbers ?? []).join(', ')}.`;
    case 'basket':
      return 'Place your chip on the outer corner shared by 0, 00, 1, 2, and 3.';
    case 'street': {
      const s = params?.rowStart;
      return s ? `Place your chip on the outer edge of the ${s}-${s + 1}-${s + 2} row.` : 'Place your chip on the outer edge of the row.';
    }
    case 'corner': {
      const tl = params?.cornerTopLeft;
      return tl
        ? `Place your chip on the corner shared by ${tl}, ${tl + 1}, ${tl + 3}, and ${tl + 4}.`
        : 'Place your chip on the shared corner of the four numbers.';
    }
    case 'six-line': {
      const s = params?.rowStart;
      return s
        ? `Place your chip on the outer edge shared by the ${s}-${s + 2} and ${s + 3}-${s + 5} rows.`
        : 'Place your chip on the outer edge shared by the two rows.';
    }
    case 'dozen': {
      const idx = params?.dozenIndex ?? 1;
      const label = idx === 1 ? '1st 12' : idx === 2 ? '2nd 12' : '3rd 12';
      return `Place your chip in the "${label}" box beneath the number grid.`;
    }
    case 'column': {
      const idx = params?.columnIndex ?? 1;
      return `Place your chip in the "2 to 1" box at the foot of column ${idx}.`;
    }
    case 'red':
      return 'Place your chip in the red diamond-marked box below the number grid.';
    case 'black':
      return 'Place your chip in the black diamond-marked box below the number grid.';
    case 'odd':
      return 'Place your chip in the box marked "ODD" below the number grid.';
    case 'even':
      return 'Place your chip in the box marked "EVEN" below the number grid.';
    case 'low':
      return 'Place your chip in the box marked "1-18" below the number grid.';
    case 'high':
      return 'Place your chip in the box marked "19-36" below the number grid.';
    default:
      return '';
  }
}

export function buildBetPayoutInfo(type: RouletteBetType, label: string, description: string, examplePlacement: string, category: 'inside' | 'outside', sampleParams: BetParams, americanOnly?: boolean): BetPayoutInfo {
  return {
    type,
    label,
    description,
    category,
    numbersCovered: betCoverage(type, sampleParams).length,
    payoutRatio: PAYOUT_TABLE[type],
    examplePlacement,
    americanOnly,
  };
}
