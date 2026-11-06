import * as THREE from 'three';
import { applyWear, contactRing, contactShadow, grassDetail, group, PartRegistry, rng } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { BioParams, BioState } from '../../sim/types';
import { BASE_Y, BUCKET, HOSE, PAD, TRACES, YARD } from '../dims';
import { FlowDots } from '../flows';
import { buildMachine, type Machine } from '../machine/machine';
import {
  box,
  boxUV,
  cylY,
  hoseCurve,
  lump,
  mergeAll,
  pipeSolid,
  revolveY,
  rewriteTube,
  rod,
  tubeThrough,
  V,
} from '../machine/shapes';
import { compost, concrete, corrugated, plaster, redEarth, soil, timber } from '../machine/textures';
import { dynamic, mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { anchor, hotspots, partsNow, viewFrom, type HotspotDef } from '../world';
import { createSky, nextHold, shownSun, type SkyRig } from './sky';
import { broom, sandals, stool, traceLooks, washingLine, washingUp, type Tie, type WashingLine } from './traces';
import { bananaClump, bedPlants, farTrees, leafCard, leafMaterial, mangoTree } from './vegetation';

// The `yard` world, the setting: a generic warm yard, nothing here is a measured place. The whole circle in one look: the scraps in, the flame out, the fertiliser to the beds. The plant stands in full sun on its pad, the kitchen behind
// it, the water butt beside it, one tree whose shade must miss the tank. The same machine as everywhere, closed, moving with the same state; the sun is the simulation's. World axes: +Z south, +X east. A yard does not come apart.

export const YARD_PARTS = [
  'biogas-plant',
  'kitchen-house',
  'yard-pad',
  'water-butt',
  'overflow-bucket',
  'vegetable-bed',
  'shade-tree',
  'compost-heap',
  'scrap-caddy',
  'hose-run',
] as const;
export type YardPart = (typeof YARD_PARTS)[number];

/** A guide's parts drop in along these; the world itself has no explode tool. */
export const EXPLODE: Record<YardPart, [number, number, number]> = {
  'biogas-plant': [0, 1.2, 0],
  'kitchen-house': [0, 0, 0],
  'yard-pad': [0, -0.2, 0],
  'water-butt': [0, 0.6, 0],
  'overflow-bucket': [0, 0.3, 0.3],
  'vegetable-bed': [0, 0.3, 0],
  'shade-tree': [0, 0, 0],
  'compost-heap': [0, 0.3, 0],
  'scrap-caddy': [0, 0.3, 0],
  'hose-run': [0, 0.25, 0],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'biogas-plant', ...partName('biogas-plant'), goto: 'digester' },
  // the labels' short names: the sheet's would run out of a narrow view (QA M6)
  { id: 'kitchen-house', ...partName('kitchen-house'), fr: 'Cuisine', en: 'Kitchen' },
  { id: 'shade-tree', ...partName('shade-tree') },
  { id: 'vegetable-bed', ...partName('vegetable-bed') },
  { id: 'compost-heap', ...partName('compost-heap') },
  { id: 'hose-run', ...partName('hose-run') },
  { id: 'water-butt', ...partName('water-butt'), minor: true },
  { id: 'overflow-bucket', ...partName('overflow-bucket'), minor: true },
  { id: 'scrap-caddy', ...partName('scrap-caddy'), minor: true },
  { id: 'yard-pad', ...partName('yard-pad'), minor: true },
];

/** The pad's turn: the tap and its hose towards the kitchen, so that the funnel looks at the yard. */
export const PLANT_TURN = Math.atan2(-(YARD.kitchenZ * -1) / 4.33, -YARD.kitchenX / 4.33);

export interface YardScene extends SceneModule<BioState> {
  machine: Machine;
  plantGroup: THREE.Group;
  sky: SkyRig;
  ground: THREE.Mesh;
  tree: { x: number; z: number; crown: THREE.Sphere };
  flows: FlowDots;
  hose: THREE.Mesh;
  sleeve: THREE.Vector3;
  /** What the family leaves about the yard (traces.ts), for the tests: the line and where it is tied, the things on the earth. */
  traces: { line: WashingLine; tie: Tie; onEarth: { name: string; box: THREE.Box3 }[]; plateOnRim: number };
  /** Tap to wall, m: K7's 5 m. */
  hoseLength: () => number;
}

