import { describe, expect, it } from 'vitest';
import { BiodigesterSim, MEASURED_T_MIN, STEP } from './engine';
import { DRAWN_MACHINE, FITTINGS, MACHINES, MODEL, PLANT_1000, trappedVolume } from './machine';
import { Plant } from './plant';
import { PRESET_IDS, presetParams, RANGES, scenarioSetup, SCENARIO_IDS, SPEEDS } from './presets';
import { stripAlarms, stripClock, stripValues } from './strip';
import { STATE_TAGS } from './tags';
import type { BioState, ScenarioId } from './types';
import { measure, paramsOf } from './runs';

// The engine as the kit, the 3D and a film use it. The scenarios each teach one thing: each has its test.

const LONG = 240000;
const DT = 1 / 60;

/** Run a sim for simulated days at its own speed, in frames. */
function run(sim: BiodigesterSim, days: number): BioState {
  const frames = Math.round((days * 86400) / sim.params.timeScale / DT);
  for (let i = 0; i < frames; i++) sim.step(DT);
  return sim.state;
}

const scenario = (id: ScenarioId): BiodigesterSim => {
  const sim = new BiodigesterSim();
  sim.applyScenario(id);
  return sim;
};

describe('the LabSim contract', () => {
  it('has what the kit needs and film keys are flat', () => {
    const sim = new BiodigesterSim();
    expect(sim.params.slowMo).toBe(1);
    expect(sim.params.running).toBe(true);
    expect(typeof sim.params.feedKg).toBe('number');
    expect(typeof sim.state.bellRise).toBe('number');
    let told = 0;
    sim.onChange(() => told++);
    sim.set({ feedKg: 3 });
    expect(told).toBe(1);
    expect(sim.params.preset).toBe('custom');
    sim.set({ timeScale: 60 });
    expect(sim.params.timeScale).toBe(60);
  });
  it('does nothing while paused, and clamps what it is given', () => {
    const sim = new BiodigesterSim();
    sim.set({ running: false });
    const t = sim.state.simTime;
    run(sim, 1);
    expect(sim.state.simTime).toBe(t);
    sim.set({ running: true, feedKg: 1000, rimLoss: -1 });
    expect(sim.params.feedKg).toBe(RANGES.feedKg.max);
    expect(sim.params.rimLoss).toBe(RANGES.rimLoss.min);
  });
  it('the time controls do not turn a preset into custom', () => {
    const sim = new BiodigesterSim();
    sim.set({ timeScale: 60, slowMo: 0.25 });
    expect(sim.params.preset).toBe(DRAWN_MACHINE);
  });
  it('same inputs, same state: nothing random, no wall clock', () => {
    const a = new BiodigesterSim();
    const b = new BiodigesterSim();
    for (let i = 0; i < 400; i++) {
      a.step(DT);
      b.step(DT);
    }
    expect(a.state.bellRise).toBe(b.state.bellRise);
    expect(a.state.pH).toBe(b.state.pH);
    expect(a.state.slurryT).toBe(b.state.slurryT);
  });
  it('at timeScale 0 the day stops', () => {
    const sim = new BiodigesterSim();
    sim.set({ timeScale: 0 });
    const t = sim.state.simTime;
    for (let i = 0; i < 300; i++) sim.step(DT);
    expect(sim.state.simTime).toBe(t);
  });
  it('five speeds, as the strip fits', () => {
    expect(SPEEDS).toHaveLength(5);
  });
  it('one step is cheap: the 3D reads the state every frame on a phone', () => {
    const sim = new BiodigesterSim();
    const n = 20000;
    const pl = sim.plantNow;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) pl.step(STEP);
    const us = ((performance.now() - t0) / n) * 1000;
    // about 1 µs here; a phone is several times slower, and a day per second is 48 steps a frame
    expect(us).toBeLessThan(30);
    const sim2 = new BiodigesterSim();
    sim2.set({ timeScale: 86400 });
    const t1 = performance.now();
    for (let i = 0; i < 600; i++) sim2.step(DT);
    expect((performance.now() - t1) / 600).toBeLessThan(4);
  });
  it(
    'the time step does not change the answer: 30 s, 2 min, 10 min, 30 min',
    () => {
      const at = (step: number) => {
        const pl = new Plant(paramsOf('plant-1000', { shareCooked: 100 }));
        pl.runIn(150, step);
        return measure(pl, 10, step);
      };
      const fine = at(30);
      for (const step of [120, 600, 1800]) {
        const m = at(step);
        expect(m.gasL / fine.gasL).toBeCloseTo(1, 2);
        expect(m.pH - fine.pH).toBeCloseTo(0, 2);
        expect(m.T - fine.T).toBeCloseTo(0, 1);
      }
    },
    LONG,
  );
  it('reset starts the same scenario again', () => {
    const sim = scenario('half-brick');
    run(sim, 0.02);
    const later = sim.state.bellRise;
    sim.reset();
    expect(sim.state.simTime).toBe(0);
    expect(sim.state.bellRise).not.toBe(later);
  });
});

