import { DAY } from './bio';
import { ALARM_TEXTS, type Pair } from './texts';
import type { BioState } from './types';

// What the strip shows: pure data, the lead's `src/lab.ts` translates the pairs. The order is research §5.6's. A value's tag is the state's own: † where a plant was measured, * where none was.

export interface StripRow {
  key: string;
  label: Pair;
  value: string;
  unit: string;
  tag: '†' | '*' | '';
}

export const stripValues = (s: BioState): StripRow[] => {
  const t = s.figureTag;
  const dayGas = s.dayGasL;
  return [
    { key: 'slurryT', label: ['Cuve', 'Tank'], value: s.slurryT.toFixed(1), unit: '°C', tag: t },
    { key: 'pH', label: ['pH', 'pH'], value: s.pH.toFixed(2), unit: '', tag: t },
    { key: 'bell', label: ['Cloche', 'Bell'], value: s.bellUsableLitres.toFixed(0), unit: 'L', tag: t },
    { key: 'pressure', label: ['Pression', 'Pressure'], value: s.pressureMbar.toFixed(2), unit: 'mbar', tag: t },
    { key: 'gas', label: ['Gaz d’hier', 'Yesterday’s gas'], value: dayGas.toFixed(0), unit: 'L', tag: t },
    { key: 'ch4', label: ['Méthane', 'Methane'], value: (s.ch4Share * 100).toFixed(0), unit: '%', tag: t },
    {
      key: 'flame',
      label: ['Flamme d’hier', 'Yesterday’s flame'],
      value: s.dayFlameMin.toFixed(0),
      unit: 'min',
      tag: t,
    },
    { key: 'energy', label: ['Énergie du gaz', 'Energy in the gas'], value: s.dayKWh.toFixed(2), unit: 'kWh', tag: t },
    {
      key: 'lost',
      label: ['Perdu au bord', 'Lost at the rim'],
      value: (s.dayLostShare * 100).toFixed(0),
      unit: '%',
      tag: t,
    },
  ];
};

const pad = (n: number): string => String(n).padStart(2, '0');

/** The clock of the strip: the day since the start and the hour, and the month. */
export const stripClock = (s: BioState): { time: string; day: number; month: number } => {
  const h = Math.floor(s.hour);
  const m = Math.floor((s.hour - h) * 60);
  return { time: `${pad(h)}:${pad(m)}`, day: Math.floor(s.simTime / DAY) + 1, month: s.month };
};

export const stripAlarms = (s: BioState): { key: string; label: Pair; severe: boolean }[] =>
  s.alarms.map((key) => ({ key, label: ALARM_TEXTS[key].text, severe: ALARM_TEXTS[key].severe }));
