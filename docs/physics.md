# Physics of the Biodigester lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models the machine of research §0.1: a 1,000 L tank with about 850 L of slurry and a 750 L tank upside down inside it, floating on the slurry, rising as gas collects, fed kitchen scraps and water twice a day. The machine is the research's recommendation, which the owner accepted on 2026-11-03 (research §8, Q1), and every number of it lives in one place, `src/sim/machine.ts`.

The gas, the pH, the bell, the collapse of an overfed tank and the death of a cold one are **outcomes** of these equations, not curves drawn.

**Nothing is tuned to a reported figure.** The inputs were set before the comparison. What moved during the work is listed in §7, each with its reason, and only one of them was moved by an outcome: the first fill's buffer and seed. The pins of `src/sim/figures.test.ts` record what the model gives; a pin is not a target.

Words used for a number: **reported** (a source of `docs/research.md`, K or S number), **derived** (computed from reported figures, the computation is next to it), **estimate** (the sources are silent: a choice with its reason), **assumption** (a choice of how to run it), **model** (an output of this simulation). In the data shown to a visitor `†` marks a model result on ground where a plant was measured, `*` an estimate or the same model where none was. `STATE_TAGS` in `src/sim/tags.ts` gives every key of the state its word.

## What the model finds: the short version

| Question                                | Answer of the model                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two kilos of leftovers?                 | **278 L/d** on the thesis's own calendar against 289 measured (−4 %), **57.8 %** methane against 56.8 %, 98 g of methane against 105 g. Hardly a test of the kinetics: every kinetic estimate moved over its range leaves it between 276 and 283 L/d. It says the potential (K45) and the rim are about right (§5)                                                                                          |
| Two kilos of peelings?                  | **Not retrieved.** 64 to 76 L/d against 126 measured. Table 20's own COD holds at most 60 NL of methane a day and the plant caught 75: **no model that respects its feed can reach that figure** (§3.3)                                                                                                                                                                                                     |
| Why more methane in peelings' thin gas? | **The liquid carries off about the same volume of CO₂ either way.** Derived from the figures alone, about 36 NL/d from each. The model's open ring and effluent take 39 and 31 NL/d, on an a priori estimate. Close the ring and the difference between the two gases falls from 11 points to 4. S7 says the same in words (§1.3)                                                                           |
| The half-brick?                         | **2.03 mbar exact.** The flow: **not retrieved**, 1.37 times by an orifice against 1.84 measured (§3.3)                                                                                                                                                                                                                                                                                                     |
| What is the bell's pressure?            | **Not one number.** The wall dips back into the slurry as the bell comes down, so the pressure runs from 1.3 mbar at rest to 3.0 mbar full, 2.14 at mid-travel against a reading of 2, with no fit: a 5 mm wall, the wall the tank's own two dimensions imply (§1.4)                                                                                                                                        |
| Why does the flame die with gas left?   | **On the school's plant, pressure,** as S7 says: 520 to 777 L left against about 500, resting on two estimates. **On this plant, the bell comes to rest** with about 232 L still under it, because it is taller than the liquid is deep (§3.3)                                                                                                                                                              |
| Overfeed?                               | **« Feed more, get less » appears by itself.** At 32 °C a sudden 10 kg/d holds, 11 kg/d kills: the gas triples for three days, then stops within a day. Stopped at pH 6.4, it survives. Stopped at 6.35, a few hours later, it does not. **pH barely warns.** This threshold is above the book's 7.5 kg/d, and a mixed-tank model is expected to be high: a real unstirred tank sours near its inlet (§4.1) |
| Can a soured tank come back?            | **Not by itself, in this model.** About two months at 100 L of water a day, four at 50. A real tank may hold pockets the model cannot (§4.2)                                                                                                                                                                                                                                                                |
| A Geneva winter, bare?                  | **The model cannot decide it.** On 2 kg/d of leftovers the tank holds through winter up to Ea 43 kJ/mol and sours from Ea 44, and **the only clue to Ea is about 44** (S36, from a search summary). At the default of 60 it sours in early December at about 6 °C, or in November if it was started warm in July, and stays dead. **Nobody has measured any of this** (§4.3)                                |
| What would get it through?              | **Half the food holds it** all year, 70 L/d at worst. **No food from November to March** and it returns by itself in April. **Straw alone does not**: it keeps the sun out too, and the cold water remains (§4.3)                                                                                                                                                                                           |
| Can the gas pay for its own heat?       | **Not in a Geneva January.** In straw at 30 °C it asks 1.7 kWh/d, the gas holds 1.4, and a burner returns about half of that. **Through a burner it pays only from June to September, in straw; bare, never** (§4.4)                                                                                                                                                                                        |

**The first sentence the owner should weigh:** everything below about 25 °C and everywhere but Dar es Salaam is this model alone, and the question the French or Swiss visitor cares about most, whether it lasts the winter, turns on one number that nobody has measured for kitchen waste. The panel's Ea slider should be offered next to the Geneva scenario. Its text says so.

## 1. The model

All SI inside, except biological rates, which are per day as in every source. Temperatures in °C. Files: `machine.ts` (every number of every machine, with its tag, and `MODEL`), `substrates.ts`, `climate.ts`, `bio/` (the chain, shaped for the kit), `plant.ts` (one step), `runs.ts` (long runs, the hand checks), `presets.ts`, `types.ts`, `tags.ts`, `strip.ts`, `texts.ts`, `engine.ts` (`BiodigesterSim implements LabSim`). `demo.ts` is the template's flywheel, kept until the lead wires the lab.

### 1.1 The feed

Two feeds a day, at 8:30 and 17:00 (reported), of `feedKg/2` and `waterPerKg` litres per kg. What goes in pushes out the same volume at the overflow, first. Everything dissolved leaves at the rate of the liquid; everything solid or settled at that rate over `solidsRetention`, 7.06 = 300 d/42.5 d. S5's Table 17 gives the same ratio directly: 10.61 g VS/L in the tank, 1.47 in the effluent, 7.2.

Each substrate's VS splits into degradable and not, by its potential over Buswell's ceiling (`bio/buswell.ts`), and the degradable part into a fast and a slow pool.

| Substrate | TS, VS (reported) | Carbohydrate, protein, fat (estimate)             | Potential, NL CH₄/kg VS                                | Ceiling | Fast share (estimate) |
| --------- | ----------------- | ------------------------------------------------- | ------------------------------------------------------ | ------- | --------------------- |
| Leftovers | 24 %, 94 %        | 85, 12, 3: S5's COD/VS of 1.26 and S7's C/N of 26 | **396, reported** (K45)                                | 443     | 80 %, cooked          |
| Peelings  | 10 %, 88 %        | 90, 10, 0                                         | 336, derived and generous: all the COD Table 20 prints | 423     | 35 %, raw             |
| Dung      | 23 %, 74 %        | 80, 15, 5                                         | 200, estimate                                          | 457     | 10 %                  |
| Canteen   | 26.3 %, 91.9 %    | 56, 12, 32: S7's COD/VS of 1.76 and its C/N       | 396, the same source, nothing better                   | 617     | 80 %                  |

