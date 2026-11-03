import {
  createNetwork,
  GRAVITY,
  liquidWater,
  setLinkConductance,
  setNodeTemperature,
  stepNetwork,
  tubeFlow,
  tubePressureDrop,
  type RCNetwork,
} from '@onigam/lab-kit/sim/thermal';
import {
  acidMolar,
  ATMOSPHERE,
  biogasDensity,
  CH4_J_PER_MOL,
  condensatePerMole,
  createChain,
  DAY,
  displace,
  freeCO2Share,
  carbonicK1,
  henryCO2,
  KG_COD_PER_MOL_CH4,
  MOL_CH4_PER_KG_COD,
  newChainFlux,
  newDisplaced,
  solvePH,
  stepChain,
  waterVapourPressure,
  wetMolarVolume,
  type ChainKinetics,
  type ChainState,
} from './bio';
import {
  horizontalSun,
  midMonth,
  monthlyAt,
  newDaySun,
  readDaySun,
  sinAltitude,
  sunDaily,
  SITES,
  type SiteId,
} from './climate';
import {
  bellArea,
  bellPressure,
  effectiveWeight,
  MACHINES,
  MODEL,
  skin,
  surfaceArea,
  trappedVolume,
  usableVolume,
  type MachineSpec,
  type ModelConstants,
} from './machine';
import {
  ashPerKg,
  CANTEEN_INDEX,
  CHAIN_SUBSTRATES,
  DUNG,
  DUNG_INDEX,
  degradableShare,
  LEFTOVERS_INDEX,
  PEELINGS_INDEX,
  SUBSTRATES,
  vsPerKg,
} from './substrates';
import type { BioParams, FlameOutCause } from './types';

// One plant and one step: the chain of `sim/bio`, the bell, the line and the burner, the heat, the day's two feeds and two meals, and the books that close. Allocates nothing in `step`. The clock is a calendar:
// seconds from 1 January, which a whole-day offset can put anywhere; with `seasons` off the weather stays on the month and the hours still turn.

/** What a day's books are made of: cumulative numbers, from the plant's start. */
export interface Book {
  feedKg: number;
  waterL: number;
  effluentL: number;
  /** kg: VS in, VS out; of which degradable. COD of the methane-able part, in. */
  vsIn: number;
  vsOut: number;
  codIn: number;
  /** COD of all VS in and out, kg: for a COD removal as a thesis measures it. */
  codAllIn: number;
  codAllOut: number;
  /** kg of minerals in and left by the water. */
  ashIn: number;
  /** Methane-able COD leaving in the effluent, kg. */
  codOut: number;
  /** mol of carbon in, and out in the effluent. */
  carbonIn: number;
  carbonOut: number;
  /** mol of gas: caught by the bell, lost at the rim, over the top of a full bell, burnt. Air is apart. */
  caughtCH4: number;
  caughtCO2: number;
  rimCH4: number;
  rimCO2: number;
  overCH4: number;
  overCO2: number;
  burntCH4: number;
  burntCO2: number;
  stripCO2: number;
  /** Litres at the bell's conditions, and in the burner. */
  caughtL: number;
  burntL: number;
  flameSeconds: number;
  /** J. */
  sunJ: number;
  heaterJ: number;
  metabolicJ: number;
  /** Heat carried off by what came in colder than the slurry. */
  feedColdJ: number;
  iceJ: number;
}

export const newBook = (): Book => ({
  feedKg: 0,
  waterL: 0,
  effluentL: 0,
  vsIn: 0,
  vsOut: 0,
  codIn: 0,
  codAllIn: 0,
  codAllOut: 0,
  ashIn: 0,
  codOut: 0,
  carbonIn: 0,
  carbonOut: 0,
  caughtCH4: 0,
  caughtCO2: 0,
  rimCH4: 0,
  rimCO2: 0,
  overCH4: 0,
  overCO2: 0,
  burntCH4: 0,
  burntCO2: 0,
  stripCO2: 0,
  caughtL: 0,
  burntL: 0,
  flameSeconds: 0,
  sunJ: 0,
  heaterJ: 0,
  metabolicJ: 0,
  feedColdJ: 0,
  iceJ: 0,
});

/** The two feeds, hours of the day. reported: « around 8:30 and 17:00 » (S5 §3.1.2). */
export const FEED_HOURS = [8.5, 17] as const;
/** The two meals. assumption: a meal just before each feed would do as well. */
export const MEAL_HOURS = [7, 18] as const;

