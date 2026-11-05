import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { clamp, lerp } from '@onigam/lab-kit/three';

// Sky dome (Preetham, stars at night), one directional light for the sun or the moon, a hemisphere fill. The sun comes from the state (`sunAlt`, `sunAz`: above the horizon, from south towards the west), so it is the
// simulation's day, in every site and every season. World axes: +Z south, +X east. The same few lines as the other labs' site worlds (kit request: mill 10, sand 12).

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The sun's direction, unit, from the state's two angles, degrees. */
export function sunDirection(altDeg: number, azDeg: number, out = new THREE.Vector3()): THREE.Vector3 {
  const a = (altDeg * Math.PI) / 180;
  const z = (azDeg * Math.PI) / 180;
  return out.set(-Math.sin(z) * Math.cos(a), Math.sin(a), Math.cos(z) * Math.cos(a));
}

function injectNight(sky: Sky): void {
  const m = sky.material;
  m.uniforms.uNight = { value: 0 };
  const hook = 'gl_FragColor = vec4( texColor, 1.0 );';
  if (!m.fragmentShader.includes(hook)) return;
  m.fragmentShader = m.fragmentShader.replace('void main() {', 'uniform float uNight;\nvoid main() {').replace(
    hook,
    /* glsl */ `
      {
        float up = max(direction.y, 0.0);
        vec3 nightCol = mix(vec3(0.012, 0.020, 0.048), vec3(0.003, 0.005, 0.014), pow(up, 0.6));
        vec3 sd = direction * 260.0;
        vec3 cell = floor(sd);
        float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = step(0.9965, h) * smoothstep(0.45, 0.05, length(fract(sd) - 0.5));
        star *= smoothstep(0.02, 0.25, up) * (0.5 + 0.5 * fract(h * 91.7));
        texColor = mix(texColor, nightCol + vec3(star) * 0.9, uNight);
      }
      ${hook}`,
  );
}

