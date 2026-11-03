# Data of the Biodigester Lab (data role)

58 part sheets, two guides, four overviews, seven lessons, the Sources and the lab's interface strings, bilingual `l(fr, en)`, written together. The machine is a reconstruction of the plant one thesis drew and measured; **ARTI is named in the Sources panel only** (`noticeMachine`, the source list). Everywhere else it is « la cloche flottante à deux cuves », « the two-tank floating bell ».

## Files

| File                                 | What                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `src/data/parts.ts`                  | `PARTS`: the 58 sheets in the order of `src/three/part-ids.ts`, with the dimension rows appended                      |
| `src/data/parts/yard.ts`             | 10 sheets of `yard`                                                                                                   |
| `src/data/parts/digester.ts`         | 20 sheets of `digester`                                                                                               |
| `src/data/parts/slurry.ts`           | 11 sheets of `slurry`                                                                                                 |
| `src/data/parts/gasline.ts`          | 17 sheets of `gas-line`                                                                                               |
| `src/data/parts/dim-specs.ts`        | lengths of a sheet, **read from `src/three/dims.ts`**, nothing typed                                                  |
| `src/data/assembly.ts`, `install.ts` | the guides: 20 and 10 steps. Each ends on its origin. No torque, tool list or duration                                |
| `src/data/guide.ts`                  | a re-export for the template's `src/lab.ts`; **to delete once the lead has wired the lab**                            |
| `src/data/overviews.ts`              | `OVERVIEWS`: title and text per world, for `scenes[i].overview` with the `go…` actions                                |
| `src/data/lessons.ts`                | `LESSONS`, see `docs/lessons.md`                                                                                      |
| `src/data/sources.ts`                | `SOURCE_GROUPS`, `MAIN_VIDEO`, `sourcesPanel(ctx)`: `about: sourcesPanel` in `src/lab.ts`                             |
| `src/data/chapters.ts`               | `VIDEO_ID` for `video: { id }`, `CHAPTERS` **empty**: nobody has watched the videos yet                               |
| `src/data/figures.ts`                | `FIG`: every figure that is not reported, with its unit and status; `GENEVA_TABLE`, `HEAT_TABLE` for the sheets       |
| `src/data/part-helpers.ts`           | `lf` fills `{placeholders}` with number, unit and mark; `sp`, `maint`, `v`                                            |
| `src/i18n/ui.ts`                     | `LAB_STRINGS`: only the lab's own. The template's keys stay at the end until the lead wires the lab, then they can go |

## The marks

**No mark**: reported by a source of `docs/research.md`, typed in the text, checked against `REPORTED` in `data.test.ts` and `lessons.test.ts`, each with its source. **†**: computed, by arithmetic on reported figures or by the model where a plant was measured; the sentence says which. **\***: an estimate of this lab, the sources being silent, or the same model where no plant was measured: below about 25 °C, or anywhere but Dar es Salaam. That is the meaning of `TAG_NOTE` in `src/sim/texts.ts`, with arithmetic added to the dagger, as the scenarios' « 2,03 mbar † » already have it.

`lf` adds the mark by construction; a test catches a number typed by hand with a mark, and a marked number that is no figure. `figures.test.ts` holds the figures against the simulation: `steady`, `thesisRun`, `firstWinter` row by row, `heatBudget`, `mealResponse`, `souringFeed`, `rescueRun`, `flameOutRun`, and redoes the arithmetic.

## What departs from the research, and why

- **K31: the thesis does give a cause.** Research and physics say the plant at pH 4.15 has no cause in the thesis. Table 25 of S5, read directly, remarks « Overfed » on that row (CBS 17, a 2,000/1,500 L plant), and p. 49 says that the plant « heavily overfed » was still at pH below 5 five weeks later, its gas not combustible. Lesson 5 says so. Neither the 2,000/1,500 nor the « below 5 » is printed, since research does not hold them. For the research role.
- **The order of the assembly.** Research §4.5 lowers the bell at step 3. Here it comes at step 11, after the feed and the overflow: the inner pipe cannot be seen, nor fitted, under a bell already there, and S9's own §4 uses the small tank to take the measure of the opening, not to float it. Step 2 says so. S9 gives no order of its own for that.
- **Every part of `digester` is in a step, and the pot, the flame, the bell's space and the three layers too.** Research §4.5 leaves them to « appear by themselves ». The kit shows what no step names as solid from step 1: slurry would stand in the air before its tank, and a pot over an absent burner. So step 10 is the level, step 11 brings the gas space and the rim, step 13's scale brings the brick, step 20 brings the pot and the flame.
- **21 candidates became 20:** the tee and the plug share step 5.
- **45 %** methane as the least that burns is reported by both S5 and S8. `MODEL.leanFlame` calls it an estimate: for the physicist.
- **Installation step 4** has `kitchen-house`; `vent-opening` moves to step 5, the leak search, so that each step plays in one world.

## Sources read beyond the research

