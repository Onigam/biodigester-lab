// The carbonate and acetate buffer of a liquid in contact with a gas: equilibrium constants with temperature, and the pH from a charge balance. Concentrations in mol/L, partial pressures in
// bar, temperatures in °C. Usual constants of aqueous chemistry, with the temperature terms of ADM1 (Batstone et al. 2002, from memory: read the report before quoting a digit).

import { R_GAS } from './kinetics';

const vantHoff = (K25: number, dH: number, T: number): number =>
  K25 * Math.exp((dH / R_GAS) * (1 / 298.15 - 1 / (T + 273.15)));

/** First dissociation of carbon dioxide. */
export const carbonicK1 = (T: number): number => vantHoff(10 ** -6.35, 7646, T);
/** Acetic acid: its pKa of 4.76 hardly moves with temperature. */
export const ACETIC_KA = 10 ** -4.76;
/** Water. */
export const waterKw = (T: number): number => vantHoff(1e-14, 55900, T);
/** Henry's constant of CO2, mol/L·bar. */
export const henryCO2 = (T: number): number => vantHoff(0.035, -19410, T);
/** Henry's constant of CH4, mol/L·bar. */
export const henryCH4 = (T: number): number => vantHoff(0.0014, -14240, T);

/**
 * The hydrogen ion's concentration from a charge balance: charge + [H+] = [HCO3−] + [Ac−] + [OH−].
 * `charge` is the net strong cations (eq/L), `dic` the dissolved inorganic carbon (mol/L), `acid` the fatty acids as acetate (mol/L). The balance rises with [H+] and has one root: Newton on a bracket
 * from the last value, a few rounds in a step. Does not allocate.
 */
export function solveHydrogen(
  charge: number,
  dic: number,
  acid: number,
  k1: number,
  ka: number,
  kw: number,
  guess: number,
): number {
  let lo = 1e-12;
  let hi = 1;
  let h = guess > lo && guess < hi ? guess : 3e-7;
  for (let i = 0; i < 40; i++) {
    const a = k1 + h;
    const b = ka + h;
    const f = charge + h - (dic * k1) / a - (acid * ka) / b - kw / h;
    if (Math.abs(f) < 1e-11) break;
    if (f > 0) hi = h;
    else lo = h;
    const slope = 1 + (dic * k1) / (a * a) + (acid * ka) / (b * b) + kw / (h * h);
    const next = h - f / slope;
    h = next > lo && next < hi ? next : Math.sqrt(lo * hi);
  }
  return h;
}

/** The share of the dissolved inorganic carbon that is free CO2. */
export const freeCO2Share = (h: number, k1: number): number => h / (h + k1);

export const pHof = (h: number): number => -Math.log10(h);
