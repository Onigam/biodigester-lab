import { describe, expect, it } from 'vitest';
import { arrhenius } from '../sim/bio';
import { BiodigesterSim } from '../sim/engine';
import { bellArea, bellMass, bellPressure, DRUM_60, MODEL, PLANT_1000, weightPressure } from '../sim/machine';
import {
  carriedFeed,
  firstWinter,
  flameOutRun,
  heatBudget,
  HAND,
  mealResponse,
  methaneGrams,
  minutesOn,
  rescueRun,
  rimBreakEven,
  rimClimate,
  siteYear,
  souringFeed,
  steady,
  thesisRun,
  twoKiloMethane,
} from '../sim/runs';
import { FIG, GENEVA_TABLE, HEAT_TABLE, type FigName } from './figures';

// Each figure the texts print against its source: the arithmetic redone, the model run. A failure here means a sheet says something the model no longer does. The simulation's own tests hold the pins; these hold the words.

const LONG = 240000;
const close = (name: FigName, value: number, tolerance?: number): void => {
  const f = FIG[name];
  const tol = tolerance ?? 0.5 * 10 ** -f.d + 1e-6;
  expect(Math.abs(f.v - value), `${name}: ${f.v} against ${value}`).toBeLessThanOrEqual(tol);
};

describe('the figures of the texts: arithmetic on reported figures', () => {
  it('the bell and the brick', () => {
    close('brickMbar', weightPressure(PLANT_1000, 12) / 100);
    close('flow2', HAND.lphAt2mbar);
    close('flow4', HAND.lphAt4mbar);
    close('flowRatio', HAND.lphAt4mbar / HAND.lphAt2mbar);
    close('powerIn', HAND.burnerKW);
    close('powerBrick', (HAND.lphAt4mbar * HAND.normFactor * 0.628 * 9.97) / 1000);
    close('powerUseful', HAND.burnerKW * MODEL.burnerEfficiency);
    close('weightFor2', (200 * bellArea(PLANT_1000)) / 9.81);
    close('dayRise', (289 / 100) * 17.25, 0.5);
    close('bellMinutes', minutesOn(400, HAND.lphAt2mbar));
    close('stepCm', 17.25 / 5);
  });
  it('the gas and its energy', () => {
    close('methaneWet', twoKiloMethane());
    close('methaneMarket', methaneGrams(113, 0.664));
    close('minPerKgFood', minutesOn(144, HAND.lphAt2mbar));
    close('minPerKgMarket', minutesOn(63, HAND.lphAt2mbar));
    close('minPerKgBook', minutesOn(100, 400));
    close('kwhFood', (259 * 0.568 * 9.97) / 1000, 0.01);
    close('kwhMarket', (113 * 0.664 * 9.97) / 1000);
    close('co2Food', 259 * (0.568 - 0.432));
    close('co2Market', 113 * (0.664 - 0.336));
    close('caughtMarket', 113 * 0.664);
    close('maxFromCod', 0.172 * 350);
    close('starchShare', (0.25 / 0.297) * 100);
    close('boilMinutes', (HAND.boilKWh / MODEL.burnerEfficiency / HAND.burnerKW) * 60, 0.5);
    close('lpgFeed', (2 * ((100 * 12.8) / 365)) / 1.47, 0.5);
  });
  it('the book’s limit, on this tank', () => {
    close('bookLimit', (2 * 0.85) / (0.24 * 0.94));
    close('bookLimitHigh', (2.5 * 0.85) / (0.24 * 0.94));
  });
  it('the leak against the bottled gas', () => {
    close('rimBreakEven', rimBreakEven() * 100);
    close('leakCo2', rimClimate(0.175), 2);
    close('lpgCo2', 42 * 3, 1);
  });
  it('the machine', () => {
    close('pressureRest', bellPressure(PLANT_1000, 0, 0) / 100);
    close('pressureFull', bellPressure(PLANT_1000, PLANT_1000.bellTravel, 0) / 100, 0.05);
    close('pressureMid', bellPressure(PLANT_1000, PLANT_1000.bellTravel / 2, 0) / 100);
    close('bellMass', bellMass(PLANT_1000));
    close('k15', arrhenius(15, 60000));
    close('k37', arrhenius(37, 60000));
    expect(DRUM_60.liquidVolume).toBe(0.06);
  });
});

