// The dimension rows of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): no number is typed in this file. They are appended to each sheet's specs by ../parts.ts. A row with no mark is a source's figure, as dims.ts tags it; † is derived, * is an estimate of the 3D model (dims.ts says which, and the sheets' own texts say why).
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { BELL, BUCKET, FEED, HOSE, LIMITER, LINE, OVERFLOW, PALLET, TANK, VALVES, YARD } from '../../three/dims';
import { sp } from '../part-helpers';
import { nEn, nFr } from '../units';

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;

/** Metres, at most three decimals, no trailing zero, with its mark. */
const lenM = (mark: '*' | '†' | '', ...m: number[]): L =>
  l(
    `${m.map((x) => trim(nFr(x, 3), ',')).join(' × ')} m${mark}`,
    `${m.map((x) => trim(nEn(x, 3), '.')).join(' × ')} m${mark}`,
  );
/** Millimetres, one decimal only when it matters, with its mark. */
const lenMm = (mark: '*' | '†' | '', ...m: number[]): L => {
  const one = (x: number, f: (v: number, d: number) => string): string =>
    f(x * 1000, Math.abs(x * 1000 - Math.round(x * 1000)) < 0.05 ? 0 : 1);
  return l(`${m.map((x) => one(x, nFr)).join(' × ')} mm${mark}`, `${m.map((x) => one(x, nEn)).join(' × ')} mm${mark}`);
};

export const DIM_SPECS: Record<string, Spec[]> = {
  // ---- yard
  'kitchen-house': [
    sp('Faîtage de la maison, largeur', 'House’s ridge, width', lenM('*', YARD.houseRidge, YARD.houseW)),
  ],
  'water-butt': [
    sp('Distance au centre de la dalle', 'From the middle of the pad', lenM('*', Math.hypot(YARD.buttX, YARD.buttZ))),
  ],
  'vegetable-bed': [sp('Une planche dessinée', 'One bed as drawn', lenM('*', YARD.bedW, YARD.bedL, YARD.bedH))],
  'scrap-caddy': [sp('Place dessinée, sur la dalle', 'Place drawn, on the pad', lenM('*', YARD.caddyX, YARD.caddyZ))],

  // ---- digester
  'digester-tank': [
    sp('Crête des cerclages, rayon', 'Crest of the hoops, radius', lenMm('*', TANK.hoopR)),
    sp('Bourrelet du bord, rayon', 'Bead at the rim, radius', lenMm('*', TANK.beadR)),
  ],
  'gas-bell': [
    sp('Bord au repos, au-dessus du fond', 'Rim at rest, above the floor', lenM('*', BELL.restRim)),
    sp('Crête des cerclages, rayon', 'Crest of the hoops, radius', lenMm('†', BELL.hoopR)),
  ],
  'feed-funnel': [sp('Col, au-dessus du fond', 'Neck, above the floor', lenM('*', FEED.funnelNeck))],
  'feed-riser': [
    sp(
      'Alésage, paroi',
      'Bore, wall',
      l(
        `${nFr(FEED.bore * 1000, 1)} mm, ${nFr((FEED.ro - FEED.ri) * 1000, 0)} mm*`,
        `${nEn(FEED.bore * 1000, 1)} mm, ${nEn((FEED.ro - FEED.ri) * 1000, 0)} mm*`,
      ),
    ),
  ],
  'overflow-pipe': [
    sp('Alésage', 'Bore', lenMm('', OVERFLOW.bore)),
    sp('Axe, au-dessus du fond', 'Axis, above the floor', lenMm('†', OVERFLOW.axisY)),
  ],
  'bottom-valve': [
    sp('Robinet d’échantillon, au-dessus du fond', 'Sampling tap, above the floor', lenM('', VALVES.tapY)),
  ],
  pallet: [
    sp(
      'Lattes dessinées, largeur, épaisseur',
      'Boards drawn, width, thickness',
      lenMm('*', PALLET.boardW, PALLET.deck),
    ),
  ],
  'float-limiter': [
    sp('Tube, Ø extérieur dessiné', 'Pipe, outside Ø as drawn', lenMm('*', LIMITER.r * 2)),
    sp('Barre basse, au-dessus du fond', 'Lower bar, above the floor', lenM('†', LIMITER.barY)),
  ],

  // ---- gas line
  'bell-hose': [sp('Ø extérieur dessiné', 'Outside Ø as drawn', lenMm('*', HOSE.r * 2))],
  'hose-run': [sp('Ø extérieur dessiné', 'Outside Ø as drawn', lenMm('*', HOSE.r * 2))],
  'biogas-burner': [sp('Rayon, hauteur dessinés', 'Radius, height as drawn', lenMm('*', LINE.burnerR, LINE.burnerH))],
  'cooking-pot': [sp('Rayon, hauteur dessinés', 'Radius, height as drawn', lenMm('*', LINE.potR, LINE.potH))],
  'overflow-bucket': [sp('Fond, rayon dessiné', 'Base, radius as drawn', lenMm('*', BUCKET.rBottom))],
};
