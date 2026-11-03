// The machine in section, as every sheet that shows it draws it, from src/three/dims.ts and src/sim/machine.ts in model millimetres, origin at the tank's inner floor on its axis, +X the feed, -X the overflow: the same frame as the 3D. Drawn with the bell upright; its tilt is an estimate, and the sheets say so.
import { COLORS, W, type View } from '@onigam/lab-kit/drawings';
import { innerDepression, bellPressure, PLANT_1000 } from '../sim/machine';
import { BASE_Y, BELL, FEED, LIMITER, OVERFLOW, PAD, PALLET, TANK, TAP, VALVES } from '../three/dims';
import { FILL, mm } from './draw';

export interface SideOptions {
  /** Rise of the bell from its resting place, m. */
  rise: number;
  /** Fill the slurry and show its layers. */
  layers?: boolean;
  /** Draw the limiter over the bell. */
  limiter?: boolean;
  /** Draw the pallet and the pad under the tank. */
  ground?: boolean;
}

const H = (y: number, a: number, b: number, v: View, s: Parameters<View['line']>[2] = { w: W.thin }): void => {
  v.line([mm(a), mm(y)], [mm(b), mm(y)], s);
};

/** Where the surfaces stand at a rise: the ring and the riser at the overflow, the surface under the bell lower by what the gas pushes. */
export const surfaces = (rise: number, added = 0): { ring: number; inner: number; pressureMbar: number } => {
  const p = bellPressure(PLANT_1000, rise, added);
  return {
    ring: PLANT_1000.overflowLevel,
    inner: PLANT_1000.overflowLevel - innerDepression(p),
    pressureMbar: p / 100,
  };
};

export function sideView(v: View, o: SideOptions): void {
  const r = TANK.outerR;
  const ri = TANK.innerR;
  const lvl = PLANT_1000.overflowLevel;
  const rim = BELL.restRim + o.rise;
  const top = rim + BELL.height;
  const { inner } = surfaces(o.rise);

  if (o.ground) {
    v.rect([mm(-PAD.halfX), mm(-BASE_Y - PAD.h)], [mm(PAD.halfX), mm(-BASE_Y)], { w: W.medium, fill: FILL.tank });
    v.rect([mm(-PALLET.x / 2), mm(-BASE_Y)], [mm(PALLET.x / 2), mm(-TANK.wall)], { w: W.medium, fill: FILL.timber });
  }
  // the slurry
  if (o.layers) {
    const sludge = 0.17;
    const scum = 0.92;
    v.rect([mm(-ri), 0], [mm(ri), mm(sludge)], { w: W.thin, fill: FILL.sludge });
    v.rect([mm(-ri), mm(sludge)], [mm(ri), mm(lvl)], { w: W.thin, fill: FILL.liquor });
    v.rect([mm(-BELL.innerR), mm(scum)], [mm(BELL.innerR), mm(inner)], { w: W.thin, fill: FILL.scum });
  } else {
    v.rect([mm(-ri), 0], [mm(ri), mm(lvl)], { w: W.thin, fill: FILL.liquor });
  }
  // the gas under the bell
  v.rect([mm(-BELL.innerR), mm(inner)], [mm(BELL.innerR), mm(top)], { w: W.thin, fill: FILL.gas });
  // the tank's wall
  for (const s of [-1, 1]) {
    v.rect([mm(s * ri), mm(-TANK.wall)], [mm(s * r), mm(TANK.height)], { w: W.medium, fill: FILL.black });
  }
  v.rect([mm(-r), mm(-TANK.wall)], [mm(r), 0], { w: W.medium, fill: FILL.black });
  // the bell's wall and closed end
  for (const s of [-1, 1]) {
    v.rect([mm(s * BELL.innerR), mm(rim)], [mm(s * BELL.outerR), mm(top)], { w: W.medium, fill: FILL.black });
  }
  v.rect([mm(-BELL.outerR), mm(top - BELL.wall)], [mm(BELL.outerR), mm(top)], { w: W.medium, fill: FILL.black });
  // the surfaces
  H(lvl, -ri, -BELL.outerR, v, { w: W.medium, color: COLORS.water });
  H(lvl, BELL.outerR, ri, v, { w: W.medium, color: COLORS.water });
  H(inner, -BELL.innerR, BELL.innerR, v, { w: W.medium, color: COLORS.water });

  // the feed: inner pipe, connector, tee, plug, riser, funnel
  const y = FEED.axisY;
  v.rect([mm(ri - FEED.reach), mm(y - FEED.ro)], [mm(FEED.riserX + FEED.ro), mm(y + FEED.ro)], {
    w: W.medium,
    fill: FILL.pipe,
  });
  v.rect([mm(FEED.riserX - FEED.ro), mm(y - FEED.ro)], [mm(FEED.riserX + FEED.ro), mm(FEED.funnelNeck)], {
    w: W.medium,
    fill: FILL.pipe,
  });
  v.rect([mm(FEED.riserX + FEED.ro), mm(y - FEED.ro)], [mm(FEED.riserX + FEED.ro + FEED.plugLength), mm(y + FEED.ro)], {
    w: W.medium,
    fill: FILL.black,
  });
  v.polyline(
    [
      [mm(FEED.riserX - FEED.ro), mm(FEED.funnelNeck)],
      [mm(FEED.riserX - FEED.funnelR), mm(FEED.funnelTop)],
      [mm(FEED.riserX + FEED.funnelR), mm(FEED.funnelTop)],
      [mm(FEED.riserX + FEED.ro), mm(FEED.funnelNeck)],
    ],
    { w: W.medium, fill: FILL.pipe, closed: true },
  );
  // the riser stands level with the ring
  H(lvl, FEED.riserX - FEED.ri, FEED.riserX + FEED.ri, v, { w: W.medium, color: COLORS.water });
  // the overflow, its elbow and its drop
  const oy = OVERFLOW.axisY;
  v.rect([mm(OVERFLOW.elbowX), mm(oy - OVERFLOW.ro)], [mm(-ri), mm(oy + OVERFLOW.ro)], {
    w: W.medium,
    fill: FILL.pipe,
  });
  v.rect(
    [mm(OVERFLOW.elbowX - OVERFLOW.ro), mm(oy - OVERFLOW.drop)],
    [mm(OVERFLOW.elbowX + OVERFLOW.ro), mm(oy + OVERFLOW.ro)],
    {
      w: W.medium,
      fill: FILL.pipe,
    },
  );
  // the valve at the tank's foot, on the back
  v.circle([mm(-r - 0.03), mm(VALVES.bottomY)], mm(0.03), { w: W.thin, fill: FILL.pipe });
  // the tap on the bell
  v.rect([mm(TAP.x - 0.012), mm(top)], [mm(TAP.x + 0.012), mm(top + TAP.stem)], { w: W.medium, fill: COLORS.copper });
  // the limiter, one of its two U's
  if (o.limiter) {
    const half = LIMITER.across / 2;
    v.polyline(
      [
        [mm(-half), mm(LIMITER.legBottom)],
        [mm(-half), mm(LIMITER.barY)],
        [mm(half), mm(LIMITER.barY)],
        [mm(half), mm(LIMITER.legBottom)],
      ],
      { w: W.medium, color: COLORS.muted, dash: 'phantom' },
    );
  }
  v.center([0, mm(-0.06)], [0, mm(top + 0.14)]);
}
