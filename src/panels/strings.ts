import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import {
  ALARM_TEXTS,
  BURNER_TEXTS,
  FLAME_OUT_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  SITE_TEXTS,
  TAG_NOTE,
  type Pair,
} from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. The words the sheets and lessons quote for its controls (`slider*`, `eaHint`, `drawnHint`, `siteHint`) are in src/i18n/ui.ts, which the data role owns; the alarms and scenarios are in src/sim/texts.ts.

const PANEL = {
  simTitle: ['Simulation', 'Simulation'],
  simIntro: [
    'La machine, de la nourriture à la flamme : ce qui vit dans la cuve, la cloche, le tuyau, le soleil. L’acide, la cloche posée et la flamme éteinte y apparaissent d’eux-mêmes, sans interrupteur. Tout y est un seul volume bien mélangé : une vraie cuve n’est pas brassée.',
    'The machine, from the food to the flame: what lives in the tank, the bell, the hose, the sun. The sourness, the resting bell and the dead flame appear by themselves, with no switch. All of it is one well-mixed volume: a real tank is not stirred.',
  ],
  speedHint: [
    'L’horloge s’ouvre à une heure par seconde, le ×3600 de la barre du bas : à sa vraie vitesse, la cloche ne se verrait pas monter. ×86400 est un jour par seconde.',
    'The clock opens at an hour a second, the ×3600 in the bottom bar: at its true speed the bell would not be seen to rise. ×86400 is a day a second.',
  ],
  preset: ['Point de départ', 'Starting point'],
  custom: ['Autres réglages', 'Other settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chacun raconte une chose, et règle lui-même la vitesse du temps.',
    'Each tells one thing, and sets the speed of time itself.',
  ],

  // ---- the status line
  statusBurning: ['Le brûleur brûle : la cloche descend.', 'The burner is burning: the bell comes down.'],
  statusRising: ['La flamme est éteinte : la cloche monte.', 'The flame is out: the bell rises.'],
  statusQuiet: ['Presque aucun gaz ne monte sous la cloche.', 'Hardly any gas rises under the bell.'],

  // ---- gestures
  feedNow: ['Nourrir maintenant', 'Feed now'],
  shutBurner: ['Fermer le robinet', 'Close the tap'],

  // ---- the live figures
  liveTank: ['Cuve', 'Tank'],
  livePH: ['pH', 'pH'],
  liveBell: ['Cloche', 'Bell'],
  livePressure: ['Pression', 'Pressure'],
  liveGas: ['Gaz d’hier', 'Gas yesterday'],
  liveCH4: ['Méthane', 'Methane'],
  liveFlame: ['Flamme d’hier', 'Flame yesterday'],
  liveEnergy: ['Son énergie', 'Its energy'],
  liveRatio: ['Acides / tampon', 'Acids / buffer'],

  moreLoad: ['Charge', 'Load'],
  moreAir: ['Air', 'Air'],
  moreSun: ['Soleil à l’horizontale', 'Sun on the horizontal'],
  moreAcids: ['Acides', 'Acids'],
  moreBuffer: ['Tampon restant', 'Buffer left'],
  moreMethanogens: ['Méthanogènes', 'Methanogens'],
  moreKFactor: ['Vitesse du vivant, par rapport à 30 °C', 'Speed of life, against 30 °C'],
  moreHydrolysis: ['Activité des hydrolyseurs', 'Activity of the hydrolysers'],
  moreMethanogenActivity: ['Activité des méthanogènes', 'Activity of the methanogens'],
  moreHrt: ['Séjour du liquide', 'Stay of the liquid'],
  moreSrt: ['Séjour des solides', 'Stay of the solids'],
  moreStock: ['Matière organique en cuve', 'Organic matter in the tank'],
  moreScum: ['Croûte', 'Scum'],
  moreSludge: ['Boues', 'Sludge'],
  moreBellIn: ['Gaz qui monte sous la cloche', 'Gas rising under the bell'],
  moreRim: ['Gaz perdu à l’anneau', 'Gas lost at the ring'],
  moreOver: ['Gaz qui sort sous le bord', 'Gas leaving under the rim'],
  moreLost: ['Perdu au bord, hier', 'Lost at the rim, yesterday'],
  moreCO2: ['CO₂', 'CO₂'],
  moreVapour: ['Vapeur d’eau', 'Water vapour'],
  moreH2S: ['H₂S', 'H₂S'],
  moreUnknown: ['inconnu', 'unknown'],
  moreTrapped: ['Gaz que la cloche garde', 'Gas the bell keeps'],
  moreBurner: ['Débit au brûleur', 'Flow at the burner'],
  moreBurnerP: ['Pression au brûleur', 'Pressure at the burner'],
  moreHoseDrop: ['Perdu dans le tuyau', 'Lost in the hose'],
  morePlug: ['Retenu par l’eau du tuyau', 'Held back by water in the hose'],
  morePower: ['Puissance en entrée', 'Power going in'],
  moreUseful: ['Puissance arrivée à la casserole', 'Power reaching the pot'],
  moreHoseWater: ['Eau au point bas', 'Water at the low point'],
  moreTrapWater: ['Eau dans le piège', 'Water in the trap'],
  moreEffluent: ['Effluent d’hier', 'Yesterday’s effluent'],
  moreHeater: ['Chauffage, hier', 'Heating, yesterday'],
  moreColdFeed: ['Pris par l’eau froide, hier', 'Taken by the cold water, yesterday'],

  // ---- the controls
  secFood: ['La nourriture', 'The food'],
  secKitchen: ['La cuisine et la ligne', 'The kitchen and the line'],
  secBell: ['La cloche', 'The bell'],
  secPlace: ['Le lieu', 'The place'],
  secHeat: ['La chaleur', 'The warmth'],
  secEstimates: ['Ce qu’aucune source ne donne', 'What no source gives'],
  moreTitle: ['Tous les chiffres', 'All the figures'],
  flush: ['Eau seule, par jour', 'Water alone, a day'],
  flushHint: [
    'Ce qui dilue une cuve tournée à l’acide : voyez « Trop, d’un coup ». Le modèle ne propose aucune recette.',
    'What dilutes a soured tank: see “Too much, at once”. The model offers no recipe.',
  ],
  burner: ['Le brûleur', 'The burner'],
  site: ['Lieu', 'Place'],
  month: ['Mois', 'Month'],
  seasons: ['Les saisons passent', 'The seasons pass'],
  wallU: ['Perte par la paroi', 'Loss through the wall'],
  wallHint: [
    '5 à nu, 0,25 dans quinze centimètres de paille : deux hypothèses de ce lab *. La paille garde la chaleur, et arrête aussi le soleil.',
    '5 bare, 0.25 in fifteen centimetres of straw: two assumptions of this lab *. The straw keeps heat in, and also keeps the sun out.',
  ],
  heater: ['Chauffage', 'Heating'],
  setPoint: ['Thermostat', 'Thermostat'],
  kFast: ['Hydrolyse de la part rapide', 'Hydrolysis of the fast share'],
  kSlow: ['Hydrolyse de la part lente', 'Hydrolysis of the slow share'],
  burnerExponent: ['Exposant du brûleur', 'Burner’s exponent'],
  exponentHint: [
    '0,5 est un simple orifice. 0,88 † retrouve les deux points de la thèse : c’est un ajustement, pas une découverte.',
    '0.5 is a plain orifice. 0.88 † retrieves the thesis’s two points: that is a fit, not a finding.',
  ],
  bellWall: ['Paroi de la cloche', 'The bell’s wall'],
  solids: ['Solides gardés, par rapport au liquide', 'Solids held, against the liquid'],
  hoseSlope: ['Pente du tuyau', 'Slope of the hose'],
  hoseWater: ['Eau au point bas', 'Water at the low point'],
  estimatesHint: [
    'À charge stable, le gaz du modèle bouge à peine avec ces vitesses et l’énergie d’activation : c’est la marge avant l’acide qu’elles déplacent, et nous n’en avons trouvé aucune mesure sur ces déchets.',
    'At a steady load the model’s gas hardly moves with these rates and the activation energy: it is the margin before the acid that they shift, and we found no measurement of them on this waste.',
  ],

  // ---- the charts
  chartBell: ['Gaz dans la cloche, ces derniers jours', 'Gas in the bell, these last days'],
  chartGas: ['Ce qui arrive sous la cloche, ce qui brûle', 'What reaches the bell, what burns'],
  chartPH: ['Le pH', 'The pH'],
  chartAcids: ['Les acides', 'The acids'],
  chartTemps: ['La cuve et l’air', 'The tank and the air'],
  chartsHint: [
    'Un point par heure simulée, soixante jours au plus, marqués comme les chiffres du moment.',
    'One point per simulated hour, sixty days at most, marked as the figures of the moment are.',
  ],
  seriesBell: ['Cloche', 'Bell'],
  seriesIn: ['Sous la cloche', 'Under the bell'],
  seriesBurnt: ['Brûleur', 'Burner'],
  seriesPH: ['pH', 'pH'],
  seriesAcids: ['Acides', 'Acids'],
  seriesTank: ['Cuve', 'Tank'],
  seriesAir: ['Air', 'Air'],

  // ---- units and the clock
  unitDays: ['j', 'd'],
  unitPerDay: ['/j', '/d'],
  unitLoad: ['kg/m³·j', 'kg/m³·d'],
  unitLitresDay: ['L/j', 'L/d'],
  unitKgDay: ['kg/j', 'kg/d'],
  unitLitresKg: ['L/kg', 'L/kg'],
  unitHours: ['h/j', 'h/d'],
  dayWord: ['jour', 'day'],
  monthShort: [
    'janv.,févr.,mars,avr.,mai,juin,juil.,août,sept.,oct.,nov.,déc.',
    'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
  ],
} as const satisfies Record<string, Pair>;