const WATER_MOLAR_MASS = 18.015; // g/mol

/**
 * Methanogens a first fill brings, kg COD. estimate: a few percent of the dung's 10 kg of VS, the effluent's 0.25 kg of COD adding little. Together with the dung's cations, the one input an outcome moved: at 0.25 kg and half the cations
 * the one-node model soured for good in the ten unfed days, where the real plant came near it (S5's Fig. 16) and did not. See docs/physics.md.
 */
export const SEED_METHANOGENS = 0.45;

const crossed = (from: number, to: number, at: number): boolean =>
  from <= to ? from < at && at <= to : at > from || at <= to;

/** kg/m³ of VS at the top and the bottom of the tank, and their shares of its stock. derived from S5's Table 17: 60.58 and 32.68 g/L over 85 L each, of about 9.0 kg in all. */
export const SCUM_VS = 60.58;
export const SLUDGE_VS = 32.68;
export const SCUM_SHARE = (SCUM_VS * 0.085) / 9.02;
export const SLUDGE_SHARE = (SLUDGE_VS * 0.085) / 9.02;
/** VS over TS of the tank's contents. reported, the means of Table 17. */
export const STOCK_VS_SHARE = 10.61 / 14.42;
/** kg COD per kg of cells. Usual value. */
const CELL_COD = 1.42;

/** The hose's resistance, Pa per L/h: laminar at these flows. derived with the kit's tube law, at a mid flow and a mean gas. */
export function hoseResistance(m: MachineSpec, viscosity: number = MODEL.gasViscosity): number {
  const Tmean = 30;
  const rho = biogasDensity(0.6, Tmean);
  const q = 269 / 3.6e6;
  const flow = tubeFlow(rho * q, m.hoseBore, { rho, mu: viscosity, k: 0.03, Pr: 0.75 });
  return tubePressureDrop(flow, m.hoseLength, m.hoseBore, rho) / 269;
}

/** The pressure a water plug at the low point holds back, Pa: it fills the hose to the same height on both sides. */
export const plugPressure = (ml: number, bore: number, slopePercent: number): number => {
  const area = (Math.PI * bore * bore) / 4;
  const length = (ml * 1e-6) / area;
  return 1000 * GRAVITY * (length / 2) * (slopePercent / 100);
};

/** The burner's law, L/h at a pressure at the burner. */
export const burnerLaw = (reference: number, pressureRef: number, exponent: number, pressure: number): number =>
  pressure <= 0 ? 0 : reference * (pressure / pressureRef) ** exponent;

/** The flow through hose and burner in series, L/h: `pressure` Pa at the start of the hose, once any water is taken off. */
export function lineFlow(
  pressure: number,
  hose: number,
  reference: number,
  pressureRef: number,
  exponent: number,
): number {
  if (pressure <= 0) return 0;
  let lo = 0;
  let hi = burnerLaw(reference, pressureRef, exponent, pressure);
  for (let i = 0; i < 24; i++) {
    const q = (lo + hi) / 2;
    if (q < burnerLaw(reference, pressureRef, exponent, pressure - hose * q)) lo = q;
    else hi = q;
  }
  return (lo + hi) / 2;
}

const kineticsOf = (p: BioParams, c: ModelConstants): ChainKinetics => ({
  kFast: p.kFast,
  kSlow: p.kSlow,
  Ea: p.Ea,
  Tref: c.Tref,
  km: c.km,
  Ks: c.Ks,
  yieldX: c.yieldX,
  decay: c.decay,
  hydrolysisPHLow: c.hydrolysisPHLow,
  hydrolysisPHHigh: c.hydrolysisPHHigh,
  methanogenPHLow: c.methanogenPHLow,
  methanogenPHHigh: c.methanogenPHHigh,
  coldZero: c.coldZero,
  coldFull: c.coldFull,
  hotFull: c.hotFull,
  hotZero: c.hotZero,
});

const DAILY: Record<SiteId, number[]> = {
  'dar-es-salaam': sunDaily(SITES['dar-es-salaam']),
  pune: sunDaily(SITES.pune),
  marseille: sunDaily(SITES.marseille),
  geneva: sunDaily(SITES.geneva),
};

/** What a run can move besides the parameters: the calendar's start, a machine's number, a constant of the model. */
export interface PlantOptions {
  startDay?: number;
  machine?: Partial<MachineSpec>;
  model?: Partial<ModelConstants>;
}