describe('the figures of the texts: the model', () => {
  it(
    'the thesis’s calendar and the steady plant',
    () => {
      const t = thesisRun();
      const food = t.mean(19, 29);
      close('gasCalendar', food.gasL);
      close('ch4Calendar', food.ch4Share * 100, 0.06);
      const market = t.mean(46, 56);
      close('marketLow', market.gasL);
      close('ch4MarketCalendar', market.ch4Share * 100, 0.06);
      close('nlBreak', t.at(79).gasNL);
      close('stockVS', t.at(107).stockVS, 0.06);
      const f = steady({ shareCooked: 100 });
      const m = steady({ shareCooked: 0 });
      close('gasSteady', f.gasL);
      close('ch4Food', f.ch4Share * 100, 0.06);
      close('marketHigh', m.gasL);
      close('ch4Market', m.ch4Share * 100, 0.06);
      close('gasAbout', f.gasL, 2);
      close('methaneModel', methaneGrams(f.ch4NL, 1), 1);
      close('gasNoRim', steady({ shareCooked: 100, rimLoss: 0 }).gasL);
      close('retentionLow', steady({ shareCooked: 100, solidsRetention: 1 }).gasL);
      close('retentionHigh', steady({ shareCooked: 100, solidsRetention: 15 }).gasL);
      const mixed = steady({ shareCooked: 50 });
      close('mixLitres', mixed.gasL, 8);
    },
    LONG,
  );
  it(
    'a meal’s gas',
    () => {
      const cooked = mealResponse();
      close('mealHalf', cooked.half);
      close('mealNinety', cooked.ninety);
      const raw = mealResponse({ shareCooked: 0 });
      close('peelHalf', raw.half);
      close('peelNinety', raw.ninety);
    },
    LONG,
  );
  it(
    'overfeeding and rescue',
    () => {
      close('soursAt32', souringFeed(32), 0.5);
      close('jump32', souringFeed(32), 0.3);
      close('jump25', souringFeed(25), 0.5);
      close('jump20', souringFeed(20), 0.5);
      close('jump15', souringFeed(15), 0.5);
      const before = rescueRun(12, 6.4);
      expect(before.soured).toBe(false);
      expect(rescueRun(12, 6.35).soured).toBe(true);
      close('rescue100', rescueRun(12, 5, 100).recoveredDay / 30.4, 0.5);
      close('rescue50', rescueRun(12, 5, 50).recoveredDay / 30.4, 0.5);
    },
    LONG,
  );
  it(
    'what a slow ramp carries: the table of the sheet',
    () => {
      close('rampAt32', carriedFeed(32), 2);
      close('ramp25', carriedFeed(25), 0.6);
      close('ramp20', carriedFeed(20), 0.6);
      close('ramp15', carriedFeed(15), 0.6);
    },
    LONG,
  );
  it(
    'a year at Geneva, row by row, and the switch between 43 and 44 kJ/mol',
    () => {
      const order = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
      for (const r of GENEVA_TABLE) {
        const rows = firstWinter('geneva', r.patch, r.pause ?? []);
        order.forEach((month, i) => {
          const m = rows.find((x) => x.month === month)!;
          expect(Math.abs(m.gasL - r.rows[i]!), `${r.key} month ${month}: ${m.gasL} against ${r.rows[i]}`).toBeLessThan(
            0.6,
          );
        });
      }
      const lowest = (Ea: number): number => Math.min(...firstWinter('geneva', { Ea }).map((r) => r.pH));
      expect(lowest(FIG.eaHolds.v * 1000)).toBeGreaterThan(6.3);
      expect(lowest(FIG.eaFails.v * 1000)).toBeLessThan(5);
      // the same switch in the live scenario, one kJ higher: the hint beside the slider says so, or a visitor at 44 would see the words proved wrong
      const live = (kJ: number): number => {
        const sim = new BiodigesterSim();
        sim.applyScenario('geneva-january', { Ea: kJ * 1000 });
        let least = 14;
        while (sim.state.dayNumber < 230) {
          sim.step(0.25);
          least = Math.min(least, sim.state.pH);
        }
        return least;
      };
      expect(live(FIG.eaLiveHolds.v)).toBeGreaterThan(6.3);
      expect(live(FIG.eaLiveFails.v)).toBeLessThan(5);
      const half = firstWinter('geneva', { feedKg: 1 });
      close('halfFood', Math.min(...half.map((r) => r.gasL)), 1);
      const year = siteYear('marseille');
      close('marseilleLow', year.find((r) => r.month === 11)!.gasL, 1);
      close('marseilleHigh', year.find((r) => r.month === 6)!.gasL, 1);
    },
    LONG,
  );
  it(
    'the heat budget',
    () => {
      for (const r of HEAT_TABLE) {
        const b = heatBudget(r.site, r.month, r.straw ? MODEL.wallStraw : MODEL.wallBare, 30);
        expect(Math.abs(b.feedKWh - r.feed), r.en).toBeLessThan(0.006);
        expect(Math.abs(b.wallKWh - r.wall), r.en).toBeLessThan(0.06);
        expect(Math.abs(b.sunKWh - r.sun), r.en).toBeLessThan(0.06);
        expect(Math.abs(b.needKWh - r.need), r.en).toBeLessThan(0.06);
        expect(Math.abs(b.heaterW - r.watts), r.en).toBeLessThan(1.5);
      }
      close('heatStraw', heatBudget('geneva', 1, MODEL.wallStraw, 30).needKWh);
      close('heatBare', heatBudget('geneva', 1, MODEL.wallBare, 30).needKWh);
    },
    LONG,
  );
  it(
    'the drum, and the school’s flame',
    () => {
      const drum = steady(
        { shareCooked: 50, site: 'geneva', month: 1, wallU: 1, heaterW: 60, setPointT: 38 },
        'drum-60',
      );
      close('drumLitres', drum.gasL);
      close('drumPH', drum.pH, 0.06);
      expect(Math.round(drum.heaterKWh / drum.kWh)).toBe(3);
      const left = flameOutRun('school-4000', 1).leftL;
      expect(left).toBeGreaterThan(FIG.schoolLow.v - 5);
      expect(left).toBeLessThan(FIG.schoolHigh.v + 5);
    },
    LONG,
  );
});
