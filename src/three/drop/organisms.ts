import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { smoothNormals, tubeThrough, V } from '../machine/shapes';

// The living things of the `slurry` world, stylised on purpose: shapes as a microscopist would know them, colours by what each does, no scale. A rod with its hairs, a coccus in its packet, a sheathed filament, a comma,
// a thick-walled egg, a ball-and-stick molecule. Each kind is one merged mesh with its colours in its vertices; a vertex knows its organism's phase, so the swimming, the wave of a flagellum and the glow all run in the
// shader on a few uniforms, with no allocation and no moving object. What moves them is the simulation's rates. Geometry only, so it builds in Node.

export const LIFE = {
  food: 0xe9dcb4,
  foodDark: 0xb99a62,
  hydrolyser: 0x1f7680,
  enzyme: 0x63c4c0,
  acidMaker: 0xe36d4f,
  acid: 0xc23a3a,
  acetogen: 0x7b4ba6,
  methanogen: 0x2f78dc,
  methanogenDark: 0x1e4f9c,
  sulphate: 0xe8c531,
  germ: 0x6b2c2a,
  germShell: 0xe2d5b4,
  carbon: 0x3a3d42,
  oxygen: 0xcf3b34,
  hydrogen: 0xf4f1e8,
  nitrogen: 0x3f63c8,
  bubble: 0xcfe4f4,
  /** The buffer in its own pale colours, stylised: so as not to be taken for the acids it holds back. */
  bufferC: 0x5c8f96,
  bufferO: 0xbfe6df,
} as const;

/** The uniforms a kind of organism shares. `time` runs on the view's clock, `amp` is how far they wander, `flick` the flagella's beat, `glow` their inner light, `life` 1 alive, 0 grey and still. */
export interface LifeUniforms {
  uTime: { value: number };
  uAmp: { value: number };
  uFlick: { value: number };
  uGlow: { value: number };
  uLife: { value: number };
}

export const lifeUniforms = (amp = 0.012, glow = 0): LifeUniforms => ({
  uTime: { value: 0 },
  uAmp: { value: amp },
  uFlick: { value: 1 },
  uGlow: { value: glow },
  uLife: { value: 1 },
});

/** The soft dark edge of a body seen through water, and its motion. */
export function lifeMaterial(u: LifeUniforms, roughness = 0.5): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0, name: 'life' });
  m.userData.noShare = true;
  m.envMapIntensity = 0.7;
  patchMaterial(m, 'life-v3', (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec4 aPhase;
        uniform float uTime; uniform float uAmp; uniform float uFlick;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = aPhase.x;
        transformed += uAmp * vec3( sin( uTime * 0.71 + ph * 6.28 ), sin( uTime * 0.53 + ph * 11.7 ), cos( uTime * 0.61 + ph * 17.3 ) );
        // a flagellum's wave, from its root (aPhase.y = 0) to its tip (1)
        float w = aPhase.y * aPhase.y;
        transformed += w * uFlick * 0.05 * vec3( 0.3 * cos( uTime * 5.0 + aPhase.z * 11.0 + ph * 9.0 ), sin( uTime * 5.0 + aPhase.z * 11.0 + ph * 9.0 ), 0.6 * sin( uTime * 4.1 + aPhase.z * 9.0 ) );`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow; uniform float uLife;')
      .replace(
        '#include <opaque_fragment>',
        `float ndv = clamp( abs( dot( normalize( vViewPosition ), normal ) ), 0.0, 1.0 );
        // grey as it dies
        float grey = dot( outgoingLight, vec3( 0.33 ) );
        outgoingLight = mix( vec3( grey ) * 0.8, outgoingLight, uLife );
        // darker at the edge, as a cell seen through water; and from within when it works
        outgoingLight *= mix( 0.42, 1.1, smoothstep( 0.0, 0.72, ndv ) );
        outgoingLight += diffuseColor.rgb * uGlow * ( 0.32 + 0.9 * ( 1.0 - ndv ) * ( 1.0 - ndv ) );
        #include <opaque_fragment>`,
      );
  });
  return m;
}

