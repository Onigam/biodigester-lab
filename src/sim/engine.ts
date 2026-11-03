import type { LabSim } from '@onigam/lab-kit/ui';
import { ATMOSPHERE, CH4_KG_PER_NL, CH4_WH_PER_NL, DAY, NL_PER_MOL, waterVapourPressure, wetMolarVolume } from './bio';
import { midMonth, monthOf, type SiteId } from './climate';
import { DRAWN_MACHINE, innerDepression, MODEL, surfaceArea, trappedVolume, type MachineId } from './machine';
import { Plant, SCUM_SHARE, SCUM_VS, SLUDGE_SHARE, SLUDGE_VS, STOCK_VS_SHARE } from './plant';
import {
  presetParams,
  RANGES,
  RUN_IN_DAYS,
  scenarioSetup,
  type RangedKey,
  type ScenarioSetup,
  type ScheduledEvent,
} from './presets';
import type { AlarmKey, BioParams, BioState, PresetId, ScenarioId, Scope } from './types';

// BiodigesterSim: the whole machine as the kit's `LabSim`. One clock: the day moves on `dt × timeScale`, in fixed steps of 30 s, so that the same inputs give the same state on any machine (tested) and a week per
// second stays cheap. The flame's flicker, the bubbles' speed and the like are the 3D's, on `view.slowMo`, from the rates in the state. Deterministic: nothing is drawn at random, nothing reads a wall clock.

/** Longest real step taken at once, s. */
const DT_MAX = 0.25;
/** The fixed step of the simulation, s. */
export const STEP = 30;
/** Most steps in one frame. A day per second at 60 fps takes 48; past this the clock falls behind, the same way on any machine. */
const MAX_STEPS = 720;
/** One sample per simulated hour, sixty days of them. */
const SCOPE_EVERY = 3600;
const SCOPE_LENGTH = 1440;

/** Below this slurry temperature, no plant of the kind was measured by any source read. research §2.10. */
export const MEASURED_T_MIN = 25;
/** The one place a plant of this kind was measured by a source read. */
export const MEASURED_SITE: SiteId = 'dar-es-salaam';
/** The sizes a source measured at that place (K19, K35): the other presets are the same model with no plant behind them. */
export const MEASURED_MACHINES: readonly MachineId[] = ['plant-1000', 'school-4000'];
/** S8's limit for unstirred plants, kg VS/m³·d (K15). */
export const LOAD_LIMIT = 2;
/** Acids against the buffer past which S7 calls a plant overfed (0.3), and S5's pH to avoid (6). */
export const RATIO_LIMIT = 0.3;
export const PH_AVOID = 6;
/** Below this the model's methanogens have all but stopped: the lab calls it soured. */
export const PH_SOURED = 5.5;
/** S8: below this mean, « does not work satisfactorily » (K44). */
export const COLD_LIMIT = 15;
/** Above the mesophilic optimum's end, and near freezing. */
export const HOT_LIMIT = 40;
export const FREEZE_NEAR = 2;

const TIME_KEYS: (keyof BioParams)[] = ['slowMo', 'timeScale', 'running'];

/** The notice that the flame went out stays this long, s of the simulated clock. */
const FLAME_OUT_NOTICE = 2 * 3600;

const SOUR_START = 6.2;
const SOUR_END = 4.5;

/** The drop's colours, sRGB 0 to 1: a working olive, an ochre, a rust. */
const DROP_STOPS: readonly (readonly [number, number, number])[] = [
  [0.48, 0.56, 0.24],
  [0.76, 0.56, 0.17],
  [0.65, 0.27, 0.16],
];

