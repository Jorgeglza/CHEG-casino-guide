import type { RouletteBetType, RouletteStrategy } from '../types/roulette';
import { isEvenMoneyBet } from './rouletteMath';

export interface StrategyState {
  currentWager: number;
  level: number; // martingale/paroli progression step
  fibIndex: number;
  labouchereSequence: number[]; // in "units", scaled by baseUnit when wagering
  consecutiveLosses: number;
  consecutiveWins: number;
}

export interface StrategyParams {
  labouchereStart?: number[];
  paroliCap?: number; // max consecutive win-doublings before taking profit and resetting
}

export interface NextWagerResult {
  wager: number;
  nextState: StrategyState;
  stop?: boolean;
}

export interface StrategyDef {
  id: RouletteStrategy;
  allowedBetTypes: RouletteBetType[] | 'all';
  initState(baseUnit: number, params?: StrategyParams): StrategyState;
  nextWager(state: StrategyState, lastOutcome: 'win' | 'loss', baseUnit: number, tableMax: number, params?: StrategyParams): NextWagerResult;
}

function baseState(currentWager: number): StrategyState {
  return { currentWager, level: 0, fibIndex: 0, labouchereSequence: [], consecutiveLosses: 0, consecutiveWins: 0 };
}

const flat: StrategyDef = {
  id: 'flat',
  allowedBetTypes: 'all',
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, _outcome, baseUnit) => ({ wager: baseUnit, nextState: { ...state, currentWager: baseUnit } }),
};

const martingale: StrategyDef = {
  id: 'martingale',
  allowedBetTypes: EVEN_MONEY_TYPES(),
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax) => {
    const wager = outcome === 'loss' ? state.currentWager * 2 : baseUnit;
    const level = outcome === 'loss' ? state.level + 1 : 0;
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, currentWager: wager, level } };
  },
};

const dalembert: StrategyDef = {
  id: 'dalembert',
  allowedBetTypes: EVEN_MONEY_TYPES(),
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax) => {
    const wager =
      outcome === 'loss' ? state.currentWager + baseUnit : Math.max(baseUnit, state.currentWager - baseUnit);
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, currentWager: wager } };
  },
};

// Classic Fibonacci sequence, precomputed far enough that no realistic losing streak
// overruns it before the table-max stop condition kicks in.
const FIBONACCI: number[] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

const fibonacci: StrategyDef = {
  id: 'fibonacci',
  allowedBetTypes: EVEN_MONEY_TYPES(),
  initState: (baseUnit) => ({ ...baseState(baseUnit), fibIndex: 0 }),
  nextWager: (state, outcome, baseUnit, tableMax) => {
    const fibIndex =
      outcome === 'loss' ? Math.min(state.fibIndex + 1, FIBONACCI.length - 1) : Math.max(0, state.fibIndex - 2);
    const wager = FIBONACCI[fibIndex] * baseUnit;
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, currentWager: wager, fibIndex } };
  },
};

function labouchereUnits(sequence: number[]): number {
  if (sequence.length === 0) return 0;
  if (sequence.length === 1) return sequence[0];
  return sequence[0] + sequence[sequence.length - 1];
}

const labouchere: StrategyDef = {
  id: 'labouchere',
  allowedBetTypes: EVEN_MONEY_TYPES(),
  initState: (baseUnit, params) => {
    const sequence = params?.labouchereStart && params.labouchereStart.length > 0 ? params.labouchereStart : [1, 2, 3, 4];
    return { ...baseState(labouchereUnits(sequence) * baseUnit), labouchereSequence: sequence };
  },
  nextWager: (state, outcome, baseUnit, tableMax) => {
    let sequence: number[];
    if (outcome === 'win') {
      sequence = state.labouchereSequence.length <= 1 ? [] : state.labouchereSequence.slice(1, -1);
    } else {
      sequence = [...state.labouchereSequence, labouchereUnits(state.labouchereSequence)];
    }
    if (sequence.length === 0) {
      return { wager: 0, nextState: { ...state, labouchereSequence: [], currentWager: 0 }, stop: true };
    }
    const wager = labouchereUnits(sequence) * baseUnit;
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, labouchereSequence: sequence, currentWager: wager } };
  },
};