### 1.2 The food chain (`bio/chain.ts`)

The fewest pools that can fail: the research's §5.1. Per substrate a fast and a slow pool, kg VS; the acids, kg COD, counted as acetate; the methanogens, kg COD; the dissolved inorganic carbon, mol; the net strong cations, eq.

```text
dF/dt = −k_f(T)·h(pH)·F                 hydrolysis, first order, exact at any step
dS/dt = −k_s(T)·h(pH)·S
dA/dt = cod·(dF + dS) + b(T)·X − u      acids: made by the first, returned by the dead
u     = k_m(T)·m(pH)·X·A/(K_s·V + A)    methanogens eating, semi-implicit
dX/dt = Y·u − b(T)·X                    washed out with the solids
CH₄   = (1 − Y)·u·15.625 mol/kg COD     and as much CO₂
k(T)  = k(30 °C)·exp[(Ea/R)(1/303.15 − 1/T)]   for k_f, k_s, k_m, b alike: one Ea, a simplification
h(pH), m(pH) = exp[−3((pH − high)/(high − low))²] below `high`, 1 above: ADM1's form
```

**Why it can fail.** The methanogens' capacity is `k_m·m(pH)·X`. Food arrives faster than they multiply, the acids eat the buffer, the pH falls, `m(pH)` falls, and the capacity falls with it. Nothing else is needed: there is no « sour » switch. Above 38 °C `temperatureWindow` falls to nothing at 48 °C; at or below 0 °C nothing happens. **There is no cold cut-off of any other kind:** the deaths in the cold in §4.3 come from the same capacity.

**pH** from a charge balance, solved each step: `charge + [H⁺] = [HCO₃⁻] + [Ac⁻] + [OH⁻]`. CO₂ and acetic constants with temperature as in ADM1 (from memory: read the report before quoting a digit, tested at their usual values at 25 °C). The cations are **an input from a measurement**, S5's Table 18: 1,130 mg CaCO₃/L on days 103 and 105, 22.6 meq/L at 2 kg/d and 20 L/d. The pH remains the model's.

**Closes to rounding** at any step, in a soured tank too, tested: COD and carbon. Acids count as acetate, 2 mol of carbon per 64 g of COD; a substrate whose Buswell CO₂/CH₄ is not 1 settles the difference at hydrolysis. When a soured tank's food would draw CO₂ it no longer has, `acidCarbonDebt` holds it: a soured tank's acids really are longer and hold less carbon per COD. A clamp at zero was silently creating carbon there; a test found it.

### 1.3 The gas leaving the liquid

Methane is taken to leave at once, in bubbles. The CO₂ in those bubbles is **not set**: it follows the free CO₂ in the liquid, at the partial pressure it stands at.

```text
n_CO₂/n_CH₄ = p/(P_dry − p)        p = [CO₂*]/K_H    P_dry = total pressure − vapour
```

Through the open ring, `ringTransfer·A_ring·[CO₂*]` also leaves, 0.5 m/d (estimate: still water takes up to about 1 m/d, and a scum holds it back). The effluent carries its dissolved carbon. So the share of methane is **found**. Above saturation the CO₂ leaves at once, even with no methane: a soured tank still vents.

**The mechanism, from the figures alone (derived, not in S5).** If both substrates made gas 1:1, as starch does, then the liquid took 259·(0.568 − 0.432) = 35 NL/d of CO₂ from the food's gas and 113·(0.664 − 0.336) = 37 NL/d from the market waste's: **the same volume, whatever the feed.** In a small flow it weighs more. S7 says it in words about its plants after a holiday: « higher methane content due to the fact that CO₂ dissolved back into the digester water ». The model finds **39 NL/d on food and 31 on market waste**, of which the ring 24.5 and 18, the effluent the rest, on an a priori estimate of the ring.

**The rim:** a share `rimLoss` of all bubbles misses the bell, 22 % by area (K4), a slider. Dissolved methane leaving in the effluent, about 0.3 NL/d by Henry, is left out.

### 1.4 The bell

```text
V_gas = trapped + A·rise       A = π·0.43², so 17.2 cm per 100 L
P     = (m_bell + m_laid − ρ·A_wall·depth(rise))·g/A
```

**The pressure is not one number.** The wall that dips into the slurry is carried by it, and comes out as the bell rises. With `m_bell` = 20.5 kg (the shell, at 5 mm of HDPE) and `A_wall` = 0.014 m²:

| Rise, m         | 0 (rest) | 0.345 | 0.69 (full) | Reading                  |
| --------------- | -------- | ----- | ----------- | ------------------------ |
| Pressure, mbar  | 1.32     | 2.14  | 2.96        | 2                        |
| Weight held, kg | 7.8      | 12.7  | 17.5        | 11.8 by hand, for 2 mbar |

**Why 5 mm is not a fit.** No source weighs a bell. K1 prints an outer Ø of 1.04 m and an inner radius of 51.5 cm: a wall of 5 mm on the tank, of the same make. The research's range of 5 to 8 mm gives 2.1 to 3.4 mbar at mid-travel; the reading of 2 lies at its bottom. The gauge reads to 60 mbar and printed 2 for every one of ten tests, so it cannot say more.

**The rest and the trapped gas.** The bell rests with its top above the slurry, so part of its gas can never be drawn. S7 says so of the next size up: its shorter bell « can fully sink » and « holds significantly more gas ». The drawing of S5, Fig. 7, shows the rim about 0.14 m above the floor, resting near the inner feed pipe (read by eye: **estimate, 0 to 0.2 m**). So:

```text
trapped = A·(rest + 1.30 − 1.04) = 232 L        (151 L at a rest of 0, the lower end)
```

S5's 400 L does not count it: its scale was marked « until all biogas (400 l) was released ». **Full** is the travel, 0.69 m (K5). Beyond it, what comes in goes out under the rim, as S5 says. Why at 0.69 m and not at 1.04 − 0.14 = 0.90 m is not explained: the rim is still 0.21 m under the surface there, and the tilt alone does not bring it up. The number is reported, the mechanism is not known.

**Levels.** The open ring and the feed riser are both open to the air and join below the rim: they stand **level**, at the overflow. The gas pushes the surface inside the bell **down**, by P/ρg, 2 cm at 2 mbar. See §7 on K6.

**Tilt:** 5° at rest to 8° full, an estimate by eye. It moves no number.

### 1.5 The line and the burner

```text
Q = Q_ref·((P − P_water − R_hose·Q)/P_ref)^n     solved by bisection, only while lit
```

