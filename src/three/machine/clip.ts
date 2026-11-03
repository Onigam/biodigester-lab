import * as THREE from 'three';

// A section as geometry: a closed solid cut by a plane, what stays of it, and a flat face on the cut. No clipping plane at draw time, so nothing to z-fight, no shadow to clip, nothing to cap in a stencil, and a
// click goes where the eye goes. Runs once, when a world is built, on each solid separately (two solids merged first would give crossing outlines). Runs in Node: the tests prove the faces close.

export interface Cut {
  /** What stays, with its normals and UVs interpolated. */
  kept: THREE.BufferGeometry | null;
  /** The face on the cut, facing out of the kept side. Null when the plane misses, or the solid is not closed there. */
  face: THREE.BufferGeometry | null;
}

/** A plane no vertex lies on exactly: a revolved solid has rows of vertices at z = 0 and at x = 0. */
export const NUDGE = 1.37e-5;

const key = (a: number, b: number) => `${Math.round(a * 2e5)},${Math.round(b * 2e5)}`;

/** Keep what lies on the negative side of the plane `normal · p = d`. `normal` is an axis: 'z' keeps z < d, 'y' keeps y < d. */
export function cutGeometry(g: THREE.BufferGeometry, axis: 'y' | 'z', d: number, faceUv = 1): Cut {
  const a = axis === 'z' ? 2 : 1;
  const plane = d + NUDGE;
  const src = g.index ? g.toNonIndexed() : g;
  const P = src.attributes.position.array as ArrayLike<number>;
  const N = src.attributes.normal?.array as ArrayLike<number> | undefined;
  const U = src.attributes.uv?.array as ArrayLike<number> | undefined;
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const emit = (i: number) => {
    pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    nor.push(N ? N[i * 3] : 0, N ? N[i * 3 + 1] : 1, N ? N[i * 3 + 2] : 0);
    uvs.push(U ? U[i * 2] : 0, U ? U[i * 2 + 1] : 0);
  };
  const emitLerp = (i: number, j: number, t: number): [number, number, number] => {
    const x = P[i * 3] + (P[j * 3] - P[i * 3]) * t;
    const y = P[i * 3 + 1] + (P[j * 3 + 1] - P[i * 3 + 1]) * t;
    const z = P[i * 3 + 2] + (P[j * 3 + 2] - P[i * 3 + 2]) * t;
    pos.push(x, y, z);
    nor.push(
      N ? N[i * 3] + (N[j * 3] - N[i * 3]) * t : 0,
      N ? N[i * 3 + 1] + (N[j * 3 + 1] - N[i * 3 + 1]) * t : 1,
      N ? N[i * 3 + 2] + (N[j * 3 + 2] - N[i * 3 + 2]) * t : 0,
    );
    uvs.push(U ? U[i * 2] + (U[j * 2] - U[i * 2]) * t : 0, U ? U[i * 2 + 1] + (U[j * 2 + 1] - U[i * 2 + 1]) * t : 0);
    return [x, y, z];
  };

  // the crossings, as segments in the plane
  const segments: [THREE.Vector2, THREE.Vector2][] = [];
  const plane2 = (p: [number, number, number]) =>
    axis === 'z' ? new THREE.Vector2(p[0], p[1]) : new THREE.Vector2(p[0], p[2]);
  const count = src.attributes.position.count;
  for (let t = 0; t < count; t += 3) {
    const v = [t, t + 1, t + 2];
    const s = v.map((i) => P[i * 3 + a] - plane);
    const inside = s.map((x) => x < 0);
    const n = inside.filter(Boolean).length;
    if (n === 0) continue;
    if (n === 3) {
      v.forEach(emit);
      continue;
    }
    const lone = n === 1 ? inside.indexOf(true) : inside.indexOf(false);
    const i0 = v[lone];
    const i1 = v[(lone + 1) % 3];
    const i2 = v[(lone + 2) % 3];
    const s0 = s[lone];
    const s1 = s[(lone + 1) % 3];
    const s2 = s[(lone + 2) % 3];
    const t01 = s0 / (s0 - s1);
    const t02 = s0 / (s0 - s2);
    if (n === 1) {
      emit(i0);
      const p = emitLerp(i0, i1, t01);
      const q = emitLerp(i0, i2, t02);
      segments.push([plane2(p), plane2(q)]);
    } else {
      // two inside: a quad, two triangles
      const before = pos.length / 3;
      const p = emitLerp(i0, i1, t01);
      emit(i1);
      emit(i2);
      emitLerp(i0, i1, t01);
      emit(i2);
      const q = emitLerp(i0, i2, t02);
      segments.push([plane2(p), plane2(q)]);
      void before;
    }
  }

  const kept = pos.length ? soup(pos, nor, uvs) : null;
  return { kept, face: capFaces(segments, axis, plane, faceUv) };
}

