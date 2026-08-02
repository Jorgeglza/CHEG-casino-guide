import { describe, expect, it } from 'vitest';
import { getStrategyDef, isBetCompatible, STRATEGIES } from './strategyEngine';

const baseUnit = 1;
const tableMax = 1000;

describe('isBetCompatible', () => {
  it('allows flat betting on any bet type', () => {
    expect(isBetCompatible('flat', 'straight')).toBe(true);
    expect(isBetCompatible('flat', 'dozen')).toBe(true);
  });

  it('restricts progression strategies to even-money bets', () => {
    for (const id of ['martingale', 'dalembert', 'fibonacci', 'labouchere', 'paroli'] as const) {
      expect(isBetCompatible(id, 'red')).toBe(true);
      expect(isBetCompatible(id, 'dozen')).toBe(false);
      expect(isBetCompatible(id, 'straight')).toBe(false);
    }
  });

  it('james-bond ignores the bet-type selector', () => {
    expect(isBetCompatible('james-bond', 'straight')).toBe(true);
  });
});

describe('martingale transitions', () => {
  it('doubles on loss and resets to base unit on win', () => {
    const def = getStrategyDef('martingale');
    let state = def.initState(baseUnit);
    expect(state.currentWager).toBe(1);

    let next = def.nextWager(state, 'loss', baseUnit, tableMax);
    expect(next.wager).toBe(2);
    state = next.nextState;

    next = def.nextWager(state, 'loss', baseUnit, tableMax);
    expect(next.wager).toBe(4);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.wager).toBe(1);
  });

  it('stops when the required wager exceeds the table max', () => {
    const def = getStrategyDef('martingale');
    let state = def.initState(baseUnit);
    const next1 = def.nextWager(state, 'loss', baseUnit, 3); // wants 2, ok
    state = next1.nextState;
    const next2 = def.nextWager(state, 'loss', baseUnit, 3); // wants 4, exceeds max of 3
    expect(next2.stop).toBe(true);
  });
});

describe("D'Alembert transitions", () => {
  it('increases by one unit on loss, decreases by one on win, floors at base unit', () => {
    const def = getStrategyDef('dalembert');
    let state = def.initState(baseUnit);

    let next = def.nextWager(state, 'loss', baseUnit, tableMax);
    expect(next.wager).toBe(2);
    state = next.nextState;

    next = def.nextWager(state, 'loss', baseUnit, tableMax);
    expect(next.wager).toBe(3);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.wager).toBe(2);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.wager).toBe(1);
    state = next.nextState;

    // stays at the base unit floor, never below
    next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.wager).toBe(1);
  });
});

describe('Fibonacci transitions', () => {
  it('advances one step on loss, retreats two on win', () => {
    const def = getStrategyDef('fibonacci');
    let state = def.initState(baseUnit); // index 0 -> 1
    let next = def.nextWager(state, 'loss', baseUnit, tableMax); // index 1 -> 1
    expect(next.wager).toBe(1);
    state = next.nextState;

    next = def.nextWager(state, 'loss', baseUnit, tableMax); // index 2 -> 2
    expect(next.wager).toBe(2);
    state = next.nextState;

    next = def.nextWager(state, 'loss', baseUnit, tableMax); // index 3 -> 3
    expect(next.wager).toBe(3);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax); // retreat 2 -> index 1 -> 1
    expect(next.wager).toBe(1);
  });
});

describe('Labouchère transitions', () => {
  it('bets first+last, shrinks the sequence on win, appends the loss on loss', () => {
    const def = getStrategyDef('labouchere');
    let state = def.initState(baseUnit, { labouchereStart: [1, 2, 3, 4] });
    expect(state.currentWager).toBe(5); // 1 + 4

    let next = def.nextWager(state, 'loss', baseUnit, tableMax);
    expect(next.nextState.labouchereSequence).toEqual([1, 2, 3, 4, 5]);
    expect(next.wager).toBe(6); // 1 + 5
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.nextState.labouchereSequence).toEqual([2, 3, 4]);
    expect(next.wager).toBe(6); // 2 + 4
  });

  it('completes the cycle (stop:true) when the sequence empties', () => {
    const def = getStrategyDef('labouchere');
    let state = def.initState(baseUnit, { labouchereStart: [5] });
    expect(state.currentWager).toBe(5);
    const next = def.nextWager(state, 'win', baseUnit, tableMax);
    expect(next.stop).toBe(true);
    expect(next.nextState.labouchereSequence).toEqual([]);
  });
});

describe('Paroli transitions', () => {
  it('doubles on win up to the cap, then resets; resets fully on any loss', () => {
    const def = getStrategyDef('paroli');
    let state = def.initState(baseUnit);

    let next = def.nextWager(state, 'win', baseUnit, tableMax, { paroliCap: 3 }); // win 1 -> level 1
    expect(next.wager).toBe(2);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax, { paroliCap: 3 }); // win 2 -> level 2
    expect(next.wager).toBe(4);
    state = next.nextState;

    next = def.nextWager(state, 'win', baseUnit, tableMax, { paroliCap: 3 }); // win 3 reaches the cap -> take profit, reset
    expect(next.wager).toBe(1);
    state = next.nextState;

    next = def.nextWager(state, 'loss', baseUnit, tableMax, { paroliCap: 3 });
    expect(next.wager).toBe(1);
  });
});

describe('all strategies are registered', () => {
  it('covers all 7 strategy ids', () => {
    expect(Object.keys(STRATEGIES).sort()).toEqual(
      ['dalembert', 'fibonacci', 'flat', 'james-bond', 'labouchere', 'martingale', 'paroli'].sort(),
    );
  });
});
