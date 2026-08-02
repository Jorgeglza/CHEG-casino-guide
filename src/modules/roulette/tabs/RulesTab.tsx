import { betCoverage, houseEdgeOf } from '../engine/rouletteMath';
import RouletteWheel from '../components/RouletteWheel';
import RouletteTable from '../components/RouletteTable';

const EU_STRAIGHT_EDGE = houseEdgeOf('straight', { numbers: [17] }, 'european');
const US_STRAIGHT_EDGE = houseEdgeOf('straight', { numbers: [17] }, 'american');
const EU_EVEN_MONEY_EDGE = houseEdgeOf('red', undefined, 'european');
const US_EVEN_MONEY_EDGE = houseEdgeOf('red', undefined, 'american');

export default function RulesTab() {
  return (
    <div className="tab-content rules-tab">
      <section className="panel">
        <h2>How to Play Roulette</h2>
        <p>
          Roulette is a bet on where a spinning ball will land on a wheel of numbered pockets. You don't control the
          wheel — you're simply choosing which number, group of numbers, or property (color, parity, range) you
          think the ball will land in or match.
        </p>
      </section>

      <section className="panel">
        <h3>Round sequence</h3>
        <ol>
          <li>Players place chips on the betting layout, covering whichever numbers or properties they want.</li>
          <li>The dealer closes betting ("no more bets") once the wheel is spinning.</li>
          <li>The wheel and ball are spun in opposite directions.</li>
          <li>The ball loses momentum and settles into one numbered pocket.</li>
          <li>Losing bets are collected by the house.</li>
          <li>Winning bets are paid out according to the payout table for each bet type.</li>
        </ol>
      </section>

      <section className="panel">
        <h3>Where to bet: the table layout</h3>
        <p>
          This is the betting layout (or "felt") — separate from the wheel that decides the outcome. You place chips
          here, not on the wheel. The 0 (and 00 on American tables) sit in their own column on the left; numbers
          1-36 fill the grid to their right; the three column boxes and three dozen boxes sit directly beneath the
          grid; and the six outside-bet boxes — Low/High, Even/Odd, Red/Black — sit at the very bottom.
        </p>
        <RouletteTable variant="american" selection={{ type: 'red', numbers: betCoverage('red') }} />
        <p className="chart-note">
          Highlighted above: what a Red bet looks like — every red number lights up, because a single chip in the
          "Red" box at the bottom wins if the ball lands on any of them. That's the same idea behind every bet type:
          one chip placement, one set of covered numbers. The Bet Reference and Simulator tabs let you see this
          highlighting update live for any bet you pick.
        </p>
      </section>

      <section className="panel">
        <h3>Wheel variants</h3>
        <div className="wheel-compare-row">
          <div className="wheel-compare-item">
            <RouletteWheel variant="european" size={200} />
            <span>European — 37 pockets</span>
          </div>
          <div className="wheel-compare-item">
            <RouletteWheel variant="american" size={200} />
            <span>American — 38 pockets</span>
          </div>
        </div>
        <ul>
          <li>
            <strong>European (single-zero)</strong> — 37 pockets: 1-36 plus a single green 0. The recommended variant
            whenever it's offered, since the single zero halves the house edge relative to American wheels on most
            bets.
          </li>
          <li>
            <strong>American (double-zero)</strong> — 38 pockets: 1-36 plus a green 0 and a green 00. The extra
            pocket roughly doubles the house edge on every standard bet compared to European.
          </li>
        </ul>
        <div className="callout callout--warning">
          <strong>Triple-zero wheels exist at some casinos</strong> (1-36 plus 0, 00, and a third zero-like pocket) and
          carry an even higher house edge than American double-zero wheels. They are not modeled in this guide's
          simulator — treat any triple-zero table as the worst mathematical option on the floor.
        </div>
        <p>
          Extra zero pockets exist purely to shift the odds toward the house: every zero added dilutes the 1-in-36
          chance of any given number without changing the payout, which is what produces the house edge.
        </p>
      </section>

      <section className="panel">
        <h3>Number properties</h3>
        <p>Every number 1-36 has five properties. Zero and 00 have none of them — they are excluded from color, parity, range, dozen, and column bets entirely.</p>
        <div className="term-grid">
          <div><strong>Color</strong><span>Red or black for 1-36. 0 and 00 are green, not red or black.</span></div>
          <div><strong>Parity</strong><span>Odd or even for 1-36. 0 and 00 are neither odd nor even.</span></div>
          <div><strong>Range</strong><span>Low (1-18) or High (19-36). 0 and 00 belong to neither range.</span></div>
          <div><strong>Dozen</strong><span>1st (1-12), 2nd (13-24), or 3rd (25-36). 0 and 00 are in no dozen.</span></div>
          <div><strong>Column</strong><span>One of three 12-number columns running down the layout. 0 and 00 are in no column.</span></div>
        </div>
      </section>

      <section className="panel">
        <h3>Inside bets</h3>
        <ul>
          <li><strong>Straight up</strong> — a single number, including 0 or 00. Pays 35:1.</li>
          <li><strong>Split</strong> — two adjacent numbers on the layout. Pays 17:1.</li>
          <li><strong>Street</strong> — a full row of three numbers. Pays 11:1.</li>
          <li><strong>Corner</strong> — four numbers forming a 2x2 block. Pays 8:1.</li>
          <li><strong>Six line</strong> — two adjacent rows, six numbers. Pays 5:1.</li>
          <li><strong>Trio</strong> — three numbers including at least one zero (e.g. 0-1-2). Pays 11:1.</li>
          <li><strong>Basket / top line</strong> — American-only, covers 0, 00, 1, 2, 3 (five numbers). Pays 6:1. This bet doesn't exist on a European wheel and carries a distinctly worse house edge than standard American bets.</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Outside bets</h3>
        <ul>
          <li><strong>Red / Black</strong> — 18 numbers each. Pays 1:1.</li>
          <li><strong>Odd / Even</strong> — 18 numbers each (0 and 00 excluded). Pays 1:1.</li>
          <li><strong>Low (1-18) / High (19-36)</strong> — 18 numbers each. Pays 1:1.</li>
          <li><strong>Dozens</strong> — 12 numbers each (1st/2nd/3rd 12). Pays 2:1.</li>
          <li><strong>Columns</strong> — 12 numbers each. Pays 2:1.</li>
        </ul>
      </section>

      <section className="panel">
        <h3>House edge</h3>
        <p>
          Every roulette bet pays as if the wheel had one fewer zero pocket than it actually does — that gap is the
          house edge. It's the same underlying mechanism on every bet type; only the size of the gap changes because
          the payout odds are identical whether you're on a European or American wheel.
        </p>
        <pre className="edge-worked-example">
{`European straight-up bet:
Probability of winning: 1/37
Net payout when winning: 35 units profit (plus the 1-unit stake returned)
Expected value: (1/37 x 35) - (36/37 x 1) = -1/37 ~= ${EU_STRAIGHT_EDGE.toFixed(2)}%`}
        </pre>
        <pre className="edge-worked-example">
{`American straight-up bet:
Probability of winning: 1/38
Expected loss per unit wagered: 2/38 ~= ${US_STRAIGHT_EDGE.toFixed(2)}%`}
        </pre>
        <p>
          Even-money outside bets carry the same house edge as every other standard bet on each wheel —{' '}
          {EU_EVEN_MONEY_EDGE.toFixed(2)}% European, {US_EVEN_MONEY_EDGE.toFixed(2)}% American — despite paying 1:1,
          because the zero pocket(s) still beat every outside bet along with every inside one.
        </p>
      </section>

      <section className="panel">
        <h3>Special European/French rules (optional)</h3>
        <p>
          These are optional table rules some European and French tables offer on even-money outside bets — they are
          not universal, and you should confirm with the table before assuming either is in effect.
        </p>
        <div className="callout">
          <strong>La Partage</strong> — if the ball lands on 0, even-money outside bets get half their stake back
          instead of losing the whole bet. This roughly halves the effective house edge on those bets when offered.
        </div>
        <div className="callout">
          <strong>En Prison</strong> — if the ball lands on 0, even-money outside bets are "imprisoned" for one more
          spin instead of settling immediately. If the next spin wins, the full stake is returned with no profit; if
          it loses, the stake is lost. The long-run expected value is equivalent to La Partage.
        </div>
      </section>
    </div>
  );
}