export class Plant {
  readonly m: MachineSpec;
  /** The model's constants for this plant. */
  readonly c: ModelConstants;
  readonly p: BioParams;
  readonly chain: ChainState;
  readonly flux = newChainFlux();
  readonly book: Book = newBook();
  /** The book at the last midnight, and the last whole day's. */
  readonly midnight: Book = newBook();
  readonly lastDay: Book = newBook();
  readonly net: RCNetwork;
  /** Seconds from the calendar's zero. */
  t = 0;
  /** Seconds since the start, after the run-in. */
  elapsed = 0;
  /** Moles in the bell. */
  nCH4 = 0;
  nCO2 = 0;
  nAir = 0;
  rise = 0;
  pressure = 0;
  resting = false;
  full = false;
  /** Water sitting at the low point, and water caught by the trap, mL. */
  hoseMl = 0;
  trapMl = 0;
  /** The burner: the tap is open and a flame holds. */
  lit = false;
  mealLeft = 0;
  flameOutCause: FlameOutCause = 'none';
  /** `elapsed` when the flame last went out by itself. */
  flameOutAt = -Infinity;
  flow = 0;
  plug = 0;
  hoseDrop = 0;
  burnerP = 0;
  flamePower = 0;
  airT = 25;
  sunG = 0;
  sinAlt = 0;
  meanAir = 25;
  sunGain = 0;
  heater = 0;
  wallLoss = 0;
  feedCount = 0;
  flameLitCount = 0;
  flameOutCount = 0;
  fullBellCount = 0;
  /** During the run-in the burner stays off. */
  spinning = false;

  private readonly area: number;
  private readonly trapped: number;
  private readonly usable: number;
  private readonly skinTotal: number;
  private readonly skinTop: number;
  private readonly skinSide: number;
  private readonly skinHeight: number;
  private readonly surface: number;
  private readonly hoseR: number;
  private readonly daySun = newDaySun();
  private sunSite: SiteId | null = null;
  private readonly kinetics: ChainKinetics;
  private readonly displaced = newDisplaced();
  private wasFull = false;
  /** Bubbles of the last step, mol/s: what the 3D's bubbles and the strip read. */
  lastCH4 = 0;
  lastCO2 = 0;
  lastOver = 0;

  constructor(p: BioParams, options: PlantOptions = {}) {
    this.p = p;
    this.m = { ...MACHINES[p.machine], bellWall: p.bellWall, ...options.machine };
    this.c = { ...MODEL, ...options.model };
    const m = this.m;
    const startDay = options.startDay ?? midMonth(p.month);
    this.chain = createChain(m.liquidVolume, SUBSTRATES.length);
    this.area = bellArea(m);
    this.trapped = trappedVolume(m);
    this.usable = usableVolume(m);
    const s = skin(m);
    this.skinTotal = s.total;
    this.skinTop = s.top;
    this.skinSide = s.side;
    this.skinHeight = s.sideHeight;
    this.surface = surfaceArea(m);
    this.hoseR = hoseResistance(m, this.c.gasViscosity);
    this.hoseMl = p.hoseWater;
    this.t = startDay * DAY + 6 * 3600;
    this.net = createNetwork(
      [
        { T: 25, mass: m.liquidVolume * 1000, material: liquidWater() },
        { T: 25, fixed: true },
      ],
      [{ a: 0, b: 1, G: p.wallU * this.skinTotal }],
    );
    this.kinetics = kineticsOf(p, this.c);
    this.readSky(this.hour);
    setNodeTemperature(this.net, 0, this.meanAir);
    this.startLivedIn();
  }

  // ------------------------------------------------------------------ the clock

  get hour(): number {
    const s = ((this.t % DAY) + DAY) % DAY;
    return s / 3600;
  }

  /** The day of the year the weather reads. */
  get weatherDay(): number {
    return this.p.seasons ? this.t / DAY : midMonth(this.p.month);
  }

  /** Temperature of the slurry, °C. */
  get T(): number {
    return this.net.T[0]!;
  }

  // ------------------------------------------------------------------ starting states

  private feedCharge(): number {
    const p = this.p;
    if (p.feedKg <= 0) return SUBSTRATES[LEFTOVERS_INDEX]!.charge / (1 + this.m.waterPerKg);
    const litres = p.feedKg * (1 + p.waterPerKg) + p.flushWater;
    return (
      (p.feedKg * SUBSTRATES[LEFTOVERS_INDEX]!.charge + (p.feedKg * p.waterPerKg + p.flushWater) * this.c.waterCharge) /
      litres
    );
  }

