import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { LAB_STRINGS, t } from '../i18n/ui';
import { BiodigesterSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { TAG_NOTE } from '../sim/texts';
import { mainReadouts, markOf, moreReadouts, niceCeil3, statusOf } from './model';
import { SimPanel } from './sim';
import { num, PANEL_STRINGS, st, sx } from './strings';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, that it offers every control the sheets and lessons name, that a click does what it says, in both languages.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: BiodigesterSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new BiodigesterSim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'yard' }, gotoScene: () => undefined } as unknown as AppContext<BiodigesterSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label || b.attrs.get('aria-label') === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
/** The kit's slider and toggle wrap their input in a label with these words. */
const control = (root: FakeElement, words: string): FakeElement => {
  const found = root.find('label').find((l) => l.textContent.includes(words) && l.find('input').length > 0);
  if (!found) throw new Error(`no control « ${words} »`);
  return found.find('input')[0]!;
};
const run = (panel: SimPanel, sim: BiodigesterSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the machine with its presets, a chip per scenario, and no lesson', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual(
      PRESET_IDS.map((id) => sx('preset', id)),
    );
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(sim.scenarioNow).toBeNull();
    expect(root.textContent).toContain(st('scenarioHint'));
  });
  it('has every control the sheets and lessons name, under the words they use', () => {
    for (const lang of ['fr', 'en'] as const) {
      const { root } = open(lang);
      for (const key of Object.keys(LAB_STRINGS).filter((k) => k.startsWith('slider'))) {
        expect(root.textContent, key).toContain(t(key as 'sliderFeed'));
      }
      expect(root.textContent).toContain(t('toggleTrap'));
      expect(root.textContent).toContain(t('lightBurner'));
    }
  });
  it('says the marks once, the H₂S as unknown, and never a code from the research', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    const text = root.textContent;
    expect(text.split(st('tagNote')).length).toBe(2);
    expect(st('tagNote').length).toBeGreaterThanOrEqual(TAG_NOTE[1].length);
    expect(text).toContain(st('moreUnknown'));
    for (const [fr, en] of Object.values(PANEL_STRINGS)) expect(fr + en).not.toMatch(/\bK\d+\b|\bS\d+\b|§/);
  });
  it('shows the live figures, each marked as the state marks it', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout')).toHaveLength(mainReadouts(sim.state).length);
    for (const r of [...mainReadouts(sim.state), ...moreReadouts(sim.state)]) {
      expect(Number.isFinite(r.value), r.key).toBe(true);
      expect(['', '†', '*']).toContain(r.mark);
    }
    expect(markOf('slurryT', sim.state)).toBe('†');
    expect(markOf('bellTilt', sim.state)).toBe('*');
    expect(markOf('hrtDays', sim.state)).toBe('†');
    expect(markOf('simTime', sim.state)).toBe('');
    sim.set({ site: 'geneva' });
    expect(markOf('slurryT', sim.state)).toBe('*');
  });
  it('builds in both languages, every word in both', () => {
    for (const [key, [fr, en]] of Object.entries(PANEL_STRINGS)) {
      expect(fr.trim().length, key).toBeGreaterThan(0);
      expect(en.trim().length, key).toBeGreaterThan(0);
    }
    for (const lang of ['fr', 'en'] as const) {
      const { sim, panel } = open(lang);
      run(panel, sim, 0.5);
    }
  });
  it('says no recipe, promises nothing, and names no maker', () => {
    const banned =
      /\b(safe|safely|harmless|no risk|no danger|you should|you must|drill)\b|sans (danger|risque)|\bsûr\b|\bsûre\b|il faut|vous devez|percez|\bARTI\b/i;
    for (const [key, [fr, en]] of Object.entries(PANEL_STRINGS)) {
      expect(fr, key).not.toMatch(banned);
      expect(en, key).not.toMatch(banned);
    }
  });
});

