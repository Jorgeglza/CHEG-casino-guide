import { useEffect, useState } from 'react';
import EdgeBadge from '../components/EdgeBadge';
import { runMonteCarlo, type RouletteSimConfig, type RouletteSimSummary } from '../engine/simulate';
import { COVERAGE_STRATEGIES } from '../engine/coverageStrategies';
import { STRATEGY_META, getCoverageGuideMeta, getStrategyMeta } from '../data/rouletteStrategies';
import type { RouletteCoverageStrategy, RouletteStrategy } from '../types/roulette';

const REFERENCE_BANKROLL = 500;
const REFERENCE_UNIT = 5;
const REFERENCE_SPINS = 150;
const REFERENCE_TRIALS = 1000;

const STAKING_IDS: RouletteStrategy[] = ['flat', 'martingale', 'dalembert', 'fibonacci', 'labouchere', 'paroli', 'james-bond'];
const COVERAGE_IDS: RouletteCoverageStrategy[] = COVERAGE_STRATEGIES.map((c) => c.id);

function stakingConfig(strategy: RouletteStrategy): RouletteSimConfig {
  return {
    variant: 'european',
    startingBankroll: REFERENCE_BANKROLL,
    baseUnit: REFERENCE_UNIT,
    betMode: 'single',
    strategy,
    betType: 'red',
    maxSpins: REFERENCE_SPINS,
    tableMax: 2000,
    specialRules: { laPartage: false, enPrison: false },
    strategyParams: { labouchereStart: [1, 2, 3, 4], paroliCap: 3 },
  };
}

function coverageConfig(coverageStrategyId: RouletteCoverageStrategy): RouletteSimConfig {
  return {
    variant: 'european',
    startingBankroll: REFERENCE_BANKROLL,
    baseUnit: REFERENCE_UNIT,
    betMode: 'coverage',
    strategy: 'flat',
    betType: 'red',
    coverageStrategyId,
    maxSpins: REFERENCE_SPINS,
    tableMax: 2000,
    specialRules: { laPartage: false, enPrison: false },
  };
}

interface GuideRow {
  id: string;
  label: string;
  mode: 'staking' | 'coverage';
  summary: RouletteSimSummary;
}