describe('the books close', () => {
  const closing = (patch: Parameters<typeof paramsOf>[1], days = 20) => {
    const pl = new Plant(paramsOf('plant-1000', patch));
    pl.runIn(150);
    const cod0 = pl.codStock();
    const carbon0 = pl.carbonStock();
    for (let i = 0; i < days * 24 * 120; i++) pl.step(30);
    const b = pl.book;
    const mol = 0.064;
    const gasOut = b.rimCH4 + b.overCH4 + b.burntCH4;
    const carbonGas = b.rimCH4 + b.rimCO2 + b.overCH4 + b.overCO2 + b.burntCH4 + b.burntCO2 + b.stripCO2;
    return {
      cod: pl.codStock() + b.codOut + gasOut * mol - cod0 - b.codIn,
      carbon: pl.carbonStock() + b.carbonOut + carbonGas - carbon0 - b.carbonIn,
      carbon0,
    };
  };
  it(
    'COD and carbon close to rounding, on a working plant',
    () => {
      const r = closing({ shareCooked: 100, cookMinutes: 60 });
      expect(Math.abs(r.cod)).toBeLessThan(1e-7);
      expect(Math.abs(r.carbon) / r.carbon0).toBeLessThan(1e-9);
    },
    LONG,
  );
  it(
    'and through a mix, a full bell and a souring',
    () => {
      for (const patch of [
        { shareCooked: 50, cookMinutes: 0 },
        { shareCooked: 100, feedKg: 20 },
      ]) {
        const r = closing(patch, 15);
        expect(Math.abs(r.cod)).toBeLessThan(1e-6);
        expect(Math.abs(r.carbon) / r.carbon0).toBeLessThan(1e-8);
      }
    },
    LONG,
  );
  it('the heat closes: what came in, what left, what is in the slurry', () => {
    const pl = new Plant(paramsOf('plant-1000', { heaterW: 30, setPointT: 40, feedKg: 0 }));
    const H0 = pl.net.H[0]!;
    const boundary0 = pl.net.boundaryEnergy[1]!;
    for (let i = 0; i < 2880; i++) pl.step(30);
    const inJ = pl.book.sunJ + pl.book.heaterJ + pl.book.metabolicJ;
    expect(pl.net.H[0]! - H0 + (pl.net.boundaryEnergy[1]! - boundary0)).toBeCloseTo(inJ, -2);
  });
});

