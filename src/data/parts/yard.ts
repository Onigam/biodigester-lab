// Parts of the `yard` world (10): the setting, a generic warm yard. Nothing in it is a measured place: its sizes are estimates, its reasons the thesis's. The whole circle in one look: scraps in, a flame out, fertiliser to the beds.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const YARD_PARTS: PartInfo[] = [
  {
    id: 'biogas-plant',
    scene: 'yard',
    category: 'site',
    name: l('Installation', 'Biogas plant'),
    short: l(
      'Deux cuves à eau, l’une retournée dans l’autre : des restes de cuisine entrent, une flamme sort.',
      'Two water tanks, one upside down inside the other: kitchen scraps go in, a flame comes out.',
    ),
    description: lf(
      'Une cuve de 1 000 L tient environ 850 L de bouillie ; une cuve de 750 L, retournée, flotte dessus et monte à mesure que le gaz s’y accumule. C’est la cloche flottante à deux cuves, une conception indienne. Le lab dessine celle qu’une thèse a suivie pendant quatre mois à Dar es Salaam, en 2008 : nourrie de 2 kg de restes et 18 L d’eau par jour, vers 30 °C, elle a donné 289 L de gaz par jour à 56,8 % de méthane. Une seule installation, mais c’est la seule petite cuve à déchets de cuisine pour laquelle nous ayons pu lire à la fois un plan coté, des mesures et une enquête sur ce que les installations sont devenues.',
      'A 1,000 L tank holds about 850 L of slurry; a 750 L tank, turned over, floats on it and rises as gas collects. This is the two-tank floating bell, an Indian design. The lab draws the one a thesis followed for four months at Dar es Salaam, in 2008: fed 2 kg of leftovers and 18 L of water a day, at about 30 °C, it gave 289 L of gas a day at 56.8 % methane. One plant only, but it is the one small kitchen-scrap digester for which we could read a drawing with dimensions, measurements and a survey of what became of the plants, all together.',
    ),
    material: l('Deux cuves en PEHD, tuyaux de plomberie courants', 'Two HDPE tanks, ordinary plumbing pipe'),
    specs: [
      sp('Cuves', 'Tanks', l('1 000 L et 750 L', '1,000 L and 750 L')),
      sp('Emprise', 'Footprint', l('environ 2 m², 2,5 m de haut', 'about 2 m², 2.5 m high')),
      sp('Posée et ensemencée', 'Installed and seeded', l('en 3,5 h, par une personne', 'in 3.5 h, by one person')),
      sp(
        'Prix en 2008',
        'Price in 2008',
        l('295,6 € de pièces et de main-d’œuvre, vendue 550 €', '295.6 € of parts and labour, sold at 550 €'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'En octobre 2008, sur 12 installations domestiques visitées, 4 tournaient, et 10 après cinq semaines de réparations. Causes relevées : une entrée cassée ou bouchée, trop de nourriture, un robinet de gaz cassé, de l’eau dans le tuyau, et personne à qui demander.',
        check:
          'La cloche monte-t-elle chaque jour ? C’est le premier signe de vie, et il se lit sans instrument. Une cloche qui reste en bas dit qu’il se passe quelque chose, sans dire quoi.',
        care: 'Le même geste deux fois par jour, par une personne qui sait pourquoi. La thèse juge le suivi après la pose indispensable, surtout les premiers mois, tant que l’habitude n’est pas prise.',
      },
      {
        failure:
          'In October 2008, of 12 household plants visited, 4 were running, and 10 after five weeks of repairs. The causes noted: a broken or blocked inlet, too much food, a broken gas tap, water in the hose, and nobody to ask.',
        check:
          'Does the bell rise every day? It is the first sign of life, read with no instrument. A bell that stays down says something is happening, without saying what.',
        care: 'The same gesture twice a day, by someone who knows why. The thesis finds follow-up after installation essential, above all in the first months, before the habit has formed.',
      },
    ),
    tip: l(
      'Le bouton de cette fiche ouvre la machine en coupe : c’est là que la cloche monte, en direct.',
      'The button on this sheet opens the machine in section: that is where the bell rises, live.',
    ),
    design: l(
      'Pourquoi deux cuves à eau ? Parce que la thèse a pu tout acheter sur place, cuves et plomberie. Le défaut vient avec : deux tailles du commerce ne s’emboîtent pas exactement, et cette cloche laisse 22 % de la surface à l’air. Son installateur en Tanzanie a ensuite préféré un couple 1 500 et 1 000 L.',
      'Why two water tanks? Because the thesis could buy everything locally, tanks and plumbing alike. The flaw comes with it: two sizes off the shelf do not nest exactly, and this bell leaves 22 % of the surface open to the air. Its installer in Tanzania later preferred a 1,500 and 1,000 L pair.',
    ),
  },
  {
    id: 'kitchen-house',
    scene: 'yard',
    category: 'site',
    name: l('Maison et cuisine', 'House and kitchen'),
    short: l(
      'Le début et la fin du cercle : les restes partent de cette cuisine, le gaz y revient.',
      'The start and the end of the circle: the scraps leave this kitchen, and the gas comes back to it.',
    ),
    description: lf(
      'La maison dessinée n’est celle de personne : plâtre, tôle ondulée, une cuisine en appentis. Elle est à l’échelle, {eaveHeight} à l’avant-toit, pour que l’installation se lise à côté d’elle. Ce qui compte, c’est sa distance : le mur de la cuisine est à {kitchenDistance} du centre de la dalle, pour que les 5 m de tuyau rapportés l’atteignent. La thèse a relevé des installations où le brûleur était loin de la cuve, et en a fait un point d’attention. Elle demande aussi une pièce bien aérée pour le brûleur : à Dar es Salaam les maisons sont ouvertes, ce qu’une cuisine fermée d’Europe n’est pas, et ce qui s’y accumulerait n’irait nulle part.',
      'The house drawn is nobody’s: plaster, corrugated iron, a lean-to kitchen. It is to scale, {eaveHeight} at the eaves, so that the plant reads beside it. What counts is its distance: the kitchen wall stands {kitchenDistance} from the middle of the pad, so that the reported 5 m of hose reach it. The thesis noted plants with the burner far from the tank, and marked that as a concern. It also asks for a well-ventilated room for the burner: houses at Dar es Salaam are open, which a closed European kitchen is not, and what gathered there would have nowhere to go.',
    ),
    material: l('Décor : plâtre, tôle, parpaing', 'Setting: plaster, sheet iron, block'),
    specs: [
      sp('Avant-toit, faîtage', 'Eaves, ridge', v('{eaveHeight}, {ridgeHeight}')),
      sp(
        'Du mur de cuisine au centre de la dalle',
        'From the kitchen wall to the middle of the pad',
        v('{kitchenDistance}'),
      ),
      sp('Tuyau rapporté', 'Hose reported', '5 m'),
    ],
    maintenance: maint(
      {
        failure:
          'La cuisine elle-même ne tombe pas en panne : c’est ce qui y entre. Un joint du tuyau qui fuit dans une pièce fermée est le cas qui compte, et le suivant est une flamme mal réglée.',
        check:
          'L’eau savonneuse sur les raccords, en ouvrant le robinet : des bulles disent une fuite. Le nez ne suffit pas, et la fiche du filtre dit pourquoi.',
        care: 'Une pièce qui reste aérée pendant la cuisson, un robinet fermé en partant. L’entretien du brûleur est sur sa propre fiche.',
      },
      {
        failure:
          'The kitchen itself does not break: what comes into it does. A hose joint leaking in a closed room is the case that counts, and the next is a badly set flame.',
        check:
          'Soapy water on the joints, with the tap open: bubbles mean a leak. The nose is not enough, and the filter’s sheet says why.',
        care: 'A room kept aired while cooking, a tap shut on leaving. The burner’s care is on its own sheet.',
      },
    ),
    tip: l(
      'Le monde de la ligne de gaz montre le même chemin à hauteur d’œil, du robinet à la casserole.',
      'The gas line’s world shows the same route at eye level, from the tap to the pot.',
    ),
    design: lf(
      'À cette pression, le gaz ne se conduit pas bien loin. D’où cette cuisine à quelques mètres de la cuve, et une pente continue du tuyau. La maison reste la même quand la Simulation part à Genève : seul le soleil suit.',
      'At this pressure the gas cannot be led far. Hence this kitchen a few metres from the tank, and a steady fall in the hose. The house stays the same when the Simulation goes to Geneva: only the sun follows.',
    ),
  },
  {
    id: 'yard-pad',
    scene: 'yard',
    category: 'structure',
    name: l('Dalle', 'Yard pad'),
    short: lf(
      'Ce qui porte environ {plantMass} : un socle plat, au soleil, assez large pour le seau et le gardien.',
      'What carries about {plantMass}: a flat base, in the sun, wide enough for the bucket and the keeper.',
    ),
    description: lf(
      'Environ 850 L de bouillie, deux cuves, une palette : l’ensemble pèse environ {plantMass}. Les photos de l’installation mesurée montrent du béton sous la palette, et aucune source ne donne de dimension : celles de ce dessin, {padSize}, sont les nôtres, de quoi poser la cuve, le seau du trop-plein et une personne qui verse. Une dalle n’a qu’un travail ici, mais il compte : rester plane. Le niveau de la bouillie est fixé par le trop-plein, dans le repère de la cuve, et une cuve qui penche déplace ce niveau sur son pourtour.',
      'About 850 L of slurry, two tanks, a pallet: together they weigh about {plantMass}. The photographs of the measured plant show concrete under the pallet, and no source gives a size: this drawing’s, {padSize}, are ours, enough for the tank, the overflow bucket and someone pouring. A pad has one job here, and it counts: staying flat. The slurry’s level is set by the overflow, in the tank’s own frame, and a tank that leans moves that level around its rim.',
    ),
    material: l('Béton, sur les photos ; dimensions estimées', 'Concrete, in the photographs; sizes estimated'),
    specs: [
      sp('Charge', 'Load', lf('environ {plantMass}', 'about {plantMass}')),
      sp('Dessinée', 'As drawn', v('{padSize}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un tassement d’un côté, une fissure au gel là où il gèle. Une dalle qui penche se voit d’abord sur le seau : le trop-plein ne coule plus au même endroit.',
        check: 'Un niveau posé sur le rebord de la cuve, deux fois en croix, de temps en temps.',
        care: 'Peu de chose : garder la surface nette, car une bouillie répandue attire les mouches et les escargots.',
      },
      {
        failure:
          'Settling on one side, a frost crack where it freezes. A leaning pad shows first at the bucket: the overflow no longer runs to the same place.',
        check: 'A level laid across the tank’s rim, in two directions at right angles, from time to time.',
        care: 'Not much: keep the surface clear, as spilt slurry draws flies and snails.',
      },
    ),
    tip: l(
      'Choisissez-la et pensez à ce qui manque : aucun drain, aucune cuvette. Une vraie dalle se demande où irait une fuite de 850 L.',
      'Pick it and think of what is missing: no drain, no bund. A real pad has to ask where a leak of 850 L would go.',
    ),
    design: l(
      'Une dalle au sol plutôt qu’une cuve enterrée : c’est ce qui laisse le soleil chauffer tout le flanc noir de la cuve. C’est aussi ce qui la laisse à la merci de l’air quand il fait froid. Les cuves enterrées d’autres conceptions font le choix inverse.',
      'A pad on the ground rather than a buried tank: that is what lets the sun warm the tank’s whole black side. It is also what leaves it at the mercy of the air in the cold. The buried tanks of other designs make the opposite choice.',
    ),
  },
  {
    id: 'water-butt',
    scene: 'yard',
    category: 'hydraulic',
    name: l('Réserve d’eau', 'Water butt'),
    short: l(
      'L’eau de dilution, gardée à côté de la cuve pour qu’elle arrive à la même température.',
      'The dilution water, kept beside the tank so that it arrives at the same temperature.',
    ),
    description: lf(
      'Le geste paraît sans importance, et il est mesurable : 18 L d’eau entrent chaque jour dans la cuve. La thèse la stockait à côté de la cuve, précisément pour qu’elle soit à la même température. Dans un mois à 10 °C, le calcul à la main donne {coldWaterKwh} par jour pour porter cette seule eau à 30 °C, soit environ un tiers de l’énergie du gaz de 2 kg de restes. Le modèle prend cette eau à la température moyenne de l’air du jour. Au Sud, on n’y pense pas ; à Genève, elle pèse.',
      'The gesture looks trivial, and it can be measured: 18 L of water enter the tank every day. The thesis stored it beside the tank, precisely so that it would be at the same temperature. In a 10 °C month, the sum by hand gives {coldWaterKwh} a day just to bring that water to 30 °C, about a third of the energy in the gas of 2 kg of leftovers. The model takes this water at the day’s mean air temperature. In the south nobody thinks of it; at Geneva it weighs.',
    ),
    material: l('Fût en plastique, générique', 'Plastic drum, generic'),
    specs: [
      sp('Eau par jour', 'Water a day', '18 L'),
      sp('Dessinée, Ø × hauteur', 'As drawn, Ø × height', v('{buttSize}')),
      sp('Eau froide, mois à 10 °C', 'Cold water, a 10 °C month', v('{coldWaterKwh}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une réserve ouverte devient un gîte à moustiques en climat chaud. Une réserve vide conduit à verser l’eau du robinet, froide, ou à sauter la dilution, et c’est alors le tube d’entrée qui se bouche.',
        check: 'Un couvercle en place, un niveau suffisant pour les deux repas du jour.',
        care: 'Rincée de temps en temps. La thèse note qu’en cas de manque d’eau, l’effluent peut diluer la nourriture : ce qu’il contient reste alors dans la cuve.',
      },
      {
        failure:
          'An open butt becomes a mosquito nest in a warm climate. An empty one leads to tap water, cold, or to skipping the dilution, and then it is the inlet pipe that blocks.',
        check: 'A lid in place, and enough water for the day’s two feeds.',
        care: 'Rinsed now and then. The thesis notes that in a water shortage the effluent can dilute the food: what it carries then stays in the tank.',
      },
    ),
    tip: l(
      'Lancez « Genève, emballée et chauffée » dans la Simulation : c’est là que cette eau froide compte dans le bilan.',
      'Run “Geneva, wrapped and heated” in the Simulation: that is where this cold water counts in the balance.',
    ),
    design: l(
      'Rien n’est plus simple, et c’est une partie du bilan de chaleur que l’isolation ne touche pas : la paille garde la cuve, elle ne réchauffe pas l’eau qui arrive.',
      'Nothing could be simpler, and it is a part of the heat balance that insulation does not touch: straw keeps the tank warm, it does not warm the water coming in.',
    ),
  },
  {
    id: 'overflow-bucket',
    scene: 'yard',
    category: 'hydraulic',
    name: l('Seau de trop-plein', 'Overflow bucket'),
    short: l(
      'Ce qui entre pousse autant dehors : environ 20 L par jour, à vider chaque jour, et pas n’importe où.',
      'What goes in pushes as much out: about 20 L a day, emptied daily, and not just anywhere.',
    ),
    description: lf(
      'Chaque repas, 10 L poussent 10 L : c’est tout le mouvement de cette machine. À Dar es Salaam, le seau était vidé chaque jour. Le contenu n’est pas de l’eau claire, même quand il en a l’air : son azote et son phosphore en font un engrais, 74,1 mg/L d’azote ammoniacal et 248 mg/L de phosphore sur les restes, et sa charge organique reste très au-dessus de 1 000 mg/L. Il ne va ni dans un ruisseau ni dans un égout. La thèse en reversait deux ou trois seaux dans l’entrée pour la rincer, ce qui remet aussi des organismes au contact de la nourriture.',
      'At each feed, 10 L push out 10 L: that is all the movement this machine has. At Dar es Salaam the bucket was emptied daily. What is in it is not clear water, even when it looks so: its nitrogen and phosphorus make it a fertiliser, 74.1 mg/L of ammonium nitrogen and 248 mg/L of phosphorus on leftovers, and its organic load stays far above 1,000 mg/L. It goes neither into a stream nor down a drain. The thesis poured two or three bucketfuls back into the inlet to rinse it, which also brings organisms back to the food.',
    ),
    material: l('Seau en plastique, générique', 'Plastic bucket, generic'),
    specs: [
      sp('Par jour', 'A day', l('environ 20 L', 'about 20 L')),
      sp('Charge organique', 'Organic load', l('très au-dessus de 1 000 mg/L', 'far above 1,000 mg/L')),
      sp('Dessiné, Ø × hauteur', 'As drawn, Ø × height', v('{bucketSize}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un seau oublié déborde au pied de la dalle, et attire les mouches. Le débit peut aussi s’arrêter : si le trop-plein est bouché, plus rien ne sort et le niveau monte dans la cuve.',
        check: 'Il doit se remplir après chaque repas. Un seau vide après un repas dit que quelque chose bloque.',
        care: 'Vidé chaque jour sur un sol où la plante le prendra, jamais dans un cours d’eau ni un égout. Des gants : des germes survivent à la digestion, et leur fiche dit lesquels nous ne savons pas chiffrer.',
      },
      {
        failure:
          'A forgotten bucket spills at the foot of the pad and draws flies. The flow can also stop: with the overflow blocked, nothing comes out and the level rises in the tank.',
        check: 'It should fill after every feed. An empty bucket after a feed says that something is blocking.',
        care: 'Emptied daily on soil where plants will take it, never into a watercourse or a drain. Gloves: germs survive digestion, and their own sheet says what we cannot put figures on.',
      },
    ),
    tip: l(
      'Il se remplit après chaque repas, du volume que donne le modèle : le temps que dure le versement à l’écran est là pour l’œil.',
      'It fills after each feed, by the volume the model gives: how long the pour lasts on screen is only for the eye.',
    ),
    design: l(
      'Une cuve sans pompe n’a qu’un moteur, le volume qui entre : le trop-plein n’est que sa conséquence. C’est pourquoi l’effluent est un flux, pas un produit qu’on choisit de retirer.',
      'A tank with no pump has one engine, the volume going in: the overflow is only its consequence. That is why the effluent is a flow, not a product one chooses to take out.',
    ),
  },
  {
    id: 'vegetable-bed',
    scene: 'yard',
    category: 'site',
    name: l('Potager', 'Vegetable bed'),
    short: l(
      'Où finit le cercle : l’effluent y revient comme engrais, dilué, et pas sur les feuilles qu’on mange crues.',
      'Where the circle ends: the effluent comes back here as fertiliser, diluted, and not on leaves eaten raw.',
    ),
    description: l(
      'L’azote de l’effluent arrive surtout sous forme d’ammonium, que la plante prend vite. Le tutoriel du Low-tech Lab le dilue à 10 % et l’espace d’un mois, et il l’écarte des fruits et légumes mangés crus dès qu’il y a des produits animaux dans la cuve. La thèse, elle, nourrissait sa cuve de viande et de poisson. Les deux pratiques existent, et les sources ne s’accordent pas : le lab les pose côte à côte et ne tranche pas. Ce que dit le livre de référence est plus simple : la digestion à cette température ne peut pas assurer que virus, bactéries et parasites soient inactivés.',
      'The effluent’s nitrogen comes mostly as ammonium, which plants take up quickly. The Low-tech Lab’s tutorial dilutes it to 10 % and spaces it a month apart, and keeps it off fruit and vegetables eaten raw once animal products are in the tank. The thesis, for its part, fed its tank meat and fish. Both practices exist, and the sources do not agree: the lab sets them side by side and does not rule. What the reference book says is simpler: digestion at this temperature cannot ensure that viruses, bacteria and parasites are inactivated.',
    ),
    material: l('Décor : planches, terre, légumes', 'Setting: planks, soil, vegetables'),
    specs: [
      sp('Azote ammoniacal, restes', 'Ammonium nitrogen, leftovers', l('74,1 mg/L', '74.1 mg/L')),
      sp('Phosphore, restes', 'Phosphorus, leftovers', '248 mg/L'),
      sp(
        'Dilution, selon le tutoriel',
        'Dilution, by the tutorial',
        l('à 10 %, un mois d’écart', 'to 10 %, a month apart'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Trop d’effluent trop près, trop souvent : l’azote se perd, la terre se sature, et les germes restent là où l’on récolte.',
        check:
          'Ce qui pousse là et comment on le mange : la question des feuilles crues est la seule que ce potager pose vraiment.',
        care: 'Un apport dilué au pied, loin des feuilles. Le lab ne donne pas de dose : la seule qu’il ait lue est celle du tutoriel, pour un autre digesteur et une autre nourriture.',
      },
      {
        failure:
          'Too much effluent, too near, too often: the nitrogen is lost, the soil saturates, and the germs stay where the crop is picked.',
        check: 'What grows here and how it is eaten: the question of raw leaves is the one this bed really asks.',
        care: 'Diluted, at the foot, away from the leaves. The lab gives no dose: the only one it has read is the tutorial’s, for another digester and another feed.',
      },
    ),
    tip: l(
      'Activez Flux : le dernier chemin de ce monde va du seau au potager. C’est celui qu’on oublie quand on ne parle que de gaz.',
      'Switch on Flows: the last route of this world runs from the bucket to the bed. It is the one forgotten when only gas is talked about.',
    ),
    design: l(
      'Un digesteur enlève le carbone et garde l’azote et le phosphore : ce qui part en gaz n’appauvrit pas ce qui reste pour la terre. C’est l’autre moitié de la machine, et les chiffres de la thèse le mesurent sur une seule installation.',
      'A digester takes the carbon away and leaves the nitrogen and phosphorus: what leaves as gas does not impoverish what is left for the soil. That is the other half of the machine, and the thesis’s figures measure it on one plant only.',
    ),
  },
  {
    id: 'shade-tree',
    scene: 'yard',
    category: 'site',
    name: l('Arbre d’ombre', 'Shade tree'),
    short: l(
      'À Dar es Salaam, trois arbres ont été abattus avant la pose : une cuve noire veut le soleil.',
      'At Dar es Salaam three trees were cut down before installation: a black tank wants the sun.',
    ),
    description: lf(
      'Pour avoir 7,5 h de soleil direct, trois arbres ont été coupés autour de l’installation mesurée. La cuve y tournait entre 27,8 et 30,9 °C en moyenne, à mi-hauteur, pour un air de 26 à 28 °C : plus chaude que l’air, et le soleil est la seule explication disponible, car la vie dans la cuve produit très peu de chaleur (environ {metabolicW} selon le modèle). Ce manguier est un décor, planté dans son coin pour que son ombre manque la cuve à chaque mois de l’année, pendant ces 7,5 h, sur le soleil du lieu mesuré : un test le vérifie.',
      'To ensure 7.5 h of direct sun, three trees were cut down around the measured plant. Its tank ran at a mean of 27.8 to 30.9 °C at mid-height, with air at 26 to 28 °C: warmer than the air, and the sun is the only explanation to hand, since life in the tank makes very little heat (about {metabolicW} by the model). This mango tree is scenery, planted in its corner so that its shade misses the tank in every month of the year, through those 7.5 h, under the sun of the measured site: a test checks it.',
    ),
    material: l('Décor : un manguier générique', 'Setting: a generic mango tree'),
    specs: [
      sp('Soleil direct', 'Direct sun', l('7,5 h', '7.5 h')),
      sp('Abattus à la pose', 'Cut at installation', l('trois arbres', 'three trees')),
      sp('Dessiné, hauteur', 'As drawn, height', v('{treeHeight}')),
    ],
    maintenance: maint(
      {
        failure: 'Un arbre qui grandit vole du soleil d’année en année, sans qu’aucune alarme ne le dise.',
        check:
          'Là où la cuve est à l’ombre, regardez à quelle heure, et en quel mois. Le modèle compte 7,5 h par défaut : ce curseur se règle.',
        care: 'Tailler ou déplacer, selon ce qu’on veut garder. Un arbre coupé a un coût que les chiffres de cette cuve ne comptent pas.',
      },
      {
        failure: 'A growing tree steals sun year after year, with no alarm to say so.',
        check:
          'Where the tank is shaded, note at what hour and in which month. The model counts 7.5 h by default: that slider can be moved.',
        care: 'Prune or move, depending on what is to be kept. A felled tree has a cost that this tank’s figures do not count.',
      },
    ),
    tip: l(
      'Faites tourner l’heure dans la Simulation et regardez où tombe l’ombre : le soleil de ce monde est celui du modèle.',
      'Move the hour in the Simulation and watch where the shade falls: this world’s sun is the model’s.',
    ),
    design: lf(
      'Le modèle lit quelques degrés de trop à Dar es Salaam, {modelTLow} à {modelTHigh} contre 27,8 à 30,9 °C mesurés, sur une estimation du vent. Il garde quand même l’ordre des choses : la paille qui garde la chaleur arrête aussi le soleil, et c’est ce qui décide des chiffres de Genève.',
      'The model reads a few degrees too high at Dar es Salaam, {modelTLow} to {modelTHigh} against 27.8 to 30.9 °C measured, on an estimate of the wind. It still keeps the order of things: straw that holds the heat in also keeps the sun out, and that is what decides the figures for Geneva.',
    ),
  },
  {
    id: 'compost-heap',
    scene: 'yard',
    category: 'site',
    name: l('Compost', 'Compost heap'),
    short: l(
      'Ce qui ne doit pas entrer dans l’entonnoir : les os, le bois, les fibres.',
      'What must not go into the funnel: bones, wood, fibre.',
    ),
    description: l(
      'La cuve n’avale pas tout. Dans les restes de la cantine, la thèse devait retirer capsules, cure-dents et os avant de hacher. Elle note aussi que les ménages trient peu, et que du non-biodégradable finit dans la cuve. Le tutoriel du Low-tech Lab ajoute que les matières fibreuses, sèches et dures bouchent le passage, flottent, forment des croûtes ou se déposent au fond, où elles prennent de la place pour rien. Un tas de compost garde ces matières. Ce n’est pas la même chimie : à l’air, la décomposition produit de la chaleur et pas de méthane. Les deux se complètent.',
      'The tank does not swallow everything. In the canteen’s leftovers, the thesis had to remove bottle caps, toothpicks and bones before chopping. It also notes that households sort little, and that non-biodegradable matter ends up in the tank. The Low-tech Lab’s tutorial adds that fibrous, dry and hard matter blocks the way, floats, forms crusts or settles on the floor, where it takes up space for nothing. A compost heap keeps that matter. It is not the same chemistry: in air, decay makes heat and no methane. The two complete each other.',
    ),
    material: l('Décor : planches, matière en tas', 'Setting: planks, heaped matter'),
    specs: [
      sp('Y vont', 'Goes here', l('os, bois, fibres, ce qui flotte', 'bones, wood, fibre, what floats')),
      sp('Chimie', 'Chemistry', l('à l’air : chaleur, pas de méthane', 'in air: heat, no methane')),
    ],
    maintenance: maint(
      {
        failure: 'Un tas trop humide, sans air, se met à sentir. C’est le signe qu’il n’est plus un compost.',
        check: 'De la structure, de l’air, une odeur de terre.',
        care: 'Retourné de temps en temps. Sa seule fonction ici est d’éviter qu’on charge la cuve de ce qu’elle ne digérera pas.',
      },
      {
        failure: 'A heap too wet, with no air, starts to smell. It means it is no longer a compost.',
        check: 'Some structure, some air, a smell of earth.',
        care: 'Turned now and then. Its one job here is to stop the tank being loaded with what it will not digest.',
      },
    ),
    tip: l(
      'Il est loin de la cuisine, à dessein : on ne le prend pas pour la poubelle du jour.',
      'It stands far from the kitchen, on purpose: it is not to be taken for the day’s bin.',
    ),
    design: l(
      'Ce tas n’est pas dans la thèse : c’est notre lecture de ce que devient ce qu’on trie. Il dit quelque chose d’utile : une cuve à déchets demande un tri, et donc une habitude.',
      'This heap is not in the thesis: it is our reading of what becomes of what gets sorted. It says something useful: a scrap digester asks for sorting, and so for a habit.',
    ),
  },
  {
    id: 'scrap-caddy',
    scene: 'yard',
    category: 'site',
    name: l('Seau à déchets', 'Scrap caddy'),
    short: l(
      'Les restes triés de la journée, gardés fermés et utilisés en quelques jours.',
      'The day’s sorted scraps, kept covered and used within days.',
    ),
    description: lf(
      'À Dar es Salaam, les déchets étaient gardés dans des seaux fermés et utilisés en quelques jours. Pourquoi 2 kg par jour ? Parce que c’est, d’après la thèse, ce qu’un ménage moyen de la ville produit de façon réaliste. Un kilo lâche occupe environ 1,6 L, selon le Low-tech Lab : ce seau-ci est un dessin, {caddyLitres} d’après ce calcul. Les deux recettes de la thèse : les restes de la cantine (porridge de maïs, riz, haricots, frites, un peu de viande) et les invendus du marché (fruits gâtés, légumes, épluchures). Mêmes kilos, résultats très différents.',
      'At Dar es Salaam the scraps were kept in closed buckets and used within days. Why 2 kg a day? Because that is, by the thesis, what an average household in the city realistically produces. A loose kilo fills about 1.6 L, by the Low-tech Lab: this caddy is a drawing, {caddyLitres} by that sum. The thesis’s two recipes: the canteen’s leftovers (maize porridge, rice, beans, chips, a little meat) and the market’s unsold goods (spoiled fruit, vegetables, peelings). The same kilos, very different results.',
    ),
    material: l('Seau en plastique à couvercle, générique', 'Plastic pail with a lid, generic'),
    specs: [
      sp('Par jour', 'A day', '2 kg'),
      sp('Un kilo lâche', 'A loose kilo', l('environ 1,6 L', 'about 1.6 L')),
      sp('Gardé', 'Kept', l('fermé, quelques jours', 'covered, a few days')),
    ],
    maintenance: maint(
      {
        failure:
          'Les mouches et l’odeur, s’il reste ouvert ou trop longtemps plein. Et le trop : en surcharge, c’est la cuve qui paie.',
        check:
          'Le poids, plus que le volume : les 2 kg de la thèse sont pesés, un seau plein d’épluchures n’en dit rien.',
        care: 'Vidé, rincé. La thèse conseille un petit seau de la bonne taille pour que le gardien voie sa ration sans balance.',
      },
      {
        failure: 'Flies and smell, if left open or full too long. And too much: when overloaded, the tank pays.',
        check:
          'The weight, more than the volume: the thesis’s 2 kg are weighed, and a pail full of peelings says nothing about it.',
        care: 'Emptied, rinsed. The thesis advises a small pail of the right size, so that the keeper sees the ration with no scales.',
      },
    ),
    tip: l(
      'Le curseur de la part de restes cuits, dans la Simulation, change la recette de ce seau : voyez le gaz et le méthane bouger en sens inverse.',
      'The slider for the share of cooked leftovers, in the Simulation, changes this caddy’s recipe: watch the gas and the methane move opposite ways.',
    ),
    design: l(
      'Le lab garde ce seau séparé du hachoir et du seau de dilution : les trois gestes prennent du temps, et c’est ce temps, chaque jour, que l’enquête de terrain a trouvé difficile à tenir.',
      'The lab keeps this caddy apart from the mincer and the dilution bucket: the three gestures take time, and it is that time, every day, that the field survey found hard to keep up.',
    ),
  },
  {
    id: 'hose-run',
    scene: 'yard',
    category: 'hydraulic',
    name: l('Conduite de gaz', 'Gas hose run'),
    short: l(
      'Cinq mètres de tuyau d’un demi-pouce à travers la cour, qui descendent jusqu’à un point bas.',
      'Five metres of half-inch hose across the yard, falling to a low point.',
    ),
    description: lf(
      'Le gaz sort de la cuve saturé de vapeur et se refroidit dans le tuyau : l’eau se dépose. D’où la règle de ce parcours, une descente régulière jusqu’à un seul point bas, au pied du mur de la cuisine, où elle peut s’amasser sans couper le passage. La thèse relève que même une installation bien conduite voit le tuyau se boucher chaque semaine. La poussée de la cloche ne vaut que {pushCm} d’eau, et elle ne pousse pas un bouchon bien long. Le tuyau lui-même compte peu : {hoseDrop} perdus à {flow2}, selon le modèle.',
      'The gas leaves the tank saturated with vapour and cools in the hose: water settles out. Hence this run’s rule, a steady fall to a single low point at the foot of the kitchen wall, where the water can gather without cutting the way. The thesis notes that even a well-run plant sees its hose clog every week. The bell’s push is worth only {pushCm} of water, and it will not shift a plug of any length. The hose itself counts for little: {hoseDrop} lost at {flow2}, by the model.',
    ),
    material: l('Tuyau souple, ½ pouce', 'Flexible hose, ½ inch'),
    specs: [
      sp('Longueur', 'Length', '5 m'),
      sp('Diamètre', 'Bore', l('½ pouce', '½ inch')),
      sp('Pente dessinée, de chaque côté', 'Slope drawn, either side', v('{hoseSlope}')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau au point bas : la flamme faiblit, puis ne tient plus, et la cloche pleine laisse le gaz partir par son bord. Un tuyau qui craque au soleil, ou écrasé par un passage.',
        check:
          'Une flamme petite et une cloche haute : c’est le signe de l’eau. L’eau savonneuse sur les raccords pour les fuites.',
        care: 'Vider le point bas chaque semaine si rien ne le fait, garder le tuyau hors du passage, le remplacer dès qu’il se fend.',
      },
      {
        failure:
          'Water at the low point: the flame weakens, then no longer holds, and the full bell lets the gas go over its rim. A hose cracking in the sun, or crushed by feet.',
        check: 'A small flame with a high bell: that is the sign of water. Soapy water on the joints for leaks.',
        care: 'Empty the low point weekly if nothing else does, keep the hose out of the way, replace it once it splits.',
      },
    ),
    tip: l(
      'Activez Flux : le chemin du gaz est là, au-dessus du sol. Puis lancez « De l’eau dans le tuyau » pour voir ce que quelques décilitres font à la flamme.',
      'Switch on Flows: the gas’s route is there, above the ground. Then run “Water in the hose” to see what a few decilitres do to the flame.',
    ),
    design: l(
      'La thèse est nette : ce tuyau est la partie la plus simple, et l’une des plus souvent en cause. Le piège à condensats du monde de la ligne de gaz n’était pas sur l’installation mesurée : la thèse l’a demandé après coup.',
      'The thesis is plain about it: this hose is the simplest part, and among those most often at fault. The condensate trap in the gas line’s world was not on the measured plant: the thesis asked for one afterwards.',
    ),
  },
];
