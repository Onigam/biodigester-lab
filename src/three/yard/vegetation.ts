import * as THREE from 'three';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { dataTexture, mix3, periodicNoise, timber, clamp8, type RGB } from '../machine/textures';
import { lump, mergeAll, rounded, tubeThrough, V } from '../machine/shapes';

// The yard's plants. A mango is a short thick trunk, limbs that fork, and a great dark dome of long leaves in loose clouds, sprays of leaf cards over dark masses: seen from afar a heavy dark green crown, close up leaves.
// A banana is a clump of soft stems and big split paddles. The beds have rows of leafy greens, tomatoes on stakes and a strip of maize. All of it seeded: the same plant at every load. What is seen from afar is a
// card turned to the camera, never closer than the fence.

/** Narrow pointed leaves on a transparent ground, two greens. For alpha-tested sprays. */
export function leafCard(seed: number, light: RGB, dark: RGB, leaves = 70, N = 128, narrow = 0.2): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  for (let l = 0; l < leaves; l++) {
    const a = r() * Math.PI * 2;
    const cx = 0.14 + r() * 0.72;
    const cy = 0.14 + r() * 0.72;
    const len = 0.1 + r() * 0.1;
    const wid = len * narrow;
    const t = r();
    const col = mix3(dark, light, t);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x0 = Math.floor((cx - len) * N);
    const x1 = Math.ceil((cx + len) * N);
    const y0 = Math.floor((cy - len) * N);
    const y1 = Math.ceil((cy + len) * N);
    for (let j = Math.max(0, y0); j < Math.min(N, y1); j++)
      for (let i = Math.max(0, x0); i < Math.min(N, x1); i++) {
        const dx = i / N - cx;
        const dy = j / N - cy;
        const u = (dx * ca + dy * sa) / len;
        const v = (-dx * sa + dy * ca) / wid;
        if (u * u + v * v > 1) continue;
        const k = (j * N + i) * 4;
        const rib = Math.abs(v) < 0.12 ? 1.12 : 1;
        d[k] = clamp8(col[0] * rib);
        d[k + 1] = clamp8(col[1] * rib);
        d[k + 2] = clamp8(col[2] * rib);
        d[k + 3] = 255;
      }
  }
  return dataTexture(d, N);
}

/** Cards crossing at a point, all sharing a lighting normal that points out of the crown. */
function sprayCards(
  points: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[],
  r: () => number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (const q of points) {
    for (let c = 0; c < 2; c++) {
      tmp.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      a.crossVectors(q.out, tmp).normalize();
      b.crossVectors(q.out, a).normalize();
      if (c === 1) b.lerp(q.out, 0.7).normalize();
      const first = pos.length / 3;
      const s = q.size;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const x = (u - 0.5) * s;
        const y = (v - 0.5) * s;
        pos.push(q.p.x + a.x * x + b.x * y, q.p.y + a.y * x + b.y * y, q.p.z + a.z * x + b.z * y);
        nor.push(q.out.x, q.out.y, q.out.z);
        uv.push(u, v);
      }
      idx.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Both sides of a card take the crown's normal: three would turn it round on the far side, and half of every card would go black. */
function keepNormal(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  patchMaterial(m, 'keep-normal', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n  normal = normalize( vNormal );',
    );
  });
  return m;
}

export function leafMaterial(map: THREE.Texture, name: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest: 0.45,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.72,
    metalness: 0,
    name,
  });
  m.userData.noShare = true;
  return keepNormal(m);
}

function barkMat(seed: number, tint: RGB): THREE.MeshStandardMaterial {
  const map = timber(seed, tint);
  map.repeat.set(3.5, 0.8);
  const m = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.4, roughness: 0.97, name: 'bark' });
  m.userData.noShare = true;
  return m;
}

export interface TreeMeshes {
  root: THREE.Group;
  height: number;
  /** Where the crown is, in the tree's frame: the test compares its shadow with the tank. */
  crown: THREE.Sphere;
}

