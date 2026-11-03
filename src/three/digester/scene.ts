import * as THREE from 'three';
import { applyWear, contactRing, contactShadow, PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { BioParams, BioState } from '../../sim/types';
import { BASE_Y, BELL, FEED, HOSE, OVERFLOW, PAD, TANK, TAP } from '../dims';
import { FlowDots } from '../flows';
import { buildMachine, MACHINE_PARTS, type Machine, type MachinePart } from '../machine/machine';
import { box, boxUV, hoseCurve, rewriteTube, tubeThrough, V } from '../machine/shapes';
import { concrete } from '../machine/textures';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, viewFrom, workshopScene, type HotspotDef } from '../world';

// The `digester` world: the machine alone, on a piece of its pad, on the paper. It opens cut along its axis, as this is what the world is for: the bell rises live from the simulation, the slurry stands where the model
// says. The section tool cuts it across instead, at the overflow, to show the open ring from above. X-ray and every preview closes it again, its shells pale over the volumes inside. The same machine as the yard's.

/** Explode offsets, m. The bell lifts straight up, with what it carries; the slurry slides out of the cut towards the viewer, layer over layer; the feed comes off along its own line, stage by stage. */
export const EXPLODE: Record<MachinePart, [number, number, number]> = {
  'digester-tank': [0, 0.42, 0],
  pallet: [0, 0, 0],
  'gas-bell': [0, 1.85, 0],
  // nested in the bell, so relative to it
  'gas-space': [0, 0.0, 0.95],
  'gas-tap': [-0.1, 0.36, 0],
  'scale-marks': [-0.22, 0, -0.12],
  'half-brick': [0.1, 2.7, -0.1],
  'float-limiter': [0, 0.42, -1.25],
  'rim-gap': [0, 1.04, 1.2],
  'scum-layer': [0, 0.88, 1.2],
  'clear-liquor': [0, 0.62, 1.2],
  'sludge-bed': [0, 0.36, 1.2],
  'inner-feed-pipe': [0.34, 0.42, 0],
  'tank-connector': [0.46, 0.42, 0],
  'feed-tee': [0.66, 0.42, 0],
  'clean-out-plug': [0.96, 0.42, 0],
  'feed-riser': [0.66, 0.6, 0],
  'feed-funnel': [0.66, 0.94, 0],
  'overflow-pipe': [-0.55, 0.42, 0],
  'bottom-valve': [-0.48, 0.42, -0.34],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'gas-bell', ...partName('gas-bell') },
  { id: 'digester-tank', ...partName('digester-tank') },
  { id: 'gas-space', ...partName('gas-space') },
  { id: 'clear-liquor', ...partName('clear-liquor') },
  { id: 'feed-funnel', ...partName('feed-funnel') },
  { id: 'overflow-pipe', ...partName('overflow-pipe') },
  { id: 'rim-gap', ...partName('rim-gap') },
  { id: 'scale-marks', ...partName('scale-marks'), minor: true },
  { id: 'half-brick', ...partName('half-brick'), minor: true },
  { id: 'scum-layer', ...partName('scum-layer'), minor: true },
  { id: 'sludge-bed', ...partName('sludge-bed'), minor: true },
  { id: 'gas-tap', ...partName('gas-tap'), minor: true },
  { id: 'feed-riser', ...partName('feed-riser'), minor: true },
  { id: 'feed-tee', ...partName('feed-tee'), minor: true },
  { id: 'clean-out-plug', ...partName('clean-out-plug'), minor: true },
  { id: 'inner-feed-pipe', ...partName('inner-feed-pipe'), minor: true },
  { id: 'tank-connector', ...partName('tank-connector'), minor: true },
  { id: 'bottom-valve', ...partName('bottom-valve'), minor: true },
  { id: 'pallet', ...partName('pallet'), minor: true },
  { id: 'float-limiter', ...partName('float-limiter'), minor: true },
];

