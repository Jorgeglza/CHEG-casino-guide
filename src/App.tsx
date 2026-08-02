import { useState } from 'react';
import CrapsModule from './modules/craps/CrapsModule';

interface ModuleDef {
  id: string;
  label: string;
  component: React.ComponentType;
  available: boolean;
}

const MODULES: ModuleDef[] = [
  { id: 'craps', label: 'Craps', component: CrapsModule, available: true },
  { id: 'blackjack', label: 'Blackjack', component: CrapsModule, available: false },
  { id: 'roulette', label: 'Roulette', component: CrapsModule, available: false },
];

function App() {
  const [activeModule, setActiveModule] = useState('craps');
  const current = MODULES.find((m) => m.id === activeModule) ?? MODULES[0];
  const ActiveModule = current.component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="brand-logo" />
          <span className="brand-wordmark">
            CHEG <span className="brand-accent">Casino Guide</span>
          </span>
        </div>
        <nav className="module-nav">
          {MODULES.map((m) => (
            <button
              key={m.id}
              className={`module-button ${activeModule === m.id ? 'active' : ''} ${!m.available ? 'disabled' : ''}`}
              onClick={() => m.available && setActiveModule(m.id)}
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
        <ActiveModule />
      </main>
      <footer className="app-footer">
        <p>Educational guide. House edges are long-run theoretical averages — no strategy overcomes them.</p>
      </footer>
    </div>
  );
}

export default App;
