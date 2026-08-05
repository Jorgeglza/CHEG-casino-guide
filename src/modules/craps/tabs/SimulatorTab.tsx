import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { runInBatches, simulateSingleRun, type SimConfig, type SimSummary, type TrialResult } from '../engine/simulate';
import { combinedHouseEdge, STRATEGIES, type StrategyId } from '../engine/bets';
import { STAKING_STRATEGIES, type CrapsStakingStrategy } from '../engine/strategyEngine';
import { HOUSE_EDGE_DISCLAIMER, RESPONSIBLE_GAMBLING_NOTICE } from '../data/crapsStrategies';
import InfoTip from '../components/InfoTip';

const ODDS_OPTIONS = [0, 1, 2, 3, 5, 10];
const MC_RUN_OPTIONS = [100, 1000, 10000];

const OUTCOME_COLOR: Record<'win' | 'lose' | 'neutral', string> = {
  win: '#3d9970',
  lose: '#c0392b',
  neutral: '#8d99ae',
};

const BANKROLL_SERIES: { key: 'p95' | 'p75' | 'p50' | 'p25' | 'p5'; label: string; color: string; opacity: number }[] = [
  { key: 'p95', label: '95th pct', color: '#3d9970', opacity: 0.5 },
  { key: 'p75', label: '75th pct', color: '#3d9970', opacity: 1 },
  { key: 'p50', label: 'Median', color: '#f4d35e', opacity: 1 },
  { key: 'p25', label: '25th pct', color: '#c0392b', opacity: 1 },
  { key: 'p5', label: '5th pct', color: '#c0392b', opacity: 0.5 },
];

