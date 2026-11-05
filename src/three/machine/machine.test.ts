import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  FITTINGS,
  HALF_BRICK,
  PLANT_1000,
  bellArea,
  coveredArea,
  markSpacing,
  openShare,
  surfaceArea,
  trappedVolume,
} from '../../sim/machine';
import { bellAt, boxOf, finiteTree, gap, stateWith } from '../test-utils';
import { BELL, BRICK, BUCKET, FEED, LIMITER, MARKS, OVERFLOW, PALLET, TANK, BASE_Y } from '../dims';
import { cutGeometry } from './clip';
import { bellOuterAt, buildMachine, MACHINE_PARTS, paintText, type Machine } from './machine';
import { pipeSolid, revolveY, V } from './shapes';
import { axisX, bellPose } from './slurry';

const machine = buildMachine({ views: true });
const update = (m: Machine, share: number, added = 0) => {
  const s = bellAt(share);
  for (let i = 0; i < 400; i++) m.update(s, 1 / 30, { addedWeight: added });
  m.root.updateMatrixWorld(true);
  return s;
};
/** Lowest and highest vertices in the machine's frame of what a mesh draws now. */
const worldBox = (o: THREE.Object3D) => boxOf(o);

describe('the dimensions come from the machine, nothing retyped', () => {
  it('holds the source’s figures', () => {
    expect(TANK.outerR * 2).toBeCloseTo(1.04, 6);
    expect(TANK.height).toBeCloseTo(1.25, 6);
    expect(BELL.outerR * 2).toBeCloseTo(0.9, 6);
    expect(BELL.height).toBeCloseTo(1.3, 6);
    expect(BRICK.mass).toBe(HALF_BRICK);
    expect(OVERFLOW.axisY - OVERFLOW.ri).toBeCloseTo(PLANT_1000.overflowLevel, 6);
    expect(FEED.funnelTop).toBe(FITTINGS.funnelTop);
    expect(MARKS.per100).toBeCloseTo(markSpacing(PLANT_1000), 6);
  });
  it('gives the reported areas: 0.83, 0.65 and 22 %, 0.58 m² for the gas', () => {
    expect(surfaceArea(PLANT_1000)).toBeCloseTo(0.83, 2);
    expect(coveredArea(PLANT_1000)).toBeCloseTo(0.65, 2);
    expect(openShare(PLANT_1000)).toBeCloseTo(0.219, 2);
    expect(bellArea(PLANT_1000)).toBeCloseTo(0.58, 2);
  });
  it('draws the hoops’ crest at the cover’s radius and the panels at the reported Ø0.90 m', () => {
    expect(bellOuterAt(0.3)).toBeCloseTo(0.45, 6);
    expect(bellOuterAt(BELL.hoops[1])).toBeCloseTo(PLANT_1000.bellCoverRadius, 6);
  });
  it('holds the line’s reported lengths: the feed’s 1.80 m and the overflow’s 1.00 m within a hand', () => {
    const inner = FEED.reach;
    const stubAndTee = FEED.riserX - TANK.innerR;
    const riser = FEED.funnelTop - FEED.axisY;
    expect(inner + stubAndTee + riser).toBeGreaterThan(1.55);
    expect(inner + stubAndTee + riser).toBeLessThan(1.85);
    const over = -OVERFLOW.elbowX - TANK.innerR + OVERFLOW.drop;
    expect(over).toBeCloseTo(OVERFLOW.lengthReported, 2);
  });
});

describe('sections as geometry', () => {
  it('cuts a closed profile and closes its face on both sides of the axis', () => {
    const g = revolveY(
      [
        [0.5, 0],
        [0.6, 0],
        [0.6, 1],
        [0.5, 1],
      ],
      { seg: 32 },
    );
    const c = cutGeometry(g, 'z', 0);
    expect(c.kept).not.toBeNull();
    expect(c.face).not.toBeNull();
    const area = trianglesArea(c.face!);
    // two walls, 0.1 by 1 m, cut through the axis
    expect(area).toBeCloseTo(0.2, 2);
    c.kept!.computeBoundingBox();
    expect(c.kept!.boundingBox!.max.z).toBeLessThan(0.001);
  });
  it('shows a pipe cut along its axis as two walls and an open bore', () => {
    const p = pipeSolid([V(0, 0, 0), V(1, 0, 0)], 0.05, 0.04, 24);
    const c = cutGeometry(p, 'z', 0);
    expect(trianglesArea(c.face!)).toBeCloseTo(2 * 0.01 * 1, 2);
  });
  it('cuts a pipe across as a ring', () => {
    const p = pipeSolid([V(0, -1, 0), V(0, 1, 0)], 0.05, 0.04, 24);
    const c = cutGeometry(p, 'y', 0);
    const ring = Math.PI * (0.05 * 0.05 - 0.04 * 0.04);
    expect(trianglesArea(c.face!)).toBeCloseTo(ring, 2);
  });
});

