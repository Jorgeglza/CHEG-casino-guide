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
import InfoTip from '../components/InfoTip';
import RouletteTable from '../components/RouletteTable';
import RouletteWheel from '../components/RouletteWheel';
import { betCoverage, houseEdgeOf } from '../engine/rouletteMath';
import { pocketColorOf } from '../engine/wheelOrder';
import { isBetCompatible, runInBatches, simulateSingleRun, type RouletteSimConfig, type RouletteSimSummary, type RouletteTrialResult } from '../engine/simulate';
import { HOUSE_EDGE_DISCLAIMER, RESPONSIBLE_GAMBLING_NOTICE } from '../data/rouletteStrategies';
import type { BetParams, RouletteBetSelection, RouletteBetType, RouletteStrategy, RouletteVariant } from '../types/roulette';

const STRATEGY_OPTIONS: { id: RouletteStrategy; label: string }[] = [
  { id: 'flat', label: 'Flat Betting' },
  { id: 'martingale', label: 'Martingale' },
  { id: 'dalembert', label: "D'Alembert" },
  { id: 'fibonacci', label: 'Fibonacci' },
  { id: 'labouchere', label: 'Labouchère' },
  { id: 'paroli', label: 'Paroli' },
  { id: 'james-bond', label: 'James Bond' },
];

const BET_TYPE_OPTIONS: { id: RouletteBetType; label: string }[] = [
  { id: 'red', label: 'Red' },
  { id: 'black', label: 'Black' },
  { id: 'odd', label: 'Odd' },
  { id: 'even', label: 'Even' },
  { id: 'low', label: '1 to 18' },
  { id: 'high', label: '19 to 36' },
  { id: 'dozen', label: 'Dozen' },
  { id: 'column', label: 'Column' },
  { id: 'straight', label: 'Straight up' },
];

const MC_RUN_OPTIONS = [100, 1000, 10000];

const OUTCOME_COLOR: Record<'win' | 'loss', string> = { win: '#3d9970', loss: '#c0392b' };

function BankrollTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: RouletteSimSummary['trajectoryPercentiles'][number] }[]; label?: number }) {
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
      <strong>Spin {label}</strong>
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
  const [variant, setVariant] = useState<RouletteVariant>('european');
  const [startingBankroll, setStartingBankroll] = useState(500);
  const [baseUnit, setBaseUnit] = useState(5);
  const [tableMax, setTableMax] = useState(500);
  const [strategy, setStrategy] = useState<RouletteStrategy>('flat');
  const [betType, setBetType] = useState<RouletteBetType>('red');
  const [dozenIndex, setDozenIndex] = useState<1 | 2 | 3>(1);
  const [columnIndex, setColumnIndex] = useState<1 | 2 | 3>(1);
  const [straightNumber, setStraightNumber] = useState('17');
  const [maxSpins, setMaxSpins] = useState(200);
  const [useStopLoss, setUseStopLoss] = useState(true);
  const [stopLoss, setStopLoss] = useState(100);
  const [useStopWin, setUseStopWin] = useState(true);
  const [stopWin, setStopWin] = useState(900);
  const [laPartage, setLaPartage] = useState(false);
  const [enPrison, setEnPrison] = useState(false);
  const [labouchereStart, setLabouchereStart] = useState('1,2,3,4');
  const [paroliCap, setParoliCap] = useState(3);
  const [mcRuns, setMcRuns] = useState(0); // 0 = single detailed run only

  const [running, setRunning] = useState(false);
  const [mcProgress, setMcProgress] = useState(0);
  const [detailedResult, setDetailedResult] = useState<RouletteTrialResult | null>(null);
  const [mcSummary, setMcSummary] = useState<RouletteSimSummary | null>(null);
  const [ranConfig, setRanConfig] = useState<RouletteSimConfig | null>(null);

  const betParams: BetParams | undefined = useMemo(() => {
    if (betType === 'dozen') return { dozenIndex };
    if (betType === 'column') return { columnIndex };
    if (betType === 'straight') {
      const raw = straightNumber.trim();
      if (raw === '00') return { numbers: ['00'] };
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0 || n > 36) return undefined;
      return { numbers: [n] };
    }
    return undefined;
  }, [betType, dozenIndex, columnIndex, straightNumber]);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (startingBankroll <= 0) list.push('Starting bankroll must be greater than 0.');
    if (baseUnit <= 0) list.push('Base unit must be greater than 0.');
    if (tableMax <= 0) list.push('Table maximum must be greater than 0.');
    if (baseUnit > tableMax) list.push('Base unit cannot exceed the table maximum.');
    if (maxSpins < 1 || maxSpins > 100000) list.push('Spins must be between 1 and 100,000.');
    if (useStopLoss && (stopLoss < 0 || stopLoss >= startingBankroll)) list.push('Stop-loss must be below the starting bankroll.');
    if (useStopWin && stopWin <= startingBankroll) list.push('Stop-win must be above the starting bankroll.');
    if (betType === 'straight' && !betParams) list.push('Enter a valid straight-up number (0-36, or 00 for American).');
    if (strategy === 'labouchere') {
      const parsed = labouchereStart.split(',').map((s) => Number(s.trim()));
      if (parsed.some((n) => !Number.isFinite(n) || n <= 0)) list.push('Labouchère sequence must be positive numbers separated by commas.');
    }
    if (variant === 'european' && betType === 'straight' && straightNumber.trim() === '00') {
      list.push('00 is only available on the American wheel.');
    }
    return list;
  }, [startingBankroll, baseUnit, tableMax, maxSpins, useStopLoss, stopLoss, useStopWin, stopWin, betType, betParams, strategy, labouchereStart, variant, straightNumber]);

  const compatible = strategy === 'james-bond' || isBetCompatible(strategy, betType);
  const canRun = errors.length === 0 && compatible;

  function buildConfig(): RouletteSimConfig {
    const parsedLabouchere = labouchereStart.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    return {
      variant,
      startingBankroll,
      baseUnit,
      strategy,
      betType,
      betParams,
      maxSpins,
      stopLoss: useStopLoss ? stopLoss : undefined,
      stopWin: useStopWin ? stopWin : undefined,
      tableMax,
      specialRules: { laPartage, enPrison },
      strategyParams: { labouchereStart: parsedLabouchere.length ? parsedLabouchere : undefined, paroliCap },
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

  const chartData = detailedResult
    ? detailedResult.trajectory.map((b, i) => ({ spin: i, bankroll: b }))
    : [];

  const tableSelection: RouletteBetSelection | undefined = betParams || ['red', 'black', 'odd', 'even', 'low', 'high'].includes(betType)
    ? { type: betType, params: betParams, numbers: betCoverage(betType, betParams) }
    : undefined;

  const theoreticalEdge = houseEdgeOf(betType, betParams, variant);

  return (
    <div className="tab-content simulator-tab">
      <section className="panel">
        <h2>Monte Carlo Simulator</h2>
        <p>
          Configure a strategy and bet, then run a single detailed session or thousands of sessions at once to see
          the real range of outcomes — not just the theoretical average house edge.
        </p>
        <p className="fine-print">{HOUSE_EDGE_DISCLAIMER}</p>
      </section>

      <section className="panel controls-panel">
        <div className="control-group">
          <span>Variant</span>
          <div className="button-row">
            <button className={variant === 'european' ? 'active' : ''} onClick={() => setVariant('european')}>
              European
            </button>
            <button className={variant === 'american' ? 'active' : ''} onClick={() => setVariant('american')}>
              American
            </button>
          </div>
        </div>

        <div className="control-group strategy-select-group">
          <span>
            Strategy
            <InfoTip text="The staking system to apply across the session. Progression strategies (Martingale, D'Alembert, Fibonacci, Labouchère, Paroli) only make sense on even-money outside bets." />
          </span>
          <div className="strategy-options">
            {STRATEGY_OPTIONS.map((s) => (
              <button key={s.id} className={`strategy-option ${strategy === s.id ? 'active' : ''}`} onClick={() => setStrategy(s.id)}>
                <strong>{s.label}</strong>
              </button>
            ))}
          </div>
        </div>

        {strategy !== 'james-bond' && (
          <div className="control-group">
            <span>Bet target</span>
            <div className="button-row">
              {BET_TYPE_OPTIONS.map((b) => (
                <button key={b.id} className={betType === b.id ? 'active' : ''} onClick={() => setBetType(b.id)}>
                  {b.label}
                </button>
              ))}
            </div>
            {betType === 'dozen' && (
              <div className="button-row">
                {[1, 2, 3].map((idx) => (
                  <button key={idx} className={dozenIndex === idx ? 'active' : ''} onClick={() => setDozenIndex(idx as 1 | 2 | 3)}>
                    {idx === 1 ? '1st 12' : idx === 2 ? '2nd 12' : '3rd 12'}
                  </button>
                ))}
              </div>
            )}
            {betType === 'column' && (
              <div className="button-row">
                {[1, 2, 3].map((idx) => (
                  <button key={idx} className={columnIndex === idx ? 'active' : ''} onClick={() => setColumnIndex(idx as 1 | 2 | 3)}>
                    Column {idx}
                  </button>
                ))}
              </div>
            )}
            {betType === 'straight' && (
              <label className="straight-number-input">
                <span>Number (0-36{variant === 'american' ? ', or 00' : ''})</span>
                <input type="text" value={straightNumber} onChange={(e) => setStraightNumber(e.target.value)} />
              </label>
            )}
          </div>
        )}

        {!compatible && (
          <p className="warning-text" role="alert">
            {STRATEGY_OPTIONS.find((s) => s.id === strategy)?.label} is designed for even-money bets (Red/Black,
            Odd/Even, 1-18/19-36). Choose an even-money bet target or a different strategy.
          </p>
        )}

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
            <span className="field-label-row">Spins</span>
            <input type="number" min={1} max={100000} step={10} value={maxSpins} onChange={(e) => setMaxSpins(Number(e.target.value))} />
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

        {strategy === 'labouchere' && (
          <label className="straight-number-input">
            <span>Labouchère starting sequence (comma-separated units)</span>
            <input type="text" value={labouchereStart} onChange={(e) => setLabouchereStart(e.target.value)} />
          </label>
        )}
        {strategy === 'paroli' && (
          <label className="straight-number-input">
            <span>Paroli max consecutive wins before reset</span>
            <input type="number" min={1} max={10} value={paroliCap} onChange={(e) => setParoliCap(Number(e.target.value))} />
          </label>
        )}

        {variant === 'european' && ['red', 'black', 'odd', 'even', 'low', 'high'].includes(betType) && (
          <div className="control-group">
            <span>Optional European rules (zero-loss softening)</span>
            <div className="button-row">
              <button className={laPartage ? 'active' : ''} onClick={() => setLaPartage((v) => !v)}>
                La Partage {laPartage ? 'on' : 'off'}
              </button>
              <button className={enPrison ? 'active' : ''} onClick={() => setEnPrison((v) => !v)}>
                En Prison {enPrison ? 'on' : 'off'}
              </button>
            </div>
          </div>
        )}

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
          <span>
            Theoretical house edge: <strong>{theoreticalEdge.toFixed(2)}%</strong>
          </span>
          <button className="run-button" onClick={handleRun} disabled={running || !canRun}>
            {running ? (mcRuns > 0 ? `Running… ${mcProgress}%` : 'Running…') : 'Run simulation'}
          </button>
        </div>
      </section>

      {tableSelection && (
        <section className="panel">
          <h3>Selected bet</h3>
          <RouletteTable variant={variant} selection={tableSelection} />
        </section>
      )}

      <div aria-live="polite">
        {detailedResult && ranConfig && (
          <>
            <section className="panel strategy-ran-banner">
              <span className="strategy-ran-label">Simulated:</span>
              <strong>{STRATEGY_OPTIONS.find((s) => s.id === ranConfig.strategy)?.label}</strong>
              <span className="strategy-ran-detail">
                · {ranConfig.variant} · ${ranConfig.baseUnit} base unit · stopped: {detailedResult.stopReason}
              </span>
            </section>

            {detailedResult.spinHistory.length > 0 && (
              <section className="panel roulette-wheel-panel">
                <h3>Last spin</h3>
                <RouletteWheel
                  variant={ranConfig.variant}
                  highlightedPocket={detailedResult.spinHistory[detailedResult.spinHistory.length - 1].winningNumber}
                  size={220}
                />
              </section>
            )}

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
                <span className="stat-label">Spins completed</span>
                <span className="stat-value">{detailedResult.spinsCompleted}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wins / Losses</span>
                <span className="stat-value">{detailedResult.wins} / {detailedResult.losses}</span>
                <span className="stat-sub">{((detailedResult.wins / Math.max(1, detailedResult.spinsCompleted)) * 100).toFixed(1)}% win rate</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total wagered</span>
                <span className="stat-value">${detailedResult.totalWagered.toFixed(0)}</span>
                <span className="stat-sub">avg ${(detailedResult.totalWagered / Math.max(1, detailedResult.spinsCompleted)).toFixed(2)}/spin</span>
              </div>
              <div className="stat">
                <span className="stat-label">Largest wager</span>
                <span className="stat-value">${detailedResult.largestWager.toFixed(0)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Max drawdown</span>
                <span className="stat-value">${detailedResult.maxDrawdown.toFixed(0)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Peak / Lowest bankroll</span>
                <span className="stat-value">${Math.max(...detailedResult.trajectory).toFixed(0)} / ${Math.min(...detailedResult.trajectory).toFixed(0)}</span>
              </div>
            </section>

            <section className="panel">
              <h3>Bankroll over time (this run)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="spin" tick={{ fontSize: 11 }} label={{ value: 'Spin #', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Bankroll']} labelFormatter={(l) => `Spin ${l}`} />
                  <Area type="monotone" dataKey="bankroll" stroke="#f4d35e" fill="#f4d35e22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h3>Spin history</h3>
              <div className="bet-table-wrapper spin-history-table">
                <table className="bet-table">
                  <thead>
                    <tr>
                      <th>Spin</th>
                      <th>Result</th>
                      <th>Wager</th>
                      <th>Outcome</th>
                      <th>Profit</th>
                      <th>Bankroll</th>
                      <th>Strategy state</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResult.spinHistory.map((s) => (
                      <tr key={s.spinNumber}>
                        <td>{s.spinNumber}</td>
                        <td>
                          <span className={`result-swatch result-swatch--${pocketColorOf(s.winningNumber)}`}>{s.winningNumber}</span>
                        </td>
                        <td>${s.wager.toFixed(2)}</td>
                        <td style={{ color: OUTCOME_COLOR[s.outcome] }}>{s.outcome}</td>
                        <td>{s.profit >= 0 ? '+' : ''}{s.profit.toFixed(2)}</td>
                        <td>${s.bankrollAfter.toFixed(2)}</td>
                        <td>{s.strategyStateLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {mcSummary && (
          <>
            <section className="panel">
              <h3>Monte Carlo results ({mcRuns.toLocaleString()} sessions)</h3>
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
                  <span className="stat-label">Avg max drawdown</span>
                  <span className="stat-value">${mcSummary.avgMaxDrawdown.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg largest wager</span>
                  <span className="stat-value">${mcSummary.avgLargestWager.toFixed(0)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Theoretical house edge</span>
                  <span className="stat-value">{mcSummary.theoreticalHouseEdge.toFixed(2)}%</span>
                </div>
              </div>
              {mcSummary.vsFlatBetting && (
                <p className="chart-note">
                  Compared to flat betting under identical settings: flat betting averaged $
                  {mcSummary.vsFlatBetting.flatAvgFinal.toFixed(0)} ending bankroll with a{' '}
                  {mcSummary.vsFlatBetting.flatRiskOfRuin.toFixed(1)}% risk of ruin.
                </p>
              )}
            </section>

            <section className="panel">
              <h3>Bankroll percentile bands across sessions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mcSummary.trajectoryPercentiles}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="spin" tick={{ fontSize: 11 }} />
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

            <section className="panel">
              <h3>Final bankroll distribution</h3>
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
          </>
        )}
      </div>

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
