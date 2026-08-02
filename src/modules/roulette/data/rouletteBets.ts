import type { BetParams, RouletteBetType } from '../types/roulette';
import { buildBetPayoutInfo } from '../engine/rouletteMath';

export interface BetReferenceRow {
  type: RouletteBetType;
  label: string;
  description: string;
  category: 'inside' | 'outside';
  examplePlacement: string;
  sampleParams: BetParams;
  americanOnly?: boolean;
}

// Sample params are representative table positions used to compute numbers-covered and
// payout for the reference table — real coverage is always derived live via betCoverage().
export const BET_REFERENCE_ROWS: BetReferenceRow[] = [
  {
    type: 'straight',
    label: 'Straight up',
    description: 'A single number, including 0 (and 00 in American roulette).',
    category: 'inside',
    examplePlacement: 'Chip placed directly on number 17.',
    sampleParams: { numbers: [17] },
  },
  {
    type: 'split',
    label: 'Split',
    description: 'Two adjacent numbers, covered by placing a chip on the shared border line.',
    category: 'inside',
    examplePlacement: 'Chip on the line between 17 and 20.',
    sampleParams: { numbers: [17, 20] },
  },
  {
    type: 'street',
    label: 'Street',
    description: 'A full row of three numbers, covered by placing a chip on the outer edge of the row.',
    category: 'inside',
    examplePlacement: 'Chip on the outer edge of the 16-17-18 row.',
    sampleParams: { rowStart: 16 },
  },
  {
    type: 'corner',
    label: 'Corner',
    description: 'Four numbers forming a 2x2 block, covered by placing a chip on their shared corner.',
    category: 'inside',
    examplePlacement: 'Chip on the corner shared by 17, 18, 20, 21.',
    sampleParams: { cornerTopLeft: 17 },
  },
  {
    type: 'six-line',
    label: 'Six line',
    description: 'Two adjacent rows (six numbers), covered by placing a chip on the outer edge between them.',
    category: 'inside',
    examplePlacement: 'Chip on the edge shared by the 16-18 and 19-21 rows.',
    sampleParams: { rowStart: 16 },
  },
  {
    type: 'trio',
    label: 'Trio',
    description: 'Three numbers including at least one zero — the smallest zero-adjacent inside bet.',
    category: 'inside',
    examplePlacement: 'Chip on the corner shared by 0, 1, 2.',
    sampleParams: { numbers: [0, 1, 2] },
  },
  {
    type: 'basket',
    label: 'Basket / top line',
    description: 'American-only five-number bet covering 0, 00, 1, 2, 3. Does not exist on a European wheel.',
    category: 'inside',
    examplePlacement: 'Chip on the outer corner of the 0/00/1/2/3 block.',
    sampleParams: {},
    americanOnly: true,
  },
  {
    type: 'dozen',
    label: 'Dozen',
    description: 'Twelve consecutive numbers: 1-12, 13-24, or 25-36.',
    category: 'outside',
    examplePlacement: 'Chip in the "1st 12" box for numbers 1-12.',
    sampleParams: { dozenIndex: 1 },
  },
  {
    type: 'column',
    label: 'Column',
    description: 'Twelve numbers in one of the three vertical columns of the layout.',
    category: 'outside',
    examplePlacement: 'Chip in the "2 to 1" box at the foot of a column.',
    sampleParams: { columnIndex: 1 },
  },
  {
    type: 'red',
    label: 'Red',
    description: 'Any of the 18 red numbers.',
    category: 'outside',
    examplePlacement: 'Chip in the red diamond box.',
    sampleParams: {},
  },
  {
    type: 'black',
    label: 'Black',
    description: 'Any of the 18 black numbers.',
    category: 'outside',
    examplePlacement: 'Chip in the black diamond box.',
    sampleParams: {},
  },
  {
    type: 'odd',
    label: 'Odd',
    description: 'Any odd number, 1-35. Zero and 00 are neither odd nor even.',
    category: 'outside',
    examplePlacement: 'Chip in the "ODD" box.',
    sampleParams: {},
  },
  {
    type: 'even',
    label: 'Even',
    description: 'Any even number, 2-36. Zero and 00 are neither odd nor even.',
    category: 'outside',
    examplePlacement: 'Chip in the "EVEN" box.',
    sampleParams: {},
  },
  {
    type: 'low',
    label: '1 to 18',
    description: 'Any number from 1 through 18. Zero and 00 are excluded.',
    category: 'outside',
    examplePlacement: 'Chip in the "1-18" box.',
    sampleParams: {},
  },
  {
    type: 'high',
    label: '19 to 36',
    description: 'Any number from 19 through 36. Zero and 00 are excluded.',
    category: 'outside',
    examplePlacement: 'Chip in the "19-36" box.',
    sampleParams: {},
  },
];

export function betReferenceInfo(row: BetReferenceRow) {
  return buildBetPayoutInfo(
    row.type,
    row.label,
    row.description,
    row.examplePlacement,
    row.category,
    row.sampleParams,
    row.americanOnly,
  );
}
