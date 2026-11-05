import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { LINE } from '../three/dims';
import { FILL, grid, heading, marksLegend, mL, mm, note } from './draw';

// PL-B09: the hazards: the gas's figures side by side, where each collects, with no promise. The ladder of H₂S on a log scale; the two ranges of explosion with their conditions. Nothing on this sheet says what would be enough.

export const ITEMS = [
  'h2s-filter',
  'kitchen-valve',
  'blue-flame',
  'vent-opening',
  'gas-detector',
  'primary-air-sleeve',
] as const;

function ladder(d: Drawing, x: number, y: number, w: number): void {
  const p = d.paper();
  const decades = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
  const logMin = -3;
  const logMax = 5;
  const X = (ppm: number): number => x + ((Math.log10(ppm) - logMin) / (logMax - logMin)) * w;
  p.rect([x, y], [x + w, y + 9], { w: W.thin, fill: COLORS.paper });
  p.rect([X(20), y], [X(20000), y + 9], { w: W.thin, fill: FILL.hot });
  p.text(
    [(X(20) + X(20000)) / 2, y + 4.5],
    l('biogaz en général : 20 à 20 000 ppm', 'biogas in general: 20 to 20,000 ppm'),
    { size: 1.75, anchor: 'middle', baseline: 'middle' },
  );
  for (const k of decades) {
    const v = 10 ** k;
    p.line([X(v), y + 9], [X(v), y + 11], { w: W.thin });
    p.text(
      [X(v), y + 13],
      l(
        k < 0 ? v.toString().replace('.', ',') : v >= 1000 ? `${v / 1000} 000` : String(v),
        k < 0 ? v.toString() : v >= 1000 ? `${v / 1000},000` : String(v),
      ),
      { size: 1.65, anchor: 'middle', baseline: 'middle', mono: true },
    );
  }
  const mark = (
    ppm: number,
    dy: number,
    text: ReturnType<typeof l>,
    color: string = COLORS.ink,
    left = false,
  ): void => {
    p.line([X(ppm), y + 9], [X(ppm), y + dy], { w: W.thin, color });
    p.text([X(ppm) + (left ? -1 : 1), y + dy], text, {
      size: 1.8,
      baseline: 'middle',
      color,
      anchor: left ? 'end' : 'start',
    });
  };
  mark(0.008, 21, l('0,008 ppm : l’odeur se sent', '0.008 ppm: the smell is noticed'));
  mark(500, 21, l('environ 500 ppm : mort soudaine', 'about 500 ppm: sudden death'), COLORS.red);
  mark(
    100,
    27,
    l(
      'environ 100 ppm : le nez ne sent plus ; le capteur de la thèse s’arrête',
      'about 100 ppm: the nose stops smelling; the thesis’s sensor stops',
    ),
    COLORS.red,
  );
  mark(
    72,
    33,
    l('72 ppm : seule lecture sous le plafond du capteur', '72 ppm: the only reading under the sensor’s ceiling'),
    COLORS.ink,
    true,
  );
  p.text([x, y - 3], 'ppm', { size: 1.75, baseline: 'middle' });
}

