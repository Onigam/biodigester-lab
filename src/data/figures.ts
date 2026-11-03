// The figures the texts of src/data write by {placeholder}: the French and English spellings of a number can never drift apart, and each one carries its mark by construction, so that a computed or an
// estimated number cannot be written without it.
//
// What the marks mean to the visitor (the same as the simulation's TAG_NOTE, src/sim/texts.ts, and the sheets, `marksLegend` in src/drawings/draw.ts):
//   no mark    REPORTED: stated by a source of docs/research.md. Written in the text itself, and checked against the list of data.test.ts.
//   †          COMPUTED: arithmetic on reported figures (research: derived), or a result of this lab's model on ground where a plant was measured (src/sim). The sentence says which.
//   *          ESTIMATE: the sources are silent, a choice of this lab (research §3, the tags of src/three/dims.ts, an assumption of how to run), or the same model where no plant was measured: below about 25 °C, or anywhere but Dar es Salaam.
// Nothing here is tuned to anything. `figures.test.ts` recomputes the model's and the derived figures from src/sim and src/three/dims.ts, so that a change of either cannot go unnoticed.
import { bellMass, FITTINGS, MODEL, PLANT_1000, trappedVolume } from '../sim/machine';
import { BELL, BRICK, BUCKET, FEED, LIMITER, LINE, MARKS, PAD, PALLET, TANK, TAP, VALVES, YARD } from '../three/dims';
import { nEn, nFr } from './units';

export type FigStatus = 'derived' | 'model' | 'elsewhere' | 'assumption' | 'estimate';

export interface Fig {
  /** The value, in the unit shown. */
  v: number;
  /** Decimals shown. */
  d: number;
  s: FigStatus;
  /** Unit with its leading space when it takes one: a string, or [fr, en] when the languages differ. */
  u?: string | readonly [string, string];
  /** A value that is no plain number: a range, a size, a span of time in words. */
  t?: readonly [string, string];
}

/** † for what is computed where a plant was measured, * for what is estimated or modelled where none was. The one place that decides it. */
export const markOf = (s: FigStatus): string => (s === 'derived' || s === 'model' ? '†' : '*');

const pct: readonly [string, string] = [' %', ' %'];
const times: readonly [string, string] = [' fois', ' times'];
const days: readonly [string, string] = [' jours', ' days'];
const months: readonly [string, string] = [' mois', ' months'];
const cod: readonly [string, string] = [' kg de DCO', ' kg of COD'];

const d = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'derived', u });
const m = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'model', u });
const w = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'elsewhere', u });
const a = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'assumption', u });
const e = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'estimate', u });
const words = (s: FigStatus, fr: string, en: string, v = 0): Fig => ({ v, d: 0, s, t: [fr, en] });

/** A size, read from dims.ts, written in both languages: `size(['Ø', 0.31], 0.36)`. */
const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;
const size = (unit: string, prefix: string, ...values: number[]): Fig =>
  words(
    'estimate',
    `${prefix}${values.map((x) => trim(nFr(x, 3), ',')).join(' × ')} ${unit}`,
    `${prefix}${values.map((x) => trim(nEn(x, 3), '.')).join(' × ')} ${unit}`,
  );

