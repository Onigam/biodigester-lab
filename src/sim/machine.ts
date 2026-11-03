import { GRAVITY } from '@onigam/lab-kit/sim/thermal';

// The one place for every number of a machine, each with its tag. `src/three/dims.ts` is to import from here, as the other labs' dims do from their simulation: nothing below is retyped anywhere. To change
// the machine, change `PLANT_1000` (or point `DRAWN_MACHINE` at another one): the bell, the pressure, the heat, the 3D and the sheets follow.
//
// The words of docs/research.md:
//   reported  said by a source (K and S numbers)
//   derived   computed from reported figures, the formula is beside it
//   estimate  the sources are silent: a choice of ours, with its reason
//   assumption a choice of how to run it

export type MachineId = 'plant-1000' | 'plant-1500' | 'plant-1100' | 'school-4000' | 'drum-60';

export interface MachineSpec {
  id: MachineId;
  /** Tank, m. */
  tankOuterDiameter: number;
  tankHeight: number;
  tankInnerRadius: number;
  /** Overflow above the tank's floor, m. It sets the slurry's free level. */
  overflowLevel: number;
  /** Working liquid, m³. */
  liquidVolume: number;
  /** Bell, m. */
  bellOuterDiameter: number;
  bellHeight: number;
  /** Radius that gives the gas its area, from the scale on the bell where it was measured, m. */
  bellGasRadius: number;
  /** Radius that gives the surface it covers, m. */
  bellCoverRadius: number;
  /** Rise from the resting place to where gas leaves at the rim, m. */
  bellTravel: number;
  /** Height of the bell's rim above the tank's floor when it rests, m. */
  bellRestRim: number;
  /** Wall of the bell, m. */
  bellWall: number;
  /** Density of its plastic, kg/m³. */
  bellDensity: number;
  /** A pressure held whatever the store holds, Pa: a bag under a water column instead of a bell. */
  fixedPressure?: number;
  /** Share of the rising gas that misses the bell. */
  rimLoss: number;
  /** Residence of solids over residence of liquid. */
  solidsRetention: number;
  /** The burner: flow at a pressure, L/h and Pa. */
  burnerFlow: number;
  burnerPressure: number;
  /** Hose: bore and length, m. */
  hoseBore: number;
  hoseLength: number;
  /** Feed the machine is run on, kg/d, and litres of water per kg. */
  feedKg: number;
  waterPerKg: number;
  /** Tilt drawn at rest and at the top of the travel, degrees. */
  tiltRest: number;
  tiltFull: number;
}

/** Density of slurry, kg/m³. assumption: water, S5's clear liquor holds under 4 g/L (Table 17), its reported effluent under 0.4 % solids. */
export const SLURRY_DENSITY = 1000;
/** HDPE, kg/m³. General knowledge. */
export const HDPE_DENSITY = 950;
/** ½ inch, the hose of the measured plant, m. reported bore (K7). */
const HALF_INCH = 0.0127;

/**
 * The machine the lab draws: a 1,000 L tank and an inverted 750 L tank, as drawn and measured at Dar es Salaam (S5). The outer Ø1.04 m and the inner radius of 51.5 cm reported on one page give a wall of 5 mm
 * (derived); the bell's wall is taken equal, an estimate, since no source gives its mass. The bell rests low with its top still above the slurry, so a part of its gas can never be drawn: S7 says plainly
 * that the larger model's shorter bell can « fully sink », and this one cannot. Its rim's resting height is read by eye in S5's Fig. 7, at the inner feed pipe: an estimate, 0 to 0.2 m.
 */
