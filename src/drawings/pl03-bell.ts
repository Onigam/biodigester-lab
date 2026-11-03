import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { bellArea, bellPressure, coveredArea, openShare, PLANT_1000, surfaceArea } from '../sim/machine';
import { BELL, FEED, MARKS, TANK } from '../three/dims';
import { nEn, nFr } from '../data/units';
import { cat, fig, FILL, grid, heading, marksLegend, mm, note } from './draw';

// PL-B03: the bell and its open ring: the areas in plan, the scale, the weight and the pressure along the travel from the simulation's own function, and what the brick does. The pressure's curve is the model's, the readings are the thesis's.

export const ITEMS = ['gas-bell', 'gas-space', 'rim-gap', 'scale-marks', 'half-brick', 'float-limiter'] as const;

/** The pressure along the travel, mbar, read from the simulation's function, with and without the half-brick. */
export function pressureCurve(added: number): { rise: number; mbar: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    const rise = (BELL.travel * i) / 23;
    return { rise, mbar: bellPressure(PLANT_1000, rise, added) / 100 };
  });
}

function planRing(d: Drawing): void {
  const v = d.view(72, 90, 1 / 10);
  v.circle([0, 0], mm(TANK.outerR), { w: W.medium, fill: FILL.black });
  v.circle([0, 0], mm(TANK.innerR), { w: W.medium, fill: FILL.liquor });
  v.circle([0, 0], mm(BELL.outerR), { w: W.medium, fill: FILL.black });
  v.circle([0, 0], mm(BELL.innerR), { w: W.thin, fill: FILL.gas });
  v.circle([0, 0], mm(BELL.gasR), { w: W.thin, dash: 'hidden', color: COLORS.water });
  v.circle([mm(FEED.riserX), 0], mm(FEED.ro), { w: W.thin, fill: FILL.pipe });
  v.dimRadius([0, 0], mm(TANK.innerR), 200, {
    label: l(`r ${nFr(TANK.innerR * 100, 1)} cm`, `r ${nEn(TANK.innerR * 100, 1)} cm`),
    size: 1.8,
  });
  v.leader([mm(BELL.gasR * 0.7), mm(BELL.gasR * 0.7)], 32, -24, l('rayon du gaz, 0,43 m', 'gas radius, 0.43 m'), {
    size: 1.8,
  });
  v.leader(
    [mm((TANK.innerR + BELL.outerR) / 2) * Math.cos(-0.7), mm((TANK.innerR + BELL.outerR) / 2) * Math.sin(-0.7)],
    24,
    22,
    l('anneau ouvert, 22 %', 'open rim, 22 %'),
    { size: 1.8 },
  );
}

function pressureChart(d: Drawing, x: number, y: number, w: number, h: number): void {
  const p = d.paper();
  const maxP = 6;
  const X = (rise: number): number => x + (rise / BELL.travel) * w;
  const Y = (mbar: number): number => y + h - (mbar / maxP) * h;
  p.rect([x, y], [x + w, y + h], { w: W.thin, fill: COLORS.paper });
  for (let m = 0; m <= maxP; m++) {
    p.line([x, Y(m)], [x + w, Y(m)], { w: 0.1, color: COLORS.muted });
    p.text([x - 1.5, Y(m)], String(m), { size: 1.7, anchor: 'end', baseline: 'middle', mono: true });
  }
  const line = (added: number, color: string): void => {
    p.polyline(
      pressureCurve(added).map((c): [number, number] => [X(c.rise), Y(c.mbar)]),
      { w: W.medium, color },
    );
  };
  line(0, COLORS.ink);
  line(12, COLORS.copper);
  // the readings: 2 and 4 mbar, as read on the gauge
  p.line([x, Y(2)], [x + w, Y(2)], { w: W.thin, dash: 'hidden', color: COLORS.red });
  p.line([x, Y(4)], [x + w, Y(4)], { w: W.thin, dash: 'hidden', color: COLORS.red });
  p.text([x + 2, Y(2) + 2], l('lu : 2 mbar', 'read: 2 mbar'), { size: 1.7, color: COLORS.red, baseline: 'top' });
  p.text([x + 2, Y(4) + 2], l('lu : 4 mbar', 'read: 4 mbar'), { size: 1.7, color: COLORS.red, baseline: 'top' });
  p.text([x + w - 1, Y(1.6)], l('cloche seule†', 'bell alone†'), { size: 1.7, anchor: 'end', baseline: 'top' });
  p.text([x + w - 1, Y(5.9)], l('avec le demi-parpaing†', 'with the half-brick†'), {
    size: 1.7,
    anchor: 'end',
    baseline: 'top',
    color: COLORS.copper,
  });
  p.text([x + w / 2, y + h + 5], l('course de la cloche', 'the bell’s travel'), {
    size: 1.7,
    anchor: 'middle',
    baseline: 'middle',
  });
  p.text([x, y + h + 2.4], '0', { size: 1.7, mono: true, anchor: 'middle', baseline: 'middle' });
  p.text([x + w, y + h + 2.4], l('0,69 m', '0.69 m'), { size: 1.7, mono: true, anchor: 'end', baseline: 'middle' });
  p.text([x - 1.5, y - 2.4], 'mbar', { size: 1.7, anchor: 'end', baseline: 'middle' });
}

