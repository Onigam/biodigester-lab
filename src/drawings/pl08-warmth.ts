import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { GENEVA_MONTHS, GENEVA_TABLE, HEAT_TABLE } from '../data/figures';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { arrhenius } from '../sim/bio';
import { SITES, SITE_IDS } from '../sim/climate';
import { cat, FILL, grid, heading, marksLegend, note } from './draw';

// PL-B08: warmth and time: the rate against temperature for four activation energies (the one thing that decides a Geneva winter), four climates, a year at Geneva, the heat budget. The curves come from the simulation's own function, the tables from docs/physics.md, and figures.test.ts holds them against the runs. Everything here but the climate table is the model where no plant was measured.

export const ITEMS = ['digester-tank', 'clear-liquor', 'gas-bell'] as const;

const MONTH_NAMES: Record<string, L> = {
  Jul: l('Juil', 'Jul'),
  Aug: l('Août', 'Aug'),
  Sep: l('Sep', 'Sep'),
  Oct: l('Oct', 'Oct'),
  Nov: l('Nov', 'Nov'),
  Dec: l('Déc', 'Dec'),
  Jan: l('Jan', 'Jan'),
  Feb: l('Fév', 'Feb'),
  Mar: l('Mars', 'Mar'),
  Apr: l('Avr', 'Apr'),
  May: l('Mai', 'May'),
  Jun: l('Juin', 'Jun'),
};

const n = (x: number, digits = 0): L => l(nFr(x, digits), nEn(x, digits));

function curves(d: Drawing, x: number, y: number, w: number, h: number): void {
  const p = d.paper();
  const Tmin = 5;
  const Tmax = 40;
  const kMax = 2.4;
  const X = (T: number): number => x + ((T - Tmin) / (Tmax - Tmin)) * w;
  const Y = (k: number): number => y + h - (k / kMax) * h;
  p.rect([x, y], [x + w, y + h], { w: W.thin, fill: COLORS.paper });
  for (let T = 10; T <= 40; T += 5) {
    p.line([X(T), y], [X(T), y + h], { w: 0.1, color: COLORS.muted });
    p.text([X(T), y + h + 2.6], `${T}`, { size: 1.75, anchor: 'middle', baseline: 'middle', mono: true });
  }
  for (const k of [0.5, 1, 1.5, 2]) {
    p.line([x, Y(k)], [x + w, Y(k)], { w: 0.1, color: COLORS.muted });
    p.text([x - 1.5, Y(k)], n(k, 1), { size: 1.75, anchor: 'end', baseline: 'middle', mono: true });
  }
  // what no plant has been measured below
  p.rect([x, y], [X(25), y + h], { w: W.thin, fill: FILL.added, opacity: 0.45 });
  p.text([X(15), y + 2], l('aucune mesure trouvée', 'no measurement found'), {
    size: 1.75,
    anchor: 'middle',
    baseline: 'top',
    color: COLORS.muted,
  });
  const eas: [number, string, number][] = [
    [40, COLORS.muted, 1.03],
    [44, COLORS.red, 1.0],
    [60, COLORS.ink, 1.0],
    [80, COLORS.copper, 1.0],
  ];
  for (const [ea, color] of eas) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 50; i++) {
      const T = Tmin + ((Tmax - Tmin) * i) / 50;
      pts.push([X(T), Y(Math.min(kMax, arrhenius(T, ea * 1000)))]);
    }
    p.polyline(pts, { w: ea === 44 ? W.thick : W.medium, color });
    p.text(
      [
        X(37.2) + (ea === 40 ? 4.5 : ea === 44 ? -10 : ea === 60 ? -3 : -13),
        Y(Math.min(kMax, arrhenius(37.2, ea * 1000))) + (ea === 40 ? 3.5 : ea === 44 ? 3 : -2),
      ],
      `${ea}*`,
      { size: 1.75, color, mono: true, baseline: 'middle' },
    );
  }
  p.text([x + w / 2, y + h + 6], '°C', { size: 1.75, anchor: 'middle', baseline: 'middle' });
  p.text([x, y - 2.5], l('vitesse, 1 à 30 °C', 'rate, 1 at 30 °C'), { size: 1.75, baseline: 'middle' });
}

