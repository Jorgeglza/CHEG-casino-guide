import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
            <h3>Bankroll over time (10th / 50th / 90th percentile)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="roll" tick={{ fontSize: 11 }} label={{ value: 'Roll #', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${Number(v).toFixed(0)}`} labelFormatter={(l) => `Roll ${l}`} />
                <Legend />
                <Area type="monotone" dataKey="p90" name="90th pct" stroke="#3d9970" fill="#3d997022" strokeWidth={1} />
                <Line type="monotone" dataKey="p50" name="Median" stroke="#f4d35e" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="p10" name="10th pct" stroke="#c0392b" fill="#c0392b22" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="panel">
            <h3>Final bankroll distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.histogram}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Trials" fill="#457b9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </div>
  );
}
