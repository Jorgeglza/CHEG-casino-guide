export interface Roll {
  die1: number;
  die2: number;
  total: number;
}

export function rollDice(): Roll {
  const die1 = 1 + Math.floor(Math.random() * 6);
  const die2 = 1 + Math.floor(Math.random() * 6);
  return { die1, die2, total: die1 + die2 };
}
