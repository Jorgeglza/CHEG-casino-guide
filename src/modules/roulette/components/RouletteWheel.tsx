import { buildWheel } from '../engine/wheelOrder';
import type { RouletteVariant } from '../types/roulette';

interface RouletteWheelProps {
  variant: RouletteVariant;
  highlightedPocket?: number | '00';
  size?: number;
}

const COLOR_FILL: Record<'red' | 'black' | 'green', string> = {
  red: '#c0392b',
  black: '#1a1a1a',
  green: '#0e6b45',
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function wedgePath(cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number): string {
  const [x1, y1] = polarToCartesian(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarToCartesian(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarToCartesian(cx, cy, rInner, endAngle);
  const [x4, y4] = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export default function RouletteWheel({ variant, highlightedPocket, size = 320 }: RouletteWheelProps) {
  const wheel = buildWheel(variant);
  const n = wheel.length;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 6;
  const rInner = rOuter * 0.55;
  const rLabel = rOuter * 0.8;
  const wedgeAngle = 360 / n;

  const winningLabel =
    highlightedPocket !== undefined
      ? `, winning number ${highlightedPocket} ${wheel.find((p) => p.value === highlightedPocket)?.color ?? ''}`
      : '';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="roulette-wheel"
      role="img"
      aria-label={`${variant === 'european' ? 'European' : 'American'} roulette wheel, ${n} pockets${winningLabel}`}
    >
      <circle cx={cx} cy={cy} r={rOuter + 4} fill="#3a2a12" stroke="#1a1207" strokeWidth="2" />
      {wheel.map((pocket, i) => {
        const start = i * wedgeAngle;
        const end = start + wedgeAngle;
        const mid = start + wedgeAngle / 2;
        const [lx, ly] = polarToCartesian(cx, cy, rLabel, mid);
        const isWinner = highlightedPocket !== undefined && pocket.value === highlightedPocket;
        return (
          <g key={i}>
            <path
              d={wedgePath(cx, cy, rInner, rOuter, start, end)}
              fill={COLOR_FILL[pocket.color]}
              stroke={isWinner ? '#f7c948' : '#e7e0c9'}
              strokeWidth={isWinner ? 3 : 0.75}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.032}
              fontWeight={isWinner ? 800 : 600}
              fill="#f4efe4"
            >
              {pocket.value}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={rInner - 2} fill="#3a2a12" stroke="#1a1207" strokeWidth="2" />
      {highlightedPocket !== undefined && (
        <circle cx={cx} cy={cy} r={rInner - 2} fill="none" stroke="#f7c948" strokeWidth="3" opacity="0.9" />
      )}
    </svg>
  );
}
