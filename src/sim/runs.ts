import { ATMOSPHERE, CH4_KG_PER_NL, CH4_WH_PER_NL, DAY, NL_PER_MOL, wetMolarVolume } from './bio';
import { MONTH_DAYS, SITES, type SiteId } from './climate';
import { skin, trappedVolume, type MachineId } from './machine';
import { Plant, type Book, type PlantOptions } from './plant';
import { presetParams, RUN_IN_DAYS } from './presets';
import type { BioParams } from './types';

// Long runs: what the tests, the docs and the panel's charts read. The live engine steps at 30 s; these at 10 or 30 minutes, which the convergence test holds to the same answer.

export const RUN_STEP = 600;

/** What a stretch of days gave. */
export interface Measured {
  days: number;
  /** Gas caught by the bell per day: litres at its conditions, normal litres, normal litres of CH4. */
  gasL: number;
  gasNL: number;
  ch4NL: number;
  /** Share of CH4 in the dry gas caught. */
  ch4Share: number;
  /** g of CH4 and kWh in it per day. */
  ch4G: number;
  kWh: number;
  /** Lost at the rim and over the top, NL/d, and as a share of what bubbled. */
  lostNL: number;
  lostShare: number;
  /** CO2 taken away by the liquid and the open surface, NL/d. */
  co2SinkNL: number;
  pH: number;
  T: number;
  acidsGL: number;
  /** meq/L of cations in the liquid, the buffer the titrations read. */
  chargeMeq: number;
  burntL: number;
  flameMin: number;
  /** Share of the VS, the COD and the total solids in that did not leave with the effluent over these days. */
  vsRemoval: number;
  codRemoval: number;
  tsRemoval: number;
  /** The day's feed and the methanogens at the end. */
  feedKg: number;
  methanogens: number;
  stockVS: number;
  heaterKWh: number;
}

const diff = (a: Book, b: Book, k: keyof Book): number => a[k] - b[k];

/** Run `days` and report on them. */
export function measure(pl: Plant, days: number, step = RUN_STEP): Measured {
  const before: Book = { ...pl.book };
  const n = Math.round((days * DAY) / step);
  let pH = 0;
  let T = 0;
  let acid = 0;
  let charge = 0;
  for (let i = 0; i < n; i++) {
    pl.step(step);
    pH += pl.flux.pH;
    T += pl.T;
    acid += pl.chain.acid;
    charge += pl.chain.charge;
  }
  const b = pl.book;
  const litres = pl.chain.volume * 1000;
  const ch4 = diff(b, before, 'caughtCH4');
  const co2 = diff(b, before, 'caughtCO2');
  const rim = diff(b, before, 'rimCH4') + diff(b, before, 'rimCO2');
  const lost = rim + diff(b, before, 'overCH4') + diff(b, before, 'overCO2');
  const bubbled = ch4 + co2 + rim;
  const vsIn = diff(b, before, 'vsIn');
  const vsOut = diff(b, before, 'vsOut');
  const ashIn = diff(b, before, 'ashIn');
  const tsIn = vsIn + ashIn;
  const tsOut = vsOut + ashIn;
  return {
    days,
    gasL: diff(b, before, 'caughtL') / days,
    gasNL: ((ch4 + co2) * NL_PER_MOL) / days,
    ch4NL: (ch4 * NL_PER_MOL) / days,
    ch4Share: ch4 + co2 > 0 ? ch4 / (ch4 + co2) : 0,
    ch4G: ((ch4 * NL_PER_MOL) / days) * CH4_KG_PER_NL * 1000,
    kWh: (((ch4 * NL_PER_MOL) / days) * CH4_WH_PER_NL) / 1000,
    lostNL: (lost * NL_PER_MOL) / days,
    lostShare: bubbled > 0 ? lost / bubbled : 0,
    co2SinkNL: (diff(b, before, 'stripCO2') * NL_PER_MOL) / days,
    pH: pH / n,
    T: T / n,
    acidsGL: acid / n / pl.chain.volume,
    chargeMeq: ((charge / n) * 1000) / litres,
    burntL: diff(b, before, 'burntL') / days,
    flameMin: diff(b, before, 'flameSeconds') / 60 / days,
    vsRemoval: vsIn > 0 ? 1 - vsOut / vsIn : 0,
    codRemoval: diff(b, before, 'codAllIn') > 0 ? 1 - diff(b, before, 'codAllOut') / diff(b, before, 'codAllIn') : 0,
    tsRemoval: tsIn > 0 ? 1 - tsOut / tsIn : 0,
    feedKg: diff(b, before, 'feedKg') / days,
    methanogens: pl.chain.biomass,
    stockVS: pl.stockVS(),
    heaterKWh: diff(b, before, 'heaterJ') / 3.6e6 / days,
  };
}