/** The shade tree, a mango. `H` to the top of its crown. */
export function mangoTree(seed: number, H: number): TreeMeshes {
  const r = rng(seed);
  const root = new THREE.Group();
  root.name = 'mango';
  const woods: THREE.BufferGeometry[] = [];
  const clouds: { c: THREE.Vector3; R: number }[] = [];
  const taper = (pts: THREE.Vector3[], r0: number, r1: number, radial = 8) => {
    woods.push(tubeThrough(rounded(pts, 0.25, 4), (t) => r0 + (r1 - r0) * t, radial));
  };
  const path = (from: THREE.Vector3, dir: THREE.Vector3, len: number, wander: number, steps: number) => {
    const pts = [from.clone()];
    const d = dir.clone().normalize();
    for (let i = 1; i <= steps; i++) {
      d.x += (r() - 0.5) * wander;
      d.y += (r() - 0.5) * wander * 0.5;
      d.z += (r() - 0.5) * wander;
      d.normalize();
      pts.push(pts[i - 1].clone().addScaledVector(d, len / steps));
    }
    return pts;
  };
  // the trunk: short, thick, its foot flaring into the ground
  const fork = V(0.06, H * 0.27, -0.04);
  taper([V(0, -0.12, 0), V(0.02, H * 0.1, 0.02), V(-0.03, H * 0.2, 0.01), fork], 0.36, 0.24, 14);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    taper(
      [V(0, 0.42, 0), V(Math.cos(a) * 0.28, 0.1, Math.sin(a) * 0.28), V(Math.cos(a) * 0.72, -0.1, Math.sin(a) * 0.72)],
      0.15,
      0.04,
      7,
    );
  }
  // the limbs
  const limbs = 7;
  for (let i = 0; i < limbs; i++) {
    const a = (i / limbs) * Math.PI * 2 + r();
    const out = V(Math.cos(a) * 0.78, 0.62 + r() * 0.4, Math.sin(a) * 0.78);
    const p1 = path(fork, out, H * (0.24 + r() * 0.08), 0.5, 4);
    taper(p1, 0.17, 0.1, 9);
    const end1 = p1[p1.length - 1];
    for (let j = 0; j < 3; j++) {
      const a2 = a + (j - 1) * (0.7 + r() * 0.35);
      const d2 = V(Math.cos(a2) * 0.74, 0.42 + r() * 0.5, Math.sin(a2) * 0.74);
      const p2 = path(end1, d2, H * (0.15 + r() * 0.08), 0.7, 3);
      taper(p2, 0.09, 0.045, 7);
      const end2 = p2[p2.length - 1];
      for (let k = 0; k < 3; k++) {
        const a3 = a2 + (k - 1) * (0.7 + r() * 0.5);
        const d3 = V(Math.cos(a3) * 0.7, 0.3 + r() * 0.5, Math.sin(a3) * 0.7);
        const p3 = path(end2, d3, H * (0.08 + r() * 0.05), 1.0, 2);
        taper(p3, 0.04, 0.016, 5);
        clouds.push({ c: p3[p3.length - 1], R: H * (0.11 + r() * 0.05) });
      }
    }
  }
  const wood = new THREE.Mesh(mergeAll(woods), barkMat(seed + 3, [112, 96, 80]));
  wood.castShadow = wood.receiveShadow = true;
  wood.name = 'mango-wood';
  root.add(wood);

  // the crown: sprays spread in each cloud, on dark masses that give it its depth and its weight
  const sprays: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[] = [];
  const centre = new THREE.Vector3();
  for (const c of clouds) centre.add(c.c);
  centre.divideScalar(clouds.length);
  for (const c of clouds) {
    const n = 46;
    for (let i = 0; i < n; i++) {
      const dir = V(r() - 0.5, (r() - 0.4) * 0.85, r() - 0.5).normalize();
      const rad = c.R * Math.cbrt(r());
      const p = c.c.clone().addScaledVector(dir, rad);
      const out = p.clone().sub(centre).normalize().lerp(dir, 0.4).normalize();
      sprays.push({ p, size: 0.42 + r() * 0.28, out });
    }
  }
  const leaves = new THREE.Mesh(
    sprayCards(sprays, r),
    leafMaterial(leafCard(seed + 1, [70, 112, 54], [24, 60, 34], 90, 128, 0.24), 'mango-leaf'),
  );
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.frustumCulled = false;
  leaves.name = 'mango-leaves';
  root.add(leaves);
  const blobs: THREE.BufferGeometry[] = [];
  for (const c of clouds) {
    const g = lump(c.R * 0.72, 0.3, r, 1);
    g.scale(1, 0.84, 1);
    g.translate(c.c.x, c.c.y, c.c.z);
    blobs.push(g);
  }
  const mass = new THREE.Mesh(
    mergeAll(blobs),
    new THREE.MeshStandardMaterial({ color: 0x1b3320, roughness: 0.96, name: 'mango-mass' }),
  );
  mass.castShadow = true;
  mass.name = 'mango-mass';
  root.add(mass);
  // a few fruits hanging under the crown
  const fruits: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const c = clouds[Math.floor(r() * clouds.length)];
    const g = new THREE.SphereGeometry(0.062, 10, 8);
    g.scale(0.82, 1.15, 0.82);
    g.translate(c.c.x + (r() - 0.5) * c.R, c.c.y - c.R * 0.7, c.c.z + (r() - 0.5) * c.R);
    fruits.push(g);
  }
  const fruit = new THREE.Mesh(
    mergeAll(fruits),
    new THREE.MeshStandardMaterial({ color: 0xc08a2c, roughness: 0.55, name: 'mango-fruit' }),
  );
  root.add(fruit);

  const box = new THREE.Box3().setFromObject(leaves, true);
  const size = box.getSize(new THREE.Vector3());
  // a crown's own half-width, not the sphere round its box's corners
  const crown = new THREE.Sphere(box.getCenter(new THREE.Vector3()), Math.max(size.x, size.z) / 2);
  return { root, height: box.max.y, crown };
}

