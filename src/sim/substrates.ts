import { buswellMix, NL_CH4_PER_KG_COD, type ChainSubstrate, type Yield } from './bio';

// What goes in. Each substrate's solids are reported, its composition estimated, its methane potential reported where a source gives one. The chemistry's ceiling comes from Buswell (`bio/buswell.ts`).

export type SubstrateId = 'leftovers' | 'peelings' | 'dung' | 'canteen';

export interface Substrate {
  id: SubstrateId;
  /** Total solids, kg per kg wet. reported. */
  ts: number;
  /** Volatile solids, kg per kg of solids. reported. */
  vs: number;
  /** Composition of the VS by mass: carbohydrate, protein, fat. estimate: no source analyses these wastes. */
  carbohydrate: number;
  protein: number;
  fat: number;
  /** What a kg of VS gives at the end, normal litres of CH4. reported or estimate, see each. */
  potential: number;
  /** Share of the degradable VS in the fast pool. estimate. */
  fastShare: number;
  /** Net strong cations a kg brings, eq per kg wet. */
  charge: number;
}

/**
 * The cations a kilo of feed brings, eq/kg. derived from S5's Table 18, read for this role: 1,130 mg CaCO₃/L at 2 kg/d and 20 L/d, days 103 and 105, is 22.6 meq/L. So 2 kg must bring what 18 L of water do not.
 * This is an input of the pH, and the pH is still the model's own: it also depends on the CO₂ the gas leaves in the liquid.
 */
export const FEED_CHARGE = (22.6e-3 * 20 - 2e-3 * 18) / 2;

/**
 * Cooked leftovers (food waste, S5). Its composition is read from what S5 measured: Table 20 gives 0.567 kg COD on 0.451 kg VS, so 1.26 kg COD per kg VS, which a starchy food with little fat gives (starch 1.19, protein
 * 1.42, fat 2.9); S7's canteen waste has C/N 26, so about 12 % protein by N × 6.25. A first guess with 18 % fat was thrown away for this: it is not a target, Table 20's COD is another measurement than the gas.
 */
export const LEFTOVERS: Substrate = {
  id: 'leftovers',
  ts: 0.24, // measured (K14)
  vs: 0.94, // measured (K14, Table 20). The abstract's 91 % gives 0.514 kg VS/m³·d where the thesis prints 0.53, which is this one
  carbohydrate: 0.85, // estimate, from the COD above
  protein: 0.12, // estimate, from S7's C/N
  fat: 0.03, // estimate, what is left
  potential: 396, // reported (K45, Khalid et al. 2011, in S8). The ceiling for this mix is 443: 89 %
  fastShare: 0.8, // estimate: cooked, and a third of S7's waste's COD is already dissolved
  charge: FEED_CHARGE,
};

/** Peelings and market waste (S5). Table 20 prints 0.172 kg COD on 0.180 kg VS, below any carbohydrate's 1.19: a scattered sample, and the only figure there is. */
export const PEELINGS: Substrate = {
  id: 'peelings',
  ts: 0.1, // measured (K14)
  vs: 0.88, // measured (K14). Table 20's 0.180 kg VS/d, 90 %
  carbohydrate: 0.9, // estimate: raw plant matter
  protein: 0.1, // estimate
  fat: 0, // estimate
  // derived, and generous: all the COD that Table 20 measured, at 350 NL CH₄/kg COD. S5's own 417 NL/kg VS is above this and above any carbohydrate's ceiling of 415: see docs/physics.md
  potential: (0.172 / 0.18) * NL_CH4_PER_KG_COD,
  fastShare: 0.35, // estimate: raw, with fibre
  charge: FEED_CHARGE, // estimate: the same as leftovers, Table 18 was taken on food waste only
};

/** Cow dung, as S5 inoculated its plant. Only used at a first fill. */
export const DUNG: Substrate = {
  id: 'dung',
  ts: 0.23, // reported (S5 §3.1.1, read for this role)
  vs: 0.74, // reported (the same)
  carbohydrate: 0.8, // estimate
  protein: 0.15, // estimate
  fat: 0.05, // estimate
  potential: 200, // estimate, a usual figure for dung
  fastShare: 0.1, // estimate
  charge: 0.2, // estimate: 1.2 % K and 1.8 % N of the solids are usual, of which a part in solution. See docs/physics.md, the one input an outcome moved
};

/** A school's canteen waste (S7). 428 g COD on 242.5 g VS per kg wet (Table 3): fatter than S5's food. */
export const CANTEEN: Substrate = {
  id: 'canteen',
  ts: 0.263, // reported (S7, Table 3)
  vs: 0.919, // reported (the same)
  carbohydrate: 0.56, // estimate, from that COD
  protein: 0.12, // estimate, from its C/N of 26
  fat: 0.32, // estimate, from that COD
  potential: 396, // reported, the same source as leftovers: nothing better for this waste
  fastShare: 0.8, // estimate
  charge: FEED_CHARGE, // estimate
};

export const SUBSTRATES: readonly Substrate[] = [LEFTOVERS, PEELINGS, DUNG, CANTEEN];
export const LEFTOVERS_INDEX = 0;
export const PEELINGS_INDEX = 1;
export const DUNG_INDEX = 2;
export const CANTEEN_INDEX = 3;

/** Buswell's ceiling for a substrate. */
export const ceilingOf = (s: Substrate): Yield => buswellMix(s.carbohydrate, s.protein, s.fat);

/** Share of the VS that can ever become gas: the potential over the ceiling. derived, and it leaves a place for what is locked in lignin or goes into cells. */
export const degradableShare = (s: Substrate): number => s.potential / ceilingOf(s).ch4;

/** The chain's view of each substrate. */
export const CHAIN_SUBSTRATES: readonly ChainSubstrate[] = SUBSTRATES.map((s) => {
  const y = ceilingOf(s);
  return { cod: y.cod, co2PerCh4: y.co2 / y.ch4 };
});

/** kg VS per kg wet. */
export const vsPerKg = (s: Substrate): number => s.ts * s.vs;

/** The mineral part of a kilo's solids, kg: what passes through and counts in the effluent's total solids. */
export const ashPerKg = (s: Substrate): number => s.ts * (1 - s.vs);
