import * as THREE from 'three';
import {
  applyWear,
  contactRing,
  contactShadow,
  glass,
  group,
  patchMaterial,
  PartRegistry,
} from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { BioParams, BioState } from '../../sim/types';
import { BASE_Y, BUCKET, HOSE, LINE, PAD } from '../dims';
import { FlowDots } from '../flows';
import { buildMachine, type Machine } from '../machine/machine';
import {
  box,
  boxUV,
  cylX,
  cylY,
  cylZ,
  hex,
  hoseCurve,
  lump,
  mergeAll,
  pipeSolid,
  revolveY,
  rewriteTube,
  rod,
  rounded,
  tubeThrough,
  V,
} from '../machine/shapes';
import { concrete, plaster, timber } from '../machine/textures';
import { dynamic, mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, viewFrom, workshopScene, type HotspotDef } from '../world';

// The `gas-line` world, laid out left to right in the order things flow, at about their true length: on the far left the scraps start, minced and diluted; the machine, the same as everywhere, turned so that its tap faces the
// line; the hose that flexes with the bell, down to its low point, its trap; up to a board with the relief, the filter, the arrester, the gauge; through the wall of the kitchen; the valve, the burner, its air, the flame, the pot, the
// vent. The measured plant had a tap, a hose and a stove, and the parts it did not have are said to come from elsewhere in their sheets. No section here: there is nothing inside a line to teach. Every size here is an estimate.

export const LINE_PARTS = [
  'mincer',
  'dilution-bucket',
  'bell-hose',
  'condensate-trap',
  'hydraulic-relief',
  'h2s-filter',
  'flame-arrester',
  'pressure-gauge',
  'wall-sleeve',
  'kitchen-valve',
  'biogas-burner',
  'primary-air-sleeve',
  'blue-flame',
  'pot-stand',
  'cooking-pot',
  'vent-opening',
  'gas-detector',
] as const;
export type LinePart = (typeof LINE_PARTS)[number];

export const EXPLODE: Record<LinePart, [number, number, number]> = {
  mincer: [0, 0.42, 0],
  'dilution-bucket': [-0.1, 0, 0.5],
  'bell-hose': [0, 0, 0],
  'condensate-trap': [0, 0.05, 0.42],
  'hydraulic-relief': [0, -0.04, 0.5],
  'h2s-filter': [0, 0.12, 0.5],
  'flame-arrester': [0, 0.1, 0.46],
  'pressure-gauge': [0, 0.14, 0.5],
  'wall-sleeve': [-0.08, 0.12, 0.42],
  'kitchen-valve': [0, 0.14, 0.38],
  'biogas-burner': [0, 0, 0.34],
  'primary-air-sleeve': [-0.22, 0, 0.34],
  'blue-flame': [0, 0.12, 0.34],
  'pot-stand': [0, 0.36, 0],
  'cooking-pot': [0, 0.68, 0],
  'vent-opening': [0, 0, 0.34],
  'gas-detector': [0, 0, 0.34],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'bell-hose', ...partName('bell-hose') },
  { id: 'condensate-trap', ...partName('condensate-trap') },
  { id: 'h2s-filter', ...partName('h2s-filter') },
  { id: 'biogas-burner', ...partName('biogas-burner') },
  { id: 'mincer', ...partName('mincer') },
  { id: 'pressure-gauge', ...partName('pressure-gauge'), minor: true },
  { id: 'hydraulic-relief', ...partName('hydraulic-relief'), minor: true },
  { id: 'flame-arrester', ...partName('flame-arrester'), minor: true },
  { id: 'wall-sleeve', ...partName('wall-sleeve'), minor: true },
  { id: 'kitchen-valve', ...partName('kitchen-valve'), minor: true },
  { id: 'primary-air-sleeve', ...partName('primary-air-sleeve'), minor: true },
  { id: 'blue-flame', ...partName('blue-flame'), minor: true },
  { id: 'pot-stand', ...partName('pot-stand'), minor: true },
  { id: 'cooking-pot', ...partName('cooking-pot'), minor: true },
  { id: 'vent-opening', ...partName('vent-opening'), minor: true },
  { id: 'gas-detector', ...partName('gas-detector'), minor: true },
  { id: 'dilution-bucket', ...partName('dilution-bucket'), minor: true },
];

const FRAMING: Partial<Record<LinePart, PartFraming>> = {
  'bell-hose': { frame: new THREE.Box3(V(-3.1, 0.2, -0.35), V(-1.4, 2.2, 0.2)), viewDir: viewFrom(10, 10) },
  'condensate-trap': { viewDir: viewFrom(14, 12) },
  'hydraulic-relief': { viewDir: viewFrom(6, 8) },
  'h2s-filter': { viewDir: viewFrom(6, 6) },
  'flame-arrester': { viewDir: viewFrom(6, 4) },
  'pressure-gauge': { viewDir: viewFrom(4, 2) },
  'wall-sleeve': { viewDir: viewFrom(10, -20) },
  'kitchen-valve': { viewDir: viewFrom(10, 34) },
  'biogas-burner': { viewDir: viewFrom(24, 16) },
  'primary-air-sleeve': { viewDir: viewFrom(22, 28) },
  'blue-flame': { viewDir: viewFrom(8, 10) },
  'pot-stand': { viewDir: viewFrom(16, 14) },
  'cooking-pot': { viewDir: viewFrom(18, 12) },
  'vent-opening': { viewDir: viewFrom(0, 8) },
  'gas-detector': { viewDir: viewFrom(0, 8) },
  mincer: { viewDir: viewFrom(20, 22) },
  'dilution-bucket': { viewDir: viewFrom(26, 10) },
};

export interface GasLineScene extends SceneModule<BioState> {
  machine: Machine;
  parts: Record<LinePart, THREE.Group>;
  needle: THREE.Object3D;
  flameMesh: THREE.Mesh;
  flows: FlowDots;
  /** Pairs of world points that must meet, each named: the line's joints. */
  joints: { name: string; a: THREE.Vector3; b: THREE.Vector3 }[];
  /** The whole line, tap to burner, m: K7's 5 m. */
  lineLength: () => number;
  hoseUp: THREE.Mesh;
}

const HOSE_N = 34;