/** A banana plant: soft stems from a clump, big paddles arching out, their edges torn. */
export function bananaClump(seed: number, stems = 4, H = 3.2): THREE.Group {
  const r = rng(seed);
  const root = new THREE.Group();
  root.name = 'banana';
  const stemG: THREE.BufferGeometry[] = [];
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const addLeaf = (from: THREE.Vector3, a: number, L: number, W: number, lift: number) => {
    const n = 12;
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const side = V(-dir.z, 0, dir.x);
    const first = pos.length / 3;
    const green = 0.8 + r() * 0.4;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const h = lift * Math.sin(t * Math.PI * 0.62) - 0.35 * L * t * t * t;
      const out = L * t;
      const w = W * Math.pow(Math.sin(Math.min(1, t * 1.02 + 0.04) * Math.PI), 0.55);
      const c = from
        .clone()
        .addScaledVector(dir, out)
        .setY(from.y + h);
      // torn: a tear stands open between some ribs
      const tear = i % 3 === 1 && r() > 0.45 ? 0.72 : 1;
      for (const s of [-1, 0, 1]) {
        const y = c.y - Math.abs(s) * w * 0.28;
        const p = c.clone().addScaledVector(side, s * w * (s === 0 ? 0 : tear));
        p.y = y;
        pos.push(p.x, p.y, p.z);
        nor.push(-s * 0.3, 1, 0);
        const k = (s === 0 ? 0.55 : 0.82 + 0.1 * Math.sin(i * 2.1)) * green;
        col.push(0.2 * k, 0.5 * k, 0.1 * k);
      }
    }
    for (let i = 0; i < n; i++) {
      for (let s = 0; s < 2; s++) {
        const a0 = first + i * 3 + s;
        const b0 = a0 + 3;
        idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
      }
    }
  };
  for (let i = 0; i < stems; i++) {
    const a = (i / stems) * Math.PI * 2 + r();
    const sx = Math.cos(a) * 0.26 * (i === 0 ? 0 : 1);
    const sz = Math.sin(a) * 0.26 * (i === 0 ? 0 : 1);
    const h = H * (i === 0 ? 1 : 0.55 + r() * 0.35);
    const top = V(sx * 1.5, h, sz * 1.5);
    stemG.push(tubeThrough([V(sx, -0.08, sz), V(sx * 1.1, h * 0.5, sz * 1.1), top], (t) => 0.13 - 0.07 * t, 10));
    const nl = 7 + Math.floor(r() * 3);
    for (let k = 0; k < nl; k++) {
      addLeaf(top, r() * Math.PI * 2, h * (0.46 + r() * 0.22), h * 0.095, h * (0.1 + r() * 0.2));
    }
  }
  const stem = new THREE.Mesh(
    mergeAll(stemG),
    new THREE.MeshStandardMaterial({ color: 0x7c8a4a, roughness: 0.82, name: 'banana-stem' }),
  );
  stem.castShadow = true;
  root.add(stem);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const leaf = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.62,
      name: 'banana-leaf',
    }),
  );
  leaf.castShadow = leaf.receiveShadow = true;
  root.add(leaf);
  return root;
}

