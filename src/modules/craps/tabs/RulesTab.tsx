export default function RulesTab() {
  return (
    <div className="tab-content rules-tab">
      <section className="panel">
        <h2>How to Play Craps</h2>
        <p>
          Craps is played with two dice. One player at a time is the "shooter" and rolls for everyone at the table —
          you don't need to be the shooter to bet.
        </p>
      </section>

      <section className="panel">
        <h3>The come-out roll</h3>
        <p>Every round starts with a come-out roll. This is where the action begins:</p>
        <ul>
          <li><strong>7 or 11</strong> — a "natural." Pass Line bets win immediately.</li>
          <li><strong>2, 3, or 12</strong> — "craps." Pass Line bets lose immediately.</li>
          <li>
            <strong>4, 5, 6, 8, 9, or 10</strong> — this number becomes "the point." A marker (the puck) is placed on
            that number and flipped to the "On" side.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h3>The point phase</h3>
        <p>
          Once a point is set, the shooter keeps rolling. Nothing happens on the Pass Line until one of two things
          occurs:
        </p>
        <ul>
          <li>The shooter rolls the point number again — Pass Line bets <strong>win</strong>.</li>
          <li>The shooter rolls a 7 before the point — Pass Line bets <strong>lose</strong> ("seven-out"), and the round ends.</li>
        </ul>
        <p>Any other number rolled during this phase simply has no effect on the Pass Line — the shooter rolls again.</p>
      </section>

      <section className="panel">
        <h3>Key terms</h3>
        <div className="term-grid">
          <div><strong>Shooter</strong><span>The player currently rolling the dice.</span></div>
          <div><strong>Puck</strong><span>The disc marking whether a point is "Off" (come-out) or "On" (point established).</span></div>
          <div><strong>Natural</strong><span>A 7 or 11 on the come-out roll.</span></div>
          <div><strong>Craps</strong><span>A 2, 3, or 12 — loses on the come-out, or a one-roll side bet.</span></div>
          <div><strong>Seven-out</strong><span>Rolling a 7 after a point is established, ending the shooter's turn.</span></div>
          <div><strong>Odds</strong><span>An optional bet behind Pass/Come that pays true odds with no house edge.</span></div>
        </div>
      </section>

      <section className="panel">
        <h3>Where strategy comes in</h3>
        <p>
          Most of the bets on a craps table carry a meaningfully higher house edge than the Pass Line. The Strategy
          tab shows exactly why Pass Line + Odds is the recommended core play, and the Bet Reference tab breaks down
          every other bet on the layout so you know what to avoid.
        </p>
      </section>
    </div>
  );
}