const FRAMING: Partial<Record<MachinePart, PartFraming>> = {
  'digester-tank': { viewDir: viewFrom(18, -150) },
  'gas-bell': { viewDir: viewFrom(18, -150) },
  'scale-marks': { frame: new THREE.Box3(V(-0.62, 1.42, -0.42), V(-0.26, 2.12, 0.02)), viewDir: viewFrom(8, -82) },
  'half-brick': { viewDir: viewFrom(30, -160) },
  'gas-tap': { viewDir: viewFrom(32, -120) },
  'bottom-valve': { viewDir: viewFrom(16, -150) },
  'float-limiter': { viewDir: viewFrom(16, -30) },
  'rim-gap': { viewDir: viewFrom(48, -22) },
  'scum-layer': { viewDir: viewFrom(16, -14) },
  'gas-space': { viewDir: viewFrom(8, -18) },
  'inner-feed-pipe': { viewDir: viewFrom(6, 12) },
  'tank-connector': { viewDir: viewFrom(10, 40) },
  'feed-tee': { viewDir: viewFrom(10, 40) },
  'clean-out-plug': { viewDir: viewFrom(10, 62) },
  'feed-riser': { viewDir: viewFrom(8, 30) },
  'feed-funnel': { viewDir: viewFrom(30, 42) },
  'overflow-pipe': { viewDir: viewFrom(10, -36) },
  pallet: { viewDir: viewFrom(14, -24) },
  'sludge-bed': { viewDir: viewFrom(6, -14) },
  'clear-liquor': { viewDir: viewFrom(6, -14) },
};

export interface DigesterScene extends SceneModule<BioState> {
  machine: Machine;
  flows: FlowDots;
  bellFlows: FlowDots;
  hose: THREE.Mesh;
  /** What holds the machine up in this world, for the tests. */
  pad: THREE.Mesh;
}

const HOSE_N = 26;