export const FIG = {
  // ---- arithmetic on reported figures
  tankWall: d(TANK.wall * 1000, 0, ' mm'), // Ø1.04 m and r 51.5 cm
  litresGeometry: d(867, 0, ' L'), // π × 0.515² × 1.04
  stepCm: d(17.25 / 5, 2, ' cm'), // 20 L of 100 L at 17.25 cm
  markCalc: d(MARKS.per100 * 100, 1, ' cm'), // 0.1 m³ over π × 0.43²
  dayRise: d(50, 0, ' cm'), // 289 L at 17.25 cm per 100 L
  brickMbar: d(2.03, 2, ' mbar'), // 12 kg × 9.81 / 0.581 m²
  pushCm: d(2, 0, ' cm'), // 2 mbar of water
  innerDrop: d(2, 0, ' cm'), // the same, seen as the surface under the bell
  weightFor2: d(11.8, 1, ' kg'), // 200 Pa × 0.581 / 9.81
  flow2: d(269, 0, ' L/h'), // 100 L in 22.3 min
  flow4: d(496, 0, ' L/h'), // 100 L in 12.1 min
  flowRatio: d(1.84, 2, times),
  powerIn: d(1.5, 1, ' kW'), // 269 L/h × 0.896 × 0.614 × 9.97 Wh
  powerBrick: d(2.8, 1, ' kW'),
  powerUseful: d(0.8, 1, ' kW'), // at 55 %
  methaneWet: d(105, 0, ' g'), // 259 NL × 56.8 %
  methaneMarket: d(54, 0, ' g'), // 113 NL × 66.4 %
  kwhFood: d(1.47, 2, ' kWh'),
  kwhMarket: d(0.75, 2, ' kWh'),
  minPerKgFood: d(32, 0, ' min'), // 144 L at 269 L/h
  minPerKgMarket: d(14, 0, ' min'), // 63 L at 269 L/h
  minPerKgBook: d(15, 0, ' min'), // 100 L at 400 L/h
  boilMinutes: d(7, 0, ' min'), // 0.093 kWh / 0.55 / 1.48 kW
  boilLitres: d(6, 0, ' L'),
  bellMinutes: d(89, 0, ' min'), // 400 L at 269 L/h
  starchShare: d(84, 0, pct), // 0.25 of 0.297
  starchCeiling: d(0.297, 3, ' kg'),
  maxFromCod: d(60, 0, ' NL'), // 0.172 kg COD at 350 NL/kg
  caughtMarket: d(75, 0, ' NL'), // 113 NL × 66.4 %
  co2Food: d(35, 0, ' NL'), // 259 × (0.568 − 0.432)
  co2Market: d(37, 0, ' NL'), // 113 × (0.664 − 0.336)
  bookLimit: d(7.5, 1, ' kg'), // 2 kg VS/m³·d on 0.85 m³ at 0.24 × 0.94
  bookLimitHigh: d(9.4, 1, ' kg'), // 2.5, the neighbouring study
  lpgKwh: d(3.5, 1, ' kWh'), // 100 kg × 12.8 kWh/kg / 365
  lpgFeed: d(5, 0, ' kg'), // 3.5 against 1.47 for 2 kg
  ammoniumMeq: d(5.3, 1, ' meq/L'), // 74 mg/L of N
  overflowRun: d(FITTINGS.overflowLength - FITTINGS.overflowDrop, 2, ' m'),
  limiterAcross: d(LIMITER.across, 2, ' m'), // 1.29 m on Ø1.20 m, brought to Ø1.04 m
  caddyLitres: d(2 * FITTINGS.scrapLitresPerKg, 1, ' L'),

  // ---- the model where a plant was measured: Dar es Salaam, or a tank held warm (docs/physics.md)
  gasAbout: m(280, 0, ' L'),
  gasCalendar: m(278, 0, ' L'),
  gasSteady: m(279, 0, ' L'),
  gasNoRim: m(386, 0, ' L'),
  marketLow: m(64, 0, ' L'),
  marketHigh: m(76, 0, ' L'),
  ch4Calendar: m(57.8, 1, pct),
  ch4Food: m(57.5, 1, pct),
  ch4Market: m(68.7, 1, pct),
  ch4MarketCalendar: m(71.5, 1, pct),
  methaneModel: m(98, 0, ' g'),
  kineticsLow: m(276, 0, ' L'),
  kineticsHigh: m(283, 0, ' L'),
  retentionLow: m(249, 0, ' L'),
  retentionHigh: m(283, 0, ' L'),
  mixLitres: m(176, 0, ' L'),
  mixMinutes: m(39, 0, ' min'),
  mixCh4: m(60.5, 1, pct),
  rampLitres: m(690, 0, ' L'),
  rampMinutes: m(149, 0, ' min'),
  rampPH: m(6.5, 1),
  rampAt32: m(35, 0, ' kg'),
  nlBreak: m(63, 0, ' NL'),
  mealHalf: m(2, 0, days),
  mealNinety: m(12, 0, days),
  peelHalf: m(5, 0, days),
  peelNinety: m(27, 0, days),
  pressureRest: m(1.3, 1, ' mbar'),
  pressureMid: m(2.14, 2, ' mbar'),
  pressureFull: m(3, 1, ' mbar'),
  minutesMid: m(23, 0, ' min'),
  minutesBrick: m(16, 0, ' min'),
  orificeRatio: m(1.4, 1, times),
  hoseDrop: m(0.08, 2, ' mbar'),
  soursAt32: m(10, 0, ' kg'),
  holdsAt: m(10, 0, ' kg'),
  failsAt: m(11, 0, ' kg'),
  pHSteady: m(6.53, 2),
  pHLoad: m(6.57, 2),
  pHNoReturn: m(6.4, 1),
  pHTooLate: m(6.35, 2),
  ratioPH: m(6.4, 1),
  noReturnDay: m(3.5, 1),
  ratioLead: words('model', 'presque un jour', 'most of a day'),
  sourWeeks: words('model', 'trois semaines', 'three weeks'),
  sourEndLow: m(3.6, 1),
  sourEndHigh: m(4, 0),
  rescue100: m(2, 0, months),
  rescue50: m(4, 0, months),
  acidsUnderLoad: words('model', '100 à 106 mg/L', '100 to 106 mg/L'),
  phGap: words('model', '0,2 à 0,3', '0.2 to 0.3'),
  bufferCod: m(1.5, 1, ' g'),
  bufferKg: m(1.2, 1, ' kg'),
  co2FoodModel: m(39, 0, ' NL'),
  co2MarketModel: m(31, 0, ' NL'),
  stockVS: m(10.1, 1, ' kg'),
  condensate: m(2.5, 1, ' g'),
  modelTLow: m(30.6, 1, ' °C'),
  modelTHigh: m(32.5, 1, ' °C'),
  schoolYield: m(140, 0, ' L'),
  jump32: m(10.2, 1, ' kg'),
  jump25: m(7, 1, ' kg'),
  ramp25: m(14.5, 1, ' kg'),

  // ---- the same model where no plant was measured: below about 25 °C, or anywhere but Dar es Salaam
  eaHolds: w(43, 0, ' kJ/mol'),
  eaFails: w(44, 0, ' kJ/mol'),
  // the same switch in the live scenario, whose plant has lived at Geneva since April and not since a warm July (docs/physics.md §4.3)
  eaLiveHolds: w(44, 0, ' kJ/mol'),
  eaLiveFails: w(45, 0, ' kJ/mol'),
  genevaT: w(6, 0, ' °C'),
  steady15: w(94, 0, pct),
  soursColdLow: w(12, 0, ' °C'),
  soursColdHigh: w(14, 0, ' °C'),
  halfFood: w(69, 0, ' L'),
  marseilleLow: w(196, 0, ' L'),
  marseilleHigh: w(295, 0, ' L'),
  heatStraw: w(1.7, 1, ' kWh'),
  heatBare: w(22, 0, ' kWh'),
  gasEnergyCold: w(1.4, 1, ' kWh'),
  gasUsefulCold: w(0.75, 2, ' kWh'),
  drumHeatRatio: words('elsewhere', 'trois fois', 'three times'),
  drumLitres: w(93, 0, ' L'),
  drumPH: w(7.1, 1),
  drumMeq: w(81, 0, ' meq/L'),
  drumMinutes: w(27, 0, ' min'),
  jump20: w(4.9, 1, ' kg'),
  jump15: w(3.4, 1, ' kg'),
  ramp20: w(6, 1, ' kg'),
  ramp15: w(2.6, 1, ' kg'),

  // ---- assumptions: how the sums are run
  coldWaterKwh: a(0.46, 2, ' kWh'),
  eaClue: e(44, 0, ' kJ/mol'),
  eaDefault: e(60, 0, ' kJ/mol'),
  eaLow: e(40, 0, ' kJ/mol'),
  k15: e(0.29, 2),
  k37: e(1.71, 2),

  // ---- estimates: the sources are silent. Lengths from src/three/dims.ts, the rest from docs/research.md §3, docs/physics.md §1 and the kinetics of MODEL
  plantMass: e(900, 0, ' kg'),
  trappedL: e(Math.round(trappedVolume(PLANT_1000) * 100) * 10, 0, ' L'),
  bellMass: e(bellMass(PLANT_1000), 1, ' kg'),
  bellWall: e(BELL.wall * 1000, 0, ' mm'),
  tiltRest: e(PLANT_1000.tiltRest, 0, '°'),
  tiltFull: e(PLANT_1000.tiltFull, 0, '°'),
  topAtFull: e(PLANT_1000.bellRestRim + PLANT_1000.bellTravel + PLANT_1000.bellHeight, 2, ' m'),
  topOnPallet: e(PLANT_1000.bellRestRim + PLANT_1000.bellTravel + PLANT_1000.bellHeight + PALLET.h, 2, ' m'),
  restRim: e(PLANT_1000.bellRestRim, 2, ' m'),
  feedAxis: e(FEED.axisY * 100, 1, ' cm'),
  funnelR: e(FEED.funnelR * 100, 0, ' cm'),
  riserX: e(FEED.riserX, 3, ' m'),
  plugLength: e(FEED.plugLength * 100, 0, ' cm'),
  valveHeight: e(VALVES.bottomY * 100, 1, ' cm'),
  tapOffset: e(Math.hypot(TAP.x, TAP.z), 2, ' m'),
  padSize: size('m', '', PAD.halfX * 2, PAD.halfZ * 2, PAD.h),
  palletSize: size('m', '', PALLET.x, PALLET.z, PALLET.h),
  brickSize: size('cm', '', BRICK.w * 100, BRICK.d * 100, BRICK.h * 100),
  buttSize: size('m', 'Ø', YARD.buttR * 2, YARD.buttH),
  bucketSize: size('m', 'Ø', BUCKET.rTop * 2, BUCKET.h),
  kitchenDistance: e(Math.abs(YARD.kitchenZ), 1, ' m'),
  eaveHeight: e(YARD.houseEave, 1, ' m'),
  ridgeHeight: e(YARD.houseRidge, 1, ' m'),
  treeHeight: e(YARD.treeH, 1, ' m'),
  sleeveHeight: e(YARD.sleeveY, 2, ' m'),
  wallT: e(LINE.wallT * 100, 0, ' cm'),
  ventHeight: e(LINE.ventY, 1, ' m'),
  detectorHeight: e(LINE.detectorY, 2, ' m'),
  standH: e(LINE.standH * 100, 0, ' cm'),
  trapY: e(LINE.trapY, 2, ' m'),
  reliefDepth: e(8, 0, ' cm'), // gasline/scene.ts, the modeler's estimate, docs/3d.md
  hoseSlope: e(MODEL.hoseSlope, 0, pct),
  flameLimit: e(MODEL.flameMinPressure / 100, 0, ' mbar'),
  metabolicW: e(4, 0, ' W'),
  kFast: e(MODEL.kFast, 1),
  kSlow: e(MODEL.kSlow, 2),
  kMethanogen: e(MODEL.km, 1),
  yieldMethanogen: e(MODEL.yieldX, 2),
  deathRate: e(MODEL.decay, 2),
  phLow: e(MODEL.methanogenPHLow, 0),
  phHigh: e(MODEL.methanogenPHHigh, 0),
  phHydrolysis: e(MODEL.hydrolysisPHHigh, 1),
  carbShare: e(85, 0, pct),
  seedOK: e(0.2, 1, cod),
  seedFail: e(0.15, 2, cod),
  schoolLow: e(520, 0, ' L'),
  schoolHigh: e(777, 0, ' L'),
  rimBreakEven: e(11, 0, pct),
  leakCo2: e(220, 0, ' kg'),
  lpgCo2: e(125, 0, ' kg'),
} as const satisfies Record<string, Fig>;