const paroli: StrategyDef = {
  id: 'paroli',
  allowedBetTypes: EVEN_MONEY_TYPES(),
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax, params) => {
    const cap = params?.paroliCap ?? 3;
    if (outcome === 'loss') {
      return { wager: baseUnit, nextState: { ...state, currentWager: baseUnit, consecutiveWins: 0 } };
    }
    const consecutiveWins = state.consecutiveWins + 1;
    if (consecutiveWins >= cap) {
      return { wager: baseUnit, nextState: { ...state, currentWager: baseUnit, consecutiveWins: 0 } };
    }
    const wager = state.currentWager * 2;
    if (wager > tableMax) {
      return { wager: baseUnit, nextState: { ...state, currentWager: baseUnit, consecutiveWins: 0 } };
    }
    return { wager, nextState: { ...state, currentWager: wager, consecutiveWins } };
  },
};

// James Bond is not a wager-progression strategy — it's a fixed multi-bet spread placed
// every spin. The simulator special-cases id === 'james-bond' and uses JAMES_BOND_SPREAD
// directly instead of calling nextWager for a scalar wager.
const jamesBond: StrategyDef = {
  id: 'james-bond',
  allowedBetTypes: [],
  initState: (baseUnit) => baseState(baseUnit * 20),
  nextWager: (state, _outcome, baseUnit) => ({ wager: baseUnit * 20, nextState: { ...state, currentWager: baseUnit * 20 } }),
};

// Classic James Bond allocation: 140 units on high (19-36), 50 units on the 13-18
// six-line, 10 units on zero, out of a 200-unit total (i.e. a 20x-baseUnit spin).
export const JAMES_BOND_SPREAD: { betType: RouletteBetType; fraction: number; params?: { rowStart?: number; numbers?: (number | '00')[] } }[] = [
  { betType: 'high', fraction: 140 / 200 },
  { betType: 'six-line', fraction: 50 / 200, params: { rowStart: 13 } },
  { betType: 'straight', fraction: 10 / 200, params: { numbers: [0] } },
];

function EVEN_MONEY_TYPES(): RouletteBetType[] {
  return ['red', 'black', 'odd', 'even', 'low', 'high'];
}

export const STRATEGIES: Record<RouletteStrategy, StrategyDef> = {
  flat,
  martingale,
  dalembert,
  fibonacci,
  labouchere,
  paroli,
  'james-bond': jamesBond,
};

export function getStrategyDef(id: RouletteStrategy): StrategyDef {
  return STRATEGIES[id];
}

export function isBetCompatible(strategyId: RouletteStrategy, betType: RouletteBetType): boolean {
  const def = STRATEGIES[strategyId];
  if (def.allowedBetTypes === 'all') return true;
  if (strategyId === 'james-bond') return true; // ignores the bet-type selector entirely
  return def.allowedBetTypes.includes(betType);
}

export function strategyStateLabel(strategyId: RouletteStrategy, state: StrategyState): string {
  switch (strategyId) {
    case 'martingale':
      return `Martingale level ${state.level}`;
    case 'dalembert':
      return `D'Alembert wager ${state.currentWager}`;
    case 'fibonacci':
      return `Fibonacci index ${state.fibIndex} (${FIBONACCI[state.fibIndex]}x)`;
    case 'labouchere':
      return state.labouchereSequence.length > 0 ? `Sequence [${state.labouchereSequence.join(', ')}]` : 'Sequence complete';
    case 'paroli':
      return `Paroli streak ${state.consecutiveWins}`;
    case 'james-bond':
      return 'Fixed spread';
    default:
      return 'Flat';
  }
}

// isEvenMoneyBet is re-exported so strategy compatibility messages in the UI can reuse
// the same predicate the engine uses internally.
export { isEvenMoneyBet };
