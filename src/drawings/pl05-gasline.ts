import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { BASE_Y, BELL, LINE, PAD, TAP } from '../three/dims';
import { box, fig, FILL, grid, heading, marksLegend, mL, mm, note } from './draw';
import { sideView } from './machine-view';

// PL-B05: the gas line as a diagram, no scale, in the order the gas flows. What was on the measured plant has a thick outline; what comes from elsewhere is shaded and dashed. The diagram's words are what each sheet says of its origin.

export const ITEMS = [
  'bell-hose',
  'condensate-trap',
  'hydraulic-relief',
  'h2s-filter',
  'flame-arrester',
  'pressure-gauge',
  'wall-sleeve',
  'kitchen-valve',
  'biogas-burner',
  'primary-air-sleeve',
  'blue-flame',
  'pot-stand',
  'cooking-pot',
  'vent-opening',
  'gas-detector',
] as const;

interface Node {
  name: L;
  measured: boolean;
}

const NODES: Node[] = [
  { name: l('Cloche', 'Bell'), measured: true },
  { name: l('Robinet', 'Tap'), measured: true },
  { name: l('Tuyau souple', 'Hose'), measured: true },
  { name: l('Piège', 'Trap'), measured: false },
  { name: l('Soupape', 'Relief'), measured: false },
  { name: l('Filtre', 'Filter'), measured: false },
  { name: l('Arrête-flamme', 'Arrester'), measured: false },
  { name: l('Manomètre', 'Gauge'), measured: true },
  { name: l('Mur', 'Wall'), measured: false },
  { name: l('Vanne', 'Valve'), measured: false },
  { name: l('Brûleur', 'Burner'), measured: true },
  { name: l('Flamme', 'Flame'), measured: true },
  { name: l('Casserole', 'Pot'), measured: true },
];

function diagram(d: Drawing): void {
  const p = d.paper();
  const x0 = 16;
  const w = 25.4;
  const gap = 4.4;
  const y = 28;
  const h = 18;
  NODES.forEach((n, i) => {
    const x = x0 + i * (w + gap);
    box(d, x, y, w, h, n.name, { fill: n.measured ? COLORS.paper : FILL.added, size: 1.8 });
    if (!n.measured) p.rect([x, y], [x + w, y + h], { w: W.thin, dash: 'hidden', color: COLORS.muted });
    if (i < NODES.length - 1) {
      p.line([x + w, y + h / 2], [x + w + gap - 1, y + h / 2], { w: W.medium, color: COLORS.copper });
      p.polyline(
        [
          [x + w + gap - 1.6, y + h / 2 - 1],
          [x + w + gap, y + h / 2],
          [x + w + gap - 1.6, y + h / 2 + 1],
        ],
        { w: W.medium, color: COLORS.copper },
      );
    }
  });
  // the kitchen starts at the wall
  const xw = x0 + 8 * (w + gap) - gap / 2;
  p.line([xw, y - 9], [xw, y + h + 8], { w: W.thick, dash: 'center', color: COLORS.muted });
  p.text([xw - 2, y - 7], l('dehors', 'outside'), {
    size: 1.8,
    anchor: 'end',
    baseline: 'middle',
    color: COLORS.muted,
  });
  p.text([xw + 2, y - 7], l('une pièce fermée', 'a closed room'), {
    size: 1.8,
    baseline: 'middle',
    color: COLORS.muted,
  });
  // the low point
  const xt = x0 + 3 * (w + gap);
  p.text([xt + w / 2, y + h + 4], l('au point bas', 'at the low point'), {
    size: 1.75,
    anchor: 'middle',
    baseline: 'middle',
  });
  // the rim: the real relief
  p.text([x0 + w / 2, y + h + 4], l('le bord : la vraie soupape', 'the rim: the real relief'), {
    size: 1.75,
    anchor: 'middle',
    baseline: 'middle',
  });
  // the two others in the room
  const xr = x0 + 10 * (w + gap);
  box(d, xr, y + h + 8, w, 11, l('Aération', 'Vent'), { fill: FILL.added, size: 1.75 });
  box(d, xr + w + gap, y + h + 8, w, 11, l('Détecteur', 'Detector'), { fill: FILL.added, size: 1.75 });
}

