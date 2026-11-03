import * as THREE from 'three';

// The dots of « Flux »: what moves through a line, drawn over everything. Each path has its own colour, its own speed and its own share of the dots, so that the gas that misses the bell can be seen beside
// what it catches, in the model's proportion. What their speed means is said in docs/3d.md: they are slowed or quickened for the eye, and a path's dots stand still when the model says nothing flows there.

export interface FlowPath {
  points: THREE.Vector3[];
  color: number;
  /** Metres between dots. */
  spacing?: number;
}

interface Live {
  cum: number[];
  length: number;
  u: number[];
  first: number;
  points: THREE.Vector3[];
  /** Share of its dots shown now, 0 to 1. */
  show: number;
  /** m/s. */
  speed: number;
}

let dotTexture: THREE.DataTexture | null = null;
function softDot(): THREE.DataTexture {
  if (dotTexture) return dotTexture;
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const d = Math.hypot((i + 0.5) / n - 0.5, (j + 0.5) / n - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * n + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 2.2));
    }
  }
  dotTexture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  dotTexture.magFilter = THREE.LinearFilter;
  dotTexture.minFilter = THREE.LinearFilter;
  dotTexture.needsUpdate = true;
  return dotTexture;
}

export class FlowDots {
  readonly object: THREE.Points;
  readonly live: Live[] = [];
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private total = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly colour = new THREE.Color();

  constructor(
    private readonly max: number,
    size: number,
    over = true,
  ) {
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setDrawRange(0, 0);
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      map: softDot(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      depthTest: !over,
    });
    this.object = new THREE.Points(g, mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = 20;
    this.object.castShadow = false;
    this.object.userData.noShadow = true;
    this.object.visible = false;
    this.object.name = 'flow-dots';
  }

  add(path: FlowPath): number {
    const cum = [0];
    for (let i = 1; i < path.points.length; i++) cum.push(cum[i - 1] + path.points[i].distanceTo(path.points[i - 1]));
    const length = cum[cum.length - 1];
    const spacing = path.spacing ?? 0.09;
    const n = Math.max(2, Math.min(this.max - this.total, Math.round(length / spacing)));
    const u: number[] = [];
    // each stretch its own phase: parallel lines would march in rows
    const phase = ((this.live.length * 0.6180339887) % 1) * (length / n);
    for (let i = 0; i < n; i++) u.push((length * i) / n + phase);
    this.colour.setHex(path.color);
    for (let i = 0; i < n; i++) {
      const k = this.total + i;
      this.col[k * 3] = this.colour.r;
      this.col[k * 3 + 1] = this.colour.g;
      this.col[k * 3 + 2] = this.colour.b;
    }
    this.live.push({ cum, length, u, first: this.total, points: path.points, show: 1, speed: 0 });
    this.total += n;
    this.object.geometry.setDrawRange(0, this.total);
    return this.live.length - 1;
  }

  /** New points for a path that moved; the dots keep their share of its length. The same number of points each time: no allocation. */
  setPoints(index: number, points: THREE.Vector3[]): void {
    const l = this.live[index];
    const old = l.length || 1;
    l.points = points;
    let c = 0;
    l.cum[0] = 0;
    for (let i = 1; i < points.length; i++) {
      c += points[i].distanceTo(points[i - 1]);
      l.cum[i] = c;
    }
    l.length = c;
    for (let i = 0; i < l.u.length; i++) l.u[i] = (l.u[i] / old) * l.length;
  }

  /** How fast a path runs, m/s, and what share of its dots it shows: a thin flow has few, none has none. */
  set(index: number, speed: number, show = 1): void {
    this.live[index].speed = speed;
    this.live[index].show = show;
  }

  get count(): number {
    return this.total;
  }

  /** Move every dot `dt` seconds, and write the positions. A dot past the share it shows goes under the world. */
  step(dt: number): void {
    for (const l of this.live) {
      if (l.length <= 0) continue;
      const shown = Math.round(l.u.length * l.show);
      for (let i = 0; i < l.u.length; i++) {
        let u = (l.u[i] + l.speed * dt) % l.length;
        if (u < 0) u += l.length;
        l.u[i] = u;
        const k = l.first + i;
        if (i < shown) this.place(l, u, k);
        else this.pos[k * 3 + 1] = -1000;
      }
    }
    this.object.geometry.attributes.position.needsUpdate = true;
  }

  private place(l: Live, u: number, k: number): void {
    const { cum } = l;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= u) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo];
    this.tmp.lerpVectors(l.points[lo], l.points[hi], seg > 0 ? (u - cum[lo]) / seg : 0);
    this.pos[k * 3] = this.tmp.x;
    this.pos[k * 3 + 1] = this.tmp.y;
    this.pos[k * 3 + 2] = this.tmp.z;
  }
}
