import { describe, expect, it } from 'vitest';
import { BiodigesterSim } from './engine';
import { PRESET_IDS, SCENARIO_IDS } from './presets';
import { firstWinter, flameOutRun, mealResponse, rescueRun, souringFeed, steady, thesisRun } from './runs';
import {
  ALARM_TEXTS,
  BURNER_TEXTS,
  FLAME_OUT_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  SITE_TEXTS,
  TAG_NOTE,
  type Pair,
} from './texts';
import { SITE_IDS } from './climate';

// What a visitor reads: both languages, no research reference, nothing that promises safety, a mark on every model figure, and the figures read back against the model. A pin is not a target: when the
// model moves, the words and docs/physics.md move with it.

const raw = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const DOC = raw['../../docs/physics.md'] ?? '';

const everyPair = (): Pair[] => [
  ...Object.values(ALARM_TEXTS).map((a) => a.text),
  ...Object.values(PRESET_TEXTS),
  ...Object.values(SCENARIO_TEXTS).flatMap((s) => [s.name, s.lesson]),
  ...Object.values(BURNER_TEXTS),
  ...Object.values(SITE_TEXTS),
  TAG_NOTE,
];

const LONG = 240000;

describe('the words', () => {
  it('every id has its words, in both languages', () => {
    for (const id of SCENARIO_IDS) expect(SCENARIO_TEXTS[id]).toBeDefined();
    for (const id of PRESET_IDS) expect(PRESET_TEXTS[id]).toBeDefined();
    for (const id of SITE_IDS) expect(SITE_TEXTS[id]).toBeDefined();
    for (const [fr, en] of everyPair()) {
      expect(fr.trim().length).toBeGreaterThan(0);
      expect(en.trim().length).toBeGreaterThan(0);
    }
    for (const [fr, en] of Object.values(FLAME_OUT_TEXTS).slice(1)) {
      expect(fr.length).toBeGreaterThan(0);
      expect(en.length).toBeGreaterThan(0);
    }
  });
  it('the two languages are of the same length, give or take: no half-translated lesson', () => {
    for (const id of SCENARIO_IDS) {
      const [fr, en] = SCENARIO_TEXTS[id].lesson;
      expect(fr.length / en.length).toBeGreaterThan(0.8);
      expect(fr.length / en.length).toBeLessThan(1.3);
    }
  });
  it('no research reference ever reaches a visitor', () => {
    for (const [fr, en] of everyPair()) {
      for (const text of [fr, en]) {
        expect(text).not.toMatch(/\(?\bK\d+\b\)?/);
        expect(text).not.toMatch(/\bS\d+\b/);
        expect(text).not.toMatch(/§/);
        expect(text).not.toMatch(/research|recherche/i);
      }
    }
  });
  it('no wording promises safety, and none says the gas is clean or free', () => {
    const banned =
      /\b(safe|safely|safety|harmless|risk-free|no risk|no danger|non-toxic|nontoxic|clean|green|free energy|zero waste|carbon neutral)\b|sans (danger|risque)|sûr\b|sûre\b|sécuris|inoffensi|non toxique|énergie gratuite|neutre en carbone|zéro déchet|\bpropre\b/i;
    for (const [fr, en] of everyPair()) {
      expect(fr).not.toMatch(banned);
      expect(en).not.toMatch(banned);
    }
  });
  it('it is not a plan: no instruction to build, no recipe', () => {
    const plan =
      /\b(build|install|drill|cut the|you should|you must)\b|\b(construisez|percez|découpez|il faut|vous devez)\b/i;
    for (const id of SCENARIO_IDS) {
      for (const text of SCENARIO_TEXTS[id].lesson) expect(text).not.toMatch(plan);
    }
  });
  it('« this is a model » is said once, in the scenario where it matters, and the note says the rest once', () => {
    const saying = Object.values(SCENARIO_TEXTS).filter((s) =>
      /qu’un modèle|only a model/.test(s.lesson[0] + s.lesson[1]),
    );
    expect(saying).toHaveLength(1);
    expect(SCENARIO_TEXTS['geneva-january'].lesson[1]).toMatch(/only a model/);
    expect(TAG_NOTE[1]).toMatch(/H₂S/);
    expect(TAG_NOTE[1]).toMatch(/25 °C/);
  });
});

