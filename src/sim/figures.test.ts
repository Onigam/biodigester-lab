import { GRAVITY } from '@onigam/lab-kit/sim/thermal';
import { describe, expect, it } from 'vitest';
import {
  arrhenius,
  ATMOSPHERE,
  buswell,
  CARBOHYDRATE,
  CH4_KG_PER_NL,
  CH4_WH_PER_NL,
  NL_CH4_PER_KG_COD,
  normalPerDryLitre,
  normalPerWetLitre,
  waterVapourPressure,
} from './bio';
import {
  midMonth,
  MONTH_DAYS,
  monthlyAt,
  newDaySun,
  readDaySun,
  horizontalSun,
  sunDaily,
  SITES,
  yearMean,
  SITE_IDS,
} from './climate';
import { LOAD_LIMIT } from './engine';
import {
  bellArea,
  bellMass,
  bellPressure,
  coveredArea,
  DRUM_60,
  effectiveWeight,
  FITTINGS,
  HALF_BRICK,
  innerDepression,
  markSpacing,
  MODEL,
  openShare,
  PLANT_1000,
  PLANT_1100,
  PLANT_1500,
  retentionDays,
  rimDepth,
  SCHOOL_4000,
  skin,
  surfaceArea,
  trappedVolume,
  usableVolume,
  wallSection,
  weightPressure,
} from './machine';
import {
  burnerLaw,
  FEED_HOURS,
  hoseResistance,
  lineFlow,
  Plant,
  plugPressure,
  SCUM_SHARE,
  SEED_METHANOGENS,
  SLUDGE_SHARE,
  STOCK_VS_SHARE,
} from './plant';
import { RANGES } from './presets';
import {
  burnTest,
  coldSweep,
  coldWaterKWh,
  firstWinter,
  flameOutRun,
  HAND,
  heatBudget,
  mealResponse,
  measure,
  methaneGrams,
  minutesOn,
  paramsOf,
  planOn,
  rescueRun,
  rimBreakEven,
  rimClimate,
  siteYear,
  souringFeed,
  sours,
  steady,
  thesisRun,
  twoKiloMethane,
  wallLossW,
} from './runs';
import {
  ashPerKg,
  CANTEEN,
  ceilingOf,
  degradableShare,
  DUNG,
  FEED_CHARGE,
  LEFTOVERS,
  PEELINGS,
  vsPerKg,
} from './substrates';

// A test per key figure of the research, K numbers in the names. Three kinds:
//   exact    arithmetic the model holds
//   compare  the model's own answer, pinned, with the source's beside it. A pin records what the model gives; it is not a target. When the model moves, docs/physics.md moves with it
//   find     no target, the research asked the model to answer
// Figures it does not find have a test of what it does give, and their cause in docs/physics.md.

const LONG = 240000;
const within = (model: number, source: number, share: number): void => {
  expect(Math.abs(model - source) / source, `${model} against ${source}`).toBeLessThan(share);
};
const beyond = (model: number, source: number, share: number): void => {
  expect(Math.abs(model - source) / source, `${model} against ${source}`).toBeGreaterThan(share);
};

const thesis = thesisRun();
const steadyFood = steady({ shareCooked: 100 });
const steadyMarket = steady({ shareCooked: 0 });
const steadyMix = steady({ shareCooked: 50 });
const steadyFive = steady({ shareCooked: 100, feedKg: 5, waterPerKg: 8 });
const food = thesis.mean(19, 29);
const market = thesis.mean(46, 56);
const fiveFood = thesis.mean(94, 97);

// ------------------------------------------------------------------------------------------------ the research's checks by hand (§2.9), the first tests

