# Findings, rules revision 4 (2026-11-21)

> **Status:** four candidate rules adopted (R4-1, R4-2, R4-3, R4-5). R4-4: you chose **range, for the kinetic idiom only** (§4); spatial and field keep the constant provisionally, and R4-4 stays open for them. Nothing in the engine (`shared/visual/`), an exercise or a policy document changed. Everything under "my reading" is mine, not a score.

## 1. How each candidate was judged

The aim was not fewer hand changes. A candidate was adopted only if the figures it touches keep or improve three things:
- **semantic fidelity:** does the figure say more or less than its statements?
- **comprehensibility:** can it be read?
- **composition**

**The evidence for each:**
- **A numeric check** (`study.spec.ts`, "revision 4"). Where a rule replaces a hand change, the rule's drawing is compared with the hand change's drawing at every sampled moment, using the hand change's recovered values. Any difference fails.
- **Captures before and after**, in light, dark and forced colours.
  - The pixel comparison was noisy again. A control above the figures had moved the page by a fraction of a pixel, so hair lines and panel tags differ everywhere.
  - P3's field figure, captured at the same offset, came out pixel-identical.
  - The numeric check is the evidence of record.

## 2. The adopted rules

| # | Rule | Figures touched | Fidelity | Comprehensibility | Composition |
|---|---|---|---|---|---|
| R4-1 | Open headings turn, start further out, reach less far (F4) | P1, P3, P4, E3, M3 field | Unchanged: the same drawing as your accepted finish | Unchanged | Unchanged |
| R4-2 | `above (a, b)`; the spatial idiom lifts what is above | E2 spatial | Unchanged in the spatial figure. In kinetic and field the clouds sit higher only because of the loop's order, and the coverage now says so | Unchanged | Unchanged |
| R4-3 | Things beside a station move clear of everything at it | M2 spatial | Unchanged | Unchanged | Unchanged (the rule lands on the same 2.6 m the hand change used) |
| R4-5 | A leaf form | E3 spatial | **Improved:** "plant" is now readable; before, the shapes read as lollipops or toys (OI-11) | **Improved** | **For your look:** the leaves are dark, close to the stems' tone, so the plants read as silhouettes. One leaf seen edge-on reads as a ball half-way up the stem. Clear in dark mode and in forced colours |

**What this changes:**
- **Four hand changes remain in 36 figures:** P1-K1, P2-K1, E1-S2 and P5-S1. Before revision 4 there were twelve.
- **None of the four repeats,** so none is yet a rule.
- **P1-K1 is still a hand change, and its open issue (OI-1) is still open:** the possibilities sit just above "You". No rule yet says where a set of possibilities belongs relative to the presences it is about.

**A correction to what I said earlier:** before measuring, I said the after-captures were "identical" by eye. The pixel comparison showed differences, and the numeric check then settled the question. The figures are identical; the pixel differences come from the page shift.

## 3. R4-4: the comparison of treatments (before your decision)

**Where it applies:** three cases say an amount exists without giving it.
- **P4:** the meeting moves "later". How much later isn't said.
- **E3:** one plant grew "taller". How much taller isn't said.
- **M3:** "two days" late. Here the amount is given, but nothing gives a scale for it.

The rules draw each one at a fixed size (G-31). Each candidate treatment was built in every idiom for all three cases: 36 figures. To see them, open `/lab/study?unscaled=1`, or tick "R4-4 evaluation".

### 3.1 What each treatment asserts

| Treatment | Asserts | Doesn't assert |
|---|---|---|
| **constant** (now) | A particular size: a distance, a height or a width. That size reads as a measurement | Nothing marks the size as arbitrary |
| **(a) labelled** | The same size, then withdraws it in words ("not to scale") | The figure still shows one amount; the words have to undo what the shape says |
| **(b) range** | Only the direction and a lower bound: later, taller, short of the plan. The extent is drawn in the open (tentative) register, with no end point | No particular amount. The open register is the one the study uses for "not established", so the meaning is consistent |
| **(c) break** | A size, with the line marked as cut | Risk: a cut line can read as an interruption (a pause, a stop, damage), which no account reports |

### 3.2 My reading, figure by figure

| | constant | (a) labelled | (b) range | (c) break |
|---|---|---|---|---|
| **P4 kinetic** | Clear; the outline sits at one distance | Clear; the words sit under the course | **Clearest:** "Meeting" fills an open stretch of the future | The `//` reads as a scale break to readers of charts; to others, possibly as a stop |
| **P4 field** | Clear | Clear | The knot becomes a long open ellipse; legible | **Poor:** two strokes across all the lanes read as a wall or a cut in time |
| **P4 spatial** | The path; the meeting outline far along it | **Poor:** the label collides with the manager's figure from within, and floats from above | **Ambiguous:** a long open box reads as an object (a bench, a table) more than as "somewhere along here" | **Poor:** a gap across the path reads as a broken road |
| **E3 kinetic** | Clear | Clear | **Clearest:** the stem solid to the other's height, then open to a dotted top | **Poor:** a break on a stem reads as a broken plant |
| **E3 field** | Clear | Clear | Legible; the open lines at the top are faint | **Poor:** reads as a snapped bundle |
| **E3 spatial** | Clear | Clear; the label sits between the pots | **Fails fidelity:** both plants are drawn equal, with a faint open line above one. The figure reads as "the same height", which contradicts s1 | Not built: a break has no form on a stem in a room (declared, and drawn as the constant) |
| **M3 kinetic** | Clear; "two days" names the gap | Clear ("two days, not to scale") | Clear; the open box fills the shortfall | Acceptable: `//` on the course, under the gap |
| **M3 field** | Clear | Clear | **Cluttered:** the open box overlaps the open headings | **Cluttered:** the strokes cross the headings |
| **M3 spatial** | Clear | **Poor:** the longer words collide with "Build" from above | **Clear:** an open patch of the way between the item and the plan, under "two days" | Reads as a gap in the way |