export const warmthSheet: DrawingSheet = {
  id: 'warmth-and-time',
  number: 'PL-B08',
  group: 'limits',
  title: l('La chaleur et le temps', 'Warmth and time'),
  description: lf(
    'Une question que le modèle ne tranche pas : sur 2 kg par jour, une cuve nue à Genève tient jusqu’à {eaHolds} et tourne dès {eaFails}, et le seul indice trouvé tombe vers {eaClue}. À gauche, la vitesse selon la température pour quatre énergies d’activation, en zone ombrée sous 25 °C, où nous n’avons trouvé aucune mesure. À droite, les quatre climats, sourcés, puis une année à Genève et le bilan de chaleur, tous deux du modèle seul.',
    'A question the model does not decide: on 2 kg a day, a bare tank at Geneva holds up to {eaHolds} and sours from {eaFails}, and the one clue found stands near {eaClue}. On the left, the rate against temperature for four activation energies, shaded below 25 °C, where we found no measurement. On the right, the four climates, sourced, then a year at Geneva and the heat budget, both from the model alone.',
  ),
  scene: 'digester',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La chaleur et le temps', 'Warmth and time'),
      subtitle: l(
        'La vitesse, quatre climats, une année à Genève, le bilan de chaleur',
        'The rate, four climates, a year at Geneva, the heat budget',
      ),
      number: 'PL-B08',
      scale: '—',
    });
    heading(d, 14, 14, l('LA VITESSE, SELON L’ÉNERGIE D’ACTIVATION', 'THE RATE, BY THE ACTIVATION ENERGY'));
    curves(d, 26, 30, 142, 92);
    let y = note(
      d,
      14,
      136,
      154,
      lf(
        'Le chiffre décide de l’hiver, en kJ/mol. Le seul indice, {eaClue}, vient du résumé d’une étude sur une boue adaptée : l’activité à 11 °C y vaut environ la moitié de celle à 22 °C. Le réglage d’ouverture est {eaDefault}. Notre réglage n’est pas une mesure, et nous n’en avons trouvé aucune pour ces déchets.',
        'This figure decides the winter, in kJ/mol. The one clue, {eaClue}, comes from the summary of a study on an adapted sludge: activity at 11 °C there is about half that at 22 °C. The opening setting is {eaDefault}. Our setting is no measurement, and we found none for this waste.',
      ),
      { size: 1.85 },
    );
    y = marksLegend(d, 14, y + 1, 154);
    grid(
      d,
      14,
      y + 1,
      [
        { label: l('Tenue à 30 °C, un jour moyen, kWh', 'Held at 30 °C, a mean day, kWh'), w: 56 },
        { label: l('Eau', 'Water'), w: 12, align: 'end', mono: true },
        { label: l('Murs', 'Walls'), w: 13, align: 'end', mono: true },
        { label: l('Soleil', 'Sun'), w: 14, align: 'end', mono: true },
        { label: l('Demandé', 'Asked'), w: 20, align: 'end', mono: true },
        { label: 'W', w: 14, align: 'end', mono: true },
      ],
      HEAT_TABLE.map((r) => [
        l(r.fr, r.en),
        cat(n(r.feed, 2), '*'),
        cat(n(r.wall, r.wall < 10 ? 2 : 1), '*'),
        cat(n(r.sun, 2), '*'),
        { t: cat(n(r.need, r.need < 10 ? 2 : 1), '*'), bold: true },
        cat(n(r.watts), '*'),
      ]),
      { size: 1.7 },
    );
    const x = 176;
    grid(
      d,
      x,
      14,
      [
        { label: l('Air, °C, moyennes 2016-2020', 'Air, °C, means 2016-2020'), w: 42 },
        ...GENEVA_MONTHS.slice(6)
          .concat(GENEVA_MONTHS.slice(0, 6))
          .map((m) => ({ label: MONTH_NAMES[m]!, w: 14.6, align: 'end' as const, mono: true })),
        { label: l('An', 'Yr'), w: 14.6, align: 'end' as const, mono: true },
      ],
      SITE_IDS.map((id) => {
        const s = SITES[id];
        const names: Record<string, L> = {
          'dar-es-salaam': l('Dar es Salaam', 'Dar es Salaam'),
          pune: l('Pune', 'Pune'),
          marseille: l('Marseille', 'Marseille'),
          geneva: l('Genève', 'Geneva'),
        };
        return [names[id]!, ...s.air.map((t) => n(t, 1)), n(s.air.reduce((a, b) => a + b, 0) / 12, 1)];
      }),
      { size: 1.62 },
    );
    grid(
      d,
      x,
      46,
      [
        { label: l('Genève, 2 kg par jour de restes, L par jour', 'Geneva, 2 kg a day of leftovers, L a day'), w: 56 },
        ...GENEVA_MONTHS.map((m) => ({ label: MONTH_NAMES[m]!, w: 14.4, align: 'end' as const, mono: true })),
      ],
      GENEVA_TABLE.map((r) => [
        { t: l(r.fr, r.en), bold: r.key === 'ea44' },
        ...r.rows.map((v) => (v === 0 ? { t: '0', color: COLORS.red } : { t: n(v) })),
      ]),
      { size: 1.68, pad: 1 },
    );
    note(
      d,
      x,
      116,
      230,
      lf(
        'Tous ces chiffres sont le modèle seul, chacun avec son étoile : {heatStraw} demandés en paille, contre {gasEnergyCold} dans le gaz et environ {gasUsefulCold} au sortir d’un brûleur. Il paie donc sa chaleur de juin à septembre, en paille, et jamais à nu. Le départ à chaud en juillet, ici, fait tourner la cuve un mois plus tôt que dans le scénario de la Simulation, qui a vécu depuis avril sous ce climat : la date dépend de son histoire. En dessous d’environ 10 °C, même la loi de vitesse est une extrapolation.',
        'All these figures are the model alone, each with its star: {heatStraw} asked in straw, against {gasEnergyCold} in the gas and about {gasUsefulCold} out of a burner. So it pays for its warmth from June to September, in straw, and never bare. The warm start in July here sours the tank a month sooner than in the Simulation’s scenario, which has lived on this climate since April: the date depends on its history. Below about 10 °C even the law of the rate is an extrapolation.',
      ),
      { size: 1.85 },
    );
    grid(
      d,
      x,
      144,
      [
        { label: l('Une cuve tenue à, °C', 'A tank held at, °C'), w: 56 },
        { label: '32', w: 26, align: 'end', mono: true },
        { label: '25', w: 26, align: 'end', mono: true },
        { label: '20', w: 26, align: 'end', mono: true },
        { label: '15', w: 26, align: 'end', mono: true },
      ],
      [
        [
          l('Un saut tourne dès, par jour', 'A jump sours from, a day'),
          lf('{jump32}', '{jump32}'),
          lf('{jump25}', '{jump25}'),
          lf('{jump20}', '{jump20}'),
          lf('{jump15}', '{jump15}'),
        ],
        [
          l('Une montée lente porte', 'A slow ramp carries'),
          lf('{rampAt32}', '{rampAt32}'),
          lf('{ramp25}', '{ramp25}'),
          lf('{ramp20}', '{ramp20}'),
          lf('{ramp15}', '{ramp15}'),
        ],
      ],
      { size: 1.7 },
    );
    note(
      d,
      x,
      168,
      190,
      lf(
        'Ces seuils sortent d’un modèle à un seul volume : il est au-dessus des {bookLimit} du livre, et des {bookLimitHigh} d’une étude voisine, et une cuve réelle s’acidifie plus tôt près de son entrée. Ses {rampAt32} ne sont pas à croire.',
        'These thresholds come from a one-volume model: it stands above the book’s {bookLimit}, and a neighbouring study’s {bookLimitHigh}, and a real tank turns sour sooner near its inlet. Its {rampAt32} is not to be believed.',
      ),
      { size: 1.75 },
    );
    return d;
  },
};
