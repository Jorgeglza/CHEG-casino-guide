import { useState } from 'react';
import OverviewTab from './tabs/OverviewTab';
import StrategyTab from './tabs/StrategyTab';
import SimulatorTab from './tabs/SimulatorTab';
import RulesTab from './tabs/RulesTab';
import BetReferenceTab from './tabs/BetReferenceTab';

const TAB_IDS = ['overview', 'strategy', 'simulator', 'rules', 'reference'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  strategy: 'Strategy',
  simulator: 'Monte Carlo Simulator',
  rules: 'Rules & How to Play',
  reference: 'Bet Reference',
};

export default function CrapsModule() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="module">
      <nav className="tab-nav">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            className={activeTab === id ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </nav>
      {activeTab === 'overview' && <OverviewTab onNavigate={(id) => setActiveTab(id as TabId)} />}
      {activeTab === 'strategy' && <StrategyTab />}
      {activeTab === 'simulator' && <SimulatorTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'reference' && <BetReferenceTab />}
    </div>
  );
}
