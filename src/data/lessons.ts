// The seven lessons of the lab, in the order of docs/research.md §0.6: 1 who makes the gas, 2 wet or dry, 3 the bell, 4 warmth and time, 5 feed or sour, 6 what the gas can do, 7 is it worth it. Each opens a world, a part and one of the simulation's twelve scenarios, and names the others it needs by the name the panel gives them, so that all twelve are reachable from a lesson (lessons.test.ts checks it).
// Shape: four paragraphs of at most 95 words, fourteen questions in all, three choices of about the same length, the longest right about one time in three (lessons.test.ts), a wrong choice for each misconception the text names.
// Numbers: no mark, reported by a source; † computed, from published figures or by the model where a plant was measured; * an estimate, or the same model where none was. What docs/physics.md says not to write is not written: leftovers losing to peelings per kilo of solids as a finding, half a brick doubling the flame, a cold tank stopping as a fact. Lesson 4 opens on what the model cannot decide.
import type { Lesson, Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf, v } from './part-helpers';

const chip = (fr: string, en: string, value: L | string): Spec => ({ label: l(fr, en), value });

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ 1
  {
    id: 'what-makes-the-gas',
    title: l('Qui fait le gaz', 'Who makes the gas'),
    summary: l(
      'Quatre stades, sans air, de la particule à la bulle : et ceux qui font le méthane ne sont pas des bactéries.',
      'Four stages, with no air, from the particle to the bubble: and those that make the methane are not bacteria.',
    ),
    body: [
      l(
        'Sous l’eau, sans oxygène, la nourriture passe de main en main. L’**hydrolyse** découpe les grosses molécules. L’**acidogenèse** en fait des acides gras, de l’hydrogène et du CO₂. L’**acétogenèse** les ramène à l’acétate. La **méthanogenèse** en tire le méthane. Dans une cuve non brassée, tout cela se passe en même temps, dans le même volume. Chacun mange ce que l’autre rejette : la chaîne ne va donc pas plus vite que son maillon le plus lent, et l’air n’y a pas de place.',
        'Under water, with no oxygen, the food passes from hand to hand. **Hydrolysis** cuts up the large molecules. **Acidogenesis** turns them into fatty acids, hydrogen and CO₂. **Acetogenesis** brings those down to acetate. **Methanogenesis** draws the methane from it. In an unstirred tank all this goes on at once, in one volume. Each eats what another throws out: so the chain goes no faster than its slowest link, and air has no place in it.',
      ),
      l(
        'La plupart des sources, y compris la thèse et le livre de ce lab, écrivent « bactéries méthanogènes ». En 1977, Woese et Fox ont montré que ces organismes appartenaient à une lignée à part, aujourd’hui appelée les archées. Ils n’ont pas été découverts cette année-là : ils étaient connus, et classés ailleurs. La flamme de cette cuisine vient donc d’une branche du vivant qui n’est ni celle des bactéries, ni la nôtre. Dans la goutte, leur couleur et leur lueur suivent l’activité que le modèle leur donne.',
        'Most sources, including this lab’s thesis and book, write “methanogenic bacteria”. In 1977 Woese and Fox showed that these organisms belong to a line of their own, now called the archaea. They were not discovered that year: they were known, and filed elsewhere. So this kitchen’s flame comes from a branch of life that is neither the bacteria’s nor ours. In the drop, their colour and glow follow the activity the model gives them.',
      ),
      lf(
        'Lancez « La journée mesurée ». Sur 2 kg de restes par jour, le modèle trouve environ {gasAbout} de gaz par jour, là où la thèse a lu 289 L. Sur le calendrier de la thèse, c’est {gasCalendar} à {ch4Calendar} de méthane, pour 56,8 % mesurés. Cet accord prouve peu : quels que soient les réglages de vitesse, le gaz reste entre {kineticsLow} et {kineticsHigh}. Ce qui le fixe, c’est le potentiel du déchet et l’anneau ouvert, et le modèle ne l’a pas réglé pour tomber juste.',
        'Run “The measured day”. On 2 kg of leftovers a day, the model finds about {gasAbout} of gas a day, where the thesis read 289 L. On the thesis’s own calendar it is {gasCalendar} at {ch4Calendar} methane, against 56.8 % measured. That agreement proves little: whatever the settings of speed, the gas stays between {kineticsLow} and {kineticsHigh}. What fixes it is the waste’s potential and the open ring, and the model was not tuned to come out right.',
      ),
      lf(
        'La vitesse se voit ailleurs. Dans le modèle, la moitié du gaz d’un repas cuit arrive en {mealHalf}, et 90 % en {mealNinety}. C’est ce qui reste de la promesse d’un gaz « en un ou deux jours » : une réaction, pas une cuve, où le liquide passe 42,5 jours, les solides environ 300. Dans « Trois jours d’absence », le gaz ne s’arrête pas d’un coup. La thèse a lu 70 NL par jour après une telle pause, sur des déchets de marché ; le modèle, sur son calendrier, {nlBreak}.',
        'Speed shows elsewhere. In the model, half the gas of a cooked meal comes in {mealHalf}, and 90 % in {mealNinety}. That is about what is left of the promise of gas “in a day or two”, which speaks of a reaction, not of a tank: the liquid stays 42.5 days, the solids about 300. In “Three days away” the gas does not stop at once. The thesis read 70 NL a day after such a break, on market waste; the model, on its calendar, {nlBreak}.',
      ),
    ],
    formula: 'C₆H₁₀O₅ + H₂O → 3 CH₄ + 3 CO₂',
    figures: [
      chip('Gaz mesuré, 2 kg de restes', 'Gas measured, 2 kg of leftovers', '289 L'),
      chip('Selon le modèle', 'By the model', lf('environ {gasAbout}', 'about {gasAbout}')),
      chip(
        'Passage du liquide, des solides',
        'Stay of the liquid, the solids',
        l('42,5 et 300 jours', '42.5 and 300 days'),
      ),
    ],
    focus: { scene: 'slurry', part: 'methanogens', scenario: 'measured-day' },
    quiz: [
      {
        q: l('Les organismes qui font le méthane sont…', 'The organisms that make the methane are…'),
        choices: [
          l('des bactéries comme toutes les autres', 'bacteria just like all the others'),
          l('des archées, une lignée à part', 'archaea, a line of their own'),
          l('des levures, ajoutées à la mise en route', 'yeasts, added at the start-up'),
        ],
        answer: 1,
        explain: l(
          '**Des archées.** Beaucoup de sources écrivent « bactéries », et ces organismes étaient connus avant 1977 : c’est leur place dans le vivant que Woese et Fox ont établie cette année-là.',
          '**Archaea.** Many sources write “bacteria”, and these organisms were known before 1977: it is their place in life that Woese and Fox established that year.',
        ),
      },
      {
        q: lf(
          'Le modèle trouve environ {gasAbout} par jour, la thèse a lu 289 L. Que prouve cet accord ?',
          'The model finds about {gasAbout} a day, the thesis read 289 L. What does that agreement prove?',
        ),
        choices: [
          l(
            'Que les vitesses de réaction de la chaîne sont les bonnes',
            'That the chain’s rates of reaction are the right ones',
          ),
          l('Que la thèse s’est trompée de quelques litres', 'That the thesis was out by a few litres'),
          l('Peu de chose : surtout le potentiel et l’anneau', 'Little: the potential and the ring are enough'),
        ],
        answer: 2,
        explain: lf(
          '**Peu de chose.** Toutes les vitesses, sur leur plage, laissent le gaz entre {kineticsLow} et {kineticsHigh}. Ce chiffre ne dit rien des vitesses. Elles parlent ailleurs : après une pause, et quand la cuve tourne.',
          '**Little.** All the rates, over their range, leave the gas between {kineticsLow} and {kineticsHigh}. This figure says nothing of the rates. They speak elsewhere: after a break, and when the tank sours.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 2
  {
    id: 'wet-or-dry',
    title: l('Humide ou sec', 'Wet or dry'),
    summary: lf(
      '2 kg donnent 500 g de méthane, ou environ {methaneWet} : c’est le même déchet, et la différence est de l’eau.',
      '2 kg give 500 g of methane, or about {methaneWet}: the same waste, and the difference is water.',
    ),
    body: [
      l(
        'Un déchet pesé n’est pas une nourriture pesée. Ce qui compte, c’est sa **matière sèche**, ce qui reste sans l’eau, et sa **matière organique**, ce que brûlerait cette matière sèche. Les restes de cantine de la thèse font 24 % de matière sèche, dont 94 % d’organique. Les déchets de marché : 10 %, dont 88 %. Sur 2 kg, cela fait 0,451 kg contre 0,18 kg : plus de deux fois moins de quoi manger pour le même poids au seau. Une tomate et un plat de riz ne font pas le même repas.',
        'A waste weighed is not a food weighed. What counts is its **dry matter**, what remains with no water, and its **organic matter**, what that dry matter would burn. The thesis’s canteen leftovers are 24 % dry matter, of which 94 % organic. Market waste: 10 %, of which 88 %. On 2 kg that makes 0.451 kg against 0.18 kg: less than half as much to eat for the same weight in the pail. A tomato and a plate of rice do not make the same meal.',
      ),
      lf(
        'D’où vient alors le chiffre du concepteur, 2 kg donnent environ 500 g de méthane ? De la **matière sèche** : 1 kg sec donne environ 0,25 kg, ce qui reste possible, {starchShare} du maximum que permet l’amidon. Sur 2 kg de vrais restes humides, la thèse donne environ {methaneWet}, et le modèle {methaneModel}. Presque un facteur cinq, et personne ne s’est trompé : ce sont deux façons de compter le même déchet. Quand on lit un chiffre de biogaz, c’est la première question à poser.',
        'So where does the designer’s figure come from, 2 kg give about 500 g of methane? From **dry matter**: 1 kg dry gives about 0.25 kg, which is possible, {starchShare} of the most starch allows. On 2 kg of real wet leftovers the thesis gives about {methaneWet}, and the model {methaneModel}. Almost a factor of five, and nobody was wrong: these are two ways of counting one waste. On reading any biogas figure, that is the first question to ask.',
      ),
      lf(
        'Lancez « Des épluchures ». Là, le modèle ne retrouve pas la thèse : {marketLow} à {marketHigh} par jour, contre 126 L. Il ne le peut pas. D’après le tableau de la thèse, cette nourriture contenait au plus {maxFromCod} de méthane, et la cuve en a recueilli {caughtMarket}. Le gaz venait peut-être du stock, ou d’un échantillon peu représentatif : ce déchet variait beaucoup. Le modèle reste en dessous et le dit. Les 700 L par kilo de matière organique de la thèse ne permettent donc de rien conclure.',
        'Run “Peelings”. Here the model does not retrieve the thesis: {marketLow} to {marketHigh} a day, against 126 L. It cannot. By the thesis’s own table, this food held enough for at most {maxFromCod} of methane, and the tank caught {caughtMarket}. So the gas may have come from the stock, or from a sample that did not represent the feed: the thesis notes how much this waste varied. The model stays below and says so. The thesis’s 700 L per kilo of organic matter therefore settle nothing.',
      ),
      lf(
        '« 1 kg de déchets égale une demi-heure de gaz », écrit le Low-tech Lab. Sur le brûleur de la thèse, environ {powerIn} en entrée, un kilo de restes donne {minPerKgFood}, un kilo d’épluchures {minPerKgMarket} ; sur un réchaud moyen à 0,4 m³/h, {minPerKgBook}. Quelle flamme, donc ? Dernier paradoxe : le gaz des épluchures, plus maigre, est plus riche en méthane, 66,4 % contre 56,8 %. Le liquide emporte à peu près le même volume de CO₂ dans les deux cas, et cela pèse plus dans un petit débit.',
        '“1 kg of waste equals half an hour of gas”, writes the Low-tech Lab. On the thesis’s burner, about {powerIn} going in, a kilo of leftovers gives {minPerKgFood}, a kilo of peelings {minPerKgMarket}; on an average stove at 0.4 m³/h, {minPerKgBook}. So what flame? A last paradox: the leaner gas from peelings is richer in methane, 66.4 % against 56.8 %. The liquid carries off about the same volume of CO₂ either way, and that weighs more in a small flow.',
      ),
    ],
    formula: 'V = m × TS × VS × Y',
    figures: [
      chip('Selon le concepteur, sec', 'By the designer, dry', l('2 kg, environ 500 g', '2 kg, about 500 g')),
      chip('Mesuré, humide', 'Measured, wet', lf('2 kg, environ {methaneWet}', '2 kg, about {methaneWet}')),
      chip(
        'Épluchures, modèle et mesure',
        'Peelings, model and measure',
        lf('{marketHigh} et 126 L', '{marketHigh} and 126 L'),
      ),
    ],
    focus: { scene: 'slurry', part: 'food-particle', scenario: 'market-waste' },
    quiz: [
      {
        q: l('« 2 kg donnent 500 g de méthane » vaut pour…', '“2 kg give 500 g of methane” holds for…'),
        choices: [
          l('des solides, sans leur eau', 'solids with the water gone'),
          l('des restes pesés tels quels', 'leftovers weighed as they are'),
          l('des épluchures de marché', 'peelings from the market'),
        ],
        answer: 0,
        explain: lf(
          '**La matière sèche.** Les mêmes 2 kg, pesés humides, donnent environ {methaneWet} dans la thèse. Personne n’a tort : c’est le même déchet, sans ou avec son eau.',
          '**Dry matter.** The same 2 kg, weighed wet, give about {methaneWet} in the thesis. Nobody is wrong: it is the same waste, without or with its water.',
        ),
      },
      {
        q: lf(
          'Sur les épluchures, le modèle donne {marketLow} à {marketHigh}, la thèse 126 L. Que fait le lab ?',
          'On peelings the model gives {marketLow} to {marketHigh}, the thesis 126 L. What does the lab do?',
        ),
        choices: [
          l('Il règle le modèle jusqu’à retrouver 126 L', 'It tunes the model until it finds 126 L'),
          l('Il déclare que la thèse a mal mesuré', 'It declares that the thesis mismeasured'),
          l(
            'Il le dit, sans forcer le modèle ni accuser la mesure',
            'It says so, neither forcing the model nor blaming the test',
          ),
        ],
        answer: 2,
        explain: lf(
          '**Il le dit.** La nourriture mesurée ne contenait pas de quoi faire tout ce gaz : au plus {maxFromCod} de méthane, et {caughtMarket} recueillis. La thèse note que ce déchet variait. Nous ne savons pas d’où venait le reste.',
          '**It says so.** The food measured did not hold enough for all that gas: at most {maxFromCod} of methane, and {caughtMarket} caught. The thesis notes how this waste varied. We do not know where the rest came from.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 3
  {
    id: 'the-bell',
    title: l('La cloche', 'The bell'),
    summary: lf(
      'Un réservoir et un régulateur sans mécanisme : ce que fait vraiment un demi-parpaing de 12 kg, et pourquoi il reste environ {trappedL} sous la cloche.',
      'A store and a regulator with no mechanism: what half a brick of 12 kg really does, and why about {trappedL} stay under the bell.',
    ),
    body: [
      lf(
        'La cloche monte de 17,25 cm pour 100 L : ses graduations sont un compteur. Son poids, sur la surface du gaz, fait la pression : on lit 2 mbar. Mais ce n’est pas un seul chiffre : la paroi qui plonge est portée par la bouillie, et elle sort à mesure que la cloche monte. Le modèle trouve {pressureRest} au repos, {pressureMid} à mi-course et {pressureFull} en haut, pour une paroi de {bellWall}, que nous avons déduite de la cuve, car aucune source ne pèse la cloche.',
        'The bell rises 17.25 cm per 100 L: its marks are a meter. Its weight, over the gas’s area, makes the pressure: that is all its mechanics. It reads 2 mbar. But its pressure is no single figure: the wall that dips is carried by the slurry, and comes out as the bell rises. The model finds {pressureRest} at rest, {pressureMid} at mid-travel and {pressureFull} at the top, for a wall of {bellWall}, which we derived from the tank, since no source weighs the bell.',
      ),
      lf(
        'Lancez « Le demi-parpaing ». 12 kg sur 0,581 m² font {brickMbar}, et le manomètre de la thèse est passé de 2 à 4 mbar : la pression double, et c’est le chiffre le plus net de ce lab. La flamme, elle, ne double pas. Pour 100 L, la thèse lit 12,1 min au lieu de 22,3 : {flowRatio} le débit. Un orifice ne donne que {orificeRatio}, comme le modèle. Nous n’avons pas d’explication. Le manomètre, gradué jusqu’à 60 mbar, y est peut-être pour quelque chose.',
        'Run “The half-brick”. 12 kg on 0.581 m² make {brickMbar}, and the thesis’s gauge went from 2 to 4 mbar: the pressure doubles, exactly, and it is the cleanest figure in this lab. The flame does not double. For 100 L the thesis reads 12.1 min instead of 22.3: {flowRatio} the flow. An orifice gives only {orificeRatio}, as does the model. We have no explanation. The gauge, marked up to 60 mbar, may have something to do with it.',
      ),
      lf(
        'Regardez les surfaces dans la coupe. L’anneau et la colonne d’alimentation sont à la même hauteur, celle du trop-plein, car tous deux sont à l’air libre. Le gaz abaisse la surface sous la cloche de {innerDrop} à 2 mbar. Le dessin de la thèse imprime 1,06 m et 1,04 m, et on pourrait y lire une colonne soulevée par le gaz : ce sont deux bases de cotes pour un même niveau. Au bout de sa course de 0,69 m, le gaz en trop ressort par le bord, et c’est sa seule soupape.',
        'Look at the surfaces in the section. The ring and the feed riser stand at one height, the overflow’s, as both are open to the air. The gas pushes the surface under the bell down by {innerDrop} at 2 mbar. The thesis’s drawing prints 1.06 m and 1.04 m, and one could read a column lifted by the gas: they are two bases for a single level. At the end of its 0.69 m of travel, the extra gas comes out over the rim, its only relief.',
      ),
      lf(
        'Lancez « La flamme s’éteint ». Ici, la cloche se pose, et il reste environ {trappedL} qu’aucun robinet ne peut tirer : elle est plus haute (1,30 m) que le liquide n’est profond (1,04 m). Sur les cuves de 4 000 L d’une autre étude, la flamme meurt avec environ 500 L restants, et c’est la pression qui manque, comme elle le dit, et comme le modèle le retrouve, de {schoolLow} à {schoolHigh}, sur des estimations. Dans les deux cas, le robinet reste à fermer : le gaz, lui, continue de sortir.',
        'Run “The flame goes out”. Here the bell comes to rest, and about {trappedL} remain that no tap can draw: it is taller (1.30 m) than the liquid is deep (1.04 m). On the 4,000 L tanks of another study, the flame dies with about 500 L left, and pressure is what is lacking, as it says, and as the model finds, from {schoolLow} to {schoolHigh}, on estimates. Either way, the tap has still to be shut: the gas goes on coming out.',
      ),
    ],
    formula: 'P = m · g / A',
    figures: [
      chip('Le demi-parpaing', 'The half-brick', lf('{brickMbar}', '{brickMbar}')),
      chip(
        'Pression selon la hauteur',
        'Pressure by height',
        lf('{pressureRest} à {pressureFull}', '{pressureRest} to {pressureFull}'),
      ),
      chip('Reste sous la cloche posée', 'Left under the bell at rest', lf('environ {trappedL}', 'about {trappedL}')),
    ],
    focus: { scene: 'digester', part: 'gas-bell', scenario: 'half-brick' },
    quiz: [
      {
        q: l('Un demi-parpaing de 12 kg sur la cloche…', 'Half a brick of 12 kg on the bell…'),
        choices: [
          l('double la pression, pas la flamme', 'doubles the pressure, not the flame'),
          l('double la flamme, comme on l’a mesuré sur place', 'doubles the flame, as was measured on site'),
          l('ne change rien sous la cloche', 'changes nothing under the bell'),
        ],
        answer: 0,
        explain: lf(
          '**La pression double** : {brickMbar}, pour une lecture de 2 à 4 mbar. Le débit fait {orificeRatio} par un orifice, {flowRatio} d’après la mesure. La hauteur de la flamme n’a été mesurée par aucune de nos sources.',
          '**The pressure doubles**: {brickMbar}, against a reading of 2 to 4 mbar. The flow goes up {orificeRatio} by an orifice, {flowRatio} by the measurement. None of our sources measured the flame’s height.',
        ),
      },
      {
        q: lf(
          'Sur cette installation, pourquoi reste-t-il environ {trappedL} quand la cloche est posée ?',
          'On this plant, why do about {trappedL} stay when the bell is resting?',
        ),
        choices: [
          l('Le robinet se ferme de lui-même à ce niveau', 'The tap closes by itself at that level'),
          l('Elle est plus haute que le liquide n’est profond', 'It is taller than the liquid is deep'),
          l('Le gaz se dissout d’un coup dans toute la bouillie', 'The gas dissolves at once in the slurry'),
        ],
        answer: 1,
        explain: l(
          '**Ses proportions.** La cloche fait 1,30 m, le liquide 1,04 m : son sommet ne peut pas descendre sous la surface. La taille suivante, plus courte, peut couler entièrement, comme le note une étude voisine.',
          '**Its proportions.** The bell is 1.30 m, the liquid 1.04 m: its top cannot go below the surface. The next size up, shorter, can sink all the way, as a neighbouring study notes.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 4
  {
    id: 'warmth-and-time',
    title: l('Chaleur et temps', 'Warmth and time'),
    summary: lf(
      'Une cuve nue passe-t-elle un hiver à Genève ? Le modèle ne peut pas trancher : tout se joue entre {eaHolds} et {eaFails}, et un curseur vous le montre.',
      'Does a bare tank last a Geneva winter? The model cannot decide: it all turns between {eaHolds} and {eaFails}, and a slider shows you.',
    ),
    body: [
      lf(
        'Sur 2 kg par jour, une cuve nue passe-t-elle l’hiver à Genève ? **Le modèle ne peut pas trancher.** Elle tient jusqu’à {eaHolds} d’énergie d’activation, tourne à l’acide dès {eaFails}, et le seul indice trouvé tombe vers {eaClue}, dans le résumé d’une étude. Lancez « Un hiver à Genève » et déplacez le curseur **Énergie d’activation** : à {eaDefault}, le gaz s’arrête vers {genevaT} début décembre ; à {eaLow}, la cuve passe. Nous n’avons trouvé aucune mesure de ce genre d’installation sous 25 °C environ.',
        'On 2 kg a day, does a bare tank last the winter at Geneva? **The model cannot decide.** It holds up to {eaHolds} of activation energy, sours from {eaFails}, and the one clue found stands near {eaClue}, in the summary of a study. Run “A winter at Geneva” and move the **Activation energy** slider: at {eaDefault}, the gas stops near {genevaT} in early December; at {eaLow}, the tank comes through. We found no measurement of a plant of this kind below about 25 °C.',
      ),
      lf(
        'À {eaDefault}, 15 °C vaut {k15} de la vitesse à 30 °C, 37 °C en vaut {k37}. Le gaz baisse pourtant à peine : à 15 °C, avec des solides gardés 300 jours, il reste {steady15}. Le froid se paie autrement : moins de capacité, autant de nourriture. Tenue au froid, une cuve tourne à l’acide entre {soursColdLow} et {soursColdHigh} sur 2 kg. Sous une moyenne de 15 °C, dit le livre, elle « ne marche pas de façon satisfaisante » ; le concepteur écrit « au-dessus de 30 °C ».',
        'At {eaDefault}, 15 °C is worth {k15} of the rate at 30 °C, 37 °C is worth {k37}. Yet the gas hardly falls: with solids held 300 days, at 15 °C the model still gives {steady15}. Cold is paid for another way: the methanogens have less capacity, while the food keeps coming. A tank held cold sours between {soursColdLow} and {soursColdHigh} on 2 kg. The book says that below a mean of 15 °C it “does not work satisfactorily”; the designer writes “above 30 °C”.',
      ),
      lf(
        'Que faire tenir ? Dans le modèle, à {eaDefault} : **moitié moins de nourriture** tient toute l’année, à {halfFood} par jour au pire. **Rien de novembre à mars**, et elle revient seule en avril. **La paille seule ne suffit pas** : elle garde la chaleur et arrête le soleil, et l’eau froide reste. Marseille tient, de {marseilleLow} à {marseilleHigh} par jour. Pune et Dar es Salaam n’en approchent jamais.',
        'What would see it through? In the model, at {eaDefault}: **half the food** holds all year, on {halfFood} a day at worst. **No food from November to March**, and it returns by itself in April. **Straw alone will not do**: it holds the heat and keeps the sun out, and the cold water remains. Marseille holds, on {marseilleLow} to {marseilleHigh} a day. Pune and Dar es Salaam never come near.',
      ),
      lf(
        'Le gaz peut-il payer sa chaleur ? Lancez « Genève, emballée et chauffée » : en janvier, dans 15 cm de paille, garder 30 °C demande {heatStraw} par jour, le gaz en contient {gasEnergyCold}, un brûleur en rendrait environ {gasUsefulCold}. Il ne paie donc que de juin à septembre, en paille, et jamais à nu, où il faudrait {heatBare} en janvier. « Le bidon de 60 litres » tient à 38 °C, pour {drumHeatRatio} l’énergie de son gaz : la 3D reste celle de la grande cuve.',
        'Can the gas pay for its warmth? Run “Geneva, wrapped and heated”: in January, in 15 cm of straw, holding 30 °C asks {heatStraw} a day, the gas holds {gasEnergyCold}, and a burner would give back only half, about {gasUsefulCold}. So in the model it pays only from June to September, in straw, and never bare, where it asks {heatBare} in January. “The 60-litre drum” holds at 38 °C, provided it is given {drumHeatRatio} the energy in its gas: the 3D stays that of the large tank.',
      ),
    ],
    formula: 'k(T) = k₃₀ · exp[(Ea/R) · (1/303 − 1/T)]',
    figures: [
      chip('Genève, cuve nue, 2 kg par jour', 'Geneva, bare tank, 2 kg a day', l('non tranché', 'not decided')),
      chip(
        'Tient jusqu’à, tourne à l’acide dès',
        'Holds up to, sours from',
        lf('{eaHolds}, {eaFails}', '{eaHolds}, {eaFails}'),
      ),
      chip('Le seul indice', 'The one clue', lf('vers {eaClue}', 'near {eaClue}')),
    ],
    focus: { scene: 'digester', part: 'clear-liquor', scenario: 'geneva-january' },
    quiz: [
      {
        q: l(
          'Que dit le modèle d’un hiver à Genève sur 2 kg par jour, cuve nue ?',
          'What does the model say of a Geneva winter on 2 kg a day, bare tank?',
        ),
        choices: [
          l('La cuve tourne forcément à l’acide en décembre', 'The tank is bound to sour in December'),
          l('Sa cuve noire passe l’hiver sans peine', 'Its black tank gets through with ease'),
          l('Il ne peut pas trancher : tout tient à un chiffre', 'It cannot decide: it all rests on one figure'),
        ],
        answer: 2,
        explain: lf(
          '**Il ne tranche pas.** Elle tient jusqu’à {eaHolds} et tourne à l’acide dès {eaFails}, et le seul indice trouvé tombe là, vers {eaClue}. Décembre, c’est le réglage d’ouverture, {eaDefault}, et ce n’est pas une prévision.',
          '**It does not decide.** It holds up to {eaHolds} and sours from {eaFails}, and the one clue found stands right there, near {eaClue}. December is the opening setting, {eaDefault}, and not a forecast.',
        ),
      },
      {
        q: l(
          'Pourquoi la paille seule ne sauve-t-elle pas la cuve, dans le modèle ?',
          'Why does straw alone not save the tank, in the model?',
        ),
        choices: [
          l(
            'Elle arrête aussi le soleil, et l’eau froide reste',
            'It also keeps the sun out, and the cold water stays',
          ),
          l('Elle brûle au contact de la cuve noire', 'It burns on contact with the black tank'),
          l(
            'Le gaz la traverse et finit par se perdre dans l’air libre',
            'The gas passes through it and ends up lost in the open air',
          ),
        ],
        answer: 0,
        explain: lf(
          '**Le soleil et l’eau froide.** À Dar es Salaam, c’est le soleil qui chauffe cette cuve, et la paille lui ferme la porte. Dans un mois à 10 °C, les 20 L du jour demandent à eux seuls environ {coldWaterKwh}.',
          '**The sun and the cold water.** At Dar es Salaam the sun is what warms this tank, and straw shuts it out. In a 10 °C month, the day’s 20 L alone ask about {coldWaterKwh}.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 5
  {
    id: 'feed-or-sour',
    title: l('Nourrir ou acidifier', 'Feed or sour'),
    summary: l(
      'La panne de cette machine : on la nourrit davantage, elle donne plus de gaz, puis plus rien du tout.',
      'This machine’s failure: feed it more, it gives more gas, and then nothing at all.',
    ),
    body: [
      lf(
        'Lancez « Trop, d’un coup » : 12 kg par jour, sans montée, à partir de 2. Le gaz triple pendant trois jours, et tout semble aller mieux. Le quatrième, il faiblit ; le cinquième, il s’arrête. Personne n’a programmé cela : dans le modèle, à 32 °C, un saut à {holdsAt} tient et un saut à {failsAt} tue. **Nourrir plus, recevoir moins** apparaît de soi-même, parce que les acidogènes vont vite, que les méthanogènes se multiplient lentement, et que l’acide des uns arrête les autres.',
        'Run “Too much, at once”: 12 kg a day, with no ramp, from 2. The gas triples for three days, and all seems to improve. On the fourth it weakens; on the fifth it stops. Nobody programmed that: in the model, at 32 °C, a jump to {holdsAt} holds and a jump to {failsAt} kills. **Feed more, get less** appears by itself, because the acid-makers are quick, the methanogens multiply slowly, and the acid of the first stops the second.',
      ),
      lf(
        'Le pH ne prévient guère. Au jour {noReturnDay}, il lit encore {pHNoReturn} : si l’on coupe la nourriture à ce moment, la cuve survit ; quelques heures plus tard, à {pHTooLate}, elle ne revient plus seule. La thèse écrit que le pH « réagit avec beaucoup de retard ». Le rapport acides sur tampon, avec sa limite de 0,3, prévient {ratioLead} avant que le pH atteigne 6, mais c’est une analyse de laboratoire. Pour un ménage, il reste la cloche, et ce qu’on lui donne à manger.',
        'The pH hardly warns. On day {noReturnDay} it still reads {pHNoReturn}: cut the food then, and the tank survives; a few hours later, at {pHTooLate}, it no longer comes back by itself. The thesis writes that the pH “reacts with quite some delay”. The ratio of acids to buffer, with its limit of 0.3, warns {ratioLead} before the pH reaches 6, but that is a laboratory analysis. A household is left with the bell, and what it feeds it.',
      ),
      lf(
        'La thèse est montée à 5 kg par jour, en plusieurs semaines : 670 L, 150 minutes de flamme, un pH descendu à 6,2, aucune panne. « La montée à cinq kilos » retrouve environ {rampLitres} et {rampMinutes}, mais son pH reste au-dessus de {rampPH}, et cet écart n’est pas résolu. Le modèle est optimiste : son seuil, {soursAt32}, dépasse les {bookLimit} du livre. Il n’a qu’un volume, et une vraie cuve non brassée s’acidifie d’abord près de son entrée. Ses {rampAt32} après une montée ne sont pas à croire.',
        'The thesis climbed to 5 kg a day, over several weeks: 670 L a day, 150 minutes of flame, a pH down to 6.2, no failure. “The ramp to five kilos” finds about {rampLitres} and {rampMinutes}, but its pH stays above {rampPH}, and that gap is unresolved. Here the model is hopeful: its threshold, {soursAt32}, passes the book’s {bookLimit}. It has one volume, whereas a real unstirred tank turns sour first near its inlet. Its {rampAt32} after a ramp is not to be believed.',
      ),
      lf(
        'L’enquête de terrain a trouvé une installation à l’arrêt à pH 4,15, que la thèse marque comme suralimentée. Cinq semaines plus tard, si notre lecture est bonne, malgré l’arrêt des repas, elle restait acide et son gaz ne brûlait pas. Le modèle passe par ce pH en environ {sourWeeks} et finit de {sourEndLow} à {sourEndHigh}. Coupé de nourriture, rien n’y revient seul : il lui faut environ {rescue100} à 100 L d’eau par jour, {rescue50} à 50 L. Une vraie cuve peut garder des poches vivantes que ce modèle ne voit pas.',
        'The field survey found a stopped plant at pH 4.15, which the thesis marks as overfed. Five weeks later, if our reading is right, though feeding had stopped, it was still sour and its gas would not burn. The model passes that pH in about {sourWeeks} and ends at {sourEndLow} to {sourEndHigh}. Cut off from food, nothing comes back by itself: it takes about {rescue100} at 100 L of water a day, {rescue50} at 50 L. A real tank may hold living pockets this model cannot see.',
      ),
    ],
    formula: 'k_m(T) · m(pH) · X',
    figures: [
      chip('Mesuré, en montant', 'Measured, ramped', l('5 kg/jour, aucune panne', '5 kg a day, no failure')),
      chip('Modèle, saut à 32 °C', 'Model, a jump at 32 °C', v('{soursAt32}')),
      chip('Le livre, sans brassage', 'The book, unstirred', v('{bookLimit}')),
    ],
    focus: { scene: 'slurry', part: 'fatty-acid-pool', scenario: 'overfeed' },
    quiz: [
      {
        q: l(
          'Trois jours après un saut à 12 kg par jour, que montre le modèle ?',
          'Three days after a jump to 12 kg a day, what does the model show?',
        ),
        choices: [
          l('Plus de gaz que jamais, et un pH presque normal', 'More gas than ever, and a nearly normal pH'),
          l('Déjà plus aucun gaz, et un pH sous 5', 'No gas left at all, and a pH under 5'),
          l(
            'Rien de visible : le gaz ne suit jamais la nourriture',
            'Nothing to see: the gas never follows the food at all',
          ),
        ],
        answer: 0,
        explain: l(
          '**Tout semble aller mieux.** C’est le piège : le gaz triple, le pH a perdu quelques dixièmes. Le jour suivant il cède, et le jour d’après le gaz s’arrête.',
          '**All seems better.** That is the trap: the gas triples, the pH has lost a few tenths. The day after it gives way, and the day after that the gas stops.',
        ),
      },
      {
        q: lf(
          'Pourquoi ne pas se fier au seuil de {soursAt32} par jour que trouve le modèle ?',
          'Why not rely on the {soursAt32} a day threshold the model finds?',
        ),
        choices: [
          l('La thèse en a déjà tenu 20 sans aucune peine', 'The thesis has already held 20 with no trouble'),
          l('Il est faux dès que la cuve est bien au soleil', 'It is wrong once the tank is well in the sun'),
          l(
            'Il ne voit pas le fond de la cuve qui s’acidifie d’abord',
            'It does not see the bottom of the tank turning sour first',
          ),
        ],
        answer: 2,
        explain: lf(
          '**Un seul volume.** Une vraie cuve non brassée s’acidifie près de son entrée : la thèse a lu de 4,5 à 6,8 au fond et 6,2 en haut, le même jour. Le livre s’arrête à {bookLimit}, et la thèse n’a essayé que 5 kg.',
          '**One volume.** A real unstirred tank sours near its inlet: the thesis read from 4.5 to 6.8 at the bottom and 6.2 at the top, on one day. The book stops at {bookLimit}, and the thesis only tried 5 kg.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 6
  {
    id: 'what-the-gas-can-do',
    title: l('Ce que ce gaz peut faire', 'What this gas can do'),
    summary: l(
      'Le mélange avec l’air, un poison que le nez cesse de sentir, le manque d’oxygène, une flamme qui se voit mal, et les germes : ce que ce lab ne peut pas rassurer.',
      'The mix with air, a poison the nose stops smelling, the lack of oxygen, a flame hard to see, and the germs: what this lab cannot reassure about.',
    ),
    body: [
      l(
        'Le méthane dans l’air explose entre 5 et 15 %. Pour un biogaz à 50 % de méthane, dans de l’air saturé, un essai français a mesuré 10 à 24 %, et d’autres sources écrivent 6 à 12 %. Aucune de ces plages n’est une limite sur laquelle compter. Le risque est dans les endroits fermés, quand l’air rencontre le gaz : au début, ou quand on vide une cuve. La thèse n’a relevé aucune explosion en Tanzanie, dans des bâtiments très ouverts : cela ne dit rien d’une cuisine fermée.',
        'Methane in air explodes between 5 and 15 %. For a biogas at 50 % methane, in saturated air, a French test measured 10 to 24 %, and other sources write 6 to 12 %. None of these ranges is a line to rely on. The risk lies in closed places, and at the moment air meets gas: at the start, or when a tank is emptied. The thesis noted no explosion in Tanzania, in very open buildings: that says nothing of a closed kitchen.',
      ),
      l(
        'L’hydrogène sulfuré sent l’œuf pourri dès 0,008 ppm. Son odeur faiblit, puis disparaît vers 100 ppm ; vers 500 ppm, il tue d’un coup, selon le guide français. L’odeur n’est donc pas une alarme. Dans ce gaz, sa teneur est inconnue : le capteur de la thèse plafonnait à 100 ppm sur toutes les installations sauf une, et le livre donne de 20 à 20 000 ppm pour le biogaz en général. Plus lourd que l’air, il s’amasse en bas, dans une fosse ou un regard.',
        'Hydrogen sulphide can be smelt from 0.008 ppm, of rotten eggs. Its smell fades, then disappears near 100 ppm; near 500 ppm it kills at once, by the French guide. So the smell is no alarm. In this gas its level is unknown: the thesis’s sensor capped at 100 ppm on every plant but one, and the book gives 20 to 20,000 ppm for biogas in general. Heavier than air, it gathers low, in a pit or a manhole.',
      ),
      l(
        'Le méthane et le CO₂ prennent la place de l’oxygène : personne ne descend dans une cuve ou une fosse, et les secours non formés sont souvent les victimes suivantes. L’accident le plus grave que nous puissions citer n’est pas domestique : à Rhadereistedt, en Allemagne, le 8 novembre 2005, une fosse industrielle dans un hall fermé, des déchets d’abattoir, 4 morts, une douzaine de pompiers touchés. Une flamme longue et jaune dit qu’il y a du monoxyde de carbone dans la cuisine : pour ce brûleur, nous n’avons trouvé aucun chiffre.',
        'Methane and CO₂ take the oxygen’s place: nobody goes down into a tank or a pit, and untrained rescuers are often the next victims. The worst accident we can cite is not domestic: at Rhadereistedt, Germany, on 8 November 2005, an industrial pit in a closed hall, slaughterhouse waste, 4 dead, about a dozen firefighters affected. A long yellow flame says there is carbon monoxide in the kitchen: for this burner we found no figure.',
      ),
      l(
        'Lancez « De l’eau dans le tuyau ». Quelques décilitres, et la flamme faiblit, puis meurt, avec une cloche pleine qui rend son gaz par le bord. Une flamme morte laisse sortir le gaz si le robinet reste ouvert : une étude voisine juge probable que des flammes se soient éteintes sans que personne le voie. Enfin, l’effluent : à cette température, dit le livre, la digestion ne peut pas assurer l’inactivation des virus, bactéries et parasites.',
        'Run “Water in the hose”. A few decilitres, and the flame weakens, then dies, with a full bell giving up its gas over the rim. A dead flame lets gas out if the tap stays open: a neighbouring study finds it likely that flames went out with nobody seeing. Then, the effluent: at this temperature, says the book, digestion cannot ensure the inactivation of viruses, bacteria and parasites.',
      ),
    ],
    formula: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O',
    figures: [
      chip('Méthane dans l’air', 'Methane in air', l('5 à 15 %', '5 to 15 %')),
      chip('Le nez ne sent plus l’H₂S', 'The nose loses H₂S', l('vers 100 ppm', 'near 100 ppm')),
      chip('L’H₂S de ce gaz', 'This gas’s H₂S', l('inconnu', 'unknown')),
    ],
    focus: { scene: 'gas-line', part: 'h2s-filter', scenario: 'water-in-hose' },
    quiz: [
      {
        q: l('Pourquoi l’odeur d’œuf pourri n’est-elle pas une alarme ?', 'Why is the smell of rotten eggs no alarm?'),
        choices: [
          l('Elle ne vient jamais de ce gaz', 'It never comes from this gas'),
          l('Elle disparaît vers 100 ppm, le poison restant', 'It fades near 100 ppm, the poison remains'),
          l(
            'Le méthane la couvre dès qu’il atteint 5 % dans l’air',
            'Methane covers it as soon as it reaches 5 % in the air',
          ),
        ],
        answer: 1,
        explain: l(
          '**Le nez cesse de sentir.** Elle faiblit, puis disparaît vers 100 ppm, et le gaz tue vers 500 ppm. Elle peut donc manquer au moment où elle compterait le plus.',
          '**The nose stops smelling.** It fades, then disappears near 100 ppm, and the gas kills near 500 ppm. So it can be missing just when it would count most.',
        ),
      },
      {
        q: l('Une flamme longue et jaune dit surtout…', 'A long yellow flame mainly says…'),
        choices: [
          l('que l’air manque : du CO dans la pièce', 'that air is short: CO in the room'),
          l(
            'que ce gaz est bien plus riche en méthane que d’habitude',
            'that this gas is far richer in methane than usual',
          ),
          l('que la cloche vient de se poser', 'that the bell has just come to rest'),
        ],
        answer: 0,
        explain: l(
          '**Une combustion incomplète**, selon le livre : du monoxyde de carbone et du méthane dans la cuisine. Pour ce brûleur, aucun chiffre trouvé. Le modèle ne calcule pas la couleur de la flamme.',
          '**Incomplete burning**, by the book: carbon monoxide and methane in the kitchen. For this burner, no figure found. The model works out no flame colour.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 7
  {
    id: 'is-it-worth-it',
    title: l('Est-ce que ça vaut le coup ?', 'Is it worth it?'),
    summary: l(
      'Sur 12 installations visitées, 4 tournaient. Une fuite qui peut peser plus que le gaz remplacé, et un tiers de la cuisine : les chiffres, avec leurs conditions.',
      'Of 12 plants visited, 4 were running. A leak that can outweigh the gas replaced, and a third of the cooking: the figures, with their conditions.',
    ),
    body: [
      l(
        'Les 18 et 19 octobre 2008, sur 12 installations domestiques visitées, 4 tournaient. Cinq semaines de réparations par l’installateur plus tard, 10 tournaient. La suite dit pourquoi elles s’arrêtaient : un tube d’entrée cassé ou bouché, trop de nourriture, un robinet de gaz cassé, de l’eau dans le tuyau, et surtout personne à qui demander. Une seule installation mesurée, quatre mois, une thèse de bachelor : tout ce qu’on a de plus solide sur cette machine tient à cela, et son auteur juge le suivi indispensable.',
        'On 18 and 19 October 2008, of 12 household plants visited, 4 were running. After five weeks of repairs by the installer, 10 were. What follows says why they stopped: a broken or blocked inlet pipe, too much food, a broken gas tap, water in the hose, and above all nobody to ask. One plant measured, four months, a bachelor thesis: the firmest things known about this machine rest on that, and its author finds follow-up essential.',
      ),
      lf(
        'Lancez « La cloche pleine ». Personne ne cuisine, et le gaz sort par le bord. Même en marche normale, 22 % de la surface est ouverte, et l’on a mesuré environ 17,5 % de perte sur de plus grandes cuves. Le calcul donne un équilibre vers {rimBreakEven} : au-delà, le méthane perdu pèse plus que le gaz en bouteille remplacé. Il ignore ce que les déchets auraient émis ailleurs, le charbon et le bois, où la cuve s’en sort bien mieux, et son facteur pour le gaz en bouteille est de mémoire.',
        'Run “The full bell”. Nobody cooks, and the gas comes out over the rim. Even in normal running, 22 % of the surface is open, and about 17.5 % loss was measured on larger tanks. The sum gives a balance near {rimBreakEven}: past that, the methane lost outweighs the bottled gas replaced. It ignores what the scraps would have emitted elsewhere, and charcoal and wood, against which the tank does far better, and its factor for bottled gas is from memory.',
      ),
      lf(
        'Que remplace-t-elle ? Le jour mélangé fait 45 minutes de flamme, un tiers de 2,5 h de cuisson : un calcul de la thèse, et {mixMinutes} selon le modèle. Le concepteur annonce 100 kg de gaz en bouteille par an : cela demande environ {lpgKwh} par jour, et 2 kg de restes en donnent {kwhFood}, soit environ {lpgFeed} de restes par jour. Le Low-tech Lab le dit de son bidon : pas d’autonomie en gaz de cuisson. En 2008, 295,6 € de coût, 550 € de vente.',
        'What does it replace? The mixed day makes 45 minutes of flame, a third of 2.5 h of cooking: the thesis worked it out from its two tests. The model finds {mixMinutes}. The designer announces 100 kg of bottled gas a year: that takes about {lpgKwh} of gas a day, and 2 kg of leftovers give {kwhFood}, or about {lpgFeed} of leftovers a day. Elsewhere the Low-tech Lab says it of its drum: no autonomy in cooking gas. The cost was 295.6 € and the sale 550 €, in 2008.',
      ),
      lf(
        'Une revue d’autres petits digesteurs avance des pertes jusqu’à 40 % et un équilibre de 3 à 51 %, avec peu de données ; une autre étude mesure en moyenne 15,9 % de gaz relâché sur 53 cuves à dôme fixe, avec un grand écart. L’étude voisine, à 98 L par kilo humide, reste sous ce que trouve le modèle, {schoolYield}, et une perte plus forte que mesurée peut l’expliquer. Nous ne concluons pas : ces chiffres n’ont pas de réponse commune, et en France ou en Suisse, ce sont ceux du modèle seul.',
        'A review of other small digesters puts losses at up to 40 % and a balance at 3 to 51 %, with few data; another study measures a mean of 15.9 % of gas vented on 53 fixed-dome tanks, with a wide spread. The neighbouring study’s yield, 98 L per wet kilo, stays below what the model finds, {schoolYield}, and a loss greater than measured is one possible reason. We draw no conclusion: these figures have no common answer, and in France or Switzerland they are the model’s alone.',
      ),
    ],
    formula: 'CH₄ × 27 ≷ LPG × 3',
    figures: [
      chip('Visitées, en marche', 'Visited, running', l('12, 4', '12, 4')),
      chip('Après cinq semaines', 'After five weeks', '10'),
      chip('Équilibre de la fuite', 'The leak’s balance', lf('vers {rimBreakEven}', 'near {rimBreakEven}')),
    ],
    focus: { scene: 'yard', part: 'biogas-plant', scenario: 'full-bell' },
    quiz: [
      {
        q: l(
          'Sur 12 installations visitées, 4 tournaient. Après cinq semaines de réparations ?',
          'Of 12 plants visited, 4 were running. After five weeks of repairs?',
        ),
        choices: [
          l('Toujours 4 : aucune réparation n’a aidé', 'Still 4: no repair helped at all'),
          l('Les 12, sans aucune exception', 'All 12, with no exception'),
          l('10, grâce à l’installateur et son suivi', '10, thanks to the installer’s follow-up'),
        ],
        answer: 2,
        explain: l(
          '**Dix.** Cela dit où est le problème : pas tant dans la machine que dans la formation et le suivi, comme la thèse le conclut. Deux restaient à l’arrêt, dont, si notre lecture est bonne, celle qu’on avait suralimentée.',
          '**Ten.** That says where the trouble lies: not so much in the machine as in training and follow-up, as the thesis concludes. Two stayed stopped, one of them, if our reading is right, the overfed plant.',
        ),
      },
      {
        q: lf(
          'L’équilibre vers {rimBreakEven} dit que la fuite peut dépasser le gaz remplacé. Sous quelle réserve ?',
          'The balance near {rimBreakEven} says the leak can outweigh the gas replaced. With what caveat?',
        ),
        choices: [
          l('Il compare seulement au gaz en bouteille', 'It compares only with bottled gas'),
          l('Il vaut surtout pour un climat très froid', 'It mostly holds for a very cold climate'),
          l('Il compte déjà le bois et le charbon', 'It already counts wood and charcoal'),
        ],
        answer: 0,
        explain: l(
          '**Le gaz en bouteille seulement.** Il ignore les déchets qui auraient émis ailleurs, et le charbon ou le bois, où la cuve s’en sort bien mieux. Son facteur pour le gaz en bouteille est de mémoire : c’est une estimation.',
          '**Bottled gas only.** It ignores the scraps that would have emitted elsewhere, and charcoal or wood, against which the tank does far better. Its factor for bottled gas is from memory: it is an estimate.',
        ),
      },
    ],
  },
];