/** One part's organisms: geometries pile up with their colours and phases, merged at the end. */
export class Kind {
  private readonly list: THREE.BufferGeometry[] = [];
  private phase = 0;
  /** How many vertices and indices one repeated item takes, for a draw range that shows some of them. */
  itemIndexCount = 0;

  /** The next organism: everything added until the next call swims as one. */
  next(phase: number): void {
    this.phase = phase;
  }

  add(g: THREE.BufferGeometry, color: number, flex?: (x: number, y: number, z: number, i: number) => number): void {
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color(color);
    const ph = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      ph[i * 4] = this.phase;
      ph[i * 4 + 1] = flex ? flex(p.getX(i), p.getY(i), p.getZ(i), i) : 0;
      ph[i * 4 + 2] = i * 0.002;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', p);
    if (!g.attributes.normal) g.computeVertexNormals();
    out.setAttribute('normal', g.attributes.normal);
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setAttribute('aPhase', new THREE.BufferAttribute(ph, 4));
    if (g.index) out.setIndex(g.index);
    else {
      const idx = new Uint32Array(p.count);
      for (let i = 0; i < p.count; i++) idx[i] = i;
      out.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    this.list.push(out);
  }

  /** Mottle what was added last, for a body that is not one flat colour. */
  mesh(mat: THREE.Material, name: string): THREE.Mesh {
    const merged = mergeGeometries(this.list, false);
    if (!merged) throw new Error(`empty kind ${name}`);
    const m = new THREE.Mesh(merged, mat);
    m.name = name;
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.noShadow = true;
    m.frustumCulled = false;
    return m;
  }
}

/** A value noise in space, for lumps. */
export function noise3(seed: number): (x: number, y: number, z: number) => number {
  const r = rng(seed);
  const T = new Float32Array(4096);
  for (let i = 0; i < T.length; i++) T[i] = r();
  const at = (i: number, j: number, k: number) => T[(i * 73 + j * 179 + k * 283) & 4095];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const fx = s(x - x0);
    const fy = s(y - y0);
    const fz = s(z - z0);
    const l = (a: number, b: number, t: number) => a + (b - a) * t;
    return l(
      l(l(at(x0, y0, z0), at(x0 + 1, y0, z0), fx), l(at(x0, y0 + 1, z0), at(x0 + 1, y0 + 1, z0), fx), fy),
      l(
        l(at(x0, y0, z0 + 1), at(x0 + 1, y0, z0 + 1), fx),
        l(at(x0, y0 + 1, z0 + 1), at(x0 + 1, y0 + 1, z0 + 1), fx),
        fy,
      ),
      fz,
    );
  };
}

const UP = new THREE.Vector3(0, 1, 0);

/** A rod with round ends, its axis from `a` to `b`, as bacteria are drawn. */
export function capsule(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 12, rings = 4): THREE.BufferGeometry {
  const d = b.clone().sub(a);
  const g = new THREE.CapsuleGeometry(r, Math.max(1e-4, d.length()), rings, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

export function ball(c: THREE.Vector3, r: number, seg = 10, rows = 7): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, seg, rows);
  g.translate(c.x, c.y, c.z);
  return g;
}

export function stick(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 5): THREE.BufferGeometry {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A flagellum: a thin helix from `root` along `dir`. Its tip waves in the shader. */
export function flagellum(
  kind: Kind,
  root: THREE.Vector3,
  dir: THREE.Vector3,
  len: number,
  color: number,
  r: () => number,
  thick = 0.0075,
): void {
  const pts: THREE.Vector3[] = [];
  const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).cross(dir).normalize();
  const v = new THREE.Vector3().crossVectors(dir, u).normalize();
  const turns = 2.2;
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const amp = 0.028 * Math.min(1, t * 4);
    pts.push(
      root
        .clone()
        .addScaledVector(dir, t * len)
        .addScaledVector(u, Math.cos(a) * amp)
        .addScaledVector(v, Math.sin(a) * amp),
    );
  }
  const g = tubeThrough(pts, thick, 5);
  const row = 6;
  kind.add(g, color, (_x, _y, _z, i) => Math.min(1, Math.floor(i / row) / n));
}