/** A row of leafy plants, tomatoes on stakes or maize on a bed. All one mesh per material: added to the part by the scene. */
export function bedPlants(
  kind: 'greens' | 'tomato' | 'maize' | 'beans',
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  count: number,
  seed: number,
): { sprays: THREE.BufferGeometry; stalks: THREE.BufferGeometry | null; fruit: THREE.BufferGeometry | null } {
  const r = rng(seed);
  const sprays: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[] = [];
  const stalks: THREE.BufferGeometry[] = [];
  const fruit: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t + (r() - 0.5) * 0.04;
    const z = z0 + (z1 - z0) * t + (r() - 0.5) * 0.04;
    if (kind === 'greens') {
      const R = 0.14 + r() * 0.06;
      for (let k = 0; k < 5; k++) {
        const a = r() * 6.28;
        const d = V(Math.cos(a) * 0.7, 0.72, Math.sin(a) * 0.7).normalize();
        sprays.push({ p: V(x, y + 0.04, z).addScaledVector(d, R * 0.5), size: R * 1.7, out: d });
      }
    } else if (kind === 'tomato') {
      const H = 0.95 + r() * 0.2;
      stalks.push(tubeThrough([V(x, y - 0.02, z), V(x + 0.01, y + H / 2, z), V(x, y + H + 0.08, z)], 0.0085, 5));
      for (let k = 0; k < 9; k++) {
        const v = k / 8;
        const a = r() * 6.28;
        const d = V(Math.cos(a) * 0.8, 0.5, Math.sin(a) * 0.8).normalize();
        sprays.push({ p: V(x, y + 0.08 + v * H, z).addScaledVector(d, 0.1), size: 0.24 + r() * 0.1, out: d });
      }
      for (let k = 0; k < 4; k++) {
        const v = 0.2 + r() * 0.55;
        const a = r() * 6.28;
        const g = new THREE.SphereGeometry(0.028 + r() * 0.012, 8, 6);
        g.translate(x + Math.cos(a) * 0.1, y + v * H, z + Math.sin(a) * 0.1);
        fruit.push(g);
      }
    } else if (kind === 'maize') {
      const H = 1.5 + r() * 0.4;
      stalks.push(
        tubeThrough(
          [V(x, y - 0.02, z), V(x + 0.012, y + H * 0.6, z), V(x + 0.01, y + H, z)],
          (u) => 0.016 - 0.01 * u,
          6,
        ),
      );
      for (let k = 0; k < 9; k++) {
        const v = 0.15 + (k / 9) * 0.82;
        const a = k * 2.4 + r();
        const d = V(Math.cos(a), 0.55, Math.sin(a)).normalize();
        sprays.push({ p: V(x, y + v * H, z).addScaledVector(d, 0.16), size: 0.42, out: d });
      }
    } else {
      const H = 0.7;
      stalks.push(tubeThrough([V(x, y - 0.02, z), V(x, y + H + 0.3, z)], 0.006, 5));
      for (let k = 0; k < 7; k++) {
        const a = r() * 6.28;
        const d = V(Math.cos(a), 0.3, Math.sin(a)).normalize();
        sprays.push({ p: V(x, y + 0.05 + (k / 6) * H, z).addScaledVector(d, 0.06), size: 0.2, out: d });
      }
    }
  }
  return {
    sprays: sprayCards(sprays, r),
    stalks: stalks.length ? mergeAll(stalks) : null,
    fruit: fruit.length ? mergeAll(fruit) : null,
  };
}

