import * as THREE from 'three';
import { contactShadow, glass, patchMaterial, PartRegistry, rng } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { BioState } from '../../sim/types';
import { DROP } from '../dims';
import { FlowDots } from '../flows';
import { extentMarker } from '../machine/machine';
import { box, revolveY, tubeThrough, V, type P2 } from '../machine/shapes';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, viewFrom, workshopScene, type HotspotDef } from '../world';
import {
  AMMONIUM_ION,
  BICARBONATE,
  CARBON_DIOXIDE,
  ball,
  capsule,
  FATTY_ACID,
  flagellum,
  foodGrain,
  hairs,
  Kind,
  LIFE,
  lifeMaterial,
  lifeUniforms,
  METHANE,
  molecule,
  noise3,
  type LifeUniforms,
} from './organisms';

// The `slurry` world: one drop of the digester's clear liquor, on a slide, enormously magnified. The food chain runs from left to right through it, in order: the food particle, the organisms that cut it up, those that
// make acids, the acids, those that make acetate and hydrogen, the methanogens, the bubble that leaves. Under them the buffer, the ammonium, the sulphate-reducers, the germs that survive. Nothing here is to scale, and the
// world says so once, in the author's overview. The drop's colour is the model's, `dropRgb`; how much acid and how much buffer are in it, how lively each kind is, all follow the state: overfeed, and the acid-makers outrun
// the methanogens in front of you. No section here, there is nothing to cut.

export const DROP_PARTS = [
  'food-particle',
  'hydrolysers',
  'acid-makers',
  'fatty-acid-pool',
  'acetogens',
  'methanogens',
  'gas-bubble',
  'sulphate-reducers',
  'bicarbonate-buffer',
  'ammonium',
  'surviving-germs',
] as const;
export type DropPart = (typeof DROP_PARTS)[number];

/** Explode by trophic step: each step of the chain to its own place along the way, what is not in the chain forward and back. */
export const EXPLODE: Record<DropPart, [number, number, number]> = {
  'food-particle': [-1.1, 0.25, 0.2],
  hydrolysers: [-1.1, 1.05, 0.2],
  'acid-makers': [-0.55, 1.15, 0.5],
  'fatty-acid-pool': [0, 1.5, 0.9],
  acetogens: [0.55, 1.15, 0.5],
  methanogens: [1.15, 0.5, 0.2],
  'gas-bubble': [1.2, 1.05, 0.2],
  'sulphate-reducers': [-0.8, 0.05, -1.5],
  'bicarbonate-buffer': [0, -0.02, 1.6],
  ammonium: [0.5, -0.02, 1.9],
  'surviving-germs': [0.9, 0.05, -1.5],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'food-particle', ...partName('food-particle') },
  { id: 'acid-makers', ...partName('acid-makers') },
  { id: 'fatty-acid-pool', ...partName('fatty-acid-pool') },
  { id: 'methanogens', ...partName('methanogens') },
  { id: 'gas-bubble', ...partName('gas-bubble') },
  { id: 'hydrolysers', ...partName('hydrolysers'), minor: true },
  { id: 'acetogens', ...partName('acetogens'), minor: true },
  { id: 'bicarbonate-buffer', ...partName('bicarbonate-buffer'), minor: true },
  { id: 'ammonium', ...partName('ammonium'), minor: true },
  { id: 'sulphate-reducers', ...partName('sulphate-reducers'), minor: true },
  { id: 'surviving-germs', ...partName('surviving-germs'), minor: true },
];

export interface DropScene extends SceneModule<BioState> {
  dome: THREE.Mesh;
  backdrop: THREE.Mesh;
  uniforms: Record<DropPart, LifeUniforms>;
  flows: FlowDots;
  /** How many of each pool are drawn now, for the tests. */
  shown: { acid: number; buffer: number };
  acidMax: number;
  bufferMax: number;
  motes: THREE.Points;
}

const Y0 = DROP.slideH;

/** Inside the dome at this height, the free radius. */
const domeR = (y: number): number => DROP.R * Math.sqrt(Math.max(0, 1 - ((y - Y0) / DROP.H) ** 2));

function randomQuat(r: () => number): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
}