function soup(pos: number[], nor: number[], uv: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Chain the crossings into closed loops; an outer loop with the loops inside it becomes one face with holes. */
function capFaces(
  segments: [THREE.Vector2, THREE.Vector2][],
  axis: 'y' | 'z',
  plane: number,
  faceUv: number,
): THREE.BufferGeometry | null {
  if (!segments.length) return null;
  const from = new Map<string, number[]>();
  segments.forEach(([p, q], i) => {
    for (const end of [p, q]) {
      const k = key(end.x, end.y);
      const list = from.get(k);
      if (list) list.push(i);
      else from.set(k, [i]);
    }
  });
  const used = new Uint8Array(segments.length);
  const loops: THREE.Vector2[][] = [];
  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const loop = [segments[s][0]];
    let at = segments[s][1];
    const startKey = key(loop[0].x, loop[0].y);
    let closed = false;
    for (let guard = 0; guard < segments.length; guard++) {
      const k = key(at.x, at.y);
      if (k === startKey) {
        closed = true;
        break;
      }
      loop.push(at);
      const next = (from.get(k) ?? []).find((i) => !used[i]);
      if (next === undefined) break;
      used[next] = 1;
      const [p, q] = segments[next];
      at = key(p.x, p.y) === k ? q : p;
    }
    if (closed && loop.length >= 3) loops.push(loop);
  }
  if (!loops.length) return null;
  const area = (l: THREE.Vector2[]) => Math.abs(THREE.ShapeUtils.area(l));
  loops.sort((a, b) => area(b) - area(a));
  const inside = (p: THREE.Vector2, l: THREE.Vector2[]) => {
    let c = false;
    for (let i = 0, j = l.length - 1; i < l.length; j = i++) {
      if (l[i].y > p.y !== l[j].y > p.y && p.x < ((l[j].x - l[i].x) * (p.y - l[i].y)) / (l[j].y - l[i].y) + l[i].x) {
        c = !c;
      }
    }
    return c;
  };
  // depth by containment: even an outline, odd a hole in the smallest loop around it
  const parent = new Array<number>(loops.length).fill(-1);
  const depth = new Array<number>(loops.length).fill(0);
  loops.forEach((loop, i) => {
    for (let j = i - 1; j >= 0; j--) {
      if (inside(loop[0], loops[j])) {
        parent[i] = j;
        depth[i] = depth[j] + 1;
        break;
      }
    }
  });
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  loops.forEach((outer, i) => {
    if (depth[i] % 2 !== 0) return;
    const holes = loops.filter((_, j) => parent[j] === i && depth[j] % 2 === 1);
    const contour = [...outer];
    if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
    const holeLists = holes.map((h) => {
      const c = [...h];
      if (!THREE.ShapeUtils.isClockWise(c)) c.reverse();
      return c;
    });
    const tris = THREE.ShapeUtils.triangulateShape(contour, holeLists);
    const flat = [contour, ...holeLists].flat();
    for (const tri of tris) {
      const [a, b, c] = tri.map((k) => flat[k]);
      const ccw = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
      // on z: (x, y) seen from +Z is the outside's view, counter-clockwise faces it. On y: (x, z) seen from +Y runs the other way
      const order = axis === 'z' ? (ccw ? [a, b, c] : [a, c, b]) : ccw ? [a, c, b] : [a, b, c];
      for (const v of order) {
        if (axis === 'z') {
          pos.push(v.x, v.y, plane);
          nor.push(0, 0, 1);
        } else {
          pos.push(v.x, plane, v.y);
          nor.push(0, 1, 0);
        }
        uv.push(v.x / faceUv, v.y / faceUv);
      }
    }
  });
  return pos.length ? soup(pos, nor, uv) : null;
}

/** Keep what lies on both sides of nothing: an empty geometry, for a view where a mesh has nothing to draw. Shared, never disposed. */
export const EMPTY = new THREE.BufferGeometry();
EMPTY.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
EMPTY.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(0), 3));
EMPTY.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(0), 2));