function BankrollLegend() {
  return (
    <ul className="dice-roll-tooltip-legend">
      {BANKROLL_SERIES.map((s) => (
        <li key={s.key}>
          <span className="legend-swatch" style={{ background: s.color, opacity: s.opacity }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function BankrollTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: SimSummary['trajectoryPercentiles'][number] }[];
  label?: number;
}) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;

  return (
    <div className="dice-roll-tooltip">
      <strong>Roll {label}</strong>
      <ul>
        {BANKROLL_SERIES.map((s) => (
          <li key={s.key}>
            <span className="legend-swatch" style={{ background: s.color, opacity: s.opacity }} />
            {s.label}
            <span className="dice-roll-tooltip-count">${Number(row[s.key]).toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiceRollTooltip({ active, payload }: { active?: boolean; payload?: { payload: SimSummary['rollDistribution'][number] }[] }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0].payload;
  const totalRolls = entry.win + entry.lose + entry.neutral;

  return (
    <div className="dice-roll-tooltip">
      <strong>Roll total: {entry.total}</strong>
      <span className="dice-roll-tooltip-total">{totalRolls.toLocaleString()} rolls</span>
      <ul>
        {entry.stages.map((s) => (
          <li key={s.key}>
            <span className="legend-swatch" style={{ background: OUTCOME_COLOR[s.outcome] }} />
            {s.label}
            <span className="dice-roll-tooltip-count">
              {s.count.toLocaleString()} ({((s.count / totalRolls) * 100).toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STOP_REASON_LABEL: Record<TrialResult['stopReason'], string> = {
  'max-rolls': 'reached roll limit',
  'stop-loss': 'hit stop-loss',
  'stop-win': 'hit stop-win',
  ruin: 'bankroll ruined',
  'table-max-exceeded': 'wager would exceed table max',
};

export default function SimulatorTab() {
  const [startingBankroll, setStartingBankroll] = useState(500);
  const [baseUnit, setBaseUnit] = useState(15);
  const [oddsMultiple, setOddsMultiple] = useState(3);
  const [tableMax, setTableMax] = useState(500);
  const [strategy, setStrategy] = useState<StrategyId>('pass-odds');
  const [stakingStrategy, setStakingStrategy] = useState<CrapsStakingStrategy>('flat');
  const [paroliCap, setParoliCap] = useState(3);
  const [maxRolls, setMaxRolls] = useState(200);
  const [useStopLoss, setUseStopLoss] = useState(false);
  const [stopLoss, setStopLoss] = useState(200);
  const [useStopWin, setUseStopWin] = useState(false);
  const [stopWin, setStopWin] = useState(900);
  const [mcRuns, setMcRuns] = useState(500);

  const [running, setRunning] = useState(false);
  const [mcProgress, setMcProgress] = useState(0);
  const [detailedResult, setDetailedResult] = useState<TrialResult | null>(null);
  const [mcSummary, setMcSummary] = useState<SimSummary | null>(null);
  const [ranConfig, setRanConfig] = useState<SimConfig | null>(null);

  const edge = combinedHouseEdge(oddsMultiple);

  function buildConfig(): SimConfig {
    return {
      startingBankroll,
      baseUnit,
      oddsMultiple,
      tableMax,
      maxRolls,
      trials: mcRuns,
      strategy,
      stakingStrategy,
      paroliCap,
      stopLoss: useStopLoss ? stopLoss : undefined,
      stopWin: useStopWin ? stopWin : undefined,
    };
  }

  const handleRun = () => {
    setRunning(true);
    setMcProgress(0);
    const config = buildConfig();
    // allow UI to paint before the (synchronous) crunch
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
  };

  const chartData = useMemo(() => mcSummary?.trajectoryPercentiles ?? [], [mcSummary]);
  const ranStrategyDef = ranConfig ? STRATEGIES.find((s) => s.id === ranConfig.strategy) : null;
  const ranStakingDef = ranConfig ? STAKING_STRATEGIES.find((s) => s.id === ranConfig.stakingStrategy) : null;
  const singleChartData = useMemo(
    () => (detailedResult ? detailedResult.trajectory.map((b, i) => ({ roll: i, bankroll: b })) : []),
    [detailedResult],
  );

  return (
    <div className="tab-content simulator-tab">
      <section className="panel">
        <h2>Monte Carlo Simulator</h2>
        <p>
          Pick which bets you'll have working, how you'll size your Pass Line wager round to round, then run a
          single detailed session or thousands of sessions at once to see the real range of outcomes — not just the
          theoretical average. Variance is huge in craps; the house edge tells you what happens over millions of
          rolls, not what happens to you tonight.
        </p>
        <p className="fine-print">{HOUSE_EDGE_DISCLAIMER}</p>
      </section>

      <section className="panel controls-panel">
        <div className="control-group strategy-select-group">
          <span>
            Bets working
            <InfoTip text="Which bets get placed once a point is established, on top of the Pass Line + Odds. This should match the plan you'd actually use at the table — check the Strategy tab if you're not sure which to pick." />
          </span>
          <div className="strategy-options">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                className={`strategy-option ${strategy === s.id ? 'active' : ''}`}
                onClick={() => setStrategy(s.id)}
              >
                <strong>{s.label}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-group strategy-select-group">
          <span>
            Staking system
            <InfoTip text="How the Pass Line wager (and everything scaled off it — Odds, Place bets) is sized from one come-out to the next, based on whether the last Pass Line decision won or lost. This changes bankroll volatility, not the house edge — see the Strategy Guide tab for a side-by-side comparison." />
          </span>
          <div className="strategy-options">
            {STAKING_STRATEGIES.map((s) => (
              <button
                key={s.id}
                className={`strategy-option ${stakingStrategy === s.id ? 'active' : ''}`}
                onClick={() => setStakingStrategy(s.id)}
              >
                <strong>{s.label}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>
          {stakingStrategy === 'paroli' && (
            <label className="straight-number-input">
              <span>Paroli max consecutive wins before reset</span>
              <input type="number" min={1} max={10} value={paroliCap} onChange={(e) => setParoliCap(Number(e.target.value))} />
            </label>
          )}
        </div>

        <div className="field-grid">
          <label>
            <span className="field-label-row">
              Starting bankroll ($)
              <InfoTip text="How much money you're bringing to the table for this session. Higher bankrolls survive variance better, but the house edge still applies to every dollar wagered. Try $200–$1000 to compare." />
            </span>
            <input
              type="number"
              min={10}
              step={10}
              value={startingBankroll}
              onChange={(e) => setStartingBankroll(Number(e.target.value))}
            />
          </label>
          <label>
            <span className="field-label-row">
              Base unit ($)
              <InfoTip text="Your starting Pass Line wager (and the size used for each Place bet), before the staking system adjusts it round to round. Keep it small relative to your bankroll — roughly 1/30th to 1/50th — so ordinary variance doesn't wipe you out." />
            </span>
            <input type="number" min={5} step={5} value={baseUnit} onChange={(e) => setBaseUnit(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              Table maximum ($)
              <InfoTip text="The most you're allowed to wager on the Pass Line at this table. Progression systems like Martingale can hit this ceiling during a losing streak — when they do, the session stops rather than placing an illegal bet." />
            </span>
            <input type="number" min={5} step={5} value={tableMax} onChange={(e) => setTableMax(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              Odds multiple
              <InfoTip text="How many times your current wager you back the Pass Line with once a point is set. Odds pay true odds — 0% house edge — so higher multiples lower your overall edge, but tie up more bankroll per bet. Use the highest multiple your bankroll and casino allow." />
            </span>
            <select value={oddsMultiple} onChange={(e) => setOddsMultiple(Number(e.target.value))}>
              {ODDS_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'No odds' : `${m}x odds`}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label-row">
              Rolls per session
              <InfoTip text="How many dice rolls to simulate in a single session before stopping — think of it as 'how long you play.' Roughly 100–300 rolls is a typical hour at a live craps table." />
            </span>
            <input type="number" min={10} step={10} value={maxRolls} onChange={(e) => setMaxRolls(Number(e.target.value))} />
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

        <div className="sim-meta">
          <span>
            Theoretical blended house edge (Pass Line + Odds portion): <strong>{edge.toFixed(2)}%</strong>
          </span>
          <button className="run-button" onClick={handleRun} disabled={running}>
            {running ? (mcRuns > 0 ? `Running… ${mcProgress}%` : 'Running…') : 'Run simulation'}
          </button>
        </div>
      </section>

      {detailedResult && ranConfig && ranStrategyDef && ranStakingDef && (
        <>
          <section className="panel strategy-ran-banner">
            <span className="strategy-ran-label">Simulated:</span>
            <strong>{ranStrategyDef.label}</strong>
            <span className="strategy-ran-detail">
              · {ranStakingDef.label} staking · {ranConfig.oddsMultiple === 0 ? 'no odds' : `${ranConfig.oddsMultiple}x odds`} · $
              {ranConfig.baseUnit} base unit · stopped: {STOP_REASON_LABEL[detailedResult.stopReason]}
            </span>
          </section>

          <section className="panel stats-panel">
            <div className="stat">
              <span className="stat-label">Ending bankroll (this run)</span>
              <span className="stat-value">${detailedResult.finalBankroll.toFixed(0)}</span>
              <span className="stat-sub">started at ${ranConfig.startingBankroll}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Net result</span>
              <span className="stat-value">${(detailedResult.finalBankroll - ranConfig.startingBankroll).toFixed(0)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Rolls completed</span>
              <span className="stat-value">{detailedResult.rollsCompleted}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total wagered</span>
              <span className="stat-value">${detailedResult.totalWagered.toFixed(0)}</span>
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
              <AreaChart data={singleChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="roll" tick={{ fontSize: 11 }} label={{ value: 'Roll #', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v}`, 'Bankroll']} labelFormatter={(l) => `Roll ${l}`} />
                <Area type="monotone" dataKey="bankroll" stroke="#f4d35e" fill="#f4d35e22" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {detailedResult.rollHistory.length > 0 && (
            <section className="panel">
              <h3>Roll history</h3>
              <div className="bet-table-wrapper spin-history-table">
                <table className="bet-table">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Dice</th>
                      <th>Event</th>
                      <th>Wager</th>
                      <th>Odds</th>
                      <th>Profit</th>
                      <th>Bankroll</th>
                      <th>Staking state</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResult.rollHistory.map((r) => (
                      <tr key={r.rollNumber}>
                        <td>{r.rollNumber}</td>
                        <td>{r.die1}+{r.die2} = {r.total}</td>
                        <td style={{ color: OUTCOME_COLOR[ROLL_STAGE_OUTCOME[r.stage]] }}>{ROLL_STAGE_LABEL[r.stage]}</td>
                        <td>${r.wager.toFixed(0)}</td>
                        <td>${r.oddsBet.toFixed(0)}</td>
                        <td>{r.profit >= 0 ? '+' : ''}{r.profit.toFixed(0)}</td>
                        <td>${r.bankrollAfter.toFixed(0)}</td>
                        <td>{r.stakingStateLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {mcSummary && (
        <>
          <section className="panel stats-panel">
            <div className="stat">
              <span className="stat-label">Win rate</span>
              <span className="stat-value">{mcSummary.winRate.toFixed(1)}%</span>
              <span className="stat-sub">sessions ending above starting bankroll</span>
            </div>
            <div className="stat">
              <span className="stat-label">Risk of ruin</span>
              <span className="stat-value">{mcSummary.riskOfRuin.toFixed(1)}%</span>
              <span className="stat-sub">sessions that busted the bankroll</span>
            </div>
            <div className="stat">
              <span className="stat-label">Average final bankroll</span>
              <span className="stat-value">${mcSummary.averageFinal.toFixed(0)}</span>
              <span className="stat-sub">started at ${startingBankroll}</span>
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
              <span className="stat-label">Avg total wagered</span>
              <span className="stat-value">${mcSummary.avgTotalWagered.toFixed(0)}</span>
            </div>
          </section>

          <section className="panel">
            <h3>Bankroll over time ({mcRuns.toLocaleString()} sessions)</h3>
            <p className="chart-note">
              Shaded band is the 25th–75th percentile (the typical range — half of all sessions land inside it) with
              the median in gold. Dashed lines mark the 5th/95th percentile tails for reference.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="roll" tick={{ fontSize: 11 }} label={{ value: 'Roll #', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<BankrollTooltip />} />
                <Legend content={<BankrollLegend />} />
                <Line type="monotone" dataKey="p95" name="95th pct" stroke="#3d9970" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 3" dot={false} />
                <Area type="monotone" dataKey="p75" name="75th pct" stroke="#3d9970" fill="#3d997022" strokeWidth={1} />
                <Line type="monotone" dataKey="p50" name="Median" stroke="#f4d35e" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="p25" name="25th pct" stroke="#c0392b" fill="#c0392b22" strokeWidth={1} />
                <Line type="monotone" dataKey="p5" name="5th pct" stroke="#c0392b" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="panel">
            <h3>Final bankroll distribution</h3>
            <p className="chart-note">
              <span className="legend-swatch legend-swatch-win" /> ending at or above starting bankroll (${startingBankroll})
              &nbsp;&nbsp;
              <span className="legend-swatch legend-swatch-lose" /> ending below starting bankroll
            </p>
            <div className="kpi-row-mini">
              <span className="kpi-mini kpi-mini-positive">
                {mcSummary.positiveCount.toLocaleString()} positive ({mcSummary.positivePct.toFixed(1)}%)
              </span>
              <span className="kpi-mini kpi-mini-neutral">
                {mcSummary.neutralCount.toLocaleString()} neutral ({mcSummary.neutralPct.toFixed(1)}%)
              </span>
              <span className="kpi-mini kpi-mini-negative">
                {mcSummary.negativeCount.toLocaleString()} negative ({mcSummary.negativePct.toFixed(1)}%)
              </span>
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
            <h3>Dice roll distribution</h3>
            <p className="chart-note">
              Every roll across all sessions, broken down by whether it moved the bankroll up, down, or left it
              unchanged at that point in the game. Hover a bar for the breakdown by game stage.
              <br />
              <span className="legend-swatch legend-swatch-win" /> winning roll&nbsp;&nbsp;
              <span className="legend-swatch legend-swatch-lose" /> losing roll&nbsp;&nbsp;
              <span className="legend-swatch legend-swatch-neutral" /> no change
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mcSummary.rollDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="total"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Dice total', position: 'insideBottom', offset: -4, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<DiceRollTooltip />} />
                <Legend />
                <Bar dataKey="win" name="Winning roll" stackId="rolls" fill="#3d9970" />
                <Bar dataKey="neutral" name="No change" stackId="rolls" fill="#8d99ae" />
                <Bar dataKey="lose" name="Losing roll" stackId="rolls" fill="#c0392b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}

      <section className="panel responsible-gambling-panel">
        <h3>Play responsibly</h3>
        <ul>
          {RESPONSIBLE_GAMBLING_NOTICE.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const ROLL_STAGE_LABEL: Record<string, string> = {
  naturalWin: 'Natural win',
  crapsLoss: 'Craps loss',
  pointEstablished: 'Point established',
  pointMade: 'Point made',
  sevenOut: 'Seven-out',
  placeWin: 'Place win',
  noAction: 'No action',
};

const ROLL_STAGE_OUTCOME: Record<string, 'win' | 'lose' | 'neutral'> = {
  naturalWin: 'win',
  crapsLoss: 'lose',
  pointEstablished: 'neutral',
  pointMade: 'win',
  sevenOut: 'lose',
  placeWin: 'win',
  noAction: 'neutral',
};
