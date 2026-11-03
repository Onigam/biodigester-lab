import { Drawing, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, tr } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { lf } from '../data/part-helpers';
import { PLANT_1000 } from '../sim/machine';
import { BELL, FEED, OVERFLOW, TANK, VALVES } from '../three/dims';
import { balloon, cat, fig, grid, heading, marksLegend, mL, mm, note } from './draw';
import { sideView } from './machine-view';

// PL-B02: the digester in section at 1:12.5, the bell at rest. The source's figures carry no mark, our estimates their star: the two tables tell them apart. The balloons are the assembly guide's own step numbers, read from src/data/assembly.ts.

export const ITEMS = [
  'digester-tank',
  'gas-bell',
  'gas-space',
  'rim-gap',
  'feed-funnel',
  'feed-riser',
  'feed-tee',
  'clean-out-plug',
  'inner-feed-pipe',
  'tank-connector',
  'overflow-pipe',
  'gas-tap',
  'bottom-valve',
  'pallet',
  'scum-layer',
  'clear-liquor',
  'sludge-bed',
] as const;

/** The step of the assembly guide that installs a part: its balloon. */
export const stepOf = (id: string): number => ASSEMBLY.findIndex((s) => s.parts.includes(id)) + 1;

const SCALE = 1 / 12.5;
const OX = 118;
const OY = 238;
const px = (x: number): number => OX + mm(x) * SCALE;
const py = (y: number): number => OY - mm(y) * SCALE;

function section(d: Drawing): void {
  const v = d.view(OX, OY, SCALE);
  sideView(v, { rise: 0, layers: true, ground: true });
  const lvl = PLANT_1000.overflowLevel;
  const top = BELL.restRim + BELL.height;
  // dimensions read from dims.ts: reported with no mark, estimates with their star
  v.dim([mm(-TANK.outerR), 0], [mm(-TANK.outerR), mm(TANK.height)], -49, {
    dir: 'v',
    label: mL(TANK.height, ''),
    size: 1.8,
  });
  v.dim([mm(-TANK.outerR), 0], [mm(-TANK.outerR), mm(lvl)], -41, { dir: 'v', label: mL(lvl, ''), size: 1.8 });
  v.dim([mm(BELL.outerR), mm(BELL.restRim)], [mm(BELL.outerR), mm(top)], 44, {
    dir: 'v',
    label: mL(BELL.height, ''),
    size: 1.8,
  });
  v.dim([mm(-TANK.outerR), mm(TANK.height)], [mm(TANK.outerR), mm(TANK.height)], -30, {
    dir: 'h',
    label: mL(PLANT_1000.tankOuterDiameter, ''),
    size: 1.8,
  });
  v.dim([mm(-BELL.outerR), mm(top)], [mm(BELL.outerR), mm(top)], -8, {
    dir: 'h',
    label: mL(PLANT_1000.bellOuterDiameter, ''),
    size: 1.8,
  });
  v.dim([mm(TANK.innerR), mm(FEED.axisY)], [mm(TANK.innerR - FEED.reach), mm(FEED.axisY)], -10, {
    dir: 'h',
    label: mL(FEED.reach, ''),
    size: 1.8,
  });
  v.dim([mm(FEED.riserX + FEED.funnelR), 0], [mm(FEED.riserX + FEED.funnelR), mm(FEED.funnelTop)], 9, {
    dir: 'v',
    label: mL(FEED.funnelTop, ''),
    size: 1.8,
  });
  v.dim(
    [mm(OVERFLOW.elbowX - OVERFLOW.ro), mm(OVERFLOW.axisY - OVERFLOW.drop)],
    [mm(OVERFLOW.elbowX - OVERFLOW.ro), mm(OVERFLOW.axisY)],
    -7,
    { dir: 'v', label: mL(OVERFLOW.drop, ''), size: 1.8 },
  );
  // balloons: the assembly's own numbers
  const place: [string, number, number][] = [
    ['pallet', -0.45, -0.1],
    ['digester-tank', -0.62, 0.12],
    ['tank-connector', TANK.outerR + 0.02, FEED.axisY + 0.1],
    ['inner-feed-pipe', 0.25, FEED.axisY + 0.1],
    ['feed-tee', FEED.riserX + 0.1, FEED.axisY - 0.12],
    ['feed-riser', FEED.riserX, 0.7],
    ['feed-funnel', FEED.riserX, FEED.funnelTop + 0.07],
    ['overflow-pipe', OVERFLOW.elbowX + 0.14, lvl + 0.16],
    ['bottom-valve', -TANK.outerR - 0.12, VALVES.bottomY + 0.2],
    ['clear-liquor', -0.2, 0.55],
    ['gas-bell', -0.34, 1.32],
    ['gas-tap', -0.25, top + 0.14],
  ];
  for (const [id, x, y] of place) balloon(d, px(x), py(y), stepOf(id));
}