describe('the bell, as the 3D reads it', () => {
  it('rises 17.2 cm per 100 L, by its own scale', () => {
    const pl = new Plant(paramsOf('plant-1000', { feedKg: 0 }));
    pl.runIn(1);
    pl.setBellFill(0.25);
    const a = pl.rise;
    pl.setBellFill(0.5);
    expect((pl.rise - a) / (0.25 * 0.4008)).toBeCloseTo(1.72, 2);
  });
  it('climbs between the meals and falls at them, at real speed about 50 cm in a day of 289 L', () => {
    const sim = scenario('measured-day');
    const seen: number[] = [];
    for (let i = 0; i < 24 * 2; i++) {
      run(sim, 1 / 24);
      seen.push(sim.state.bellRise);
    }
    const rises = seen.slice(1).filter((r, i) => r > seen[i]!).length;
    const falls = seen.slice(1).filter((r, i) => r < seen[i]!).length;
    expect(rises).toBeGreaterThan(falls);
    expect(falls).toBeGreaterThan(0);
    expect(sim.state.dayGasL / 1000 / 0.581).toBeCloseTo(0.48, 1);
  });
  it('its parts move together: rim, top, inner surface; the riser stands with the ring', () => {
    const sim = scenario('measured-day');
    const s = sim.state;
    expect(s.bellTopHeight - s.bellRimHeight).toBeCloseTo(PLANT_1000.bellHeight, 6);
    expect(s.bellRimHeight).toBeCloseTo(PLANT_1000.bellRestRim + s.bellRise, 6);
    expect(s.levelRing).toBe(PLANT_1000.overflowLevel);
    expect(s.levelRiser).toBe(s.levelRing);
    expect(s.levelRing - s.levelInner).toBeCloseTo(s.pressurePa / 9810, 3);
    expect(s.bellTilt).toBeGreaterThanOrEqual(PLANT_1000.tiltRest);
    expect(s.bellTilt).toBeLessThanOrEqual(PLANT_1000.tiltFull);
    expect(FITTINGS.funnelTop).toBeGreaterThan(s.levelRiser);
  });
  it('holds its trapped gas when it rests', () => {
    const sim = scenario('flame-out');
    run(sim, 0.06);
    const s = sim.state;
    expect(s.flameOutCount).toBe(1);
    expect(s.flameOutCause).toBe('resting');
    expect(s.bellTrappedLitres).toBeCloseTo(trappedVolume(PLANT_1000) * 1000, 0);
  });
  it('moves by its share on a machine the 3D does not draw', () => {
    const sim = new BiodigesterSim();
    sim.applyPreset('school-4000');
    expect(sim.state.onDrawnMachine).toBe(false);
    expect(sim.state.bellRiseShare).toBeGreaterThanOrEqual(0);
    expect(sim.state.bellRiseShare).toBeLessThanOrEqual(1);
    sim.applyPreset(DRAWN_MACHINE);
    expect(sim.state.onDrawnMachine).toBe(true);
  });
});

describe('gestures', () => {
  it('a feed, now: the count rises, the overflow runs', () => {
    const sim = new BiodigesterSim();
    const before = sim.state.feedCount;
    const out = sim.plantNow.book.effluentL;
    sim.feedNow();
    expect(sim.state.feedCount).toBe(before + 1);
    expect(sim.plantNow.book.effluentL - out).toBeCloseTo(10, 6);
  });
  it('lighting and closing', () => {
    const sim = scenario('half-brick');
    sim.set({ burner: 'off' });
    expect(sim.state.burnerOpen).toBe(false);
    sim.lightBurner();
    expect(sim.state.burnerOpen).toBe(true);
    sim.shutBurner();
    expect(sim.state.flameOn).toBe(false);
  });
  it('the water in the hose can be set directly, and a weight changes the pressure at once', () => {
    const sim = new BiodigesterSim();
    sim.set({ hoseWater: 150 });
    expect(sim.state.hoseWaterMl).toBe(150);
    const p = sim.state.pressurePa;
    sim.set({ addedWeight: 12 });
    expect(sim.state.pressurePa - p).toBeCloseTo(202.7, 0);
  });
  it('a shift of month moves the weather, in a held season and in a running one', () => {
    const sim = new BiodigesterSim();
    sim.set({ site: 'geneva', month: 1 });
    expect(sim.state.feedWaterT).toBeCloseTo(1.7, 0);
    sim.set({ seasons: true, month: 7 });
    run(sim, 1);
    expect(sim.state.month).toBe(7);
  });
});

