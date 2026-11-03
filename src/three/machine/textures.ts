import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';

// The procedural textures of the machine and of the yard, DataTextures all: no asset, no canvas, so they build in Node. Each repeats at a known size in metres and is applied by UVs in metres. Packed shapes of
// near tones, never bright dots on a dark ground: the mistake that made gravel read as polka dots in an earlier lab.

export type RGB = readonly [number, number, number];

export function dataTexture(data: Uint8Array, n: number, sRGB = true): THREE.DataTexture {
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Value noise on a torus of `size` cells: a texture made of it tiles. */
export function periodicNoise(seed: number, size: number): (x: number, y: number) => number {
  const r = rng(seed);
  const v = new Float32Array(size * size);
  for (let i = 0; i < v.length; i++) v[i] = r();
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const X = x * size;
    const Y = y * size;
    const x0 = Math.floor(X);
    const y0 = Math.floor(Y);
    const fx = s(X - x0);
    const fy = s(Y - y0);
    const at = (i: number, j: number) => v[(((j % size) + size) % size) * size + (((i % size) + size) % size)];
    return (
      (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
      (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
    );
  };
}

export const mix3 = (a: RGB, b: RGB, t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const clamp8 = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

function fill(
  N: number,
  fn: (u: number, v: number, i: number, j: number) => [number, number, number] | number,
  sRGB = true,
): THREE.DataTexture {
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const c = fn(i / N, j / N, i, j);
      const k = (j * N + i) * 4;
      if (typeof c === 'number') {
        d[k] = d[k + 1] = d[k + 2] = clamp8(c);
      } else {
        d[k] = clamp8(c[0]);
        d[k + 1] = clamp8(c[1]);
        d[k + 2] = clamp8(c[2]);
      }
      d[k + 3] = 255;
    }
  return dataTexture(d, N, sRGB);
}

/** Tone by slow blotches and fine grain, around `tint`. */
export function mottled(seed: number, tint: RGB, slow = 0.08, fine = 0.05, N = 256): THREE.DataTexture {
  const a = periodicNoise(seed, 6);
  const b = periodicNoise(seed + 1, 18);
  const c = periodicNoise(seed + 2, 96);
  return fill(N, (u, v) => {
    const g = 1 + slow * (2 * a(u, v) + b(u, v) - 1.5) + fine * (c(u, v) - 0.5);
    return [tint[0] * g, tint[1] * g, tint[2] * g];
  });
}

/** Sawn boards: grain along V, a few knots. Weathered grey over brown. */
export function timber(seed: number, tint: RGB, N = 256): THREE.DataTexture {
  const a = periodicNoise(seed, 48);
  const b = periodicNoise(seed + 1, 8);
  const r = rng(seed + 3);
  const knots = Array.from({ length: 5 }, () => [r(), r(), 0.012 + r() * 0.02] as const);
  return fill(N, (u, v) => {
    let warp = 0;
    let dark = 0;
    for (const [kx, ky, kr] of knots) {
      const dx = u - kx;
      const dy = (v - ky) * 0.35;
      const d = Math.hypot(dx, dy);
      warp += (kr * 1.2) / (d + 0.03);
      if (d < kr) dark = Math.max(dark, 1 - d / kr);
    }
    const g = 0.82 + 0.26 * a(u + warp * 0.04, v * 0.08) + 0.08 * Math.sin((u + warp * 0.05) * 90 + 3 * b(u, v));
    const k = g * (1 - 0.55 * dark);
    return [tint[0] * k, tint[1] * k, tint[2] * k];
  });
}

/** Cast concrete: pale, its pores, a slow stain, the marks of a board. */
export function concrete(seed: number, tint: RGB, N = 512): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const a = periodicNoise(seed, 5);
  const b = periodicNoise(seed + 1, 24);
  const c = periodicNoise(seed + 2, 128);
  const r = rng(seed + 3);
  const pores = new Uint8Array(N * N);
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * N);
    const y = Math.floor(r() * N);
    const R = r() < 0.8 ? 1 : 2;
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++)
        if (dx * dx + dy * dy <= R * R) pores[((y + dy + N) % N) * N + ((x + dx + N) % N)] = 1;
  }
  const map = fill(N, (u, v, i, j) => {
    const g = 0.94 + 0.13 * a(u, v) + 0.06 * b(u, v) + 0.05 * c(u, v) - (pores[j * N + i] ? 0.09 : 0);
    return [tint[0] * g, tint[1] * g, tint[2] * g];
  });
  const bump = fill(N, (u, v, i, j) => 170 + 40 * c(u, v) - (pores[j * N + i] ? 70 : 0), false);
  return { map, bump };
}

