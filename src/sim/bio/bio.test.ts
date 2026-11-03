import { describe, expect, it } from 'vitest';
import {
  ACETIC_KA,
  activationFromRatio,
  arrhenius,
  ATMOSPHERE,
  buswell,
  buswellMix,
  CARBOHYDRATE,
  carbonicK1,
  condensatePerMole,
  createChain,
  displace,
  FAT,
  firstOrderShare,
  freeCO2Share,
  halfLife,
  henryCO2,
  MOL_CH4_PER_KG_COD,
  monod,
  newChainFlux,
  newDisplaced,
  NL_CH4_PER_KG_COD,
  normalPerDryLitre,
  normalPerWetLitre,
  pHFactor,
  pHof,
  PROTEIN,
  solveHydrogen,
  steadyConversion,
  stepChain,
  temperatureWindow,
  timeToShare,
  waterKw,
  waterVapourPressure,
  wetMolarVolume,
  type ChainKinetics,
  type ChainState,
  type ChainSubstrate,
} from './index';

// `sim/bio` against closed forms and printed values. No lab's figure here: those are in figures.test.ts.

const KINETICS: ChainKinetics = {
  kFast: 0.4,
  kSlow: 0.05,
  Ea: 60000,
  Tref: 30,
  km: 5.3,
  Ks: 0.15,
  yieldX: 0.05,
  decay: 0.02,
  hydrolysisPHLow: 4,
  hydrolysisPHHigh: 5.5,
  methanogenPHLow: 6,
  methanogenPHHigh: 7,
  coldZero: 0,
  coldFull: 0.001,
  hotFull: 38,
  hotZero: 48,
};
const SUBS: ChainSubstrate[] = [
  { cod: 1.26, co2PerCh4: 0.96 },
  { cod: 1.2, co2PerCh4: 1.1 },
];

const working = (): ChainState => {
  const s = createChain(0.85, 2);
  s.fast[0] = 1;
  s.slow[0] = 2;
  s.fast[1] = 0.5;
  s.slow[1] = 1;
  s.acid = 0.05;
  s.biomass = 1;
  s.charge = 0.02 * 850;
  s.dic = 0.03 * 850;
  return s;
};

const codOf = (s: ChainState): number => {
  let c = s.acid + s.biomass;
  for (let i = 0; i < SUBS.length; i++) c += (s.fast[i]! + s.slow[i]!) * SUBS[i]!.cod;
  return c;
};
const carbonOf = (s: ChainState): number => {
  let c = s.dic - s.acidCarbonDebt + (s.acid + s.biomass) * 2 * MOL_CH4_PER_KG_COD;
  for (let i = 0; i < SUBS.length; i++) {
    c += (s.fast[i]! + s.slow[i]!) * SUBS[i]!.cod * MOL_CH4_PER_KG_COD * (1 + SUBS[i]!.co2PerCh4);
  }
  return c;
};

describe('rates', () => {
  it('Arrhenius: the research’s arithmetic at 60 kJ/mol against 30 °C', () => {
    expect(arrhenius(15, 60000)).toBeCloseTo(0.29, 2);
    expect(arrhenius(20, 60000)).toBeCloseTo(0.44, 2);
    expect(arrhenius(37, 60000)).toBeCloseTo(1.71, 2);
    expect(arrhenius(30, 60000)).toBe(1);
  });
  it('an activation energy from a ratio: doubling from 11 to 22 °C is about 44 kJ/mol', () => {
    const Ea = activationFromRatio(11, 22, 2);
    expect(Ea / 1000).toBeCloseTo(44.0, 0);
    expect(arrhenius(22, Ea, 11)).toBeCloseTo(2, 10);
  });
  it('first order: exact at any step, half at the half-life', () => {
    const k = 0.4;
    expect(firstOrderShare(k, halfLife(k))).toBeCloseTo(0.5, 12);
    let left = 1;
    for (let i = 0; i < 100; i++) left *= 1 - firstOrderShare(k, 0.1);
    expect(left).toBeCloseTo(Math.exp(-k * 10), 12);
    expect(timeToShare(k, 0.9)).toBeCloseTo(Math.log(10) / k, 12);
  });
  it('a stirred tank’s conversion, Monod, the pH factor, the window', () => {
    expect(steadyConversion(0.05, 1 / 300)).toBeCloseTo(0.9375, 4);
    expect(monod(0, 1)).toBe(0);
    expect(monod(1, 1)).toBe(0.5);
    expect(pHFactor(7.5, 6, 7)).toBe(1);
    expect(pHFactor(6, 6, 7)).toBeCloseTo(Math.exp(-3), 12);
    expect(temperatureWindow(30, 0, 5, 38, 48)).toBe(1);
    expect(temperatureWindow(2.5, 0, 5, 38, 48)).toBe(0.5);
    expect(temperatureWindow(43, 0, 5, 38, 48)).toBe(0.5);
    expect(temperatureWindow(48, 0, 5, 38, 48)).toBe(0);
  });
});

