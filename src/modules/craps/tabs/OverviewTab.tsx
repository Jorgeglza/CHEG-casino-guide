import { useMemo, useState } from 'react';
import CrapsBoard, { type BoardPhase } from '../components/CrapsBoard';
import FlowDiagram, { type FlowNodeId } from '../components/FlowDiagram';

const DEMO_POINT = 6;

interface StepDef {
  title: string;
  desc: string;
  boardPhase: BoardPhase;
  flowNode: FlowNodeId;
  dice?: [number, number];
  oddsOn: boolean;
}

interface OverviewTabProps {
  onNavigate?: (tabId: string) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<'win' | 'lose'>('win');

  const steps: StepDef[] = useMemo(
    () => [
      {
        title: 'Step 1 — Come-out roll',
        desc: 'Every round starts with a come-out roll. Players bet the Pass Line before the shooter throws. A 7 or 11 wins instantly; a 2, 3, or 12 loses instantly. Any other number becomes "the point."',
        boardPhase: 'come-out',
        flowNode: 'comeout',
        oddsOn: false,
      },
      {
        title: `Step 2 — Point established (${DEMO_POINT})`,
        desc: `The shooter rolled a ${DEMO_POINT}. Pass Line bets stay up, and the puck flips to "On." Now the shooter keeps rolling until a ${DEMO_POINT} or a 7 shows up — that's the whole game from here.`,
        boardPhase: 'point',
        flowNode: 'pointset',
        dice: [4, 2],
        oddsOn: false,
      },
      {
        title: 'Step 3 — Odds become available',
        desc: 'Once a point exists, players can back their Pass Line with an Odds bet — a side bet that pays true odds instead of casino odds. This is where strategy starts to matter; see the Strategy tab for the full breakdown.',
        boardPhase: 'point',
        flowNode: 'odds',
        oddsOn: true,
      },
      {
        title: outcome === 'win' ? `Step 4 — ${DEMO_POINT} repeats: Pass Line wins` : 'Step 4 — 7 rolls first: seven-out',
        desc:
          outcome === 'win'
            ? `The shooter rolled the point (${DEMO_POINT}) again before a 7. Pass Line and Odds bets both pay out, and the round continues.`
            : 'The shooter "sevened-out" before repeating the point. Pass Line and Odds bets lose, and the dice pass to the next shooter — the round is over.',
        boardPhase: outcome === 'win' ? 'win' : 'lose',
        flowNode: outcome === 'win' ? 'pointwin' : 'sevenout',
        dice: outcome === 'win' ? [4, 2] : [4, 3],
        oddsOn: true,
      },
    ],
    [outcome],
  );

  const current = steps[step];

  return (
    <div className="tab-content overview-tab">
      <section className="panel">
        <h2>Welcome to Craps</h2>
        <p>
          Craps is a dice game built around one simple loop: a come-out roll, then a point. It looks chaotic at the
          table — dozens of bet types, a stickman calling numbers, chips flying everywhere — but the game itself
          boils down to a short, learnable sequence. This module walks you through it.
        </p>
        <div className="module-tour">
          <button onClick={() => onNavigate?.('rules')}>
            <strong>Rules & How to Play</strong>
            <span>Plain-language walkthrough of turns, terms, and the come-out/point sequence.</span>
          </button>
          <button onClick={() => onNavigate?.('strategy')}>
            <strong>Strategy</strong>
            <span>The real numbers — probability and house edge for every section of the board, before and after the point.</span>
          </button>
          <button onClick={() => onNavigate?.('simulator')}>
            <strong>Monte Carlo Simulator</strong>
            <span>Run thousands of simulated sessions to see the real range of outcomes, not just the average.</span>
          </button>
          <button onClick={() => onNavigate?.('reference')}>
            <strong>Bet Reference</strong>
            <span>Every bet on the layout, sorted by house edge, with payouts and notes.</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>How a round plays out</h3>
        <p>Every round of craps follows the same tree. The green paths are where a Pass Line bet wins.</p>
        <FlowDiagram active={current.flowNode} />
      </section>

      <section className="panel board-panel">
        <div className="walkthrough-header">
          <span className="step-tag">
            {step + 1} / {steps.length}
          </span>
          <h3>{current.title}</h3>
        </div>
        <CrapsBoard
          phase={current.boardPhase}
          point={DEMO_POINT}
          oddsOn={current.oddsOn}
          betSize={15}
          oddsMultiple={3}
          dice={current.dice}
        />
        <p className="board-caption">{current.desc}</p>
        <div className="stepper-controls">
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            ← Back
          </button>
          <div className="step-dots">
            {steps.map((_, i) => (
              <button
                key={i}
                className={`step-dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          {step < steps.length - 1 ? (
            <button className="primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
              Next →
            </button>
          ) : (
            <div className="outcome-toggle">
              <button className={outcome === 'win' ? 'active' : ''} onClick={() => setOutcome('win')}>
                Show a win
              </button>
              <button className={outcome === 'lose' ? 'active' : ''} onClick={() => setOutcome('lose')}>
                Show a seven-out
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="panel cta-panel">
        <div>
          <h3>Want the actual numbers?</h3>
          <p>The Strategy tab breaks down probability and house edge for every section of the board, before and after the point is set.</p>
        </div>
        <button className="primary" onClick={() => onNavigate?.('strategy')}>
          Go to Strategy →
        </button>
      </section>
    </div>
  );
}