/** A number and its mark, read out of a lesson. */
const read = (text: string, re: RegExp): number[] => {
  const m = text.match(re);
  expect(m, `${re} in « ${text} »`).not.toBeNull();
  return m!.slice(1).map((n) => Number(n.replace(',', '.').replace(' ', '')));
};

const runScenario = (id: keyof typeof SCENARIO_TEXTS, days: number) => {
  const sim = new BiodigesterSim();
  sim.applyScenario(id);
  const dt = 1 / 60;
  const frames = Math.round((days * 86400) / sim.params.timeScale / dt);
  for (let i = 0; i < frames; i++) sim.step(dt);
  return sim;
};

describe('the figures in the lessons are the model’s', () => {
  it('« La journée mesurée »: about 280 L †, an hour, 1.5 kW †', () => {
    const s = runScenario('measured-day', 3).state;
    const [fr, en] = SCENARIO_TEXTS['measured-day'].lesson;
    for (const said of [read(fr, /environ (\d+) L †/)[0]!, read(en, /about (\d+) L †/)[0]!]) {
      expect(Math.abs(s.dayGasL - said)).toBeLessThan(10);
    }
    expect(read(en, /(1\.5) kW †/)[0]).toBe(1.5);
    expect(read(fr, /(1,5) kW †/)[0]).toBe(1.5);
    expect(s.dayFlameMin).toBeGreaterThan(50);
  });
  it(
    '« Des épluchures »: 76 L †, 69 % †',
    () => {
      const m = steady({ shareCooked: 0 });
      const [fr, en] = SCENARIO_TEXTS['market-waste'].lesson;
      for (const text of [fr, en]) {
        expect(Math.abs(m.gasL - read(text, /(\d+) L †/)[0]!)).toBeLessThan(1);
        expect(Math.abs(m.ch4Share * 100 - read(text, /(\d+) % †/)[0]!)).toBeLessThan(1);
      }
      expect(fr).toMatch(/126/);
      expect(en).toMatch(/126/);
    },
    LONG,
  );
  it('« La montée »: about 690 L †, above pH 6.5 †', () => {
    const s = runScenario('ramp-to-five', 60).state;
    const [fr, en] = SCENARIO_TEXTS['ramp-to-five'].lesson;
    expect(Math.abs(s.dayGasL - read(fr, /environ (\d+) L †/)[0]!)).toBeLessThan(15);
    expect(Math.abs(s.dayGasL - read(en, /about (\d+) L †/)[0]!)).toBeLessThan(15);
    expect(s.pH).toBeGreaterThan(read(en, /above (\d\.\d) †/)[0]!);
    expect(s.pH).toBeGreaterThan(read(fr, /au-dessus de (\d,\d) †/)[0]!);
    expect(s.dayFlameMin).toBeCloseTo(149, -1);
  });
  it('« Trois jours d’absence »: half in two days †, two weeks †, 135 L †', () => {
    const meal = mealResponse();
    expect(meal.half).toBeCloseTo(2, 0);
    expect(meal.ninety).toBeLessThan(14);
    const sim = runScenario('three-days-away', 5);
    const [fr, en] = SCENARIO_TEXTS['three-days-away'].lesson;
    expect(Math.abs(sim.state.dayGasL - read(fr, /environ (\d+) L †/)[0]!)).toBeLessThan(5);
    expect(Math.abs(sim.state.dayGasL - read(en, /about (\d+) L †/)[0]!)).toBeLessThan(5);
  });
  it(
    '« Trop, d’un coup »: tripled, near 10 kg †, two months on 100 L †, 7.5 kg by the book',
    () => {
      const threshold = souringFeed(32);
      const [fr, en] = SCENARIO_TEXTS.overfeed.lesson;
      expect(Math.abs(threshold - read(fr, /vers (\d+) kg par jour †/)[0]!)).toBeLessThan(0.5);
      expect(Math.abs(threshold - read(en, /near (\d+) kg a day †/)[0]!)).toBeLessThan(0.5);
      const rescue = rescueRun(12, 5, 100);
      expect(rescue.recoveredDay / 30).toBeCloseTo(2, 0);
      expect(rescueRun(12, 5).recoveredDay).toBe(Infinity);
      expect(fr).toMatch(/7,5 kg/);
      expect(en).toMatch(/7\.5 kg/);
      const sim = runScenario('overfeed', 5);
      expect(sim.state.dayGasL / 280).toBeGreaterThan(2.8);
    },
    LONG,
  );
  it('« Le demi-parpaing »: 2.03 mbar, 1.4 times †, 1.84 measured', () => {
    const sim = runScenario('half-brick', 11 / 1440);
    const q = sim.state.burnerLph;
    const dt = 1 / 60;
    for (let i = 0; i < (2 * 60) / sim.params.timeScale / dt; i++) sim.step(dt);
    const [fr, en] = SCENARIO_TEXTS['half-brick'].lesson;
    expect(fr).toMatch(/2,03 mbar †/);
    expect(en).toMatch(/2\.03 mbar †/);
    const ratio = sim.state.burnerLph / q;
    expect(Math.abs(ratio - read(en, /(\d\.\d) times †/)[0]!)).toBeLessThan(0.1);
    expect(Math.abs(ratio - read(fr, /(\d,\d) fois †/)[0]!)).toBeLessThan(0.1);
  });
  it(
    '« Un hiver à Genève »: in early December near 6 °C *, gone in spring *, back in April *, and the two Ea *',
    () => {
      // the words are measured where they are read: the scenario, live
      const sim = new BiodigesterSim();
      sim.applyScenario('geneva-january');
      const dt = 1 / 60;
      while (sim.state.pH >= 5.5 && sim.state.simTime < 200 * 86400) sim.step(dt);
      const [fr, en] = SCENARIO_TEXTS['geneva-january'].lesson;
      expect(sim.state.month).toBe(12);
      expect(sim.state.dayOfYear).toBeLessThan(345);
      // the tank swings about a degree in a day: « near » is that wide
      expect(Math.abs(sim.state.slurryT - read(fr, /vers (\d+) °C \*/)[0]!)).toBeLessThan(1.5);
      expect(Math.abs(sim.state.slurryT - read(en, /near (\d+) °C \*/)[0]!)).toBeLessThan(1.5);
      expect(fr).toMatch(/Début décembre/);
      expect(en).toMatch(/early December/);
      // a plant started warm in July goes a month sooner: the date depends on its history, docs/physics.md §4.3
      const rows = firstWinter('geneva');
      expect(rows.find((r) => r.month === 11)!.pH).toBeLessThan(5.5);
      expect(rows.find((r) => r.month === 5)!.gasL).toBeLessThan(1);
      const paused = firstWinter('geneva', {}, [11, 12, 1, 2, 3]);
      expect(paused.find((r) => r.month === 4)!.gasL).toBeGreaterThan(100);
      const lowest = (Ea: number): number => Math.min(...firstWinter('geneva', { Ea }).map((r) => r.pH));
      expect(read(en, /at (\d+) kJ\/mol the tank comes through/)[0]).toBe(40);
      expect(lowest(40000)).toBeGreaterThan(6.3);
      expect(read(en, /at (\d+) it gives way sooner/)[0]).toBe(80);
      expect(firstWinter('geneva', { Ea: 80000 }).find((r) => r.month === 10)!.gasL).toBeLessThan(
        firstWinter('geneva').find((r) => r.month === 10)!.gasL,
      );
      // it opens on what the model cannot decide, and those two figures are the model's
      expect(fr).toMatch(/^Sur deux kilos par jour.*Le modèle ne peut pas trancher/);
      expect(en).toMatch(/^On two kilos a day.*The model cannot decide/);
      const holds = read(en, /holds up to (\d+) kJ\/mol \*/)[0]!;
      const fails = read(en, /sours from (\d+) \*/)[0]!;
      expect(read(fr, /jusqu’à (\d+) kJ\/mol \*/)[0]).toBe(holds);
      expect(read(fr, /tourne dès (\d+) \*/)[0]).toBe(fails);
      expect(lowest(holds * 1000)).toBeGreaterThan(6);
      expect(lowest(fails * 1000)).toBeLessThan(5.5);
    },
    LONG,
  );
  it(
    '« La flamme s’éteint »: about 230 L *',
    () => {
      const r = flameOutRun('plant-1000', 1);
      const [fr, en] = SCENARIO_TEXTS['flame-out'].lesson;
      expect(Math.abs(r.leftL - read(fr, /environ (\d+) L \*/)[0]!)).toBeLessThan(5);
      expect(Math.abs(r.leftL - read(en, /About (\d+) L \*/)[0]!)).toBeLessThan(5);
    },
    LONG,
  );
  it('« De l’eau dans le tuyau »: a few grams a day †, and two centimetres of water are the bell’s whole push', () => {
    // before the scenario's first step of water: only what the burnt gas has dropped
    const sim = runScenario('water-in-hose', 1.9);
    expect(sim.state.pressurePa / 9810).toBeLessThan(0.03);
    expect(sim.plantNow.p.trap).toBe(false);
    expect(sim.state.hoseWaterMl / 1.9).toBeGreaterThan(0.5);
    expect(sim.state.hoseWaterMl / 1.9).toBeLessThan(6);
  });
  it(
    '« Genève, emballée et chauffée »: 1.4 kWh *, 1.7 *, and the straw alone does not save it',
    () => {
      const s = runScenario('geneva-heated', 15).state;
      const [fr, en] = SCENARIO_TEXTS['geneva-heated'].lesson;
      expect(Math.abs(s.dayKWh - read(en, /(\d\.\d) kWh \*/)[0]!)).toBeLessThan(0.05);
      expect(Math.abs(s.dayKWh - read(fr, /(\d,\d) kWh \*/)[0]!)).toBeLessThan(0.05);
      expect(Math.abs(s.dayHeaterKWh - read(en, /asks for (\d\.\d) \*/)[0]!)).toBeLessThan(0.05);
      expect(Math.abs(s.dayHeaterKWh - read(fr, /demande (\d,\d) \*/)[0]!)).toBeLessThan(0.05);
      expect(Math.min(...firstWinter('geneva', { wallU: 0.25 }).map((r) => r.pH))).toBeLessThan(5);
    },
    LONG,
  );
  it('« Le bidon »: 93 L *, pH 7.1 *, three times *: it runs at Geneva, where no plant was measured, as the strip says', () => {
    const s = runScenario('small-drum', 15).state;
    const [fr, en] = SCENARIO_TEXTS['small-drum'].lesson;
    expect(s.figureTag).toBe('*');
    expect(fr + en).not.toMatch(/†/);
    expect(Math.abs(s.dayGasL - read(fr, /(\d+) L \*/)[0]!)).toBeLessThan(2);
    expect(Math.abs(s.dayGasL - read(en, /(\d+) L \*/)[0]!)).toBeLessThan(2);
    expect(Math.abs(s.pH - read(en, /pH of (\d\.\d) \*/)[0]!)).toBeLessThan(0.05);
    expect(Math.abs(s.pH - read(fr, /pH de (\d,\d) \*/)[0]!)).toBeLessThan(0.05);
    expect(Math.round(s.dayHeaterKWh / s.dayKWh)).toBe(3);
    expect(en).toMatch(/three times \*/);
    expect(fr).toMatch(/trois fois \*/);
  });
  it('the marks: no figure of the model is left bare in these lessons', () => {
    const marked: (keyof typeof SCENARIO_TEXTS)[] = [
      'measured-day',
      'market-waste',
      'three-days-away',
      'small-drum',
      'flame-out',
    ];
    for (const id of marked) {
      for (const text of SCENARIO_TEXTS[id].lesson) expect(text).toMatch(/[†*]/);
    }
  });
});

describe('docs/physics.md', () => {
  it('has a line for every key figure of the research', () => {
    for (let k = 1; k <= 47; k++) {
      expect(DOC, `K${k}`).toMatch(new RegExp(`\\| K${k}\\b`));
    }
  });
  it('states what it does not find, the estimates and the unknown', () => {
    expect(DOC).toMatch(/Not retrieved/);
    expect(DOC).toMatch(/H₂S/);
    expect(DOC).toMatch(/25 °C/);
    expect(DOC).toMatch(/Never tuned|Nothing is tuned/);
  });
  it(
    'prints what the thesis’s calendar gives',
    () => {
      const r = thesisRun();
      const food = r.mean(19, 29);
      expect(DOC).toContain(`${food.gasL.toFixed(0)} L/d`);
      expect(DOC).toContain(`${(food.ch4Share * 100).toFixed(1)} %`);
      expect(DOC).toContain(`${r.at(79).gasNL.toFixed(0)} NL/d`);
      expect(DOC).toContain(`${r.at(107).stockVS.toFixed(1)} kg`);
    },
    LONG,
  );
});