/** Lime plaster on a rough wall: a pale wash, slow blotches, a damp stain low down is left to the geometry. */
export function plaster(seed: number, tint: RGB, N = 256): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const a = periodicNoise(seed, 5);
  const b = periodicNoise(seed + 1, 22);
  const c = periodicNoise(seed + 2, 90);
  const map = fill(N, (u, v) => {
    const g = 0.93 + 0.1 * a(u, v) + 0.06 * b(u, v) + 0.035 * c(u, v);
    return [tint[0] * g, tint[1] * g, tint[2] * g];
  });
  const bump = fill(N, (u, v) => 110 + 80 * b(u, v) + 60 * c(u, v), false);
  return { map, bump };
}

/** Courses of stones or blocks, each its tone, a mortar line. `tile` metres square, by the caller's UVs. */
export function blockwork(
  seed: number,
  dark: RGB,
  pale: RGB,
  mortar: RGB,
  rows = 6,
  cols = 4,
  N = 512,
): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const r = rng(seed);
  const tone = new Float32Array(rows * cols * 2);
  for (let i = 0; i < tone.length; i++) tone[i] = r();
  const n2 = periodicNoise(seed + 2, 128);
  const c = new Float32Array(N * N * 3);
  const h = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    const v = (j / N) * rows;
    const row = Math.floor(v);
    const fv = v - row;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * cols + (row % 2) * 0.5;
      const col = Math.floor(u) % cols;
      const fu = u - Math.floor(u);
      const edge = Math.min(fu, 1 - fu) * (N / cols);
      const edgeV = Math.min(fv, 1 - fv) * (N / rows);
      const wob = n2(i / N, j / N) * 3;
      const inMortar = edge + wob < 4 || edgeV + wob < 4;
      const t = tone[(row * cols + col) * 2];
      const base = mix3(dark, pale, t);
      const g = 0.92 + 0.14 * n2(i / N + 0.4, j / N + 0.1);
      const k = j * N + i;
      c[k * 3] = inMortar ? mortar[0] : base[0] * g;
      c[k * 3 + 1] = inMortar ? mortar[1] : base[1] * g;
      c[k * 3 + 2] = inMortar ? mortar[2] : base[2] * g;
      h[k] = inMortar ? 40 : 150 + 80 * Math.min(1, Math.min(edge, edgeV) / 10) + 25 * n2(i / N, j / N);
    }
  }
  const map = fill(N, (_u, _v, i, j) => {
    const k = j * N + i;
    return [c[k * 3], c[k * 3 + 1], c[k * 3 + 2]];
  });
  const bump = fill(N, (_u, _v, i, j) => h[j * N + i], false);
  return { map, bump };
}

/** Corrugated iron, weathered: light and shade across the waves, rust along the laps. 8 waves to the tile, one to the side. */
export function corrugated(seed: number, N = 256): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const a = periodicNoise(seed, 6);
  const b = periodicNoise(seed + 1, 32);
  const map = fill(N, (u, v) => {
    const wave = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 8);
    const rust = Math.max(0, a(u * 0.5, v) - 0.45) * 2 + Math.max(0, 0.05 - Math.abs(v - 0.5)) * 8 * b(u, v);
    const c = mix3([150, 152, 150], [128, 100, 80], Math.min(0.6, rust * 0.7));
    const g = 0.72 + 0.34 * wave + 0.06 * b(u, v);
    return [c[0] * g, c[1] * g, c[2] * g];
  });
  const bump = fill(N, (u) => 128 + 110 * Math.sin(u * Math.PI * 2 * 8), false);
  return { map, bump };
}

/** Red earth, trodden: small stones of near tones, darker patches, packed. */
export function redEarth(seed: number, N = 512): THREE.DataTexture {
  const a = periodicNoise(seed, 4);
  const b = periodicNoise(seed + 1, 16);
  const c = periodicNoise(seed + 2, 64);
  const d = periodicNoise(seed + 3, 200);
  return fill(N, (u, v) => {
    const t = 0.5 * a(u, v) + 0.35 * b(u, v) + 0.15 * c(u, v);
    const col = mix3([150, 112, 84], [186, 150, 114], t);
    const g = 0.93 + 0.1 * c(u + 0.3, v) + 0.05 * d(u, v);
    return [col[0] * g, col[1] * g, col[2] * g];
  });
}

