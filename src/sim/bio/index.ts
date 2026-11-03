// `sim/bio`: what a digester's liquid does, in pure functions and plain data. Shaped to move to `@onigam/lab-kit/sim/bio` when a second lab needs it: no lab's name, no import from a lab, no DOM, no
// three.js, no allocation in the hot path, its own tests against closed forms and printed values (`bio.test.ts`). The lab's own figures stay in the lab's tests.

export * from './acidbase';
export * from './buswell';
export * from './chain';
export * from './gas';
export * from './kinetics';
