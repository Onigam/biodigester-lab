import * as THREE from 'three';
import { BiodigesterSim } from '../sim/engine';

// The sun of the measured site, for a test: the simulation's own angles, and the sky's own axes.

export function sunPlaceFor(month: number, hour: number): { dir: THREE.Vector3; alt: number } {
  const sim = new BiodigesterSim();
  sim.set({ site: 'dar-es-salaam', month, seasons: false } as never);
  const plant = (sim as unknown as { plant?: { sunAzimuth(h: number): number } }).plant;
  const lat = (-6.8 * Math.PI) / 180;
  const decl = (-23.45 * Math.cos(((2 * Math.PI) / 365) * (month * 30.4 - 15 + 10)) * Math.PI) / 180;
  const omega = ((hour - 12) * Math.PI) / 12;
  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(omega);
  const alt = Math.asin(sinAlt);
  const az = plant
    ? (plant.sunAzimuth(hour) * Math.PI) / 180
    : Math.atan2(Math.sin(omega), Math.cos(omega) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat));
  const dir = new THREE.Vector3(-Math.sin(az) * Math.cos(alt), Math.sin(alt), Math.cos(az) * Math.cos(alt));
  return { dir, alt: (alt * 180) / Math.PI };
}