describe('Buswell', () => {
  it('starch gives equal CH4 and CO2, 0.297 kg CH4 per kg, about 415 NL', () => {
    const y = buswell(CARBOHYDRATE);
    expect(y.ch4Mass).toBeCloseTo(0.297, 3);
    expect(y.ch4).toBeCloseTo(414.7, 0);
    expect(y.co2).toBeCloseTo(y.ch4, 6);
    expect(y.cod).toBeCloseTo(1.184, 3);
  });
  it('a fat gives more and a richer gas; a protein brings nitrogen', () => {
    const fat = buswell(FAT);
    expect(fat.ch4).toBeCloseTo(1014, -1);
    expect(fat.ch4 / (fat.ch4 + fat.co2)).toBeCloseTo(0.7, 1);
    const protein = buswell(PROTEIN);
    expect(protein.ch4).toBeCloseTo(496, -1);
    expect(protein.cod).toBeCloseTo(1.414, 3);
  });
  it('COD and methane agree: 350 NL per kg COD', () => {
    expect(NL_CH4_PER_KG_COD).toBeCloseTo(350.2, 1);
    const y = buswellMix(0.85, 0.12, 0.03);
    expect(y.ch4 / y.cod).toBeCloseTo(NL_CH4_PER_KG_COD, 6);
  });
});

describe('the buffer', () => {
  it('CO2’s and acetic acid’s constants at 25 °C', () => {
    expect(-Math.log10(carbonicK1(25))).toBeCloseTo(6.35, 6);
    expect(-Math.log10(ACETIC_KA)).toBeCloseTo(4.76, 6);
    expect(henryCO2(25)).toBeCloseTo(0.035, 6);
    expect(henryCO2(35)).toBeLessThan(henryCO2(25));
  });
  it('a bicarbonate buffer obeys Henderson-Hasselbalch', () => {
    const k1 = carbonicK1(30);
    const hco3 = 0.02;
    const co2 = 0.01;
    const h = solveHydrogen(hco3, hco3 + co2, 0, k1, ACETIC_KA, waterKw(30), 3e-7);
    expect(pHof(h)).toBeCloseTo(pHof(k1) + Math.log10(hco3 / co2), 2);
  });
  it('acids eat the buffer, and a soured liquid sits on acetic acid’s own buffer', () => {
    const k1 = carbonicK1(30);
    const kw = waterKw(30);
    const healthy = pHof(solveHydrogen(0.02, 0.03, 0.001, k1, ACETIC_KA, kw, 3e-7));
    const sour = pHof(solveHydrogen(0.02, 0.03, 0.08, k1, ACETIC_KA, kw, 3e-7));
    expect(sour).toBeLessThan(healthy);
    expect(sour).toBeCloseTo(4.76 + Math.log10(0.02 / 0.06), 0);
  });
  it('holds the balance from any starting guess', () => {
    const k1 = carbonicK1(30);
    const kw = waterKw(30);
    const a = solveHydrogen(0.02, 0.03, 0.01, k1, ACETIC_KA, kw, 1e-4);
    const b = solveHydrogen(0.02, 0.03, 0.01, k1, ACETIC_KA, kw, 1e-9);
    expect(a / b).toBeCloseTo(1, 6);
    const f = 0.02 + a - (0.03 * k1) / (k1 + a) - (0.01 * ACETIC_KA) / (ACETIC_KA + a) - kw / a;
    expect(Math.abs(f)).toBeLessThan(1e-10);
  });
  it('free CO2 is half the carbon at the pK', () => {
    expect(freeCO2Share(carbonicK1(30), carbonicK1(30))).toBeCloseTo(0.5, 12);
  });
});

describe('a wet gas', () => {
  it('vapour at usual points', () => {
    // steam tables: 2339, 4247, 7384 Pa. Magnus is within a quarter of a percent
    expect(waterVapourPressure(20) / 2339).toBeCloseTo(1, 2);
    expect(waterVapourPressure(30) / 4247).toBeCloseTo(1, 2);
    expect(waterVapourPressure(40) / 7384).toBeCloseTo(1, 2);
  });
  it('a litre of wet gas at 30 °C holds 0.86 NL, 0.90 NL with the vapour left in', () => {
    expect(normalPerWetLitre(30, ATMOSPHERE)).toBeCloseTo(0.86, 2);
    expect(normalPerDryLitre(30, ATMOSPHERE)).toBeCloseTo(0.901, 3);
    expect(wetMolarVolume(0, ATMOSPHERE) * 1000).toBeCloseTo(22.56, 1);
  });
  it('only a cooling gas drops water', () => {
    expect(condensatePerMole(30, 35, ATMOSPHERE)).toBe(0);
    expect(condensatePerMole(30, 20, ATMOSPHERE)).toBeGreaterThan(0);
  });
});

