import type { SiteId } from './climate';
import { HALF_BRICK, MACHINES, MODEL, type MachineId } from './machine';
import type { BioParams, PresetId, ScenarioId } from './types';

// The starting points and the small scripted situations. The other machines live in the simulation only: the 3D draws one machine, and moves its bell by `bellRiseShare`.

export const PRESET_IDS: PresetId[] = ['plant-1000', 'plant-1500', 'plant-1100', 'school-4000', 'drum-60'];

export const SCENARIO_IDS: ScenarioId[] = [
  'measured-day',
  'market-waste',
  'ramp-to-five',
  'three-days-away',
  'overfeed',
  'half-brick',
  'full-bell',
  'geneva-january',
  'flame-out',
  'water-in-hose',
  'geneva-heated',
  'small-drum',
];

/** The clock opens at an hour per second: a day in 24 s, the bell plainly moving. */
export const DEFAULT_TIME_SCALE = 3600;
/** A minute, ten minutes, an hour, six hours, a day per second. */
export const SPEEDS = [60, 600, 3600, 21600, 86400];

/** The ranges of the sliders. Wide on purpose where the value is an estimate. */
export const RANGES = {
  feedKg: { min: 0, max: 20, step: 0.1 },
  shareCooked: { min: 0, max: 100, step: 5 },
  waterPerKg: { min: 2, max: 15, step: 0.5 },
  flushWater: { min: 0, max: 100, step: 5 },
  cookMinutes: { min: 0, max: 240, step: 5 },
  burnerLph: { min: 100, max: 1000, step: 10 },
  burnerExponent: { min: 0.5, max: 1, step: 0.01 },
  addedWeight: { min: 0, max: 24, step: 1 },
  bellWall: { min: 0, max: 0.01, step: 0.0005 },
  rimLoss: { min: 0, max: 0.3, step: 0.01 },
  hoseWater: { min: 0, max: 400, step: 5 },
  hoseSlope: { min: 0.5, max: 10, step: 0.5 },
  month: { min: 1, max: 12, step: 1 },
  sunHours: { min: 0, max: 12, step: 0.5 },
  wallU: { min: 0.2, max: 5, step: 0.05 },
  heaterW: { min: 0, max: 200, step: 5 },
  setPointT: { min: 15, max: 40, step: 1 },
  kFast: { min: 0.1, max: 0.7, step: 0.01 },
  kSlow: { min: 0.01, max: 0.1, step: 0.005 },
  Ea: { min: 40000, max: 80000, step: 1000 },
  solidsRetention: { min: 1, max: 15, step: 0.5 },
} as const;

export type RangedKey = keyof typeof RANGES;

export function presetParams(id: MachineId): BioParams {
  const m = MACHINES[id];
  return {
    slowMo: 1,
    timeScale: DEFAULT_TIME_SCALE,
    running: true,
    preset: id,
    machine: id,
    feedKg: m.feedKg,
    shareCooked: 50,
    waterPerKg: m.waterPerKg,
    flushWater: 0,
    cookMinutes: 45,
    burner: 'meals',
    burnerLph: m.burnerFlow,
    burnerExponent: 0.5,
    addedWeight: 0,
    bellWall: m.bellWall,
    rimLoss: m.rimLoss,
    hoseWater: 0,
    hoseSlope: MODEL.hoseSlope,
    trap: true,
    site: 'dar-es-salaam',
    month: 10,
    seasons: false,
    sunHours: MODEL.directSunHours,
    wallU: MODEL.wallBare,
    heaterW: 0,
    setPointT: 30,
    fixedT: null,
    kFast: MODEL.kFast,
    kSlow: MODEL.kSlow,
    Ea: MODEL.Ea,
    solidsRetention: m.solidsRetention,
  };
}

/** A change scheduled in a scenario, in simulated days from its start. */
export interface ScheduledEvent {
  day: number;
  patch?: Partial<BioParams>;
  /** A feed, now. */
  feed?: boolean;
  /** Light the burner. */
  light?: boolean;
}

export interface ScenarioSetup {
  params: BioParams;
  /** Days the plant has lived before the start, on the feed of `spinFeed` if there is one. */
  spinUp: number;
  /** What it was fed during those days, if not `params`'. */
  spinFeed?: Partial<BioParams>;
  /** Share of the bell's travel at the start. */
  bellFill: number;
  /** The hour the clock opens on. */
  startHour: number;
  events: ScheduledEvent[];
}

