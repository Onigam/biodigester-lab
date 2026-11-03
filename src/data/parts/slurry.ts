// Parts of the `slurry` world (11): one drop, in order along the food chain. That it is stylised is said once, in the overview. The names of the stages are the reference book's; that the methane-makers are archaea and not bacteria is said here and in lesson 1. Where the model has no such thing (acetogens as such, sulphur, nitrogen, germs), the sheet says so.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const SLURRY_PARTS: PartInfo[] = [
  {
    id: 'food-particle',
    scene: 'slurry',
    category: 'site',
    name: l('Particule de nourriture', 'Food particle'),
    short: l(
      'Un morceau de repas : moins de 1 cm à l’entrée, et tout ce qui suit commence par son bord.',
      'A piece of a meal: under 1 cm at the inlet, and all that follows starts at its edge.',
    ),
    description: lf(
      'Un kilo de restes de cantine, c’est 24 % de solides, dont 94 % de matière organique : 2 kg par jour apportent 0,451 kg de matière organique. Des épluchures, 10 % de solides, 88 % d’organique : 0,18 kg, plus de deux fois moins. Tout le reste de cette goutte vient de là. La taille compte, car seule la surface est attaquée : la thèse visait moins de 1 cm, pour passer le tube et pour offrir plus de bord aux organismes. Dans le modèle, chaque nourriture se partage entre une part rapide et une part lente, {kFast} et {kSlow} par jour à 30 °C, et sa composition est estimée : {carbShare} de glucides sur les restes.',
      'A kilo of canteen leftovers is 24 % solids, of which 94 % organic matter: 2 kg a day bring 0.451 kg of organic matter. Peelings, 10 % solids, 88 % organic: 0.18 kg, less than half that. All the rest of this drop comes from there. Size counts, as only the surface is attacked: the thesis aimed at under 1 cm, to pass the pipe and to offer more edge to the organisms. In the model each food splits into a fast and a slow part, {kFast} and {kSlow} a day at 30 °C, and its composition is estimated: {carbShare} carbohydrate in leftovers.',
    ),
    material: l(
      'Glucides, protéines, graisses, ce que le repas contenait',
      'Carbohydrate, protein, fat, whatever the meal held',
    ),
    specs: [
      sp('Restes', 'Leftovers', l('24 % de solides, 94 % organiques', '24 % solids, 94 % organic')),
      sp('Épluchures', 'Peelings', l('10 % de solides, 88 % organiques', '10 % solids, 88 % organic')),
      sp('Taille à l’entrée', 'Size at the inlet', l('moins de 1 cm', 'under 1 cm')),
    ],
    maintenance: maint(
      {
        failure:
          'De gros morceaux restent là longtemps, se déposent ou flottent. Les os et le bois restent tels quels.',
        check: 'Le seau de dilution : tout y est-il assez fin pour passer sans effort ?',
        care: 'Hacher, diluer, ne pas charger d’un coup. C’est tout ce qu’on peut faire de l’extérieur pour cette particule.',
      },
      {
        failure: 'Large pieces stay a long time, settle or float. Bones and wood stay as they are.',
        check: 'The dilution bucket: is everything fine enough to pass with no effort?',
        care: 'Chop, dilute, do not load at once. That is all that can be done from outside for this particle.',
      },
    ),
    tip: l(
      'Le chemin de carbone de Flux part d’ici, et va de stade en stade jusqu’à la bulle.',
      'The carbon route of Flows starts here, and goes stage by stage to the bubble.',
    ),
    design: lf(
      'Le chiffre qu’on cite d’ordinaire, 2 kg donnent 500 g de méthane, vaut pour de la matière sèche. Sur les vrais déchets humides de la thèse, c’est environ {methaneWet}. La différence n’est pas dans la cuve : elle est dans l’eau que ces 2 kg contenaient déjà.',
      'The figure usually quoted, 2 kg give 500 g of methane, holds for dry matter. On the thesis’s real wet scraps it is about {methaneWet}. The difference is not in the tank: it is in the water those 2 kg already held.',
    ),
  },
  {
    id: 'hydrolysers',
    scene: 'slurry',
    category: 'site',
    name: l('Hydrolyseurs', 'Hydrolysers'),
    short: l(
      'Ils découpent les grosses molécules de l’extérieur, par des enzymes qu’ils relâchent.',
      'They cut large molecules from the outside, with enzymes they release.',
    ),
    description: lf(
      'Une particule est trop grosse pour entrer dans une cellule. Ces organismes relâchent donc des enzymes qui la découpent dehors : protéines en acides aminés, glucides en sucres simples, graisses en acides gras. Le livre de référence dit que ce premier stade est d’ordinaire le plus lent des quatre ; la thèse cite un autre auteur pour qui ce sont les derniers, les méthanogènes. Les sources ne s’accordent pas, et ce lab n’a pas de quoi trancher. Le modèle en fait une loi simple, proportionnelle à ce qui reste à découper, et ces vitesses sont des estimations : sur onze déchets alimentaires, une étude n’a vu que 0,19 à 0,65 par jour.',
      'A particle is too large to enter a cell. So these organisms release enzymes that cut it up outside: protein into amino acids, carbohydrate into simple sugars, fat into fatty acids. The reference book says this first stage is usually the slowest of the four; the thesis quotes another author for whom the slowest are the last, the methanogens. The sources do not agree, and this lab has no means to settle it. The model makes it a simple law, in proportion to what remains to be cut, and these rates are estimates: over eleven food wastes, one study saw only 0.19 to 0.65 a day.',
    ),
    material: l('Bactéries et leurs enzymes', 'Bacteria and their enzymes'),
    specs: [
      sp('Vitesse rapide, à 30 °C', 'Fast rate, at 30 °C', lf('{kFast} par jour', '{kFast} a day')),
      sp('Vitesse lente, à 30 °C', 'Slow rate, at 30 °C', lf('{kSlow} par jour', '{kSlow} a day')),
      sp('D’un repas, la moitié du gaz', 'Of a meal, half the gas', lf('en {mealHalf}', 'in {mealHalf}')),
    ],
    maintenance: maint(
      {
        failure:
          'Ils ralentissent quand il fait froid, et quand le pH passe sous environ {phHydrolysis} dans le modèle : c’est une estimation venue d’un modèle de référence, relue de mémoire.',
        check: 'Rien ne se lit ici. C’est un gaz qui arrive plus lentement, sans qu’aucun signe ne le montre.',
        care: 'Une particule fine et de l’eau : ils n’attendent rien d’autre.',
      },
      {
        failure:
          'They slow in the cold, and when the pH falls below about {phHydrolysis} in the model: an estimate from a reference model, recalled from memory.',
        check: 'Nothing can be read here. It shows as gas coming more slowly, with no sign of why.',
        care: 'A fine particle and water: they ask nothing more.',
      },
    ),
    tip: l(
      'En Éclaté, chaque stade s’écarte d’un cran le long de la chaîne : c’est le seul ordre de ce monde.',
      'In Explode, each stage moves a step apart along the chain: it is this world’s one order.',
    ),
    design: lf(
      'La promesse d’un gaz « en un ou deux jours » vient de là : c’est un temps de réaction sur de l’amidon. Le modèle trouve la moitié du gaz d’un repas cuit en {mealHalf}, et 90 % en {mealNinety} : sur des épluchures, {peelHalf} et {peelNinety}.',
      'The promise of gas “in a day or two” comes from here: it is a reaction time on starch. The model finds half the gas of a cooked meal in {mealHalf}, and 90 % in {mealNinety}: on peelings, {peelHalf} and {peelNinety}.',
    ),
  },
  {
    id: 'acid-makers',
    scene: 'slurry',
    category: 'site',
    name: l('Acidogènes', 'Acid-makers'),
    short: l(
      'Rapides et peu difficiles : ils font des acides gras, de l’hydrogène et du CO₂ avec ce qui vient d’être découpé.',
      'Fast and undemanding: they make fatty acids, hydrogen and CO₂ out of what has just been cut.',
    ),
    description: lf(
      'Sucres et acides aminés deviennent acides gras, alcools, acétate, hydrogène, CO₂, et de l’ammoniac quand il y avait des protéines. Le point qui compte est leur tempérament : ils sont bien plus tolérants que ceux qui viennent après. Quand un choc touche la cuve, excès de nourriture ou changement de température, le livre et la thèse disent la même chose : ce sont les méthanogènes qui souffrent, et ceux-ci continuent à travailler, à faire encore de l’acide. C’est ainsi qu’on perd une cuve. Le modèle les range dans une seule réserve d’acides, et ne les compte pas à part : à l’écran, leur activité suit la vitesse de ce qui entre.',
      'Sugars and amino acids become fatty acids, alcohols, acetate, hydrogen, CO₂, and ammonia where there was protein. What counts is their temperament: they are far more tolerant than those that follow. When a shock hits the tank, too much food or a change of temperature, the book and the thesis say the same: it is the methanogens that suffer, while these go on working, making more acid. That is how a tank is lost. The model puts them in a single stock of acids, and does not count them apart: on screen, their activity follows the rate of what comes in.',
    ),
    material: l('Bactéries, peu exigeantes', 'Bacteria, undemanding ones'),
    specs: [
      sp('Font', 'Make', l('acides gras, acétate, H₂, CO₂', 'fatty acids, acetate, H₂, CO₂')),
      sp(
        'Dans le modèle',
        'In the model',
        l('compris dans l’entrée de la réserve d’acides', 'part of what enters the stock of acids'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Ils ne tombent pas en panne : c’est leur réussite qui est le problème, quand ils produisent plus que les méthanogènes ne mangent.',
        check:
          'Le gaz qui grimpe d’un coup après un gros repas n’est pas forcément bon signe : « Trop, d’un coup » le montre.',
        care: 'Une montée lente de la ration, pour laisser l’aval suivre.',
      },
      {
        failure: 'They do not break down: their success is the trouble, when they make more than the methanogens eat.',
        check: 'Gas climbing suddenly after a big feed is not always good news: “Too much, at once” shows it.',
        care: 'A slow rise in the ration, to let what comes after keep up.',
      },
    ),
    tip: l(
      'Lancez « Trop, d’un coup » et regardez-les s’agiter dans la goutte pendant que les méthanogènes pâlissent.',
      'Run “Too much, at once” and watch them bustle in the drop while the methanogens fade.',
    ),
    design: lf(
      'Un pas de la chaîne suffit à faire la différence. Sur 2 kg, l’acide fabriqué n’est rien tant que les suivants le mangent : {acidsUnderLoad} sous charge dans le modèle, 124 à 195 mg/L mesurés. Il ne manque que ce déséquilibre pour que tout bascule.',
      'One step of the chain is enough to tell the difference. On 2 kg the acid made is nothing as long as what comes next eats it: {acidsUnderLoad} under load in the model, 124 to 195 mg/L measured. Only that imbalance is needed for everything to tip.',
    ),
  },
  {
    id: 'acetogens',
    scene: 'slurry',
    category: 'site',
    name: l('Acétogènes', 'Acetogens'),
    short: l(
      'Ils font de l’acétate et de l’hydrogène avec les acides plus longs, si l’hydrogène part assez vite.',
      'They turn longer acids into acetate and hydrogen, if the hydrogen leaves quickly enough.',
    ),
    description: l(
      'Troisième stade : les acides gras plus longs et les alcools deviennent acide acétique, hydrogène et CO₂. Le livre note une condition fine : cette réaction ne se fait que si l’hydrogène reste assez rare, et c’est pourquoi ces organismes ont besoin de voisins qui le consomment. La teneur en hydrogène d’une cuve est donc un indicateur de sa santé. Ils montrent que cette chaîne n’est pas une suite de tuyaux, mais une dépendance. Dans le modèle, ils n’existent pas à part : tous les acides y sont comptés comme de l’acétate. Ce monde les dessine parce qu’ils existent, et le modèle ne les chiffre pas.',
      'The third stage: longer fatty acids and alcohols become acetic acid, hydrogen and CO₂. The book notes a fine condition: this reaction goes only if hydrogen stays scarce enough, which is why these organisms need neighbours that use it up. The hydrogen in a tank is therefore a sign of its health. They show that this chain is no series of pipes, but a dependence. In the model they do not exist apart: all acids are counted there as acetate. This world draws them because they exist, and the model puts no figure on them.',
    ),
    material: l('Bactéries, vivant tout près des méthanogènes', 'Bacteria, living close by the methanogens'),
    specs: [
      sp('Font', 'Make', l('acide acétique, H₂, CO₂', 'acetic acid, H₂, CO₂')),
      sp(
        'Dans le modèle',
        'In the model',
        l('pas à part : tout acide y est de l’acétate', 'not apart: all acid counts as acetate'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'L’hydrogène s’accumule, la réaction s’arrête, l’acide reste. C’est le même déséquilibre vu d’un autre endroit.',
        check: 'Aucun instrument de ménage ne le lit, et la thèse non plus.',
        care: 'Aucune : ils dépendent de ce qui suit.',
      },
      {
        failure:
          'Hydrogen builds up, the reaction stops, the acid stays. It is the same imbalance seen from another place.',
        check: 'No household instrument reads this, and the thesis did not either.',
        care: 'None: they depend on what comes next.',
      },
    ),
    tip: l(
      'Sélectionnez-les, puis Isoler : ils restent seuls dans la goutte, à leur place sur la chaîne.',
      'Select them, then Isolate: they stay alone in the drop, in their place on the chain.',
    ),
    design: l(
      'Le modèle s’en passe, et c’est un choix qu’il dit : moins de populations, assez pour que « nourrir plus, recevoir moins » apparaisse tout seul. La science en compte davantage, et une cuve réelle aussi.',
      'The model does without them, and says so as a choice: fewer populations, enough for “feed more, get less” to appear by itself. Science counts more, and so does a real tank.',
    ),
  },
  {
    id: 'methanogens',
    scene: 'slurry',
    category: 'site',
    name: l('Méthanogènes', 'Methanogens'),
    short: l(
      'Les seuls à faire le méthane, lentement : pas des bactéries, mais une autre branche du vivant.',
      'The only ones that make the methane, slowly: not bacteria, but another branch of life.',
    ),
    description: lf(
      'La plupart des sources, dont celles de ce lab, écrivent « bactéries ». En 1977, Woese et Fox ont placé ces organismes dans une lignée à part, celle qu’on appelle aujourd’hui les archées. Ils prennent ce que la chaîne a préparé, l’acétate et l’hydrogène, et rendent du méthane et du CO₂. Ils vivent sans oxygène, se multiplient lentement et supportent mal l’acidité : le modèle les arrête progressivement entre pH 7 et pH 6, et la thèse note que passer sous 6 est à éviter. Leur vitesse et leur rendement viennent d’un modèle de référence, relu de mémoire : {kMethanogen} par jour, {yieldMethanogen} kg de cellules par kg mangé. Tout le reste de ce lab tient à leur capacité.',
      'Most sources, including this lab’s, write “bacteria”. In 1977 Woese and Fox placed these organisms in a line of their own, the one now called the archaea. They take what the chain has prepared, acetate and hydrogen, and give back methane and CO₂. They live without oxygen, multiply slowly and bear acid badly: the model stops them step by step between pH 7 and pH 6, and the thesis notes that going below 6 should be avoided. Their speed and yield come from a reference model, recalled from memory: {kMethanogen} a day, {yieldMethanogen} kg of cells per kg eaten. All the rest of this lab rests on their capacity.',
    ),
    material: l('Archées, sans oxygène', 'Archaea, without oxygen'),
    specs: [
      sp('Font', 'Make', l('CH₄ et CO₂', 'CH₄ and CO₂')),
      sp('Vitesse, à 30 °C', 'Rate, at 30 °C', lf('{kMethanogen} par jour', '{kMethanogen} a day')),
      sp('Fenêtre de pH', 'pH window', lf('{phLow} à {phHigh}', '{phLow} to {phHigh}')),
      sp('Mortalité, à 30 °C', 'Death, at 30 °C', lf('{deathRate} par jour', '{deathRate} a day')),
    ],
    maintenance: maint(
      {
        failure:
          'Trop d’acide d’un coup, et l’acidité les arrête, ce qui fait monter l’acide. Dans le modèle, l’acide les arrête seulement, et c’est le temps qui les fait mourir : une limite qu’il dit lui-même.',
        check:
          'La couleur et la lueur de ce monde suivent leur activité dans le modèle. Dans une vraie cuve, le pH réagit avec du retard : une cuve qui va bien et une cuve qui va tomber se ressemblent quelques jours.',
        care: 'Du temps, surtout : ils se multiplient lentement. Une ration qui monte doucement les laisse suivre. À la mise en route, 60 kg de bouse et 300 L d’effluent les apportent.',
      },
      {
        failure:
          'Too much acid at once, and acidity stops them, which raises the acid. In the model acid only stops them, and time is what kills them: a limit it states itself.',
        check:
          'This world’s colour and glow follow their activity in the model. In a real tank the pH reacts late: a tank that is well and a tank about to fall look alike for some days.',
        care: 'Time, above all: they multiply slowly. A ration that rises gently lets them keep up. At start-up, 60 kg of dung and 300 L of effluent bring them in.',
      },
    ),
    tip: l(
      'Comparez la goutte dans « La journée mesurée » et dans « Trop, d’un coup » : leur couleur et leur mouvement viennent directement du modèle.',
      'Compare the drop in “The measured day” and in “Too much, at once”: their colour and movement come straight from the model.',
    ),
    design: l(
      'Une flamme de cuisine vient d’une lignée de vie dont la science n’a reconnu la place qu’en 1977. Les méthanogènes eux-mêmes étaient connus avant, comme bactéries : on ne les a pas découverts cette année-là. C’est la lenteur qui fait toute la machine : une cuve ne tient que si cette population a eu le temps de monter. Sa limite est là, pas dans la plomberie.',
      'A kitchen flame comes from a line of life whose place science only recognised in 1977. The methanogens themselves were known before, as bacteria: they were not discovered that year. Slowness makes the whole machine: a tank only holds once this population has had time to grow. Its limit lies there, not in the plumbing.',
    ),
  },
  {
    id: 'sulphate-reducers',
    scene: 'slurry',
    category: 'site',
    name: l('Sulfato-réducteurs', 'Sulphate reducers'),
    short: l(
      'D’où vient l’H₂S, et la raison pour laquelle la bouillie sent : un gaz dont nous n’avons pas trouvé la teneur ici.',
      'Where the H₂S comes from, and why the slurry smells: a gas whose level we could not find for this plant.',
    ),
    description: l(
      'L’hydrogène sulfuré vient du soufre de la nourriture : le livre de référence l’attribue aux protéines soufrées, et d’autres organismes de la goutte, les sulfato-réducteurs, en font aussi en consommant le sulfate, selon les connaissances générales. Sur cette installation, sa teneur est inconnue. Le capteur de la thèse s’arrêtait à 100 ppm, et plafonnait sur toutes les installations mesurées, sauf une, à 72 ppm. Le livre donne de 20 à 20 000 ppm pour le biogaz en général, et le tutoriel du Low-tech Lab écrit 1 à 3 %, au-dessus du maximum du livre. Le modèle n’a pas de soufre. Il ne dit rien de ce qui se passerait.',
      'Hydrogen sulphide comes from the sulphur in food: the reference book credits sulphur-bearing proteins, and other organisms in the drop, the sulphate reducers, also make it by using up sulphate, by general knowledge. On this plant its level is unknown. The thesis’s sensor stopped at 100 ppm, and hit that ceiling on every plant measured but one, at 72 ppm. The book gives 20 to 20,000 ppm for biogas in general, and the Low-tech Lab’s tutorial writes 1 to 3 %, above the book’s maximum. The model has no sulphur. It says nothing of what would happen.',
    ),
    material: l('Bactéries, sans oxygène', 'Bacteria, without oxygen'),
    specs: [
      sp(
        'H₂S sur cette installation',
        'H₂S on this plant',
        l('inconnu : capteur plafonné à 100 ppm', 'unknown: sensor capped at 100 ppm'),
      ),
      sp('Biogaz en général', 'Biogas in general', l('20 à 20 000 ppm', '20 to 20,000 ppm')),
      sp('Dans le modèle', 'In the model', l('rien : pas de soufre', 'nothing: no sulphur')),
    ],
    maintenance: maint(
      {
        failure:
          'Plus de soufre dans la nourriture, plus d’H₂S dans le gaz : viande, poisson, protéines. Le gaz attaque aussi ce qu’il traverse. La thèse note qu’il corrode.',
        check: 'Pas au nez : la fiche du filtre dit pourquoi.',
        care: 'Aucune ici : ce qui se fait se fait dans la ligne de gaz. Les fiches du filtre et de l’aération reprennent ce qui compte.',
      },
      {
        failure:
          'More sulphur in the food, more H₂S in the gas: meat, fish, protein. The gas also attacks what it passes through. The thesis notes that it corrodes.',
        check: 'Not by nose: the filter’s sheet says why.',
        care: 'None here: what is done is done in the gas line. The sheets of the filter and the vent say what counts.',
      },
    ),
    tip: l(
      'Ils sont dans ce monde parce que le gaz qu’ils font est le plus dangereux de la machine, pas parce que le modèle les connaît.',
      'They are in this world because the gas they make is the most dangerous in the machine, not because the model knows them.',
    ),
    design: l(
      'Le lab ne donne pas de valeur et le dit, plutôt que d’en choisir une. Le chiffre le plus utile serait une mesure sur cette installation : c’est l’une des premières qu’on aimerait avoir.',
      'The lab gives no value and says so, rather than choose one. The most useful figure would be a measurement on this plant: it is among the first one would want.',
    ),
  },
  {
    id: 'fatty-acid-pool',
    scene: 'slurry',
    category: 'hydraulic',
    name: l('Acides gras', 'Fatty-acid pool'),
    short: l(
      'La réserve d’acides entre ceux qui les font et ceux qui les mangent : c’est elle qui fait tourner une cuve à l’acide.',
      'The stock of acids between those who make and those who eat them: it is what sours a tank.',
    ),
    description: lf(
      'Tant que les méthanogènes mangent ce qu’on fabrique, cette réserve reste petite. Sous charge, la thèse a mesuré 124 à 195 mg/L ; le modèle en trouve {acidsUnderLoad}, proche et un peu plus bas. Si la nourriture arrive plus vite que les méthanogènes ne se multiplient, la réserve grossit, mange le tampon, et le pH tombe : les méthanogènes s’arrêtent, et elle grossit encore. Rien d’autre n’est programmé dans le modèle : aucun interrupteur « acide ». Un rapport acides sur tampon le signale plus tôt que le pH : il dépasse 0,3, la limite d’une autre étude, le pH lisant encore environ {ratioPH}, et cela {ratioLead} avant que le pH atteigne 6.',
      'While the methanogens eat what is made, this stock stays small. Under load, the thesis measured 124 to 195 mg/L; the model finds {acidsUnderLoad}, close and a little lower. If food arrives faster than the methanogens multiply, the stock grows, eats the buffer, and the pH falls: the methanogens stop, and it grows more. Nothing else is programmed in the model: no “sour” switch. A ratio of acids to buffer signals it earlier than the pH: it passes 0.3, the limit of another study, with the pH still reading about {ratioPH}, and {ratioLead} before the pH reaches 6.',
    ),
    material: l(
      'Acides dissous, comptés comme de l’acétate dans le modèle',
      'Dissolved acids, counted as acetate in the model',
    ),
    specs: [
      sp('Mesuré sous charge', 'Measured under load', l('124 à 195 mg/L', '124 to 195 mg/L')),
      sp('Modèle, sous charge', 'Model, under load', v('{acidsUnderLoad}')),
      sp('Limite du rapport', 'Limit of the ratio', l('0,3', '0.3')),
    ],
    maintenance: maint(
      {
        failure:
          'Une cuve qui tourne à l’acide : le modèle garde un pH presque normal, {pHNoReturn}, jusqu’au moment où plus rien ne revient seul.',
        check: 'La thèse a suivi ce rapport par titrage : c’est une analyse de laboratoire, pas le geste d’un ménage.',
        care: 'Une montée lente, et le geste le plus simple : s’arrêter tôt. Après coup, le modèle demande environ {rescue100} à 100 L d’eau par jour pour la ramener.',
      },
      {
        failure:
          'A tank turning sour: the model keeps a nearly normal pH, {pHNoReturn}, up to the point where nothing returns by itself.',
        check: 'The thesis followed this ratio by titration: a laboratory analysis, no household gesture.',
        care: 'A slow rise, and the simplest gesture: stopping early. Afterwards, the model asks about {rescue100} at 100 L of water a day to bring it back.',
      },
    ),
    tip: l(
      'Le compte de points de ce monde suit les acides du modèle : lancez « Trop, d’un coup » et comptez.',
      'The count of dots in this world follows the model’s acids: run “Too much, at once” and watch them multiply.',
    ),
    design: lf(
      'À mi-chemin de la chaîne, cette réserve sert d’avertisseur et de piège. Le seuil qu’elle fixe dépend de la température, et il est optimiste : à 32 °C, le modèle tient un saut jusqu’à {soursAt32} par jour, plus que les {bookLimit} du livre, car il n’a pas de fond acide.',
      'Halfway down the chain this stock is both a warning and a trap. The threshold it sets depends on temperature, and it is optimistic: at 32 °C the model holds a jump up to {soursAt32} a day, more than the book’s {bookLimit}, because it has no sour bottom.',
    ),
  },
  {
    id: 'bicarbonate-buffer',
    scene: 'slurry',
    category: 'hydraulic',
    name: l('Tampon bicarbonate', 'Bicarbonate buffer'),
    short: l(
      'Ce qui tient le pH à peu près stable, jusqu’au moment où il ne peut plus.',
      'What holds the pH about steady, until it no longer can.',
    ),
    description: lf(
      'Le bicarbonate fixe l’acide sans presque changer le pH : c’est pourquoi un pH presque normal ne dit pas qu’on est loin du bord. La thèse a titré cette alcalinité : 1 130 mg de CaCO₃ par litre, à 2 kg par jour. Ce chiffre entre dans le modèle comme une donnée, et c’est le pH qui reste le sien : {pHSteady} contre environ 6,5 mesurés. Son tampon vaut environ {bufferCod} de DCO par litre, soit {bufferKg} en tout dans la cuve. Quand plusieurs kilos de nourriture rapide attendent déjà, ce n’est pas grand-chose. Sous charge, la thèse a lu moins d’alcalinité que le modèle n’en garde, et le pH de la vraie cuve se tient {phGap} plus bas.',
      'Bicarbonate takes up acid while hardly changing the pH: that is why a nearly normal pH does not say one is far from the edge. The thesis titrated this alkalinity: 1,130 mg of CaCO₃ per litre, at 2 kg a day. That figure enters the model as a datum, and the pH stays its own: {pHSteady} against about 6.5 measured. Its buffer is worth about {bufferCod} of COD per litre, or {bufferKg} in all in the tank. When several kilos of fast food are already waiting, that is not much. Under load, the thesis read less alkalinity than the model keeps, and the real tank’s pH stands {phGap} lower.',
    ),
    material: l(
      'Bicarbonate dissous, apporté par la nourriture et l’eau',
      'Dissolved bicarbonate, brought by the food and the water',
    ),
    specs: [
      sp('Alcalinité mesurée', 'Alkalinity measured', l('1 130 mg CaCO₃/L', '1,130 mg CaCO₃/L')),
      sp('Soit, en charges', 'As charge', l('22,6 meq/L', '22.6 meq/L')),
      sp('Il vaut', 'It is worth', lf('{bufferCod}, {bufferKg} dans la cuve', '{bufferCod}, {bufferKg} in the tank')),
    ],
    maintenance: maint(
      {
        failure: 'Il s’épuise. Passé ce point, le pH tombe vite : le modèle n’a pas d’effet tampon en réserve.',
        check: 'L’analyse de laboratoire de la thèse : pas un geste de ménage.',
        care: 'La thèse note que du calcaire dilué pourrait remonter le pH d’une cuve tournée. Le modèle teste un ajout de base, sans le proposer : ce lab ne donne pas de dose.',
      },
      {
        failure: 'It runs out. Past that point the pH falls fast: the model has no buffering in reserve.',
        check: 'The thesis’s laboratory analysis: no household gesture.',
        care: 'The thesis notes that diluted limestone could raise the pH of a soured tank. The model tries adding a base, without offering it: this lab gives no dose.',
      },
    ),
    tip: l(
      'Le nombre de petits grains suit le tampon du modèle : regardez-les fondre pendant « Trop, d’un coup ».',
      'The number of small grains follows the model’s buffer: watch them melt during “Too much, at once”.',
    ),
    design: lf(
      'Moins d’eau, donc plus de tampon par litre : c’est ainsi que le bidon de 60 L, dans le modèle, atteint environ {drumMeq} et tient cinq fois plus de charge. La même concentration devrait aussi faire monter l’ammoniac, que le modèle ne voit pas.',
      'Less water, so more buffer per litre: that is how the 60 L drum, in the model, reaches about {drumMeq} and holds five times the load. The same concentration should also raise the ammonia, which the model does not see.',
    ),
  },
  {
    id: 'ammonium',
    scene: 'slurry',
    category: 'hydraulic',
    name: l('Ammonium', 'Ammonium'),
    short: l(
      'L’azote des protéines : c’est lui qui fait de l’effluent un engrais.',
      'The nitrogen of the proteins: it is what makes the effluent a fertiliser.',
    ),
    description: lf(
      'Les acidogènes libèrent de l’ammoniac en dégradant les acides aminés, et dans cette bouillie il se trouve surtout sous forme d’ammonium, porté en solution. La thèse a mesuré 74,1 mg/L d’azote ammoniacal dans l’effluent sur les restes, 85,5 sur le marché. Le gaz ne le retient pas : ce qui part en méthane est du carbone, et cet azote reste pour les plantes. C’est une partie de la charge qui fait le tampon, environ {ammoniumMeq} dans les 22,6 meq/L, et trop d’ammoniac peut aussi gêner les méthanogènes, d’après le livre. Le modèle n’a pas d’azote : il ne verrait pas cette limite.',
      'The acid-makers release ammonia as they break down amino acids, and in this slurry it is mostly ammonium, carried in solution. The thesis measured 74.1 mg/L of ammonium nitrogen in the effluent on leftovers, 85.5 on market waste. The gas does not hold it: what leaves as methane is carbon, and this nitrogen stays for the plants. It is part of the charge that makes the buffer, about {ammoniumMeq} of the 22.6 meq/L, and too much ammonia can also hinder the methanogens, by the book. The model has no nitrogen: it would not see that limit.',
    ),
    material: l('Azote ammoniacal dissous', 'Dissolved ammonium nitrogen'),
    specs: [
      sp('Effluent, restes', 'Effluent, leftovers', l('74,1 mg/L', '74.1 mg/L')),
      sp('Effluent, marché', 'Effluent, market waste', l('85,5 mg/L', '85.5 mg/L')),
      sp('Dans le modèle', 'In the model', l('rien : pas d’azote', 'nothing: no nitrogen')),
    ],
    maintenance: maint(
      {
        failure:
          'Rien de visible à cette dose sur cette installation. Sur une cuve très concentrée, c’est l’inverse d’un engrais : il peut gêner ce qui fait le gaz.',
        check: 'L’analyse de l’effluent, en laboratoire seulement.',
        care: 'Rien, sinon le rendre à la terre : la fiche du potager dit comment, et ce qui reste à trancher.',
      },
      {
        failure:
          'Nothing visible at this level on this plant. In a very concentrated tank, it is the opposite of a fertiliser: it can hinder what makes the gas.',
        check: 'Analysing the effluent, in a laboratory only.',
        care: 'Nothing, except giving it back to the soil: the vegetable bed’s sheet says how, and what remains unsettled.',
      },
    ),
    tip: l(
      'Il ne bouge pas avec le modèle : c’est un élément de décor qui dit ce qui reste une fois le carbone parti.',
      'It does not move with the model: it is a piece of scenery that says what stays once the carbon has gone.',
    ),
    design: l(
      'Un digesteur ne détruit pas l’azote : il le rend plus disponible. C’est une différence avec la combustion, et l’autre raison d’être de cette cuve. Le phosphore suit le même chemin : 248 mg/L sur les restes, 225 sur le marché.',
      'A digester does not destroy nitrogen: it makes it more available. That is a difference from burning, and the other reason for this tank. Phosphorus takes the same way: 248 mg/L on leftovers, 225 on market waste.',
    ),
  },
  {
    id: 'gas-bubble',
    scene: 'slurry',
    category: 'hydraulic',
    name: l('Bulle', 'Gas bubble'),
    short: l(
      'Le méthane et le CO₂ quittent le liquide ici : la composition du gaz se décide sur ce trajet.',
      'Methane and CO₂ leave the liquid here: the gas’s make-up is decided on this journey.',
    ),
    description: lf(
      'Pourquoi le gaz des épluchures, plus maigre, a-t-il plus de méthane ? Le calcul à partir des seuls chiffres mesurés répond : si les deux nourritures faisaient autant de CO₂ que de méthane, le liquide aurait retenu à peu près le même volume de CO₂ dans les deux cas, {co2Food} et {co2Market} par jour. Dans un petit débit, cela pèse plus lourd. Le modèle trouve {co2FoodModel} et {co2MarketModel}, sur une estimation de ce qui traverse l’anneau, et la thèse voisine dit la même chose en mots. Avec une teneur de 56,8 % sur les restes et 66,4 % sur le marché, le modèle lit {ch4Food} et {ch4Market}. La vitesse et la taille des bulles de ce monde sont pour l’œil.',
      'Why does the gas from peelings, the leaner gas, carry more methane? The sum from the measured figures alone answers: if both foods made as much CO₂ as methane, the liquid would have kept about the same volume of CO₂ in both cases, {co2Food} and {co2Market} a day. In a small flow that weighs more. The model finds {co2FoodModel} and {co2MarketModel}, on an estimate of what crosses the ring, and the neighbouring study says the same in words. For 56.8 % on leftovers and 66.4 % on market waste, the model reads {ch4Food} and {ch4Market}. The speed and size of this world’s bubbles are for the eye.',
    ),
    material: l('CH₄, CO₂, vapeur, H₂S', 'CH₄, CO₂, vapour, H₂S'),
    specs: [
      sp('Méthane mesuré', 'Methane measured', l('56,8 % et 66,4 %', '56.8 % and 66.4 %')),
      sp('Selon le modèle', 'By the model', lf('{ch4Food} et {ch4Market}', '{ch4Food} and {ch4Market}')),
      sp('Vapeur', 'Vapour', l('2 % à 20 °C, 7 % à 40 °C', '2 % at 20 °C, 7 % at 40 °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Une partie de ces bulles manque la cloche, et personne ne peut l’empêcher. Le CO₂ dissous peut repartir par l’anneau : c’est ce qui change un peu la composition lue.',
        check: 'Le méthane se mesure au détecteur, pas à l’œil, et la thèse le fait chaque jour pendant le suivi.',
        care: 'Aucune : c’est un résultat.',
      },
      {
        failure:
          'Part of these bubbles misses the bell, and nobody can prevent it. Dissolved CO₂ can leave through the ring: that shifts the make-up read a little.',
        check: 'Methane is read with an instrument, not by eye, and the thesis did so daily during its monitoring.',
        care: 'None: it is a result.',
      },
    ),
    tip: l(
      'Ici, elles montent aussi vite que le méthane vient, selon le modèle. Dans le monde de la cuve, leur nombre et leur part sur l’anneau le suivent aussi, et leur vitesse y reste un décor.',
      'Here they rise as fast as the methane comes, by the model. In the tank’s world their number and their share at the ring follow it too, and their speed there is only for the eye.',
    ),
    design: lf(
      'Un gaz plus riche ne veut pas dire plus d’énergie : les épluchures donnent {kwhMarket} par jour, et les restes {kwhFood}, sur les mêmes 2 kg. Un seul pourcentage ne dit rien d’une machine.',
      'A richer gas does not mean more energy: peelings give {kwhMarket} a day, and leftovers {kwhFood}, on the same 2 kg. One percentage says nothing of a machine.',
    ),
  },
  {
    id: 'surviving-germs',
    scene: 'slurry',
    category: 'site',
    name: l('Germes survivants', 'Surviving germs'),
    short: l(
      'Pourquoi l’effluent reste à manier avec précaution : ces températures ne suffisent pas à tout inactiver.',
      'Why the effluent calls for care: these temperatures do not inactivate everything.',
    ),
    description: l(
      'Le livre de référence le dit sans détour : à ces températures, la digestion ne peut pas assurer l’inactivation des virus, des bactéries et des parasites. Plus la cuve est chaude, mieux cela va, et cette cuve ne l’est pas beaucoup. La thèse cite un essai qui en écarte plusieurs, à 35 °C et en trois mois, sans le refaire : nous ne le reprenons pas comme une assurance. Elle-même a nourri sa cuve de viande et de poisson ; le tutoriel du Low-tech Lab écrit de ne pas le faire si l’effluent va sur des légumes mangés crus. Les règles sur ces déchets existent et varient selon le pays. Le modèle n’a pas de germes : sur ce point, il n’y a que des textes.',
      'The reference book says it bluntly: at these temperatures digestion cannot ensure the inactivation of viruses, bacteria and parasites. The warmer the tank the better, and this one is not very warm. The thesis quotes a test that clears several of them, at 35 °C and over three months, without repeating it: we do not take that up as an assurance. It fed its own tank meat and fish; the Low-tech Lab’s tutorial writes not to, if the effluent goes onto vegetables eaten raw. Rules on such waste exist and vary by country. The model has no germs: on this point there are only texts.',
    ),
    material: l(
      'Virus, bactéries, parasites, selon ce qui est entré',
      'Viruses, bacteria, parasites, depending on what went in',
    ),
    specs: [
      sp('Sur cette installation', 'On this plant', l('non mesurés', 'not measured')),
      sp('Dans le modèle', 'In the model', l('rien : pas de germes', 'nothing: no germs')),
    ],
    maintenance: maint(
      {
        failure: 'Un effluent traité comme de l’eau : sur des feuilles qu’on mange, sur les mains, près d’un puits.',
        check: 'Rien ne se lit à la maison. Ce qui compte, c’est où va ce liquide.',
        care: 'Des gants, un lavage de mains, pas de feuilles crues : la fiche du potager reprend le désaccord des sources sans le trancher.',
      },
      {
        failure: 'Effluent treated like water: on leaves that are eaten, on hands, near a well.',
        check: 'Nothing can be read at home. What counts is where this liquid goes.',
        care: 'Gloves, washed hands, no raw leaves: the vegetable bed’s sheet takes up the sources’ disagreement without settling it.',
      },
    ),
    tip: l(
      'Ils sont seulement là pour rappeler ce que cette goutte contient encore : leur nombre et leur mouvement ne viennent de rien de mesuré.',
      'They are here only as a reminder of what this drop still holds: their number and movement come from nothing measured.',
    ),
    design: l(
      'Enlever la matière organique et enlever les germes sont deux choses : la thèse mesure la première, autour de 83 à 92 % selon le paramètre, sans mesurer la seconde. Ces deux nombres ne se remplacent pas.',
      'Removing organic matter and removing germs are two things: the thesis measures the first, around 83 to 92 % depending on the parameter, and does not measure the second. The one does not stand for the other.',
    ),
  },
];
