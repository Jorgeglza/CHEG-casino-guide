export default function RulesTab() {
  return (
    <div className="tab-content rules-tab">
      <section className="panel">
        <h2>How to Play Blackjack</h2>
        <p>
          Blackjack is played against the dealer, not against other players at the table. You beat the dealer by:
        </p>
        <ul>
          <li>Having a higher total than the dealer without exceeding 21.</li>
          <li>The dealer exceeding 21 ("busting") while your hand stands.</li>
          <li>Receiving a natural Blackjack (an Ace and a 10-value card) when the dealer does not.</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Card values</h3>
        <ul>
          <li><strong>2-10</strong> — use their face value.</li>
          <li><strong>Face cards (J, Q, K)</strong> — count as 10.</li>
          <li><strong>Ace</strong> — counts as 1 or 11, whichever makes the better hand without busting.</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Main actions</h3>
        <div className="term-grid">
          <div><strong>Hit</strong><span>Take another card.</span></div>
          <div><strong>Stand</strong><span>Take no more cards and keep your current total.</span></div>
          <div><strong>Double down</strong><span>Double your wager, take exactly one more card, then stand.</span></div>
          <div><strong>Split</strong><span>Turn a pair into two separate hands, each with its own wager.</span></div>
          <div><strong>Surrender</strong><span>Forfeit the hand immediately and get half your wager back.</span></div>
          <div><strong>Insurance</strong><span>A side bet offered when the dealer shows an Ace, paying 2:1 if the dealer has Blackjack.</span></div>
        </div>
      </section>

      <section className="panel">
        <h3>Dealer rules</h3>
        <p>
          The dealer has no choices to make — they follow a fixed set of rules and must hit until reaching at
          least 17.
        </p>
        <ul>
          <li><strong>Dealer stands on soft 17</strong> — the dealer stops hitting on any 17, including a soft 17 (e.g. Ace + 6). Slightly better for the player.</li>
          <li><strong>Dealer hits soft 17</strong> — the dealer keeps hitting on a soft 17, only stopping on a hard 17 or higher. Slightly worse for the player.</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Blackjack payout</h3>
        <p>
          Look for tables where <strong>Blackjack pays 3:2</strong> — this is the standard, fair payout for a
          natural Blackjack.
        </p>
        <p>
          Tables where <strong>Blackjack pays 6:5</strong> are significantly worse for the player and should
          generally be avoided in favor of a 3:2 table.
        </p>
      </section>

      <section className="panel">
        <h3>Push</h3>
        <p>
          When the player's total and the dealer's total are equal (and neither busts), the hand is a push —
          the player's wager is simply returned, with no win or loss.
        </p>
      </section>

      <section className="panel">
        <h3>Insurance</h3>
        <p>
          Insurance is generally not recommended for players following Basic Strategy — it is a separate side bet
          on whether the dealer has Blackjack, and over the long run it does not favor the player even though it
          occasionally pays out.
        </p>
      </section>

      <section className="panel">
        <h3>Splitting rules</h3>
        <ul>
          <li>Split equal-value cards when the table permits it, turning one hand into two.</li>
          <li>Split Aces commonly receive only one additional card each, with no further hitting or re-splitting.</li>
          <li>Whether you can double down after splitting varies by table — check the Bet Reference tab's rules checklist.</li>
        </ul>
      </section>
    </div>
  );
}
