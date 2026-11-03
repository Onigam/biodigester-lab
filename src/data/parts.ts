import type { PartInfo } from '@onigam/lab-kit/content';
import { DIGESTER_PARTS } from './parts/digester';
import { DIM_SPECS } from './parts/dim-specs';
import { GAS_LINE_PARTS } from './parts/gasline';
import { SLURRY_PARTS } from './parts/slurry';
import { YARD_PARTS } from './parts/yard';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the order of src/three/part-ids.ts: `yard` 10, `digester` 20, `slurry` 11, `gas-line` 17. The ids are the contract with the 3D role: data.test.ts holds them against that list.
// The dimension rows of each sheet are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [...YARD_PARTS, ...DIGESTER_PARTS, ...SLURRY_PARTS, ...GAS_LINE_PARTS].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
