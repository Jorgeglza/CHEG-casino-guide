import { useState } from 'react';
import Hand from '../components/Hand';
import PlayingCard from '../components/PlayingCard';
import { availableActions } from '../engine/handMath';
import { evaluateAnswer, generateQuestion, type AnswerResult } from '../engine/trainer';
import { DEFAULT_RULES } from '../types/blackjack';
import type { BlackjackAction, TrainerFilter, TrainerQuestion, TrainerStats } from '../types/blackjack';

const FILTERS: { id: TrainerFilter; label: string }[] = [
  { id: 'all', label: 'All hand types' },
  { id: 'hard', label: 'Hard hands' },
  { id: 'soft', label: 'Soft hands' },
  { id: 'pairs', label: 'Pairs' },
];

const ACTION_LABEL: Record<BlackjackAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
};

export default function HandTrainerTab() {
  const [filter, setFilter] = useState<TrainerFilter>('all');
  const [question, setQuestion] = useState<TrainerQuestion>(() => generateQuestion('all', DEFAULT_RULES));
  const [result, setResult] = useState<{ chosen: BlackjackAction; answer: AnswerResult } | null>(null);
  const [stats, setStats] = useState<TrainerStats>({ correct: 0, total: 0 });

  function newHand(nextFilter: TrainerFilter = filter) {
    setQuestion(generateQuestion(nextFilter, DEFAULT_RULES));
    setResult(null);
  }

  function handleFilterChange(nextFilter: TrainerFilter) {
    setFilter(nextFilter);
    newHand(nextFilter);
  }

  function handleAnswer(action: BlackjackAction) {
    if (result) return;
    const answer = evaluateAnswer(question, action, DEFAULT_RULES);
    setResult({ chosen: action, answer });
    setStats((s) => ({ correct: s.correct + (answer.correct ? 1 : 0), total: s.total + 1 }));
  }

  function handleReset() {
    setStats({ correct: 0, total: 0 });
    newHand();
  }

  const actions = availableActions(question.playerCards, DEFAULT_RULES, true);
  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);

  return (
    <div className="tab-content hand-trainer-tab">
      <section className="panel">
        <h2>Hand Trainer</h2>
        <p>Practice reading a hand and picking the Basic Strategy action, without playing out a full game.</p>
        <div className="control-group">
          <span>Hand type</span>
          <div className="button-row">
            {FILTERS.map((f) => (
              <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => handleFilterChange(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="trainer-score-row">
          <span className="kpi-mini">Score: {stats.correct} / {stats.total}</span>
          <span className="kpi-mini">Accuracy: {accuracy}%</span>
          <button className="reset-button" onClick={handleReset}>Reset</button>
        </div>
      </section>

      <section className="panel trainer-table-panel">
        <div className="trainer-dealer">
          <span className="bj-hand-label">Dealer shows</span>
          <PlayingCard card={question.dealerUpcard} />
        </div>

        <Hand cards={question.playerCards} label="Your hand" />

        <div className="trainer-actions">
          {actions.map((action) => (
            <button
              key={action}
              className={`trainer-action-button ${result?.chosen === action ? (result.answer.correct ? 'correct' : 'incorrect') : ''}`}
              disabled={!!result}
              onClick={() => handleAnswer(action)}
            >
              {ACTION_LABEL[action]}
            </button>
          ))}
        </div>

        {result && (
          <div className={`trainer-feedback ${result.answer.correct ? 'trainer-feedback--correct' : 'trainer-feedback--incorrect'}`}>
            <strong>{result.answer.correct ? 'Correct!' : 'Not quite.'}</strong>
            <p>{result.answer.explanation}</p>
            <button className="reset-button" onClick={() => newHand()}>
              Next hand
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