describe('research §2.9, the hand checks, exact', () => {
  it('the slurry’s volume: π × 0.515² × 1.04 gives 867 L against « about 850 »', () => {
    expect(surfaceArea(PLANT_1000) * PLANT_1000.overflowLevel * 1000).toBeCloseTo(867, 0);
    expect(PLANT_1000.liquidVolume * 1000).toBe(850);
  });
  it('the open ring: 1 − 0.65/0.83 = 21.7 %', () => {
    expect(openShare(PLANT_1000) * 100).toBeCloseTo(21.9, 0);
    expect((1 - 0.65 / 0.83) * 100).toBeCloseTo(21.7, 1);
  });
  it('the scale: 17.2 cm per 100 L, 400 L in 0.689 m', () => {
    expect(markSpacing(PLANT_1000) * 100).toBeCloseTo(17.2, 1);
    expect(usableVolume(PLANT_1000) * 1000).toBeCloseTo(400.8, 0);
  });
  it('THE BRICK: 12 kg on 0.581 m² is 203 Pa, 2.03 mbar, against a reading of +2', () => {
    expect(bellArea(PLANT_1000)).toBeCloseTo(0.581, 3);
    expect(weightPressure(PLANT_1000, HALF_BRICK)).toBeCloseTo((12 * GRAVITY) / bellArea(PLANT_1000), 10);
    expect(weightPressure(PLANT_1000, HALF_BRICK)).toBeCloseTo(202.7, 1);
    expect(weightPressure(PLANT_1000, HALF_BRICK) / 100).toBeCloseTo(2.03, 2);
  });
  it('the weight behind 2 mbar: 11.8 kg', () => {
    expect((200 * bellArea(PLANT_1000)) / GRAVITY).toBeCloseTo(11.8, 1);
  });
  it('the burner’s flows: 269 and 496 L/h', () => {
    expect(HAND.lphAt2mbar).toBeCloseTo(269, 0);
    expect(HAND.lphAt4mbar).toBeCloseTo(496, 0);
  });
  it('K24: 1.48 kW going in, 2.8 kW with the brick, about 0.8 kW useful at 55 %', () => {
    expect(HAND.burnerKW).toBeCloseTo(1.475, 2);
    expect(HAND.burnerKW * (HAND.lphAt4mbar / HAND.lphAt2mbar) * (62.8 / 61.4)).toBeCloseTo(2.78, 1);
    expect(HAND.burnerKW * MODEL.burnerEfficiency).toBeCloseTo(0.81, 2);
  });
  it('ABOUT 105 G of methane from 2 kg of wet scraps: 259 NL × 56.8 %', () => {
    expect(twoKiloMethane()).toBeCloseTo(105.3, 0);
    expect(((259 * 0.568 * CH4_WH_PER_NL) / 1000).toFixed(2)).toBe('1.47');
    expect((259 * 0.568 * CH4_WH_PER_NL) / 2000).toBeCloseTo(0.73, 2);
  });
  it('market waste: 54 g, 0.75 kWh', () => {
    expect(methaneGrams(113, 0.664)).toBeCloseTo(53.7, 0);
    expect((113 * 0.664 * CH4_WH_PER_NL) / 1000).toBeCloseTo(0.75, 2);
  });
  it('32 MIN PER KG of leftovers on a 1.5 kW burner, 14 min for peelings', () => {
    expect(minutesOn(144, 269)).toBeCloseTo(32.1, 1);
    expect(minutesOn(63, 269)).toBeCloseTo(14.05, 1);
  });
  it('« half an hour per kilo » of S3 is true for that flame only: 15 min at 100 L/kg on 400 L/h', () => {
    expect(minutesOn(100, 400)).toBeCloseTo(15, 6);
  });
  it('the mixed day: (289 + 126)/2 = 207 L; 200 L is 45 min; 670 L is 149 min', () => {
    expect((289 + 126) / 2).toBeCloseTo(207.5, 6);
    expect(minutesOn(200, 269)).toBeCloseTo(44.6, 1);
    expect(minutesOn(670, 269)).toBeCloseTo(149.4, 1);
  });
  it('boiling a litre: about 7 min, and the mixed day boils about 6 L', () => {
    const minutes = (HAND.boilKWh / MODEL.burnerEfficiency / HAND.burnerKW) * 60;
    expect(minutes).toBeCloseTo(6.9, 1);
    expect(45 / minutes).toBeCloseTo(6.5, 0);
  });
  it('starch’s ceiling, 0.297 kg CH₄/kg: the designer’s 0.25 is 84 % of it, S5 gives 0.234 and 0.30 per kg VS', () => {
    const y = buswell(CARBOHYDRATE).ch4Mass;
    expect(y).toBeCloseTo(0.297, 3);
    expect(0.25 / y).toBeCloseTo(0.84, 2);
    expect(574 * 0.568 * CH4_KG_PER_NL).toBeCloseTo(0.233, 2);
    expect(628 * 0.664 * CH4_KG_PER_NL).toBeCloseTo(0.298, 2);
  });
  it('the designer’s saving needs about 5 kg of leftovers a day: 100 kg LPG at 12.8 kWh/kg against 1.47 kWh for 2 kg', () => {
    const perDay = (100 * 12.8) / 365;
    expect(perDay).toBeCloseTo(3.5, 1);
    expect(perDay / (1.47 / 2)).toBeCloseTo(4.8, 1);
  });
  it('the drum: 2 L/d, 0.77 kg of scraps, in 60 L, about 2.8 kg VS/m³·d, five times this plant’s and past the limit', () => {
    const load = (0.77 * 0.24 * 0.91) / 0.06;
    expect(load).toBeCloseTo(2.8, 1);
    expect(load).toBeGreaterThan(LOAD_LIMIT);
    expect(load / 0.53).toBeCloseTo(5.3, 1);
  });
  it('the cold water of a 10 °C month: 20 L/d by 20 K is 0.46 kWh/d, about a third of 1.47', () => {
    expect(coldWaterKWh(20, 20)).toBeCloseTo(0.464, 2);
    expect(coldWaterKWh(20, 20) / 1.47).toBeCloseTo(0.32, 2);
  });
  it('the walls: 7 m², 20 K: 700 W, 17 kWh/d bare; 35 W, 0.84 kWh/d wrapped. The model’s own skin is 7.1 m²', () => {
    expect(wallLossW(5, 7, 20)).toBe(700);
    expect((wallLossW(5, 7, 20) * 24) / 1000).toBeCloseTo(16.8, 1);
    expect(wallLossW(0.25, 7, 20)).toBe(35);
    expect((wallLossW(0.25, 7, 20) * 24) / 1000).toBeCloseTo(0.84, 2);
    expect(skin(PLANT_1000).total).toBeCloseTo(7.08, 2);
  });
  it('THE RIM’S BREAK-EVEN NEAR 11 %: 8.2 kg/yr lost at 17.5 % is 220 kg CO₂e, against 125 kg for the LPG', () => {
    expect((38.5 * 0.175) / (1 - 0.175)).toBeCloseTo(8.17, 2);
    expect(rimClimate(0.175)).toBeCloseTo(220.5, 0);
    expect(42 * 3).toBe(126);
    expect(rimBreakEven()).toBeCloseTo(0.108, 3);
    expect(rimBreakEven() * 100).toBeGreaterThan(10);
    expect(rimBreakEven() * 100).toBeLessThan(12);
    // the break-even does not depend on how much gas there is: the leak and the fuel replaced both scale with it. On the model's own methane a year, the same 10.8 %
    const caught = (steadyFood.ch4G * 365) / 1000;
    expect(caught).toBeCloseTo(35.8, 0);
    expect(rimBreakEven(caught, 27, ((42 * 3) / 38.5) * caught)).toBeCloseTo(rimBreakEven(), 10);
    expect(rimClimate(0.22)).toBeGreaterThan(42 * 3);
  });
});

// ------------------------------------------------------------------------------------------------ the plant as drawn and listed

describe('K1–K12, the plant', () => {
  it('K1 tank: Ø1.04 m, 1.25 m high, inner radius 51.5 cm, which leaves a 5 mm wall', () => {
    expect(PLANT_1000.tankOuterDiameter).toBe(1.04);
    expect(PLANT_1000.tankHeight).toBe(1.25);
    expect(PLANT_1000.tankInnerRadius).toBe(0.515);
    expect(PLANT_1000.tankOuterDiameter / 2 - PLANT_1000.tankInnerRadius).toBeCloseTo(0.005, 6);
    expect(PLANT_1000.bellWall).toBe(0.005);
  });
  it('K2 bell: Ø0.90 m, 1.30 m high, the table corrected: a Ø1.30 × 0.90 tank could not enter the digester', () => {
    expect(PLANT_1000.bellOuterDiameter).toBe(0.9);
    expect(PLANT_1000.bellHeight).toBe(1.3);
    expect(1.3).toBeGreaterThan(PLANT_1000.tankInnerRadius * 2);
    expect(((Math.PI * 1.3 * 1.3) / 4) * 0.9).toBeCloseTo(1.19, 2);
  });
  it('K3 slurry: overflow at 1.04 m, about 850 L', () => {
    expect(PLANT_1000.overflowLevel).toBe(1.04);
    expect(PLANT_1000.liquidVolume).toBe(0.85);
  });
  it('K4 areas: 0.83 m², 0.65 m² covered, 22 % open', () => {
    expect(surfaceArea(PLANT_1000)).toBeCloseTo(0.83, 2);
    expect(coveredArea(PLANT_1000)).toBeCloseTo(0.65, 2);
    expect(PLANT_1000.rimLoss).toBe(0.22);
  });
  it('K5 store: inner radius 0.43 m, 400 L over 0.69 m, marks at 17.25 cm per 100 L', () => {
    expect(bellArea(PLANT_1000)).toBeCloseTo(0.58, 2);
    expect(PLANT_1000.bellTravel).toBe(0.69);
    within(markSpacing(PLANT_1000), 0.1725, 0.005);
  });
  it('K6 levels: funnel 1.18 m; the feed riser stands at the ring’s level, not above it: the gas pushes the surface inside the bell DOWN', () => {
    expect(FITTINGS.funnelTop).toBe(1.18);
    expect(FITTINGS.feedPipeReach).toBe(0.51);
    // the research's check read 1.06 against 1.04 as the gas lifting the riser; both surfaces are open to the air, so they stand level. Fig. 7 draws them level, on two bases
    expect(innerDepression(200) * 100).toBeCloseTo(2.04, 2);
    expect(FITTINGS.riserLevelDrawn - PLANT_1000.overflowLevel).toBeCloseTo(0.02, 6);
  });
  it('K7 pipework: 5 m of ½" hose at 269 L/h loses under 0.1 mbar, by the kit’s tube law and by Poiseuille', () => {
    const q = 269 / 3.6e6;
    const poiseuille = (128 * MODEL.gasViscosity * PLANT_1000.hoseLength * q) / (Math.PI * PLANT_1000.hoseBore ** 4);
    expect(hoseResistance(PLANT_1000) * 269).toBeCloseTo(poiseuille, 3);
    expect(poiseuille / 100).toBeCloseTo(0.076, 2);
    expect(FITTINGS.feedBore).toBeCloseTo(0.0762, 4);
    expect(FITTINGS.overflowBore).toBeCloseTo(0.0508, 4);
  });
  it('K8 footprint: about 2 m² and 2.5 m high. The model’s top at full travel stands 2.13 m above the floor, 2.28 m with a pallet', () => {
    const top = PLANT_1000.bellRestRim + PLANT_1000.bellHeight + PLANT_1000.bellTravel;
    expect(top).toBeCloseTo(2.13, 2);
    expect(top + 0.15).toBeLessThan(2.5);
  });
  it('K9 sun: 7.5 h of direct sun is an input, and the wrap that keeps heat in keeps it out', () => {
    expect(MODEL.directSunHours).toBe(7.5);
    const open = steady({}, 'plant-1000', 60);
    const shaded = steady({ sunHours: 0 }, 'plant-1000', 60);
    expect(open.T).toBeGreaterThan(shaded.T);
  });
  it('K10 and K11, cost and hours of installation: context, nothing in the model', () => {
    expect(true).toBe(true);
  });
  it('K12 the installer’s later size: 756 L of gas, a 5 cm gap, and a bell that can sink fully, so nothing stays trapped', () => {
    expect(usableVolume(PLANT_1500) * 1000).toBeCloseTo(756, 6);
    expect(trappedVolume(PLANT_1500)).toBeCloseTo(0, 6);
    expect(PLANT_1500.tankOuterDiameter - PLANT_1500.bellOuterDiameter).toBeCloseTo(0.05, 6);
    // and the plant's own, which cannot
    expect(PLANT_1000.bellHeight).toBeGreaterThan(PLANT_1000.overflowLevel);
    expect(trappedVolume(PLANT_1000) * 1000).toBeCloseTo(232, 0);
  });
});

