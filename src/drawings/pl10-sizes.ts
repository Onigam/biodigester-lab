import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { DRUM_60, PLANT_1000, PLANT_1100, PLANT_1500, SCHOOL_4000, type MachineSpec } from '../sim/machine';
import { FILL, grid, heading, marksLegend, mm, note } from './draw';

// PL-B10: the other sizes, to the same scale: the 60 L drum, this plant, the size chosen later, the Guatemala build, the school's plant, each drawn from its own spec in src/sim/machine.ts. Each with its feed and its gas where anyone gave them. A preset changes only the figures in the 3D: this sheet is where the other sizes are seen.

export const ITEMS = ['biogas-plant'] as const;

const star = (x: number, digits = 2, unit = ' m'): L => l(`${nFr(x, digits)}${unit}*`, `${nEn(x, digits)}${unit}*`);

function outline(d: Drawing, x: number, y: number, m: MachineSpec, name: L): void {
  const v = d.view(x, y, 1 / 20);
  const R = m.tankOuterDiameter / 2;
  const lvl = m.overflowLevel;
  v.rect([mm(-R), 0], [mm(R), mm(m.tankHeight)], { w: W.medium, fill: FILL.black });
  v.rect([mm(-m.tankInnerRadius), 0], [mm(m.tankInnerRadius), mm(lvl)], { w: W.thin, fill: FILL.liquor });
  const b = m.bellOuterDiameter / 2;
  if (m.id === 'drum-60') {
    // a bag lies beside the drum: no bell
    v.rect([mm(R + 0.05), 0], [mm(R + 0.05 + 2 * b), mm(m.bellHeight)], { w: W.thin, fill: FILL.gas });
  } else {
    const rim = m.bellRestRim + m.bellTravel * 0.5;
    v.rect([mm(-b), mm(rim)], [mm(b), mm(rim + m.bellHeight)], { w: W.medium, fill: FILL.gas });
    v.line([mm(-m.tankInnerRadius), mm(lvl)], [mm(m.tankInnerRadius), mm(lvl)], { w: W.thin, color: COLORS.water });
  }
  d.paper().text([x, y + 5], name, { size: 1.9, anchor: 'middle', baseline: 'middle', weight: 'bold' });
}

