import type { Card, Suit } from '../types/blackjack';

const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md';
}

export default function PlayingCard({ card, faceDown = false, size = 'md' }: PlayingCardProps) {
  if (faceDown || !card) {
    return <div className={`playing-card playing-card--${size} playing-card--back`} aria-label="Face-down card" />;
  }

  const isRed = RED_SUITS.includes(card.suit);

  return (
    <div
      className={`playing-card playing-card--${size} ${isRed ? 'playing-card--red' : 'playing-card--black'}`}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span className="playing-card-rank">{card.rank}</span>
      <span className="playing-card-suit">{SUIT_GLYPH[card.suit]}</span>
    </div>
  );
}