describe('K13–K17, the feed and the start', () => {
  it('K13 2 kg + 18 L, 20 L/d, HRT 42.5 days', () => {
    expect(PLANT_1000.feedKg * (1 + PLANT_1000.waterPerKg)).toBe(20);
    expect(retentionDays(PLANT_1000, 20)).toBe(42.5);
    expect(FEED_HOURS).toEqual([8.5, 17]);
  });
  it('K14 substrates: TS 24 %, VS 94 %; TS 10 %, VS 88 %, so 0.451 and 0.176 kg VS a day, Table 20’s 0.451 and 0.180', () => {
    expect(LEFTOVERS.ts).toBe(0.24);
    expect(LEFTOVERS.vs).toBe(0.94);
    expect(PEELINGS.ts).toBe(0.1);
    expect(PEELINGS.vs).toBe(0.88);
    expect(2 * vsPerKg(LEFTOVERS)).toBeCloseTo(0.451, 3);
    expect(2 * vsPerKg(PEELINGS)).toBeCloseTo(0.176, 3);
  });
  it('K15 loading: 0.53 kg VS/m³·d on food, 0.21 on market waste; the abstract’s 91 % would give 0.514', () => {
    expect((2 * vsPerKg(LEFTOVERS)) / 0.85).toBeCloseTo(0.53, 2);
    expect((2 * vsPerKg(PEELINGS)) / 0.85).toBeCloseTo(0.207, 3);
    expect((2 * 0.24 * 0.91) / 0.85).toBeCloseTo(0.514, 3);
    expect(LOAD_LIMIT).toBe(2);
    expect((LOAD_LIMIT * 0.85) / vsPerKg(LEFTOVERS)).toBeCloseTo(7.5, 1);
  });
  it('K16 the start: 60 kg of dung at 23 % TS, ten days unfed, then the ramp: the model comes through with these estimates, and dies if the seed is too small', () => {
    expect(DUNG.ts).toBe(0.23);
    expect(60 * vsPerKg(DUNG)).toBeCloseTo(10.2, 1);
    expect(planOn(0).kg).toBe(0);
    expect(planOn(1).kg).toBeCloseTo(0.3, 6);
    expect(planOn(8).kg).toBe(2);
    expect(SEED_METHANOGENS).toBe(0.45);
    expect(Math.min(...thesis.rows.map((r) => r.pH))).toBeCloseTo(6.5, 0);
    expect(Math.min(...thesisRun({}, { seed: 0.2 }).rows.map((r) => r.pH))).toBeGreaterThan(6.3);
    const small = thesisRun({}, { seed: 0.15 });
    expect(Math.min(...small.rows.map((r) => r.pH))).toBeLessThan(4.5);
    expect(small.mean(19, 29).gasL).toBeLessThan(1);
  });
  it(
    'K17 conditions: pH about 6.5 retrieved; digester 27.8, 28.8, 30.9 °C by phase, the model 2 to 3 K warmer',
    () => {
      expect(food.pH).toBeCloseTo(6.53, 1);
      within(food.pH, 6.5, 0.02);
      const [a, b, c] = [thesis.mean(1, 23).T, thesis.mean(23, 57).T, thesis.mean(64, 106).T];
      expect(a).toBeCloseTo(30.6, 0);
      expect(b).toBeCloseTo(31.3, 0);
      expect(c).toBeCloseTo(32.5, 0);
      expect(a - 27.8).toBeLessThan(3.5);
      expect(b - 28.8).toBeLessThan(3);
      expect(c - 30.9).toBeLessThan(2);
      // the tank runs warmer than the air, the sign the research asked to check
      expect(thesis.mean(64, 106).T).toBeGreaterThan(26.1);
    },
    LONG,
  );
});

// ------------------------------------------------------------------------------------------------ what it gave

