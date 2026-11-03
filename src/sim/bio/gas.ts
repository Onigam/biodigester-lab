// A wet gas over warm water: vapour, volume, what a normal litre means, what a mole burns to. No lab's name.

import { CH4_MOLAR_MASS, NL_PER_MOL } from './buswell';
import { R_GAS } from './kinetics';

/** Standard atmosphere, Pa. */
export const ATMOSPHERE = 101325;

/** Saturation pressure of water, Pa (Magnus, the Sonntag coefficients). */
export const waterVapourPressure = (T: number): number => 611.2 * Math.exp((17.62 * T) / (243.12 + T));

/** m³ per mole of dry gas, once it is saturated with vapour at T and held at a total pressure, Pa. */
export const wetMolarVolume = (T: number, pressure: number): number =>
  (R_GAS * (T + 273.15)) / (pressure - waterVapourPressure(T));

/** Normal litres per litre of wet gas. Removes the heat and the vapour. */
export const normalPerWetLitre = (T: number, pressure: number): number =>
  NL_PER_MOL / 1000 / wetMolarVolume(T, pressure);

/** The same with only the temperature and the pressure removed, the vapour left in, as many theses do it. */
export const normalPerDryLitre = (T: number, pressure: number): number =>
  ((273.15 / (T + 273.15)) * pressure) / ATMOSPHERE;

/** Lower heating value of methane, Wh per normal litre. General knowledge, as in the research's checks. */
export const CH4_WH_PER_NL = 9.97;
/** The same per mole, J. */
export const CH4_J_PER_MOL = CH4_WH_PER_NL * NL_PER_MOL * 3600;
/** kg of methane per normal litre. */
export const CH4_KG_PER_NL = CH4_MOLAR_MASS / NL_PER_MOL;

/** Density of a dry mix of CH4 and CO2 at T, kg/m³ near atmospheric pressure. */
export function biogasDensity(ch4Share: number, T: number): number {
  const M = 0.01604 * ch4Share + 0.04401 * (1 - ch4Share);
  return (M * ATMOSPHERE) / (R_GAS * (T + 273.15));
}

/** Moles of water that one mole of dry gas must drop going from saturation at T1 to saturation at T2. Nothing if it warms. */
export function condensatePerMole(T1: number, T2: number, pressure: number): number {
  if (T2 >= T1) return 0;
  const p1 = waterVapourPressure(T1);
  const p2 = waterVapourPressure(T2);
  return p1 / (pressure - p1) - p2 / (pressure - p2);
}