export function createDigesterScene(params: () => Pick<BioParams, 'addedWeight'>): DigesterScene {
  const scene = workshopScene({
    name: 'digester',
    key: [-3.6, 7.8, 5.6],
    target: [0, 1, 0],
    shadowHalf: 4.2,
    shadowFar: 18,
    exposure: 1.04,
  });
  const floor = paperFloor(16);
  scene.add(floor);

  // ---- a piece of the yard's pad under the plant
  const machine = buildMachine({ views: true });
  const padY = PAD.h;
  const padMap = concrete(61, [166, 160, 148]);
  padMap.map.repeat.set(1, 1);
  const padMat = new THREE.MeshStandardMaterial({
    map: padMap.map,
    bumpMap: padMap.bump,
    bumpScale: 0.8,
    roughness: 0.94,
    name: 'pad',
  });
  const pad = new THREE.Mesh(boxUV(-PAD.halfX, PAD.halfX, 0, padY, -PAD.halfZ, PAD.halfZ, 1.4), padMat);
  pad.name = 'pad';
  pad.castShadow = pad.receiveShadow = true;
  scene.add(pad);
  const padShadow = contactShadow(PAD.halfX * 2, PAD.halfZ * 2, 0.32, 0.4);
  padShadow.position.y = 0.002;
  scene.add(padShadow);

  machine.root.position.y = padY + BASE_Y;
  scene.add(machine.root);
  machine.root.add(machine.bucket.root, machine.bucket.stream);
  const bucketShadow = contactRing(0.125, 0.09, 0.36);
  bucketShadow.position.set(OVERFLOW.elbowX, -BASE_Y + 0.0015, 0);
  machine.root.add(bucketShadow);
  const palletShadow = contactShadow(1.2, 1.0, 0.1, 0.38);
  palletShadow.position.set(0, -BASE_Y + 0.0015, 0);
  machine.root.add(palletShadow);

  // ---- the hose, from the tap down the back to a post on the pad: scenery here, the gas line's world has its parts
  const hoseMat = machine.look.hose;
  const clamp = V(-0.98, 0.52, -0.62);
  const clampDir = V(0, 1, 0);
  const curve: THREE.Vector3[] = [];
  const startTap = () => {
    machine.root.updateWorldMatrix(true, true);
    const p = machine.tapOutlet.getWorldPosition(new THREE.Vector3());
    return machine.root.worldToLocal(p);
  };
  hoseCurve(startTap(), machine.tapDir, clamp, clampDir, 0.3, 0.02, HOSE_N, curve);
  const hose = new THREE.Mesh(tubeThrough(curve, HOSE.r, 10), hoseMat);
  hose.name = 'hose';
  hose.castShadow = true;
  hose.frustumCulled = false;
  machine.root.add(hose);
  const hoseRest = new THREE.Group();
  hoseRest.name = 'hose-rest';
  const postMat = machine.look.palletWood;
  const post = new THREE.Mesh(box(-1.01, -0.95, -BASE_Y, 0.56, -0.65, -0.59), postMat);
  post.castShadow = post.receiveShadow = true;
  hoseRest.add(post);
  const clipMesh = new THREE.Mesh(box(-1.0, -0.96, 0.49, 0.53, -0.59, -0.575), machine.look.zinc);
  hoseRest.add(clipMesh);
  // past its post, the hose leaves down to the pad and away along it, to the kitchen: its far end in the gas-line world
  const away = tubeThrough(
    [
      V(-0.98, 0.52, -0.62),
      V(-0.98, -0.1, -0.62),
      V(-0.98, -BASE_Y + 0.02, -0.56),
      V(-1.25, -BASE_Y + 0.016, -0.4),
      V(-2.4, -BASE_Y - PAD.h + 0.016, -0.1),
      V(-3.6, -BASE_Y - PAD.h + 0.014, 0.4),
    ],
    HOSE.r,
    10,
  );
  const awayMesh = new THREE.Mesh(away, hoseMat);
  awayMesh.castShadow = true;
  hoseRest.add(awayMesh);
  machine.root.add(hoseRest);

  // ---- anchors, in each part's frame
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: MachinePart, x: number, y: number, z: number) => {
    anchors[id] = anchor(machine.parts[id], x, y, z, `${id}-label`);
  };
  at('gas-bell', -0.12, BELL.height - 0.28, -0.3);
  anchors['gas-bell'].parent!.remove(anchors['gas-bell']);
  machine.bellPoseGroup.add(anchors['gas-bell']);
  at('gas-space', 0.16, 1.12, 0);
  at('scale-marks', -0.442, 0.86, -0.07);
  at('gas-tap', TAP.x - 0.03, BELL.height + 0.1, TAP.z);
  at('half-brick', 0, 0.16, 0);
  anchors['half-brick'].parent!.remove(anchors['half-brick']);
  machine.brickPose.add(anchors['half-brick']);
  at('digester-tank', -0.518, 0.56, 0.01);
  at('clear-liquor', 0.1, 0.52, 0);
  at('sludge-bed', -0.22, 0.05, 0);
  at('scum-layer', -0.1, 1.0, 0);
  at('rim-gap', 0.5, 1.04, -0.01);
  at('feed-funnel', FEED.riserX + 0.09, FEED.funnelTop, 0);
  at('feed-riser', FEED.riserX + 0.04, 0.62, 0);
  at('feed-tee', FEED.riserX - 0.01, FEED.axisY - 0.05, 0);
  at('clean-out-plug', FEED.riserX + 0.1, FEED.axisY, 0);
  at('inner-feed-pipe', 0.2, FEED.axisY, 0);
  at('tank-connector', TANK.outerR + 0.012, FEED.axisY + 0.06, 0);
  at('overflow-pipe', OVERFLOW.elbowX, OVERFLOW.axisY + 0.03, 0);
  at('bottom-valve', -0.56, 0.1, -0.4);
  at('pallet', 0.42, -0.08, 0.2);
  at('float-limiter', 0.3, 2.28, -0.3);

  // ---- register: what is nested first, so that it keeps its own meshes
  const registry = new PartRegistry();
  const order: MachinePart[] = [
    'gas-tap',
    'scale-marks',
    'gas-space',
    ...MACHINE_PARTS.filter((p) => !['gas-tap', 'scale-marks', 'gas-space'].includes(p)),
  ];
  for (const id of order) {
    registry.add(id, machine.parts[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  applyWear(machine.root, 28, (m) => {
    const name = (m.material as THREE.Material).name;
    return (
      ['liquor', 'sludge', 'scum', 'surface', 'gas', 'bubble', 'effluent'].includes(name) || name.startsWith('section')
    );
  });

  // ---- flows: the feed's way in the machine's frame, the gas in the bell's
  const flows = new FlowDots(170, 0.022);
  machine.root.add(flows.object);
  const y = FEED.axisY;
  const feedPath = flows.add({
    points: [V(FEED.riserX, FEED.funnelTop, 0.004), V(FEED.riserX, y, 0.004), V(0.02, y, 0.004)],
    color: 0xd27a30,
    spacing: 0.1,
  });
  const liquorPath = flows.add({
    points: [
      V(0.02, y, 0.005),
      V(-0.15, 0.3, 0.005),
      V(-0.47, 0.82, 0.005),
      V(-0.5, 1.03, 0.005),
      V(-0.515, OVERFLOW.axisY - 0.012, 0.005),
      V(OVERFLOW.elbowX + 0.04, OVERFLOW.axisY - 0.012, 0.005),
      V(OVERFLOW.elbowX, OVERFLOW.axisY - 0.05, 0.005),
      V(OVERFLOW.elbowX, OVERFLOW.axisY - OVERFLOW.drop, 0.005),
    ],
    color: 0x8a6a2a,
    spacing: 0.12,
  });
  // what misses the bell: up the ring, out into the air
  const rimPathL = flows.add({
    points: [V(-0.482, 0.12, 0.005), V(-0.486, 1.05, 0.005), V(-0.47, 2.1, 0.005)],
    color: 0x7a8f9a,
    spacing: 0.14,
  });
  const rimPathR = flows.add({
    points: [V(0.49, 0.2, 0.005), V(0.5, 1.05, 0.005), V(0.56, 2.1, 0.005)],
    color: 0x7a8f9a,
    spacing: 0.14,
  });
  const bellFlows = new FlowDots(70, 0.022);
  machine.bellPoseGroup.add(bellFlows.object);
  const gasPath = bellFlows.add({
    points: [
      V(0.2, 0.4, 0.004),
      V(0.1, 0.8, 0.004),
      V(-0.06, 1.2, 0.004),
      V(TAP.x, BELL.height - 0.02, TAP.z),
      V(TAP.x, BELL.height + 0.06, TAP.z),
      V(TAP.x - 0.08, BELL.height + 0.062, TAP.z),
    ],
    color: 0x3f7fb5,
    spacing: 0.09,
  });

  const out = new THREE.Vector3();
  const lastTap = new THREE.Vector3(1e3, 0, 0);

  const mod: DigesterScene = {
    id: 'digester',
    scene,
    registry,
    machine,
    flows,
    bellFlows,
    hose,
    pad,
    hotspots: hotspots(HOTSPOTS, anchors),
    home: { position: new THREE.Vector3(-2.15, 2.5, 4.9), target: new THREE.Vector3(-0.04, 1.1, 0) },
    minDistance: 0.25,
    maxDistance: 16,
    near: 0.02,
    far: 70,
    homePadding: 1.02,
    declutter: true,
    update(s, dt, view) {
      const now = partsNow(registry);
      // a guide's step stays in section: the inner feed pipe of its step 4 is drawn inside the tank, and a closed tank hides it
      const v = view.cutaway ? 'across' : now.xray || now.isolated ? 'whole' : 'cut';
      machine.setView(v);
      const live = !now.hidden && !now.exploded;
      machine.update(s, dt * view.slowMo, { addedWeight: params().addedWeight, live: live && !now.ghosted });

      const across = view.cutaway;
      const scenery = !now.isolated && !now.exploded && !across;
      pad.visible = !now.isolated;
      padShadow.visible = !now.isolated && !now.exploded;
      // what hangs from a part waits for it in a guide: no hose before its tap, no bucket before its overflow
      const hoseOn = scenery && registry.get('gas-tap')!.display === 'solid';
      hose.visible = hoseOn;
      hoseRest.visible = hoseOn;
      machine.bucket.root.visible =
        !now.isolated && !now.exploded && registry.get('overflow-pipe')!.display === 'solid';
      palletShadow.visible = !now.exploded && !now.isolated;
      bucketShadow.visible = !now.exploded && !now.isolated;
      if (hoseOn) {
        machine.bellPoseGroup.updateWorldMatrix(true, true);
        machine.tapOutlet.getWorldPosition(out);
        machine.root.worldToLocal(out);
        if (out.distanceToSquared(lastTap) > 1e-6) {
          lastTap.copy(out);
          hoseCurve(out, machine.tapDir, clamp, clampDir, 0.34, 0.03, HOSE_N, curve);
          rewriteTube(hose.geometry, curve, HOSE.r, 10);
        }
      }

      const showFlows = view.schematic && !now.hidden && !now.exploded && !now.ghosted && !across;
      flows.object.visible = showFlows;
      bellFlows.object.visible = showFlows;
      if (showFlows) {
        const k = view.slowMo;
        const gasNow = s.bubblesRimLph + s.bubblesBellLph;
        const rimShare = gasNow > 0 ? s.bubblesRimLph / gasNow : 0;
        const running = s.bubblesBellLph > 0 ? 0.22 : 0;
        flows.set(feedPath, 0.22 * k);
        flows.set(liquorPath, 0.1 * k);
        flows.set(rimPathL, 0.32 * k, gasNow > 0 ? Math.min(1, rimShare * 3) : 0);
        flows.set(rimPathR, 0.32 * k, gasNow > 0 ? Math.min(1, rimShare * 3) : 0);
        bellFlows.set(gasPath, running * k, running > 0 ? 1 : 0);
        flows.step(dt);
        bellFlows.step(dt);
      }
    },
  };
  return mod;
}
