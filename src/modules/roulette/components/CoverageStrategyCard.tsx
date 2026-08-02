import { useMemo, useState } from 'react';
import { computeCoverageOutcome, coverageNumbers } from '../engine/coverageStrategies';
import RouletteTable from './RouletteTable';
import EdgeBadge from './EdgeBadge';
import type { CoverageStrategyDef, RouletteVariant } from '../types/roulette';

interface CoverageStrategyCardProps {
  def: CoverageStrategyDef;
  variant: RouletteVariant;
}

export default function CoverageStrategyCard({ def, variant }: CoverageStrategyCardProps) {
  const [totalStake, setTotalStake] = useState(def.defaultTotalStake);

  // Voisins du Zero only holds together as wheel-neighbor logic on the single-zero
  // wheel — always evaluate it on European, and say so, rather than silently
  // mislabeling American coverage as the same classic bet.
  const effectiveVariant: RouletteVariant = def.variant === 'both' ? variant : def.variant;
  const restricted = def.variant !== 'both' && def.variant !== variant;

  const numbers = useMemo(() => coverageNumbers(def), [def]);
  const outcome = useMemo(
    () => computeCoverageOutcome(def, effectiveVariant, Math.max(0, totalStake)),
    [def, effectiveVariant, totalStake],
  );

  const wheelSizeLabel = effectiveVariant === 'european' ? '37' : '38';

  return (
    <div className="coverage-strategy-card">
      <div className="coverage-strategy-header">
        <div>
          <strong>{def.label}</strong>
          {restricted && <span className="one-roll-tag">European only — shown on European wheel</span>}
        </div>
        <EdgeBadge edge={outcome.houseEdgePct} size="sm" />
      </div>
      <p className="chart-note">{def.description}</p>

      <RouletteTable
        variant={effectiveVariant}
        selection={{ type: def.legs[0].betType, numbers }}
      />

      <div className="coverage-legs">
        {def.legs.map((leg) => (
          <span key={leg.label} className="bet-chip bet-chip--neutral">
            {leg.label} · {leg.units}u
          </span>
        ))}
      </div>

      <label className="straight-number-input">
        <span>Total stake across all legs ($)</span>
        <input
          type="number"
          min={0}
          step={1}
          value={totalStake}
          onChange={(e) => setTotalStake(Number(e.target.value))}
        />
      </label>

      <div className="coverage-stats-grid">
        <div className="stat">
          <span className="stat-label">Numbers covered</span>
          <span className="stat-value">
            {outcome.numbersCovered}/{wheelSizeLabel}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Chance of hitting</span>
          <span className="stat-value">{(outcome.hitProbability * 100).toFixed(1)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">If it misses</span>
          <span className="stat-value stat-value--negative">-${outcome.worstCaseLoss.toFixed(0)}</span>
          <span className="stat-sub">every leg's stake is lost</span>
        </div>
        <div className="stat">
          <span className="stat-label">If it hits (average)</span>
          <span className="stat-value stat-value--positive">+${outcome.averageProfitIfHit.toFixed(0)}</span>
          <span className="stat-sub">best case +${outcome.bestCaseProfit.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
