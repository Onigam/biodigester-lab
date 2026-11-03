import type { SiteId } from './climate';
import type { MachineId } from './machine';

// The shared types of the simulation. The engine writes `BioState` every frame; the 3D worlds, the strip and the panel only read it. SI inside (m, Pa, W, J, mol), temperatures in °C, biological rates per
// day. The state also gives litres and millibars, the units every source of this lab speaks.

export type PresetId = MachineId;

export type ScenarioId =
  | 'measured-day'
  | 'market-waste'
  | 'ramp-to-five'
  | 'three-days-away'
  | 'overfeed'
  | 'half-brick'
  | 'full-bell'
  | 'geneva-january'
  | 'flame-out'
  | 'water-in-hose'
  | 'geneva-heated'
  | 'small-drum';

export type AlarmKey =
  | 'overload'
  | 'souring'
  | 'soured'
  | 'tooCold'
  | 'nearFreezing'
  | 'tooHot'
  | 'bellFull'
  | 'bellResting'
  | 'flameOutGasLeft'
  | 'leanGas'
  | 'hoseWater'
  | 'airInBell';

export type BurnerMode = 'meals' | 'on' | 'off';
export type FlameOutCause = 'none' | 'pressure' | 'resting' | 'lean' | 'water';

/** How far a figure can be trusted. Below about 25 °C no plant of this kind was measured by anyone the research read. */
export type Regime = 'inside-measurements' | 'below-measurements';

/** Everything the visitor can edit live (all through `BiodigesterSim.set`). Ranges are in presets.ts. All keys are flat: a film sets them directly. */
export interface BioParams {
  // ---- the kit's time controls
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  /** Where the values come from; 'custom' as soon as the visitor edits something physical. */
  preset: PresetId | 'custom';
  machine: MachineId;

  // ---- the feed
  /** kg wet per day, split into two feeds. */
  feedKg: number;
  /** Share of cooked leftovers in it, %; the rest is peelings. */
  shareCooked: number;
  /** Litres of water per kg. */
  waterPerKg: number;
  /** Water alone, L/d: what dilutes a soured tank. */
  flushWater: number;

  // ---- the kitchen
  /** Minutes of flame asked for per day, split into two meals. */
  cookMinutes: number;
  burner: BurnerMode;
  /** Burner's flow at the machine's reference pressure, L/h. */
  burnerLph: number;
  /** Exponent of pressure in the burner's law: 0.5 is an orifice. */
  burnerExponent: number;

  // ---- the bell
  /** Laid on the bell, kg. */
  addedWeight: number;
  /** Its wall, m. */
  bellWall: number;
  /** Share of the rising gas that misses it, 0 to 1. */
  rimLoss: number;

  // ---- the hose
  /** Water sitting at the low point, mL. Setting it moves the state's water; condensate adds to it if there is no trap. */
  hoseWater: number;
  /** Slope either side of the low point, %. */
  hoseSlope: number;
  /** A drained trap at the low point. */
  trap: boolean;

  // ---- the place
  site: SiteId;
  /** 1 to 12. With `seasons` off, the air and the sun stay on this month. */
  month: number;
  seasons: boolean;
  /** Hours of direct sun on the tank, centred on noon. */
  sunHours: number;
  /** W/m²·K: 5 bare, 0.25 in 15 cm of straw. */
  wallU: number;
  /** W. */
  heaterW: number;
  /** Thermostat, °C. */
  setPointT: number;
  /** Holds the slurry at this temperature, °C, for a test or a curve. Null: the heat balance decides. */
  fixedT: number | null;

