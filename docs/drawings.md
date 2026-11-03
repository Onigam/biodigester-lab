# The A3 sheets of the Biodigester Lab

Ten sheets in `src/drawings/`, generated from `src/three/dims.ts`, `src/sim/machine.ts` and `src/data/figures.ts`, pinned by `src/drawings/drawings.test.ts`. The cartouche of each says « pour comprendre, pas un plan à suivre » (`configureDrawings` in `src/drawings/index.ts`). ARTI is named on none. `SHEET_GROUPS` is for `plans.groups` in `src/lab.ts`.

| No.    | Sheet                 | Group    | What it shows                                                                                                  |
| ------ | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| PL-B01 | `general-arrangement` | `plant`  | the yard from above at 1:100, every length starred; the plant from the side at 1:25, the bell full             |
| PL-B02 | `digester-section`    | `plant`  | along the axis at 1:12.5; what the thesis prints and what we estimate in two tables; balloons from the guide   |
| PL-B03 | `bell-and-rim`        | `plant`  | the areas in plan, the scale at 1:5, pressure along the travel from `bellPressure`, the readings in red        |
| PL-B04 | `feed-and-overflow`   | `plant`  | the same section at rest and full, each surface's level from the simulation; the chain of fittings             |
| PL-B05 | `gas-line-schematic`  | `plant`  | in the order of the gas, what was on the measured plant and what comes from elsewhere; what weighs in the line |
| PL-B06 | `food-chain`          | `life`   | the four stages, what the model keeps of them, the pH windows from `MODEL`                                     |
| PL-B07 | `mass-balance`        | `life`   | a day in and out; the thesis beside the model, calendar and steady; two kilos counted dry and wet              |
| PL-B08 | `warmth-and-time`     | `limits` | the rate for four activation energies from `arrhenius`, four climates, a year at Geneva, the heat budget       |
| PL-B09 | `hazards`             | `limits` | the H₂S ladder on a log scale, the gas's figures side by side, where each gathers, no promise                  |
| PL-B10 | `size-comparison`     | `limits` | five machines at 1:25, each from its own spec in `src/sim/machine.ts`, with what is known of each              |

**Order.** The kit lists the sheets group by group, in the order `src/lab.ts` gives the groups: `SHEET_GROUPS` keeps the numbers running, and a test holds it. The list follows research §0.6.

**Numbers.** A length is read from `dims.ts`, a machine's from its spec, a result from `FIG`, `GENEVA_TABLE` or `HEAT_TABLE` through `fig()`; the curves through the simulation's own `bellPressure`, `arrhenius` and the form of its pH window. PL-B07's cells of the calendar's normal litres and yields per kilo, and PL-B04's levels, carry their mark by hand: they are typed from `docs/physics.md` §3.2 or computed on the spot, and **no test holds PL-B07's fourteen**. On PL-B01 the compost's and the caddy's sizes and the tree's crown, and in `sideView` the layers' heights, are typed as symbols of the drawing: no such number is printed. The tests check that no text falls on another or off the sheet, in both languages.

**Drawn with the bell upright:** its tilt is an estimate, and PL-B02 says so. The machine's `sideView` is one function for the four sheets that show it.

**Not shown:** the HomeBiogas class of research §3: its page was a booster-kit listing, research says to check the model, and it was not checked.

**Looked at:** each sheet rasterised by Quick Look, on a square page, no browser. English for PL-B02, B03, B05, B07, B09; French for the others. Moved in that look: every label of the plan, the dimension columns of PL-B02, the leaders of PL-B03. Not seen in the browser, nor at twice the pixels.