describe('K18–K29, what it gave', () => {
  it('K18 the brick’s difference exact (above); the level is the model’s: 2.14 mbar at mid-travel from a 5 mm wall, a reading of 2', () => {
    const mid = bellPressure(PLANT_1000, PLANT_1000.bellTravel / 2, 0);
    expect(mid / 100).toBeCloseTo(2.14, 2);
    within(mid, 200, 0.08);
    // the pressure is not one number: the bell's wall dips back into the slurry as it comes down
    expect(bellPressure(PLANT_1000, 0, 0) / 100).toBeCloseTo(1.32, 2);
    expect(bellPressure(PLANT_1000, PLANT_1000.bellTravel, 0) / 100).toBeCloseTo(2.96, 2);
    expect(bellPressure(PLANT_1000, 0.345, HALF_BRICK) - bellPressure(PLANT_1000, 0.345, 0)).toBeCloseTo(202.7, 1);
    expect(bellMass(PLANT_1000)).toBeCloseTo(20.5, 1);
    expect(effectiveWeight(PLANT_1000, 0.345, 0)).toBeCloseTo(12.7, 1);
    expect(wallSection(PLANT_1000) * 1000 * rimDepth(PLANT_1000, 0.345)).toBeCloseTo(7.8, 1);
    // a wall of 4 to 8 mm: 1.7 to 3.4 mbar at mid-travel
    const at = (wall: number): number => bellPressure({ ...PLANT_1000, bellWall: wall }, 0.345, 0) / 100;
    expect(at(0.004)).toBeCloseTo(1.71, 1);
    expect(at(0.008)).toBeCloseTo(3.42, 1);
  });
  it(
    'K19 gas caught: food 289 L/d (259 NL) measured, the model −4 % (−8 %) on the thesis’s own calendar',
    () => {
      expect(food.gasL).toBeCloseTo(278.3, 0);
      expect(food.gasNL).toBeCloseTo(239.5, 0);
      within(food.gasL, 289, 0.05);
      within(food.gasNL, 259, 0.09);
      expect(steadyFood.gasL).toBeCloseTo(279.4, 0);
    },
    LONG,
  );
  it(
    'K19 market waste: 126 L/d (113 NL) measured, NOT RETRIEVED: 64 L/d on the calendar, 76 L/d steady, and more than the feed’s measured COD could give',
    () => {
      expect(market.gasL).toBeCloseTo(64.2, 0);
      expect(steadyMarket.gasL).toBeCloseTo(76.3, 0);
      beyond(steadyMarket.gasL, 126, 0.3);
      // Table 20: 0.172 kg COD a day at 350 NL/kg is 60 NL CH₄/d at the very most, against the 75 NL CH₄/d caught
      expect(0.172 * NL_CH4_PER_KG_COD).toBeCloseTo(60.2, 1);
      expect(113 * 0.664).toBeCloseTo(75, 0);
      // only a plant that lost nothing at the rim comes near it, and then food is far over
      expect(steady({ shareCooked: 0, rimLoss: 0 }).gasL).toBeCloseTo(117, 0);
      expect(steady({ shareCooked: 100, rimLoss: 0 }).gasL).toBeCloseTo(386, 0);
    },
    LONG,
  );
  it('K19 the norm factor: S5’s 0.896 leaves the vapour in; a saturated gas at the model’s 31 °C is 0.86', () => {
    expect(HAND.normFactor).toBeCloseTo(0.896, 3);
    expect(normalPerDryLitre(31.7, ATMOSPHERE)).toBeCloseTo(0.896, 3);
    expect(normalPerWetLitre(30.9, ATMOSPHERE)).toBeCloseTo(0.857, 2);
    expect(food.gasNL / food.gasL).toBeCloseTo(0.86, 2);
  });
  it(
    'K20 methane: 56.8 % and 66.4 % measured, 57.8 % and 71.5 % on the calendar, 57.5 % and 68.7 % steady: the gap between them is the liquid’s CO₂',
    () => {
      expect(food.ch4Share * 100).toBeCloseTo(57.8, 0);
      expect(market.ch4Share * 100).toBeCloseTo(71.5, 0);
      expect(steadyFood.ch4Share * 100).toBeCloseTo(57.5, 0);
      expect(steadyMarket.ch4Share * 100).toBeCloseTo(68.7, 0);
      expect(Math.abs(food.ch4Share * 100 - 56.8)).toBeLessThan(2);
      expect(Math.abs(steadyMarket.ch4Share * 100 - 66.4)).toBeLessThan(3);
      // derived from K19 and K20 alone: at a 1:1 gas, the liquid would have taken the same CO₂ from both
      expect(259 * 0.568 - 259 * 0.432).toBeCloseTo(35.2, 0);
      expect(113 * 0.664 - 113 * 0.336).toBeCloseTo(37.1, 0);
      // the model's own sink, what was made less what left in bubbles: 39 and 31 NL/d, of which the ring 24.5 and 18
      const sink = (share: number): { sink: number; strip: number } => {
        const pl = new Plant(paramsOf('plant-1000', { shareCooked: share }));
        pl.runIn(300);
        let made = 0;
        let bubbled = 0;
        let strip = 0;
        for (let i = 0; i < 1440; i++) {
          pl.step(600);
          made += pl.flux.co2Made;
          bubbled += pl.flux.co2Bubble;
          strip += pl.flux.co2Strip;
        }
        return { sink: ((made - bubbled) * 22.414) / 10, strip: (strip * 22.414) / 10 };
      };
      expect(sink(100).sink).toBeCloseTo(39, 0);
      expect(sink(100).strip).toBeCloseTo(24.5, 0);
      expect(sink(0).sink).toBeCloseTo(31.2, 0);
      expect(sink(0).strip).toBeCloseTo(18.1, 0);
      // and with no open surface, the difference between the two falls away
      const sealedFood = steady({ shareCooked: 100 }, 'plant-1000', 300, { model: { ringTransfer: 0 } }).ch4Share;
      const sealedMarket = steady({ shareCooked: 0 }, 'plant-1000', 300, { model: { ringTransfer: 0 } }).ch4Share;
      expect((sealedMarket - sealedFood) * 100).toBeCloseTo(3.9, 0);
      expect((steadyMarket.ch4Share - steadyFood.ch4Share) * 100).toBeCloseTo(11.2, 0);
    },
    LONG,
  );
  it(
    'K21 yields: 144 L/kg wet and 640 L/kg VS on food, the model 140 and 619; 63 and 700 on market waste, the model 38 and 434, under Buswell',
    () => {
      expect(steadyFood.gasL / 2).toBeCloseTo(139.7, 0);
      expect(steadyFood.gasL / (2 * vsPerKg(LEFTOVERS))).toBeCloseTo(619, -1);
      within(steadyFood.gasL / 2, 144, 0.04);
      expect(steadyMarket.gasL / 2).toBeCloseTo(38.2, 0);
      expect(steadyMarket.gasL / (2 * vsPerKg(PEELINGS))).toBeCloseTo(434, -1);
      // S5's market-waste 417 NL CH₄/kg VS is above the ceiling of any carbohydrate (415); the model stays below its own ceiling
      expect(628 * 0.664).toBeCloseTo(417, 0);
      expect(buswell(CARBOHYDRATE).ch4).toBeLessThan(417);
      expect(PEELINGS.potential).toBeLessThan(ceilingOf(PEELINGS).ch4);
      expect(LEFTOVERS.potential).toBeLessThan(ceilingOf(LEFTOVERS).ch4);
    },
    LONG,
  );
  it(
    'K22 burn time at 2 mbar is the input, 22.3 min; the model’s bell at mid-travel takes 23 min',
    () => {
      expect(burnerLaw(269, 200, 0.5, 200)).toBe(269);
      const t = burnTest(100, {}, 0.5);
      expect(t.minutes).toBeCloseTo(23.2, 0);
      within(t.minutes, 22.3, 0.06);
    },
    LONG,
  );
  it(
    'K22 with the brick: 12.1 min measured, NOT RETRIEVED by an orifice, 16.2 min. Conflict 8: 1.84 times the flow against 1.41',
    () => {
      const t = burnTest(100, { addedWeight: HALF_BRICK }, 0.5);
      expect(t.minutes).toBeCloseTo(16.2, 0);
      beyond(t.minutes, 12.1, 0.25);
      const n = Math.log(HAND.lphAt4mbar / HAND.lphAt2mbar) / Math.log(2);
      expect(n).toBeCloseTo(0.882, 3);
      expect(burnerLaw(269, 200, 0.5, 400) / 269).toBeCloseTo(Math.SQRT2, 6);
      // an orifice gives 1.84 only if the pressure acting on it goes from 0.85 to 2.88 mbar
      const p1 = 2.03 / (1.844 * 1.844 - 1);
      expect(p1).toBeCloseTo(0.85, 2);
      // the fitted exponent prints the source, by construction: that is a fit, not a finding
      const fitted = burnTest(100, { addedWeight: HALF_BRICK, burnerExponent: n }, 0.5);
      expect(fitted.minutes).toBeCloseTo(12.7, 0);
    },
    LONG,
  );
  it(
    'K23 the mixed day: about 200 L, 61 %, 45 min; the model 176 L, 60.5 %, 39 min',
    () => {
      expect(steadyMix.gasL).toBeCloseTo(176.1, 0);
      expect(steadyMix.ch4Share * 100).toBeCloseTo(60.5, 0);
      expect(minutesOn(steadyMix.gasL, 269)).toBeCloseTo(39.3, 0);
      within(steadyMix.gasL, 200, 0.13);
    },
    LONG,
  );
  it(
    'K24 what comes out at the flame in the model: 1.4 kW at the bell’s mid-travel, on gas at the model’s share',
    () => {
      const p = paramsOf('plant-1000', { shareCooked: 100, burner: 'on' });
      const pl = new Plant(p);
      pl.runIn(150);
      pl.setBellFill(0.5);
      pl.light();
      pl.step(60);
      expect(pl.flamePower / 1000).toBeCloseTo(1.32, 1);
      within(pl.flamePower, 1480, 0.11);
    },
    LONG,
  );
  it(
    'K25 at 5 kg/d: 670 L/d and 150 min measured, the model 710 L/d steady and 575 L/d after the thesis’s short climb; pH 6.2 measured, NOT RETRIEVED: 6.57',
    () => {
      expect(steadyFive.gasL).toBeCloseTo(710, -1);
      within(steadyFive.gasL, 670, 0.07);
      expect(fiveFood.gasL).toBeCloseTo(575, -1);
      within(fiveFood.gasL, 670, 0.15);
      expect(fiveFood.pH).toBeCloseTo(6.57, 1);
      expect(fiveFood.pH - 6.2).toBeGreaterThan(0.3);
      expect(sours({ fixedT: 31 }, 5)).toBe(false);
    },
    LONG,
  );
  it(
    'K26 a three-day break between the market waste and the food: 70 NL/d measured, 63 NL/d in the model',
    () => {
      expect(thesis.at(79).gasNL).toBeCloseTo(62.6, 0);
      within(thesis.at(79).gasNL, 70, 0.11);
      // over the estimates of the fast rate
      expect(thesisRun({ kFast: 0.19 }).at(79).gasNL).toBeCloseTo(72.4, 0);
      expect(thesisRun({ kFast: 0.65 }).at(79).gasNL).toBeCloseTo(54.1, 0);
    },
    LONG,
  );
  it(
    'K27 removal on food: VS 92.2 %, TS 84.9 %, COD 83.1 %; the model 91 %, 84 %, 90 %',
    () => {
      expect(steadyFood.vsRemoval * 100).toBeCloseTo(91.4, 0);
      expect(steadyFood.tsRemoval * 100).toBeCloseTo(84.3, 0);
      expect(steadyFood.codRemoval * 100).toBeCloseTo(90, 0);
      expect(Math.abs(steadyFood.vsRemoval * 100 - 92.2)).toBeLessThan(2);
      expect(Math.abs(steadyFood.tsRemoval * 100 - 84.9)).toBeLessThan(2);
      expect(steadyFood.codRemoval * 100 - 83.1).toBeLessThan(8);
    },
    LONG,
  );
  it(
    'K27 removal on market waste: VS 85.3 %, TS 72.8 %, COD 83.9 %; the model 83 %, 70 %, 80 %',
    () => {
      expect(steadyMarket.vsRemoval * 100).toBeCloseTo(83.3, 0);
      expect(steadyMarket.tsRemoval * 100).toBeCloseTo(70.1, 0);
      expect(steadyMarket.codRemoval * 100).toBeCloseTo(79.8, 0);
    },
    LONG,
  );
  it('K28 effluent nutrients are context; the 74 mg/L of NH₄-N, 5.3 meq/L, is only part of the 22.6 meq/L the titration reads', () => {
    expect(74.1 / 14.007).toBeCloseTo(5.29, 2);
    expect(((FEED_CHARGE * 2 + 18 * MODEL.waterCharge) / 20) * 1000).toBeCloseTo(22.6, 6);
  });
  it(
    'K29 layers: about 9.0 kg of VS in the tank on 26.11, the model 10.1 kg; solids’ retention 300 d from S5’s own ratio of 7.2',
    () => {
      expect(thesis.at(107).stockVS).toBeCloseTo(10.1, 0);
      within(thesis.at(107).stockVS, 9.02, 0.13);
      expect(10.61 / 1.47).toBeCloseTo(7.2, 1);
      expect(PLANT_1000.solidsRetention).toBeCloseTo(7.06, 2);
      expect(STOCK_VS_SHARE).toBeCloseTo(0.736, 3);
      expect(SCUM_SHARE).toBeCloseTo(0.571, 3);
      expect(SLUDGE_SHARE).toBeCloseTo(0.308, 3);
    },
    LONG,
  );
});