describe('every view of the machine', () => {
  it('has each of its parts, with something to show', () => {
    for (const id of MACHINE_PARTS) {
      expect(machine.parts[id].children.length, id).toBeGreaterThan(0);
    }
  });
  it('is a section along the plane the bell tilts in: nothing of the shells left in front of it', () => {
    machine.setView('cut');
    update(machine, 0.5);
    for (const id of ['digester-tank', 'gas-bell', 'overflow-pipe', 'feed-riser', 'float-limiter'] as const) {
      let front = -Infinity;
      machine.parts[id].traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || m.userData.extent) return;
        const pos = m.geometry.attributes.position;
        if (!pos) return;
        m.updateWorldMatrix(true, false);
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i += 7) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
          front = Math.max(front, v.z);
        }
      });
      expect(front, id).toBeLessThan(0.01);
    }
  });
  it('keeps the part’s whole box whichever half is drawn: the sheet’s envelope', () => {
    machine.setView('cut');
    const b = boxOf(machine.parts['digester-tank']);
    expect(b.max.z).toBeCloseTo(TANK.hoopR, 2);
    expect(b.min.z).toBeCloseTo(-TANK.hoopR, 1);
  });
  it('runs through its range with nothing that is not a number, in all three views', () => {
    for (const v of ['whole', 'cut', 'across'] as const) {
      machine.setView(v);
      for (const share of [0, 0.25, 0.5, 1]) {
        update(machine, share, share > 0.5 ? 24 : 0);
        expect(finiteTree(machine.root), `${v} ${share}`).toBe(true);
      }
    }
    machine.setView('cut');
  });
});

