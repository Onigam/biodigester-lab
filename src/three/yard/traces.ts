import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { TRACES } from '../dims';
import { boxUV, mergeAll, revolveY, rod, tubeThrough, V } from '../machine/shapes';
import { kanga, timber } from '../machine/textures';

// What the family leaves about the yard (docs/scenery.md): a washing line from the mango to a pole with the day's wash on it, a low stool and the washing-up by the kitchen's wall, a broom leant there,
// sandals before the door. Nobody is drawn. Scenery, not parts: it goes into the yard's `setting`, merged with it, hidden with it when a part is alone. Still: the yard has no wind of its own to move a
// cloth by, and a film captured frame by frame must draw the same picture twice. Low in triangles, plain shapes, sober colours: worn cotton, timber, dull metal, white enamel.

const T = TRACES;

export interface TraceLooks {
  cord: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  peg: THREE.MeshStandardMaterial;
  kanga: THREE.MeshStandardMaterial;
  shirt: THREE.MeshStandardMaterial;
  shorts: THREE.MeshStandardMaterial;
  towel: THREE.MeshStandardMaterial;
  stool: THREE.MeshStandardMaterial;
  basin: THREE.MeshStandardMaterial;
  enamel: THREE.MeshStandardMaterial;
  enamelRim: THREE.MeshStandardMaterial;
  sole: THREE.MeshStandardMaterial;
  strap: THREE.MeshStandardMaterial;
  straw: THREE.MeshStandardMaterial;
  band: THREE.MeshStandardMaterial;
}

export function traceLooks(): TraceLooks {
  const cloth = (name: string, color: number, map?: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ name, color, ...(map ? { map } : {}), roughness: 0.94, side: THREE.DoubleSide });
  return {
    cord: new THREE.MeshStandardMaterial({ name: 'line-cord', color: 0xcfc8b8, roughness: 0.85 }),
    wood: new THREE.MeshStandardMaterial({ name: 'line-pole', map: timber(281, [116, 98, 78]), roughness: 0.92 }),
    peg: new THREE.MeshStandardMaterial({ name: 'peg', color: 0xb49c76, roughness: 0.82 }),
    kanga: cloth('cloth-kanga', 0xffffff, kanga(283, [62, 76, 100], [150, 116, 70], [176, 164, 138])),
    shirt: cloth('cloth-shirt', 0xdedbd2),
    shorts: cloth('cloth-shorts', 0x3c4559),
    towel: cloth('cloth-towel', 0x8e6454),
    stool: new THREE.MeshStandardMaterial({ name: 'stool', map: timber(285, [146, 114, 82]), roughness: 0.8 }),
    basin: new THREE.MeshStandardMaterial({ name: 'basin', color: 0xaaa293, roughness: 0.6, metalness: 0.18 }),
    enamel: new THREE.MeshStandardMaterial({ name: 'enamel', color: 0xd9d5ca, roughness: 0.32 }),
    enamelRim: new THREE.MeshStandardMaterial({ name: 'enamel-rim', color: 0x2c3c66, roughness: 0.34 }),
    sole: new THREE.MeshStandardMaterial({ name: 'sandal-sole', color: 0x3a3632, roughness: 0.88 }),
    strap: new THREE.MeshStandardMaterial({ name: 'sandal-strap', color: 0x56626e, roughness: 0.7 }),
    straw: new THREE.MeshStandardMaterial({ name: 'broom', color: 0xa08b5c, roughness: 0.9 }),
    band: new THREE.MeshStandardMaterial({ name: 'broom-band', color: 0x5a4430, roughness: 0.85 }),
  };
}

function put(parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, castShadow = true): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------------------------------- the washing line

/** Where the cord is tied round the trunk, measured on the tree that is drawn: the bark's centre and mean radius at the tie's height, its outline all round, the bark towards a direction. */
export interface Tie {
  centre: THREE.Vector3;
  r: number;
  ring: THREE.Vector3[];
  toward(dir: THREE.Vector3): THREE.Vector3;
}

export interface WashingLine {
  group: THREE.Group;
  /** The cord's axis, from the bark to the pole. */
  cord: THREE.Vector3[];
  pole: { x: number; z: number; r: number; mesh: THREE.Mesh };
  /** The wash, one mesh each: its top edge is on the cord. */
  wash: THREE.Mesh[];
}

