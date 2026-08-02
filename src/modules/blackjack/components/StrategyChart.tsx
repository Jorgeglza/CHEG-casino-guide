import { useMemo } from 'react';
import { ABBREVIATION_LABELS, DEALER_COLUMNS } from '../engine/basicStrategy';
import { buildStrategyChart } from '../engine/strategyChart';
import ActionBadge from './ActionBadge';
import type { BlackjackRules, StrategyAbbreviation } from '../types/blackjack';

interface StrategyChartProps {
  rules: BlackjackRules;
}

const LEGEND: StrategyAbbreviation[] = ['H', 'S', 'D', 'Ds', 'P', 'Ph', 'Rh', 'Rs'];

function ChartSection({ title, rowHeader, rowLabels, cells }: { title: string; rowHeader: string; rowLabels: string[]; cells: ReturnType<typeof buildStrategyChart>['hard']['cells'] }) {
  return (
    <div className="strategy-chart-section">
      <h4>{title}</h4>
      <div className="bet-table-wrapper">
        <table className="bet-table strategy-chart-table">
          <thead>
            <tr>
              <th>{rowHeader}</th>
              {DEALER_COLUMNS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((label, rowIndex) => (
              <tr key={label}>
                <td className="strategy-chart-row-label">{label}</td>
                {cells[rowIndex].map((cell, colIndex) => (
                  <td key={colIndex}>
                    <ActionBadge abbreviation={cell.abbreviation} size="sm" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StrategyChart({ rules }: StrategyChartProps) {
  const chart = useMemo(() => buildStrategyChart(rules), [rules]);

  return (
    <div className="strategy-chart">
      <ChartSection title="Hard Totals" rowHeader="Hand" rowLabels={chart.hard.rowLabels} cells={chart.hard.cells} />
      <ChartSection title="Soft Totals" rowHeader="Hand" rowLabels={chart.soft.rowLabels} cells={chart.soft.cells} />
      <ChartSection title="Pairs" rowHeader="Pair" rowLabels={chart.pairs.rowLabels} cells={chart.pairs.cells} />

      <div className="strategy-chart-legend">
        <h4>Legend</h4>
        <div className="strategy-chart-legend-grid">
          {LEGEND.map((abbr) => (
            <div key={abbr} className="strategy-chart-legend-item">
              <ActionBadge abbreviation={abbr} size="sm" />
              <span>{ABBREVIATION_LABELS[abbr]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
