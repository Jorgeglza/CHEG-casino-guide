import { POINT_NUMBERS, type Point } from '../engine/bets';
import {
  ANY_CRAPS_PROBABILITY,
  ANY_SEVEN_PROBABILITY,
  COME_OUT_CRAPS_LOSE,
  COME_OUT_NATURAL_WIN,
  FIELD_WIN_PROBABILITY,
  PLACE_EDGE_BY_NUMBER,
  pointRepeatProbability,
  rollProbability,
  sevenOutProbability,
} from '../engine/probabilities';
import { combinedHouseEdge } from '../engine/bets';

interface StrategyBoardProps {
  mode: 'before' | 'after';
  point: Point;
  oddsMultiple: number;
}

function edgeColor(edge: number): string {
  if (edge <= 0.5) return '#1f9d55';
  if (edge <= 1.6) return '#3d9970';
  if (edge <= 4) return '#d9a441';
  if (edge <= 8) return '#d9722c';
  return '#c0392b';
}

const PLACE_NUMBERS = POINT_NUMBERS;

export default function StrategyBoard({ mode, point, oddsMultiple }: StrategyBoardProps) {
  const boxWidth = 90;
  const boxGap = 6;
  const startX = 30;
  const placeY = 56;

  const blendedEdge = combinedHouseEdge(oddsMultiple);

  return (
    <svg viewBox="0 0 630 500" className="craps-board" role="img" aria-label="Craps table with probability and edge annotations">
      <rect x="0" y="0" width="630" height="500" rx="24" fill="#0b5d3b" stroke="#063f27" strokeWidth="6" />

      <text x={315} y={24} textAnchor="middle" fontSize="15" fontWeight="700" fill="#f4d35e" letterSpacing="1.5">
        {mode === 'before' ? 'BEFORE THE POINT — COME-OUT ROLL' : `AFTER THE POINT — POINT IS ${point}`}
      </text>

      {/* Place number boxes */}
      {PLACE_NUMBERS.map((n, i) => {
        const x = startX + i * (boxWidth + boxGap);
        const isActivePoint = mode === 'after' && n === point;
        const placeEdge = PLACE_EDGE_BY_NUMBER[n];
        const prob = mode === 'before' ? rollProbability(n) : pointRepeatProbability(n);
        const boxFill = isActivePoint ? '#f4d35e' : '#0e6b45';
        const textFill = isActivePoint ? '#1a1a1a' : '#e7e0c9';
        return (
          <g key={n}>
            <rect x={x} y={placeY} width={boxWidth} height={92} rx="6" fill={boxFill} stroke="#e7e0c9" strokeWidth="2" />
            <text x={x + boxWidth / 2} y={placeY + 26} textAnchor="middle" fontSize="20" fontWeight="700" fill={textFill}>
              {n}
            </text>
            <text x={x + boxWidth / 2} y={placeY + 44} textAnchor="middle" fontSize="9.5" fill={isActivePoint ? '#1a1a1a' : '#c9dfd2'}>
              {mode === 'before' ? 'becomes point' : 'repeats before 7'}
            </text>
            <text x={x + boxWidth / 2} y={placeY + 58} textAnchor="middle" fontSize="14" fontWeight="700" fill={isActivePoint ? '#1a1a1a' : '#ffffff'}>
              {prob.toFixed(1)}%
            </text>
            <rect
              x={x + 10}
              y={placeY + 66}
              width={boxWidth - 20}
              height={18}
              rx="4"
              fill={`${edgeColor(placeEdge)}33`}
              stroke={edgeColor(placeEdge)}
              strokeWidth="1"
            />
            <text x={x + boxWidth / 2} y={placeY + 79} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={edgeColor(placeEdge)}>
              Place {placeEdge.toFixed(2)}%
            </text>
          </g>
        );
      })}

      {/* Field box */}
      <rect x={startX} y={168} width={570} height={54} rx="8" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="2" />
      <text x={90} y={192} fontSize="16" fontWeight="700" fill="#e7e0c9" letterSpacing="2">
        FIELD
      </text>
      <text x={90} y={210} fontSize="10.5" fill="#c9dfd2">
        2 · 3 · 4 · 9 · 10 · 11 · 12 (one-roll)
      </text>
      <text x={470} y={195} textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff">
        {FIELD_WIN_PROBABILITY.toFixed(1)}% win
      </text>
      <rect x={430} y={200} width={140} height={18} rx="4" fill={`${edgeColor(5.56)}33`} stroke={edgeColor(5.56)} strokeWidth="1" />
      <text x={500} y={213} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={edgeColor(5.56)}>
        Edge 5.56%
      </text>

      {mode === 'before' ? (
        <>
          {/* Proposition strip */}
          <rect x={startX} y={232} width={280} height={44} rx="8" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="1.5" />
          <text x={40} y={251} fontSize="11" fontWeight="700" fill="#e7e0c9">
            ANY CRAPS
          </text>
          <text x={40} y={266} fontSize="10" fill="#c9dfd2">
            {ANY_CRAPS_PROBABILITY.toFixed(1)}% · edge 11.11%
          </text>

          <rect x={320} y={232} width={280} height={44} rx="8" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="1.5" />
          <text x={330} y={251} fontSize="11" fontWeight="700" fill="#e7e0c9">
            ANY SEVEN
          </text>
          <text x={330} y={266} fontSize="10" fill="#c9dfd2">
            {ANY_SEVEN_PROBABILITY.toFixed(1)}% · edge 16.67%
          </text>

          {/* Pass line breakdown */}
          <rect x={startX} y={288} width={570} height={100} rx="8" fill="#136b40" stroke="#f4d35e" strokeWidth="2.5" />
          <text x={315} y={310} textAnchor="middle" fontSize="17" fontWeight="700" fill="#ffffff" letterSpacing="2">
            PASS LINE — come-out outcomes
          </text>

          <g>
            <rect x={50} y={322} width={165} height={50} rx="6" fill="#1f9d5533" stroke="#1f9d55" strokeWidth="1.5" />
            <text x={132} y={340} textAnchor="middle" fontSize="12" fontWeight="700" fill="#8ef2b0">
              7 or 11 → WIN
            </text>
            <text x={132} y={358} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff">
              {COME_OUT_NATURAL_WIN.toFixed(1)}%
            </text>
          </g>
          <g>
            <rect x={232} y={322} width={165} height={50} rx="6" fill="#f4d35e22" stroke="#f4d35e" strokeWidth="1.5" />
            <text x={314} y={340} textAnchor="middle" fontSize="12" fontWeight="700" fill="#f4d35e">
              4,5,6,8,9,10 → POINT
            </text>
            <text x={314} y={358} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff">
              {(100 - COME_OUT_NATURAL_WIN - COME_OUT_CRAPS_LOSE).toFixed(1)}%
            </text>
          </g>
          <g>
            <rect x={414} y={322} width={165} height={50} rx="6" fill="#c0392b33" stroke="#c0392b" strokeWidth="1.5" />
            <text x={496} y={340} textAnchor="middle" fontSize="12" fontWeight="700" fill="#ff8f7a">
              2, 3, 12 → LOSE
            </text>
            <text x={496} y={358} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff">
              {COME_OUT_CRAPS_LOSE.toFixed(1)}%
            </text>
          </g>

          <rect x={205} y={402} width={220} height={26} rx="13" fill={`${edgeColor(1.41)}33`} stroke={edgeColor(1.41)} strokeWidth="1.5" />
          <text x={315} y={419} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={edgeColor(1.41)}>
            Pass Line overall edge: 1.41%
          </text>
        </>
      ) : (
        <>
          {/* Pass line + odds for active point */}
          <rect x={startX} y={232} width={570} height={110} rx="8" fill="#136b40" stroke="#f4d35e" strokeWidth="2.5" />
          <text x={315} y={254} textAnchor="middle" fontSize="17" fontWeight="700" fill="#ffffff" letterSpacing="1.5">
            PASS LINE + ODDS on the {point}
          </text>

          <g>
            <rect x={70} y={266} width={220} height={54} rx="6" fill="#1f9d5533" stroke="#1f9d55" strokeWidth="1.5" />
            <text x={180} y={286} textAnchor="middle" fontSize="12" fontWeight="700" fill="#8ef2b0">
              {point} repeats → WIN
            </text>
            <text x={180} y={306} textAnchor="middle" fontSize="17" fontWeight="800" fill="#ffffff">
              {pointRepeatProbability(point).toFixed(1)}%
            </text>
          </g>
          <g>
            <rect x={340} y={266} width={220} height={54} rx="6" fill="#c0392b33" stroke="#c0392b" strokeWidth="1.5" />
            <text x={450} y={286} textAnchor="middle" fontSize="12" fontWeight="700" fill="#ff8f7a">
              7 first → SEVEN-OUT
            </text>
            <text x={450} y={306} textAnchor="middle" fontSize="17" fontWeight="800" fill="#ffffff">
              {sevenOutProbability(point).toFixed(1)}%
            </text>
          </g>

          <rect x={155} y={330} width={320} height={26} rx="13" fill="#457b9d33" stroke="#457b9d" strokeWidth="1.5" />
          <text x={315} y={347} textAnchor="middle" fontSize="12" fontWeight="700" fill="#89b8d6">
            Odds bet: 0.00% edge · {oddsMultiple}x odds blended: {blendedEdge.toFixed(2)}%
          </text>
        </>
      )}
    </svg>
  );
}