### 3.3 Where this leaves R4-4 (for your decision)

- **No treatment is best in every idiom.**
- **(b) range is the most faithful** wherever it can be drawn as part of the thing itself: kinetic P4, E3 and M3, and M3's spatial way. It fails in the spatial plants, where it says the opposite of the account; it is ambiguous on P4's spatial path; and it clutters M3's field figure.
- **(c) break is the weakest overall.** In five of its eight figures it reads as interruption or damage. That is the risk your feedback named.
- **(a) labelled is safe in meaning but weak.** It adds words to undo a shape, and it collides with other labels in both spatial path figures (P4, M3): the placement rule (R4-3) covers things, not words.
- **A mixed rule is possible,** for example (b) in kinetic, (a) in spatial and field. That would make the idioms treat one statement differently, a cost the contract should state.

**I haven't adopted any of these.** The choice is yours.

## 4. Your decision on R4-4, and what it changed (2026-11-21)

**What you decided:**
- Range is adopted for the kinetic idiom only, where the comparison showed it says an unspecified amount most faithfully.
- It isn't generalised to spatial or field without evidence.
- It must add no invented bound, magnitude or relation.
- Existing treatments stay elsewhere, provisionally, with their limits written down, and explicitly stated relations ("taller") kept.
- Visual consistency doesn't outrank meaning: idioms may express one uncertainty differently, provided the meaning is the same.

**Two corrections before adoption.** The range as first built still encoded the hidden constant:
- **P4:** the item travelled to the constant's distance before becoming the range, and the range had a closed far end.
- **E3:** the dotted top sat exactly at the constant height (a third taller), and the possibilities were placed relative to it.

**How the adopted range works:**

| Case | What the kinetic figure now asserts | What it no longer asserts |
|---|---|---|
| P4 (moved later) | The meeting leaves its slot and moves just past it. Where it is now is a band of later time in the tentative dash, open at the far end, running to the end of the course | How much later. There is no end point, and the motion no longer travels to a hidden distance |
| E3 (taller) | Both grow. The window plant ends taller by the least visible difference (16 px, a rule constant for "taller", not an amount), its top solid. An open line rises from its top to the frame's margin, with no end | How much taller. "Taller" itself is kept and checked |
| M3 (two days behind) | The item stops short of the plan; the gap is an open patch named "two days" | **Not resolved:** the amount is stated, so it isn't unspecified, but nothing gives a scale. The gap's width is still a rule constant |

**Checks (`study.spec.ts`, "R4-4"):**
- **No hidden amount in the range.** For P4 and E3 the kinetic range figure is identical at every moment whether the hidden constant is 1 or 2.5, while the constant treatment changes. So no part of the range encodes the amount.
- **"Taller" holds** in E3's kinetic figure under every treatment.
- **M3's dependence on a scale is pinned as open.**
- **The rules draw** range in kinetic and the constant in spatial and field.

**The limits of what stays (provisional):**

| Idiom | Treatment kept | What it asserts that the text doesn't | Relation kept? |
|---|---|---|---|
| Spatial | Constant | P4: a distance along the path. E3: a third taller. M3: a scale for "two days" | Yes: the window plant is taller |
| Field | Constant | P4: how far the knot moved. E3: a third taller. M3: a scale for the shortfall | Yes |
| Spatial range (not adopted) | — | It **breaks** "taller": both plants are drawn equal. One reason range isn't generalised | — |

**Accepted figures that changed.** You accepted P4, E3 and M3's kinetic figures with the constant. They now draw the range, so they need your look again. On a first look at the captures:
- **P4:** the open band reads as "somewhere later". While the item moves, its name waits in the middle of the band rather than travelling with it, as it did before.
- **E3:** the open line reads as "taller, by how much is open".
- **M3:** the open patch is faint.

## 5. Captures

In the scratch folder (not in the repository):
- `shots/before-r4` and `shots/after-r4`, plus `after-r4-forced`: every field figure, and the spatial figures of E2, E3, M2 and P3, in light, dark and forced colours.
- `shots/r44` and `shots/r44-forced`: the 36 R4-4 figures in light, dark and forced colours, before the corrections in §4.
- `shots/r44-adopted` and `r44-adopted-forced`: P4, E3 and M3 kinetic, as adopted.