`Q_ref` is **an input**, 269 L/h at 2 mbar (K22). `n` is 0.5, an orifice, and a slider. `R_hose` is laminar, 0.03 Pa per L/h on 5 m of ½", from the kit's tube law and equal to Poiseuille: 0.08 mbar at 269 L/h. The flame goes out if the pressure at the burner falls under 1 mbar (`flameMinPressure`, **an estimate**: half the lowest pressure at which anyone timed a flame), if the bell rests, if the gas is under 45 % methane (reported: S5 p. 13 and S8 p. 25 both say biogas above 45 % burns, after Deublein. That a lit flame goes out under it is this model's reading. **Tagged an estimate until 2026-11-03**, when the lead read both), and the tap is then closed: S7 warns of what follows if it is not.

**Water.** The gas leaves saturated, at the slurry's temperature, and cools to the air in the hose: `condensatePerMole`, about 2.5 g a day on an hour of flame. With no trap, it gathers at the low point and stands as high on both sides: `P_water = ρ·g·(V/A_hose)/2·slope`, the slope an estimate of 2 %. The bell's whole push is about 2 cm of water.

### 1.6 Heat and sun (`@onigam/lab-kit/sim/thermal`)

One node, the kit's RC network: 850 kg of water, a link to the air, `U·A`, on 7.1 m² of skin at mid-travel. What comes in is at the butt's temperature, the day's mean air (assumption: S5 stored its water « next to the digester to guarantee equal temperatures »). Metabolic heat, 5 % of the methane's (estimate), about 4 W: small, as the research says. At 0 °C the node holds, the ice only counted.

```text
Q_sun = (U/h_out)·α·[A_top·G + D·H·G_bn·cos(alt) + A_side·½(G_d + ρ_g·G)]
```

**The sun reaches the slurry through the wall's own share, U/h_out.** A sol-air form, so that **a wrap that keeps heat in also keeps the sun out**, which decides §4.3. `h_out` 15 W/m²K (estimate), α 0.9 (estimate). Direct sun only during `sunHours`, 7.5 h centred on noon (reported, K9).

The air: K47's monthly means, straight between mid-months, ±4 K over a day (assumption). The sun: **monthly irradiation on the horizontal from PVGIS, read for this role** (PVGIS-ERA5 2016-2020, H(h)_m; its air came back equal to K47 at all four sites, so the same grid cells). Cooper's declination; Page's diffuse share from the month's clearness (usual, not read here).

### 1.7 The clock

`step(dt)`: the day on `dt × timeScale`, in fixed steps of 30 s, at most 720 a frame, so the same inputs give the same state (tested). **A step is about 0.9 µs here,** a day per second about 0.05 ms a frame, a scenario loads in about 7 ms with its 150 days of history. 30 s, 2, 10 and 30 minutes give the same answer to 0.1 % (tested). No wall clock, nothing random.

**A run-in** gives a plant its history: the calendar runs up to the start with the burner off, at a coarse step. It must end at the exact hour the plant opens on. An early version ended at 18:00 and opened at 06:00: a warm evening and an extra feed, a false surge of 13 % that the scenarios showed and a test now holds.

## 2. The parameters

| Parameter                        | Default                | Range              | Status                                                                   |
| -------------------------------- | ---------------------- | ------------------ | ------------------------------------------------------------------------ |
| `feedKg`                         | 2 kg/d                 | 0–20               | K13, K25. **Wider than the research's 0–8:** nothing sours by 8 at 32 °C |
| `shareCooked`                    | 50 %                   | 0–100              | K23                                                                      |
| `waterPerKg`                     | 9 L                    | 2–15               | K13                                                                      |
| `flushWater`                     | 0                      | 0–100 L/d          | assumption, what dilutes a soured tank                                   |
| `cookMinutes`                    | 45                     | 0–240              | K23                                                                      |
| `burnerLph`, at 2 mbar           | 269 L/h                | 100–1000           | K22, K42's 400 within it                                                 |
| `burnerExponent`                 | 0.5                    | 0.5–1              | an orifice. 0.88 fits K22's two points (§3.3)                            |
| `addedWeight`                    | 0                      | 0–24 kg            | K18                                                                      |
| `bellWall`                       | 5 mm                   | 0–10 mm            | **estimate** from K1                                                     |
| `rimLoss`                        | 22 %                   | 0–30 %             | K4, K33                                                                  |
| `hoseWater`, `hoseSlope`, `trap` | 0, 2 %, on             | 0–400 mL, 0.5–10 % | **estimate**. The measured plant had no trap                             |
| `site`, `month`, `seasons`       | Dar es Salaam, 10, off | four sites         | K47, PVGIS                                                               |
| `sunHours`                       | 7.5                    | 0–12               | K9                                                                       |
| `wallU`                          | 5 W/m²K                | 0.2–5              | assumption, 0.25 in 15 cm of straw (§2.9)                                |
| `heaterW`, `setPointT`           | 0, 30 °C               | 0–200 W, 15–40 °C  | assumption                                                               |
| `kFast`, `kSlow`                 | 0.4, 0.05 /d           | 0.1–0.7, 0.01–0.1  | **estimate**, S35 for the fast one                                       |
| `Ea`                             | 60 kJ/mol              | 40–80              | **estimate**, the one that decides §4.3                                  |
| `solidsRetention`                | 7.06                   | 1–15               | derived, K29, and Table 17                                               |