export function createGasLineScene(params: () => Pick<BioParams, 'addedWeight' | 'trap'>): GasLineScene {
  const scene = workshopScene({
    name: 'gas-line',
    key: [-2.4, 11, 7.5],
    target: [-0.5, 1, 0],
    shadowHalf: 8.5,
    shadowFar: 28,
    exposure: 1.04,
  });
  scene.add(paperFloor(20, 8));

  const parts = Object.fromEntries(
    LINE_PARTS.map((id) => {
      const g = group(id);
      scene.add(g);
      return [id, g];
    }),
  ) as Record<LinePart, THREE.Group>;
  const put = (parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---- the machine: the same function, turned to face the line
  const machine = buildMachine();
  const look = machine.look;
  const plant = new THREE.Group();
  plant.name = 'plant';
  plant.position.set(LINE.plantX, PAD.h + BASE_Y, 0);
  plant.rotation.y = Math.PI;
  scene.add(plant);
  plant.add(machine.root);
  machine.root.add(machine.bucket.root, machine.bucket.stream);
  const padMaps = concrete(61, [166, 160, 148]);
  const padMat = new THREE.MeshStandardMaterial({
    map: padMaps.map,
    bumpMap: padMaps.bump,
    bumpScale: 0.8,
    roughness: 0.94,
    name: 'pad',
  });
  const pad = put(
    scene,
    boxUV(LINE.plantX - PAD.halfX, LINE.plantX + PAD.halfX, 0, PAD.h, -PAD.halfZ, PAD.halfZ, 1.4),
    padMat,
  );
  pad.name = 'pad';
  const padShadow = contactShadow(PAD.halfX * 2, PAD.halfZ * 2, 0.32, 0.4);
  padShadow.position.set(LINE.plantX, 0.002, 0);
  scene.add(padShadow);
  const palletShadow = contactShadow(1.2, 1.0, 0.1, 0.38);
  palletShadow.position.set(LINE.plantX, PAD.h + 0.0015, 0);
  scene.add(palletShadow);

  // ---- the materials of the line
  const copper = new THREE.MeshStandardMaterial({
    color: 0xb4744a,
    roughness: 0.46,
    metalness: 0.75,
    name: 'copper-pipe',
  });
  const brass = look.brass;
  const steel = look.steel;
  const zinc = look.zinc;
  const rubber = look.rubber;
  const black = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.55, name: 'black-paint' });
  const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.82, metalness: 0.45, name: 'cast-iron' });
  const enamel = new THREE.MeshStandardMaterial({ color: 0xd9d6cc, roughness: 0.36, metalness: 0.1, name: 'enamel' });
  const glassMat = glass(0.26);
  const acrylic = new THREE.MeshPhysicalMaterial({
    color: 0xdfeaf0,
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
    metalness: 0,
    envMapIntensity: 1.5,
    depthWrite: false,
    name: 'clear-plastic',
  });
  const water = new THREE.MeshStandardMaterial({
    color: 0x6fa4b8,
    transparent: true,
    opacity: 0.72,
    roughness: 0.14,
    depthWrite: false,
    name: 'water',
  });
  const wood = new THREE.MeshStandardMaterial({ map: timber(71, [150, 128, 104]), roughness: 0.9, name: 'bench-wood' });
  wood.userData.noShare = true;

  // ---- what carries the line outside: a board on two posts. Scenery: it goes when a part is isolated
  const fixtures = group('fixtures');
  scene.add(fixtures);
  const bz = LINE.boardZ;
  const by = LINE.y;
  for (const x of [LINE.boardX0 + 0.1, LINE.boardX1 - 0.1]) {
    put(fixtures, boxTimber(x - 0.04, x + 0.04, 0, by + 0.2, bz - 0.05, bz + 0.03), wood);
  }
  put(fixtures, boxTimber(LINE.boardX0, LINE.boardX1, by - 0.2, by + 0.14, bz + 0.03, bz + 0.052), wood);
  const postShadow = contactShadow(LINE.boardX1 - LINE.boardX0, 0.12, 0.1, 0.28);
  postShadow.position.set((LINE.boardX0 + LINE.boardX1) / 2, 0.0015, bz);
  fixtures.add(postShadow);
  const pz = bz + 0.052 + 0.03; // the axis of the pipes, standing off the board

  // the pipes' clips, on the board
  const clip = (parent: THREE.Object3D, x: number) => {
    put(parent, box(x - 0.014, x + 0.014, by - 0.026, by + 0.026, bz + 0.052, bz + 0.058), zinc);
    put(parent, pipeSolid([V(x - 0.011, by, pz), V(x + 0.011, by, pz)], 0.0155, 0.0115, 12), zinc);
    put(parent, box(x - 0.008, x + 0.008, by - 0.014, by + 0.014, bz + 0.056, pz - 0.012), zinc);
  };

  // ---- the kitchen: the wall the line goes through, the back wall with its vent, the floor, a table. No roof: this is how we look in
  const wx = LINE.wallX;
  const wt = LINE.wallT;
  const plasterMaps = plaster(73, [226, 216, 196]);
  const wallMat = new THREE.MeshStandardMaterial({
    map: plasterMaps.map,
    bumpMap: plasterMaps.bump,
    bumpScale: 0.5,
    roughness: 0.94,
    name: 'wall',
  });
  const floorMaps = concrete(74, [158, 146, 130]);
  const roomFloorMat = new THREE.MeshStandardMaterial({ map: floorMaps.map, roughness: 0.9, name: 'room-floor' });
  const zb = -LINE.roomD / 2;
  const zf = LINE.roomD / 2;
  const xr = wx + wt + LINE.roomW;
  const room = group('room');
  fixtures.add(room);
  put(room, boxUV(wx, wx + wt, 0, LINE.roomH, zb, zf, 1.1), wallMat);
  put(room, boxUV(wx + wt, xr, 0, LINE.roomH, zb - wt, zb, 1.1), wallMat);
  put(room, boxUV(wx, xr, 0, 0.05, zb, zf, 1.4), roomFloorMat);
  const roomShadow = contactShadow(xr - wx, zf - zb + wt, 0.26, 0.28);
  roomShadow.position.set((wx + xr) / 2, 0.0015, (zb - wt + zf) / 2);
  fixtures.add(roomShadow);
  // the table
  const tx = LINE.burnerX;
  const tz = LINE.burnerZ;
  const th = LINE.tableH + 0.05;
  const tw = LINE.tableW / 2;
  const td = LINE.tableD / 2;
  put(room, boxTimber(tx - tw, tx + tw, th - 0.034, th, tz - td, tz + td), wood);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const lx = tx + sx * (tw - 0.05);
    const lz = tz + sz * (td - 0.05);
    put(room, boxTimber(lx - 0.025, lx + 0.025, 0.05, th - 0.034, lz - 0.025, lz + 0.025), wood);
  }
  put(room, boxTimber(tx - tw + 0.03, tx + tw - 0.03, th - 0.09, th - 0.034, tz - td + 0.04, tz - td + 0.06), wood);
  put(room, boxTimber(tx - tw + 0.03, tx + tw - 0.03, th - 0.09, th - 0.034, tz + td - 0.06, tz + td - 0.04), wood);

  // ---- the hose: from the tap, flexing with the bell, down to the low point, by the part's own two pieces
  const trapX = LINE.trapX;
  const trapY = LINE.trapY;
  const inlet = V(trapX - 0.05, trapY, bz);
  const inDir = V(0, 1, 0);
  const tapWorld = new THREE.Vector3();
  const curve: THREE.Vector3[] = [];
  const updatePlant = () => {
    plant.updateWorldMatrix(true, true);
    return machine.tapOutlet.getWorldPosition(tapWorld);
  };
  // the tap's outlet points along -X in the machine's frame, +X here
  const tapDir = V(1, 0, 0);
  hoseCurve(updatePlant(), tapDir, inlet, inDir, 0.5, 0.04, HOSE_N, curve);
  const bellHose = put(parts['bell-hose'], tubeThrough(curve, HOSE.r, 10), look.hose);
  bellHose.name = 'hose-flex';
  bellHose.frustumCulled = false;
  dynamic(bellHose);
  const hoseOut = V(trapX + 0.05, trapY, bz);
  const lineIn = V(LINE.boardX0 + 0.02, by, pz);
  const upPath = hoseCurve(hoseOut, V(0, 1, 0), lineIn, V(-1, 0, 0), 0.3, 0.02, 24, []);
  const hoseUp = put(parts['bell-hose'], tubeThrough(upPath, HOSE.r, 10), look.hose);
  hoseUp.name = 'hose-up';
  // pegs and a clamp on the barb at the board
  put(
    parts['bell-hose'],
    pipeSolid([V(lineIn.x - 0.022, by, pz), V(lineIn.x + 0.004, by, pz)], HOSE.r + 0.0035, HOSE.r - 0.0005, 12),
    zinc,
  );

  // ---- the condensate trap, at the low point: a clear jar on a block, its lid with the two stubs, water at the bottom, a drain tap. The hose comes down, and goes up
  const trap = parts['condensate-trap'];
  const jarR = 0.05;
  const jarY0 = 0.06;
  const jarH = 0.135;
  const trapBody = group('trap-body');
  trap.add(trapBody);
  put(
    trapBody,
    box(trapX - 0.11, trapX + 0.11, 0, jarY0, bz - 0.11, bz + 0.11),
    iron === undefined
      ? black
      : new THREE.MeshStandardMaterial({ map: concrete(75, [150, 148, 140]).map, roughness: 0.96, name: 'block' }),
  );
  const jar = new THREE.Mesh(
    revolveY(
      [
        [0, 0],
        [jarR, 0],
        [jarR, jarH],
        [jarR - 0.003, jarH],
        [jarR - 0.003, 0.003],
        [0, 0.003],
      ],
      { seg: 28 },
    ),
    acrylic,
  );
  jar.position.set(trapX, jarY0, bz);
  jar.name = 'trap-jar';
  jar.renderOrder = 4;
  jar.userData.keep = true;
  trapBody.add(jar);
  put(trapBody, cylY(jarR + 0.006, jarY0 + jarH - 0.002, jarY0 + jarH + 0.016, trapX, bz, 24), black);
  put(trapBody, cylY(0.0085, jarY0 + jarH + 0.016, trapY + 0.012, trapX - 0.05 + 0.0, bz, 10), brass);
  put(trapBody, cylY(0.0085, jarY0 + jarH + 0.016, trapY + 0.012, trapX + 0.05, bz, 10), brass);
  // its dip: the inlet goes in, the outlet leaves from above the water
  const jarIn = new THREE.Mesh(cylY(0.006, jarY0 + 0.055, jarY0 + jarH, trapX - 0.02, bz, 8), brass);
  jarIn.castShadow = true;
  trapBody.add(jarIn);
  const trapWater = new THREE.Mesh(cylY(jarR - 0.004, 0, 1, 0, 0, 24), water);
  trapWater.position.set(trapX, jarY0 + 0.003, bz);
  trapWater.name = 'trap-water';
  trapWater.renderOrder = 3;
  trapWater.userData.keep = true;
  trapWater.castShadow = false;
  trapBody.add(trapWater);
  // the drain tap, low on the side towards us
  put(trapBody, cylZ(0.008, bz + jarR - 0.002, bz + jarR + 0.03, trapX, jarY0 + 0.022, 10), brass);
  put(trapBody, cylY(0.0035, jarY0 + 0.022, jarY0 + 0.05, trapX, bz + jarR + 0.018, 6), brass);
  put(
    trapBody,
    rod(V(trapX - 0.03, jarY0 + 0.05, bz + jarR + 0.018), V(trapX + 0.03, jarY0 + 0.05, bz + jarR + 0.018), 0.0045, 6),
    look.redPaint,
  );
  const trapShadow = contactShadow(0.22, 0.22, 0.05, 0.3);
  trapShadow.position.set(trapX, 0.0015, bz);
  fixtures.add(trapShadow);
  // what stands in the hose when there is no trap: the plug of water at the low point, standing as high on both sides (physics §1.5)
  const plugN = 16;
  const plugPath: THREE.Vector3[] = [];
  for (let i = 0; i < plugN; i++) plugPath.push(V(trapX - 0.2 + (0.4 * i) / (plugN - 1), trapY, bz));
  const plugMat = new THREE.MeshStandardMaterial({ color: 0x4f90b4, roughness: 0.2, name: 'hose-water' });
  plugMat.userData.noShare = true;
  const plug = new THREE.Mesh(tubeThrough(plugPath, HOSE.r + 0.0012, 10), plugMat);
  plug.name = 'hose-plug';
  plug.frustumCulled = false;
  plug.visible = false;
  plug.userData.keep = true;
  trap.add(plug);

  // ---- the hydraulic relief: a clear bottle with water, a dip tube down from the line, a vent up. The level in the dip tube follows the pressure, a centimetre per millibar: the model's. Past its depth, gas would bubble out through it
  const rx = LINE.reliefX;
  const relief = parts['hydraulic-relief'];
  const bottleBase = by - 0.46;
  const bottleH = 0.27;
  const bottleR = 0.06;
  const depth = 0.08; // how far the dip goes under, estimate: a relief well above the plant's 4 mbar
  const waterTop = bottleBase + 0.15;
  const bottle = new THREE.Mesh(
    revolveY(
      [
        [0, 0],
        [bottleR, 0],
        [bottleR, bottleH - 0.05],
        [0.026, bottleH - 0.012],
        [0.026, bottleH],
        [0.022, bottleH],
        [0.022, bottleH - 0.014],
        [bottleR - 0.003, bottleH - 0.052],
        [bottleR - 0.003, 0.003],
        [0, 0.003],
      ],
      { seg: 28 },
    ),
    acrylic,
  );
  bottle.position.set(rx, bottleBase, pz);
  bottle.name = 'relief-bottle';
  bottle.renderOrder = 4;
  bottle.userData.keep = true;
  relief.add(bottle);
  const reliefWater = new THREE.Mesh(cylY(bottleR - 0.004, bottleBase + 0.003, waterTop, rx, pz, 24), water);
  reliefWater.name = 'relief-water';
  reliefWater.renderOrder = 3;
  reliefWater.userData.keep = true;
  reliefWater.castShadow = false;
  relief.add(reliefWater);
  put(relief, cylY(0.03, bottleBase + bottleH - 0.002, bottleBase + bottleH + 0.018, rx, pz, 16), black);
  put(
    relief,
    pipeSolid([V(rx, by - 0.012, pz), V(rx, waterTop - depth, pz)], 0.0075, 0.0055, 10),
    new THREE.MeshStandardMaterial({ color: 0xb8c2c4, roughness: 0.3, name: 'dip-tube' }),
  );
  const dipWater = new THREE.Mesh(cylY(0.0052, 0, 1, 0, 0, 8), water);
  dipWater.position.set(rx, waterTop - depth, pz);
  dipWater.name = 'dip-water';
  dipWater.userData.keep = true;
  dipWater.renderOrder = 3;
  relief.add(dipWater);
  // the vent up, and the tee on the line
  put(
    relief,
    pipeSolid([V(rx + 0.012, bottleBase + bottleH + 0.016, pz), V(rx + 0.012, by + 0.11, pz)], 0.006, 0.0042, 8),
    copper,
  );
  put(relief, cylX(0.0185, rx - 0.028, rx + 0.028, by, pz, 12), brass);
  put(relief, cylY(0.015, by - 0.03, by + 0.002, rx, pz, 12), brass);
  put(relief, rod(V(rx, by - 0.012, pz), V(rx, by - 0.05, pz), 0.009, 10), brass);
  // the bottle's cradle on the board
  put(relief, box(rx - 0.075, rx + 0.075, bottleBase - 0.012, bottleBase, bz + 0.052, pz + 0.07), zinc);
  put(relief, box(rx - 0.012, rx + 0.012, bottleBase - 0.02, bottleBase + 0.09, bz + 0.052, bz + 0.058), zinc);
  put(
    relief,
    pipeSolid([V(rx, bottleBase + 0.09, pz), V(rx, bottleBase + 0.1, pz)], bottleR + 0.003, bottleR + 0.0003, 22),
    zinc,
  );
  put(relief, box(rx - 0.008, rx + 0.008, bottleBase + 0.09, bottleBase + 0.1, bz + 0.055, pz - bottleR), zinc);

  // ---- the H₂S filter: a clear can of iron wool between two threaded ends, rust through it. Tried and unproven at the measured plant
  const fx = LINE.filterX;
  const filter = parts['h2s-filter'];
  const fr = 0.062;
  const fh = 0.24;
  const canY0 = by - fh / 2;
  const can = new THREE.Mesh(cylY(fr, canY0, canY0 + fh, fx, pz + 0.018, 24), acrylic);
  can.name = 'filter-can';
  can.renderOrder = 4;
  can.userData.keep = true;
  filter.add(can);
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x96552c, roughness: 0.95, name: 'iron-wool' });
  const R = rngLocal(19);
  const wool: THREE.BufferGeometry[] = [];
  // wool: a dark core, and over it a tangle of thin strands
  wool.push(cylY(fr - 0.016, canY0 + 0.01, canY0 + fh - 0.01, fx, pz + 0.018, 16));
  for (let s = 0; s < 70; s++) {
    const pts: THREE.Vector3[] = [];
    const a0 = R() * 6.28;
    let y0 = canY0 + 0.012 + R() * (fh - 0.024);
    let ang = a0;
    for (let k = 0; k < 7; k++) {
      const rad = fr - 0.012 + R() * 0.008;
      pts.push(V(fx + Math.cos(ang) * rad, y0, pz + 0.018 + Math.sin(ang) * rad));
      ang += (R() - 0.5) * 1.2;
      y0 = Math.max(canY0 + 0.008, Math.min(canY0 + fh - 0.008, y0 + (R() - 0.5) * 0.05));
    }
    wool.push(tubeThrough(pts, 0.0016, 4));
  }
  put(filter, mergeAll(wool), rustMat);
  for (const y of [canY0 - 0.012, canY0 + fh]) put(filter, cylY(fr + 0.006, y, y + 0.012, fx, pz + 0.018, 24), black);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const rx2 = fx + Math.cos(a) * (fr + 0.0005);
    const rz2 = pz + 0.018 + Math.sin(a) * (fr + 0.0005);
    put(filter, cylY(0.0028, canY0 - 0.016, canY0 + fh + 0.016, rx2, rz2, 6), steel);
  }
  put(filter, cylX(0.009, fx - 0.09, fx - fr + 0.002, by, pz, 10), brass);
  put(filter, cylX(0.009, fx + fr - 0.002, fx + 0.09, by, pz, 10), brass);
  put(filter, hex(V(fx - fr - 0.006, by, pz), V(fx - fr + 0.008, by, pz), 0.015), brass);
  put(filter, hex(V(fx + fr - 0.008, by, pz), V(fx + fr + 0.006, by, pz), 0.015), brass);
  put(filter, box(fx - fr - 0.012, fx + fr + 0.012, canY0 - 0.03, canY0 - 0.018, bz + 0.052, pz + fr + 0.03), zinc);

  // ---- the flame arrester: a clear barrel of copper wool, not packed, threaded brass at both ends
  const ax = LINE.arresterX;
  const arrester = parts['flame-arrester'];
  const barrelR = 0.028;
  const barrelL = 0.13;
  const barrel = new THREE.Mesh(cylX(barrelR, ax - barrelL / 2, ax + barrelL / 2, by, pz, 18), acrylic);
  barrel.name = 'arrester-barrel';
  barrel.renderOrder = 4;
  barrel.userData.keep = true;
  arrester.add(barrel);
  const woolCopper: THREE.BufferGeometry[] = [];
  const R2 = rngLocal(23);
  for (let s = 0; s < 22; s++) {
    const pts: THREE.Vector3[] = [];
    let p = V(ax + (R2() - 0.5) * 0.09, by + (R2() - 0.5) * 0.03, pz + (R2() - 0.5) * 0.03);
    for (let k = 0; k < 6; k++) {
      pts.push(p);
      p = p.clone().add(V((R2() - 0.5) * 0.03, (R2() - 0.5) * 0.024, (R2() - 0.5) * 0.024));
      const dy = p.y - by;
      const dz = p.z - pz;
      const L = Math.hypot(dy, dz);
      if (L > barrelR - 0.005) {
        p.y = by + (dy / L) * (barrelR - 0.005);
        p.z = pz + (dz / L) * (barrelR - 0.005);
      }
      p.x = Math.min(ax + barrelL / 2 - 0.006, Math.max(ax - barrelL / 2 + 0.006, p.x));
    }
    woolCopper.push(tubeThrough(pts, 0.0011, 4));
  }
  put(arrester, mergeAll(woolCopper), copper);
  for (const sx of [-1, 1]) {
    put(
      arrester,
      hex(V(ax + sx * (barrelL / 2 - 0.008), by, pz), V(ax + sx * (barrelL / 2 + 0.012), by, pz), barrelR + 0.006),
      brass,
    );
    put(
      arrester,
      cylX(
        0.009,
        Math.min(ax + sx * (barrelL / 2 + 0.012), ax + sx * 0.12),
        Math.max(ax + sx * (barrelL / 2 + 0.012), ax + sx * 0.12),
        by,
        pz,
        10,
      ),
      brass,
    );
  }

  // ---- the pressure gauge: a dial on a tee, 0 to 60 mbar (K7). Its needle reads what the bell holds: barely off zero, which is itself worth seeing
  const gx = LINE.gaugeX;
  const gauge = parts['pressure-gauge'];
  const dialY = by + 0.09;
  const dialR = 0.058;
  const dialZ = pz + 0.022;
  put(gauge, cylX(0.0145, gx - 0.024, gx + 0.024, by, pz, 12), brass);
  put(gauge, cylY(0.0075, by, dialY - dialR + 0.005, gx, pz, 10), brass);
  put(gauge, rod(V(gx, dialY - 0.012, pz), V(gx, dialY - 0.012, dialZ - 0.012), 0.0075, 8), brass);
  put(gauge, rod(V(gx, dialY, dialZ - 0.014), V(gx, dialY, dialZ + 0.012), dialR, 34), black);
  const faceG = new THREE.CircleGeometry(dialR - 0.004, 40);
  faceG.translate(gx, dialY, dialZ + 0.0125);
  put(gauge, faceG, new THREE.MeshStandardMaterial({ color: 0xf0ece0, roughness: 0.5, name: 'dial' }));
  const tickMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, name: 'ticks' });
  const dialAngle = (mbar: number) => (Math.PI * 5) / 4 - (mbar / 60) * ((Math.PI * 3) / 2);
  const ticks: THREE.BufferGeometry[] = [];
  for (let m = 0; m <= 60; m += 5) {
    const a = dialAngle(m);
    const major = m % 10 === 0;
    const R1 = dialR - 0.009;
    const R0a = R1 - (major ? 0.01 : 0.005);
    const c = V(gx + Math.cos(a) * ((R0a + R1) / 2), dialY + Math.sin(a) * ((R0a + R1) / 2), dialZ + 0.0132);
    const g = new THREE.BoxGeometry(R1 - R0a, major ? 0.0016 : 0.001, 0.0003);
    g.rotateZ(a);
    g.translate(c.x, c.y, c.z);
    ticks.push(g);
  }
  put(gauge, mergeAll(ticks), tickMat);
  const needle = new THREE.Group();
  needle.name = 'needle';
  needle.position.set(gx, dialY, dialZ + 0.0145);
  dynamic(needle);
  const needleG = new THREE.ConeGeometry(0.0022, dialR - 0.012, 8);
  needleG.rotateZ(-Math.PI / 2);
  needleG.translate((dialR - 0.012) / 2, 0, 0);
  const needleM = new THREE.Mesh(needleG, look.redPaint);
  needleM.castShadow = false;
  needle.add(needleM);
  needle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 10).rotateX(Math.PI / 2), black));
  gauge.add(needle);
  const dialGlass = new THREE.Mesh(
    new THREE.CircleGeometry(dialR - 0.002, 36).translate(gx, dialY, dialZ + 0.0165),
    glassMat,
  );
  dialGlass.name = 'dial-glass';
  dialGlass.userData.keep = true;
  dialGlass.renderOrder = 4;
  dialGlass.castShadow = false;
  gauge.add(dialGlass);

  // ---- the pipes between the fittings: copper, each stretch in the part it leads to. Their ends are the joints
  const joints: { name: string; a: THREE.Vector3; b: THREE.Vector3 }[] = [];
  const stretch = (partId: LinePart, x0: number, x1: number, clips: number[], name: string) => {
    put(parts[partId], pipeSolid([V(x0, by, pz), V(x1, by, pz)], 0.0078, 0.0058, 10), copper);
    for (const c of clips) clip(parts[partId], c);
    joints.push({ name, a: V(x0, by, pz), b: V(x1, by, pz) });
  };
  stretch('hydraulic-relief', lineIn.x, rx - 0.024, [lineIn.x + 0.1], 'board to relief');
  stretch('h2s-filter', rx + 0.024, fx - 0.086, [(rx + fx) / 2], 'relief to filter');
  stretch('flame-arrester', fx + 0.086, ax - 0.118, [(fx + ax) / 2], 'filter to arrester');
  stretch('pressure-gauge', ax + 0.118, gx - 0.02, [(ax + gx) / 2], 'arrester to gauge');
  const sleeveFrom = gx + 0.02;
  const sleeveTo = wx + wt + 0.05;

  // ---- the wall sleeve: a steel tube through the wall, sealed both sides. The pipe passes through it
  const sleeve = parts['wall-sleeve'];
  put(sleeve, pipeSolid([V(sleeveFrom, by, pz), V(sleeveTo, by, pz)], 0.0078, 0.0058, 10), copper);
  const zPipe = pz;
  put(sleeve, pipeSolid([V(wx - 0.012, by, zPipe), V(wx + wt + 0.012, by, zPipe)], 0.024, 0.0079, 18), steel);
  put(sleeve, pipeSolid([V(wx - 0.02, by, zPipe), V(wx - 0.002, by, zPipe)], 0.038, 0.0079, 18), rubber);
  put(sleeve, pipeSolid([V(wx + wt + 0.002, by, zPipe), V(wx + wt + 0.02, by, zPipe)], 0.038, 0.0079, 18), rubber);
  clip(sleeve, (gx + wx) / 2);

  // ---- the kitchen valve: a ball valve on the wall's inside, its yellow lever along the pipe when open
  const vx = wx + wt + 0.09;
  const valve = parts['kitchen-valve'];
  put(valve, cylX(0.0185, vx - 0.03, vx + 0.03, by, zPipe, 16), brass);
  put(valve, hex(V(vx - 0.042, by, zPipe), V(vx - 0.026, by, zPipe), 0.017), brass);
  put(valve, hex(V(vx + 0.026, by, zPipe), V(vx + 0.042, by, zPipe), 0.017), brass);
  put(valve, cylY(0.005, by, by + 0.034, vx, zPipe, 8), brass);
  put(
    valve,
    rod(V(vx, by + 0.034, zPipe), V(vx + 0.085, by + 0.034, zPipe), 0.0065, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9a820, roughness: 0.5, name: 'lever' }),
  );
  // the pipe from it: along the wall, down to the table, across to the burner's jet
  const tableY = th;
  const jetAxisY = tableY + 0.048;
  const burnerIn = tx - 0.255;
  const pipeRoute = rounded(
    [
      V(vx + 0.04, by, zPipe),
      V(vx + 0.056, by, zPipe),
      V(vx + 0.056, jetAxisY, zPipe),
      V(burnerIn - 0.12, jetAxisY, zPipe),
      V(burnerIn - 0.12, jetAxisY, tz),
      V(burnerIn, jetAxisY, tz),
    ],
    0.03,
    6,
  );
  put(valve, pipeSolid(pipeRoute, 0.0078, 0.0058, 10), copper);
  // its clip to the wall
  put(valve, box(wx + wt, vx + 0.066, by - 0.25, by - 0.232, zPipe - 0.009, zPipe + 0.009), zinc);
  put(valve, box(wx + wt, wx + wt + 0.005, by - 0.272, by - 0.21, zPipe - 0.028, zPipe + 0.028), zinc);
  put(valve, pipeSolid([V(vx + 0.056, by - 0.25, zPipe), V(vx + 0.056, by - 0.232, zPipe)], 0.011, 0.0079, 10), zinc);
  joints.push({ name: 'sleeve to valve', a: V(sleeveTo, by, zPipe), b: V(vx - 0.042, by, zPipe) });
  joints.push({ name: 'valve to burner', a: pipeRoute[pipeRoute.length - 1], b: V(burnerIn, jetAxisY, tz) });

  // ---- the burner: a jet, a mixing tube under its air sleeve, a cast head with its ring of ports. On three feet on the table
  const burner = parts['biogas-burner'];
  const headTop = tableY + LINE.burnerH;
  const headR = LINE.burnerR;
  // jet and its nut
  put(burner, hex(V(burnerIn - 0.002, jetAxisY, tz), V(burnerIn + 0.02, jetAxisY, tz), 0.015), brass);
  put(burner, cylX(0.006, burnerIn + 0.02, burnerIn + 0.045, jetAxisY, tz, 10, 0.003), brass);
  // the mixing tube
  put(burner, pipeSolid([V(burnerIn + 0.03, jetAxisY, tz), V(tx - 0.03, jetAxisY, tz)], 0.0195, 0.0165, 16), iron);
  // the elbow up under the head
  put(burner, cylY(0.024, jetAxisY - 0.01, headTop - 0.04, tx, tz, 18), iron);
  put(burner, cylX(0.0205, tx - 0.04, tx, jetAxisY, tz, 16), iron);
  // the head
  const headG = revolveY(
    [
      [0, 0],
      [0.03, 0],
      [headR, 0.022],
      [headR, 0.03],
      [headR - 0.006, 0.03],
      [headR - 0.006, 0.036],
      [0, 0.036],
    ],
    { seg: 36 },
  );
  headG.translate(tx, headTop - 0.036, tz);
  put(burner, headG, iron);
  // the ports: dark nicks round the head
  const ports: THREE.BufferGeometry[] = [];
  const PORTS = 18;
  for (let i = 0; i < PORTS; i++) {
    const a = (i / PORTS) * Math.PI * 2;
    const g = new THREE.BoxGeometry(0.0034, 0.0052, 0.0016);
    g.rotateY(-a);
    g.translate(tx + Math.cos(a) * (headR - 0.0035), headTop - 0.0027, tz + Math.sin(a) * (headR - 0.0035));
    ports.push(g);
  }
  put(burner, mergeAll(ports), black);
  // three feet: from the tube to the table
  for (const [dx, dz] of [
    [-0.03, 0.06],
    [-0.03, -0.06],
    [-0.19, 0],
  ] as const) {
    const fxx = tx + dx;
    const fzz = tz + dz;
    put(
      burner,
      rod(V(fxx + (dx < -0.1 ? 0 : 0.02), jetAxisY - 0.016, tz), V(fxx, tableY + 0.0035, fzz), 0.0048, 8),
      iron,
    );
    put(burner, cylY(0.012, tableY - 0.0005, tableY + 0.004, fxx, fzz, 12), rubber);
  }

  // ---- the primary-air sleeve: a ring on the mixing tube, its windows over the holes, turned by hand
  const sleeveAir = parts['primary-air-sleeve'];
  const airX = burnerIn + 0.045;
  put(sleeveAir, pipeSolid([V(airX, jetAxisY, tz), V(airX + 0.05, jetAxisY, tz)], 0.0245, 0.0198, 22), steel);
  for (let i = 0; i < 2; i++) {
    const a = (i / 2) * Math.PI;
    const g = new THREE.BoxGeometry(0.026, 0.0065, 0.0012);
    g.translate(0, 0, 0.0252);
    g.rotateX(a + Math.PI / 4);
    g.translate(airX + 0.025, jetAxisY, tz);
    put(sleeveAir, g, black);
    const g2 = g.clone();
    g2.translate(-(airX + 0.025), -jetAxisY, -tz);
    g2.rotateX(Math.PI);
    g2.translate(airX + 0.025, jetAxisY, tz);
    put(sleeveAir, g2, black);
  }
  // its knurled grip: a stubby collar
  put(sleeveAir, pipeSolid([V(airX + 0.05, jetAxisY, tz), V(airX + 0.058, jetAxisY, tz)], 0.0275, 0.0198, 22), zinc);

  // ---- the flame: tongues round the ports, its height is `flameShare`; blue, hard to see in daylight, as S3 warns
  const flameG = flameGeometry(tx, tz, headR - 0.004, headTop, PORTS);
  const flameU = { uTime: { value: 0 }, uH: { value: 0 }, uLean: { value: 0 } };
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    name: 'flame',
    side: THREE.DoubleSide,
  });
  flameMat.userData.noShare = true;
  patchMaterial(flameMat, 'flame', (shader) => {
    Object.assign(shader.uniforms, flameU);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec3 aF;\nuniform float uTime; uniform float uH;\nvarying vec2 vF;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float flick = 0.86 + 0.14 * sin( uTime * 17.0 + aF.z * 6.28 ) * sin( uTime * 9.0 + aF.z * 12.0 );
         transformed.y = aF.x + ( transformed.y - aF.x ) * uH * flick;
         transformed.xz += ( transformed.xz - aF.yy * 0.0 ) * 0.0;
         vF = uv;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vF;\nuniform float uLean;')
      .replace(
        '#include <opaque_fragment>',
        `float across = 1.0 - abs( vF.x * 2.0 - 1.0 );
         float a = smoothstep( 0.0, 0.5, across ) * pow( 1.0 - vF.y, 0.8 ) * smoothstep( 0.0, 0.06, vF.y );
         vec3 inner = vec3( 0.42, 0.72, 1.0 );
         vec3 outer = vec3( 0.1, 0.24, 0.95 );
         vec3 tip = mix( outer, vec3( 0.95, 0.72, 0.28 ), uLean );
         outgoingLight = mix( mix( inner, outer, smoothstep( 0.0, 0.5, vF.y ) ), tip, smoothstep( 0.55, 1.0, vF.y ) ) * 1.5;
         diffuseColor.a = a * 0.82;
         #include <opaque_fragment>`,
      );
  });
  const flameMesh = new THREE.Mesh(flameG, flameMat);
  flameMesh.name = 'flame';
  flameMesh.castShadow = false;
  flameMesh.userData.noShadow = true;
  flameMesh.frustumCulled = false;
  flameMesh.renderOrder = 8;
  dynamic(flameMesh);
  parts['blue-flame'].add(flameMesh);
  parts['blue-flame'].add(
    extentOf(tx - headR - 0.012, tx + headR + 0.012, headTop, headTop + 0.045, tz - headR - 0.012, tz + headR + 0.012),
  );

  // ---- the pot stand: a ring on three legs, fingers in. Its feet on the table, its fingers under the pot
  const stand = parts['pot-stand'];
  const ringR = 0.115;
  const standTop = tableY + LINE.standH;
  const sTor = new THREE.TorusGeometry(ringR, 0.006, 8, 40);
  sTor.rotateX(Math.PI / 2);
  sTor.translate(tx, standTop - 0.012, tz);
  put(stand, sTor, iron);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    put(
      stand,
      rod(
        V(tx + c * ringR, standTop - 0.012, tz + s * ringR),
        V(tx + c * (ringR + 0.02), tableY, tz + s * (ringR + 0.02)),
        0.006,
        8,
      ),
      iron,
    );
    put(stand, cylY(0.012, tableY, tableY + 0.004, tx + c * (ringR + 0.02), tz + s * (ringR + 0.02), 10), rubber);
    // a finger, in from the ring, its top the pot's seat
    const fg = new THREE.BoxGeometry(ringR - 0.05, 0.012, 0.007);
    fg.translate(-(ringR - 0.05) / 2, 0, 0);
    fg.rotateY(-a);
    fg.translate(tx + c * ringR, standTop - 0.006, tz + s * ringR);
    put(stand, fg, iron);
  }

  // ---- the pot: a plain aluminium pan with its lid, on the fingers
  const pot = parts['cooking-pot'];
  const pR = LINE.potR;
  const pH = LINE.potH;
  const potG = revolveY(
    [
      [0, 0],
      [pR - 0.012, 0],
      [pR, 0.012],
      [pR, pH],
      [pR + 0.003, pH],
      [pR + 0.003, pH + 0.006],
      [pR - 0.003, pH + 0.006],
      [pR - 0.003, 0.012],
      [pR - 0.014, 0.003],
      [0, 0.003],
    ],
    { seg: 44 },
  );
  potG.translate(tx, standTop, tz);
  const alu = new THREE.MeshStandardMaterial({ color: 0xc2c4c4, roughness: 0.38, metalness: 0.82, name: 'pot' });
  put(pot, potG, alu);
  const lidG = revolveY(
    [
      [0, pH + 0.03],
      [0.04, pH + 0.024],
      [pR - 0.002, pH + 0.008],
      [pR - 0.002, pH + 0.003],
      [0, pH + 0.003],
    ],
    { seg: 40 },
  );
  lidG.translate(tx, standTop, tz);
  put(pot, lidG, alu);
  put(pot, cylY(0.016, standTop + pH + 0.029, standTop + pH + 0.05, tx, tz, 14), black);
  for (const sx of [-1, 1]) {
    const hx = tx + sx * (pR + 0.03);
    put(pot, rounded2Handle(tx + sx * (pR - 0.002), hx, standTop + pH - 0.02, tz), black);
  }

  // ---- the vent: a louvred opening high in the back wall, always open. A dark box in the wall, slats across it. The wall behind stays whole: it is seen against a dark
  const vent = parts['vent-opening'];
  const vcx = tx - 0.3;
  const vy = LINE.ventY;
  const vW = 0.42;
  const vH = 0.26;
  const zFace = zb;
  put(
    vent,
    box(vcx - vW / 2, vcx + vW / 2, vy - vH / 2, vy + vH / 2, zFace, zFace + 0.004),
    new THREE.MeshStandardMaterial({
      color: 0x8fb0c4,
      roughness: 0.3,
      emissive: 0x6d93aa,
      emissiveIntensity: 0.6,
      name: 'vent-sky',
    }),
  );
  for (const [x0, x1, y0, y1] of [
    [vcx - vW / 2 - 0.018, vcx + vW / 2 + 0.018, vy + vH / 2, vy + vH / 2 + 0.018],
    [vcx - vW / 2 - 0.018, vcx + vW / 2 + 0.018, vy - vH / 2 - 0.018, vy - vH / 2],
    [vcx - vW / 2 - 0.018, vcx - vW / 2, vy - vH / 2, vy + vH / 2],
    [vcx + vW / 2, vcx + vW / 2 + 0.018, vy - vH / 2, vy + vH / 2],
  ]) {
    put(
      vent,
      box(x0, x1, y0, y1, zFace, zFace + 0.028),
      new THREE.MeshStandardMaterial({ color: 0x9a9a92, roughness: 0.7, name: 'vent-frame' }),
    );
  }
  for (let i = 0; i < 6; i++) {
    const y = vy - vH / 2 + ((i + 0.5) / 6) * vH;
    const g = new THREE.BoxGeometry(vW, 0.003, 0.05);
    g.rotateX(-0.72);
    g.translate(vcx, y, zFace + 0.018);
    put(vent, g, new THREE.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.65, name: 'vent-slat' }));
  }

  // ---- the detector: a small white box near the ceiling, its lamp. It warns and does not protect
  const det = parts['gas-detector'];
  const dx = tx + 0.42;
  const dy = LINE.detectorY;
  put(
    det,
    box(dx - 0.055, dx + 0.055, dy - 0.04, dy + 0.04, zb, zb + 0.035),
    new THREE.MeshStandardMaterial({ color: 0xe8e5da, roughness: 0.55, name: 'detector' }),
  );
  for (let i = 0; i < 5; i++)
    put(det, box(dx - 0.04, dx + 0.02, dy + 0.024 - i * 0.012, dy + 0.028 - i * 0.012, zb + 0.035, zb + 0.0362), black);
  const lamp = new THREE.Mesh(
    cylZ(0.0065, zb + 0.035, zb + 0.039, dx + 0.036, dy + 0.012, 12),
    new THREE.MeshStandardMaterial({
      color: 0x48c060,
      emissive: 0x2fb04f,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      name: 'detector-lamp',
    }),
  );
  lamp.userData.noShare = true;
  det.add(lamp);

  // ---- the start of the circle: the bench and its mincer, the dilution bucket by the funnel
  const bx = LINE.plantX - 1.5;
  const bzz = 0.35;
  const benchTop = LINE.benchH;
  const bench = group('bench');
  fixtures.add(bench);
  put(bench, boxTimber(bx - 0.5, bx + 0.5, benchTop - 0.04, benchTop, bzz - 0.3, bzz + 0.3), wood);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const lx = bx + sx * 0.44;
    const lz = bzz + sz * 0.24;
    put(bench, boxTimber(lx - 0.03, lx + 0.03, 0, benchTop - 0.04, lz - 0.03, lz + 0.03), wood);
  }
  put(bench, boxTimber(bx - 0.42, bx + 0.42, 0.22, 0.25, bzz - 0.24, bzz + 0.24), wood);
  const benchShadow = contactShadow(1.0, 0.6, 0.1, 0.3);
  benchShadow.position.set(bx, 0.0015, bzz);
  fixtures.add(benchShadow);
  // on it, a board and a heap of chopped scraps waiting
  const scrapColours = [0xc98a3a, 0x8fa24a, 0xd8b868, 0xb2542e, 0xe2d6a8];
  const R3 = rngLocal(29);
  const scrapBits = scrapColours.map(() => [] as THREE.BufferGeometry[]);
  for (let i = 0; i < 46; i++) {
    const a = R3() * 6.28;
    const r = Math.sqrt(R3()) * 0.11;
    const g = lump(0.012 + R3() * 0.012, 0.5, R3, 0);
    g.scale(1.3, 0.6, 1);
    g.translate(
      bx + 0.24 + Math.cos(a) * r,
      benchTop + 0.02 + R3() * 0.03 * (1 - r / 0.11),
      bzz + 0.02 + Math.sin(a) * r,
    );
    scrapBits[i % scrapColours.length].push(g);
  }
  scrapBits.forEach((list, i) =>
    put(
      bench,
      mergeAll(list),
      new THREE.MeshStandardMaterial({ color: scrapColours[i], roughness: 0.8, name: `scrap-${i}` }),
    ),
  );
  put(
    bench,
    boxTimber(bx + 0.08, bx + 0.4, benchTop, benchTop + 0.016, bzz - 0.14, bzz + 0.18),
    new THREE.MeshStandardMaterial({ map: timber(77, [190, 158, 112]), roughness: 0.8, name: 'chopping-board' }),
  );

  // the mincer: a cast body, its hopper up, a barrel out, its plate of holes, a crank, a clamp under the bench's edge
  const mincer = parts.mincer;
  const mx = bx - 0.12;
  const mz = bzz + 0.3 - 0.03;
  const barrelY = benchTop + 0.11;
  put(mincer, cylZ(0.042, mz - 0.14, mz + 0.03, mx, barrelY, 22), enamel);
  put(
    mincer,
    revolveYAt(mx, mz - 0.05, barrelY + 0.02, [
      [0.04, 0],
      [0.09, 0.09],
      [0.094, 0.09],
      [0.094, 0.1],
      [0.086, 0.1],
      [0.036, 0.008],
      [0.036, 0],
    ]),
    enamel,
  );
  put(mincer, rod(V(mx, barrelY - 0.03, mz - 0.03), V(mx, benchTop - 0.002, mz - 0.03), 0.024, 14, 0.032), enamel);
  put(mincer, box(mx - 0.045, mx + 0.045, benchTop - 0.002, benchTop + 0.01, mz - 0.09, mz + 0.03), enamel);
  // the clamp round the bench's front edge, its screw from below
  put(mincer, box(mx - 0.02, mx + 0.02, benchTop - 0.075, benchTop - 0.002, mz + 0.03, mz + 0.046), enamel);
  put(mincer, box(mx - 0.02, mx + 0.02, benchTop - 0.075, benchTop - 0.062, mz - 0.1, mz + 0.046), enamel);
  put(mincer, cylY(0.0065, benchTop - 0.13, benchTop - 0.04, mx, mz - 0.07, 10), zinc);
  put(mincer, cylY(0.016, benchTop - 0.044, benchTop - 0.04, mx, mz - 0.07, 12), zinc);
  put(
    mincer,
    rod(V(mx - 0.028, benchTop - 0.13, mz - 0.07), V(mx + 0.028, benchTop - 0.13, mz - 0.07), 0.0042, 6),
    zinc,
  );
  // the plate of holes at the barrel's end, a nut ring holding it
  put(
    mincer,
    pipeSolid(
      [V(mx, barrelY, mz + 0.03), V(mx, barrelY, mz + 0.046)].map((p) => p),
      0.05,
      0.036,
      22,
    ),
    zinc,
  );
  put(mincer, cylZ(0.036, mz + 0.034, mz + 0.038, mx, barrelY, 22), steel);
  const holes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 28; i++) {
    const rr = 0.0058 * Math.sqrt(i + 0.5);
    const a = i * 2.39996;
    if (rr > 0.032) continue;
    holes.push(cylZ(0.0024, mz + 0.0378, mz + 0.0384, mx + Math.cos(a) * rr, barrelY + Math.sin(a) * rr, 6));
  }
  put(mincer, mergeAll(holes), black);
  // the crank at the back, its wooden grip
  put(mincer, cylZ(0.009, mz - 0.17, mz - 0.14, mx, barrelY, 10), zinc);
  put(mincer, rod(V(mx, barrelY, mz - 0.165), V(mx + 0.12, barrelY + 0.05, mz - 0.165), 0.0075, 8), zinc);
  put(mincer, rod(V(mx + 0.12, barrelY + 0.05, mz - 0.165), V(mx + 0.12, barrelY + 0.05, mz - 0.24), 0.0055, 8), zinc);
  put(
    mincer,
    rod(V(mx + 0.12, barrelY + 0.05, mz - 0.178), V(mx + 0.12, barrelY + 0.05, mz - 0.24), 0.015, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.7, name: 'grip' }),
  );

  // the dilution bucket on the ground, between the bench and the funnel, with its water at the mark (K13)
  const dil = parts['dilution-bucket'];
  const dbX = LINE.plantX - 1.0;
  const dbZ = 0.62;
  const dilBk = BUCKET;
  const dilBody = revolveY(
    [
      [0, 0],
      [dilBk.rBottom, 0],
      [dilBk.rTop, dilBk.h - 0.012],
      [dilBk.rTop + 0.006, dilBk.h - 0.012],
      [dilBk.rTop + 0.006, dilBk.h],
      [dilBk.rTop - dilBk.wall, dilBk.h],
      [dilBk.rBottom - dilBk.wall, dilBk.wall],
      [0, dilBk.wall],
    ],
    { seg: 36 },
  );
  dilBody.translate(dbX, 0, dbZ);
  const dilMat = new THREE.MeshStandardMaterial({ color: 0xc8ccc6, roughness: 0.55, name: 'dil-bucket' });
  put(dil, dilBody, dilMat);
  // the 10 L mark, derived: the level a frustum of this bucket holds 10 L at
  const markY = (() => {
    const V10 = LINE.bucketLitres / 1000;
    let y = 0;
    let vol = 0;
    const slope = (dilBk.rTop - dilBk.rBottom) / dilBk.h;
    while (vol < V10 && y < dilBk.h) {
      const r = dilBk.rBottom - dilBk.wall + slope * y;
      vol += Math.PI * r * r * 0.001;
      y += 0.001;
    }
    return y;
  })();
  const dilWater = new THREE.CylinderGeometry(1, 1, 0.002, 30);
  const rM = dilBk.rBottom - dilBk.wall + ((dilBk.rTop - dilBk.rBottom) * markY) / dilBk.h;
  dilWater.scale(rM, 1, rM);
  dilWater.translate(dbX, markY, dbZ);
  put(dil, dilWater, new THREE.MeshStandardMaterial({ color: 0x8a7a52, roughness: 0.22, name: 'dil-water' }));
  const markG = new THREE.TorusGeometry(rM + dilBk.wall + 0.0006, 0.0028, 6, 40);
  markG.rotateX(Math.PI / 2);
  markG.translate(dbX, markY, dbZ);
  put(dil, markG, look.redPaint);
  const dilH = new THREE.TorusGeometry(dilBk.rTop + 0.004, 0.0035, 6, 30, Math.PI);
  dilH.rotateY(Math.PI / 2);
  dilH.translate(dbX, dilBk.h, dbZ);
  put(dil, dilH, look.steel);
  const dilShadow = contactRing(dilBk.rBottom, 0.08, 0.36);
  dilShadow.position.set(dbX, 0.0015, dbZ);
  fixtures.add(dilShadow);

  // ---- anchors
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: LinePart, x: number, y: number, z: number) => {
    anchors[id] = anchor(parts[id], x, y, z, `${id}-label`);
  };
  at('bell-hose', trapX - 0.56, 0.86, bz);
  at('condensate-trap', trapX, jarY0 + jarH + 0.05, bz + 0.02);
  at('hydraulic-relief', rx, bottleBase - 0.01, pz + 0.06);
  at('h2s-filter', fx, canY0 + fh + 0.02, pz + 0.018);
  at('flame-arrester', ax, by + barrelR + 0.01, pz);
  at('pressure-gauge', gx, dialY + dialR + 0.01, dialZ);
  at('wall-sleeve', wx - 0.02, by + 0.05, pz);
  at('kitchen-valve', vx + 0.03, by + 0.05, zPipe);
  at('biogas-burner', tx - 0.14, jetAxisY - 0.02, tz + 0.03);
  at('primary-air-sleeve', airX + 0.025, jetAxisY + 0.03, tz);
  at('blue-flame', tx, headTop + 0.03, tz + headR);
  at('pot-stand', tx + ringR, tableY + 0.07, tz);
  at('cooking-pot', tx, standTop + pH + 0.06, tz);
  at('vent-opening', vcx, vy + vH / 2 + 0.03, zb + 0.03);
  at('gas-detector', dx, dy + 0.05, zb + 0.03);
  at('mincer', mx, barrelY + 0.13, mz - 0.05);
  at('dilution-bucket', dbX, dilBk.h + 0.02, dbZ);

  // ---- merge and register
  const registry = new PartRegistry();
  for (const id of LINE_PARTS) {
    mergeStatic(parts[id], { bakeKey: 'gas-line' });
    registry.add(id, parts[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  mergeStatic(fixtures, { bakeKey: 'gas-line-room' });
  applyWear(scene, 30, (m) => {
    const name = (m.material as THREE.Material).name;
    return [
      'flame',
      'water',
      'clear-plastic',
      'liquor',
      'sludge',
      'scum',
      'surface',
      'effluent',
      'gas',
      'bubble',
    ].includes(name);
  });

  // ---- flows: the gas, tap to burner; the scraps, to the funnel
  const flows = new FlowDots(170, 0.036);
  scene.add(flows.object);
  const gasPoints1: THREE.Vector3[] = curve.map((p) => p.clone());
  const gas1 = flows.add({ points: gasPoints1, color: 0x2f78dc, spacing: 0.22 });
  const gasLine = [
    hoseOut,
    ...upPath.slice(1),
    V(gx, by, pz),
    V(sleeveTo, by, pz),
    V(vx, by, pz),
    ...pipeRoute.slice(1),
    V(tx, jetAxisY, tz),
    V(tx, headTop, tz),
  ];
  const gas2 = flows.add({ points: gasLine, color: 0x2f78dc, spacing: 0.2 });
  const scraps = flows.add({
    points: [
      V(mx, barrelY + 0.1, mz - 0.05),
      V(mx + 0.02, barrelY, mz + 0.07),
      V(dbX, 0.5, dbZ),
      V(LINE.plantX - 0.635, 1.5, 0),
    ],
    color: 0xd27a30,
    spacing: 0.18,
  });

  const lastTap = new THREE.Vector3(1e3, 0, 0);
  const tapNow = new THREE.Vector3();
  let clock = 0;

  const mod: GasLineScene = {
    id: 'gas-line',
    scene,
    registry,
    machine,
    parts,
    needle,
    flameMesh,
    flows,
    joints,
    hoseUp,
    lineLength() {
      let L = 0;
      for (let i = 1; i < curve.length; i++) L += curve[i].distanceTo(curve[i - 1]);
      for (let i = 1; i < upPath.length; i++) L += upPath[i].distanceTo(upPath[i - 1]);
      L += sleeveTo - lineIn.x + 0.04;
      for (let i = 1; i < pipeRoute.length; i++) L += pipeRoute[i].distanceTo(pipeRoute[i - 1]);
      return L;
    },
    hotspots: hotspots(HOTSPOTS, anchors),
    home: { position: new THREE.Vector3(-0.1, 3.0, 11.2), target: new THREE.Vector3(-0.28, 1.08, -0.1) },
    minDistance: 0.25,
    maxDistance: 26,
    near: 0.03,
    far: 90,
    homePadding: 0.94,
    declutter: true,
    update(s, dt, view) {
      const now = partsNow(registry);
      const d = dt * view.slowMo;
      clock += d;
      const p = params();
      const scenery = !now.isolated;
      fixtures.visible = scenery;
      pad.visible = scenery;
      padShadow.visible = scenery;
      palletShadow.visible = scenery;
      plant.visible = scenery && !now.exploded;
      machine.update(s, d, { addedWeight: p.addedWeight, live: scenery && !now.exploded });

      // the hose flexes as the bell moves: both ends stay on what they are fixed to
      if (plant.visible) {
        plant.updateWorldMatrix(true, true);
        machine.tapOutlet.getWorldPosition(tapNow);
        if (tapNow.distanceToSquared(lastTap) > 1e-6) {
          lastTap.copy(tapNow);
          hoseCurve(tapNow, tapDir, inlet, inDir, 0.5, 0.04, HOSE_N, curve);
          rewriteTube(bellHose.geometry, curve, HOSE.r, 10);
          for (let i = 0; i < curve.length; i++) gasPoints1[i].copy(curve[i]);
          flows.setPoints(gas1, gasPoints1);
        }
      }

      // the trap: its water is the model's, and with no trap the jar is gone and the water stands in the hose
      const hasTrap = p.trap;
      trapBody.visible = hasTrap;
      const tw = Math.max(0, s.trapWaterMl) / 1e6 / (Math.PI * (jarR - 0.004) ** 2);
      trapWater.scale.set(1, Math.max(1e-4, tw), 1);
      plug.visible = !hasTrap && s.hoseWaterMl > 1 && registry.get('condensate-trap')!.display !== 'hidden';
      if (plug.visible) {
        const side = Math.min(0.7, s.hoseWaterMl / 1e6 / (Math.PI * (HOSE.bore / 2) ** 2) / 2);
        for (let i = 0; i < plugN; i++) plugPath[i].set(trapX - side + (2 * side * i) / (plugN - 1), trapY, bz);
        rewriteTube(plug.geometry, plugPath, HOSE.r + 0.0012, 10);
      }

      // the relief: the dip tube's water stands lower than the bottle's by the pressure, 1 cm per mbar
      const dipTop = waterTop - s.pressureMbar * 0.01;
      dipWater.scale.y = Math.max(1e-4, dipTop - (waterTop - depth));

      // the needle reads the pressure at the burner while it burns, the bell's otherwise
      const mbar = s.flameOn ? s.burnerMbar : s.pressureMbar;
      needle.rotation.z = dialAngle(Math.min(60, Math.max(0, mbar)));

      // the flame. Its height is the flow against the reference: not a measured height (physics §6)
      const alone = registry.get('blue-flame')!.display === 'solid' && now.isolated;
      const on = s.flameOn || alone;
      flameU.uTime.value = clock;
      flameU.uH.value = on ? Math.max(0.35, Math.min(1.5, s.flameOn ? s.flameShare : 0.8)) : 0.0001;
      flameU.uLean.value = Math.max(0, Math.min(1, (0.55 - s.ch4Share) * 8));

      const showFlows = view.schematic && !now.hidden && !now.exploded;
      flows.object.visible = showFlows;
      if (showFlows) {
        // the gas at its true speed in the hose: litres an hour over the bore. Slowed by the view's own slow motion
        const area = Math.PI * (HOSE.bore / 2) ** 2;
        const v = (s.burnerLph / 1000 / 3600 / area) * view.slowMo;
        flows.set(gas1, v, s.flameOn ? 1 : 0);
        flows.set(gas2, v, s.flameOn ? 1 : 0);
        flows.set(scraps, 0.25 * view.slowMo, 1);
        flows.step(dt);
      }
    },
  };
  return mod;
}

function rngLocal(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxTimber(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;
  const long = dx >= dy && dx >= dz ? 'x' : dy >= dz ? 'y' : 'z';
  for (let i = 0; i < p.count; i++) {
    const along = long === 'x' ? p.getX(i) : long === 'y' ? p.getY(i) : p.getZ(i);
    const across = long === 'x' ? p.getZ(i) + p.getY(i) : long === 'y' ? p.getX(i) + p.getZ(i) : p.getX(i) + p.getY(i);
    uv.setXY(i, across * 4.5, along * 1.4);
  }
  return g;
}

function revolveYAt(x: number, z: number, y: number, profile: [number, number][]): THREE.BufferGeometry {
  const g = revolveY(profile, { seg: 26 });
  g.translate(x, y, z);
  return g;
}

function rounded2Handle(x0: number, x1: number, y: number, z: number): THREE.BufferGeometry {
  return tubeThrough(
    rounded([V(x0, y - 0.016, z), V(x1, y - 0.008, z), V(x1, y + 0.008, z), V(x0, y + 0.016, z)], 0.012, 5),
    0.0058,
    8,
  );
}

function extentOf(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, y0, z0, x1, y1, z1]), 3));
  g.setIndex([]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  m.name = 'extent';
  m.castShadow = false;
  m.userData.noShadow = true;
  m.userData.keep = true;
  m.raycast = () => {};
  return m;
}

/** The flame's tongues, one crossed pair per port, their base on the head. `uv.y` runs from the base to the tip, `aF` holds the base's height and a phase. */
function flameGeometry(cx: number, cz: number, r: number, y0: number, ports: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const f: number[] = [];
  const idx: number[] = [];
  const H = 0.042;
  const W = 0.0135;
  const put = (a: number, phase: number) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = cx + c * r;
    const z = cz + s * r;
    // two cards across each other, leaning out as a flame on a ring does
    for (const [ux, uz] of [
      [-s, c],
      [c, s],
    ]) {
      const first = pos.length / 3;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const lean = v * 0.018;
        const nar = 1 - 0.55 * v;
        pos.push(x + (u - 0.5) * W * nar * ux + c * lean, y0 + v * H, z + (u - 0.5) * W * nar * uz + s * lean);
        uv.push(u, v);
        f.push(y0, 0, phase);
      }
      idx.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  };
  for (let i = 0; i < ports; i++) put((i / ports) * Math.PI * 2, i / ports);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aF', new THREE.Float32BufferAttribute(f, 3));
  g.setIndex(idx);
  return g;
}