/** The kitchen of the 3D at 1:20, from dims.ts, and where each gas goes: the arrows say only what the sentence beside them says. `y` is the floor. */
function room(d: Drawing, x: number, y: number): void {
  const K = 1 / 20;
  const v = d.view(x, y, K);
  const p = d.paper();
  const P = (a: number, b: number): [number, number] => [mm(a), mm(b)];
  const W0 = LINE.roomW;
  const H0 = LINE.roomH;
  const wall = LINE.wallT;
  const px = (a: number): number => x + a * 1000 * K;
  const py = (b: number): number => y - b * 1000 * K;
  const band = 0.42;
  const pitDepth = 0.34;
  v.rect(P(0, 0), P(W0, H0), { w: W.thick, fill: COLORS.paper });
  v.rect(P(0, H0 - band), P(W0, H0), { w: 0.1, fill: FILL.gas, opacity: 0.6 });
  v.rect(P(0, 0), P(W0, band), { w: 0.1, fill: FILL.hot, opacity: 0.6 });
  // a pit beyond the floor: no size, only where it would gather
  v.rect(P(W0 - 1.15, -pitDepth), P(W0 - 0.3, 0), { w: W.thin, dash: 'hidden', fill: FILL.hot, opacity: 0.6 });
  // the wall the line comes through
  v.rect(P(-wall, 0), P(0, H0), { w: W.medium, fill: FILL.tank });
  v.line(P(-wall - 0.06, LINE.y), P(0.1, LINE.y), { w: W.medium, color: COLORS.copper });
  v.rect(P(0.04, LINE.valveY - 0.05), P(0.14, LINE.valveY + 0.05), { w: W.medium, fill: FILL.added });
  // table, burner, stand, pot
  const bx = LINE.burnerX - (LINE.wallX + wall);
  const tx = bx - LINE.tableW / 2;
  v.rect(P(tx, LINE.tableH - 0.04), P(tx + LINE.tableW, LINE.tableH), { w: W.medium, fill: FILL.timber });
  for (const a of [tx + 0.03, tx + LINE.tableW - 0.03])
    v.line(P(a, 0), P(a, LINE.tableH - 0.04), { w: W.medium, color: COLORS.muted });
  v.rect(P(bx - LINE.burnerR, LINE.tableH), P(bx + LINE.burnerR, LINE.tableH + LINE.burnerH), {
    w: W.medium,
    fill: FILL.pipe,
  });
  const potY = LINE.tableH + LINE.standH;
  for (const k of [-1, 1])
    v.line(P(bx + k * LINE.potR * 0.8, LINE.tableH), P(bx + k * LINE.potR * 0.8, potY), {
      w: W.medium,
      color: COLORS.muted,
    });
  v.rect(P(bx - LINE.potR, potY), P(bx + LINE.potR, potY + LINE.potH), { w: W.medium, fill: FILL.tank });
  v.polyline(
    [P(0.1, LINE.y), P(bx - 0.3, LINE.y), P(bx - 0.3, LINE.tableH + 0.05), P(bx - LINE.burnerR, LINE.tableH + 0.05)],
    { w: W.thin, color: COLORS.copper },
  );
  // the vent in the wall, the detector at the far side
  v.rect(P(-wall, LINE.ventY - 0.08), P(0, LINE.ventY + 0.08), { w: W.thin, fill: COLORS.paper });
  v.rect(P(W0 - 0.16, LINE.detectorY - 0.05), P(W0, LINE.detectorY + 0.05), { w: W.medium, fill: FILL.added });
  // where each goes
  const arrow = (a: number, b0: number, b1: number, color: string): void => {
    p.line([px(a), py(b0)], [px(a), py(b1)], { w: W.medium, color });
    const s = b1 > b0 ? 1 : -1;
    p.polyline(
      [
        [px(a) - 1, py(b1) + s * 2],
        [px(a), py(b1)],
        [px(a) + 1, py(b1) + s * 2],
      ],
      { w: W.medium, color },
    );
  };
  for (const a of [0.55, 1.2, 1.85, 2.5]) arrow(a, H0 - band - 0.3, H0 - band + 0.08, COLORS.copper);
  for (const a of [1.75, 2.75]) arrow(a, band + 0.42, band + 0.02, COLORS.red);
  arrow(W0 - 0.725, 0.08, -pitDepth + 0.06, COLORS.red);
  // the words, in their zones
  const say = (a: number, b: number, w: number, text: ReturnType<typeof l>): void => {
    note(d, px(a), py(b), w, text, { size: 2.15 });
  };
  say(0.3, H0 - 0.13, 120, l('Le méthane monte.', 'Methane rises.'));
  say(
    1.45,
    potY + LINE.potH + 0.35,
    78,
    l(
      'Le CO d’une flamme mal réglée se mêle à l’air de la pièce.',
      'CO from a badly set flame mixes into the room’s air.',
    ),
  );
  say(
    1.42,
    band - 0.1,
    82,
    l('Le CO₂ et l’H₂S restent en bas, et s’amassent dans une fosse.', 'CO₂ and H₂S stay low, and gather in a pit.'),
  );
  // what stands in the room, by the name the table gives it
  const small = { size: 1.75, baseline: 'middle', color: COLORS.muted } as const;
  p.text([px(0.06), py(LINE.ventY)], l('Aération', 'Vent'), small);
  p.text([px(W0 - 0.2), py(LINE.detectorY)], l('Détecteur', 'Detector'), { ...small, anchor: 'end' });
  p.text([px(0.04), py(LINE.valveY + 0.11)], l('Vanne', 'Valve'), small);
  p.text([px(bx + LINE.potR + 0.05), py(potY + 0.06)], l('Brûleur', 'Burner'), small);
  p.text([px(W0 - 0.3) + 2, py(-pitDepth / 2)], l('une fosse', 'a pit'), {
    size: 1.85,
    baseline: 'middle',
    color: COLORS.muted,
  });
  v.dim(P(-wall, 0), P(-wall, H0), -8, { dir: 'v', label: mL(H0, '*'), size: 1.75 });
  v.dim(P(0, H0), P(W0, H0), -3, { dir: 'h', label: mL(W0, '*', 1), size: 1.75 });
}