/**
 * A cloth hanging from the cord, `w` along it and `h` down, its middle `s` metres along. Its top follows the cord exactly; below, soft folds that deepen to the hem. `rows` are the heights (0 top, 1 hem) of its
 * rows of vertices, `widths` its width there as a share of `w`: a shirt's sleeves. Cells under `gap.below` within `gap.half` of the middle are left out: a pair of shorts' legs.
 */
function hanging(
  at: (s: number) => THREE.Vector3,
  dir: THREE.Vector3,
  s: number,
  w: number,
  h: number,
  o: {
    rows: number[];
    widths: number[];
    nx: number;
    fold: number;
    seed: number;
    v0?: number;
    v1?: number;
    gap?: { below: number; half: number };
  },
): THREE.BufferGeometry {
  const r = rng(o.seed);
  const phase = r() * 6.28;
  const waves = 1.6 + r() * 1.2;
  const normal = V(-dir.z, 0, dir.x);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nx = o.nx;
  for (let j = 0; j < o.rows.length; j++) {
    const v = o.rows[j];
    for (let i = 0; i <= nx; i++) {
      const u = -1 + (2 * i) / nx;
      const along = (u * w * o.widths[j]) / 2;
      const top = at(s + along);
      // nothing at the top, which the cord holds; deeper towards the hem
      const fold = o.fold * Math.sqrt(v) * Math.sin(phase + (u + 1) * Math.PI * waves) + o.fold * 0.6 * v * (1 - v);
      pos.push(top.x + normal.x * fold, top.y - v * h, top.z + normal.z * fold);
      uv.push(i / nx, (o.v0 ?? 0) + ((o.v1 ?? 1) - (o.v0 ?? 0)) * v);
    }
  }
  const row = nx + 1;
  for (let j = 0; j < o.rows.length - 1; j++) {
    for (let i = 0; i < nx; i++) {
      const uc = -1 + (2 * (i + 0.5)) / nx;
      if (o.gap && o.rows[j] >= o.gap.below && Math.abs(uc) < o.gap.half) continue;
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A wooden peg across the cord at `p`, its jaws round the cloth. */
function peg(p: THREE.Vector3, dir: THREE.Vector3): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(0.012, 0.07, 0.018);
  g.rotateY(-Math.atan2(dir.z, dir.x));
  g.translate(p.x, p.y - 0.017, p.z);
  return g;
}

export function washingLine(tie: Tie, looks: TraceLooks): WashingLine {
  const group = new THREE.Group();
  group.name = 'washing-line';
  const pole = { x: T.linePostX, z: T.linePostZ, r: T.postR, mesh: null as unknown as THREE.Mesh };
  const dir = V(pole.x - tie.centre.x, 0, pole.z - tie.centre.z).normalize();
  // the cord leaves the bark and reaches the pole's side
  const a = tie.toward(dir).addScaledVector(dir, T.lineR).setY(T.lineTrunkY);
  const b = V(pole.x - dir.x * pole.r, T.linePostY, pole.z - dir.z * pole.r);
  const L = Math.hypot(b.x - a.x, b.z - a.z);
  const at = (s: number) => {
    const u = Math.min(1, Math.max(0, s / L));
    return V(a.x + dir.x * u * L, a.y + (b.y - a.y) * u - T.lineSag * 4 * u * (1 - u), a.z + dir.z * u * L);
  };
  const cord = Array.from({ length: 33 }, (_, i) => at((i * L) / 32));
  // a thin cord casts a broken dotted shadow at this scale: it draws, and casts none
  put(group, tubeThrough(cord, T.lineR, 6), looks.cord, false);
  // two turns round the trunk, two round the pole's head
  const turns: THREE.BufferGeometry[] = [];
  for (const dy of [0, -0.011]) {
    // round the bark as it is drawn, not round a circle: the trunk is not one
    const loop = tie.ring.map((p) => {
      const out = V(p.x - tie.centre.x, 0, p.z - tie.centre.z).normalize();
      return p
        .clone()
        .addScaledVector(out, T.lineR)
        .setY(T.lineTrunkY + dy);
    });
    turns.push(tubeThrough([...loop, loop[0].clone()], T.lineR, 5));
    const t2 = new THREE.TorusGeometry(pole.r + T.lineR, T.lineR, 5, 16);
    t2.rotateX(Math.PI / 2);
    t2.translate(pole.x, T.linePostY + dy, pole.z);
    turns.push(t2);
  }
  put(group, mergeAll(turns), looks.cord, false);
  // the pole: a straight sapling, barked, its foot on the earth, a little thinner at its head
  pole.mesh = put(
    group,
    rod(V(pole.x, 0, pole.z), V(pole.x, T.linePostH, pole.z), pole.r, 10, pole.r * 0.85),
    looks.wood,
  );

  // the wash, from the tree out
  const wash: THREE.Mesh[] = [];
  const pegs: THREE.BufferGeometry[] = [];
  const hang = (
    spec: { s: number; w: number; h: number },
    mat: THREE.Material,
    o: Parameters<typeof hanging>[5],
    pegAt: number[],
  ) => {
    const m = put(group, hanging(at, dir, spec.s, spec.w, spec.h, o), mat);
    m.name = mat.name;
    wash.push(m);
    for (const k of pegAt) pegs.push(peg(at(spec.s + (k * spec.w) / 2), dir));
  };
  // a kanga folded over the cord: its lower half shows, border on three sides, half the medallion
  hang(
    T.kanga,
    looks.kanga,
    { rows: [0, 0.2, 0.4, 0.6, 0.8, 1], widths: [1, 1, 1, 1, 1, 1], nx: 10, fold: 0.035, seed: 291, v0: 0.5, v1: 1 },
    [-0.82, 0, 0.82],
  );
  // a child's school shirt, pegged by its shoulders, the sleeves hanging
  hang(
    T.shirt,
    looks.shirt,
    {
      rows: [0, 0.14, 0.27, 0.29, 0.55, 0.8, 1],
      widths: [0.86, 0.96, 1, 0.66, 0.66, 0.67, 0.68],
      nx: 8,
      fold: 0.022,
      seed: 293,
    },
    [-0.6, 0.6],
  );
  // small shorts by their waistband, the two legs
  hang(
    T.shorts,
    looks.shorts,
    {
      rows: [0, 0.3, 0.55, 0.78, 1],
      widths: [1, 1.02, 1.06, 1.1, 1.12],
      nx: 8,
      fold: 0.016,
      seed: 295,
      gap: { below: 0.55, half: 0.12 },
    },
    [-0.8, 0.8],
  );
  // a towel folded over
  hang(
    T.towel,
    looks.towel,
    { rows: [0, 0.25, 0.5, 0.75, 1], widths: [1, 1, 1, 1, 1], nx: 8, fold: 0.028, seed: 297 },
    [-0.8, 0.8],
  );
  put(group, mergeAll(pegs), looks.peg);
  return { group, cord, pole, wash };
}

// ---------------------------------------------------------------------------------------------------- by the kitchen's wall

/** A low stool of sawn boards: a seat on four splayed legs, the legs' feet flat on the earth. Its frame: the seat's middle on the ground. */
export function stool(looks: TraceLooks): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stool';
  const seat = 0.032;
  const H = T.stoolH;
  put(g, boxUV(-T.stoolW / 2, T.stoolW / 2, H - seat, H, -T.stoolD / 2, T.stoolD / 2, 0.5), looks.stool);
  const legs: THREE.BufferGeometry[] = [];
  const r = 0.016;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const top = V(sx * (T.stoolW / 2 - 0.05), H - seat, sz * (T.stoolD / 2 - 0.045));
      const foot = V(sx * (T.stoolW / 2 - 0.02), 0, sz * (T.stoolD / 2 - 0.018));
      // the cut end of a leaning leg dips by r·sin(lean): raised by as much, its lowest point is on the earth
      const lean = Math.hypot(top.x - foot.x, top.z - foot.z) / top.distanceTo(foot);
      foot.y += r * lean;
      legs.push(rod(foot, top, r, 8, r * 1.15));
    }
  // a stretcher between each pair of legs, low down
  for (const sx of [-1, 1]) {
    const x = sx * (T.stoolW / 2 - 0.032);
    legs.push(rod(V(x, 0.09, -(T.stoolD / 2 - 0.028)), V(x, 0.09, T.stoolD / 2 - 0.028), 0.009, 6));
  }
  put(g, mergeAll(legs), looks.stool);
  return g;
}