/** Parameters of a machine with some keys moved. */
export const paramsOf = (machine: MachineId, patch: Partial<BioParams> = {}): BioParams => ({
  ...presetParams(machine),
  cookMinutes: 0,
  ...patch,
});

/** A plant that has lived `spin` days on these settings, ten more measured: what « steady » means for a yield. */
export function steady(
  patch: Partial<BioParams> = {},
  machine: MachineId = 'plant-1000',
  spin = 300,
  options: PlantOptions = {},
): Measured {
  const pl = new Plant(paramsOf(machine, patch), options);
  pl.runIn(spin);
  return measure(pl, 10);
}

// ------------------------------------------------------------------------------------------------ the thesis, as it happened

/**
 * S5's feeding plan, read for this role from Table 14, Figs. 16, 17, 32 and Table 18. Day 0 is 10 August 2008 (« 25.08.08 (day 15) », « 29.08.-07.09.2008 (day 19-28) »). Filled at the start of the month and ten days unfed; its
 * ramp from day 1; two kilos of food waste; one kilo from day 29; none on days 37 and 38; then market waste, half a kilo to one, two from day 44; a pause; up to five kilos of market waste by day 76; three days without; up to five
 * kilos of food waste; nothing on days 97 to 102; two kilos again. Where Table 14 gives a range, the plan runs it straight.
 */
export interface PlanRow {
  from: number;
  to: number;
  kgFrom: number;
  kgTo: number;
  cooked: number;
  water: number;
}

export const THESIS_PLAN: readonly PlanRow[] = [
  { from: 1, to: 8, kgFrom: 0.3, kgTo: 2, cooked: 100, water: 9 },
  { from: 8, to: 29, kgFrom: 2, kgTo: 2, cooked: 100, water: 9 },
  { from: 29, to: 37, kgFrom: 1, kgTo: 1, cooked: 100, water: 9 },
  { from: 39, to: 44, kgFrom: 0.5, kgTo: 1, cooked: 0, water: 9 },
  { from: 44, to: 57, kgFrom: 2, kgTo: 2, cooked: 0, water: 9 },
  { from: 64, to: 71, kgFrom: 1, kgTo: 3, cooked: 0, water: 8 },
  { from: 71, to: 77, kgFrom: 4, kgTo: 5, cooked: 0, water: 8 },
  { from: 80, to: 85, kgFrom: 1, kgTo: 2, cooked: 100, water: 8 },
  { from: 85, to: 90, kgFrom: 3, kgTo: 3, cooked: 100, water: 8 },
  { from: 90, to: 94, kgFrom: 4, kgTo: 4, cooked: 100, water: 8 },
  { from: 94, to: 97, kgFrom: 5, kgTo: 5, cooked: 100, water: 8 },
  { from: 103, to: 108, kgFrom: 2, kgTo: 2, cooked: 100, water: 9 },
];

/** The plan's feed on a day. */
export function planOn(day: number): { kg: number; cooked: number; water: number } {
  for (const r of THESIS_PLAN) {
    if (day >= r.from && day < r.to) {
      const w = (day - r.from) / (r.to - r.from);
      return { kg: r.kgFrom + (r.kgTo - r.kgFrom) * w, cooked: r.cooked, water: r.water };
    }
  }
  return { kg: 0, cooked: 100, water: 9 };
}

/** Day of the year of day 0, and the day of the filling. */
const DAY_ZERO = 222;
export const FIRST_DAY = -10;

export interface ThesisRun {
  /** Day by day from the filling, one row a day. */
  rows: {
    day: number;
    kg: number;
    gasNL: number;
    gasL: number;
    ch4Share: number;
    pH: number;
    T: number;
    acidsGL: number;
    chargeMeq: number;
    stockVS: number;
  }[];
  at(day: number): ThesisRun['rows'][number];
  /** Mean of the rows of [from, to). */
  mean(
    from: number,
    to: number,
  ): { gasNL: number; gasL: number; ch4Share: number; pH: number; T: number; acidsGL: number; chargeMeq: number };
  plant: Plant;
}