  // ---- the kinetics, all estimates
  kFast: number;
  kSlow: number;
  /** J/mol. */
  Ea: number;
  /** Residence of solids over residence of liquid. */
  solidsRetention: number;
}

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface BioState {
  // ---- clock
  /** Seconds since the start. */
  simTime: number;
  /** Whole days since the start. */
  dayNumber: number;
  /** Day of the year the weather reads (0 = 1 January), hour of the day, month 1 to 12. */
  dayOfYear: number;
  hour: number;
  month: number;

  // ---- the sky and the heat
  airT: number;
  /** Sun on the horizontal, W/m². Degrees above the horizon; from south, positive west. */
  sunG: number;
  sunAlt: number;
  sunAz: number;
  slurryT: number;
  /** Temperature of the feed water, °C: the butt beside the tank, at the day's mean air. */
  feedWaterT: number;
  /** Sun and heater into the slurry, loss through the wall, cold of the feed spread over the day, W. */
  sunGainW: number;
  heaterW: number;
  wallLossW: number;

  // ---- the liquid
  pH: number;
  /** Fatty acids, g COD/L and meq/L. */
  acidsGL: number;
  acidsMeq: number;
  /** The buffer that is left, meq/L: cations less acids. */
  alkalinityMeq: number;
  /** Fatty acids against the buffer, the ratio operators titrate. */
  acidRatio: number;
  /** Methanogens, g COD/L. */
  methanogensGL: number;
  /** What the temperature makes of a rate, against 30 °C. */
  kFactor: number;
  /** Activity of hydrolysers and of methanogens as the pH leaves them, 0 to 1. */
  hydrolysisActivity: number;
  methanogenActivity: number;
  /** Rates through the chain: kg VS/d broken down, kg COD/d of acid made and eaten. */
  hydrolysisRate: number;
  acidRate: number;
  uptakeRate: number;
  /** 0 healthy, 1 soured; and the colour of the drop in sRGB, 0 to 1, written in place. */
  sourIndex: number;
  dropRgb: [number, number, number];

  // ---- the solids
  /** kg VS/m³·d, days, days. */
  loadingRate: number;
  hrtDays: number;
  srtDays: number;
  /** kg of volatile solids and of total solids in the tank. */
  stockVS: number;
  stockTS: number;
  /** Thickness of the floating layer and of the sludge, m, from what is in the tank at S5's layering. */
  scumHeight: number;
  sludgeHeight: number;

  // ---- the gas
  /** Bubbles leaving the liquid, L/h at the bell's conditions: all, under the bell, at the rim, over the top of a full bell. */
  bubblesLph: number;
  bubblesBellLph: number;
  bubblesRimLph: number;
  overflowLph: number;
  /** Shares in the dry gas of the bell, 0 to 1. Air is there only after a first fill. */
  ch4Share: number;
  co2Share: number;
  airShare: number;
  /** Share of water vapour in the wet gas. */
  vapourShare: number;
  /** H₂S is not modelled: its only measurement stopped at the instrument's ceiling. Always null, with its tag: unknown. */
  h2sPpm: null;
  h2sTag: 'unknown';

  // ---- the bell
  /** Gas in the bell, litres at its conditions: all of it, what can be drawn, what stays when it rests. */
  bellLitres: number;
  bellUsableLitres: number;
  bellTrappedLitres: number;
  /** Rise above its resting place, m, and as a share of the travel. */
  bellRise: number;
  bellRiseShare: number;
  /** Height of its rim and of its top above the tank's floor, m. */
  bellRimHeight: number;
  bellTopHeight: number;
  /** Degrees. estimate: from a drawing and by eye. */
  bellTilt: number;
  /** Pa and mbar. Zero once it rests: nothing weighs on the gas. */
  pressurePa: number;
  pressureMbar: number;
  /** kg the gas holds up. */
  effectiveWeight: number;
  /** Rests on its stop: nothing more can be drawn. */
  bellResting: boolean;
  /** Full: gas leaves over the rim. */
  bellFull: boolean;
  /** Free surface of the open ring and of the feed riser, m above the floor; inside the bell, pressed down by the gas. */
  levelRing: number;
  levelRiser: number;
  levelInner: number;

  // ---- the line and the flame
  burnerOpen: boolean;
  flameOn: boolean;
  /** L/h through the burner; mbar at the burner; mbar lost in the hose and to the water. */
  burnerLph: number;
  burnerMbar: number;
  hoseDropMbar: number;
  waterPlugMbar: number;
  /** W of methane going in, W reaching the pot. */
  flamePowerW: number;
  usefulPowerW: number;
  /** Flow against the burner's reference: what the flame's height follows. The real height was not measured. */
  flameShare: number;
  flameOutCause: FlameOutCause;
  /** Water at the low point, mL; water in the trap, mL. */
  hoseWaterMl: number;
  trapWaterMl: number;

  // ---- today from midnight, and the last whole day
  todayGasL: number;
  todayCh4G: number;
  todayKWh: number;
  todayFlameMin: number;
  dayGasL: number;
  dayGasNL: number;
  dayCh4NL: number;
  dayCh4G: number;
  /** Energy in the gas caught, kWh. */
  dayKWh: number;
  dayFlameMin: number;
  /** Share of what bubbled that did not reach the burner or the bell: at the rim and over the top. */
  dayLostShare: number;
  dayEffluentL: number;
  /** Heat added by the heater and carried off by the cold feed, kWh. */
  dayHeaterKWh: number;
  dayFeedColdKWh: number;

  // ---- honesty
  /** Inside what anyone measured, or below it. */
  regime: Regime;
  /** The place is the one where a plant was measured. */
  siteMeasured: boolean;
  /** † a model result on conditions a plant was measured in; * the same model where no plant was measured: below about 25 °C, or anywhere but Dar es Salaam. */
  figureTag: '†' | '*';
  /** The drawn machine, or one that runs in the charts only. */
  onDrawnMachine: boolean;

  // ---- moments, for a film: numbers that rise
  feedCount: number;
  flameLitCount: number;
  flameOutCount: number;
  fullBellCount: number;
  souredCount: number;

  alarms: AlarmKey[];
}

/** The last weeks of the live quantities, one sample per simulated hour. */
export interface Scope {
  t: number[];
  gasLph: number[];
  bellLitres: number[];
  pH: number[];
  slurryT: number[];
  airT: number[];
  acids: number[];
  ch4: number[];
  flame: number[];
}
