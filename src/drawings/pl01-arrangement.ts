import { COLORS, Drawing, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { BELL, BUCKET, FEED, OVERFLOW, PAD, PALLET, TANK, YARD } from '../three/dims';
import { PLANT_1000 } from '../sim/machine';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, note } from './draw';
import { sideView } from './machine-view';

// PL-B01: the yard from above at 1:100, the plant from the side at 1:25. A generic yard: nothing in the plan is a measured place, and every length of it carries its star. The plant's heights are the thesis's, read from dims.ts.

export const ITEMS = [
  'biogas-plant',
  'kitchen-house',
  'yard-pad',
  'water-butt',
  'overflow-bucket',
  'vegetable-bed',
  'shade-tree',
  'compost-heap',
  'scrap-caddy',
  'hose-run',
] as const;

const TURN = Math.atan2(YARD.kitchenZ, -YARD.kitchenX);

/** A point of the plant's own frame, turned towards the kitchen as the yard turns it, in the plan's model millimetres. */
const local = (x: number, z: number): Pt => {
  const c = Math.cos(TURN);
  const s = Math.sin(TURN);
  return [mm(YARD.padX + x * c + z * s), mm(-(YARD.padZ - x * s + z * c))];
};
const P = (x: number, z: number): Pt => [mm(x), mm(-z)];

function plan(d: Drawing): void {
  const v = d.view(14 + 10.5 * 10, 26 + 12.5 * 10, 1 / 100);
  v.rect(P(YARD.x0, YARD.z0), P(YARD.x1, YARD.z1), { w: W.medium, fill: FILL.earth });
  // house and kitchen
  const hxC = YARD.kitchenX + 2.3;
  const hz1 = YARD.kitchenZ - YARD.kitchenD;
  v.rect(P(hxC - YARD.houseW / 2, hz1 - YARD.houseD), P(hxC + YARD.houseW / 2, hz1), { w: W.medium, fill: FILL.tank });
  v.rect(P(YARD.kitchenX - YARD.kitchenW / 2, hz1), P(YARD.kitchenX + YARD.kitchenW / 2, YARD.kitchenZ), {
    w: W.medium,
    fill: FILL.timber,
  });
  // the pad, turned
  const pad: Pt[] = [
    local(-PAD.halfX, -PAD.halfZ),
    local(PAD.halfX, -PAD.halfZ),
    local(PAD.halfX, PAD.halfZ),
    local(-PAD.halfX, PAD.halfZ),
  ];
  v.polyline(pad, { w: W.medium, fill: FILL.tank, closed: true });
  v.circle(local(0, 0), mm(TANK.outerR), { w: W.medium, fill: FILL.black });
  v.circle(local(0, 0), mm(BELL.outerR), { w: W.thin, color: COLORS.paper });
  v.circle(local(FEED.riserX, 0), mm(FEED.funnelR), { w: W.thin, fill: FILL.pipe });
  v.circle(local(OVERFLOW.elbowX, 0), mm(BUCKET.rTop), { w: W.thin, fill: FILL.pipe });
  v.circle(local(YARD.buttX, YARD.buttZ), mm(YARD.buttR), { w: W.thin, fill: FILL.cold });
  v.circle(local(YARD.caddyX, YARD.caddyZ), mm(0.13), { w: W.thin, fill: FILL.green });
  // the hose to its sleeve, by the low point at the foot of the wall
  const sleeve: [number, number] = [YARD.kitchenX - 0.72, YARD.kitchenZ];
  v.polyline([local(-0.25, -0.09), P(sleeve[0], sleeve[1] + 0.4), P(sleeve[0], sleeve[1])], {
    w: W.medium,
    color: COLORS.copper,
  });
  // beds, compost, tree
  for (let b = 0; b < 3; b++) {
    const x0 = YARD.bedX + b * (YARD.bedW + YARD.bedGap);
    v.rect(P(x0, YARD.bedZ), P(x0 + YARD.bedW, YARD.bedZ + YARD.bedL), { w: W.thin, fill: FILL.green });
  }
  v.rect(P(YARD.compostX - 0.8, YARD.compostZ - 0.7), P(YARD.compostX + 0.8, YARD.compostZ + 0.7), {
    w: W.thin,
    fill: FILL.timber,
  });
  v.circle(P(YARD.treeX, YARD.treeZ), mm(2.4), { w: W.thin, dash: 'hidden', color: COLORS.muted });
  v.circle(P(YARD.treeX, YARD.treeZ), mm(0.35), { w: W.thin, fill: FILL.timber });
  // north
  v.line(P(YARD.x1 - 0.8, YARD.z1 - 2), P(YARD.x1 - 0.8, YARD.z1 - 0.8), { w: W.thin });
  v.text(P(YARD.x1 - 0.8, YARD.z1 - 2.5), 'N', { size: 2, anchor: 'middle', weight: 'bold' });
  // labels
  v.leader(local(0, 0), 44, 8, l('installation', 'plant'), { size: 1.9 });
  v.leader(P(YARD.kitchenX, hz1 + 1.2), -34, 4, l('cuisine', 'kitchen'), { size: 1.9 });
  v.leader(P(hxC - 2, hz1 - 3), -8, -12, l('maison', 'house'), { size: 1.9 });
  v.leader(P(YARD.treeX, YARD.treeZ), 8, 26, l('arbre d’ombre', 'shade tree'), { size: 1.9 });
  v.leader(P(YARD.compostX, YARD.compostZ), 12, 16, l('compost', 'compost'), { size: 1.9 });
  v.leader(P(YARD.bedX + 1.5, YARD.bedZ + 0.6), 20, -18, l('potager', 'vegetable bed'), { size: 1.9 });
  v.leader(local(YARD.buttX, YARD.buttZ), 26, -2, l('réserve d’eau', 'water butt'), { size: 1.9 });
  v.leader(local(YARD.caddyX, YARD.caddyZ), -26, 22, l('seau à déchets', 'scrap caddy'), { size: 1.9 });
  v.leader(local(OVERFLOW.elbowX, 0), 30, 20, l('seau de trop-plein', 'overflow bucket'), { size: 1.9 });
  v.leader(P(sleeve[0], sleeve[1] + 0.9), -40, 12, cat(l('conduite, ', 'hose, '), '5 m'), { size: 1.9 });
  // dimensions, all stars
  v.dim(P(YARD.x0, YARD.z1), P(YARD.x1, YARD.z1), 7, { dir: 'h', label: mL(YARD.x1 - YARD.x0, '*', 1), size: 1.8 });
}

