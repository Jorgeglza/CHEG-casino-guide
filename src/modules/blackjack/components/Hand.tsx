import PlayingCard from './PlayingCard';
import { handTotal } from '../engine/handMath';
import type { Card } from '../types/blackjack';

interface HandProps {
  cards: Card[];
  label: string;
  hideTotal?: boolean;
}

export default function Hand({ cards, label, hideTotal = false }: HandProps) {
  const { total, isSoft } = handTotal(cards);

  return (
    <div className="bj-hand">
      <span className="bj-hand-label">{label}</span>
      <div className="bj-hand-cards">
        {cards.map((c, i) => (
          <PlayingCard key={`${c.rank}-${c.suit}-${i}`} card={c} />
        ))}
      </div>
      {!hideTotal && (
        <span className="bj-hand-total">
          {isSoft ? `Soft ${total}` : `${total}`}
        </span>
      )}
    </div>
  );
}