export default function GuideTab() {
  const [rows, setRows] = useState<GuideRow[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const computed: GuideRow[] = [
        ...STAKING_IDS.map((id) => ({
          id,
          label: getStrategyMeta(id).label,
          mode: 'staking' as const,
          summary: runMonteCarlo(stakingConfig(id), REFERENCE_TRIALS),
        })),
        ...COVERAGE_IDS.map((id) => ({
          id,
          label: COVERAGE_STRATEGIES.find((c) => c.id === id)!.label,
          mode: 'coverage' as const,
          summary: runMonteCarlo(coverageConfig(id), REFERENCE_TRIALS),
        })),
      ];
      setRows(computed);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tab-content guide-tab">
      <section className="panel">
        <h2>Strategy Guide</h2>
        <p>
          Every strategy in this guide, compared on the same terms, so you can pick one before heading to the
          Simulator to explore it further. Numbers below come from {REFERENCE_TRIALS.toLocaleString()} simulated
          sessions of {REFERENCE_SPINS} spins each, starting with a ${REFERENCE_BANKROLL} bankroll and a $
          {REFERENCE_UNIT} base unit on the European wheel — the same reference conditions for every strategy, so
          the comparison is apples-to-apples. Your own results in the Simulator will vary with your own settings.
        </p>
      </section>

      <section className="panel bet-mode-compare-panel">
        <h3>Two different questions: what to bet on vs. how much to bet</h3>
        <div className="bet-mode-compare-grid">
          <div className="bet-mode-compare-card">
            <h4>Staking systems</h4>
            <p className="chart-note">
              Pick one bet target and keep betting it — a staking system changes the <em>wager size</em> spin to
              spin based on wins and losses (Flat is the exception: it never changes).
            </p>
            <div className="pros-cons-mini">
              <div>
                <h5>Pros</h5>
                <ul>
                  <li>Works with any single bet type, inside or outside.</li>
                  <li>Simple to place — one bet per spin.</li>
                  <li>Volatility is tunable by bet-target choice (even-money vs. straight-up).</li>
                </ul>
              </div>
              <div>
                <h5>Cons</h5>
                <ul>
                  <li>Progression systems can escalate the wager quickly during a losing streak.</li>
                  <li>Only ever covers one number or group at a time.</li>
                  <li>Recovery-style systems (Martingale, Labouchère) need a large bankroll cushion to be usable.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bet-mode-compare-card">
            <h4>Number coverage strategies</h4>
            <p className="chart-note">
              Place a fixed set of simultaneous bets that together cover a chunk of the wheel — the same spread,
              same total wager, every single spin. No progression.
            </p>
            <div className="pros-cons-mini">
              <div>
                <h5>Pros</h5>
                <ul>
                  <li>Wager never escalates — the total stake per spin is constant and predictable.</li>
                  <li>Higher hit frequency per spin than a single narrow bet.</li>
                  <li>Some (Voisins, Tiers, Orphelins) are recognized bets a live dealer can place by name.</li>
                </ul>
              </div>
              <div>
                <h5>Cons</h5>
                <ul>
                  <li>Requires placing and tracking several chips correctly every spin.</li>
                  <li>The classic wheel-neighbor bets only work on a European wheel.</li>
                  <li>Broader coverage strategies commit more capital per spin than a single small bet.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <p className="strategy-house-edge-note">
          Neither approach changes the underlying house edge — they change how the same long-run loss is distributed
          across your session, and how much attention each spin needs.
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
                  <th>Strategy</th>
                  <th>Bet mode</th>
                  <th>Win %</th>
                  <th>Avg ending bankroll</th>
                  <th>Expected bankroll</th>
                  <th>Risk of ruin</th>
                  <th>Win rate per spin</th>
                  <th>House edge</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td>{r.mode === 'staking' ? 'Staking system' : 'Number coverage'}</td>
                    <td>{r.summary.profitablePct.toFixed(1)}%</td>
                    <td>${r.summary.averageFinal.toFixed(0)}</td>
                    <td>${r.summary.theoreticalExpectedBankroll.toFixed(0)}</td>
                    <td>{r.summary.ruinPct.toFixed(1)}%</td>
                    <td>{r.summary.avgWinRatePerSpin.toFixed(1)}%</td>
                    <td>
                      <EdgeBadge edge={r.summary.theoreticalHouseEdge} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="chart-note">
          "Win %" is the share of sessions ending with more money than they started with. "Expected bankroll" is the
          theoretical value from the house edge and average amount wagered — it should land close to the simulated
          average, which is the point: no strategy beats that math.
        </p>
      </section>

      <section className="panel">
        <h3>Staking systems, at a glance</h3>
        <div className="guide-card-list">
          {STRATEGY_META.map((s) => {
            const row = rows?.find((r) => r.id === s.id);
            return (
              <div className="guide-card" key={s.id}>
                <div className="guide-card-header">
                  <strong>{s.label}</strong>
                  <span className={`risk-pill risk-pill--${s.riskLevel}`}>{s.categoryLabel}</span>
                </div>
                {row && (
                  <div className="kpi-row-mini">
                    <span className="kpi-mini">{row.summary.profitablePct.toFixed(0)}% win</span>
                    <span className="kpi-mini">avg ${row.summary.averageFinal.toFixed(0)}</span>
                    <span className="kpi-mini kpi-mini-negative">{row.summary.ruinPct.toFixed(0)}% ruin</span>
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

      <section className="panel">
        <h3>Number coverage strategies, at a glance</h3>
        <div className="guide-card-list">
          {COVERAGE_STRATEGIES.map((c) => {
            const meta = getCoverageGuideMeta(c.id);
            const row = rows?.find((r) => r.id === c.id);
            return (
              <div className="guide-card" key={c.id}>
                <div className="guide-card-header">
                  <strong>{c.label}</strong>
                  <span className="risk-pill risk-pill--moderate">{meta.complexity} complexity</span>
                </div>
                {row && (
                  <div className="kpi-row-mini">
                    <span className="kpi-mini">{row.summary.profitablePct.toFixed(0)}% win</span>
                    <span className="kpi-mini">avg ${row.summary.averageFinal.toFixed(0)}</span>
                    <span className="kpi-mini kpi-mini-negative">{row.summary.ruinPct.toFixed(0)}% ruin</span>
                  </div>
                )}
                <div className="pros-cons-mini">
                  <div>
                    <h5>Advantages</h5>
                    <ul>
                      {meta.advantages.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5>Limitations</h5>
                    <ul>
                      {meta.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="chart-note">{meta.bestUseCase}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
