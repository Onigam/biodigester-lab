import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { BioParams, BioState } from '../sim/types';
import { createDigesterScene as buildDigesterScene } from './digester/scene';
import { createDropScene as buildDropScene } from './drop/scene';
import { createGasLineScene as buildGasLineScene } from './gasline/scene';
import { createYardScene as buildYardScene } from './yard/scene';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of the `SceneDef`, and spread `WORLD[id]` next to it.

export const createYardScene = (params: () => BioParams): SceneModule<BioState> =>
  lazyModule<BioState>('yard', () => buildYardScene(params));
export const createDigesterScene = (params: () => BioParams): SceneModule<BioState> =>
  lazyModule<BioState>('digester', () => buildDigesterScene(params));

export const createSlurryScene = (): SceneModule<BioState> => lazyModule<BioState>('slurry', () => buildDropScene());

export const createGasLineScene = (params: () => BioParams): SceneModule<BioState> =>
  lazyModule<BioState>('gas-line', () => buildGasLineScene(params));

/** The parts that open a detailed world, for `LabDefinition.partLinks` (research §0.4): the label is the application's. */
export const PART_OPENS = {
  'biogas-plant': 'digester',
  'clear-liquor': 'slurry',
  'gas-tap': 'gas-line',
} as const;

/** What `src/lab.ts` needs to know of each world, as `SceneDef` fields. */
export const WORLD = {
  yard: {
    /** A yard does not come apart: a guide's parts still drop in. No section either (research §0.4). */
    cutaway: false,
    explode: false,
    xrayNeedsSelection: true,
    partPadding: 1.5,
    stepFrame: { padding: 1.6, minRadius: 0.8 },
  },
  digester: {
    /** The world opens cut along its axis; the section tool cuts it across at the overflow, for the open ring seen from above. */
    cutaway: true,
    partPadding: 1.7,
    stepFrame: { padding: 1.5, minRadius: 0.3 },
    xrayShell: (id: string): boolean => id === 'digester-tank' || id === 'gas-bell' || id === 'clear-liquor',
  },
  'gas-line': {
    /** Nothing inside a line that a cut would teach (research §0.4). */
    cutaway: false,
    partPadding: 1.7,
    stepFrame: { padding: 1.6, minRadius: 0.25 },
  },
  slurry: {
    /** Nothing to cut in a drop (research §0.4). */
    cutaway: false,
    partPadding: 1.35,
    stepFrame: { padding: 1.5, minRadius: 0.3 },
  },
} as const;
