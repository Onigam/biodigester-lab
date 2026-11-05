import type * as THREE from 'three';

// A world's `update` has the state and the view, not the camera nor the selection (kit request 14). `src/main.ts` hands the running stage here once the lab is up. In Node, and with no WebGL, there is no link: nothing is selected, and the view counts as wide.

export interface StageLink {
  camera: THREE.PerspectiveCamera;
  selected: string | null;
}

let link: StageLink | null = null;

export function linkStage(stage: StageLink | null): void {
  link = stage;
}

/** The part selected now, whichever way it was: a label, a chip, a click in the picture. */
export function selectedPart(): string | null {
  return link?.selected ?? null;
}

/** A view taller than wide, where a label's name runs out of the picture unless the overview leaves it room. */
export function narrowView(): boolean {
  return (link?.camera.aspect ?? 2) < 1;
}
