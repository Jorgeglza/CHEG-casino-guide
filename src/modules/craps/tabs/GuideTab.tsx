import { useEffect, useState } from 'react';
import EdgeBadge from '../components/EdgeBadge';
import { combinedHouseEdge, STRATEGIES } from '../engine/bets';
import { runMonteCarlo, type SimConfig, type SimSummary } from '../engine/simulate';
import { STAKING_STRATEGIES, type CrapsStakingStrategy } from '../engine/strategyEngine';
import { STAKING_STRATEGY_META } from '../data/crapsStrategies';

const REFERENCE_BANKROLL = 500;
const REFERENCE_UNIT = 15;
const REFERENCE_ODDS_MULTIPLE = 3;
const REFERENCE_TABLE_MAX = 2000;
const REFERENCE_ROLLS = 200;
const REFERENCE_TRIALS = 1000;

function referenceConfig(stakingStrategy: CrapsStakingStrategy): SimConfig {
  return {
    startingBankroll: REFERENCE_BANKROLL,
    baseUnit: REFERENCE_UNIT,
    oddsMultiple: REFERENCE_ODDS_MULTIPLE,
    tableMax: REFERENCE_TABLE_MAX,
    maxRolls: REFERENCE_ROLLS,
    trials: REFERENCE_TRIALS,
    strategy: 'pass-odds',
    stakingStrategy,
    paroliCap: 3,
  };
}

interface GuideRow {
  id: CrapsStakingStrategy;
  label: string;
  summary: SimSummary;
}

// Computing all 4 reference simulations takes a moment; CrapsModule unmounts each tab
// when it's not active, so without this module-level cache, switching away from the
// Guide tab and back would recompute everything from scratch every time. Cached once per
// page load — the reference conditions never change, so there's nothing to invalidate.
let cachedRows: GuideRow[] | null = null;

function computeRows(): GuideRow[] {
  return STAKING_STRATEGIES.map((s) => ({
    id: s.id,
    label: s.label,
    summary: runMonteCarlo(referenceConfig(s.id), REFERENCE_TRIALS),
  }));
}

export default function GuideTab() {
  const [rows, setRows] = useState<GuideRow[] | null>(cachedRows);
  const edge = combinedHouseEdge(REFERENCE_ODDS_MULTIPLE);
  const passOddsDef = STRATEGIES.find((s) => s.id === 'pass-odds')!;

  useEffect(() => {
    if (cachedRows) return;
    const timer = setTimeout(() => {
      cachedRows = computeRows();
      setRows(cachedRows);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tab-content guide-tab">
      <section className="panel">
        <h2>Strategy Guide</h2>
        <p>
          Every Pass Line staking system in this guide, compared on the same terms, so you can pick one before
          heading to the Simulator to explore it further. Numbers below come from {REFERENCE_TRIALS.toLocaleString()}{' '}
          simulated sessions of {REFERENCE_ROLLS} rolls each, starting with a ${REFERENCE_BANKROLL} bankroll, a $
          {REFERENCE_UNIT} base unit, and {REFERENCE_ODDS_MULTIPLE}x odds on the "{passOddsDef.label}" bet
          selection — the same reference conditions for every staking system, so the comparison is apples-to-apples.
          Your own results in the Simulator will vary with your own settings and bet selection.
        </p>
      </section>

      <section className="panel bet-mode-compare-panel">
        <h3>Two different questions: which bets vs. how much to wager</h3>
        <div className="bet-mode-compare-grid">
          <div className="bet-mode-compare-card">
            <h4>Bet selection (see the Strategy tab)</h4>
            <p className="chart-note">
              Which numbers you have working — Pass Line + Odds alone, or with Place bets added on top. This changes
              your house edge and how much is at risk on a seven-out, but never how much you wager on any single
              decision.
            </p>
          </div>
          <div className="bet-mode-compare-card">
            <h4>Staking systems (this guide)</h4>
            <p className="chart-note">
              Once you've picked your bets, a staking system changes the <em>wager size</em> round to round based on
              whether the last Pass Line decision won or lost. Flat is the exception — it never changes.
            </p>
          </div>
        </div>
        <p className="strategy-house-edge-note">
          Neither approach changes the underlying house edge — they change how the same long-run loss is distributed
          across your session, and how much attention (and bankroll) each round needs.
        </p>
      </section>

      <section className="panel">
        <h3>Comparison table</h3>
        {!rows ? (
          <p className="chart-note">Calculating comparison stats…</p>
        ) : (
          <div className="bet-table-wrapper">
            <table className="bet-table">
              <thead>
                <tr>
                  <th>Staking system</th>
                  <th>Win %</th>
                  <th>Avg ending bankroll</th>
                  <th>Risk of ruin</th>
                  <th>Avg max drawdown</th>
                  <th>Avg largest wager</th>
                  <th>House edge</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td>{r.summary.winRate.toFixed(1)}%</td>
                    <td>${r.summary.averageFinal.toFixed(0)}</td>
                    <td>{r.summary.riskOfRuin.toFixed(1)}%</td>
                    <td>${r.summary.avgMaxDrawdown.toFixed(0)}</td>
                    <td>${r.summary.avgLargestWager.toFixed(0)}</td>
                    <td>
                      <EdgeBadge edge={edge} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="chart-note">
          "Win %" is the share of sessions ending with more money than they started with. Every row faces the same
          blended house edge — no staking system beats that math, they just reshape the ride.
        </p>
      </section>

      <section className="panel">
        <h3>Staking systems, at a glance</h3>
        <div className="guide-card-list">
          {STAKING_STRATEGY_META.map((s) => {
            const row = rows?.find((r) => r.id === s.id);
            return (
              <div className="guide-card" key={s.id}>
                <div className="guide-card-header">
                  <strong>{s.label}</strong>
                  <span className={`risk-pill risk-pill--${s.riskLevel}`}>{s.riskLabel}</span>
                </div>
                {row && (
                  <div className="kpi-row-mini">
                    <span className="kpi-mini">{row.summary.winRate.toFixed(0)}% win</span>
                    <span className="kpi-mini">avg ${row.summary.averageFinal.toFixed(0)}</span>
                    <span className="kpi-mini kpi-mini-negative">{row.summary.riskOfRuin.toFixed(0)}% ruin</span>
                  </div>
                )}
                <div className="pros-cons-mini">
                  <div>
                    <h5>Advantages</h5>
                    <ul>
                      {s.advantages.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5>Limitations</h5>
                    <ul>
                      {s.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="chart-note">{s.bestUseCase}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
