import type { BlackjackRules } from '../types/blackjack';

interface RuleControlsProps {
  rules: BlackjackRules;
  onChange: (rules: BlackjackRules) => void;
}

const DECK_OPTIONS = [1, 2, 4, 6, 8];

export default function RuleControls({ rules, onChange }: RuleControlsProps) {
  return (
    <div className="rule-controls">
      <div className="control-group">
        <span>Decks</span>
        <div className="button-row">
          {DECK_OPTIONS.map((d) => (
            <button
              key={d}
              className={rules.decks === d ? 'active' : ''}
              onClick={() => onChange({ ...rules, decks: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <span>Dealer on soft 17</span>
        <div className="button-row">
          <button
            className={!rules.dealerHitsSoft17 ? 'active' : ''}
            onClick={() => onChange({ ...rules, dealerHitsSoft17: false })}
          >
            Stands (S17)
          </button>
          <button
            className={rules.dealerHitsSoft17 ? 'active' : ''}
            onClick={() => onChange({ ...rules, dealerHitsSoft17: true })}
          >
            Hits (H17)
          </button>
        </div>
      </div>

      <div className="control-group">
        <span>Double after split</span>
        <div className="button-row">
          <button
            className={rules.doubleAfterSplit ? 'active' : ''}
            onClick={() => onChange({ ...rules, doubleAfterSplit: true })}
          >
            Allowed
          </button>
          <button
            className={!rules.doubleAfterSplit ? 'active' : ''}
            onClick={() => onChange({ ...rules, doubleAfterSplit: false })}
          >
            Not allowed
          </button>
        </div>
      </div>

      <div className="control-group">
        <span>Late surrender</span>
        <div className="button-row">
          <button
            className={rules.lateSurrender ? 'active' : ''}
            onClick={() => onChange({ ...rules, lateSurrender: true })}
          >
            Available
          </button>
          <button
            className={!rules.lateSurrender ? 'active' : ''}
            onClick={() => onChange({ ...rules, lateSurrender: false })}
          >
            Not available
          </button>
        </div>
      </div>
    </div>
  );
}