export const sectionSheet: DrawingSheet = {
  id: 'digester-section',
  number: 'PL-B02',
  group: 'plant',
  title: l('La cuve en coupe', 'The tank in section'),
  description: lf(
    'La machine coupée le long de son axe, à 1:12,5, la cloche au repos et dessinée droite : son inclinaison, {tiltRest} à {tiltFull}, est une estimation. Les cotes sans marque sont celles que la thèse imprime ; les autres portent leur étoile. Les bulles donnent le numéro de l’étape du guide d’assemblage où chaque pièce arrive. Lue dans le dessin de la thèse, la position de repos de la cloche, {restRim} du fond, est une estimation à l’œil.',
    'The machine cut along its axis, at 1:12.5, the bell at rest and drawn upright: its tilt, {tiltRest} to {tiltFull}, is an estimate. Dimensions with no mark are those the thesis prints; the others carry their star. The balloons give the number of the assembly guide’s step where each part arrives. Read from the thesis’s drawing, the bell’s resting place, {restRim} above the floor, is an estimate by eye.',
  ),
  scene: 'digester',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La cuve en coupe', 'The tank in section'),
      subtitle: l('Le long de l’axe, cloche au repos, à 1:12,5', 'Along the axis, bell at rest, at 1:12.5'),
      number: 'PL-B02',
      scale: '1:12.5',
    });
    heading(d, 14, 14, cat(l('COUPE LE LONG DE L’AXE', 'SECTION ALONG THE AXIS'), ' 1:12.5'));
    section(d);
    const x = 232;
    let y = 16;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Imprimé par la thèse', 'Printed by the thesis'), w: 56 },
        { label: l('Valeur', 'Value'), w: 28, align: 'end', mono: true },
      ],
      [
        [l('Cuve, Ø et hauteur', 'Tank, Ø and height'), l('1,04 ; 1,25 m', '1.04; 1.25 m')],
        [l('Rayon intérieur', 'Inner radius'), l('51,5 cm', '51.5 cm')],
        [l('Cloche, Ø et hauteur', 'Bell, Ø and height'), l('0,90 ; 1,30 m', '0.90; 1.30 m')],
        [l('Trop-plein', 'Overflow'), l('1,04 m', '1.04 m')],
        [l('Bouillie', 'Slurry'), l('environ 850 L', 'about 850 L')],
        [l('Haut de l’entonnoir', 'Funnel’s top'), l('1,18 m', '1.18 m')],
        [l('Tube intérieur, portée', 'Inner pipe, reach'), l('0,51 m', '0.51 m')],
        [l('Descente', 'Drop'), l('0,74 m', '0.74 m')],
        [l('Alimentation', 'Feed'), l('3 pouces, 1,80 m', '3 inches, 1.80 m')],
        [l('Trop-plein, tube', 'Overflow, pipe'), l('2 pouces, 1,00 m', '2 inches, 1.00 m')],
      ],
      { size: 1.7 },
    );
    y += 4;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Estimé ou calculé', 'Estimated or computed'), w: 56 },
        { label: l('Valeur', 'Value'), w: 28, align: 'end', mono: true },
      ],
      [
        [l('Paroi de la cuve', 'Tank’s wall'), fig('tankWall')],
        [l('Volume par la géométrie', 'Volume by the geometry'), fig('litresGeometry')],
        [l('Paroi de la cloche', 'Bell’s wall'), fig('bellWall')],
        [l('Masse de la cloche', 'Bell’s mass'), fig('bellMass')],
        [l('Repos de la cloche', 'Bell’s rest'), fig('restRim')],
        [l('Axe du tube intérieur', 'Inner pipe’s axis'), fig('feedAxis')],
        [l('Place de la colonne', 'Riser’s place'), fig('riserX')],
      ],
      { size: 1.7 },
    );
    marksLegend(d, x, y + 3, 84);
    // the guide's numbers, on the right
    const lx = 322;
    let ly = 16;
    ly = heading(d, lx, ly, l('LE GUIDE D’ASSEMBLAGE', 'THE ASSEMBLY GUIDE'), { size: 2.1 });
    const size = 1.8;
    ASSEMBLY.slice(0, 14).forEach((s, i) => {
      balloon(d, lx + 2.5, ly + 2.2, i + 1);
      d.paper().text([lx + 7, ly + 2.2], tr(s.title), { size, baseline: 'middle' });
      ly += 6.6;
    });
    ly = note(
      d,
      lx,
      ly + 2,
      84,
      l(
        'Aucune source ne donne cet ordre : c’est notre lecture de leurs dessins et de leurs listes. La selle sous le tube intérieur et la patte de la colonne sont des pièces du dessin, sans source.',
        'No source gives this order: it is our reading of their drawings and lists. The saddle under the inner pipe and the riser’s bracket are parts of the drawing, with no source.',
      ),
      { size: 1.75 },
    );
    note(
      d,
      lx,
      ly + 1,
      84,
      l(
        'La couche de boues et celle de croûte suivent les parts de la thèse : dix couches de 85 L, sur un seul prélèvement.',
        'The sludge and scum layers follow the thesis’s shares: ten layers of 85 L, on a single sampling.',
      ),
      { size: 1.75 },
    );
    return d;
  },
};
