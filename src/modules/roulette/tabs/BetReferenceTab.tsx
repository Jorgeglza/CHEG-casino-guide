import { useMemo, useState } from 'react';
import { BET_REFERENCE_ROWS, betReferenceInfo } from '../data/rouletteBets';
import { houseEdgeOf, probabilityOf, volatilityOf } from '../engine/rouletteMath';
import EdgeBadge from '../components/EdgeBadge';
import type { RouletteVariant } from '../types/roulette';

export default function BetReferenceTab() {
  const [variant, setVariant] = useState<RouletteVariant>('american');

  const rows = useMemo(
    () =>
      BET_REFERENCE_ROWS.map((row) => {
        const info = betReferenceInfo(row);
        return {
          row,
          info,
          probEU: probabilityOf(row.type, row.sampleParams, 'european') * 100,
          probUS: probabilityOf(row.type, row.sampleParams, 'american') * 100,
          edgeEU: houseEdgeOf(row.type, row.sampleParams, 'european'),
          edgeUS: houseEdgeOf(row.type, row.sampleParams, 'american'),
          volatility: volatilityOf(row.type),
        };
      }),
    [],
  );

  return (
    <div className="tab-content bet-reference-tab">
      <section className="panel">
        <h2>Bet Reference</h2>
        <p>
          Every bet type on the roulette layout, with probability and house edge computed live for the number of
          pockets each covers — not hardcoded per variant. Payout ratios are profit-only: the original stake is
          always returned separately on a win, never counted twice.
        </p>
        <div className="control-group">
          <span>Variant</span>
          <div className="button-row">
            <button className={variant === 'american' ? 'active' : ''} onClick={() => setVariant('american')}>
              American (most common in the US)
            </button>
            <button className={variant === 'european' ? 'active' : ''} onClick={() => setVariant('european')}>
              European (lower house edge)
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="bet-table-wrapper">
          <table className="bet-table">
            <thead>
              <tr>
                <th>Bet</th>
                <th>Category</th>
                <th>Numbers covered</th>
                <th>Payout</th>
                <th>Probability (EU)</th>
                <th>Probability (US)</th>
                <th>House edge ({variant === 'european' ? 'EU' : 'US'})</th>
                <th>Volatility</th>
                <th>Example placement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, info, probEU, probUS, edgeEU, edgeUS, volatility }) => (
                <tr key={row.type}>
                  <td>
                    {info.label}
                    {row.americanOnly && <span className="one-roll-tag">US only</span>}
                  </td>
                  <td>{info.category}</td>
                  <td>{info.numbersCovered}</td>
                  <td>
                    {info.payoutRatio[0]}:{info.payoutRatio[1]} — {info.payoutRatio[0]} units profit, {info.payoutRatio[0] + info.payoutRatio[1]} units returned total
                  </td>
                  <td>{row.americanOnly ? 'N/A' : `${probEU.toFixed(2)}%`}</td>
                  <td>{probUS.toFixed(2)}%</td>
                  <td>
                    {row.americanOnly && variant === 'european' ? (
                      'N/A'
                    ) : (
                      <EdgeBadge edge={variant === 'european' ? edgeEU : edgeUS} size="sm" />
                    )}
                  </td>
                  <td>{volatility}</td>
                  <td className="notes-cell">{info.description} {row.examplePlacement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Basket / top line — American special bet</h3>
        <p>
          The basket bet (0, 00, 1, 2, 3) exists only on American wheels and carries its own distinct house edge —
          it does not follow the standard American pattern the way every other bet on this page does. It's listed
          separately here because grouping it with ordinary American bets would understate how much worse it is.
        </p>
      </section>
    </div>
  );
}