describe('attached and resting', () => {
  it('stands the tank on the pallet and the pallet on what carries it', () => {
    const m = buildMachine({ views: false });
    update(m, 0);
    const tank = worldBox(m.parts['digester-tank']);
    const pallet = worldBox(m.parts.pallet);
    expect(tank.min.y).toBeCloseTo(-TANK.wall, 3);
    expect(Math.abs(tank.min.y - pallet.max.y)).toBeLessThan(0.002);
    expect(pallet.min.y).toBeCloseTo(-BASE_Y, 3);
    expect(pallet.max.x - pallet.min.x).toBeCloseTo(PALLET.x, 3);
  });
  it('lays the bell at rest on the inner feed pipe: its high side on the pipe’s crown, within 3 mm', () => {
    const p = bellPose(BELL.restRim, PLANT_1000.tiltRest);
    const rimHigh = p.rim + BELL.outerR * Math.sin(p.theta);
    expect(Math.abs(rimHigh - (FEED.axisY + FEED.ro))).toBeLessThan(0.003);
    // and the crown is there: the rim's high point falls over the pipe, inside the wall
    const x = p.xc + BELL.outerR * Math.cos(p.theta);
    expect(x).toBeLessThan(TANK.innerR);
    expect(x).toBeGreaterThan(TANK.innerR - FEED.reach);
    const low = p.rim - BELL.outerR * Math.sin(p.theta);
    expect(low).toBeGreaterThan(0.05);
  });
  it('keeps the bell clear of the bore all along its travel, at both ends of what is engaged', () => {
    for (let k = 0; k <= 10; k++) {
      const share = k / 10;
      const p = bellPose(BELL.restRim + BELL.travel * share, 5 + 3 * share);
      const cos = Math.cos(p.theta);
      // the rim, its low side and its high side, hoops counted
      const rimRight = p.xc + BELL.hoopR * cos;
      const rimLeft = p.xc - BELL.hoopR * cos;
      expect(rimRight, `rim right at ${share}`).toBeLessThan(TANK.innerR);
      expect(rimLeft, `rim left at ${share}`).toBeGreaterThan(-TANK.innerR);
      // where its side passes the tank's rim
      const atTop = axisX(p, TANK.height);
      const half = BELL.hoopR / cos;
      expect(atTop - half, `top left at ${share}`).toBeGreaterThan(-TANK.innerR);
      expect(atTop + half, `top right at ${share}`).toBeLessThan(TANK.innerR);
    }
  });
  it('clears the limiter’s bars at the full travel by a few millimetres, and stops the bell there', () => {
    const p = bellPose(BELL.restRim + BELL.travel, PLANT_1000.tiltFull);
    const topHigh = p.rim + BELL.height * Math.cos(p.theta) + BELL.outerR * Math.sin(p.theta);
    const gapToBar = LIMITER.barY - LIMITER.r - topHigh;
    expect(gapToBar).toBeGreaterThan(0);
    expect(gapToBar).toBeLessThan(0.025);
  });
  it('carries the funnel on the riser, the riser on the tee, the tee on the stub, the stub at the wall', () => {
    const m = buildMachine({ views: false });
    update(m, 0.5);
    const box = (id: (typeof MACHINE_PARTS)[number]) => worldBox(m.parts[id]);
    expect(gap(box('feed-funnel'), box('feed-riser'))).toBeLessThan(0.001);
    expect(gap(box('feed-riser'), box('feed-tee'))).toBeLessThan(0.001);
    expect(gap(box('feed-tee'), box('clean-out-plug'))).toBeLessThan(0.001);
    expect(gap(box('feed-tee'), box('tank-connector'))).toBeLessThan(0.001);
    expect(gap(box('tank-connector'), box('inner-feed-pipe'))).toBeLessThan(0.001);
    expect(gap(box('tank-connector'), box('digester-tank'))).toBeLessThan(0.001);
    expect(gap(box('overflow-pipe'), box('digester-tank'))).toBeLessThan(0.001);
    expect(gap(box('bottom-valve'), box('digester-tank'))).toBeLessThan(0.001);
    expect(gap(box('float-limiter'), box('digester-tank'))).toBeLessThan(0.005);
    expect(box('inner-feed-pipe').min.x).toBeCloseTo(TANK.innerR - FEED.reach, 3);
    expect(box('feed-funnel').max.y).toBeCloseTo(FEED.funnelTop, 3);
  });
  it('holds the tap on the bell, at every height', () => {
    const m = buildMachine({ views: false });
    for (const share of [0, 0.5, 1]) {
      update(m, share);
      expect(gap(worldBox(m.parts['gas-tap']), worldBox(m.parts['gas-bell'])), `at ${share}`).toBeLessThan(0.002);
    }
  });
  it('sets the brick on the pad when it is off, on the bell when it is on, flat on its closed end', () => {
    const m = buildMachine({ views: false });
    update(m, 0.4, 0);
    const off = worldBox(m.parts['half-brick']);
    expect(Math.abs(off.min.y - -BASE_Y)).toBeLessThan(0.003);
    update(m, 0.4, 12);
    const brickM = new THREE.Vector3();
    m.brickPose.getWorldPosition(brickM);
    const p = m.pose;
    const onTop = new THREE.Vector3(0, BELL.height, -0.24)
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), p.theta)
      .add(new THREE.Vector3(p.xc, p.rim, 0));
    expect(brickM.distanceTo(onTop)).toBeLessThan(0.003);
  });
  it('drops the overflow into its bucket: the pipe’s end over the rim, the bucket on the pad', () => {
    const m = buildMachine({ views: false });
    m.root.add(m.bucket.root);
    update(m, 0.5);
    const b = worldBox(m.bucket.root);
    expect(Math.abs(b.min.y - -BASE_Y)).toBeLessThan(0.002);
    const end = OVERFLOW.axisY - OVERFLOW.drop;
    expect(end).toBeGreaterThan(b.max.y);
    expect(Math.abs(m.bucket.root.position.x - OVERFLOW.elbowX)).toBeLessThan(0.001);
    expect(BUCKET.rTop).toBeGreaterThan(OVERFLOW.ro);
  });
});