/** Where the same line stands in the 3D, from dims.ts: the ground at `y0`. Every place and height is an estimate, and only the plant's own sizes are the thesis's: its sheets give them. */
function elevation(d: Drawing, x0: number, y0: number): void {
  const K = 1 / 30;
  const left = LINE.plantX - PAD.halfX;
  const v = d.view(x0 - left * 1000 * K, y0, K);
  const P = (x: number, y: number): [number, number] => [mm(x), mm(y)];
  const roomX1 = LINE.wallX + LINE.wallT + LINE.roomW;
  // the plant, at rest, on its pad: the world's own
  const plant = d.view(x0 + (LINE.plantX - left) * 1000 * K, y0 - (BASE_Y + PAD.h) * 1000 * K, K);
  sideView(plant, { rise: 0, ground: true });
  // the ground and the kitchen's room, cut
  v.line(P(left, 0), P(roomX1 + 0.05, 0), { w: W.medium });
  v.rect(P(LINE.wallX, 0), P(LINE.wallX + LINE.wallT, LINE.roomH), { w: W.medium, fill: FILL.tank });
  v.line(P(LINE.wallX, LINE.roomH), P(roomX1, LINE.roomH), { w: W.thin, dash: 'hidden', color: COLORS.muted });
  v.line(P(roomX1, 0), P(roomX1, LINE.roomH), { w: W.thin, dash: 'hidden', color: COLORS.muted });
  // the hose: from the tap down to the trap, up to the board, along it
  const tapTop = BELL.restRim + BELL.height + BASE_Y + PAD.h + TAP.stem;
  const tapX = LINE.plantX + TAP.x;
  const hose: [number, number][] = [
    P(tapX, tapTop),
    P(tapX + 0.22, tapTop + 0.04),
    P(tapX + 0.5, tapTop - 0.16),
    P(LINE.trapX - 0.28, 0.75),
    P(LINE.trapX - 0.08, LINE.trapY + 0.1),
    P(LINE.trapX + 0.08, LINE.trapY + 0.1),
    P(LINE.trapX + 0.18, 0.75),
    P(LINE.boardX0, LINE.y),
    P(LINE.wallX + LINE.wallT + 0.1, LINE.y),
  ];
  v.polyline(hose, { w: W.medium, color: COLORS.copper });
  // the trap at the low point, the board on its two posts, the devices on it
  v.rect(P(LINE.trapX - 0.06, 0), P(LINE.trapX + 0.06, LINE.trapY + 0.1), { w: W.medium, fill: FILL.added });
  v.rect(P(LINE.boardX0, LINE.y - 0.2), P(LINE.boardX1, LINE.y + 0.2), { w: W.thin, fill: FILL.timber });
  for (const x of [LINE.boardX0 + 0.05, LINE.boardX1 - 0.05])
    v.rect(P(x - 0.03, 0), P(x + 0.03, LINE.y - 0.2), { w: W.thin, fill: FILL.timber });
  v.line(P(LINE.boardX0, LINE.y), P(LINE.boardX1, LINE.y), { w: W.medium, color: COLORS.copper });
  for (const x of [LINE.reliefX, LINE.filterX, LINE.arresterX, LINE.gaugeX])
    v.rect(P(x - 0.07, LINE.y - 0.07), P(x + 0.07, LINE.y + 0.07), { w: W.medium, fill: FILL.added });
  // inside: the valve, the table, the burner and its pot, the vent, the detector
  v.rect(P(LINE.wallX + LINE.wallT + 0.04, LINE.valveY - 0.05), P(LINE.wallX + LINE.wallT + 0.14, LINE.valveY + 0.05), {
    w: W.medium,
    fill: FILL.added,
  });
  const tx0 = LINE.burnerX - LINE.tableW / 2;
  v.rect(P(tx0, LINE.tableH - 0.04), P(tx0 + LINE.tableW, LINE.tableH), { w: W.medium, fill: FILL.timber });
  for (const x of [tx0 + 0.03, tx0 + LINE.tableW - 0.03])
    v.line(P(x, 0), P(x, LINE.tableH - 0.04), { w: W.medium, color: COLORS.muted });
  v.rect(P(LINE.burnerX - LINE.burnerR, LINE.tableH), P(LINE.burnerX + LINE.burnerR, LINE.tableH + LINE.burnerH), {
    w: W.medium,
    fill: FILL.pipe,
  });
  const potY = LINE.tableH + LINE.standH;
  for (const k of [-1, 1])
    v.line(P(LINE.burnerX + k * LINE.potR * 0.8, LINE.tableH), P(LINE.burnerX + k * LINE.potR * 0.8, potY), {
      w: W.medium,
      color: COLORS.muted,
    });
  v.rect(P(LINE.burnerX - LINE.potR, potY), P(LINE.burnerX + LINE.potR, potY + LINE.potH), {
    w: W.medium,
    fill: FILL.tank,
  });
  v.polyline(
    [
      P(LINE.wallX + LINE.wallT + 0.1, LINE.y),
      P(LINE.burnerX - 0.3, LINE.y),
      P(LINE.burnerX - 0.3, LINE.tableH + 0.05),
      P(LINE.burnerX - LINE.burnerR, LINE.tableH + 0.05),
    ],
    {
      w: W.thin,
      color: COLORS.copper,
    },
  );
  v.rect(P(LINE.wallX, LINE.ventY - 0.08), P(LINE.wallX + LINE.wallT, LINE.ventY + 0.08), {
    w: W.thin,
    fill: COLORS.paper,
  });
  v.rect(P(roomX1 - 0.16, LINE.detectorY - 0.05), P(roomX1, LINE.detectorY + 0.05), { w: W.medium, fill: FILL.added });
  // the names, read along the line
  const name = (
    x: number,
    y: number,
    dy: number,
    t: ReturnType<typeof l>,
    anchor: 'start' | 'middle' | 'end' = 'middle',
  ): void => {
    v.line(P(x, y), [mm(x), mm(y) + (dy * 1) / K], { w: 0.1, color: COLORS.muted });
    v.text([mm(x), mm(y) + (dy * 1.15) / K], t, { size: 1.75, anchor, baseline: 'middle' });
  };
  name(LINE.reliefX, LINE.y + 0.2, 9, l('Soupape', 'Relief'));
  name(LINE.filterX, LINE.y + 0.2, 15, l('Filtre', 'Filter'));
  name(LINE.arresterX, LINE.y + 0.2, 9, l('Arrête-flamme', 'Arrester'));
  name(LINE.gaugeX, LINE.y + 0.2, 15, l('Manomètre', 'Gauge'));
  name(LINE.wallX + LINE.wallT + 0.09, LINE.valveY + 0.05, 9, l('Vanne', 'Valve'), 'start');
  name(LINE.burnerX, potY + LINE.potH, 9, l('Brûleur et casserole', 'Burner and pot'));
  name(LINE.wallX + LINE.wallT + 0.04, LINE.ventY + 0.08, 4, l('Aération', 'Vent'), 'start');
  name(roomX1 - 0.02, LINE.detectorY + 0.05, 4, l('Détecteur', 'Detector'), 'end');
  name(LINE.trapX, LINE.trapY + 0.1, 24, l('Piège, au point bas', 'Trap, at the low point'));
  // the heights the eye asks for, all the world's
  v.dim(P(LINE.boardX1, 0), P(LINE.boardX1, LINE.y), 3, { dir: 'v', label: mL(LINE.y, '*'), size: 1.75 });
  v.dim(P(LINE.trapX + 0.06, 0), P(LINE.trapX + 0.06, LINE.trapY + 0.1), 4, {
    dir: 'v',
    label: mL(LINE.trapY + 0.1, '*'),
    size: 1.75,
  });
  v.dim(P(tx0 + LINE.tableW, 0), P(tx0 + LINE.tableW, LINE.tableH), 3, {
    dir: 'v',
    label: mL(LINE.tableH, '*'),
    size: 1.75,
  });
  v.dim(P(roomX1, 0), P(roomX1, LINE.roomH), 3, { dir: 'v', label: mL(LINE.roomH, '*'), size: 1.75 });
  v.dim(P(LINE.wallX + LINE.wallT, LINE.roomH), P(roomX1, LINE.roomH), -3, {
    dir: 'h',
    label: mL(LINE.roomW, '*', 1),
    size: 1.75,
  });
}