/** Short hairs out of a rod: what a microscopist calls fimbriae. */
export function hairs(
  kind: Kind,
  a: THREE.Vector3,
  b: THREE.Vector3,
  r0: number,
  n: number,
  len: number,
  color: number,
  r: () => number,
): void {
  const axis = b.clone().sub(a);
  const axisN = axis.clone().normalize();
  const u = new THREE.Vector3(0.31, 0.77, -0.55).cross(axisN).normalize();
  const v = new THREE.Vector3().crossVectors(axisN, u).normalize();
  for (let i = 0; i < n; i++) {
    const t = r();
    const phi = r() * Math.PI * 2;
    const dir = u.clone().multiplyScalar(Math.cos(phi)).addScaledVector(v, Math.sin(phi));
    const from = a
      .clone()
      .addScaledVector(axis, t)
      .addScaledVector(dir, r0 * 0.96);
    const mid = from
      .clone()
      .addScaledVector(dir, len * 0.55)
      .addScaledVector(axisN, (r() - 0.5) * len * 0.5);
    const end = mid
      .clone()
      .addScaledVector(dir, len * 0.45)
      .addScaledVector(axisN, (r() - 0.5) * len * 0.5);
    kind.add(tubeThrough([from, mid, end], 0.0042, 4), color, (_x, _y, _z, k) => (k > 10 ? 0.35 : 0));
  }
}

/** A ball-and-stick molecule: `atoms` are place, radius, colour; `bonds` pairs of atoms' indices. */
export function molecule(
  kind: Kind,
  at: THREE.Vector3,
  atoms: readonly (readonly [number, number, number, number, number])[],
  bonds: readonly (readonly [number, number])[],
  scale: number,
  rot: THREE.Quaternion,
): void {
  const place = atoms.map((a) =>
    new THREE.Vector3(a[0], a[1], a[2]).multiplyScalar(scale).applyQuaternion(rot).add(at),
  );
  for (const [i, j] of bonds) kind.add(stick(place[i], place[j], 0.0075 * scale * 8, 5), 0xa8a59a);
  atoms.forEach((a, i) => kind.add(smoothIco(place[i], a[3] * scale), a[4]));
}

function smoothIco(c: THREE.Vector3, r: number): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, 7, 5);
  g.translate(c.x, c.y, c.z);
  return g;
}

/** Atoms: a fatty acid, four carbons and its acid head. Places in units of a carbon-carbon bond. */
export const FATTY_ACID = {
  atoms: [
    [-1.65, -0.28, 0, 0.42, LIFE.carbon],
    [-0.82, 0.28, 0, 0.42, LIFE.carbon],
    [0, -0.28, 0, 0.42, LIFE.carbon],
    [0.82, 0.28, 0, 0.42, LIFE.carbon],
    [1.5, -0.3, 0, 0.42, LIFE.acid],
    [1.1, 1.05, 0, 0.42, LIFE.acid],
    [2.28, -0.08, 0, 0.42, LIFE.acid],
  ],
  bonds: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [3, 5],
    [4, 6],
  ],
} as const;

/** HCO₃⁻: a carbon and three oxygens in a plane, a hydrogen on one. */
export const BICARBONATE = {
  atoms: [
    [0, 0, 0, 0.44, LIFE.bufferC],
    [1.05, 0.2, 0, 0.48, LIFE.bufferO],
    [-0.7, 0.82, 0, 0.48, LIFE.bufferO],
    [-0.35, -1.0, 0, 0.48, LIFE.bufferO],
    [0.5, -1.45, 0, 0.3, LIFE.hydrogen],
  ],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [3, 4],
  ],
} as const;

