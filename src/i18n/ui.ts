import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit, the simulation's in src/sim/texts.ts; add here only what is specific to this lab.
// Said once, here and in the Sources panel: educational reconstruction, the machine's name, the marks in full, the plain law sentence. ARTI is named in `noticeMachine` and in the Sources' links, nowhere else.

const figs = (fr: string, en: string): readonly [string, string] => {
  const t = lf(fr, en);
  return [t.fr, t.en];
};

export const LAB_STRINGS = {
  labTitle: ['BIODIGESTEUR', 'BIODIGESTER'],
  tagline: [
    'Des restes de cuisine à la flamme, en 3D : la cloche, la vie dans la cuve, le gaz et ses limites',
    'From kitchen scraps to a flame, in 3D: the bell, the life in the tank, the gas and its limits',
  ],
  // the four must fit the phone's bar
  sceneYard: ['Cour', 'Yard'],
  sceneDigester: ['Cuve', 'Tank'],
  sceneSlurry: ['Goutte', 'Drop'],
  sceneGasLine: ['Ligne de gaz', 'Gas line'],
  goYard: ['Revenir à la cour', 'Back to the yard'],
  goDigester: ['Voir la machine en coupe', 'See the machine in section'],
  goSlurry: ['Plonger dans une goutte', 'Dive into a drop'],
  goGasLine: ['Suivre le gaz', 'Follow the gas'],
  goSimulation: ['Lancer la simulation', 'Run the simulation'],
  // for `partActions` on the flame's sheet: `sim.lightBurner()`. The flame has nothing to outline while the model has it off
  lightBurner: ['Allumer le brûleur', 'Light the burner'],
  plansIntro: [
    'Dix planches A3 générées à partir des cotes du modèle 3D et de la simulation : la cour et l’installation, la cuve en coupe, la cloche et son anneau, l’entrée et le trop-plein, la ligne de gaz, la chaîne du vivant, le bilan de matière, la chaleur et le temps, les dangers, et les autres tailles. Une marque dit ce qui vient d’une source et ce que nous avons estimé. Elles servent à comprendre : ce ne sont pas des plans à suivre.',
    'Ten A3 sheets generated from the 3D model’s dimensions and from the simulation: the yard and the plant, the tank in section, the bell and its ring, the inlet and the overflow, the gas line, the chain of life, the mass balance, warmth and time, the hazards, and the other sizes. A mark says what comes from a source and what we estimated. They are for understanding: they are not plans to follow.',
  ],
  lessonsIntro: [
    'Sept leçons, de ce qui fait le gaz à ce que vaut la machine. Chacune ouvre un scénario de la Simulation et finit par deux questions. Un chiffre marqué † est calculé, à partir de chiffres publiés ou par le modèle là où une installation a été mesurée ; marqué *, c’est une estimation, ou le même modèle là où aucune ne l’a été.',
    'Seven lessons, from what makes the gas to what the machine is worth. Each opens a scenario of the Simulation and ends with two questions. A figure marked † is computed, from published figures or by the model where a plant has been measured; marked *, it is an estimate, or the same model where none has been.',
  ],
  // ---- for the simulation panel: the words the sheets and lessons use for its controls. A panel that names them otherwise breaks those texts
  sliderFeed: ['Nourriture par jour', 'Food a day'],
  sliderCooked: ['Part de restes cuits', 'Share of cooked leftovers'],
  sliderWater: ['Eau par kilo', 'Water per kilo'],
  sliderMinutes: ['Minutes de cuisine', 'Minutes of cooking'],
  sliderBurner: ['Débit du brûleur', 'Burner’s flow'],
  sliderWeight: ['Poids sur la cloche', 'Weight on the bell'],
  sliderRim: ['Perte à l’anneau', 'Loss at the ring'],
  sliderSun: ['Heures de soleil', 'Hours of sun'],
  sliderEa: ['Énergie d’activation', 'Activation energy'],
  // the hint beside that slider, in the Geneva scenario: the model cannot decide the winter
  eaHint: figs(
    'Le chiffre qui décide de l’hiver : sur 2 kg par jour à Genève, une cuve nue tient jusqu’à {eaHolds} et tourne dès {eaFails}. Le seul indice que nous ayons trouvé tombe vers {eaClue}. Le modèle ne tranche donc pas.',
    'The figure that decides the winter: on 2 kg a day at Geneva, a bare tank holds up to {eaHolds} and sours from {eaFails}. The one clue we found stands near {eaClue}. So the model does not decide.',
  ),
  // the hint under the starting points, shown when the machine is not the drawn one (`state.onDrawnMachine`)
  drawnHint: [
    'Le dessin reste celui de la cuve de 1 000 L : cette taille ne change que les chiffres, et la cloche dessinée monte selon sa part de course.',
    'The drawing stays that of the 1,000 L tank: this size changes only the figures, and the bell drawn rises by its share of travel.',
  ],
  // the hint under the site, shown when it is not Dar es Salaam
  siteHint: [
    'La cour et ses plantes restent celles d’un climat chaud : seuls le soleil et les chiffres suivent le lieu.',
    'The yard and its plants stay those of a warm climate: only the sun and the figures follow the place.',
  ],
  disclaimer: [
    'Reconstitution pédagogique indépendante : ni un plan officiel, ni un produit de ses concepteurs, et ce lab ne leur est pas affilié.',
    'An independent educational reconstruction: neither an official drawing nor a product of its designers, and this lab is not affiliated with them.',
  ],
  noticeMachine: [
    'La machine dessinée est la cloche flottante à deux cuves de l’Appropriate Rural Technology Institute (ARTI), en Inde, due au Dr A. D. Karve, telle qu’une thèse l’a dessinée et mesurée à Dar es Salaam en 2008. Ce choix tient aux documents disponibles : c’est la seule petite cuve à déchets de cuisine pour laquelle nous ayons pu lire ensemble un plan coté, un suivi indépendant de quatre mois et une enquête sur ce que les installations sont devenues. Une installation, quatre mois, une thèse de bachelor. Le piège, la soupape, le filtre, l’arrête-flamme et le limiteur n’y étaient pas : leur fiche le dit. Aucun logo dans la 3D.',
    'The machine drawn is the two-tank floating bell of the Appropriate Rural Technology Institute (ARTI), India, due to Dr A. D. Karve, as a thesis drew and measured it at Dar es Salaam in 2008. That choice follows the documents available: it is the one small kitchen-scrap digester for which we could read a dimensioned drawing, four months of independent monitoring and a survey of what became of the plants, all together. One plant, four months, a bachelor thesis. The trap, the relief, the filter, the arrester and the limiter were not on it: their sheets say so. No logo in the 3D.',
  ],
  noticeMarks: figs(
    'Les chiffres : sans marque, ils viennent d’une source ; † ils sont calculés, à partir de chiffres publiés ou par le modèle de ce lab là où une installation a été mesurée ; * ce sont des estimations, faute de source, ou le même modèle là où aucune ne l’a été. Nous n’avons trouvé aucune mesure de ce genre d’installation sous 25 °C environ : la France, la Suisse et tout hiver sont le modèle seul, et un hiver à Genève tient à un chiffre, l’énergie d’activation, pour lequel le seul indice trouvé vient d’un résumé. Le modèle ne retrouve pas le gaz mesuré sur les déchets de marché, {marketLow} à {marketHigh} contre 126 L, et il ne le force pas. L’H₂S de ce gaz reste inconnu : le capteur de la thèse s’arrêtait à 100 ppm. Un chiffre marqué n’est pas une mesure.',
    'The figures: with no mark, they come from a source; † they are computed, from published figures or by this lab’s model where a plant has been measured; * they are estimates, for want of a source, or the same model where none has been. We found no measurement of a plant of this kind below about 25 °C: France, Switzerland and any winter are the model alone, and a winter at Geneva rests on one figure, the activation energy, for which the one clue found comes from a summary. The model does not retrieve the gas measured on market waste, {marketLow} to {marketHigh} against 126 L, and does not force it. This gas’s H₂S stays unknown: the thesis’s sensor stopped at 100 ppm. A marked figure is not a measurement.',
  ),
  safety: [
    'Ce gaz peut exploser dans l’air, il contient un poison que le nez cesse de sentir, il prend la place de l’oxygène dans une cuve ou une fosse, sa flamme se voit mal et, mal réglée, elle produit du monoxyde de carbone ; l’effluent garde des germes. Chaque fiche le dit là où le geste compte. Ce lab est une lecture de travaux publiés, pour apprendre : ce n’est pas un plan à suivre, et il ne prouve rien sur la sécurité d’une installation chez vous.',
    'This gas can explode in air, it holds a poison the nose stops smelling, it takes the oxygen’s place in a tank or a pit, its flame is hard to see and, badly set, makes carbon monoxide; the effluent keeps germs. Each sheet says so where the gesture counts. This lab is a reading of published work, for learning: it is not a plan to follow, and it proves nothing about the safety of a plant in your home.',
  ],
  legal: [
    'Une telle installation relève des règles de votre pays : renseignez-vous auprès de votre autorité locale avant de construire quoi que ce soit.',
    'Such an installation is subject to the rules of your country: ask your local authority before you build anything.',
  ],
  sourceMain: ['La vidéo qui accompagne ce lab', 'The video that goes with this lab'],
  sourcesNoCopy: [
    'Aucune image, séquence ni transcription de ces vidéos ou de ces documents n’est reprise ici : le lab n’en retient que des faits, rédigés avec ses propres mots, et ses dessins sont refaits à partir des chiffres. Plusieurs documents n’ont pas pu être lus (l’article du concepteur en 2005, la version revue de la thèse, les annexes de celle-ci) : le lab le dit là où cela compte.',
    'No image, footage or transcript from these videos or documents is reused here: the lab keeps only facts from them, in its own words, and its drawings are made anew from the figures. Several documents could not be read (the designer’s 2005 paper, the peer-reviewed form of the thesis, its appendices): the lab says so where it matters.',
  ],
  // ---- the template's, still read by src/lab.ts and src/panels/sim.ts until the lead wires the lab
  sceneDevice: ['Dispositif', 'Device'],
  simTitle: ['Simulation', 'Simulation'],
  targetRpm: ['Vitesse cible', 'Target speed'],
  liveRpm: ['Vitesse', 'Speed'],
  groupDevice: ['Dispositif', 'Device'],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