function elevation(d: Drawing): void {
  const v = d.view(322, 180, 1 / 25);
  sideView(v, { rise: BELL.travel, limiter: true, ground: true });
  const lvl = PLANT_1000.overflowLevel;
  const yGround = -mm(PALLET.h + TANK.wall + PAD.h);
  v.line([mm(-1.45), yGround], [mm(1.4), yGround], { w: W.thick });
  const x = mm(PAD.halfX);
  v.dim([x, 0], [x, mm(TANK.height)], 8, { dir: 'v', label: mL(TANK.height, ''), size: 1.8 });
  v.dim([mm(TANK.outerR), 0], [mm(TANK.outerR), mm(lvl)], 19, { dir: 'v', label: mL(lvl, ''), size: 1.8 });
  v.dim([mm(-TANK.outerR), mm(-0.02)], [mm(TANK.outerR), mm(-0.02)], 14, {
    dir: 'h',
    label: mL(PLANT_1000.tankOuterDiameter, '', 2),
    size: 1.8,
  });
  const top = BELL.restRim + BELL.travel + BELL.height;
  v.dim([mm(-BELL.outerR), mm(top)], [mm(BELL.outerR), mm(top)], -6, {
    dir: 'h',
    label: mL(PLANT_1000.bellOuterDiameter, ''),
    size: 1.8,
  });
  v.dim([mm(-PAD.halfX), 0], [mm(-PAD.halfX), mm(top)], -10, { dir: 'v', label: fig('topAtFull'), size: 1.8 });
}

export const arrangementSheet: DrawingSheet = {
  id: 'general-arrangement',
  number: 'PL-B01',
  group: 'plant',
  title: l('La cour et l’installation', 'The yard and the plant'),
  description: lf(
    'À gauche, la cour vue du dessus, générique : aucune de ses cotes n’est celle d’un lieu mesuré, toutes portent leur étoile. À droite, l’installation de côté, la cloche pleine, au bout de ses 0,69 m de course. Les hauteurs de la cuve et du trop-plein sont celles de la thèse, sans marque ; le haut de la cloche, {topAtFull}, repose sur notre lecture de son repos.',
    'On the left, the yard from above, generic: none of its dimensions is that of a measured place, and all carry their star. On the right, the plant from the side, the bell full, at the end of its 0.69 m of travel. The heights of the tank and the overflow are the thesis’s, with no mark; the top of the bell, {topAtFull}, rests on our reading of its rest.',
  ),
  scene: 'yard',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La cour et l’installation', 'The yard and the plant'),
      subtitle: l('Plan à 1:100, élévation à 1:25', 'Plan at 1:100, elevation at 1:25'),
      number: 'PL-B01',
      scale: '1:100 · 1:25',
    });
    heading(d, 14, 14, cat(l('LA COUR, VUE DU DESSUS', 'THE YARD, FROM ABOVE'), ' 1:100'));
    plan(d);
    heading(d, 240, 14, cat(l('L’INSTALLATION, CLOCHE PLEINE', 'THE PLANT, BELL FULL'), ' 1:25'));
    elevation(d);
    let y = marksLegend(d, 240, 200, 76);
    y = note(
      d,
      240,
      y,
      76,
      l(
        'Une cour de climat chaud. Le limiteur, en pointillé, vient d’une autre construction.',
        'A warm-climate yard. The limiter, in phantom line, comes from another build.',
      ),
      { size: 1.75 },
    );
    grid(
      d,
      322,
      200,
      [
        { label: l('Rapporté', 'Reported'), w: 50 },
        { label: l('Valeur', 'Value'), w: 34, align: 'end', mono: true },
      ],
      [
        [l('Emprise', 'Footprint'), l('environ 2 m²', 'about 2 m²')],
        [l('Hauteur annoncée', 'Height announced'), l('2,5 m', '2.5 m')],
        [l('Soleil direct', 'Direct sun'), l('7,5 h', '7.5 h')],
        [l('Tuyau', 'Hose'), '5 m'],
      ],
      { size: 1.75 },
    );
    return d;
  },
};
