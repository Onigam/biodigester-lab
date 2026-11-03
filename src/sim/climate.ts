// The four places (research §2.6): monthly air, K47, as `input`; monthly sun on the horizontal, from the same API and the same grid cells, read for this role (PVGIS 5.3, PVGIS-ERA5, 2016-2020, H(h)_m,
// the air it returned equal to K47 at all four). Grid cells, not stations. Nothing here is a measurement at a digester, and the three places other than Dar es Salaam have no measured plant at all.

export type SiteId = 'dar-es-salaam' | 'pune' | 'marseille' | 'geneva';

export interface Site {
  id: SiteId;
  /** Degrees, north positive. */
  latitude: number;
  /** Mean air by month, °C. reported (K47). */
  air: readonly number[];
  /** Sun on the horizontal by month, kWh/m² in the month. reported (PVGIS). */
  sunMonth: readonly number[];
}

export const SITES: Record<SiteId, Site> = {
  'dar-es-salaam': {
    id: 'dar-es-salaam',
    latitude: -6.8,
    air: [28.0, 28.0, 27.8, 26.2, 25.5, 25.1, 24.6, 24.7, 25.3, 26.1, 26.7, 27.2],
    sunMonth: [191.3, 183.7, 187.3, 139.6, 140.3, 149.1, 159.9, 174.9, 191.2, 203.4, 193.9, 193.8],
  },
  pune: {
    id: 'pune',
    latitude: 18.52,
    air: [22.0, 24.3, 26.5, 28.9, 28.8, 25.0, 23.2, 22.8, 23.4, 24.1, 22.9, 21.7],
    sunMonth: [162.8, 166.9, 204.8, 212.1, 215.0, 133.5, 103.7, 107.3, 121.6, 143.4, 151.2, 144.2],
  },
  marseille: {
    id: 'marseille',
    latitude: 43.3,
    air: [9.8, 10.2, 12.0, 14.6, 17.6, 21.6, 24.5, 24.3, 21.2, 17.2, 13.1, 10.6],
    sunMonth: [57.9, 80.1, 136.2, 171.5, 203.4, 218.6, 229.4, 199.8, 146.8, 101.2, 61.3, 50.7],
  },
  geneva: {
    id: 'geneva',
    latitude: 46.2,
    air: [1.7, 3.3, 6.0, 10.9, 13.8, 18.2, 20.9, 20.4, 16.3, 10.9, 5.7, 2.7],
    sunMonth: [43.5, 64.9, 111.8, 155.2, 167.2, 174.8, 190.6, 167.5, 118.7, 81.9, 49.5, 36.7],
  },
};

export const SITE_IDS = Object.keys(SITES) as SiteId[];

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const;
const YEAR = 365;

/** Day of the year of the middle of a month, 1 to 12, from 0. */
export const midMonth = (month: number): number => MONTH_START[month - 1]! + MONTH_DAYS[month - 1]! / 2;

/** The month of a day of the year, 1 to 12. */
export function monthOf(day: number): number {
  const d = ((day % YEAR) + YEAR) % YEAR;
  let m = 11;
  while (m > 0 && d < MONTH_START[m]!) m--;
  return m + 1;
}

/** A monthly series read between mid-months, on a closed year. */
export function monthlyAt(series: readonly number[], day: number): number {
  const d = ((day % YEAR) + YEAR) % YEAR;
  let hi = 0;
  while (hi < 12 && midMonth(hi + 1) <= d) hi++;
  const lo = (hi + 11) % 12;
  const next = hi % 12;
  const from = midMonth(lo + 1);
  let to = midMonth(next + 1);
  if (to <= from) to += YEAR;
  const at = d < from ? d + YEAR : d;
  const w = (at - from) / (to - from);
  return series[lo]! * (1 - w) + series[next]! * w;
}

/** kWh/m² per day from kWh/m² per month, by month. */
export const sunDaily = (site: Site): number[] => site.sunMonth.map((v, i) => v / MONTH_DAYS[i]!);

/** The year's mean of a monthly series, by days. */
export function yearMean(series: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += series[i]! * MONTH_DAYS[i]!;
  return s / YEAR;
}

/** Terms of the sun's path for one day, kept from one step to the next. */
export interface DaySun {
  /** The day they were computed for. */
  day: number;
  sinSin: number;
  cosCos: number;
  /** Hours of day, half-arc in radians, and the integral of sin(altitude) over the day, hours. */
  halfArc: number;
  integral: number;
  /** kWh/m² of the day, the share of it that is diffuse. */
  daily: number;
  diffuse: number;
}

export const newDaySun = (): DaySun => ({
  day: -1,
  sinSin: 0,
  cosCos: 1,
  halfArc: 0,
  integral: 1,
  daily: 0,
  diffuse: 0.5,
});

const SOLAR_CONSTANT = 1367;

/**
 * The day's sun. Cooper's declination; the extraterrestrial day; the clearness of the month's irradiation; Page's diffuse share (1961, usual, not read here). The same day's shape for any month: a month's
 * mean day, with no cloud of its own.
 */
export function readDaySun(out: DaySun, site: Site, daily: readonly number[], day: number): void {
  const n = Math.floor(day);
  if (out.day === n) return;
  out.day = n;
  const decl = ((23.45 * Math.PI) / 180) * Math.sin((2 * Math.PI * (284 + n + 1)) / YEAR);
  const lat = (site.latitude * Math.PI) / 180;
  out.sinSin = Math.sin(lat) * Math.sin(decl);
  out.cosCos = Math.cos(lat) * Math.cos(decl);
  const c = Math.max(-1, Math.min(1, -out.sinSin / out.cosCos));
  out.halfArc = Math.acos(c);
  out.integral = (24 / Math.PI) * (out.cosCos * Math.sin(out.halfArc) + out.halfArc * out.sinSin);
  out.daily = monthlyAt(daily, day);
  const e0 = 1 + 0.033 * Math.cos((2 * Math.PI * (n + 1)) / YEAR);
  const h0 = (SOLAR_CONSTANT * e0 * out.integral) / 1000;
  const clearness = out.integral > 0 ? out.daily / h0 : 0;
  out.diffuse = Math.max(0.15, Math.min(1, 1 - 1.13 * clearness));
}

/** Sine of the sun's altitude at an hour. */
export const sinAltitude = (s: DaySun, hour: number): number =>
  s.sinSin + s.cosCos * Math.cos(((hour - 12) * Math.PI) / 12);

/** Sun on the horizontal at an hour, W/m². Integrates over the day to the day's kWh/m² (tested). */
export function horizontalSun(s: DaySun, hour: number): number {
  const sinAlt = sinAltitude(s, hour);
  return sinAlt > 0 && s.integral > 0 ? (s.daily * 1000 * sinAlt) / s.integral : 0;
}