**In `MODEL`, not sliders:** `km` 5.3 /d, `Ks` 0.15 kg/m³, `yieldX` 0.05, `decay` 0.02 /d, the pH windows (ADM1's acetoclastic methanogens and acidogens; 8 /d at 35 °C brought to 30 °C at Ea 60; **from memory, not read here**), `ringTransfer`, `flameMinPressure`, `gasViscosity`, `metabolicShare`, `absorptance`, `outerFilm`, `groundReflection`, `airSwing`, `waterCharge`, `waterSolids`: all **estimates**, each with its reason beside it in `machine.ts`. `leanFlame`, 45 %, was on this list: it is reported (§1.5). Each can be moved by a `PlantOptions` for a run.

**What is not a number here: H₂S.** The model has no sulphur. S5's instrument stopped at 100 ppm on nearly every plant (K32), so the true value in this gas is **unknown**. `state.h2sPpm` is always `null`, `state.h2sTag` is `'unknown'`.

## 3. The key figures, retrieved and not retrieved

**Exact:** arithmetic the model holds. **Retrieved:** the model's own value, within about 15 %. **Not retrieved:** further off, cause and plausible range in §3.3. **Find:** no target. **Context:** the model has nothing to say. A compare is not a validation: S5 is one plant, four months, a bachelor thesis.

Two columns where they differ. **Calendar** is S5's own fifteen weeks, from the filling, day by day (`thesisRun`, from Table 14, Figs. 16, 17, 32 and Table 18), with the thesis's own windows: days 19–28, days 46–55. **Steady** is the same feed for 300 days.

### 3.1 The research's hand checks (§2.9)

All **exact**, each in `figures.test.ts`, in the research's own order. The owner's four: the half-brick, 12 × 9.81/0.581 = **2.03 mbar** against a reading of +2. **32 min** per kg of leftovers on the 1.5 kW burner, **14 min** for peelings. **105 g** of methane from 2 kg of wet scraps. The rim's break-even at **10.8 %**, « near 11 % ». Also: 867 L, 21.7 %, 17.2 cm per 100 L, 11.8 kg, 269 and 496 L/h, 1.48 kW, 2.8 kW, 0.8 kW, 1.47 kWh/d, 54 g, 0.75 kWh/d, 207 L, 149 min, 7 min per litre boiled, 0.297 kg CH₄/kg of starch, 84 %, about 5 kg/d, 2.8 kg VS/m³·d, 0.46 kWh/d, 700 W, 35 W, 8.2 kg/yr, 220 kg CO₂e.

The break-even **ignores what the scraps would have emitted anyway, and charcoal or firewood**, against which the plant comes out far better; its LPG factor is from memory. As §2.9 says, an estimate, for lesson 7 with every condition stated. **It does not depend on how much gas there is:** the leak and the fuel replaced both scale with the methane caught, so the model's own 36 kg a year gives the same 10.8 %.

### 3.2 The figures

| K   | Reported                                                | Model                                                                                                           | Status, and why                                                                                                                                                                  |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Ø1.04, 1.25 m, r 51.5 cm                                | same; 5 mm of wall, derived                                                                                     | Exact                                                                                                                                                                            |
| K2  | Ø0.90, 1.30 m                                           | same                                                                                                            | Exact, the table corrected by the figure                                                                                                                                         |
| K3  | 1.04 m, about 850 L                                     | same; 867 L by the geometry                                                                                     | Exact                                                                                                                                                                            |
| K4  | 0.83, 0.65 m², 22 %                                     | 0.833, 0.650 m², 21.9 %                                                                                         | Exact. An area, not a measurement of gas                                                                                                                                         |
| K5  | 0.58 m², 400 L, 0.69 m, 17.25 cm                        | 0.581 m², 401 L, 17.2 cm                                                                                        | Exact                                                                                                                                                                            |
| K6  | funnel 1.18, 1.06 in the riser, 0.51, 0.74 m            | constants; the riser **level with the ring**                                                                    | **A correction, §7.** The model does not put the riser above the ring                                                                                                            |
| K7  | hose ½", 5 m, and the rest                              | constants; 0.08 mbar in the hose at 269 L/h                                                                     | Exact                                                                                                                                                                            |
| K8  | about 2 m², 2.5 m high                                  | top at 2.13 m, 2.28 m on a pallet, at full travel                                                               | Retrieved; the sheet can print both                                                                                                                                              |
| K9  | 7.5 h of direct sun                                     | an input                                                                                                        | Input                                                                                                                                                                            |
| K10 | cost                                                    | —                                                                                                               | Context                                                                                                                                                                          |
| K11 | 3.5 h                                                   | —                                                                                                               | Context                                                                                                                                                                          |
| K12 | 1,500/1,000, 756 L                                      | preset; **nothing trapped**, it can sink                                                                        | Exact                                                                                                                                                                            |
| K13 | 2 kg + 18 L, 42.5 d                                     | same; feeds at 8:30 and 17:00, reported                                                                         | Exact                                                                                                                                                                            |
| K14 | TS, VS                                                  | inputs; 0.451, 0.176 kg VS/d, Table 20's 0.451, 0.180                                                           | Input                                                                                                                                                                            |
| K15 | 0.53, 0.17–0.21 kg VS/m³·d, below 2                     | 0.53, 0.207. The abstract's 91 % would give 0.514                                                               | Exact, and it settles 94 %                                                                                                                                                       |
| K16 | 60 kg dung, 300 L, 10 days, +150 g                      | run as `thesisRun`; **the one input an outcome moved**, §7                                                      | Scenario of the run. Comes through at seed ≥ 0.2 kg COD, dies at 0.15 kg                                                                                                         |
| K17 | pH about 6.5; 27.8, 28.8, 30.9 °C                       | pH 6.53; **30.6, 31.3, 32.5 °C**                                                                                | pH retrieved. Temperature **2 to 3 K high**, §3.3                                                                                                                                |
| K18 | +2 mbar with 12 kg; 2 mbar                              | **2.03 mbar exact**; 2.14 mbar at mid-travel, no fit                                                            | Exact, retrieved                                                                                                                                                                 |
| K19 | 289 L/d (259 NL) food                                   | calendar **278 L/d** (239.5 NL), steady 279 L/d. Norm factor 0.86 by saturation, S5's 0.896 keeps the vapour in | Retrieved, −4 %, −8 %                                                                                                                                                            |
| K19 | 126 L/d (113 NL) market                                 | calendar 64 L/d (55 NL), steady 76 L/d (65 NL)                                                                  | **Not retrieved**, −40 to −50 %, §3.3                                                                                                                                            |
| K20 | 56.8 %; 66.4 %                                          | calendar **57.8 %**, 71.5 %; steady 57.5 %, 68.7 %                                                              | Retrieved; the gap by the same mechanism                                                                                                                                         |
| K21 | 144, 63 L/kg wet; 640, 700 L/kg VS                      | 140, 38; 619, 434                                                                                               | Food retrieved. Market **not**: the leftovers beat the peelings per kilo in both, but « not per kilo of solids » is **not found**, §3.3. Lesson 2 should not rest on it          |
| K22 | 22.3 min at 2 mbar; 12.1 at 4                           | input; 23 min from mid-travel; **16 min with the brick**                                                        | Input. With the brick **not retrieved**, §3.3                                                                                                                                    |
| K23 | about 200 L, 61 %, 45 min                               | 176 L, 60.5 %, 39 min                                                                                           | Retrieved, −12 %, −13 %. The thesis's figure is itself a sum                                                                                                                     |
| K24 | 1.48 kW, derived                                        | 1.32 kW at mid-travel at 57.5 %                                                                                 | Exact as arithmetic; retrieved                                                                                                                                                   |
| K25 | 670 L/d, 150 min, pH 6.2                                | steady **710 L/d**, ramped live 690 L/d and 149 min; calendar 575 L/d; pH **6.57**                              | Gas retrieved. pH **not**, §3.3                                                                                                                                                  |
| K26 | 70 NL/d on a 3-day break                                | **63 NL/d** on the calendar                                                                                     | Retrieved, −11 %. 54 to 72 NL/d over k_fast. That break came after market waste, not after food, as the research's scenario assumed: from food the model falls to about 107 NL/d |
| K27 | VS 92.2, COD 83.1, TS 84.9 %; market 85.3, 83.9, 72.8 % | 91.4, 90, 84.3 %; 83.3, 79.8, 70.1 %                                                                            | Retrieved; COD high by 7 points: the effluent's COD is not all in the model                                                                                                      |
| K28 | NH₄-N 74, 85 mg/L, P                                    | no nitrogen. 5.3 meq/L is a part of the 22.6 of the input                                                       | Context                                                                                                                                                                          |
| K29 | layers; SRT about 300 d                                 | **10.1 kg** of VS in the tank on day 107, against 9.0 by Table 17                                               | Retrieved, +12 %, with the dung counted. Layers at S5's shares                                                                                                                   |
| K30 | 4 of 12 running, 10 after repairs                       | —                                                                                                               | Context: what breaks a tap is not in it                                                                                                                                          |
| K31 | a stopped plant, pH 4.15                                | a soured tank passes it in about three weeks, ends at 3.6 to 4                                                  | Retrieved as a place. **Corrected 2026-11-03:** this line said S5 gives no cause. Table 25 remarks « Overfed » on that row (research §11)                                        |
| K32 | H₂S above 100 ppm                                       | **null, tagged unknown**                                                                                        | **Not modelled**                                                                                                                                                                 |
| K33 | about 17.5 %, 426 and 516                               | input of the school's plant; 17.4 % by the arithmetic                                                           | Input                                                                                                                                                                            |
| K34 | 500 L left of 2,300 L, 2.25 mbar                        | **777 L on ½" hose**, 617 on 5 m, 520 on ¾"; 2.0 mbar at mid-range                                              | Sign retrieved, size rests on estimates, §3.3                                                                                                                                    |
| K35 | 98 L/kg wet, 426 L/kg VS, 55–58 %                       | 140 L/kg, 580 L/kg VS, 63.7 %                                                                                   | **Not retrieved**, +43 %, §3.3                                                                                                                                                   |
| K36 | 1 kg dry → 0.25 kg CH₄                                  | makes 0.27, catches 0.21                                                                                        | Retrieved, and the factor of five to wet scraps: 500 g against 98 g                                                                                                              |
| K37 | « 1 to 2 days »                                         | **half a meal's gas in 2.0 days**, 90 % in 12; peelings 5 and 27                                                | Find. Half-time of a meal, cooked. Conflict 3: a reaction time, against 42.5 d of liquid and about 300 d of solids                                                               |
| K38 | « above 30 °C »                                         | no edge there: steady gas 94 % at 15 °C, 99 % at 25, 101 % at 35                                                | Find, §4.3. The real price of cold is the margin, not the yield                                                                                                                  |
| K39 | 100 kg LPG a year                                       | 3.3 kWh/d on 5 kg/d, against 3.5 needed                                                                         | Retrieved, as §2.9 found: it needs 5 kg/d, not 2                                                                                                                                 |
| K40 | diffusion                                               | —                                                                                                               | Context                                                                                                                                                                          |
| K41 | 10 kg → 1 m³ → 6 kWh                                    | 5.98 kWh by arithmetic; 7 kg/m³ and 4.9 kWh/m³ on leftovers                                                     | Exact; in scale                                                                                                                                                                  |
| K42 | 0.4 m³/h, 55 %                                          | 55 % an input; 400 L/h in range, 16 min per 100 L                                                               | Input                                                                                                                                                                            |
| K43 | composition, vapour 2 %, 7 %                            | vapour 2.3 %, 7.3 % by saturation                                                                               | Retrieved. H₂S unknown, K32                                                                                                                                                      |
| K44 | below 15 °C « does not work satisfactorily »            | on 2 kg/d, a held tank sours between 12 and 14 °C. **8–10 °C at Ea 40, 16–18 °C at Ea 80**                      | Retrieved, inside what Ea allows. A qualitative sentence against an estimate: little proved                                                                                      |
| K45 | 396 NL/kg VS                                            | input; catches 304 against S5's 326                                                                             | Input                                                                                                                                                                            |
| K46 | germs survive                                           | —                                                                                                               | Context: nothing here says what survives                                                                                                                                         |
| K47 | climate                                                 | inputs, year means retrieved                                                                                    | Input                                                                                                                                                                            |

### 3.3 Not retrieved: cause, range, what would change it

**K19, K21, market waste, 126 L/d: the model gives 64 to 76.** Table 20 prints 0.172 kg of COD a day: at 350 NL of methane per kg of COD, **60 NL/d at the very most**, with nothing lost. The plant caught **75 NL/d**, with 22 % of its surface open. S5's 417 NL CH₄/kg VS also stands above the ceiling of any carbohydrate, 415. So **the figure cannot come from that feed.** The thesis notes the waste's heterogeneity. The gas may have come from the stock: on day 26.11 the tank held 5 kg of VS in its float and 3 kg in its sludge, and about 40 NL/d would need that stock to decay at only 1 % a day, which a third, very slow pool could do, for which no source gives a rate. **Plausible: 60 to 126 L/d.** With no rim the model reaches 117 L/d, and then food goes to 386 L/d: it cannot be both.

**K22, K18, the flow with the brick: 1.37 times against 1.84.** An orifice gives √2 at most, and the hose hardly matters at these flows (laminar, 4 % of the pressure). **It fits an exponent of 0.88,** near a laminar law, which nothing in the line supports. An orifice gives 1.84 only if the pressure acting on it goes from **0.85 to 2.88 mbar**: possible if the 60 mbar gauge is coarse, and the gauge read 2 and 4 through every test. S5 notes also that the pot cooks faster, so the flame's useful power rose as well. The slider `burnerExponent` at 0.88 prints the source by construction: **that is a fit, not a finding.** The lesson should say « about one and a half times, and the measurement says more ». Not settled.

**K25, K17, pH under load: 6.57 against 6.15–6.35.** The model's cations stay about 23 meq/L, Table 18's alkalinity falls to 16–18 under load and returns to 22.6 when the feed stops. Kapp's titration counts part of the acids, and a real tank is unmixed: Fig. 16 reads 6.2 at the top and 4.5 to 6.8 at the bottom on one day. At 17 meq/L the model would read about 6.45. **About 0.2 to 0.3 unexplained.** The acids are near: 100–106 mg/L against 124–195. Its effect: the real tank stands **nearer the edge** than the model's, in the same direction as §4.1.

**K17, temperature, 2 to 3 K high.** `outerFilm` 15 W/m²K is an estimate. At 25 W/m²K: 28.3, 29.0, 30.1 °C. So a wind or the reading's height could close it. **Not moved:** 3 K is worth about 1 % of the methane here. At Geneva, with less sun, the same film would leave the tank a little colder.

**K34, 500 L of 2,300 L: the model gives 520 to 777 L.** Pressure is enough, as S7 says in words: « the pressure and the flow rate were not sufficient anymore ». No tilt is needed. It rests on three estimates: the wall (7 mm), the flame's limit (1 mbar) and the hose (½" reported until January 2010, ¾" after; its length 10 m, an estimate). Over the flame's limit alone: 211 L at 0.5 mbar, 1,323 L at 1.5 mbar. **It agrees because the estimates allow it.** The research asked « pressure, or the tilt? »: the model says pressure suffices, it cannot say tilt plays no part.

**K35, the school's yield: 140 L/kg wet against 98.** S5 and S7 measured the same kind of plant on nearly the same waste and differ by half per kg of VS, 640 and 426. **No one potential does both,** and K45 belongs to S5's side. S7's own carbon does not close either: 0.94 kg of carbon a day left its plant 2 and 868 of 1,751 NL/d of gas accounts for it. So half of it is unaccounted for, and S7 credits the lack of mixing. **A larger loss than the measured 17.5 % would also do it, and that is worth saying in lesson 7.** The model does not settle it.

## 4. What the model finds with no target

### 4.1 Overfeeding (scenario `overfeed`)

From 2 kg/d, a sudden jump. Day-by-day, litres of gas and pH:

| kg/d | Day 2       | Day 3           | Day 4         | Day 5          | Day 6          |
| ---- | ----------- | --------------- | ------------- | -------------- | -------------- |
| 10   | 620 L, 6.58 | 830 L, 6.54     | 972 L, 6.52   | 1,065 L, 6.50  | 1,130 L, 6.50  |
| 11   | 659 L, 6.58 | 892 L, 6.53     | 1,038 L, 6.49 | 928 L, 6.37    | **36 L, 5.22** |
| 12   | 697 L, 6.58 | 947 L, 6.52     | 883 L, 6.37   | **28 L, 5.20** | 0, 4.66        |
| 20   | 912 L, 6.52 | **169 L, 5.49** | 0, 4.67       | 0, 4.52        | 0, 4.44        |

**What a keeper would see:** a plant doing better and better, then nothing within a day. **The pH warns late, as S5 says of its own readings:** « the pH value reacts with quite some delay ». The ratio of acids to buffer warns most of a day earlier than a pH of 6: it passes S7's limit of 0.3 while the pH still reads about 6.4.

| Held at, °C                    | 32   | 25   | 20  | 15  |
| ------------------------------ | ---- | ---- | --- | --- |
| A sudden jump sours from, kg/d | 10.2 | 7.0  | 4.9 | 3.4 |
| A slow ramp carries, kg/d      | 35   | 14.5 | 6.0 | 2.6 |

**A warning on these numbers.** S5 went to 5 kg/d, ramped, and saw no failure, which the model agrees with. S8's limit for unstirred plants is 2 kg VS/m³·d, 7.5 kg/d here, and S7 considers 2 to 2.5 possible, 7.5 to 9.4 kg/d here. **The model's 10 kg/d is above them, and its 35 kg/d after a ramp is not to be believed:** it has one mixed node, no blocked inlet, no local sourness at the inlet, no ammonia, no limit in the settling of solids. The real limit is expected to be lower. That is why the scenario says so. The temperature's slope is the useful part.

### 4.2 Rescue

A jump to 12 kg/d, stopped at a pH (`rescueRun`):

| Food stopped at | pH 6.5 | 6.45 | 6.4  | **6.35** | 6.3  | 6    |
| --------------- | ------ | ---- | ---- | -------- | ---- | ---- |
| Lowest pH       | 6.49   | 6.36 | 6.36 | **4.03** | 3.96 | 3.96 |

**The point of no return is at about pH 6.4, on day 3.5.** What is in the tank by then is enough: several kg of COD of fast food, against a buffer worth 1.5 g COD/L, about 1.2 kg in all. Once below it, **nothing returns by itself** in 400 days: the methanogens' factor is about zero, and with no flow nothing leaves.

**What does:** 100 L of water a day brings it back in about 61 days, 50 L in about 117. So « recovery takes weeks », the research's guess, is about two to four months and several tank-volumes of water. A dose of about 200 eq of base at pH 4.2 acts in three days in the model (`addBase`), about 7 kg of slaked lime by arithmetic: **an upper bound on speed**, since the model does not kill methanogens with acid, only stops them. Not in any scenario, nor offered as a procedure.

### 4.3 Cold (scenario `geneva-january`)

**A year after a summer's start, bare, 2 kg/d of leftovers.** The tank's temperature, litres a day, pH, month by month:

| Month             | Jul  | Aug  | Sep  | Oct  | Nov  | Dec  | Jan  | Feb  | Mar  | Apr  | May  | Jun  |
| ----------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| T, °C             | 26.6 | 23.7 | 18.2 | 12.1 | 7.2  | 4.9  | 5.8  | 8.8  | 13.4 | 17.8 | 21.5 | 25.3 |
| Geneva, Ea 60     | 245  | 231  | 198  | 166  | 47   | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| pH                | 6.56 | 6.54 | 6.51 | 6.48 | 5.37 | 4.40 | 4.27 | 4.17 | 4.08 | 3.99 | 3.92 | 3.87 |
| Ea 40             | 251  | 240  | 216  | 194  | 181  | 184  | 205  | 228  | 254  | 263  | 274  | 279  |
| Ea 44             | 250  | 239  | 213  | 188  | 175  | 153  | 0    | 0    | 0    | 0    | 0    | 0    |
| Ea 80             | 239  | 221  | 178  | 98   | 0    | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| Half the food     | 115  | 108  | 92   | 77   | 69   | 71   | 88   | 109  | 130  | 134  | 142  | 144  |
| No food Nov–Mar   | 245  | 231  | 198  | 166  | 69   | 14   | 8    | 8    | 9    | 161  | 254  | 273  |
| In straw, no heat | 249  | 238  | 211  | 180  | 124  | 0    | 0    | 0    | 0    | 0    | 0    | 0    |

**The switch stands between Ea 43 and 44 kJ/mol. The only clue is about 44** (S36, 11 → 22 °C doubles the activity, from a search summary, with an adapted sludge). **So the model does not know whether this tank survives a Geneva winter on 2 kg/d.** At 44 it goes in January, at 48 and 52 in December, at 60 and 80 in November.

**The date also depends on the plant's history.** The table's plant was started warm in July. The live scenario's has lived since April on this climate, and at Ea 60 it goes in early December at about 6 °C. That scenario's words say so.

What it does know: the outcome is decided by load against temperature, and a smaller load does what a warmer tank does. A held tank on 50 % peelings is still alive at 10 °C.

**Why a yield barely falls and then all stops.** Hydrolysis and methanogens slow alike, and with solids held 300 days the food waits. So steady gas is 94 % at 15 °C. **The price of cold is margin:** the methanogens' capacity falls by Arrhenius while the food stays, until it passes what is arriving.

**Marseille holds,** by the same numbers: 196 L/d at 14–16 °C in winter, 295 L/d in June, the two being the store and the warmth; the spring's gas beats the summer's. **Pune and Dar es Salaam never come near.** Below about 25 °C none of this is measured; below about 10 °C Arrhenius itself is a guess.

### 4.4 Heat

| A mean day, held at 30 °C | Water and food | Walls | Sun  | Asked of a heater, kWh/d | The gas holds, kWh/d |
| ------------------------- | -------------- | ----- | ---- | ------------------------ | -------------------- |
| Geneva, January, bare     | 0.66           | 24.1  | 2.4  | **22.3** (930 W)         | 1.37                 |
| Geneva, January, straw    | 0.66           | 1.20  | 0.12 | **1.74** (73 W)          | 1.37                 |
| Geneva, April, straw      | 0.44           | 0.81  | 0.24 | **1.01** (42 W)          | 1.37                 |
| Marseille, January, straw | 0.47           | 0.86  | 0.15 | **1.18** (49 W)          | 1.37                 |

The research's hand check for a 10 °C month, 0.46 + 0.84 kWh/d in straw, is retrieved: 0.44 + 0.81. **The water does take a third** in straw. **Month by month, in straw at 30 °C, kWh/d asked at Geneva:** 1.74, 1.59, 1.37, 1.01, 0.82, 0.53, 0.34, 0.39, 0.69, 1.08, 1.46, 1.69. The gas holds 1.37, and a burner at 55 % returns 0.75 of it. So **the gas pays for its own heat from June to September,** and with no loss at all it would not from November to February. **Bare, never:** 2.8 kWh/d asked at its best, in July. At Marseille in straw, May to October. And the sun, which is what warms this tank at Dar es Salaam, is what the wrap blocks. The drum at 38 °C in a Geneva January asks 1.2 kWh/d against 0.41 in its gas, three times.

**The drum (S3) holds at five times this plant's load** in the model, 93 L/d, pH 7.15, because so little water leaves its buffer at 81 meq/L. It does not see ammonia. S3's own « 1 kg = ½ hour » comes out at 27 min per kg on this burner: in scale.

## 5. How little a match proves

Each row moves one thing: the steady plant on 2 kg/d of leftovers.

| Row                      | Gas, L/d      | CH₄, %     | pH         | Sours from, kg/d at 32 °C |
| ------------------------ | ------------- | ---------- | ---------- | ------------------------- |
| **Base**                 | **279**       | 57.5       | 6.59       | 10.2                      |
| k_fast 0.19, 0.65        | 278, 280      |            |            | 12.0, 9.6                 |
| k_slow 0.02, 0.1         | 276, 280      |            |            |                           |
| Ea 40, 80                | 278, 281      |            |            | 10.1, 10.4                |
| k_m ÷2, ×2               | 279, 280      |            | 6.58, 6.59 |                           |
| Yield 0.03, 0.1          | 280, 278      |            | 6.58, 6.59 |                           |
| Death 0.01, 0.04         | 278, 280      |            | 6.59, 6.58 |                           |
| K_s 0.05, 0.5            | 280, 279      |            | 6.59, 6.57 |                           |
| Retention 1, 3, 15       | 249, 271, 283 |            | 6.59       |                           |
| Rim 0, 30 %              | 386, 245      |            |            |                           |
| Ring's transfer 0, 1 m/d |               | 53.3, 61.4 |            |                           |

**On the market waste,** ring's transfer 0, 1 m/d: 57.2 %, 76.3 %, against 68.7 % at 0.5 and 66.4 % measured.

**What moves K19 is only the potential and the rim.** No kinetic estimate matters to a steady yield at this load: with solids held 300 days everything is eaten sooner or later. So K19's agreement **says nothing of the kinetics.** The kinetics speak in K26, K37, §4.1 and §4.3, where there is little or nothing to compare against. **What most needs a measurement:** Ea, then the rim's real loss on this plant, then what the flame's limit is.

## 6. Limits

- **One mixed node.** S5 measured a floating layer of 74 g TS/L, a clear 600 L at 3.5 g/L, a sludge at 41 g/L, and in phase 1 a pH of 6.2 at the top with 4.5 to 6.8 at the bottom. The model has one pH, so it **overstates the load a real tank bears** and cannot see the inlet's sourness or a blocked inlet, the commonest failure of the field (K31).
- **One Ea** for every organism. Methanogens are usually held to suffer more from cold than hydrolysers: that would sour a cold tank sooner.
- **No acid kills:** low pH stops methanogens, only time kills them. So the rescues of §4.2 are fast once the pH is back. **No pH above 8 stops them,** and a tank left unfed for a year drifts high as its CO₂ leaves through the ring.
- **No nitrogen, no ammonia, no sulphur, no H₂S, no fats' inhibition, no trace metals.** The drum's result is the one this most affects. No germs: K46 stays a text.
- **No adaptation of organisms,** only their number: a cold tank gains methanogens because they die slower, the rest is not modelled. Below about 10 °C all of it is an extrapolation.
- **The cations** arrive at once with the feed, at one value for all foods. Table 18 was taken on food waste only.
- **The gas in the bell** does not exchange with the liquid, and takes the slurry's temperature: a black bell in the sun runs warmer, so its real daily swing in volume is larger. **The skin** has one U, wet and dry.
- **Over-the-top** is the reported travel, not computed. **The tilt** moves no number, and does not stop the bell. No float limiter, no mosquitoes.
- **Air** is modelled only as the first fill's dilution: the alarm says so. **Nothing here says when the gas and air are in an explosive range,** and nothing computes any concentration in a room. **CO from a burner has no figure,** no flame temperature or colour is modelled, and **the flame's height** in the state is only flow against the reference.
- **The weather** repeats inside a day: no cloud, no rain, no wind.
- **Not a plan.** Nothing here shows that a build would be safe or allowed.

## 7. What was read beyond the research, and what it changes

**For the research role and the lead:** on the lead's allowance to check a source where truly needed, this role read S5 and S7 directly and queried PVGIS once. No network otherwise. Nothing was fetched from a refused site. Please absorb these into `docs/research.md`; they carry no K numbers yet.

| Read                                | What it says                                                                                                                                                                                   | What it changes                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| S5 Table 18                         | Alkalinity and VFA by day, days 86–105. pH 6.15–6.77, 800–1,136 mg CaCO₃/L, VFA 30–195 mg/L, A/TIC 0.04–0.24                                                                                   | **The cations become an input, not a guess,** and three compares                                      |
| S5 Table 20                         | COD 0.567 and 0.172 kg/d on 0.451 and 0.180 kg VS/d                                                                                                                                            | **Replaces a first guess of 18 % fat with 3 %.** Shows K19's market figure above its feed's chemistry |
| S5 §3.1, Table 14, Figs. 16, 17, 32 | Day 0 is 10.08.2008; feeds at 8:30, 17:00; the phases; steady windows days 19–28 and 46–55; the 3-day break comes **after market waste**. Feed drops to 1 kg/d on days 29–36                   | **The whole calendar can be run,** `thesisRun`. K26 is read in its real context                       |
| S5 §3.1.1                           | The inoculum's « dried » dung is **23 % TS**, 74 % VS: 10.2 kg of VS, not 40                                                                                                                   | K16's figure in the right size                                                                        |
| S5 Fig. 7                           | The bell empty rests with its rim low, with gas above the slurry. **1.06 and 1.04 m are drawn at the same level,** from two bases. 0.74 m is the overflow's drop                               | **K6 corrected, below.** Trapped gas found                                                            |
| S5 §4.1.1, Figs. 16, 17             | pH by height in phase 1. T's daily swing about 3 K at mid-height                                                                                                                               | The limit of one node said                                                                            |
| S7 p. 8, its abstract, its appendix | **Its own cause for K34: pressure.** 2,300 L at its maximum height. Holders « can fully sink » on the larger size. ½" hose until January 2010. 8 kg/d + 60 L/d, HRT 59 d. C/N 26. COD 428 g/kg | **Answers K34's question in words,** and K12's meaning. The preset's feed                             |
| PVGIS, same API, same cells         | Monthly H(h)_m at the four sites                                                                                                                                                               | The sun on the tank has a source. **Not yet in research §1.5 or the credits**                         |

**K6, a correction to research §5.2.** The research read 1.06 m in the feed riser against 1.04 m at the overflow as 2 mbar lifting the riser's column, and wrote that this passes on the figure. **It passes on the arithmetic only.** The ring and the riser are both open to the air and join under the bell's rim, so they stand level. The gas pushes the surface **inside the bell down**. In Fig. 7 the two marks reach one level, drawn from two bases. `FITTINGS.riserLevelDrawn` keeps the printed number for the sheet; `state.levelRiser` is the ring's. **The 3D should draw: ring and riser level, the inner surface 2 cm below them.**

**What moved during this work, and why.** The first three did not touch a target:

1. **The composition of food waste:** 70, 12, 18 to 85, 12, 3, on Table 20's COD. It brought K20 from 62.5 % to 57.8 %: an improvement from another measurement, stated here so it can be judged.
2. **The inert share,** which follows, from 26 % to 11 %. It brought K29 from 24 kg to 10.1 kg.
3. **The cations,** from 12 to 22.6 meq/L, on Table 18.
4. **The first fill's buffer and seed: the one input an outcome moved.** At 0.1 eq/kg of dung and a seed of 0.25 kg COD, the one-node model soured for good in the ten unfed days, which the real plant came near (Fig. 16) and did not. It is now 0.2 eq/kg (usual K and N in dung) and 0.45 kg COD (a few percent of the dung's VS). With these the model comes through at any seed from 0.2 kg up, and dies at 0.15 kg. **K16 is therefore not a validation.** It touches nothing else after about day 30.