export function createDropScene(): DropScene {
  const scene = workshopScene({
    name: 'slurry',
    key: [-2.8, 7.4, 4.8],
    target: [0, 0.6, 0],
    shadowHalf: 5.5,
    shadowFar: 18,
    exposure: 1.02,
  });
  scene.add(paperFloor(16));

  // ---- the slide: a plate of glass with its frosted end, a soft shadow under it. Scenery
  const stage = new THREE.Group();
  stage.name = 'stage';
  scene.add(stage);
  const sx = DROP.slideX / 2;
  const sz = DROP.slideZ / 2;
  const slideShadow = contactShadow(DROP.slideX, DROP.slideZ, 0.22, 0.3);
  slideShadow.position.y = 0.002;
  stage.add(slideShadow);
  const plateMat = glass(0.34);
  plateMat.color.set(0xd8e6e4);
  const plate = new THREE.Mesh(box(-sx, sx, 0.003, DROP.slideH, -sz, sz), plateMat);
  plate.name = 'slide';
  plate.renderOrder = 1;
  stage.add(plate);
  const frost = new THREE.Mesh(
    box(sx - 1.15, sx - 0.05, DROP.slideH - 0.002, DROP.slideH + 0.002, -sz + 0.05, sz - 0.05),
    new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.96, name: 'slide-frost' }),
  );
  stage.add(frost);

  // ---- the drop. A shell with its inside lit like liquid, and in front of everything its surface, only an edge and highlights
  const prof: P2[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    prof.push([DROP.R * Math.cos(a), Y0 + DROP.H * Math.sin(a)]);
  }
  const shell = revolveY(prof, { seg: 96, smooth: true, closed: false });
  const dropColor = { value: new THREE.Color(0.48, 0.56, 0.24) };
  const backMat = new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 0.9, name: 'drop-inside' });
  backMat.userData.noShare = true;
  patchMaterial(backMat, 'drop-inside', (shader) => {
    shader.uniforms.uDrop = dropColor;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDropP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDropP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uDrop; varying vec3 vDropP;')
      .replace(
        '#include <opaque_fragment>',
        `float rr = length( vDropP.xz ) / ${DROP.R.toFixed(3)};
         float hh = clamp( ( vDropP.y - ${Y0.toFixed(3)} ) / ${DROP.H.toFixed(3)}, 0.0, 1.0 );
         // pale where the light comes through at the top and the middle, deeper down and at the edge
         vec3 deep = uDrop * vec3( 0.46, 0.46, 0.44 );
         vec3 light = mix( uDrop, vec3( 0.96, 0.95, 0.82 ), 0.46 );
         outgoingLight = mix( light, deep, clamp( 0.72 * rr * rr + 0.34 * ( 1.0 - hh ) * ( 1.0 - hh ), 0.0, 1.0 ) );
         #include <opaque_fragment>`,
      );
  });
  const backdrop = new THREE.Mesh(shell, backMat);
  backdrop.name = 'drop-inside';
  backdrop.castShadow = false;
  backdrop.receiveShadow = false;
  backdrop.renderOrder = 2;
  stage.add(backdrop);
  // its floor: what the slide looks like through the liquid
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.6, name: 'drop-floor', side: THREE.FrontSide });
  floorMat.userData.noShare = true;
  patchMaterial(floorMat, 'drop-floor', (shader) => {
    shader.uniforms.uDrop = dropColor;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDropQ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDropQ = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uDrop; varying vec2 vDropQ;')
      .replace(
        '#include <opaque_fragment>',
        `float qq = length( vDropQ ) / ${DROP.R.toFixed(3)};
         outgoingLight = mix( mix( uDrop, vec3( 0.9, 0.88, 0.74 ), 0.3 ), uDrop * 0.42, qq * qq );
         #include <opaque_fragment>`,
      );
  });
  const dropFloor = new THREE.Mesh(new THREE.CircleGeometry(DROP.R, 96), floorMat);
  dropFloor.rotation.x = -Math.PI / 2;
  dropFloor.position.y = Y0 + 0.001;
  dropFloor.name = 'drop-floor';
  stage.add(dropFloor);

  const frontMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.06,
    metalness: 0,
    envMapIntensity: 1.6,
    transparent: true,
    depthWrite: false,
    name: 'drop-surface',
  });
  frontMat.userData.noShare = true;
  patchMaterial(frontMat, 'drop-surface', (shader) => {
    shader.uniforms.uDrop = dropColor;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uDrop;')
      .replace(
        '#include <opaque_fragment>',
        `float edge = pow( 1.0 - clamp( abs( dot( normalize( vViewPosition ), normal ) ), 0.0, 1.0 ), 2.6 );
         float spec = clamp( dot( reflectedLight.indirectSpecular, vec3( 0.33 ) ) - 0.05, 0.0, 1.0 );
         outgoingLight = mix( uDrop * 0.5, vec3( 1.0 ), spec );
         diffuseColor.a = clamp( 0.05 + 0.82 * edge + 0.9 * spec * spec, 0.0, 0.95 );
         #include <opaque_fragment>`,
      );
  });
  const dome = new THREE.Mesh(shell, frontMat);
  dome.name = 'drop-surface';
  dome.castShadow = false;
  dome.receiveShadow = false;
  dome.renderOrder = 6;
  stage.add(dome);
  // the drop's own light on the glass around its foot, in its colour
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(DROP.R * 0.98, DROP.R * 1.2, 96),
    new THREE.MeshBasicMaterial({ color: 0x8a8f40, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = DROP.slideH + 0.003;
  stage.add(halo);

  // ---- the parts
  const parts = Object.fromEntries(
    DROP_PARTS.map((id) => {
      const g = new THREE.Group();
      g.name = id;
      scene.add(g);
      return [id, g];
    }),
  ) as Record<DropPart, THREE.Group>;
  const uniforms: Record<DropPart, LifeUniforms> = {
    'food-particle': lifeUniforms(0.004),
    hydrolysers: lifeUniforms(0.014),
    'acid-makers': lifeUniforms(0.03),
    'fatty-acid-pool': lifeUniforms(0.05),
    acetogens: lifeUniforms(0.018),
    methanogens: lifeUniforms(0.008, 0.3),
    'gas-bubble': lifeUniforms(0.01),
    'sulphate-reducers': lifeUniforms(0.016),
    'bicarbonate-buffer': lifeUniforms(0.045),
    ammonium: lifeUniforms(0.05),
    'surviving-germs': lifeUniforms(0.006),
  };

  // the food particle: a cooked grain at the head of the chain, bitten on its right, its long chains fraying into the liquid
  const R0 = rng(101);
  const foodAt = V(-1.42, 0.62, 0.02);
  const foodHalf = V(0.68, 0.36, 0.38);
  const bites = [
    { dir: V(0.82, 0.42, 0.38).normalize(), r: 0.52 },
    { dir: V(0.5, -0.62, 0.6).normalize(), r: 0.42 },
    { dir: V(0.12, 0.8, 0.58).normalize(), r: 0.36 },
    { dir: V(-0.5, 0.42, 0.74).normalize(), r: 0.34 },
    { dir: V(0.3, 0.1, -0.95).normalize(), r: 0.4 },
  ];
  const food = new Kind();
  food.next(0.11);
  foodGrain(food, foodAt, foodHalf, bites, 7);
  const onFood = (d: THREE.Vector3) =>
    foodAt.clone().add(V(d.x * foodHalf.x * 0.93, d.y * foodHalf.y * 0.93, d.z * foodHalf.z * 0.93));
  // the long molecules it is made of, as strings of beads hanging out of it and drifting off
  for (let i = 0; i < 16; i++) {
    const d = V(R0() - 0.25, R0() - 0.5, R0() - 0.5).normalize();
    let p = onFood(d);
    const dir = d.clone();
    const beads = 4 + Math.floor(R0() * 5);
    food.next(0.1 + R0());
    for (let k = 0; k < beads; k++) {
      dir.add(V(R0() - 0.5, R0() - 0.5, R0() - 0.5).multiplyScalar(0.5)).normalize();
      p = p.clone().addScaledVector(dir, 0.044);
      p.y = Math.max(0.09, p.y);
      food.add(ball(p, 0.024, 7, 5), LIFE.foodDark, () => (k / beads) * 0.5);
    }
  }
  // pieces cut free, on the way to the acid-makers
  for (let i = 0; i < 12; i++) {
    food.next(R0());
    const p = V(-0.72 + R0() * 0.34, 0.34 + R0() * 0.62, -0.32 + R0() * 0.66);
    const dir = V(R0() - 0.5, R0() - 0.5, R0() - 0.5).normalize();
    const n = 2 + Math.floor(R0() * 2);
    for (let k = 0; k < n; k++) food.add(ball(p.clone().addScaledVector(dir, k * 0.042), 0.022, 7, 5), LIFE.foodDark);
  }
  parts['food-particle'].add(food.mesh(lifeMaterial(uniforms['food-particle'], 0.68), 'food-particle'));

  // hydrolysers: rods with their hairs, nose to the grain, working in its bites
  const R1 = rng(103);
  const hyd = new Kind();
  const hydSpots = [
    V(0.84, 0.46, 0.34),
    V(0.56, -0.66, 0.5),
    V(0.14, 0.86, 0.5),
    V(-0.5, 0.5, 0.7),
    V(0.82, -0.08, 0.58),
    V(-0.16, -0.72, 0.68),
    V(-0.86, -0.12, 0.5),
    V(0.3, 0.2, 0.93),
  ];
  hydSpots.forEach((spot, i) => {
    const d = spot.clone().normalize();
    const tip = onFood(d);
    const out = d
      .clone()
      .add(V(R1() - 0.5, R1() - 0.5, R1() - 0.5).multiplyScalar(0.55))
      .normalize();
    const a = tip.clone().addScaledVector(out, 0.075);
    const L = 0.22 + R1() * 0.1;
    const b = a.clone().addScaledVector(out, L);
    hyd.next(i * 0.137);
    hyd.add(capsule(a, b, 0.062), LIFE.hydrolyser);
    hairs(hyd, a, b, 0.062, 26, 0.05, LIFE.hydrolyser, R1);
    // two enzymes at its nose, little bilobed scissors
    for (let k = 0; k < 2; k++) {
      const e = tip.clone().add(V(R1() - 0.5, R1() - 0.5, R1() - 0.5).multiplyScalar(0.09));
      hyd.add(ball(e, 0.018, 8, 6), LIFE.enzyme);
      hyd.add(ball(e.clone().add(V(0.022, 0.012, 0)), 0.014, 8, 6), LIFE.enzyme);
    }
  });
  parts.hydrolysers.add(hyd.mesh(lifeMaterial(uniforms.hydrolysers, 0.55), 'hydrolysers'));

  // acid-makers: many, plump, short, some caught dividing: they are the fast ones
  const R2 = rng(107);
  const acidKind = new Kind();
  const acidSpots: THREE.Vector3[] = [];
  for (let i = 0; i < 15; i++) {
    const p = V(-0.58 + 0.62 * R2(), 0.24 + 0.78 * R2(), -0.62 + 1.1 * R2());
    if (acidSpots.some((q) => q.distanceTo(p) < 0.19)) continue;
    acidSpots.push(p);
    const dir = V(R2() - 0.5, R2() - 0.5, R2() - 0.5).normalize();
    const L = 0.1 + R2() * 0.07;
    const rr = 0.058 + R2() * 0.014;
    const a = p.clone().addScaledVector(dir, -L / 2);
    const b = p.clone().addScaledVector(dir, L / 2);
    acidKind.next(i * 0.091);
    if (i % 4 === 0) {
      // dividing: two cells on one axis, waisted
      acidKind.add(
        capsule(a.clone().addScaledVector(dir, -0.03), p.clone().addScaledVector(dir, -0.03), rr),
        LIFE.acidMaker,
      );
      acidKind.add(
        capsule(p.clone().addScaledVector(dir, 0.03), b.clone().addScaledVector(dir, 0.03), rr),
        LIFE.acidMaker,
      );
    } else {
      acidKind.add(capsule(a, b, rr), LIFE.acidMaker);
    }
    flagellum(
      acidKind,
      b,
      dir
        .clone()
        .add(V(R2() - 0.5, R2() - 0.5, R2() - 0.5).multiplyScalar(0.6))
        .normalize(),
      0.18 + R2() * 0.1,
      0xb9553c,
      R2,
    );
  }
  parts['acid-makers'].add(acidKind.mesh(lifeMaterial(uniforms['acid-makers'], 0.5), 'acid-makers'));

  // the acids: the first few gather between the acid-makers and the acetogens; as they pile up they fill the whole drop
  const R3 = rng(109);
  const ACID_MAX = 64;
  const acids = new Kind();
  for (let i = 0; i < ACID_MAX; i++) {
    const spread = Math.min(1, i / ACID_MAX + 0.08);
    const y = Y0 + 0.14 + R3() * (0.3 + 0.75 * spread);
    const rad = (0.22 + 1.62 * spread) * Math.sqrt(R3());
    const a = R3() * Math.PI * 2;
    const p = V(0.02 + Math.cos(a) * rad * 1.15, y, Math.sin(a) * rad * 0.6);
    const lim = domeR(y) * 0.82;
    const L = Math.hypot(p.x, p.z);
    if (L > lim) p.multiplyScalar(lim / L).setY(y);
    acids.next(R3());
    molecule(acids, p, FATTY_ACID.atoms, FATTY_ACID.bonds, 0.042, randomQuat(R3));
  }
  const acidMesh = acids.mesh(lifeMaterial(uniforms['fatty-acid-pool'], 0.42), 'fatty-acid-pool');
  parts['fatty-acid-pool'].add(acidMesh);
  // the pool may fill the whole drop: its box is the drop's, and so the overview frames the drop and not only what swims in it
  parts['fatty-acid-pool'].add(
    extentMarker(new THREE.Box3(V(-DROP.R - 0.1, 0, -DROP.R - 0.1), V(DROP.R + 0.1, Y0 + DROP.H + 0.03, DROP.R + 0.1))),
  );
  const acidIndexEach = acidMesh.geometry.index!.count / ACID_MAX;

  // acetogens: long and slim, a single beating flagellum, close to the methanogens they feed
  const R4 = rng(113);
  const aceto = new Kind();
  const acetoSpots = [
    V(0.34, 0.8, -0.1),
    V(0.58, 0.46, 0.34),
    V(0.44, 0.34, -0.42),
    V(0.66, 0.96, 0.24),
    V(0.26, 0.5, 0.12),
    V(0.82, 0.68, -0.34),
    V(0.62, 0.22, 0.02),
  ];
  acetoSpots.forEach((p, i) => {
    const dir = V(0.6 + R4() - 0.5, R4() - 0.5, R4() - 0.5).normalize();
    const L = 0.26 + R4() * 0.08;
    const a = p.clone().addScaledVector(dir, -L / 2);
    const b = p.clone().addScaledVector(dir, L / 2);
    aceto.next(i * 0.173);
    aceto.add(capsule(a, b, 0.036), LIFE.acetogen);
    flagellum(aceto, a, dir.clone().negate(), 0.3 + R4() * 0.1, 0x5f3a86, R4, 0.0065);
    // the hydrogen it hands over: tiny pale specks towards the methanogen
    for (let k = 0; k < 3; k++) {
      aceto.add(
        ball(b.clone().add(V(0.05 + k * 0.05, (R4() - 0.5) * 0.08, (R4() - 0.5) * 0.08)), 0.012, 6, 4),
        LIFE.hydrogen,
      );
    }
  });
  parts.acetogens.add(aceto.mesh(lifeMaterial(uniforms.acetogens, 0.5), 'acetogens'));

  // the methanogens, the star: packets of round cells, as a raspberry; long sheathed filaments, cell after cell. Not bacteria: another branch of life, and the shapes they are known by
  const R5 = rng(127);
  const metha = new Kind();
  const packets: { c: THREE.Vector3; R: number }[] = [
    { c: V(1.1, 0.56, 0.06), R: 0.3 },
    { c: V(1.56, 0.42, -0.34), R: 0.25 },
    { c: V(1.34, 0.84, -0.42), R: 0.2 },
    { c: V(1.56, 0.3, 0.42), R: 0.22 },
  ];
  packets.forEach((pk, i) => {
    metha.next(i * 0.23);
    const cells = Math.round(pk.R * 96);
    const placed: THREE.Vector3[] = [];
    for (let k = 0; k < cells * 3 && placed.length < cells; k++) {
      const d = V(R5() - 0.5, R5() - 0.5, R5() - 0.5).normalize();
      const q = pk.c.clone().addScaledVector(d, pk.R * (0.45 + 0.55 * Math.cbrt(R5())));
      if (placed.some((o) => o.distanceTo(q) < 0.062)) continue;
      placed.push(q);
      const rc = 0.058 + R5() * 0.014;
      const shade = k % 3 === 0 ? LIFE.methanogenDark : LIFE.methanogen;
      metha.add(ball(q, rc, 11, 8), shade);
    }
  });
  // filaments: a sheath of cells end to end
  const filaments: [THREE.Vector3, THREE.Vector3, number][] = [
    [V(0.86, 0.18, -0.2), V(1.98, 0.32, 0.12), 0.5],
    [V(0.98, 0.98, 0.3), V(1.82, 0.72, 0.46), 0.8],
    [V(0.92, 0.28, 0.5), V(1.5, 0.62, 0.72), 0.2],
  ];
  filaments.forEach(([a, b, ph]) => {
    metha.next(ph);
    const count = Math.round(a.distanceTo(b) / 0.105);
    const bend = V(0, 0.09, 0.1);
    const at = (t: number) =>
      a
        .clone()
        .lerp(b, t)
        .addScaledVector(bend, Math.sin(t * Math.PI));
    for (let i = 0; i < count; i++) {
      const p0 = at((i + 0.1) / count);
      const p1 = at((i + 0.9) / count);
      metha.add(capsule(p0, p1, 0.031, 10, 3), i % 2 ? LIFE.methanogen : LIFE.methanogenDark);
    }
    // the sheath: a thin pale tube round the chain
    const path: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) path.push(at(i / 18));
    void path;
  });
  const methaMat = lifeMaterial(uniforms.methanogens, 0.42);
  parts.methanogens.add(metha.mesh(methaMat, 'methanogens'));

  // the bubble: gas leaving, up through the liquid to the dome. Its molecules inside it. It rises by a uniform: the column it runs in is its box
  const R6 = rng(131);
  const BUBBLES = 6;
  const bubbleGroup = parts['gas-bubble'];
  const riseU = { value: 0 };
  const bubbleAlive = { value: 1 };
  const bubbleAt: THREE.Vector3[] = [];
  const shellGeo: THREE.BufferGeometry[] = [];
  const inside = new Kind();
  const columnBase = V(1.12, 0.92, 0.0);
  const columnH = 0.56;
  for (let i = 0; i < BUBBLES; i++) {
    const c = columnBase.clone().add(V((R6() - 0.5) * 0.44, (i / BUBBLES) * columnH, (R6() - 0.5) * 0.4));
    bubbleAt.push(c);
    const r = 0.075 + 0.016 * ((i * 7) % 3);
    const g = new THREE.SphereGeometry(r, 20, 14);
    g.translate(c.x, c.y, c.z);
    shellGeo.push(g);
    inside.next(i * 0.17);
    molecule(inside, c.clone().add(V(-0.022, 0.015, 0)), METHANE.atoms, METHANE.bonds, 0.03, randomQuat(R6));
    if (i % 2 === 0)
      molecule(
        inside,
        c.clone().add(V(0.03, -0.022, 0.012)),
        CARBON_DIOXIDE.atoms,
        CARBON_DIOXIDE.bonds,
        0.024,
        randomQuat(R6),
      );
  }
  const rise = (m: THREE.MeshStandardMaterial, key: string) => {
    patchMaterial(m, `bubble-rise-${key}`, (shader) => {
      shader.uniforms.uRise = riseU;
      shader.uniforms.uAlive = bubbleAlive;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uRise; uniform float uAlive; attribute float aSlot;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float rs = fract( uRise * 0.36 + aSlot * ${(1 / BUBBLES).toFixed(5)} ) ;
           float base = aSlot * ${(1 / BUBBLES).toFixed(5)};
           transformed.y += ( rs - base ) * ${columnH.toFixed(3)};
           transformed.x += 0.012 * sin( rs * 18.0 + aSlot );`,
        );
    });
  };
  const slot = (g: THREE.BufferGeometry, values: Float32Array) =>
    g.setAttribute('aSlot', new THREE.BufferAttribute(values, 1));
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: LIFE.bubble,
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    envMapIntensity: 1.8,
    depthWrite: false,
    name: 'bubble-shell',
  });
  bubbleMat.userData.noShare = true;
  rise(bubbleMat, 'shell');
  const shellMerged = (() => {
    const pos: number[] = [];
    const nor: number[] = [];
    const idx: number[] = [];
    const slots: number[] = [];
    let base = 0;
    shellGeo.forEach((g, i) => {
      const p = g.attributes.position;
      const n = g.attributes.normal;
      for (let k = 0; k < p.count; k++) {
        pos.push(p.getX(k), p.getY(k), p.getZ(k));
        nor.push(n.getX(k), n.getY(k), n.getZ(k));
        slots.push(i);
      }
      const ix = g.index!;
      for (let k = 0; k < ix.count; k++) idx.push(ix.getX(k) + base);
      base += p.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    slot(out, new Float32Array(slots));
    out.setIndex(idx);
    return out;
  })();
  const bubbleMesh = new THREE.Mesh(shellMerged, bubbleMat);
  bubbleMesh.name = 'gas-bubble-shells';
  bubbleMesh.renderOrder = 5;
  bubbleMesh.frustumCulled = false;
  bubbleMesh.userData.noShadow = true;
  bubbleMesh.castShadow = false;
  bubbleGroup.add(bubbleMesh);
  const insideMesh = inside.mesh(lifeMaterial(uniforms['gas-bubble'], 0.4), 'gas-bubble-molecules');
  // each vertex of the molecules goes with its bubble: `aPhase.x` holds i·0.17
  {
    const ph = insideMesh.geometry.attributes.aPhase;
    const v = new Float32Array(ph.count);
    for (let i = 0; i < ph.count; i++) v[i] = Math.round(ph.getX(i) / 0.17);
    slot(insideMesh.geometry, v);
  }
  rise(insideMesh.material as THREE.MeshStandardMaterial, 'inside');
  bubbleGroup.add(insideMesh);
  bubbleGroup.add(extentMarker(new THREE.Box3(V(0.88, 0.85, -0.3), V(1.42, columnBase.y + columnH + 0.16, 0.3))));

  // the sulphate-reducers: yellow commas, at the back, where H₂S begins
  const R7 = rng(137);
  const sul = new Kind();
  for (let i = 0; i < 7; i++) {
    const c = V(-1.02 + i * 0.22 + R7() * 0.1, 0.16 + R7() * 0.4, -0.72 - R7() * 0.34);
    const a0 = R7() * 6.28;
    const span = 1.9;
    const rad = 0.13;
    const n = 12;
    const u = V(Math.cos(a0), R7() - 0.5, Math.sin(a0)).normalize();
    const w = new THREE.Vector3(R7() - 0.5, 1, R7() - 0.5).cross(u).normalize();
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= n; k++) {
      const t = -span / 2 + (span * k) / n;
      pts.push(
        c
          .clone()
          .addScaledVector(u, Math.cos(t) * rad)
          .addScaledVector(w, Math.sin(t) * rad),
      );
    }
    sul.next(i * 0.19);
    sul.add(
      tubeThrough(pts, (t) => 0.034 * Math.pow(Math.sin(Math.PI * Math.min(0.97, 0.03 + t)), 0.3), 10),
      LIFE.sulphate,
    );
    sul.add(ball(pts[0], 0.016, 8, 5), LIFE.sulphate);
    sul.add(ball(pts[n], 0.016, 8, 5), LIFE.sulphate);
    flagellum(
      sul,
      pts[n],
      pts[n]
        .clone()
        .sub(pts[n - 1])
        .normalize(),
      0.2,
      0xb79c26,
      R7,
      0.0055,
    );
  }
  parts['sulphate-reducers'].add(sul.mesh(lifeMaterial(uniforms['sulphate-reducers'], 0.5), 'sulphate-reducers'));

  // the buffer: bicarbonate, plenty of it in a healthy drop, along the front and low. The acids eat it: its count is the model's alkalinity
  const R8 = rng(139);
  const BUFFER_MAX = 44;
  const buffer = new Kind();
  for (let i = 0; i < BUFFER_MAX; i++) {
    const y = Y0 + 0.1 + R8() * 0.32;
    const p = V(-1.75 + 3.3 * ((i + R8()) / BUFFER_MAX), y, 0.36 + R8() * 0.72);
    const lim = domeR(y) * 0.92;
    const L = Math.hypot(p.x, p.z);
    if (L > lim) p.multiplyScalar(lim / L).setY(y);
    buffer.next(R8());
    molecule(buffer, p, BICARBONATE.atoms, BICARBONATE.bonds, 0.042, randomQuat(R8));
  }
  // shuffled by the seed along x: a thinner buffer loses its molecules evenly across the drop
  const bufMesh = buffer.mesh(lifeMaterial(uniforms['bicarbonate-buffer'], 0.4), 'bicarbonate-buffer');
  parts['bicarbonate-buffer'].add(bufMesh);
  const bufIndexEach = bufMesh.geometry.index!.count / BUFFER_MAX;

  // ammonium: what makes the effluent a fertiliser
  const R9 = rng(149);
  const amm = new Kind();
  for (let i = 0; i < 18; i++) {
    const y = Y0 + 0.11 + R9() * 0.42;
    const p = V(0.2 + R9() * 1.55, y, 0.28 + R9() * 0.86);
    const lim = domeR(y) * 0.9;
    const L = Math.hypot(p.x, p.z);
    if (L > lim) p.multiplyScalar(lim / L).setY(y);
    amm.next(R9());
    molecule(amm, p, AMMONIUM_ION.atoms, AMMONIUM_ION.bonds, 0.048, randomQuat(R9));
  }
  parts.ammonium.add(amm.mesh(lifeMaterial(uniforms.ammonium, 0.4), 'ammonium'));

  // the germs that survive: an egg with a thick wall, a spore-carrying rod. Few and still, and untouched by the rest
  const R10 = rng(151);
  const germs = new Kind();
  const eggNoise = noise3(77);
  const eggs: [THREE.Vector3, number][] = [
    [V(1.5, 0.34, -0.98), 0.17],
    [V(0.72, 0.2, -1.12), 0.14],
    [V(-1.45, 0.17, 0.82), 0.13],
  ];
  eggs.forEach(([c, s], i) => {
    germs.next(i * 0.31);
    const outer = new THREE.IcosahedronGeometry(1, 8);
    const p = outer.attributes.position;
    const q = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      q.fromBufferAttribute(p, k).normalize();
      const bump = 1 + 0.05 * (eggNoise(q.x * 8 + i, q.y * 8, q.z * 8) - 0.5);
      p.setXYZ(k, c.x + q.x * s * 1.4 * bump, c.y + q.y * s * bump, c.z + q.z * s * bump);
    }
    outer.deleteAttribute('uv');
    outer.computeVertexNormals();
    germs.add(outer, LIFE.germShell);
    germs.add(
      (() => {
        const g = new THREE.SphereGeometry(s * 0.72, 12, 9);
        g.scale(1.34, 0.92, 0.92);
        g.translate(c.x, c.y + s * 0.34, c.z + s * 0.45);
        return g;
      })(),
      LIFE.germ,
    );
  });
  for (let i = 0; i < 6; i++) {
    germs.next(0.5 + i * 0.07);
    const c = V(0.86 + R10() * 1.0, 0.16 + R10() * 0.4, -0.76 - R10() * 0.42);
    const d = V(R10() - 0.5, R10() - 0.5, R10() - 0.5).normalize();
    const a = c.clone().addScaledVector(d, -0.07);
    const b = c.clone().addScaledVector(d, 0.07);
    germs.add(capsule(a, b, 0.038), LIFE.germ);
    germs.add(ball(b.clone().addScaledVector(d, 0.022), 0.03, 10, 7), LIFE.germShell);
  }
  parts['surviving-germs'].add(germs.mesh(lifeMaterial(uniforms['surviving-germs'], 0.55), 'surviving-germs'));

  // ---- motes in the liquid, for its depth. Decoration
  const moteN = 240;
  const mp = new Float32Array(moteN * 3);
  const Rm = rng(157);
  for (let i = 0; i < moteN; i++) {
    const y = Y0 + 0.03 + Rm() * (DROP.H - 0.12);
    const rad = domeR(y) * 0.96 * Math.sqrt(Rm());
    const a = Rm() * 6.283;
    mp[i * 3] = Math.cos(a) * rad;
    mp[i * 3 + 1] = y;
    mp[i * 3 + 2] = Math.sin(a) * rad;
  }
  const moteG = new THREE.BufferGeometry();
  moteG.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(
    moteG,
    new THREE.PointsMaterial({
      size: 0.022,
      color: 0xf8f3dc,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  motes.name = 'motes';
  motes.frustumCulled = false;
  motes.renderOrder = 3;
  stage.add(motes);

  // ---- anchors
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: DropPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(parts[id], x, y, z, `${id}-label`);
  };
  at('food-particle', -1.86, 0.5, 0.26);
  at('hydrolysers', -1.32, 1.12, 0.3);
  at('acid-makers', -0.34, 0.92, 0.3);
  at('fatty-acid-pool', 0.08, 0.3, 0.42);
  at('acetogens', 0.6, 1.02, 0.24);
  at('methanogens', 1.24, 0.72, 0.28);
  at('gas-bubble', 1.2, 1.44, 0.1);
  at('bicarbonate-buffer', -0.7, 0.26, 0.92);
  at('ammonium', 1.16, 0.3, 0.76);
  at('sulphate-reducers', -0.7, 0.42, -0.9);
  at('surviving-germs', 1.5, 0.52, -0.98);

  // ---- register
  const FRAMING: Partial<Record<DropPart, PartFraming>> = {
    'fatty-acid-pool': { frame: new THREE.Box3(V(-0.45, 0.15, -0.3), V(0.5, 0.75, 0.45)) },
    'bicarbonate-buffer': { frame: new THREE.Box3(V(-0.9, 0.05, 0.4), V(0.2, 0.45, 1.05)), viewDir: viewFrom(16, -8) },
    ammonium: { frame: new THREE.Box3(V(0.5, 0.05, 0.4), V(1.5, 0.5, 1.05)), viewDir: viewFrom(16, 12) },
    // from behind the drop: they keep to its back
    'sulphate-reducers': { viewDir: viewFrom(20, -168) },
    'surviving-germs': { frame: new THREE.Box3(V(0.55, 0.08, -1.32), V(2.0, 0.78, -0.42)), viewDir: viewFrom(22, 158) },
    'gas-bubble': { viewDir: viewFrom(10, 8) },
    methanogens: { frame: new THREE.Box3(V(0.72, 0.1, -0.7), V(2.05, 1.1, 0.75)), viewDir: viewFrom(14, 14) },
    hydrolysers: { viewDir: viewFrom(14, -14) },
    'food-particle': { viewDir: viewFrom(14, -14) },
  };
  const registry = new PartRegistry();
  for (const id of DROP_PARTS) {
    registry.add(id, parts[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }

  // ---- flows: the carbon, along the chain
  const flows = new FlowDots(90, 0.05);
  scene.add(flows.object);
  const chain1 = flows.add({
    points: [V(-1.2, 0.62, 0.2), V(-0.9, 0.7, 0.26), V(-0.4, 0.66, 0.24)],
    color: 0xc98a3a,
    spacing: 0.12,
  });
  const chain2 = flows.add({
    points: [V(-0.4, 0.66, 0.24), V(0.02, 0.5, 0.3), V(0.44, 0.62, 0.2)],
    color: 0xc23a3a,
    spacing: 0.12,
  });
  const chain3 = flows.add({
    points: [V(0.44, 0.62, 0.2), V(0.8, 0.62, 0.16), V(1.1, 0.6, 0.12)],
    color: 0x7b4ba6,
    spacing: 0.1,
  });
  const chain4 = flows.add({
    points: [V(1.1, 0.66, 0.1), V(1.12, 1.0, 0.04), V(1.14, 1.5, 0)],
    color: 0x2f78dc,
    spacing: 0.1,
  });

  let clock = 0;
  let riseT = 0;
  const shown = { acid: 0, buffer: 0 };
  const halofill = halo.material as THREE.MeshBasicMaterial;
  const mod: DropScene = {
    id: 'slurry',
    scene,
    registry,
    dome,
    backdrop,
    uniforms,
    flows,
    shown,
    acidMax: ACID_MAX,
    bufferMax: BUFFER_MAX,
    motes,
    hotspots: hotspots(HOTSPOTS, anchors),
    home: { position: new THREE.Vector3(0.05, 2.1, 6.5), target: new THREE.Vector3(0, 0.62, 0) },
    minDistance: 0.3,
    maxDistance: 16,
    near: 0.02,
    far: 70,
    homePadding: 0.72,
    declutter: true,
    update(s, dt, view) {
      const now = partsNow(registry);
      const d = dt * view.slowMo;
      clock += d;
      // the drop's colour is the model's
      dropColor.value.setRGB(s.dropRgb[0], s.dropRgb[1], s.dropRgb[2], THREE.SRGBColorSpace);
      halofill.color.copy(dropColor.value);
      dome.visible = !now.exploded;
      backdrop.visible = !now.exploded;
      dropFloor.visible = !now.exploded;
      motes.visible = !now.exploded;
      for (const id of DROP_PARTS) uniforms[id].uTime.value = clock;

      // how lively each is: its rate through the chain, against the measured day. Nothing below is a measurement of how an organism moves: the amplitude only says « working » or « not »
      // a methanogen at the measured pH of 6.5 is well alive though its rate factor stands near one half (ADM1's window): the colour says alive or dying, the rates say how fast
      const alive = Math.min(1, s.methanogenActivity / 0.35);
      const hyd = Math.min(1.6, s.hydrolysisRate / 0.4) * s.hydrolysisActivity;
      const acidOn = Math.min(1.8, s.acidRate / 0.5);
      const eat = Math.min(1.6, s.uptakeRate / 0.5) * alive;
      uniforms.hydrolysers.uAmp.value = 0.004 + 0.016 * hyd;
      uniforms.hydrolysers.uFlick.value = hyd;
      uniforms['acid-makers'].uAmp.value = 0.008 + 0.03 * acidOn;
      uniforms['acid-makers'].uFlick.value = 0.4 + acidOn;
      uniforms.acetogens.uAmp.value = 0.006 + 0.018 * eat;
      uniforms.acetogens.uFlick.value = 0.2 + eat;
      uniforms.acetogens.uLife.value = 0.35 + 0.65 * alive;
      // the star dims as the pH leaves it: blue when it works, grey when it stops
      uniforms.methanogens.uGlow.value = 0.04 + 0.55 * eat;
      uniforms.methanogens.uLife.value = 0.08 + 0.92 * alive;
      uniforms.methanogens.uAmp.value = 0.002 + 0.008 * eat;

      // the pools are the model's: acids and buffer as counts on screen
      const acidN = Math.max(5, Math.min(ACID_MAX, Math.round(5 + 59 * (1 - Math.exp(-s.acidsGL / 2.5)))));
      const bufN = Math.max(0, Math.min(BUFFER_MAX, Math.round((BUFFER_MAX * Math.max(0, s.alkalinityMeq)) / 24)));
      shown.acid = acidN;
      shown.buffer = bufN;
      acidMesh.geometry.setDrawRange(0, acidIndexEach * acidN);
      bufMesh.geometry.setDrawRange(0, bufIndexEach * bufN);

      // the bubbles rise as fast as the methane comes
      const gas = Math.min(1.4, s.uptakeRate / 0.5) * alive;
      riseT += d * gas;
      riseU.value = riseT;
      bubbleAlive.value = gas > 0.02 ? 1 : 0;
      const bubblesThere = gas > 0.02 || registry.get('gas-bubble')!.display !== 'solid';
      bubbleMesh.scale.setScalar(bubblesThere ? 1 : 0.0001);
      insideMesh.scale.setScalar(bubblesThere ? 1 : 0.0001);

      const showFlows = view.schematic && !now.hidden && !now.exploded;
      flows.object.visible = showFlows;
      if (showFlows) {
        flows.set(chain1, 0.3 * view.slowMo * Math.max(0.03, hyd), hyd > 0.02 ? 1 : 0);
        flows.set(chain2, 0.3 * view.slowMo * Math.max(0.03, acidOn), acidOn > 0.02 ? 1 : 0);
        flows.set(chain3, 0.3 * view.slowMo * Math.max(0.03, eat), eat > 0.02 ? 1 : 0);
        flows.set(chain4, 0.3 * view.slowMo * Math.max(0.03, gas), gas > 0.02 ? 1 : 0);
        flows.step(dt);
      }
    },
  };
  return mod;
}