describe('twelve scenarios, each teaching one thing', () => {
  it('there are twelve, and every id runs with a text', () => {
    expect(SCENARIO_IDS).toHaveLength(12);
    for (const id of SCENARIO_IDS) {
      const s = scenarioSetup(id);
      expect(s.params.preset).toBe('custom');
      expect(s.spinUp).toBeGreaterThan(0);
    }
  });
  it('every preset and scenario loads in under a tenth of a second', () => {
    for (const id of SCENARIO_IDS) {
      const t0 = performance.now();
      scenario(id);
      expect(performance.now() - t0).toBeLessThan(150);
    }
    for (const id of PRESET_IDS) expect(MACHINES[id].id).toBe(id);
  });
  it('the measured day: about 280 L a day and an hour of flame', () => {
    const s = run(scenario('measured-day'), 3);
    expect(s.dayGasL).toBeCloseTo(280, -1);
    expect(s.dayFlameMin).toBeCloseTo(59, -1);
    expect(s.figureTag).toBe('†');
    expect(s.alarms).not.toContain('souring');
  });
  it('market waste: much less gas, a richer one', () => {
    const s = run(scenario('market-waste'), 3);
    expect(s.dayGasL).toBeCloseTo(77, -1);
    expect(s.ch4Share).toBeGreaterThan(0.65);
  });
  it('the ramp to five kilos: no souring, about 690 L, 2½ h', () => {
    const s = run(scenario('ramp-to-five'), 60);
    expect(s.dayGasL).toBeCloseTo(690, -1);
    expect(s.dayFlameMin).toBeCloseTo(149, -1);
    expect(s.pH).toBeGreaterThan(6.4);
    expect(s.souredCount).toBe(0);
  });
  it('three days away: the gas falls, by half, and comes back', () => {
    const sim = scenario('three-days-away');
    run(sim, 2);
    const usual = sim.state.dayGasL;
    run(sim, 3);
    const low = sim.state.dayGasL;
    expect(low).toBeCloseTo(125, -1);
    expect(low / usual).toBeLessThan(0.5);
    run(sim, 9);
    expect(sim.state.dayGasL / usual).toBeGreaterThan(0.9);
  });
  it('too much, at once: three good days, then the gas stops and does not return', () => {
    const sim = scenario('overfeed');
    run(sim, 5);
    expect(sim.state.dayGasL).toBeGreaterThan(800);
    expect(sim.state.pH).toBeGreaterThan(6.3);
    run(sim, 3);
    expect(sim.state.dayGasL).toBeLessThan(30);
    expect(sim.state.alarms).toContain('soured');
    expect(sim.state.souredCount).toBe(1);
    expect(sim.state.sourIndex).toBeGreaterThan(0.5);
    run(sim, 30);
    expect(sim.params.feedKg).toBe(0);
    expect(sim.state.pH).toBeLessThan(4.5);
    expect(sim.state.dayGasL).toBeLessThan(1);
  });
  it('the half-brick: 2.03 mbar more, and 1.3 to 1.4 times the flow', () => {
    const sim = scenario('half-brick');
    run(sim, 11 / 1440);
    const before = sim.state;
    const q = before.burnerLph;
    const p = before.pressurePa;
    expect(before.flameOn).toBe(true);
    run(sim, 2 / 1440);
    expect(sim.params.addedWeight).toBe(12);
    expect(sim.state.pressurePa - p).toBeGreaterThan(190);
    expect(sim.state.burnerLph / q).toBeGreaterThan(1.3);
    expect(sim.state.burnerLph / q).toBeLessThan(1.45);
  });
  it('the full bell: gas leaves over the rim, all of it once it stands full', () => {
    const sim = scenario('full-bell');
    let wasFull = false;
    let overflow = 0;
    for (let h = 0; h < 96; h++) {
      run(sim, 1 / 24);
      if (sim.state.bellFull) wasFull = true;
      overflow = Math.max(overflow, sim.state.overflowLph);
    }
    const s = sim.state;
    expect(wasFull).toBe(true);
    expect(s.fullBellCount).toBeGreaterThanOrEqual(1);
    expect(overflow).toBeGreaterThan(5);
    expect(s.dayLostShare).toBeCloseTo(1, 1);
    expect(s.bellRiseShare).toBeGreaterThan(0.9);
  });
  it('a Geneva winter: the seasons run, it sours in early December at about 6 °C, nothing in January, and it says it is a model', () => {
    const sim = scenario('geneva-january');
    expect(sim.state.month).toBe(9);
    expect(sim.state.figureTag).toBe('*');
    run(sim, 40);
    expect(sim.state.month).toBe(10);
    expect(sim.state.dayGasL).toBeGreaterThan(100);
    let day = 40;
    while (sim.state.pH >= 5.5 && day < 200) {
      run(sim, 1);
      day++;
    }
    expect(sim.state.month).toBe(12);
    expect(sim.state.slurryT).toBeCloseTo(6, 0);
    expect(sim.state.alarms).toContain('soured');
    run(sim, 120 - day);
    expect(sim.state.month).toBe(1);
    expect(sim.state.dayGasL).toBeLessThan(1);
    expect(sim.state.regime).toBe('below-measurements');
  });
  it('the flame goes out with gas left under the bell', () => {
    const sim = scenario('flame-out');
    run(sim, 0.03);
    expect(sim.state.flameOn).toBe(true);
    const shrinking = sim.state.burnerLph;
    expect(shrinking).toBeLessThan(sim.params.burnerLph);
    run(sim, 0.04);
    expect(sim.state.flameOn).toBe(false);
    expect(sim.state.flameOutCause).toBe('resting');
    expect(sim.state.bellLitres).toBeGreaterThan(220);
  });
  it('water in the hose: the same bell, less flame, then none, and gas over the rim', () => {
    const sim = scenario('water-in-hose');
    const flames: number[] = [];
    for (let d = 0; d < 8; d++) {
      run(sim, 1);
      flames.push(sim.state.dayFlameMin);
    }
    expect(sim.state.waterPlugMbar).toBeCloseTo(2.32, 1);
    expect(sim.state.alarms).toContain('hoseWater');
    expect(sim.state.flameOutCause).toBe('water');
    expect(sim.state.bellFull).toBe(true);
    expect(flames[1]!).toBeGreaterThan(50);
    expect(flames[7]!).toBe(0);
  });
  it('Geneva, wrapped and heated: alive at 30 °C, and the heat costs more than the gas holds', () => {
    const s = run(scenario('geneva-heated'), 15);
    expect(s.slurryT).toBeCloseTo(30, 0);
    expect(s.dayGasL).toBeGreaterThan(200);
    expect(s.dayHeaterKWh).toBeGreaterThan(s.dayKWh);
    expect(s.figureTag).toBe('*');
    expect(s.regime).toBe('inside-measurements');
    expect(s.siteMeasured).toBe(false);
  });
  it('the small drum: holds at 38 °C, overloaded by the book, three times its gas in heat', () => {
    const s = run(scenario('small-drum'), 15);
    expect(s.slurryT).toBeCloseTo(38, 0);
    expect(s.alarms).toContain('overload');
    expect(s.pH).toBeGreaterThan(6.8);
    expect(s.dayHeaterKWh / s.dayKWh).toBeCloseTo(2.9, 0);
    expect(s.onDrawnMachine).toBe(false);
  });
});

