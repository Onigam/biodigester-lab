import * as THREE from 'three';
import type { BioState } from '../../sim/types';
import { BELL, TANK } from '../dims';
import { cutGeometry, EMPTY } from './clip';
import type { MachineLook } from './look';
import { cylY } from './shapes';

// The slurry, from the model. The free surfaces are the physics' (physics §1.4, §7): the open ring and the feed riser stand level, open to the air, and the gas pushes the surface inside the bell down by P/ρg, 2 cm
// at 2 mbar, however the bell tilts: a surface stays horizontal, so seen in the tilted bell it is an ellipse. The layers' heights are the state's, at S5's layering. All of it is written in the machine's frame, with
// no allocation in `update`.

export type MachineView = 'whole' | 'cut' | 'across';

/** Where the bell stands: `tan` is the tilt's tangent, `xc` the rim's centre, so that it stays clear of the bore at both ends of what is engaged. */
export interface BellPose {
  rim: number;
  theta: number;
  xc: number;
}

/** The bell's pose at a rim height and a tilt: it leans from the middle of what it has in the tank, its high side towards the feed. */
export function bellPose(rim: number, tiltDeg: number, out: BellPose = { rim: 0, theta: 0, xc: 0 }): BellPose {
  const theta = (tiltDeg * Math.PI) / 180;
  out.rim = rim;
  out.theta = theta;
  out.xc = ((Math.max(0, TANK.height - rim) / 2) * Math.sin(theta)) / Math.cos(theta);
  return out;
}

/** The axis of the tilted bell at a height, x. */
export const axisX = (p: BellPose, y: number): number => p.xc - (y - p.rim) * Math.tan(p.theta);

const SEG = 64;
/** The cut faces stand just behind the plane of the cut, so that the walls' faces and the pipes' draw over them. */
export const FACE_Z = { clear: -0.0045, layer: -0.0035, gas: -0.0025 } as const;

function strip(count: number, name: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  g.name = name;
  return g;
}

/** Every vertex's normal +Z, every UV the position in metres over `tile`. For a flat cut face. */
function setFlat(g: THREE.BufferGeometry, nx: number, ny: number, nz: number): void {
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, nx, ny, nz);
}

export interface Surfaces {
  clear: THREE.Mesh;
  clearBack: THREE.Mesh;
  sludge: THREE.Mesh;
  sludgeBack: THREE.Mesh;
  scum: THREE.Mesh;
  inner: THREE.Mesh;
  ring: THREE.Mesh;
  collar: THREE.Mesh;
}

export class Slurry {
  readonly ringMesh: THREE.Mesh;
  readonly innerMesh: THREE.Mesh | null = null;
  readonly clearFace: THREE.Mesh | null = null;
  readonly clearBack: THREE.Mesh | null = null;
  readonly sludgeFace: THREE.Mesh | null = null;
  readonly sludgeBack: THREE.Mesh | null = null;
  readonly scumFace: THREE.Mesh | null = null;
  readonly collar: THREE.Mesh | null = null;
  readonly collarFlat: THREE.Mesh | null = null;
  private view: MachineView = 'whole';
  private last = { rim: -1, theta: -1, lr: -1, li: -1, h: -1, view: '' as string };
  private readonly ringHalf: THREE.BufferGeometry | null;
  private readonly ringFull: THREE.BufferGeometry;
  private readonly innerHalf: THREE.BufferGeometry | null = null;
  private readonly innerFull: THREE.BufferGeometry | null = null;
  private readonly clearWhole: THREE.BufferGeometry | null = null;
  private readonly clearCut: THREE.BufferGeometry | null = null;
  private readonly clearBackGeo: THREE.BufferGeometry | null = null;
  private readonly sludgeWhole: THREE.BufferGeometry | null = null;
  private readonly sludgeCut: THREE.BufferGeometry | null = null;
  private readonly sludgeBackGeo: THREE.BufferGeometry | null = null;
  private readonly scumCut: THREE.BufferGeometry | null = null;
  private readonly collarGeo: THREE.BufferGeometry | null = null;
  private readonly collarFlatGeo: THREE.BufferGeometry | null = null;
  /** Cut plane of the across view: the collar's top. */
  readonly acrossY: number;