/** Dark worked soil for the beds, with its crumbs. */
export function soil(seed: number, N = 256): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const a = periodicNoise(seed, 10);
  const b = periodicNoise(seed + 1, 42);
  const c = periodicNoise(seed + 2, 128);
  const map = fill(N, (u, v) => {
    const g = 0.72 + 0.34 * a(u, v) + 0.28 * b(u, v) + 0.22 * c(u, v);
    return [70 * g, 50 * g, 36 * g];
  });
  const bump = fill(N, (u, v) => 80 + 90 * b(u, v) + 80 * c(u, v), false);
  return { map, bump };
}

/** Rotting scraps and straw: many short strokes of near tones. For the compost heap. */
export function compost(seed: number, N = 512): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const r = rng(seed);
  const col = new Float32Array(N * N * 3);
  const h = new Float32Array(N * N);
  for (let k = 0; k < N * N; k++) {
    col[k * 3] = 62;
    col[k * 3 + 1] = 46;
    col[k * 3 + 2] = 32;
    h[k] = 60;
  }
  const palette: RGB[] = [
    [150, 118, 66],
    [118, 86, 46],
    [92, 70, 42],
    [170, 142, 88],
    [88, 96, 50],
    [134, 92, 58],
    [60, 44, 30],
  ];
  for (let s = 0; s < 1700; s++) {
    const c = palette[Math.floor(r() * palette.length)];
    const a = r() * Math.PI * 2;
    const L = 8 + r() * 26;
    const W = 1 + r() * 2.4;
    const x0 = r() * N;
    const y0 = r() * N;
    const H = 90 + r() * 150;
    for (let t = 0; t < L; t += 0.7) {
      const cx = x0 + Math.cos(a) * t;
      const cy = y0 + Math.sin(a) * t;
      for (let dy = -W; dy <= W; dy++)
        for (let dx = -W; dx <= W; dx++) {
          if (dx * dx + dy * dy > W * W) continue;
          const px = ((Math.round(cx + dx) % N) + N) % N;
          const py = ((Math.round(cy + dy) % N) + N) % N;
          const k = py * N + px;
          col[k * 3] = c[0];
          col[k * 3 + 1] = c[1];
          col[k * 3 + 2] = c[2];
          h[k] = H;
        }
    }
  }
  const map = fill(N, (_u, _v, i, j) => {
    const k = j * N + i;
    return [col[k * 3], col[k * 3 + 1], col[k * 3 + 2]];
  });
  const bump = fill(N, (_u, _v, i, j) => h[j * N + i], false);
  return { map, bump };
}

/** The slurry's cut faces. `grain` bright flecks on a dark ground, fine: suspended solids. */
export function liquorFace(seed: number, base: RGB, fleck: RGB, grain: number, N = 256): THREE.DataTexture {
  const a = periodicNoise(seed, 5);
  const b = periodicNoise(seed + 1, 30);
  const c = periodicNoise(seed + 2, 110);
  return fill(N, (u, v) => {
    const t = Math.max(0, c(u, v) + grain * b(u, v) - (1.05 - grain)) * 2.2;
    const col = mix3(base, fleck, Math.min(1, t));
    const g = 0.92 + 0.16 * a(u, v);
    return [col[0] * g, col[1] * g, col[2] * g];
  });
}

/** A crust of scum: fibres and trapped bubbles, pale on brown. */
export function scumFace(seed: number, N = 256): THREE.DataTexture {
  const r = rng(seed);
  const base = mottled(seed, [96, 72, 44], 0.14, 0.14, N).image.data as unknown as Uint8Array;
  const d = new Uint8Array(base);
  for (let s = 0; s < 260; s++) {
    const pale = r() < 0.5;
    const col: RGB = pale ? [170, 142, 96] : [62, 44, 28];
    const a = r() * Math.PI * 2;
    const L = 6 + r() * 18;
    const x0 = r() * N;
    const y0 = r() * N;
    for (let t = 0; t < L; t += 0.7) {
      const px = ((Math.round(x0 + Math.cos(a) * t) % N) + N) % N;
      const py = ((Math.round(y0 + Math.sin(a) * t) % N) + N) % N;
      const k = (py * N + px) * 4;
      d[k] = col[0];
      d[k + 1] = col[1];
      d[k + 2] = col[2];
    }
  }
  return dataTexture(d, N);
}