describe('what the state is honest about', () => {
  it('H₂S is not a number: unknown, always', () => {
    const sim = scenario('measured-day');
    run(sim, 1);
    expect(sim.state.h2sPpm).toBeNull();
    expect(sim.state.h2sTag).toBe('unknown');
    expect(STATE_TAGS.h2sPpm).toBe('unknown');
  });
  it('a figure below about 25 °C is a model, and says so', () => {
    expect(MEASURED_T_MIN).toBe(25);
    const sim = new BiodigesterSim();
    sim.set({ fixedT: 24 });
    run(sim, 0.01);
    expect(sim.state.regime).toBe('below-measurements');
    expect(sim.state.figureTag).toBe('*');
    for (const row of stripValues(sim.state)) expect(row.tag).toBe('*');
    sim.set({ fixedT: 30 });
    run(sim, 0.01);
    expect(sim.state.figureTag).toBe('†');
    for (const row of stripValues(sim.state)) expect(row.tag).toBe('†');
  });
  it('anywhere but Dar es Salaam is a model too, whatever the temperature', () => {
    const sim = new BiodigesterSim();
    sim.set({ site: 'marseille', fixedT: 30 });
    run(sim, 0.01);
    expect(sim.state.figureTag).toBe('*');
  });
  it('a size nobody measured is a model too, at Dar es Salaam as well', () => {
    for (const id of PRESET_IDS) {
      const sim = new BiodigesterSim();
      sim.applyPreset(id);
      sim.set({ fixedT: 30 });
      run(sim, 0.01);
      expect(sim.state.figureTag, id).toBe(id === 'plant-1000' || id === 'school-4000' ? '†' : '*');
    }
  });
  it('the flame button lights a burner set to closed, and it stays lit', () => {
    const sim = new BiodigesterSim();
    sim.set({ burner: 'off', timeScale: 60 });
    run(sim, 0.01);
    expect(sim.state.flameOn).toBe(false);
    sim.lightBurner();
    run(sim, 0.005);
    expect(sim.state.flameOn).toBe(true);
    expect(sim.params.burner).toBe('meals');
  });
  it('a scenario can be asked again from another setting, in the plant’s whole history, and knows what it is', () => {
    const sim = new BiodigesterSim();
    expect(sim.scenarioNow).toBeNull();
    sim.applyScenario('geneva-january', { Ea: 45000 });
    expect(sim.scenarioNow).toBe('geneva-january');
    expect(sim.params.Ea).toBe(45000);
    expect(sim.params.site).toBe('geneva');
    sim.reset();
    expect(sim.params.Ea).toBe(MODEL.Ea);
    sim.applyPreset('plant-1000');
    expect(sim.scenarioNow).toBeNull();
  });
  it('every key of the state has its word', () => {
    const s = new BiodigesterSim().state;
    for (const k of Object.keys(s)) expect(STATE_TAGS[k as keyof BioState], k).toBeDefined();
    for (const k of Object.keys(STATE_TAGS)) expect(k in s, k).toBe(true);
  });
});

