import { PAYOUT_TABLE, RULES_EFFECT_NOTE, TABLE_RULES_CHECKLIST } from '../data/betReference';

export default function BetReferenceTab() {
  return (
    <div className="tab-content bet-reference-tab">
      <section className="panel">
        <h2>Bet Reference</h2>
        <p>What each outcome pays, and the table rules worth checking for before you sit down.</p>
        <div className="bet-table-wrapper">
          <table className="bet-table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Typical payout</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUT_TABLE.map((row) => (
                <tr key={row.result}>
                  <td>{row.result}</td>
                  <td>{row.payout}</td>
                  <td className="notes-cell">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Table-rules checklist</h3>
        <p>{RULES_EFFECT_NOTE}</p>
        <ul className="rules-checklist">
          {TABLE_RULES_CHECKLIST.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
