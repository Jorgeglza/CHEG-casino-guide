import type { RouletteBetType } from '../types/roulette';

interface BetChipProps {
  betType: RouletteBetType;
  amount: number;
}

const BET_LABEL: Record<RouletteBetType, string> = {
  straight: 'Straight',
  split: 'Split',
  street: 'Street',
  corner: 'Corner',
  'six-line': 'Six line',
  trio: 'Trio',
  basket: 'Basket',
  dozen: 'Dozen',
  column: 'Column',
  red: 'Red',
  black: 'Black',
  odd: 'Odd',
  even: 'Even',
  low: '1-18',
  high: '19-36',
};

export default function BetChip({ betType, amount }: BetChipProps) {
  return (
    <span className={`bet-chip bet-chip--${betType === 'red' ? 'red' : betType === 'black' ? 'black' : 'neutral'}`}>
      ${amount.toFixed(0)} on {BET_LABEL[betType]}
    </span>
  );
}