  /** A plant that has been working: buffer at its feed's level, some methanogens, CO2 near a working gas. Food comes from the run-in. */
  private startLivedIn(): void {
    const c = this.chain;
    const litres = c.volume * 1000;
    const charge = this.feedCharge();
    c.charge = charge * litres;
    c.biomass = 1.2 * c.volume;
    c.acid = 0.02 * c.volume;
    const T = this.T;
    const freeCO2 = henryCO2(T) * 0.38;
    c.dic = (charge + freeCO2) * litres;
    solvePH(c, T);
    this.nCH4 = 0;
    this.nCO2 = 0;
  }

  /**
   * The day S5's plant was filled: 60 kg of dung and 300 L of a working effluent in water, and the air the bell was lowered onto. reported for the dung and the effluent; the methanogens they bring and their
   * buffer are estimates. The trapped air is geometry: the bell rests with its top above the slurry.
   */
  inoculate(dungKg = 60, seedMethanogens = SEED_METHANOGENS): void {
    const c = this.chain;
    const litres = c.volume * 1000;
    c.fast.fill(0);
    c.slow.fill(0);
    c.inert.fill(0);
    const vs = dungKg * vsPerKg(DUNG);
    const deg = vs * degradableShare(DUNG);
    c.fast[DUNG_INDEX] = deg * DUNG.fastShare;
    c.slow[DUNG_INDEX] = deg * (1 - DUNG.fastShare);
    c.inert[DUNG_INDEX] = vs - deg;
    c.biomass = seedMethanogens;
    c.acid = 0;
    // 300 L at pH 6.38 hold about 12 meq/L; the dung and the rest of the water bring the rest
    c.charge = dungKg * DUNG.charge + 300 * 0.012 + (litres - dungKg - 300) * this.c.waterCharge;
    c.dic = c.charge + 0.3 * litres * 0.012;
    solvePH(c, this.T);
    this.nCH4 = 0;
    this.nCO2 = 0;
    this.nAir = this.trapped / wetMolarVolume(this.T, ATMOSPHERE);
    this.rise = 0;
    this.resting = true;
    this.pressure = 0;
    this.resetBooks();
  }

  resetBooks(): void {
    Object.assign(this.book, newBook());
    Object.assign(this.midnight, newBook());
    Object.assign(this.lastDay, newBook());
  }

  /** Put the bell at a share of its travel, the gas at the composition it has, or the last bubbles'. */
  setBellFill(share: number): void {
    const T = this.T;
    const Vm = wetMolarVolume(T, ATMOSPHERE + this.pressure);
    const n = (this.trapped + share * this.usable) / Vm;
    const have = this.nCH4 + this.nCO2;
    let ch4 = 0.6;
    if (have > 0) ch4 = this.nCH4 / have;
    else if (this.lastCH4 + this.lastCO2 > 0) ch4 = this.lastCH4 / (this.lastCH4 + this.lastCO2);
    this.nCH4 = n * ch4;
    this.nCO2 = n * (1 - ch4);
    this.nAir = 0;
    this.settleBell(Vm);
  }

  /**
   * The days before the start: the food in the tank, the methanogens and the buffer that history gives. The calendar runs up to the start, so a plant opened in a Geneva January has come through its autumn.
   * With a coarse step, the burner off. Its books are thrown away.
   */
  runIn(days: number, step = 1800, fill = 0.4): void {
    const start = this.t;
    const seasons = this.p.seasons;
    const n = Math.ceil((days * DAY) / step);
    // it ends at the very hour the plant opens on: no second feed, no warm evening carried into a morning
    this.t = start - n * step;
    this.p.seasons = true;
    this.spinning = true;
    for (let i = 0; i < n; i++) this.step(step);
    this.spinning = false;
    this.p.seasons = seasons;
    this.t = start;
    this.lit = false;
    this.mealLeft = 0;
    this.flameOutCause = 'none';
    this.feedCount = 0;
    this.flameLitCount = 0;
    this.flameOutCount = 0;
    this.fullBellCount = 0;
    this.wasFull = false;
    this.hoseMl = this.p.hoseWater;
    this.trapMl = 0;
    // the last day of the run-in stands for yesterday, with its gas, no flame, and nothing over the top: the bell was left to fill
    const yesterday = { ...this.lastDay, overCH4: 0, overCO2: 0, flameSeconds: 0, burntCH4: 0, burntCO2: 0, burntL: 0 };
    this.resetBooks();
    Object.assign(this.lastDay, yesterday);
    this.setBellFill(fill);
    this.readSky(this.hour);
    this.flow = 0;
    this.flamePower = 0;
  }

