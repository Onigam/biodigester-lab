import * as THREE from 'three';
import type { BioState } from '../../sim/types';
import {
  BELL,
  BRICK,
  BRICK_AT,
  BUCKET,
  FEED,
  LIMITER,
  MACHINE,
  MARKS,
  OVERFLOW,
  PALLET,
  TANK,
  TAP,
  VALVES,
} from '../dims';
import { cutGeometry, EMPTY } from './clip';
import { machineLook, type MachineLook } from './look';
import { box, cylX, cylY, hex, mergeAll, pipeSolid, revolveY, rod, rounded, V, type P2 } from './shapes';
import { bellPose, Bubbles, FACE_Z, Slurry, type BellPose, type MachineView } from './slurry';

// The machine: one function, every world. A world places its root; `yard` and `gas-line` show it closed, as one thing, `digester` registers its twenty parts one by one and asks for the views. Three views of the same
// dimensions, all geometry, swapped by `setView`, nothing clipped at draw time. `whole` is the closed machine. `cut` is the digester world's opening: the machine cut along its axis in the plane of its feed and its
// overflow, the plane the bell tilts in, so that the cut stays true as the bell moves. `across` is the section tool: the plane of the overflow, seen from above, for the open ring. Every number comes from `dims.ts`.
//
// `update` is the one place that reads the simulation: the bell, the levels, the layers, the bubbles, the brick, the effluent, the same in every world.

export const MACHINE_PARTS = [
  'digester-tank',
  'gas-bell',
  'gas-space',
  'rim-gap',
  'scale-marks',
  'half-brick',
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
  'float-limiter',
  'scum-layer',
  'clear-liquor',
  'sludge-bed',
] as const;
export type MachinePart = (typeof MACHINE_PARTS)[number];

interface Swap {
  mesh: THREE.Mesh;
  whole: THREE.BufferGeometry;
  cut: THREE.BufferGeometry;
  across: THREE.BufferGeometry;
}

interface Item {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  /** The material of its cut face: null for an open surface, which has none. */
  section: THREE.Material | null;
  /** Only in the cut view. */
  cutOnly?: boolean;
}

/**
 * One part's solids, by material, ready to be cut. `moving`: it follows the bell, in the plane of the cut, and has no across view: the plane would have to follow it. `whole`: it is never cut, it lies behind the plane
 * wherever it goes (the brick).
 */
class Body {
  readonly items: Item[] = [];
  constructor(
    readonly group: THREE.Group,
    readonly mode: 'fixed' | 'moving' | 'whole' = 'fixed',
  ) {}
  add(geo: THREE.BufferGeometry, mat: THREE.Material, section: THREE.Material | null = null): void {
    this.items.push({ geo, mat, section });
  }
  cutOnly(geo: THREE.BufferGeometry, mat: THREE.Material): void {
    this.items.push({ geo, mat, section: null, cutOnly: true });
  }

