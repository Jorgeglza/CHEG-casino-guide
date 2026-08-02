import { describe, expect, it } from 'vitest';
import { initBettingState, nextBettingState, playRound, runMonteCarlo } from './simulate';
import { DEFAULT_RULES } from '../types/blackjack';

function queueDraw(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i] ?? values[values.length - 1];
    i += 1;
    return v;
  };
}

describe('playRound — naturals', () => {
  it('pays 3:2 on a player blackjack against a non-blackjack dealer', () => {
    const draw = queueDraw([11, 10, 5, 6]); // player A,K ; dealer 5,6
    const result = playRound(DEFAULT_RULES, 10, draw);
    expect(result.isBlackjack).toBe(true);
    expect(result.outcome).toBe('win');
    expect(result.profit).toBe(15);
    expect(result.wagered).toBe(10);
  });

  it('pushes when both player and dealer have blackjack', () => {
    const draw = queueDraw([11, 10, 10, 11]); // player A,K ; dealer 10,A
    const result = playRound(DEFAULT_RULES, 10, draw);
    expect(result.isBlackjack).toBe(true);
    expect(result.outcome).toBe('push');
    expect(result.profit).toBe(0);
  });

  it('player loses full wager to a dealer blackjack with no player blackjack', () => {
    const draw = queueDraw([10, 6, 10, 11]); // player 16 ; dealer 10,A
    const result = playRound(DEFAULT_RULES, 10, draw);
    expect(result.outcome).toBe('loss');
    expect(result.profit).toBe(-10);
  });
});

describe('playRound — surrender', () => {
  it('surrenders hard 16 vs dealer 10 for half the wager when late surrender is allowed', () => {
    const draw = queueDraw([10, 6, 10, 2]); // player 16 ; dealer up 10, hole 2 (no blackjack)
    const result = playRound(DEFAULT_RULES, 10, draw);
    expect(result.outcome).toBe('loss');
    expect(result.profit).toBe(-5);
  });

  it('falls back to hit (and can bust) when late surrender is disallowed', () => {
    const rules = { ...DEFAULT_RULES, lateSurrender: false };
    // player 10,6=16 ; dealer up 10, hole 2 ; hit draws a 6 -> 22 bust
    const draw = queueDraw([10, 6, 10, 2, 6]);
    const result = playRound(rules, 10, draw);
    expect(result.outcome).toBe('loss');
    expect(result.profit).toBe(-10);
  });
});

describe('playRound — split', () => {
  it('splits 8s into two hands, each wagering the base amount', () => {
    // player 8,8 ; dealer up 6, hole 10 (dealer 16, hits per S17 to bust on a 10)
    // split hand 1: 8 + 3 = 11 -> doubles per strategy, + 9 = 20
    // split hand 2: 8 + 9 = 17 -> stands
    const draw = queueDraw([8, 8, 6, 10, 3, 9, 9, 5]);
    const result = playRound(DEFAULT_RULES, 10, draw);
    // Both split hands wager 10 each = 20 total, plus hand 1 doubles to 20 -> 30 wagered.
    expect(result.wagered).toBe(30);
  });
});

describe('betting progressions', () => {
  it('flat always returns to a 1x wager regardless of outcome', () => {
    let state = initBettingState();
    state = nextBettingState('flat', state, 'loss', 3);
    expect(state.multiple).toBe(1);
    state = nextBettingState('flat', state, 'win', 3);
    expect(state.multiple).toBe(1);
  });

  it('martingale doubles after a loss and resets after a win', () => {
    let state = initBettingState();
    state = nextBettingState('martingale', state, 'loss', 3);
    expect(state.multiple).toBe(2);
    state = nextBettingState('martingale', state, 'loss', 3);
    expect(state.multiple).toBe(4);
    state = nextBettingState('martingale', state, 'win', 3);
    expect(state.multiple).toBe(1);
  });

  it('a push replays the same wager for every strategy', () => {
    let state = initBettingState();
    state = nextBettingState('martingale', state, 'loss', 3);
    expect(state.multiple).toBe(2);
    const afterPush = nextBettingState('martingale', state, 'push', 3);
    expect(afterPush).toEqual(state);
  });

  it('paroli doubles after wins up to its cap, then resets', () => {
    let state = initBettingState();
    state = nextBettingState('paroli', state, 'win', 2);
    expect(state.multiple).toBe(2);
    state = nextBettingState('paroli', state, 'win', 2); // hits cap of 2 wins -> reset
    expect(state.multiple).toBe(1);
  });

  it('1-3-2-6 follows the fixed sequence on wins and resets on any loss', () => {
    let state = initBettingState();
    expect(state.multiple).toBe(1);
    state = nextBettingState('1-3-2-6', state, 'win', 3);
    expect(state.multiple).toBe(3);
    state = nextBettingState('1-3-2-6', state, 'win', 3);
    expect(state.multiple).toBe(2);
    state = nextBettingState('1-3-2-6', state, 'loss', 3);
    expect(state.multiple).toBe(1);
  });
});

describe('runMonteCarlo — statistical sanity', () => {
  it('produces an average ending bankroll close to the starting bankroll under flat betting', () => {
    const summary = runMonteCarlo(
      {
        rules: DEFAULT_RULES,
        bettingStrategy: 'flat',
        startingBankroll: 5000,
        baseUnit: 10,
        tableMax: 100000,
        maxHands: 50,
        paroliCap: 3,
      },
      3000,
    );
    // House edge under these rules is well under 1%, so 50 hands at $10 shouldn't move the
    // average far from the starting bankroll — a loose bound that would still catch a
    // grossly broken payout or strategy implementation.
    expect(Math.abs(summary.averageFinal - 5000)).toBeLessThan(80);
    expect(summary.avgHandWinRate).toBeGreaterThan(35);
    expect(summary.avgHandWinRate).toBeLessThan(50);
  });

  it('respects stop-loss and stop-win boundaries', () => {
    const summary = runMonteCarlo(
      {
        rules: DEFAULT_RULES,
        bettingStrategy: 'flat',
        startingBankroll: 100,
        baseUnit: 10,
        tableMax: 1000,
        maxHands: 500,
        stopLoss: 50,
        stopWin: 150,
        paroliCap: 3,
      },
      200,
    );
    expect(summary.averageFinal).toBeGreaterThanOrEqual(50);
    expect(summary.averageFinal).toBeLessThanOrEqual(150);
  });
});