/** A sky-and-ground gradient for the reflections, warm below: red earth. */
function envTexture(): THREE.DataTexture {
  const W = 64;
  const H = 32;
  const data = new Uint8Array(W * H * 4);
  const stops: [number, [number, number, number]][] = [
    [0, [104, 150, 204]],
    [0.42, [186, 208, 228]],
    [0.5, [224, 226, 220]],
    [0.53, [168, 122, 92]],
    [1, [96, 66, 50]],
  ];
  for (let j = 0; j < H; j++) {
    const t = j / (H - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k];
    const [t1, c1] = stops[k + 1];
    const f = clamp((t - t0) / (t1 - t0), 0, 1);
    for (let i = 0; i < W; i++) {
      const o = (j * W + i) * 4;
      data[o] = lerp(c0[0], c1[0], f);
      data[o + 1] = lerp(c0[1], c1[1], f);
      data[o + 2] = lerp(c0[2], c1[2], f);
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * From a day in 4 s the yard's light stops following the hour: five scenarios open at a day a second, and the whole picture went from a mean brightness of 146 to 51 and back once a second (docs/qa.md, M1). Their speed is what
 * lets them show weeks, so the light gives way, not the speed. It settles on the high sun the world opens on, the hour stays on the strip, and a clock paused or slowed brings the true sun back. Below this speed the sky is the state's.
 */
export const HOLD_LIGHT_FROM = 21_600;
export const HELD_SUN = { alt: 55, az: 0 } as const;
/** Seconds of real time for the change: quick to the held sun, ahead of the night a rush would cross; slower back, so that a night the voice asks for falls and does not drop. */
export const HOLD_RISE = 0.4;
export const HOLD_FALL = 1.2;

/** Where the light's blend goes this frame: 0 the true sun, 1 the held one. */
export function nextHold(hold: number, dt: number, p: { running?: boolean; timeScale?: number }): number {
  const fast = p.running === true && (p.timeScale ?? 0) >= HOLD_LIGHT_FROM;
  return clamp(hold + (fast ? dt / HOLD_RISE : -dt / HOLD_FALL), 0, 1);
}

/** The sun the yard shows for that blend, the azimuth by its short way round. */
export function shownSun(altDeg: number, azDeg: number, hold: number): { alt: number; az: number } {
  if (hold <= 0) return { alt: altDeg, az: azDeg };
  const turn = ((((HELD_SUN.az - azDeg + 180) % 360) + 360) % 360) - 180;
  return { alt: lerp(altDeg, HELD_SUN.alt, hold), az: azDeg + turn * hold };
}

export interface SkyRig {
  sun: THREE.DirectionalLight;
  /** 0 = full day, 1 = deep night. */
  night: number;
  direction: THREE.Vector3;
  update(altDeg: number, azDeg: number): void;
}

export function createSky(scene: THREE.Scene): SkyRig {
  const sky = new Sky();
  sky.name = 'sky';
  sky.scale.setScalar(2800);
  sky.frustumCulled = false;
  const u = sky.material.uniforms;
  u.turbidity.value = 2.6;
  u.rayleigh.value = 1.1;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.82;
  if (u.cloudCoverage) {
    u.cloudCoverage.value = 0.28;
    u.cloudDensity.value = 0.45;
    u.cloudElevation.value = 0.45;
    u.cloudScale.value = 0.00022;
  }
  injectNight(sky);
  scene.add(sky);

  scene.environment = envTexture();
  scene.fog = new THREE.Fog(0xd6dbd6, 90, 900);

  const sun = new THREE.DirectionalLight(0xfff2e0, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  const half = 22;
  cam.left = -half;
  cam.right = half;
  cam.top = half;
  cam.bottom = -half;
  cam.near = 1;
  cam.far = 120;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2.2;
  sun.shadow.intensity = 0.86;
  scene.add(sun, sun.target);
  sun.target.position.set(0, 2, -2);

  const hemi = new THREE.HemisphereLight(0xcfdbe6, 0x8a7a58, 0.9);
  scene.add(hemi);

  const direction = new THREE.Vector3(0, 1, 0);
  const moonDir = new THREE.Vector3(-0.35, 0.8, 0.45).normalize();
  const lightDir = new THREE.Vector3();
  const warm = new THREE.Color(0xffa860);
  const white = new THREE.Color(0xfff0dc);
  const moonCol = new THREE.Color(0x9fb4d8);
  const fogDay = new THREE.Color(0xdcdcd2);
  const fogDusk = new THREE.Color(0xe6bb96);
  const fogNight = new THREE.Color(0x0c1424);
  const hemiDay = new THREE.Color(0xcfdbe6);
  const hemiNight = new THREE.Color(0x3a4f80);

  const rig: SkyRig = {
    sun,
    night: 0,
    direction,
    update(alt, az) {
      sunDirection(alt, az, direction);
      const day = smooth(-7, 3, alt);
      const low = 1 - smooth(4, 25, alt);
      rig.night = 1 - day;
      u.sunPosition.value.copy(direction);
      u.uNight.value = smooth(-2, -10, alt);
      const sunI = 3.5 * smooth(-1, 6, alt) * (1 - 0.45 * low);
      const moonI = 1.3 * (1 - day);
      if (sunI >= moonI) {
        lightDir.copy(direction);
        sun.color.copy(white).lerp(warm, low);
        sun.intensity = sunI;
      } else {
        lightDir.copy(moonDir);
        sun.color.copy(moonCol);
        sun.intensity = moonI;
      }
      sun.position.copy(sun.target.position).addScaledVector(lightDir, 60);
      hemi.intensity = lerp(0.72, 1.05, day) * lerp(1, 0.78, low * day);
      hemi.color.copy(hemiNight).lerp(hemiDay, day);
      scene.environmentIntensity = lerp(0.22, 0.6, day);
      (scene.fog as THREE.Fog).color
        .copy(fogNight)
        .lerp(fogDay, day)
        .lerp(fogDusk, low * day * 0.6);
    },
  };
  rig.update(55, 0);
  return rig;
}
