import * as THREE from 'three';
import { MAT, patchMaterial } from '@onigam/lab-kit/three';
import { concrete, liquorFace, mottled, scumFace, timber } from './textures';

// The materials of the machine, made once per world: the same machine in every world is the same colours too. What the section swaps, or what a state recolours, is flagged `noShare`.

export type MachineLook = ReturnType<typeof machineLook>;

const own = <T extends THREE.Material>(m: T, name: string): T => {
  m.name = name;
  m.userData.noShare = true;
  return m;
};

/** A cut face is flat: it darkens towards the walls and towards the floor, so that it reads as a round body of liquid and not as a painted board. Over the machine's own x and y. */
function roundFace<T extends THREE.MeshStandardMaterial>(m: T): T {
  patchMaterial(m, 'round-face', (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFaceP;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvFaceP = ( modelMatrix * vec4( position, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFaceP;')
      .replace(
        '#include <opaque_fragment>',
        `float fx = clamp( length( vFaceP.xz ) / 0.515, 0.0, 1.0 );
         outgoingLight *= ( 1.0 - 0.42 * fx * fx * fx );
         #include <opaque_fragment>`,
      );
  });
  return m;
}

export function machineLook() {
  const std = (color: number, roughness: number, metalness: number, name: string) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, name });
  // black HDPE as it weathers: not a mirror and not a hole, a soft sheen with sun-grey in it, so that its volumes read
  const hdpeMap = mottled(31, [66, 68, 70], 0.1, 0.05);
  const tank = own(
    new THREE.MeshStandardMaterial({ map: hdpeMap, roughness: 0.56, metalness: 0, envMapIntensity: 1.1, name: 'hdpe' }),
    'hdpe',
  );
  tank.userData.wear = { amount: 0.8, tint: [1.6, 1.5, 1.3] };
  const bell = own(
    new THREE.MeshStandardMaterial({
      map: hdpeMap,
      roughness: 0.5,
      metalness: 0,
      envMapIntensity: 1.1,
      name: 'hdpe-bell',
    }),
    'hdpe-bell',
  );
  bell.userData.wear = { amount: 0.6, tint: [1.6, 1.5, 1.3] };
  /** What the inside of the same plastic looks like: duller, wet at the bottom. */
  const hdpeInside = own(std(0x35383b, 0.74, 0, 'hdpe-inside'), 'hdpe-inside');
  const palletMap = timber(41, [150, 122, 88]);
  const palletWood = own(
    new THREE.MeshStandardMaterial({
      map: palletMap,
      bumpMap: palletMap,
      bumpScale: 0.6,
      roughness: 0.92,
      name: 'pallet',
    }),
    'pallet',
  );
  palletWood.userData.wear = { amount: 1 };
  const cement = concrete(43, [168, 166, 158]);
  const brick = own(
    new THREE.MeshStandardMaterial({
      map: cement.map,
      bumpMap: cement.bump,
      bumpScale: 1.2,
      roughness: 0.96,
      name: 'brick',
    }),
    'brick',
  );
  const clear = roundFace(
    own(
      new THREE.MeshStandardMaterial({
        map: liquorFace(51, [86, 78, 46], [112, 100, 60], 0.25),
        roughness: 0.62,
        name: 'liquor',
      }),
      'liquor',
    ),
  );
  const sludge = roundFace(
    own(
      new THREE.MeshStandardMaterial({
        map: liquorFace(53, [46, 36, 26], [84, 66, 44], 0.75),
        roughness: 0.88,
        name: 'sludge',
      }),
      'sludge',
    ),
  );
  const scum = roundFace(
    own(new THREE.MeshStandardMaterial({ map: scumFace(55), roughness: 0.92, name: 'scum' }), 'scum'),
  );
  const surface = own(
    new THREE.MeshStandardMaterial({
      map: liquorFace(57, [78, 66, 38], [112, 96, 56], 0.4),
      roughness: 0.32,
      metalness: 0,
      envMapIntensity: 1.5,
      name: 'surface',
    }),
    'surface',
  );
  const gas = own(
    new THREE.MeshStandardMaterial({
      color: 0xf0c868,
      transparent: true,
      opacity: 0.2,
      roughness: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
      name: 'gas',
    }),
    'gas',
  );
  const bubble = new THREE.MeshStandardMaterial({
    color: 0xf4eeda,
    transparent: true,
    opacity: 0.72,
    roughness: 0.18,
    metalness: 0,
    envMapIntensity: 1.5,
    depthWrite: false,
    name: 'bubble',
  });
  return {
    tank,
    bell,
    hdpeInside,
    /** What a cut through plastic shows: a warm line, as on a drawing. */
    section: own(std(0xc98a4a, 0.7, 0, 'section-plastic'), 'section-plastic'),
    sectionPvc: own(std(0xd9d4c6, 0.7, 0, 'section-pvc'), 'section-pvc'),
    sectionWood: own(std(0xb9925f, 0.85, 0, 'section-wood'), 'section-wood'),
    sectionMetal: own(std(0xcfc8b6, 0.5, 0.2, 'section-metal'), 'section-metal'),
    palletWood,
    brick,
    clear,
    sludge,
    scum,
    surface,
    gas,
    bubble,
    feedPvc: std(0x8d9296, 0.58, 0, 'pvc-feed'),
    pvcCream: std(0xd4d0c4, 0.55, 0, 'pvc-cream'),
    funnel: std(0x2d6a8e, 0.5, 0, 'funnel'),
    gasket: MAT.rubber(),
    brass: MAT.brass(),
    steel: MAT.steel(),
    zinc: MAT.zinc(),
    rubber: MAT.rubber(),
    redPaint: MAT.redPaint(),
    white: std(0xe9e6da, 0.7, 0, 'paint-white'),
    hose: std(0xc9743a, 0.62, 0, 'hose'),
    bucket: std(0x4e6f85, 0.58, 0, 'bucket'),
    effluent: own(
      new THREE.MeshStandardMaterial({
        color: 0x4a3e24,
        transparent: true,
        opacity: 0.9,
        roughness: 0.3,
        name: 'effluent',
      }),
      'effluent',
    ),
  };
}