const fromSim = (prefix: string, table: Record<string, Pair>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}:${k}`, v]));

const SIM_TEXTS: Record<string, Pair> = {
  ...fromSim('alarm', Object.fromEntries(Object.entries(ALARM_TEXTS).map(([k, v]) => [k, v.text]))),
  ...fromSim('preset', PRESET_TEXTS),
  ...fromSim('scenario', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.name]))),
  ...fromSim('lesson', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.lesson]))),
  ...fromSim('burner', BURNER_TEXTS),
  ...fromSim('flameOut', Object.fromEntries(Object.entries(FLAME_OUT_TEXTS).filter(([k]) => k !== 'none'))),
  ...fromSim('site', SITE_TEXTS),
  tagNote: TAG_NOTE,
};

/** Every word of the panel, for the test of parity. */
export const PANEL_STRINGS: Record<string, Pair> = { ...PANEL, ...SIM_TEXTS };

registerStrings(PANEL_STRINGS);

export type PanelKey = keyof typeof PANEL;

/** A word of the panel in the language of the moment. */
export const st = (key: PanelKey | 'tagNote'): string => tx(key);

/** A word that comes from the simulation: `sx('alarm', 'soured')`. */
export const sx = (table: 'alarm' | 'preset' | 'scenario' | 'lesson' | 'burner' | 'flameOut' | 'site', id: string) =>
  tx(`${table}:${id}`);

/** A pair of src/sim/strip.ts in the language of the moment. */
export const say = (pair: Pair): string => pair[getLang() === 'fr' ? 0 : 1];

/** A number with the decimal mark of the language; no "-0". */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(Math.abs(value) * 10 ** digits) === 0 ? 0 : value;
  return v.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const months = (): string[] => st('monthShort').split(',');
