// Assembly guide (20 steps), docs/research.md §0.5 and §4.5: how it goes together, told as a reading of what was built, not as a procedure. Steps 1 to 14 play in `digester`, 15 to 20 in `gas-line`. Every step ends on its origin. No cut line, no torque, no tool list, no duration as an instruction: nothing here is offered to follow, and the first step says so once.
// Every part of those two worlds that shows on its own is put in a step, so that a step shows only what stands by then: the slurry does not hang in the air before its tank, nor the pot over an absent burner. The order departs from research §4.5 in one thing, written down in docs/data.md: the bell comes after the feed line and the overflow, so that the inner pipe is not lowered under it.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

/** The closing words of a step: where it comes from. */
export const ORIGIN = {
  thesis: l('**Origine** : la thèse.', '**Origin**: the thesis.'),
  manual: l('**Origine** : le manuel de construction.', '**Origin**: the build manual.'),
  both: l('**Origine** : la thèse et le manuel de construction.', '**Origin**: the thesis and the build manual.'),
  reading: l('**Origine** : notre lecture.', '**Origin**: our reading.'),
  book: l('**Origine** : le livre de référence.', '**Origin**: the reference book.'),
  tutorial: l('**Origine** : le tutoriel du Low-tech Lab.', '**Origin**: the Low-tech Lab’s tutorial.'),
} as const;

