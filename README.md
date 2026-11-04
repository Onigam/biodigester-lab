# Biodigesteur · Biodigester

An interactive 3D lab of a **household floating-bell biodigester**: a 1,000-litre tank holding about 850 litres of slurry, a 750-litre tank turned upside down inside it, floating on the slurry and rising as gas collects, fed two kilos of kitchen scraps and eighteen litres of water a day. It follows the scraps to the flame, shows what lives in the tank, what makes it fail, and what the gas can do. The machine drawn is a reconstruction of one plant that a thesis drew and measured for four months at Dar es Salaam in 2008.

**▶ https://biodigester-lab.onigam.io** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes.

## What is in it

- **Four 3D worlds**: the **yard** (a generic warm yard: the plant on its pad in full sun, the kitchen it feeds, the water butt, the overflow bucket, the beds, the compost, a mango tree whose shade must miss the tank, the sun following the place and the month), the **machine** alone, opened along its axis, its bell rising live from the simulation, its three measured layers, the rim where gas is lost made visible, **one drop of slurry**, stylised, the food chain left to right with its colour following the model's pH, and the **gas line**, laid out in the order the gas flows, from the hose to the pot, with the mincer and the bucket where the circle starts. Explode, X-ray, isolate, section, flows, labels.
- **A catalogue of 58 parts**, each with a sheet. **Two guides**, each step ending on its origin: how the machine goes together (20 steps) and how it was installed and run, from the place to the daily feed (10 steps).
- **Seven lessons with fourteen questions**, each opening on a scenario: who makes the gas, wet or dry, the bell, warmth and time, feed or sour, what the gas can do, is it worth it.
- **A simulation** (a pure, unit-tested model): the chain from food to methane with the acids and the buffer between them, the bell whose pressure changes with its height, the hose and the burner, the heat and the sun at four sites, five sizes of machine and twelve scenarios.
- **Ten A3 sheets** generated from the same dimensions as the 3D model and from the model's results.
- **A spoken guide** for the introduction, each world and each part, in both languages: the scripts in `narration/`, the audio in `public/audio/`, in a local voice.

## What is real and what is not

- **The measured day.** On two kilos of leftovers the model gives 278 L of gas a day on the thesis's own calendar, against 289 measured, at 57.8 % methane against 56.8 %. That proves little: every kinetic estimate, moved over its range, leaves it between 276 and 283 L. It speaks for the feed's potential and the open rim, not for the kinetics.
- **What it does not retrieve.** Peelings: 64 to 76 L a day against 126 measured, and the thesis's own chemistry of that feed holds too little methane to reach its figure, so nothing forces it there. The half-brick gives 2.03 mbar exactly, and the flow 1.37 times where the thesis measured 1.84. The pH under load stands 0.2 to 0.3 high. Each is said where it matters, with its cause when there is one.
- **The winter it cannot decide.** Nobody we read measured a plant of this kind below about 25 °C. So France, Switzerland and any winter are this model alone, and a bare tank's winter at Geneva turns on one figure, the activation energy, for which the one clue comes from a summary: the tank holds up to 43 kJ/mol and sours from 44, and the clue stands near 44. The slider is beside the scenario.
- **What appears by itself.** « Feed more, get less » is no switch: above what the methanogens can eat, the acids take the buffer, the pH takes the methanogens, and the gas stops within a day of having tripled. The model holds one mixed volume, so a real, unstirred tank is expected to give way sooner than its figures.
- **Marks.** Every figure is marked: no mark, from a source; † computed, from published figures or by the model where a plant was measured; \* an estimate, or the same model where none was. The H₂S in this gas stays unknown: the only sensor that read it stopped at 100 ppm.
- **An independent educational reconstruction**, not an official drawing and not a product of its designers, with whom it has no link, no logo, and no footage from any source. **It is not a plan to follow.** This gas can explode in air, it holds a poison the nose stops smelling, it takes the oxygen's place in a tank or a pit, and its flame is hard to see. Nothing here shows that a build would be safe or allowed: such an installation is subject to the rules of your country, ask your local authority before you build anything.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics, with its food chain in `sim/bio`; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), the 3D, the setting and the slurry, data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to every source are in the app, in _Sources_.

---

## Français