/** An enamelled tin plate, its rim in blue, upright on its foot at the origin. */
export function enamelPlate(looks: TraceLooks): THREE.Group {
  const g = new THREE.Group();
  g.name = 'plate';
  const R = T.plateR;
  const H = T.plateH;
  put(
    g,
    revolveY(
      [
        [0, 0],
        [0.068, 0],
        [R, H - 0.002],
        [R, H],
        [R - 0.004, H],
        [0.066, 0.0025],
        [0, 0.0025],
      ],
      { seg: 36 },
    ),
    looks.enamel,
  );
  const rim = new THREE.TorusGeometry(R - 0.0016, 0.0019, 5, 36);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, H - 0.0012, 0);
  put(g, rim, looks.enamelRim);
  return g;
}

/** An enamelled tin mug, its rim in blue, a handle on +X, standing at the origin. */
export function enamelMug(looks: TraceLooks): THREE.Group {
  const g = new THREE.Group();
  g.name = 'mug';
  const r = T.mugR;
  const h = T.mugH;
  put(
    g,
    revolveY(
      [
        [0, 0],
        [r, 0],
        [r, h],
        [r - 0.0024, h],
        [r - 0.0024, 0.003],
        [0, 0.003],
      ],
      { seg: 28 },
    ),
    looks.enamel,
  );
  const rim = new THREE.TorusGeometry(r - 0.0012, 0.0017, 5, 28);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, h - 0.0017, 0);
  put(g, rim, looks.enamelRim);
  const handle = new THREE.TorusGeometry(0.024, 0.0042, 6, 14, Math.PI);
  handle.rotateZ(-Math.PI / 2);
  handle.translate(r - 0.003, h * 0.52, 0);
  put(g, handle, looks.enamel);
  return g;
}

