import { FITTINGS, HALF_BRICK, PLANT_1000, bellArea, markSpacing, usableVolume } from '../sim/machine';

// The one place for every dimension the 3D draws, in metres. What the simulation also needs comes from `src/sim/machine.ts`, and is not retyped: a change there moves the model, the drawings and the physics
// together. What only the drawing needs is here, each constant with its word, as in docs/research.md:
//   reported  said by a source (K and S numbers of docs/research.md)
//   derived   computed from reported figures, the formula is beside it
//   estimate  the sources are silent: a choice of ours, with its reason. No source publishes these, and a sheet or a part sheet that prints one says so.
//   stylised  in the `slurry` world only: nothing there is to scale, and the world says so once
//
// The machine's own frame, for every world: origin at the tank's inner floor on its axis, +Y up, +X towards the feed, -X towards the overflow, -Z the back. A world moves the root and nothing else.
//
// Not a build plan (BRIEF §8, research §0.5). No cut line, no torque, no tool, no procedure lives here: these are the numbers of a reconstruction, for looking at, and nothing here shows that a build would
// be safe or allowed.

export const MACHINE = PLANT_1000;

/** Half a turn of the tank's body: how a moulded hoop stands proud of the wall. */
export const TANK = {
  /** Outer radius, reported (K1: Ø1.04 m). */
  outerR: PLANT_1000.tankOuterDiameter / 2,
  /** Inner radius, reported (K1). The two give the 5 mm wall. */
  innerR: PLANT_1000.tankInnerRadius,
  /** Reported (K1). The top of the 1,000 L tank is cut off to take the bell. */
  height: PLANT_1000.tankHeight,
  /** Wall, derived: outer less inner (K1). */
  wall: PLANT_1000.tankOuterDiameter / 2 - PLANT_1000.tankInnerRadius,
  /** Moulded hoops, estimate: no drawing of the tank's ribs exists (research §3). Their crest and heights. */
  hoopR: 0.528,
  hoopH: 0.06,
  hoops: [0.27, 0.6, 0.93],
  /** The bead left at the cut top, estimate. */
  beadR: 0.525,
} as const;

/** The bell, in its own frame: origin at the rim on its axis, +Y towards its closed end. */
export const BELL = {
  /** Outer radius, reported, the table corrected by the figure (K2: Ø0.90 m, conflict 1). */
  outerR: PLANT_1000.bellOuterDiameter / 2,
  /** Wall, estimate: the tank's own (K1, physics §1.4). */
  wall: PLANT_1000.bellWall,
  innerR: PLANT_1000.bellOuterDiameter / 2 - PLANT_1000.bellWall,
  /** Reported, the same (K2). */
  height: PLANT_1000.bellHeight,
  /** Radius the gas pushes on, reported from the scale (K5: 0.43 m). The drawn wall is a little wider, 0.445 m; the difference is the measurement's, not drawn. */
  gasR: PLANT_1000.bellGasRadius,
  /** Crest of the moulded hoops, derived: the radius of the 0.65 m² it covers (K4). */
  hoopR: PLANT_1000.bellCoverRadius,
  hoopH: 0.05,
  /** Hoops' heights from the rim, estimate. */
  hoops: [0.14, 0.52, 0.9, 1.2],
  /** Measured travel (K5). */
  travel: PLANT_1000.bellTravel,
  /** Rim at rest, above the tank's floor, estimate by eye (physics §1.4). */
  restRim: PLANT_1000.bellRestRim,
} as const;

/** The 3" feed: bore reported (K7), its wall an estimate. The line's total length reported, 1.80 m. */
const FEED_WALL = 0.004;
const feedRo = FITTINGS.feedBore / 2 + FEED_WALL;
export const FEED = {
  bore: FITTINGS.feedBore,
  ri: FITTINGS.feedBore / 2,
  ro: feedRo,
  lengthReported: FITTINGS.feedLength,
  /** Reach inside the tank, reported (K6). Almost to the axis. */
  reach: FITTINGS.feedPipeReach,
  /**
   * The inner pipe's axis. derived: the bell at rest, tilted, lays its high side on the pipe (physics §1.4 reads « resting near the inner feed pipe » in Fig. 7), so the pipe's crown is the rim's rest height plus
   * the tilt's lift: 0.14 + 0.45·sin 5° = 0.179 m.
   */
  axisY: BELL.restRim + BELL.outerR * Math.sin((PLANT_1000.tiltRest * Math.PI) / 180) - feedRo,
  /** Riser's axis, estimate: as near the wall as the funnel allows. */
  riserX: 0.635,
  /** Funnel: top reported (K6), its radius and neck estimates. */
  funnelTop: FITTINGS.funnelTop,
  funnelR: 0.11,
  funnelNeck: 1.08,
  /** Where a clean-out goes, reported on another build (research §4.2). Its sizes estimates. */
  plugLength: 0.03,
} as const;

