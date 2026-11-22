# Findings, rules revision 6: coverage from the blind cases (2026-11-22)

> **Status:** you looked at U2, U3 and U4's figures and accepted them (2026-11-22), so R6-1 to R6-3 are adopted (§9). Accepting them doesn't resolve the points questioned in §1–§3: they stay open (OI-31 to OI-35). Nothing in the engine (`shared/visual/`), an exercise or a policy document changed, and no blind case was edited. Everything under "my reading" is mine, not a score.

## Summary

| Step | What was built | Result |
|---|---|---|
| 1. U3: things carried | The motion pattern's carrying case (`idioms/carrying.ts`): things moved by what flows, with no meeting, ride along with it; a question about its motion in a later phase opens its course | **U3 draws in all three idioms** |
| 2. U4: a dependency | `idioms/dependency.ts`: parts of one whole, a complete part filled, a dependent part outlined, the dependency to a group member, an open question about it. Needs no `waiting` and no `precedes` | **U4 draws in all three idioms** |
| 3. U2: a feeling in a place | `idioms/felt.ts`: the viewer's reported feeling where they are, with P2's accepted ring and contours, and the possibilities | **U2 draws in all three idioms** |
| 4. A second blind set (U5–U7), run unchanged | Three cases by a fresh agent that saw only `representation-v0.md` | **All nine figures refused,** each with reasons; one crash found and turned into a refusal (§4) |

**The plain conclusion:**
- **The new patterns draw the cases they were built from.** They didn't draw the next three. In both sets, every blind case was refused in every idiom: 18 of 18 figures.
- **The gap is no longer only missing patterns.** U6 needs two patterns at once: magma moving (motion) and a volcano depending on it (dependency). Each pattern exists, but a figure can't use two.
- **The next step should be composition across patterns,** not a pattern per case (§5).

**Unchanged figures:** the 36 corpus figures, the R4-4 variants and U1's three (now pinned too) draw exactly as accepted (`golden.spec.ts`, 111 figures).

## 1. U3: things carried

**What U3 says:** a river flows from the hills to the sea, carrying sand and stones; nobody can say where it will run next. Its writer made `above (hills, sea)` **inferred**, because "flows down" isn't licensed (OI-25).

**The extension** (`carrying.ts`, reached from the motion pattern only when nothing meets anything, so U1 keeps its code):
- **Carrying:** things `displaced` by the mover, with no `contact`, ride along with it while their statement holds. This follows E1, where what joins the blood rides with it.
- **The course:** a `question` about the mover's motion in a phase after its route is its course from then on, drawn open.
  - The alt text now says "where the river goes after that". Before, it said "whether the river was moving too", P1's wording.
- **Height:** drawn only from an established `above`. U3's is inferred, so the way is level, and the coverage says so. The hills keep their implied slope shape.
- **A mover with no form,** what flows, is drawn as the extent of its flow, with the carried marks travelling along it. A first version drew it as a neutral tile that travelled, which read as a vehicle with two dots on top (§1, my reading). A mover with a form (U1's ball) still travels as a form.
- **The field idiom draws carrying as density:** lanes closer together. The open course becomes tentative lanes beside the whole way. A first version fanned them out at the end, which read as a river mouth.

**My reading (not a score):**

| | Fidelity | Comprehensibility | Composition |
|---|---|---|---|
| Kinetic | Holds: a stream from the hills' foot to the sea, with sand and stones moving along it, then its course open. The hills' slope stands beside a level way, because "down" isn't licensed. **It may read as odd** | Reads as a stream | Spare |
| Spatial | Holds: a winding tube from the slope to the sea, with beads riding on it, and an open stretch around it | **The clearest of U3's three** | Good, in light and dark |
| Field | Holds: dense lanes, and tentative lanes on either side | Readable as flow; "carried" isn't visible as such, only as density | Spare |

## 2. U4: a dependency

**What U4 says:**
- The stock count's first phase, at the main warehouse, is complete.
- The second phase, at the overflow site, needs two people from the sales team.
- Whether they can be released is open.
- `waiting` and `precedes` are **inferred**.

**What is drawn:**
- **The parts sit together** inside their whole (C9). The complete part is filled; the dependent part is outlined.
- **"An outline" means its state isn't given,** not "not started": that would need `waiting` or `absent`, which U4 doesn't establish.
- **The two people stand among their team.** A fine line runs from the second phase to them, with an open ring around them.

**My reading:**

| | Fidelity | Comprehensibility | Composition |
|---|---|---|---|
| Kinetic | Holds. The outline could still be read as "not started" | **Clear:** done, needs, open | Good |
| Spatial | Holds | Clear from the side. From above, the standing figures foreshorten | Good |
| Field | Holds: a settled bundle, lanes running to an unresolved boundary | Clear enough | Spare |

**In forced colours:**
- **Kinetic:** the filled part becomes only a differently coloured outline, and **the two people look the same as the rest of their team.** Subject and context draw alike there (OI-32).
- **Spatial:** keeps both distinctions.

## 3. U2: a feeling in a place

**What U2 says:** "I" sat in a dentist's waiting room with my heart racing; two possible causes; "I don't know". `waiting` is inferred.

**What is drawn:**
- **Kinetic:** P2's felt ring, closing to the reported charge, in a soft plane for the place. The two possibilities follow, on a ring beside it.
- **Spatial:** the person in a stand-in room. As in P2, the feeling has no form in a still scene. The person stands, the declared neutral pose (OI-3), although the text says "sat".
- **Field:** P2's contours, as many as the charge gives, and two open headings.

**My reading:**

| | Fidelity | Comprehensibility | Composition |
|---|---|---|---|
| Kinetic | Holds | Clear | Good |
| Spatial | **Shows little:** a person in a room, with nothing about the racing heart. It is honest, as P2 is, but weak. The label is the text's own word, "I" | Readable | **Forced colours:** the walls and floor disappear (as OI-27), leaving a figure in emptiness |
| Field | Holds | Clear, as P2 | Good |

## 4. The second blind set (U5–U7), run unchanged

**How they were written:**
- A fresh agent wrote them. It was given only `representation-v0.md` and the settings to avoid; it wasn't told which patterns exist.
- They were run without any change to the code meant to make them draw.

| Case | Text (short) | Result | What stood in the way |
|---|---|---|---|
| U5, psychology | At a supermarket checkout, the wallet left in the car; it felt embarrassing; did the cashier mind waiting? | Refused ×3 | **Found a bug first.** The felt pattern's needs held (a feeling of the viewer's own, the viewer placed), but U5 also places the wallet, which the pattern didn't account for, so it crashed. Its need is now declared ("nothing placed but the viewer"), so U5 is refused |
| U6, education | Volcanoes form when magma rises and escapes through a crack; when one will erupt can't be predicted | Refused ×3 | **Two patterns at once.** Motion draws magma moving but not the dependency; dependency draws "the volcano depends on magma" but not the flow |
| U7, planning | The move can't start until the cabling is finished; push back or connect temporarily, undecided | Refused ×3 | Dependency lacks a `complete` or `part-of` and has no place for `waiting` or for a set of possibilities. M1's patterns need `complete`, `precedes` and `absent` |