  constructor(
    look: MachineLook,
    private readonly views: boolean,
    parts: {
      ring: THREE.Object3D;
      inner: THREE.Object3D;
      clear: THREE.Object3D;
      sludge: THREE.Object3D;
      bell: THREE.Object3D;
    },
    acrossY: number,
  ) {
    this.acrossY = acrossY;
    this.ringFull = strip((SEG + 1) * 2, 'ring-full');
    this.ringFull.setIndex(ringIndex(SEG));
    setFlat(this.ringFull, 0, 1, 0);
    this.ringHalf = views ? strip((SEG + 1) * 2, 'ring-half') : null;
    if (this.ringHalf) {
      this.ringHalf.setIndex(ringIndex(SEG));
      setFlat(this.ringHalf, 0, 1, 0);
    }
    this.ringMesh = new THREE.Mesh(views ? this.ringHalf! : this.ringFull, look.surface);
    this.ringMesh.name = 'ring-surface';
    this.ringMesh.receiveShadow = true;
    this.ringMesh.frustumCulled = false;
    parts.ring.add(this.ringMesh);
    if (!views) return;

    // ---- the surface inside the bell: scum on top, a fan
    this.innerHalf = strip(SEG + 2, 'inner-half');
    this.innerHalf.setIndex(fanIndex(SEG));
    setFlat(this.innerHalf, 0, 1, 0);
    this.innerFull = strip(SEG + 2, 'inner-full');
    this.innerFull.setIndex(fanIndex(SEG));
    setFlat(this.innerFull, 0, 1, 0);
    this.innerMesh = new THREE.Mesh(this.innerHalf, look.scum);
    this.innerMesh.name = 'inner-surface';
    this.innerMesh.frustumCulled = false;
    parts.inner.add(this.innerMesh);

    // ---- the clear liquor: a face with a step on each side of the bell's wall, or a whole column
    this.clearCut = strip(12, 'clear-cut');
    this.clearCut.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]);
    setFlat(this.clearCut, 0, 0, 1);
    this.clearWhole = cylY(TANK.innerR - 0.0006, 0, 1, 0, 0, SEG);
    const clearBack = cutGeometry(this.clearWhole, 'z', 0);
    this.clearBackGeo = clearBack.kept ?? EMPTY;
    this.clearFace = new THREE.Mesh(this.clearCut, look.clear);
    this.clearFace.name = 'clear-face';
    this.clearFace.frustumCulled = false;
    this.clearBack = new THREE.Mesh(this.clearBackGeo, look.clear);
    this.clearBack.name = 'clear-back';
    parts.clear.add(this.clearFace, this.clearBack);

    // ---- the sludge: a face with an uneven top. Scaled in height by the state
    const COLS = 26;
    const sl = strip((COLS + 1) * 2, 'sludge-cut');
    const sp = sl.attributes.position as THREE.BufferAttribute;
    const su = sl.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i <= COLS; i++) {
      const x = -TANK.innerR + (2 * TANK.innerR * i) / COLS;
      const top = 1 + 0.12 * Math.sin(i * 1.7) + 0.08 * Math.sin(i * 0.61 + 1);
      sp.setXYZ(i * 2, x, 0, FACE_Z.layer);
      sp.setXYZ(i * 2 + 1, x, top, FACE_Z.layer);
      su.setXY(i * 2, x / 0.5, 0);
      su.setXY(i * 2 + 1, x / 0.5, top * 0.14);
    }
    const sIdx: number[] = [];
    for (let i = 0; i < COLS; i++) {
      const a = i * 2;
      sIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    sl.setIndex(sIdx);
    setFlat(sl, 0, 0, 1);
    this.sludgeCut = sl;
    this.sludgeWhole = cylY(TANK.innerR - 0.0003, 0, 1, 0, 0, SEG);
    const slBack = cutGeometry(this.sludgeWhole, 'z', 0);
    this.sludgeBackGeo = slBack.kept ?? EMPTY;
    this.sludgeFace = new THREE.Mesh(sl, look.sludge);
    this.sludgeFace.name = 'sludge-face';
    this.sludgeBack = new THREE.Mesh(this.sludgeBackGeo, look.sludge);
    this.sludgeBack.name = 'sludge-back';
    parts.sludge.add(this.sludgeFace, this.sludgeBack);

    // ---- the scum's face, inside the bell: a band with an uneven underside
    const SC = 20;
    this.scumCut = strip((SC + 1) * 2, 'scum-cut');
    const scIdx: number[] = [];
    for (let i = 0; i < SC; i++) {
      const a = i * 2;
      scIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    this.scumCut.setIndex(scIdx);
    setFlat(this.scumCut, 0, 0, 1);
    this.scumFace = new THREE.Mesh(this.scumCut, look.scum);
    this.scumFace.name = 'scum-face';
    this.scumFace.frustumCulled = false;
    parts.inner.add(this.scumFace);

    // ---- the collar of the across view: what stands of the bell above the surface, cut by the same plane
    this.collarGeo = strip((SEG + 1) * 6, 'collar');
    const cIdx: number[] = [];
    for (let band = 0; band < 3; band++) {
      const o = band * (SEG + 1) * 2;
      for (let i = 0; i < SEG; i++) {
        const a = o + i * 2;
        cIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    this.collarGeo.setIndex(cIdx.filter((_, i) => i < SEG * 6 || i >= SEG * 12));
    // the flat of the cut shares its vertices, in the section's colour; the skins are the bell's plastic
    this.collarFlatGeo = new THREE.BufferGeometry();
    this.collarFlatGeo.setAttribute('position', this.collarGeo.attributes.position);
    this.collarFlatGeo.setAttribute('normal', this.collarGeo.attributes.normal);
    this.collarFlatGeo.setAttribute('uv', this.collarGeo.attributes.uv);
    this.collarFlatGeo.setIndex(cIdx.slice(SEG * 6, SEG * 12));
    this.collar = new THREE.Mesh(EMPTY, look.bell);
    this.collar.name = 'bell-collar';
    this.collar.frustumCulled = false;
    this.collar.userData.noShadow = true;
    parts.bell.add(this.collar);
    this.collarFlat = new THREE.Mesh(EMPTY, look.section);
    this.collarFlat.name = 'bell-collar-flat';
    this.collarFlat.frustumCulled = false;
    this.collarFlat.userData.noShadow = true;
    parts.bell.add(this.collarFlat);
  }

  setView(v: MachineView): void {
    if (this.view === v) return;
    this.view = v;
    if (this.views) {
      const w = v === 'whole';
      const c = v === 'cut';
      this.ringMesh.geometry = c ? this.ringHalf! : this.ringFull;
      this.innerMesh!.geometry = c ? this.innerHalf! : this.innerFull!;
      this.clearFace!.geometry = c ? this.clearCut! : w ? this.clearWhole! : EMPTY;
      this.clearBack!.geometry = c ? this.clearBackGeo! : EMPTY;
      this.sludgeFace!.geometry = c ? this.sludgeCut! : w ? this.sludgeWhole! : EMPTY;
      this.sludgeBack!.geometry = c ? this.sludgeBackGeo! : EMPTY;
      this.scumFace!.geometry = c ? this.scumCut! : EMPTY;
      this.collar!.geometry = v === 'across' ? this.collarGeo! : EMPTY;
      this.collarFlat!.geometry = v === 'across' ? this.collarFlatGeo! : EMPTY;
    }
    this.last.rim = -1;
  }

  update(s: BioState, pose: BellPose): void {
    const Lr = s.levelRing;
    const Li = s.levelInner;
    const h = s.sludgeHeight;
    const sc = Math.max(0.005, s.scumHeight);
    if (this.sludgeFace) {
      this.sludgeFace.scale.y = Math.max(0.002, h);
      this.sludgeBack!.scale.y = Math.max(0.002, h);
      this.clearFace!.scale.y = this.view === 'whole' ? Lr : 1;
      this.clearBack!.scale.y = Lr;
    }
    const l = this.last;
    const same =
      Math.abs(l.rim - pose.rim) < 2e-4 &&
      Math.abs(l.theta - pose.theta) < 2e-4 &&
      Math.abs(l.lr - Lr) < 2e-4 &&
      Math.abs(l.li - Li) < 2e-4 &&
      Math.abs(l.h - sc) < 2e-4;
    if (same) return;
    l.rim = pose.rim;
    l.theta = pose.theta;
    l.lr = Lr;
    l.li = Li;
    l.h = sc;

    const cos = Math.cos(pose.theta);
    const ao = BELL.outerR / cos;
    const ai = BELL.innerR / cos;
    const xo = axisX(pose, Lr);
    const xi = axisX(pose, Li);
    const half = this.view === 'cut';

    // ---- the ring: the bore outside, the bell's outer wall inside, at the level
    const ringG = half ? this.ringHalf! : this.ringFull;
    const rp = ringG.attributes.position as THREE.BufferAttribute;
    const ru = ringG.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i <= SEG; i++) {
      const phi = half ? Math.PI + (Math.PI * i) / SEG : (2 * Math.PI * i) / SEG;
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      const ox = TANK.innerR * c;
      const oz = TANK.innerR * sn;
      const ix = xo + ao * c;
      const iz = BELL.outerR * sn;
      rp.setXYZ(i * 2, ox, Lr, oz);
      rp.setXYZ(i * 2 + 1, ix, Lr, iz);
      ru.setXY(i * 2, ox * 2.2, oz * 2.2);
      ru.setXY(i * 2 + 1, ix * 2.2, iz * 2.2);
    }
    rp.needsUpdate = true;
    ru.needsUpdate = true;
    if (!this.views) return;

    // ---- the surface inside
    const inG = half ? this.innerHalf! : this.innerFull!;
    const ip = inG.attributes.position as THREE.BufferAttribute;
    const iu = inG.attributes.uv as THREE.BufferAttribute;
    ip.setXYZ(0, xi, Li, 0);
    iu.setXY(0, xi * 2.2, 0);
    for (let i = 0; i <= SEG; i++) {
      const phi = half ? Math.PI + (Math.PI * i) / SEG : (2 * Math.PI * i) / SEG;
      const x = xi + ai * Math.cos(phi);
      const z = BELL.innerR * Math.sin(phi);
      ip.setXYZ(i + 1, x, Li, z);
      iu.setXY(i + 1, x * 2.2, z * 2.2);
    }
    ip.needsUpdate = true;
    iu.needsUpdate = true;

    if (this.view === 'cut') {
      // ---- the clear liquor's face: level in the ring, pressed down inside
      const cp = this.clearCut!.attributes.position as THREE.BufferAttribute;
      const cu = this.clearCut!.attributes.uv as THREE.BufferAttribute;
      const z = FACE_Z.clear;
      const x0 = -TANK.innerR;
      const x3 = TANK.innerR;
      const x1 = xi - (ai + ao) / 2;
      const x2 = xi + (ai + ao) / 2;
      const cols: [number, number, number][] = [
        [x0, x1, Lr],
        [x1, x2, Li],
        [x2, x3, Lr],
      ];
      cols.forEach(([a, b, top], k) => {
        const o = k * 4;
        cp.setXYZ(o, a, 0, z);
        cp.setXYZ(o + 1, b, 0, z);
        cp.setXYZ(o + 2, b, top, z);
        cp.setXYZ(o + 3, a, top, z);
        cu.setXY(o, a / 0.5, 0);
        cu.setXY(o + 1, b / 0.5, 0);
        cu.setXY(o + 2, b / 0.5, top / 0.5);
        cu.setXY(o + 3, a / 0.5, top / 0.5);
      });
      cp.needsUpdate = true;
      cu.needsUpdate = true;
      this.clearCut!.computeBoundingSphere();

      // ---- the scum's band: between the bell's inner walls, from the surface down, leaning with the wall
      const sp = this.scumCut!.attributes.position as THREE.BufferAttribute;
      const su = this.scumCut!.attributes.uv as THREE.BufferAttribute;
      const SC = 20;
      for (let i = 0; i <= SC; i++) {
        const t = i / SC;
        const under = sc * (1 + 0.16 * Math.sin(i * 1.9) + 0.09 * Math.sin(i * 0.7 + 2));
        const yLow = Li - under;
        const xTop = xi - ai + 2 * ai * t;
        const xLow = axisX(pose, yLow) - ai + 2 * ai * t;
        sp.setXYZ(i * 2, xLow, yLow, FACE_Z.layer);
        sp.setXYZ(i * 2 + 1, xTop, Li, FACE_Z.layer);
        su.setXY(i * 2, xLow / 0.4, yLow / 0.4);
        su.setXY(i * 2 + 1, xTop / 0.4, Li / 0.4);
      }
      sp.needsUpdate = true;
      su.needsUpdate = true;
      this.scumCut!.computeBoundingSphere();
    }
    if (this.view === 'across') this.writeCollar(pose, Li);
  }

  /** The bell's wall above the surface in the across view: its outer skin, its inner skin, and the flat of the cut. The horizontal plane cuts a tilted wall in an ellipse. */
  private writeCollar(pose: BellPose, Li: number): void {
    const g = this.collarGeo!;
    const p = g.attributes.position as THREE.BufferAttribute;
    const n = g.attributes.normal as THREE.BufferAttribute;
    const cos = Math.cos(pose.theta);
    const y1 = this.acrossY;
    const y0 = Li - 0.05;
    const ao = BELL.outerR / cos;
    const ai = BELL.innerR / cos;
    const row = SEG + 1;
    const xc1 = axisX(pose, y1);
    const xc0 = axisX(pose, y0);
    for (let i = 0; i <= SEG; i++) {
      const phi = (2 * Math.PI * i) / SEG;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      // the outer skin, facing out
      p.setXYZ(i * 2, xc0 + ao * c, y0, BELL.outerR * s);
      p.setXYZ(i * 2 + 1, xc1 + ao * c, y1, BELL.outerR * s);
      n.setXYZ(i * 2, c, 0, s);
      n.setXYZ(i * 2 + 1, c, 0, s);
      // the flat of the cut, facing up
      const a = row * 2 + i * 2;
      p.setXYZ(a, xc1 + ao * c, y1, BELL.outerR * s);
      p.setXYZ(a + 1, xc1 + ai * c, y1, BELL.innerR * s);
      n.setXYZ(a, 0, 1, 0);
      n.setXYZ(a + 1, 0, 1, 0);
      // the inner skin, facing the axis
      const b = row * 4 + i * 2;
      p.setXYZ(b, xc1 + ai * c, y1, BELL.innerR * s);
      p.setXYZ(b + 1, xc0 + ai * c, y0, BELL.innerR * s);
      n.setXYZ(b, -c, 0, -s);
      n.setXYZ(b + 1, -c, 0, -s);
    }
    p.needsUpdate = true;
    n.needsUpdate = true;
    g.computeBoundingSphere();
    this.collarFlatGeo!.computeBoundingSphere();
  }
}

function ringIndex(seg: number): number[] {
  const idx: number[] = [];
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    // seen from above
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return idx;
}

function fanIndex(seg: number): number[] {
  const idx: number[] = [];
  for (let i = 0; i < seg; i++) idx.push(0, i + 2, i + 1);
  return idx;
}

/** What rises through the slurry. In the section, on the face; else around the ring. In the model's proportion: as many at the rim as `bubblesRimLph` says against `bubblesBellLph`. Speed and size are the eye's. */
export class Bubbles {
  readonly mesh: THREE.InstancedMesh;
  private readonly n: number;
  private readonly y: Float32Array;
  private readonly seed: Float32Array;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly p = new THREE.Vector3();
  private readonly s = new THREE.Vector3();
  /** How many of each are showing, for a test. */
  ringShown = 0;
  bellShown = 0;

  constructor(look: MachineLook, cap = 90) {
    this.n = cap;
    const g = new THREE.IcosahedronGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(g, look.bubble, cap);
    this.mesh.name = 'bubbles';
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.userData.noShadow = true;
    this.mesh.count = 0;
    this.y = new Float32Array(cap);
    this.seed = new Float32Array(cap);
    for (let i = 0; i < cap; i++) {
      this.seed[i] = ((i * 0.6180339887) % 1) * 1 + 0.0001;
      this.y[i] = (i * 0.37) % 1;
    }
  }

  /** `count` per L/h: enough to see at the measured 12 L/h, and capped under a soured plant's last surge. */
  update(s: BioState, pose: BellPose, dt: number, view: MachineView, enabled: boolean): void {
    if (!enabled) {
      this.mesh.count = 0;
      this.ringShown = 0;
      this.bellShown = 0;
      return;
    }
    const k = 2.2;
    const total = Math.min(this.n, Math.round((s.bubblesRimLph + s.bubblesBellLph + s.overflowLph) * k));
    const rimRate = s.bubblesRimLph + s.overflowLph;
    const rate = rimRate + s.bubblesBellLph;
    const ring = rate > 0 ? Math.round((total * rimRate) / rate) : 0;
    const speed = 0.16 * dt;
    const Lr = s.levelRing;
    const Li = s.levelInner;
    const y0 = Math.max(0.03, s.sludgeHeight * 0.7);
    const cut = view === 'cut';
    this.ringShown = ring;
    this.bellShown = total - ring;
    for (let i = 0; i < total; i++) {
      const a = this.seed[i];
      const inRing = i < ring;
      const top = inRing ? Lr : Li - s.scumHeight * 0.4;
      this.y[i] = (this.y[i] + (speed / (top - y0)) * (0.7 + a * 0.6)) % 1;
      const py = y0 + (top - y0) * this.y[i];
      const wob = Math.sin(this.y[i] * 40 + a * 30) * 0.004;
      const bell = axisX(pose, py);
      let x: number;
      let z: number;
      if (inRing) {
        // the ring: only the part of it above the rim is liquid on one side, but a bubble under the rim that misses the bell comes up here
        const py2 = Math.max(py, pose.rim);
        const side = (i * 2654435761) % 2 === 0 ? -1 : 1;
        if (cut) {
          const inner = axisX(pose, py2) + (side * BELL.outerR) / Math.cos(pose.theta);
          const mid = (inner + side * TANK.innerR) / 2;
          x = mid + wob;
          z = 0.006;
        } else {
          const phi = a * Math.PI * 2 * 7.3;
          const r = (TANK.innerR + BELL.outerR) / 2;
          x = r * Math.cos(phi) + wob + pose.xc * 0.3;
          z = r * Math.sin(phi);
        }
      } else {
        const f = -0.86 + 1.72 * a;
        x = bell + f * BELL.innerR + wob;
        z = cut ? 0.006 : (-0.8 + 1.6 * ((a * 3.7) % 1)) * BELL.innerR;
      }
      const near = 1 - Math.min(1, Math.max(0, (this.y[i] - 0.96) / 0.04));
      const r = (0.0055 + a * 0.0065) * (0.75 + 0.5 * this.y[i]) * near + 1e-4;
      this.p.set(x, py, z);
      this.s.setScalar(r);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.count = total;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