export const PLANT_1000: MachineSpec = {
  id: 'plant-1000',
  tankOuterDiameter: 1.04, // reported (K1)
  tankHeight: 1.25, // reported (K1)
  tankInnerRadius: 0.515, // reported (K1)
  overflowLevel: 1.04, // reported (K3)
  liquidVolume: 0.85, // reported (K3), « about 850 L »; π·0.515²·1.04 = 867 L is what the geometry alone gives
  bellOuterDiameter: 0.9, // reported, the table corrected by the figure (K2, conflict 1)
  bellHeight: 1.3, // reported, the same (K2)
  bellGasRadius: 0.43, // reported (K5)
  bellCoverRadius: 0.455, // derived: the radius of the 0.65 m² it covers (K4)
  bellTravel: 0.69, // measured (K5)
  bellRestRim: 0.14, // estimate, read by eye on S5's Fig. 7, 0 to 0.2 m
  bellWall: 0.005, // estimate: the tank's own wall, 0.52 − 0.515 (K1). The research's range 5 to 8 mm
  bellDensity: HDPE_DENSITY,
  rimLoss: 0.22, // reported (K4): an area, not a measurement of gas
  solidsRetention: 300 / 42.5, // derived: about 300 d against 42.5 d (K29, K13). S5's Table 17: 10.6 g VS/L in the tank, 1.47 in the effluent, ratio 7.2
  burnerFlow: 269, // derived: 100 L in 22.3 min (K22)
  burnerPressure: 200, // measured, 2 mbar on the gauge (K22)
  hoseBore: HALF_INCH, // reported (K7)
  hoseLength: 5, // reported (K7)
  feedKg: 2, // measured (K13)
  waterPerKg: 9, // measured (K13)
  tiltRest: 5, // estimate, by eye on Fig. 7
  tiltFull: 8, // estimate, the research's 5 to 10° at full height
};

/** The domestic size the same installer later chose (K12): the bell can sink fully, so none of its gas is trapped. Its level and wall are estimates, its dimensions and its 756 L reported. */
export const PLANT_1500: MachineSpec = {
  ...PLANT_1000,
  id: 'plant-1500',
  tankOuterDiameter: 1.15, // reported (K12)
  tankHeight: 1.73, // reported (K12)
  tankInnerRadius: 0.57, // derived: the diameter, less a wall of 5 mm (estimate)
  overflowLevel: 1.44, // estimate: this machine's 83 % of the tank's height
  liquidVolume: Math.PI * 0.57 * 0.57 * 1.44,
  bellOuterDiameter: 1.1, // reported (K12)
  bellHeight: 1.29, // reported (K12)
  bellGasRadius: 0.545, // derived: the diameter, less a wall
  bellCoverRadius: 0.55, // derived
  bellTravel: 0.756 / (Math.PI * 0.545 * 0.545), // derived: 756 L reported (K12)
  bellRestRim: 1.44 - 1.29, // derived: its top at the level when it has sunk
  rimLoss: 1 - (0.55 * 0.55) / (0.57 * 0.57), // derived by area, as for K4
  solidsRetention: PLANT_1000.solidsRetention,
};

/** An AIDG build (S9): Ø1.20 and Ø1.06 m, outlet at 88 cm. The bell's height follows from its 750 L; its travel is an estimate. Not measured. */
export const PLANT_1100: MachineSpec = {
  ...PLANT_1000,
  id: 'plant-1100',
  tankOuterDiameter: 1.2, // reported (S9)
  tankHeight: 1.1 / (Math.PI * 0.595 * 0.595), // derived: 1,100 L
  tankInnerRadius: 0.595, // derived, a wall of 5 mm
  overflowLevel: 0.88, // reported (S9)
  liquidVolume: Math.PI * 0.595 * 0.595 * 0.88,
  bellOuterDiameter: 1.06, // reported (S9)
  bellHeight: 0.75 / (Math.PI * 0.525 * 0.525), // derived: 750 L
  bellGasRadius: 0.525, // derived
  bellCoverRadius: 0.53, // derived
  bellTravel: 0.6, // estimate
  bellRestRim: 0.88 - 0.75 / (Math.PI * 0.525 * 0.525), // derived: it sinks fully
  rimLoss: 1 - (0.53 * 0.53) / (0.595 * 0.595), // derived by area
};

/**
 * The school's plant (S7, read for this role beyond the research's notes): 4,000 and 3,000 L, 8 kg/d with 7.5 L of water per kg, 15 L/min burners, about 2.25 mbar on average.
 * The tank's diameters are not printed: Ø1.60 and Ø1.50 m are estimates, between the same installer's 1,500/1,000 and 5,000/4,500 that S7 reports. It can sink fully. 2,300 L when « at its maximum height ».
 */