const newState = (): BioState => ({
  simTime: 0,
  dayNumber: 0,
  dayOfYear: 0,
  hour: 0,
  month: 1,
  airT: 25,
  sunG: 0,
  sunAlt: 0,
  sunAz: 0,
  slurryT: 25,
  feedWaterT: 25,
  sunGainW: 0,
  heaterW: 0,
  wallLossW: 0,
  pH: 7,
  acidsGL: 0,
  acidsMeq: 0,
  alkalinityMeq: 0,
  acidRatio: 0,
  methanogensGL: 0,
  kFactor: 1,
  hydrolysisActivity: 1,
  methanogenActivity: 1,
  hydrolysisRate: 0,
  acidRate: 0,
  uptakeRate: 0,
  sourIndex: 0,
  dropRgb: [DROP_STOPS[0]![0], DROP_STOPS[0]![1], DROP_STOPS[0]![2]],
  loadingRate: 0,
  hrtDays: 0,
  srtDays: 0,
  stockVS: 0,
  stockTS: 0,
  scumHeight: 0,
  sludgeHeight: 0,
  bubblesLph: 0,
  bubblesBellLph: 0,
  bubblesRimLph: 0,
  overflowLph: 0,
  ch4Share: 0,
  co2Share: 0,
  airShare: 0,
  vapourShare: 0,
  h2sPpm: null,
  h2sTag: 'unknown',
  bellLitres: 0,
  bellUsableLitres: 0,
  bellTrappedLitres: 0,
  bellRise: 0,
  bellRiseShare: 0,
  bellRimHeight: 0,
  bellTopHeight: 0,
  bellTilt: 0,
  pressurePa: 0,
  pressureMbar: 0,
  effectiveWeight: 0,
  bellResting: false,
  bellFull: false,
  levelRing: 0,
  levelRiser: 0,
  levelInner: 0,
  burnerOpen: false,
  flameOn: false,
  burnerLph: 0,
  burnerMbar: 0,
  hoseDropMbar: 0,
  waterPlugMbar: 0,
  flamePowerW: 0,
  usefulPowerW: 0,
  flameShare: 0,
  flameOutCause: 'none',
  hoseWaterMl: 0,
  trapWaterMl: 0,
  todayGasL: 0,
  todayCh4G: 0,
  todayKWh: 0,
  todayFlameMin: 0,
  dayGasL: 0,
  dayGasNL: 0,
  dayCh4NL: 0,
  dayCh4G: 0,
  dayKWh: 0,
  dayFlameMin: 0,
  dayLostShare: 0,
  dayEffluentL: 0,
  dayHeaterKWh: 0,
  dayFeedColdKWh: 0,
  regime: 'inside-measurements',
  siteMeasured: true,
  figureTag: '†',
  onDrawnMachine: true,
  feedCount: 0,
  flameLitCount: 0,
  flameOutCount: 0,
  fullBellCount: 0,
  souredCount: 0,
  alarms: [],
});

export class BiodigesterSim implements LabSim {
  readonly params: BioParams;
  readonly state: BioState = newState();
  readonly scope: Scope = {
    t: [],
    gasLph: [],
    bellLitres: [],
    pH: [],
    slurryT: [],
    airT: [],
    acids: [],
    ch4: [],
    flame: [],
  };
  private plant!: Plant;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private nextEvent = 0;
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = DRAWN_MACHINE;
  private pending = 0;
  private sinceScope = 0;
  private wasSoured = false;

  constructor() {
    this.params = presetParams(DRAWN_MACHINE);
    this.applyPreset(DRAWN_MACHINE);
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped to their range). Anything but the time controls turns the preset into 'custom'. */
  set(patch: Partial<BioParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const k = key as keyof BioParams;
      if (k === 'machine') {
        this.applyPreset(value as MachineId);
        continue;
      }
      if (key in RANGES) {
        const r = RANGES[key as RangedKey];
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (!TIME_KEYS.includes(k) && k !== 'preset') physical = true;
      this.applyLive(k);
    }
    if (physical && patch.preset === undefined) this.params.preset = 'custom';
    this.plant.settle();
    this.refreshState();
    this.emit();
  }

  /** What a key must do at once, beyond being read at the next step. */
  private applyLive(k: keyof BioParams): void {
    const pl = this.plant;
    const p = this.params;
    if (k === 'hoseWater') pl.hoseMl = p.hoseWater;
    else if (k === 'bellWall') pl.m.bellWall = p.bellWall;
    else if (k === 'burner') {
      if (p.burner === 'on') pl.light();
      else if (p.burner === 'off') pl.shut();
    } else if (k === 'month' && p.seasons) pl.setClock(midMonth(p.month), pl.hour);
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load({ params: presetParams(id as PresetId), spinUp: RUN_IN_DAYS, bellFill: 0.3, startHour: 6, events: [] });
  }

