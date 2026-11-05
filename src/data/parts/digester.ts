// Parts of the `digester` world (20): the machine in section, the same one as the yard's. Sizes come from the thesis's figure and parts list; what no source gives is marked, and what the drawing needs and no source shows (the saddle, the bracket, the limiter) says so.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const DIGESTER_PARTS: PartInfo[] = [
  {
    id: 'digester-tank',
    scene: 'digester',
    category: 'structure',
    name: l('Cuve', 'Digester tank'),
    short: l(
      'Une cuve à eau de 1 000 L dont on a retiré le dessus : tout ce qui vit ici vit sans air.',
      'A 1,000 L water tank with its top taken off: everything that lives here lives without air.',
    ),
    description: lf(
      'Une cuve à eau ordinaire en polyéthylène haute densité, de Ø1,04 m et 1,25 m de haut, rayon intérieur 51,5 cm. Les deux chiffres, imprimés dans la même thèse, donnent une paroi de {tankWall}. Son dessus est retiré pour laisser passer la cloche. Le trop-plein à 1,04 m fixe le niveau : environ 850 L de bouillie, {litresGeometry} d’après la seule géométrie. Noire, elle prend le soleil par tout son flanc, et c’est lui qui la tient au-dessus de la température de l’air. Rien ne l’agite : ce qui entre se range en couches, ce que la thèse a mesuré.',
      'An ordinary high-density polyethylene water tank, Ø1.04 m and 1.25 m high, with an inner radius of 51.5 cm. The two figures, printed in the same thesis, give a wall of {tankWall}. Its top is taken off to let the bell through. The overflow at 1.04 m sets the level: about 850 L of slurry, {litresGeometry} by the geometry alone. Black, it takes the sun along its whole side, and that is what holds it above the air’s temperature. Nothing stirs it: what comes in settles into layers, as the thesis measured.',
    ),
    material: l('PEHD noir, cuve à eau du commerce', 'Black HDPE, a commercial water tank'),
    specs: [
      sp('Volume nominal', 'Nominal volume', l('1 000 L', '1,000 L')),
      sp('Ø × hauteur', 'Ø × height', l('1,04 × 1,25 m', '1.04 × 1.25 m')),
      sp('Rayon intérieur', 'Inner radius', l('51,5 cm', '51.5 cm')),
      sp('Paroi', 'Wall', v('{tankWall}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite à une traversée de paroi plutôt qu’à la cuve elle-même, et un niveau qui baisse sans qu’aucun repas ne manque. Sur les installations visitées, ce sont l’entrée et le robinet qui ont lâché, pas la cuve.',
        check:
          'Le pied de la cuve, sec. Le trop-plein qui coule après chaque repas : c’est lui qui dit que le niveau tient.',
        care: 'Personne ne descend dans cette cuve, jamais, ni dans une fosse de ce genre, même vidée : le méthane et le CO₂ y prennent la place de l’oxygène. Ces accidents font souvent plusieurs victimes, car ceux qui descendent au secours de la première sont pris à leur tour.',
      },
      {
        failure:
          'A leak at a wall fitting rather than in the tank itself, and a level falling though no feed was missed. On the plants visited it was the inlet and the tap that gave way, not the tank.',
        check: 'A dry foot to the tank. The overflow running after each feed: that is what says the level holds.',
        care: 'Nobody goes down into this tank, ever, nor into a pit of the kind, even emptied: methane and CO₂ take the oxygen’s place. Such accidents often claim several people, as those who go down to help the first are overcome in turn.',
      },
    ),
    tip: l(
      'Ce monde s’ouvre coupé : la moitié de la cuve qui manque n’est là que pour regarder dedans. Avec Isoler ou Transparence, elle revient entière.',
      'This world opens cut: the half of the tank that is missing is gone only so that you can look inside. With Isolate or X-ray it comes back whole.',
    ),
    design: lf(
      'Sa taille décide de tout le reste. 850 L pour 20 L par jour font 42,5 jours dans la cuve pour le liquide, et les solides, qui se déposent ou flottent, y restent bien plus longtemps. Ses cerclages moulés sont un dessin : aucune source ne les décrit, ni leur hauteur.',
      'Its size decides all the rest. 850 L at 20 L a day make 42.5 days in the tank for the liquid, and the solids, which settle or float, stay far longer. Its moulded hoops are a drawing: no source describes them, nor their height.',
    ),
  },
  {
    id: 'gas-bell',
    scene: 'digester',
    category: 'mechanical',
    name: l('Cloche', 'Gas bell'),
    short: l(
      'Une cuve de 750 L retournée, qui flotte sur la bouillie et monte quand le gaz s’accumule : le réservoir et le régulateur à la fois.',
      'A 750 L tank turned upside down, floating on the slurry and rising as gas gathers: the store and the regulator in one.',
    ),
    description: lf(
      'Elle fait de Ø0,90 m et 1,30 m de haut. La liste de pièces de la thèse écrit l’inverse, mais une cuve de 1,30 m de large n’entrerait pas dans la première, et son dessin coté tranche. Le gaz la soulève : 17,25 cm pour 100 L, à peu près {dayRise} par jour à 289 L. Elle n’exerce pas une pression fixe. Sa paroi qui plonge est portée par la bouillie, et ressort à mesure qu’elle monte : le modèle trouve {pressureRest} au repos, {pressureMid} à mi-course et {pressureFull} en haut, pour une lecture de 2 mbar sur le manomètre. Sa masse, personne ne la publie : {bellMass} pour une paroi de {bellWall}.',
      'It is Ø0.90 m and 1.30 m high. The thesis’s parts list writes these the other way round, but a tank 1.30 m wide would not enter the first one, and its dimensioned drawing settles it. The gas lifts it: 17.25 cm per 100 L, about {dayRise} a day at 289 L. Its pressure is not fixed. The wall that dips is carried by the slurry, and comes out as it rises: the model finds {pressureRest} at rest, {pressureMid} at mid-travel and {pressureFull} at the top, against a reading of 2 mbar on the gauge. Nobody publishes its mass: {bellMass} for a wall of {bellWall}.',
    ),
    material: l('PEHD noir, cuve à eau du commerce', 'Black HDPE, a commercial water tank'),
    specs: [
      sp('Volume nominal', 'Nominal volume', '750 L'),
      sp('Ø × hauteur', 'Ø × height', l('0,90 × 1,30 m', '0.90 × 1.30 m')),
      sp('Rayon qui compte pour le gaz', 'Radius that counts for the gas', l('0,43 m', '0.43 m')),
      sp('Course mesurée', 'Measured travel', l('0,69 m pour 400 L', '0.69 m for 400 L')),
      sp('Masse', 'Mass', v('{bellMass}')),
      sp('Inclinaison dessinée', 'Tilt drawn', lf('{tiltRest} à {tiltFull}', '{tiltRest} to {tiltFull}')),
    ],
    maintenance: maint(
      {
        failure:
          'Elle penche, comme sur les photos, et peut frotter sur la cuve. Un raccord collé qui casse sur la cloche peut coûter la cloche entière : la thèse conseille du ruban, pour dévisser ce qui lâche plutôt que de le remplacer avec elle.',
        check:
          'Elle doit monter et redescendre chaque jour, sans à-coups. Une cloche qui ne monte plus avec des repas normaux : une fuite, un robinet ouvert, ou une cuve qui s’est arrêtée.',
        care: 'Rien à graisser ni à régler. On ne s’y appuie pas et on n’y approche pas de flamme : elle contient le gaz, et parfois de l’air avec lui.',
      },
      {
        failure:
          'It leans, as in the photographs, and can rub on the tank. A glued fitting that breaks on the bell can cost the whole bell: the thesis advises tape, so that what fails can be unscrewed rather than replaced along with it.',
        check:
          'It should rise and fall every day, without jerks. A bell that no longer rises on normal feeds: a leak, an open tap, or a tank that has stopped.',
        care: 'Nothing to grease or set. Nobody leans on it, and no flame comes near it: it holds the gas, and sometimes air along with it.',
      },
    ),
    tip: l(
      'À l’horloge d’ouverture, une heure par seconde, elle monte à vue d’œil, et descend à chaque repas. Sa vraie vitesse est bien trop lente pour se voir.',
      'At the opening clock, an hour a second, it plainly climbs, and comes down at each meal. Its true speed is far too slow to see.',
    ),
    design: lf(
      'Une cloche flottante fait deux choses sans mécanisme : elle dit combien il reste, et elle met le gaz sous pression. Sa limite est dans ses proportions : elle est plus haute (1,30 m) que le liquide n’est profond (1,04 m). Posée, il reste environ {trappedL} sous elle, que rien ne peut tirer. La taille suivante, plus courte, peut couler entièrement.',
      'A floating bell does two things with no mechanism: it shows how much is left, and it puts the gas under pressure. Its limit lies in its proportions: it is taller (1.30 m) than the liquid is deep (1.04 m). Once resting, about {trappedL} stay under it, which nothing can draw. The next size up, shorter, can sink all the way.',
    ),
  },
  {
    id: 'gas-space',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Volume de gaz', 'Gas space'),
    short: l(
      'La réserve elle-même : jusqu’à 400 L utilisables entre la bouillie et le haut de la cloche.',
      'The store itself: up to 400 L usable between the slurry and the top of the bell.',
    ),
    description: lf(
      'La thèse a gradué sa cloche en relâchant le gaz jusqu’à la vider : 400 L, sur 0,69 m de course. Il en reste davantage dessous : environ {trappedL} quand la cloche est posée, car son sommet reste au-dessus de la bouillie. La surface intérieure n’est pas à la même hauteur que l’anneau : le gaz la pousse vers le bas, de {innerDrop} à 2 mbar, et elle reste horizontale même quand la cloche penche. Ce gaz porte environ 56,8 % de méthane sur des restes, et de la vapeur, de 2 % à 20 °C à 7 % à 40 °C. Son H₂S reste inconnu : le capteur de la thèse s’arrêtait à 100 ppm, et il plafonnait.',
      'The thesis marked its bell by letting gas out until it was empty: 400 L, over 0.69 m of travel. More stays underneath: about {trappedL} when the bell is resting, as its top stands above the slurry. The surface inside is not at the same height as the ring: the gas pushes it down, by {innerDrop} at 2 mbar, and it stays level even when the bell leans. This gas holds about 56.8 % methane on leftovers, and vapour, from 2 % at 20 °C to 7 % at 40 °C. Its H₂S stays unknown: the thesis’s sensor stopped at 100 ppm, and it was at its ceiling.',
    ),
    material: l('Biogaz : méthane, CO₂, vapeur, H₂S', 'Biogas: methane, CO₂, vapour, H₂S'),
    specs: [
      sp('Utilisable', 'Usable', '400 L'),
      sp('Reste quand elle est posée', 'Left when resting', lf('environ {trappedL}', 'about {trappedL}')),
      sp(
        'Méthane, restes et épluchures',
        'Methane, leftovers and peelings',
        l('56,8 % et 66,4 %', '56.8 % and 66.4 %'),
      ),
      sp('Pression lue', 'Pressure read', '2 mbar'),
    ],
    maintenance: maint(
      {
        failure:
          'De l’air dans la cloche, quand on la remplit ou qu’on ouvre la cuve. Le méthane dans l’air explose entre 5 et 15 %. Pour un biogaz à 50 % de méthane, dans de l’air saturé, un essai a mesuré 10 à 24 %, et d’autres sources citent 6 à 12 %. Aucune de ces plages n’est une limite sur laquelle compter.',
        check:
          'Le premier gaz n’est pas brûlé : il porte l’air de la mise en route. La thèse l’a relâché pendant dix jours.',
        care: 'Pas de flamme près d’une cuve qu’on vide, qu’on ouvre ou qu’on nettoie : c’est à ce moment que l’air y entre, comme le note le guide français des installations agricoles.',
      },
      {
        failure:
          'Air in the bell, on filling or when the tank is opened. Methane in air explodes between 5 and 15 %. For a biogas at 50 % methane, in saturated air, one test measured 10 to 24 %, and other sources quote 6 to 12 %. None of these ranges is a line to rely on.',
        check: 'The first gas is not burnt: it carries the air of the start-up. The thesis let it go for ten days.',
        care: 'No flame near a tank being emptied, opened or cleaned: that is when air gets in, as the French guide for farm plants notes.',
      },
    ),
    tip: l(
      'Regardez sa surface basse : elle reste plane quand la cloche penche. Et comparez sa hauteur à celle de l’anneau, juste à côté.',
      'Look at its lower surface: it stays flat when the bell leans. And compare its height with the ring’s, right beside it.',
    ),
    design: lf(
      'Sur le brûleur mesuré, 400 L ne durent qu’une heure et demie : {bellMinutes} à {flow2}. Rien n’est conçu pour garder le gaz longtemps. Il sert le soir ce qui a été fait le jour.',
      'On the measured burner, 400 L last only about an hour and a half: {bellMinutes} at {flow2}. Nothing here is designed to keep gas for long. It serves in the evening what was made in the day.',
    ),
  },
  {
    id: 'rim-gap',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Anneau ouvert', 'Open rim'),
    short: l(
      'L’espace entre cloche et cuve : le gaz qui monte ici s’en va sans brûler, et c’est aussi la seule soupape.',
      'The space between bell and tank: gas rising here leaves unburnt, and it is also the only relief.',
    ),
    description: lf(
      'La bouillie y est à l’air libre : 0,83 m² de surface, dont la cloche couvre environ 0,65 m². Il reste 22 % d’ouvert, par l’aire. Ce n’est pas une mesure de gaz : c’est une surface, et le modèle la prend pour la part de bulles qui manque la cloche, avec un curseur de 0 à 30 %. Sur des installations plus grandes de même conception, une autre étude a mesuré environ 17,5 % de la production perdus. Sans anneau, le modèle passerait de {gasSteady} à {gasNoRim} par jour. Quand la cloche est au bout de sa course, c’est aussi par là que le trop de gaz ressort. Dans un climat chaud, cet anneau accueille aussi des larves.',
      'The slurry stands open to the air here: 0.83 m² of surface, of which the bell covers about 0.65 m². That leaves 22 % open, by area. It is no measurement of gas: it is a surface, and the model takes it as the share of bubbles that misses the bell, with a slider from 0 to 30 %. On larger plants of the same design, another study measured about 17.5 % of the production lost. With no ring, the model would go from {gasSteady} to {gasNoRim} a day. When the bell is at the end of its travel, that is also where the extra gas comes out. In a warm climate this ring also takes in larvae.',
    ),
    material: l('Rien : un anneau de bouillie à l’air', 'Nothing: a ring of slurry in the air'),
    specs: [
      sp('Part de la surface', 'Share of the surface', '22 %'),
      sp('Mesuré sur de plus grandes', 'Measured on larger ones', l('environ 17,5 %', 'about 17.5 %')),
      sp('Curseur du modèle', 'The model’s slider', l('de 0 à 30 %', 'from 0 to 30 %')),
    ],
    maintenance: maint(
      {
        failure:
          'Des larves dans l’eau immobile : la thèse a surtout trouvé des mouches de drain, et des Culex parmi elles, pas d’Anopheles. Et une fuite qui ne s’arrête jamais : ce qu’il perd, il le perd tous les jours, sans alarme.',
        check: 'Un coup d’œil sur l’anneau : des bulles au repos, des larves en surface.',
        care: 'La thèse conseille de remuer la surface de l’anneau chaque semaine avec un bâton, ce qui gêne la respiration des larves. La fuite, elle, ne se soigne qu’en changeant de conception.',
      },
      {
        failure:
          'Larvae in the still water: the thesis mostly found drain flies, with some Culex among them, and no Anopheles. And a leak that never stops: what it loses, it loses every day, with no alarm.',
        check: 'A glance at the ring: bubbles at rest, larvae on the surface.',
        care: 'The thesis advises stirring the ring’s surface weekly with a stick, which hinders the larvae’s breathing. The leak, for its part, is only cured by changing the design.',
      },
    ),
    tip: l(
      'Un clic sur cet anneau ouvre tout seul la coupe à la hauteur du trop-plein : il apparaît en plan, vu d’en haut. Activez Flux : la vue revient à la coupe en long, et les points gris sont le gaz perdu, en proportion du modèle.',
      'A click on this ring opens the section at the overflow’s height by itself: it shows in plan, from above. Switch on Flows: the view goes back to the cut along the axis, and the grey dots are the gas lost, in the model’s proportion.',
    ),
    design: lf(
      'Le défaut et la soupape sont le même trou. D’autres cloches flottent sur une couronne d’eau séparée, ce qui arrête cette fuite, et la thèse propose aussi deux cuves mieux ajustées. Le climat le voit : à environ {rimBreakEven} de perte, le méthane perdu pèse autant que le gaz en bouteille remplacé, sous des conditions que la leçon 7 détaille.',
      'The flaw and the relief are the same gap. Other bells float on a separate ring of water, which stops this leak, and the thesis also proposes two better-fitting tanks. The climate sees it: at about {rimBreakEven} lost, the methane leaked weighs as much as the bottled gas replaced, under conditions that lesson 7 sets out.',
    ),
  },
  {
    id: 'scale-marks',
    scene: 'digester',
    category: 'mechanical',
    name: l('Graduations', 'Scale marks'),
    short: l(
      'Des traits sur la cloche, tous les 20 L, lus contre le bord de la cuve : un compteur qui ne coûte presque rien.',
      'Lines on the bell, every 20 L, read against the tank’s rim: a gas meter that costs next to nothing.',
    ),
    description: lf(
      'Aucun compteur n’a convenu : un compteur à gaz demandait un débit que cette cuve n’atteint pas, et les autres méthodes changeaient la pression. La thèse a donc retourné le problème : elle a laissé monter la cloche à fond, relâché 20 L à travers un compteur, tracé un trait blanc au correcteur juste au-dessus de la bouillie, et recommencé jusqu’à la vider. Résultat : 400 L sur 0,69 m, 17,25 cm pour 100 L, soit {stepCm} par pas de 20 L. Puis elle a noté le niveau matin et après-midi, chaque jour. Tous les chiffres de gaz de ce lab passent par ces traits.',
      'No meter would do: a gas meter asked for a flow this tank does not reach, and the other methods changed the pressure. So the thesis turned the problem round: it let the bell climb to the top, released 20 L through a meter, drew a white line in correction fluid just above the slurry, and repeated until the bell was empty. The result: 400 L over 0.69 m, 17.25 cm per 100 L, or {stepCm} per step of 20 L. Then it read the level morning and afternoon, every day. Every gas figure in this lab goes through these lines.',
    ),
    material: l('Traits de correcteur blanc, sur le PEHD', 'Lines of white correction fluid, on the HDPE'),
    specs: [
      sp('Pas', 'Step', '20 L'),
      sp('Pour 100 L', 'Per 100 L', l('17,25 cm', '17.25 cm')),
      sp('Pour un pas', 'Per step', v('{stepCm}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des traits qui s’effacent au soleil, et une cloche qui penche : lue d’un seul côté, l’échelle ment un peu.',
        check:
          'Les traits restent-ils lisibles ? Une cloche pleine au même trait que la veille, à même repas, dit que la cuve va bien.',
        care: 'Repasser les traits de temps en temps. Lire au même endroit, à la même heure, avant le repas, comme la thèse le faisait.',
      },
      {
        failure: 'Lines fading in the sun, and a leaning bell: read from one side only, the scale lies a little.',
        check:
          'Are the lines still legible? A full bell at the same line as yesterday, on the same feed, says the tank is well.',
        care: 'Redraw the lines now and then. Read at the same place, at the same hour, before the feed, as the thesis did.',
      },
    ),
    tip: lf(
      'L’échelle est sur le dos de la cloche : la fiche la cadre de biais. Un pas fait {stepCm}, moins de dix pixels depuis la vue d’ensemble.',
      'The scale is on the back of the bell: the sheet frames it at a slant. A step is {stepCm}, under ten pixels from the overview.',
    ),
    design: lf(
      'Un trait tous les 20 L, c’est de la mesure de gaz sans aucun instrument en ligne. Le calcul donne {markCalc} pour 100 L, à partir du rayon de 0,43 m : la lecture et la géométrie s’accordent à un millimètre près.',
      'A line every 20 L is gas measurement with no instrument in the line. The sum gives {markCalc} per 100 L, from the radius of 0.43 m: the reading and the geometry agree to within a millimetre.',
    ),
  },
  {
    id: 'half-brick',
    scene: 'digester',
    category: 'mechanical',
    name: l('Demi-parpaing', 'Half brick'),
    short: l(
      'Environ 12 kg posés sur la cloche : la pression double, et le gaz part plus vite.',
      'About 12 kg laid on the bell: the pressure doubles, and the gas leaves faster.',
    ),
    description: lf(
      'À Dar es Salaam, des clients se plaignaient d’une flamme faible, et l’installateur leur conseillait un demi-parpaing. La thèse l’a testé. Douze kilos sur 0,581 m² font {brickMbar} : son manomètre passe de 2 à 4 mbar, exactement ce que dit l’arithmétique. C’est le chiffre le plus net de ce lab. Le débit, lui, ne suit pas si simplement : 100 L brûlent en 12,1 min au lieu de 22,3 min, soit {flowRatio}, là où un orifice donne {orificeRatio} et où le modèle ne fait pas mieux. Nous n’avons trouvé aucune explication. Le manomètre, gradué jusqu’à 60 mbar, lit peut-être trop grossièrement ces petites pressions.',
      'At Dar es Salaam customers complained of a weak flame, and the installer told them to use half a brick. The thesis tested it. Twelve kilos on 0.581 m² make {brickMbar}: its gauge goes from 2 to 4 mbar, just what the arithmetic says. It is the cleanest figure in this lab. The flow does not follow so simply: 100 L burn in 12.1 min instead of 22.3 min, or {flowRatio}, where an orifice gives {orificeRatio} and the model does no better. We found no explanation. The gauge, marked up to 60 mbar, may read such small pressures too coarsely.',
    ),
    material: l('Parpaing de ciment, coupé en deux', 'Cement block, cut in half'),
    specs: [
      sp('Masse', 'Mass', l('environ 12 kg', 'about 12 kg')),
      sp('Pression ajoutée', 'Pressure added', v('{brickMbar}')),
      sp('Pour 100 L', 'For 100 L', l('12,1 min au lieu de 22,3 min', '12.1 min instead of 22.3 min')),
      sp('Puissance en entrée', 'Power going in', lf('{powerIn} puis {powerBrick}', '{powerIn} then {powerBrick}')),
      sp('Forme dessinée', 'Shape drawn', v('{brickSize}')),
    ],
    maintenance: maint(
      {
        failure:
          'Il glisse d’une cloche qui penche. Et il gaspille à sa façon : le gaz part plus vite, et la cloche pleine laisse moins d’heures de cuisson, même si la thèse note que le plat cuit plus vite.',
        check: 'Il doit rester à plat au milieu de la cloche, sans gêner le robinet ni le limiteur.',
        care: 'Rien : on le pose ou on le retire. La flamme change de hauteur, et le modèle ne la mesure pas ; elle ne double pas pour autant.',
      },
      {
        failure:
          'It slides off a leaning bell. And it wastes in its own way: gas leaves faster, and a full bell gives fewer hours of cooking, though the thesis notes the dish cooks faster.',
        check: 'It should lie flat in the middle of the bell, clear of the tap and the limiter.',
        care: 'Nothing: it is laid on or taken off. The flame changes height, which the model does not measure; it does not double for all that.',
      },
    ),
    tip: l(
      'Il attend sur la dalle à côté de la palette. Lancez « Le demi-parpaing » ou poussez le curseur de poids : il va se poser sur la cloche.',
      'It waits on the pad beside the pallet. Run “The half-brick” or move the weight slider: it goes and lies on the bell.',
    ),
    design: lf(
      'La cloche seule ne donne que peu de pression : son poids utile, {weightFor2} pour 2 mbar, tient dans une valise. Un parpaing est à portée de main, et il agit sur la pression sans toucher à rien d’autre. Sa taille est notre lecture : 12 kg sont rapportés, la forme non.',
      'The bell alone gives little pressure: its useful weight, {weightFor2} for 2 mbar, would fit in a suitcase. A block is easy to come by, and it acts on the pressure without touching anything else. Its shape is our reading: the 12 kg are reported, the shape is not.',
    ),
  },
  {
    id: 'feed-funnel',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Entonnoir', 'Feed funnel'),
    short: l(
      'La bouche de la cuve, en haut à 1,18 m : sur l’installation mesurée, une bouteille d’eau coupée.',
      'The tank’s mouth, its top at 1.18 m: on the measured plant, a cut-up water bottle.',
    ),
    description: lf(
      'À Dar es Salaam, l’entonnoir était une bouteille d’eau coupée, montée sur un bout de tuyau. Le manuel de construction du Guatemala en roule un dans une feuille de métal de récupération, rivetée. Peu importe sa matière : son bord, à 1,18 m du fond de la cuve, doit rester au-dessus du niveau du tube pour qu’un seau de 10 L y passe sans déborder. La thèse note un autre usager : des escargots géants, attirés par l’humidité, qui bouchent l’entrée. Elle demande donc de la garder couverte. Le rayon dessiné, {funnelR}, est une estimation.',
      'At Dar es Salaam the funnel was a cut-up water bottle, on a piece of pipe. The build manual from Guatemala rolls one out of a sheet of scrap metal, riveted. Its material hardly matters: its lip, 1.18 m above the tank’s floor, has to stay above the level in the pipe so that a 10 L bucket goes in without spilling. The thesis notes another user: giant snails, drawn by the damp, that block the inlet. So it asks for the inlet to be kept covered. The radius drawn, {funnelR}, is an estimate.',
    ),
    material: l('Bouteille coupée, ou tôle de récupération', 'A cut-up bottle, or scrap sheet metal'),
    specs: [
      sp('Haut au-dessus du fond', 'Top above the floor', l('1,18 m', '1.18 m')),
      sp('Rayon dessiné', 'Radius drawn', v('{funnelR}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une entrée bouchée est la panne la plus fréquente de l’enquête : matière mal coupée ou mal diluée, escargots.',
        check: 'Le niveau dans le tube descend-il après un repas ? Sinon, le passage est pris plus bas.',
        care: 'Toujours couverte entre deux repas. Bien diluée dans le seau avant de verser : c’est le geste que la thèse a ajouté pour éviter de boucher.',
      },
      {
        failure: 'A blocked inlet is the survey’s commonest failure: matter badly chopped or badly diluted, snails.',
        check: 'Does the level in the pipe fall after a feed? If not, the way is blocked lower down.',
        care: 'Kept covered between feeds. Well diluted in the bucket before pouring: that is the gesture the thesis added to prevent blocking.',
      },
    ),
    tip: l(
      'Une pièce d’usage plus que de dessin : ce monde la montre neuve, là où celle de la thèse était une bouteille.',
      'A part of use more than of design: this world shows it new, where the thesis’s was a bottle.',
    ),
    design: l(
      'Le tube de 3 pouces ne suffit pas pour verser proprement : tout est là. Ce qui compte n’est pas l’entonnoir, c’est qu’il reste au-dessus du niveau, quelle que soit la hauteur de la cloche.',
      'The 3-inch pipe alone is too narrow to pour cleanly: that is all there is to it. What counts is not the funnel, but that it stays above the level, whatever the bell’s height.',
    ),
  },
  {
    id: 'feed-riser',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Colonne d’alimentation', 'Feed riser'),
    short: l(
      'Le tube de 3 pouces entre l’entonnoir et le té : la bouillie y monte au même niveau que dans l’anneau.',
      'The 3-inch pipe between funnel and tee: the slurry stands in it at the same level as in the ring.',
    ),
    description: lf(
      'La liste de la thèse donne 1,80 m de tube de 3 pouces pour toute l’alimentation. La colonne et l’anneau sont tous deux à l’air libre et se rejoignent sous le bord de la cloche : ils se tiennent au même niveau, celui du trop-plein. Le dessin de la thèse imprime 1,06 m ici et 1,04 m au trop-plein, et on a pu y lire une pression. Lu de près, ce sont les deux bases de cotes d’un même niveau : c’est la surface sous la cloche que le gaz abaisse, pas celle-ci. Sa place et son support sont les nôtres : le dessin ajoute une patte sur la cuve, parce qu’un tube doit être tenu, et aucune source ne la montre.',
      'The thesis’s list gives 1.80 m of 3-inch pipe for the whole feed line. The riser and the ring are both open to the air and join below the bell’s rim: they stand level, at the overflow’s height. The thesis’s drawing prints 1.06 m here and 1.04 m at the overflow, and one could read a pressure into that. Read closely, they are one level from two bases: it is the surface under the bell that the gas pushes down, not this one. Its place and its support are ours: the drawing adds a bracket on the tank, because a pipe has to be held, and no source shows one.',
    ),
    material: l('Tube de 3 pouces, PVC', '3-inch pipe, PVC'),
    specs: [
      sp('Tube, ligne entière', 'Pipe, the whole line', l('3 pouces, 1,80 m', '3 inches, 1.80 m')),
      sp('Niveau imprimé sur le dessin', 'Level printed on the drawing', l('1,06 m', '1.06 m')),
      sp('Écart à l’axe, dessiné', 'Off the axis, as drawn', v('{riserX}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un tube cassé est une panne relevée sur plusieurs installations ; l’une d’elles a été renversée par des chiens. Le tube monte, il dépasse, il est exposé.',
        check: 'Une vérification à vue de la patte et du té, et de la colonne bien d’aplomb.',
        care: 'Rincé en versant de l’effluent, comme la thèse le faisait deux ou trois fois après chaque repas.',
      },
      {
        failure:
          'A broken pipe is a fault noted on several plants; one was knocked down by dogs. The pipe stands proud and exposed.',
        check: 'A look at the bracket and the tee, and at whether the riser stands plumb.',
        care: 'Rinsed by pouring effluent through it, as the thesis did two or three times after each feed.',
      },
    ),
    tip: l(
      'Comparez trois surfaces dans ce monde : la colonne et l’anneau sont à la même hauteur, et le dessous de la cloche, un peu plus bas.',
      'Compare three surfaces in this world: the riser and the ring stand at one height, and the surface under the bell a little lower.',
    ),
    design: l(
      'Une entrée sans vanne ni clapet : c’est le niveau, qui suit le trop-plein, qui ferme la cuve. Le gaz ne peut pas sortir par là tant que l’extrémité du tube reste sous la bouillie.',
      'An inlet with no valve or flap: the level, which follows the overflow, is what closes the tank. Gas cannot leave this way as long as the end of the pipe stays under the slurry.',
    ),
  },
  {
    id: 'feed-tee',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Té d’alimentation', 'Feed tee'),
    short: l(
      'Le raccord qui joint la colonne, le tube intérieur et le bouchon de curage.',
      'The fitting that joins the riser, the inner pipe and the clean-out plug.',
    ),
    description: lf(
      'Un té de 3 pouces, à l’extérieur de la cuve, au ras de son pied : son axe est à {feedAxis} au-dessus du fond. Il change de direction ce qui descend de la colonne, et c’est là qu’un bouchon se forme s’il doit se former. C’est aussi pour cela qu’il a un troisième côté : on peut y atteindre le tube sans démonter le reste. L’installateur tanzanien a essayé un coude de grand rayon à sa place, pour moins boucher ; la thèse préfère garder le té et y mettre une vanne, comme sur son installation. La hauteur de l’axe est dérivée de la cloche au repos, qui vient s’appuyer sur le tube intérieur.',
      'A 3-inch tee, outside the tank, right at its foot: its axis stands {feedAxis} above the floor. It turns what comes down the riser, and that is where a plug forms if one is to form. It is also why it has a third side: the pipe can be reached there without taking the rest apart. The Tanzanian installer tried a swept elbow in its place, to block less; the thesis prefers to keep the tee and fit a valve to it, as on its own plant. The axis’s height is derived from the bell at rest, which comes to lean on the inner pipe.',
    ),
    material: l('Té de 3 pouces, PVC', '3-inch PVC tee'),
    specs: [
      sp('Taille', 'Size', l('3 pouces', '3 inches')),
      sp('Axe au-dessus du fond', 'Axis above the floor', v('{feedAxis}')),
    ],
    maintenance: maint(
      {
        failure: 'Un bouchon dans la branche basse, surtout avec des fibres ou de la matière mal diluée.',
        check: 'Un repas qui descend lentement. Une colonne qui reste pleine.',
        care: 'On l’atteint par le bouchon de curage, et sa fiche dit ce que ce geste libère.',
      },
      {
        failure: 'A plug in the low branch, above all with fibre or badly diluted matter.',
        check: 'A feed that goes down slowly. A riser that stays full.',
        care: 'It is reached through the clean-out plug, and that sheet says what the gesture lets out.',
      },
    ),
    tip: l(
      'Avec l’Éclaté, la ligne d’alimentation se détache étage par étage : le té y montre ses trois branches.',
      'With Explode, the feed line comes apart stage by stage: the tee shows its three branches there.',
    ),
    design: l(
      'Une pièce de plombier, utilisée telle quelle. Aucune n’a été conçue pour un digesteur : c’est tout l’intérêt, et toute la limite. Le passage de 3 pouces commande la taille des morceaux, sous 1 cm.',
      'A plumber’s fitting, used as it comes. None was designed for a digester: that is the whole point, and the whole limit. The 3-inch way dictates the size of the pieces, under 1 cm.',
    ),
  },
  {
    id: 'clean-out-plug',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Bouchon de curage', 'Clean-out plug'),
    short: l(
      'Un bouchon sur le troisième côté du té, pour déboucher l’entrée ou vidanger la cuve.',
      'A plug on the tee’s third side, for clearing the inlet or draining the tank.',
    ),
    description: lf(
      'L’installation mesurée avait une vanne de 2 pouces sur ce côté, car une entrée bouchée est une panne fréquente et que la thèse a voulu pouvoir la traiter. Le manuel de construction du Guatemala y met simplement un bouchon vissé, avec ce commentaire : il sert à déboucher le tube, ou à vider le digesteur s’il le faut. Ce dessin suit le manuel. Sa longueur, {plugLength}, est la nôtre. Ce bouchon est au pied d’une colonne de plus d’un mètre de bouillie.',
      'The measured plant had a 2-inch valve on this side, since a blocked inlet is a frequent fault and the thesis wanted a way of dealing with it. The build manual from Guatemala simply fits a screwed cap there, with this remark: it is for clearing the pipe, or draining the digester if need be. This drawing follows the manual. Its length, {plugLength}, is ours. This plug sits at the foot of more than a metre of slurry.',
    ),
    material: l('Bouchon fileté, PVC, ruban PTFE', 'Threaded PVC cap, PTFE tape'),
    specs: [
      sp('Vu sur', 'Seen on', l('le manuel de construction', 'the build manual')),
      sp('Sur l’installation mesurée', 'On the measured plant', l('une vanne de 2 pouces', 'a 2-inch valve')),
      sp('Longueur dessinée', 'Length drawn', v('{plugLength}')),
    ],
    maintenance: maint(
      {
        failure: 'Un filet mal étanché qui suinte, ou un bouchon que rien ne permet de rouvrir après des mois.',
        check:
          'Pas de trace humide autour du raccord. Une bouillie qui s’écoule ici porte des germes et du gaz dissous.',
        care: 'Rouvrir ce bouchon libère d’un coup ce que la colonne pousse, à hauteur de genou. Un dégagement à l’air, loin de toute flamme, et personne dans une fosse pour le faire.',
      },
      {
        failure: 'A badly sealed thread that weeps, or a plug that cannot be opened after months.',
        check: 'No damp around the joint. Slurry running out here carries germs and dissolved gas.',
        care: 'Opening this plug lets go at once what the riser is pushing, at knee height. In open air, far from any flame, and nobody down in a pit to do it.',
      },
    ),
    tip: l(
      'Le manuel du Guatemala et la thèse ne font pas la même chose ici : ce dessin montre le bouchon, et la vanne de la thèse a sa propre fiche.',
      'The manual from Guatemala and the thesis do not do the same here: this drawing shows the plug, and the thesis’s valve has its own sheet.',
    ),
    design: l(
      'Quand 8 installations sur 12 sont à l’arrêt et que le tube bouché est parmi les causes, une entrée qu’on peut atteindre n’est plus un détail. Ce bouchon ne coûte presque rien, et c’est lui qui évite de tout démonter.',
      'When 8 plants out of 12 are stopped and a blocked pipe is among the causes, an inlet that can be reached is no longer a detail. This plug costs next to nothing, and it is what saves taking everything apart.',
    ),
  },
  {
    id: 'inner-feed-pipe',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Tube intérieur', 'Inner feed pipe'),
    short: l(
      'Il livre la nourriture bas dans la cuve, 0,51 m à l’intérieur, et la cloche au repos vient s’y appuyer.',
      'It delivers the food low in the tank, 0.51 m in, and the bell at rest comes to lean on it.',
    ),
    description: lf(
      'La nourriture arrive au fond et loin du bord : 0,51 m à l’intérieur, presque sur l’axe, à {feedAxis} du sol. Elle tombe donc dans les boues, là où vivent le plus d’organismes. C’est aussi là que la cuve devient acide d’abord : en début de suivi, la thèse a lu un pH de 6,2 en haut, et de 4,5 à 6,8 en bas. Le modèle n’a qu’un seul volume, et ne voit pas cet écart. Le dessin ajoute une selle sous l’extrémité du tube, parce qu’il doit être porté : aucune source ne la montre, et la hauteur du tube est calculée pour que le côté haut de la cloche au repos s’y pose.',
      'The food arrives low and far from the side: 0.51 m in, almost on the axis, {feedAxis} above the floor. So it falls into the sludge, where most of the organisms live. That is also where the tank turns sour first: early in the monitoring, the thesis read a pH of 6.2 at the top, and from 4.5 to 6.8 at the bottom. The model has a single volume, and cannot see that gap. The drawing adds a saddle under the pipe’s far end, because it has to be carried: no source shows one, and the pipe’s height is worked out so that the bell’s high side rests on it.',
    ),
    material: l('Tube de 3 pouces, PVC', '3-inch PVC pipe'),
    specs: [
      sp('Portée dans la cuve', 'Reach inside the tank', l('0,51 m', '0.51 m')),
      sp('Axe au-dessus du fond', 'Axis above the floor', v('{feedAxis}')),
      sp('Selle', 'Saddle', l('dessinée, sans source', 'drawn, with no source')),
    ],
    maintenance: maint(
      {
        failure:
          'Il se bouche, le plus souvent faute d’avoir assez coupé ou dilué : c’est ce que la thèse a vu sur le terrain. Les boues peuvent aussi finir par l’enfouir, et son suivi de quatre mois ne dit pas en combien de temps.',
        check: 'Il ne se voit plus une fois la cuve remplie. On le juge par la vitesse à laquelle un repas descend.',
        care: 'Rien, sinon ne pas y envoyer ce qui ne passera pas. Le rinçage à l’effluent de la thèse le visait aussi.',
      },
      {
        failure:
          'It blocks, most often from too little chopping or dilution: that is what the thesis saw in the field. The sludge may also come to bury it, and four months of monitoring cannot say how soon.',
        check: 'It cannot be seen once the tank is full. It is judged by how fast a feed goes down.',
        care: 'Nothing, except not sending in what will not pass. The thesis’s rinsing with effluent was aimed at it as well.',
      },
    ),
    tip: l(
      'Il se voit dans la coupe d’ouverture, et la cloche penche vers lui. Faites descendre la cloche : c’est lui qui l’arrête d’un côté.',
      'It shows in the opening section, and the bell leans towards it. Bring the bell down: this is what stops it on one side.',
    ),
    design: l(
      'Livrer bas plutôt qu’en surface : c’est ce qui met la nourriture au contact des boues et l’éloigne du trop-plein, à l’autre bout de la cuve, pour qu’elle n’en ressorte pas aussitôt.',
      'Delivering low rather than at the surface: that is what puts the food in touch with the sludge and sends it away from the overflow, at the far end of the tank, so that it does not leave at once.',
    ),
  },
  {
    id: 'tank-connector',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Traversée de paroi', 'Tank connector'),
    short: l(
      'Là où l’alimentation traverse la paroi, sous le niveau : le joint qui doit tenir toujours.',
      'Where the feed passes through the wall, below the level: the joint that must always hold.',
    ),
    description: l(
      'Sur la liste de la thèse, deux manchons de 3 pouces, mâle et femelle, de chaque côté de la paroi. Le manuel du Guatemala détaille le joint, car c’est le seul endroit où toute la colonne de bouillie appuie sur un raccord : deux rondelles de caoutchouc et une plus épaisse de chaque côté de la paroi, de la silicone entre les rondelles et le trou, du ruban PTFE sur les filets. Il dit aussi que ce joint doit être étanche, et que le trop-plein, plus haut, demande moins. Ce sont des pièces de plombier ordinaires, et aucune n’a été conçue pour une paroi souple.',
      'On the thesis’s list, two 3-inch sockets, male and female, either side of the wall. The manual from Guatemala details the joint, since this is the one place where the whole column of slurry bears on a fitting: two rubber washers and a thicker one on each side of the wall, silicone between the washers and the hole, PTFE tape on the threads. It also says this joint must be watertight, and that the overflow, higher up, asks less. These are ordinary plumber’s parts, none of them designed for a flexible wall.',
    ),
    material: l('Manchons PVC, rondelles de caoutchouc, silicone', 'PVC sockets, rubber washers, silicone'),
    specs: [
      sp('Taille', 'Size', l('3 pouces', '3 inches')),
      sp('Rondelles, par côté', 'Washers, each side', l('2, plus 1 plus épaisse', '2, plus 1 thicker')),
    ],
    maintenance: maint(
      {
        failure: 'Le suintement : une paroi souple travaille, avec le poids et la température, et le joint vieillit.',
        check: 'Une trace sous le raccord, une odeur. Le niveau qui baisse sans repas manqué.',
        care: 'Une fuite ici ne se répare pas cuve pleine. Ce qui est fait à la pose doit donc tenir : y revenir ensuite, c’est vider l’installation.',
      },
      {
        failure: 'Weeping: a flexible wall moves, with the weight and the temperature, and the joint ages.',
        check: 'A mark under the fitting, a smell. A level that falls with no feed missed.',
        care: 'A leak here is not mended with the tank full. So what is done at the start has to last: coming back to it later means emptying the plant.',
      },
    ),
    tip: l(
      'Il se voit des deux côtés de la paroi dans la coupe : une seule pièce visible, un seul joint qui compte.',
      'It shows on both sides of the wall in the section: one part to see, one joint that counts.',
    ),
    design: l(
      'Faire traverser un tube dans une paroi de plastique souple : tout le reste de la machine est simple, et celle-ci est la seule vraie difficulté de plomberie. On ne donne ici ni la taille des trous ni l’ordre de serrage : ce lab explique, il ne fait pas monter.',
      'Taking a pipe through a soft plastic wall: all the rest of the machine is simple, and this is the one true difficulty in the plumbing. No hole size or tightening order is given here: this lab explains, it does not walk you through a build.',
    ),
  },
  {
    id: 'overflow-pipe',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Trop-plein', 'Overflow pipe'),
    short: l(
      'Un tube de 2 pouces, dont le bas fixe le niveau de toute la cuve à 1,04 m.',
      'A 2-inch pipe whose lower edge fixes the level of the whole tank at 1.04 m.',
    ),
    description: lf(
      'Tout ce qui entre pousse la même quantité dehors : c’est lui qui règle le niveau, pas une vanne. Son fil d’eau à 1,04 m du fond fixe la bouillie, donc la profondeur où flotte la cloche. La liste de la thèse donne 1,00 m de tube de 2 pouces, avec un coude ; son dessin montre 0,74 m à côté du trop-plein, que nous lisons comme la descente vers le seau, ce qui laisse {overflowRun} horizontal, un calcul. Il prend le liquide clair, pas les boues : c’est pourquoi les solides restent bien plus longtemps que l’eau. Le manuel du Guatemala rappelle qu’à l’intérieur de la cuve, son raccord doit laisser passer la cloche.',
      'All that goes in pushes as much out: this sets the level, not a valve. Its invert, 1.04 m above the floor, fixes the slurry, and so the depth the bell floats in. The thesis’s list gives 1.00 m of 2-inch pipe, with an elbow; its drawing shows 0.74 m beside the overflow, which we read as the drop to the bucket, leaving {overflowRun} horizontal, by arithmetic. It takes the clear liquid, not the sludge: that is why solids stay far longer than water. The manual from Guatemala reminds that, inside the tank, its fitting must leave room for the bell to pass.',
    ),
    material: l('Tube de 2 pouces et coude, PVC', '2-inch pipe and elbow, PVC'),
    specs: [
      sp('Niveau fixé', 'Level set', l('1,04 m', '1.04 m')),
      sp('Tube', 'Pipe', l('2 pouces, 1,00 m', '2 inches, 1.00 m')),
      sp('Descente, lue sur le dessin', 'Drop, read off the drawing', l('0,74 m', '0.74 m')),
    ],
    maintenance: maint(
      {
        failure: 'Il se bouche de croûte : le niveau monte alors dans la cuve, et plus rien ne sort au repas suivant.',
        check: 'Le seau reçoit-il environ 10 L après chaque repas ?',
        care: 'Rincé à l’occasion. Il n’est jamais conduit vers un égout ou un cours d’eau : la fiche du seau dit où va ce qui en sort.',
      },
      {
        failure: 'It blocks with crust: the level then rises in the tank, and nothing comes out at the next feed.',
        check: 'Does the bucket get about 10 L after each feed?',
        care: 'Rinsed now and then. It is never led into a drain or a watercourse: the bucket’s sheet says where its contents go.',
      },
    ),
    tip: l(
      'Le plan de l’outil Coupe, dans ce monde, passe à sa hauteur : c’est lui qui décide où la vue se tranche.',
      'The plane of the Section tool, in this world, passes at its height: it decides where the view is cut.',
    ),
    design: l(
      'Une pente vers la sortie et rien d’autre : c’est le seul régulateur de niveau de la machine, et il ne peut pas s’user. Ce qu’il ne règle pas, c’est ce qui passe avec le liquide : la thèse y a mesuré nettement moins de solides que dans la cuve.',
      'A fall towards the outlet and nothing else: this is the machine’s only level regulator, and it cannot wear out. What it does not set is what leaves with the liquid: the thesis measured clearly fewer solids there than in the tank.',
    ),
  },
  {
    id: 'gas-tap',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Robinet de gaz', 'Gas tap'),
    short: l(
      'Un robinet d’un demi-pouce sur le dessus de la cloche, qui monte et descend avec elle.',
      'A half-inch tap on top of the bell, rising and falling with it.',
    ),
    description: lf(
      'Sur la liste de la thèse : un raccord de ¾ de pouce, une réduction, une douille, un coude et un robinet de ½ pouce, de quoi sortir de la cloche. Le manuel du Guatemala choisit l’ouverture d’origine de la petite cuve : à l’envers, elle se retrouve un peu sous le sommet, et un petit volume reste au-dessus d’elle sans pouvoir sortir. Un trou au milieu du fond ferait mieux, mais il faudrait un joint de plus. Le robinet doit monter avec la cloche, d’où le tuyau souple. Un robinet cassé a mis à l’arrêt une installation de l’enquête. Sa place sur la cloche, ici, est notre estimation.',
      'On the thesis’s list: a ¾-inch connector, a bush, a nipple, an elbow and a ½-inch cock, all that it takes to get out of the bell. The manual from Guatemala uses the small tank’s original opening: turned upside down, it comes a little below the top, and a small volume stays above it with no way out. A hole in the middle of the closed end would do better, but it means one joint more. The tap has to rise with the bell, hence the flexible hose. A broken tap stopped one plant in the survey. Its place on the bell, here, is our estimate.',
    ),
    material: l('Robinet ½ pouce, raccords, ruban', '½-inch cock, fittings, tape'),
    specs: [
      sp('Robinet', 'Cock', l('½ pouce', '½ inch')),
      sp('Raccord sur la cloche', 'Connector on the bell', l('¾ de pouce', '¾ inch')),
      sp('Écart à l’axe, dessiné', 'Off the axis, as drawn', v('{tapOffset}')),
    ],
    maintenance: maint(
      {
        failure:
          'Il casse d’un choc ou à force de tirer sur le tuyau. Collé, il peut coûter toute la cloche : la thèse préfère du ruban d’étanchéité, pour pouvoir dévisser.',
        check: 'L’eau savonneuse sur le raccord, la cloche pleine. Il doit s’ouvrir et se fermer sans forcer.',
        care: 'Fermé quand la flamme est éteinte : à faible débit, une étude voisine juge probable que des flammes se soient éteintes sans que personne le remarque.',
      },
      {
        failure:
          'It breaks from a knock, or from the hose pulling on it. Glued, it can cost the whole bell: the thesis prefers sealing tape, so that it can be unscrewed.',
        check: 'Soapy water on the joint, with the bell full. It should open and close without force.',
        care: 'Shut when the flame is out: at low flow, a neighbouring study finds it likely that flames went out with nobody noticing.',
      },
    ),
    tip: l(
      'Le bouton de cette fiche suit le gaz : il ouvre le monde de la ligne, du tuyau jusqu’à la casserole.',
      'The button on this sheet follows the gas: it opens the line’s world, from the hose to the pot.',
    ),
    design: l(
      'Un seul robinet, et c’est toute la commande de la machine. Aucune régulation, aucun capteur : la thèse nomme ce que cela suppose, une personne qui comprend ce qu’elle voit.',
      'One tap, and that is the machine’s whole control. No regulator, no sensor: the thesis names what that takes, a person who understands what she sees.',
    ),
  },
  {
    id: 'bottom-valve',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Vanne de fond', 'Bottom valve'),
    short: l(
      'Une vanne de 2 pouces au bas de la cuve, de l’installation de recherche seulement : elle servait à échantillonner.',
      'A 2-inch valve at the foot of the tank, on the research plant only: it was there for sampling.',
    ),
    description: lf(
      'Elle n’est pas sur la liste d’un ménage. Pour suivre ce qui se passe dans une cuve non brassée, la thèse a prélevé à trois hauteurs, avant chaque repas : par cette vanne en bas, par un petit robinet de ½ pouce à 0,62 m, sur le flanc de la cuve, et avec l’électrode en surface. C’est ce qui lui a permis de voir un pH plus bas au fond. On garde la vanne dans le dessin parce que beaucoup de chiffres de ce lab en viennent. Sa hauteur, {valveHeight}, est notre estimation, comme la place des deux sur le dos de la cuve, où ils se voient au-delà de la coupe.',
      'It is not on a household’s list. To follow what goes on in an unstirred tank, the thesis sampled at three heights, before each feed: through this valve at the bottom, through a small ½-inch tap at 0.62 m on the tank’s side, and with the electrode at the surface. That is how it saw a lower pH at the bottom. The valve stays in the drawing because many of this lab’s figures come from it. Its height, {valveHeight}, is our estimate, as is the place of both on the back of the tank, where they show past the section.',
    ),
    material: l('Vanne à boisseau de 2 pouces', '2-inch ball valve'),
    specs: [
      sp('Vanne', 'Valve', l('2 pouces, installation de recherche', '2 inches, research plant')),
      sp('Robinet d’échantillon', 'Sampling tap', l('½ pouce, à 0,62 m', '½ inch, at 0.62 m')),
      sp('Hauteur dessinée', 'Height drawn', v('{valveHeight}')),
    ],
    maintenance: maint(
      {
        failure: 'Une vanne qui suinte au pied d’une colonne pleine, ou qui s’encrasse de boues.',
        check: 'La goutte au pied de la vanne, et une manœuvre de temps en temps pour qu’elle ne grippe pas.',
        care: 'Ce qui en sort vient du fond, là où les solides restent le plus longtemps : germes, et gaz dissous. Pas de prélèvement avec une flamme à côté.',
      },
      {
        failure: 'A valve weeping at the foot of a full column, or fouled with sludge.',
        check: 'A drip at its foot, and working it now and then so that it does not seize.',
        care: 'What comes out comes from the bottom, where solids stay longest: germs, and dissolved gas. No sampling with a flame nearby.',
      },
    ),
    tip: l(
      'Faites tourner la vue vers le dos de la cuve : la vanne et le petit robinet y sont, l’un au-dessus de l’autre.',
      'Turn the view to the back of the tank: the valve and the small tap are there, one above the other.',
    ),
    design: l(
      'La thèse conseille ensuite de mettre une telle vanne non pas ici, mais sur le té de l’alimentation : une pièce d’étude peut donc devenir une pièce d’entretien, à un autre endroit.',
      'The thesis then advises fitting such a valve not here, but on the feed’s tee: a part made for study can become a part for upkeep, in another place.',
    ),
  },
  {
    id: 'pallet',
    scene: 'digester',
    category: 'structure',
    name: l('Palette', 'Pallet'),
    short: l(
      'Une palette en bois sous la cuve, comme à Dar es Salaam : pas de quoi la lever beaucoup, mais de quoi la poser.',
      'A wooden pallet under the tank, as at Dar es Salaam: little height, but somewhere to stand.',
    ),
    description: lf(
      'Reprise telle quelle de la thèse : la cuve y était posée sur une palette en bois. Sa taille n’est pas donnée : {palletSize}, celle d’une palette courante. Elle porte environ {plantMass}, mais répartis sur toute la surface. Avec elle, le haut de la cloche pleine arrive à {topOnPallet} du sol, pour {topAtFull} au-dessus du fond de la cuve : le dessin retrouve à peu près les 2,5 m annoncés pour l’installation. Elle n’isole pas vraiment : du bois sous un plastique de {tankWall}, le modèle ne la compte pas.',
      'Taken as it is from the thesis: the tank stood there on a wooden pallet. Its size is not given: {palletSize}, that of a usual pallet. It carries about {plantMass}, but spread over its whole surface. With it, the top of the full bell stands {topOnPallet} above the ground, {topAtFull} above the tank’s floor: the drawing comes near the 2.5 m announced for the plant. It hardly insulates: wood under {tankWall} of plastic, which the model does not count.',
    ),
    material: l('Bois, palette du commerce', 'Wood, a commercial pallet'),
    specs: [
      sp('Dessinée', 'As drawn', v('{palletSize}')),
      sp('Charge', 'Load', lf('environ {plantMass}', 'about {plantMass}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le bois pourrit sous un sol humide, et ce qu’on déverse près de lui l’y aide. Une planche qui cède fait pencher toute la machine.',
        check: 'Les planches du bord, et l’aplomb de la cuve.',
        care: 'La thèse ne dit pas combien de temps une palette a tenu. Quatre mois ne le disent pas. On la change avec la cuve vide, ce qui n’est pas un petit travail.',
      },
      {
        failure:
          'Wood rots on damp ground, and what gets spilt near it helps. A plank giving way tilts the whole machine.',
        check: 'The edge planks, and whether the tank stands plumb.',
        care: 'The thesis does not say how long a pallet lasted. Four months cannot tell. It is changed with the tank empty, which is no small job.',
      },
    ),
    tip: l(
      'En Éclaté, la palette reste en place et la cuve s’en détache : c’est le point fixe de ce monde.',
      'In Explode, the pallet stays put and the tank lifts off it: it is this world’s fixed point.',
    ),
    design: l(
      'Rien n’a été calculé ici. Une palette est disponible, et elle garde le fond de la cuve hors de l’eau de pluie. Le lab garde cette modestie : un dessin plus savant mentirait sur la machine.',
      'Nothing was calculated here. A pallet is to hand, and it keeps the tank’s floor out of the rainwater. The lab keeps that modesty: a cleverer drawing would lie about the machine.',
    ),
  },
  {
    id: 'float-limiter',
    scene: 'digester',
    category: 'mechanical',
    name: l('Limiteur de course', 'Float limiter'),
    short: l(
      'Deux U renversés en tube de 1 pouce, qui empêchent la cloche de monter trop haut : pris sur une autre construction, et à une autre échelle.',
      'Two inverted U’s of 1-inch pipe that stop the bell going too high: taken from another build, at another scale.',
    ),
    description: lf(
      'Il n’était pas sur l’installation mesurée, et il ne fait partie d’aucune mesure. Il vient du manuel de construction du Guatemala, sur des cuves de 1,20 et 1,06 m : trois longueurs de tube de 1 pouce, 1,40, 1,29 et 1,40 m, en deux U renversés, croisés en X au-dessus de la machine, boulonnés à une ceinture de fer autour de sa base. Ce dessin l’a mis à l’échelle : {limiterAcross} de large, calculés sur le diamètre de la cuve, et sa hauteur tient juste au-dessus de la cloche pleine et penchée. Le modèle ne le voit pas : il ne compte qu’une course de 0,69 m, celle que la thèse a mesurée.',
      'It was not on the measured plant, and it is part of no measurement. It comes from the build manual from Guatemala, on tanks of 1.20 and 1.06 m: three lengths of 1-inch pipe, 1.40, 1.29 and 1.40 m, in two inverted U’s, crossed in an X over the machine, bolted to an iron belt round its base. This drawing has scaled it: {limiterAcross} wide, worked out on the tank’s diameter, and its height sits just above the full, tilted bell. The model does not see it: it only counts a travel of 0.69 m, the one the thesis measured.',
    ),
    material: l('Tube PVC de 1 pouce, coudes, ceinture de fer', '1-inch PVC pipe, elbows, iron belt'),
    specs: [
      sp('Sur le manuel', 'In the manual', l('1,40, 1,29 et 1,40 m', '1.40, 1.29 and 1.40 m')),
      sp('Largeur ramenée à cette cuve', 'Width scaled to this tank', v('{limiterAcross}')),
      sp('Sur l’installation mesurée', 'On the measured plant', l('absent', 'absent')),
    ],
    maintenance: maint(
      {
        failure:
          'Le PVC vieillit au soleil, et une cloche pleine qui force contre lui le fait savoir tout de suite. La thèse juge faible le risque qu’une cloche pleine bascule, sans essai à l’appui : nous ne reprenons pas ce jugement.',
        check: 'Les boulons de la ceinture, et l’état du tube côté soleil.',
        care: 'Une cloche qui atteint souvent ce limiteur n’est plus une affaire de limiteur : c’est le gaz qui part par le bord sans brûler.',
      },
      {
        failure:
          'PVC ages in the sun, and a full bell forcing against it makes itself known at once. The thesis rates low the risk of a full bell tipping, with no test behind that: we do not take its judgement on.',
        check: 'The belt’s bolts, and the pipe on its sunny side.',
        care: 'A bell that often reaches this limiter is no longer a matter for the limiter: the gas is leaving over the rim, unburnt.',
      },
    ),
    tip: l(
      'Lancez « La cloche pleine » : elle s’arrête à la fin de sa course mesurée, sous les barres, dont elle reste à quelques centimètres.',
      'Run “The full bell”: it stops at the end of its measured travel, under the bars, a few centimetres short of them.',
    ),
    design: l(
      'La question du dessin était celle-ci : montrer une pièce qui n’était pas là, ou laisser une cloche flotter sans rien autour ? Ce lab a choisi de la montrer et de dire d’où elle vient. Son échelle est un calcul, et elle ne prouve rien sur la tenue de cette cloche.',
      'The drawing’s question was this: show a part that was not there, or leave a bell floating with nothing round it? This lab chose to show it and say where it comes from. Its scale is a sum, and it proves nothing about how this bell behaves.',
    ),
  },
  {
    id: 'scum-layer',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Croûte', 'Scum layer'),
    short: l(
      'Ce qui flotte, retenu sous la cloche : 74 g de solides par litre à la surface.',
      'What floats, held under the bell: 74 g of solids per litre at the surface.',
    ),
    description: lf(
      'Le 26 novembre 2008, la thèse a prélevé dix couches de 85 L dans la cuve : 74 g de matières sèches par litre en surface, 3,3 à 3,6 g/L dans le gros du liquide, 41 g/L au fond. Elle a donc mesuré une cuve bien rangée, qui n’est brassée par rien. La croûte est faite de ce que le gaz soulève et de ce qui flotte de soi-même, fibres et graisses. Le modèle ne connaît que des parts, celles de la thèse, et n’a pas de physique de croûte : sa hauteur, dans ce dessin, est une estimation.',
      'On 26 November 2008 the thesis sampled ten layers of 85 L in the tank: 74 g of dry matter per litre at the surface, 3.3 to 3.6 g/L in the bulk of the liquid, 41 g/L at the bottom. So it measured a well-ordered tank, stirred by nothing. The crust is made of what gas lifts and of what floats by itself, fibres and fats. The model knows only shares, the thesis’s, and has no physics of crust: its height, in this drawing, is an estimate.',
    ),
    material: l('Fibres, graisses, solides soulevés par le gaz', 'Fibres, fats, solids lifted by the gas'),
    specs: [
      sp('En surface', 'At the surface', '74 g/L'),
      sp('Prélèvement', 'Sampling', l('dix couches de 85 L', 'ten layers of 85 L')),
    ],
    maintenance: maint(
      {
        failure:
          'Une croûte trop épaisse retient le gaz et finit par gêner la cloche ou boucher le trop-plein : le tutoriel du Low-tech Lab parle d’une écume difficile à faire disparaître. La thèse, elle, n’a pas suivi une croûte au-delà de quatre mois.',
        check: 'Elle n’est pas visible sans ouvrir. On la voit à la cloche qui ne descend plus franchement.',
        care: 'Éviter les matières qui flottent, fibres et huiles, dès le seau. Aucune source lue ne donne d’intervalle de nettoyage.',
      },
      {
        failure:
          'A crust too thick holds gas back and ends up hindering the bell or blocking the overflow: the Low-tech Lab’s tutorial speaks of a scum hard to get rid of. The thesis did not follow a crust beyond four months.',
        check: 'It cannot be seen without opening up. It shows in a bell that no longer comes down cleanly.',
        care: 'Keep out what floats, fibre and oils, from the bucket on. No source we read gives a cleaning interval.',
      },
    ),
    tip: l(
      'Elle est sous la cloche, en haut de la bouillie : ne la confondez pas avec le trait de surface de l’anneau. En Éclaté, les couches glissent hors de la coupe, l’une au-dessus de l’autre.',
      'It is under the bell, at the top of the slurry: not to be confused with the ring’s surface. In Explode the layers slide out of the section, one above the other.',
    ),
    design: lf(
      'Ce n’est pas un déchet : la croûte et les boues sont le stock de la cuve. Le modèle y compte environ {stockVS} de matière organique au jour 107, contre 9,0 kg selon le tableau de la thèse. Le gaz en vient lentement, et c’est ce qui amortit trois jours sans repas.',
      'It is no waste: the crust and the sludge are the tank’s stock. The model counts about {stockVS} of organic matter there on day 107, against 9.0 kg by the thesis’s table. Gas comes out of it slowly, and that is what cushions three days without a feed.',
    ),
  },
  {
    id: 'clear-liquor',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Liquide clair', 'Clear liquor'),
    short: l(
      'Environ 600 L presque clairs entre la croûte et les boues : la grande part de la cuve, et la porte de la goutte.',
      'About 600 L almost clear, between crust and sludge: the bulk of the tank, and the way into the drop.',
    ),
    description: lf(
      'Environ 600 L à 3,3 à 3,6 g de solides par litre : presque de l’eau. Le liquide y passe en 42,5 jours, ce qui ne dit rien des solides, qui restent environ 300 jours : c’est toute la différence avec une cuve mélangée, et ce qui lui permet de digérer sur place. Le pH y est d’environ 6,5 d’après la thèse, {pHSteady} d’après le modèle, qui n’a qu’un seul volume. C’est par ce liquide que tout passe : il entre avec la nourriture, il dissout le CO₂, il sort par le trop-plein. Sa couleur, ici, vire avec l’indice d’acidité du modèle : une teinte, rien de plus.',
      'About 600 L at 3.3 to 3.6 g of solids per litre: nearly water. The liquid passes through in 42.5 days, which says nothing of the solids, which stay about 300 days: that is the whole difference from a mixed tank, and what lets it digest in place. Its pH is about 6.5 by the thesis, {pHSteady} by the model, which has a single volume. Everything passes through this liquid: it enters with the food, it dissolves the CO₂, it leaves at the overflow. Its colour, here, turns with the model’s sourness index: a tint, nothing more.',
    ),
    material: l('Eau, sels dissous, acides, peu de solides', 'Water, dissolved salts, acids, few solids'),
    specs: [
      sp('Volume', 'Volume', l('environ 600 L', 'about 600 L')),
      sp('Solides', 'Solids', l('3,3 à 3,6 g/L', '3.3 to 3.6 g/L')),
      sp('Temps de passage de l’eau', 'Time for the water to pass', l('42,5 jours', '42.5 days')),
      sp('Temps des solides', 'Time for the solids', l('environ 300 jours', 'about 300 days')),
    ],
    maintenance: maint(
      {
        failure:
          'Le pH qui tombe : c’est la panne la plus sérieuse de la machine, et elle est silencieuse. La leçon 5 en fait le récit.',
        check:
          'Le pH se lit au papier ou à l’électrode sur l’effluent. La thèse remarque qu’il réagit avec beaucoup de retard, et ce n’est donc pas une alarme.',
        care: 'Pas d’autre soin que la régularité du repas et de la température.',
      },
      {
        failure: 'A falling pH: it is the machine’s most serious failure, and a silent one. Lesson 5 tells the story.',
        check:
          'The pH is read with paper or an electrode on the effluent. The thesis remarks that it reacts with quite some delay, so it is no alarm.',
        care: 'No other care than regular feeds and steady warmth.',
      },
    ),
    tip: l(
      'Le bouton de cette fiche plonge dans une seule goutte de ce liquide : le monde où l’on voit ce qui mange quoi.',
      'The button on this sheet dives into one drop of this liquid: the world where you see what eats what.',
    ),
    design: l(
      'Ne rien brasser, c’est moins de pièces et moins de pannes, et la thèse montre que cela marche. C’est aussi ce qui rend cette cuve difficile à prédire : un modèle à un seul volume ne voit pas le fond qui s’acidifie avant le haut.',
      'Stirring nothing means fewer parts and fewer faults, and the thesis shows it works. It is also what makes this tank hard to predict: a one-volume model does not see the bottom turning sour before the top.',
    ),
  },
  {
    id: 'sludge-bed',
    scene: 'digester',
    category: 'hydraulic',
    name: l('Boues', 'Sludge bed'),
    short: l(
      'Le fond de la cuve, 41 g de solides par litre : là où les solides restent environ 300 jours.',
      'The floor of the tank, 41 g of solids per litre: where solids stay about 300 days.',
    ),
    description: lf(
      'La thèse a mesuré 41 g/L au fond. À la mise en route, ce lit était de la bouse de vache : 60 kg mélangés à la main avec de l’eau, plus environ 300 L d’effluent d’une autre installation. Le rapport du tableau de la thèse, 10,61 g/L de matière organique dans la cuve contre 1,47 dans l’effluent, donne environ sept fois le temps de passage du liquide, d’où les 300 jours. Ce lit est le stock de méthanogènes de la cuve, et c’est lui que le tube intérieur nourrit. Le dessin suit les parts de la thèse, et le modèle, qui ne l’a pas en couche, le compte dans son volume unique.',
      'The thesis measured 41 g/L at the bottom. At start-up this bed was cow dung: 60 kg mixed by hand with water, plus about 300 L of effluent from another plant. The thesis’s table, 10.61 g/L of organic matter in the tank against 1.47 in the effluent, gives about seven times the liquid’s residence, hence the 300 days. This bed is the tank’s stock of methanogens, and it is what the inner pipe feeds. The drawing follows the thesis’s shares, and the model, which has it in no layer, counts it in its single volume.',
    ),
    material: l('Solides décantés, organismes', 'Settled solids, organisms'),
    specs: [
      sp('Au fond', 'At the bottom', '41 g/L'),
      sp('Temps des solides', 'Time for the solids', l('environ 300 jours', 'about 300 days')),
      sp('Départ', 'Start', l('60 kg de bouse, 300 L d’effluent', '60 kg of dung, 300 L of effluent')),
    ],
    maintenance: maint(
      {
        failure:
          'Un lit qui peut s’épaissir jusqu’à enfouir le tube intérieur, et des matières lourdes qui s’y déposent sans jamais se digérer : on peut s’y attendre, aucune source ne le chiffre.',
        check: 'Il ne se voit pas. La thèse l’a lu par la vanne de fond ; un ménage ne l’a pas.',
        care: 'Aucune source lue ne dit quand ni comment un ménage retire ces boues : nous n’inventons pas de fréquence. Ce lit reste chargé de germes et de gaz dissous.',
      },
      {
        failure:
          'A bed that may thicken until it buries the inner pipe, and heavy matter settling that never digests: to be expected, with no source to put a figure on it.',
        check: 'It cannot be seen. The thesis read it through the bottom valve; a household has none.',
        care: 'No source we read says when or how a household takes this sludge out: we invent no interval. This bed stays laden with germs and dissolved gas.',
      },
    ),
    tip: l(
      'Il est au fond de la coupe, sous le tube intérieur. En Éclaté, il glisse hors de la cuve avec les deux autres couches.',
      'It lies at the bottom of the section, under the inner pipe. In Explode it slides out of the tank with the other two layers.',
    ),
    design: lf(
      'Garder les solides plus longtemps que l’eau est le secret de toutes les cuves non brassées. Dans ce modèle, tant que ce rapport tient, presque tout finit digéré, et c’est pourquoi le gaz bouge si peu avec les autres réglages : de {retentionLow} à {retentionHigh} quand ce rapport passe de 1 à 15.',
      'Keeping solids longer than water is the secret of every unstirred tank. In this model, as long as that ratio holds, nearly everything ends up digested, and that is why the gas moves so little with the other settings: from {retentionLow} to {retentionHigh} as this ratio goes from 1 to 15.',
    ),
  },
];
