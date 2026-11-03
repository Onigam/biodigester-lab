// How much gas a molecule can give: Buswell's equation, and the COD that goes with it. No lab's name, no state.
//   CnHaObNc + (n − a/4 − b/2 + 3c/4) H2O → (n/2 + a/8 − b/4 − 3c/8) CH4 + (n/2 − a/8 + b/4 + 3c/8) CO2 + c NH3
// This is a ceiling: real substrates give less, because some of the carbon goes into cells, and some is never reached.

/** Normal litres per mole of ideal gas, 0 °C, 1013.25 mbar. */
export const NL_PER_MOL = 22.414;
/** Oxygen demand of a mole of methane, kg COD (2 O2). */
export const KG_COD_PER_MOL_CH4 = 0.064;
/** Moles of methane per kg COD. */
export const MOL_CH4_PER_KG_COD = 1 / KG_COD_PER_MOL_CH4;
/** Normal litres of methane per kg COD. */
export const NL_CH4_PER_KG_COD = NL_PER_MOL * MOL_CH4_PER_KG_COD;
/** Molar mass of methane, kg/mol. */
export const CH4_MOLAR_MASS = 0.01604;

export interface Formula {
  C: number;
  H: number;
  O: number;
  N: number;
}

/** Starch and sugars, per repeating unit. */
export const CARBOHYDRATE: Formula = { C: 6, H: 10, O: 5, N: 0 };
/** A usual empirical protein. */
export const PROTEIN: Formula = { C: 5, H: 7, O: 2, N: 1 };
/** Triolein, the usual stand-in for a fat. */
export const FAT: Formula = { C: 57, H: 104, O: 6, N: 0 };

export interface Yield {
  /** NL of CH4 and of CO2 per kg of the substance. The CO2 is all that forms, before any of it dissolves or binds to ammonia. */
  ch4: number;
  co2: number;
  /** kg COD per kg of the substance. */
  cod: number;
  /** kg CH4 per kg of the substance. */
  ch4Mass: number;
  /** Moles of carbon per kg. */
  carbon: number;
}

const molarMass = (f: Formula): number => (12.011 * f.C + 1.008 * f.H + 15.999 * f.O + 14.007 * f.N) / 1000;

/** Buswell's limit for one formula. */
export function buswell(f: Formula): Yield {
  const mass = molarMass(f);
  const ch4 = f.C / 2 + f.H / 8 - f.O / 4 - (3 * f.N) / 8;
  const co2 = f.C - ch4;
  return {
    ch4: (ch4 * NL_PER_MOL) / mass,
    co2: (co2 * NL_PER_MOL) / mass,
    cod: (ch4 * KG_COD_PER_MOL_CH4) / mass,
    ch4Mass: (ch4 * CH4_MOLAR_MASS) / mass,
    carbon: f.C / mass,
  };
}

/** Buswell's limit for a mix, shares by mass (they are normalised). */
export function buswellMix(carbohydrate: number, protein: number, fat: number): Yield {
  const sum = carbohydrate + protein + fat;
  const a = buswell(CARBOHYDRATE);
  const b = buswell(PROTEIN);
  const c = buswell(FAT);
  const mix = (k: keyof Yield): number => (carbohydrate * a[k] + protein * b[k] + fat * c[k]) / sum;
  return { ch4: mix('ch4'), co2: mix('co2'), cod: mix('cod'), ch4Mass: mix('ch4Mass'), carbon: mix('carbon') };
}
