import { STATE_TAGS } from '../sim/tags';
import type { BioState } from '../sim/types';
import { sx, type PanelKey } from './strings';

// What the panel shows, as plain functions of the state: a test checks the numbers and the status line without a browser. A figure's mark is the state's own word for it (src/sim/tags.ts), so the panel cannot give one a better name than the simulation does.

export type Mark = '' | '†' | '*';

/** No mark: reported, or a clock. † arithmetic. A model result takes the state's mark of the moment, * an estimate. */
export function markOf(key: keyof BioState, s: BioState): Mark {
  const word = STATE_TAGS[key];
  if (word === 'derived') return '†';
  if (word === 'estimate') return '*';
  if (word === 'model') return s.figureTag;
  return '';
}

export interface Readout {
  key: PanelKey;
  value: number;
  digits: number;
  unit: string | PanelKey;
  mark: Mark;
}

const r = (
  s: BioState,
  key: PanelKey,
  of: keyof BioState,
  value: number,
  digits: number,
  unit: Readout['unit'],
): Readout => ({ key, value, digits, unit, mark: markOf(of, s) });

/** The few live figures that stay in sight. */
export function mainReadouts(s: BioState): Readout[] {
  return [
    r(s, 'liveTank', 'slurryT', s.slurryT, 1, '°C'),
    r(s, 'livePH', 'pH', s.pH, 2, ''),
    r(s, 'liveBell', 'bellUsableLitres', s.bellUsableLitres, 0, 'L'),
    r(s, 'livePressure', 'pressureMbar', s.pressureMbar, 2, 'mbar'),
    r(s, 'liveGas', 'dayGasL', s.dayGasL, 0, 'L'),
    r(s, 'liveCH4', 'ch4Share', s.ch4Share * 100, 0, '%'),
    r(s, 'liveFlame', 'dayFlameMin', s.dayFlameMin, 0, 'min'),
    r(s, 'liveEnergy', 'dayKWh', s.dayKWh, 2, 'kWh'),
    r(s, 'liveRatio', 'acidRatio', s.acidRatio, 2, ''),
  ];
}

/** The rest, folded. */
export function moreReadouts(s: BioState): Readout[] {
  return [
    r(s, 'moreAir', 'airT', s.airT, 1, '°C'),
    r(s, 'moreLoad', 'loadingRate', s.loadingRate, 2, 'unitLoad'),
    r(s, 'moreSun', 'sunG', s.sunG, 0, 'W/m²'),
    r(s, 'moreAcids', 'acidsGL', s.acidsGL, 2, 'g/L'),
    r(s, 'moreBuffer', 'alkalinityMeq', s.alkalinityMeq, 1, 'meq/L'),
    r(s, 'moreMethanogens', 'methanogensGL', s.methanogensGL, 2, 'g/L'),
    r(s, 'moreKFactor', 'kFactor', s.kFactor, 2, '×'),
    r(s, 'moreHydrolysis', 'hydrolysisActivity', s.hydrolysisActivity * 100, 0, '%'),
    r(s, 'moreMethanogenActivity', 'methanogenActivity', s.methanogenActivity * 100, 0, '%'),
    r(s, 'moreHrt', 'hrtDays', s.hrtDays, 1, 'unitDays'),
    r(s, 'moreSrt', 'srtDays', s.srtDays, 0, 'unitDays'),
    r(s, 'moreStock', 'stockVS', s.stockVS, 1, 'kg'),
    r(s, 'moreScum', 'scumHeight', s.scumHeight * 100, 1, 'cm'),
    r(s, 'moreSludge', 'sludgeHeight', s.sludgeHeight * 100, 1, 'cm'),
    r(s, 'moreBellIn', 'bubblesBellLph', s.bubblesBellLph, 1, 'L/h'),
    r(s, 'moreRim', 'bubblesRimLph', s.bubblesRimLph, 1, 'L/h'),
    r(s, 'moreOver', 'overflowLph', s.overflowLph, 1, 'L/h'),
    r(s, 'moreLost', 'dayLostShare', s.dayLostShare * 100, 0, '%'),
    r(s, 'moreCO2', 'co2Share', s.co2Share * 100, 0, '%'),
    r(s, 'moreVapour', 'vapourShare', s.vapourShare * 100, 1, '%'),
    r(s, 'moreTrapped', 'bellTrappedLitres', s.bellTrappedLitres, 0, 'L'),
    r(s, 'moreBurner', 'burnerLph', s.burnerLph, 0, 'L/h'),
    r(s, 'moreBurnerP', 'burnerMbar', s.burnerMbar, 2, 'mbar'),
    r(s, 'moreHoseDrop', 'hoseDropMbar', s.hoseDropMbar, 2, 'mbar'),
    r(s, 'morePlug', 'waterPlugMbar', s.waterPlugMbar, 2, 'mbar'),
    r(s, 'morePower', 'flamePowerW', s.flamePowerW, 0, 'W'),
    r(s, 'moreUseful', 'usefulPowerW', s.usefulPowerW, 0, 'W'),
    r(s, 'moreHoseWater', 'hoseWaterMl', s.hoseWaterMl, 0, 'mL'),
    r(s, 'moreTrapWater', 'trapWaterMl', s.trapWaterMl, 0, 'mL'),
    r(s, 'moreEffluent', 'dayEffluentL', s.dayEffluentL, 0, 'L'),
    r(s, 'moreHeater', 'dayHeaterKWh', s.dayHeaterKWh, 2, 'kWh'),
    r(s, 'moreColdFeed', 'dayFeedColdKWh', s.dayFeedColdKWh, 2, 'kWh'),
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says: one message, the most important first. A severe alarm speaks for itself, with why the flame went out if it did. */
export function statusOf(s: BioState): { text: string; tone: Tone } | { key: PanelKey; tone: Tone } {
  const flameOut = s.alarms.includes('flameOutGasLeft');
  if (flameOut) {
    const why = s.flameOutCause === 'none' ? '' : ` ${sx('flameOut', s.flameOutCause)}.`;
    return { text: `${sx('alarm', 'flameOutGasLeft')}.${why}`, tone: 'warn' };
  }
  if (s.alarms.includes('soured')) return { text: `${sx('alarm', 'soured')}.`, tone: 'warn' };
  if (s.alarms.includes('airInBell')) return { text: `${sx('alarm', 'airInBell')}.`, tone: 'warn' };
  if (s.alarms.includes('bellFull')) return { text: `${sx('alarm', 'bellFull')}.`, tone: 'note' };
  if (s.alarms.includes('bellResting')) return { text: `${sx('alarm', 'bellResting')}.`, tone: 'note' };
  if (s.flameOn) return { key: 'statusBurning', tone: 'note' };
  if (s.bubblesBellLph < 0.5) return { key: 'statusQuiet', tone: 'note' };
  return { key: 'statusRising', tone: 'note' };
}

/** The chart's round top: three intervals, each a round number. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const f of [1, 2, 2.5, 5, 10]) if (v <= 3 * f * p) return 3 * f * p;
  return 30 * p;
}
