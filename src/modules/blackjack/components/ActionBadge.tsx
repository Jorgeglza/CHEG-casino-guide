import type { StrategyAbbreviation } from '../types/blackjack';

// Color-coded by underlying action family so the chart reads at a glance — the abbreviation
// text is always rendered too, so color is never the only signal (accessibility requirement).
const ABBREVIATION_COLOR: Record<StrategyAbbreviation, string> = {
  H: '#3b82f6',
  S: '#1f9d55',
  D: '#d9a441',
  Ds: '#d9a441',
  P: '#a855f7',
  Ph: '#a855f7',
  Rh: '#c0392b',
  Rs: '#c0392b',
};

interface ActionBadgeProps {
  abbreviation: StrategyAbbreviation;
  size?: 'sm' | 'md';
}

export default function ActionBadge({ abbreviation, size = 'md' }: ActionBadgeProps) {
  const color = ABBREVIATION_COLOR[abbreviation];
  return (
    <span
      className={`action-badge action-badge--${size}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {abbreviation}
    </span>
  );
}