Un labo 3D interactif d’un **biodigesteur domestique à cloche flottante** : une cuve de 1 000 litres qui tient environ 850 litres de bouillie, une cuve de 750 litres retournée dedans, qui flotte sur la bouillie et monte à mesure que le gaz s’amasse, nourries de deux kilos de restes de cuisine et de dix-huit litres d’eau par jour. Il suit les restes jusqu’à la flamme, montre ce qui vit dans la cuve, ce qui la fait tourner et ce que le gaz peut faire. La machine dessinée est la reconstitution d’une installation qu’une thèse a dessinée et mesurée pendant quatre mois à Dar es Salaam en 2008.

**▶ https://biodigester-lab.onigam.io** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le labo est en construction : `public/lab.json` reste à `building` tant que le niveau de la série n’est pas atteint et que le propriétaire n’a pas dit oui.

**Ce qu’il contient.** Quatre mondes 3D (une cour générique en climat chaud, avec la cuisine, la réserve d’eau, le seau de trop-plein, le potager, le compost, un manguier dont l’ombre doit manquer la cuve et un soleil qui suit le lieu et le mois ; la machine seule, ouverte le long de son axe, la cloche qui monte en direct depuis la simulation, ses trois couches mesurées et l’anneau par où le gaz se perd ; une goutte de bouillie, stylisée, la chaîne du vivant de gauche à droite et sa couleur qui suit le pH du modèle ; la ligne de gaz, dans l’ordre du gaz, du tuyau à la casserole, avec le hachoir et le seau où le cercle commence) ; un catalogue de 58 pièces avec leur fiche ; deux guides, chaque étape finissant sur son origine : comment la machine s’assemble (20 étapes), comment elle a été posée et nourrie (10 étapes) ; sept leçons et quatorze questions, chacune ouverte sur un scénario ; une simulation pure et testée, quatre lieux, cinq tailles de machine, douze scénarios ; dix planches A3 générées à partir des dimensions du modèle et de ses résultats. Un guide parlé pour l’introduction, chaque monde et chaque pièce, en deux langues : les scripts dans `narration/`, l’audio dans `public/audio/`, dans une voix locale.

**Ce qui est réel et ce qui ne l’est pas.** Sur deux kilos de restes, le modèle donne 278 L de gaz par jour sur le calendrier de la thèse, contre 289 mesurés, à 57,8 % de méthane contre 56,8 %. Cela prouve peu : chaque estimation de cinétique, déplacée sur toute sa plage, le laisse entre 276 et 283 L. Il ne retrouve pas les épluchures, 64 à 76 L par jour contre 126 mesurés, et la chimie que la thèse imprime pour cette nourriture ne contient pas assez de méthane pour atteindre son chiffre : rien ne l’y force. Le demi-parpaing donne 2,03 mbar exactement, et le débit 1,37 fois là où la thèse a mesuré 1,84. Le pH sous charge reste 0,2 à 0,3 trop haut. **Nous n’avons lu aucune mesure de ce genre d’installation sous 25 °C environ** : la France, la Suisse et tout hiver sont ce modèle seul, et l’hiver d’une cuve nue à Genève tient à un chiffre, l’énergie d’activation, dont le seul indice vient d’un résumé : elle tient jusqu’à 43 kJ/mol, tourne dès 44, et l’indice tombe vers 44. Le curseur est à côté du scénario. « Nourrir plus, obtenir moins » n’est pas un interrupteur : cela apparaît de soi-même, et comme le modèle n’a qu’un volume mélangé, une vraie cuve non brassée devrait céder plus tôt que ses chiffres. Chaque chiffre porte sa marque : sans marque, d’une source ; † calculé, à partir de chiffres publiés ou par le modèle là où une installation a été mesurée ; \* estimé, ou le même modèle là où aucune ne l’a été. L’H₂S de ce gaz reste inconnu : le seul capteur qui l’a lu s’arrêtait à 100 ppm.

**Reconstitution pédagogique indépendante**, ni plan officiel ni produit de ses concepteurs, sans lien avec eux, sans logo, sans aucune image reprise d’une source. **Ce n’est pas un plan à suivre.** Ce gaz peut exploser dans l’air, il contient un poison que le nez cesse de sentir, il prend la place de l’oxygène dans une cuve ou une fosse, et sa flamme se voit mal. Rien ici ne montre qu’une construction serait sûre ou permise : une telle installation relève des règles de votre pays, renseignez-vous auprès de votre autorité locale avant de construire quoi que ce soit.

`npm install` puis `npm run dev` pour lancer en local ; chaque push sur `main` déploie sur Vercel. Les crédits et les liens vers toutes les sources sont dans l’application, dans _Sources_.