const HOSE_N = 30;
/** Ground around the plot: a drainage ditch outside the wall, then the land rising. */
export function groundHeight(x: number, z: number): number {
  const outX = Math.max(YARD.x0 - x, x - YARD.x1, 0);
  const outZ = Math.max(YARD.z0 - z, z - YARD.z1, 0);
  const d = Math.hypot(outX, outZ);
  if (d <= 0) return 0;
  const ditch = -0.42 * Math.exp(-(((d - 2.2) / 1.1) ** 2));
  const bank = 0.65 * smooth(3.2, 7, d);
  const hills =
    smooth(22, 120, d) *
    (5 + 4 * Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017 + 0.7) + 2 * Math.sin((x + z) * 0.043));
  const far = smooth(120, 460, d) * 36;
  return ditch + bank + hills + far;
}
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createYardScene(
  params: () => Pick<BioParams, 'addedWeight' | 'feedKg' | 'waterPerKg'> &
    Partial<Pick<BioParams, 'running' | 'timeScale'>>,
): YardScene {
  const scene = new THREE.Scene();
  scene.name = 'yard';
  scene.background = new THREE.Color(0xbcd0e0);
  scene.userData.look = { toneMapping: 'aces', exposure: 0.84, saturation: 1.06 };
  const sky = createSky(scene);
  let lightHold = 0;

  const parts = Object.fromEntries(
    YARD_PARTS.map((id) => {
      const g = group(id);
      scene.add(g);
      return [id, g];
    }),
  ) as Record<YardPart, THREE.Group>;
  const put = (parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---- the ground: red earth inside the wall, trodden, dry grass and rising land outside
  const size = 1400;
  const seg = 160;
  const gGeo = new THREE.PlaneGeometry(size, size, seg, seg);
  gGeo.rotateX(-Math.PI / 2);
  const gp = gGeo.attributes.position;
  const gc = new Float32Array(gp.count * 3);
  const rc = rng(5);
  const dry = new THREE.Color(0x8e8a54);
  const green = new THREE.Color(0x6e7c46);
  const earth = new THREE.Color(0xa4714c);
  const c = new THREE.Color();
  for (let i = 0; i < gp.count; i++) {
    const k = (v: number) => Math.sign(v) * (size / 2) * Math.pow(Math.abs(v) / (size / 2), 2.4);
    const x = k(gp.getX(i));
    const z = k(gp.getZ(i));
    gp.setXYZ(i, x, groundHeight(x, z) - 0.015, z);
    const m = 0.5 + 0.5 * Math.sin(x * 0.07 + z * 0.05) * Math.cos(z * 0.09 - x * 0.03);
    c.copy(dry)
      .lerp(green, m * 0.75)
      .lerp(earth, Math.max(0, rc() * 0.3));
    gc[i * 3] = c.r;
    gc[i * 3 + 1] = c.g;
    gc[i * 3 + 2] = c.b;
  }
  gGeo.setAttribute('color', new THREE.BufferAttribute(gc, 3));
  gGeo.computeVertexNormals();
  const gMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, name: 'ground' });
  grassDetail(gMat);
  const ground = new THREE.Mesh(gGeo, gMat);
  ground.name = 'ground';
  ground.receiveShadow = true;
  scene.add(ground);

  // the plot's own floor: red earth, a touch above the land, the wall stands on its edge
  const earthMap = redEarth(201);
  earthMap.repeat.set((YARD.x1 - YARD.x0) / 7, (YARD.z1 - YARD.z0) / 7);
  const plotW = YARD.x1 - YARD.x0;
  const plotD = YARD.z1 - YARD.z0;
  const plotGeo = new THREE.PlaneGeometry(plotW + 0.8, plotD + 0.8, 1, 1);
  plotGeo.rotateX(-Math.PI / 2);
  plotGeo.translate((YARD.x0 + YARD.x1) / 2, 0.002, (YARD.z0 + YARD.z1) / 2);
  const plot = new THREE.Mesh(
    plotGeo,
    new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.97, name: 'plot-earth' }),
  );
  plot.receiveShadow = true;
  plot.name = 'plot';
  scene.add(plot);

  // ---- the setting's static things
  const setting = group('setting');
  scene.add(setting);

  // the wall round the plot, plastered block, a gate on the south
  const wallMaps = plaster(203, [204, 186, 156]);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallMaps.map,
    bumpMap: wallMaps.bump,
    bumpScale: 0.6,
    roughness: 0.96,
    name: 'yard-wall',
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8d8678, roughness: 0.93, name: 'wall-cap' });
  const wallH = 1.5;
  const wT = 0.18;
  const wallSeg = (x0: number, x1: number, z0: number, z1: number, h = wallH) => {
    put(setting, boxUV(x0, x1, 0, h, z0, z1, 1.6), wallMat);
    put(setting, box(x0 - 0.03, x1 + 0.03, h, h + 0.05, z0 - 0.03, z1 + 0.03), capMat);
  };
  wallSeg(YARD.x0 - wT, YARD.x1 + wT, YARD.z0 - wT, YARD.z0);
  wallSeg(YARD.x0 - wT, YARD.x0, YARD.z0, YARD.z1);
  wallSeg(YARD.x1, YARD.x1 + wT, YARD.z0, YARD.z1);
  const gateX0 = -1.2;
  const gateX1 = 1.5;
  wallSeg(YARD.x0 - wT, gateX0, YARD.z1, YARD.z1 + wT, 1.0);
  wallSeg(gateX1, YARD.x1 + wT, YARD.z1, YARD.z1 + wT, 1.0);
  const gateMat = new THREE.MeshStandardMaterial({ map: timber(205, [120, 104, 88]), roughness: 0.9, name: 'gate' });
  for (const x of [gateX0, gateX1])
    put(setting, box(x - 0.11, x + 0.11, 0, 1.55, YARD.z1 - 0.03, YARD.z1 + wT + 0.03), wallMat);
  for (let i = 0; i < 12; i++) {
    const x = gateX0 + 0.14 + i * 0.205;
    put(setting, box(x, x + 0.17, 0.08, 1.3, YARD.z1 + 0.05, YARD.z1 + 0.08), gateMat);
  }
  for (const y of [0.3, 1.05])
    put(setting, box(gateX0 + 0.1, gateX1 - 0.1, y, y + 0.1, YARD.z1 + 0.03, YARD.z1 + 0.05), gateMat);

  // a path of flat stones, from the gate to the plant and on to the kitchen's door
  const pathMat = new THREE.MeshStandardMaterial({
    map: concrete(207, [176, 164, 146]).map,
    roughness: 0.95,
    name: 'stone',
  });
  const rp = rng(11);
  const stones: THREE.BufferGeometry[] = [];
  const route: [number, number][] = [
    [0.2, 8.4],
    [0.5, 6.8],
    [0.9, 5.6],
    [1.6, 4.2],
    [2.4, 2.6],
    [3.0, 0.8],
    [3.3, -1.2],
    [3.4, -2.9],
  ];
  for (let s = 0; s < route.length - 1; s++) {
    const [ax, az] = route[s];
    const [bx, bz] = route[s + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.62);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const g = lump(0.25 + rp() * 0.08, 0.16, rp, 1);
      g.scale(1.1, 0.12, 0.95);
      g.translate(ax + (bx - ax) * t + (rp() - 0.5) * 0.14, 0.012, az + (bz - az) * t + (rp() - 0.5) * 0.14);
      stones.push(g);
    }
  }
  put(setting, mergeAll(stones), pathMat);

  // ---- the house and its kitchen, the kitchen's wall towards the plant
  const house = parts['kitchen-house'];
  const hxC = YARD.kitchenX + 2.3;
  const hx0 = hxC - YARD.houseW / 2;
  const hx1 = hxC + YARD.houseW / 2;
  const kz = YARD.kitchenZ; // south face of the kitchen
  const hz1 = kz - YARD.kitchenD; // south face of the house proper
  const hz0 = hz1 - YARD.houseD;
  const eave = YARD.houseEave;
  const ridge = YARD.houseRidge;
  const houseMaps = plaster(209, [216, 198, 164]);
  const houseMat = new THREE.MeshStandardMaterial({
    map: houseMaps.map,
    bumpMap: houseMaps.bump,
    bumpScale: 0.5,
    roughness: 0.94,
    name: 'house-wall',
  });
  const dustMat = new THREE.MeshStandardMaterial({ color: 0xa97f5c, roughness: 0.98, name: 'wall-dust' });
  const roofMaps = corrugated(211);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofMaps.map,
    bumpMap: roofMaps.bump,
    bumpScale: 0.35,
    roughness: 0.66,
    metalness: 0.3,
    name: 'roof',
  });
  roofMat.side = THREE.DoubleSide;
  const shutterMat = new THREE.MeshStandardMaterial({
    map: timber(213, [72, 104, 112]),
    roughness: 0.85,
    name: 'shutter',
  });
  const doorMat = new THREE.MeshStandardMaterial({ map: timber(215, [122, 78, 52]), roughness: 0.8, name: 'door' });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x23201d, roughness: 0.9, name: 'dark-opening' });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xcfc6b2, roughness: 0.85, name: 'frame' });
  put(house, boxUV(hx0, hx1, 0, eave, hz0, hz1, 1.6), houseMat);
  // the red dust the rain throws up the walls
  put(house, box(hx0 - 0.004, hx1 + 0.004, 0, 0.26, hz0 - 0.004, hz1 + 0.004), dustMat);
  // the gables
  for (const x of [hx0, hx1 - 0.2]) {
    const zc = (hz0 + hz1) / 2;
    const prof = new THREE.Shape([
      new THREE.Vector2(hz0, eave),
      new THREE.Vector2(hz1, eave),
      new THREE.Vector2(zc, ridge),
    ]);
    const g = new THREE.ExtrudeGeometry(prof, { depth: 0.2, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(x + 0.2, 0, 0);
    // (u, v, w) -> x = -w, y = v, z = u: its UVs left as they are, a plain wash
    put(house, g, houseMat);
  }
  // the roof: two slopes of corrugated iron with an overhang, a ridge cap, a fascia
  const over = 0.32;
  const zc = (hz0 + hz1) / 2;
  const sheet = (zA: number, yA: number, zB: number, yB: number, x0: number, x1: number): THREE.BufferGeometry => {
    const g = new THREE.BufferGeometry();
    const L = Math.hypot(zB - zA, yB - yA);
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, yA, zA, x1, yA, zA, x1, yB, zB, x0, yB, zB], 3));
    g.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute([0, 0, (x1 - x0) / 0.85, 0, (x1 - x0) / 0.85, L / 2.4, 0, L / 2.4], 2),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return g;
  };
  const roofDrop = (over * (ridge - eave)) / ((hz1 - hz0) / 2);
  put(house, sheet(hz1 + over, eave - roofDrop, zc, ridge + 0.02, hx0 - over, hx1 + over), roofMat);
  put(house, sheet(hz0 - over, eave - roofDrop, zc, ridge + 0.02, hx1 + over, hx0 - over), roofMat);
  put(
    house,
    box(hx0 - over, hx1 + over, ridge + 0.005, ridge + 0.055, zc - 0.11, zc + 0.11),
    new THREE.MeshStandardMaterial({ color: 0x7c7a74, roughness: 0.6, metalness: 0.3, name: 'ridge-cap' }),
  );
  put(
    house,
    box(hx0 - over, hx1 + over, eave - roofDrop - 0.1, eave - roofDrop + 0.01, hz1 + over - 0.03, hz1 + over),
    frameMat,
  );
  put(
    house,
    box(hx0 - over, hx1 + over, eave - roofDrop - 0.1, eave - roofDrop + 0.01, hz0 - over, hz0 - over + 0.03),
    frameMat,
  );

  // door and window of the house proper, on the south front past the kitchen
  const window2 = (x: number, y: number, z: number, w: number, h: number) => {
    put(house, box(x - w / 2, x + w / 2, y, y + h, z, z + 0.02), darkMat);
    put(house, box(x - w / 2 - 0.05, x + w / 2 + 0.05, y - 0.05, y, z, z + 0.06), frameMat);
    put(house, box(x - w / 2 - 0.05, x + w / 2 + 0.05, y + h, y + h + 0.05, z, z + 0.06), frameMat);
    put(house, box(x - w / 2 - 0.05, x - w / 2, y, y + h, z, z + 0.06), frameMat);
    put(house, box(x + w / 2, x + w / 2 + 0.05, y, y + h, z, z + 0.06), frameMat);
    for (let i = 1; i < 5; i++)
      put(
        house,
        cylY(0.006, y, y + h, x - w / 2 + (i * w) / 5, z + 0.035, 6),
        new THREE.MeshStandardMaterial({ color: 0x3d3d3f, roughness: 0.6, metalness: 0.6, name: 'bar' }),
      );
    // the open shutters
    put(house, box(x - w / 2 - 0.05 - w / 2, x - w / 2 - 0.05, y - 0.02, y + h + 0.02, z, z + 0.03), shutterMat);
    put(house, box(x + w / 2 + 0.05, x + w / 2 + 0.05 + w / 2, y - 0.02, y + h + 0.02, z, z + 0.03), shutterMat);
  };
  const eastX = YARD.kitchenX + YARD.kitchenW / 2 + 0.5;
  window2(hx1 - 1.0, 1.0, hz1, 0.8, 0.95);
  put(house, box(eastX - 0.42, eastX + 0.42, 0.02, 2.05, hz1, hz1 + 0.05), doorMat);
  put(house, box(eastX - 0.48, eastX + 0.48, 2.05, 2.11, hz1, hz1 + 0.07), frameMat);
  put(
    house,
    cylY(0.022, 1.0, 1.05, eastX + 0.34, hz1 + 0.07, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.4, metalness: 0.8, name: 'door-knob' }),
  );
  window2(hx0 + 1.1, 1.0, hz1, 0.7, 0.9);
  // the step
  put(house, boxUV(eastX - 0.6, eastX + 0.6, 0, 0.14, hz1, hz1 + 0.5, 0.9), pathMat);

  // the kitchen: a lean-to against the house, its low side towards the plant. Its small window, its vent in the gable end, a door
  const kx0 = YARD.kitchenX - YARD.kitchenW / 2;
  const kx1 = YARD.kitchenX + YARD.kitchenW / 2;
  const kLow = 2.15;
  const kHigh = eave - 0.14;
  put(house, boxUV(kx0, kx1, 0, kLow, kz - 0.2, kz, 1.6), houseMat);
  for (const x of [kx0, kx1 - 0.2]) {
    const prof = new THREE.Shape([
      new THREE.Vector2(kz, 0),
      new THREE.Vector2(hz1, 0),
      new THREE.Vector2(hz1, kHigh),
      new THREE.Vector2(kz, kLow),
    ]);
    const g = new THREE.ExtrudeGeometry(prof, { depth: 0.2, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(x + 0.2, 0, 0);
    put(house, g, houseMat);
  }
  put(house, box(kx0 - 0.004, kx1 + 0.004, 0, 0.26, kz - 0.004, kz + 0.004), dustMat);
  const kOver = 0.3;
  const kSlope = (kHigh - kLow) / YARD.kitchenD;
  put(house, sheet(kz + kOver, kLow - kOver * kSlope, hz1, kHigh + 0.02, kx0 - 0.2, kx1 + 0.2), roofMat);
  put(
    house,
    box(
      kx0 - 0.2,
      kx1 + 0.2,
      kLow - kOver * kSlope - 0.09,
      kLow - kOver * kSlope + 0.01,
      kz + kOver - 0.03,
      kz + kOver,
    ),
    frameMat,
  );
  window2(YARD.kitchenX + 0.75, 1.1, kz, 0.6, 0.6);
  // the door
  const doorX = YARD.kitchenX + 0.75 - 2.0 + 0.75;
  void doorX;
  // the kitchen's vent, high in its west gable, seen as a louvre
  for (let i = 0; i < 5; i++)
    put(house, box(kx0 - 0.012, kx0, 1.75 + i * 0.05, 1.78 + i * 0.05, kz - 1.6, kz - 1.05), frameMat);
  put(house, box(kx0 - 0.004, kx0, 1.7, 2.04, kz - 1.65, kz - 1.0), darkMat);
  // the house's own chimney: a charcoal kitchen's old flue, a short pipe through the roof
  put(
    house,
    cylY(0.07, kLow + 0.2, kHigh + 0.75, kx1 - 0.6, kz - 1.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x4e4c48, roughness: 0.7, metalness: 0.4, name: 'flue' }),
  );

  // ---- the plant on its pad, the pad turned so that its tap looks at the kitchen
  const machine = buildMachine();
  const look = machine.look;
  const plantGroup = new THREE.Group();
  plantGroup.name = 'plant-frame';
  plantGroup.position.set(YARD.padX, 0, YARD.padZ);
  plantGroup.rotation.y = PLANT_TURN;
  scene.add(plantGroup);
  const padMaps = concrete(61, [176, 170, 158]);
  const padMat = new THREE.MeshStandardMaterial({
    map: padMaps.map,
    bumpMap: padMaps.bump,
    bumpScale: 0.8,
    roughness: 0.94,
    name: 'pad',
  });
  const padFrame = group('pad-frame');
  padFrame.rotation.y = PLANT_TURN;
  padFrame.position.copy(plantGroup.position);
  parts['yard-pad'].add(padFrame);
  put(padFrame, boxUV(-PAD.halfX, PAD.halfX, 0, PAD.h, -PAD.halfZ, PAD.halfZ, 1.4), padMat);
  const padShadow = contactShadow(PAD.halfX * 2, PAD.halfZ * 2, 0.26, 0.42);
  padShadow.position.y = 0.0045;
  plantGroup.add(padShadow);
  machine.root.position.y = PAD.h + BASE_Y;
  // the machine's root goes in the part, and the part stays at the world's origin: its transform carries the turn
  const plantPart = parts['biogas-plant'];
  const plantFrame = group('plant-turn');
  plantFrame.position.copy(plantGroup.position);
  plantFrame.rotation.y = PLANT_TURN;
  plantPart.add(plantFrame);
  plantFrame.add(machine.root);
  const palletShadow = contactShadow(1.2, 1.0, 0.09, 0.42);
  palletShadow.position.y = PAD.h + 0.0012;
  plantGroup.add(palletShadow);

  // the effluent's bucket: the machine's own, a part here
  const bucketFrame = group('bucket-turn');
  bucketFrame.position.copy(plantGroup.position);
  bucketFrame.rotation.y = PLANT_TURN;
  bucketFrame.position.y = PAD.h + BASE_Y;
  parts['overflow-bucket'].add(bucketFrame);
  bucketFrame.add(machine.bucket.root);
  machine.root.add(machine.bucket.stream);

  // ---- the water butt on two blocks, beside the plant: a blue drum, its ribs, a tap low down, a lid
  const butt = parts['water-butt'];
  const buttFrame = group('butt-turn');
  buttFrame.position.copy(plantGroup.position);
  buttFrame.rotation.y = PLANT_TURN;
  butt.add(buttFrame);
  const buttX = 1.8;
  const buttZ = -0.5;
  const blockMap = concrete(217, [150, 148, 140]);
  const blockMat = new THREE.MeshStandardMaterial({ map: blockMap.map, roughness: 0.96, name: 'block' });
  for (const dz of [-0.17, 0.17])
    put(buttFrame, boxUV(buttX - 0.2, buttX + 0.2, 0, 0.2, buttZ + dz - 0.1, buttZ + dz + 0.1, 0.5), blockMat);
  const R = YARD.buttR;
  const Hb = YARD.buttH;
  const prof: [number, number][] = [
    [0, 0],
    [R - 0.03, 0],
    [R, 0.03],
  ];
  for (const y of [0.3, 0.62]) prof.push([R, y - 0.03], [R + 0.012, y - 0.012], [R + 0.012, y + 0.012], [R, y + 0.03]);
  prof.push([R, Hb - 0.05], [R - 0.012, Hb - 0.012], [R - 0.05, Hb], [0, Hb]);
  const buttGeo = revolveY(prof, { seg: 40 });
  buttGeo.translate(buttX, 0.2, buttZ);
  put(buttFrame, buttGeo, new THREE.MeshStandardMaterial({ color: 0x2c6a96, roughness: 0.55, name: 'butt' }));
  put(
    buttFrame,
    cylY(0.1, 0.2 + Hb - 0.002, 0.2 + Hb + 0.03, buttX, buttZ, 22),
    new THREE.MeshStandardMaterial({ color: 0x24567a, roughness: 0.6, name: 'butt-lid' }),
  );
  const tapA = -2.45;
  const tDir = V(Math.cos(tapA), 0, Math.sin(tapA));
  const tFrom = V(buttX, 0.34, buttZ).addScaledVector(tDir, R - 0.002);
  const tTo = tFrom.clone().addScaledVector(tDir, 0.07);
  put(buttFrame, rod(tFrom, tTo, 0.011, 10), look.brass);
  put(buttFrame, cylY(0.015, tTo.y - 0.04, tTo.y + 0.014, tTo.x, tTo.z, 10), look.brass);
  put(buttFrame, cylY(0.005, tTo.y + 0.014, tTo.y + 0.04, tTo.x, tTo.z, 6), look.brass);
  put(
    buttFrame,
    rod(V(tTo.x - 0.03, tTo.y + 0.04, tTo.z), V(tTo.x + 0.03, tTo.y + 0.04, tTo.z), 0.005, 6),
    look.redPaint,
  );
  const buttShadow = contactShadow(0.42, 0.56, 0.1, 0.4);
  buttShadow.position.set(buttX, 0.0045, buttZ);
  plantGroup.add(buttShadow);

  // ---- the caddy on the pad by the funnel: a lidded pail, its lid off, scraps in it, its lid against it
  const caddyPart = parts['scrap-caddy'];
  const caddyFrame = group('caddy-turn');
  caddyFrame.position.copy(plantGroup.position);
  caddyFrame.rotation.y = PLANT_TURN;
  caddyPart.add(caddyFrame);
  const cx = YARD.caddyX;
  const cz = YARD.caddyZ;
  const cR = 0.12;
  const cH = 0.27;
  const caddyMat = new THREE.MeshStandardMaterial({ color: 0x5d8a58, roughness: 0.56, name: 'caddy' });
  const caddyGeo = revolveY(
    [
      [0, 0],
      [cR - 0.02, 0],
      [cR, cH - 0.02],
      [cR + 0.008, cH - 0.02],
      [cR + 0.008, cH],
      [cR - 0.004, cH],
      [cR - 0.022, 0.006],
      [0, 0.006],
    ],
    { seg: 28 },
  );
  caddyGeo.translate(cx, PAD.h, cz);
  put(caddyFrame, caddyGeo, caddyMat);
  const handle = new THREE.TorusGeometry(cR + 0.006, 0.0035, 6, 24, Math.PI);
  handle.rotateY(Math.PI / 2);
  handle.translate(cx, PAD.h + cH, cz);
  put(caddyFrame, handle, look.steel);
  const rs = rng(23);
  const scraps = [0xcc8e3e, 0x8fa24a, 0xdcbe6c, 0xb2542e, 0xe6dab0].map(() => [] as THREE.BufferGeometry[]);
  for (let i = 0; i < 44; i++) {
    const a = rs() * 6.28;
    const r = Math.sqrt(rs()) * (cR - 0.03);
    const g = lump(0.017 + rs() * 0.014, 0.5, rs, 0);
    g.scale(1.35, 0.7, 1);
    g.translate(cx + Math.cos(a) * r, PAD.h + cH - 0.05 + rs() * 0.04, cz + Math.sin(a) * r);
    scraps[i % 5].push(g);
  }
  [0xcc8e3e, 0x8fa24a, 0xdcbe6c, 0xb2542e, 0xe6dab0].forEach((col, i) =>
    put(
      caddyFrame,
      mergeAll(scraps[i]),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, name: `scrap-${i}` }),
    ),
  );
  // its lid, leaning against the pail
  const lid = revolveY(
    [
      [0, 0],
      [cR + 0.008, 0],
      [cR + 0.008, 0.012],
      [0, 0.02],
    ],
    { seg: 26 },
  );
  lid.rotateX(1.18);
  lid.translate(cx - 0.02, PAD.h + (cR + 0.008) * Math.sin(1.18) + 0.001, cz + cR + 0.056);
  put(caddyFrame, lid, caddyMat);
  const caddyRing = contactRing(cR - 0.02, 0.05, 0.36);
  caddyRing.position.set(cx, PAD.h + 0.0012, cz);
  plantGroup.add(caddyRing);

  // ---- the hose: from the tap, flexing, to a stake at the pad's corner, down along the ground to its low point, and up to the wall sleeve
  const hosePart = parts['hose-run'];
  const sleeveAt = V(YARD.kitchenX - 0.72, YARD.sleeveY, kz);
  const stake = V(1.0, 0.72, -1.72);
  const lowPoint = V(1.46, 0.035, -2.72);
  const nearWall = V(sleeveAt.x, 0.06, kz + 0.2);
  const upPts = [
    stake.clone(),
    V(stake.x, 0.42, stake.z),
    V(stake.x + 0.06, 0.12, stake.z - 0.1),
    V(1.14, 0.05, -2.1),
    lowPoint,
    V(1.62, 0.03, -2.98),
    V(nearWall.x - 0.02, 0.05, nearWall.z + 0.04),
    nearWall,
    V(sleeveAt.x, 0.5, kz + 0.04),
    V(sleeveAt.x, YARD.sleeveY - 0.08, kz + 0.04),
    V(sleeveAt.x, YARD.sleeveY, kz + 0.035),
    V(sleeveAt.x, YARD.sleeveY, kz),
  ];
  const fixedPath = smoothPath(upPts, 8);
  put(hosePart, tubeThrough(fixedPath, HOSE.r, 10), look.hose);
  const curve: THREE.Vector3[] = [];
  const tapWorld = new THREE.Vector3();
  plantFrame.updateWorldMatrix(true, true);
  machine.bellPoseGroup.updateWorldMatrix(true, true);
  machine.tapOutlet.getWorldPosition(tapWorld);
  const tapDirWorld = machine.tapDir.clone().applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  hoseCurve(tapWorld, tapDirWorld, stake, V(0, 1, 0), 0.45, 0.02, HOSE_N, curve);
  const flex = put(hosePart, tubeThrough(curve, HOSE.r, 10), look.hose);
  flex.name = 'hose-flex';
  flex.frustumCulled = false;
  dynamic(flex);
  // the stake it is clipped to, the sleeve in the wall
  put(
    hosePart,
    box(stake.x - 0.03, stake.x + 0.03, 0, stake.y + 0.06, stake.z - 0.03 - 0.03, stake.z - 0.03 + 0.03),
    look.palletWood,
  );
  put(
    hosePart,
    pipeSolid(
      [V(stake.x, stake.y - 0.02, stake.z), V(stake.x, stake.y + 0.02, stake.z)],
      HOSE.r + 0.003,
      HOSE.r - 0.0005,
      10,
    ),
    look.zinc,
  );
  put(
    hosePart,
    pipeSolid([V(sleeveAt.x, YARD.sleeveY, kz + 0.04), V(sleeveAt.x, YARD.sleeveY, kz - 0.21)], 0.03, HOSE.r, 16),
    look.steel,
  );
  put(
    hosePart,
    pipeSolid([V(sleeveAt.x, YARD.sleeveY, kz + 0.02), V(sleeveAt.x, YARD.sleeveY, kz + 0.003)], 0.046, 0.03, 16),
    look.rubber,
  );
  // pegs where it runs along the ground
  for (const i of [
    Math.round(fixedPath.length * 0.34),
    Math.round(fixedPath.length * 0.46),
    Math.round(fixedPath.length * 0.58),
  ]) {
    const p = fixedPath[i];
    const g = new THREE.TorusGeometry(HOSE.r + 0.002, 0.003, 5, 12, Math.PI);
    g.translate(p.x, Math.max(0.002, p.y - 0.002), p.z);
    put(hosePart, g, look.zinc);
  }

  // ---- the vegetable beds: raised, three of them, rows of greens, tomatoes on stakes, maize
  const beds = parts['vegetable-bed'];
  const soilMaps = soil(219);
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilMaps.map,
    bumpMap: soilMaps.bump,
    bumpScale: 1.1,
    roughness: 0.98,
    name: 'bed-soil',
  });
  const plankMat = new THREE.MeshStandardMaterial({
    map: timber(221, [126, 106, 84]),
    roughness: 0.92,
    name: 'bed-plank',
  });
  const greensMat = leafMaterial(leafCard(223, [120, 168, 72], [48, 106, 44], 54, 128, 0.42), 'greens');
  const tomatoMat = leafMaterial(leafCard(225, [86, 128, 58], [38, 82, 40], 80, 128, 0.32), 'tomato');
  const maizeMat = leafMaterial(leafCard(227, [132, 158, 72], [70, 110, 46], 36, 128, 0.1), 'maize');
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x6a7a3c, roughness: 0.85, name: 'stalk' });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0xc93a28, roughness: 0.42, name: 'tomato-fruit' });
  const stakeMat = new THREE.MeshStandardMaterial({
    map: timber(229, [150, 130, 100]),
    roughness: 0.92,
    name: 'garden-stake',
  });
  const bh = YARD.bedH;
  const list: {
    greens: THREE.BufferGeometry[];
    tomato: THREE.BufferGeometry[];
    maize: THREE.BufferGeometry[];
    stalks: THREE.BufferGeometry[];
    fruit: THREE.BufferGeometry[];
    stakes: THREE.BufferGeometry[];
  } = {
    greens: [],
    tomato: [],
    maize: [],
    stalks: [],
    fruit: [],
    stakes: [],
  };
  for (let b = 0; b < 3; b++) {
    const x0 = YARD.bedX + b * (YARD.bedW + YARD.bedGap);
    const x1 = x0 + YARD.bedW;
    const z0 = YARD.bedZ;
    const z1 = z0 + YARD.bedL;
    const pl = 0.035;
    put(beds, boxUV(x0 + pl, x1 - pl, 0, bh - 0.03, z0 + pl, z1 - pl, 0.9), soilMat);
    put(beds, plank(x0, x1, 0, bh, z0, z0 + pl), plankMat);
    put(beds, plank(x0, x1, 0, bh, z1 - pl, z1), plankMat);
    put(beds, plankZ(x0, x0 + pl, 0, bh, z0 + pl, z1 - pl), plankMat);
    put(beds, plankZ(x1 - pl, x1, 0, bh, z0 + pl, z1 - pl), plankMat);
    for (const [px, pz] of [
      [x0, z0],
      [x1 - 0.05, z0],
      [x0, z1 - 0.05],
      [x1 - 0.05, z1 - 0.05],
    ]) {
      put(beds, box(px, px + 0.05, 0, bh + 0.05, pz, pz + 0.05), plankMat);
    }
    const shadow = contactShadow(YARD.bedW, YARD.bedL, 0.12, 0.34);
    shadow.position.set((x0 + x1) / 2, 0.0045, (z0 + z1) / 2);
    setting.add(shadow);
    const rows = 3;
    const y = bh - 0.03;
    for (let row = 0; row < rows; row++) {
      const rx = x0 + ((row + 0.5) * YARD.bedW) / rows;
      const seed = 300 + b * 10 + row;
      const kind = b === 0 ? 'greens' : b === 1 ? (row === 1 ? 'greens' : 'tomato') : 'maize';
      const count = kind === 'greens' ? 13 : kind === 'tomato' ? 9 : 16;
      const pl2 = bedPlants(kind, rx, z0 + 0.14, rx, z1 - 0.14, y, count, seed);
      if (kind === 'greens') list.greens.push(pl2.sprays);
      else if (kind === 'tomato') list.tomato.push(pl2.sprays);
      else list.maize.push(pl2.sprays);
      if (pl2.stalks) list.stalks.push(pl2.stalks);
      if (pl2.fruit) list.fruit.push(pl2.fruit);
      if (kind === 'tomato') {
        for (let k = 0; k < count; k++) {
          const z = z0 + 0.14 + ((k + 0.5) / count) * (YARD.bedL - 0.28);
          list.stakes.push(box(rx + 0.025, rx + 0.045, y - 0.03, y + 1.25, z - 0.01, z + 0.01));
        }
      }
    }
  }
  const putLeaves = (g: THREE.BufferGeometry[], m: THREE.Material) => {
    const mesh = new THREE.Mesh(mergeAll(g), m);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.userData.keep = true;
    beds.add(mesh);
  };
  putLeaves(list.greens, greensMat);
  putLeaves(list.tomato, tomatoMat);
  putLeaves(list.maize, maizeMat);
  put(beds, mergeAll(list.stalks), stalkMat);
  put(beds, mergeAll(list.fruit), fruitMat);
  put(beds, mergeAll(list.stakes), stakeMat);

  // a watering can on the path by the beds: the effluent goes out diluted
  const canMat = new THREE.MeshStandardMaterial({ color: 0x8f9a98, roughness: 0.42, metalness: 0.68, name: 'can' });
  const can = group('can');
  can.position.set(YARD.bedX - 0.38, 0, YARD.bedZ + 0.5);
  put(can, cylY(0.1, 0, 0.26, 0, 0, 20), canMat);
  put(can, rod(V(0.09, 0.05, 0), V(0.32, 0.32, 0), 0.016, 8, 0.012), canMat);
  put(can, cylY(0.036, 0.0, 0.01, 0, 0, 10).translate(0.33, 0.31, 0).rotateZ(0), canMat);
  put(can, new THREE.TorusGeometry(0.1, 0.008, 6, 18, Math.PI).translate(0, 0.26, 0).rotateY(0.2), canMat);
  setting.add(can);
  const canRing = contactRing(0.1, 0.05, 0.36);
  canRing.position.set(can.position.x, 0.004, can.position.z);
  setting.add(canRing);

  // ---- the shade tree: a mango, back in the corner, where its shade does not reach the tank
  const tree = mangoTree(241, YARD.treeH);
  tree.root.position.set(YARD.treeX, 0, YARD.treeZ);
  parts['shade-tree'].add(tree.root);

  // ---- what the family leaves about the yard (traces.ts, docs/scenery.md). Nobody is drawn: the wash on a line from the mango to a pole, a stool and the washing-up by the kitchen's west wall, a
  // broom leant there, sandals before the door beside the kitchen. Where the film's cameras look, clear of the plant and the hose. Scenery: in `setting`, merged and hidden with it
  const traceLook = traceLooks();
  const tie = barkAround(tree.root, YARD.treeX, TRACES.lineTrunkY, YARD.treeZ);
  const washing = washingLine(tie, traceLook);
  setting.add(washing.group);
  const kWestX = YARD.kitchenX - YARD.kitchenW / 2;
  const seat = stool(traceLook);
  seat.position.set(TRACES.stoolX, 0, TRACES.stoolZ);
  seat.rotation.y = 0.14;
  setting.add(seat);
  // the plate's face towards the yard, where one comes from
  const dishes = washingUp(traceLook, V(-0.49, 0, 0.87));
  dishes.group.position.set(TRACES.basinX, 0, TRACES.basinZ);
  setting.add(dishes.group);
  const broomFoot = V(TRACES.broomX, 0, TRACES.broomZ);
  const broomHeadX = kWestX - 0.018;
  const broomRise = Math.sqrt(TRACES.broomL ** 2 - (broomHeadX - broomFoot.x) ** 2 - 0.08 ** 2);
  const sweep = broom(traceLook, broomFoot, V(broomHeadX, broomRise, TRACES.broomZ + 0.08));
  setting.add(sweep);
  const pair = sandals(traceLook);
  pair.position.set(eastX + 0.12, 0, kz - YARD.kitchenD + 0.5 + 0.035 + TRACES.sandalL);
  pair.rotation.y = 0.05;
  setting.add(pair);
  // measured before the setting is merged into a few meshes
  const onEarth = [seat, dishes.group, sweep, pair, washing.pole.mesh].map((o) => {
    o.updateWorldMatrix(true, true);
    return { name: o.name || 'line-pole', box: new THREE.Box3().setFromObject(o, true) };
  });
  const plateOnRim = (() => {
    // how far the plate's back stands from the basin's bead where it leans: 0 when it rests on it
    dishes.plate.updateWorldMatrix(true, true);
    const n = new THREE.Vector3(0, 1, 0).applyQuaternion(dishes.plate.getWorldQuaternion(new THREE.Quaternion()));
    const back = dishes.plate.getWorldPosition(new THREE.Vector3());
    const c = V(-0.49, 0, 0.87).normalize();
    const bead = V(TRACES.basinX, TRACES.basinH - 0.004, TRACES.basinZ).addScaledVector(c, TRACES.basinR1 + 0.004);
    return bead.sub(back).dot(n);
  })();

  // ---- the compost heap, a slatted bin of old planks, a mound of what must not go in, a few sticks and a fork
  const heap = parts['compost-heap'];
  const hx = YARD.compostX;
  const hz = YARD.compostZ;
  const binW = 1.5;
  const binD = 1.3;
  const binH = 0.82;
  const compostMaps = compost(243);
  const heapG = (() => {
    const g = new THREE.IcosahedronGeometry(1, 10);
    const p = g.attributes.position;
    const r = rng(45);
    const seen = new Map<string, number>();
    for (let i = 0; i < p.count; i++) {
      const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      let k = seen.get(key);
      if (k === undefined) {
        k = 0.88 + r() * 0.24;
        seen.set(key, k);
      }
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      p.setXYZ(i, hx + x * (binW / 2 - 0.05) * k, Math.max(0, y) * 0.95 * k, hz + z * (binD / 2 - 0.05) * k);
    }
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * 0.9, p.getZ(i) * 0.9 + p.getY(i) * 0.5);
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    return g;
  })();
  put(
    heap,
    heapG,
    new THREE.MeshStandardMaterial({
      map: compostMaps.map,
      bumpMap: compostMaps.bump,
      bumpScale: 2.6,
      roughness: 0.96,
      name: 'compost',
    }),
  );
  const slatMat = new THREE.MeshStandardMaterial({
    map: timber(247, [116, 96, 76]),
    roughness: 0.94,
    name: 'bin-slat',
  });
  for (let s = 0; s < 6; s++) {
    const y = 0.05 + s * 0.14;
    put(heap, box(hx - binW / 2, hx + binW / 2, y, y + 0.1, hz - binD / 2 - 0.03, hz - binD / 2), slatMat);
    put(heap, box(hx - binW / 2 - 0.03, hx - binW / 2, y, y + 0.1, hz - binD / 2, hz + binD / 2), slatMat);
    put(heap, box(hx + binW / 2, hx + binW / 2 + 0.03, y, y + 0.1, hz - binD / 2, hz + binD / 2), slatMat);
  }
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const px = hx + sx * (binW / 2 + 0.0);
    const pz = hz + sz * (binD / 2 + 0.0);
    put(heap, box(px - 0.04, px + 0.04, 0, binH + 0.12, pz - 0.04, pz + 0.04), slatMat);
  }
  const rs2 = rng(47);
  const sticks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 12; i++) {
    const a = V(hx + (rs2() - 0.5) * 1.1, 0.4 + rs2() * 0.5, hz + (rs2() - 0.5) * 0.9);
    const b = a.clone().add(V((rs2() - 0.5) * 0.7, (rs2() - 0.5) * 0.15, (rs2() - 0.5) * 0.7));
    sticks.push(rod(a, b, 0.01 + rs2() * 0.012, 6));
  }
  put(heap, mergeAll(sticks), new THREE.MeshStandardMaterial({ color: 0x5f4a34, roughness: 0.94, name: 'sticks' }));
  // the fork stuck in it
  put(
    heap,
    rod(V(hx + 0.28, 0.6, hz + 0.22), V(hx + 0.56, 1.72, hz + 0.3), 0.016, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.76, name: 'fork-shaft' }),
  );
  put(heap, rod(V(hx + 0.21, 0.32, hz + 0.2), V(hx + 0.28, 0.6, hz + 0.22), 0.012, 8), look.steel);
  const heapShadow = contactShadow(binW + 0.1, binD + 0.1, 0.14, 0.34);
  heapShadow.position.set(hx, 0.0045, hz);
  setting.add(heapShadow);

  // ---- two banana clumps against the wall, a few shrubs at its foot
  for (const [x, z, seed, stems, H] of [
    [-9.0, -1.2, 251, 5, 3.6],
    [9.6, -1.5, 253, 4, 3.2],
    [-3.2, -11.2, 255, 3, 2.9],
  ] as const) {
    const b = bananaClump(seed, stems, H);
    b.position.set(x, 0, z);
    setting.add(b);
  }

  // ---- tufts of grass where nobody walks: along the wall, round the tree's foot, by the beds
  const tuftMat = leafMaterial(leafCard(265, [150, 158, 84], [92, 112, 56], 60, 128, 0.07), 'tuft-leaf');
  const tuftList: THREE.BufferGeometry[] = [];
  const rt = rng(267);
  const tuft = (x: number, z: number, h: number) => {
    tuftList.push(bedPlants('greens', x, z, x + 0.01, z + 0.01, h * 0.6, 1, Math.floor(rt() * 9999)).sprays);
  };
  for (let i = 0; i < 150; i++) {
    const side = i % 4;
    const t = rt();
    const inset = 0.2 + rt() * rt() * 1.1;
    if (side === 0) tuft(YARD.x0 + inset, YARD.z0 + t * (YARD.z1 - YARD.z0), 0.2);
    else if (side === 1) tuft(YARD.x1 - inset, YARD.z0 + t * (YARD.z1 - YARD.z0), 0.2);
    else if (side === 2) tuft(YARD.x0 + t * (YARD.x1 - YARD.x0), YARD.z0 + inset, 0.2);
    else {
      const a = rt() * 6.28;
      const r = 1 + rt() * 2.6;
      tuft(YARD.treeX + Math.cos(a) * r, YARD.treeZ + Math.sin(a) * r, 0.18);
    }
  }
  for (let i = 0; i < 70; i++) {
    const x = -5 + rt() * 7;
    const z = 3 + rt() * 5;
    if (Math.abs(x - 0.9) < 1.3) continue;
    tuft(x, z, 0.12);
  }
  const tufts = new THREE.Mesh(mergeAll(tuftList), tuftMat);
  tufts.castShadow = false;
  tufts.receiveShadow = true;
  tufts.frustumCulled = false;
  tufts.userData.keep = true;
  setting.add(tufts);

  // ---- far trees and neighbours' roofs: what stands beyond the wall
  const R0 = rng(261);
  const places: { x: number; y: number; z: number; s: number; tone: number }[] = [];
  for (let i = 0; i < 360; i++) {
    const a = R0() * Math.PI * 2;
    const d = 42 + R0() * 480;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    // clumps, with open land between them
    if (Math.sin(x * 0.031 + 1.7) * Math.cos(z * 0.027) < -0.05) continue;
    places.push({ x, y: groundHeight(x, z), z, s: 1.5 + R0() * 1.7, tone: R0() < 0.3 ? 0x88a060 : 0x9ab06c });
  }
  scene.add(farTrees(places));
  const roofs = group('neighbours');
  const rn = rng(263);
  for (let i = 0; i < 18; i++) {
    const a = rn() * Math.PI * 2;
    const d = 30 + rn() * 70;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (x > YARD.x0 - 12 && x < YARD.x1 + 12 && z > YARD.z0 - 12 && z < YARD.z1 + 12) continue;
    const w = 5 + rn() * 4;
    const dp = 4 + rn() * 2;
    const y = groundHeight(x, z);
    put(roofs, box(x - w / 2, x + w / 2, y - 0.5, y + 2.5, z - dp / 2, z + dp / 2), houseMat);
    put(roofs, sheet(z + dp / 2 + 0.3, y + 2.4, z, y + 3.4, x - w / 2 - 0.3, x + w / 2 + 0.3), roofMat);
    put(roofs, sheet(z - dp / 2 - 0.3, y + 2.4, z, y + 3.4, x + w / 2 + 0.3, x - w / 2 - 0.3), roofMat);
  }
  mergeStatic(roofs, { bakeKey: 'yard-far' });
  setting.add(roofs);

  // ---- anchors
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: YardPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(parts[id], x, y, z, `${id}-label`);
  };
  // on the plant's right as the home view sees it: its name starts past the plant and leaves it to be found at 390 px
  at('biogas-plant', 0.85, 3.0, -0.25);
  at('kitchen-house', YARD.kitchenX, ridge + 0.1, zc);
  at('shade-tree', YARD.treeX, YARD.treeH - 0.3, YARD.treeZ);
  at('vegetable-bed', YARD.bedX + 0.4, 0.6, YARD.bedZ + 2);
  at('compost-heap', hx, 1.05, hz);
  // on its run across the ground, below the plant's name
  const hoseAt = fixedPath[Math.round(fixedPath.length * 0.46)]!;
  at('hose-run', hoseAt.x, hoseAt.y + 0.05, hoseAt.z);
  const buttAnchor = new THREE.Vector3(buttX, 1.14, buttZ).applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  at('water-butt', buttAnchor.x, buttAnchor.y, buttAnchor.z);
  const bucketAnchor = V(-0.8, 0.46, 0).applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  at('overflow-bucket', bucketAnchor.x, bucketAnchor.y, bucketAnchor.z);
  const caddyAnchor = V(cx, PAD.h + cH + 0.04, cz).applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  at('scrap-caddy', caddyAnchor.x, caddyAnchor.y, caddyAnchor.z);
  const padAnchor = V(PAD.halfX - 0.1, PAD.h, PAD.halfZ - 0.1).applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  at('yard-pad', padAnchor.x, padAnchor.y, padAnchor.z);

  // ---- merge and register. The plant is one part here: its meshes are the machine's, not merged further, since its bell moves
  const FRAMING: Partial<Record<YardPart, PartFraming>> = {
    'biogas-plant': { frame: new THREE.Box3(V(-1.1, 0, -1.1), V(1.1, 2.5, 1.1)), viewDir: viewFrom(16, 30) },
    'hose-run': { frame: new THREE.Box3(V(-0.2, 0, -3.5), V(2.2, 2.2, -0.2)), viewDir: viewFrom(22, 48) },
    'kitchen-house': { frame: new THREE.Box3(V(hx0, 0, hz0), V(hx1, ridge, kz)), viewDir: viewFrom(16, 24) },
    'vegetable-bed': { viewDir: viewFrom(24, 30) },
    'shade-tree': { viewDir: viewFrom(10, 32) },
    'compost-heap': { viewDir: viewFrom(20, -18) },
    'water-butt': { viewDir: viewFrom(14, -30) },
    'scrap-caddy': { viewDir: viewFrom(26, -36) },
    'overflow-bucket': { viewDir: viewFrom(16, 62) },
    'yard-pad': { viewDir: viewFrom(30, 30) },
  };
  const registry = new PartRegistry();
  for (const id of [
    'kitchen-house',
    'vegetable-bed',
    'compost-heap',
    'water-butt',
    'scrap-caddy',
    'yard-pad',
  ] as const) {
    mergeStatic(parts[id], { bakeKey: 'yard' });
  }
  mergeStatic(setting, { bakeKey: 'yard-setting' });
  for (const id of YARD_PARTS) {
    registry.add(id, parts[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  const foliage: { id: YardPart; mesh: THREE.Mesh }[] = [];
  for (const id of YARD_PARTS) {
    for (const mesh of registry.get(id)!.meshes) {
      const mat = mesh.material as THREE.Material;
      if (mat.alphaTest > 0 || mat.name === 'mango-mass') foliage.push({ id, mesh });
    }
  }
  applyWear(scene, 3.2, (m) => {
    const n = (m.material as THREE.Material).name;
    return (
      [
        'ground',
        'plot-earth',
        'hdpe',
        'hdpe-bell',
        'surface',
        'sky',
        'pallet',
        'effluent',
        'hose',
        'line-cord',
      ].includes(n) ||
      n.startsWith('cloth') ||
      n.includes('leaf') ||
      n === 'greens' ||
      n === 'tomato' ||
      n === 'maize'
    );
  });
  applyWear(plantFrame, 30, (m) => ['surface', 'effluent', 'bubble'].includes((m.material as THREE.Material).name));

  // ---- flows: scraps into the funnel, gas to the wall, effluent to the beds
  const flows = new FlowDots(220, 0.09);
  scene.add(flows.object);
  const toWorld = (x: number, y: number, z: number) => V(x, y, z).applyAxisAngle(V(0, 1, 0), PLANT_TURN);
  const funnelP = toWorld(0.635, 1.34 + BASE_Y, 0);
  const caddyTop = toWorld(cx, PAD.h + cH, cz);
  const scrapPath = flows.add({
    points: [caddyTop, caddyTop.clone().lerp(funnelP, 0.5).setY(1.7), funnelP],
    color: 0xd27a30,
    spacing: 0.45,
  });
  const gasPts: THREE.Vector3[] = [...curve.map((p) => p.clone()), ...fixedPath];
  const gasPath = flows.add({ points: gasPts, color: 0x2f78dc, spacing: 0.55 });
  const bk = toWorld(-0.8, BUCKET.h + PAD.h, 0);
  const effPath = flows.add({
    points: [
      bk,
      V(1.0, 0.3, 1.4),
      V(1.9, 0.26, 2.6),
      V(YARD.bedX + 0.2, 0.32, YARD.bedZ + 0.8),
      V(YARD.bedX + YARD.bedW / 2, 0.3, YARD.bedZ + 2.4),
    ],
    color: 0xa58a35,
    spacing: 0.6,
  });

  const lastTap = new THREE.Vector3(1e3, 0, 0);
  const tapNow = new THREE.Vector3();

  const mod: YardScene = {
    id: 'yard',
    scene,
    registry,
    machine,
    plantGroup,
    sky,
    ground,
    tree: { x: YARD.treeX, z: YARD.treeZ, crown: tree.crown },
    flows,
    hose: flex,
    sleeve: sleeveAt,
    traces: { line: washing, tie, onEarth, plateOnRim },
    hoseLength() {
      let L = 0;
      for (let i = 1; i < curve.length; i++) L += curve[i].distanceTo(curve[i - 1]);
      for (let i = 1; i < fixedPath.length; i++) L += fixedPath[i].distanceTo(fixedPath[i - 1]);
      return L;
    },
    hotspots: hotspots(HOTSPOTS, anchors),
    home: { position: new THREE.Vector3(8.8, 6.8, 16.6), target: new THREE.Vector3(0.7, 1.0, 0.2) },
    minDistance: 1.2,
    maxDistance: 70,
    near: 0.1,
    far: 2600,
    homePadding: 0.66,
    declutter: true,
    update(s, dt, view) {
      const now = partsNow(registry);
      const d = dt * view.slowMo;
      const p = params();
      lightHold = nextHold(lightHold, dt, p);
      const shown = shownSun(s.sunAlt, s.sunAz, lightHold);
      sky.update(shown.alt, shown.az);
      const scenery = !now.isolated;
      setting.visible = scenery;
      // the kit's ghost and wire have no alpha for a leaf card: thousands of them stacked into blue clouds in the sky (QA M4). They show only solid; the wood, the planks and the soil keep the ghost
      for (const f of foliage) f.mesh.visible = registry.get(f.id)!.display === 'solid';
      padShadow.visible = scenery;
      palletShadow.visible = scenery;
      buttShadow.visible = scenery;
      caddyRing.visible = scenery;
      // what the feed pushes out, per feed: the model's own volume
      const litres = (p.feedKg * (1 + p.waterPerKg)) / 2;
      machine.update(s, d, { addedWeight: p.addedWeight, live: scenery, effluentLitres: litres });
      // the hose flexes with the bell; it stays on the tap and on the stake
      plantFrame.updateWorldMatrix(true, true);
      machine.bellPoseGroup.updateWorldMatrix(true, true);
      machine.tapOutlet.getWorldPosition(tapNow);
      if (tapNow.distanceToSquared(lastTap) > 1e-6) {
        lastTap.copy(tapNow);
        hoseCurve(tapNow, tapDirWorld, stake, V(0, 1, 0), 0.45, 0.02, HOSE_N, curve);
        rewriteTube(flex.geometry, curve, HOSE.r, 10);
        for (let i = 0; i < curve.length; i++) gasPts[i].copy(curve[i]);
        flows.setPoints(gasPath, gasPts);
      }
      const showFlows = view.schematic && !now.hidden;
      flows.object.visible = showFlows;
      if (showFlows) {
        const k = view.slowMo;
        flows.set(scrapPath, 0.5 * k);
        flows.set(gasPath, s.flameOn ? 0.9 * k : 0.12 * k, s.flameOn || s.bellRiseShare > 0 ? 1 : 0);
        flows.set(effPath, 0.5 * k);
        flows.step(dt);
      }
    },
  };
  return mod;
}

function plank(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getY(i) + p.getZ(i)) * 2.5, p.getX(i) * 0.8);
  return g;
}
function plankZ(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getY(i) + p.getX(i)) * 2.5, p.getZ(i) * 0.8);
  return g;
}

