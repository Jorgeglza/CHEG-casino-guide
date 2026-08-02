import { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import RuleControls from '../components/RuleControls';
import {
  runInBatches,
  simulateSingleRun,
  type BlackjackBettingStrategy,
  type BlackjackSimConfig,
  type BlackjackSimSummary,
  type BlackjackTrialResult,
} from '../engine/simulate';
import { DEFAULT_RULES } from '../types/blackjack';

const BETTING_OPTIONS: { id: BlackjackBettingStrategy; label: string }[] = [
  { id: 'flat', label: 'Flat Betting' },
  { id: 'martingale', label: 'Martingale' },
  { id: 'paroli', label: 'Paroli' },
  { id: '1-3-2-6', label: '1-3-2-6' },
];

const MC_RUN_OPTIONS = [100, 1000, 10000];

function BankrollTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: BlackjackSimSummary['trajectoryPercentiles'][number] }[]; label?: number }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  const series: { key: 'p95' | 'p75' | 'p50' | 'p25' | 'p5'; label: string; color: string }[] = [
    { key: 'p95', label: '95th pct', color: '#3d9970' },
    { key: 'p75', label: '75th pct', color: '#3d9970' },
    { key: 'p50', label: 'Median', color: '#f4d35e' },
    { key: 'p25', label: '25th pct', color: '#c0392b' },
    { key: 'p5', label: '5th pct', color: '#c0392b' },
  ];
  return (
    <div className="dice-roll-tooltip">
      <strong>Hand {label}</strong>
      <ul>
        {series.map((s) => (
          <li key={s.key}>
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.label}
            <span className="dice-roll-tooltip-count">${Number(row[s.key]).toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SimulatorTab() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [bettingStrategy, setBettingStrategy] = useState<BlackjackBettingStrategy>('flat');
  const [startingBankroll, setStartingBankroll] = useState(1000);
  const [baseUnit, setBaseUnit] = useState(10);
  const [tableMax, setTableMax] = useState(500);
  const [maxHands, setMaxHands] = useState(200);
  const [useStopLoss, setUseStopLoss] = useState(true);
  const [stopLoss, setStopLoss] = useState(200);
  const [useStopWin, setUseStopWin] = useState(true);
  const [stopWin, setStopWin] = useState(1800);
  const [paroliCap, setParoliCap] = useState(3);
  const [mcRuns, setMcRuns] = useState(0);

  const [running, setRunning] = useState(false);
  const [mcProgress, setMcProgress] = useState(0);
  const [detailedResult, setDetailedResult] = useState<BlackjackTrialResult | null>(null);
  const [mcSummary, setMcSummary] = useState<BlackjackSimSummary | null>(null);
  const [ranConfig, setRanConfig] = useState<BlackjackSimConfig | null>(null);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (startingBankroll <= 0) list.push('Starting bankroll must be greater than 0.');
    if (baseUnit <= 0) list.push('Base unit must be greater than 0.');
    if (baseUnit > tableMax) list.push('Base unit cannot exceed the table maximum.');
    if (tableMax <= 0) list.push('Table maximum must be greater than 0.');
    if (maxHands < 1 || maxHands > 5000) list.push('Hands must be between 1 and 5,000.');
    if (useStopLoss && (stopLoss < 0 || stopLoss >= startingBankroll)) list.push('Stop-loss must be below the starting bankroll.');
    if (useStopWin && stopWin <= startingBankroll) list.push('Stop-win must be above the starting bankroll.');
    return list;
  }, [startingBankroll, baseUnit, tableMax, maxHands, useStopLoss, stopLoss, useStopWin, stopWin]);

  const canRun = errors.length === 0;

  function buildConfig(): BlackjackSimConfig {
    return {
      rules,
      bettingStrategy,
      startingBankroll,
      baseUnit,
      tableMax,
      maxHands,
      stopLoss: useStopLoss ? stopLoss : undefined,
      stopWin: useStopWin ? stopWin : undefined,
      paroliCap,
    };
  }

  function handleRun() {
    if (!canRun) return;
    setRunning(true);
    setMcProgress(0);
    const config = buildConfig();
    setTimeout(() => {
      const single = simulateSingleRun(config);
      setDetailedResult(single);
      setRanConfig(config);

      if (mcRuns > 0) {
        runInBatches(
          config,
          mcRuns,
          (pct) => setMcProgress(pct),
          (summary) => {
            setMcSummary(summary);
            setRunning(false);
          },
        );
      } else {
        setMcSummary(null);
        setRunning(false);
      }
    }, 20);
  }

  const chartData = detailedResult ? detailedResult.trajectory.map((b, i) => ({ hand: i, bankroll: b })) : [];

  return (
    <div className="tab-content simulator-tab">
      <section className="panel">
        <h2>Monte Carlo Simulator</h2>
        <p>
          Every hand in this simulator is played with perfect Basic Strategy — the same engine behind the chart
          above. Pick a betting strategy to size the wager round to round, then run a single detailed session or
          thousands of sessions at once to see the real range of outcomes, not just a single average.
        </p>
        <p className="fine-print">
          Cards are drawn from an idealized shoe (each rank equally likely on every draw) and a pair is split at
          most once, matching how the chart and Hand Trainer already treat hands — results will be close to but
          not identical to a real, depleting multi-deck shoe with unlimited re-splitting.
        </p>
      </section>

      <section className="panel controls-panel">
        <div className="control-group strategy-select-group">
          <span>Betting strategy</span>
          <div className="strategy-options">
            {BETTING_OPTIONS.map((s) => (
              <button key={s.id} className={`strategy-option ${bettingStrategy === s.id ? 'active' : ''}`} onClick={() => setBettingStrategy(s.id)}>
                <strong>{s.label}</strong>
              </button>
            ))}
          </div>
        </div>

        {bettingStrategy === 'paroli' && (
          <label className="straight-number-input">
            <span>Paroli max consecutive wins before reset</span>
            <input type="number" min={1} max={10} value={paroliCap} onChange={(e) => setParoliCap(Number(e.target.value))} />
          </label>
        )}

        <RuleControls rules={rules} onChange={setRules} />

        <div className="field-grid">
          <label>
            <span className="field-label-row">Starting bankroll ($)</span>
            <input type="number" min={10} step={10} value={startingBankroll} onChange={(e) => setStartingBankroll(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">Base unit ($)</span>
            <input type="number" min={1} step={1} value={baseUnit} onChange={(e) => setBaseUnit(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">Table maximum ($)</span>
            <input type="number" min={1} step={10} value={tableMax} onChange={(e) => setTableMax(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">Hands</span>
            <input type="number" min={1} max={5000} step={10} value={maxHands} onChange={(e) => setMaxHands(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              <input type="checkbox" checked={useStopLoss} onChange={(e) => setUseStopLoss(e.target.checked)} /> Stop-loss ($)
            </span>
            <input type="number" min={0} step={10} value={stopLoss} disabled={!useStopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              <input type="checkbox" checked={useStopWin} onChange={(e) => setUseStopWin(e.target.checked)} /> Stop-win ($)
            </span>
            <input type="number" min={0} step={10} value={stopWin} disabled={!useStopWin} onChange={(e) => setStopWin(Number(e.target.value))} />
          </label>
        </div>

        <div className="control-group">
          <span>Monte Carlo sessions</span>
          <div className="button-row">
            <button className={mcRuns === 0 ? 'active' : ''} onClick={() => setMcRuns(0)}>
              Single run only
            </button>
            {MC_RUN_OPTIONS.map((n) => (
              <button key={n} className={mcRuns === n ? 'active' : ''} onClick={() => setMcRuns(n)}>
                {n.toLocaleString()} sessions
              </button>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="warning-text" role="alert">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <div className="sim-meta">
          <span>Perfect Basic Strategy is used for every decision in this simulator.</span>
          <button className="run-button" onClick={handleRun} disabled={running || !canRun}>
            {running ? (mcRuns > 0 ? `Running… ${mcProgress}%` : 'Running…') : 'Run simulation'}
          </button>
        </div>
      </section>

      <div aria-live="polite">
        {detailedResult && ranConfig && (
          <>
            <section className="panel strategy-ran-banner">
              <span className="strategy-ran-label">Simulated:</span>
              <strong>{BETTING_OPTIONS.find((s) => s.id === ranConfig.bettingStrategy)?.label}</strong>
              <span className="strategy-ran-detail">
                · ${ranConfig.baseUnit} base unit · stopped: {detailedResult.stopReason}
              </span>
            </section>

            <section className="panel stats-panel">
              <div className="stat">
                <span className="stat-label">Ending bankroll</span>
                <span className="stat-value">${detailedResult.finalBankroll.toFixed(0)}</span>
                <span className="stat-sub">started at ${ranConfig.startingBankroll}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Net result</span>
                <span className="stat-value">${(detailedResult.finalBankroll - ranConfig.startingBankroll).toFixed(0)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Hands completed</span>
                <span className="stat-value">{detailedResult.handsCompleted}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wins / Losses / Pushes</span>
                <span className="stat-value">{detailedResult.wins} / {detailedResult.losses} / {detailedResult.pushes}</span>
                <span className="stat-sub">{((detailedResult.wins / Math.max(1, detailedResult.handsCompleted)) * 100).toFixed(1)}% win rate</span>
              </div>
              <div className="stat">
                <span className="stat-label">Blackjacks dealt</span>
                <span className="stat-value">{detailedResult.blackjacks}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total wagered</span>
                <span className="stat-value">${detailedResult.totalWagered.toFixed(0)}</span>
                <span className="stat-sub">avg ${(detailedResult.totalWagered / Math.max(1, detailedResult.handsCompleted)).toFixed(2)}/hand</span>
              </div>
              <div className="stat">
                <span className="stat-label">Largest wager</span>
                <span className="stat-value">${detailedResult.largestWager.toFixed(0)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Max drawdown</span>
                <span className="stat-value">${detailedResult.maxDrawdown.toFixed(0)}</span>
              </div>
            </section>

            <section className="panel">
              <h3>Bankroll over time (this run)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hand" tick={{ fontSize: 11 }} label={{ value: 'Hand #', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Bankroll']} labelFormatter={(l) => `Hand ${l}`} />
                  <Area type="monotone" dataKey="bankroll" stroke="#f4d35e" fill="#f4d35e22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </section>
          </>
        )}

        {mcSummary && (
          <>
            <section className="panel">
              <h3>Bankroll distribution ({mcRuns.toLocaleString()} sessions)</h3>
              <div className="kpi-row-mini">
                <span className="kpi-mini kpi-mini-positive">{mcSummary.profitablePct.toFixed(1)}% profitable</span>
                <span className="kpi-mini kpi-mini-negative">{mcSummary.ruinPct.toFixed(1)}% ended in ruin</span>
              </div>
              <div className="stats-panel">
                <div className="stat">
                  <span className="stat-label">Average ending bankroll</span>
                  <span className="stat-value">${mcSummary.averageFinal.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Median ending bankroll</span>
                  <span className="stat-value">${mcSummary.medianFinal.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg hand win rate</span>
                  <span className="stat-value">{mcSummary.avgHandWinRate.toFixed(1)}%</span>
                  <span className="stat-sub">{mcSummary.avgHandPushRate.toFixed(1)}% pushed</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg max drawdown</span>
                  <span className="stat-value">${mcSummary.avgMaxDrawdown.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg largest wager</span>
                  <span className="stat-value">${mcSummary.avgLargestWager.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg blackjacks / session</span>
                  <span className="stat-value">{mcSummary.avgBlackjacksPerTrial.toFixed(1)}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mcSummary.histogram}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'Sessions']} />
                  <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
                    {mcSummary.histogram.map((entry, i) => (
                      <Cell key={i} fill={entry.winning ? '#3d9970' : '#c0392b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h3>Bankroll over time (percentile bands across sessions)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mcSummary.trajectoryPercentiles}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hand" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<BankrollTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="p95" name="95th pct" stroke="#3d9970" strokeOpacity={0.5} strokeWidth={1} dot={false} />
                  <Area type="monotone" dataKey="p75" name="75th pct" stroke="#3d9970" fill="#3d997022" strokeWidth={1} />
                  <Line type="monotone" dataKey="p50" name="Median" stroke="#f4d35e" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="p25" name="25th pct" stroke="#c0392b" fill="#c0392b22" strokeWidth={1} />
                  <Line type="monotone" dataKey="p5" name="5th pct" stroke="#c0392b" strokeOpacity={0.5} strokeWidth={1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </section>
          </>
        )}

        {detailedResult && detailedResult.handHistory.length > 0 && (
          <section className="panel">
            <h3>Hand history</h3>
            <div className="bet-table-wrapper spin-history-table">
              <table className="bet-table">
                <thead>
                  <tr>
                    <th>Hand</th>
                    <th>Wager</th>
                    <th>Outcome</th>
                    <th>Profit</th>
                    <th>Bankroll</th>
                    <th>Betting state</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedResult.handHistory.map((h) => (
                    <tr key={h.handNumber}>
                      <td>{h.handNumber}</td>
                      <td>${h.wager.toFixed(2)}</td>
                      <td className={`outcome-cell outcome-cell--${h.outcome}`}>{h.outcome}</td>
                      <td>{h.profit >= 0 ? '+' : ''}{h.profit.toFixed(2)}</td>
                      <td>${h.bankrollAfter.toFixed(2)}</td>
                      <td>{h.bettingStateLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <section className="panel responsible-gambling-panel">
        <h3>Play responsibly</h3>
        <p className="fine-print">
          This simulator shows the actual range of outcomes under perfect play, not just a theoretical average.
          Blackjack still carries a house edge even with perfect Basic Strategy, and no betting strategy changes
          that — a run of losses can and will happen. Set financial and time limits before you play, and treat
          gambling as entertainment.
        </p>
      </section>
    </div>
  );
}
