export interface PayoutRow {
  result: string;
  payout: string;
  notes?: string;
}

export const PAYOUT_TABLE: PayoutRow[] = [
  { result: 'Standard win', payout: '1:1' },
  { result: 'Blackjack', payout: '3:2', notes: 'Look for this at the table — the fair, standard payout.' },
  { result: 'Blackjack at poor tables', payout: '6:5', notes: 'Significantly worse for the player. Avoid tables offering only 6:5.' },
  { result: 'Insurance', payout: '2:1', notes: 'Generally not recommended for players using Basic Strategy alone.' },
  { result: 'Push', payout: 'Wager returned' },
  { result: 'Surrender', payout: 'Half wager returned' },
];

export interface RuleChecklistItem {
  label: string;
  detail: string;
}

export const TABLE_RULES_CHECKLIST: RuleChecklistItem[] = [
  { label: 'Blackjack pays 3:2', detail: 'The single biggest factor in the house edge — avoid 6:5 tables.' },
  { label: 'Dealer stands on soft 17', detail: 'Slightly better for the player than a dealer who hits soft 17.' },
  { label: 'Double after split allowed', detail: 'Lets you double on hands created by splitting a pair.' },
  { label: 'Late surrender available', detail: 'Lets you forfeit half your bet on the worst hands instead of playing them out.' },
  { label: 'Re-splitting allowed', detail: 'Lets you split again if you\'re dealt another pair after splitting.' },
  { label: 'Fewer decks preferred', detail: 'Fewer decks in the shoe generally shave a small amount off the house edge.' },
];

export const RULES_EFFECT_NOTE =
  'None of these rules change how you should play a given hand-versus-dealer situation by much, but favorable rules generally reduce the house edge — so all else being equal, look for tables that check as many of these boxes as possible.';