/**
 * The trunk's bark at height `y` near (x, z), measured on the wood that is drawn, so that a cord tied there sits on it: rays from all round onto the few triangles of the trunk at that height (the whole tree's
 * wood is thousands), its outline, its centre and mean radius, and the bark towards any direction.
 */
function barkAround(tree: THREE.Object3D, x: number, y: number, z: number): Tie {
  const wood = tree.getObjectByName('mango-wood') as THREE.Mesh;
  tree.updateWorldMatrix(true, true);
  const pos = wood.geometry.attributes.position;
  const index = wood.geometry.index;
  const n = index ? index.count : pos.count;
  const at = (k: number) =>
    new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(k) : k).applyMatrix4(wood.matrixWorld);
  const keep: number[] = [];
  for (let k = 0; k < n; k += 3) {
    const t = [at(k), at(k + 1), at(k + 2)];
    if (t.every((p) => Math.abs(p.y - y) < 0.3 && Math.hypot(p.x - x, p.z - z) < 0.8))
      for (const p of t) keep.push(p.x, p.y, p.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
  const trunk = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster();
  // from a point on the axis, inwards along `d`: the bark there
  const cast = (from: THREE.Vector3, d: THREE.Vector3): THREE.Vector3 => {
    const dir = d.clone().setY(0).normalize();
    ray.set(from.clone().addScaledVector(dir, 1.5), dir.clone().negate());
    const hit = ray.intersectObject(trunk, false)[0];
    return hit ? hit.point.clone() : from.clone().addScaledVector(dir, 0.25);
  };
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ring.push(cast(new THREE.Vector3(x, y, z), new THREE.Vector3(Math.cos(a), 0, Math.sin(a))));
  }
  const centre = ring
    .reduce((s, p) => s.add(p), new THREE.Vector3())
    .divideScalar(ring.length)
    .setY(y);
  const r = ring.reduce((s, p) => s + Math.hypot(p.x - centre.x, p.z - centre.z), 0) / ring.length;
  return { centre, r, ring, toward: (d) => cast(centre, d) };
}

/** A polyline made smooth by a Catmull-Rom through its points, exact at its ends. */
function smoothPath(points: THREE.Vector3[], per: number): THREE.Vector3[] {
  const c = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return c.getPoints((points.length - 1) * per);
}
