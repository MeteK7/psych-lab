# Findings, rules revision 7: composition across patterns (2026-11-22)

> **Status:** you looked at U5, U6 and U7's composed figures and accepted them, U6's volcano drawn neutral (2026-11-22). So R7-1 to R7-3 are adopted (§8). Accepting them doesn't resolve the points questioned in §3: they stay open (OI-36, OI-37, OI-39). Nothing in the engine (`shared/visual/`), an exercise or a policy document changed, and no blind case was edited. The 120 accepted figures are unchanged (`golden.spec.ts`). Everything under "my reading" is mine, not a score.

## Summary

| Step | What was built | Result |
|---|---|---|
| 1. Composition path | When no single pattern can draw a case, a base pattern draws what it can, and additions draw the rest onto the elements it placed (`idioms/compose.ts`) | Used only when no single pattern is able, so **no accepted figure changed** |
| 2. Additions | `located-in`, `part-of`, `depends-on`, `waiting`, `question`, `alternatives` and `form`, in all three idioms. The spatial idiom draws `waiting`, `question` and `alternatives` as notes, as before | — |
| 3. U5–U7 (refused in revision 6) | Run unchanged | **U6 and U7 composed in all three idioms, U5 in two.** U5's spatial figure is refused: it would put the wallet inside the shop |
| 4. Third blind set (U8–U10), run unchanged | Three cases by a fresh agent that knew nothing of patterns or composition | **All nine figures refused.** First, **8 of 9 crashed:** corpus patterns' needs were too small to be safe. The dispatch now names such a failure as a refusal reason |

**The plain conclusion:**
- **Composition widens coverage: 8 of 9 figures for U5–U7,** which no single pattern could draw.
- **It doesn't yet reach new blind cases.** U8–U10 need statements no base or addition draws:
  - `precedes`, `exceeds` and a feeling not of agitation (U8)
  - a cycle through one place (U9)
  - established statements that only another pattern's base would draw (U10's are mostly `part-of` and `exceeds`, with its dependency inferred)
- **The bigger finding is in the corpus's own patterns.** Six of them (plants, compared, grownField, system, cycle and flow) declared needs that a new case could meet and then fail on. In revisions 5 and 6 no blind case happened to reach them.

## 1. The composition path

**Bases:**
- The bases are the general patterns: motion (with carrying), dependency and felt.
- For a case, each base takes the statements it draws (its domain). It is drawn on a narrowed copy of the case that holds only those statements, plus the inferred ones, which nobody draws.
- The base leaving the fewest statements to additions wins.
- A composition is made only if every remaining statement has an addition.

**Anchors:**
- **Kinetic and field:** read from the base's drawn elements, by element id: a shape's centre, else its label's place. The base patterns didn't change for this.
- **Spatial:** the four base patterns gained an optional hook (`add3`), unused unless composing, that hands the additions the base's space and where it placed each thing.

**New elements:**
- A thing the base didn't place (U5's wallet and cashier, U6's volcano) is set in free space beside what its statement relates it to.
- The space is checked against the extent of everything drawn, and set once, from the figure's last moment, so nothing jumps while it plays.
- **The coverage says "placed beside, for room, not because the text says near".**

**What composition never does:** draw an inferred statement (checked for every composed figure).

**Two fixes found while building it** (no accepted figure used either):
- A figure with one viewpoint had no camera. Now the one key is held.
- The dependency pattern drew whatever was depended on as standing people. Now a thing gets its form, and only a presence is drawn as people.

## 2. Corpus patterns that failed on unseen cases (found by U8–U10)

**What failed:**

| Pattern (case written for) | Failed on | How |
|---|---|---|
| `plants` (E3, spatial), `compared` (E3, kinetic) | U8, U10 | Their needs are a single `exceeds`. Then their coverage doesn't account for the rest of the case |
| `grownField` (E3, field) | U8 | as above |
| `system` (E1/E2, spatial) | U9 | Needs only `cycles`. Fails on the rest |
| `cycle`, `flow` (E1/E2, kinetic and field) | U9 | A cycle through one place breaks the layout |

**The cure** is general, in `registry.ts`: a pattern is able only if its needs hold **and** it draws the case with every statement accounted for. A failure becomes a named reason in the refusal ("fails on this case: …"). Nothing is hidden: the Lab's "Not drawn" panels show each one.

**Still open (OI-39):** the patterns' own needs are still too small. A pattern that fails is now refused, but it should have said so in its needs.

## 3. U5–U7, composed (for your look)