/** S5's fifteen weeks, from the filling. */
export function thesisRun(patch: Partial<BioParams> = {}, options: PlantOptions & { seed?: number } = {}): ThesisRun {
  const p = paramsOf('plant-1000', { seasons: true, feedKg: 0, ...patch });
  const pl = new Plant(p, { ...options, startDay: DAY_ZERO + FIRST_DAY });
  pl.inoculate(60, options.seed);
  const rows: ThesisRun['rows'] = [];
  for (let d = FIRST_DAY; d < 108; d++) {
    const plan = planOn(d);
    p.feedKg = plan.kg;
    p.shareCooked = plan.cooked;
    p.waterPerKg = plan.water;
    const m = measure(pl, 1);
    rows.push({
      day: d,
      kg: plan.kg,
      gasNL: m.gasNL,
      gasL: m.gasL,
      ch4Share: m.ch4Share,
      pH: m.pH,
      T: m.T,
      acidsGL: m.acidsGL,
      chargeMeq: m.chargeMeq,
      stockVS: m.stockVS,
    });
  }
  const at = (day: number) => rows[day - FIRST_DAY]!;
  const mean = (from: number, to: number) => {
    const span = rows.slice(from - FIRST_DAY, to - FIRST_DAY);
    const avg = (k: 'gasNL' | 'gasL' | 'ch4Share' | 'pH' | 'T' | 'acidsGL' | 'chargeMeq'): number =>
      span.reduce((s, r) => s + r[k], 0) / span.length;
    return {
      gasNL: avg('gasNL'),
      gasL: avg('gasL'),
      ch4Share: avg('ch4Share'),
      pH: avg('pH'),
      T: avg('T'),
      acidsGL: avg('acidsGL'),
      chargeMeq: avg('chargeMeq'),
    };
  };
  return { rows, at, mean, plant: pl };
}

// ------------------------------------------------------------------------------------------------ one meal, the kinetics in the open

/**
 * What one extra meal gives, and how fast: the difference between a plant fed on, and the same plant given one more feed. Days for half and 90 % of what it adds to arrive. `shareCooked` 100 or 0.
 */
export function mealResponse(patch: Partial<BioParams> = {}): { half: number; ninety: number } {
  const base = paramsOf('plant-1000', { shareCooked: 100, ...patch });
  const run = (extra: boolean): number[] => {
    const pl = new Plant({ ...base });
    pl.runIn(RUN_IN_DAYS);
    if (extra) pl.feedNow();
    const out: number[] = [];
    for (let i = 0; i < 2400; i++) {
      pl.step(1800);
      out.push(pl.book.caughtCH4);
    }
    return out;
  };
  const a = run(false);
  const b = run(true);
  const last = b[b.length - 1]! - a[a.length - 1]!;
  const when = (share: number): number => {
    for (let i = 0; i < a.length; i++) if (b[i]! - a[i]! >= share * last) return ((i + 1) * 1800) / DAY;
    return Infinity;
  };
  return { half: when(0.5), ninety: when(0.9) };
}

// ------------------------------------------------------------------------------------------------ temperature

export interface ColdRow {
  T: number;
  gasL: number;
  /** Against the same plant at 30 °C. */
  share: number;
  ch4NL: number;
  pH: number;
  acidsGL: number;
}

/** The plant held at a temperature, lived in for a long time: what steady gas and pH the model finds. It starts warm and is brought down, as a season would. */
export function coldSweep(temperatures: readonly number[], patch: Partial<BioParams> = {}): ColdRow[] {
  const at = (T: number): Measured => {
    const pl = new Plant(paramsOf('plant-1000', { shareCooked: 100, ...patch, fixedT: 30 }));
    pl.runIn(RUN_IN_DAYS);
    pl.p.fixedT = T;
    measure(pl, 300, 1800);
    return measure(pl, 10);
  };
  const base = at(30);
  return temperatures.map((T) => {
    const m = at(T);
    return { T, gasL: m.gasL, share: m.ch4NL / base.ch4NL, ch4NL: m.ch4NL, pH: m.pH, acidsGL: m.acidsGL };
  });
}

