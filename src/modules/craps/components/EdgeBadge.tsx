interface EdgeBadgeProps {
  edge: number; // house edge percent
  size?: 'sm' | 'md';
}

function edgeColor(edge: number): string {
  if (edge <= 0.5) return '#1f9d55';
  if (edge <= 1.6) return '#3d9970';
  if (edge <= 4) return '#d9a441';
  if (edge <= 8) return '#d9722c';
  return '#c0392b';
}

export default function EdgeBadge({ edge, size = 'md' }: EdgeBadgeProps) {
  const color = edgeColor(edge);
  return (
    <span
      className={`edge-badge edge-badge--${size}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {edge.toFixed(2)}% edge
    </span>
  );
}
