import * as THREE from 'three';
import type { PartRegistry, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { BiodigesterSim } from '../sim/engine';
import type { BioParams, BioState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, the box of what is drawn, rays from where the camera would stand.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation after some running; `params` edits the simulation first. */
export function stateWith(params: Partial<BioParams> = {}, seconds = 0.2): BioState {
  const sim = new BiodigesterSim();
  sim.set(params);
  for (let i = 0; i < 60 * seconds; i++) sim.step(1 / 60);
  return { ...sim.state, dropRgb: [...sim.state.dropRgb] as [number, number, number] };
}

/** The same state with the bell put where a test wants it, and what follows from that. */
export function bellAt(share: number, addedWeight = 0): BioState {
  const s = stateWith();
  s.bellRiseShare = share;
  s.bellRise = share * 0.69;
  s.bellRimHeight = 0.14 + s.bellRise;
  s.bellTopHeight = s.bellRimHeight + 1.3;
  s.bellTilt = 5 + 3 * share;
  void addedWeight;
  return s;
}

/** The box of an object's meshes (precise), everything under it. */
export const boxOf = (o: THREE.Object3D): THREE.Box3 => {
  o.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(o, true);
};

/** Distance between two boxes, m: 0 if they touch. */
export function gap(a: THREE.Box3, b: THREE.Box3): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y);
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.hypot(dx, dy, dz);
}

export const worldOf = (o: THREE.Object3D): THREE.Vector3 => {
  o.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
};

/** True when every object of the tree has finite transforms and finite first vertices. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m && m.count && !(Number.isFinite(m.array[0]) && Number.isFinite(m.array[m.array.length - 1]))) ok = false;
  });
  return ok;
}

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}

/** Draw calls (visible meshes, each instanced mesh once) and triangles (instances counted) of a scene, as the colour pass would issue them. */
export function drawStats(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return;
    const g = m.geometry;
    const raw = g.index ? g.index.count : (g.attributes.position?.count ?? 0);
    const n = (g.drawRange.count === Infinity ? raw : Math.min(raw, g.drawRange.count)) / 3;
    if (n < 1) return;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
    calls++;
    triangles += n * inst;
  });
  return { calls, triangles };
}

/** Rays from a camera to points of a part's box: the share that reach the part first. What `frameParts` would show of it, without a GL context. */
export function raysToPart(mod: SceneModule<BioState>, id: string, from: THREE.Vector3, target?: THREE.Box3): number {
  const reg = mod.registry;
  const entry = reg.get(id)!;
  const box = target ?? reg.frameBounds(id);
  const ray = new THREE.Raycaster();
  const all: THREE.Object3D[] = [];
  mod.scene.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh || !o.visible) return;
    if ((o as THREE.InstancedMesh).isInstancedMesh) return;
    const mat = (o as THREE.Mesh).material as THREE.Material;
    if (mat.transparent) return;
    all.push(o);
  });
  let reach = 0;
  let total = 0;
  const p = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const own = new Set<THREE.Object3D>(entry.meshes);
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++)
      for (let k = 0; k < 2; k++) {
        p.set(
          box.min.x + ((box.max.x - box.min.x) * (i + 0.5)) / 5,
          box.min.y + ((box.max.y - box.min.y) * (j + 0.5)) / 5,
          box.min.z + ((box.max.z - box.min.z) * (k + 0.5)) / 2,
        );
        dir.copy(p).sub(from).normalize();
        ray.set(from, dir);
        const hits = ray.intersectObjects(all, false);
        if (!hits.length) continue;
        const firstOwn = hits.findIndex((h) => own.has(h.object));
        if (firstOwn < 0) continue;
        total++;
        if (firstOwn === 0) reach++;
      }
  return total ? reach / total : 0;
}
