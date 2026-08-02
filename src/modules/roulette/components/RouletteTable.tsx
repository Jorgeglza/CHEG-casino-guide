import { betCoverage, isBlack, isRed } from '../engine/rouletteMath';
import type { RouletteBetSelection, RouletteVariant } from '../types/roulette';

interface RouletteTableProps {
  variant: RouletteVariant;
  selection?: RouletteBetSelection;
  onSelect?: (selection: RouletteBetSelection) => void;
  winningNumber?: number | '00';
}

const ROWS = Array.from({ length: 12 }, (_, i) => 12 - i); // row 12 (34-35-36) at top, row 1 (1-2-3) at bottom

function rowNumbers(row: number): number[] {
  const start = (row - 1) * 3 + 1;
  return [start, start + 1, start + 2];
}

const OUTSIDE_EVEN_MONEY: { label: string; ariaLabel: string; selection: RouletteBetSelection }[] = [
  { label: '1 to 18', ariaLabel: 'Low, numbers 1 to 18', selection: { type: 'low', numbers: betCoverage('low') } },
  { label: 'Even', ariaLabel: 'Even numbers', selection: { type: 'even', numbers: betCoverage('even') } },
  { label: 'Red', ariaLabel: 'Red numbers', selection: { type: 'red', numbers: betCoverage('red') } },
  { label: 'Black', ariaLabel: 'Black numbers', selection: { type: 'black', numbers: betCoverage('black') } },
  { label: 'Odd', ariaLabel: 'Odd numbers', selection: { type: 'odd', numbers: betCoverage('odd') } },
  { label: '19 to 36', ariaLabel: 'High, numbers 19 to 36', selection: { type: 'high', numbers: betCoverage('high') } },
];

const COLUMN_OPTIONS: { idx: 1 | 2 | 3; selection: RouletteBetSelection }[] = [1, 2, 3].map((idx) => ({
  idx: idx as 1 | 2 | 3,
  selection: {
    type: 'column',
    params: { columnIndex: idx as 1 | 2 | 3 },
    numbers: betCoverage('column', { columnIndex: idx as 1 | 2 | 3 }),
  },
}));

const DOZEN_OPTIONS: { idx: 1 | 2 | 3; label: string; selection: RouletteBetSelection }[] = [1, 2, 3].map((idx) => ({
  idx: idx as 1 | 2 | 3,
  label: idx === 1 ? '1st 12' : idx === 2 ? '2nd 12' : '3rd 12',
  selection: {
    type: 'dozen',
    params: { dozenIndex: idx as 1 | 2 | 3 },
    numbers: betCoverage('dozen', { dozenIndex: idx as 1 | 2 | 3 }),
  },
}));

export default function RouletteTable({ variant, selection, onSelect, winningNumber }: RouletteTableProps) {
  const highlighted = new Set(selection?.numbers ?? []);
  const interactive = Boolean(onSelect);

  function cellClass(n: number | '00') {
    const classes = ['roulette-cell'];
    if (n === '00' || n === 0) classes.push('roulette-cell--green');
    else if (isRed(n as number)) classes.push('roulette-cell--red');
    else classes.push('roulette-cell--black');
    if (highlighted.has(n)) classes.push('highlighted');
    if (winningNumber !== undefined && winningNumber === n) classes.push('winning');
    return classes.join(' ');
  }

  function isOutsideActive(candidate: RouletteBetSelection) {
    return selection?.type === candidate.type && JSON.stringify(selection?.params) === JSON.stringify(candidate.params);
  }

  return (
    <div className="roulette-table-wrap">
      <div className="roulette-table-grid">
        <div className="roulette-zero-col">
          <button
            type="button"
            className={cellClass(0)}
            disabled={!interactive}
            aria-pressed={highlighted.has(0)}
            aria-label={`Number 0, green${highlighted.has(0) ? ', selected' : ''}`}
            onClick={() => onSelect?.({ type: 'straight', params: { numbers: [0] }, numbers: [0] })}
          >
            0
          </button>
          {variant === 'american' && (
            <button
              type="button"
              className={cellClass('00')}
              disabled={!interactive}
              aria-pressed={highlighted.has('00')}
              aria-label={`Number 00, green${highlighted.has('00') ? ', selected' : ''}`}
              onClick={() => onSelect?.({ type: 'straight', params: { numbers: ['00'] }, numbers: ['00'] })}
            >
              00
            </button>
          )}
        </div>
        <div className="roulette-numbers-grid">
          {ROWS.map((row) => (
            <div className="roulette-row" key={row}>
              {rowNumbers(row).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cellClass(n)}
                  disabled={!interactive}
                  aria-pressed={highlighted.has(n)}
                  aria-label={`Number ${n}, ${isRed(n) ? 'red' : isBlack(n) ? 'black' : 'green'}${highlighted.has(n) ? ', selected' : ''}`}
                  onClick={() => onSelect?.({ type: 'straight', params: { numbers: [n] }, numbers: [n] })}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="roulette-outside-strip">
        <div className="roulette-outside-row">
          {COLUMN_OPTIONS.map(({ idx, selection: sel }) => (
            <button
              key={idx}
              type="button"
              className={`roulette-outside-cell ${isOutsideActive(sel) ? 'highlighted' : ''}`}
              disabled={!interactive}
              aria-pressed={isOutsideActive(sel)}
              aria-label={`Column ${idx}, twelve numbers`}
              onClick={() => onSelect?.(sel)}
            >
              Column {idx} (2:1)
            </button>
          ))}
        </div>
        <div className="roulette-outside-row">
          {DOZEN_OPTIONS.map(({ idx, label, selection: sel }) => (
            <button
              key={idx}
              type="button"
              className={`roulette-outside-cell ${isOutsideActive(sel) ? 'highlighted' : ''}`}
              disabled={!interactive}
              aria-pressed={isOutsideActive(sel)}
              aria-label={`Dozen ${idx}, twelve numbers`}
              onClick={() => onSelect?.(sel)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="roulette-outside-row">
          {OUTSIDE_EVEN_MONEY.map(({ label, ariaLabel, selection: sel }) => (
            <button
              key={label}
              type="button"
              className={`roulette-outside-cell ${isOutsideActive(sel) ? 'highlighted' : ''}`}
              disabled={!interactive}
              aria-pressed={isOutsideActive(sel)}
              aria-label={ariaLabel}
              onClick={() => onSelect?.(sel)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
