// Wager-sizing (staking) progressions for the Pass Line bet — a separate axis from the
// bet-*selection* strategies in ./bets.ts (which numbers are working). This mirrors
// src/modules/roulette/engine/strategyEngine.ts: Pass Line is a near-even-money bet
// (1.41% house edge) just like Roulette's outside bets, so the same progression shapes
// apply. Progression only reacts to the Pass Line's own win/loss (natural/craps on the
// come-out, or point-made/seven-out) — Place bet wins along the way don't change the unit.

export type CrapsStakingStrategy = 'flat' | 'martingale' | 'paroli' | 'dalembert';

export interface StakingState {
  currentWager: number;
  consecutiveWins: number;
}

export interface StakingParams {
  paroliCap?: number; // max consecutive win-doublings before taking profit and resetting
}

export interface NextWagerResult {
  wager: number;
  nextState: StakingState;
  stop?: boolean; // wager would exceed the table max — session ends
}

export interface StakingStrategyDef {
  id: CrapsStakingStrategy;
  label: string;
  description: string;
  initState(baseUnit: number): StakingState;
  nextWager(state: StakingState, outcome: 'win' | 'loss', baseUnit: number, tableMax: number, params?: StakingParams): NextWagerResult;
}

function baseState(currentWager: number): StakingState {
  return { currentWager, consecutiveWins: 0 };
}

const flat: StakingStrategyDef = {
  id: 'flat',
  label: 'Flat',
  description: 'Same wager every come-out roll, regardless of the last result.',
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, _outcome, baseUnit) => ({ wager: baseUnit, nextState: { ...state, currentWager: baseUnit } }),
};

const martingale: StakingStrategyDef = {
  id: 'martingale',
  label: 'Martingale',
  description: 'Double the wager after every Pass Line loss, reset to base after a win.',
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax) => {
    const wager = outcome === 'loss' ? state.currentWager * 2 : baseUnit;
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, currentWager: wager, consecutiveWins: outcome === 'win' ? 0 : state.consecutiveWins } };
  },
};

const paroli: StakingStrategyDef = {
  id: 'paroli',
  label: 'Paroli',
  description: 'Double the wager after each Pass Line win, up to a cap, then bank the streak and reset.',
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax, params) => {
    const cap = params?.paroliCap ?? 3;
    if (outcome === 'loss') {
      return { wager: baseUnit, nextState: { currentWager: baseUnit, consecutiveWins: 0 } };
    }
    const consecutiveWins = state.consecutiveWins + 1;
    if (consecutiveWins >= cap) {
      return { wager: baseUnit, nextState: { currentWager: baseUnit, consecutiveWins: 0 } };
    }
    const wager = state.currentWager * 2;
    if (wager > tableMax) {
      return { wager: baseUnit, nextState: { currentWager: baseUnit, consecutiveWins: 0 } };
    }
    return { wager, nextState: { currentWager: wager, consecutiveWins } };
  },
};

const dalembert: StakingStrategyDef = {
  id: 'dalembert',
  label: "D'Alembert",
  description: 'Add one unit after a loss, subtract one unit after a win (never below one unit).',
  initState: (baseUnit) => baseState(baseUnit),
  nextWager: (state, outcome, baseUnit, tableMax) => {
    const wager = outcome === 'loss' ? state.currentWager + baseUnit : Math.max(baseUnit, state.currentWager - baseUnit);
    if (wager > tableMax) {
      return { wager: state.currentWager, nextState: state, stop: true };
    }
    return { wager, nextState: { ...state, currentWager: wager } };
  },
};

export const STAKING_STRATEGIES: StakingStrategyDef[] = [flat, martingale, paroli, dalembert];

export function getStakingStrategy(id: CrapsStakingStrategy): StakingStrategyDef {
  return STAKING_STRATEGIES.find((s) => s.id === id) ?? flat;
}

export function stakingStateLabel(strategyId: CrapsStakingStrategy, state: StakingState, baseUnit: number): string {
  switch (strategyId) {
    case 'martingale':
      return `${(state.currentWager / baseUnit).toFixed(0)}x unit`;
    case 'paroli':
      return `Paroli streak ${state.consecutiveWins}`;
    case 'dalembert':
      return `${(state.currentWager / baseUnit).toFixed(0)}x unit`;
    default:
      return 'Flat';
  }
}
