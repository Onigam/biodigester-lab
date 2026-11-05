import type { NarrationSegment } from '@onigam/lab-kit/narration';

// The clock under what is being told, in the one world whose light follows the hour (docs/qa.md, M1). At an hour a second the yard's sun went down under the voice: played from a fresh load, `scene-yard` named 4 of
// its 7 parts in the dark. Adapted from the solar heater's src/voice-clock.ts, not copied, because three things differ here:
//   - only `yard` is lit. The tank, the drop and the line are paper, and the voice shows the bell rising there, so the clock runs while the guide is there, even inside a segment that started in the yard (`intro`).
//   - the voice is not the only teller. A guide open in the yard, and a part's sheet open in it, wait for the day too: the review's dark clicks and its installation's night, steps 2 to 10.
//   - only one sentence here is about the night, the end of `scene-yard`, which names no part. Everywhere else « le soir » and « la journée » are in passing, and the night would hide what they point at.
// It reaches the day or the night on the simulation's own steps, never by setting the hour, so the bell and the tank arrive with it, and src/three/yard/scene.ts's `HOLD_LIGHT_FROM` shows no sun racing meanwhile.
// Nothing is left changed: when the telling ends, the clock goes on at the speed it had. The clock stays the visitor's: a speed they choose, a scenario they load, a clock they paused, the simulation mode.

/** The worlds whose light follows the hour: a test holds it to `src/three`. */
export const LIT_WORLDS: readonly string[] = ['yard'];

/** The segments of those worlds that are about the night, for their last sentences. A test holds them to the captions. */
export const SPEAKS_OF_NIGHT: readonly string[] = ['scene-yard'];

/** The modes that walk the parts one by one. */
const GUIDES: readonly string[] = ['assembly', 'install'];

/** How the clock goes from where it is to where the telling needs it: a day in 2 s, half the strip's top speed. From the worst hour, just past the day's end, the next morning is about 16.5 h on, 1.4 s. */
export const RUSH = 43_200;

const NIGHT_WORD = /(?<!\p{L})(?:nuit|night)(?!\p{L})/iu;

/** When the segment's night starts, in seconds: the sentence that first says it. Infinity: it stays by day. */
export function nightFrom(seg: Pick<NarrationSegment, 'id' | 'captions'>): number {
  if (!SPEAKS_OF_NIGHT.includes(seg.id)) return Infinity;
  return seg.captions.find((c) => NIGHT_WORD.test(c.text))?.t0 ?? Infinity;
}

/**
 * The sun high enough to read a part by: from 35° on, about 08:15 to 15:45 at the plant in October, the shadows short of the machine and no warm cast left in the light. Or the middle of a day that never gets there (Geneva in December). Measured in the
 * yard, the picture's mean brightness: docs/qa.md's notes.
 */
export function isDaylight(s: { sunAlt: number; hour: number }): boolean {
  return s.sunAlt >= 35 || (s.hour >= 11 && s.hour <= 13);
}

/** Deep enough for the sky's stars and the moon's light, src/three/yard/sky.ts: its `uNight` is whole at -10°. */
export function isNight(s: { sunAlt: number }): boolean {
  return s.sunAlt <= -10;
}

export interface VoiceClockVoice {
  readonly state: {
    status: string;
    segment: NarrationSegment | null;
    position: number;
    suspended: boolean;
  };
}

export interface VoiceClockSim {
  readonly params: { timeScale: number; running: boolean };
  readonly state: { sunAlt: number; hour: number };
  set(patch: { timeScale: number }): void;
}

/** What the interface shows now. */
export interface VoiceClockView {
  scene: string;
  mode: string;
  selected: string | null;
}

const SPEAKING = new Set(['loading', 'playing', 'paused']);

/** The hook to run once a frame. `voice` is null when the lab has no spoken guide. */
export function holdClockForTelling(
  voice: VoiceClockVoice | null,
  sim: VoiceClockSim,
  view: () => VoiceClockView,
): () => void {
  /** What is being told in the lit world, and the telling the visitor took the clock back from. */
  let told: object | string | null = null;
  let theirsSince: object | string | null = null;
  /** The clock is the visitor's until the next telling. */
  let theirs = true;
  /** The speed this hook last set, and the one it found. */
  let set: number | null = null;
  let found = 0;

  const giveBack = (): void => {
    if (set !== null && sim.params.timeScale === set) sim.set({ timeScale: found });
    set = null;
  };

  return () => {
    const s = voice?.state;
    const v = view();
    const segment = s?.segment && SPEAKING.has(s.status) ? s.segment : null;
    let now: object | string | null = null;
    if (LIT_WORLDS.includes(v.scene)) {
      if (segment) now = segment;
      else if (GUIDES.includes(v.mode)) now = v.mode;
      else if (v.selected && v.mode !== 'sim') now = 'part';
    }
    if (now !== told) {
      giveBack();
      told = now;
      theirs = now === null || now === theirsSince || v.mode === 'sim' || !sim.params.running;
    }
    if (now === null || theirs) return;
    // a speed chosen or a scenario loaded (either changes the speed), or the simulation opened by hand: not the guide's own hop to it
    if ((set !== null && sim.params.timeScale !== set) || (segment && s?.suspended && v.mode === 'sim')) {
      theirs = true;
      theirsSince = now;
      giveBack();
      return;
    }
    const atNight = segment !== null && (s?.position ?? 0) >= nightFrom(segment);
    const reached = atNight ? isNight(sim.state) : isDaylight(sim.state);
    const speed = reached ? 0 : RUSH;
    if (sim.params.timeScale === speed) return;
    if (set === null) found = sim.params.timeScale;
    set = speed;
    sim.set({ timeScale: speed });
  };
}
