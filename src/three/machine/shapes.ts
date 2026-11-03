import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// The geometry the machine and its props are made of: boxes, cylinders along a line, closed profiles turned around the vertical axis, hollow pipes through a polyline. Geometry only, no canvas, no GL context:
// all of it runs in Node under vitest. Every solid here is closed, so that `clip.ts` can cut it and put a face on the cut.

export type P2 = readonly [number, number];
const TAU = Math.PI * 2;

/** Merge geometries of any kind: a common set of attributes (position, normal, uv), an index on each. */
export function mergeAll(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const norm = list.map((g) => {
    const out = new THREE.BufferGeometry();
    const pos = g.attributes.position;
    out.setAttribute('position', pos);
    if (!g.attributes.normal) g.computeVertexNormals();
    out.setAttribute('normal', g.attributes.normal);
    out.setAttribute('uv', g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    if (g.index) out.setIndex(g.index);
    else {
      const idx = new Uint32Array(pos.count);
      for (let i = 0; i < pos.count; i++) idx[i] = i;
      out.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    return out;
  });
  const merged = mergeGeometries(norm, false);
  if (!merged) throw new Error('mergeAll: nothing to merge');
  return merged;
}

/** A box between two corners. */
export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** A box with its UVs in metres on each face, so that a repeating texture is square. */
export function boxUV(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  size: number,
): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const u = nx > 0.5 ? pos.getZ(i) : pos.getX(i);
    const v = ny > 0.5 ? pos.getZ(i) : pos.getY(i);
    uv.setXY(i, u / size, v / size);
  }
  return g;
}

/** A solid cylinder from `a` to `b`, its radius `r` at `a`, `r2` at `b`. */
export function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 12, r2 = r): THREE.BufferGeometry {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r2, r, d.length(), seg);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

export const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** A solid cylinder standing on Y. */
export function cylY(r: number, y0: number, y1: number, x = 0, z = 0, seg = 16, r1 = r): THREE.BufferGeometry {
  return rod(V(x, y0, z), V(x, y1, z), r, seg, r1);
}

/** A solid cylinder along X. */
export function cylX(r: number, x0: number, x1: number, y = 0, z = 0, seg = 16, r1 = r): THREE.BufferGeometry {
  return rod(V(x0, y, z), V(x1, y, z), r, seg, r1);
}

/** A solid cylinder along Z. */
export function cylZ(r: number, z0: number, z1: number, x = 0, y = 0, seg = 16, r1 = r): THREE.BufferGeometry {
  return rod(V(x, y, z0), V(x, y, z1), r, seg, r1);
}

/** A hex prism from `a` to `b`, flat shaded: a nut, a union, the flats a spanner sits on. */
export function hex(a: THREE.Vector3, b: THREE.Vector3, r: number): THREE.BufferGeometry {
  const g = rod(a, b, r, 6).toNonIndexed();
  g.computeVertexNormals();
  return g;
}

/**
 * A closed profile (r, y) turned around Y. Wind it so that the outside is on its right as it runs: up the outer face, in across the top, down the inner face, out across the bottom. Each segment keeps its own
 * normals around the turn, sharp between segments, unless `smooth`, for a dome. UVs in metres: around the turn at the profile's largest radius, along the profile.
 */
export function revolveY(
  profile: readonly P2[],
  o: { seg?: number; smooth?: boolean; closed?: boolean } = {},
): THREE.BufferGeometry {
  const seg = o.seg ?? 64;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const closed = o.closed ?? true;
  const pts = closed ? [...profile, profile[0]] : [...profile];
  const rMax = Math.max(...pts.map((p) => p[0]));
  const normalOf = (a: P2, b: P2): P2 => {
    const dr = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dr, dy) || 1;
    return [dy / L, -dr / L];
  };
  let along = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1e-9) continue;
    let na = normalOf(a, b);
    let nb = na;
    if (o.smooth) {
      const prev = i > 0 ? pts[i - 1] : closed ? pts[pts.length - 2] : a;
      const next = i < pts.length - 2 ? pts[i + 2] : closed ? pts[1] : b;
      const before = i > 0 || closed ? normalOf(prev, a) : na;
      const after = i < pts.length - 2 || closed ? normalOf(b, next) : na;
      na = unit2(before[0] + na[0], before[1] + na[1]);
      nb = unit2(after[0] + nb[0], after[1] + nb[1]);
    }
    const first = pos.length / 3;
    for (let k = 0; k <= seg; k++) {
      const phi = (TAU * k) / seg;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      pos.push(a[0] * c, a[1], a[0] * s, b[0] * c, b[1], b[0] * s);
      nor.push(na[0] * c, na[1], na[0] * s, nb[0] * c, nb[1], nb[0] * s);
      uv.push(phi * rMax, along, phi * rMax, along + L);
    }
    for (let k = 0; k < seg; k++) {
      const A0 = first + k * 2;
      const B0 = A0 + 1;
      const A1 = A0 + 2;
      const B1 = A0 + 3;
      idx.push(A0, B0, A1, B0, B1, A1);
    }
    along += L;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function unit2(x: number, y: number): P2 {
  const L = Math.hypot(x, y) || 1;
  return [x / L, y / L];
}