On the rule « before a visitor reads a figure, re-read » (research §9): S5 (the plant, feeding, the survey, the discussion), S8 (§3.1, the stoves, floating drum, water traps, hygiene), S7 (flame, pots, water in the pipes), **all 15 mirror pages of S9**, S3 (FR), S10, S11, S17, S31's record, S32's two pages. Read as text, in the scratchpad, none kept in the repository, no image. **What that gave, with no number the research does not hold:** the bottle funnel; the snails and dogs; the mincer's blunt blades and the blender; the Tipp-Ex scale and why no meter would do; tape rather than glue; the washers of the feed's wall fitting; the outlet's small trapped volume; the limiter's X on an iron belt; S7's flames going out unnoticed, the pot's fit, the stoves' damage after a year; S8's reading of a yellow flame. **Not reached:** S18 (403 to me; its ladder is not quoted, S15's is), S15 itself at this URL (research read it), S19, S27, S13, S14. **One date used that the research does not hold:** the installation on 30 July 2008 (S5 §3.1.1, assembly step 1). **Numbers I read and did not use, for the lead to weigh:** S8's stoves often designed for 8 to 16 mbar; S5's 15 m between tank and burner, its 20 L bucket and 5 L ration pail, its 4 days in closed buckets; S5's 5 L sampled; S5's 14 % with better-fitting tanks.

## Said once

Educational reconstruction, ARTI, the law: the Sources (`disclaimer`, `noticeMachine`, `legal`), held by a test; **the law is the one plain sentence of research §7.2**, no status named. Not a plan to follow: step 1 of each guide, `safety` in the Sources, the title block of the sheets. The marks: the `yard` overview, in full in the Sources. Stylised: the `slurry` overview, held by a test. Opens cut: the `digester` overview. The yard not following the climate: the `yard` overview, and `siteHint` for the panel. The other sizes having no 3D: the `digester` overview, `drawnHint` for the panel, sheet PL-B10, lesson 4 where the drum is named. Air mix: `gas-space`, the leak search, lesson 6. H₂S: `h2s-filter`, lesson 6. No oxygen: `digester-tank`, the seeding, lesson 6. CO: `primary-air-sleeve`, `vent-opening`. Burns: `blue-flame`. Germs: `surviving-germs`, `vegetable-bed`, `overflow-bucket`. Mosquitoes: `rim-gap`. Pressure no reason for ease: `hydraulic-relief`.

**No wording promises safety:** tests ban « safe », « sans danger », « no risk », « harmless », « sûr », « garanti », « clean water ». « cela ne prouve rien sur la sécurité » is the owner's accepted sentence and says the opposite. S5's lines that no explosion was reported and that desulphurisation is not needed appear only to say they are not repeated as an assurance (`h2s-filter`, PL-B09, lesson 6).

**Not a build plan:** no cut line, no torque, no tool list, no duration, no dose. A test bans « il faut », « you must », « you should », « percez », « drill ». Steps are told in the past, or as what a source did.

## From the modeler's notes

| Note                                                      | Where it is said                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `digester` opens cut, the section tool cuts the other way | the `digester` overview, held by a test                                   |
| `slurry` is stylised                                      | the `slurry` overview, once                                               |
| `blue-flame` has nothing to outline while off             | its tip; `lightBurner` in `src/i18n/ui.ts` for `partActions`              |
| Limiter from another build, scaled                        | `float-limiter`, step 14                                                  |
| Trap, relief, filter, arrester: estimates, not measured   | their sheets, step 15's closing sentence, the `gas-line` overview, PL-B05 |
| The relief's 8 cm, and no relief in the model             | `hydraulic-relief`, step 17                                               |
| Saddle and bracket, no source                             | `inner-feed-pipe`, `feed-riser`, steps 4 and 6, PL-B02, PL-B04            |
| Marks read at 1280 only when framed                       | `scale-marks`'s tip                                                       |
| The gauge on its real scale barely moves                  | `pressure-gauge`                                                          |
| The yard stays this yard at Geneva                        | the `yard` overview                                                       |

## What the panel must use

The sheets and lessons name its controls: the words are `slider*` in `src/i18n/ui.ts`, and `eaHint`, `drawnHint`, `siteHint` are written for it. **`src/panels/sim.ts` is still the template's:** a panel that names them otherwise breaks those texts. `lessons.test.ts` holds every capitalised quotation in a sheet against the scenario names, the alarms and those words.

## Choices

**Categories:** the kit has none for what is alive (`docs/kit-requests.md`, 9). **« Bouillie » for the slurry,** « cuve » for the tank, « cloche » for the bell, « anneau » for the open ring, « restes » for leftovers, « épluchures » and « déchets de marché » as the thesis's two names. **« La thèse », « le livre », « l’étude voisine », « le manuel de construction », « le tutoriel », « le guide français »** are the six ways the sheets name their sources; each is defined in the Sources panel, in those words. **Timestamps:** none, no transcript exists. **The kit's X-ray** is « Transparence » in French.