export const SCHOOL_4000: MachineSpec = {
  ...PLANT_1000,
  id: 'school-4000',
  tankOuterDiameter: 1.6, // estimate
  tankHeight: 2.2, // estimate
  tankInnerRadius: 0.795, // estimate
  overflowLevel: 4 / (Math.PI * 0.795 * 0.795), // derived: the 4 m³ the thesis uses for its HRT
  liquidVolume: 4, // reported (Table 15: 68 L/d, 59 d)
  bellOuterDiameter: 1.5, // estimate
  bellHeight: 3 / (Math.PI * 0.745 * 0.745), // derived: 3,000 L
  bellGasRadius: 0.745, // estimate
  bellCoverRadius: 0.75, // estimate
  bellTravel: 2.3 / (Math.PI * 0.745 * 0.745), // reported 2,300 L (K34) over the estimated area
  bellRestRim: 4 / (Math.PI * 0.795 * 0.795) - 3 / (Math.PI * 0.745 * 0.745), // derived: its top at the level when it has sunk
  bellWall: 0.007, // estimate, a heavier tank, the research's 5 to 8 mm
  rimLoss: 0.175, // measured (K33)
  solidsRetention: 150 / 56, // reported: SRT 143 and 163 d, HRT 59 and 53 d (S7's abstract)
  burnerFlow: 900, // reported: 15 L/min (K34)
  burnerPressure: 225, // reported: 2.25 mbar (K34)
  hoseLength: 10, // estimate
  feedKg: 8, // reported (S7)
  waterPerKg: 7.5, // reported (S7)
};

/** The Low-tech Lab's drum (S3): 60 L, 2 L/d, a 150 L bag, 10 mbar. No rim. Its solids' retention and its bag's area are estimates; a bag's pressure does not follow its filling. */
export const DRUM_60: MachineSpec = {
  ...PLANT_1000,
  id: 'drum-60',
  tankOuterDiameter: 0.4, // estimate, a usual 60 L drum
  tankHeight: 0.6, // estimate
  tankInnerRadius: 0.195, // estimate
  overflowLevel: 0.06 / (Math.PI * 0.195 * 0.195), // derived: 60 L
  liquidVolume: 0.06, // reported (S3)
  bellOuterDiameter: 0.8, // estimate: the bag lies flat
  bellHeight: 0.3, // estimate
  bellGasRadius: 0.4, // estimate
  bellCoverRadius: 0.4, // estimate
  bellTravel: 0.15 / (Math.PI * 0.4 * 0.4), // reported 150 L (S3)
  bellRestRim: 0, // nothing is trapped: a bag empties
  bellWall: 0,
  fixedPressure: 1000, // reported: 10 mbar (S3)
  rimLoss: 0, // a sealed bag
  solidsRetention: 1.5, // estimate: a small drum, stirred by what falls into it
  burnerFlow: 269, // assumption: this lab's flow, on a burner made for the bag's 10 mbar. No flow is given for that one
  burnerPressure: 1000, // reported (S3)
  hoseLength: 5, // estimate
  feedKg: 0.77, // derived: 2 L/d in equal parts by the research's hand check (§2.9)
  waterPerKg: (2 - 0.77) / 0.77, // derived: 2 L/d in all (S3)
};

export const MACHINES: Record<MachineId, MachineSpec> = {
  'plant-1000': PLANT_1000,
  'plant-1500': PLANT_1500,
  'plant-1100': PLANT_1100,
  'school-4000': SCHOOL_4000,
  'drum-60': DRUM_60,
};

/** The one the 3D draws. The others run in the simulation and on sheet 10. */
export const DRAWN_MACHINE: MachineId = 'plant-1000';

/** The half-brick, kg. reported, « approximately 12 kg » (K18). */
export const HALF_BRICK = 12;

/** Fixed points the 3D and the sheets read from here, m above the tank's floor. reported (K6, K7, Fig. 7). */
export const FITTINGS = {
  funnelTop: 1.18,
  /** Fig. 7 prints 1.06 m on the feed riser and 1.04 m on the overflow: read by the physicist as the same level from two bases, see docs/physics.md. */
  riserLevelDrawn: 1.06,
  feedPipeReach: 0.51,
  feedBore: 0.0762,
  feedLength: 1.8,
  overflowBore: 0.0508,
  overflowLength: 1,
  overflowDrop: 0.74,
  sampleTap: 0.62,
  /** Litres a kilo of scraps fills loose, for the 3D's caddy. reported (S3). The water balance counts a kilo as a litre (K13: 2 kg + 18 L = 20 L/d). */
  scrapLitresPerKg: 1.6,
} as const;