  /** Move the calendar to a day of the year and an hour. */
  setClock(day: number, hour: number): void {
    this.t = Math.floor(day) * DAY + hour * 3600;
    this.readSky(this.hour);
  }

  // ------------------------------------------------------------------ gestures

  /** One feed, now: half a day's kilos and water. */
  feedNow(): void {
    const p = this.p;
    const kg = p.feedKg / 2;
    this.feedPulse(kg, kg * p.waterPerKg + p.flushWater / 2);
  }

  /** A dose of alkali into the tank, eq of strong base: what S5's plants never had, and what a soured tank's chemistry asks. */
  addBase(eq: number): void {
    this.chain.charge += eq;
    solvePH(this.chain, this.T);
  }

  /** Light the burner: it holds if the pressure lets it. */
  light(): void {
    if (this.lit) return;
    this.lit = true;
    this.flameOutCause = 'none';
    this.flameLitCount++;
  }

  shut(): void {
    this.lit = false;
    this.flow = 0;
    this.flamePower = 0;
  }

  // ------------------------------------------------------------------ the step

  private readSky(hour: number): void {
    const p = this.p;
    const site = SITES[p.site];
    if (this.sunSite !== p.site) {
      this.daySun.day = -1;
      this.sunSite = p.site;
    }
    const day = this.weatherDay;
    readDaySun(this.daySun, site, DAILY[p.site], day);
    this.meanAir = monthlyAt(site.air, day);
    this.airT = this.meanAir + this.c.airSwing * Math.cos((2 * Math.PI * (hour - 15)) / 24);
    this.sunG = horizontalSun(this.daySun, hour);
    this.sinAlt = sinAltitude(this.daySun, hour);
  }

  /**
   * Sun taken by the tank's skin, W. The top sees all the sky, the side half of it and half the ground; the direct sun reaches the top by its sine, a cylinder's width by its cosine, and only during the hours the
   * trees leave (K9). Of what the skin takes, the slurry receives the share U/h that a wall gives the inside rather than the air: so a wrap that keeps heat in also keeps the sun out.
   */
  private absorbed(hour: number): number {
    const p = this.p;
    const m = this.m;
    const G = this.sunG;
    if (G <= 0) return 0;
    const diffuseShare = this.daySun.diffuse;
    const diffuse = diffuseShare * G;
    const direct = Math.abs(hour - 12) <= p.sunHours / 2 ? (1 - diffuseShare) * G : 0;
    const normal = this.sinAlt > 0.05 ? direct / this.sinAlt : 0;
    const cosAlt = Math.sqrt(Math.max(0, 1 - this.sinAlt * this.sinAlt));
    return (
      this.c.absorptance *
      (this.skinTop * (direct + diffuse) +
        m.tankOuterDiameter * this.skinHeight * normal * cosAlt +
        this.skinSide * 0.5 * (diffuse + this.c.groundReflection * (direct + diffuse)))
    );
  }

  private feedPulse(kg: number, water: number): void {
    const litres = kg + water;
    if (litres <= 0) return;
    const c = this.chain;
    const b = this.book;
    const p = this.p;
    const d = this.displaced;
    const retention = Math.max(1, p.solidsRetention);
    displace(c, CHAIN_SUBSTRATES, litres, retention, d);
    b.effluentL += litres;
    b.vsOut += d.degradable + d.inert + d.biomass / CELL_COD;
    b.codOut += d.codSolids + d.acid + d.biomass;
    b.codAllOut += d.codSolids + d.acid + d.biomass + d.inert * 1.5;
    b.carbonOut += d.dic + (d.acid + d.biomass) * 2 * MOL_CH4_PER_KG_COD + this.carbonOfSolidsOut(d);
    const cooked = this.m.id === 'school-4000' ? CANTEEN_INDEX : LEFTOVERS_INDEX;
    const kgCooked = (kg * p.shareCooked) / 100;
    this.addFood(cooked, kgCooked);
    this.addFood(PEELINGS_INDEX, kg - kgCooked);
    const waterCharge = water * this.c.waterCharge;
    c.charge += waterCharge;
    c.dic += waterCharge;
    b.carbonIn += waterCharge;
    b.waterL += water;
    b.feedKg += kg;
    b.ashIn += water * this.c.waterSolids;
    // what comes in is at the butt's temperature
    const T = this.T;
    const share = Math.min(1, litres / (c.volume * 1000));
    const Tin = this.meanAir;
    if (this.p.fixedT === null) setNodeTemperature(this.net, 0, T + (Tin - T) * share);
    b.feedColdJ += litres * 4180 * (T - Tin);
    this.feedCount++;
  }