| Case | Base, plus additions | Kinetic | Spatial | Field |
|---|---|---|---|---|
| U5: wallet left in the car at the checkout; embarrassed; did the cashier mind? | felt + 2 (the wallet's place; the open question about the cashier) | drawn | **refused:** a second place can't go inside the felt pattern's room | drawn |
| U6: magma rises and escapes through a crack in the crust; volcanoes form when it does; when one will erupt is open | motion + 4 (magma's start; the crack part of the crust; the volcano depending on magma; when) | drawn | drawn | drawn |
| U7: the move can't start until the cabling is finished; push back or connect temporarily, undecided | dependency + 3 (waiting; what happens to the move; the two options) | drawn | drawn | drawn |

### 3.1 My reading (not a score)

| | Fidelity | Comprehensibility | Composition |
|---|---|---|---|
| **U5 kinetic** | Holds: you at the checkout with the felt ring, the wallet in the car, the cashier drawn open (only an open question concerns them). **The car placed beside the checkout may read as "near"**, although the coverage says it isn't | **Clear** | Good |
| **U5 field** | Holds. The wallet and the cashier are small marks beside the contours | Readable | Spare |
| **U6 kinetic** | Holds: magma moves from the depths to the crack, the crust outlined around the crack, the volcano beside the magma, linked to it, and an open ring for when | **Readable once you know the text.** Without it, the volcano is a tile with a ring | Fair |
| **U6 spatial** | Holds structurally | **Poor:** boxes in space, and the labels sit loosely. It reads as a diagram, not a scene | Poor |
| **U6 field** | Holds | Readable | Fair |
| **U7 kinetic** | Holds: the move (state not given) linked to the cabling, its way held short at a boundary, an open ring for its fate, then two possibilities | Readable | **Cluttered:** the possibility marks and the open ring crowd the move |
| **U7 spatial** | Holds: the move as edges, the cabling as a solid, the line between. Waiting, the question and the options are in the words beside it | Readable | Spare |
| **U7 field** | Holds | **Busy:** headings cross the lanes | Busy |

**Forced colours** (`shots/r7f`): everything stays distinguishable. As before, subject and context draw alike (OI-32).

### 3.2 Wording in the text alternative (OI-26, wider)

The question wordings come from the corpus:
- U5's "whether" reads "what the cashier did".
- U6's "time" reads "when the volcano will come".

Neither says what the text asks. Fixing them would change the accepted figures' text, which this revision may not do, so they're recorded.

### 3.3 Measurements

Checked at 57–60 fps. U5–U7's moving figures cost 0.3–0.4 ms median, at most 1.1 ms, and every figure stayed in the full tier.

### 3.4 The question for you

U6's volcano has no established form, so composition draws it as the neutral form (a soft tile in kinetic, a cube in spatial). Two choices:
- **Draw such a thing neutral,** as now, and declare it in the coverage.
- **Refuse a case whose central thing has no form.**

The neutral volcano is honest, but it says little. I'd keep it neutral, and ask whether that's acceptable to you when you look.

## 4. The third blind set (U8–U10), run unchanged

| Case | Text (short) | Result | What stands in the way |
|---|---|---|---|
| U8, psychology | A cold lake swim before breakfast; colder than expected; felt like waking up; why I waited so long | Refused ×3 | `precedes` and `exceeds` have no addition. In the field idiom the feeling is clarity, not agitation |
| U9, education | The Moon goes round the Earth once a month, always the same side to us; how it formed is unknown | Refused ×3 | A cycle through one place: the cycle patterns fail (§2), and nothing else draws `cycles` |
| U10, planning | A training programme has spent most of its budget with three of five workshops to run; drop one or ask for more | Refused ×3 | Its dependency is inferred, so no base draws its parts; `exceeds` has no addition |

**The limit of this evidence:** the blind writer was an agent, told which settings to avoid. It wrote more relations (`part-of`, `exceeds`, `precedes`) and fewer events than earlier sets.

## 5. What this points to (for later; not done)

1. **Additions for `precedes` and `exceeds`** (order, and more-than) would let U8's and U10's established statements be composed.
2. **Base patterns for relations, not events:** parts and amounts with no dependency (U10), and a cycle through one place (U9).
3. **Needs read from what a pattern draws, not from one case** (OI-39). The registry now catches the failures, but the needs should prevent them.
4. **Question wordings from the question's own content** (OI-26). This needs a change to accepted figures' text, and so your approval.

## 6. Checks

**Specs:**
- **`golden.spec.ts`:** 120 figures, all unchanged.
- **`revision-7.spec.ts`:**
  - U5–U7 composed by the expected bases
  - every composed figure valid, with nothing inferred cited
  - U8–U10 refused
  - the corpus patterns that failed on them named
- **`revision-6.spec.ts`:** U5–U7 are still refused without composition.

**Runs:**
- **Unit tests:** 1,132 in 78 files, all pass.
- **Lab browser tests:** 30, all pass.

**Captures** (scratch folder): `shots/r7` (light, dark), `r7f` (forced colours).

## 7. What waits for you

1. ~~Your look at U5–U7.~~ Done on 2026-11-22; accepted (§8).
2. ~~The neutral volcano (§3.4).~~ Accepted as drawn: a thing with no established form is drawn neutral, and its coverage says so.
3. **Which of §5 comes next.**

## 8. Your decision (2026-11-22)

**What you decided:** you looked at U5, U6 and U7's figures in the Lab and accepted them, with U6's volcano drawn neutral.

**What this adopts:**
- R7-1 (composition), R7-2 (the additions) and R7-3 (able means drawn).
- U5–U7's eight drawn figures are pinned in `golden.spec.ts`. U5's spatial figure is refused, so it isn't pinned. That makes 128 figures in all.
- **A rule from your choice:** a thing with no established form is drawn as the neutral form, declared in the coverage, rather than the case being refused (OI-38).

**What it doesn't resolve,** kept open:
- **OI-36:** an added thing placed beside another may read as "near".
- **OI-37:** U6 spatial reads as a diagram; U7 is crowded.
- **OI-39:** the corpus patterns' needs are too small.
- **OI-26:** question wordings.

**What it isn't:** evidence that the rules draw new content. The third blind set (U8–U10) is refused in every idiom.