/** The 2" overflow: bore, length and the level reported (K3, K6, K7). */
const OVER_WALL = 0.0035;
export const OVERFLOW = {
  bore: FITTINGS.overflowBore,
  ri: FITTINGS.overflowBore / 2,
  ro: FITTINGS.overflowBore / 2 + OVER_WALL,
  /** The pipe's invert stands at the overflow level (K3): that sets the slurry's free surface. */
  axisY: PLANT_1000.overflowLevel + FITTINGS.overflowBore / 2,
  /** Reported by eye (K6): the drop beside the overflow. */
  drop: FITTINGS.overflowDrop,
  lengthReported: FITTINGS.overflowLength,
  /** The elbow's place, derived: what the reported 1.00 m leaves after the drop, about the 0.26 m run outside the wall. */
  elbowX: -(TANK.innerR + (FITTINGS.overflowLength - FITTINGS.overflowDrop)),
} as const;

/** Half a cement block, its mass reported (K18, 12 kg), its shape an estimate: half of a usual 40 × 20 × 15 block, about 2 t/m³ with its webs. */
export const BRICK = { mass: HALF_BRICK, w: 0.2, d: 0.2, h: 0.15 } as const;

/** Wooden pallet, reported as such (K9), its size an estimate: the usual pallet (research §3). */
export const PALLET = { x: 1.2, z: 1.0, h: 0.15, deck: 0.022, boardW: 0.1, runner: 0.1 } as const;

/** The pad under the pallet: concrete in the photos (research §4.1), every size an estimate, enough for the plant, its bucket and the keeper. */
export const PAD = { halfX: 1.25, halfZ: 0.95, h: 0.1 } as const;

/** Height of the machine's origin over what the pallet stands on. The tank's floor is 5 mm thick on the deck. */
export const BASE_Y = TANK.wall + PALLET.h;

/** The gas tap, ½" reported (K7), on the closed end of the bell; its place on it an estimate, clear of the limiter's bars and of the brick. */
export const TAP = { x: -0.25, z: -0.09, boreHalfInch: 0.0127, stem: 0.05, bodyH: 0.1 } as const;

/** Where the half-brick lies on the bell, estimate: between the limiter's bars. On the pad beside the pallet when it is not on. */
export const BRICK_AT = { onX: 0, onZ: -0.24, offX: 0.86, offZ: -0.62 } as const;

/** Bottom valve and sampling tap, of the research plant only (K7). The 2" and the ½" and the 0.62 m reported; bearings estimates, on the back, so that they show past the section's edge. */
export const VALVES = { bottomY: 0.075, bottomBearing: 215, tapY: FITTINGS.sampleTap, tapBearing: 318 } as const;

/**
 * Float limiter: reported on another tank, Ø1.20 m (S9): two inverted U's of 1" PVC, 1.40 m legs, 1.29 m across. Marked as such (Q5). Its width is scaled by the tanks' diameters, derived.
 * Its bars clear the bell's highest edge at the full travel at the full tilt, derived: not on the measured plant, so nothing measured sets it.
 */
const tiltFull = (PLANT_1000.tiltFull * Math.PI) / 180;
const fullTop = PLANT_1000.bellRestRim + PLANT_1000.bellTravel + PLANT_1000.bellHeight;
const LIMIT_R = 0.0167;
export const LIMITER = {
  r: LIMIT_R,
  /** 1" PVC, reported on S9's build: outside diameter 33.4 mm. */
  across: (1.29 * PLANT_1000.tankOuterDiameter) / 1.2,
  legReported: 1.4,
  /** Lower bar's axis. */
  barY: fullTop + BELL.outerR * Math.sin(tiltFull) + 0.008 + LIMIT_R,
  get legBottom(): number {
    return this.barY - this.legReported;
  },
} as const;

/** The scale on the bell. Spacing reported (K5): 17.25 cm per 100 L, in 20 L steps. The drawing's own: where the zero stands, the mark that faces the tank's rim when the bell is down. */
export const MARKS = {
  /** m per 100 L, derived from the area, 17.2 cm against 17.25 reported. */
  per100: markSpacing(PLANT_1000),
  stepLitres: 20,
  litres: Math.round(usableVolume(PLANT_1000) * 10000) / 10,
  zeroY: PLANT_1000.tankHeight - PLANT_1000.bellRestRim,
  /** Bearing from -X towards the back, degrees: on the side that shows past the section's edge. Estimate. */
  from: 0.6,
  shortArc: 7,
  longArc: 15,
  arcR: 0.0012,
} as const;

