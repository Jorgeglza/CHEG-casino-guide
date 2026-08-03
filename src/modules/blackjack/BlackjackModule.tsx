import { useHashRoute } from '../../useHashRoute';
import StrategyTab from './tabs/StrategyTab';
import SimulatorTab from './tabs/SimulatorTab';
import HandTrainerTab from './tabs/HandTrainerTab';
import RulesTab from './tabs/RulesTab';
import BetReferenceTab from './tabs/BetReferenceTab';

const TAB_IDS = ['strategy', 'simulator', 'trainer', 'rules', 'reference'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  strategy: 'Strategy',
  simulator: 'Monte Carlo Simulator',
  trainer: 'Hand Trainer',
  rules: 'Rules',
  reference: 'Bet Reference',
};

export default function BlackjackModule() {
  const { tab, navigate } = useHashRoute();
  const activeTab: TabId = TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'strategy';

  return (
    <div className="module">
      <nav className="tab-nav">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            className={activeTab === id ? 'tab-button active' : 'tab-button'}
            onClick={() => navigate('blackjack', id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </nav>
      {activeTab === 'strategy' && <StrategyTab />}
      {activeTab === 'simulator' && <SimulatorTab />}
      {activeTab === 'trainer' && <HandTrainerTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'reference' && <BetReferenceTab />}
    </div>
  );
}
