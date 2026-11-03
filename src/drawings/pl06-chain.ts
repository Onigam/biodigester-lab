import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { MODEL } from '../sim/machine';
import { box, cat, fig, FILL, grid, heading, marksLegend, note } from './draw';

// PL-B06: the food chain as a diagram: the four stages of the reference book, what each makes, and how the model lumps them. The pH windows are drawn from the simulation's own constants and form. The drop is stylised; this sheet is a diagram, no scale.

export const ITEMS = [
  'food-particle',
  'hydrolysers',
  'acid-makers',
  'acetogens',
  'methanogens',
  'fatty-acid-pool',
  'bicarbonate-buffer',
  'gas-bubble',
] as const;

/** The pH window of a stage, ADM1's form as the simulation has it: 1 above `high`, a Gaussian fall below it. */
export const phWindow = (pH: number, low: number, high: number): number =>
  pH >= high ? 1 : Math.exp(-3 * ((pH - high) / (high - low)) ** 2);

interface Stage {
  name: L;
  who: L;
  makes: L;
  model: L;
}

const STAGES: Stage[] = [
  {
    name: l('Hydrolyse', 'Hydrolysis'),
    who: l('hydrolyseurs, leurs enzymes', 'hydrolysers, their enzymes'),
    makes: l('sucres, acides aminés, acides gras', 'sugars, amino acids, fatty acids'),
    model: lf('deux vitesses : {kFast} et {kSlow} par jour', 'two rates: {kFast} and {kSlow} a day'),
  },
  {
    name: l('Acidogenèse', 'Acidogenesis'),
    who: l('acidogènes, rapides, tolérants', 'acid-makers, fast, tolerant'),
    makes: l('acides gras, alcools, acétate, H₂, CO₂, ammoniac', 'fatty acids, alcohols, acetate, H₂, CO₂, ammonia'),
    model: l('avec la précédente : tout entre dans une réserve', 'with the one before: all enters one stock'),
  },
  {
    name: l('Acétogenèse', 'Acetogenesis'),
    who: l('acétogènes, à condition que l’H₂ parte', 'acetogens, provided the H₂ leaves'),
    makes: l('acide acétique, H₂, CO₂', 'acetic acid, H₂, CO₂'),
    model: l('pas à part : tout acide est de l’acétate', 'not apart: all acid is acetate'),
  },
  {
    name: l('Méthanogenèse', 'Methanogenesis'),
    who: l('méthanogènes, des archées, lents', 'methanogens, archaea, slow'),
    makes: l('CH₄ et CO₂', 'CH₄ and CO₂'),
    model: lf(
      '{kMethanogen} par jour ; rendement {yieldMethanogen} ; mortalité {deathRate} par jour',
      '{kMethanogen} a day; yield {yieldMethanogen}; death {deathRate} a day',
    ),
  },
];

function chain(d: Drawing): void {
  const p = d.paper();
  const x0 = 16;
  const w = 94;
  const gap = 5;
  const y = 28;
  STAGES.forEach((s, i) => {
    const x = x0 + i * (w + gap);
    box(d, x, y, w, 13, s.name, { fill: i === 3 ? FILL.gas : FILL.liquor, size: 2.3 });
    if (i < STAGES.length - 1) {
      p.line([x + w, y + 6.5], [x + w + gap - 1, y + 6.5], { w: W.medium, color: COLORS.copper });
      p.polyline(
        [
          [x + w + gap - 1.8, y + 5.4],
          [x + w + gap, y + 6.5],
          [x + w + gap - 1.8, y + 7.6],
        ],
        { w: W.medium, color: COLORS.copper },
      );
    }
  });
  grid(
    d,
    x0,
    y + 17,
    [
      { label: l('Stade 1', 'Stage 1'), w: 99 },
      { label: l('Stade 2', 'Stage 2'), w: 99 },
      { label: l('Stade 3', 'Stage 3'), w: 99 },
      { label: l('Stade 4', 'Stage 4'), w: 94 },
    ],
    [
      STAGES.map((s) => cat(l('qui : ', 'who: '), s.who)),
      STAGES.map((s) => cat(l('fait : ', 'makes: '), s.makes)),
      STAGES.map((s) => cat(l('modèle : ', 'model: '), s.model)),
    ],
    { size: 1.8 },
  );
}