  /** Carbon leaving with solids: the `displace` call lumped them, so the book reads the per-substrate carbon at the mean of what is in the tank. */
  private carbonOfSolidsOut(d: { degradable: number; codSolids: number }): number {
    if (d.degradable <= 0) return 0;
    const c = this.chain;
    let codAll = 0;
    let carbonAll = 0;
    for (let i = 0; i < CHAIN_SUBSTRATES.length; i++) {
      const s = CHAIN_SUBSTRATES[i]!;
      const cod = (c.fast[i]! + c.slow[i]!) * s.cod;
      codAll += cod;
      carbonAll += cod * MOL_CH4_PER_KG_COD * (1 + s.co2PerCh4);
    }
    return codAll > 0 ? d.codSolids * (carbonAll / codAll) : d.codSolids * MOL_CH4_PER_KG_COD * 2;
  }

  private addFood(i: number, kg: number): void {
    if (kg <= 0) return;
    const c = this.chain;
    const b = this.book;
    const sub = SUBSTRATES[i]!;
    const cs = CHAIN_SUBSTRATES[i]!;
    const vs = kg * vsPerKg(sub);
    const deg = vs * degradableShare(sub);
    c.fast[i]! += deg * sub.fastShare;
    c.slow[i]! += deg * (1 - sub.fastShare);
    c.inert[i]! += vs - deg;
    c.charge += kg * sub.charge;
    b.vsIn += vs;
    const cod = deg * cs.cod;
    b.codIn += cod;
    b.codAllIn += vs * cs.cod;
    b.carbonIn += cod * MOL_CH4_PER_KG_COD * (1 + cs.co2PerCh4);
    b.ashIn += kg * ashPerKg(sub);
  }

  /** The bell and the sky again after something moved them: a weight, a fill, a place, a month. */
  settle(): void {
    this.readSky(this.hour);
    this.settleBell(wetMolarVolume(this.T, ATMOSPHERE + this.pressure));
  }

  private settleBell(Vm: number): void {
    const m = this.m;
    const p = this.p;
    const V = (this.nCH4 + this.nCO2 + this.nAir) * Vm;
    const above = V - this.trapped;
    this.resting = above <= 0;
    this.rise = Math.max(0, Math.min(m.bellTravel, above / this.area));
    this.pressure = this.resting ? 0 : bellPressure(m, this.rise, p.addedWeight);
    this.full = above >= this.usable;
  }