  /** `from`: what differs from the scenario's own settings, in the plant's whole history too: the panel's Ea slider asks how the same plant would have lived at another Ea. */
  applyScenario(id: string, from: Partial<BioParams> = {}): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    const setup = scenarioSetup(id as ScenarioId);
    this.load({ ...setup, params: { ...setup.params, ...from } });
  }

  /** The scenario the plant is running, if it came from one: its lesson stays in the panel while the visitor tries things. */
  get scenarioNow(): ScenarioId | null {
    return this.lastKind === 'scenario' ? (this.lastId as ScenarioId) : null;
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  /** A gesture for the film and the panel: one feed, now. */
  feedNow(): void {
    this.plant.feedNow();
    this.refreshState();
    this.emit();
  }

  /** A gesture: light the burner, whatever the hour. It holds for the machine's meal, or until it goes out. A burner set to closed opens to its meals, or the next step would shut it again. */
  lightBurner(): void {
    if (this.params.burner === 'off') this.params.burner = 'meals';
    this.plant.mealLeft = Math.max(this.plant.mealLeft, (this.params.cookMinutes / 2) * 60);
    this.plant.light();
    this.refreshState();
    this.emit();
  }

  /** A gesture: close the tap. */
  shutBurner(): void {
    this.plant.shut();
    this.refreshState();
    this.emit();
  }

  private load(s: ScenarioSetup): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running };
    Object.assign(this.params, s.params, keep);
    this.events = [...s.events].sort((a, b) => a.day - b.day);
    this.nextEvent = 0;
    this.pending = 0;
    this.sinceScope = 0;
    this.wasSoured = false;
    this.state.souredCount = 0;
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
    const p = this.params;
    const pl = new Plant(p);
    pl.setClock(midMonth(p.month), s.startHour);
    pl.runIn(s.spinUp, 1800, s.bellFill);
    this.plant = pl;
    this.afterBuild();
    this.fireEvents();
    this.refreshState();
    this.sample();
    this.emit();
  }

  private afterBuild(): void {
    const s = this.state;
    const m = this.plant.m;
    s.onDrawnMachine = m.id === DRAWN_MACHINE;
    s.levelRing = m.overflowLevel;
    s.levelRiser = m.overflowLevel;
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    if (!this.params.running) return;
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (dt === 0) return;
    this.pending += dt * this.params.timeScale;
    let n = 0;
    while (this.pending >= STEP && n < MAX_STEPS) {
      this.plant.step(STEP);
      this.pending -= STEP;
      this.sinceScope += STEP;
      this.fireEvents();
      if (this.sinceScope >= SCOPE_EVERY) {
        this.sinceScope -= SCOPE_EVERY;
        this.refreshState();
        this.sample();
      }
      n++;
    }
    if (this.pending >= STEP) this.pending = 0;
    this.refreshState();
  }

  private fireEvents(): void {
    const day = this.plant.elapsed / DAY;
    while (this.nextEvent < this.events.length && day >= this.events[this.nextEvent]!.day) {
      const e = this.events[this.nextEvent]!;
      this.nextEvent++;
      if (e.patch) {
        const preset = this.params.preset;
        this.set(e.patch);
        this.params.preset = preset;
      }
      if (e.feed) this.plant.feedNow();
      if (e.light) this.plant.light();
    }
  }

  /** The plant, for a test and the panel's charts. */
  get plantNow(): Plant {
    return this.plant;
  }

  // ------------------------------------------------------------------ the state

  private refreshState(): void {
    const s = this.state;
    const p = this.params;
    const pl = this.plant;
    const m = pl.m;
    const c = pl.chain;
    const f = pl.flux;
    const litres = c.volume * 1000;
    const T = pl.T;

    s.simTime = pl.elapsed;
    s.dayNumber = Math.floor(pl.elapsed / DAY);
    s.dayOfYear = ((pl.weatherDay % 365) + 365) % 365;
    s.hour = pl.hour;
    s.month = monthOf(s.dayOfYear);

    s.airT = pl.airT;
    s.sunG = pl.sunG;
    s.sunAlt = (Math.asin(Math.max(-1, Math.min(1, pl.sinAlt))) * 180) / Math.PI;
    s.sunAz = pl.sunAzimuth(s.hour);
    s.slurryT = T;
    s.feedWaterT = pl.meanAir;
    s.sunGainW = pl.sunGain;
    s.heaterW = pl.heater;
    s.wallLossW = pl.wallLoss;

    s.pH = f.pH;
    s.acidsGL = c.acid / c.volume;
    s.acidsMeq = pl.acidsMolar() * 1000;
    s.alkalinityMeq = (c.charge / litres) * 1000 - s.acidsMeq;
    // as the titrations do it: mg of acetic acid per L over mg CaCO₃ per L
    s.acidRatio = s.alkalinityMeq > 0 ? (s.acidsGL * (60 / 64) * 1000) / (s.alkalinityMeq * 50) : 9;
    s.methanogensGL = c.biomass / c.volume;
    s.kFactor = f.kFactor;
    s.hydrolysisActivity = f.hydrolysisActivity;
    s.methanogenActivity = f.methanogenActivity;
    s.hydrolysisRate = (f.hydrolysed / STEP) * DAY;
    s.acidRate = (f.acidMade / STEP) * DAY;
    s.uptakeRate = (f.uptake / STEP) * DAY;
    const sour = Math.max(0, Math.min(1, (SOUR_START - f.pH) / (SOUR_START - SOUR_END)));
    s.sourIndex = sour;
    const pos = sour * (DROP_STOPS.length - 1);
    const i = Math.min(DROP_STOPS.length - 2, Math.floor(pos));
    const w = pos - i;
    for (let k = 0; k < 3; k++) s.dropRgb[k] = DROP_STOPS[i]![k]! * (1 - w) + DROP_STOPS[i + 1]![k]! * w;

    const dailyLitres = p.feedKg * (1 + p.waterPerKg) + p.flushWater;
    s.hrtDays = dailyLitres > 0 ? litres / dailyLitres : Infinity;
    s.srtDays = s.hrtDays * Math.max(1, p.solidsRetention);
    s.loadingRate = pl.dailyVS() / c.volume;
    s.stockVS = pl.stockVS();
    s.stockTS = s.stockVS / STOCK_VS_SHARE;
    const inner = surfaceArea(m);
    s.scumHeight = (SCUM_SHARE * s.stockVS) / SCUM_VS / inner;
    s.sludgeHeight = (SLUDGE_SHARE * s.stockVS) / SLUDGE_VS / inner;

    const Vm = wetMolarVolume(T, ATMOSPHERE + pl.pressure);
    const toLph = Vm * 1000 * 3600;
    const bubbles = (pl.lastCH4 + pl.lastCO2) * toLph;
    s.bubblesLph = bubbles;
    s.bubblesRimLph = bubbles * p.rimLoss;
    s.bubblesBellLph = bubbles * (1 - p.rimLoss);
    s.overflowLph = pl.lastOver * toLph;
    const dry = pl.nCH4 + pl.nCO2 + pl.nAir;
    s.ch4Share = dry > 0 ? pl.nCH4 / dry : pl.lastCH4 / Math.max(pl.lastCH4 + pl.lastCO2, 1e-12);
    s.co2Share = dry > 0 ? pl.nCO2 / dry : 1 - s.ch4Share;
    s.airShare = dry > 0 ? pl.nAir / dry : 0;
    s.vapourShare = waterVapourPressure(T) / (ATMOSPHERE + pl.pressure);

    const trapped = trappedVolume(m);
    const total = dry * Vm;
    s.bellLitres = total * 1000;
    s.bellTrappedLitres = Math.min(trapped, total) * 1000;
    s.bellUsableLitres = Math.max(0, total - trapped) * 1000;
    s.bellRise = pl.rise;
    s.bellRiseShare = m.bellTravel > 0 ? pl.rise / m.bellTravel : 0;
    s.bellRimHeight = m.bellRestRim + pl.rise;
    s.bellTopHeight = s.bellRimHeight + m.bellHeight;
    s.bellTilt = m.tiltRest + (m.tiltFull - m.tiltRest) * s.bellRiseShare;
    s.pressurePa = pl.pressure;
    s.pressureMbar = pl.pressure / 100;
    s.effectiveWeight = pl.effectiveWeightNow();
    s.bellResting = pl.resting;
    s.bellFull = pl.full;
    s.levelInner = m.overflowLevel - innerDepression(pl.pressure);

    s.burnerOpen = pl.lit;
    s.flameOn = pl.flow > 0;
    s.burnerLph = pl.flow;
    s.burnerMbar = pl.burnerP / 100;
    s.hoseDropMbar = pl.hoseDrop / 100;
    s.waterPlugMbar = pl.plug / 100;
    s.flamePowerW = pl.flamePower;
    s.usefulPowerW = pl.flamePower * MODEL.burnerEfficiency;
    s.flameShare = p.burnerLph > 0 ? pl.flow / p.burnerLph : 0;
    s.flameOutCause = pl.flameOutCause;
    s.hoseWaterMl = pl.hoseMl;
    s.trapWaterMl = pl.trapMl;

    const b = pl.book;
    const mid = pl.midnight;
    const d = pl.lastDay;
    const ch4Today = (b.caughtCH4 - mid.caughtCH4) * NL_PER_MOL;
    s.todayGasL = b.caughtL - mid.caughtL;
    s.todayCh4G = ch4Today * CH4_KG_PER_NL * 1000;
    s.todayKWh = (ch4Today * CH4_WH_PER_NL) / 1000;
    s.todayFlameMin = (b.flameSeconds - mid.flameSeconds) / 60;
    const ch4Day = d.caughtCH4 * NL_PER_MOL;
    s.dayGasL = d.caughtL;
    s.dayGasNL = (d.caughtCH4 + d.caughtCO2) * NL_PER_MOL;
    s.dayCh4NL = ch4Day;
    s.dayCh4G = ch4Day * CH4_KG_PER_NL * 1000;
    s.dayKWh = (ch4Day * CH4_WH_PER_NL) / 1000;
    s.dayFlameMin = d.flameSeconds / 60;
    const rim = d.rimCH4 + d.rimCO2;
    const bubbled = d.caughtCH4 + d.caughtCO2 + rim;
    s.dayLostShare = bubbled > 0 ? (rim + d.overCH4 + d.overCO2) / bubbled : p.rimLoss;
    s.dayEffluentL = d.effluentL;
    s.dayHeaterKWh = d.heaterJ / 3.6e6;
    s.dayFeedColdKWh = d.feedColdJ / 3.6e6;

    s.regime = T < MEASURED_T_MIN ? 'below-measurements' : 'inside-measurements';
    s.siteMeasured = p.site === MEASURED_SITE;
    s.figureTag = s.regime === 'inside-measurements' && s.siteMeasured && MEASURED_MACHINES.includes(m.id) ? '†' : '*';

    s.feedCount = pl.feedCount;
    s.flameLitCount = pl.flameLitCount;
    s.flameOutCount = pl.flameOutCount;
    s.fullBellCount = pl.fullBellCount;
    const soured = f.pH < PH_SOURED;
    if (soured && !this.wasSoured) s.souredCount++;
    this.wasSoured = soured;

    s.alarms = this.alarms();
  }

  private alarms(): AlarmKey[] {
    const s = this.state;
    const a: AlarmKey[] = [];
    if (s.loadingRate > LOAD_LIMIT) a.push('overload');
    if (s.pH < PH_SOURED) a.push('soured');
    else if (s.pH < PH_AVOID || s.acidRatio > RATIO_LIMIT) a.push('souring');
    if (s.slurryT < FREEZE_NEAR) a.push('nearFreezing');
    else if (s.slurryT < COLD_LIMIT) a.push('tooCold');
    if (s.slurryT > HOT_LIMIT) a.push('tooHot');
    if (s.bellFull) a.push('bellFull');
    if (s.bellResting) a.push('bellResting');
    if (!s.burnerOpen && s.flameOutCause !== 'none' && this.plant.elapsed - this.plant.flameOutAt < FLAME_OUT_NOTICE) {
      a.push('flameOutGasLeft');
    }
    if (s.ch4Share < MODEL.leanFlame) a.push('leanGas');
    if (s.waterPlugMbar > 0.25 * Math.max(s.pressureMbar, 1)) a.push('hoseWater');
    if (s.airShare > 0.01) a.push('airInBell');
    return a;
  }

  private sample(): void {
    const sc = this.scope;
    const s = this.state;
    sc.t.push(s.simTime / DAY);
    sc.gasLph.push(s.bubblesBellLph);
    sc.bellLitres.push(s.bellUsableLitres);
    sc.pH.push(s.pH);
    sc.slurryT.push(s.slurryT);
    sc.airT.push(s.airT);
    sc.acids.push(s.acidsGL);
    sc.ch4.push(s.ch4Share * 100);
    sc.flame.push(s.burnerLph);
    if (sc.t.length > SCOPE_LENGTH) for (const k of Object.keys(sc) as (keyof Scope)[]) sc[k].shift();
  }
}