/** NH₄⁺: a nitrogen and four hydrogens, a tetrahedron. */
export const AMMONIUM_ION = {
  atoms: [
    [0, 0, 0, 0.5, LIFE.nitrogen],
    [0.75, 0.75, 0.75, 0.34, LIFE.hydrogen],
    [-0.75, -0.75, 0.75, 0.34, LIFE.hydrogen],
    [-0.75, 0.75, -0.75, 0.34, LIFE.hydrogen],
    [0.75, -0.75, -0.75, 0.34, LIFE.hydrogen],
  ],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
} as const;

/** CH₄ and CO₂ for the inside of a bubble. */
export const METHANE = {
  atoms: [
    [0, 0, 0, 0.5, LIFE.carbon],
    [0.8, 0.8, 0.8, 0.34, LIFE.hydrogen],
    [-0.8, -0.8, 0.8, 0.34, LIFE.hydrogen],
    [-0.8, 0.8, -0.8, 0.34, LIFE.hydrogen],
    [0.8, -0.8, -0.8, 0.34, LIFE.hydrogen],
  ],
  bonds: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
} as const;
export const CARBON_DIOXIDE = {
  atoms: [
    [0, 0, 0, 0.46, LIFE.carbon],
    [1.2, 0, 0, 0.48, LIFE.oxygen],
    [-1.2, 0, 0, 0.48, LIFE.oxygen],
  ],
  bonds: [
    [0, 1],
    [0, 2],
  ],
} as const;

/** The food particle: a cooked grain, elongated, its surface bitten. A lump with soft starch bumps; vertices darken in its pits. */
export function foodGrain(
  kind: Kind,
  at: THREE.Vector3,
  half: THREE.Vector3,
  bites: { dir: THREE.Vector3; r: number }[],
  seed: number,
): void {
  const n = noise3(seed);
  const g = new THREE.IcosahedronGeometry(1, 28);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const p = g.attributes.position;
  const dark = new Float32Array(p.count);
  const q = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    q.fromBufferAttribute(p, i).normalize();
    let k = 1 + 0.1 * (n(q.x * 2.2 + 7, q.y * 2.2, q.z * 2.2) - 0.5);
    k += 0.09 * (n(q.x * 7, q.y * 7, q.z * 7) - 0.5) + 0.05 * (n(q.x * 15, q.y * 15, q.z * 15) - 0.5);
    let d = 0;
    for (const b of bites) {
      const c = 1 - q.distanceTo(b.dir) / b.r;
      if (c > 0) {
        const depth = c * c * (3 - 2 * c);
        k -= 0.2 * depth;
        d = Math.max(d, depth);
      }
    }
    dark[i] = d;
    p.setXYZ(i, q.x * half.x * k + at.x, q.y * half.y * k + at.y, q.z * half.z * k + at.z);
  }
  smoothNormals(g);
  const col = new THREE.Color();
  const light = new THREE.Color(LIFE.food);
  const shade = new THREE.Color(LIFE.foodDark);
  kind.add(g, LIFE.food);
  // recolour in place: the pits browner, a little mottling
  const merged = kind as unknown as { list: THREE.BufferGeometry[] };
  const last = merged.list[merged.list.length - 1];
  const c = last.attributes.color;
  for (let i = 0; i < c.count; i++) {
    q.fromBufferAttribute(p, i);
    const m = Math.min(1, dark[i] * 0.95 + 0.5 * n(q.x * 9 + 3, q.y * 9, q.z * 9) - 0.12);
    col.copy(light).lerp(shade, Math.max(0, m));
    c.setXYZ(i, col.r, col.g, col.b);
  }
}

export { V };