describe('the water follows the physics', () => {
  it('stands ring and riser level, and the surface inside the bell lower by the pressure: 2 cm at 2 mbar', () => {
    const s = stateWith({}, 0.5);
    expect(s.levelRing).toBeCloseTo(PLANT_1000.overflowLevel, 6);
    expect(s.levelRiser).toBeCloseTo(s.levelRing, 6);
    const drop = s.levelRing - s.levelInner;
    expect(drop).toBeCloseTo(s.pressurePa / (1000 * 9.81), 5);
    const m = buildMachine({ views: true });
    m.update(s, 1 / 30);
    const ring = m.slurry.ringMesh.geometry.attributes.position;
    const inner = m.slurry.innerMesh!.geometry.attributes.position;
    expect(ring.getY(0)).toBeCloseTo(s.levelRing, 5);
    expect(inner.getY(1)).toBeCloseTo(s.levelInner, 5);
    // horizontal: every vertex of the inner surface at one height, whatever the tilt
    for (let i = 0; i < inner.count; i += 5) expect(inner.getY(i)).toBeCloseTo(s.levelInner, 5);
  });
  it('traps what the model says: about 232 L stay under the bell when it rests', () => {
    expect(trappedVolume(PLANT_1000) * 1000).toBeCloseTo(232, 0);
    const p = bellPose(BELL.restRim, PLANT_1000.tiltRest);
    // the gas's height over the slurry at rest, drawn
    const under = BELL.height - BELL.wall - (PLANT_1000.overflowLevel - p.rim);
    expect(under).toBeGreaterThan(0.3);
  });
  it('shows bubbles at the rim and under the bell in the model’s proportion', () => {
    const s = stateWith({}, 0.5);
    s.bubblesRimLph = 2.5;
    s.bubblesBellLph = 7.5;
    s.overflowLph = 0;
    const m = buildMachine({ views: true });
    m.bubbles.update(s, m.pose, 1 / 30, 'cut', true);
    const share = m.bubbles.ringShown / (m.bubbles.ringShown + m.bubbles.bellShown);
    expect(share).toBeCloseTo(0.25, 1);
    s.bubblesRimLph = 0;
    s.bubblesBellLph = 0;
    m.bubbles.update(s, m.pose, 1 / 30, 'cut', true);
    expect(m.bubbles.mesh.count).toBe(0);
  });
  it('lets the bucket fill by what the feed pushes out, up to its rim', () => {
    const m = buildMachine({ views: false });
    const s = stateWith({}, 0.5);
    let feed = s.feedCount;
    m.update(s, 1 / 30, { effluentLitres: 10 });
    for (let d = 0; d < 2; d++) {
      feed++;
      s.feedCount = feed;
      for (let i = 0; i < 120; i++) m.update(s, 1 / 30, { effluentLitres: 10 });
    }
    expect(m.bucket.fill).toBeGreaterThan(0.3);
    expect(m.bucket.fill).toBeLessThanOrEqual(1);
  });
});

function trianglesArea(g: THREE.BufferGeometry): number {
  const p = g.attributes.position;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let sum = 0;
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    sum += b.sub(a).cross(c.sub(a)).length() / 2;
  }
  return sum;
}

describe('the figures on the bell (QA M9)', () => {
  // seen from outside at -X, the viewer's right is +Z
  const zOf = (pos: number[]) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 2; i < pos.length; i += 3) {
      lo = Math.min(lo, pos[i]);
      hi = Math.max(hi, pos[i]);
    }
    return { lo, hi };
  };
  const painted = (text: string, y = 1, h = 0.036) => {
    const pos: number[] = [];
    paintText(text, 0.3, y, h, pos, [], []);
    return pos;
  };
  it('run left to right as read from outside', () => {
    const one = zOf(painted('1'));
    const eleven = zOf(painted('11'));
    expect(eleven.hi).toBeGreaterThan(one.hi + 0.01);
    expect(eleven.lo).toBeCloseTo(one.lo - 0, 2);
  });
  it('are not flipped: a 1 stands at the right of its cell, an L has its upright on the left', () => {
    const one = zOf(painted('1'));
    const zero = zOf(painted('0'));
    expect(one.lo).toBeGreaterThan(zero.lo + 0.005);
    expect(one.hi).toBeCloseTo(zero.hi, 3);
    const L = painted('L');
    const upper: number[] = [];
    for (let i = 0; i < L.length; i += 3) if (L[i + 1] > 1 + 0.036 * 0.6) upper.push(L[i], L[i + 1], L[i + 2]);
    expect(zOf(upper).hi).toBeLessThan(zOf(L).hi - 0.005);
  });
  it('face out, as the strokes do', () => {
    const idx: number[] = [];
    const nor: number[] = [];
    const pos: number[] = [];
    paintText('1', 0.3, 1, 0.036, pos, nor, idx);
    const v = (i: number) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const n = new THREE.Vector3().crossVectors(v(idx[1]).sub(v(idx[0])), v(idx[2]).sub(v(idx[0]))).normalize();
    const out = v(idx[0]).setY(0).normalize();
    expect(n.dot(out)).toBeGreaterThan(0.5);
  });
});