/** What a plant does before a scenario: long enough for the slow pool and the methanogens to find their level. */
export const RUN_IN_DAYS = 150;

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const s = scenarioBase(id);
  return { ...s, params: { ...s.params, preset: 'custom' } };
}

const GENEVA: SiteId = 'geneva';

function scenarioBase(id: ScenarioId): ScenarioSetup {
  const base = presetParams('plant-1000');
  const make = (patch: Partial<BioParams>, more: Partial<ScenarioSetup> = {}): ScenarioSetup => ({
    params: { ...base, ...patch },
    spinUp: RUN_IN_DAYS,
    bellFill: 0.1,
    startHour: 6,
    events: [],
    ...more,
  });
  switch (id) {
    case 'measured-day':
      // two kilos of leftovers, as measured: the bell climbs all day, the meals bring it down
      return make({ shareCooked: 100, cookMinutes: 60 }, { bellFill: 0.3 });
    case 'market-waste':
      return make({ shareCooked: 0, cookMinutes: 15 }, { bellFill: 0.3 });
    case 'ramp-to-five':
      // +0.25 kg/d every three days, in the weeks the thesis took to go from 1 to 5 kg/d
      return make(
        { shareCooked: 100, timeScale: 86400, cookMinutes: 60 },
        {
          events: [
            ...Array.from({ length: 12 }, (_, i) => ({ day: 2 + 3 * i, patch: { feedKg: 2 + 0.25 * (i + 1) } })),
            { day: 38, patch: { cookMinutes: 150 } },
          ],
        },
      );
    case 'three-days-away':
      return make(
        { shareCooked: 100, timeScale: 21600, cookMinutes: 60 },
        {
          events: [
            { day: 2, patch: { feedKg: 0 } },
            { day: 5, patch: { feedKg: 2 } },
          ],
        },
      );
    case 'overfeed':
      // the guests' week: a jump to six times the food, no ramp, and it goes on
      return make(
        { shareCooked: 100, timeScale: 86400, cookMinutes: 60 },
        {
          events: [
            { day: 2, patch: { feedKg: 12 } },
            { day: 16, patch: { feedKg: 0 } },
          ],
        },
      );
    case 'half-brick':
      // a few minutes a second, the burner lit: half a brick goes on the bell
      return make(
        { shareCooked: 100, timeScale: 60, burner: 'on' },
        {
          bellFill: 0.8,
          startHour: 9,
          events: [
            { day: 0, light: true },
            { day: 12 / 1440, patch: { addedWeight: HALF_BRICK } },
          ],
        },
      );
    case 'full-bell':
      // nobody cooks: the bell reaches the top of its travel and the plant's only relief opens
      return make({ shareCooked: 100, timeScale: 7200, cookMinutes: 0 }, { bellFill: 0.5 });
    case 'geneva-january':
      // from September, the seasons running: the same plant and the same two kilos meet the autumn, and January finds what is left
      return make({ site: GENEVA, month: 9, seasons: true, shareCooked: 100, timeScale: 86400, cookMinutes: 30 });
    case 'flame-out':
      // the burner left on until it dies: what stays in the bell?
      return make(
        { shareCooked: 100, timeScale: 300, burner: 'on' },
        { bellFill: 0.5, startHour: 9, events: [{ day: 0, light: true }] },
      );
    case 'water-in-hose':
      // weeks of condensate with no trap, told in steps: each time the same bell, less flame
      return make(
        { shareCooked: 100, timeScale: 3600, trap: false, cookMinutes: 60 },
        {
          bellFill: 0.3,
          events: [
            { day: 2, patch: { hoseWater: 100 } },
            { day: 4, patch: { hoseWater: 200 } },
            { day: 6, patch: { hoseWater: 300 } },
          ],
        },
      );
    case 'geneva-heated':
      return make({
        site: GENEVA,
        month: 1,
        timeScale: 86400,
        wallU: MODEL.wallStraw,
        heaterW: 100,
        setPointT: 30,
        shareCooked: 100,
        cookMinutes: 60,
      });
    case 'small-drum':
      return {
        params: {
          ...presetParams('drum-60'),
          site: GENEVA,
          month: 1,
          timeScale: 86400,
          shareCooked: 50,
          wallU: 1,
          heaterW: 60,
          setPointT: 38,
          cookMinutes: 20,
        },
        spinUp: RUN_IN_DAYS,
        bellFill: 0.2,
        startHour: 6,
        events: [],
      };
  }
}