/** A crown seen from afar, on a card: a round cloud of small leaves, paler where the sun takes it, darker under. Alpha-tested. */
function crownCard(seed: number, N = 128): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  const dabs = 800;
  for (let i = 0; i < dabs; i++) {
    const a = r() * Math.PI * 2;
    const q = Math.sqrt(r()) * 0.46;
    const cx = 0.5 + Math.cos(a) * q;
    const cy = 0.5 + Math.sin(a) * q * 0.9;
    const R = 0.018 + r() * 0.03;
    const lit = 0.72 + 0.46 * cy + (r() - 0.5) * 0.14;
    const x0 = Math.floor((cx - R) * N);
    const x1 = Math.ceil((cx + R) * N);
    const y0 = Math.floor((cy - R) * N);
    const y1 = Math.ceil((cy + R) * N);
    for (let y = Math.max(0, y0); y < Math.min(N, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(N, x1); x++) {
        if (Math.hypot(x / N - cx, y / N - cy) > R) continue;
        const k = (y * N + x) * 4;
        const v = Math.min(255, Math.round(180 * lit));
        d[k] = v;
        d[k + 1] = v;
        d[k + 2] = v;
        d[k + 3] = 255;
      }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** The far trees: one card each that always faces the camera, so no ribs where cards would cross. Lit from above, whatever it faces. Never closer than the plot's wall. */
export function farTrees(places: { x: number; y: number; z: number; s: number; tone: number }[]): THREE.InstancedMesh {
  const r = rng(99);
  const g = new THREE.PlaneGeometry(2.3, 2.1);
  const nor = g.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  const mat = new THREE.MeshStandardMaterial({
    map: crownCard(301),
    alphaTest: 0.35,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.95,
    name: 'far-trees',
  });
  mat.userData.noShare = true;
  keepNormal(mat);
  patchMaterial(mat, 'far-tree-billboard', (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
       mvPosition.xy += position.xy * vec2( length( instanceMatrix[0].xyz ), length( instanceMatrix[1].xyz ) );
       gl_Position = projectionMatrix * mvPosition;`,
    );
  });
  const m = new THREE.InstancedMesh(g, mat, places.length);
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();
  places.forEach((t, i) => {
    S.set(t.s * 1.15, t.s, t.s * 1.15);
    P.set(t.x, t.y + S.y * 0.92, t.z);
    M.compose(P, q, S);
    m.setMatrixAt(i, M);
    c.setHex(t.tone).multiplyScalar(0.8 + r() * 0.3);
    m.setColorAt(i, c);
  });
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  return m;
}

/** A soft dry-grass colour map for the land beyond the wall. */
export function dryGrass(seed: number, N = 256): THREE.DataTexture {
  const a = periodicNoise(seed, 6);
  const b = periodicNoise(seed + 1, 40);
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const k = (j * N + i) * 4;
      const g = 0.85 + 0.2 * a(i / N, j / N) + 0.18 * b(i / N, j / N);
      d[k] = clamp8(148 * g);
      d[k + 1] = clamp8(146 * g);
      d[k + 2] = clamp8(92 * g);
      d[k + 3] = 255;
    }
  return dataTexture(d, N);
}
