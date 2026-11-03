import type { LabSim } from '@onigam/lab-kit/ui';

// The template's flywheel, kept only because the lead's `src/lab.ts`, the template's panel and its scene still import it. The lab's model is `BiodigesterSim` in `engine.ts`.
// Delete this file, and its re-export from `engine.ts`, when the lead wires the lab.

/** Time constant of the spin-up, in seconds. */
export const TAU = 4;

export interface DemoParams {
  slowMo: number;
  timeScale: number;
  running: boolean;
  /** Speed the wheel is driven towards, rpm. */
  targetRpm: number;
}

export interface DemoState {
  /** Real seconds simulated since the start. */
  simTime: number;
  rpm: number;
  /** Wheel angle in radians, already scaled by the slow-motion factor (for the 3D view only). */
  angle: number;
}

export class DemoSim implements LabSim {
  readonly params: DemoParams = { slowMo: 1, timeScale: 1, running: true, targetRpm: 60 };
  readonly state: DemoState = { simTime: 0, rpm: 0, angle: 0 };
  private listeners = new Set<() => void>();

  step(dt: number): void {
    if (!this.params.running) return;
    const s = this.state;
    s.rpm += (this.params.targetRpm - s.rpm) * (1 - Math.exp(-dt / TAU));
    s.angle = (s.angle + ((s.rpm * 2 * Math.PI) / 60) * dt * this.params.slowMo) % (2 * Math.PI);
    s.simTime += dt;
  }

  set(patch: Partial<DemoParams>): void {
    Object.assign(this.params, patch);
    this.listeners.forEach((fn) => fn());
  }

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }
}
