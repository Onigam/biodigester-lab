import { strL } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/assembly';
import { VIDEO_ID } from './data/chapters';
import { INSTALL } from './data/install';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { sourcesPanel } from './data/sources';
import { SHEET_GROUPS, SHEETS } from './drawings';
import { t } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { BiodigesterSim } from './sim/engine';
import {
  createDigesterScene,
  createGasLineScene,
  createSlurryScene,
  createYardScene,
  PART_OPENS,
  WORLD,
} from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new BiodigesterSim();

/** What each part that opens a detailed world says on its button. */
const OPEN_LABEL = { digester: strL('goDigester'), slurry: strL('goSlurry'), 'gas-line': strL('goGasLine') } as const;

/** A minute per second, so that a meal's flame lasts about twenty seconds: at the opening clock's hour per second it would last a blink. */
const FLAME_SPEED = 60;

export const lab: LabDefinition<BiodigesterSim> = {
  id: 'biodigester-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline') },
  sim,
  defaultScene: 'yard',
  video: { id: VIDEO_ID },
  // the envelope of a part sheet is measured on the 3D model: in this lab a figure carries its mark
  envelopeMark: '*',
  parts: PARTS,
  scenes: [
    {
      id: 'yard',
      label: strL('sceneYard'),
      module: createYardScene(() => sim.params),
      ...WORLD.yard,
      overview: {
        ...OVERVIEWS.yard,
        actions: [
          { label: strL('goDigester'), scene: 'digester', primary: true },
          { label: strL('goSimulation'), mode: 'sim' },
        ],
      },
    },
    {
      id: 'digester',
      label: strL('sceneDigester'),
      module: createDigesterScene(() => sim.params),
      ...WORLD.digester,
      overview: {
        ...OVERVIEWS.digester,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goSlurry'), scene: 'slurry' },
          { label: strL('goGasLine'), scene: 'gas-line' },
          { label: strL('goYard'), scene: 'yard' },
        ],
      },
    },
    {
      id: 'slurry',
      label: strL('sceneSlurry'),
      module: createSlurryScene(),
      ...WORLD.slurry,
      overview: {
        ...OVERVIEWS.slurry,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goDigester'), scene: 'digester' },
        ],
      },
    },
    {
      id: 'gas-line',
      label: strL('sceneGasLine'),
      module: createGasLineScene(() => sim.params),
      ...WORLD['gas-line'],
      overview: {
        ...OVERVIEWS['gas-line'],
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goDigester'), scene: 'digester' },
          { label: strL('goYard'), scene: 'yard' },
        ],
      },
    },
  ],
  partLinks: Object.fromEntries(
    Object.entries(PART_OPENS).map(([part, scene]) => [part, { scene, label: OPEN_LABEL[scene] }]),
  ),
  // the flame has nothing to outline while the model has it off: its sheet's button lights it, as its tip says
  partActions: (ctx, info) =>
    info.id === 'blue-flame'
      ? [
          h(
            'button',
            {
              class: 'btn btn--primary',
              onclick: () => {
                ctx.sim.set({ timeScale: FLAME_SPEED });
                ctx.sim.lightBurner();
                // a flame is small: bring the eye to it, the pot and the burner giving the frame while it may not be there yet
                ctx.stage.frameParts(['biogas-burner', 'cooking-pot'], 1.5);
              },
            },
            icon(ICONS.bolt, 16),
            t('lightBurner'),
          ),
        ]
      : [],
  guides: {
    // the assembly starts on the machine and ends in the kitchen, the installation starts in the yard. Each step names its own world.
    assembly: { scene: 'digester', steps: ASSEMBLY },
    install: { scene: 'yard', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [...SHEET_GROUPS],
    intro: strL('plansIntro'),
  },
  // spoken guide: audio and subtitles generated from narration/<lang>.json. Until they exist, the manifest answers 404 and nothing of the feature shows.
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<BiodigesterSim>) => new SimPanel(ctx),
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: sourcesPanel,
};
