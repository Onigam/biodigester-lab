import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { box, fig, FILL, grid, heading, marksLegend, note } from './draw';

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

const LINE: Node[] = [
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
  const y = 30;
  const h = 20;
  LINE.forEach((n, i) => {
    const x = x0 + i * (w + gap);
    box(d, x, y, w, h, n.name, { fill: n.measured ? COLORS.paper : FILL.added, size: 1.8 });
    if (!n.measured) p.rect([x, y], [x + w, y + h], { w: W.thin, dash: 'hidden', color: COLORS.muted });
    if (i < LINE.length - 1) {
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
  box(d, xr, y + h + 10, w, 12, l('Aération', 'Vent'), { fill: FILL.added, size: 1.75 });
  box(d, xr + w + gap, y + h + 10, w, 12, l('Détecteur', 'Detector'), { fill: FILL.added, size: 1.75 });
}

export const gasLineSheet: DrawingSheet = {
  id: 'gas-line-schematic',
  number: 'PL-B05',
  group: 'plant',
  title: l('La ligne de gaz', 'The gas line'),
  description: lf(
    'De la cloche à la casserole, sans échelle, dans l’ordre du gaz. Un trait plein : c’était sur l’installation mesurée (le manomètre, pour la recherche seulement). Fond ombré et pointillé : cela vient d’une autre source ou de notre lecture, et les tailles de ces dessins sont les nôtres. Dessous, d’où vient chaque pièce, et ce qui pèse dans la ligne : {hoseDrop} perdus dans le tuyau, et environ {pushCm} d’eau pour toute la poussée de la cloche.',
    'From the bell to the pot, with no scale, in the order of the gas. A full outline: it was on the measured plant (the gauge, for research only). Shaded and dashed: it comes from another source or from our reading, and the sizes of those drawings are ours. Below, where each part comes from, and what weighs in the line: {hoseDrop} lost in the hose, and about {pushCm} of water for the bell’s whole push.',
  ),
  scene: 'gas-line',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La ligne de gaz', 'The gas line'),
      subtitle: l('Dans l’ordre du gaz, sans échelle', 'In the order of the gas, no scale'),
      number: 'PL-B05',
      scale: '—',
    });
    heading(d, 14, 14, l('DE LA CLOCHE À LA CASSEROLE', 'FROM THE BELL TO THE POT'));
    diagram(d);
    grid(
      d,
      14,
      92,
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
      { size: 1.95, pad: 1.5 },
    );
    const h = grid(
      d,
      232,
      92,
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
      { size: 1.95, pad: 1.5 },
    );
    const y = marksLegend(d, 232, 92 + h + 5, 150);
    note(
      d,
      232,
      y + 2,
      150,
      l(
        'La thèse a vu des tuyaux se boucher chaque semaine sur des installations bien conduites. Ce schéma n’est pas une liste de courses : il montre d’où vient chaque pièce, et il ne dit rien de ce que vaudrait une ligne ainsi faite.',
        'The thesis saw hoses clog weekly on well-run plants. This diagram is no shopping list: it shows where each part comes from, and it says nothing of what a line made this way would be worth.',
      ),
      { size: 1.85 },
    );
    return d;
  },
};
