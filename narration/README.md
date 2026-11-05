# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **63 segments each** (`intro`, 4 worlds, 58 parts: yard 10, digester 20, slurry 11, gas line 17), ids `intro`, `scene-<world>`, `part-<id>`, no lesson segments. **The audio exists in both languages, in the local voice, checked by transcription and not yet by a human ear.** This lab uses the local voice (`--engine voicebox`, profiles `Onigam narrateur FR` and `EN`, 0 credit, the Voicebox application open); the session that orchestrates the lab generates it after these checks, and the agent that writes this script never does.

Check the length without generating anything (`HOME=<empty dir>` keeps the tool from even opening a key file):

```
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/en.json --out public/audio/en --dry-run --engine voicebox
```

## Budget (spoken characters, cues removed)

| Language | Total  | Intro | Worlds                                             | Parts  | Longest parts                                                            |
| -------- | ------ | ----- | -------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| French   | 23,947 | 2,391 | 2,847 (yard 700, digester 724, drop 669, line 754) | 18,709 | `fatty-acid-pool` 536, `blue-flame` 519, `rim-gap` 458, `half-brick` 451 |
| English  | 22,458 | 2,286 | 2,713 (yard 662, digester 672, drop 654, line 725) | 17,459 | `blue-flame` 484, `fatty-acid-pool` 454, `h2s-filter` 438, `rim-gap` 431 |