## 8. Assumptions that drive the results, for the owner

1. **Ea, 60 kJ/mol.** It decides the Geneva winter. No source for kitchen waste. **The owner may want the lab to lead with « the model cannot decide this », not with November.** A measurement, or Veeken and Hamelers, would close it.
2. **The rim, 22 % of the gas.** An area taken for a loss. If the true loss were less, food would be over and market nearer. Its climate arithmetic rests on it.
3. **A wall of 5 mm and a rest at 0.14 m.** They give the pressure's shape and the 232 L. A weighed bell, one email to the maker, would close half of it. Below these, the pressure's slope rests only on the physics of a floating wall, which no source measured.
4. **The flame's limit, 1 mbar.** It decides K34, and nothing on the lab's own plant, whose pressure never falls that low.
5. **Well-mixed.** It decides §4.1's numbers, in the hopeful direction.
6. **The potential of peelings,** all of Table 20's COD. It cannot be more without going past its measurement.
7. **The machine itself**, accepted on 2026-11-03 (research Q1). To change it, change `machine.ts`: the bell, the heat, the sheets follow; the substrates and the climate do not depend on it.

## 9. For the 3D, the data role and the film

**Dimensions.** `PLANT_1000`, `FITTINGS`, `HALF_BRICK` and the functions beside them in `src/sim/machine.ts`: **`src/three/dims.ts` imports from there,** as the solar and sand labs' do, and adds only what the simulation does not need (ribs, pallet). `DRAWN_MACHINE` names the machine drawn; `state.onDrawnMachine` says if the plant running is it. On other machines move the bell by `bellRiseShare`.

