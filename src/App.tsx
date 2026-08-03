import { useHashRoute } from './useHashRoute';
import HomeModule from './modules/home/HomeModule';
import CrapsModule from './modules/craps/CrapsModule';
import RouletteModule from './modules/roulette/RouletteModule';
import BlackjackModule from './modules/blackjack/BlackjackModule';

interface ModuleDef {
  id: string;
  label: string;
  component: React.ComponentType;
  available: boolean;
}

const MODULES: ModuleDef[] = [
  { id: 'home', label: 'Home', component: () => null, available: true },
  { id: 'craps', label: 'Craps', component: CrapsModule, available: true },
  { id: 'blackjack', label: 'Blackjack', component: BlackjackModule, available: true },
  { id: 'roulette', label: 'Roulette', component: RouletteModule, available: true },
];

function App() {
  const { module: hashModule, navigate } = useHashRoute();
  const current = MODULES.find((m) => m.id === hashModule && m.available) ?? MODULES[0];
  const activeModule = current.id;
  const ActiveModule = current.component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="brand-logo" />
          <span className="brand-wordmark">
            CHEG <span className="brand-accent">Casino Strategy</span>
          </span>
        </div>
        <nav className="module-nav">
          {MODULES.map((m) => (
            <button
              key={m.id}
              className={`module-button ${activeModule === m.id ? 'active' : ''} ${!m.available ? 'disabled' : ''}`}
              onClick={() => m.available && navigate(m.id)}
              disabled={!m.available}
              title={m.available ? undefined : 'Coming soon'}
            >
              {m.label}
              {!m.available && <span className="soon-tag">soon</span>}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {activeModule === 'home' ? <HomeModule onNavigate={(id) => navigate(id)} /> : <ActiveModule />}
      </main>
      <footer className="app-footer">
        <p>Educational guide. House edges are long-run theoretical averages — no strategy overcomes them.</p>
      </footer>
    </div>
  );
}

export default App;
