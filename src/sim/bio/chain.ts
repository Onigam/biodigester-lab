import { ACETIC_KA, carbonicK1, freeCO2Share, henryCO2, pHof, solveHydrogen, waterKw } from './acidbase';
import { MOL_CH4_PER_KG_COD } from './buswell';
import { arrhenius, firstOrderShare, pHFactor, temperatureWindow } from './kinetics';
import { waterVapourPressure } from './gas';

// The food chain of a digester in the fewest pools that can fail: particulate food in a fast and a slow pool per substrate, decaying at first order; the fatty acids it becomes; the slow population
// of methanogens that eats them; the dissolved carbon and the cations that hold the pH. Far less than ADM1, on purpose: the two populations are what let « feed more, get less » appear by itself.
//
// Units: kg of volatile solids (VS) and of COD in the whole tank, moles of carbon, equivalents of charge. Time in days. No DOM, no lab's name; nothing allocated in `stepChain`.
//
// The carbon. Acids are counted as acetate: a kg of COD holds 2/0.064 mol of carbon, and ends as equal moles of CH4 and CO2. A substrate whose Buswell ratio CO2/CH4 is not 1 settles the difference at
// hydrolysis, into or out of the dissolved carbon. So carbon and COD close to rounding at any step (tested).

/** What the chain needs to know of one substrate. */
export interface ChainSubstrate {
  /** kg COD per kg of degradable VS. */
  cod: number;
  /** Moles of CO2 per mole of CH4 at Buswell's limit. */
  co2PerCh4: number;
}

export interface ChainKinetics {
  /** First-order rates of the fast and slow pools at Tref, per day. */
  kFast: number;
  kSlow: number;
  /** Activation energy, J/mol, and its reference, °C. One value for every organism: a simplification. */
  Ea: number;
  Tref: number;
  /** Methanogens: most acid eaten per kg of them per day at Tref (kg COD/kg COD·d); half-saturation, kg COD/m³; yield, kg/kg; death rate at Tref, per day. */
  km: number;
  Ks: number;
  yieldX: number;
  decay: number;
  /** The pH window of hydrolysis and of methanogens: fully active from `high`, gone by `low`. */
  hydrolysisPHLow: number;
  hydrolysisPHHigh: number;
  methanogenPHLow: number;
  methanogenPHHigh: number;
  /** Temperatures: nothing at or below `coldZero`, full from `coldFull` to `hotFull`, nothing from `hotZero`. */
  coldZero: number;
  coldFull: number;
  hotFull: number;
  hotZero: number;
}

export interface ChainState {
  /** Liquid volume, m³. */
  readonly volume: number;
  /** kg VS per substrate. */
  readonly fast: Float64Array;
  readonly slow: Float64Array;
  readonly inert: Float64Array;
  /** Fatty acids, kg COD. */
  acid: number;
  /** Methanogens, kg COD. */
  biomass: number;
  /** Dissolved inorganic carbon, mol. */
  dic: number;
  /** Net strong cations, eq. */
  charge: number;
  /** Hydrogen ions, mol/L, as last solved. */
  h: number;
  /**
   * Carbon the acids lack, mol. Counted as acetate, a kg of COD holds 2/0.064 mol of carbon; a soured tank's acids are longer and hold less. It grows when a substrate would draw CO2 that the liquid no longer has, its
   * methanogens having stopped, and it is repaid first if they restart. So the carbon closes in a soured tank too, with nothing created at zero.
   */
  acidCarbonDebt: number;
}

/** What happened over a step, in the same units. */
export interface ChainFlux {
  pH: number;
  /** Rate factor of temperature against Tref, and the pH factors, at the start of the step. */
  kFactor: number;
  hydrolysisActivity: number;
  methanogenActivity: number;
  /** kg of degradable VS broken down, kg COD of acid made, kg COD of acid eaten over the step. */
  hydrolysed: number;
  acidMade: number;
  uptake: number;
  /** Moles of methane and of CO2 leaving as bubbles, and of CO2 leaving through an open surface. */
  ch4: number;
  co2Bubble: number;
  co2Strip: number;
  /** CO2 entering the dissolved pool, mol (may be negative at hydrolysis). */
  co2Made: number;
  /** Free CO2 in the liquid, as a partial pressure, bar. */
  pCO2: number;
}