describe('what the controls do', () => {
  it('a scenario chip starts it and says its lesson, and the lesson stays while the visitor tries things', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'overfeed')).click();
    expect(sim.scenarioNow).toBe('overfeed');
    expect(root.textContent).toContain(sx('lesson', 'overfeed'));
    const food = control(root, t('sliderFeed'));
    food.value = '4';
    food.dispatch('input', { target: food });
    expect(sim.params.feedKg).toBe(4);
    expect(root.textContent).toContain(sx('lesson', 'overfeed'));
  });
  it('a preset takes the lesson away', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'overfeed')).click();
    const select = root.find('select')[0]!;
    select.value = 'plant-1500';
    select.dispatch('change', { target: select });
    expect(sim.params.machine).toBe('plant-1500');
    expect(sim.scenarioNow).toBeNull();
    expect(root.textContent).not.toContain(sx('lesson', 'overfeed'));
  });
  it('follows a scenario started from outside, as a lesson does', () => {
    const { root, sim, panel } = open('en');
    sim.applyScenario('half-brick');
    panel.tick(1 / 60);
    expect(root.textContent).toContain(sx('lesson', 'half-brick'));
  });
  it('in the Geneva scenario the Ea slider stands beside the words, with its hint, and asks the same plant again', () => {
    const { root, sim, panel } = open('en');
    expect(root.textContent).not.toContain(t('eaHint'));
    button(root, sx('scenario', 'geneva-january')).click();
    expect(root.textContent).toContain(t('eaHint'));
    // one slider of it, not two
    expect(root.textContent.split(t('sliderEa')).length).toBe(2);
    run(panel, sim, 3);
    const day = sim.state.dayNumber;
    expect(day).toBeGreaterThan(1);
    const ea = control(root, t('sliderEa'));
    ea.value = '40000';
    ea.dispatch('input', { target: ea });
    expect(sim.params.Ea).toBe(40000);
    expect(sim.state.dayNumber).toBe(0);
    expect(sim.scenarioNow).toBe('geneva-january');
    expect(sim.params.month).toBe(9);
    expect(root.textContent).toContain(sx('lesson', 'geneva-january'));
  });
  it('Start again goes back to the scenario’s own settings', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'geneva-january')).click();
    sim.applyScenario('geneva-january', { Ea: 40000 });
    button(root, st('resetSim')).click();
    expect(sim.params.Ea).toBe(60000);
  });
  it('the trap can be switched off, and a scenario’s own switch shows on it', () => {
    const { root, sim, panel } = open('en');
    const trap = control(root, t('toggleTrap'));
    expect(sim.params.trap).toBe(true);
    trap.checked = false;
    trap.dispatch('change', { target: trap });
    expect(sim.params.trap).toBe(false);
    sim.reset();
    panel.tick(0.3);
    sim.applyScenario('water-in-hose');
    panel.tick(0.3);
    panel.tick(0.3);
    expect(control(root, t('toggleTrap')).checked).toBe(false);
  });
  it('the hints speak only when they apply', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 0.5);
    expect(root.textContent).not.toContain(t('siteHint'));
    expect(root.textContent).not.toContain(t('drawnHint'));
    sim.set({ site: 'geneva' });
    run(panel, sim, 0.5);
    expect(root.textContent).toContain(t('siteHint'));
    sim.applyPreset('drum-60');
    panel.render();
    run(panel, sim, 0.5);
    expect(root.textContent).toContain(t('drawnHint'));
  });
  it('the gestures do what they say', () => {
    const { root, sim } = open('en');
    const fed = sim.state.feedCount;
    button(root, st('feedNow')).click();
    expect(sim.state.feedCount).toBe(fed + 1);
    button(root, t('lightBurner')).click();
    sim.step(1 / 60);
    expect(sim.state.flameOn).toBe(true);
    button(root, st('shutBurner')).click();
    sim.step(1 / 60);
    expect(sim.state.flameOn).toBe(false);
  });
});

describe('the status line and the strip', () => {
  it('says why the flame went out, and what the tank has become', () => {
    const sim = new BiodigesterSim();
    setLang('en');
    expect(statusOf(sim.state).tone).toBe('note');
    sim.applyScenario('flame-out');
    for (let i = 0; i < 40000 && !sim.state.alarms.includes('flameOutGasLeft'); i++) sim.step(1 / 30);
    const said = statusOf(sim.state);
    expect(said.tone).toBe('warn');
    expect('text' in said && said.text).toContain(sx('alarm', 'flameOutGasLeft'));
  });
  it('the strip speaks the language, with a decimal comma in French and the state’s mark on each value', () => {
    const sim = new BiodigesterSim();
    sim.step(1 / 60);
    setLang('fr');
    const fr = stripValues(sim);
    expect(fr.find((v) => v.label === 'pH')!.value).toMatch(/^\d,\d\d$/);
    expect(fr.find((v) => v.label === 'pH')!.unit).toBe('†');
    expect(fr.find((v) => v.label === 'Cuve')!.unit).toBe('°C †');
    expect(stripClock(sim).sub).toMatch(/^jour 1 · /);
    setLang('en');
    const en = stripValues(sim);
    expect(en.find((v) => v.label === 'pH')!.value).toMatch(/^\d\.\d\d$/);
    expect(stripClock(sim).sub).toMatch(/^day 1 · /);
    expect(STRIP_SPEEDS).toContain(sim.params.timeScale);
    sim.applyScenario('overfeed');
    for (let i = 0; i < 300; i++) sim.step(0.25);
    const alarms = stripAlarms(sim);
    expect(alarms.length).toBeGreaterThan(0);
    for (const a of alarms) expect(a.label.length).toBeGreaterThan(0);
  });
  it('rounds a chart’s top and writes a number in the language', () => {
    expect(niceCeil3(280)).toBe(300);
    expect(niceCeil3(0)).toBe(3);
    setLang('fr');
    expect(num(1.5, 1)).toBe('1,5');
    setLang('en');
    expect(num(1.5, 1)).toBe('1.5');
    expect(num(-0.001, 1)).toBe('0.0');
  });
});