describe('S5’s Table 18 and Figure 16, read for this role', () => {
  it('the alkalinity is an input from days 103-105, 22.6 meq/L; in the model it stays 21–24, measured 16–18 under load', () => {
    expect(thesis.at(103).chargeMeq).toBeCloseTo(23.6, 0);
    expect(thesis.at(94).chargeMeq).toBeCloseTo(23.5, 0);
    expect(thesis.at(94).chargeMeq - 845 / 50).toBeGreaterThan(5);
  });
  it('the acids under load: 124–195 mg/L measured at 5 kg/d, the model 100–106', () => {
    expect(thesis.at(94).acidsGL * 1000).toBeCloseTo(100, -1);
    expect(thesis.at(96).acidsGL * 1000).toBeCloseTo(106, -1);
  });
  it('pH at 3 to 5 kg/d: 6.15–6.35 measured, the model 6.57–6.59: about 0.3 high, the one systematic miss of the buffer', () => {
    for (const d of [86, 90, 94, 96]) {
      expect(thesis.at(d).pH).toBeGreaterThan(6.5);
      expect(thesis.at(d).pH).toBeLessThan(6.65);
    }
  });
  it('at zero feed the pH rises, as measured: 6.43 and 6.77 on days 98 and 100, the model 6.59 and 6.61', () => {
    expect(thesis.at(98).pH).toBeCloseTo(6.59, 1);
    expect(thesis.at(100).pH).toBeGreaterThan(thesis.at(96).pH);
  });
  it('phase 1: an unmixed plant measured 6.2 at the top and 4.5–6.8 at the bottom; one node cannot say that, and reads 6.5', () => {
    expect(thesis.mean(8, 22).pH).toBeCloseTo(6.53, 1);
  });
});

// ------------------------------------------------------------------------------------------------ the field

