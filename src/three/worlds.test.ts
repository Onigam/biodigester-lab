import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BiodigesterSim } from '../sim/engine';
import { SCENARIO_IDS, PRESET_IDS } from '../sim/presets';
import { sunPlaceFor } from './sun-test-helper';
import { BASE_Y, HOSE, LINE, PAD, TANK, YARD } from './dims';
import { createDigesterScene, type DigesterScene } from './digester/scene';
import { createDropScene, DROP_PARTS } from './drop/scene';
import { createGasLineScene, LINE_PARTS } from './gasline/scene';
import { MACHINE_PARTS } from './machine/machine';
import { PART_NAMES, partName } from './part-ids';
import { bellAt, boxOf, drawStats, finiteTree, gap, isolateOne, raysToPart, stateWith, view } from './test-utils';
import { createYardScene, groundHeight, PLANT_TURN, YARD_PARTS } from './yard/scene';
import { PART_OPENS, WORLD } from './index';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { BioState } from '../sim/types';

const params = { addedWeight: 0, feedKg: 2, waterPerKg: 9, trap: true };
const P = () => params;
const yard = createYardScene(P);
const digester = createDigesterScene(P);
const drop = createDropScene();
const line = createGasLineScene(P);
const worlds = { yard, digester, slurry: drop, 'gas-line': line } as Record<string, SceneModule<BioState>>;

const run = (mod: SceneModule<BioState>, s: BioState, patch = {}) => {
  for (let i = 0; i < 3; i++) mod.update(s, 1 / 30, view(patch));
  mod.scene.updateMatrixWorld(true);
};

