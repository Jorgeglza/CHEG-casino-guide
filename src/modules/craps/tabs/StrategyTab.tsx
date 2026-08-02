import { useState } from 'react';
import StrategyBoard from '../components/StrategyBoard';
import EdgeBadge from '../components/EdgeBadge';
import { combinedHouseEdge, type Point } from '../engine/bets';
import { PLACE_EDGE_BY_NUMBER, pointRepeatProbability } from '../engine/probabilities';

const POINTS: Point[] = [4, 5, 6, 8, 9, 10];
const ODDS_OPTIONS = [0, 1, 2, 3, 5, 10];

export default function StrategyTab() {
  const [mode, setMode] = useState<'before' | 'after'>('before');
  const [point, setPoint] = useState<Point>(6);
  const [oddsMultiple, setOddsMultiple] = useState(3);

  const edge = combinedHouseEdge(oddsMultiple);
  const bestPlaceNumbers = [...POINTS].sort((a, b) => PLACE_EDGE_BY_NUMBER[a] - PLACE_EDGE_BY_NUMBER[b]);

  return (
    <div className="tab-content strategy-tab">
      <section className="panel">
        <h2>Strategy</h2>
        <p>
          Every craps decision splits into two very different phases: <strong>before</strong> a point is set, and{' '}
          <strong>after</strong>. The board below shows the real probability and house edge of every section for
          whichever phase you're in — use it to see exactly why the recommended plays are recommended.
        </p>
      </section>

      <section className="panel board-panel">
        <div className="board-controls">
          <div className="control-group">
            <span>Phase</span>
            <div className="button-row">
              <button className={mode === 'before' ? 'active' : ''} onClick={() => setMode('before')}>
                Before the point
              </button>
              <button className={mode === 'after' ? 'active' : ''} onClick={() => setMode('after')}>
                After the point
              </button>
            </div>
          </div>
          {mode === 'after' && (
            <div className="control-group">
              <span>Point</span>
              <div className="button-row">
                {POINTS.map((p) => (
                  <button key={p} className={point === p ? 'active' : ''} onClick={() => setPoint(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mode === 'after' && (
            <div className="control-group">
              <span>Odds multiple</span>
              <div className="button-row">
                {ODDS_OPTIONS.map((m) => (
                  <button key={m} className={oddsMultiple === m ? 'active' : ''} onClick={() => setOddsMultiple(m)}>
                    {m === 0 ? 'None' : `${m}x`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <StrategyBoard mode={mode} point={point} oddsMultiple={oddsMultiple} />

        <p className="board-caption">
          {mode === 'before'
            ? 'Every number and bet on the board is annotated with the probability of that outcome on the come-out roll, and the house edge you’d be facing if you had money on it.'
            : `With ${point} as the point, each place number shows the probability it repeats before a 7, and the edge you'd face betting it that way. The active point is highlighted.`}
        </p>
      </section>

      <section className="panel strategy-writeup">
        <h3>Phase 1 — Before the point (come-out roll)</h3>
        <ul>
          <li>
            <strong>Bet the Pass Line, and only the Pass Line.</strong> At a 1.41% house edge it's the best bet
            available before a point exists — nothing else on the come-out comes close.
          </li>
          <li>
            <strong>Leave the Field alone.</strong> It wins more often than it loses ({(44.44).toFixed(1)}% of rolls),
            but the 2:1/3:1 payouts on 2 and 12 don't make up for it — 5.56% edge.
          </li>
          <li>
            <strong>Ignore one-roll propositions.</strong> Any Craps (11.11%) and Any Seven (16.67%) look tempting
            because they resolve instantly, but they're some of the worst-paying bets in the casino.
          </li>
          <li>
            <strong>Decide your odds multiple before the point lands.</strong> Know in advance whether you're taking
            1x, 3x, or 10x odds so you're not fumbling for chips once a number hits.
          </li>
        </ul>

        <h3>Phase 2 — After the point is set</h3>
        <ul>
          <li>
            <strong>Back your Pass Line with max Odds immediately.</strong> The Odds bet pays true odds — a flat 0%
            house edge, mathematically the single best bet in any casino. Current blended edge at {oddsMultiple}x:{' '}
            <EdgeBadge edge={edge} size="sm" />
          </li>
          <li>
            <strong>If you want more numbers working, rank them by edge:</strong>{' '}
            {bestPlaceNumbers.map((n, i) => (
              <span key={n}>
                {i > 0 && ', '}
                <strong>{n}</strong> ({PLACE_EDGE_BY_NUMBER[n].toFixed(2)}%)
              </span>
            ))}
            . Place 6 and 8 first — they win almost as often as they lose (
            {pointRepeatProbability(6).toFixed(1)}%) at the lowest edge of the bunch.
          </li>
          <li>
            <strong>Avoid Place 4/10 outright (6.67%).</strong> If you must cover those numbers, Buy them for a 5%
            commission instead — that drops the edge to 4.76%.
          </li>
          <li>
            <strong>Keep Field and proposition bets off the table.</strong> A point being set doesn't change their
            math — they're still bad bets.
          </li>
          <li>
            <strong>Let it ride.</strong> Once your odds are up, leave them working through each new point rather than
            pulling them down — the edge never gets better by removing your best bet.
          </li>
        </ul>
      </section>
    </div>
  );
}
