import '@onigam/lab-kit/styles.css';
import { mountLab } from '@onigam/lab-kit/ui';
import { lab } from './lab';
import { linkStage } from './three/stage-link';
import { holdClockForTelling } from './voice-clock';

const mounted = mountLab(lab, {
  app: document.getElementById('app')!,
  viewport: document.getElementById('viewport')!,
  expose: import.meta.env.DEV, // window.__lab = { stage, engine, store } for debugging and tests
});
if (mounted) linkStage(mounted.stage);

// While the yard is being told, by the voice, a guide or a part's sheet, the clock waits where the words can be seen. Kit request 17.
if (mounted) lab.onFrame = holdClockForTelling(mounted.ctx.narration, lab.sim, () => mounted.store.state);
