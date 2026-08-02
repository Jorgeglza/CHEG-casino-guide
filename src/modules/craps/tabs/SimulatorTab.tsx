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
import { runMonteCarlo, type SimSummary } from '../engine/simulate';
import { combinedHouseEdge, STRATEGIES, type StrategyId } from '../engine/bets';
import InfoTip from '../components/InfoTip';

const ODDS_OPTIONS = [0, 1, 2, 3, 5, 10];

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

export default function SimulatorTab() {
  const [startingBankroll, setStartingBankroll] = useState(500);
  const [betSize, setBetSize] = useState(15);
  const [oddsMultiple, setOddsMultiple] = useState(3);
  const [strategy, setStrategy] = useState<StrategyId>('pass-odds');
  const [maxRolls, setMaxRolls] = useState(200);
  const [trials, setTrials] = useState(500);
  const [result, setResult] = useState<SimSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [ranStrategy, setRanStrategy] = useState<StrategyId | null>(null);
  const [ranOddsMultiple, setRanOddsMultiple] = useState(0);

  const edge = combinedHouseEdge(oddsMultiple);

  const handleRun = () => {
    setRunning(true);
    // allow UI to paint before the (synchronous) crunch
    setTimeout(() => {
      const summary = runMonteCarlo({
        startingBankroll,
        betSize,
        oddsMultiple,
        maxRolls,
        trials,
        strategy,
      });
      setResult(summary);
      setRanStrategy(strategy);
      setRanOddsMultiple(oddsMultiple);
      setRunning(false);
    }, 20);
  };

  const chartData = useMemo(() => result?.trajectoryPercentiles ?? [], [result]);
  const ranStrategyDef = ranStrategy ? STRATEGIES.find((s) => s.id === ranStrategy) : null;

  return (
    <div className="tab-content simulator-tab">
      <section className="panel">
        <h2>Monte Carlo Simulator</h2>
        <p>
          Pick the strategy you actually plan to play, then run thousands of simulated sessions to see the real range
          of outcomes — not just the theoretical average. Variance is huge in craps; the house edge tells you what
          happens over millions of rolls, not what happens to you tonight.
        </p>
      </section>

      <section className="panel controls-panel">
        <div className="control-group strategy-select-group">
          <span>
            Strategy followed
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
              Flat bet size ($)
              <InfoTip text="Your base Pass Line wager (and the size used for each Place bet in the chosen strategy), placed fresh every come-out roll. Keep it small relative to your bankroll — roughly 1/30th to 1/50th — so ordinary variance doesn't wipe you out." />
            </span>
            <input type="number" min={5} step={5} value={betSize} onChange={(e) => setBetSize(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              Odds multiple
              <InfoTip text="How many times your flat bet you back the Pass Line with once a point is set. Odds pay true odds — 0% house edge — so higher multiples lower your overall edge, but tie up more bankroll per bet. Use the highest multiple your bankroll and casino allow." />
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
              Rolls per trial
              <InfoTip text="How many dice rolls to simulate in a single session before stopping — think of it as 'how long you play.' Roughly 100–300 rolls is a typical hour at a live craps table." />
            </span>
            <input type="number" min={10} step={10} value={maxRolls} onChange={(e) => setMaxRolls(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label-row">
              Number of trials
              <InfoTip text="How many independent sessions to simulate and average together. More trials give a smoother, more reliable picture of the range of outcomes, at the cost of more compute time. 500–2000 is usually enough to see clear patterns." />
            </span>
            <input
              type="number"
              min={50}
              step={50}
              max={5000}
              value={trials}
              onChange={(e) => setTrials(Math.min(5000, Number(e.target.value)))}
            />
          </label>
        </div>
        <div className="sim-meta">
          <span>
            Theoretical blended house edge (Pass Line + Odds portion): <strong>{edge.toFixed(2)}%</strong>
          </span>
          <button className="run-button" onClick={handleRun} disabled={running}>
            {running ? 'Running…' : `Run ${trials.toLocaleString()} trials`}
          </button>
        </div>
      </section>

      {result && ranStrategyDef && (
        <>
          <section className="panel strategy-ran-banner">
            <span className="strategy-ran-label">Strategy simulated:</span>
            <strong>{ranStrategyDef.label}</strong>
            <span className="strategy-ran-detail">
              · {ranOddsMultiple === 0 ? 'no odds' : `${ranOddsMultiple}x odds`} · ${betSize} base bet
            </span>
          </section>

          <section className="panel stats-panel">
            <div className="stat">
              <span className="stat-label">Win rate</span>
              <span className="stat-value">{result.winRate.toFixed(1)}%</span>
              <span className="stat-sub">trials ending above starting bankroll</span>
            </div>
            <div className="stat">
              <span className="stat-label">Risk of ruin</span>
              <span className="stat-value">{result.riskOfRuin.toFixed(1)}%</span>
              <span className="stat-sub">trials that busted the bankroll</span>
            </div>
            <div className="stat">
              <span className="stat-label">Average final bankroll</span>
              <span className="stat-value">${result.averageFinal.toFixed(0)}</span>
              <span className="stat-sub">started at ${startingBankroll}</span>
            </div>
          </section>

          <section className="panel">
            <h3>Bankroll over time</h3>
            <p className="chart-note">
              Shaded band is the 25th–75th percentile (the typical range — half of all trials land inside it) with
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
                {result.positiveCount.toLocaleString()} positive ({result.positivePct.toFixed(1)}%)
              </span>
              <span className="kpi-mini kpi-mini-neutral">
                {result.neutralCount.toLocaleString()} neutral ({result.neutralPct.toFixed(1)}%)
              </span>
              <span className="kpi-mini kpi-mini-negative">
                {result.negativeCount.toLocaleString()} negative ({result.negativePct.toFixed(1)}%)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.histogram}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Trials']} />
                <Bar dataKey="count" name="Trials" radius={[4, 4, 0, 0]}>
                  {result.histogram.map((entry, i) => (
                    <Cell key={i} fill={entry.winning ? '#3d9970' : '#c0392b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="panel">
            <h3>Dice roll distribution</h3>
            <p className="chart-note">
              Every roll across all trials, broken down by whether it moved the bankroll up, down, or left it
              unchanged at that point in the game. Hover a bar for the breakdown by game stage.
              <br />
              <span className="legend-swatch legend-swatch-win" /> winning roll&nbsp;&nbsp;
              <span className="legend-swatch legend-swatch-lose" /> losing roll&nbsp;&nbsp;
              <span className="legend-swatch legend-swatch-neutral" /> no change
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={result.rollDistribution}>
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
    </div>
  );
}