export const sizesSheet: DrawingSheet = {
  id: 'size-comparison',
  number: 'PL-B10',
  group: 'limits',
  title: l('Les autres tailles', 'The other sizes'),
  description: lf(
    'Cinq machines à la même échelle, chacune tracée depuis ses propres cotes dans la simulation : le bidon de 60 L, cette installation, la taille que son installateur a ensuite choisie, la construction du Guatemala, et les cuves d’école. Dans la 3D et la Simulation, ces tailles changent les chiffres sans changer le dessin : c’est ici qu’on les voit. Le tableau ne rapporte que ce que quelqu’un a donné, et marque ce qui est estimé ; la plupart ne viennent pas d’une mesure sur cette installation.',
    'Five machines to one scale, each traced from its own dimensions in the simulation: the 60 L drum, this plant, the size its installer later chose, the build from Guatemala, and the school’s tanks. In the 3D and the Simulation these sizes change the figures without changing the drawing: this is where they are seen. The table only reports what someone gave, and marks what is estimated; most do not come from a measurement on this plant.',
  ),
  scene: 'yard',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Les autres tailles', 'The other sizes'),
      subtitle: l('Cinq machines à la même échelle, 1:20', 'Five machines to one scale, 1:20'),
      number: 'PL-B10',
      scale: '1:20',
    });
    heading(d, 14, 14, l('À LA MÊME ÉCHELLE', 'TO ONE SCALE'));
    const y = 188;
    d.paper().line([14, y], [406, y], { w: W.thin });
    outline(d, 30, y, DRUM_60, l('Bidon de 60 L', '60 L drum'));
    outline(d, 112, y, PLANT_1000, l('1 000 et 750 L', '1,000 and 750 L'));
    outline(d, 186, y, PLANT_1500, l('1 500 et 1 000 L', '1,500 and 1,000 L'));
    outline(d, 266, y, PLANT_1100, l('1 100 et 750 L', '1,100 and 750 L'));
    outline(d, 362, y, SCHOOL_4000, l('4 000 et 3 000 L', '4,000 and 3,000 L'));
    const top = y + 10;
    grid(
      d,
      14,
      top,
      [
        { label: l('Machine', 'Machine'), w: 58 },
        { label: l('Cuve, Ø, hauteur', 'Tank, Ø, height'), w: 42, align: 'end', mono: true },
        { label: l('Cloche ou poche', 'Bell or bag'), w: 50, align: 'end', mono: true },
        { label: l('Gaz stocké', 'Gas stored'), w: 28, align: 'end', mono: true },
        { label: l('Nourriture', 'Food'), w: 40, align: 'end', mono: true },
        { label: l('Ce qu’on en a', 'What is known'), w: 172 },
      ],
      [
        [
          l('Bidon de 60 L, Low-tech Lab', '60 L drum, Low-tech Lab'),
          l('estimés', 'estimated'),
          l('poche de 150 L', '150 L bag'),
          '150 L',
          l('2 L/jour', '2 L a day'),
          lf(
            'tenu à 38 °C sur un tapis ; le modèle lui donne {drumLitres} par jour, {drumMinutes} par kilo et un pH de {drumPH}, sans voir l’ammoniac',
            'held at 38 °C on a mat; the model gives it {drumLitres} a day, {drumMinutes} per kilo and a pH of {drumPH}, without seeing the ammonia',
          ),
        ],
        [
          l('1 000 et 750 L, ce lab', '1,000 and 750 L, this lab'),
          l('1,04 ; 1,25 m', '1.04; 1.25 m'),
          l('0,90 ; 1,30 m', '0.90; 1.30 m'),
          '400 L',
          '2 kg + 18 L',
          l(
            'mesuré quatre mois à Dar es Salaam : 289 L par jour sur des restes',
            'measured four months at Dar es Salaam: 289 L a day on leftovers',
          ),
        ],
        [
          l('1 500 et 1 000 L, choisie ensuite', '1,500 and 1,000 L, chosen later'),
          l('1,15 ; 1,73 m', '1.15; 1.73 m'),
          l('1,10 ; 1,29 m', '1.10; 1.29 m'),
          '756 L',
          l('non donnée', 'not given'),
          l(
            'peut couler entièrement, écart de 5 cm ; aucune mesure de gaz lue',
            'can sink all the way, a gap of 5 cm; no gas measurement read',
          ),
        ],
        [
          l('1 100 et 750 L, Guatemala', '1,100 and 750 L, Guatemala'),
          l('1,20 m ; hauteur calculée', '1.20 m; height computed'),
          l('1,06 m ; hauteur calculée', '1.06 m; height computed'),
          star(PLANT_1100.bellTravel * Math.PI * PLANT_1100.bellGasRadius ** 2 * 1000, 0, ' L'),
          l('non donnée', 'not given'),
          l('une construction, sans mesure', 'a build, with no measurement'),
        ],
        [
          l('4 000 et 3 000 L, une école', '4,000 and 3,000 L, a school'),
          cat2(star(SCHOOL_4000.tankOuterDiameter), star(SCHOOL_4000.tankHeight)),
          cat2(star(SCHOOL_4000.bellOuterDiameter), star(SCHOOL_4000.bellHeight)),
          l('2 300 L', '2,300 L'),
          l('8 kg + 60 L', '8 kg + 60 L'),
          lf(
            'mesuré : environ 17,5 % perdus à l’anneau, 98 L par kilo humide ; le modèle, {schoolYield}',
            'measured: about 17.5 % lost at the ring, 98 L per wet kilo; the model, {schoolYield}',
          ),
        ],
      ],
      { size: 1.9, pad: 1 },
    );
    // the tall tanks stand to the right: what explains the sheet goes in the air over the small ones
    marksLegend(d, 14, 50, 124);
    note(
      d,
      144,
      51,
      150,
      l(
        'Dessinées à mi-course. Les autres tailles n’ont pas de 3D : le dessin de la Simulation reste celui de 1 000 L.',
        'Drawn at mid-travel. The other sizes have no 3D: the Simulation’s drawing stays that of the 1,000 L.',
      ),
      { size: 2 },
    );
    return d;
  },
};

function cat2(a: L, b: L): L {
  return l(`${a.fr} ; ${b.fr}`, `${a.en}; ${b.en}`);
}
