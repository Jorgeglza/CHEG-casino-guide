// Static copy for the Strategy tab's educational sections, below the Basic Strategy chart.
// Kept as data (not hand-authored JSX per section) so the tab component stays a thin renderer.

export interface EducationSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const BASIC_STRATEGY_SECTION: EducationSection = {
  heading: 'Basic Strategy',
  paragraphs: [
    'Basic Strategy is the mathematically correct decision — hit, stand, double, split, or surrender — for every combination of your hand and the dealer\'s upcard. It is calculated from the exact odds of every outcome, not intuition or streaks.',
    'It is the primary recommended approach in this guide: following it on every hand minimizes the house edge as much as decision-making alone can. It does not eliminate the house edge, and it does not guarantee winning any individual hand or session.',
  ],
};

export const BANKROLL_SECTION: EducationSection = {
  heading: 'Bankroll Management',
  paragraphs: ['How you manage your money matters as much as how you play each hand.'],
  bullets: [
    'Use a fixed betting unit and size every wager as a multiple of it.',
    'Set a session bankroll before you sit down, separate from the rest of your finances.',
    'Set a stop-loss — a point at which you walk away, win or lose.',
    'Avoid increasing bets to try to recover losses ("chasing losses").',
    'Never bet money that is needed for other purposes.',
  ],
};

export const FLAT_BETTING_SECTION: EducationSection = {
  heading: 'Flat Betting',
  paragraphs: [
    'Flat betting means wagering the same amount every hand, regardless of the outcome of the previous hand.',
  ],
  bullets: [
    'The same wager is placed on every hand.',
    'Simple to track and manage over a session.',
    'Does not change the underlying house edge — it only changes how variance is distributed.',
    'Recommended over aggressive betting progressions, which can escalate wagers quickly during a losing streak.',
  ],
};

export interface HiLoRow {
  cards: string;
  value: string;
}

export const HI_LO_TABLE: HiLoRow[] = [
  { cards: '2 – 6', value: '+1' },
  { cards: '7 – 9', value: '0' },
  { cards: '10 – A', value: '-1' },
];

export const CARD_COUNTING_SECTION: EducationSection = {
  heading: 'Card Counting (educational overview)',
  paragraphs: [
    'Card counting tracks the proportion of high-value and low-value cards remaining in the shoe. It does not predict the next card — it estimates whether the remaining cards favor the player or the dealer slightly more than usual.',
    'Card counting is primarily relevant to live, in-person games where the same shoe is dealt through multiple rounds before a shuffle. It has little to no relevance to games that shuffle after every hand, including most online and continuous-shuffle games.',
    'Card counting is not illegal in most jurisdictions, but casinos are private businesses and may decline continued play, limit bet sizes, or ask a suspected counter to leave, even though nothing illegal occurred. This overview does not include, and this guide will not provide, techniques for concealing counting from casino staff.',
  ],
};

export const HI_LO_EXPLANATION = {
  runningCount: 'Running Count = cumulative total of every card\'s Hi-Lo value seen so far.',
  trueCount: 'True Count = Running Count ÷ estimated decks remaining.',
};

export interface BettingSystemCard {
  id: 'flat' | 'martingale' | 'paroli' | '1-3-2-6';
  label: string;
  summary: string;
  howItWorks: string[];
}

export const BETTING_SYSTEMS: BettingSystemCard[] = [
  {
    id: 'flat',
    label: 'Flat Betting',
    summary: 'Wager the same unit on every hand, regardless of the previous outcome.',
    howItWorks: [
      'Pick one betting unit and wager it on every hand.',
      'The wager never changes, win or lose.',
      'Simplest system to track, and the one this guide recommends over any progression below — it does not escalate wagers during a losing streak.',
    ],
  },
  {
    id: 'martingale',
    label: 'Martingale',
    summary: 'Double the wager after every loss; return to the base unit after a win.',
    howItWorks: [
      'Start with one betting unit.',
      'After a loss, double the next wager.',
      'After a win, reset to the base unit.',
      'A single win recovers all previous losses in the sequence plus one unit of profit — but a losing streak grows the wager exponentially and can hit the table maximum or a player\'s bankroll limit very quickly.',
    ],
  },
  {
    id: 'paroli',
    label: 'Paroli',
    summary: 'A positive progression: increase the wager after a win instead of a loss.',
    howItWorks: [
      'Start with one betting unit.',
      'After a win, increase the next wager (commonly by doubling), typically capped after 2-3 consecutive wins.',
      'After a loss, reset to the base unit.',
      'Losses stay limited to the base unit, but win streaks in Blackjack are not more likely than any other sequence — the system does not change the odds of the next hand.',
    ],
  },
  {
    id: '1-3-2-6',
    label: '1-3-2-6 System',
    summary: 'A fixed four-step positive progression that locks in profit after a win streak.',
    howItWorks: [
      'Bet 1 unit. If it wins, bet 3 units.',
      'If that wins, bet 2 units.',
      'If that wins, bet 6 units, then return to 1 unit regardless of outcome.',
      'A loss at any step resets the sequence back to 1 unit.',
      'The staged reduction from 3 to 2 units after the second win is designed to protect part of the winnings, but the sequence still depends on winning four hands in a row to complete, which is no more likely than any other four-hand outcome.',
    ],
  },
];

export const BETTING_SYSTEMS_DISCLAIMER =
  'Betting systems like these change how wagers are sized from hand to hand, but they do not change Blackjack\'s underlying probabilities and do not remove the house edge. Loss-chasing systems such as Martingale can create very large wagers during a losing streak. None of these are recommended over flat betting.';

export const RESPONSIBLE_GAMBLING_DISCLAIMER: string[] = [
  'Basic Strategy reduces mistakes but does not guarantee profit — Blackjack still carries a house edge even when played perfectly.',
  'Betting systems do not change the underlying expected value of the game.',
  'Card counting does not guarantee winning, and casinos may restrict play regardless of its legality.',
  'Set financial and time limits before you play, and stop when you reach them.',
  'Treat gambling as entertainment, not as a source of income.',
];