  step(dt: number): void {
    const p = this.p;
    const m = this.m;
    const b = this.book;
    const hourBefore = this.hour;
    this.t += dt;
    const hour = this.hour;
    if (!this.spinning) this.elapsed += dt;
    this.readSky(hour);

    // midnight: close the day's book
    if (hour < hourBefore) {
      const last = this.lastDay as unknown as Record<string, number>;
      const now = b as unknown as Record<string, number>;
      const mid = this.midnight as unknown as Record<string, number>;
      for (const k in now) {
        last[k] = now[k]! - mid[k]!;
        mid[k] = now[k]!;
      }
    }

    // the two feeds
    if (
      (p.feedKg > 0 || p.flushWater > 0) &&
      (crossed(hourBefore, hour, FEED_HOURS[0]) || crossed(hourBefore, hour, FEED_HOURS[1]))
    ) {
      this.feedNow();
    }

    // the two meals
    if (!this.spinning) {
      if (p.burner === 'off') this.shut();
      else if (p.burner === 'meals') {
        if (
          p.cookMinutes > 0 &&
          (crossed(hourBefore, hour, MEAL_HOURS[0]) || crossed(hourBefore, hour, MEAL_HOURS[1]))
        ) {
          this.mealLeft = (p.cookMinutes / 2) * 60;
          this.light();
        }
        if (this.lit) {
          this.mealLeft -= dt;
          if (this.mealLeft <= 0) this.shut();
        }
      }
    }

    // the liquid
    const T = this.T;
    this.refreshKinetics();
    const open = this.surface * p.rimLoss;
    const days = dt / DAY;
    stepChain(
      this.chain,
      CHAIN_SUBSTRATES,
      this.kinetics,
      T,
      ATMOSPHERE + this.pressure,
      this.c.ringTransfer * open,
      days,
      this.flux,
    );
    const f = this.flux;
    this.lastCH4 = f.ch4 / dt;
    this.lastCO2 = f.co2Bubble / dt;
    b.stripCO2 += f.co2Strip;

    // what the bell catches
    const rim = p.rimLoss;
    b.rimCH4 += f.ch4 * rim;
    b.rimCO2 += f.co2Bubble * rim;
    const inCH4 = f.ch4 * (1 - rim);
    const inCO2 = f.co2Bubble * (1 - rim);
    this.nCH4 += inCH4;
    this.nCO2 += inCO2;
    b.caughtCH4 += inCH4;
    b.caughtCO2 += inCO2;
    const Vm = wetMolarVolume(T, ATMOSPHERE + this.pressure);
    b.caughtL += (inCH4 + inCO2) * Vm * 1000;

    // over the top of a full bell
    this.lastOver = 0;
    const total = this.nCH4 + this.nCO2 + this.nAir;
    const most = (this.trapped + this.usable) / Vm;
    if (total > most) {
      const share = (total - most) / total;
      const outCH4 = this.nCH4 * share;
      const outCO2 = this.nCO2 * share;
      b.overCH4 += outCH4;
      b.overCO2 += outCO2;
      this.lastOver = (outCH4 + outCO2) / dt;
      this.nCH4 -= outCH4;
      this.nCO2 -= outCO2;
      this.nAir -= this.nAir * share;
    }
    this.settleBell(Vm);
    if (this.full && !this.wasFull && !this.spinning) this.fullBellCount++;
    this.wasFull = this.full;

    // the line and the flame
    this.burn(dt, Vm);

    // the heat
    const skinTaken = this.absorbed(hour);
    const U = p.wallU;
    const gain = (U / this.c.outerFilm) * skinTaken;
    const heater = T < p.setPointT ? p.heaterW : 0;
    const metabolic = (f.ch4 / dt) * CH4_J_PER_MOL * this.c.metabolicShare;
    this.sunGain = gain;
    this.heater = heater;
    this.wallLoss = U * this.skinTotal * (T - this.airT);
    b.sunJ += gain * dt;
    b.heaterJ += heater * dt;
    b.metabolicJ += metabolic * dt;
    if (p.fixedT !== null) {
      setNodeTemperature(this.net, 0, p.fixedT);
      return;
    }
    const net = this.net;
    net.T[1] = this.airT;
    setLinkConductance(net, 0, U * this.skinTotal);
    net.Q[0] = gain + heater + metabolic;
    stepNetwork(net, dt);
    if (net.T[0]! < 0) {
      // ice holds the slurry at zero; its latent heat is only counted, no ice is drawn or modelled
      b.iceJ += -net.T[0]! * m.liquidVolume * 1000 * 4180;
      setNodeTemperature(net, 0, 0);
    }
  }

  private refreshKinetics(): void {
    const p = this.p;
    const k = this.kinetics;
    k.kFast = p.kFast;
    k.kSlow = p.kSlow;
    k.Ea = p.Ea;
  }

  private burn(dt: number, Vm: number): void {
    const p = this.p;
    const m = this.m;
    const b = this.book;
    if (!this.lit) {
      this.flow = 0;
      this.burnerP = 0;
      this.hoseDrop = 0;
      this.flamePower = 0;
      this.plug = plugPressure(this.hoseMl, m.hoseBore, p.hoseSlope);
      return;
    }
    const dry = this.nCH4 + this.nCO2;
    const share = dry > 0 ? this.nCH4 / (dry + this.nAir) : 0;
    const plug = plugPressure(this.hoseMl, m.hoseBore, p.hoseSlope);
    this.plug = plug;
    const available = this.pressure - plug;
    const q = lineFlow(available, this.hoseR, p.burnerLph, m.burnerPressure, p.burnerExponent);
    const drop = this.hoseR * q;
    const atBurner = available - drop;
    let cause: FlameOutCause = 'none';
    if (this.resting) cause = 'resting';
    else if (share < this.c.leanFlame) cause = 'lean';
    else if (atBurner < this.c.flameMinPressure) cause = plug > 0.5 * this.pressure ? 'water' : 'pressure';
    if (cause !== 'none') {
      this.lit = false;
      this.mealLeft = 0;
      this.flameOutCause = cause;
      this.flameOutAt = this.elapsed;
      this.flameOutCount++;
      this.flow = 0;
      this.burnerP = 0;
      this.hoseDrop = 0;
      this.flamePower = 0;
      return;
    }
    this.flow = q;
    this.burnerP = atBurner;
    this.hoseDrop = drop;
    const out = Math.min(((q / 3.6e6) * dt) / Vm, Math.max(0, dry + this.nAir - this.trapped / Vm));
    const whole = dry + this.nAir;
    const outCH4 = whole > 0 ? (out * this.nCH4) / whole : 0;
    const outCO2 = whole > 0 ? (out * this.nCO2) / whole : 0;
    const outAir = whole > 0 ? (out * this.nAir) / whole : 0;
    this.nCH4 -= outCH4;
    this.nCO2 -= outCO2;
    this.nAir -= outAir;
    b.burntCH4 += outCH4;
    b.burntCO2 += outCO2;
    b.burntL += out * Vm * 1000;
    b.flameSeconds += dt;
    this.flamePower = (outCH4 / dt) * CH4_J_PER_MOL;
    // water drops out where the hose is cooler than the gas
    const water =
      (outCH4 + outCO2) * condensatePerMole(this.T, this.airT, ATMOSPHERE + this.pressure) * WATER_MOLAR_MASS;
    if (p.trap) this.trapMl += water;
    else this.hoseMl += water;
    this.settleBell(Vm);
  }