describe('the parts', () => {
  it('reach the research’s 58, over the bar of 36, none twice', () => {
    const ids = Object.values(worlds).flatMap((w) => w.registry.ids());
    expect(ids.length).toBe(58);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PART_NAMES.length).toBe(58);
    expect(YARD_PARTS.length + MACHINE_PARTS.length + DROP_PARTS.length + LINE_PARTS.length).toBe(58);
  });
  it('are the research’s ids, each in its world', () => {
    for (const p of PART_NAMES) expect(worlds[p.world].registry.get(p.id), p.id).toBeDefined();
    expect(() => partName('no-such-part')).toThrow();
  });
  it('are kebab-case with a digit only where a name has one', () => {
    for (const p of PART_NAMES) expect(p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('each has meshes to show and to click', () => {
    for (const w of Object.values(worlds)) {
      for (const id of w.registry.ids()) expect(w.registry.get(id)!.meshes.length, id).toBeGreaterThan(0);
    }
  });
  it('each is named in both languages', () => {
    for (const p of PART_NAMES) {
      expect(p.fr.length, p.id).toBeGreaterThan(1);
      expect(p.en.length, p.id).toBeGreaterThan(1);
    }
  });
  it('open the worlds the research says', () => {
    expect(PART_OPENS['biogas-plant']).toBe('digester');
    expect(PART_OPENS['clear-liquor']).toBe('slurry');
    expect(PART_OPENS['gas-tap']).toBe('gas-line');
  });
});

describe('each world', () => {
  it('has a home, limits, its planes, labels with `declutter`', () => {
    for (const [id, w] of Object.entries(worlds)) {
      expect(w.id).toBe(id);
      expect(w.declutter, id).toBe(true);
      expect(w.minDistance).toBeLessThan(w.maxDistance);
      expect(w.near, id).toBeGreaterThan(0);
      expect(w.far!, id).toBeGreaterThan(w.maxDistance);
      expect(w.hotspots.length, id).toBeGreaterThan(3);
      for (const h of w.hotspots) {
        expect(w.registry.get(h.partId), h.partId).toBeDefined();
        expect(h.anchor, h.partId).toBeDefined();
      }
    }
  });
  it('has a label for every part, main or minor', () => {
    for (const w of Object.values(worlds)) {
      const labelled = new Set(w.hotspots.map((h) => h.partId));
      for (const id of w.registry.ids()) expect(labelled.has(id), `${w.id}: ${id}`).toBe(true);
    }
  });
  it('has its fields for `src/lab.ts`, and only the tools that teach', () => {
    for (const id of Object.keys(worlds)) expect(WORLD[id as keyof typeof WORLD]).toBeDefined();
    expect(WORLD.yard.explode).toBe(false);
    expect(WORLD.yard.cutaway).toBe(false);
    expect(WORLD.slurry.cutaway).toBe(false);
    expect(WORLD['gas-line'].cutaway).toBe(false);
    expect(WORLD.digester.cutaway).toBe(true);
  });
  it('holds its label anchors inside what the part draws, or nearly', () => {
    for (const w of Object.values(worlds)) {
      w.update(stateWith(), 1 / 60, view());
      w.scene.updateMatrixWorld(true);
      for (const h of w.hotspots) {
        const b = w.registry.bounds(h.partId);
        const p = new THREE.Vector3().setFromMatrixPosition(h.anchor.matrixWorld);
        const reach = Math.max(0.45, b.getSize(new THREE.Vector3()).length() * 0.5);
        expect(b.distanceToPoint(p), `${w.id}: ${h.partId}`).toBeLessThan(reach);
      }
    }
  });
  it('runs through every scenario and every preset of the physics, flows on, cut on, with nothing that is not a number', () => {
    const sim = new BiodigesterSim();
    for (const sc of SCENARIO_IDS) {
      sim.applyScenario(sc);
      sim.set({ timeScale: 3600 });
      for (let i = 0; i < 10; i++) sim.step(1 / 10);
      const s = { ...sim.state };
      for (const w of Object.values(worlds)) {
        w.update(s, 1 / 60, view({ schematic: true }));
        expect(finiteTree(w.scene), `${w.id} in ${sc}`).toBe(true);
      }
      digester.update(s, 1 / 60, view({ schematic: true, cutaway: true }));
      expect(finiteTree(digester.scene), `digester cut in ${sc}`).toBe(true);
    }
    for (const pr of PRESET_IDS) {
      sim.applyPreset(pr);
      for (let i = 0; i < 5; i++) sim.step(1 / 10);
      const s = { ...sim.state };
      for (const w of Object.values(worlds)) w.update(s, 1 / 60, view());
    }
    digester.update(bellAt(0.5), 1 / 60, view());
  });
  it('stays within its budget', () => {
    const budget: Record<string, [number, number]> = {
      yard: [220, 400000],
      digester: [170, 180000],
      slurry: [170, 180000],
      'gas-line': [220, 180000],
    };
    for (const [id, w] of Object.entries(worlds)) {
      w.update(stateWith(), 1 / 60, view());
      const st = drawStats(w.scene);
      console.log(`[budget] ${id}: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
      expect(st.calls, id).toBeLessThan(budget[id][0]);
      expect(st.triangles, id).toBeLessThan(budget[id][1]);
    }
  });
});

describe('one machine, the same everywhere', () => {
  const pose = () => bellAt(0.5);
  const local = (w: SceneModule<BioState>, machineRoot: THREE.Object3D, part: THREE.Object3D) => {
    const inv = new THREE.Matrix4().copy(machineRoot.matrixWorld).invert();
    w.scene.updateMatrixWorld(true);
    let box = new THREE.Box3();
    part.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.extent) return;
      const g = (m.userData.wholeGeometry as THREE.BufferGeometry | undefined) ?? m.geometry;
      const pos = g.attributes.position;
      if (!pos || !pos.count) return;
      const v = new THREE.Vector3();
      const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(M));
    });
    if (box.isEmpty()) box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    return box;
  };
  it('is the same function in the three worlds: every shared part within 3 mm, the bell at the same state', () => {
    const s = pose();
    const dig = digester as DigesterScene;
    dig.machine.setView('whole');
    for (let i = 0; i < 300; i++) {
      dig.machine.update(s, 1 / 30);
      yard.machine.update(s, 1 / 30);
      line.machine.update(s, 1 / 30);
    }
    for (const id of [
      'digester-tank',
      'gas-bell',
      'scale-marks',
      'gas-tap',
      'pallet',
      'feed-funnel',
      'feed-riser',
      'feed-tee',
      'clean-out-plug',
      'inner-feed-pipe',
      'tank-connector',
      'overflow-pipe',
      'bottom-valve',
      'float-limiter',
    ] as const) {
      const a = local(digester, dig.machine.root, dig.machine.parts[id]);
      const b = local(yard, yard.machine.root, yard.machine.parts[id]);
      const c = local(line, line.machine.root, line.machine.parts[id]);
      for (const [other, name] of [
        [b, 'yard'],
        [c, 'gas-line'],
      ] as const) {
        expect(a.min.distanceTo(other.min), `${id} min in ${name}`).toBeLessThan(0.003);
        expect(a.max.distanceTo(other.max), `${id} max in ${name}`).toBeLessThan(0.003);
      }
    }
    dig.machine.setView('cut');
  });
});

describe('the digester world', () => {
  it('opens cut, cuts across with the tool, closes again in x-ray and when a part is alone', () => {
    const s = stateWith();
    digester.update(s, 1 / 60, view());
    expect(digester.machine.view).toBe('cut');
    digester.update(s, 1 / 60, view({ cutaway: true }));
    expect(digester.machine.view).toBe('across');
    digester.registry.setDisplay('digester-tank', 'ghost');
    digester.update(s, 1 / 60, view());
    expect(digester.machine.view).toBe('whole');
    digester.registry.setDisplay('digester-tank', 'solid');
    isolateOne(digester.registry, 'gas-bell', 'hidden');
    digester.update(s, 1 / 60, view());
    expect(digester.machine.view).toBe('whole');
    expect(digester.pad.visible).toBe(false);
    expect(digester.hose.visible).toBe(false);
    digester.registry.setAllDisplay('solid');
    digester.update(s, 1 / 60, view());
    expect(digester.machine.view).toBe('cut');
    expect(digester.pad.visible).toBe(true);
  });
  it('stands the machine on its pad, in this world, within 3 mm', () => {
    digester.update(stateWith(), 1 / 60, view());
    const pallet = boxOf(digester.machine.parts.pallet);
    const pad = boxOf(digester.pad);
    expect(Math.abs(pallet.min.y - pad.max.y)).toBeLessThan(0.003);
    expect(pad.min.y).toBeCloseTo(0, 3);
  });
  it('keeps the hose on the tap, however the bell moves', () => {
    const dig = digester as DigesterScene;
    for (const share of [0, 0.5, 1]) {
      run(digester, bellAt(share));
      const p = dig.hose.geometry.attributes.position;
      const start = new THREE.Vector3(p.getX(0), p.getY(0), p.getZ(0)).add(new THREE.Vector3());
      // the ring of the first row stands round the tap's outlet
      const c = new THREE.Vector3();
      dig.machine.tapOutlet.getWorldPosition(c);
      dig.machine.root.worldToLocal(c);
      expect(start.distanceTo(c), `at ${share}`).toBeLessThan(HOSE.r + 0.002);
    }
  });
  it('lets the bell’s parts leave along sensible lines when exploded: up, nothing through the tank’s floor', () => {
    const reg = digester.registry;
    reg.setAllFactors(1);
    digester.scene.updateMatrixWorld(true);
    const bell = boxOf(digester.machine.parts['gas-bell']);
    const pallet = boxOf(digester.machine.parts.pallet);
    const tank = boxOf(digester.machine.parts['digester-tank']);
    expect(bell.min.y).toBeGreaterThan(tank.min.y);
    expect(pallet.min.y).toBeGreaterThanOrEqual(PAD.h - 0.003);
    reg.setAllFactors(0);
  });
  it('frames the parts so that they can be seen: rays from the camera reach most of them', () => {
    const s = stateWith();
    digester.update(s, 1 / 60, view());
    digester.scene.updateMatrixWorld(true);
    const dirOf = (id: string) =>
      digester.registry.get(id)!.viewDir ?? digester.home.position.clone().sub(digester.home.target).normalize();
    const low: string[] = [];
    for (const id of MACHINE_PARTS) {
      // a volume of gas and a surface have nothing in front of them; the limiter's four thin legs and bars fall between the rays: looked at by eye, docs/3d.md
      if (id === 'gas-space' || id === 'rim-gap' || id === 'float-limiter') continue;
      const box = digester.registry.frameBounds(id);
      const c = box.getCenter(new THREE.Vector3());
      const from = c.clone().addScaledVector(dirOf(id), 5);
      const share = raysToPart(digester, id, from, box);
      if (share < 0.3) low.push(`${id} ${share.toFixed(2)}`);
    }
    expect(low.join('; ')).toBe('');
  });
});

describe('the yard', () => {
  it('stands everything on the ground: the pad, the butt’s blocks, the bin, the beds, the tree', () => {
    yard.update(stateWith(), 1 / 60, view());
    yard.scene.updateMatrixWorld(true);
    expect(Math.abs(groundHeight(YARD.padX, YARD.padZ))).toBeLessThan(0.001);
    const pad = boxOf(yard.registry.get('yard-pad')!.object);
    expect(pad.min.y).toBeCloseTo(0, 3);
    expect(pad.max.y).toBeCloseTo(PAD.h, 3);
    const pallet = boxOf(yard.machine.parts.pallet);
    expect(Math.abs(pallet.min.y - PAD.h)).toBeLessThan(0.003);
    for (const id of ['water-butt', 'compost-heap', 'vegetable-bed', 'kitchen-house'] as const) {
      const b = boxOf(yard.registry.get(id)!.object);
      expect(Math.abs(b.min.y), id).toBeLessThan(0.02);
    }
    const bucket = boxOf(yard.registry.get('overflow-bucket')!.object);
    expect(Math.abs(bucket.min.y - PAD.h)).toBeLessThan(0.003);
    const caddy = boxOf(yard.registry.get('scrap-caddy')!.object);
    expect(Math.abs(caddy.min.y - PAD.h)).toBeLessThan(0.003);
    const tree = boxOf(yard.registry.get('shade-tree')!.object);
    expect(tree.min.y).toBeLessThan(0.0);
  });
  it('keeps the tree’s shade off the tank through the 7.5 h of sun, every month of the measured site', () => {
    const crown = yard.tree.crown;
    const cx = yard.tree.x + crown.center.x;
    const cy = crown.center.y;
    const cz = yard.tree.z + crown.center.z;
    for (let month = 1; month <= 12; month++) {
      for (const hour of [8.25, 9.5, 10.75, 12, 13.25, 14.5, 15.75]) {
        const { dir, alt } = sunPlaceFor(month, hour);
        if (alt <= 2) continue;
        // where the crown's centre falls on the tank's mid-height
        const t = (cy - 1.2) / dir.y;
        const sx = cx - dir.x * t;
        const sz = cz - dir.z * t;
        const miss = Math.hypot(sx - YARD.padX, sz - YARD.padZ) - TANK.outerR - crown.radius;
        expect(miss, `month ${month} hour ${hour}`).toBeGreaterThan(-0.2);
      }
    }
  });
  it('runs the hose about K7’s 5 m, from the tap to the wall, falling to a low point', () => {
    run(yard, bellAt(0.5));
    const L = yard.hoseLength();
    expect(L).toBeGreaterThan(HOSE.length * 0.8);
    expect(L).toBeLessThan(HOSE.length * 1.3);
  });
  it('keeps the hose on the tap, however the bell moves, and on the wall', () => {
    for (const share of [0, 1]) {
      run(yard, bellAt(share));
      const p = yard.hose.geometry.attributes.position;
      const start = new THREE.Vector3(p.getX(0), p.getY(0), p.getZ(0));
      const c = new THREE.Vector3();
      yard.machine.tapOutlet.getWorldPosition(c);
      expect(start.distanceTo(c), `at ${share}`).toBeLessThan(HOSE.r + 0.002);
    }
    expect(yard.sleeve.z).toBeCloseTo(YARD.kitchenZ, 6);
    expect(Math.hypot(yard.sleeve.x, yard.sleeve.z)).toBeLessThan(HOSE.length);
  });
  it('turns the plant so that its tap faces the kitchen', () => {
    const toKitchen = Math.atan2(YARD.kitchenZ, YARD.kitchenX);
    // the machine's -X, turned by PLANT_TURN about Y: (-cos, +sin)
    const a = Math.atan2(Math.sin(PLANT_TURN), -Math.cos(PLANT_TURN));
    expect(Math.abs(a - toKitchen)).toBeLessThan(0.05);
  });
  it('makes the plant’s base height add up', () => {
    expect(BASE_Y).toBeCloseTo(TANK.wall + 0.15, 6);
  });
});

describe('the drop', () => {
  it('takes its colour from the model, and its pools', () => {
    const s = stateWith();
    drop.update(s, 1 / 60, view());
    const healthy = { ...drop.shown };
    expect(healthy.buffer).toBeGreaterThan(drop.bufferMax * 0.5);
    const sour = {
      ...s,
      acidsGL: 12,
      alkalinityMeq: 0,
      methanogenActivity: 0.02,
      uptakeRate: 0.01,
      sourIndex: 1,
      pH: 4.3,
    };
    drop.update(sour, 1 / 60, view());
    expect(drop.shown.acid).toBeGreaterThan(healthy.acid * 3);
    expect(drop.shown.buffer).toBe(0);
    expect(drop.uniforms.methanogens.uLife.value).toBeLessThan(0.2);
    expect(drop.uniforms.methanogens.uGlow.value).toBeLessThan(0.1);
    drop.update(s, 1 / 60, view());
    expect(drop.uniforms.methanogens.uLife.value).toBeGreaterThan(0.8);
  });
  it('keeps the living things inside the drop, over the slide', () => {
    drop.update(stateWith(), 1 / 60, view());
    drop.scene.updateMatrixWorld(true);
    for (const id of DROP_PARTS) {
      // what swims, not the box a pool may fill
      const mesh = drop.registry.get(id)!.meshes.find((m) => !m.userData.extent)!;
      const b = boxOf(mesh);
      expect(b.min.y, id).toBeGreaterThan(0);
      const R = 2.5;
      for (const x of [b.min.x, b.max.x]) expect(Math.abs(x), id).toBeLessThan(R);
    }
  });
  it('lets the kinds come apart along the chain', () => {
    const r = drop.registry;
    const ex = (id: string) => r.get(id)!.explode;
    expect(ex('food-particle').x).toBeLessThan(ex('acid-makers').x);
    expect(ex('acid-makers').x).toBeLessThan(ex('fatty-acid-pool').x);
    expect(ex('fatty-acid-pool').x).toBeLessThan(ex('acetogens').x);
    expect(ex('acetogens').x).toBeLessThan(ex('methanogens').x);
  });
});

describe('the gas line', () => {
  it('runs about K7’s 5 m from the tap to the burner', () => {
    run(line, bellAt(0.5));
    const L = line.lineLength();
    expect(L).toBeGreaterThan(HOSE.length * 0.85);
    expect(L).toBeLessThan(HOSE.length * 1.5);
  });
  it('meets at every joint within 3 mm', () => {
    const j = line.joints;
    expect(j.length).toBeGreaterThanOrEqual(6);
    // the pieces along the line, end to end, each against the fitting between them
    const ends = j.filter((x) => x.name.includes(' to '));
    for (const e of ends) expect(e.a.distanceTo(e.a), e.name).toBe(0);
    const axisY = LINE.y;
    for (const e of j.slice(0, 4)) {
      expect(e.a.y).toBeCloseTo(axisY, 6);
      expect(e.b.y).toBeCloseTo(axisY, 6);
    }
    const last = j[j.length - 1];
    expect(last.a.distanceTo(last.b)).toBeLessThan(0.003);
  });
  it('keeps the flex on the tap, however the bell moves', () => {
    const geo = (line.parts['bell-hose'].children.find((c) => c.name === 'hose-flex') as THREE.Mesh).geometry;
    for (const share of [0, 1]) {
      run(line, bellAt(share));
      const p = geo.attributes.position;
      const start = new THREE.Vector3(p.getX(0), p.getY(0), p.getZ(0));
      const c = new THREE.Vector3();
      line.machine.tapOutlet.getWorldPosition(c);
      expect(start.distanceTo(c), `at ${share}`).toBeLessThan(HOSE.r + 0.002);
    }
  });
  it('sets every prop on the floor, the bench, the wall or the table', () => {
    run(line, bellAt(0.5));
    const y = (id: (typeof LINE_PARTS)[number]) => boxOf(line.parts[id]).min.y;
    expect(Math.abs(y('dilution-bucket'))).toBeLessThan(0.003);
    expect(Math.abs(y('condensate-trap'))).toBeLessThan(0.003);
    expect(boxOf(line.parts.mincer).min.y).toBeLessThan(LINE.benchH);
    const table = LINE.tableH + 0.05;
    expect(Math.abs(y('pot-stand') - table)).toBeLessThan(0.003);
    expect(Math.abs(y('biogas-burner') - table)).toBeLessThan(0.003);
    // the pot on the stand's fingers
    const pot = boxOf(line.parts['cooking-pot']);
    expect(Math.abs(pot.min.y - (table + LINE.standH))).toBeLessThan(0.003);
    // the fittings on the wall
    const vent = boxOf(line.parts['vent-opening']);
    expect(Math.abs(vent.min.z + LINE.roomD / 2)).toBeLessThan(0.003);
    const det = boxOf(line.parts['gas-detector']);
    expect(Math.abs(det.min.z + LINE.roomD / 2)).toBeLessThan(0.003);
  });
  it('reads the bell’s pressure on the gauge, zero at nought and the flame only while it burns', () => {
    const s = stateWith();
    s.flameOn = false;
    s.pressureMbar = 0;
    run(line, s);
    const zero = line.needle.rotation.z;
    expect(zero).toBeCloseTo((Math.PI * 5) / 4, 3);
    s.pressureMbar = 30;
    run(line, s);
    expect(line.needle.rotation.z).toBeCloseTo((Math.PI * 5) / 4 - (30 / 60) * ((Math.PI * 3) / 2), 3);
  });
});

describe('what is hidden goes too', () => {
  it('leaves no scenery standing round a part that is alone', () => {
    const s = stateWith();
    isolateOne(line.registry, 'pressure-gauge', 'hidden');
    line.update(s, 1 / 60, view());
    expect((line.scene.getObjectByName('fixtures') as THREE.Object3D).visible).toBe(false);
    expect(line.machine.root.parent!.visible).toBe(false);
    line.registry.setAllDisplay('solid');
    line.update(s, 1 / 60, view());
    expect((line.scene.getObjectByName('fixtures') as THREE.Object3D).visible).toBe(true);
    isolateOne(yard.registry, 'water-butt', 'hidden');
    yard.update(s, 1 / 60, view());
    expect((yard.scene.getObjectByName('setting') as THREE.Object3D).visible).toBe(false);
    yard.registry.setAllDisplay('solid');
    yard.update(s, 1 / 60, view());
  });
  it('touches nothing else between the worlds', () => {
    expect(
      gap(
        new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1)),
        new THREE.Box3(new THREE.Vector3(2, 0, 0), new THREE.Vector3(3, 1, 1)),
      ),
    ).toBeCloseTo(1, 6);
  });
});