/**
 * The washing-up: a spun aluminium basin on the earth, a plate drying against its rim on the side `towards` (horizontal), the mug upside down beside it. Its frame: the basin's foot on its axis.
 */
export function washingUp(
  looks: TraceLooks,
  towards: THREE.Vector3,
): { group: THREE.Group; plate: THREE.Group; mug: THREE.Group } {
  const g = new THREE.Group();
  g.name = 'washing-up';
  const R0 = T.basinR0;
  const R1 = T.basinR1;
  const H = T.basinH;
  const bead = 0.004;
  put(
    g,
    revolveY(
      [
        [0, 0],
        [R0, 0],
        [R1, H - 2 * bead],
        [R1 + bead, H - bead],
        [R1, H],
        [R1 - 0.003, H - bead],
        [R0 - 0.003, 0.003],
        [0, 0.003],
      ],
      { seg: 40 },
    ),
    looks.basin,
  );
  // the plate: its back on the basin's bead, its rim's edge on the earth, its face to `towards`
  const c = towards.clone().setY(0).normalize();
  const up = V(0, 1, 0);
  const tilt = (68 * Math.PI) / 180;
  const u = c.clone().multiplyScalar(-Math.cos(tilt)).addScaledVector(up, Math.sin(tilt)); // up the plate, towards the basin
  const n = c.clone().multiplyScalar(Math.sin(tilt)).addScaledVector(up, Math.cos(tilt)); // its face
  const side = new THREE.Vector3().crossVectors(n, u).normalize();
  const rimAt = c
    .clone()
    .multiplyScalar(R1 + bead)
    .setY(H - bead);
  // the lowest point is the rim's edge down the plate: C − u·R + n·H_plate on the ground
  const cy = T.plateR * Math.sin(tilt) - T.plateH * Math.cos(tilt);
  const a = (rimAt.y - cy) / Math.sin(tilt);
  const centre = rimAt.clone().addScaledVector(u, -a);
  const plate = enamelPlate(looks);
  plate.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(side, n, new THREE.Vector3().crossVectors(side, n)),
  );
  plate.position.copy(centre);
  g.add(plate);
  // the mug upside down on the earth, beside the plate
  const mug = enamelMug(looks);
  mug.rotation.set(Math.PI, 0.6, 0);
  mug.position
    .copy(
      c
        .clone()
        .multiplyScalar(R1 + 0.11)
        .addScaledVector(side, 0.2),
    )
    .setY(T.mugH);
  g.add(mug);
  return { group: g, plate, mug };
}