function scale(d: Drawing, x: number, y: number): void {
  const p = d.paper();
  const k = 1 / 5; // 1:5
  const stepH = mm((MARKS.per100 * MARKS.stepLitres) / 100) * k;
  p.rect([x, y - stepH * 20], [x + 10, y], { w: W.thin, fill: FILL.black });
  for (let i = 0; i <= 20; i++) {
    const yy = y - i * stepH;
    const long = i % 5 === 0;
    p.line([x, yy], [x + (long ? 10 : 5), yy], { w: W.thin, color: COLORS.paper });
    if (long) p.text([x + 12, yy], `${i * MARKS.stepLitres} L`, { size: 1.7, baseline: 'middle', mono: true });
  }
}

export const bellSheet: DrawingSheet = {
  id: 'bell-and-rim',
  number: 'PL-B03',
  group: 'plant',
  title: l('La cloche et son anneau', 'The bell and its ring'),
  description: lf(
    'En plan, ce que la cloche couvre et ce qu’elle laisse : 22 % de la surface, par l’aire, et non par une mesure de gaz. Au milieu, l’échelle de la thèse à 1:5. À droite, la pression le long de la course : les courbes viennent du modèle, avec sa paroi estimée, les lignes rouges de la lecture sur le manomètre. Le demi-parpaing ajoute {brickMbar}. Le modèle trouve {pressureRest} à {pressureFull} sans poids, là où le manomètre a lu 2 mbar à chaque essai.',
    'In plan, what the bell covers and what it leaves: 22 % of the surface, by area, and not by any measurement of gas. In the middle, the thesis’s scale at 1:5. On the right, the pressure along the travel: the curves come from the model, with its estimated wall, the red lines from the reading on the gauge. The half-brick adds {brickMbar}. The model finds {pressureRest} to {pressureFull} with no weight, where the gauge read 2 mbar at every test.',
  ),
  scene: 'digester',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La cloche et son anneau', 'The bell and its ring'),
      subtitle: l('Aires, échelle, poids et pression', 'Areas, scale, weight and pressure'),
      number: 'PL-B03',
      scale: '1:10 · 1:5',
    });
    heading(d, 14, 14, cat(l('EN PLAN', 'IN PLAN'), ' 1:10'));
    planRing(d);
    heading(d, 166, 14, cat(l('L’ÉCHELLE', 'THE SCALE'), ' 1:5'));
    scale(d, 172, 168);
    heading(d, 214, 14, l('LA PRESSION, LE LONG DE LA COURSE', 'THE PRESSURE, ALONG THE TRAVEL'));
    pressureChart(d, 224, 28, 172, 74);
    const n = (x: number, digits: number): ReturnType<typeof l> => l(nFr(x, digits), nEn(x, digits));
    const y = 112;
    grid(
      d,
      14,
      160,
      [
        { label: l('Aire', 'Area'), w: 56 },
        { label: l('Rapporté', 'Reported'), w: 30, align: 'end', mono: true },
        { label: l('Calculé', 'Computed'), w: 30, align: 'end', mono: true },
      ],
      [
        [
          l('Surface de la bouillie', 'Slurry’s surface'),
          l('0,83 m²', '0.83 m²'),
          cat(n(surfaceArea(PLANT_1000), 3), ' m²†'),
        ],
        [
          l('Couverte par la cloche', 'Covered by the bell'),
          l('0,65 m²', '0.65 m²'),
          cat(n(coveredArea(PLANT_1000), 3), ' m²†'),
        ],
        [l('Part ouverte', 'Open share'), '22 %', cat(n(openShare(PLANT_1000) * 100, 1), ' %†')],
        [l('Aire du gaz', 'Gas’s area'), l('0,58 m²', '0.58 m²'), cat(n(bellArea(PLANT_1000), 3), ' m²†')],
      ],
      { size: 1.8 },
    );
    grid(
      d,
      224,
      y + 6,
      [
        { label: l('La cloche', 'The bell'), w: 90 },
        { label: l('Valeur', 'Value'), w: 40, align: 'end', mono: true },
      ],
      [
        [l('Mesuré : 400 L sur la course', 'Measured: 400 L over the travel'), l('0,69 m', '0.69 m')],
        [l('Mesuré : pour 100 L', 'Measured: per 100 L'), l('17,25 cm', '17.25 cm')],
        [l('Par le calcul, pour 100 L', 'By the sum, per 100 L'), fig('markCalc')],
        [l('Reste quand elle est posée', 'Left when resting'), fig('trappedL')],
        [l('Poids utile pour 2 mbar', 'Useful weight for 2 mbar'), fig('weightFor2')],
        [l('Le demi-parpaing, 12 kg', 'The half-brick, 12 kg'), fig('brickMbar')],
        [l('100 L brûlés, à 2 mbar', '100 L burnt, at 2 mbar'), l('22,3 min', '22.3 min')],
        [l('100 L brûlés, à 4 mbar', '100 L burnt, at 4 mbar'), l('12,1 min', '12.1 min')],
        [l('Soit, en débit', 'As a flow'), cat(fig('flow2'), ' ; ', fig('flow4'))],
        [
          l('Le modèle, de mi-course', 'The model, from mid-travel'),
          cat(fig('minutesMid'), ' ; ', fig('minutesBrick')),
        ],
        [l('Débit, mesuré', 'Flow, measured'), fig('flowRatio')],
        [l('Débit, par un orifice', 'Flow, by an orifice'), fig('orificeRatio')],
      ],
      { size: 1.8 },
    );
    grid(
      d,
      14,
      198,
      [
        { label: l('La fuite sur un an, à 17,5 %', 'The leak over a year, at 17.5 %'), w: 86 },
        { label: l('kg CO₂e', 'kg CO₂e'), w: 30, align: 'end', mono: true },
      ],
      [
        [l('Méthane perdu', 'Methane lost'), fig('leakCo2')],
        [l('Gaz en bouteille remplacé', 'Bottled gas replaced'), fig('lpgCo2')],
        [l('Équilibre, part perdue', 'Balance, share lost'), fig('rimBreakEven')],
      ],
      { size: 1.75 },
    );
    marksLegend(d, 136, 198, 84);
    note(
      d,
      14,
      227,
      210,
      lf(
        'Sa paroi plongée est portée par la bouillie, et elle sort à mesure que la cloche monte : d’où la pente des courbes, qui ne vient pas d’un réglage. Elle repose sur une paroi de {bellWall}, déduite de la cuve, et aucune source ne pèse la cloche. Le manomètre, gradué jusqu’à 60 mbar, a lu 2 mbar à dix essais : il ne dit rien de plus fin. L’équilibre de la fuite ignore ce que les déchets auraient émis ailleurs, le charbon et le bois, et son facteur pour le gaz en bouteille est de mémoire.',
        'Its dipped wall is carried by the slurry, and comes out as the bell rises: hence the slope of the curves, which comes from no setting. It rests on a wall of {bellWall}, derived from the tank, and no source weighs the bell. The gauge, marked up to 60 mbar, read 2 mbar at ten tests: it says nothing finer. The leak’s balance ignores what the scraps would have emitted elsewhere, and charcoal and wood, and its factor for bottled gas is from memory.',
      ),
      { size: 1.85 },
    );
    return d;
  },
};