export const newChainFlux = (): ChainFlux => ({
  pH: 7,
  kFactor: 1,
  hydrolysisActivity: 1,
  methanogenActivity: 1,
  hydrolysed: 0,
  acidMade: 0,
  uptake: 0,
  ch4: 0,
  co2Bubble: 0,
  co2Strip: 0,
  co2Made: 0,
  pCO2: 0,
});

export function createChain(volume: number, substrates: number): ChainState {
  return {
    volume,
    fast: new Float64Array(substrates),
    slow: new Float64Array(substrates),
    inert: new Float64Array(substrates),
    acid: 0,
    biomass: 0,
    dic: 0,
    charge: 0,
    h: 3e-7,
    acidCarbonDebt: 0,
  };
}

/** Moles per litre of the acids, counted as acetate. */
export const acidMolar = (s: ChainState): number => (s.acid * MOL_CH4_PER_KG_COD) / (s.volume * 1000);

/** Solve the pH of the state as it stands. */
export function solvePH(s: ChainState, T: number): number {
  const litres = s.volume * 1000;
  s.h = solveHydrogen(s.charge / litres, s.dic / litres, acidMolar(s), carbonicK1(T), ACETIC_KA, waterKw(T), s.h);
  return pHof(s.h);
}

/** The floor below which a nearly dry gas stops being a sensible divisor, as a share of the dry pressure. */
const BUBBLE_FLOOR = 0.02;

/**
 * One step of the chain. `T` °C, `pressure` Pa total under the gas, `surfaceExchange` m³/day the open surface's mass-transfer coefficient times its area (the air's own CO2 taken as nothing),
 * `dt` days. CO2 leaves in the methane's bubbles at the composition its partial pressure gives, so the gas's share of CH4 is found, not set; a soured tank, with almost no methane, still lets its CO2 go
 * as soon as it passes the pressure on the liquid. The acid and the dissolved carbon are advanced semi-implicitly: stable and positive at any step, and conservative to rounding.
 */
