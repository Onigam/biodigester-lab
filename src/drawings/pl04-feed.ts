import { COLORS, Drawing, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { FITTINGS, PLANT_1000 } from '../sim/machine';
import { BELL, FEED, TANK } from '../three/dims';
import { cat, fig, grid, heading, marksLegend, mL, mm, note } from './draw';
import { sideView, surfaces } from './machine-view';

// PL-B04: the feed and the overflow at two heights of the bell: where each surface stands, from the simulation's own pressure. The thesis's drawing prints 1.06 and 1.04 m: the physicist reads one level from two bases, and the sheet says so. The chain of fittings is the thesis's list and the build manual's, no cut line, no torque.

export const ITEMS = [
  'feed-funnel',
  'feed-riser',
  'feed-tee',
  'clean-out-plug',
  'inner-feed-pipe',
  'tank-connector',
  'overflow-pipe',
] as const;

function levels(d: Drawing, ox: number, oy: number, rise: number): void {
  const v = d.view(ox, oy, 1 / 14);
  sideView(v, { rise });
  const s = surfaces(rise);
  const n = (x: number, digits: number): ReturnType<typeof l> => l(nFr(x, digits), nEn(x, digits));
  v.leader([mm(FEED.riserX), mm(s.ring)], 26, -20, cat(l('colonne ', 'riser '), mL(s.ring, '', 2)), { size: 1.75 });
  v.leader([mm((TANK.innerR + BELL.outerR) / 2), mm(s.ring)], 24, -29, cat(l('anneau ', 'ring '), mL(s.ring, '', 2)), {
    size: 1.75,
  });
  v.leader([0, mm(s.inner)], -24, -18, cat(l('sous la cloche ', 'under the bell '), n(s.inner, 3), ' m†'), {
    size: 1.75,
  });
  v.dim(
    [mm(-BELL.outerR), mm(BELL.restRim + rise + BELL.height)],
    [mm(BELL.outerR), mm(BELL.restRim + rise + BELL.height)],
    -5,
    {
      dir: 'h',
      label: cat(n(s.pressureMbar, 2), ' mbar†'),
      size: 1.75,
      color: COLORS.red,
    },
  );
  v.dim([mm(-TANK.outerR), 0], [mm(-TANK.outerR), mm(PLANT_1000.overflowLevel)], -9, {
    dir: 'v',
    label: mL(PLANT_1000.overflowLevel, ''),
    size: 1.75,
  });
}

export const feedSheet: DrawingSheet = {
  id: 'feed-and-overflow',
  number: 'PL-B04',
  group: 'plant',
  title: l('L’entrée et le trop-plein', 'The inlet and the overflow'),
  description: lf(
    'La même coupe, la cloche au repos et la cloche pleine, avec le niveau de chaque surface. L’anneau et la colonne, tous deux à l’air libre, restent à 1,04 m ; c’est la surface sous la cloche que le gaz abaisse, de {innerDrop} à 2 mbar. Le dessin de la thèse imprime 1,06 m sur la colonne et 1,04 m au trop-plein : nous y lisons un seul niveau, coté depuis deux bases. En bas, la chaîne des raccords, sans cote de découpe ni couple de serrage.',
    'The same section, the bell at rest and the bell full, with the level of each surface. The ring and the riser, both open to the air, stay at 1.04 m; it is the surface under the bell that the gas pushes down, by {innerDrop} at 2 mbar. The thesis’s drawing prints 1.06 m on the riser and 1.04 m at the overflow: we read one level, dimensioned from two bases. Below, the chain of fittings, with no cut line and no torque.',
  ),
  scene: 'digester',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’entrée et le trop-plein', 'The inlet and the overflow'),
      subtitle: l(
        'Les niveaux, cloche au repos et cloche pleine, à 1:14',
        'The levels, bell at rest and bell full, at 1:14',
      ),
      number: 'PL-B04',
      scale: '1:14',
    });
    heading(d, 14, 14, cat(l('CLOCHE AU REPOS', 'BELL AT REST'), ' 1:14'));
    levels(d, 110, 172, 0);
    heading(d, 214, 14, cat(l('CLOCHE PLEINE', 'BELL FULL'), ' 1:14'));
    levels(d, 310, 172, BELL.travel);
    const y0 = 182;
    grid(
      d,
      14,
      y0,
      [
        { label: l('L’entrée, de haut en bas', 'The inlet, from the top down'), w: 62 },
        { label: l('Ce que disent les sources', 'What the sources say'), w: 120 },
      ],
      [
        [
          l('Entonnoir', 'Funnel'),
          l('bouteille coupée (thèse), tôle rivetée (manuel)', 'cut-up bottle (thesis), riveted sheet (manual)'),
        ],
        [
          l('Colonne', 'Riser'),
          l(
            'tube de 3 pouces, 1,80 m pour toute la ligne ; sa patte n’a pas de source',
            '3-inch pipe, 1.80 m for the whole line; its bracket has no source',
          ),
        ],
        [
          l('Té', 'Tee'),
          l(
            '3 pouces ; l’installateur a essayé un coude, la thèse préfère le té',
            '3 inches; the installer tried an elbow, the thesis prefers the tee',
          ),
        ],
        [
          l('Bouchon', 'Plug'),
          l('vissé (manuel) ; vanne de 2 pouces (thèse)', 'screwed (manual); 2-inch valve (thesis)'),
        ],
        [
          l('Traversée', 'Fitting'),
          l(
            'manchons mâle et femelle ; rondelles et silicone (manuel)',
            'male and female sockets; washers and silicone (manual)',
          ),
        ],
        [
          l('Tube intérieur', 'Inner pipe'),
          lf(
            'portée de 0,51 m, axe à {feedAxis} ; sa selle n’a pas de source',
            'reach of 0.51 m, axis at {feedAxis}; its saddle has no source',
          ),
        ],
      ],
      { size: 1.75 },
    );
    grid(
      d,
      214,
      y0,
      [
        { label: l('Le trop-plein', 'The overflow'), w: 50 },
        { label: l('Valeur', 'Value'), w: 34, align: 'end', mono: true },
      ],
      [
        [l('Tube', 'Pipe'), l('2 pouces, 1,00 m', '2 inches, 1.00 m')],
        [l('Fil d’eau', 'Invert'), mL(PLANT_1000.overflowLevel, '')],
        [l('Descente, lue', 'Drop, read'), mL(FITTINGS.overflowDrop, '')],
        [l('Partie horizontale', 'Horizontal run'), fig('overflowRun')],
        [l('Imprimé, côté entrée', 'Printed, inlet side'), mL(FITTINGS.riserLevelDrawn, '')],
      ],
      { size: 1.75 },
    );
    marksLegend(d, 304, y0, 96);
    note(
      d,
      304,
      y0 + 22,
      96,
      l(
        'Le manuel prévient qu’à l’intérieur, le raccord du trop-plein doit laisser passer la cloche. Le rayon de l’entonnoir et la place de la colonne sont les nôtres.',
        'The manual warns that, inside, the overflow’s fitting must let the bell pass. The funnel’s radius and the riser’s place are ours.',
      ),
      { size: 1.75 },
    );
    return d;
  },
};