/** The centre line of a pipe: a polyline with rounded corners, as points close enough for a tube and for flow dots. */
export function rounded(points: readonly THREE.Vector3[], bend: number, perCorner = 6): THREE.Vector3[] {
  const out: THREE.Vector3[] = [points[0].clone()];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const a = points[i - 1].clone().sub(p);
    const b = points[i + 1].clone().sub(p);
    const r = Math.min(bend, a.length() * 0.45, b.length() * 0.45);
    if (r < 1e-4) {
      out.push(p.clone());
      continue;
    }
    const pa = p.clone().addScaledVector(a.normalize(), r);
    const pb = p.clone().addScaledVector(b.normalize(), r);
    for (let k = 0; k <= perCorner; k++) {
      const t = k / perCorner;
      const q = new THREE.Vector3()
        .addScaledVector(pa, (1 - t) * (1 - t))
        .addScaledVector(p, 2 * t * (1 - t))
        .addScaledVector(pb, t * t);
      out.push(q);
    }
  }
  out.push(points[points.length - 1].clone());
  return out;
}

/** The rings of a tube through a polyline, parallel-transported: `write(i, k, x, y, z, nx, ny, nz, len)`. */
function rings(
  path: readonly THREE.Vector3[],
  radius: (share: number) => number,
  radial: number,
  write: (i: number, k: number, x: number, y: number, z: number, nx: number, ny: number, nz: number, l: number) => void,
): void {
  let tangent = path[1].clone().sub(path[0]).normalize();
  const n = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.dot(tangent)) > 0.9) n.set(0, 0, 1);
  n.addScaledVector(tangent, -n.dot(tangent)).normalize();
  let len = 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) total += path[i].distanceTo(path[i - 1]);
  const q = new THREE.Quaternion();
  for (let i = 0; i < path.length; i++) {
    const next = i < path.length - 1 ? path[i + 1].clone().sub(path[i]).normalize() : tangent;
    const t = i === 0 ? tangent : tangent.clone().add(next).normalize();
    if (i > 0) len += path[i].distanceTo(path[i - 1]);
    const bin = new THREE.Vector3().crossVectors(t, n).normalize();
    const here = radius(total > 0 ? len / total : 0);
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * TAU;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = n.x * c + bin.x * s;
      const ny = n.y * c + bin.y * s;
      const nz = n.z * c + bin.z * s;
      write(i, k, path[i].x + here * nx, path[i].y + here * ny, path[i].z + here * nz, nx, ny, nz, len);
    }
    q.setFromUnitVectors(tangent, next);
    n.applyQuaternion(q);
    n.addScaledVector(next, -n.dot(next)).normalize();
    tangent = next;
  }
}