describe('the chain', () => {
  it('COD and carbon close to rounding, at a small and a large step', () => {
    for (const dt of [1 / 2880, 1 / 24, 1]) {
      const s = working();
      const f = newChainFlux();
      const cod0 = codOf(s);
      const carbon0 = carbonOf(s);
      let ch4 = 0;
      let co2 = 0;
      for (let i = 0; i < 30 / dt; i++) {
        stepChain(s, SUBS, KINETICS, 30, ATMOSPHERE, 0.09, dt, f);
        ch4 += f.ch4;
        co2 += f.co2Bubble + f.co2Strip;
      }
      expect(codOf(s) + ch4 / MOL_CH4_PER_KG_COD).toBeCloseTo(cod0, 8);
      expect(carbonOf(s) + ch4 + co2).toBeCloseTo(carbon0, 6);
    }
  });
  it('without methanogens the acid only accumulates; nothing goes negative', () => {
    const s = working();
    s.biomass = 0;
    const f = newChainFlux();
    for (let i = 0; i < 30 * 24; i++) stepChain(s, SUBS, KINETICS, 30, ATMOSPHERE, 0, 1 / 24, f);
    expect(s.acid).toBeGreaterThan(0.5);
    expect(f.ch4).toBe(0);
    expect(f.pH).toBeLessThan(5.5);
    expect(s.dic).toBeGreaterThanOrEqual(0);
  });
  it('the CO2 in the bubbles follows its partial pressure: less free CO2, a richer gas', () => {
    const rich = working();
    const lean = working();
    lean.dic = 0.022 * 850;
    const a = newChainFlux();
    const b = newChainFlux();
    stepChain(rich, SUBS, KINETICS, 30, ATMOSPHERE, 0, 1 / 24, a);
    stepChain(lean, SUBS, KINETICS, 30, ATMOSPHERE, 0, 1 / 24, b);
    expect(b.co2Bubble / b.ch4).toBeLessThan(a.co2Bubble / a.ch4);
  });
  it('a supersaturated liquid lets its CO2 go even with no methane', () => {
    const s = working();
    s.biomass = 0;
    s.acid = 8;
    s.dic = 200;
    const f = newChainFlux();
    stepChain(s, SUBS, KINETICS, 30, ATMOSPHERE, 0, 1 / 24, f);
    expect(f.ch4).toBe(0);
    expect(f.co2Bubble).toBeGreaterThan(100);
    expect(f.pCO2).toBeGreaterThan(1);
  });
  it('a soured tank whose food would draw CO2 it no longer has: the debt keeps the carbon closed, and is repaid first', () => {
    const lean: ChainSubstrate[] = [{ cod: 1.5, co2PerCh4: 0.5 }];
    const s = createChain(0.85, 1);
    s.fast[0] = 20;
    s.dic = 0.5;
    s.charge = 1;
    const f = newChainFlux();
    const carbonAt = (): number =>
      s.dic - s.acidCarbonDebt + s.acid * 2 * MOL_CH4_PER_KG_COD + s.fast[0]! * lean[0]!.cod * MOL_CH4_PER_KG_COD * 1.5;
    const start = carbonAt();
    let strip = 0;
    for (let i = 0; i < 400; i++) {
      stepChain(s, lean, KINETICS, 30, ATMOSPHERE, 0.09, 1 / 24, f);
      strip += f.co2Bubble + f.co2Strip;
    }
    expect(s.acidCarbonDebt).toBeGreaterThan(1);
    expect(s.dic).toBeGreaterThanOrEqual(0);
    expect(carbonAt() + strip).toBeCloseTo(start, 8);
  });
  it('slows with the cold by Arrhenius, stops at freezing, stops past its hot limit', () => {
    const at = (T: number): number => {
      const s = working();
      const f = newChainFlux();
      stepChain(s, SUBS, KINETICS, T, ATMOSPHERE, 0, 1 / 24, f);
      return f.hydrolysed;
    };
    expect(at(20) / at(30)).toBeCloseTo(arrhenius(20, 60000), 2);
    expect(at(0)).toBe(0);
    expect(at(48)).toBe(0);
    expect(at(43)).toBeLessThan(at(38));
  });
  it('displaces liquids at the flow and solids at the flow over the retention', () => {
    const s = working();
    const out = newDisplaced();
    const acid = s.acid;
    const fast = s.fast[0]!;
    displace(s, SUBS, 8.5, 5, out);
    expect(out.acid).toBeCloseTo(acid * 0.01, 12);
    expect(s.fast[0]).toBeCloseTo(fast * (1 - 0.002), 12);
    expect(out.charge).toBeCloseTo(0.02 * 850 * 0.01, 12);
  });
});

describe('it could move to the kit', () => {
  const raw = import.meta.glob(['./*.ts', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >;
  it('imports nothing from outside this folder, not even the kit', () => {
    for (const [file, text] of Object.entries(raw)) {
      for (const m of text.matchAll(/from '([^']+)'/g)) expect(m[1], `${file}: ${m[1]}`).toMatch(/^\.\/[a-z]+$/);
    }
  });
  it('names no lab, no place, no machine', () => {
    for (const [file, text] of Object.entries(raw)) {
      expect(text, file).not.toMatch(/biodigester|Dar es Salaam|Geneva|ARTI\b|\bbell\b|Lohri|Plant\b/i);
    }
  });
});
