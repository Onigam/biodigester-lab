// Parts of the `gas-line` world (17): where the energy goes, laid out in the order the gas flows. The measured plant had a tap, a hose and a stove (and, for research, a gauge). The trap, the relief, the filter and the arrester are composites: each sheet says where it comes from, that its size is ours, and that it was not on the measured plant. Hazards are said where the gesture is: H₂S at the filter, CO at the air sleeve and the vent, burns at the flame.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const GAS_LINE_PARTS: PartInfo[] = [
  {
    id: 'mincer',
    scene: 'gas-line',
    category: 'mechanical',
    name: l('Hachoir', 'Mincer'),
    short: l(
      'Le début du circuit, sur l’établi : moins de 1 cm, pour passer le tube et offrir plus de surface.',
      'The start of the circle, on the bench: under 1 cm, to pass the pipe and offer more surface.',
    ),
    description: l(
      'La thèse demandait des morceaux de moins de 1 cm, pour une raison de tuyau et une de biologie : passer dans le tube de 3 pouces, et donner plus de surface à ce qui découpe. Sur les restes de cantine, il n’y avait que la viande, le poisson et les fruits à hacher, au couteau ou au hachoir à viande manuel. Sur les déchets de marché, le hachoir n’a pas tenu : trop petit, ses lames s’émoussaient à chaque fois sur les fibres, si bien que tout a été coupé à la main puis passé au mixeur électrique. Un détail qui pèse lourd quand ce geste revient chaque jour.',
      'The thesis asked for pieces under 1 cm, for a reason of plumbing and one of biology: to pass the 3-inch pipe, and to give more surface to what cuts things up. In the canteen’s leftovers only meat, fish and fruit needed chopping, with a knife or a hand meat-mincer. On market waste the mincer did not last: too small, its blades went blunt again and again on the fibres, so everything was cut by hand and then put through an electric kitchen blender. A detail that weighs heavily when the gesture comes back every day.',
    ),
    material: l('Hachoir à viande manuel, en métal', 'Hand meat-mincer, metal'),
    specs: [
      sp('Taille visée', 'Size aimed at', l('moins de 1 cm', 'under 1 cm')),
      sp('Sur les épluchures', 'On peelings', l('couteau, puis mixeur', 'knife, then blender')),
    ],
    maintenance: maint(
      {
        failure: 'Des lames émoussées par les fibres : c’est ce que la thèse a vécu, sans en tirer de durée.',
        check:
          'Ce qui sort passe-t-il sans forcer dans le seau, puis dans le tube ? Sinon, c’est là que commence un tube bouché.',
        care: 'Rincé après chaque usage. Avant le hachoir, un tri : capsules, cure-dents et os ressortent de la cantine de la thèse.',
      },
      {
        failure: 'Blades blunted by fibre: that is what the thesis went through, without drawing a lifespan from it.',
        check:
          'Does what comes out pass into the bucket, then the pipe, with no force? If not, a blocked pipe starts here.',
        care: 'Rinsed after each use. Sorting comes before it: bottle caps, toothpicks and bones were picked out of the thesis’s canteen waste.',
      },
    ),
    tip: l(
      'Il est sur l’établi, à gauche : le chemin Flux des déchets part d’ici jusqu’à l’entonnoir.',
      'It is on the bench, to the left: the scraps’ route in Flows starts here and runs to the funnel.',
    ),
    design: l(
      'Le lab garde un hachoir à main, parce que c’est le geste de la thèse, et non une recommandation. Aucune source ne chiffre le temps passé : c’est pourtant ce temps qui, dans l’enquête, décide si une machine reste en marche.',
      'The lab keeps a hand mincer because it is the thesis’s gesture, not a recommendation. No source puts a figure on the time spent: yet that time, in the survey, decides whether a machine keeps running.',
    ),
  },
  {
    id: 'dilution-bucket',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Seau de dilution', 'Dilution bucket'),
    short: l(
      'Rempli jusqu’à la marque des 10 L, deux fois par jour : un kilo de restes et environ 9 L d’eau.',
      'Filled to the 10 L mark, twice a day: a kilo of leftovers and about 9 L of water.',
    ),
    description: lf(
      'Au début, la thèse versait la nourriture puis 10 L d’eau derrière, comme le voulait l’installateur. Elle a changé la méthode pour moins boucher : mélanger d’abord dans un seau jusqu’à la marque des 10 L, bien remuer, et verser le tout. Ces deux repas, à 8 h 30 et 17 h, font 20 L par jour : 2 kg et environ 18 L d’eau. C’est de ces 20 L, avec les 850 L de la cuve, que vient le temps de séjour de 42,5 jours. Chaque jour, cela réchauffe ou refroidit tout autant la cuve : l’eau y passe à température de la réserve. Le curseur « Eau par kilo » du modèle part de ces 9 L.',
      'At first the thesis poured the food in, then 10 L of water behind it, as the installer wished. It changed the method to block less: mix first in a bucket up to the 10 L mark, stir well, and pour it all in. These two feeds, at 8:30 and 17:00, make 20 L a day: 2 kg and about 18 L of water. From those 20 L, with the tank’s 850 L, comes the residence of 42.5 days. Every day that warms or cools the tank just the same: the water goes through at the butt’s temperature. The model’s “Water per kilo” slider starts from those 9 L.',
    ),
    material: l('Seau en plastique, avec une marque', 'Plastic bucket, with a mark'),
    specs: [
      sp('Marque', 'Mark', v('10 L')),
      sp('Par jour', 'A day', l('2 repas, 20 L', '2 feeds, 20 L')),
      sp('Temps de séjour', 'Residence', l('42,5 jours', '42.5 days')),
    ],
    maintenance: maint(
      {
        failure:
          'Moins d’eau, et le tube se bouche. Trop d’eau, et le temps de séjour raccourcit. Une mesure à l’œil, et les jours se suivent sans se ressembler.',
        check: 'Une marque visible, même après des mois de bouillie : la thèse la demande bien lisible.',
        care: 'Rincé. L’eau gardée à côté de la cuve, pour qu’elle arrive à sa température.',
      },
      {
        failure:
          'Less water, and the pipe blocks. More water, and the residence shortens. Measured by eye, one day is not like the next.',
        check: 'A visible mark, even after months of slurry: the thesis asks for one that reads clearly.',
        care: 'Rinsed. The water kept beside the tank, so that it arrives at its temperature.',
      },
    ),
    tip: l(
      'Il est au pied de l’établi : ses 10 L sont ceux que le trop-plein rend dans le seau à l’autre bout.',
      'It stands at the foot of the bench: its 10 L are those the overflow gives back to the bucket at the far end.',
    ),
    design: l(
      'Une marque sur un seau remplace une balance et une consigne. La thèse la recommande, avec un petit seau pour la ration : son enquête montre que les ménages ne savaient pas toujours quelle quantité d’eau mettre.',
      'A mark on a bucket stands in for scales and an instruction. The thesis recommends one, with a small pail for the ration: its survey shows that households did not always know how much water to add.',
    ),
  },
  {
    id: 'bell-hose',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Tuyau souple', 'Bell hose'),
    short: l(
      'Le tuyau qui suit la cloche dans sa course : il plie à chaque mouvement, et c’est un point faible.',
      'The hose that follows the bell along its travel: it flexes with every movement, and it is a weak point.',
    ),
    description: lf(
      'Un tuyau souple de ½ pouce, 5 m au total. La cloche monte de 0,69 m à chaque remplissage : tout ce qui part d’elle doit suivre sans tirer, ou il arrache le robinet. La thèse trouve que l’eau s’amasse aux endroits où ce tuyau plie, et une étude voisine a vu l’eau s’arrêter à l’entrée d’une vanne. Le modèle compte {hoseDrop} perdus dans le tuyau à {flow2}, en écoulement laminaire : presque rien, tant qu’il reste vide. Le Low-tech Lab demande un collier sur chaque raccord entre un élément et un tuyau.',
      'A flexible ½-inch hose, 5 m in all. The bell rises by 0.69 m at each filling: all that leaves it has to follow without pulling, or it tears the tap off. The thesis finds water gathering where this hose bends, and a neighbouring study saw water held up in front of a valve. The model counts {hoseDrop} lost in the hose at {flow2}, in laminar flow: next to nothing, as long as it stays empty. The Low-tech Lab asks for a clamp on each joint between a part and a hose.',
    ),
    material: l('Tuyau souple, colliers de serrage', 'Flexible hose, hose clamps'),
    specs: [
      sp('Tuyau', 'Hose', l('½ pouce, 5 m', '½ inch, 5 m')),
      sp('Course à suivre', 'Travel to follow', l('0,69 m', '0.69 m')),
      sp('Perte, à débit du brûleur', 'Loss, at the burner’s flow', v('{hoseDrop}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un pli où l’eau reste, un raccord qui fuit, un tuyau qui se fend au soleil. Une fuite dans ce tuyau ne se voit pas : elle se sent, ou pas.',
        check: 'L’eau savonneuse sur les raccords, et le tuyau parcouru de la main : des bulles disent une fuite.',
        care: 'Le remplacer dès qu’il craque, avec une longueur qui laisse la cloche monter au bout de sa course sans tirer.',
      },
      {
        failure:
          'A bend where water stays, a leaking joint, a hose splitting in the sun. A leak in this hose cannot be seen: it can be smelt, or not.',
        check: 'Soapy water on the joints, and a hand along the hose: bubbles mean a leak.',
        care: 'Replaced as soon as it cracks, with a length that lets the bell reach the end of its travel without pulling.',
      },
    ),
    tip: l(
      'Faites monter la cloche : le tuyau suit, sans décoller du robinet. Sa forme est recalculée quand le robinet a bougé.',
      'Make the bell rise: the hose follows, without leaving the tap. Its shape is worked out again when the tap has moved.',
    ),
    design: l(
      'Le tuyau est la seule pièce mobile de cette ligne, en dehors de la flamme. Un tube rigide serait plus durable, mais il ne suivrait pas la cloche : la souplesse se paie en pannes.',
      'The hose is the only moving part of this line, apart from the flame. A rigid pipe would last longer, but it would not follow the bell: flexibility is paid for in faults.',
    ),
  },
  {
    id: 'condensate-trap',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Piège à condensats', 'Condensate trap'),
    short: l(
      'Au point bas du tuyau : son absence a arrêté de vraies installations, et il n’était pas sur celle qu’on a mesurée.',
      'At the hose’s low point: its absence stopped real plants, and it was not on the one measured.',
    ),
    description: lf(
      'Le gaz sort saturé, se refroidit, et l’eau tombe. Le modèle compte {condensate} par jour pour une heure de flamme : c’est peu, mais la cloche ne pousse qu’à {pushCm} d’eau, si bien que ce peu suffit à bloquer. La thèse note que même une installation bien conduite se bouche chaque semaine, et demande un purgeur, sans en donner le modèle dans le PDF que nous avons lu. Le livre de référence en décrit deux, automatique et manuel, au point bas. L’installation mesurée n’en avait pas. Le pot de verre de ce dessin est une lecture générique : aucune de ses tailles ne vient d’une source.',
      'The gas leaves saturated, cools, and water falls out. The model counts {condensate} a day for an hour of flame: that is little, but the bell pushes at only {pushCm} of water, so that little is enough to block. The thesis notes that even a well-run plant blocks every week, and asks for a drain, without giving its form in the PDF we read. The reference book describes two, automatic and manual, at the low point. The measured plant had none. This drawing’s glass jar is a generic reading: none of its sizes comes from a source.',
    ),
    material: l(
      'Pot transparent, deux embouts, robinet de purge, générique',
      'Clear jar, two stubs, a drain tap, generic',
    ),
    specs: [
      sp('Où', 'Where', l('au point bas', 'at the low point')),
      sp('Sur l’installation mesurée', 'On the measured plant', l('absent', 'absent')),
      sp('Hauteur dessinée, axe du raccord', 'Height drawn, fitting’s axis', v('{trapY}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un piège plein redevient un bouchon. Un robinet de purge qui fuit, et c’est de l’air qui entre ou du gaz qui sort. Dans la ligne, le gaz est sous très peu de pression, et cela ne l’empêche pas de fuir.',
        check: 'Le niveau d’eau dans le pot : c’est le seul instrument d’un ménage pour cette panne.',
        care: 'Purgé régulièrement, robinet de gaz fermé et sans flamme à côté. Le livre compte de chaque semaine à chaque mois, et l’enquête de la thèse dit plutôt chaque semaine.',
      },
      {
        failure:
          'A full trap becomes a plug again. A drain tap that leaks, and air comes in or gas goes out. In the line the gas is under very little pressure, and that does not stop it leaking.',
        check: 'The water level in the jar: it is a household’s only instrument for this fault.',
        care: 'Drained regularly, gas tap shut and no flame nearby. The book counts from weekly to monthly, and the thesis’s survey says rather weekly.',
      },
    ),
    tip: l(
      'Le niveau de son eau suit le modèle. Coupez-le dans la Simulation, et lancez « De l’eau dans le tuyau » : le pot s’en va, et l’eau reste dans le tuyau.',
      'Its water level follows the model. Switch it off in the Simulation, and run “Water in the hose”: the jar goes, and the water stays in the hose.',
    ),
    design: lf(
      'Pente et point bas : toute la ligne est pensée autour de cette eau. Le modèle la compte avec une pente de {hoseSlope} de chaque côté, une estimation. Sur le terrain, ce qui se passe est plus simple : un peu trop d’eau, et la flamme ne tient plus.',
      'Fall and low point: the whole line is thought out around this water. The model counts it with a slope of {hoseSlope} each side, an estimate. In the field what happens is simpler: a little too much, and the flame no longer holds.',
    ),
  },
  {
    id: 'hydraulic-relief',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Soupape hydraulique', 'Hydraulic relief'),
    short: l(
      'Une bouteille d’eau avec un tube plongeur : une soupape montrée pour comprendre, absente de l’installation mesurée et du modèle.',
      'A water bottle with a dip tube: a relief shown for understanding, absent from the measured plant and from the model.',
    ),
    description: lf(
      'La vraie soupape de cette installation, c’est le bord de sa cloche : au bout de sa course, le gaz en trop ressort dans l’anneau. Cette bouteille n’y était pas : elle montre le principe, le gaz poussant sur une colonne d’eau et passant dessous une fois la colonne vaincue. La profondeur du tube, {reliefDepth}, est notre estimation, bien au-dessus des 4 mbar de la cloche chargée : sur ce dessin, elle n’agit donc jamais. Le niveau dans le tube suit la pression, un centimètre par millibar, et c’est tout ce que le modèle lui donne : il n’a pas de soupape. Le tutoriel du Low-tech Lab en demande une à 100 mbar, sur son sac souple.',
      'This plant’s real relief is its bell’s rim: at the end of its travel, the extra gas comes out in the ring. This bottle was not there: it shows the principle, gas pressing on a column of water and passing under it once the column is beaten. The dip tube’s depth, {reliefDepth}, is our estimate, well above the 4 mbar of the loaded bell: in this drawing it therefore never acts. The level in the tube follows the pressure, a centimetre per millibar, and that is all the model gives it: it has no relief. The Low-tech Lab’s tutorial asks for one at 100 mbar, on its flexible bag.',
    ),
    material: l('Bouteille transparente, tube plongeur, eau, générique', 'Clear bottle, dip tube, water, generic'),
    specs: [
      sp('Sur l’installation mesurée', 'On the measured plant', l('absente', 'absent')),
      sp('Profondeur du tube, dessinée', 'Dip tube’s depth, as drawn', v('{reliefDepth}')),
      sp('Sur le sac du Low-tech Lab', 'On the Low-tech Lab’s bag', '100 mbar'),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau s’évapore ou gèle, et la colonne ne vaut plus ce qu’on croit. Une soupape qui souffle dégage du gaz où elle se trouve.',
        check: 'Le niveau de l’eau, et où part sa sortie : à l’air libre, jamais dans une pièce.',
        care: 'Remettre de l’eau. Une pression basse, ici de 2 à 4 mbar, n’est pas une raison d’être moins attentif : le gaz reste du gaz.',
      },
      {
        failure:
          'Water evaporates or freezes, and the column is no longer worth what one thinks. A relief that blows lets gas out wherever it stands.',
        check: 'The water level, and where its outlet goes: to the open air, never into a room.',
        care: 'Topped up with water. A low pressure, here 2 to 4 mbar, is no reason for less attention: the gas is still gas.',
      },
    ),
    tip: l(
      'Regardez le niveau dans le tube pendant « Le demi-parpaing » : il descend d’environ 2 cm quand le poids se pose.',
      'Watch the level in the tube during “The half-brick”: it falls by about 2 cm as the weight lands.',
    ),
    design: l(
      'Elle vient de la liste de pièces voulue au départ pour ce lab, pas de la machine mesurée : une soupape où on voit ce qui se passe aide à comprendre la pression. La montrer revient à dire aussi ce qu’elle n’est pas sur cette machine.',
      'It comes from the parts list first wanted for this lab, not from the measured machine: a relief where one sees what happens helps in understanding pressure. Showing it also means saying what it is not on this machine.',
    ),
  },
  {
    id: 'h2s-filter',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Filtre à H₂S', 'H₂S filter'),
    short: l(
      'De la paille de fer ou de l’argile, pour le gaz le plus dangereux de la machine. Ce filtre n’était pas sur l’installation mesurée.',
      'Iron wool or clay, for the most dangerous gas in the machine. This filter was not on the measured plant.',
    ),
    description: lf(
      'L’hydrogène sulfuré se sent à 0,008 ppm : c’est l’odeur d’œuf pourri. Il devient plus discret, puis disparaît au nez vers 100 ppm, et il tue d’un coup vers 500 ppm, d’après le guide français des installations agricoles. Dans cette machine, sa teneur n’est pas connue : le capteur de la thèse plafonnait à 100 ppm presque partout. L’odeur n’est donc pas une alarme. La thèse a essayé un petit piège à soufre sur son installation, sans pouvoir en mesurer l’effet avec ce capteur. Le Low-tech Lab fait passer le gaz sur du fer ou de l’argile. Ce filtre n’était pas sur l’installation mesurée, et sa forme et ses tailles sont les nôtres.',
      'Hydrogen sulphide can be smelt at 0.008 ppm: the smell of rotten eggs. It grows fainter, then disappears to the nose at about 100 ppm, and it kills at once at about 500 ppm, by the French guide for farm plants. In this machine its level is not known: the thesis’s sensor hit its ceiling of 100 ppm almost everywhere. So the smell is no alarm. The thesis tried a small sulphur trap on its plant, unable to measure its effect with that sensor. The Low-tech Lab passes the gas over iron or clay. This filter was not on the measured plant, and its form and sizes are ours.',
    ),
    material: l('Boîtier générique, paille de fer ou billes d’argile', 'Generic housing, iron wool or clay beads'),
    specs: [
      sp('Seuil d’odeur', 'Smell threshold', l('0,008 ppm', '0.008 ppm')),
      sp('Le nez ne sent plus', 'The nose stops smelling', l('vers 100 ppm', 'about 100 ppm')),
      sp('Mort soudaine', 'Sudden death', l('vers 500 ppm', 'about 500 ppm')),
      sp('Dans ce gaz', 'In this gas', l('inconnu', 'unknown')),
    ],
    maintenance: maint(
      {
        failure:
          'Il sature sans rien dire, et rien dans un ménage n’indique quand : aucun instrument n’est là pour le lire. Le gaz attaque les métaux qu’il touche.',
        check: 'Aucun geste de ménage ne dit combien d’H₂S il reste : l’odeur ne le dit pas, et la cloche non plus.',
        care: 'L’ouvrir revient à relâcher ce qu’il a retenu : à l’air libre, jamais dans une pièce, sans se pencher dessus. Ce gaz est plus lourd que l’air et s’amasse en bas, dans une fosse ou un regard.',
      },
      {
        failure:
          'It saturates silently, and nothing in a household says when: no instrument is there to read it. The gas attacks the metals it touches.',
        check: 'No household gesture tells how much H₂S remains: the smell does not, nor does the bell.',
        care: 'Opening it lets go of what it has held: in open air, never in a room, without leaning over it. This gas is heavier than air and gathers low, in a pit or a manhole.',
      },
    ),
    tip: l(
      'La fiche de ce filtre est la seule où figure l’échelle de ce gaz : la leçon 6 la reprend, avec la façon dont on perd l’odorat.',
      'This filter’s sheet is the only one with this gas’s ladder: lesson 6 takes it up, with the way the sense of smell is lost.',
    ),
    design: l(
      'La thèse écrit qu’une désulfuration n’est pas nécessaire à cette échelle, et le livre le dit pour la plupart des usages. Nous ne le répétons pas comme une assurance : la même thèse n’a pas pu mesurer cet H₂S au-delà de 100 ppm. Ce lab montre donc le filtre et ne promet rien de lui.',
      'The thesis writes that desulphurisation is not needed at this scale, and the book says so for most uses. We do not repeat that as an assurance: the same thesis could not measure this H₂S past 100 ppm. So this lab shows the filter and promises nothing of it.',
    ),
  },
  {
    id: 'flame-arrester',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Arrête-flamme', 'Flame arrester'),
    short: l(
      'Une boule de paille d’acier ou de cuivre sur le trajet du gaz, non tassée : tirée du Low-tech Lab, pas de l’installation mesurée.',
      'A ball of steel or copper wool in the gas’s way, not packed: taken from the Low-tech Lab, not from the measured plant.',
    ),
    description: l(
      'Le Low-tech Lab place une boule de paille de fer ou de cuivre là où l’on craint un retour de flamme, au plus près de la gazinière : par conduction, elle abaisse la température et étouffe la combustion. Il prévient de ne pas trop la tasser, ce qui limiterait le passage du gaz. Sur cette ligne, à quelques millibars, une boule trop serrée se verrait aussitôt à la flamme. Ce dispositif n’était pas sur l’installation mesurée, et nous n’avons lu aucun essai qui dise ce que cette boule arrête vraiment à ces débits. Ce dessin en donne une forme : il ne prouve rien sur son efficacité.',
      'The Low-tech Lab sets a ball of iron or copper wool where a flashback is feared, as near the stove as possible: by conduction it lowers the temperature and smothers the burning. It warns against packing it too tight, which would limit the gas’s way. On this line, at a few millibars, a ball packed too tight would show at once in the flame. This device was not on the measured plant, and we read no test saying what such a ball really stops at these flows. This drawing gives it a shape: it proves nothing about how well it works.',
    ),
    material: l('Paille d’acier ou de cuivre, dans un boîtier générique', 'Steel or copper wool, in a generic housing'),
    specs: [
      sp('Sur l’installation mesurée', 'On the measured plant', l('absent', 'absent')),
      sp('Origine', 'Origin', l('tutoriel du Low-tech Lab', 'the Low-tech Lab’s tutorial')),
      sp('Essai lu', 'Test read', l('aucun', 'none')),
    ],
    maintenance: maint(
      {
        failure: 'Une paille qui rouille, que le gaz et l’humidité attaquent. Une boule trop tassée qui freine le gaz.',
        check: 'Une flamme qui faiblit, et qui revient en retirant la boule, dit qu’elle était trop serrée.',
        care: 'Remplacée quand elle rouille. Le lab ne donne ni quantité ni tassage : le tutoriel n’en donne pas.',
      },
      {
        failure: 'Wool rusting, attacked by the gas and the damp. A ball packed too tight that slows the gas.',
        check: 'A flame that weakens, and comes back once the ball is out, says it was too tight.',
        care: 'Replaced when it rusts. The lab gives no quantity or packing: the tutorial gives none.',
      },
    ),
    tip: l(
      'En Éclaté, les pièces de la planche se détachent chacune de son raccord : c’est là qu’on lit l’ordre de la ligne.',
      'In Explode, the board’s parts each come off their fitting: that is where the line’s order reads.',
    ),
    design: l(
      'Cette boule n’a qu’une raison d’être, et elle ne s’applique qu’à ce qui se passe à l’autre bout : une flamme qui remonte vers un sac ou une cloche. Sur une cloche flottante, où il peut entrer de l’air, on ne peut pas s’en passer sans y avoir pensé.',
      'This ball has one purpose, which only applies to what happens at the far end: a flame going back towards a bag or a bell. With a floating bell, where air can get in, it is not to be left out without some thought.',
    ),
  },
  {
    id: 'pressure-gauge',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Manomètre', 'Pressure gauge'),
    short: l(
      'Un cadran de 0 à 60 mbar pour une pression de 2 mbar : l’aiguille bouge à peine, et c’est instructif.',
      'A dial from 0 to 60 mbar for a pressure of 2 mbar: the needle hardly moves, and that is instructive.',
    ),
    description: lf(
      'L’installation de recherche seule en avait un. Il a lu 2 mbar à chacun de dix essais sans poids, et 4 mbar à chacun de cinq essais avec le demi-parpaing : un instrument si large lit-il vraiment ces écarts ? C’est l’hypothèse qui expliquerait pourquoi le débit monte davantage que la théorie : un orifice ne donne {orificeRatio} que si la pression lue est la bonne. La cloche du modèle va de {pressureRest} à {pressureFull} selon sa hauteur, ce qu’un tel cadran ne peut guère dire. Dans ce monde, l’aiguille lit la pression du modèle au brûleur tant que la flamme brûle, et sur la vraie échelle : c’est pour cela qu’elle bouge si peu.',
      'Only the research plant had one. It read 2 mbar at each of ten tests with no weight, and 4 mbar at each of five with the half-brick: does so wide an instrument really read such gaps? That is the assumption that would explain why the flow rises more than theory says: an orifice gives only {orificeRatio} if the pressure read is the right one. The model’s bell goes from {pressureRest} to {pressureFull} according to its height, which such a dial can hardly say. In this world the needle reads the model’s pressure at the burner while the flame burns, and on the real scale: that is why it moves so little.',
    ),
    material: l('Manomètre à cadran', 'Dial gauge'),
    specs: [
      sp('Échelle', 'Scale', l('de 0 à 60 mbar', '0 to 60 mbar')),
      sp('Lu sans poids', 'Read with no weight', '2 mbar'),
      sp('Lu avec le demi-parpaing', 'Read with the half-brick', '4 mbar'),
      sp('Sur un ménage', 'On a household', l('aucun', 'none')),
    ],
    maintenance: maint(
      {
        failure: 'L’aiguille qui reste à sa place n’est pas une panne : c’est l’échelle.',
        check: 'Hors de la ligne, sans pression, elle doit revenir au zéro.',
        care: 'Rien de particulier : il n’entre dans la ligne que pour la mesure, et chaque raccord de plus est une fuite possible.',
      },
      {
        failure: 'A needle staying in place is no fault: it is the scale.',
        check: 'Off the line or with no pressure, it should return to zero.',
        care: 'Nothing special: it joins the line only for measuring, and every extra joint is a possible leak.',
      },
    ),
    tip: l(
      'Lancez « Le demi-parpaing » et regardez ce qu’elle dit, à cette échelle : deux graduations au mieux.',
      'Run “The half-brick” and see what it says, on this scale: two graduations at best.',
    ),
    design: lf(
      'Une lecture moyenne de 2 mbar et un calcul de {pressureMid} à mi-course : on ne peut rien en conclure de plus fin. Il reste le fait le plus net : 12 kg, {brickMbar} : là, l’arithmétique et le cadran disent la même chose.',
      'A mean reading of 2 mbar and a sum of {pressureMid} at mid-travel: nothing finer can be concluded. The clearest fact remains: 12 kg, {brickMbar}: there, the arithmetic and the dial say the same.',
    ),
  },
  {
    id: 'wall-sleeve',
    scene: 'gas-line',
    category: 'structure',
    name: l('Fourreau de traversée', 'Wall sleeve'),
    short: l(
      'Le passage du gaz à travers le mur de la cuisine : aucune source ne le décrit, et ce dessin est une lecture.',
      'Where the gas passes through the kitchen wall: no source describes it, and this drawing is a reading.',
    ),
    description: lf(
      'Aucune source ne décrit cette traversée : la thèse montre des bâtiments ouverts, où elle n’avait guère à se poser. Ce dessin en fait un fourreau scellé dans un mur de {wallT}, à {sleeveHeight} du sol, pour trois raisons de bon sens : un tuyau souple ne frotte pas sur une arête, il garde sa pente, et l’air ne passe pas autour. Ici, le mur n’est plus un décor, c’est une frontière : tout ce qui passe de l’autre côté arrive dans une pièce fermée. Une fuite dehors se dilue ; dedans, elle s’accumule.',
      'No source describes this crossing: the thesis shows open buildings, where it hardly came up. This drawing makes it a sleeve set in a wall of {wallT}, {sleeveHeight} above the ground, for three plain reasons: a flexible hose does not rub on an edge, it keeps its fall, and air does not pass round it. Here the wall is no longer scenery, it is a border: all that passes to the other side comes into a closed room. A leak outside dilutes; inside it gathers.',
    ),
    material: l('Tube de protection, mastic ; notre lecture', 'A protective tube, sealant; our reading'),
    specs: [
      sp('Sur l’installation mesurée', 'On the measured plant', l('aucune source', 'no source')),
      sp('Mur dessiné', 'Wall drawn', v('{wallT}')),
      sp('Hauteur dessinée', 'Height drawn', v('{sleeveHeight}')),
    ],
    maintenance: maint(
      {
        failure: 'Un mastic fendu : un jeu autour du tuyau où passe l’air, ou un tuyau pincé par le mouvement du mur.',
        check: 'Un jeu visible, une trace d’humidité, un tuyau qui frotte.',
        care: 'Refaire le joint. Le tuyau y garde sa pente, pour que l’eau descende vers le point bas, loin de la pièce.',
      },
      {
        failure: 'Cracked sealant: a gap round the hose where air passes, or a hose pinched as the wall moves.',
        check: 'A visible gap, a damp mark, a hose rubbing.',
        care: 'Redo the seal. The hose keeps its fall there, so that water runs to the low point, away from the room.',
      },
    ),
    tip: l(
      'Sélectionnez-le : la vue cadre le mur, la cour d’un côté et la cuisine de l’autre, et c’est tout le sens de cette pièce.',
      'Select it: the view frames the wall, the yard on one side and the kitchen on the other, and that is all this part means.',
    ),
    design: l(
      'Un détail sans source, et le lab le dit. Le propos n’est pas de donner la bonne façon de percer un mur : il est de montrer qu’à cet endroit, la machine entre dans un espace de vie.',
      'A detail with no source, and the lab says so. The point is not to give the right way through a wall: it is to show that at this spot, the machine enters a living space.',
    ),
  },
  {
    id: 'kitchen-valve',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Vanne de cuisine', 'Kitchen valve'),
    short: l(
      'Une vanne d’un demi-pouce à portée de main, à fermer quand la flamme s’éteint.',
      'A half-inch valve within reach, to be closed when the flame goes out.',
    ),
    description: lf(
      'L’installation mesurée avait son robinet sur la cloche ; le manuel de construction ajoute une vanne d’un demi-pouce sur le réchaud. Son utilité se lit dans l’étude voisine : quand les cloches se vident, les flammes rétrécissent, et elle juge probable qu’elles s’éteignent sans que les cuisiniers le voient. La flamme morte, le gaz continue de sortir, avec presque aucune pression pour se signaler. D’où l’alarme de la Simulation, « La flamme s’est éteinte : robinet à fermer ». Sur le modèle, cela arrive sous {flameLimit} au brûleur, une estimation : la moitié de la plus basse pression à laquelle quelqu’un a chronométré une flamme.',
      'The measured plant had its tap on the bell; the build manual adds a half-inch valve at the stove. Its use reads in the neighbouring study: as the bells empty, the flames shrink, and it finds it likely they go out with the cooks not seeing. With the flame dead the gas goes on coming out, with next to no pressure to announce it. Hence the Simulation’s alarm, “The flame has gone out: the tap must be closed”. In the model this happens below {flameLimit} at the burner, an estimate: half the lowest pressure at which anyone timed a flame.',
    ),
    material: l('Vanne ½ pouce, raccords métalliques', '½-inch valve, metal fittings'),
    specs: [
      sp('Taille', 'Size', l('½ pouce', '½ inch')),
      sp('Limite de flamme du modèle', 'The model’s flame limit', v('{flameLimit}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une vanne qui ne ferme plus franchement. Ou une vanne qu’on règle pour baisser la flamme : l’étude voisine note que cela rend son extinction plus probable.',
        check: 'Fermée, l’eau savonneuse sur le raccord ne doit pas buller. Ouverte, le débit doit passer sans frein.',
        care: 'Fermée en quittant la pièce, ouverte seulement pour allumer. Une flamme qui manque à l’appel se traite d’abord en fermant.',
      },
      {
        failure:
          'A valve that no longer closes cleanly. Or a valve used to turn the flame down: the neighbouring study notes that this makes its going out more likely.',
        check: 'Closed, soapy water on the joint should not bubble. Open, the flow should pass unhindered.',
        care: 'Closed on leaving the room, open only for lighting. A flame that is missing is first dealt with by closing.',
      },
    ),
    tip: l(
      'Lancez « La flamme s’éteint » : le modèle ferme la vanne pour vous, et l’alarme dit pourquoi.',
      'Run “The flame goes out”: the model closes the valve for you, and the alarm says why.',
    ),
    design: l(
      'Une vanne de cuisine sert d’abord à régler, et ici elle sert surtout à couper. Rien ne l’automatise : aucune sécurité de flamme comme sur une cuisinière récente, et aucune source lue n’en propose à ces pressions.',
      'A kitchen valve first serves for adjusting, and here it mostly serves for shutting. Nothing automates it: no flame-failure device as on a recent cooker, and no source we read offers one at these pressures.',
    ),
  },
  {
    id: 'biogas-burner',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Brûleur à biogaz', 'Biogas burner'),
    short: lf(
      'Le réchaud vendu avec l’installation : {flow2} à 2 mbar, environ {powerIn} en entrée. Pas un brûleur à butane.',
      'The stove sold with the plant: {flow2} at 2 mbar, about {powerIn} going in. Not a butane burner.',
    ),
    description: lf(
      'Son débit vient de la thèse : 100 L brûlés en 22,3 min à 2 mbar (dix essais, de 19 à 27 min), soit {flow2}, et environ {powerIn} de gaz en entrée. C’est petit, et le mot « demi-heure de flamme » ne veut rien dire sans ce chiffre. Un réchaud de biogaz moyen, d’après le livre, consomme environ 0,4 m³/h, à 55 % de rendement. Il diffère d’un réchaud à butane : ce gaz contient moins d’énergie par litre, porte du CO₂, et demande moins d’air. Le Low-tech Lab adapte un réchaud du commerce en fermant une partie de l’arrivée d’air. Les dimensions de ce dessin sont estimées : la thèse ne les donne pas.',
      'Its flow comes from the thesis: 100 L burnt in 22.3 min at 2 mbar (ten tests, from 19 to 27 min), or {flow2}, and about {powerIn} of gas going in. It is small, and the words “half an hour of flame” mean nothing without this figure. An average biogas stove, by the book, uses about 0.4 m³/h, at 55 % efficiency. It differs from a butane stove: this gas holds less energy per litre, carries CO₂, and asks for less air. The Low-tech Lab adapts a shop-bought stove by closing part of the air inlet. This drawing’s sizes are estimates: the thesis does not give them.',
    ),
    material: l('Réchaud à biogaz, distribué par l’installateur', 'Biogas stove, distributed by the installer'),
    specs: [
      sp('100 L à 2 mbar', '100 L at 2 mbar', l('22,3 min', '22.3 min')),
      sp('Débit', 'Flow', v('{flow2}')),
      sp('Puissance en entrée', 'Power going in', v('{powerIn}')),
      sp('Utile, à 55 %', 'Useful, at 55 %', v('{powerUseful}')),
      sp('Moyenne selon le livre', 'Average by the book', l('environ 0,4 m³/h', 'about 0.4 m³/h')),
    ],
    maintenance: maint(
      {
        failure:
          'Des trous bouchés par la poussière, la rouille ou les restes de repas : une étude voisine a vu leur nombre diminuer, et le gaz passer moins bien. Ses réchauds montraient déjà des dégâts au bout d’un an.',
        check:
          'Une flamme régulière sur tous les trous, bleue. Une flamme petite, ou jaune, renvoie à la fiche de la virole d’air.',
        care: 'Nettoyé souvent, ajusté, et les parties mobiles graissées, selon le livre. Rien de cet entretien n’a été mesuré sur la durée ici.',
      },
      {
        failure:
          'Holes blocked with dust, rust or food: a neighbouring study saw their number fall, and the gas pass less well. Its stoves already showed damage after a year.',
        check: 'A regular flame on all the holes, blue. A small or yellow flame points to the air sleeve’s sheet.',
        care: 'Cleaned often, adjusted, and moving parts greased, by the book. None of this care has been measured over time here.',
      },
    ),
    tip: lf(
      'Le curseur de débit du brûleur part de ces {flow2}. Essayez les 400 L/h du livre : la cloche se vide plus vite, et la flamme ne dure plus autant.',
      'The burner’s flow slider starts from this {flow2}. Try the book’s 400 L/h: the bell empties faster, and the flame no longer lasts as long.',
    ),
    design: lf(
      'Un petit brûleur est la réponse à une petite pression. Le modèle lui garde une loi d’orifice, et lui fait perdre la flamme sous {flameLimit}. Reste à garder en tête ce qu’il rend : sur ce brûleur, un kilo de restes donne {minPerKgFood}, un kilo d’épluchures {minPerKgMarket}. À 0,4 m³/h et 100 L par kilo, {minPerKgBook}.',
      'A small burner answers a small pressure. The model keeps an orifice law for it, and lets it lose its flame below {flameLimit}. Keep in mind what it gives: on this burner a kilo of leftovers gives {minPerKgFood}, a kilo of peelings {minPerKgMarket}. At 0.4 m³/h and 100 L per kilo, {minPerKgBook}.',
    ),
  },
  {
    id: 'primary-air-sleeve',
    scene: 'gas-line',
    category: 'mechanical',
    name: l('Virole d’air primaire', 'Primary-air sleeve'),
    short: l(
      'Le réglage d’air du brûleur : c’est lui qui décide si la flamme est bleue ou jaune.',
      'The burner’s air setting: it decides whether the flame is blue or yellow.',
    ),
    description: l(
      'Le gaz sort du gicleur, et sa vitesse aspire de l’air par une ouverture, avant les trous du brûleur. Le livre donne la lecture : une flamme allongée et jaunâtre indique une combustion incomplète, donc du monoxyde de carbone et du méthane dans la cuisine, et l’entrée d’air est à régler. Le biogaz demande moins d’air qu’un butane, et le Low-tech Lab en ferme une partie avec une bague ou du papier d’aluminium. Pour ce brûleur, nous n’avons trouvé aucun chiffre de monoxyde de carbone, et le modèle ne calcule ni couleur ni température de flamme : ce réglage n’est pas dans la Simulation.',
      'The gas leaves the jet, and its speed draws air through an opening, before the burner’s holes. The book gives the reading: a long, yellowish flame means incomplete burning, so carbon monoxide and methane in the kitchen, and the air inlet needs adjusting. Biogas asks for less air than butane, and the Low-tech Lab closes part of the opening with a ring or aluminium foil. For this burner we found no carbon monoxide figure, and the model works out no flame colour or temperature: this setting is not in the Simulation.',
    ),
    material: l('Virole métallique, sur le corps du brûleur', 'Metal sleeve, on the burner’s body'),
    specs: [
      sp('Flamme jaune et longue', 'Long yellow flame', l('combustion incomplète, CO', 'incomplete burning, CO')),
      sp('CO de ce brûleur', 'CO from this burner', l('aucun chiffre trouvé', 'no figure found')),
      sp('Dans le modèle', 'In the model', l('absent', 'absent')),
    ],
    maintenance: maint(
      {
        failure:
          'Une flamme jaune qui s’installe dans une pièce fermée, sans odeur particulière. Le monoxyde de carbone n’en a pas : c’est le danger de ce réglage. Les trous d’air se bouchent aussi de poussière et de graisse.',
        check:
          'La couleur, chaque fois qu’on allume. Si la flamme est jaune, le réglage ou l’état du brûleur est à revoir, fenêtre ouverte.',
        care: 'Nettoyée et réajustée de temps en temps, selon le livre. Ce lab ne donne pas de réglage : il n’en a lu aucun pour ce brûleur.',
      },
      {
        failure:
          'A yellow flame setting in within a closed room, with no particular smell. Carbon monoxide has none: that is the danger of this setting. The air holes also block with dust and grease.',
        check:
          'The colour, at each lighting. If the flame is yellow, the setting or the state of the burner needs seeing to, window open.',
        care: 'Cleaned and reset now and then, by the book. This lab gives no setting: it read none for this burner.',
      },
    ),
    tip: l(
      'Il est sur le corps du brûleur : choisissez-le et faites pivoter la vue pour voir l’ouverture.',
      'It is on the burner’s body: pick it and turn the view to see the opening.',
    ),
    design: l(
      'Une pièce simple, sans laquelle on ne sait pas ce qu’on brûle. Toute la lecture d’une flamme, sur ce livre, tient en couleurs et en formes : petite, trop haute, jaune. Ici, c’est l’œil qui fait ce travail.',
      'A simple part, without which one does not know what is burning. The whole reading of a flame, in the book, is colours and shapes: small, lifting, yellow. The eye does the work here.',
    ),
  },
  {
    id: 'blue-flame',
    scene: 'gas-line',
    category: 'hydraulic',
    name: l('Flamme', 'Blue flame'),
    short: l(
      'Ce pour quoi tout le reste existe : elle se voit mal en plein jour, et sa hauteur ici n’est pas mesurée.',
      'What all the rest is for: it is hard to see in daylight, and its height here is not measured.',
    ),
    description: lf(
      'À 289 L par jour, un kilo de restes donne {minPerKgFood} sur ce brûleur, et un kilo d’épluchures {minPerKgMarket}. Mélangés, 2 kg donnent environ 200 L et 45 minutes : un chiffre calculé par la thèse à partir des deux essais, et un tiers des 2,5 h de cuisson d’un ménage de la ville. Un litre d’eau bout en environ {boilMinutes}, sans autre perte que les 55 % du réchaud. Le biogaz brûle s’il contient plus de 45 % de méthane, d’après la thèse et le livre. Le Low-tech Lab prévient que ces flammes se voient moins que celles du butane et du propane : on se brûle sans les avoir vues. Dans ce monde, la hauteur des langues suit le débit du modèle, et rien de plus : nos sources ne la mesurent pas.',
      'At 289 L a day, a kilo of leftovers gives {minPerKgFood} on this burner, and a kilo of peelings {minPerKgMarket}. Mixed, 2 kg give about 200 L and 45 minutes: a figure worked out by the thesis from the two tests, and a third of the 2.5 h of cooking in a household of the city. A litre of water boils in about {boilMinutes}, with no loss other than the stove’s 55 %. Biogas burns if it holds more than 45 % methane, by the thesis and the book. The Low-tech Lab warns that these flames show less than those of butane and propane: people get burnt without having seen them. In this world the height of the tongues follows the model’s flow, and no more: our sources do not measure it.',
    ),
    material: l('Méthane et air, CO₂ et vapeur en plus', 'Methane and air, with CO₂ and vapour besides'),
    specs: [
      sp('Le jour mélangé', 'The mixed day', l('environ 200 L, 45 min', 'about 200 L, 45 min')),
      sp('Selon le modèle', 'By the model', lf('{mixLitres}, {mixMinutes}', '{mixLitres}, {mixMinutes}')),
      sp('Un kilo de restes', 'A kilo of leftovers', v('{minPerKgFood}')),
      sp('Un kilo d’épluchures', 'A kilo of peelings', v('{minPerKgMarket}')),
      sp('Bouillir un litre', 'Boiling a litre', lf('environ {boilMinutes}', 'about {boilMinutes}')),
      sp('Méthane minimal', 'Least methane', l('plus de 45 %', 'over 45 %')),
    ],
    maintenance: maint(
      {
        failure:
          'Elle meurt sans bruit à faible pression, se soulève quand la pression est trop forte, jaunit faute d’air. Le livre range chaque défaut par sa forme.',
        check:
          'Regarder de biais, à l’ombre, si elle est là : l’étude voisine note qu’une flamme éteinte peut passer inaperçue.',
        care: 'Pas de main au-dessus d’un brûleur qui semble éteint. Pas d’objet qui traîne dessus. Une pièce aérée : la fiche de l’aération dit laquelle.',
      },
      {
        failure:
          'It dies silently at low pressure, lifts when the pressure is too high, yellows for want of air. The book sorts each fault by its shape.',
        check:
          'Look from the side, in the shade, to see if it is there: the neighbouring study notes that a dead flame can go unnoticed.',
        care: 'No hand over a burner that seems out. Nothing left lying on it. An aired room: the vent’s sheet says which.',
      },
    ),
    tip: l(
      'Quand le modèle a éteint le brûleur, il n’y a rien à entourer. Le bouton de cette fiche l’allume, et Isoler la montre seule, éteinte ou non.',
      'When the model has the burner off, there is nothing to outline. The button on this sheet lights it, and Isolate shows it alone, lit or not.',
    ),
    design: lf(
      'Elle ne double pas avec le demi-parpaing : la pression double, le débit fait {orificeRatio} à {flowRatio} selon qu’on suit l’orifice ou la mesure, et aucune de nos sources ne mesure sa hauteur. Une flamme à environ {powerIn} n’est pas celle d’un feu de gaz de ville. Elle peut cuire un plat, s’il ne bout pas longtemps.',
      'It does not double with the half-brick: the pressure doubles, the flow goes up {orificeRatio} to {flowRatio} depending on whether one follows the orifice or the measurement, and none of our sources measured its height. A flame of about {powerIn} is no city-gas ring. It can cook a dish that does not boil for long.',
    ),
  },
  {
    id: 'pot-stand',
    scene: 'gas-line',
    category: 'structure',
    name: l('Support de casserole', 'Pot stand'),
    short: l(
      'Il garde la casserole à la bonne distance de la flamme : ce détail joue sur le rendement.',
      'It keeps the pot at the right distance from the flame: a detail that weighs on the efficiency.',
    ),
    description: lf(
      'L’étude voisine, sur les plus grandes cuves, note deux choses : le rendement s’améliorerait si la casserole et le réchaud s’ajustaient bien, et la distance entre le brûleur et le fond de la casserole compte beaucoup. Le manuel du Guatemala soude un support en fer pour le brûleur. Sur ce petit brûleur, cela veut dire qu’un plat trop petit ou trop haut perd ce qui passe sur le côté, à côté de {powerUseful} de chaleur utile. Le dessin place le support à {standH}, une estimation : aucune source ne le chiffre pour ce brûleur.',
      'The neighbouring study, on the larger tanks, notes two things: efficiency would improve if pot and stove fitted well, and the distance between burner and pot bottom counts for much. The manual from Guatemala welds an iron stand for the burner. On this small burner, that means a pot too small or too high loses what passes down its side, against {powerUseful} of useful heat. The drawing sets the stand at {standH}, an estimate: no source gives a figure for this burner.',
    ),
    material: l('Fer, soudé ou plié', 'Iron, welded or bent'),
    specs: [
      sp('Hauteur dessinée', 'Height drawn', v('{standH}')),
      sp('Chaleur utile', 'Useful heat', v('{powerUseful}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un support de travers ou tordu par la chaleur : la casserole s’écarte de la flamme, et le plat met plus longtemps.',
        check: 'Une casserole stable, bien centrée, à même distance tout autour.',
        care: 'Nettoyé en même temps que le brûleur, car les débordements bouchent les trous juste dessous.',
      },
      {
        failure: 'A stand askew or bent by the heat: the pot moves away from the flame, and the dish takes longer.',
        check: 'A steady pot, well centred, at the same distance all round.',
        care: 'Cleaned along with the burner, as boil-overs block the holes just below.',
      },
    ),
    tip: l(
      'En Éclaté, il se détache de la table avec le brûleur et la casserole : trois pièces et une distance.',
      'In Explode it lifts off the table with the burner and the pot: three parts and one distance.',
    ),
    design: l(
      'Un support ne se calcule pas ici, et c’est ce qui le rend intéressant : le rendement de la cuisine se joue aussi à quelques centimètres d’air.',
      'A stand is not worked out here, which is what makes it interesting: the kitchen’s efficiency also comes down to a few centimetres of air.',
    ),
  },
  {
    id: 'cooking-pot',
    scene: 'gas-line',
    category: 'structure',
    name: l('Casserole', 'Cooking pot'),
    short: l(
      'Là où arrive l’énergie, à 55 % selon le livre : le seul endroit où l’on sait à quoi servent ces chiffres.',
      'Where the energy arrives, at 55 % by the book: the one place where one knows what these figures are for.',
    ),
    description: lf(
      'Les 2 kg du jour mélangé font 45 minutes, sur ce petit brûleur. Avec les 55 % du livre, et sans autre perte, cela porte environ {boilLitres} d’eau à ébullition, ou un plat qui ne bout pas longtemps. La thèse le chiffre autrement : un tiers de la cuisson d’un ménage de la ville, qui cuisine 2,5 h par jour au charbon de bois. Le Low-tech Lab le dit pour son bidon : pas d’autonomie en gaz de cuisson. Et sur les plus grandes cuves, l’étude voisine trouve que le biogaz convient au déjeuner, tandis que le dîner se termine au charbon de bois.',
      'The mixed day’s 2 kg make 45 minutes, on this small burner. At the book’s 55 %, with no other loss, that brings about {boilLitres} of water to the boil, or a dish that does not boil for long. The thesis puts it another way: a third of the cooking of a household of the city, which cooks 2.5 h a day on charcoal. The Low-tech Lab says it of its drum: no autonomy in cooking gas. And on the larger tanks, the neighbouring study finds that biogas suits lunch, while dinner is finished on charcoal.',
    ),
    material: l('Casserole ordinaire', 'An ordinary pot'),
    specs: [
      sp('Rendement du réchaud', 'Stove’s efficiency', '55 %'),
      sp(
        'Le jour mélangé',
        'The mixed day',
        lf('environ {boilLitres} d’eau bouillie', 'about {boilLitres} of water boiled'),
      ),
      sp('Cuisson d’un ménage', 'A household’s cooking', l('2,5 h', '2.5 h')),
    ],
    maintenance: maint(
      {
        failure:
          'Rien à attendre d’une casserole : sauf le gaz qu’elle n’utilise pas, quand elle est trop petite pour la flamme.',
        check: 'Le couvercle : il garde ce que le brûleur a de la peine à donner.',
        care: 'Une façon de cuisiner qui ne fait pas bouillir longtemps. L’étude voisine note que l’eau ne peut pas bouillir longtemps avant d’y mettre les aliments.',
      },
      {
        failure: 'Nothing to expect of a pot: except the gas it does not use, when too small for the flame.',
        check: 'The lid: it keeps what the burner struggles to give.',
        care: 'A way of cooking that does not boil for long. The neighbouring study notes that water cannot be left boiling long before the food goes in.',
      },
    ),
    tip: l(
      'Le curseur de minutes de cuisine, dans la Simulation, tire sur la cloche : voyez combien de temps elle tient.',
      'The slider for minutes of cooking, in the Simulation, draws on the bell: see how long it lasts.',
    ),
    design: lf(
      'Ce lab ne promet pas un dîner. Sur le papier, une cuisine en France demande plus : la seule comparaison qu’on puisse faire ici, ce sont ces {powerUseful} d’utile. Pour remplacer tout le gaz en bouteille que le concepteur annonce, il faudrait environ {lpgFeed} de restes par jour, et non 2.',
      'This lab does not promise a dinner. On paper, a French kitchen asks for more: the one comparison to be made here is this {powerUseful} of useful heat. To replace all the bottled gas the designer announces would take about {lpgFeed} of leftovers a day, not 2.',
    ),
  },
  {
    id: 'vent-opening',
    scene: 'gas-line',
    category: 'structure',
    name: l('Aération', 'Vent opening'),
    short: l(
      'Une ouverture sur le mur de la cuisine : à laisser ouverte pendant la cuisson, et qui ne résout pas tout.',
      'An opening in the kitchen wall: left open while cooking, and it does not settle everything.',
    ),
    description: lf(
      'La thèse demande que le brûleur soit dans une pièce bien aérée. Elle compte sur des maisons ouvertes, qu’une cuisine européenne n’est pas. Ce dessin place donc une aération haute, à {ventHeight}, notre estimation, et elle est utile à une partie du problème : le méthane est plus léger que l’air et monte. Le CO₂ et l’H₂S, eux, sont plus lourds et restent en bas, et le monoxyde de carbone d’une flamme mal réglée se mélange à l’air de la pièce. Une seule ouverture ne règle donc pas les trois. Nous n’avons trouvé aucune taille d’aération dans les sources domestiques : celle-ci n’est qu’une lecture.',
      'The thesis asks for the burner to be in a well-ventilated room. It relies on open houses, which a European kitchen is not. So this drawing sets a vent high up, at {ventHeight}, our estimate, and it helps with part of the problem: methane is lighter than air and rises. CO₂ and H₂S are heavier and stay low, and carbon monoxide from a badly set flame mixes into the room’s air. So one opening does not settle all three. We found no vent size in the household sources: this one is only a reading.',
    ),
    material: l('Grille dans le mur, notre lecture', 'A grille in the wall, our reading'),
    specs: [
      sp('Hauteur dessinée', 'Height drawn', v('{ventHeight}')),
      sp('Taille dans les sources', 'Size in the sources', l('aucune trouvée', 'none found')),
    ],
    maintenance: maint(
      {
        failure:
          'Elle se bouche, ou on la bouche, parce qu’il fait froid. C’est l’hiver, dans une pièce fermée, que cette machine demande le plus d’attention.',
        check: 'Une ouverture libre, et un brûleur qui n’a jamais une flamme jaune.',
        care: 'Laissée ouverte tant que la flamme brûle, ainsi qu’une fenêtre si possible. Aucune aération ne remplace un robinet fermé.',
      },
      {
        failure:
          'It blocks, or gets blocked, because it is cold. In winter, in a closed room, is when this machine asks for the most attention.',
        check: 'A free opening, and a burner never showing a yellow flame.',
        care: 'Left open as long as the flame burns, with a window too if possible. No vent stands in for a closed tap.',
      },
    ),
    tip: l(
      'Elle est haute sur le mur du fond : regardez aussi tout ce qui reste plus bas qu’elle dans la pièce.',
      'It sits high on the back wall: look too at all that stays lower than it in the room.',
    ),
    design: l(
      'Le lab aurait pu dessiner la cuisine ouverte de Dar es Salaam et ne rien dire. Il préfère le mur fermé et l’aération, car c’est le cas du visiteur en Europe, et ce cas-là, aucune source lue ne l’a étudié.',
      'The lab could have drawn the open kitchen of Dar es Salaam and said nothing. It prefers the closed wall and the vent, as that is the European visitor’s case, and no source we read has studied that case.',
    ),
  },
  {
    id: 'gas-detector',
    scene: 'gas-line',
    category: 'electrical',
    name: l('Détecteur', 'Gas detector'),
    short: l(
      'Il avertit, il ne protège pas : aucune installation domestique lue n’en avait, et il vient d’une règle pour d’autres installations.',
      'It warns, it does not protect: no household plant we read had one, and it comes from a rule for other plants.',
    ),
    description: l(
      'Aucune installation domestique de nos sources n’a de détecteur. En France, un texte pour les installations déclarées, pas pour les ménages, demande une alarme à 10 % de la limite inférieure d’explosivité dans les pièces où passent des tuyaux non soudés : c’est de là que vient cette pièce, par analogie. Elle dit deux choses. D’abord, un détecteur a une plage : le capteur de la thèse s’arrêtait à 100 ppm pour l’H₂S et ne disait plus rien au-delà. Ensuite, reste à savoir ce qu’il lit : un détecteur de méthane ne lit ni le CO d’une flamme ni l’H₂S. Le modèle n’en a pas, et ne calcule aucune concentration dans la pièce.',
      'No household plant in our sources has a detector. In France, a text for declared plants, not for households, asks for an alarm at 10 % of the lower explosive limit in rooms with unwelded gas pipes: that is where this part comes from, by analogy. It says two things. First, a detector has a range: the thesis’s sensor stopped at 100 ppm for H₂S and said nothing beyond. Second, one has to know what it reads: a methane detector reads neither the CO of a flame nor the H₂S. The model has none, and works out no concentration in the room.',
    ),
    material: l('Détecteur mural, générique', 'Wall detector, generic'),
    specs: [
      sp('Sur l’installation mesurée', 'On the measured plant', l('absent', 'absent')),
      sp(
        'Règle d’où il vient',
        'Rule it comes from',
        l('installations déclarées, en France', 'declared plants, in France'),
      ),
      sp('Hauteur dessinée', 'Height drawn', v('{detectorHeight}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une pile vide, un capteur périmé, et il ne dit rien ; c’est le cas qui se voit le moins. Et un capteur placé en haut ne lit pas ce qui s’amasse en bas.',
        check: 'Son bouton d’essai, sa date, et à quoi il répond selon sa notice.',
        care: 'Remplacé à la date de son fabricant. Il n’ouvre aucune fenêtre et ne ferme aucun robinet : quand il sonne, le geste reste à faire, et de dehors.',
      },
      {
        failure:
          'A dead battery, an expired sensor, and it says nothing; that case shows least. And a sensor set high does not read what gathers low.',
        check: 'Its test button, its date, and what it answers to by its leaflet.',
        care: 'Replaced at its maker’s date. It opens no window and shuts no tap: when it sounds, the gesture is still to be made, from outside.',
      },
    ),
    tip: l(
      'Il n’est relié à rien, ni au modèle ni au reste : c’est volontaire. Aucune alarme de la Simulation n’en vient.',
      'It is wired to nothing, neither to the model nor to the rest: on purpose. No alarm of the Simulation comes from it.',
    ),
    design: l(
      'Le mettre dans ce dessin revient à poser une question plus qu’à donner une réponse : que devrait-on savoir dans une pièce où entre ce gaz ? Le lab ne conclut pas qu’un détecteur suffit, ni qu’il est obligatoire chez un particulier : il ne le sait pas.',
      'Putting it in this drawing asks a question more than it gives an answer: what should one know in a room this gas enters? The lab does not conclude that a detector is enough, nor that one is required in a home: it does not know.',
    ),
  },
];