describe('K30–K35, the field and the larger plants', () => {
  it('K30 12 plants, 4 running, 10 after repairs: context, nothing in the model says why a tap breaks', () => {
    expect(4 / 12).toBeCloseTo(0.33, 2);
  });
  it(
    'K31 a stopped plant at pH 4.15: a soured model tank passes it and goes lower',
    () => {
      const r = rescueRun(12, 4.15, 0, 120);
      expect(r.soured).toBe(true);
      expect(r.lowestPH).toBeLessThan(4.15);
      expect(r.finalPH).toBeLessThan(4.15);
      expect(r.dayStopped).toBeLessThan(40);
    },
    LONG,
  );
  it('K32 H₂S above 100 ppm on nearly every plant: unknown, and the state says so', () => {
    const pl = new Plant(paramsOf('plant-1000'));
    expect(pl.chain).toBeDefined();
    // the model carries no sulphur at all; the engine's state holds null with the tag 'unknown' (engine.test.ts)
    expect(Object.keys(LEFTOVERS)).not.toContain('sulphur');
  });
  it('K33 the rim, about 17.5 %: an input of the larger plant, and the arithmetic of 426 against 516', () => {
    expect(SCHOOL_4000.rimLoss).toBe(0.175);
    expect(1 - 426 / 516).toBeCloseTo(0.174, 3);
    expect(openShare(SCHOOL_4000)).toBeLessThan(0.175);
  });
  it(
    'K34 flame out with gas left, 500 L of 2,300 L: the model finds pressure enough, as S7 says: 777 L on ½" hose, 520 L on ¾"',
    () => {
      const half = flameOutRun('school-4000', 1);
      const threeQuarter = flameOutRun('school-4000', 1, {}, { machine: { hoseBore: 0.019 } });
      expect(half.cause).toBe('pressure');
      expect(half.leftL).toBeCloseTo(777, -1);
      expect(threeQuarter.leftL).toBeCloseTo(520, -1);
      within(threeQuarter.leftL, 500, 0.05);
      beyond(half.leftL, 500, 0.5);
      expect(half.lastMbar).toBeCloseTo(1.34, 1);
      // no tilt in it. And the mean pressure over the usable range against S7's 2.25 mbar
      const mid = (500 + 2300) / 2 / 1000 / bellArea(SCHOOL_4000);
      expect(bellPressure(SCHOOL_4000, mid, 0) / 100).toBeCloseTo(2.04, 1);
      within(bellPressure(SCHOOL_4000, mid, 0), 225, 0.12);
      // over the flame's limit, an estimate: the whole range of answers
      expect(flameOutRun('school-4000', 1, {}, { model: { flameMinPressure: 50 } }).leftL).toBeCloseTo(211, -1);
      expect(flameOutRun('school-4000', 1, {}, { model: { flameMinPressure: 150 } }).leftL).toBeCloseTo(1323, -1);
    },
    LONG,
  );
  it(
    'K34 on the lab’s own plant the flame ends with the bell at rest, about 232 L left',
    () => {
      const r = flameOutRun('plant-1000', 1);
      expect(r.cause).toBe('resting');
      expect(r.leftL).toBeCloseTo(232, 0);
      expect(r.leftUsableL).toBeLessThan(1);
      expect(r.burntL).toBeGreaterThan(400);
    },
    LONG,
  );
  it(
    'K35 the school’s yield: 98 L/kg wet, 426 L/kg VS, 55–58 % measured; NOT RETRIEVED, the model 140 L/kg and 580 L/kg VS, near S5’s: the two plants differ by half',
    () => {
      const m = steady({ shareCooked: 100 }, 'school-4000');
      expect(m.gasL / 8).toBeCloseTo(140, -1);
      expect(m.gasL / (8 * vsPerKg(CANTEEN))).toBeCloseTo(580, -1);
      beyond(m.gasL / 8, 98, 0.3);
      expect(m.ch4Share * 100).toBeCloseTo(63.7, 0);
      // the two theses, on nearly the same waste, against each other
      expect(640 / 426).toBeCloseTo(1.5, 1);
      // and S7's own carbon: half of what left the tank is not in its gas
      expect(868 / 1751).toBeCloseTo(0.496, 2);
    },
    LONG,
  );
});

// ------------------------------------------------------------------------------------------------ the designer's claims and the general rules

describe('K36–K46, the claims and the rules', () => {
  it(
    'K36 1 kg of dry matter → about 0.25 kg CH₄: the model makes 0.27, catches 0.21; two kilos wet give 98 g caught',
    () => {
      const madeKgPerKgTS = LEFTOVERS.potential * LEFTOVERS.vs * CH4_KG_PER_NL;
      expect(madeKgPerKgTS).toBeCloseTo(0.266, 3);
      expect(madeKgPerKgTS * 0.78).toBeCloseTo(0.208, 3);
      expect(steadyFood.ch4G).toBeCloseTo(98.2, 0);
      within(steadyFood.ch4G, 105, 0.07);
      expect(500 / steadyFood.ch4G).toBeCloseTo(5.1, 1);
    },
    LONG,
  );
  it(
    'K37 « a day or two »: half of one meal’s gas in about 2 days in the model, 90 % in 12; peelings 5 and 27',
    () => {
      const food2 = mealResponse();
      const peel = mealResponse({ shareCooked: 0 });
      expect(food2.half).toBeCloseTo(2.0, 0);
      expect(food2.ninety).toBeCloseTo(12.1, 0);
      expect(peel.half).toBeCloseTo(5.1, 0);
      expect(peel.ninety).toBeCloseTo(27.3, 0);
    },
    LONG,
  );
  it(
    'K38 « anything above 30 °C »: the model has no edge there, only a slope: steady gas 99 % at 25 °C, 94 % at 15 °C',
    () => {
      const rows = coldSweep([15, 25, 35]);
      expect(rows[0]!.share).toBeCloseTo(0.94, 1);
      expect(rows[1]!.share).toBeCloseTo(0.99, 1);
      expect(rows[2]!.share).toBeCloseTo(1.01, 1);
    },
    LONG,
  );
  it(
    'K39 the saving: 3.5 kWh/d needed, about what the model’s 5 kg/d gives: 3.34 kWh/d',
    () => {
      expect(steadyFive.kWh).toBeCloseTo(3.33, 1);
      within(steadyFive.kWh, 3.5, 0.06);
    },
    LONG,
  );
  it('K40 how many were built: context', () => {
    expect(700).toBeLessThan(2000);
  });
  it(
    'K41 10 kg wet → 1 m³ → about 6 kWh: arithmetic at 60 %; the model’s food gives 140 L/kg and 4.9 kWh/m³ caught',
    () => {
      expect((1000 * 0.6 * CH4_WH_PER_NL) / 1000).toBeCloseTo(5.98, 2);
      expect((steadyFood.kWh / steadyFood.gasL) * 1000).toBeCloseTo(4.9, 0);
    },
    LONG,
  );
  it('K42 the average stove: 400 L/h and 55 %: an input; 400 L/h is within the burner’s range', () => {
    expect(MODEL.burnerEfficiency).toBe(0.55);
    expect(RANGES.burnerLph.max).toBeGreaterThanOrEqual(400);
    expect(RANGES.burnerLph.min).toBeLessThanOrEqual(269);
  });
  it(
    'K43 composition: vapour 2 % at 20 °C and 7 % at 40 °C, by saturation; 55–70 % CH₄ brackets the model’s plants',
    () => {
      expect((waterVapourPressure(20) / ATMOSPHERE) * 100).toBeCloseTo(2.3, 1);
      expect((waterVapourPressure(40) / ATMOSPHERE) * 100).toBeCloseTo(7.3, 1);
      expect(steadyFood.ch4Share).toBeGreaterThan(0.55);
      expect(steadyMarket.ch4Share).toBeLessThan(0.7);
    },
    LONG,
  );
  it(
    'K44 below a mean 15 °C « does not work satisfactorily »: found, within what Ea allows. On 2 kg/d the tank sours held at 12 °C, not at 14 °C; 10 and 8 °C at Ea 40, 16 and 18 °C at Ea 80',
    () => {
      const at60 = coldSweep([12, 14]);
      expect(at60[0]!.pH).toBeLessThan(5);
      expect(at60[1]!.pH).toBeGreaterThan(6);
      const at40 = coldSweep([8, 10], { Ea: 40000 });
      expect(at40[0]!.pH).toBeLessThan(5);
      expect(at40[1]!.pH).toBeGreaterThan(6);
      const at80 = coldSweep([16, 18], { Ea: 80000 });
      expect(at80[0]!.pH).toBeLessThan(5);
      expect(at80[1]!.pH).toBeGreaterThan(6);
    },
    LONG,
  );
  it(
    'K45 potential: 396 NL CH₄/kg VS is an input; S5’s 326 caught is 82 % of it, the model catches 304',
    () => {
      expect(LEFTOVERS.potential).toBe(396);
      expect(CANTEEN.potential).toBe(396);
      expect(degradableShare(LEFTOVERS)).toBeCloseTo(0.894, 2);
      expect(574 * 0.568).toBeCloseTo(326, 0);
      expect(steadyFood.ch4NL / (2 * vsPerKg(LEFTOVERS))).toBeCloseTo(304, -1);
    },
    LONG,
  );
  it('K46 germs: a text, not a figure of the model: nothing here says anything of what survives', () => {
    expect(ashPerKg(LEFTOVERS)).toBeCloseTo(0.0144, 4);
  });
});

