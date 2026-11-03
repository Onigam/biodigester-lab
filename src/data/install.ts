// Installation guide (10 steps), docs/research.md §0.5 and §4.5: from the place to the daily feed, as the thesis reports it. A step plays in one world and frames what the gesture is about. Every step ends on its origin; the first says this is not a plan to follow. No duration and no tool list as an instruction.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { ORIGIN, withOrigin } from './assembly';
import { lf } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'place',
    scene: 'yard',
    title: l('La place, le soleil, l’ombre', 'The place, the sun, the shade'),
    text: withOrigin(
      lf(
        'Ce qui suit raconte une installation qui a été mesurée, et d’autres qui ont été visitées : ce n’est pas un plan à suivre, et cela ne prouve rien sur la sécurité. À Dar es Salaam, le lieu a été choisi clos, surveillé et près de l’eau, et trois **arbres** ont été coupés pour 7,5 h de soleil direct. Ici, le soleil est celui de la Simulation.',
        'What follows tells of a plant that was measured, and of others that were visited: it is not a plan to follow, and it proves nothing about safety. At Dar es Salaam the place was chosen fenced, guarded and near water, and three **trees** were cut for 7.5 h of direct sun. Here, the sun is the Simulation’s.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['shade-tree'],
  },
  {
    id: 'pad',
    scene: 'yard',
    title: l('La dalle et l’installation', 'The pad and the plant'),
    text: withOrigin(
      lf(
        'La **dalle** est plate et assez large pour la cuve et son seau : ses dimensions, {padSize}, sont les nôtres. L’**installation** complète y prend environ 2 m², sur 2,5 m de haut, et pèse environ {plantMass} une fois pleine. La thèse la veut au plus près du brûleur, en plein soleil.',
        'The **pad** is flat and wide enough for the tank and its bucket: its sizes, {padSize}, are ours. The whole **plant** takes about 2 m² on it, 2.5 m high, and weighs about {plantMass} when full. The thesis wants it as near the burner as can be, in full sun.',
      ),
      ORIGIN.reading,
    ),
    parts: ['yard-pad', 'biogas-plant'],
  },
  {
    id: 'water',
    scene: 'yard',
    title: l('L’eau à côté', 'The water beside it'),
    text: withOrigin(
      l(
        'Une **réserve d’eau** à côté de la cuve : c’est bien plus qu’une commodité, car la thèse la garde là pour que l’eau arrive à la même température. Chaque jour, environ 18 L y passent.',
        'A **water butt** beside the tank: it is more than a convenience, as the thesis keeps it there so that the water arrives at the same temperature. About 18 L pass through it each day.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['water-butt'],
  },
  {
    id: 'hose-run',
    scene: 'yard',
    title: l('La pente du tuyau', 'The hose’s fall'),
    text: withOrigin(
      l(
        'De la cuve à la **cuisine**, la **conduite** descend à un seul point bas, au pied du mur. Le modèle prend une pente estimée de chaque côté. La thèse note que l’eau bouche le tuyau chaque semaine sur des installations bien conduites, et que les longues distances entre cuve et brûleur posent problème.',
        'From the tank to the **kitchen**, the **hose run** falls to a single low point, at the foot of the wall. The model takes an estimated slope either side. The thesis notes that water clogs the hose every week on well-run plants, and that long distances from tank to burner cause trouble.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['hose-run', 'kitchen-house'],
  },
  {
    id: 'leak-test',
    scene: 'gas-line',
    title: l('La recherche de fuites', 'The search for leaks'),
    text: withOrigin(
      l(
        'Le livre et le Low-tech Lab font la même chose : de l’eau savonneuse sur chaque raccord, le **tuyau** sous pression, la **vanne** fermée. Des bulles disent une fuite. L’**aération** reste ouverte. La thèse conseille aussi de sentir les points fragiles, et ce conseil n’a pas sa place ici : le nez ne dit pas assez.',
        'The book and the Low-tech Lab do the same: soapy water on each joint, the **hose** under pressure, the **valve** closed. Bubbles mean a leak. The **vent** stays open. The thesis also advises smelling the weak spots, and that advice has no place here: the nose does not say enough.',
      ),
      ORIGIN.book,
    ),
    parts: ['bell-hose', 'kitchen-valve', 'vent-opening'],
    warning: l(
      'Pas de flamme pour chercher une fuite. Le méthane dans l’air explose entre 5 et 15 %, et dans une pièce fermée il s’accumule : aération ouverte, robinet fermé dès qu’un doute existe.',
      'No flame to look for a leak. Methane in air explodes between 5 and 15 %, and in a closed room it gathers: vent open, tap shut as soon as there is any doubt.',
    ),
  },
  {
    id: 'seed',
    scene: 'digester',
    title: l('L’ensemencement', 'The seeding'),
    text: withOrigin(
      lf(
        'À Dar es Salaam, 60 kg de bouse de vache séchée ont été mélangés à la main avec de l’eau, la paille retirée, puis versés avec environ 300 L d’effluent d’une autre installation : ce sont les **boues** et le **liquide clair** du départ. Dans le modèle, tout ce début tient à des estimations : la cuve survit à {seedOK} de semence, et pas à {seedFail}.',
        'At Dar es Salaam, 60 kg of dried cow dung were mixed by hand with water, the straw taken out, then poured in with about 300 L of effluent from another plant: those are the starting **sludge** and **clear liquor**. In the model all this start rests on estimates: the tank survives {seedOK} of seed, and not {seedFail}.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['sludge-bed', 'clear-liquor'],
    warning: l(
      'Personne ne descend dans la cuve pour remplir, mélanger ou nettoyer. Le méthane et le CO₂ y prennent la place de l’oxygène.',
      'Nobody goes down into the tank to fill, mix or clean. Methane and CO₂ take the oxygen’s place there.',
    ),
  },
  {
    id: 'unfed',
    scene: 'digester',
    title: l('Dix jours sans nourriture', 'Ten days unfed'),
    text: withOrigin(
      l(
        'La cuve est restée dix jours sans repas. Chaque jour, la thèse a noté la composition du gaz et relâché le **volume de gaz** par le **robinet**. Ce premier gaz n’est pas pour la cuisine : il se forme dans l’air que contenait la cloche.',
        'The tank stayed ten days with no feed. Each day the thesis noted the gas’s make-up and let the **gas space** go through the **tap**. This first gas is not for the kitchen: it forms in the air the bell held.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['gas-space', 'gas-tap'],
    warning: l(
      'Dans les premiers jours, ce mélange d’air et de gaz peut exploser. Le gaz relâché part à l’air libre, sans aucune flamme à proximité.',
      'In the first days, this mix of air and gas can explode. The gas let go goes into the open air, with no flame anywhere near.',
    ),
  },
  {
    id: 'ramp',
    scene: 'gas-line',
    title: l('La montée', 'The ramp'),
    text: withOrigin(
      lf(
        'Puis la ration a monté de 150 g par repas, jusqu’à 1 kg deux fois par jour. Les déchets passent au **hachoir**, sous 1 cm, et dans le **seau de dilution**, jusqu’à la marque des 10 L. C’est le geste qui protège la cuve : les méthanogènes se multiplient lentement. Sans montée, le modèle voit le gaz tripler trois jours, puis s’arrêter, autour de {soursAt32} par jour à 32 °C, et il se montre là sans doute optimiste.',
        'Then the ration rose by 150 g per feed, up to 1 kg twice a day. The scraps go through the **mincer**, under 1 cm, and into the **dilution bucket**, up to the 10 L mark. That gesture is what protects the tank: the methanogens multiply slowly. With no ramp the model sees the gas triple for three days, then stop, at about {soursAt32} a day at 32 °C, and it is no doubt hopeful there.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['mincer', 'dilution-bucket'],
  },
  {
    id: 'daily',
    scene: 'yard',
    title: l('Le geste de chaque jour', 'The daily routine'),
    text: withOrigin(
      l(
        'Deux repas, à 8 h 30 et 17 h. Le **seau à déchets** se vide dans l’entonnoir. Ce qui ne doit pas entrer, os, bois, fibres, va au **compost**. Le **seau de trop-plein** reçoit autant que ce qui est entré, environ 20 L par jour, et se vide au **potager**, dilué, loin des feuilles qu’on mange crues : les germes survivent à cette digestion. Une personne doit savoir pourquoi elle fait cela : c’est ce qui a manqué aux installations à l’arrêt.',
        'Two feeds, at 8:30 and 17:00. The **scrap caddy** goes into the funnel. What must not go in, bones, wood, fibre, goes to the **compost**. The **overflow bucket** takes as much as went in, about 20 L a day, and goes to the **vegetable bed**, diluted, away from leaves eaten raw: germs survive this digestion. Someone has to know why they do this: that is what the stopped plants lacked.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['scrap-caddy', 'overflow-bucket', 'compost-heap', 'vegetable-bed'],
  },
  {
    id: 'checks',
    scene: 'gas-line',
    title: l('Les contrôles', 'The checks'),
    text: withOrigin(
      l(
        'Le **piège** se vide régulièrement. Le **réglage d’air** se lit à la couleur de la flamme. La thèse conseille de remuer l’anneau chaque semaine, pour les larves, de lire le pH au papier, et un suivi après la pose, qui a tout changé sur le terrain. Le **détecteur** vient d’une règle pour d’autres installations : aucune de celles que nous avons lues n’en avait.',
        'The **trap** is emptied regularly. The **air setting** reads in the flame’s colour. The thesis advises stirring the ring weekly, for the larvae, reading the pH with paper, and a follow-up after installation, which changed everything in the field. The **detector** comes from a rule for other plants: none of those we read had one.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['condensate-trap', 'primary-air-sleeve', 'gas-detector'],
  },
];