  finish(views: boolean, acrossY: number, swaps: Swap[]): void {
    const byMat = new Map<THREE.Material, Item[]>();
    for (const it of this.items) {
      const list = byMat.get(it.mat);
      if (list) list.push(it);
      else byMat.set(it.mat, [it]);
    }
    const faces = new Map<THREE.Material, { cut: THREE.BufferGeometry[]; across: THREE.BufferGeometry[] }>();
    for (const [mat, list] of byMat) {
      const plain = list.filter((i) => !i.cutOnly);
      if (!views && !plain.length) continue;
      const whole = plain.length ? mergeAll(plain.map((i) => i.geo)) : EMPTY;
      const cutList: THREE.BufferGeometry[] = [];
      const acrossList: THREE.BufferGeometry[] = [];
      if (views && this.mode !== 'whole') {
        for (const it of list) {
          if (it.cutOnly) {
            cutList.push(it.geo);
            continue;
          }
          const c = cutGeometry(it.geo, 'z', 0, 0.2);
          if (c.kept) cutList.push(c.kept);
          if (c.face && it.section) addFace(faces, it.section, 'cut', c.face);
          if (this.mode === 'moving') continue;
          const a = cutGeometry(it.geo, 'y', acrossY, 0.2);
          if (a.kept) acrossList.push(a.kept);
          if (a.face && it.section) addFace(faces, it.section, 'across', a.face);
        }
      }
      const uncut = !views || this.mode === 'whole';
      const cut = uncut ? whole : cutList.length ? mergeAll(cutList) : EMPTY;
      const across = uncut ? whole : acrossList.length ? mergeAll(acrossList) : EMPTY;
      const mesh = new THREE.Mesh(views ? cut : whole, mat);
      mesh.name = `${this.group.name}-${mat.name}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      if (views) swaps.push({ mesh, whole, cut, across });
    }
    for (const [mat, f] of faces) {
      const cut = f.cut.length ? mergeAll(f.cut) : EMPTY;
      const across = f.across.length ? mergeAll(f.across) : EMPTY;
      const mesh = new THREE.Mesh(cut, mat);
      mesh.name = `${this.group.name}-face`;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData.noShadow = true;
      this.group.add(mesh);
      swaps.push({ mesh, whole: EMPTY, cut, across });
    }
    // the part's true extent, whichever half is drawn: the sheet's envelope is measured on the box, and a framing goes round the whole
    if (views && this.mode !== 'whole') {
      const box3 = new THREE.Box3();
      for (const it of this.items) {
        if (it.cutOnly) continue;
        it.geo.computeBoundingBox();
        box3.union(it.geo.boundingBox!);
      }
      if (!box3.isEmpty()) this.group.add(extentMarker(box3));
    }
  }
}

function addFace(
  faces: Map<THREE.Material, { cut: THREE.BufferGeometry[]; across: THREE.BufferGeometry[] }>,
  mat: THREE.Material,
  view: 'cut' | 'across',
  face: THREE.BufferGeometry,
): void {
  let f = faces.get(mat);
  if (!f) {
    f = { cut: [], across: [] };
    faces.set(mat, f);
  }
  f[view].push(face);
}

/** A mesh with two corners and no triangle: nothing to draw or click, and `Box3.setFromObject` counts it. */
export function extentMarker(b: THREE.Box3): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]), 3),
  );
  g.setIndex([]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  m.name = 'extent';
  m.castShadow = false;
  m.receiveShadow = false;
  m.userData.noShadow = true;
  m.userData.extent = true;
  m.raycast = () => {};
  return m;
}

export interface MachineOptions {
  /** The three views: only the world that asks for them pays for them. */
  views?: boolean;
  look?: MachineLook;
}

export interface Machine {
  root: THREE.Group;
  look: MachineLook;
  parts: Record<MachinePart, THREE.Group>;
  /** Moves and tilts with the state. Child of `parts['gas-bell']`. */
  bellPoseGroup: THREE.Group;
  /** Where the hose takes the tap, a marker in the bell's frame, and the way it leaves. */
  tapOutlet: THREE.Object3D;
  tapDir: THREE.Vector3;
  /** The brick's own pose inside its part. */
  brickPose: THREE.Group;
  slurry: Slurry;
  bubbles: Bubbles;
  bucket: { root: THREE.Group; liquid: THREE.Mesh; stream: THREE.Mesh; fill: number };
  pose: BellPose;
  view: MachineView;
  /** The plane of the across view. */
  acrossY: number;
  setView(v: MachineView): void;
  /** `addedWeight`, kg: the state does not carry it, the world reads it from the parameters. `live`: false when what is not a part must stand still and go. */
  update(s: BioState, dt: number, o?: { addedWeight?: number; live?: boolean; effluentLitres?: number }): void;
}

const D2R = Math.PI / 180;

/**
 * What the drawn machine shows of a state. The lab draws one machine, the 1,000 L tank, and Simulation's other sizes change only the figures: the voice and the panel's hint both say so. So a state of another size is carried
 * into the drawn tank by shares: its bell by its share of travel, its surface at the drawn overflow and pressed down as far as the model's pressure presses it, its layers by their share of the depth. In metres its numbers would stand
 * the slurry 76 cm above this tank's rim (QA B2). On the drawn machine the state passes through untouched.
 */
export function asDrawn(s: BioState, out: BioState): BioState {
  if (s.onDrawnMachine) return s;
  Object.assign(out, s);
  const share = Math.min(1, Math.max(0, s.bellRiseShare));
  const level = MACHINE.overflowLevel;
  const depth = s.levelRing > 0 ? level / s.levelRing : 1;
  out.bellRiseShare = share;
  out.bellRise = share * BELL.travel;
  out.bellRimHeight = BELL.restRim + out.bellRise;
  out.bellTopHeight = out.bellRimHeight + BELL.height;
  out.bellTilt = MACHINE.tiltRest + (MACHINE.tiltFull - MACHINE.tiltRest) * share;
  out.levelRing = level;
  out.levelRiser = level + (s.levelRiser - s.levelRing);
  out.levelInner = level - (s.levelRing - s.levelInner);
  out.sludgeHeight = s.sludgeHeight * depth;
  out.scumHeight = s.scumHeight * depth;
  return out;
}

/** The tank's outer face at a height, for what is strapped to it. */
const tankProfile = (): P2[] => {
  const R = TANK.outerR;
  const w = TANK.wall;
  const pts: P2[] = [
    [0, -w],
    [R - 0.035, -w],
    [R - 0.008, -w + 0.012],
    [R, 0.03],
  ];
  for (const y of TANK.hoops) {
    const h = TANK.hoopH / 2;
    pts.push([R, y - h], [TANK.hoopR, y - h + 0.014], [TANK.hoopR, y + h - 0.014], [R, y + h]);
  }
  pts.push(
    [R, TANK.height - 0.024],
    [TANK.beadR, TANK.height - 0.018],
    [TANK.beadR, TANK.height - 0.006],
    [R, TANK.height],
    [TANK.innerR, TANK.height],
    [TANK.innerR, 0.018],
    [TANK.innerR - 0.018, 0],
    [0, 0],
  );
  return pts;
};

/** The bell's wall at a height in its own frame: a hoop stands proud of it. For what is painted on it. */
export function bellOuterAt(y: number): number {
  for (const h of BELL.hoops) {
    const d = Math.abs(y - h);
    const half = BELL.hoopH / 2;
    if (d < half) {
      const ramp = Math.min(1, (half - d) / 0.012);
      return BELL.outerR + (BELL.hoopR - BELL.outerR) * ramp;
    }
  }
  return BELL.outerR;
}

const bellProfile = (): P2[] => {
  const R = BELL.outerR;
  const H = BELL.height;
  const r = BELL.innerR;
  const w = BELL.wall;
  const pts: P2[] = [
    [r, 0],
    [R, 0],
  ];
  for (const y of BELL.hoops) {
    const h = BELL.hoopH / 2;
    pts.push([R, y - h], [BELL.hoopR, y - h + 0.012], [BELL.hoopR, y + h - 0.012], [R, y + h]);
  }
  pts.push(
    [R, H - 0.045],
    [R - 0.012, H - 0.012],
    [R - 0.045, H],
    [0, H],
    [0, H - w],
    [r - 0.042, H - w],
    [r - 0.012, H - w - 0.012],
    [r, H - 0.045],
  );
  return pts;
};

/** A small flat stroke on the bell's side, following its hoops: paint. In the bell's frame, bearing in radians from -X towards the back. */
function paintOnBell(
  b0: number,
  b1: number,
  y0: number,
  y1: number,
  out: number[],
  nor: number[],
  idx: number[],
): void {
  const lift = MARKS.arcR;
  const steps = Math.max(1, Math.ceil(Math.abs(b1 - b0) / (4 * D2R)));
  const first = out.length / 3;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + b0 + ((b1 - b0) * i) / steps;
    const c = Math.cos(a);
    const s = Math.sin(a);
    for (const y of [y0, y1]) {
      const r = bellOuterAt(y) + lift;
      out.push(r * c, y, r * s);
      nor.push(c, 0, s);
    }
  }
  for (let i = 0; i < steps; i++) {
    const a = first + i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
}

/** Digits as a sign-painter's seven strokes, on the bell's side. */
const SEGS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  L: 'fed',
};
function paintText(
  text: string,
  bearing: number,
  y: number,
  h: number,
  out: number[],
  nor: number[],
  idx: number[],
): void {
  const w = h * 0.56;
  const t = h * 0.14;
  const arc = (x: number) => bearing + x / BELL.outerR;
  [...text].forEach((ch, n) => {
    const x0 = n * (w + t * 1.4);
    const x1 = x0 + w;
    const yb = y;
    const ym = y + h / 2;
    const yt = y + h;
    const segs: Record<string, [number, number, number, number]> = {
      a: [x0, x1, yt - t, yt],
      b: [x1 - t, x1, ym, yt],
      c: [x1 - t, x1, yb, ym],
      d: [x0, x1, yb, yb + t],
      e: [x0, x0 + t, yb, ym],
      f: [x0, x0 + t, ym, yt],
      g: [x0, x1, ym - t / 2, ym + t / 2],
    };
    for (const key of SEGS[ch] ?? '') {
      const [a, b, c, d] = segs[key];
      paintOnBell(arc(a), arc(b), c, d, out, nor, idx);
    }
  });
}

function flatGeometry(pos: number[], nor: number[], idx: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx);
  return g;
}

export function buildMachine(o: MachineOptions = {}): Machine {
  const look = o.look ?? machineLook();
  const views = o.views === true;
  const root = new THREE.Group();
  root.name = 'machine';
  const parts = Object.fromEntries(
    MACHINE_PARTS.map((id) => {
      const g = new THREE.Group();
      g.name = id;
      return [id, g];
    }),
  ) as Record<MachinePart, THREE.Group>;
  const bellPoseGroup = new THREE.Group();
  bellPoseGroup.name = 'bell-pose';
  parts['gas-bell'].add(bellPoseGroup);
  for (const id of ['gas-tap', 'scale-marks', 'gas-space'] as const) bellPoseGroup.add(parts[id]);
  for (const id of MACHINE_PARTS) if (!parts[id].parent) root.add(parts[id]);

  const acrossY = OVERFLOW.axisY + 0.002;
  const swaps: Swap[] = [];
  const bodies: Body[] = [];
  const body = (id: MachinePart, mode: 'fixed' | 'moving' | 'whole' = 'fixed', group?: THREE.Group): Body => {
    const b = new Body(group ?? parts[id], mode);
    bodies.push(b);
    return b;
  };

  // ---- the pallet: three runners under seven boards, three under them. The tank's floor lies on its deck
  const pallet = body('pallet');
  const deckTop = -TANK.wall;
  const deckY0 = deckTop - PALLET.deck;
  const bottomY1 = deckTop - PALLET.h + PALLET.deck;
  const px = PALLET.x / 2;
  const pz = PALLET.z / 2;
  const boards = 7;
  for (let i = 0; i < boards; i++) {
    const z = -pz + PALLET.boardW / 2 + ((PALLET.z - PALLET.boardW) * i) / (boards - 1);
    pallet.add(
      boxBoard(-px, px, deckY0, deckTop, z - PALLET.boardW / 2, z + PALLET.boardW / 2),
      look.palletWood,
      look.sectionWood,
    );
  }
  for (const x of [-px + PALLET.runner / 2, 0, px - PALLET.runner / 2]) {
    pallet.add(
      boxBoardZ(x - PALLET.runner / 2, x + PALLET.runner / 2, bottomY1, deckY0, -pz, pz),
      look.palletWood,
      look.sectionWood,
    );
  }
  for (const z of [-pz + 0.06, 0, pz - 0.06]) {
    pallet.add(boxBoard(-px, px, deckTop - PALLET.h, bottomY1, z - 0.06, z + 0.06), look.palletWood, look.sectionWood);
  }

  // ---- the tank, its top cut off
  const tank = body('digester-tank');
  tank.add(revolveY(tankProfile(), { seg: 72 }), look.tank, look.section);
  // inside, a duller skin: an open surface, no face of its own
  const lining = revolveY(
    [
      [TANK.innerR - 0.0004, TANK.height - 0.001],
      [TANK.innerR - 0.0004, 0.018],
      [TANK.innerR - 0.019, 0.0004],
      [0.001, 0.0004],
    ],
    { seg: 72, closed: false },
  );
  tank.add(lining, look.hdpeInside, null);
  // the sampling tap of the research plant (K7), on the back: a brass stub and a small lever
  const tapA = (VALVES.tapBearing * Math.PI) / 180;
  const stubDir = V(Math.cos(tapA), 0, Math.sin(tapA));
  const stubFrom = stubDir
    .clone()
    .multiplyScalar(TANK.outerR - 0.002)
    .setY(VALVES.tapY);
  const stubTo = stubDir
    .clone()
    .multiplyScalar(TANK.outerR + 0.06)
    .setY(VALVES.tapY);
  tank.add(rod(stubFrom, stubTo, 0.0095, 12), look.brass, look.sectionMetal);
  tank.add(
    hex(stubFrom.clone().addScaledVector(stubDir, 0.003), stubFrom.clone().addScaledVector(stubDir, 0.018), 0.018),
    look.brass,
    look.sectionMetal,
  );
  tank.add(
    cylY(0.0115, VALVES.tapY - 0.018, VALVES.tapY + 0.018, stubTo.x, stubTo.z, 12),
    look.brass,
    look.sectionMetal,
  );
  tank.add(cylY(0.004, VALVES.tapY + 0.018, VALVES.tapY + 0.04, stubTo.x, stubTo.z, 8), look.brass, look.sectionMetal);
  tank.add(
    rod(
      V(stubTo.x, VALVES.tapY + 0.04, stubTo.z),
      V(stubTo.x + stubDir.z * 0.05, VALVES.tapY + 0.04, stubTo.z - stubDir.x * 0.05),
      0.0045,
      8,
    ),
    look.redPaint,
    look.sectionMetal,
  );

  // ---- the bell, in its own frame: the same tank, turned over
  const bell = body('gas-bell', 'moving', bellPoseGroup);
  bell.add(revolveY(bellProfile(), { seg: 72 }), look.bell, look.section);
  bell.add(
    revolveY(
      [
        [BELL.innerR - 0.0004, 0.001],
        [BELL.innerR - 0.0004, BELL.height - 0.046],
        [BELL.innerR - 0.013, BELL.height - BELL.wall - 0.0125],
        [BELL.innerR - 0.043, BELL.height - BELL.wall - 0.0004],
        [0.001, BELL.height - BELL.wall - 0.0004],
      ],
      { seg: 72, closed: false },
    ),
    look.hdpeInside,
    null,
  );

  // ---- the scale on its side (K5): a stroke every 20 L, a longer one and a figure every 100 L, read against the tank's rim
  const marks = body('scale-marks', 'moving');
  const mp: number[] = [];
  const mn: number[] = [];
  const mi: number[] = [];
  const steps = Math.round(MARKS.litres / MARKS.stepLitres);
  const from = MARKS.from * D2R;
  for (let i = 0; i <= steps; i++) {
    const litres = i * MARKS.stepLitres;
    const y = MARKS.zeroY - (litres / 100) * MARKS.per100;
    const long = litres % 100 === 0;
    const arc = (long ? MARKS.longArc : MARKS.shortArc) * D2R;
    const t = long ? 0.0035 : 0.0022;
    paintOnBell(from, from + arc, y - t, y + t, mp, mn, mi);
    if (long) {
      const text = String(litres);
      const b = from + arc + 1.8 * D2R;
      paintText(text, b, y - 0.018, 0.036, mp, mn, mi);
      paintText('L', b + (text.length * 0.0275 + 0.012) / BELL.outerR, y - 0.018, 0.036, mp, mn, mi);
    }
  }
  marks.add(flatGeometry(mp, mn, mi), look.white, null);

  // ---- the gas tap, on the closed end: flange, nipple, a cock on its side, a barb for the hose, its lever on top
  const tap = body('gas-tap', 'moving');
  const H = BELL.height;
  const tx = TAP.x;
  const tz = TAP.z;
  const bodyY = H + 0.062;
  tap.add(cylY(0.038, H - 0.001, H + 0.007, tx, tz, 18), look.rubber, look.sectionMetal);
  tap.add(cylY(0.03, H + 0.007, H + 0.013, tx, tz, 6), look.brass, look.sectionMetal);
  tap.add(cylY(0.0135, H + 0.013, bodyY, tx, tz, 14), look.brass, look.sectionMetal);
  tap.add(cylX(0.021, tx - 0.03, tx + 0.018, bodyY, tz, 16), look.brass, look.sectionMetal);
  tap.add(hex(V(tx - 0.038, bodyY, tz), V(tx - 0.026, bodyY, tz), 0.019), look.brass, look.sectionMetal);
  tap.add(cylY(0.0055, bodyY, bodyY + 0.038, tx - 0.006, tz, 10), look.brass, look.sectionMetal);
  tap.add(
    rod(V(tx - 0.006, bodyY + 0.036, tz), V(tx - 0.075, bodyY + 0.036, tz), 0.0055, 8),
    look.redPaint,
    look.sectionMetal,
  );
  // the barb
  const barbFrom = V(tx - 0.038, bodyY, tz);
  const barbTo = V(tx - 0.078, bodyY, tz);
  tap.add(rod(barbFrom, barbTo, 0.0075, 12), look.brass, look.sectionMetal);
  for (const k of [0.3, 0.55, 0.8]) {
    const c = barbFrom.clone().lerp(barbTo, k);
    tap.add(
      rod(c.clone().add(V(0.004, 0, 0)), c.clone().add(V(-0.004, 0, 0)), 0.0095, 12, 0.0078),
      look.brass,
      look.sectionMetal,
    );
  }
  const tapOutlet = new THREE.Object3D();
  tapOutlet.name = 'tap-outlet';
  tapOutlet.position.copy(barbTo).add(V(0.01, 0, 0));
  tapOutlet.userData.keep = true;
  parts['gas-tap'].add(tapOutlet);
  const tapDir = V(-1, 0, 0);

  // ---- the half-brick: a half block, its webs showing at the broken end. Inside its part, on its own pose
  const brickPose = new THREE.Group();
  brickPose.name = 'brick-pose';
  parts['half-brick'].add(brickPose);
  const brick = body('half-brick', 'whole', brickPose);
  const bw = BRICK.w / 2;
  const bd = BRICK.d / 2;
  const wall = 0.03;
  // one closed outer shell with two cores, drawn as its walls: the block as it is cast
  for (const g of [
    box(-bw, bw, 0, BRICK.h, -bd, -bd + wall),
    box(-bw, bw, 0, BRICK.h, bd - wall, bd),
    box(-bw, -bw + wall, 0, BRICK.h, -bd + wall, bd - wall),
    box(-0.016, 0.016, 0, BRICK.h, -bd + wall, bd - wall),
    box(bw - 0.012, bw, 0, 0.018, -bd + wall, bd - wall),
    box(-bw + wall, -0.016, 0, 0.012, -bd + wall, bd - wall),
    box(0.016, bw - 0.012, 0, 0.012, -bd + wall, bd - wall),
  ]) {
    brick.add(g, look.brick, look.sectionMetal);
  }
  const brick2Pose = new THREE.Group();
  brick2Pose.name = 'brick-second';
  brick2Pose.position.set(0.012, BRICK.h, -0.004);
  brick2Pose.rotation.y = 0.14;
  brickPose.add(brick2Pose);
  const brick2 = body('half-brick', 'whole', brick2Pose);
  for (const g of [
    box(-bw, bw, 0, BRICK.h, -bd, -bd + wall),
    box(-bw, bw, 0, BRICK.h, bd - wall, bd),
    box(-bw, -bw + wall, 0, BRICK.h, -bd + wall, bd - wall),
    box(-0.016, 0.016, 0, BRICK.h, -bd + wall, bd - wall),
    box(-bw + wall, bw - 0.012, 0, 0.012, -bd + wall, bd - wall),
  ]) {
    brick2.add(g, look.brick, look.sectionMetal);
  }

  // ---- the feed: funnel, riser, tee, plug, the stub to the wall, the connector, the inner pipe
  const y = FEED.axisY;
  const rx = FEED.riserX;
  const ro = FEED.ro;
  const ri = FEED.ri;
  const inner = body('inner-feed-pipe');
  inner.add(
    pipeSolid([V(TANK.innerR + 0.002, y, 0), V(TANK.innerR - FEED.reach, y, 0)], ro, ri, 24),
    look.feedPvc,
    look.sectionPvc,
  );
  // what fills its bore, on the cut: it reads as a pipe full of slurry, and it can be clicked
  inner.cutOnly(box(TANK.innerR - FEED.reach, TANK.innerR, y - ri, y + ri, -0.0025, -0.0015), look.clear);
  // a saddle under its far end, on the tank's floor: what carries it. A reading of ours: no source draws one
  inner.add(
    box(TANK.innerR - FEED.reach + 0.03, TANK.innerR - FEED.reach + 0.07, 0, y - ro + 0.002, -0.05, 0.05),
    look.feedPvc,
    look.sectionPvc,
  );

  const conn = body('tank-connector');
  const connR = 0.064;
  const wallIn = TANK.innerR;
  const wallOut = TANK.outerR;
  conn.add(
    pipeSolid([V(wallIn - 0.012, y, 0), V(wallIn - 0.002, y, 0)], connR, ro - 0.0002, 28),
    look.feedPvc,
    look.sectionPvc,
  );
  conn.add(
    pipeSolid([V(wallIn - 0.002, y, 0), V(wallIn, y, 0)], connR - 0.002, ro - 0.0002, 28),
    look.gasket,
    look.sectionMetal,
  );
  conn.add(
    pipeSolid([V(wallOut, y, 0), V(wallOut + 0.002, y, 0)], connR - 0.002, ro - 0.0002, 28),
    look.gasket,
    look.sectionMetal,
  );
  conn.add(
    pipeSolid([V(wallOut + 0.002, y, 0), V(wallOut + 0.016, y, 0)], connR, ro - 0.0002, 28),
    look.feedPvc,
    look.sectionPvc,
  );
  // the plastic's own hole: a face over the wall's cut, across the bore, in the colour of what fills it
  conn.cutOnly(box(wallIn - 0.002, wallOut + 0.002, y - ri, y + ri, -0.001, 0.0008), look.clear);
  // the bolts round the flanges
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    const by = y + Math.cos(a) * 0.052;
    const bz = Math.sin(a) * 0.052;
    conn.add(rod(V(wallIn - 0.018, by, bz), V(wallOut + 0.022, by, bz), 0.0035, 8), look.zinc, look.sectionMetal);
  }

  const tee = body('feed-tee');
  const socket = ro + 0.006;
  const teeX0 = rx - 0.055;
  const teeX1 = rx + 0.055;
  // the stub from the wall to the tee, then the tee's own run and its branch up
  tee.add(pipeSolid([V(wallOut - 0.001, y, 0), V(teeX0 + 0.002, y, 0)], ro, ri, 24), look.feedPvc, look.sectionPvc);
  tee.add(pipeSolid([V(teeX0, y, 0), V(teeX1, y, 0)], socket, ri, 24), look.feedPvc, look.sectionPvc);
  tee.add(pipeSolid([V(rx, y + ri - 0.004, 0), V(rx, y + 0.075, 0)], socket, ri, 24), look.feedPvc, look.sectionPvc);
  tee.add(
    pipeSolid([V(teeX0 - 0.012, y, 0), V(teeX0, y, 0)], socket + 0.004, ro - 0.0005, 24),
    look.feedPvc,
    look.sectionPvc,
  );
  // hole of the branch in the run's crown, in the cut
  tee.cutOnly(box(rx - ri, rx + ri, y + ri - 0.001, y + ri + 0.009, -0.001, 0.0008), look.clear);
  // what fills the stub and the run, on the cut: the riser's column is the model's, below
  tee.cutOnly(box(wallOut - 0.002, rx + ri, y - ri, y + ri, FACE_Z.clear - 0.0005, FACE_Z.clear), look.clear);

  const plug = body('clean-out-plug');
  plug.add(
    pipeSolid([V(teeX1 - 0.001, y, 0), V(teeX1 + FEED.plugLength - 0.008, y, 0)], socket + 0.003, ri + 0.0005, 24),
    look.pvcCream,
    look.sectionPvc,
  );
  plug.add(
    cylX(socket + 0.003, teeX1 + FEED.plugLength - 0.008, teeX1 + FEED.plugLength, y, 0, 24),
    look.pvcCream,
    look.sectionPvc,
  );
  plug.add(
    hex(V(teeX1 + FEED.plugLength, y, 0), V(teeX1 + FEED.plugLength + 0.022, y, 0), 0.03),
    look.pvcCream,
    look.sectionPvc,
  );

  const riser = body('feed-riser');
  riser.add(
    pipeSolid([V(rx, y + 0.07, 0), V(rx, FEED.funnelNeck + 0.008, 0)], ro, ri, 24),
    look.feedPvc,
    look.sectionPvc,
  );
  // its bracket to the tank: a saddle on the pipe, an arm to a pad on the tank's wall
  const braceY = TANK.hoops[2] - 0.095;
  riser.add(
    box(TANK.outerR - 0.001, TANK.outerR + 0.006, braceY - 0.03, braceY + 0.03, -0.045, 0.045),
    look.zinc,
    look.sectionMetal,
  );
  riser.add(
    box(TANK.outerR + 0.004, rx - ro + 0.003, braceY - 0.016, braceY + 0.016, -0.012, 0.012),
    look.zinc,
    look.sectionMetal,
  );
  riser.add(
    pipeSolid([V(rx, braceY - 0.018, 0), V(rx, braceY + 0.018, 0)], ro + 0.004, ro - 0.0005, 24),
    look.zinc,
    look.sectionMetal,
  );

  const funnel = body('feed-funnel');
  const fR = FEED.funnelR;
  const neck = FEED.funnelNeck;
  const top = FEED.funnelTop;
  const funnelGeo = revolveY(
    [
      [ri + 0.001, neck - 0.012],
      [ro + 0.005, neck - 0.012],
      [ro + 0.005, neck + 0.012],
      [fR - 0.006, top - 0.012],
      [fR, top - 0.012],
      [fR, top],
      [fR - 0.006, top],
      [ro, neck + 0.018],
      [ri + 0.001, neck + 0.018],
    ],
    { seg: 40 },
  );
  funnelGeo.translate(rx, 0, 0);
  funnel.add(funnelGeo, look.funnel, look.section);

  // ---- the overflow: through the wall at the level, out, down
  const over = body('overflow-pipe');
  const oy = OVERFLOW.axisY;
  const ex = OVERFLOW.elbowX;
  const oEnd = oy - OVERFLOW.drop;
  const oPath = rounded([V(-TANK.innerR + 0.001, oy, 0), V(ex, oy, 0), V(ex, oEnd, 0)], 0.05, 8);
  over.add(pipeSolid(oPath, OVERFLOW.ro, OVERFLOW.ri, 20), look.feedPvc, look.sectionPvc);
  const ofl = OVERFLOW.ro + 0.02;
  over.add(
    pipeSolid([V(-TANK.outerR - 0.012, oy, 0), V(-TANK.outerR - 0.001, oy, 0)], ofl, OVERFLOW.ro - 0.0003, 22),
    look.feedPvc,
    look.sectionPvc,
  );
  over.add(
    pipeSolid([V(-TANK.innerR + 0.001, oy, 0), V(-TANK.innerR + 0.009, oy, 0)], ofl, OVERFLOW.ro - 0.0003, 22),
    look.feedPvc,
    look.sectionPvc,
  );
  // hole in the plastic, dark as the pipe's inside
  over.cutOnly(
    box(-TANK.outerR - 0.002, -TANK.innerR + 0.002, oy - OVERFLOW.ri, oy + OVERFLOW.ri, -0.001, 0.0008),
    look.hdpeInside,
  );
  // two straps: the run to the rim, the drop to the tank's wall
  const strapY = oEnd + 0.2;
  over.add(
    pipeSolid([V(ex, strapY - 0.014, 0), V(ex, strapY + 0.014, 0)], OVERFLOW.ro + 0.003, OVERFLOW.ro - 0.0003, 20),
    look.zinc,
    look.sectionMetal,
  );
  over.add(
    box(-TANK.outerR - 0.006, ex + OVERFLOW.ro, strapY - 0.012, strapY + 0.012, -0.009, 0.009),
    look.zinc,
    look.sectionMetal,
  );
  over.add(
    box(-TANK.outerR - 0.006, -TANK.outerR + 0.001, strapY - 0.03, strapY + 0.03, -0.04, 0.04),
    look.zinc,
    look.sectionMetal,
  );

  // ---- the bottom valve of the research plant (K7): 2", a ball valve on a nipple, on the back
  const valve = body('bottom-valve');
  const vA = (VALVES.bottomBearing * Math.PI) / 180;
  const vDir = V(Math.cos(vA), 0, Math.sin(vA));
  const vy = VALVES.bottomY;
  const along = (r: number) => vDir.clone().multiplyScalar(r).setY(vy);
  const vr = OVERFLOW.ro;
  valve.add(rod(along(TANK.outerR - 0.003), along(TANK.outerR + 0.045), vr, 18), look.feedPvc, look.sectionPvc);
  valve.add(rod(along(TANK.outerR - 0.001), along(TANK.outerR + 0.009), vr + 0.018, 22), look.feedPvc, look.sectionPvc);
  valve.add(hex(along(TANK.outerR + 0.04), along(TANK.outerR + 0.062), vr + 0.009), look.brass, look.sectionMetal);
  valve.add(rod(along(TANK.outerR + 0.06), along(TANK.outerR + 0.112), vr + 0.012, 20), look.brass, look.sectionMetal);
  valve.add(hex(along(TANK.outerR + 0.11), along(TANK.outerR + 0.132), vr + 0.009), look.brass, look.sectionMetal);
  valve.add(rod(along(TANK.outerR + 0.13), along(TANK.outerR + 0.17), vr, 18), look.feedPvc, look.sectionPvc);
  const stem = along(TANK.outerR + 0.086);
  valve.add(cylY(0.007, vy + vr + 0.008, vy + vr + 0.034, stem.x, stem.z, 10), look.brass, look.sectionMetal);
  const lever0 = stem.clone().setY(vy + vr + 0.034);
  const lever1 = lever0.clone().add(V(vDir.z * 0.11, 0, -vDir.x * 0.11));
  valve.add(rod(lever0, lever1, 0.007, 8), look.redPaint, look.sectionMetal);
  const cap = along(TANK.outerR + 0.17);
  valve.add(rod(cap, cap.clone().addScaledVector(vDir, 0.012), vr + 0.004, 18), look.pvcCream, look.sectionPvc);

  // ---- the float limiter of another build (S9), two inverted U's, across the tank on its diagonals, strapped to its wall
  const limiter = body('float-limiter');
  const legR = LIMITER.across / 2;
  const legX = legR * Math.SQRT1_2;
  const limR = LIMITER.r;
  const yBar0 = LIMITER.barY;
  const yBar1 = LIMITER.barY + 2 * limR;
  const u = (sx: number, sz: number, yb: number, yLeg: number) => {
    const a = V(sx * legX, yLeg, sz * legX);
    const b = V(sx * legX, yb, sz * legX);
    const c = V(-sx * legX, yb, -sz * legX);
    const d = V(-sx * legX, yLeg, -sz * legX);
    limiter.add(pipeSolid(rounded([a, b, c, d], 0.06, 8), limR, limR - 0.0028, 14), look.pvcCream, look.sectionPvc);
  };
  u(1, 1, yBar0, LIMITER.legBottom);
  u(1, -1, yBar1, LIMITER.legBottom + 2 * limR);
  // where they cross, tied; and each leg in two clips on the tank's wall
  limiter.add(cylY(limR + 0.006, yBar0 - 0.002, yBar1 + 0.002, 0, 0, 12), look.rubber, look.sectionMetal);
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const lx = sx * legX;
    const lz = sz * legX;
    for (const yy of [TANK.hoops[2] + 0.058, TANK.height - 0.062]) {
      const inward = V(-sx * Math.SQRT1_2, 0, -sz * Math.SQRT1_2);
      const from = V(lx, yy, lz).addScaledVector(inward, limR - 0.002);
      const to = V(lx, yy, lz).addScaledVector(inward, legR - TANK.outerR + 0.002);
      limiter.add(rod(from, to, 0.011, 10), look.zinc, look.sectionMetal);
      limiter.add(rod(V(lx, yy - 0.012, lz), V(lx, yy + 0.012, lz), limR + 0.004, 14), look.zinc, look.sectionMetal);
      const pad = V(lx, yy, lz).addScaledVector(inward, legR - TANK.outerR);
      limiter.add(
        rod(pad.clone().addScaledVector(inward, 0.002), pad.clone().addScaledVector(inward, -0.004), 0.024, 14),
        look.zinc,
        look.sectionMetal,
      );
    }
  }

  for (const b of bodies) b.finish(views, acrossY, swaps);

  // ---- the slurry, from the model
  const slurry = new Slurry(
    look,
    views,
    {
      ring: parts['rim-gap'],
      inner: parts['scum-layer'],
      clear: parts['clear-liquor'],
      sludge: parts['sludge-bed'],
      bell: parts['gas-bell'],
    },
    acrossY,
  );
  if (views) slurry.setView('cut');
  const bubbles = new Bubbles(look);
  root.add(bubbles.mesh);

  // ---- the riser's column and its surface, level with the ring (physics §7). Its top is the state's
  const columnGeo = new THREE.PlaneGeometry(1, 1);
  columnGeo.translate(0, 0.5, 0);
  const columnMesh = new THREE.Mesh(views ? columnGeo : EMPTY, look.clear);
  columnMesh.name = 'riser-column';
  columnMesh.position.set(rx, y + ri - 0.002, FACE_Z.clear);
  columnMesh.scale.set(2 * ri, 1, 1);
  columnMesh.castShadow = false;
  columnMesh.userData.noShadow = true;
  parts['feed-riser'].add(columnMesh);
  const discWhole = new THREE.CircleGeometry(ri + 0.0005, 24).rotateX(-Math.PI / 2);
  const discHalf = new THREE.CircleGeometry(ri + 0.0005, 24, 0, Math.PI).rotateX(-Math.PI / 2);
  const discMesh = new THREE.Mesh(views ? discHalf : discWhole, look.surface);
  discMesh.name = 'riser-surface';
  discMesh.position.set(rx, 1, 0);
  discMesh.castShadow = false;
  discMesh.userData.noShadow = true;
  parts['feed-riser'].add(discMesh);
  if (views) {
    swaps.push({ mesh: columnMesh, whole: EMPTY, cut: columnGeo, across: EMPTY });
    swaps.push({ mesh: discMesh, whole: discWhole, cut: discHalf, across: discWhole });
  }
  // what the part's box says, whichever half is drawn
  if (views) {
    const cylinder = (y0: number, y1: number, r: number) =>
      new THREE.Box3(new THREE.Vector3(-r, y0, -r), new THREE.Vector3(r, y1, r));
    parts['clear-liquor'].add(extentMarker(cylinder(0, 1.04, TANK.innerR)));
    parts['sludge-bed'].add(extentMarker(cylinder(0, 0.16, TANK.innerR)));
    parts['scum-layer'].add(extentMarker(cylinder(0.92, 1.04, BELL.innerR)));
    parts['rim-gap'].add(extentMarker(cylinder(1.035, 1.045, TANK.innerR)));
  } else {
    // closed, the ring is a part of the machine with a real box: nothing to add
  }

  // ---- the gas space, in the bell's frame: a face in the cut, a whole volume otherwise. Its floor is the surface, horizontal however the bell leans
  const gasFaceGeo = new THREE.BufferGeometry();
  gasFaceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  gasFaceGeo.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3),
  );
  gasFaceGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2));
  gasFaceGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const GAS_SEG = 48;
  const gasWholeGeo = new THREE.BufferGeometry();
  const gasCount = (GAS_SEG + 1) * 2 + 1;
  gasWholeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gasCount * 3), 3));
  const gn = new Float32Array(gasCount * 3);
  const gIdx: number[] = [];
  const gr = BELL.innerR - 0.001;
  const gasTop = BELL.height - BELL.wall - 0.002;
  for (let i = 0; i <= GAS_SEG; i++) {
    const a = (i / GAS_SEG) * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    gn[i * 6] = c;
    gn[i * 6 + 2] = sn;
    gn[i * 6 + 3] = c;
    gn[i * 6 + 5] = sn;
    if (i < GAS_SEG) {
      const k = i * 2;
      gIdx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      // the top disc, a fan from the last vertex
      gIdx.push(gasCount - 1, k + 3, k + 1);
    }
  }
  gn[(gasCount - 1) * 3 + 1] = 1;
  gasWholeGeo.setAttribute('normal', new THREE.BufferAttribute(gn, 3));
  gasWholeGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gasCount * 2), 2));
  gasWholeGeo.setIndex(gIdx);
  (gasWholeGeo.attributes.position as THREE.BufferAttribute).setXYZ(gasCount - 1, 0, gasTop, 0);
  const gasMesh = new THREE.Mesh(views ? gasFaceGeo : gasWholeGeo, look.gas);
  gasMesh.name = 'gas-space';
  // a fixed order among what is see-through: no swap as the camera turns
  gasMesh.renderOrder = 2;
  gasMesh.frustumCulled = false;
  gasMesh.castShadow = false;
  gasMesh.receiveShadow = false;
  gasMesh.userData.noShadow = true;
  gasMesh.visible = views;
  parts['gas-space'].add(gasMesh);
  parts['gas-space'].add(
    extentMarker(new THREE.Box3(new THREE.Vector3(-gr, 0.72, -gr), new THREE.Vector3(gr, gasTop, gr))),
  );

  // ---- the bucket under the overflow, and what falls into it. Scenery or a part, as the world says
  const bucketRoot = new THREE.Group();
  bucketRoot.name = 'bucket';
  const bucketY = deckTop - PALLET.h;
  const bk = BUCKET;
  const bucketGeo = revolveY(
    [
      [0, 0],
      [bk.rBottom, 0],
      [bk.rTop, bk.h - 0.012],
      [bk.rTop + 0.006, bk.h - 0.012],
      [bk.rTop + 0.006, bk.h],
      [bk.rTop - bk.wall, bk.h],
      [bk.rBottom - bk.wall, bk.wall],
      [0, bk.wall],
    ],
    { seg: 36 },
  );
  const bucketMesh = new THREE.Mesh(bucketGeo, look.bucket);
  bucketMesh.castShadow = true;
  bucketMesh.receiveShadow = true;
  bucketRoot.add(bucketMesh);
  // its handle, hanging down its side
  bucketRoot.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(bk.rTop + 0.004, 0.0035, 6, 30, Math.PI).rotateX(1.85).translate(0, bk.h - 0.008, 0),
      look.steel,
    ),
  );
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.002, 32), look.surface);
  liquid.name = 'bucket-liquid';
  liquid.position.y = bk.wall + 0.03;
  bucketRoot.add(liquid);
  bucketRoot.position.set(ex, bucketY, 0);
  const streamGeo = new THREE.CylinderGeometry(0.012, 0.016, 1, 10, 1, true);
  streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, look.effluent);
  stream.name = 'effluent-stream';
  stream.renderOrder = 1;
  stream.position.set(ex, oEnd, 0);
  stream.visible = false;
  stream.castShadow = false;
  stream.userData.noShadow = true;

  const brickOn = { k: 0 };
  const pose = bellPose(BELL.restRim, 5);
  const drawnNow = {} as BioState;
  const tmpP = new THREE.Vector3();
  let view: MachineView = views ? 'cut' : 'whole';
  let feedSeen = -1;
  let daySeen = -1;
  let feedsToday = 0;
  let pour = 0;
  let levelK = 0;
  let lastGas = -1;

  const m: Machine = {
    root,
    look,
    parts,
    bellPoseGroup,
    tapOutlet,
    tapDir,
    brickPose,
    slurry,
    bubbles,
    bucket: { root: bucketRoot, liquid, stream, fill: 0 },
    pose,
    view,
    acrossY,
    setView(v) {
      if (view === v) return;
      view = v;
      m.view = v;
      for (const s of swaps) s.mesh.geometry = s[v];
      slurry.setView(v);
      gasMesh.geometry = v === 'cut' ? gasFaceGeo : v === 'whole' ? gasWholeGeo : EMPTY;
      lastGas = -1;
    },
    update(state, dt, o2 = {}) {
      const s = asDrawn(state, drawnNow);
      bellPose(s.bellRimHeight, s.bellTilt, pose);
      bellPoseGroup.position.set(pose.xc, pose.rim, 0);
      bellPoseGroup.rotation.z = pose.theta;
      slurry.update(s, pose);
      // a soured tank's liquor goes the way of the drop's colour: the model's index, a tint and no more
      look.clear.color.setRGB(1, 1 - 0.3 * s.sourIndex, 1 - 0.5 * s.sourIndex);
      writeGas(s);
      bubbles.update(s, pose, dt, view, o2.live !== false);

      // the brick comes to the bell when the model lays a weight on it, a second above 18 kg; it sits on the pad beside the pallet otherwise
      const added = o2.addedWeight ?? 0;
      const wantOn = added > 0 ? 1 : 0;
      brickOn.k += (wantOn - brickOn.k) * Math.min(1, dt * 3);
      if (Math.abs(wantOn - brickOn.k) < 0.001) brickOn.k = wantOn;
      placeBrick(brickOn.k);
      brick2Pose.visible = added > 18;
      // the riser's level, what the model says of it; a feed lifts it a moment. That lift is decoration (docs/water.md)
      const lift = pour > 0 ? 0.05 * Math.sin((Math.min(2.4, pour) / 2.4) * Math.PI) : 0;
      const level = s.levelRiser + lift;
      columnMesh.scale.y = Math.max(0.01, level - columnMesh.position.y);
      discMesh.position.y = level;

      // the effluent: as many litres as the feed pushes in, out at the overflow after each feed. Its length on screen is the eye's, its volume the model's
      if (feedSeen < 0) feedSeen = s.feedCount;
      if (daySeen !== s.dayNumber) {
        daySeen = s.dayNumber;
        feedsToday = 0;
      }
      if (s.feedCount !== feedSeen) {
        feedSeen = s.feedCount;
        feedsToday = Math.min(4, feedsToday + 1);
        pour = 2.4;
      }
      pour = Math.max(0, pour - dt);
      stream.visible = pour > 0 && o2.live !== false;
      const litres = o2.effluentLitres ?? (s.dayEffluentL > 0 ? s.dayEffluentL / 2 : 10);
      const capacity = (Math.PI * (bk.rBottom + bk.rTop) ** 2 * (bk.h - 0.03) * 1000) / 4;
      const fill = Math.min(1, (feedsToday * litres) / capacity);
      levelK += (fill - levelK) * Math.min(1, dt * 1.6);
      m.bucket.fill = levelK;
      const lvl = bk.wall + 0.004 + (bk.h - 0.04) * levelK;
      liquid.position.y = lvl;
      const rl = levelK > 0.005 ? bk.rBottom - bk.wall + (bk.rTop - bk.rBottom) * (lvl / bk.h) : 0.001;
      liquid.scale.set(rl, 1, rl);
      stream.scale.y = Math.max(0.05, oEnd - (bucketY + lvl));
    },
  };

  function writeGas(s: BioState): void {
    const key = pose.rim * 1000 + pose.theta * 100 + s.levelInner * 10;
    if (Math.abs(key - lastGas) < 1e-3) return;
    lastGas = key;
    const cos = Math.cos(pose.theta);
    const sin = Math.sin(pose.theta);
    const h = s.levelInner - pose.rim;
    const yl = (x: number) => (h - x * sin) / cos;
    if (view === 'cut') {
      const p = gasFaceGeo.attributes.position as THREE.BufferAttribute;
      const R = BELL.innerR;
      const z = FACE_Z.gas;
      p.setXYZ(0, -R, yl(-R), z);
      p.setXYZ(1, R, yl(R), z);
      p.setXYZ(2, R, gasTop, z);
      p.setXYZ(3, -R, gasTop, z);
      p.needsUpdate = true;
      gasFaceGeo.computeBoundingSphere();
    } else if (view === 'whole') {
      const p = gasWholeGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i <= GAS_SEG; i++) {
        const a = (i / GAS_SEG) * Math.PI * 2;
        const x = gr * Math.cos(a);
        const z = gr * Math.sin(a);
        p.setXYZ(i * 2, x, yl(x), z);
        p.setXYZ(i * 2 + 1, x, gasTop, z);
      }
      p.needsUpdate = true;
      gasWholeGeo.computeBoundingSphere();
    }
  }
  function placeBrick(k: number): void {
    // on the pad: beside the pallet, on what the pallet stands on
    const offY = bucketY;
    // on the bell: on its closed end, in the bell's frame
    const lx = BRICK_AT.onX;
    const ly = BELL.height;
    const lz = BRICK_AT.onZ;
    const cos = Math.cos(pose.theta);
    const sin = Math.sin(pose.theta);
    const onX = pose.xc + lx * cos - ly * sin;
    const onY = pose.rim + lx * sin + ly * cos;
    tmpP.set(
      BRICK_AT.offX + (onX - BRICK_AT.offX) * k,
      offY + (onY - offY) * k + Math.sin(k * Math.PI) * 0.25,
      BRICK_AT.offZ + (lz - BRICK_AT.offZ) * k,
    );
    brickPose.position.copy(tmpP);
    brickPose.rotation.z = pose.theta * k;
  }
  return m;
}

/** A sawn board along X with its UVs in metres along the grain: the texture's V along the board. */
function boxBoard(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const seed = Math.abs(z0 * 91.7) % 1;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getZ(i) + pos.getY(i)) * 3 + seed, pos.getX(i) * 0.9 + seed);
  return g;
}

function boxBoardZ(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const seed = Math.abs(x0 * 53.3) % 1;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + pos.getY(i)) * 3 + seed, pos.getZ(i) * 0.9 + seed);
  return g;
}