// ------------------------------------------------------------------------------------------------ the climate

describe('K47, the climate', () => {
  it('K47 the four sites’ means, as the research printed them', () => {
    expect(yearMean(SITES['dar-es-salaam'].air)).toBeCloseTo(26.3, 0);
    expect(yearMean(SITES.pune.air)).toBeCloseTo(24.5, 0);
    expect(yearMean(SITES.marseille.air)).toBeCloseTo(16.4, 0);
    expect(yearMean(SITES.geneva.air)).toBeCloseTo(10.9, 0);
    expect(SITES.geneva.air[0]).toBe(1.7);
    expect(SITES['dar-es-salaam'].air[0]).toBe(28);
  });
  it('K47 a month is read at its middle, and the monthly table closes on the year', () => {
    for (const site of SITE_IDS) {
      for (let m = 1; m <= 12; m++)
        expect(monthlyAt(SITES[site].air, midMonth(m))).toBeCloseTo(SITES[site].air[m - 1]!, 6);
    }
  });
  it('the sun: the day’s shape integrates to the month’s kWh', () => {
    for (const site of SITE_IDS) {
      const s = newDaySun();
      const daily = sunDaily(SITES[site]);
      for (const month of [1, 7]) {
        s.day = -1;
        readDaySun(s, SITES[site], daily, midMonth(month));
        let sum = 0;
        for (let h = 0; h < 24; h += 0.05) sum += horizontalSun(s, h) * 0.05;
        expect(sum / 1000).toBeCloseTo(s.daily, 1);
      }
    }
    expect(MONTH_DAYS.reduce((a, b) => a + b, 0)).toBe(365);
  });
});

// ------------------------------------------------------------------------------------------------ what the research asked the model to find

