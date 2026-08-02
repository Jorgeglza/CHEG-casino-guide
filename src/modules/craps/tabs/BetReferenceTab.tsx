import { useMemo, useState } from 'react';
import { betTable } from '../data/betTable';
import EdgeBadge from '../components/EdgeBadge';

type SortKey = 'name' | 'houseEdge' | 'category';

const CATEGORIES = ['All', 'Line', 'Odds', 'Place', 'Field', 'Proposition', 'Hardway'] as const;

export default function BetReferenceTab() {
  const [sortKey, setSortKey] = useState<SortKey>('houseEdge');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');

  const rows = useMemo(() => {
    let data = betTable;
    if (category !== 'All') {
      data = data.filter((b) => b.category === category);
    }
    return [...data].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'category') return a.category.localeCompare(b.category);
      return a.houseEdge - b.houseEdge;
    });
  }, [sortKey, category]);

  return (
    <div className="tab-content bet-reference-tab">
      <section className="panel">
        <h2>Bet Reference</h2>
        <p>Every bet on the craps layout, sorted by house edge. Lower is always better for you.</p>
        <div className="ref-controls">
          <div className="control-group">
            <span>Category</span>
            <div className="button-row">
              {CATEGORIES.map((c) => (
                <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="control-group">
            <span>Sort by</span>
            <div className="button-row">
              <button className={sortKey === 'houseEdge' ? 'active' : ''} onClick={() => setSortKey('houseEdge')}>
                House edge
              </button>
              <button className={sortKey === 'name' ? 'active' : ''} onClick={() => setSortKey('name')}>
                Name
              </button>
              <button className={sortKey === 'category' ? 'active' : ''} onClick={() => setSortKey('category')}>
                Category
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="bet-table-wrapper">
          <table className="bet-table">
            <thead>
              <tr>
                <th>Bet</th>
                <th>Category</th>
                <th>Payout</th>
                <th>True odds</th>
                <th>House edge</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}{b.oneRoll && <span className="one-roll-tag">1-roll</span>}</td>
                  <td>{b.category}</td>
                  <td>{b.payout}</td>
                  <td>{b.trueOdds}</td>
                  <td><EdgeBadge edge={b.houseEdge} size="sm" /></td>
                  <td className="notes-cell">{b.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