// ------------------------------------------------------------------------------------------------ what the numbers above give

/** Where the machine's kept constants meet its derived ones, all pure. */
export const surfaceArea = (m: MachineSpec): number => Math.PI * m.tankInnerRadius * m.tankInnerRadius;
export const coveredArea = (m: MachineSpec): number => Math.PI * m.bellCoverRadius * m.bellCoverRadius;
/** Share of the surface the bell leaves open. On the measured plant, an area: 21.7 %. */
export const openShare = (m: MachineSpec): number => 1 - coveredArea(m) / surfaceArea(m);
/** The area the gas pushes on, m². */
export const bellArea = (m: MachineSpec): number => Math.PI * m.bellGasRadius * m.bellGasRadius;
/** What the travel holds, m³. */
export const usableVolume = (m: MachineSpec): number => bellArea(m) * m.bellTravel;
/** The gas that stays when the bell rests, m³: the top stands above the slurry by what the rim and the height leave. */
export const trappedVolume = (m: MachineSpec): number =>
  bellArea(m) * Math.max(0, m.bellRestRim + m.bellHeight - m.overflowLevel);
/** Height of the marks on the bell per 100 L, m. */
export const markSpacing = (m: MachineSpec): number => 0.1 / bellArea(m);
/** Hydraulic retention, days, at a daily flow in litres. */
export const retentionDays = (m: MachineSpec, litresPerDay: number): number =>
  litresPerDay > 0 ? (m.liquidVolume * 1000) / litresPerDay : Infinity;

/** The bell's own mass, kg: its shell by its wall. estimate through the wall (no source weighs one). */
export const bellMass = (m: MachineSpec): number =>
  m.bellDensity *
  m.bellWall *
  (Math.PI * m.bellOuterDiameter * m.bellHeight + (Math.PI * m.bellOuterDiameter * m.bellOuterDiameter) / 4);
/** Cross-section of the wall that dips into the slurry, m². */
export const wallSection = (m: MachineSpec): number => Math.PI * (m.bellOuterDiameter - m.bellWall) * m.bellWall;
/** How deep the rim stands below the free level at a rise, m. */
export const rimDepth = (m: MachineSpec, rise: number): number => Math.max(0, m.overflowLevel - m.bellRestRim - rise);

/** The weight the gas holds up, kg: the shell and what is laid on it, less the slurry its submerged wall pushes aside. So the bell grows heavier as it rises out. */
export const effectiveWeight = (m: MachineSpec, rise: number, added: number): number =>
  bellMass(m) + added - SLURRY_DENSITY * wallSection(m) * rimDepth(m, rise);

/** Pressure of a weight laid on the bell, Pa. */
export const weightPressure = (m: MachineSpec, kg: number): number => (kg * GRAVITY) / bellArea(m);

/** Gas pressure under the bell at a rise, Pa. */
export const bellPressure = (m: MachineSpec, rise: number, added: number): number =>
  m.fixedPressure ?? weightPressure(m, Math.max(0, effectiveWeight(m, rise, added)));

/** How far the free surface inside the bell stands below the open ring, m: the gas pushes it down. */
export const innerDepression = (pressure: number): number => pressure / (SLURRY_DENSITY * GRAVITY);

/** The areas the air and the sun see, m². The bell's side at mid-travel: an average. */
export function skin(m: MachineSpec): { top: number; side: number; sideHeight: number; base: number; total: number } {
  const r = m.tankOuterDiameter / 2;
  const exposed = Math.max(0, m.bellRestRim + m.bellHeight + m.bellTravel / 2 - m.tankHeight);
  const top = Math.PI * r * r;
  const tankSide = Math.PI * m.tankOuterDiameter * m.tankHeight;
  const bellSide = Math.PI * m.bellOuterDiameter * exposed;
  const bellTop = (Math.PI * m.bellOuterDiameter * m.bellOuterDiameter) / 4;
  const side = tankSide + bellSide;
  return {
    top,
    side,
    // what a low sun sees, as a height on the tank's diameter
    sideHeight: side / (Math.PI * m.tankOuterDiameter),
    base: top,
    total: tankSide + top + bellSide + bellTop,
  };
}