**State, read every frame, flat.** `BioState` in `src/sim/types.ts`, each key's word in `tags.ts`.

- **`digester`:** `bellRise`, `bellRiseShare`, `bellRimHeight`, `bellTopHeight` (above the tank's floor, m), `bellTilt`, `levelRing`, `levelRiser`, `levelInner`, `bubblesBellLph`, `bubblesRimLph`, `overflowLph`, `bellFull`, `bellResting`, `scumHeight`, `sludgeHeight`, `addedWeight` from the params. Hose moves with the bell. **The marks' spacing is `markSpacing(PLANT_1000)`.**
- **`slurry`:** `pH`, `dropRgb` (sRGB 0–1, written in place, allocates nothing), `sourIndex`, `hydrolysisRate`, `acidRate`, `uptakeRate`, `hydrolysisActivity`, `methanogenActivity`, `acidsGL`, `acidsMeq`, `alkalinityMeq`, `acidRatio`, `methanogensGL`, `kFactor`.
- **`gas-line`:** `flameOn`, `flameShare` (what the flame's height may follow, **not a measured height**), `burnerLph`, `burnerMbar`, `pressureMbar`, `hoseDropMbar`, `waterPlugMbar`, `flameOutCause`, `hoseWaterMl`, `trapWaterMl`, `usefulPowerW`, `ch4Share`, `co2Share`, `vapourShare`.
- **`yard`:** `sunAlt`, `sunAz`, `sunG`, `airT`, `hour`, `month`, `dayEffluentL`, `feedCount`.

**Honesty, in the state.** `regime` ('inside-measurements' or 'below-measurements', at 25 °C), `siteMeasured`, `figureTag` († or *), `h2sPpm` (always null), `h2sTag` ('unknown'). `stripValues` carries the tag on every value.

**For the data role.** Scenarios and alarms in `texts.ts`, tested against the runs. **The lessons should not say:** that the leftovers beat the peelings per kilo but « not per kilo of solids » as a finding (§3.3, the thesis measured it, the model does not retrieve it, and the measurement is suspect); « half a brick doubles the flame » (the pressure doubles; §3.3); that a cold tank « stops » as a fact (§4.3).

**Film contract.** `LabSim`, flat keys, `applyPreset`, `applyScenario`, `reset`, `feedNow()`, `lightBurner()`, `shutBurner()`, `set({ addedWeight })`, `set({ feedKg })`. Moments as numbers: `feedCount`, `flameLitCount`, `flameOutCount`, `fullBellCount`, `souredCount`. No random number, no wall clock. One clock: `timeScale`. The bell's true speed is about 17 cm per 100 L, about 50 cm a day: run it fast and say by how much.

**Say to the writer.** 2 kg → 98 g in the model, 105 g measured, 500 g only for dry matter. The bell's pressure runs from 1.3 to 3.0 mbar with its height. « Half a brick » doubles the pressure, and 1.4 to 1.8 times the flow. A soured tank gives no warning a keeper can read from the pH. A Geneva winter is a simulation that cannot decide its own answer.
