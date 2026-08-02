import { useState } from 'react';
import RuleControls from '../components/RuleControls';
import StrategyChart from '../components/StrategyChart';
import {
  BANKROLL_SECTION,
  BASIC_STRATEGY_SECTION,
  BETTING_SYSTEMS,
  BETTING_SYSTEMS_DISCLAIMER,
  CARD_COUNTING_SECTION,
  FLAT_BETTING_SECTION,
  HI_LO_EXPLANATION,
  HI_LO_TABLE,
  RESPONSIBLE_GAMBLING_DISCLAIMER,
} from '../data/strategyContent';
import { DEFAULT_RULES } from '../types/blackjack';
import type { EducationSection } from '../data/strategyContent';

function Section({ section }: { section: EducationSection }) {
  return (
    <section className="panel">
      <h3>{section.heading}</h3>
      {section.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {section.bullets && (
        <ul>
          {section.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function StrategyTab() {
  const [rules, setRules] = useState(DEFAULT_RULES);

  const isDefaultRules =
    rules.decks === DEFAULT_RULES.decks &&
    rules.dealerHitsSoft17 === DEFAULT_RULES.dealerHitsSoft17 &&
    rules.doubleAfterSplit === DEFAULT_RULES.doubleAfterSplit &&
    rules.lateSurrender === DEFAULT_RULES.lateSurrender;

  return (
    <div className="tab-content strategy-tab">
      <section className="panel">
        <h2>Basic Strategy Chart</h2>
        <p>
          The correct action for every player hand against every dealer upcard, given the table rules selected
          below. Defaults shown: 6 decks, dealer stands on soft 17, double after split allowed, late surrender
          allowed.
        </p>
        <RuleControls rules={rules} onChange={setRules} />
        {!isDefaultRules && (
          <p className="chart-note">Chart updated for your selected rules — this differs from the default chart above.</p>
        )}
      </section>

      <section className="panel">
        <StrategyChart rules={rules} />
      </section>

      <Section section={BASIC_STRATEGY_SECTION} />
      <Section section={BANKROLL_SECTION} />
      <Section section={FLAT_BETTING_SECTION} />

      <section className="panel card-counting-panel">
        <h4>{CARD_COUNTING_SECTION.heading}</h4>
        {CARD_COUNTING_SECTION.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <div className="bet-table-wrapper">
          <table className="bet-table">
            <thead>
              <tr>
                <th>Cards</th>
                <th>Hi-Lo value</th>
              </tr>
            </thead>
            <tbody>
              {HI_LO_TABLE.map((row) => (
                <tr key={row.cards}>
                  <td>{row.cards}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="chart-note">{HI_LO_EXPLANATION.runningCount}</p>
        <p className="chart-note">{HI_LO_EXPLANATION.trueCount}</p>
      </section>

      <section className="panel">
        <h3>Optional Betting Systems</h3>
        <div className="guide-card-list">
          {BETTING_SYSTEMS.map((system) => (
            <div className="guide-card" key={system.id}>
              <div className="guide-card-header">
                <strong>{system.label}</strong>
              </div>
              <p className="chart-note">{system.summary}</p>
              <ul>
                {system.howItWorks.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="strategy-house-edge-note">{BETTING_SYSTEMS_DISCLAIMER}</p>
      </section>

      <section className="panel disclaimer-panel">
        <h3>Play responsibly</h3>
        <ul>
          {RESPONSIBLE_GAMBLING_DISCLAIMER.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
