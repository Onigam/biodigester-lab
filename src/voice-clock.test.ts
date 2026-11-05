import { readManifest, type NarrationSegment } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { BiodigesterSim } from './sim/engine';
import { DEFAULT_TIME_SCALE } from './sim/presets';
import { nextHold, shownSun, HELD_SUN, HOLD_FALL, HOLD_LIGHT_FROM, HOLD_RISE } from './three/yard/sky';
import {
  holdClockForTelling,
  isDaylight,
  isNight,
  LIT_WORLDS,
  nightFrom,
  RUSH,
  SPEAKS_OF_NIGHT,
  type VoiceClockVoice,
} from './voice-clock';

// The clock under what is being told (docs/qa.md, M1), on the real simulation and the real manifests, with the voice's state played by hand.

const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [/\/audio\/(\w+)\//.exec(path)![1]!, readManifest(raw).manifest!],
  ),
);
const sources = import.meta.glob('./three/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

const seg = (lang: string, id: string): NarrationSegment => manifests[lang]!.segments.find((s) => s.id === id)!;

type Rig = {
  sim: BiodigesterSim;
  voice: { state: VoiceClockVoice['state'] };
  frame: (n?: number) => void;
  ui: { scene: string; mode: string; selected: string | null };
};

const clockTo = (sim: BiodigesterSim, hour: number): void => {
  (sim as unknown as { plant: { setClock(day: number, hour: number): void } }).plant.setClock(288, hour);
  sim.set({ timeScale: DEFAULT_TIME_SCALE });
};

/** The opening plant at the given hour, at the speed the lab opens on, in the yard. */
function rig(hour: number): Rig {
  const sim = new BiodigesterSim();
  clockTo(sim, hour);
  const voice = { state: { status: 'idle', segment: null, position: 0, suspended: false } as VoiceClockVoice['state'] };
  const ui = { scene: 'yard', mode: 'explore', selected: null as string | null };
  const hook = holdClockForTelling(voice, sim, () => ui);
  const frame = (n = 1): void => {
    for (let i = 0; i < n; i++) {
      sim.step(1 / 60);
      hook();
    }
  };
  return { sim, voice, frame, ui };
}

const speak = (r: Rig, s: NarrationSegment, position = 0): void => {
  Object.assign(r.voice.state, { status: 'playing', segment: s, position, suspended: false });
};

describe('the clock under what is being told', () => {
  const yard = seg('fr', 'scene-yard');

  it('holds only the worlds whose light follows the hour', () => {
    const readers = Object.entries(sources)
      .filter(([file, text]) => !file.endsWith('.test.ts') && /\bsunAlt\b/.test(text))
      .map(([file]) => /three\/(\w[\w-]*)\//.exec(file)?.[1])
      .filter(Boolean);
    expect([...new Set(readers)].sort()).toEqual([...LIT_WORLDS].sort());

    const r = rig(23);
    r.ui.scene = 'digester';
    speak(r, seg('fr', 'scene-digester'));
    r.frame(30);
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
    expect(r.sim.state.hour).not.toBe(23);
  });

  it('runs while the intro is in a paper world, where it shows the bell rising, and waits for the day when it comes back', () => {
    const r = rig(10);
    speak(r, seg('fr', 'intro'));
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(0);
    r.ui.scene = 'digester';
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
    clockTo(r.sim, 20);
    r.ui.scene = 'yard';
    r.frame();
    expect(r.sim.params.timeScale).toBe(RUSH);
    r.frame(120);
    expect(r.sim.params.timeScale).toBe(0);
    expect(isDaylight(r.sim.state)).toBe(true);
  });

  it('stops by day, at once and where it is, when the sun is already up', () => {
    const r = rig(10);
    speak(r, yard);
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(0);
    const at = r.sim.state.hour;
    r.frame(600);
    expect(r.sim.state.hour).toBe(at);
    expect(at).toBeCloseTo(10, 0);
  });

  it('runs on to the morning from the night, on the simulation’s own steps, then stops', () => {
    const r = rig(23);
    speak(r, yard);
    r.frame();
    expect(r.sim.params.timeScale).toBe(RUSH);
    r.frame(90);
    expect(r.sim.params.timeScale).toBe(0);
    expect(isDaylight(r.sim.state)).toBe(true);
    expect(r.sim.state.sunAlt).toBeGreaterThan(30);
  });

  it('is never more than about 1.4 s from a day to read by, from any hour', () => {
    for (let hour = 0; hour < 24; hour += 0.5) {
      const r = rig(hour);
      speak(r, yard);
      let frames = 0;
      r.frame();
      while (r.sim.params.timeScale !== 0 && frames < 300) {
        r.frame();
        frames++;
      }
      expect(frames / 60, `from ${hour} h`).toBeLessThanOrEqual(1.4);
      expect(isDaylight(r.sim.state), `from ${hour} h`).toBe(true);
    }
  });

  it('gives the speed back when the voice ends, whatever the hour', () => {
    const r = rig(23);
    speak(r, yard);
    r.frame(90);
    const at = r.sim.state.hour;
    r.voice.state.status = 'ended';
    r.frame();
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
    r.frame(60);
    expect(r.sim.state.hour).toBeGreaterThan(at);
  });

  it('stays stopped through a pause of the voice, and goes again from a closed voice', () => {
    const r = rig(10);
    speak(r, yard);
    r.frame(2);
    r.voice.state.status = 'paused';
    r.frame(30);
    expect(r.sim.params.timeScale).toBe(0);
    Object.assign(r.voice.state, { status: 'idle', segment: null });
    r.frame();
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
  });

  it('goes to the night at the sentence that says it, and every part of the segment is named before that', () => {
    for (const lang of ['fr', 'en']) {
      const s = seg(lang, 'scene-yard');
      const night = nightFrom(s);
      const lastFrame = Math.max(...s.cues.filter((c) => 'frame' in c.do).map((c) => c.t));
      expect(lastFrame, lang).toBeLessThan(night);
      const r = rig(10);
      speak(r, s, night - 1);
      r.frame(2);
      expect(r.sim.params.timeScale).toBe(0);
      r.voice.state.position = night;
      r.frame();
      expect(r.sim.params.timeScale).toBe(RUSH);
      r.frame(120);
      expect(r.sim.params.timeScale).toBe(0);
      expect(isNight(r.sim.state)).toBe(true);
      // and the clock goes on from there with the voice's end
      r.voice.state.status = 'ended';
      r.frame();
      expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
    }
  });

  it('waits for the day under a guide opened in the yard, and not under one elsewhere', () => {
    const r = rig(21);
    r.ui.mode = 'install';
    r.frame(120);
    expect(r.sim.params.timeScale).toBe(0);
    expect(isDaylight(r.sim.state)).toBe(true);
    r.ui.scene = 'gas-line';
    r.frame();
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
  });

  it('waits for the day under a part’s sheet in the yard, and gives the clock back when it closes', () => {
    const r = rig(21);
    r.ui.selected = 'hose-run';
    r.frame(120);
    expect(r.sim.params.timeScale).toBe(0);
    expect(isDaylight(r.sim.state)).toBe(true);
    r.ui.selected = null;
    r.frame();
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
  });

  it('leaves the clock to a visitor who chooses a speed, or a scenario, until the next telling', () => {
    const r = rig(10);
    speak(r, yard);
    r.frame(2);
    r.sim.set({ timeScale: 600 });
    r.frame(30);
    expect(r.sim.params.timeScale).toBe(600);
    r.voice.state.status = 'ended';
    r.frame();
    expect(r.sim.params.timeScale).toBe(600);

    speak(r, seg('fr', 'part-hose-run'));
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(0);
    r.sim.applyScenario('overfeed');
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(86400);
  });

  it('keeps a speed the visitor chose when the intro leaves the yard and comes back', () => {
    const r = rig(10);
    speak(r, seg('fr', 'intro'));
    r.frame(2);
    r.sim.set({ timeScale: 600 });
    r.frame(2);
    r.ui.scene = 'digester';
    r.frame(2);
    r.ui.scene = 'yard';
    r.frame(2);
    expect(r.sim.params.timeScale).toBe(600);
  });

  it('leaves the clock alone in the simulation and when the visitor paused it', () => {
    const inSim = rig(23);
    inSim.ui.mode = 'sim';
    speak(inSim, yard);
    inSim.frame(30);
    expect(inSim.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);

    const picked = rig(23);
    picked.ui.mode = 'sim';
    picked.ui.selected = 'hose-run';
    picked.frame(30);
    expect(picked.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);

    const paused = rig(23);
    paused.sim.set({ running: false });
    speak(paused, yard);
    paused.frame(30);
    expect(paused.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
    expect(paused.sim.state.hour).toBe(23);
  });

  it('holds through the guide’s own hop to the simulation, not through the visitor’s', () => {
    const r = rig(10);
    speak(r, seg('fr', 'intro'));
    r.frame(2);
    r.ui.mode = 'sim';
    r.frame(30);
    expect(r.sim.params.timeScale).toBe(0);
    r.voice.state.suspended = true;
    r.frame();
    expect(r.sim.params.timeScale).toBe(DEFAULT_TIME_SCALE);
  });

  it('works with no voice at all', () => {
    const sim = new BiodigesterSim();
    clockTo(sim, 21);
    const hook = holdClockForTelling(null, sim, () => ({ scene: 'yard', mode: 'explore', selected: 'hose-run' }));
    for (let i = 0; i < 120; i++) {
      sim.step(1 / 60);
      hook();
    }
    expect(isDaylight(sim.state)).toBe(true);
  });

  it('ends a day that never reaches 35° at its noon, and finds a night at every site', () => {
    expect(isDaylight({ sunAlt: 6, hour: 12 })).toBe(true);
    expect(isDaylight({ sunAlt: 6, hour: 10 })).toBe(false);
    expect(isDaylight({ sunAlt: 36, hour: 8 })).toBe(true);
    expect(isNight({ sunAlt: -20 })).toBe(true);
    expect(isNight({ sunAlt: -4 })).toBe(false);
    for (const site of ['dar-es-salaam', 'pune', 'marseille', 'geneva'] as const)
      for (const month of [1, 6, 12]) {
        const r = rig(10);
        r.sim.set({ site, month });
        speak(r, yard);
        r.frame(2);
        r.voice.state.position = nightFrom(yard);
        r.frame(240);
        expect(r.sim.params.timeScale, `${site} ${month}`).toBe(0);
        expect(isNight(r.sim.state), `${site} ${month}`).toBe(true);
      }
  });

  describe.each(['fr', 'en'])('in %s', (lang) => {
    it('finds the night in the segment about it, in a sentence of its own, in a world that goes dark', () => {
      for (const id of SPEAKS_OF_NIGHT) {
        const s = seg(lang, id);
        expect(LIT_WORLDS, id).toContain(s.scene);
        const at = nightFrom(s);
        expect(at, id).toBeGreaterThan(0);
        expect(at, id).toBeLessThan(s.duration);
      }
    });

    it('leaves every other segment by day', () => {
      for (const s of manifests[lang]!.segments)
        if (!SPEAKS_OF_NIGHT.includes(s.id)) expect(nightFrom(s), s.id).toBe(Infinity);
    });
  });
});

describe('the yard’s light at a clock too fast for a day', () => {
  it('follows the state exactly up to an hour a second', () => {
    expect(nextHold(0, 1 / 60, { running: true, timeScale: DEFAULT_TIME_SCALE })).toBe(0);
    expect(shownSun(-22.5, 140, 0)).toEqual({ alt: -22.5, az: 140 });
  });

  it('settles on the held sun at a day in 4 s and a day a second, whatever the hour', () => {
    for (const timeScale of [HOLD_LIGHT_FROM, 86400]) {
      let hold = 0;
      for (let i = 0; i < 60 * HOLD_RISE + 2; i++) hold = nextHold(hold, 1 / 60, { running: true, timeScale });
      expect(hold).toBe(1);
      for (const [alt, az] of [
        [80, 170],
        [-60, -120],
      ] as const) {
        const s = shownSun(alt, az, hold);
        expect(s.alt).toBe(HELD_SUN.alt);
        expect(((s.az % 360) + 360) % 360).toBeCloseTo(HELD_SUN.az, 6);
      }
    }
  });

  it('holds still through a whole day a second: the swing the review measured is gone', () => {
    const sim = new BiodigesterSim();
    sim.applyScenario('overfeed');
    let hold = 1;
    const shown: number[] = [];
    const trueAlts: number[] = [];
    for (let i = 0; i < 120; i++) {
      sim.step(1 / 60);
      hold = nextHold(hold, 1 / 60, sim.params);
      shown.push(shownSun(sim.state.sunAlt, sim.state.sunAz, hold).alt);
      trueAlts.push(sim.state.sunAlt);
    }
    for (const alt of shown) expect(alt).toBeCloseTo(HELD_SUN.alt, 6);
    expect(Math.max(...trueAlts) - Math.min(...trueAlts)).toBeGreaterThan(100);
  });

  it('brings the true sun back when the clock is paused or slowed', () => {
    const frames = 60 * HOLD_FALL + 2;
    let hold = 1;
    for (let i = 0; i < frames; i++) hold = nextHold(hold, 1 / 60, { running: false, timeScale: 86400 });
    expect(hold).toBe(0);
    hold = 1;
    for (let i = 0; i < frames; i++) hold = nextHold(hold, 1 / 60, { running: true, timeScale: 600 });
    expect(hold).toBe(0);
  });

  it('never goes through the dark on its way from a late sun to the morning', () => {
    const sim = new BiodigesterSim();
    clockTo(sim, 15.9);
    const voice = {
      state: { status: 'playing', segment: seg('fr', 'scene-yard'), position: 0, suspended: false },
    } as VoiceClockVoice;
    const hook = holdClockForTelling(voice, sim, () => ({ scene: 'yard', mode: 'explore', selected: null }));
    let hold = 0;
    let lowest = 90;
    for (let i = 0; i < 180; i++) {
      sim.step(1 / 60);
      hook();
      hold = nextHold(hold, 1 / 60, sim.params);
      lowest = Math.min(lowest, shownSun(sim.state.sunAlt, sim.state.sunAz, hold).alt);
    }
    expect(sim.params.timeScale).toBe(0);
    // the true sun crosses the whole night under this
    expect(lowest).toBeGreaterThan(20);
  });
});