/** A solid tube through a polyline, exact at its ends, closed by a flat disc at each: a hose, a cable, a limb. */
export function tubeThrough(
  path: readonly THREE.Vector3[],
  r: number | ((share: number) => number),
  radial = 10,
): THREE.BufferGeometry {
  const radius = typeof r === 'number' ? () => r : r;
  const row = radial + 1;
  const count = path.length * row + 2 * (radial + 2);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const idx: number[] = [];
  rings(path, radius, radial, (i, k, x, y, z, nx, ny, nz, l) => {
    const v = i * row + k;
    pos[v * 3] = x;
    pos[v * 3 + 1] = y;
    pos[v * 3 + 2] = z;
    nor[v * 3] = nx;
    nor[v * 3 + 1] = ny;
    nor[v * 3 + 2] = nz;
    uv[v * 2] = k / radial;
    uv[v * 2 + 1] = l;
  });
  for (let i = 0; i < path.length - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      const b = a + row;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  // the two end discs
  const base = path.length * row;
  const ends: [number, THREE.Vector3, THREE.Vector3][] = [
    [0, path[0], path[0].clone().sub(path[1]).normalize()],
    [
      path.length - 1,
      path[path.length - 1],
      path[path.length - 1]
        .clone()
        .sub(path[path.length - 2])
        .normalize(),
    ],
  ];
  ends.forEach(([ring, p, out], e) => {
    const b = base + e * (radial + 2);
    pos[b * 3] = p.x;
    pos[b * 3 + 1] = p.y;
    pos[b * 3 + 2] = p.z;
    nor[b * 3] = out.x;
    nor[b * 3 + 1] = out.y;
    nor[b * 3 + 2] = out.z;
    for (let k = 0; k <= radial; k++) {
      const s = ring * row + k;
      const v = b + 1 + k;
      pos[v * 3] = pos[s * 3];
      pos[v * 3 + 1] = pos[s * 3 + 1];
      pos[v * 3 + 2] = pos[s * 3 + 2];
      nor[v * 3] = out.x;
      nor[v * 3 + 1] = out.y;
      nor[v * 3 + 2] = out.z;
    }
    for (let k = 0; k < radial; k++) {
      if (e === 0) idx.push(b, b + 1 + k, b + 2 + k);
      else idx.push(b, b + 2 + k, b + 1 + k);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** A hollow pipe through a polyline, closed: an outer skin, an inner skin, a ring at each end. Cut lengthwise it shows its two walls and its bore. */
export function pipeSolid(path: readonly THREE.Vector3[], ro: number, ri: number, radial = 20): THREE.BufferGeometry {
  const row = radial + 1;
  const n = path.length * row;
  const count = 2 * n + 4 * row;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const idx: number[] = [];
  const put = (
    v: number,
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    a: number,
    b: number,
  ) => {
    pos[v * 3] = x;
    pos[v * 3 + 1] = y;
    pos[v * 3 + 2] = z;
    nor[v * 3] = nx;
    nor[v * 3 + 1] = ny;
    nor[v * 3 + 2] = nz;
    uv[v * 2] = a;
    uv[v * 2 + 1] = b;
  };
  rings(
    path,
    () => ro,
    radial,
    (i, k, x, y, z, nx, ny, nz, l) => {
      put(i * row + k, x, y, z, nx, ny, nz, (k / radial) * TAU * ro, l);
    },
  );
  rings(
    path,
    () => ri,
    radial,
    (i, k, x, y, z, nx, ny, nz, l) => {
      put(n + i * row + k, x, y, z, -nx, -ny, -nz, (k / radial) * TAU * ri, l);
    },
  );
  for (let i = 0; i < path.length - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      const b = a + row;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
      const c = n + a;
      const d = n + b;
      idx.push(c, d, c + 1, c + 1, d, d + 1);
    }
  }
  const ends: [number, THREE.Vector3][] = [
    [0, path[0].clone().sub(path[1]).normalize()],
    [
      path.length - 1,
      path[path.length - 1]
        .clone()
        .sub(path[path.length - 2])
        .normalize(),
    ],
  ];
  ends.forEach(([ring, out], e) => {
    const base = 2 * n + e * 2 * row;
    for (let k = 0; k <= radial; k++) {
      const so = ring * row + k;
      const si = n + ring * row + k;
      put(base + k, pos[so * 3], pos[so * 3 + 1], pos[so * 3 + 2], out.x, out.y, out.z, 0, 0);
      put(base + row + k, pos[si * 3], pos[si * 3 + 1], pos[si * 3 + 2], out.x, out.y, out.z, 0, 0);
    }
    for (let k = 0; k < radial; k++) {
      const a = base + k;
      const b = base + row + k;
      if (e === 0) idx.push(a, b, a + 1, a + 1, b, b + 1);
      else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** A smooth irregular lump, no facets. */
export function lump(R: number, rough: number, r: () => number, detail = 2): THREE.BufferGeometry {
  const ico = new THREE.IcosahedronGeometry(R, detail);
  const p = ico.attributes.position;
  // the same bump for the same point: three's icosahedron repeats its corners
  const seen = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    let k = seen.get(key);
    if (k === undefined) {
      k = 1 - rough / 2 + r() * rough;
      seen.set(key, k);
    }
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  ico.deleteAttribute('normal');
  ico.deleteAttribute('uv');
  return smoothNormals(ico);
}

/** Normals smoothed over a soup: triangles that share a position share a normal. Keeps the vertices as they are. */
export function smoothNormals(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.attributes.position;
  const n = new Float32Array(p.count * 3);
  const sum = new Map<string, [number, number, number]>();
  const key = (i: number) => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const count = g.index ? g.index.count : p.count;
  for (let t = 0; t < count; t += 3) {
    const i0 = g.index ? g.index.getX(t) : t;
    const i1 = g.index ? g.index.getX(t + 1) : t + 1;
    const i2 = g.index ? g.index.getX(t + 2) : t + 2;
    a.fromBufferAttribute(p, i0);
    b.fromBufferAttribute(p, i1);
    c.fromBufferAttribute(p, i2);
    b.sub(a);
    c.sub(a);
    b.cross(c);
    for (const i of [i0, i1, i2]) {
      const k = key(i);
      const s = sum.get(k) ?? [0, 0, 0];
      s[0] += b.x;
      s[1] += b.y;
      s[2] += b.z;
      sum.set(k, s);
    }
  }
  for (let i = 0; i < p.count; i++) {
    const s = sum.get(key(i)) ?? [0, 1, 0];
    const L = Math.hypot(s[0], s[1], s[2]) || 1;
    n[i * 3] = s[0] / L;
    n[i * 3 + 1] = s[1] / L;
    n[i * 3 + 2] = s[2] / L;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

/** Write a tube made by `tubeThrough` again, along a new path of the same length: a hose that moves with the bell. Allocates a few small vectors, called only when the path has moved. */
export function rewriteTube(g: THREE.BufferGeometry, path: readonly THREE.Vector3[], r: number, radial = 10): void {
  const pos = g.attributes.position.array as Float32Array;
  const nor = g.attributes.normal.array as Float32Array;
  const row = radial + 1;
  rings(
    path,
    () => r,
    radial,
    (i, k, x, y, z, nx, ny, nz) => {
      const v = i * row + k;
      pos[v * 3] = x;
      pos[v * 3 + 1] = y;
      pos[v * 3 + 2] = z;
      nor[v * 3] = nx;
      nor[v * 3 + 1] = ny;
      nor[v * 3 + 2] = nz;
    },
  );
  const base = path.length * row;
  const ends: [number, THREE.Vector3, THREE.Vector3][] = [
    [0, path[0] as THREE.Vector3, path[0].clone().sub(path[1]).normalize()],
    [
      path.length - 1,
      path[path.length - 1] as THREE.Vector3,
      path[path.length - 1]
        .clone()
        .sub(path[path.length - 2])
        .normalize(),
    ],
  ];
  ends.forEach(([ring, p, out], e) => {
    const b = base + e * (radial + 2);
    pos[b * 3] = p.x;
    pos[b * 3 + 1] = p.y;
    pos[b * 3 + 2] = p.z;
    nor[b * 3] = out.x;
    nor[b * 3 + 1] = out.y;
    nor[b * 3 + 2] = out.z;
    for (let k = 0; k <= radial; k++) {
      const s = ring * row + k;
      const v = b + 1 + k;
      pos[v * 3] = pos[s * 3];
      pos[v * 3 + 1] = pos[s * 3 + 1];
      pos[v * 3 + 2] = pos[s * 3 + 2];
      nor[v * 3] = out.x;
      nor[v * 3 + 1] = out.y;
      nor[v * 3 + 2] = out.z;
    }
  });
  g.attributes.position.needsUpdate = true;
  g.attributes.normal.needsUpdate = true;
  g.computeBoundingSphere();
  g.computeBoundingBox();
}

/** A hose between two points, its ends leaving along given directions, sagging in between: exact at both ends, `n` points along it. */
export function hoseCurve(
  a: THREE.Vector3,
  aDir: THREE.Vector3,
  b: THREE.Vector3,
  bDir: THREE.Vector3,
  reach: number,
  sag: number,
  n: number,
  out: THREE.Vector3[],
): THREE.Vector3[] {
  const p1x = a.x + aDir.x * reach;
  const p1y = a.y + aDir.y * reach;
  const p1z = a.z + aDir.z * reach;
  const p2x = b.x + bDir.x * reach;
  const p2y = b.y + bDir.y * reach;
  const p2z = b.z + bDir.z * reach;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const u = 1 - t;
    const k = out[i] ?? (out[i] = new THREE.Vector3());
    const c0 = u * u * u;
    const c1 = 3 * u * u * t;
    const c2 = 3 * u * t * t;
    const c3 = t * t * t;
    k.set(
      c0 * a.x + c1 * p1x + c2 * p2x + c3 * b.x,
      c0 * a.y + c1 * p1y + c2 * p2y + c3 * b.y - sag * 4 * t * u,
      c0 * a.z + c1 * p1z + c2 * p2z + c3 * b.z,
    );
  }
  return out;
}