  // ------------------------------------------------------------------ what a test or the state reads

  /** The chain's methane-able COD in the tank and the bell, kg. */
  codStock(): number {
    const c = this.chain;
    let sum = c.acid + c.biomass;
    for (let i = 0; i < CHAIN_SUBSTRATES.length; i++) sum += (c.fast[i]! + c.slow[i]!) * CHAIN_SUBSTRATES[i]!.cod;
    return sum + this.nCH4 * KG_COD_PER_MOL_CH4;
  }

  /** The carbon in the tank and the bell, mol. */
  carbonStock(): number {
    const c = this.chain;
    let sum = c.dic - c.acidCarbonDebt + (c.acid + c.biomass) * 2 * MOL_CH4_PER_KG_COD;
    for (let i = 0; i < CHAIN_SUBSTRATES.length; i++) {
      const s = CHAIN_SUBSTRATES[i]!;
      sum += (c.fast[i]! + c.slow[i]!) * s.cod * MOL_CH4_PER_KG_COD * (1 + s.co2PerCh4);
    }
    return sum + this.nCH4 + this.nCO2;
  }

  /** kg VS a day of the present feed. */
  dailyVS(): number {
    const p = this.p;
    const cooked = this.m.id === 'school-4000' ? CANTEEN_INDEX : LEFTOVERS_INDEX;
    const kgCooked = (p.feedKg * p.shareCooked) / 100;
    return kgCooked * vsPerKg(SUBSTRATES[cooked]!) + (p.feedKg - kgCooked) * vsPerKg(SUBSTRATES[PEELINGS_INDEX]!);
  }

  /** kg of volatile solids in the tank, cells counted. */
  stockVS(): number {
    const c = this.chain;
    let sum = c.biomass / CELL_COD;
    for (let i = 0; i < CHAIN_SUBSTRATES.length; i++) sum += c.fast[i]! + c.slow[i]! + c.inert[i]!;
    return sum;
  }

  /** Acids, mol/L. */
  acidsMolar(): number {
    return acidMolar(this.chain);
  }

  /** The partial pressure of CO2 the liquid stands at, bar. */
  liquidPCO2(): number {
    const c = this.chain;
    const T = this.T;
    return (freeCO2Share(c.h, carbonicK1(T)) * c.dic) / (c.volume * 1000) / henryCO2(T);
  }

  /** The vapour's share of the wet gas. */
  vapourShare(): number {
    return waterVapourPressure(this.T) / (ATMOSPHERE + this.pressure);
  }

  /** Weight the gas holds up, kg. */
  effectiveWeightNow(): number {
    return effectiveWeight(this.m, this.rise, this.p.addedWeight);
  }

  /** Sun's azimuth for the 3D, degrees from south, positive west, on the site's day. */
  sunAzimuth(hour: number): number {
    const omega = ((hour - 12) * Math.PI) / 12;
    const lat = (SITES[this.p.site].latitude * Math.PI) / 180;
    const d = this.daySun;
    const sinDecl = d.sinSin / (Math.sin(lat) || 1e-9);
    const cosDecl = d.cosCos / Math.cos(lat);
    const tanDecl = sinDecl / cosDecl;
    return (Math.atan2(Math.sin(omega), Math.cos(omega) * Math.sin(lat) - tanDecl * Math.cos(lat)) * 180) / Math.PI;
  }
}