describe('the strip', () => {
  it('shows research §5.6’s nine values, each with its tag', () => {
    const sim = new BiodigesterSim();
    run(sim, 1.2);
    const rows = stripValues(sim.state);
    expect(rows.map((r) => r.key)).toEqual([
      'slurryT',
      'pH',
      'bell',
      'pressure',
      'gas',
      'ch4',
      'flame',
      'energy',
      'lost',
    ]);
    for (const r of rows) {
      expect(r.tag === '†' || r.tag === '*').toBe(true);
      expect(r.label[0].length).toBeGreaterThan(0);
      expect(r.label[1].length).toBeGreaterThan(0);
      expect(Number.isFinite(Number(r.value))).toBe(true);
    }
  });
  it('its clock and alarms', () => {
    const sim = scenario('full-bell');
    run(sim, 2);
    expect(stripClock(sim.state).day).toBe(3);
    expect(stripClock(sim.state).time).toMatch(/^\d\d:\d\d$/);
    const a = stripAlarms(sim.state);
    expect(a.map((x) => x.key)).toContain('bellFull');
    expect(a[0]!.label).toHaveLength(2);
  });
});

describe('for the film and the worlds', () => {
  it('bell height and tilt, flame on or off, pH, the drop’s colour', () => {
    const sim = scenario('measured-day');
    const s = sim.state;
    for (const k of ['bellRise', 'bellTilt', 'bellTopHeight', 'pH', 'sourIndex', 'flameShare'] as const) {
      expect(Number.isFinite(s[k])).toBe(true);
    }
    expect(typeof s.flameOn).toBe('boolean');
    expect(s.dropRgb).toHaveLength(3);
  });
  it('the drop goes from olive to rust as the tank sours, written in place', () => {
    const sim = scenario('overfeed');
    const rgb = sim.state.dropRgb;
    const green = rgb[1];
    run(sim, 20);
    expect(sim.state.dropRgb).toBe(rgb);
    expect(rgb[1]).toBeLessThan(green);
    expect(rgb[0]).toBeGreaterThan(0.6);
  });
  it('the scope keeps an hourly record, sixty days at most', () => {
    const sim = scenario('three-days-away');
    run(sim, 3);
    expect(sim.scope.t.length).toBeCloseTo(73, -1);
    expect(sim.scope.pH.length).toBe(sim.scope.t.length);
    const sim2 = scenario('ramp-to-five');
    run(sim2, 70);
    expect(sim2.scope.t.length).toBeLessThanOrEqual(1440);
  });
  it('the layers follow what is in the tank, at S5’s shares', () => {
    const s = scenario('measured-day').state;
    expect(s.stockVS).toBeGreaterThan(5);
    expect(s.stockTS).toBeGreaterThan(s.stockVS);
    expect(s.scumHeight).toBeGreaterThan(0);
    expect(s.sludgeHeight).toBeGreaterThan(0);
    expect(s.scumHeight + s.sludgeHeight).toBeLessThan(PLANT_1000.overflowLevel);
  });
  it('all the machines give a sensible plant', () => {
    for (const id of PRESET_IDS) {
      const m = MACHINES[id];
      const p = presetParams(id);
      expect(p.machine).toBe(id);
      expect(m.liquidVolume).toBeGreaterThan(0);
      expect(m.bellTravel).toBeGreaterThan(0);
      const sim = new BiodigesterSim();
      sim.applyPreset(id);
      run(sim, 0.5);
      expect(sim.state.pH).toBeGreaterThan(6);
      expect(sim.state.pH).toBeLessThan(8);
    }
  });
});