**What this shows:**
- **Each new pattern fits its own case.** U7 is close to both M1 and U4, but it is neither.
- **Refusals stay honest.** A crash in a new pattern was found by an unseen case, and the cure was a declared need, not a fix to make it draw.
- **The limit of this evidence:** both blind sets were written by agents, not by people outside the study. The second agent was told which settings to avoid, so it chose new kinds of event on purpose.

## 5. What this points to (for later; not done)

1. **Composition across patterns.** A figure that draws the statements one pattern covers and lets another draw the rest, in one scene. U6 is the test case. This is a change to the registry and to how patterns share a frame, and it is the step most likely to move coverage beyond one case per pattern.
2. **A dependency with `waiting` and a possibility set** (U7). It is a smaller step, but it adds one more single-case pattern unless (1) comes first.
3. **People outside the study writing unseen cases.**

## 6. Measurements

**Work per frame:** checked after confirming the browser's frame pacing (60 fps), on both backends at ratios 1 and 2.
- U4 spatial is the heaviest: 1.0 ms median, 1.7 ms at most.
- U3 spatial: 0.6 / 1.2 ms.
- Everything else: under 0.5 ms median.
- Every figure stayed in the full tier.

U2's, U3's and U4's field figures are still, so there was no motion to measure.

## 7. Checks

**Specs:**
- **`golden.spec.ts`:** 111 figures pinned (U1 added, accepted). All unchanged.
- **`revision-6.spec.ts`:**
  - U2–U4 drawn by felt, motion and dependency
  - every unseen figure valid
  - nothing inferred cited
  - U5–U7 refused
  - U6 needs two patterns
  - U5 refused by the felt pattern's declared need
- **`revision-5.spec.ts`** and **`pass-c.spec.ts`:** kept current.
  - The audit's vocabulary filter adds `inferred` and the viewpoint stance names.

**Runs:**
- **Unit tests:** 1,130 in 77 files, all pass.
- **Lab browser tests:** 30, all pass.

**Captures** (scratch folder): `shots/u3`, `u3k`, `u4`, `u2`, `r6` (light and dark), `r6f` (forced colours).

## 8. What waits for you

1. ~~Your look at U2–U4.~~ Done on 2026-11-22; accepted (§9). The points below stay open. The points I'd question:
   - the level way beside U3's slope
   - "an outline" in U4 being read as "not started"
   - U2's spatial figure saying little
   - forced colours (U2 spatial walls; U4 kinetic subject and context)
2. **Whether composition across patterns comes next** (§5.1).
3. **OI-25,** the "down" licence, which U3 and U6 both run into.

## 9. Your decision (2026-11-22)

**What you decided:** you looked at U2, U3 and U4's figures in the Lab and accepted them.

**What this adopts:** R6-1 (carrying), R6-2 (dependency) and R6-3 (felt in a place). U2–U4's nine figures are pinned in `golden.spec.ts` with the corpus and U1: 120 figures in all.

**What it doesn't resolve,** kept open:
- **OI-31:** a figure can't combine patterns (U6).
- **OI-32:** in forced colours, U4's two people look like the rest of their team, and U2's room disappears.
- **OI-33:** U3's level way beside the slope ("down" unlicensed, OI-25).
- **OI-34:** U2's spatial figure shows only a person in a room.
- **OI-35:** U2's spatial figure opens on the viewer's own view, an empty room. You first saw nothing of U2 there.
- **"An outline" in U4:** it may be read as "not started".

**What it isn't:** evidence that the rules draw new content. The second blind set (U5–U7) is still refused in every idiom (§4).

