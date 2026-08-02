// Random question generation and answer checking for the Hand Trainer tab. Always defers
// to getBasicStrategyAction() for the "correct" answer so the trainer can never contradict
// the Strategy chart.

import { getBasicStrategyAction, ABBREVIATION_LABELS } from './basicStrategy';
import { cardValue, dealerUpcardRank, handTotal, handType, pairRankKey } from './handMath';
import type { BlackjackAction, BlackjackRules, Card, Rank, Suit, TrainerFilter, TrainerQuestion } from '../types/blackjack';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const NON_ACE_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PAIR_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const DEALER_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCard(rank: Rank): Card {
  return { rank, suit: randomOf(SUITS) };
}

function randomDealerCard(): Card {
  return randomCard(randomOf(DEALER_RANKS));
}

function generateHardHand(): Card[] {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const r1 = randomOf(NON_ACE_RANKS);
    const r2 = randomOf(NON_ACE_RANKS);
    if (cardValue(r1) === cardValue(r2)) continue; // keep hard/pair categories distinct
    const total = cardValue(r1) + cardValue(r2);
    if (total >= 5 && total <= 20) {
      return [randomCard(r1), randomCard(r2)];
    }
  }
  return [randomCard('10'), randomCard('6')]; // fallback: hard 16
}

function generateSoftHand(): Card[] {
  const secondRank = randomOf(['2', '3', '4', '5', '6', '7', '8', '9'] as Rank[]);
  return [randomCard('A'), randomCard(secondRank)];
}

function generatePairHand(): Card[] {
  const rank = randomOf(PAIR_RANKS);
  if (rank === '10') {
    const tenRanks: Rank[] = ['10', 'J', 'Q', 'K'];
    return [randomCard(randomOf(tenRanks)), randomCard(randomOf(tenRanks))];
  }
  return [randomCard(rank), randomCard(rank)];
}

export function generateQuestion(filter: TrainerFilter, _rules: BlackjackRules): TrainerQuestion {
  const resolvedType = filter === 'all' ? randomOf(['hard', 'soft', 'pair'] as const) : filter === 'pairs' ? 'pair' : filter;

  const playerCards =
    resolvedType === 'pair' ? generatePairHand() : resolvedType === 'soft' ? generateSoftHand() : generateHardHand();

  return {
    playerCards,
    dealerUpcard: randomDealerCard(),
    handType: resolvedType === 'pair' ? 'pair' : resolvedType,
  };
}

export interface AnswerResult {
  correct: boolean;
  correctAction: BlackjackAction;
  explanation: string;
}

function describeHand(question: TrainerQuestion): string {
  if (question.handType === 'pair') {
    return `a pair of ${question.playerCards[0].rank}s`;
  }
  const { total, isSoft } = handTotal(question.playerCards);
  return isSoft ? `soft ${total}` : `hard ${total}`;
}

export function evaluateAnswer(question: TrainerQuestion, chosenAction: BlackjackAction, rules: BlackjackRules): AnswerResult {
  const type = handType(question.playerCards);
  const { total } = handTotal(question.playerCards);
  const dealer = dealerUpcardRank(question.dealerUpcard);

  const cell =
    type === 'pair'
      ? getBasicStrategyAction({ type: 'pair', pairRank: pairRankKey(question.playerCards) }, dealer, rules)
      : getBasicStrategyAction({ type, total }, dealer, rules);

  const correct = cell.action === chosenAction;
  const handDescription = describeHand(question);
  const explanation = `With ${handDescription} against a dealer ${dealer}, Basic Strategy says ${ABBREVIATION_LABELS[cell.abbreviation]} (${cell.abbreviation}) — resolving to ${cell.action}.`;

  return { correct, correctAction: cell.action, explanation };
}