export function stepChain(
  s: ChainState,
  substrates: readonly ChainSubstrate[],
  k: ChainKinetics,
  T: number,
  pressure: number,
  surfaceExchange: number,
  dt: number,
  out: ChainFlux,
): void {
  const pH = solvePH(s, T);
  const window = temperatureWindow(T, k.coldZero, k.coldFull, k.hotFull, k.hotZero);
  const a = arrhenius(T, k.Ea, k.Tref) * window;
  const hydro = pHFactor(pH, k.hydrolysisPHLow, k.hydrolysisPHHigh);
  const meth = pHFactor(pH, k.methanogenPHLow, k.methanogenPHHigh);

  // the particles
  const shareFast = firstOrderShare(k.kFast * a * hydro, dt);
  const shareSlow = firstOrderShare(k.kSlow * a * hydro, dt);
  let hydrolysed = 0;
  let acidMade = 0;
  let co2Hydrolysis = 0;
  for (let i = 0; i < substrates.length; i++) {
    const sub = substrates[i]!;
    const f = s.fast[i]! * shareFast;
    const g = s.slow[i]! * shareSlow;
    s.fast[i]! -= f;
    s.slow[i]! -= g;
    const vs = f + g;
    if (vs > 0) {
      const cod = vs * sub.cod;
      hydrolysed += vs;
      acidMade += cod;
      co2Hydrolysis += cod * MOL_CH4_PER_KG_COD * (sub.co2PerCh4 - 1);
    }
  }

  // the methanogens' death returns to the acids: a kg of COD stays a kg of COD
  const death = s.biomass * firstOrderShare(k.decay * a, dt);
  s.biomass -= death;

  // the acids and who eats them
  const Ks = k.Ks * s.volume;
  const rate = (k.km * a * meth * s.biomass) / (Ks + s.acid);
  const acid = (s.acid + acidMade + death) / (1 + dt * rate);
  const uptake = dt * rate * acid;
  s.acid = acid;
  const grown = k.yieldX * uptake;
  s.biomass += grown;
  const toGas = (uptake - grown) * MOL_CH4_PER_KG_COD;

  // the gas: what the methane carries, what an open surface lets go
  const co2Made = co2Hydrolysis + toGas;
  const phi = freeCO2Share(s.h, carbonicK1(T));
  const kH = henryCO2(T);
  const litres = s.volume * 1000;
  const pCO2 = (phi * s.dic) / litres / kH;
  const pDry = (pressure - waterVapourPressure(T)) * 1e-5;
  const room = Math.max(pDry - pCO2, BUBBLE_FLOOR * pDry);
  const lift = dt > 0 ? toGas / dt : 0;
  const bubble = (lift * phi) / (kH * litres) / room;
  const strip = (surfaceExchange * phi) / s.volume;
  const carbon = s.dic + co2Made - s.acidCarbonDebt;
  s.acidCarbonDebt = Math.max(0, -carbon);
  let dic = Math.max(0, carbon) / (1 + dt * (bubble + strip));
  let co2Bubble = dt * bubble * dic;
  out.co2Strip = dt * strip * dic;
  // a soured tank makes almost no methane to carry its CO2: what stands above the pressure on the liquid leaves at once
  const saturated = (kH * pDry * (1 - BUBBLE_FLOOR) * litres) / phi;
  if (dic > saturated) {
    co2Bubble += dic - saturated;
    dic = saturated;
  }
  out.co2Bubble = co2Bubble;
  s.dic = dic;

  out.pH = pH;
  out.kFactor = a;
  out.hydrolysisActivity = hydro;
  out.methanogenActivity = meth;
  out.hydrolysed = hydrolysed;
  out.acidMade = acidMade;
  out.uptake = uptake;
  out.ch4 = toGas;
  out.co2Made = co2Made;
  out.pCO2 = pCO2;
}

/**
 * A volume of liquid pushed out: everything dissolved leaves at the liquid's rate, everything solid or settled at that rate over `retention` (the ratio of solids' to liquid's residence time).
 * `out` receives what left. Allocates nothing.
 */
export interface Displaced {
  /** kg VS per kind, summed over substrates, in fast + slow and in inert. */
  degradable: number;
  inert: number;
  /** kg COD of degradable solids, of acids, of methanogens. */
  codSolids: number;
  acid: number;
  biomass: number;
  /** mol, eq. */
  dic: number;
  charge: number;
}

export const newDisplaced = (): Displaced => ({
  degradable: 0,
  inert: 0,
  codSolids: 0,
  acid: 0,
  biomass: 0,
  dic: 0,
  charge: 0,
});

export function displace(
  s: ChainState,
  substrates: readonly ChainSubstrate[],
  litres: number,
  retention: number,
  out: Displaced,
): void {
  const f = Math.min(1, litres / (s.volume * 1000));
  const g = f / retention;
  let degradable = 0;
  let inert = 0;
  let codSolids = 0;
  for (let i = 0; i < substrates.length; i++) {
    const a = s.fast[i]! * g;
    const b = s.slow[i]! * g;
    const c = s.inert[i]! * g;
    s.fast[i]! -= a;
    s.slow[i]! -= b;
    s.inert[i]! -= c;
    degradable += a + b;
    inert += c;
    codSolids += (a + b) * substrates[i]!.cod;
  }
  out.degradable = degradable;
  out.inert = inert;
  out.codSolids = codSolids;
  out.acid = s.acid * f;
  s.acid -= out.acid;
  out.biomass = s.biomass * g;
  s.biomass -= out.biomass;
  out.dic = s.dic * f;
  s.dic -= out.dic;
  out.charge = s.charge * f;
  s.charge -= out.charge;
}