/** Hose, ½", 5 m, reported (K7). Its outside an estimate. */
export const HOSE = { bore: PLANT_1000.hoseBore, length: PLANT_1000.hoseLength, r: 0.0115 } as const;

/** The bucket under the overflow's end, estimate: about 20 L a day (K13). */
export const BUCKET = { rTop: 0.155, rBottom: 0.125, h: 0.36, wall: 0.003 } as const;

export const MACHINE_AREA = bellArea(PLANT_1000);

// ---------------------------------------------------------------------------------------------------- the yard. All estimates: a generic warm yard, nothing here is a measured place (Q4)

/** Where the machine's pad stands in the yard. +X east, +Z south, as in the sky's axes. */
export const YARD = {
  /** The plot's corners, m. */
  x0: -10.5,
  x1: 11,
  z0: -12.5,
  z1: 8.8,
  /** The pad's centre. */
  padX: 0,
  padZ: 0,
  /** The kitchen's wall, the south wall of its lean-to: the hose's 5 m (K7) must reach it. */
  kitchenX: 2.7,
  kitchenZ: -3.4,
  /** The kitchen's lean-to: width, depth, and its low and high sides. */
  kitchenW: 3.4,
  kitchenD: 2.6,
  /** The house proper behind it. */
  houseW: 8.6,
  houseD: 5.2,
  houseEave: 2.7,
  houseRidge: 3.7,
  /** Where the wall sleeve goes through, the hose's height there. */
  sleeveY: 1.25,
  /** The shade tree's foot: its crown's shadow misses the tank through the 7.5 h of sun (K9, tested). */
  treeX: -7.2,
  treeZ: -9.2,
  treeH: 7.4,
  /** Vegetable beds, south-east of the plant: their first corner, size of each, the gap. */
  bedX: 3.2,
  bedZ: 2.2,
  bedW: 1.3,
  bedL: 5.2,
  bedGap: 0.65,
  bedH: 0.2,
  /** Compost heap, away from the kitchen. */
  compostX: -6.6,
  compostZ: 4.4,
  /** The water butt beside the plant: S5 stored its water next to the tank, for the same temperature. */
  buttX: -1.9,
  buttZ: -1.05,
  buttR: 0.3,
  buttH: 0.92,
  /** Scrap caddy beside the funnel, on the pad. */
  caddyX: 1.02,
  caddyZ: 0.5,
} as const;

// ---------------------------------------------------------------------------------------------------- the gas line. Unknown in every source, all estimates (research §3): a generic reading of each device

/** Every height from the ground, every x along the line. Laid out in the order the gas flows, at about its true length (K7's 5 m). */
export const LINE = {
  /** The plant stands to the left, the same machine as everywhere. */
  plantX: -3.25,
  /** The line's board, on two posts in the yard, and the fittings' axis on it. */
  boardX0: -1.05,
  boardX1: 1.15,
  boardZ: -0.22,
  y: 1.15,
  /** The low point on the ground, its trap. */
  trapX: -1.55,
  trapY: 0.22,
  reliefX: -0.72,
  filterX: -0.2,
  arresterX: 0.28,
  gaugeX: 0.72,
  /** The kitchen's wall: its outside face. */
  wallX: 1.4,
  wallT: 0.2,
  /** Kitchen, beyond the wall. */
  roomW: 3.1,
  roomD: 2.6,
  roomH: 2.4,
  /** Valve on the wall's inside, table and burner. */
  valveY: 1.15,
  burnerX: 2.45,
  burnerZ: -0.1,
  tableH: 0.72,
  tableW: 0.9,
  tableD: 0.62,
  /** Burner, its flow fixed by K22, its sizes estimates. */
  burnerR: 0.055,
  burnerH: 0.1,
  potR: 0.12,
  potH: 0.13,
  standH: 0.14,
  /** Vent, high in the wall, a keeper's estimate of « always open », and the detector, near the ceiling. */
  ventY: 2.0,
  detectorY: 2.05,
  /** The bench where the scraps start, near the funnel. */
  benchX: -1.95,
  benchZ: 1.15,
  benchH: 0.78,
  /** S3: particles under 1 cm (K14). Dilution bucket with its mark: reported, 10 L twice a day, about (K13). */
  bucketLitres: 10,
} as const;

// ---------------------------------------------------------------------------------------------------- the drop. Stylised: no size here is a size of anything

export const DROP = {
  /** The dome's half-width and height over the slide, scene metres. */
  R: 2.5,
  H: 1.62,
  /** Microscope slide under it: the shape of one, far larger. */
  slideX: 6.4,
  slideZ: 3.8,
  slideH: 0.05,
} as const;