The ceiling is 30,000 per language; the research said about 22,000, the series aims for 17,000 to 24,000 (`src/narration.test.ts` holds 19,000 to 24,000). `generate.mjs` refuses a segment over 2,500 characters. The median part is 313 characters in French, 286 in English. The French is at the top of the aim: 58 parts is the most in the series, and it took three passes of cuts to get under 24,000 from a first draft of 35,000. What the cuts took stays on the sheets.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`). The thread is **one grain of rice**, « un grain de riz », the research's own suggestion (§0.6), and rice is in the canteen's leftovers the thesis lists (`scrap-caddy`). Forgotten on a plate, drowned in a bucket, sent down a pipe, cut up, soured, eaten, it comes out as a bubble, lifts a bell, and ends as « un dixième de seconde de flamme ». The intro's roll-call closes on that figure, not on a triumph: the wonder of this machine is how much it takes. It ends on the pot: « Et s’il reste un grain de riz, au fond de l’assiette ? Il connaît le chemin. » 22 segments carry it (a test holds 17 of them).

## The truths, each said once (`src/narration.test.ts` counts them)

| Truth                                                                                    | Where                     |
| ---------------------------------------------------------------------------------------- | ------------------------- |
| Educational reconstruction; one plant, four months, from a thesis                        | `intro`                   |
| Neither a plan to follow nor its designers' product; proves nothing about safety at home | `intro`                   |
| The law: ask your local authority before building anything                               | `intro`                   |
| Where the figures come from; the Sources panel says who said what                        | `intro`                   |
| **The Geneva winter: the model cannot decide.** One figure; no measurement under 25 °C   | `intro`                   |
| The yard does not follow the climate; night falls often                                  | `scene-yard`              |
| Opens cut; the section tool cuts across; an hour a second; the 3D stays the 1,000 L tank | `scene-digester`          |
| Stylised, nothing to scale                                                               | `scene-slurry`            |
| The measured plant's line was a tap, a hose, a stove; the rest comes from elsewhere      | `scene-gas-line`          |
| No oxygen: nobody goes down                                                              | `part-digester-tank`      |
| Air in the bell: the mix can explode; the first gas is not burnt                         | `part-gas-space`          |
| The weight on the bell can slide off, at head height                                     | `part-half-brick`         |
| The plug lets go at knee height                                                          | `part-clean-out-plug`     |
| Larvae in the ring                                                                       | `part-rim-gap`            |
| Germs: the book's sentence; gloves, washed hands, no raw leaves                          | `part-surviving-germs`    |
| Hydrogen sulphide: the nose stops, it kills, **its level here is unknown**, no promise   | `part-h2s-filter`         |
| A low pressure is no reason for ease                                                     | `part-hydraulic-relief`   |
| Gas in a closed room gathers                                                             | `part-wall-sleeve`        |
| Carbon monoxide has no smell                                                             | `part-primary-air-sleeve` |
| Burns: these flames are hard to see                                                      | `part-blue-flame`         |
| The model is hopeful on overfeeding; the field's overfed plant, **as a reading**         | `part-fatty-acid-pool`    |
| The peelings' gas is not retrieved, and not forced                                       | `part-scrap-caddy`        |
| No dinner promised                                                                       | `part-cooking-pot`        |

**The winter comes first, and only there.** The intro asks the question, says the model cannot decide, then names the scenario: a test holds that order, and that no segment before it speaks of winter, and that no other segment names « Un hiver à Genève ». The switch is never given in numbers (it moves with the tank's history, 43/44 or 44/45, `eaHint`): `kilojoule`, `quarante-trois`, `quarante-quatre` are refused, and so are `novembre` and `décembre`, which would sound like a forecast. Cold is only spoken as a cost (`water-butt`) or as what straw does to the sun (`shade-tree`).

**« Nous n’avons trouvé aucune mesure », not « personne n’a mesuré ».** The brief says « nobody has measured », but the sheets and `noticeMarks` say what we found, and that is what we can stand behind. The solar lab refused the same sentence for the same reason. A test refuses it here too.

**Never said, a test refuses each:** that the brick doubles the flame (`part-half-brick` says « la pression double », then the flow's 1.84 against 1.4); that leftovers lose per kilo of solids; a cold tank stopping; 232 L (said « environ deux cent trente litres »); any promise (`sans danger`, `sûr`, `garanti`, `protég…`, `rassur…`); any video (S1 and S2 have not been watched); a level of hydrogen sulphide. Only four segments speak that gas's name, and a test lists them.

**Anonymous.** « la thèse », « le livre », « l’étude voisine », « le manuel de construction », « le tutoriel », « le guide français », and no other source word: a test holds all six and refuses every name of the Sources, ARTI first. « Woese et Fox » and 1977 on the sheet are « à la fin des années soixante-dix, la science les a rangés ». Places stay: Dar es Salaam, Geneva.

**Hedges.** « dans le modèle » is never said. « notre modèle » and « ce modèle » are in 17 segments (a test caps them at 20), where the model is the subject or stands against a source: higher than the solar lab's 14, because here a figure is the model's far more often.

## What the voice says differently from the sheets, by choice

- **The pH is never spoken.** The abbreviation is a coin toss for this voice, and the rule says no abbreviation. It is « l’échelle d’acidité » where a number needs a name (`part-bicarbonate-buffer`), « acide » everywhere else. A test refuses `pH`.
- **« Tourner » is never used for souring.** In this lab's French it means both: « 4 tournaient » is running, « une cuve qui tourne » is souring, and « tourne dès » or « fait tourner une cuve » read aloud as the opposite of what they say. The voice says « s’acidifie » and « très acide », and keeps « tournaient » for running. A test refuses the souring forms.
- **`part-gas-bell`:** the sheet's design says the bell keeps « une pression à peu près constante ». From 1.3 to 3.0 mbar is not; the voice says « sa pression change pourtant avec sa hauteur ».
- **`part-h2s-filter`:** the short says « essayé, et jamais prouvé sur cette installation », which can read as iron wool and clay having been tried on it. The sheet's own text says the thesis tried « a small sulphur trap », and gives it no form. The voice says only that it promises nothing of this filter.
- **`part-fatty-acid-pool`:** lesson 5 states as fact that the overfed plant at pH 4.15 is the one still sour five weeks later. The voice says « si notre lecture est bonne » (research §11, line 1).
- **`part-cooking-pot`:** the flame's sheet says « elle cuit un repas ». The voice keeps to the pot's sheet: « ce labo ne promet pas un dîner ».

**Figures spoken that no sheet prints:**

- **« Un dixième de seconde de flamme »** (`intro`, `part-blue-flame`). **Ours.** A cooked grain of rice, a few hundredths of a gram (an estimate of this script: 0.06 g in the test, no source), at the 32 minutes a kilo of `FIG.minPerKgFood`: 0.115 s. Said with « environ » and « faites le compte ». The lead or the owner may want it weighed: it is the thread's punchline.
- **« À hauteur de tête »** (`part-half-brick`): the bell's top at rest stands 1.69 m above the ground on its pallet and pad, by `src/three/dims.ts` and `PLANT_1000`, and higher as it climbs. A test holds the sum. The sheet says only that the brick slides off a leaning bell.
- **« Un tiers de l’énergie du gaz du jour »** (`part-water-butt`): the sheet's own « about a third », 0.46 against 1.47 kWh, a test holds it. **« Près du double »** (`part-gas-bubble`): 1.47 against 0.75 kWh, the same.

## Cues (103 in each language, the same in both)

- Totals: frame 32, flows 24, explode 12, home 11, scene 7, mode 6, isolate 6, cutaway 4, select 1. Every « on » has its « off » before the end of the segment.
- Intro (24): `home`, `frame` the caddy; `scene` to the line and its bucket; `scene` to the tank and its pipe; `scene` to the drop, three `frame` along the chain; back to the tank; to the line, `frame` burner and pot; to the yard, `frame` the bed, `home`; `mode` hops assembly, install, sim, lessons, plans, explore; `scene:yard`, `select:none`.
- Worlds: `home` first, then at least five parts. `flows` in all four; `cutaway` in the digester; `explode` in the drop. No x-ray in a world segment.
- Parts: no camera cue. `flows` on `vegetable-bed`, `hose-run`, `rim-gap`, `feed-funnel`, `inner-feed-pipe`, `overflow-pipe`, `food-particle`, `mincer`; `explode` on `feed-tee`, `pallet`, `scum-layer`, `flame-arrester`, `pot-stand`; `isolate` on `digester-tank`, `acetogens`, `blue-flame`; `cutaway` on `rim-gap`.
- **The flame by a tool, not a button.** `src/lab.ts` defines no `narration.onCue`, so no cue can press `lightBurner`. But `gasline/scene.ts` shows the flame when it stands alone, lit or not, as its tip says: `part-blue-flame` opens on `[[isolate:on]]`, so it shows at that word whatever the clock. A test reads that line of the scene. Its height is then fixed, and the voice says it is not measured.
- **The section from above.** The cut is across, and home sees it at a low angle: `scene-digester` frames `rim-gap` (48° up) in the same batch as `[[cutaway:on]]`, then goes `[[home]]` for the bell. `part-rim-gap` opens on it. A test holds the angle.
- **The clock.** It runs at an hour a second, a day in 24 s. No sentence says « regardez » about a movement at a given word, none promises daylight (`plein soleil` is refused), and `scene-yard` says that night falls while we talk. The intro's flame is « le moment venu ». The line's gas dots show only while the burner burns, and `scene-gas-line` says so; the scraps' dots always run.
- No flows under explode, nor under x-ray or the section in `digester`: the scenes hide the dots there, and a test refuses it.

## Checked

`npx vitest run src/narration.test.ts`: the contract, ids, scopes, titles (a part's from `part-ids.ts`, a world's from its overview) and starting worlds, known cues on real ids, frames in the current world, what is switched on is switched off, tools per world, tools named per world, no camera cue in a part, 35 characters between camera moves, the hops and counts of the intro, each of 35 truths once in its place, the winter's order, what is refused everywhere, hydrogen sulphide's four segments, **23 rows of spoken figures held to today's `src/data/figures.ts`** and **22 rows of reported figures held to what the sheets print** (so a change names the segments to rewrite), the voice's own sums, the hedges, the scenarios and the slider against the panel's own words, the flame's isolate, the grain of rice, no name, the six source words, spoken text only, the words the voice misreads, sentences at most 135 characters, exclamations and questions, no « tu », British English, the budget, the same cues in the same order within a tenth of the segment between languages, and the manifests, in the local voice. **Skipped, one:** the seven-word run against private transcripts: **none exists for this lab** (`~/.cache/lab-review/research/biodigester-lab/` is absent, S1 and S2 unwatched). A one-off count against the series' scripts on this Mac finds seven-word runs only in the intro's shared sentences (« cliquez sur une pièce : sa fiche s’ouvre… », « une dernière chose : ce laboratoire est une reconstitution pédagogique », « ni un plan à suivre ») and, in English, « from left to right in the order of the » in `scene-gas-line`.

**Rays (`the voice points at what can be seen`):** the solar and gravity labs' method. Each cue flown as `Stage.frameParts` flies it, on the default machine in the opening state; each framed part reached by at least half the rays, from no farther than home; each of the 58 parts seen from its own framing with what its segment switches on at its start. What is transparent stands in nothing's way, as in the lab's `raysToPart`, so the drop's surface does not count. Exceptions, each named in the test: `gas-bell`, `gas-space`, `rim-gap`, `scum-layer`, `biogas-burner`, `blue-flame` at 0.4 (closed solids show at most half their surface to one eye; each measured 0.42 to 0.48), `shade-tree` framed up to 1.1 × home (7.4 m tall).

`node ~/Dev/lab-kit/tools/narration/tone-stats.mjs narration/fr.json`, against Pelton's script:

| Measure                      | French | Pelton | English | Pelton's English | Why they differ                                                                                                                                    |
| ---------------------------- | ------ | ------ | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Average sentence, characters | 65     | 79     | 61      | 69               | Subtitles cut at sentence ends: the rule since Pelton is short sentences. The same band as the solar lab (69, 65) and the mass heater (68, 63)     |
| Sentences over 120           | 2      | 35     | 0       | 2                | Pelton's 35 are its one departure from its own rule                                                                                                |
| Exclamations per 1,000       | 0.71   | 0.80   | 0.76    | 0.83             | Held in the style page's band. 17 in all: this lab has less to cheer, and a joke would sit badly next to a warning                                 |
| Questions per 1,000          | 0.58   | 0.29   | 0.62    | 0.35             | Twice Pelton, like the mass heater (0.53, 0.56). 14 in all: this lab keeps asking what is known. A test holds 0.65, a little above the sibling 0.6 |
| « tu », digits or symbols    | 0      | 0      | 0       | 0                |                                                                                                                                                    |

## What only a look can confirm (no browser was used)

The rays say a part can be reached, not that it reads. To look at: `part-blue-flame` under isolate, a flame alone in the air, with no burner under it; `part-gas-bell` and `part-digester-tank`, framed from behind the machine (their `viewDir`), where « notre bulle arrive dessous » cannot be seen and the tank's open top is at 18°; `scene-digester`'s section from `rim-gap`'s framing; the drop's parts under `isolate` and `explode`; `scene-gas-line`'s pair frames, `hydraulic-relief,h2s-filter` and `flame-arrester,pressure-gauge`; the yard at night, where the voice can land on any part, since the clock does not stop for it.

## The clock under the voice (no audio or cue changed)

`src/voice-clock.ts`: while the voice speaks with the yard on screen, the clock stops by day; `scene-yard`'s last sentence, « Et si la nuit tombe pendant qu'on en parle », is the one place it runs on to the night, read from the captions, and no part is named after it. In the tank, the drop and the line the clock runs, also inside `intro`, since the voice shows the bell rising there. The sentence's second half, « ici, les journées sont très courtes », stays as generated: the review's M1 reads it as a joke a listener can take for a fact about Dar es Salaam. It is for the owner's ear, and the next generation.

## To listen for (not measured, a script cannot tell)

Start with `fr/intro`, `fr/scene-slurry` and `en/part-rim-gap` (below, under « After generation »), then `part-methanogens`, `part-h2s-filter`, `part-half-brick`. **Not in the script at all,** so no risk: biodigesteur, digestat, kilojoules par mole, pH, Low-tech Lab, H₂S and CO₂ as letters (titles only: `Filtre à H₂S` is not spoken).

French: méthanogènes, acidogènes, acétogènes, hydrolyseurs (`scene-slurry` says all four in a row); archées (the « ch » of « chat »); **effluent** (the final « -ent » is sounded here, and silent on a verb); parpaing, demi-parpaing; manomètre; millibars; bouillie; acétate; hydrogène sulfuré; monoxyde de carbone; « œuf pourri » (singular, the « f » sounded); « parties par million »; « un virgule quatre-vingt-quatre », « deux virgule zéro trois », « six virgule trente-cinq »; **plus** (« plus rien », « plus lourds », « plus d’énergie »: said or not said /s/); « dix litres », « six litres » (silent final consonant), « cent vingt-six », « huit »; Dar es Salaam; énergie d’activation; cure-dents. **Avoided on purpose, a test refuses them:** fils, couvent, content, portions, président.

English: methanogens, acetogens, hydrolysers, archaea (« ar-KEE-a »), acetate, effluent, slurry, scum, bund, caddy; hydrogen sulphide; « one point eight four », « two point zero three », « six point three five »; « parts per million »; Dar es Salaam; **estimates** (a noun here, « our estimates »: the verb is the commoner reading); **leaves** (noun and verb both occur); « used as it comes ». **Avoided on purpose, a test refuses them:** wind, wound, tear, lead, read (it says « showed », « found »), live and lives, close (it says « shut »), produce, content, record, present, object, refuse, separate, bow, row, sow, sewer, minute in the singular.

Whether « Notre grain passe sans frapper », « Ne l’applaudissons pas » and « un dixième de seconde de flamme » land: an ear's business. Nobody has listened to anything yet.

## After generation

`src/lab.ts` asks for `audio/{lang}/manifest.json` and `scripts/check-narration.mjs` is in the build. The test holds that the manifest's `model` is `qwen3-tts-1.7B`.

**Checked on 2026-11-04 by measure and transcription, not by ear.** No credit was involved: 126 clips in the local voice, 23 minutes in French, 22 in English.

| Measure                                      | French                            | English                                  |
| -------------------------------------------- | --------------------------------- | ---------------------------------------- |
| Whisper `small` against the script, mean     | 0.966                             | 0.992                                    |
| Lowest, none under 0.85                      | 0.891 `part-biogas-burner`        | 0.901 `part-rim-gap`                     |
| Level, all clips                             | −27.5 to −27.4 LUFS, peak −7.7 dB | −27.5 to −27.4 LUFS, peak −7.8 dB        |
| Rate, median, none 25 % away                 | 17.33 characters a second         | 17.00; widest `part-vent-opening`, −17 % |
| Longest silence inside a clip                | 0.61 s                            | 0.98 s, `scene-yard`                     |
| Subtitle gaps, disorder, cues outside a clip | 0                                 | 0                                        |
| Clip ends harder than the voice's own pauses | 0                                 | 0                                        |

**Redone, because the first take ended badly.** On seed 43: `fr/part-methanogens` and `en/part-methanogens` (the file stops while the voice still sounds), `en/intro` and `en/part-scum-layer` (a hard stop). On seed 45: `en/part-yard-pad` (« would go », a hard stop on 42, 43 and 44).

**One sentence reworded, `en/part-digester-tank`.** « That is all! Black, it takes the sun » came back as « that is all black » on eight seeds of nine, the joke gone. It now says « That is all! It is black, and takes the sun », heard with its pause, on seed 44.

**Every gap was read, and each doubt heard again** on `medium`, then on `large-v3-turbo` where those two left it open. No spoken figure comes back as another figure. What remains are homophones and Whisper's own habits. « Thanks for watching » and « Thank you very much » at the ends of `en/part-rim-gap` and `en/part-hydraulic-relief`, and a second « peace » in `en/part-overflow-pipe`, are gone on `medium`. A « that » in `en/intro` lies in a silence at −70 dB.

**The words to watch.** Heard as written, or respelled with the same sound (« méthanojènes »): méthanogènes, acidogènes, acétogènes, hydrolyseurs, millibars, « un dixième de seconde », « six virgule trente-cinq », and their English. Heard as a homophone, which says the sound is right: archées as « archers » (the « ch » of « chat »), effluent as « effluant » (the final « -ent » sounded), parpaing as « parpin ».

**What only an ear can settle:**

- `fr/intro`: « Dar es Salaam » comes back as « Dar et Salam » on two models, and likewise in `scene-yard` and `part-shade-tree`. It may be the usual French sound of it. « Sept leçons » comes back as « cette leçon »: a true homophone, which no measure can separate.
- `fr/scene-slurry`: the four names in a row. A model that spells them right says nothing of the stress or the rhythm.
- `en/part-rim-gap`: « flaw » comes back as « floor », twice on `small`, once on `medium`, once on `large-v3-turbo`. Without a sounded « r » they are one word, and only the subtitle tells them apart. Left as it is.
- Heteronyms, which a transcript cannot see: « plus » with or without its /s/; « estimates » and « leaves » in English. And the tone, the pauses, whether « Ne l’applaudissons pas » lands.