describe('what the model finds with no target', () => {
  it(
    'the load a plant bears at a temperature, if the jump is sudden: 10 kg/d at 32 °C, 7 at 25, 4.9 at 20, 3.4 at 15',
    () => {
      expect(souringFeed(32)).toBeCloseTo(10.2, 0);
      expect(souringFeed(25)).toBeCloseTo(7, 0);
      expect(souringFeed(20)).toBeCloseTo(4.9, 0);
      expect(souringFeed(15)).toBeCloseTo(3.4, 0);
      // « feed more, get less », with no target anywhere: 10 kg/d holds, 11 kg/d kills
      const p = paramsOf('plant-1000', { shareCooked: 100 });
      const pl = new Plant(p);
      pl.runIn(150);
      p.feedKg = 12;
      const days: number[] = [];
      for (let d = 0; d < 6; d++) days.push(measure(pl, 1).gasL);
      expect(days[2]! / steadyFood.gasL).toBeGreaterThan(3);
      expect(days[4]).toBeLessThan(40);
      expect(days[5]).toBeLessThan(1);
    },
    LONG,
  );
  it(
    'the point of no return is nearly silent: stopped at pH 6.4 the tank survives, at 6.35 it does not',
    () => {
      const before = rescueRun(12, 6.4);
      expect(before.soured).toBe(false);
      expect(before.recoveredDay).toBeLessThan(10);
      const after = rescueRun(12, 6.35);
      expect(after.soured).toBe(true);
      expect(after.recoveredDay).toBe(Infinity);
      expect(after.finalPH).toBeLessThan(4.5);
      // the acids against the buffer warn most of a day before the pH reaches 6
      const p = paramsOf('plant-1000', { shareCooked: 100 });
      const pl = new Plant(p);
      pl.runIn(150);
      p.feedKg = 12;
      let ratioAt = -1;
      let pHAt = -1;
      for (let h = 0; h < 24 * 12; h++) {
        pl.step(3600);
        const acetic = (pl.chain.acid / pl.chain.volume) * (60 / 64) * 1000;
        const buffer = ((pl.chain.charge / (pl.chain.volume * 1000)) * 1000 - pl.acidsMolar() * 1000) * 50;
        if (ratioAt < 0 && acetic / buffer > 0.3) ratioAt = h / 24;
        if (pHAt < 0 && pl.flux.pH < 6) pHAt = h / 24;
      }
      expect(pHAt - ratioAt).toBeGreaterThan(0.5);
      expect(pHAt - ratioAt).toBeLessThan(1.2);
    },
    LONG,
  );
  it(
    'rescue: nothing by itself, about two months on 100 L of water a day, four on 50',
    () => {
      expect(rescueRun(12, 5).recoveredDay).toBe(Infinity);
      expect(rescueRun(12, 5, 100).recoveredDay).toBeCloseTo(61.5, 0);
      expect(rescueRun(12, 5, 50).recoveredDay).toBeCloseTo(117.5, 0);
      // base, an upper bound on speed: 100 eq is not enough at pH 4.2, 200 eq acts in about three days. About 7 kg of slaked lime at 37 g/eq
      expect(rescueRun(12, 4.2, 0, 400, {}, 100).recoveredDay).toBe(Infinity);
      const dosed = rescueRun(12, 4.2, 0, 400, {}, 200);
      expect(dosed.recoveredDay - dosed.dayStopped).toBeCloseTo(3.2, 0);
      expect(200 * 0.037).toBeCloseTo(7.4, 1);
    },
    LONG,
  );
  it(
    'a Geneva winter: bare on 2 kg/d the tank sours in November at about 7 °C and stays soured the next June',
    () => {
      const rows = firstWinter('geneva');
      const nov = rows.find((r) => r.month === 11)!;
      const jun = rows.find((r) => r.month === 6)!;
      expect(nov.T).toBeCloseTo(7.2, 0);
      expect(nov.pH).toBeLessThan(5.5);
      expect(jun.gasL).toBeLessThan(1);
      expect(jun.T).toBeGreaterThan(25);
      // history moves the date: this plant was started warm in July; the live scenario's has lived since April, and goes in early December (texts.test.ts)
    },
    LONG,
  );
  it(
    'the same winter unfed from November to March: it comes back by itself in April',
    () => {
      const rows = firstWinter('geneva', {}, [11, 12, 1, 2, 3]);
      const apr = rows.find((r) => r.month === 4)!;
      const may = rows.find((r) => r.month === 5)!;
      expect(apr.gasL).toBeCloseTo(161, -1);
      expect(may.gasL).toBeCloseTo(254, -1);
      expect(Math.min(...rows.map((r) => r.pH))).toBeGreaterThan(6.3);
    },
    LONG,
  );
  it(
    'the same winter on half the food holds all year, on 70 L/d at its worst',
    () => {
      const rows = firstWinter('geneva', { feedKg: 1 });
      expect(Math.min(...rows.map((r) => r.pH))).toBeGreaterThan(6.3);
      expect(Math.min(...rows.map((r) => r.gasL))).toBeCloseTo(69, -1);
    },
    LONG,
  );
  it(
    'IT ALL RESTS ON Ea: the winter on full food is held up to 43 kJ/mol and lost from 44, exactly where the only clue stands (S36, about 44); at 80 it is lost by November',
    () => {
      const lowest = (Ea: number): number => Math.min(...firstWinter('geneva', { Ea }).map((r) => r.pH));
      expect(lowest(40000)).toBeGreaterThan(6.3);
      expect(lowest(43000)).toBeGreaterThan(6.3);
      expect(lowest(44000)).toBeLessThan(5);
      const at44 = firstWinter('geneva', { Ea: 44000 });
      expect(at44.find((r) => r.month === 12)!.gasL).toBeCloseTo(153, -1);
      expect(at44.find((r) => r.month === 1)!.gasL).toBeLessThan(1);
      const at80 = firstWinter('geneva', { Ea: 80000 });
      expect(at80.find((r) => r.month === 11)!.gasL).toBeLessThan(1);
    },
    LONG,
  );
  it(
    'straw alone does not save it: wrapped, unheated, it sours a month later',
    () => {
      const rows = firstWinter('geneva', { wallU: MODEL.wallStraw });
      expect(rows.find((r) => r.month === 11)!.pH).toBeGreaterThan(5.5);
      expect(rows.find((r) => r.month === 12)!.pH).toBeLessThan(5.5);
    },
    LONG,
  );
  it(
    'Marseille holds, on two thirds of its summer in winter: 196 L/d in November, 295 L/d in June',
    () => {
      const rows = siteYear('marseille');
      expect(rows.find((r) => r.month === 11)!.gasL).toBeCloseTo(196, -1);
      expect(rows.find((r) => r.month === 6)!.gasL).toBeCloseTo(295, -1);
      expect(Math.min(...rows.map((r) => r.pH))).toBeGreaterThan(6.3);
    },
    LONG,
  );
  it(
    'can the gas pay for its heat? At Geneva in January, in straw at 30 °C: 1.74 kWh/d asked, 1.37 kWh/d in the gas',
    () => {
      const b = heatBudget('geneva', 1, MODEL.wallStraw, 30);
      expect(b.needKWh).toBeCloseTo(1.74, 1);
      expect(b.heaterW).toBeCloseTo(72.5, -1);
      expect(b.needKWh).toBeGreaterThan(steadyFood.kWh);
      expect(heatBudget('geneva', 1, MODEL.wallBare, 30).needKWh).toBeCloseTo(22.3, 0);
      // in the research's 10 °C month, straw: about 1.3 kWh/d, as by hand
      const april = heatBudget('geneva', 4, MODEL.wallStraw, 30);
      expect(april.feedKWh + april.wallKWh).toBeCloseTo(1.3, 0);
      // month by month in straw, against the gas through a 55 % burner, 0.75 kWh/d, and against all of it, 1.37
      const need = (site: 'geneva' | 'marseille', wall: number): number[] =>
        Array.from({ length: 12 }, (_, i) => heatBudget(site, i + 1, wall, 30).needKWh);
      const useful = steadyFood.kWh * MODEL.burnerEfficiency;
      expect(useful).toBeCloseTo(0.75, 1);
      expect(need('geneva', MODEL.wallStraw).flatMap((v, i) => (v <= useful ? [i + 1] : []))).toEqual([6, 7, 8, 9]);
      expect(need('geneva', MODEL.wallStraw).flatMap((v, i) => (v > steadyFood.kWh + 0.01 ? [i + 1] : []))).toEqual([
        1, 2, 11, 12,
      ]);
      expect(Math.min(...need('geneva', MODEL.wallBare))).toBeCloseTo(2.8, 0);
      expect(need('marseille', MODEL.wallStraw).flatMap((v, i) => (v <= useful ? [i + 1] : []))).toEqual([
        5, 6, 7, 8, 9, 10,
      ]);
    },
    LONG,
  );
  it(
    'the drum at 38 °C holds at five times this plant’s load, on 93 L/d, and asks three times its gas in heat',
    () => {
      const m = steady({ shareCooked: 50, site: 'geneva', month: 1, wallU: 1, heaterW: 60, setPointT: 38 }, 'drum-60');
      expect(m.gasL).toBeCloseTo(93, 0);
      expect(m.pH).toBeCloseTo(7.15, 1);
      expect(m.heaterKWh / m.kWh).toBeCloseTo(2.9, 0);
      expect(DRUM_60.liquidVolume).toBe(0.06);
      expect(PLANT_1100.overflowLevel).toBe(0.88);
    },
    LONG,
  );
  it('the gas line: a plug at the low point holds the pressure of its own height. 2 mbar is 2 cm of water', () => {
    expect(plugPressure(200, PLANT_1000.hoseBore, 2) / 100).toBeCloseTo(1.55, 1);
    expect(lineFlow(0, 0.03, 269, 200, 0.5)).toBe(0);
    expect(lineFlow(200, 0, 269, 200, 0.5)).toBeCloseTo(269, 3);
    expect(lineFlow(200, 0.03, 269, 200, 0.5)).toBeLessThan(269);
  });
});

describe('sanity of the balance', () => {
  it(
    'never over Buswell: the gas of a year stays under the ceiling of what went in',
    () => {
      const p = paramsOf('plant-1000', { shareCooked: 100 });
      const pl = new Plant(p);
      pl.runIn(150);
      const m = measure(pl, 100);
      expect(m.ch4NL * 100).toBeLessThan(m.feedKg * vsPerKg(LEFTOVERS) * 100 * ceilingOf(LEFTOVERS).ch4);
      expect(Math.abs(arrhenius(30, 60000) - 1)).toBe(0);
    },
    LONG,
  );
  it(
    'the energy in the gas stays under what a kilo of solids holds: 1.37 kWh against about 2.7 kWh',
    () => {
      expect((0.482 * 20) / 3.6).toBeCloseTo(2.68, 2);
      expect(steadyFood.kWh).toBeLessThan((0.482 * 20) / 3.6);
    },
    LONG,
  );
});