/** A short broom of palm ribs, tied near its head, leant on a wall: from its foot `foot` on the earth to its head against the wall at `head`. */
export function broom(looks: TraceLooks, foot: THREE.Vector3, head: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.name = 'broom';
  const axis = head.clone().sub(foot);
  const L = axis.length();
  axis.normalize();
  // the ribs, bound into a handle at the tie, splay below it into a cone whose foot stands on the earth
  const wide = new THREE.Vector3().crossVectors(axis, V(0, 1, 0)).normalize();
  const deep = new THREE.Vector3().crossVectors(wide, axis).normalize();
  const deepFlat = deep.clone().setY(0).normalize();
  const tieAt = foot.clone().addScaledVector(axis, L * 0.74);
  const r = rng(299);
  const ribs: THREE.BufferGeometry[] = [];
  const rr = 0.0042;
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.2;
    const spread = 0.06 + r() * 0.025;
    const end = foot
      .clone()
      .addScaledVector(wide, Math.cos(a) * spread)
      .addScaledVector(deepFlat, Math.sin(a) * spread * 0.75);
    const start = tieAt
      .clone()
      .addScaledVector(wide, Math.cos(a) * 0.013)
      .addScaledVector(deep, Math.sin(a) * 0.013);
    // the cut end of a leaning rib dips by r·sin(lean): its lowest point on the earth
    end.y = (rr * Math.hypot(start.x - end.x, start.z - end.z)) / start.distanceTo(end);
    ribs.push(rod(end, start, rr, 5, rr * 0.8));
  }
  put(g, mergeAll(ribs), looks.straw);
  // the bound handle above the tie
  put(g, rod(tieAt, head, 0.017, 10, 0.015), looks.straw);
  put(
    g,
    rod(tieAt.clone().addScaledVector(axis, -0.012), tieAt.clone().addScaledVector(axis, 0.03), 0.02, 10),
    looks.band,
  );
  return g;
}

/** A rubber sandal, a flat sole with its Y strap, heel at the origin, toe along -Z. */
function sandal(looks: TraceLooks, parent: THREE.Object3D, mirror: number): void {
  const L = T.sandalL;
  const W = T.sandalW;
  const sole = 0.012;
  const pts: THREE.Vector2[] = [];
  const N = 14;
  // half-width along the length: narrow heel, wide ball, a round toe and heel
  const half = (t: number) =>
    (W / 2) * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * Math.sqrt(Math.max(0, Math.sin(Math.PI * t)));
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(new THREE.Vector2(half(t) * (1 + 0.08 * mirror * (t - 0.5)), t * L));
  }
  for (let i = N - 1; i >= 1; i--) {
    const t = i / N;
    pts.push(new THREE.Vector2(-half(t) * (1 - 0.08 * mirror * (t - 0.5)), t * L));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: sole, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); // the shape's +Y (the toe) to -Z, its depth up: the sole between y = 0 and its thickness
  put(parent, g, looks.sole);
  // the strap: from the toe post, over the foot, down to each side
  const post = V(0.006 * mirror, sole, -L * 0.78);
  const straps: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    const side = V(sx * half(0.42) * 0.92, sole, -L * 0.42);
    const mid = post
      .clone()
      .lerp(side, 0.5)
      .setY(sole + 0.03);
    straps.push(
      tubeThrough([post, post.clone().setY(sole + 0.012), mid, side.clone().setY(sole + 0.012), side], 0.0045, 6),
    );
  }
  put(parent, mergeAll(straps), looks.strap);
}

/** A pair, left and right, side by side, a little askew, as stepped out of. Their frame: between the heels, on the ground. */
export function sandals(looks: TraceLooks): THREE.Group {
  const g = new THREE.Group();
  g.name = 'sandals';
  for (const [k, x, turn, dz] of [
    [-1, -0.068, 0.07, 0],
    [1, 0.072, -0.12, 0.03],
  ] as const) {
    const one = new THREE.Group();
    sandal(looks, one, k);
    one.position.set(x, 0, dz);
    one.rotation.y = turn;
    g.add(one);
  }
  return g;
}
