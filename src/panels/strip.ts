import { getLang } from '@onigam/lab-kit/i18n';
import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { BiodigesterSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { stripAlarms as alarmsOf, stripClock as clockOf, stripValues as valuesOf } from '../sim/strip';
import { months, say, st } from './strings';

// What the bottom strip shows: src/sim/strip.ts says what, this says it in the language of the moment. A value's mark follows its unit until the kit's `StripValue` has a tag of its own (docs/kit-requests.md, 4).

export function stripValues(sim: BiodigesterSim): StripValue[] {
  const comma = getLang() === 'fr';
  return valuesOf(sim.state).map((row) => ({
    label: say(row.label),
    value: comma ? row.value.replace('.', ',') : row.value,
    unit: `${row.unit}${row.unit && row.tag ? ' ' : ''}${row.tag}`,
  }));
}

export function stripClock(sim: BiodigesterSim): { time: string; sub: string } {
  const { time, day, month } = clockOf(sim.state);
  return { time, sub: `${st('dayWord')} ${day} · ${months()[month - 1]}` };
}

export function stripAlarms(sim: BiodigesterSim): StripAlarm[] {
  return alarmsOf(sim.state).map((a) => ({ key: a.key, label: say(a.label), severe: a.severe }));
}

export const STRIP_SPEEDS = SPEEDS;
