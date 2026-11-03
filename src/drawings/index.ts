import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { arrangementSheet } from './pl01-arrangement';
import { sectionSheet } from './pl02-section';
import { bellSheet } from './pl03-bell';
import { feedSheet } from './pl04-feed';
import { gasLineSheet } from './pl05-gasline';
import { chainSheet } from './pl06-chain';
import { balanceSheet } from './pl07-balance';
import { warmthSheet } from './pl08-warmth';
import { hazardsSheet } from './pl09-hazards';
import { sizesSheet } from './pl10-sizes';

// The cartouche of every sheet: they explain, they are no plan to follow. The reconstruction itself is said once, in the Sources.
configureDrawings({
  project: { fr: 'BIODIGESTEUR — cloche flottante à deux cuves', en: 'BIODIGESTER — a two-tank floating bell' },
  disclaimer: { fr: 'Pour comprendre, pas un plan à suivre', en: 'For understanding, not a plan to follow' },
  date: '2026-11-03',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  arrangementSheet,
  sectionSheet,
  bellSheet,
  feedSheet,
  gasLineSheet,
  chainSheet,
  balanceSheet,
  warmthSheet,
  hazardsSheet,
  sizesSheet,
];

/** The groups of the Plans mode, for `plans.groups` in src/lab.ts, in the order that keeps the numbers running: the kit lists the sheets group by group. */
export const SHEET_GROUPS = [
  { id: 'plant', label: l('L’installation', 'The plant') },
  { id: 'life', label: l('Le vivant et le bilan', 'Life and the balance') },
  { id: 'limits', label: l('Les limites', 'The limits') },
] as const;
