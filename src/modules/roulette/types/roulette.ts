// Centralized types for the Roulette module. Unlike Craps (which colocates types at
// first use), Roulette's type surface is shared across 4 tabs, 6 components, and 5 engine
// files, so a dedicated file keeps them consistent.

export type RouletteVariant = 'european' | 'american';

export type PocketColor = 'red' | 'black' | 'green';

export interface RoulettePocket {
  value: number | '00';
  color: PocketColor;
  wheelIndex: number;
}

export type RouletteBetCategory = 'inside' | 'outside';

export type RouletteBetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'six-line'
  | 'trio'
  | 'basket'
  | 'dozen'
  | 'column'
  | 'red'
  | 'black'
  | 'odd'
  | 'even'
  | 'low'
  | 'high';

// Anchor parameters needed to resolve coverage for the bet types that cover a variable
// subset of numbers. Outside bets and single-anchor inside bets need no params.
export interface BetParams {
  numbers?: (number | '00')[]; // straight (1), split (2 adjacent), trio (3), basket (0/00/1/2/3)
  rowStart?: number; // street (3 in a row) / six-line (2 rows, 6 numbers) anchor: first number of the row
  cornerTopLeft?: number; // corner (4 numbers): top-left number of the 2x2 block
  dozenIndex?: 1 | 2 | 3;
  columnIndex?: 1 | 2 | 3;
}

export interface RouletteBetSelection {
  type: RouletteBetType;
  params?: BetParams;
  numbers: (number | '00')[]; // always derived via engine betCoverage(), never hand-authored
}

export type RouletteStrategy =
  | 'flat'
  | 'martingale'
  | 'dalembert'
  | 'fibonacci'
  | 'labouchere'
  | 'paroli'
  | 'james-bond';

export type StrategyCategory = 'flat' | 'negative-progression' | 'positive-progression' | 'coverage-system';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';
export type ComplexityLevel = 'low' | 'moderate' | 'high';

export interface BetPayoutInfo {
  type: RouletteBetType;
  label: string;
  description: string;
  category: RouletteBetCategory;
  numbersCovered: number;
  payoutRatio: [number, number]; // [win, stake], profit-only — stake is returned separately
  examplePlacement: string;
  americanOnly?: boolean;
}

export interface SpecialRulesConfig {
  laPartage: boolean;
  enPrison: boolean;
}

// Number-coverage strategies bet several groups of numbers at once to cover a chunk of
// the wheel in a single spin — a different question from staking systems (RouletteStrategy
// above), which are about how much to wager, not which numbers to cover.
export type RouletteCoverageStrategy = 'two-dozens' | 'voisins-du-zero';

export interface CoverageLeg {
  betType: RouletteBetType;
  params?: BetParams;
  label: string; // e.g. "1st dozen" or "Trio 0-2-3"
  units: number; // relative stake weight within the strategy's fixed chip allocation
}

export interface CoverageStrategyDef {
  id: RouletteCoverageStrategy;
  label: string;
  description: string;
  variant: RouletteVariant | 'both';
  legs: CoverageLeg[];
  defaultTotalStake: number;
}

export interface CoverageNumberOutcome {
  number: number | '00';
  profit: number; // net bankroll change if this exact number hits, given the current total stake
}

export interface CoverageOutcome {
  numbersCovered: number;
  hitProbability: number; // 0-1
  houseEdgePct: number;
  totalStake: number;
  worstCaseLoss: number;
  bestCaseProfit: number;
  averageProfitIfHit: number;
  perNumberPayout: CoverageNumberOutcome[];
}
