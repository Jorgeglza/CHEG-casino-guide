interface HomeModuleProps {
  onNavigate: (moduleId: string) => void;
}

interface GameCard {
  id: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
  diagram: React.ReactNode;
}

const EDGE_COMPARISON = [
  { label: 'Blackjack (Basic Strategy)', value: 0.75, display: '≈$0.50–$1.00' },
  { label: 'Craps (Pass Line)', value: 1.41, display: '≈$1.41' },
  { label: 'European Roulette', value: 2.7, display: '≈$2.70' },
  { label: 'American Roulette', value: 5.26, display: '≈$5.26' },
];

const MAX_EDGE = Math.max(...EDGE_COMPARISON.map((e) => e.value));

const STEPS = [
  { title: 'Learn the rules', desc: 'Plain-language walkthroughs of how each game is played.' },
  { title: 'Review the strategy', desc: 'See the math behind every bet — probability and house edge.' },
  { title: 'Practice with the tools', desc: 'Run the simulator or hand trainer to build intuition.' },
];

function DiceDiagram() {
  return (
    <svg viewBox="0 0 120 70" className="home-diagram" role="img" aria-label="Two dice showing four and three">
      <rect x="6" y="10" width="50" height="50" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="3.2" fill="var(--accent)" />
      <circle cx="42" cy="24" r="3.2" fill="var(--accent)" />
      <circle cx="20" cy="46" r="3.2" fill="var(--accent)" />
      <circle cx="42" cy="46" r="3.2" fill="var(--accent)" />
      <rect x="64" y="14" width="50" height="50" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="89" cy="39" r="3.2" fill="var(--accent-2)" />
      <circle cx="76" cy="26" r="3.2" fill="var(--accent-2)" />
      <circle cx="102" cy="52" r="3.2" fill="var(--accent-2)" />
    </svg>
  );
}

function RouletteDiagram() {
  const segments = 12;
  const cx = 60;
  const cy = 40;
  const rOuter = 32;
  const rInner = 12;
  const slices = Array.from({ length: segments }, (_, i) => {
    const a0 = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + rOuter * Math.cos(a0);
    const y0 = cy + rOuter * Math.sin(a0);
    const x1 = cx + rOuter * Math.cos(a1);
    const y1 = cy + rOuter * Math.sin(a1);
    const color = i === 0 ? '#0e6b45' : i % 2 === 0 ? '#c0392b' : '#1a1a1a';
    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rOuter} ${rOuter} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
        fill={color}
        stroke="var(--bg)"
        strokeWidth="0.75"
      />
    );
  });
  return (
    <svg viewBox="0 0 120 80" className="home-diagram" role="img" aria-label="Roulette wheel">
      {slices}
      <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="2.5" fill="var(--accent)" />
    </svg>
  );
}

function CardHandDiagram() {
  return (
    <svg viewBox="0 0 120 80" className="home-diagram" role="img" aria-label="Two playing cards, ace and king">
      <g transform="translate(35, 44) rotate(-12)">
        <rect x="-19" y="-27" width="38" height="54" rx="5" fill="#f5f5f0" stroke="var(--border)" strokeWidth="1.2" />
        <text x="-13" y="-12" fontSize="12" fontWeight="700" fill="#c0392b">A</text>
        <text x="-13" y="20" fontSize="12" fill="#c0392b">♥</text>
      </g>
      <g transform="translate(70, 40) rotate(10)">
        <rect x="-19" y="-27" width="38" height="54" rx="5" fill="#f5f5f0" stroke="var(--border)" strokeWidth="1.2" />
        <text x="-13" y="-12" fontSize="12" fontWeight="700" fill="#14171f">K</text>
        <text x="-13" y="20" fontSize="12" fill="#14171f">♠</text>
      </g>
    </svg>
  );
}

const GAME_CARDS: GameCard[] = [
  {
    id: 'craps',
    title: 'Craps',
    description: 'A dice game built around one simple loop: a come-out roll, then a point.',
    features: ['Strategy & house edge by bet', 'Monte Carlo simulator', 'Rules walkthrough', 'Bet reference table'],
    cta: 'Explore Craps',
    diagram: <DiceDiagram />,
  },
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'Bet on where the ball lands. Wheel layout changes the odds more than most players realize.',
    features: ['European vs. American house edge', 'Strategy guide comparison', 'Simulator', 'Bet reference table'],
    cta: 'Explore Roulette',
    diagram: <RouletteDiagram />,
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    description: 'The one table game where skilled play meaningfully lowers the house edge.',
    features: ['Basic Strategy chart', 'Hand Trainer', 'Monte Carlo simulator', 'Bet reference table'],
    cta: 'Explore Blackjack',
    diagram: <CardHandDiagram />,
  },
];

export default function HomeModule({ onNavigate }: HomeModuleProps) {
  return (
    <div className="tab-content home-tab">
      <section className="panel hero-panel">
        <h1 className="hero-title">Casino Games, Explained Clearly</h1>
        <p className="hero-desc">
          CHEG Casino Guide helps you understand the rules, bets, probabilities, and common strategies behind
          popular casino games — so you know what's actually happening at the table.
        </p>
        <button className="primary hero-cta" onClick={() => onNavigate('craps')}>
          Explore the Games →
        </button>
      </section>

      <section className="home-cards-grid">
        {GAME_CARDS.map((game) => (
          <div key={game.id} className="panel home-card">
            <div className="home-card-diagram-wrap">{game.diagram}</div>
            <h3>{game.title}</h3>
            <p>{game.description}</p>
            <ul className="home-card-features">
              {game.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="primary home-card-cta" onClick={() => onNavigate(game.id)}>
              {game.cta}
            </button>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Expected loss per $100 wagered</h2>
        <p>A rough sense of the house edge across common rule sets, based on the mathematical average.</p>
        <div className="edge-bar-list home-comparison-list">
          {EDGE_COMPARISON.map((row) => (
            <div key={row.label} className="edge-bar-row">
              <span className="edge-bar-label">{row.label}</span>
              <div className="edge-bar-track">
                <div className="edge-bar-fill" style={{ width: `${(row.value / MAX_EDGE) * 100}%` }} />
              </div>
              <span className="edge-bar-amount">{row.display}</span>
            </div>
          ))}
        </div>
        <p className="fine-print">
          These are long-run theoretical averages. Actual results vary — a short session can look very different
          from the math, in either direction.
        </p>
      </section>

      <section className="panel">
        <h2>How to use this guide</h2>
        <div className="home-steps">
          {STEPS.map((step, i) => (
            <div key={step.title} className="home-step">
              <span className="step-tag">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel callout callout--warning home-disclaimer">
        <strong>Play responsibly</strong>
        <p>
          Strategies can reduce mistakes but do not guarantee profit. Every casino game carries a built-in house
          advantage. Treat gambling as entertainment, not income, and set spending limits before you play.
        </p>
      </section>
    </div>
  );
}