export const withOrigin = (t: L, o: L): L => l(`${t.fr} ${o.fr}`, `${t.en} ${o.en}`);

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'pallet',
    scene: 'digester',
    title: l('La palette', 'The pallet'),
    text: withOrigin(
      lf(
        'Ceci est une lecture de travaux publiés, pour apprendre : ce n’est pas un plan à suivre, et cela ne prouve rien sur la sécurité. Aucune cote de découpe ici, aucun couple de serrage. À Dar es Salaam, le 30 juillet 2008, un technicien a posé une **palette** en bois en plein soleil, sur un lieu d’où trois arbres avaient été retirés. Elle portera environ {plantMass}.',
        'This is a reading of published work, for learning: it is not a plan to follow, and it proves nothing about safety. No cut line here, no torque. At Dar es Salaam, on 30 July 2008, a technician set a wooden **pallet** in full sun, at a spot from which three trees had been removed. It would carry about {plantMass}.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['pallet'],
  },
  {
    id: 'tank',
    scene: 'digester',
    title: l('La grande cuve', 'The large tank'),
    text: withOrigin(
      l(
        'Une **cuve** à eau de 1 000 L, Ø1,04 m, 1,25 m de haut. Son dessus a été retiré pour laisser passer l’autre cuve. Le manuel de construction prend sa mesure sur la petite cuve elle-même, posée dessus à l’envers. Le jeu qui reste entre elles permet de flotter, et c’est aussi par là que le gaz se perd.',
        'A 1,000 L water **tank**, Ø1.04 m, 1.25 m high. Its top was taken off to let the other tank through. The build manual takes its measure from the small tank itself, set upside down on top of it. The clearance left between them lets it float, and that is also where the gas is lost.',
      ),
      ORIGIN.both,
    ),
    parts: ['digester-tank'],
  },
  {
    id: 'connector',
    scene: 'digester',
    title: l('La traversée de paroi', 'The wall fitting'),
    text: withOrigin(
      l(
        'Deux manchons de 3 pouces, de part et d’autre de la paroi : la **traversée** de l’alimentation. C’est le raccord qui porte toute la colonne. Le manuel y met deux rondelles de caoutchouc et une plus épaisse de chaque côté, et de la silicone entre elles et le trou. C’est la seule vraie difficulté de plomberie de la machine.',
        'Two 3-inch sockets, one each side of the wall: the feed’s **fitting**. This joint bears the whole column. The manual gives it two rubber washers and a thicker one on each side, with silicone between them and the hole. It is the one true plumbing difficulty of the machine.',
      ),
      ORIGIN.both,
    ),
    parts: ['tank-connector'],
  },
  {
    id: 'inner-pipe',
    scene: 'digester',
    title: l('Le tube intérieur', 'The inner pipe'),
    text: withOrigin(
      lf(
        'Le **tube intérieur** prolonge cette traversée sur 0,51 m, presque jusqu’à l’axe : c’est là, dans les boues, que la nourriture arrive. Ce dessin ajoute une selle sous son extrémité, parce qu’il doit être porté par quelque chose : aucune source ne la montre. Son axe, à {feedAxis} du fond, est calculé pour que la cloche au repos s’y pose d’un côté.',
        'The **inner pipe** carries on from this fitting for 0.51 m, almost to the axis: that is where the food arrives, in the sludge. This drawing adds a saddle under its end, because it has to be carried by something: no source shows one. Its axis, {feedAxis} above the floor, is worked out so that the bell at rest comes down on it on one side.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['inner-feed-pipe'],
  },
  {
    id: 'tee-plug',
    scene: 'digester',
    title: l('Le té et son bouchon', 'The tee and its plug'),
    text: withOrigin(
      l(
        'À l’extérieur, un **té** de 3 pouces reçoit tout ce qui descend de la colonne. Sa troisième branche sert au jour où l’entrée se bouche, la panne la plus fréquente de l’enquête : le manuel y met un **bouchon** vissé, pour déboucher le tube ou vidanger le digesteur, et l’installation de la thèse y avait une vanne de 2 pouces.',
        'Outside, a 3-inch **tee** takes all that comes down the riser. Its third branch is for the day the inlet blocks, the survey’s commonest fault: the manual fits a screwed **plug** there, for clearing the pipe or draining the digester, and the thesis’s plant had a 2-inch valve in its place.',
      ),
      ORIGIN.both,
    ),
    parts: ['feed-tee', 'clean-out-plug'],
    warning: l(
      'L’ouvrir libère d’un coup ce que la colonne pousse : de la bouillie, des germes et du gaz dissous, à hauteur de genou.',
      'Opening it lets go at once what the riser is pushing: slurry, germs and dissolved gas, at knee height.',
    ),
  },
  {
    id: 'riser',
    scene: 'digester',
    title: l('La colonne', 'The riser'),
    text: withOrigin(
      lf(
        'La **colonne** de 3 pouces monte le long de la cuve : 1,80 m de tube pour toute l’alimentation. Ce dessin la tient par une patte sur la cuve, parce qu’un tube debout doit être tenu : aucune source ne la montre. Sa place, à {riserX} de l’axe, est la nôtre.',
        'The 3-inch **riser** climbs beside the tank: 1.80 m of pipe for the whole feed line. This drawing holds it with a bracket on the tank, because a standing pipe has to be held: no source shows one. Its place, {riserX} from the axis, is ours.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['feed-riser'],
  },
  {
    id: 'funnel',
    scene: 'digester',
    title: l('L’entonnoir', 'The funnel'),
    text: withOrigin(
      l(
        'En haut, à 1,18 m du fond, l’**entonnoir**. À Dar es Salaam, c’était une bouteille d’eau coupée sur un bout de tuyau ; dans le manuel, de la tôle de récupération rivetée. La thèse demande aussi de garder l’entrée couverte : des escargots géants, attirés par l’humidité, ont bouché des entrées.',
        'At the top, 1.18 m above the floor, the **funnel**. At Dar es Salaam it was a cut-up water bottle on a piece of pipe; in the manual, riveted scrap sheet metal. The thesis also asks for the inlet to be kept covered: giant snails, drawn by the damp, have blocked inlets.',
      ),
      ORIGIN.both,
    ),
    parts: ['feed-funnel'],
  },
  {
    id: 'overflow',
    scene: 'digester',
    title: l('Le trop-plein', 'The overflow'),
    text: withOrigin(
      l(
        'Le **trop-plein** de 2 pouces traverse la paroi à 1,04 m : il fixe le niveau de toute la cuve. Puis un coude, et une descente vers le seau. Le manuel prévient qu’à l’intérieur, son raccord doit être assez court pour que la cloche puisse passer.',
        'The 2-inch **overflow** crosses the wall at 1.04 m: it fixes the level of the whole tank. Then an elbow, and a drop to the bucket. The manual warns that, inside, its fitting has to be short enough for the bell to pass.',
      ),
      ORIGIN.both,
    ),
    parts: ['overflow-pipe'],
  },
  {
    id: 'valve',
    scene: 'digester',
    title: l('La vanne de fond', 'The bottom valve'),
    text: withOrigin(
      l(
        'Sur l’installation de recherche seulement, une **vanne** de 2 pouces au pied de la cuve, et un petit robinet de ½ pouce à 0,62 m, pour prélever à deux hauteurs. Un ménage n’a ni l’une ni l’autre. Beaucoup des chiffres de ce lab sont passés par elles.',
        'On the research plant only, a 2-inch **valve** at the tank’s foot, and a small ½-inch tap at 0.62 m, for sampling at two heights. A household has neither. Many of this lab’s figures came through them.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['bottom-valve'],
  },
  {
    id: 'level',
    scene: 'digester',
    title: l('Le niveau qu’elle tiendra', 'The level it will hold'),
    text: withOrigin(
      l(
        'Le remplissage appartient au guide d’installation. Ce guide montre seulement ce que la plomberie prépare : les **boues** au fond, le **liquide clair**, la **croûte** en haut, environ 850 L jusqu’au trop-plein. Les trois couches sont celles que la thèse a mesurées, et aucune source ne décrit l’ordre où ces étapes se sont faites.',
        'The filling belongs to the installation guide. This guide only shows what the plumbing prepares: the **sludge** at the bottom, the **clear liquor**, the **scum** on top, about 850 L up to the overflow. The three layers are those the thesis measured, and no source describes the order in which these steps were done.',
      ),
      ORIGIN.reading,
    ),
    parts: ['sludge-bed', 'clear-liquor', 'scum-layer'],
  },
  {
    id: 'bell',
    scene: 'digester',
    title: l('La cloche', 'The bell'),
    text: withOrigin(
      l(
        'Une cuve de 750 L, retournée et descendue dans la première : la **cloche**, et sous elle le **volume de gaz**. Rien ne la tient : elle flotte. Il reste l’**anneau ouvert**, 22 % de la surface, par où une part du gaz s’en va, et par où passera le trop de gaz. Au premier gaz, elle contient encore de l’air, et le guide d’installation y revient.',
        'A 750 L tank, turned over and lowered into the first: the **bell**, and under it the **gas space**. Nothing holds it: it floats. That leaves the **open rim**, 22 % of the surface, where part of the gas leaves, and where any excess will pass. At first gas it still holds air, and the installation guide comes back to that.',
      ),
      ORIGIN.both,
    ),
    parts: ['gas-bell', 'gas-space', 'rim-gap'],
  },
  {
    id: 'tap',
    scene: 'digester',
    title: l('Le robinet de gaz', 'The gas tap'),
    text: withOrigin(
      l(
        'Sur le dessus de la cloche, un raccord de ¾ de pouce, une réduction, une douille, un coude et un **robinet** de ½ pouce. La thèse conseille du ruban plutôt que de la colle : ce qui casse se dévisse, et ne coûte pas la cloche.',
        'On top of the bell, a ¾-inch connector, a bush, a nipple, an elbow and a ½-inch **tap**. The thesis advises tape rather than glue: what breaks can be unscrewed, and does not cost the bell.',
      ),
      ORIGIN.both,
    ),
    parts: ['gas-tap'],
  },
  {
    id: 'scale',
    scene: 'digester',
    title: l('Les graduations', 'The scale'),
    text: withOrigin(
      l(
        'À l’usage, pas avant : la thèse a laissé monter la cloche à fond, relâché le gaz par 20 L à travers un compteur, et tracé à chaque fois un trait blanc juste au-dessus de la bouillie. Les **graduations** valent 17,25 cm pour 100 L. Le **demi-parpaing** attend à côté de la palette, de quoi charger la cloche si la flamme paraît faible.',
        'In use, not before: the thesis let the bell climb to the top, released the gas 20 L at a time through a meter, and drew each time a white line just above the slurry. The **marks** come to 17.25 cm per 100 L. The **half-brick** waits beside the pallet, to load the bell if the flame seems weak.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['scale-marks', 'half-brick'],
  },
  {
    id: 'limiter',
    scene: 'digester',
    title: l('Le limiteur de course', 'The float limiter'),
    text: withOrigin(
      lf(
        'Pas sur l’installation mesurée. Le manuel de construction du Guatemala ajoute deux U renversés en tube de 1 pouce, croisés au-dessus de la cloche, sur une ceinture de fer : le **limiteur**. Il est dessiné ici à l’échelle de cette cuve, {limiterAcross} de large, et sans effet sur le modèle.',
        'Not on the measured plant. The build manual from Guatemala adds two inverted U’s of 1-inch pipe, crossed over the bell, on an iron belt: the **limiter**. It is drawn here to this tank’s scale, {limiterAcross} wide, and has no effect on the model.',
      ),
      ORIGIN.manual,
    ),
    parts: ['float-limiter'],
  },
  {
    id: 'hose',
    scene: 'gas-line',
    title: l('Le tuyau souple', 'The flexible hose'),
    text: withOrigin(
      l(
        'Du robinet part le **tuyau** de ½ pouce, 5 m en tout : il plie avec la cloche, puis descend vers un point bas. Chaque raccord a un collier, selon le Low-tech Lab. C’est le dernier élément de l’installation mesurée avant le réchaud : ce qui suit dans ce guide n’y était pas, sauf là où c’est dit.',
        'From the tap runs the ½-inch **hose**, 5 m in all: it flexes with the bell, then falls towards a low point. Each joint has a clamp, by the Low-tech Lab. It is the last item of the measured plant before the stove: what follows in this guide was not there, except where that is said.',
      ),
      ORIGIN.thesis,
    ),
    parts: ['bell-hose'],
  },
  {
    id: 'trap',
    scene: 'gas-line',
    title: l('Le piège à condensats', 'The condensate trap'),
    text: withOrigin(
      l(
        'Au point bas, un **piège** recueille l’eau que le gaz laisse en refroidissant. Il n’était pas sur l’installation mesurée, et la thèse le demande après coup, car de l’eau dans le tuyau a arrêté de vraies installations. Le pot dessiné est générique. Le livre en donne deux formes, et aucune taille.',
        'At the low point a **trap** collects the water the gas leaves as it cools. It was not on the measured plant, and the thesis asks for it afterwards, as water in the hose stopped real plants. The jar drawn is generic. The book gives two forms of it, and no size.',
      ),
      ORIGIN.book,
    ),
    parts: ['condensate-trap'],
  },
  {
    id: 'relief',
    scene: 'gas-line',
    title: l('La soupape hydraulique', 'The hydraulic relief'),
    text: withOrigin(
      lf(
        'Une bouteille d’eau et un tube plongeur : une **soupape**, montrée pour comprendre. Sa profondeur, {reliefDepth}, est notre estimation. Elle n’était pas sur l’installation mesurée, et le modèle n’en a pas : là-bas, la soupape était le bord de la cloche.',
        'A water bottle and a dip tube: a **relief**, shown for understanding. Its depth, {reliefDepth}, is our estimate. It was not on the measured plant, and the model has none: there, the relief was the bell’s rim.',
      ),
      ORIGIN.reading,
    ),
    parts: ['hydraulic-relief'],
  },
  {
    id: 'filter-arrester',
    scene: 'gas-line',
    title: l('Le filtre et l’arrête-flamme', 'The filter and the arrester'),
    text: withOrigin(
      l(
        'Deux boîtiers sur la planche, tirés du tutoriel du Low-tech Lab : le **filtre**, sur de la paille de fer ou de l’argile, et l’**arrête-flamme**, une boule de paille non tassée. La thèse a essayé un petit piège à soufre sans pouvoir le mesurer. Aucun de ces deux n’était sur l’installation mesurée, et nous n’avons lu aucun essai de leur efficacité à ces débits.',
        'Two housings on the board, drawn from the Low-tech Lab’s tutorial: the **filter**, on iron wool or clay, and the **arrester**, a ball of wool not packed tight. The thesis tried a small sulphur trap and could not measure it. Neither was on the measured plant, and we read no test of how well they work at these flows.',
      ),
      ORIGIN.tutorial,
    ),
    parts: ['h2s-filter', 'flame-arrester'],
    warning: l(
      'Ce qu’un filtre retient, il le rend à l’ouverture. L’hydrogène sulfuré cesse de se sentir vers 100 ppm et il tue vers 500 ppm : l’odeur n’est pas une alarme.',
      'What a filter holds it gives back on opening. Hydrogen sulphide stops being smelt at about 100 ppm and it kills at about 500 ppm: the smell is no alarm.',
    ),
  },
  {
    id: 'kitchen',
    scene: 'gas-line',
    title: l('Le manomètre, le mur, la vanne', 'The gauge, the wall, the valve'),
    text: withOrigin(
      l(
        'Un **manomètre** de 0 à 60 mbar, sur l’installation de recherche seulement. Le **fourreau** passe le mur de la cuisine, un détail sans source : à partir de lui, ce gaz est dans une pièce fermée. Puis une **vanne** d’un demi-pouce, à portée de main, à fermer dès que la flamme manque.',
        'A **gauge** from 0 to 60 mbar, on the research plant only. The **sleeve** takes the line through the kitchen wall, a detail with no source: from there on, this gas is in a closed room. Then a half-inch **valve**, within reach, to be closed as soon as the flame is missing.',
      ),
      ORIGIN.both,
    ),
    parts: ['pressure-gauge', 'wall-sleeve', 'kitchen-valve'],
  },
  {
    id: 'burner',
    scene: 'gas-line',
    title: l('Le brûleur et sa flamme', 'The burner and its flame'),
    text: withOrigin(
      lf(
        'Le **brûleur** vendu avec l’installation, sa **virole d’air**, son **support**, une **casserole**, et enfin la **flamme** : environ {powerIn} en entrée à 2 mbar. Elle se voit mal en plein jour. Une flamme jaune et longue dit que l’air manque, et qu’il y a du monoxyde de carbone dans la pièce. En Tanzanie, la pose faisait partie de la vente, en 3,5 h, par un technicien : ce guide ne le remplace pas.',
        'The **burner** sold with the plant, its **air sleeve**, its **stand**, a **pot**, and at last the **flame**: about {powerIn} going in at 2 mbar. It is hard to see in daylight. A long yellow flame says air is short, and that there is carbon monoxide in the room. In Tanzania installation came with the sale, in 3.5 h, by a technician: this guide does not stand in for one.',
      ),
      ORIGIN.both,
    ),
    parts: ['biogas-burner', 'primary-air-sleeve', 'pot-stand', 'cooking-pot', 'blue-flame'],
  },
];