export const gasLineSheet: DrawingSheet = {
  id: 'gas-line-schematic',
  number: 'PL-B05',
  group: 'plant',
  title: l('La ligne de gaz', 'The gas line'),
  description: lf(
    'De la cloche à la casserole, sans échelle, dans l’ordre du gaz. Un trait plein : c’était sur l’installation mesurée (le manomètre, pour la recherche seulement). Fond ombré et pointillé : cela vient d’une autre source ou de notre lecture, et les tailles de ces dessins sont les nôtres. Dessous, d’où vient chaque pièce, et ce qui pèse dans la ligne : {hoseDrop} perdus dans le tuyau, et environ {pushCm} d’eau pour toute la poussée de la cloche. En bas, à 1:30, la même ligne telle que la 3D la pose : ces places et ces hauteurs sont les nôtres.',
    'From the bell to the pot, with no scale, in the order of the gas. A full outline: it was on the measured plant (the gauge, for research only). Shaded and dashed: it comes from another source or from our reading, and the sizes of those drawings are ours. Below, where each part comes from, and what weighs in the line: {hoseDrop} lost in the hose, and about {pushCm} of water for the bell’s whole push. At the bottom, at 1:30, the same line as the 3D lays it: those places and heights are ours.',
  ),
  scene: 'gas-line',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La ligne de gaz', 'The gas line'),
      subtitle: l(
        'Dans l’ordre du gaz, sans échelle ; dans la 3D, à 1:30',
        'In the order of the gas, no scale; in the 3D, at 1:30',
      ),
      number: 'PL-B05',
      scale: '— · 1:30',
    });
    heading(d, 14, 14, l('DE LA CLOCHE À LA CASSEROLE', 'FROM THE BELL TO THE POT'));
    diagram(d);
    const hLeft = grid(
      d,
      14,
      74,
      [
        { label: l('Pièce', 'Part'), w: 40 },
        { label: l('Sur l’installation mesurée', 'On the measured plant'), w: 32 },
        { label: l('D’où elle vient', 'Where it comes from'), w: 136 },
      ],
      [
        [
          l('Tuyau, ½ pouce, 5 m', 'Hose, ½ inch, 5 m'),
          l('oui', 'yes'),
          l('la liste de pièces de la thèse', 'the thesis’s parts list'),
        ],
        [
          l('Piège à condensats', 'Condensate trap'),
          l('non', 'no'),
          l(
            'demandé par la thèse après coup ; le livre en décrit deux ; taille estimée',
            'asked for by the thesis afterwards; the book describes two; size estimated',
          ),
        ],
        [
          l('Soupape hydraulique', 'Hydraulic relief'),
          l('non', 'no'),
          lf(
            'notre lecture, profondeur {reliefDepth} ; le modèle n’en a pas',
            'our reading, depth {reliefDepth}; the model has none',
          ),
        ],
        [
          l('Filtre à H₂S', 'H₂S filter'),
          l('non', 'no'),
          l(
            'tutoriel du Low-tech Lab ; un essai de la thèse, non mesurable',
            'the Low-tech Lab’s tutorial; a trial by the thesis, not measurable',
          ),
        ],
        [
          l('Arrête-flamme', 'Flame arrester'),
          l('non', 'no'),
          l('tutoriel du Low-tech Lab ; aucun essai lu', 'the Low-tech Lab’s tutorial; no test read'),
        ],
        [
          l('Manomètre, 0 à 60 mbar', 'Gauge, 0 to 60 mbar'),
          l('recherche seulement', 'research only'),
          l('la thèse', 'the thesis'),
        ],
        [l('Fourreau du mur', 'Wall sleeve'), l('sans source', 'no source'), l('notre lecture', 'our reading')],
        [
          l('Vanne, ½ pouce', 'Valve, ½ inch'),
          l('non', 'no'),
          l(
            'le manuel de construction ; à fermer quand la flamme s’éteint',
            'the build manual; to be closed when the flame goes out',
          ),
        ],
        [
          l('Brûleur', 'Burner'),
          l('oui', 'yes'),
          lf('réchaud de l’installateur, {flow2} à 2 mbar', 'the installer’s stove, {flow2} at 2 mbar'),
        ],
        [
          l('Aération', 'Vent'),
          l('sans source', 'no source'),
          l(
            'la thèse demande une pièce aérée ; taille et place sont notre lecture',
            'the thesis asks for an aired room; size and place are our reading',
          ),
        ],
        [
          l('Détecteur', 'Detector'),
          l('non', 'no'),
          l(
            'par analogie avec un texte français pour d’autres installations',
            'by analogy with a French text for other plants',
          ),
        ],
      ],
      { size: 1.95, pad: 1.2 },
    );
    const h = grid(
      d,
      232,
      74,
      [
        { label: l('Ce qui pèse dans la ligne', 'What weighs in the line'), w: 110 },
        { label: l('Valeur', 'Value'), w: 40, align: 'end', mono: true },
      ],
      [
        [l('Pression lue, sans poids', 'Pressure read, no weight'), '2 mbar'],
        [l('Toute la poussée de la cloche', 'The bell’s whole push'), fig('pushCm')],
        [l('Perte dans le tuyau, à plein débit', 'Loss in the hose, at full flow'), fig('hoseDrop')],
        [l('Limite de flamme du modèle', 'The model’s flame limit'), fig('flameLimit')],
        [l('Eau de condensation, une heure de flamme', 'Water condensed, an hour of flame'), fig('condensate')],
        [l('Pente du modèle, de chaque côté', 'The model’s slope, either side'), fig('hoseSlope')],
        [l('Puissance en entrée', 'Power going in'), fig('powerIn')],
        [l('Utile, à 55 %', 'Useful, at 55 %'), fig('powerUseful')],
      ],
      { size: 1.95, pad: 1.2 },
    );
    const top = 74 + hLeft + 5;
    heading(d, 14, top, l('LA MÊME LIGNE, DANS LA 3D, À 1:30', 'THE SAME LINE, IN THE 3D, AT 1:30'));
    elevation(d, 14, 247);
    const y = marksLegend(d, 306, 74 + h + 4, 100);
    note(
      d,
      306,
      y + 1,
      100,
      l(
        'La thèse a vu des tuyaux se boucher chaque semaine sur des installations bien conduites. Ce schéma n’est pas une liste de courses : il montre d’où vient chaque pièce, et il ne dit rien de ce que vaudrait une ligne ainsi faite. Le dessin du bas non plus n’est pas un plan à suivre : aucune source ne donne ces places.',
        'The thesis saw hoses clog weekly on well-run plants. This diagram is no shopping list: it shows where each part comes from, and it says nothing of what a line made this way would be worth. Nor is the drawing below a plan to follow: no source gives those places.',
      ),
      { size: 1.85 },
    );
    return d;
  },
};