export type FigName = keyof typeof FIG;

/** A year at Geneva after a summer's start, 2 kg/d of leftovers, litres a day month by month from July, docs/physics.md §4.3 and firstWinter in src/sim/runs.ts: a test holds each row. */
export const GENEVA_MONTHS = [
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
] as const;
export const GENEVA_TABLE: readonly {
  key: string;
  fr: string;
  en: string;
  patch: { Ea?: number; feedKg?: number; wallU?: number };
  pause?: number[];
  rows: readonly number[];
}[] = [
  {
    key: 'ea40',
    fr: 'Cuve nue, 40 kJ/mol',
    en: 'Bare, 40 kJ/mol',
    patch: { Ea: 40000 },
    rows: [251, 240, 216, 194, 181, 184, 205, 228, 254, 263, 274, 279],
  },
  {
    key: 'ea44',
    fr: 'Cuve nue, 44 kJ/mol',
    en: 'Bare, 44 kJ/mol',
    patch: { Ea: 44000 },
    rows: [250, 239, 213, 188, 175, 153, 0, 0, 0, 0, 0, 0],
  },
  {
    key: 'ea60',
    fr: 'Cuve nue, 60 kJ/mol',
    en: 'Bare, 60 kJ/mol',
    patch: {},
    rows: [245, 231, 198, 166, 47, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    key: 'ea80',
    fr: 'Cuve nue, 80 kJ/mol',
    en: 'Bare, 80 kJ/mol',
    patch: { Ea: 80000 },
    rows: [239, 221, 178, 98, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    key: 'half',
    fr: 'Moitié moins de nourriture',
    en: 'Half the food',
    patch: { feedKg: 1 },
    rows: [115, 108, 92, 77, 69, 71, 88, 109, 130, 134, 142, 144],
  },
  {
    key: 'pause',
    fr: 'Rien de novembre à mars',
    en: 'No food, Nov to Mar',
    patch: {},
    pause: [11, 12, 1, 2, 3],
    rows: [245, 231, 198, 166, 69, 14, 8, 8, 9, 161, 254, 273],
  },
  {
    key: 'straw',
    fr: 'En paille, sans chauffage',
    en: 'In straw, no heating',
    patch: { wallU: 0.25 },
    rows: [249, 238, 211, 180, 124, 0, 0, 0, 0, 0, 0, 0],
  },
];

/** A mean day held at 30 °C, kWh/d: water and food, walls, sun, what a heater is asked. docs/physics.md §4.4; heatBudget in src/sim/runs.ts. The gas holds 1.37 kWh/d. */
export const HEAT_TABLE: readonly {
  site: 'geneva' | 'marseille';
  month: number;
  straw: boolean;
  fr: string;
  en: string;
  feed: number;
  wall: number;
  sun: number;
  need: number;
  watts: number;
}[] = [
  {
    site: 'geneva',
    month: 1,
    straw: false,
    fr: 'Genève, janvier, nue',
    en: 'Geneva, January, bare',
    feed: 0.66,
    wall: 24.1,
    sun: 2.4,
    need: 22.3,
    watts: 930,
  },
  {
    site: 'geneva',
    month: 1,
    straw: true,
    fr: 'Genève, janvier, paille',
    en: 'Geneva, January, straw',
    feed: 0.66,
    wall: 1.2,
    sun: 0.12,
    need: 1.74,
    watts: 73,
  },
  {
    site: 'geneva',
    month: 4,
    straw: true,
    fr: 'Genève, avril, paille',
    en: 'Geneva, April, straw',
    feed: 0.44,
    wall: 0.81,
    sun: 0.24,
    need: 1.01,
    watts: 42,
  },
  {
    site: 'marseille',
    month: 1,
    straw: true,
    fr: 'Marseille, janvier, paille',
    en: 'Marseille, January, straw',
    feed: 0.47,
    wall: 0.86,
    sun: 0.15,
    need: 1.18,
    watts: 49,
  },
];
