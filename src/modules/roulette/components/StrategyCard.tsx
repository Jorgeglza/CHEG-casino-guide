import type { StrategyMeta } from '../data/rouletteStrategies';
import { HOUSE_EDGE_DISCLAIMER } from '../data/rouletteStrategies';

interface StrategyCardProps {
  strategy: StrategyMeta;
  expanded: boolean;
  onToggle: () => void;
}

const RISK_LABEL: Record<StrategyMeta['riskLevel'], string> = {
  low: 'Low risk',
  moderate: 'Moderate risk',
  high: 'High risk',
  'very-high': 'Very high risk',
};

export default function StrategyCard({ strategy, expanded, onToggle }: StrategyCardProps) {
  const bodyId = `strategy-body-${strategy.id}`;

  return (
    <div className={`strategy-card ${expanded ? 'expanded' : ''}`}>
      <button type="button" className="strategy-card-header" onClick={onToggle} aria-expanded={expanded} aria-controls={bodyId}>
        <div className="strategy-card-title">
          <strong>{strategy.label}</strong>
          <span className="strategy-card-category">{strategy.categoryLabel}</span>
        </div>
        <span className={`risk-pill risk-pill--${strategy.riskLevel}`}>{RISK_LABEL[strategy.riskLevel]}</span>
      </button>
      {expanded && (
        <div className="strategy-card-body" id={bodyId}>
          <dl className="strategy-fact-grid">
            <div>
              <dt>Recommended bet</dt>
              <dd>{strategy.recommendedBet}</dd>
            </div>
            <div>
              <dt>Starting unit</dt>
              <dd>{strategy.startingUnit}</dd>
            </div>
            <div>
              <dt>After a win</dt>
              <dd>{strategy.winRule}</dd>
            </div>
            <div>
              <dt>After a loss</dt>
              <dd>{strategy.lossRule}</dd>
            </div>
            <div>
              <dt>Reset condition</dt>
              <dd>{strategy.resetCondition}</dd>
            </div>
            <div>
              <dt>Complexity</dt>
              <dd>{strategy.complexityLevel}</dd>
            </div>
          </dl>

          <div className="strategy-progression">
            <span className="strategy-progression-label">Example progression (units):</span>
            <div className="strategy-progression-values">
              {strategy.exampleProgression.map((v, i) => (
                <span key={i} className="strategy-progression-chip">
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="strategy-pros-cons">
            <div>
              <h4>Advantages</h4>
              <ul>
                {strategy.advantages.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Limitations</h4>
              <ul>
                {strategy.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="strategy-bankroll-warning">{strategy.bankrollWarning}</p>
          <p className="strategy-house-edge-note">{HOUSE_EDGE_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}
