# The slurry of the Biodigester Lab: what follows the model, what is decoration

The lab has no water world: its liquid is the slurry. Rule of `lab-quality.md` §3: wherever the physics says something, the picture follows it.

## Follows the model

| What                             | From the state                                                                                                                                                                    | Held by                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Open ring's surface              | `levelRing`, the overflow's 1.04 m. Its inner edge is the tilted bell's wall                                                                                                      | test: its height                                         |
| Feed riser's surface             | `levelRiser`, **level with the ring**. K6's 1.06 m is the physicist's correction: Fig. 7 draws one level from two bases (physics §7). `FITTINGS.riserLevelDrawn` is for the sheet | test: equal to the ring's                                |
| Surface inside the bell          | `levelInner`, **lower by P/ρg**, 2 cm at 2 mbar. Horizontal however the bell tilts: an ellipse in the tilted bell, not a disc                                                     | test: every vertex at one height, the drop equal to P/ρg |
| Scum, sludge                     | `scumHeight`, `sludgeHeight`, at S5's layering. The scum under the bell, as the research places it                                                                                | scenario sweep                                           |
| Gas space                        | From the surface inside to the bell's closed end. **At rest about 232 L stay**, the top above the slurry                                                                          | test: the model's 232 L; the drawn height                |
| Bubbles, how many, where         | `bubblesRimLph` and `overflowLph` in the ring, `bubblesBellLph` under the bell, the shares exact to a bubble, 2.2 bubbles per L/h on screen, capped at 90                         | test: the share; none when the model makes none          |
| Effluent                         | One pour after each `feedCount`; the bucket fills by what the feed pushes out and is empty at midnight                                                                            | test: filling                                            |
| Trap's water, plug in the hose   | `trapWaterMl`; `hoseWaterMl`, as long each side as the bore says, along the hose                                                                                                  | test: on the hose; by eye                                |
| Relief's dip tube                | `pressureMbar`: 1 cm a mbar. The model has no relief: this is the model's pressure on an estimated device                                                                         | by eye                                                   |
| Liquor's tint, the drop's colour | `sourIndex` tints the liquor, `dropRgb` paints the drop. Physics tags both estimates                                                                                              | test on the drop                                         |

**On another size in Simulation** every one of these is carried into the drawn 1,000 L tank by shares (`asDrawn`, `docs/3d.md` §1): the surface stands at the drawn overflow, the bell at its share of travel, the layers at their share of the depth, and the inside's drop stays the model's P/ρg. In metres the 4,000 L plant's surface stood 76 cm above this tank's rim (QA B2). The figures stay that machine's. Only the drawn machine's picture is a measurement of anything.

## Decoration, listed as such

- **The bubbles' speed and size.** 16 cm/s, 6 to 12 mm, for the eye. No source times a bubble.
- **The pour's length on screen,** 2.4 s, whatever the clock: at the opening's hour per second a real pour would last a frame. Its volume is the model's, its duration is not.
- **The riser's lift during a feed,** up to 5 cm: a real feed lifts it, nothing measures how much. The model holds the riser level.
- **Motes in the drop,** pale specks, for its depth. **The drop's highlights.**
- **The organisms' motion:** its amplitude says « working » or « not », from the rates; no organism's real movement is drawn.
- **Stirring, waves, foam:** none. The surfaces are still: the tank is unstirred (K17).

## Not drawn

The clear layer's real inner structure beyond three layers (S5 has ten at 85 L; the model has the shares). A blocked inlet: the model has none. Local sourness near the inlet: one node (physics §6). The ring's mosquitoes.
