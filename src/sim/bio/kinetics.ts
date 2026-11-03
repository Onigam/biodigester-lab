// Rates of living things: first-order decay, Arrhenius, Monod, the pH window. Plain functions, no state, no allocation, no lab's name.
// Biological rates are per day, the unit of every source; temperatures in °C; energies in J/mol.

/** Molar gas constant, J/mol·K. */
export const R_GAS = 8.314462618;
/** Seconds in a day. */
export const DAY = 86400;

/** k(T)/k(Tref) by Arrhenius. */
export function arrhenius(T: number, Ea: number, Tref = 30): number {
  return Math.exp((Ea / R_GAS) * (1 / (Tref + 273.15) - 1 / (T + 273.15)));
}

/** The activation energy, J/mol, that gives a ratio of rates between two temperatures. */
export function activationFromRatio(T1: number, T2: number, ratio: number): number {
  return (R_GAS * Math.log(ratio)) / (1 / (T1 + 273.15) - 1 / (T2 + 273.15));
}

/** The share of a first-order pool that goes in a time `dt`: exact at any step. `k` and `dt` in the same time unit. */
export const firstOrderShare = (k: number, dt: number): number => -Math.expm1(-k * dt);

/** Time for a first-order pool to halve. */
export const halfLife = (k: number): number => Math.LN2 / k;

/** Time for a first-order pool to lose a share of what it holds. */
export const timeToShare = (k: number, share: number): number => -Math.log(1 - share) / k;

/** The share converted at steady state, when a pool decays at `k` and leaves at `wash` (a stirred tank's formula): k/(k + wash). */
export const steadyConversion = (k: number, wash: number): number => k / (k + wash);

/** Monod's saturation, 0 to 1. */
export const monod = (S: number, Ks: number): number => (S <= 0 ? 0 : S / (Ks + S));

/** The lower pH limit of an organism, the form used by ADM1: 1 at and above `high`, exp(−3((pH − high)/(high − low))²) below. */
export function pHFactor(pH: number, low: number, high: number): number {
  if (pH >= high) return 1;
  const x = (pH - high) / (high - low);
  return Math.exp(-3 * x * x);
}

/** A window of temperature, 0 to 1: nothing below `coldZero`, full from `coldFull` to `hotFull`, nothing above `hotZero`, straight between. */
export function temperatureWindow(
  T: number,
  coldZero: number,
  coldFull: number,
  hotFull: number,
  hotZero: number,
): number {
  if (T <= coldZero || T >= hotZero) return 0;
  if (T < coldFull) return (T - coldZero) / (coldFull - coldZero);
  if (T > hotFull) return (hotZero - T) / (hotZero - hotFull);
  return 1;
}