function windows(d: Drawing, x: number, y: number, w: number, h: number): void {
  const p = d.paper();
  const pHmin = 3.5;
  const pHmax = 8;
  const X = (pH: number): number => x + ((pH - pHmin) / (pHmax - pHmin)) * w;
  const Y = (v: number): number => y + h - v * h;
  p.rect([x, y], [x + w, y + h], { w: W.thin, fill: COLORS.paper });
  for (let ph = 4; ph <= 8; ph++) {
    p.line([X(ph), y], [X(ph), y + h], { w: 0.1, color: COLORS.muted });
    p.text([X(ph), y + h + 2.6], String(ph), { size: 1.75, anchor: 'middle', baseline: 'middle', mono: true });
  }
  const curve = (low: number, high: number, color: string): void => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 90; i++) {
      const ph = pHmin + ((pHmax - pHmin) * i) / 90;
      pts.push([X(ph), Y(phWindow(ph, low, high))]);
    }
    p.polyline(pts, { w: W.medium, color });
  };
  curve(MODEL.hydrolysisPHLow, MODEL.hydrolysisPHHigh, COLORS.ink);
  curve(MODEL.methanogenPHLow, MODEL.methanogenPHHigh, COLORS.copper);
  p.text([X(4.55), Y(0.72)], l('hydrolyse*', 'hydrolysis*'), { size: 1.8, baseline: 'middle', anchor: 'middle' });
  p.text([X(7.3), Y(0.38)], l('méthanogènes*', 'methanogens*'), {
    size: 1.8,
    baseline: 'middle',
    color: COLORS.copper,
    anchor: 'middle',
  });
  // what was read
  p.line([X(6.5), y], [X(6.5), y + h], { w: W.thin, color: COLORS.red, dash: 'hidden' });
  p.text([X(6.5) - 1, y + 2], l('environ 6,5 lu', 'about 6.5 read'), {
    size: 1.75,
    anchor: 'end',
    color: COLORS.red,
    baseline: 'top',
  });
  p.line([X(4.15), y], [X(4.15), y + h], { w: W.thin, color: COLORS.red, dash: 'hidden' });
  p.text([X(4.15) + 1, y + 2], l('4,15, à l’arrêt', '4.15, stopped'), {
    size: 1.75,
    color: COLORS.red,
    baseline: 'top',
  });
  p.text([x + w / 2, y + h + 6], 'pH', { size: 1.8, anchor: 'middle', baseline: 'middle' });
}

export const chainSheet: DrawingSheet = {
  id: 'food-chain',
  number: 'PL-B06',
  group: 'life',
  title: l('La chaîne du vivant', 'The chain of life'),
  description: lf(
    'Les quatre stades du livre, ce que chacun fabrique, et ce que le modèle en garde : moins de populations, assez pour que la panne apparaisse d’elle-même. En bas, la fenêtre de pH des deux groupes qu’il distingue : leur forme vient d’un modèle de référence, relu de mémoire, et chaque valeur est une estimation. Il arrête les méthanogènes entre {phHigh} et {phLow}, bien avant les hydrolyseurs, et c’est tout le mécanisme de la panne.',
    'The book’s four stages, what each makes, and what the model keeps of them: fewer populations, enough for the failure to appear by itself. Below, the pH window of the two groups it tells apart: their form comes from a reference model, recalled from memory, and each value is an estimate. It stops the methanogens between {phHigh} and {phLow}, well before the hydrolysers, and that is the whole mechanism of the failure.',
  ),
  scene: 'slurry',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La chaîne du vivant', 'The chain of life'),
      subtitle: l('Quatre stades, et ce que le modèle en garde', 'Four stages, and what the model keeps'),
      number: 'PL-B06',
      scale: '—',
    });
    heading(d, 14, 14, l('DE LA PARTICULE À LA BULLE', 'FROM THE PARTICLE TO THE BUBBLE'));
    chain(d);
    heading(d, 14, 86, l('LA FENÊTRE DE PH', 'THE PH WINDOW'));
    windows(d, 24, 98, 176, 134);
    const h = grid(
      d,
      214,
      92,
      [
        { label: l('Ce qui tient le pH', 'What holds the pH'), w: 134 },
        { label: l('Valeur', 'Value'), w: 50, align: 'end', mono: true },
      ],
      [
        [
          l('Alcalinité mesurée, à 2 kg par jour', 'Alkalinity measured, at 2 kg a day'),
          l('1 130 mg CaCO₃/L', '1,130 mg CaCO₃/L'),
        ],
        [l('Le tampon, dans toute la cuve', 'The buffer, in the whole tank'), fig('bufferKg')],
        [l('Acides sous charge, mesurés', 'Acids under load, measured'), l('124 à 195 mg/L', '124 to 195 mg/L')],
        [l('Acides sous charge, modèle', 'Acids under load, model'), fig('acidsUnderLoad')],
        [
          l('pH à 5 kg par jour : mesuré, puis modèle', 'pH at 5 kg a day: measured, then model'),
          cat(l('6,2 ; ', '6.2; '), fig('pHLoad')),
        ],
        [l('Limite du rapport acides sur tampon', 'Limit of the ratio of acids to buffer'), l('0,3', '0.3')],
        [l('D’un repas, la moitié du gaz', 'Of a meal, half the gas'), fig('mealHalf')],
        [l('D’un repas, 90 % du gaz', 'Of a meal, 90 % of the gas'), fig('mealNinety')],
      ],
      { size: 1.95, pad: 1.4 },
    );
    const y = marksLegend(d, 214, 92 + h + 5, 184);
    note(
      d,
      214,
      y + 2,
      184,
      l(
        'La plupart des sources écrivent « bactéries méthanogènes » : ce sont des archées, depuis 1977. Le modèle n’a ni soufre, ni azote, ni germes, et un seul volume : sur tout cela, il n’a rien à dire. La goutte du monde 3D ne suit de ce schéma que les couleurs et les comptes qu’elle dit suivre.',
        'Most sources write “methanogenic bacteria”: they are archaea, since 1977. The model has no sulphur, no nitrogen, no germs, and one volume: on all that it has nothing to say. The 3D world’s drop follows this diagram only in the colours and counts it says it follows.',
      ),
      { size: 1.85 },
    );
    return d;
  },
};
