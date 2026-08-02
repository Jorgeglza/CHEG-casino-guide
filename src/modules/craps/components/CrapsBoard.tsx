import { oddsWinAmount, POINT_NUMBERS, type Point } from '../engine/bets';

export type BoardPhase = 'come-out' | 'point' | 'win' | 'lose';

function isPointNumber(n: number | undefined): n is Point {
  return n !== undefined && (POINT_NUMBERS as readonly number[]).includes(n);
}

interface CrapsBoardProps {
  phase: BoardPhase;
  point?: number;
  oddsOn?: boolean;
  betSize?: number;
  oddsMultiple?: number;
  dice?: [number, number];
}

const PLACE_NUMBERS = [4, 5, 6, 8, 9, 10];

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

function Die({ value, x, y, size }: { value: number; x: number; y: number; size: number }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={size * 0.16} fill="#f4efe4" stroke="#1a1a1a" strokeWidth="2" />
      {PIP_LAYOUTS[value].map(([px, py], i) => (
        <circle key={i} cx={x + (px / 100) * size} cy={y + (py / 100) * size} r={size * 0.08} fill="#1a1a1a" />
      ))}
    </g>
  );
}

export default function CrapsBoard({
  phase,
  point,
  oddsOn = false,
  betSize = 15,
  oddsMultiple = 3,
  dice,
}: CrapsBoardProps) {
  const boxWidth = 90;
  const boxGap = 6;
  const startX = 30;
  const placeY = 60;
  const pointActive = phase === 'point' || phase === 'win' || phase === 'lose';
  const oddsAmount = betSize * oddsMultiple;
  const oddsWin = oddsOn && isPointNumber(point) ? oddsWinAmount(point, oddsAmount) : 0;
  const winTotal = betSize + (oddsOn ? oddsWin : 0);
  const loseTotal = betSize + (oddsOn ? oddsAmount : 0);

  const passLineFill =
    phase === 'win' ? '#1f9d55' : phase === 'lose' ? '#7a1f2b' : pointActive ? '#136b40' : '#0e6b45';
  const passLineStroke = phase === 'win' ? '#8ef2b0' : phase === 'lose' ? '#ff8080' : '#f4d35e';

  return (
    <svg viewBox="0 0 630 480" className="craps-board" role="img" aria-label="Craps table layout">
      <rect x="0" y="0" width="630" height="480" rx="24" fill="#0b5d3b" stroke="#063f27" strokeWidth="6" />

      {/* Phase indicator */}
      <text x={315} y={22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#f4d35e" letterSpacing="2">
        {phase === 'come-out' && 'COME-OUT ROLL'}
        {phase === 'point' && `POINT IS ${point} — WORKING`}
        {phase === 'win' && `${point} HIT — PASS LINE WINS`}
        {phase === 'lose' && 'SEVEN-OUT — PASS LINE LOSES'}
      </text>

      {/* Dice */}
      {dice && (
        <g>
          <Die value={dice[0]} x={520} y={8} size={40} />
          <Die value={dice[1]} x={568} y={8} size={40} />
        </g>
      )}

      {/* Place number boxes */}
      {PLACE_NUMBERS.map((n, i) => {
        const x = startX + i * (boxWidth + boxGap);
        const isPoint = pointActive && point === n;
        const boxFill = isPoint && phase === 'win' ? '#1f9d55' : isPoint ? '#f4d35e' : '#0e6b45';
        return (
          <g key={n}>
            <rect
              x={x}
              y={placeY}
              width={boxWidth}
              height={70}
              rx="6"
              fill={boxFill}
              stroke="#e7e0c9"
              strokeWidth="2"
            />
            <text
              x={x + boxWidth / 2}
              y={placeY + 30}
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill={isPoint ? '#1a1a1a' : '#e7e0c9'}
            >
              {n}
            </text>
            <text
              x={x + boxWidth / 2}
              y={placeY + 52}
              textAnchor="middle"
              fontSize="11"
              fill={isPoint ? '#1a1a1a' : '#c9dfd2'}
            >
              PLACE
            </text>
            {isPoint && (
              <g>
                <circle cx={x + boxWidth / 2} cy={placeY + 92} r="14" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2" />
                <text x={x + boxWidth / 2} y={placeY + 96} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1a1a1a">
                  ON
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Come box */}
      <rect x={startX} y={210} width={570} height={70} rx="8" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="2" />
      <text x={315} y={250} textAnchor="middle" fontSize="26" fontWeight="700" fill="#e7e0c9" letterSpacing="4">
        COME
      </text>

      {/* Field box */}
      <rect x={startX} y={290} width={570} height={60} rx="8" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="2" />
      <text x={315} y={315} textAnchor="middle" fontSize="18" fontWeight="700" fill="#e7e0c9" letterSpacing="3">
        FIELD
      </text>
      <text x={315} y={335} textAnchor="middle" fontSize="12" fill="#c9dfd2">
        2 · 3 · 4 · 9 · 10 · 11 · 12
      </text>

      {/* Don't Pass Bar */}
      <rect x={startX} y={360} width={570} height={30} rx="6" fill="#0e6b45" stroke="#e7e0c9" strokeWidth="2" />
      <text x={315} y={381} textAnchor="middle" fontSize="14" fontWeight="600" fill="#c9dfd2" letterSpacing="2">
        DON'T PASS BAR
      </text>

      {/* Odds strip (behind pass line) */}
      <rect x={startX} y={398} width={570} height={26} rx="4" fill="#0a4a30" stroke="#457b9d" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={315} y={415} textAnchor="middle" fontSize="11" fontWeight="600" fill="#89b8d6" letterSpacing="2">
        ODDS (TRUE ODDS — NO HOUSE EDGE)
      </text>

      {/* Pass line */}
      <rect x={startX} y={432} width={570} height={40} rx="8" fill={passLineFill} stroke={passLineStroke} strokeWidth="3" />
      <text x={315} y={458} textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffffff" letterSpacing="3">
        PASS LINE
      </text>

      {/* Pass line chip */}
      <g>
        <circle cx={150} cy={452} r="18" fill="#e63946" stroke="#ffffff" strokeWidth="3" />
        <text x={150} y={449} textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff">
          PASS
        </text>
        <text x={150} y={459} textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff">
          ${betSize}
        </text>
      </g>

      {/* Odds chip */}
      {oddsOn && pointActive && (
        <g>
          <circle cx={150} cy={411} r="15" fill="#457b9d" stroke="#ffffff" strokeWidth="3" />
          <text x={150} y={408} textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">
            ODDS
          </text>
          <text x={150} y={417} textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">
            ${oddsAmount}
          </text>
        </g>
      )}

      {/* Outcome banner */}
      {(phase === 'win' || phase === 'lose') && (
        <g>
          <rect
            x={200}
            y={170}
            width={230}
            height={36}
            rx="18"
            fill={phase === 'win' ? '#1f9d55' : '#c0392b'}
            stroke="#ffffff"
            strokeWidth="2"
          />
          <text x={315} y={194} textAnchor="middle" fontSize="16" fontWeight="800" fill="#ffffff" letterSpacing="1">
            {phase === 'win' ? `WIN +$${winTotal.toFixed(0)}` : `LOSE -$${loseTotal.toFixed(0)}`}
          </text>
        </g>
      )}
    </svg>
  );
}