/** Did this plant sour? pH under 5.5 at any time of a run, as S5's words put 6 as the limit and the model's methanogens stop by 5.5. */
export function sours(patch: Partial<BioParams>, kg: number, days = 60, machine: MachineId = 'plant-1000'): boolean {
  const pl = new Plant(paramsOf(machine, { shareCooked: 100, ...patch }));
  pl.runIn(RUN_IN_DAYS);
  pl.p.feedKg = kg;
  const steps = (days * DAY) / 3600;
  for (let i = 0; i < steps; i++) {
    pl.step(3600);
    if (pl.flux.pH < 5.5) return true;
  }
  return false;
}

/** The sudden daily feed that sours a plant used to 2 kg/d, kg/d, to 0.25 kg, at a held temperature. Nothing up to `limit`: Infinity. */
export function souringFeed(T: number, patch: Partial<BioParams> = {}, limit = 40): number {
  // the plant learns its food at the temperature it lives at
  const held = { ...patch, fixedT: T };
  if (!sours(held, limit)) return Infinity;
  let lo = 0;
  let hi = limit;
  while (hi - lo > 0.25) {
    const mid = (lo + hi) / 2;
    if (sours(held, mid)) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** The feed a plant carries for good at a held temperature, kg/d: a slow ramp, a long time. */
export function carriedFeed(T: number, patch: Partial<BioParams> = {}): number {
  const ok = (kg: number): boolean => {
    const pl = new Plant(paramsOf('plant-1000', { shareCooked: 100, ...patch, fixedT: T, feedKg: kg / 4 }));
    pl.runIn(RUN_IN_DAYS);
    for (let week = 1; week <= 12; week++) {
      pl.p.feedKg = kg / 4 + ((kg * 3) / 4) * (week / 12);
      for (let i = 0; i < 168; i++) {
        pl.step(3600);
        if (pl.flux.pH < 5.5) return false;
      }
    }
    for (let i = 0; i < 24 * 120; i++) {
      pl.step(3600);
      if (pl.flux.pH < 5.5) return false;
    }
    return true;
  };
  let lo = 0;
  let hi = 40;
  if (ok(hi)) return Infinity;
  while (hi - lo > 0.25) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface MonthRow {
  month: number;
  air: number;
  T: number;
  gasL: number;
  ch4NL: number;
  kWh: number;
  pH: number;
  heaterKWh: number;
}

/** A year at a place, month by month, with one year's history behind it; fed all year. */
export function siteYear(site: SiteId, patch: Partial<BioParams> = {}, machine: MachineId = 'plant-1000'): MonthRow[] {
  // it starts in the warmest season, as a plant commissioned in summer would
  const startMonth = SITES[site].latitude > 0 ? 7 : 1;
  const p = paramsOf(machine, { site, seasons: true, shareCooked: 100, month: startMonth, fixedT: 30, ...patch });
  const fixed = patch.fixedT ?? null;
  const pl = new Plant(p);
  pl.runIn(RUN_IN_DAYS);
  p.fixedT = fixed;
  const byMonth: MonthRow[] = [];
  // from the commissioning, around the year, to the same month: a second turn shows what a winter leaves behind
  for (let i = 0; i < 24; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1;
    const m = measure(pl, MONTH_DAYS[month - 1]!, 1800);
    if (i >= 12)
      byMonth.push({
        month,
        air: SITES[site].air[month - 1]!,
        T: m.T,
        gasL: m.gasL,
        ch4NL: m.ch4NL,
        kWh: m.kWh,
        pH: m.pH,
        heaterKWh: m.heaterKWh,
      });
  }
  return byMonth.sort((a, b) => a.month - b.month);
}

/** The first turn of a year from a summer's commissioning: month by month, so that the fall can be seen. */
export function firstWinter(
  site: SiteId,
  patch: Partial<BioParams> = {},
  pausedMonths: readonly number[] = [],
): MonthRow[] {
  const startMonth = SITES[site].latitude > 0 ? 7 : 1;
  const p = paramsOf('plant-1000', { site, seasons: true, shareCooked: 100, month: startMonth, fixedT: 30, ...patch });
  const fixed = patch.fixedT ?? null;
  const pl = new Plant(p);
  pl.runIn(RUN_IN_DAYS);
  p.fixedT = fixed;
  const rows: MonthRow[] = [];
  const usual = p.feedKg;
  for (let i = 0; i < 12; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1;
    p.feedKg = pausedMonths.includes(month) ? 0 : usual;
    const m = measure(pl, MONTH_DAYS[month - 1]!, 1800);
    rows.push({
      month,
      air: SITES[site].air[month - 1]!,
      T: m.T,
      gasL: m.gasL,
      ch4NL: m.ch4NL,
      kWh: m.kWh,
      pH: m.pH,
      heaterKWh: m.heaterKWh,
    });
  }
  return rows;
}

/**
 * A sudden overfeed and an attempt at rescue. From a working plant at 2 kg/d: a jump to `kg`, kept until the pH first falls to `stopAt`; then no food, with `flush` litres of water a day and a dose of base, eq. Whether the tank
 * ever came back: the last day its acids stood above 0.3 g COD/L (the level a working tank never reaches), Infinity if they still do at `limit` days.
 */
export function rescueRun(
  kg: number,
  stopAt: number,
  flush = 0,
  limit = 400,
  patch: Partial<BioParams> = {},
  baseDose = 0,
): { soured: boolean; dayStopped: number; lowestPH: number; recoveredDay: number; finalPH: number } {
  const p = paramsOf('plant-1000', { shareCooked: 100, ...patch });
  const pl = new Plant(p);
  pl.runIn(RUN_IN_DAYS);
  p.feedKg = kg;
  const hours = limit * 24;
  let stopped = Infinity;
  let lowest = 14;
  let lastHigh = 0;
  for (let h = 0; h < hours; h++) {
    pl.step(3600);
    const pH = pl.flux.pH;
    lowest = Math.min(lowest, pH);
    if (stopped === Infinity && pH <= stopAt) {
      stopped = h / 24;
      p.feedKg = 0;
      p.flushWater = flush;
      if (baseDose > 0) pl.addBase(baseDose);
    }
    if (pl.chain.acid / pl.chain.volume > 0.3) lastHigh = h;
  }
  const stillHigh = pl.chain.acid / pl.chain.volume > 0.3;
  return {
    soured: lowest < 5.5,
    dayStopped: stopped,
    lowestPH: lowest,
    recoveredDay: stillHigh ? Infinity : lastHigh / 24,
    finalPH: pl.flux.pH,
  };
}

// ------------------------------------------------------------------------------------------------ the heat budget

export interface HeatBudget {
  /** kWh/d to warm the day's water and food, through the walls, from the sun, of heat needed in all. */
  feedKWh: number;
  wallKWh: number;
  sunKWh: number;
  needKWh: number;
  /** W of a heater that holds it. */
  heaterW: number;
}

/** What it costs to hold a target temperature, a mean day of a month. */
export function heatBudget(
  site: SiteId,
  month: number,
  wallU: number,
  target: number,
  patch: Partial<BioParams> = {},
  machine: MachineId = 'plant-1000',
): HeatBudget {
  const p = paramsOf(machine, { site, month, wallU, fixedT: target, ...patch });
  const pl = new Plant(p);
  const hours = 24 * 3;
  let sun = 0;
  for (let i = 0; i < hours * 6; i++) {
    pl.step(600);
    if (i >= hours * 4) sun += pl.sunGain * 600;
  }
  sun /= 3.6e6;
  const air = SITES[site].air[month - 1]!;
  const area = skin(pl.m).total;
  const wall = (wallU * area * (target - air) * 24) / 1000;
  const litres = p.feedKg * (1 + p.waterPerKg);
  const feed = (litres * 4180 * (target - air)) / 3.6e6;
  const need = Math.max(0, wall + feed - sun);
  return { feedKWh: feed, wallKWh: wall, sunKWh: sun, needKWh: need, heaterW: (need * 1000) / 24 };
}

// ------------------------------------------------------------------------------------------------ the burner

/** Minutes to burn a volume, from a share of the bell's travel, with what is laid on it. The gas the plant makes meanwhile comes in too, as it did in the tests. */
export function burnTest(
  litres: number,
  patch: Partial<BioParams> = {},
  startShare = 0.75,
  machine: MachineId = 'plant-1000',
): { minutes: number; meanLph: number; meanMbar: number } {
  const p = paramsOf(machine, { shareCooked: 100, burner: 'on', ...patch });
  const pl = new Plant(p);
  pl.runIn(RUN_IN_DAYS);
  pl.setBellFill(startShare);
  pl.light();
  let t = 0;
  let P = 0;
  let n = 0;
  const step = 10;
  while (pl.book.burntL < litres && pl.lit && t < 6 * 3600) {
    pl.step(step);
    t += step;
    P += pl.pressure;
    n++;
  }
  return { minutes: t / 60, meanLph: (pl.book.burntL / t) * 3600, meanMbar: n > 0 ? P / n / 100 : 0 };
}

/** Light the burner on a share of the travel and let it die. */
export function flameOutRun(
  machine: MachineId = 'plant-1000',
  startShare = 1,
  patch: Partial<BioParams> = {},
  options: PlantOptions = {},
): {
  /** Litres in the bell when it died, and how many of them the bell could still have given if the flame held. */
  leftL: number;
  leftUsableL: number;
  burntL: number;
  minutes: number;
  cause: string;
  /** Pressure in the bell when it died, mbar. */
  lastMbar: number;
} {
  const p = paramsOf(machine, { burner: 'on', shareCooked: 100, ...patch });
  const pl = new Plant(p, options);
  pl.runIn(RUN_IN_DAYS);
  pl.setBellFill(startShare);
  pl.light();
  let t = 0;
  let lastP = pl.pressure;
  const step = 10;
  while (pl.lit && t < 24 * 3600) {
    lastP = pl.pressure;
    pl.step(step);
    t += step;
  }
  const left = (pl.nCH4 + pl.nCO2 + pl.nAir) * wetMolarVolume(pl.T, ATMOSPHERE) * 1000;
  const trapped = trappedVolume(pl.m) * 1000;
  return {
    leftL: left,
    leftUsableL: left - trapped,
    burntL: pl.book.burntL,
    minutes: t / 60,
    cause: pl.flameOutCause,
    lastMbar: lastP / 100,
  };
}

// ------------------------------------------------------------------------------------------------ arithmetic from the research's own checks (§2.9), so that each has one home

export const HAND = {
  /** Norm factor (K19): 259 NL for 289 L. */
  normFactor: 259 / 289,
  /** Burner flows from the burn times, L/h (K22). */
  lphAt2mbar: (100 / 22.3) * 60,
  lphAt4mbar: (100 / 12.1) * 60,
  /** Power in, kW (K24): 269 L/h × 0.896 × 0.614 × 9.97 Wh. */
  burnerKW: ((100 / 22.3) * 60 * (259 / 289) * 0.614 * CH4_WH_PER_NL) / 1000,
  /** kWh to take a litre from 20 to 100 °C. */
  boilKWh: (4186 * 80) / 3.6e6,
} as const;

/** The minutes a day's or a kilo's litres last on a burner. */
export const minutesOn = (litres: number, lph: number): number => (litres / lph) * 60;

/** Grams of methane in NL at a share. */
export const methaneGrams = (normalLitres: number, share: number): number =>
  normalLitres * share * CH4_KG_PER_NL * 1000;

/** Hand check: what 2 kg of wet scraps give in methane (K19, K20). */
export const twoKiloMethane = (): number => methaneGrams(259, 0.568);

/** Pressure of a heat flow: the water's cold, kWh/d (research §2.9). */
export const coldWaterKWh = (litresPerDay: number, deltaT: number): number => (litresPerDay * 4180 * deltaT) / 3.6e6;

/** Hand check: a wall's loss, W. */
export const wallLossW = (U: number, area: number, deltaT: number): number => U * area * deltaT;

/**
 * The climate's break-even of the rim (research §2.9): the share lost at which the leak's warming equals what the replaced LPG would have done. The hand check's own numbers: 38.5 kg of CH4 a year caught, GWP 27 (S29), and
 * 42 kg of LPG at about 3 kg CO₂/kg (IPCC default from memory, not read). It ignores what the scraps would have emitted anyway, and charcoal or firewood, against which it comes out far better.
 */
export function rimBreakEven(caughtKg = 38.5, gwp = 27, lpgCo2 = 42 * 3): number {
  const r = lpgCo2 / (caughtKg * gwp);
  return r / (1 + r);
}

/** The leak's and the fuel's warming at a share lost, kg CO₂e a year. */
export function rimClimate(lost: number, caughtKg = 38.5, gwp = 27): number {
  return ((caughtKg * lost) / (1 - lost)) * gwp;
}