export const hazardsSheet: DrawingSheet = {
  id: 'hazards',
  number: 'PL-B09',
  group: 'limits',
  title: l('Les dangers', 'The hazards'),
  description: l(
    'Les chiffres de ce gaz côte à côte, chacun avec sa condition, et où chacun s’amasse. L’échelle de l’H₂S est logarithmique : l’odeur s’arrête vers 100 ppm, et le capteur de la thèse aussi, de sorte que la vraie teneur de ce gaz reste inconnue. Cette planche ne dit pas ce qui suffirait : aucune source lue n’a étudié une cuisine fermée.',
    'This gas’s figures side by side, each with its condition, and where each gathers. The H₂S ladder is logarithmic: the smell stops near 100 ppm, as does the thesis’s sensor, so that this gas’s true level stays unknown. This sheet does not say what would be enough: no source we read has studied a closed kitchen.',
  ),
  scene: 'gas-line',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Les dangers', 'The hazards'),
      subtitle: l(
        'Ce gaz en chiffres, où il va, et ce que le lab ne sait pas',
        'This gas in figures, where it goes, and what the lab does not know',
      ),
      number: 'PL-B09',
      scale: '— · 1:20',
    });
    heading(d, 14, 14, l('L’HYDROGÈNE SULFURÉ', 'HYDROGEN SULPHIDE'));
    ladder(d, 14, 28, 390);
    const h = grid(
      d,
      14,
      72,
      [
        { label: l('Danger', 'Hazard'), w: 52 },
        { label: l('Chiffres', 'Figures'), w: 120 },
        { label: l('Où cela se dit', 'Where it is said'), w: 58 },
      ],
      [
        [
          l('Mélange avec l’air', 'Mix with air'),
          l(
            'méthane : 5 à 15 % ; un biogaz à 50 % de méthane, air saturé : 10 à 24 % ; aussi cités : 6 à 12 %',
            'methane: 5 to 15 %; a biogas at 50 % methane, saturated air: 10 to 24 %; also quoted: 6 to 12 %',
          ),
          l('Volume de gaz, leçon 6', 'Gas space, lesson 6'),
        ],
        [
          l('H₂S, poison', 'H₂S, poison'),
          l(
            'voir l’échelle ; capteur plafonné sur toutes les installations mesurées, sauf une',
            'see the ladder; sensor capped on every plant measured, but one',
          ),
          l('Filtre à H₂S, leçon 6', 'H₂S filter, lesson 6'),
        ],
        [
          l('Plus d’oxygène', 'No oxygen'),
          l(
            'le méthane et le CO₂ prennent sa place : personne ne descend dans une cuve ou une fosse',
            'methane and CO₂ take its place: nobody goes down into a tank or a pit',
          ),
          l('Cuve, leçon 6', 'Tank, lesson 6'),
        ],
        [
          l('CO, flamme mal réglée', 'CO, a badly set flame'),
          l(
            'aucun chiffre trouvé pour ce brûleur ; une flamme longue et jaune en est le signe',
            'no figure found for this burner; a long yellow flame is the sign',
          ),
          l('Virole d’air, aération', 'Air sleeve, vent'),
        ],
        [
          l('Brûlure', 'Burns'),
          l(
            'la flamme se voit moins que celle du butane ou du propane',
            'the flame shows less than butane’s or propane’s',
          ),
          l('Flamme', 'Flame'),
        ],
        [
          l('Germes, effluent', 'Germs, effluent'),
          l(
            'à cette température, l’inactivation n’est pas assurée ; DCO très au-dessus de 1 000 mg/L',
            'at this temperature inactivation is not ensured; COD far above 1,000 mg/L',
          ),
          l('Germes, seau, potager', 'Germs, bucket, bed'),
        ],
        [
          l('Larves, climat chaud', 'Larvae, warm climate'),
          l(
            'surtout des mouches de drain, des Culex parmi elles, pas d’Anopheles',
            'mostly drain flies, some Culex among them, no Anopheles',
          ),
          l('Anneau ouvert', 'Open rim'),
        ],
      ],
      { size: 1.85, pad: 1.1 },
    );
    const top = 72 + h + 4;
    heading(d, 14, top, l('OÙ CHACUN S’AMASSE, DANS UNE PIÈCE FERMÉE', 'WHERE EACH GATHERS, IN A CLOSED ROOM'));
    room(d, 32, top + 11 + LINE.roomH * 50);
    const hAccident = grid(
      d,
      252,
      72,
      [{ label: l('L’accident le plus grave que nous puissions citer', 'The worst accident we can cite'), w: 150 }],
      [
        [
          l(
            'Rhadereistedt, Allemagne, 8 novembre 2005 : 4 morts, une douzaine de pompiers touchés. Une fosse industrielle dans un hall fermé, des déchets d’abattoir. Ce n’est pas une maison, et nous n’avons pas trouvé de chiffres fiables pour les installations domestiques.',
            'Rhadereistedt, Germany, 8 November 2005: 4 dead, about a dozen firefighters affected. An industrial pit in a closed hall, slaughterhouse waste. It is not a home, and we found no reliable figures for household plants.',
          ),
        ],
      ],
      { size: 1.9 },
    );
    marksLegend(d, 252, 72 + hAccident + 4, 150);
    const y1 = note(
      d,
      200,
      top + 1,
      206,
      lf(
        'La thèse écrit qu’aucune explosion n’a été relevée en Tanzanie, et qu’une désulfuration n’est pas nécessaire : nous ne le répétons pas comme une assurance, car ses bâtiments sont très ouverts et son capteur plafonnait. La pression, de 2 à 4 mbar, est très basse : ce n’est pas une raison d’être moins attentif. Le modèle ne calcule aucune teneur dans une pièce. {flameLimit} au brûleur, c’est là qu’il éteint la flamme : une estimation, pas une limite à viser.',
        'The thesis writes that no explosion was noted in Tanzania, and that desulphurisation is not necessary: we do not repeat that as an assurance, as its buildings are very open and its sensor was capped. The pressure, 2 to 4 mbar, is very low: that is no reason for less attention. The model works out no level in a room. {flameLimit} at the burner is where it puts the flame out: an estimate, not a limit to aim at.',
      ),
      { size: 2.15 },
    );
    const h2 = grid(
      d,
      200,
      y1 + 2,
      [
        { label: l('Dans cette pièce, en 3D', 'In this room, in the 3D'), w: 48 },
        { label: l('Hauteur', 'Height'), w: 20, align: 'end', mono: true },
        { label: l('D’où cela vient', 'Where it comes from'), w: 138 },
      ],
      [
        [
          l('Vanne', 'Valve'),
          mL(LINE.valveY, '*'),
          l(
            'le manuel de construction ; à fermer quand la flamme s’éteint',
            'the build manual; to be closed when the flame goes out',
          ),
        ],
        [
          l('Table et brûleur', 'Table and burner'),
          mL(LINE.tableH, '*'),
          l('le réchaud de l’installateur ; la table est de nous', 'the installer’s stove; the table is ours'),
        ],
        [
          l('Aération', 'Vent'),
          mL(LINE.ventY, '*'),
          l(
            'la thèse demande une pièce aérée ; taille et place sont notre lecture',
            'the thesis asks for an aired room; size and place are our reading',
          ),
        ],
        [
          l('Détecteur', 'Detector'),
          mL(LINE.detectorY, '*'),
          l(
            'par analogie avec un texte français pour d’autres installations',
            'by analogy with a French text for other plants',
          ),
        ],
      ],
      { size: 2.15, pad: 1.9 },
    );
    note(
      d,
      200,
      y1 + 2 + h2 + 4,
      206,
      l(
        'Ce dessin montre la pièce de la 3D, il ne dit pas ce qui suffirait : aucune source lue n’a étudié une cuisine fermée.',
        'This drawing shows the 3D’s room and does not say what would be enough: no source we read has studied a closed kitchen.',
      ),
      { size: 2.15, bold: true },
    );
    return d;
  },
};
