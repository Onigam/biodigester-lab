import type { SiteId } from './climate';
import type { AlarmKey, BurnerMode, FlameOutCause, PresetId, ScenarioId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit. Every figure from the model carries † or *; a test reads them against the runs (`texts.test.ts`),
// another forbids research references and any wording that promises safety. Reported figures carry no mark. « This is a model » is said once, in the scenario where it matters.

export type Pair = readonly [string, string];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  overload: {
    text: ['Plus de 2 kg de matière organique par m³ et par jour', 'More than 2 kg of organic matter per m³ a day'],
    severe: false,
  },
  souring: {
    text: [
      'Les acides s’accumulent plus vite qu’ils ne sont mangés',
      'Acids are building up faster than they are eaten',
    ],
    severe: false,
  },
  soured: {
    text: ['La cuve a tourné à l’acide : le méthane s’arrête', 'The tank has soured: the methane stops'],
    severe: true,
  },
  tooCold: { text: ['Sous 15 °C dans la cuve', 'Below 15 °C in the tank'], severe: false },
  nearFreezing: { text: ['La cuve approche du gel', 'The tank nears freezing'], severe: true },
  tooHot: { text: ['Au-dessus de 40 °C dans la cuve', 'Above 40 °C in the tank'], severe: false },
  bellFull: {
    text: ['Cloche pleine : le gaz sort par le bord, sans brûler', 'Bell full: gas leaves over the rim, unburnt'],
    severe: false,
  },
  bellResting: {
    text: ['La cloche est posée : plus rien à tirer', 'The bell is resting: nothing more to draw'],
    severe: false,
  },
  flameOutGasLeft: {
    text: ['La flamme s’est éteinte : robinet à fermer', 'The flame has gone out: the tap must be closed'],
    severe: true,
  },
  leanGas: { text: ['Trop peu de méthane pour tenir une flamme', 'Too little methane to hold a flame'], severe: false },
  hoseWater: {
    text: ['De l’eau au point bas du tuyau retient le gaz', 'Water at the hose’s low point is holding the gas back'],
    severe: false,
  },
  airInBell: {
    text: [
      'De l’air dans la cloche : le mélange de gaz et d’air peut exploser',
      'Air in the bell: the mix of gas and air can explode',
    ],
    severe: true,
  },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  'plant-1000': ['1 000 et 750 L, la mesurée', '1,000 and 750 L, the one measured'],
  'plant-1500': ['1 500 et 1 000 L, la taille choisie ensuite', '1,500 and 1,000 L, the size chosen later'],
  'plant-1100': ['1 100 et 750 L, une construction au Guatemala', '1,100 and 750 L, a build in Guatemala'],
  'school-4000': ['4 000 et 3 000 L, l’installation d’une école', '4,000 and 3,000 L, a school’s plant'],
  'drum-60': ['Bidon de 60 L et poche de 150 L', 'A 60 L drum and a 150 L bag'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'measured-day': {
    name: ['La journée mesurée', 'The measured day'],
    lesson: [
      'Deux kilos de restes de cuisine par jour et dix-huit litres d’eau, à Dar es Salaam. La cloche monte toute la journée et redescend à chaque repas. Le modèle trouve environ 280 L † de gaz par jour, là où la thèse en a mesuré 289 : à peu près une heure de flamme sur ce petit brûleur, 1,5 kW † en entrée.',
      'Two kilos of kitchen leftovers a day and eighteen litres of water, at Dar es Salaam. The bell climbs all day and comes down at each meal. The model finds about 280 L † of gas a day, where the thesis measured 289: about an hour of flame on this small burner, 1.5 kW † going in.',
    ],
  },
  'market-waste': {
    name: ['Des épluchures', 'Peelings'],
    lesson: [
      'Les mêmes deux kilos en épluchures : surtout de l’eau et des fibres, deux fois moins de matière sèche. Le modèle trouve 76 L † par jour où la thèse en a mesuré 126, plus que ce que la matière mesurée pouvait donner : il n’atteint pas ce chiffre, et ne le force pas. Le méthane monte pourtant à 69 % † (66 % mesurés) : le liquide emporte à peu près le même volume de CO₂, qui pèse plus dans un petit débit.',
      'The same two kilos as peelings: mostly water and fibre, half the dry matter. The model finds 76 L † a day where the thesis measured 126, more than the measured matter could give: it does not reach that figure, and does not force it. Methane still rises to 69 % † (66 % measured): the liquid carries off about the same volume of CO₂, which weighs more in a small flow.',
    ],
  },
  'ramp-to-five': {
    name: ['La montée à cinq kilos', 'The ramp to five kilos'],
    lesson: [
      'Un quart de kilo de plus tous les trois jours. Les méthanogènes ont le temps de se multiplier : le pH bouge à peine et le gaz suit, jusqu’à environ 690 L † par jour et deux heures et demie de flamme. La thèse a mesuré 670 L et 150 minutes. Elle a vu le pH descendre jusqu’à 6,2 ; le modèle reste au-dessus de 6,5 †, et cet écart n’est pas résolu.',
      'A quarter of a kilo more every three days. The methanogens have time to multiply: the pH hardly moves and the gas follows, up to about 690 L † a day and two and a half hours of flame. The thesis measured 670 L and 150 minutes. It saw the pH go down to 6.2; the model stays above 6.5 †, and that gap is unresolved.',
    ],
  },
  'three-days-away': {
    name: ['Trois jours d’absence', 'Three days away'],
    lesson: [
      'Trois jours sans nourriture. Le gaz ne s’arrête pas d’un coup : d’un repas, la moitié du gaz arrive en deux jours †, et le reste traîne deux semaines †. Il tombe à environ 125 L † par jour, puis revient en quelques jours. C’est tout ce qu’il reste de la promesse d’un gaz « en un ou deux jours ».',
      'Three days without food. The gas does not stop at once: of one meal, half the gas comes within two days †, and the rest drags on for two weeks †. It falls to about 125 L † a day, then returns within days. That is what is left of the promise of gas « in a day or two ».',
    ],
  },
  overfeed: {
    name: ['Trop, d’un coup', 'Too much, at once'],
    lesson: [
      'Douze kilos par jour, sans montée. Trois jours durant, tout semble aller mieux : le gaz triple, et le pH n’a perdu que quelques dixièmes. Le quatrième jour il cède, le cinquième le gaz s’arrête : les acides ont dépassé ce que les méthanogènes pouvaient manger, et leur acidité les arrête. On coupe la nourriture : dans le modèle, rien ne revient seul, mais cent litres d’eau par jour le ramènent en deux mois †. Ce seuil, vers 10 kg par jour †, vaut à 32 °C dans une cuve mélangée : une vraie cuve, non brassée, s’acidifie plus tôt près de son entrée, et le livre de référence s’arrête à 7,5 kg †.',
      'Twelve kilos a day, with no ramp. For three days everything seems to improve: the gas triples, and the pH has lost only a few tenths. On the fourth day it gives way, on the fifth the gas stops: the acids have outrun what the methanogens could eat, and their sourness stops them. The food is cut: in the model, nothing comes back by itself, but a hundred litres of water a day bring it back in two months †. This threshold, near 10 kg a day †, holds at 32 °C in a mixed tank: a real, unstirred tank sours earlier near its inlet, and the reference book stops at 7.5 kg †.',
    ],
  },
  'half-brick': {
    name: ['Le demi-parpaing', 'The half-brick'],
    lesson: [
      'Douze kilos posés sur la cloche : 2,03 mbar † de plus, ce que la thèse a lu sur son manomètre. La flamme grandit, le gaz part plus vite. Un simple orifice donne alors 1,4 fois † le débit ; la thèse a mesuré 1,84 fois †. L’écart n’est pas expliqué.',
      'Twelve kilos laid on the bell: 2.03 mbar † more, what the thesis read on its gauge. The flame grows, the gas goes faster. A plain orifice then gives 1.4 times † the flow; the thesis measured 1.84 times †. The gap is not explained.',
    ],
  },
  'full-bell': {
    name: ['La cloche pleine', 'The full bell'],
    lesson: [
      'Personne ne cuisine. La cloche monte au bout de sa course, et le gaz ressort sous son bord, sans brûler. C’est la seule soupape de cette installation, et c’est du méthane qui part dans l’air, en plus de ce que l’anneau ouvert laisse déjà échapper chaque jour.',
      'Nobody cooks. The bell climbs to the end of its travel, and gas comes out under its rim, unburnt. It is this plant’s only relief, and it is methane going into the air, on top of what the open ring already lets go every day.',
    ],
  },
  'geneva-january': {
    name: ['Un hiver à Genève', 'A winter at Geneva'],
    lesson: [
      'Sur deux kilos par jour, une cuve nue passe-t-elle l’hiver à Genève ? Le modèle ne peut pas trancher : elle tient jusqu’à 43 kJ/mol *, tourne dès 44 *, et le seul indice que nous ayons trouvé sur cette énergie d’activation tombe vers 44 *. Déplacez son curseur. Au réglage d’ouverture, 60 *, la cuve suit l’air depuis septembre, le gaz baisse de mois en mois. Début décembre, vers 6 °C *, les méthanogènes ne mangent plus ce qu’on leur donne : le pH s’effondre, et le gaz ne revient pas au printemps *. Sans nourriture de novembre à mars, il revient seul en avril *. Aux extrêmes : à 40 kJ/mol la cuve passe l’hiver *, à 80 elle cède plus tôt *. Nous n’avons trouvé aucune mesure de ce genre d’installation sous 25 °C environ : ce scénario n’est qu’un modèle.',
      'On two kilos a day, does a bare tank last the winter at Geneva? The model cannot decide: it holds up to 43 kJ/mol *, sours from 44 *, and the one clue we found to this activation energy stands near 44 *. Move its slider. At the opening setting, 60 *, the tank follows the air from September, the gas falling month by month. In early December, near 6 °C *, the methanogens no longer eat what they are given: the pH collapses, and the gas does not return in spring *. With no food from November to March, it returns by itself in April *. At the extremes: at 40 kJ/mol the tank comes through the winter *, at 80 it gives way sooner *. We found no measurement of a plant of this kind below about 25 °C: this scenario is only a model.',
    ],
  },
  'flame-out': {
    name: ['La flamme s’éteint', 'The flame goes out'],
    lesson: [
      'Le brûleur reste ouvert jusqu’au bout. À mesure que la cloche descend, sa paroi replonge dans la bouillie, qui la porte : la pression baisse et la flamme rétrécit. Puis la cloche se pose. Il reste environ 230 L * de gaz sous elle, qu’aucun robinet ne peut plus tirer, car cette cloche est plus haute que le liquide n’est profond.',
      'The burner stays open to the end. As the bell comes down, its wall dips back into the slurry, which carries it: the pressure falls and the flame shrinks. Then the bell comes to rest. About 230 L * of gas remain under it, which no tap can draw any more, because this bell is taller than the liquid is deep.',
    ],
  },
  'water-in-hose': {
    name: ['De l’eau dans le tuyau', 'Water in the hose'],
    lesson: [
      'Le gaz sort saturé de vapeur et se refroidit dans le tuyau : quelques grammes d’eau par jour † s’amassent au point bas, s’il n’y a pas de piège. Toute la poussée de la cloche ne vaut que deux centimètres d’eau †. Cent, deux cents, trois cents millilitres, des semaines de condensat résumées ici : la flamme faiblit, puis ne tient plus, et la cloche pleine laisse le gaz partir par son bord. Des installations réelles se sont arrêtées ainsi.',
      'The gas leaves saturated with vapour and cools in the hose: a few grams of water a day † gather at the low point, if there is no trap. The bell’s whole push is worth only two centimetres of water †. A hundred, two hundred, three hundred millilitres, weeks of condensate told in steps: the flame weakens, then no longer holds, and the full bell lets the gas go over its rim. Real plants have stopped this way.',
    ],
  },
  'geneva-heated': {
    name: ['Genève, emballée et chauffée', 'Geneva, wrapped and heated'],
    lesson: [
      'Janvier à Genève, la cuve dans quinze centimètres de paille, chauffée à 30 °C. Le gaz revient : 1,4 kWh * par jour. Le chauffage en demande 1,7 *, et le brûleur ne rendrait qu’à peu près la moitié de son gaz sous forme de chaleur utile. En plein hiver, le gaz ne paie pas la chaleur qu’il demande. La paille seule, sans chauffage, ne sauve pas la cuve : elle garde la chaleur et arrête aussi le soleil, et l’eau froide du jour reste.',
      'January at Geneva, the tank in fifteen centimetres of straw, heated to 30 °C. The gas returns: 1.4 kWh * a day. The heating asks for 1.7 *, and the burner would give back only about half of its gas as useful heat. In midwinter, the gas does not pay for the warmth it asks. Straw alone, without heating, does not save the tank: it keeps heat in and also keeps the sun out, and the day’s cold water remains.',
    ],
  },
  'small-drum': {
    name: ['Le bidon de 60 litres', 'The 60-litre drum'],
    lesson: [
      'Un bidon de 60 L tenu à 38 °C, chargé cinq fois plus que la grande cuve. Le modèle tient : 93 L * par jour et un pH de 7,1 *, car ce peu d’eau concentre le tampon. Il ne voit pas l’ammoniac que cette même concentration peut rendre toxique pour les méthanogènes. Le tapis chauffant, lui, se paie : en janvier à Genève, trois fois * l’énergie du gaz.',
      'A 60 L drum held at 38 °C, loaded five times more than the large tank. The model holds: 93 L * a day and a pH of 7.1 *, because so little water concentrates the buffer. It does not see the ammonia that the same concentration can make toxic to methanogens. The heating mat has its price: in January at Geneva, three times * the energy in the gas.',
    ],
  },
};

export const BURNER_TEXTS: Record<BurnerMode, Pair> = {
  meals: ['Aux repas', 'At mealtimes'],
  on: ['Allumé', 'Lit'],
  off: ['Fermé', 'Closed'],
};

export const FLAME_OUT_TEXTS: Record<FlameOutCause, Pair> = {
  none: ['', ''],
  pressure: ['Plus assez de pression au brûleur', 'Not enough pressure at the burner'],
  resting: ['La cloche s’est posée', 'The bell came to rest'],
  lean: ['Trop peu de méthane', 'Too little methane'],
  water: ['De l’eau dans le tuyau', 'Water in the hose'],
};

export const SITE_TEXTS: Record<SiteId, Pair> = {
  'dar-es-salaam': ['Dar es Salaam', 'Dar es Salaam'],
  pune: ['Pune', 'Pune'],
  marseille: ['Marseille', 'Marseille'],
  geneva: ['Genève', 'Geneva'],
};

/** Said once, in the panel, beside the two marks. */
export const TAG_NOTE: Pair = [
  '† résultat du modèle, là où une installation a été mesurée. * le même modèle là où aucune ne l’a été : sous 25 °C environ, ailleurs qu’à Dar es Salaam, ou sur une taille que personne n’a mesurée. Le H₂S réel de ce gaz reste inconnu : le seul instrument qui l’a lu plafonnait à 100 ppm.',
  '† a model result, where a plant has been measured. * the same model where none has: below about 25 °C, anywhere but Dar es Salaam, or on a size nobody measured. The real H₂S in this gas stays unknown: the only instrument that read it stopped at 100 ppm.',
];
