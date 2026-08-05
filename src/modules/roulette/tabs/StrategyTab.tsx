import { useState } from 'react';
import StrategyCard from '../components/StrategyCard';
import CoverageStrategyCard from '../components/CoverageStrategyCard';
import { HOUSE_EDGE_DISCLAIMER, RESPONSIBLE_GAMBLING_NOTICE, STRATEGY_META } from '../data/rouletteStrategies';
import { COVERAGE_STRATEGIES } from '../engine/coverageStrategies';
import type { RouletteStrategy, RouletteVariant } from '../types/roulette';

export default function StrategyTab() {
  const [expanded, setExpanded] = useState<RouletteStrategy | null>('flat');
  const [coverageVariant, setCoverageVariant] = useState<RouletteVariant>('american');

  return (
    <div className="tab-content strategy-tab">
      <section className="panel">
        <h2>Strategy</h2>
        <p>
          Every system on this page changes how your wins and losses are distributed over a session — none of them
          change the underlying odds of any individual spin. Read the recommended baseline first, then use the cards
          below to understand what each named system actually does before trying it in the Simulator.
        </p>
      </section>

      <section className="panel baseline-panel">
        <h3>Recommended baseline approach</h3>
        <ul>
          <li>Prefer <strong>European single-zero</strong> roulette over American double-zero whenever it's available — the house edge is roughly half.</li>
          <li>Use <strong>flat betting</strong> rather than a loss-chasing progression as your default.</li>
          <li>Favor <strong>outside bets</strong> (Red/Black, Odd/Even, 1-18/19-36) if your goal is lower volatility and a longer session.</li>
          <li>Set a fixed <strong>bankroll, unit size, stop-loss, and stop-win</strong> before you sit down — and stick to them.</li>
          <li>No betting progression removes the house edge — it only reshapes when the losses land.</li>
          <li>Treat roulette as entertainment, not as an income strategy.</li>
        </ul>
      </section>

      <section className="panel strategy-cards-panel">
        <h3>How much to bet: staking systems</h3>
        <p className="chart-note">{HOUSE_EDGE_DISCLAIMER}</p>
        <div className="strategy-card-list">
          {STRATEGY_META.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Comparing staking systems</h3>
        <div className="bet-table-wrapper">
          <table className="bet-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Volatility</th>
                <th>Bet growth</th>
                <th>Bankroll demand</th>
                <th>Complexity</th>
                <th>Loss-chasing</th>
                <th>Best use case</th>
              </tr>
            </thead>
            <tbody>
              {STRATEGY_META.map((s) => (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td>{s.volatility}</td>
                  <td>{s.betGrowth}</td>
                  <td>{s.bankrollDemand}</td>
                  <td>{s.complexityLevel}</td>
                  <td>{s.lossChasing}</td>
                  <td className="notes-cell">{s.bestUseCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel coverage-strategies-panel">
        <h3>What to bet on: number coverage</h3>
        <p>
          These strategies answer a different question than the ones above: not <em>how much</em> to wager, but{' '}
          <em>which numbers</em> to cover in a single spin. Each card shows the exact numbers covered on the table,
          the live odds of hitting any of them, and what a hit or a miss is actually worth in dollars for the stake
          you enter.
        </p>
        <div className="control-group">
          <span>Variant</span>
          <div className="button-row">
            <button className={coverageVariant === 'american' ? 'active' : ''} onClick={() => setCoverageVariant('american')}>
              American
            </button>
            <button className={coverageVariant === 'european' ? 'active' : ''} onClick={() => setCoverageVariant('european')}>
              European
            </button>
          </div>
        </div>
        <div className="coverage-strategy-list">
          {COVERAGE_STRATEGIES.map((c) => (
            <CoverageStrategyCard key={c.id} def={c} variant={coverageVariant} />
          ))}
        </div>
        <p className="strategy-house-edge-note">
          Both cards above still carry the same underlying house edge as a single standard bet — covering more
          numbers changes how often you win and by how much, not the long-run expected loss per dollar wagered.
        </p>
      </section>

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