/** One machine's numbers and the kinetics, in one place so that a test or a sheet reads them once. */
export const MODEL = {
  // ---- the kinetics, all estimates. k's and Ea: the research's table, S35 for the fast one, S36 for Ea's order. The methanogens': ADM1's acetoclastic values (Batstone 2002, from memory: not read here).
  /** First-order rates at 30 °C, per day. estimate. */
  kFast: 0.4,
  kSlow: 0.05,
  /** J/mol. estimate, slider 40 to 80 kJ/mol. */
  Ea: 60000,
  Tref: 30,
  /** kg COD eaten per kg of methanogens per day at 30 °C: ADM1's 8/d at 35 °C, brought to 30 °C at this Ea. estimate. */
  km: 5.3,
  /** Half-saturation, kg COD/m³. estimate, ADM1. */
  Ks: 0.15,
  /** Yield, kg/kg. estimate, ADM1. */
  yieldX: 0.05,
  /** Death rate at 30 °C, per day. estimate, ADM1. */
  decay: 0.02,
  /** pH below which hydrolysis slows, and where it has nearly stopped. estimate, ADM1's acidogens. */
  hydrolysisPHLow: 4,
  hydrolysisPHHigh: 5.5,
  /** The same for methanogens. estimate, ADM1's acetoclastic. S5 agrees in words: below 6 « should be avoided ». */
  methanogenPHLow: 6,
  methanogenPHHigh: 7,
  /** Temperatures. estimate: frozen, nothing; Arrhenius alone to 38 °C; these organisms gone by 48 °C (K44 has others above 45). */
  coldZero: 0,
  coldFull: 0.001,
  hotFull: 38,
  hotZero: 48,

  // ---- the gas leaving the liquid
  /** Mass transfer through the open ring, m/day. estimate: still water takes up to about 1 m/d, a scum holds it back. */
  ringTransfer: 0.5,
  /** Below this share of methane a flame does not hold. reported: S5 p. 13 and S8 p. 25 say biogas above 45 % methane burns, both after Deublein. That a lit flame goes out under it is this model's reading of them. */
  leanFlame: 0.45,
  /** Pressure at the burner below which the flame goes out, Pa. estimate: half the lowest pressure at which anyone timed a flame (2 mbar, K22). */
  flameMinPressure: 100,
  /** Burner's efficiency. reported (K42). */
  burnerEfficiency: 0.55,
  /** Viscosity of the gas, Pa·s. estimate, between CH4 and CO2. */
  gasViscosity: 1.3e-5,
  /** The share of the methane's heat that metabolism leaves in the slurry. estimate: a few percent, the research's « small ». */
  metabolicShare: 0.05,
  /** Slope of the hose on each side of its low point, %. estimate. */
  hoseSlope: 2,

  // ---- heat and sun
  /** Black HDPE's absorptance. estimate. */
  absorptance: 0.9,
  /** Film of the outside surface, W/m²·K, wind and radiation together. estimate. */
  outerFilm: 15,
  /** Ground's reflection. Usual value. */
  groundReflection: 0.2,
  /** Hours of direct sun on the tank. reported at the measured site (K9). */
  directSunHours: 7.5,
  /** Half the air's swing over a day, K, peak at 15:00. assumption, the sources give monthly means only. */
  airSwing: 4,
  /** Wall U, W/m²·K: bare and wrapped in 15 cm of straw. assumption (research §2.9). */
  wallBare: 5,
  wallStraw: 0.25,

  // ---- the feed water and what it brings
  /** Strong cations in the feed water, eq/L, and the dissolved carbon that comes with them, mol/L. estimate: a moderately hard tap water. */
  waterCharge: 0.002,
  /** Salts of the feed water left in the effluent's total solids, kg/L. estimate. */
  waterSolids: 5e-4,
} as const;

/** The same constants as numbers, so that a sensitivity run can move one. */
export type ModelConstants = { -readonly [K in keyof typeof MODEL]: number };
