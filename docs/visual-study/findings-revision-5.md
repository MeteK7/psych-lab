# Findings, rules revision 5: content independence (2026-11-22)

> **Status:** you looked at U1's three figures and accepted them (2026-11-22, "Good"), so R5-1 to R5-4 are adopted (§9). Accepting them doesn't resolve the points questioned in §3: they stay open (OI-27 to OI-30). Nothing in the engine (`shared/visual/`), an exercise or a policy document changed. Everything under "my reading" is mine, not a score. This is about the study's rules and contract, not the production engine.

## Summary

| Step | What changed | Result |
|---|---|---|
| 1. Composition dispatch | Each pattern says what it needs; every able pattern is drawn and the one leaving the fewest established statements undrawn wins; with none able, the idiom **refuses** and says what each pattern lacked | **No corpus figure changed.** All 36 choose the pattern they chose before |
| 2. Form, and settings from facets | Representation v0.2: a `form` statement (open features), `place` open; built settings (home, meeting room, carriage) reached by the reported place, not by a predicate | No corpus figure changed |
| 3. A general pattern for things in motion | `motion.ts`: a route, height, a meeting, being moved and forms, in all three idioms | U1 draws in every idiom. **A fit, not a test:** the pattern was built after U1 was seen |
| 4. Blind unseen cases | Three cases (U2–U4) written by an agent that saw only `representation-v0.md`, never the rules' code or the corpus | **All nine figures refused,** each with reasons. None crashed, none reached another case's pattern |
| D5, D8 | Grammar from the `own` flag and counts; descriptions in the statements' own words where more than one representation reaches a pattern | Alt texts reworded in 24 figures (shapes unchanged); the "Blood" leak gone |

**The plain conclusion:**
- **The dispatch is now honest.** It refuses rather than drawing the wrong case.
- **Coverage is still one case per pattern.** In the corpus, every figure has exactly one able pattern. Each existing pattern needs most of one case's statements.
- **The general pattern covers only U1's shape of event.** None of the three blind cases fits it. Content independence is shown for refusing, not yet for drawing.

## 1. Composition dispatch

**How it works** (`idioms/registry.ts`):
- Each idiom lists its patterns in the old order.
- Each pattern declares what it **needs**, in words: the statements it can't draw without, plus role conditions (a plural presence, the viewer's own presence, a field quality, a reported place).
- These needs were read from each pattern's code, as the statements it uses without a guard.
- **Choosing:**
  - Every pattern whose needs hold is drawn.
  - The one leaving the fewest established statements undrawn wins.
  - Ties go to the earlier pattern.
- **Refusing:** with no able pattern, the idiom throws a `Refused` that carries each pattern's unmet needs. The Lab shows it as a "Not drawn" panel.

**Proof that nothing changed:**
- **`golden.spec.ts` pins 108 figures:** 36 by the rules, 36 finished, 36 R4-4 variants. Each has two hashes over every sampled moment:
  - **shape:** every word masked
  - **full:** words, purposes, alt text and coverage included
- **Before any change,** both were written from the committed state.
- **After steps 1–3:** every shape was unchanged. The full hashes changed only where wording was changed on purpose (D5, D8). They were re-pinned after the shape check had passed.
- **`revision-5.spec.ts`** pins the corpus's choices, pattern by pattern.

**Two findings:**
- **Exactly one pattern is able for every corpus figure.** There is never a second candidate, so the scoring never decides anything in the corpus. This confirms pass C's finding from a different side: each pattern is one case's pattern.
- **D9 (new): hidden statement ids.** P1's patterns (encounter, clarity, passing) and P2's (transmission, agitation) name their own case's statement ids in their coverage (`q1`, `q2`, `q3`, `s1`–`s6`).
  - Pass C's audit looked for case ids, not statement ids, so it missed them.
  - U2 found it: its needs satisfied P2's agitation pattern, which then failed on P2's ids.
  - **Fix:** those ids' kinds are now declared as needs, so such a case is refused, not crashed.
  - **Still open:** the ids themselves remain in those two cases' patterns. They are harmless now, but they are still one case's code.

## 2. Form, and settings from facets (representation v0.2)

**What v0.2 adds** (`representation-v0.md` §3, §5, §7):
- **`form (what, feature)`:** a statement, with its own commitment and basis.
  - **Features the kit draws:** round, block, slope, upright, flat, long.
  - **Any other feature,** or none given, gets the neutral form, and the coverage says so.
- **`place` is open:** a word, no longer a list of the corpus's settings (D2).
- **L-form, under review:** a noun whose ordinary sense fixes a shape licenses an implied `form`. "A ball" gives round, "a box" gives block, "a ramp" gives slope. It is borderline in the same way as OI-8.
- **U1 updated to v0.2:** it gained three `form` statements (f1–f3). Nothing else in it changed.

**Settings:**
- The home, meeting room and carriage are reached only when the space facet reports that place.
- Before, `contact` alone led to the carriage and `reacts` to the meeting room.
- **What this removes:** D1, D2 and D6 as bindings of settings to predicates.

**Still bound:**
- **The plants pattern** still draws any two compared things as potted plants (D7).
- **Why it wasn't changed:** E3's representation doesn't say "plant", and adding form statements to a corpus case would have changed its accepted figure.

## 3. The motion pattern and U1 (accepted 2026-11-22)

**Where it is:** `idioms/motion.ts`, in all three idioms.

**What it needs:**
- something that moves (`flows` or `displaced`), on one route, with one meeting
- every established statement drawable as a route, height, a meeting, being moved or a form
- no possibility set, no plural presence and no own presence: those aren't built yet
- in the field idiom, a field of agitation

**What it draws for U1:**

| Idiom | Drawn |
|---|---|
| Kinetic | The ramp as a slope above the floor. The ball rolls down, meets the box, and a fine ring marks the moment. The box starts moving only then: it moves a short way, and an open band runs on with no end (R4-4 range, adopted for this idiom). After the hit the ball is drawn open, because the text says nothing more of it |
| Spatial | The moment just after the hit (S8): a wedge for the ramp, a sphere and a cube, the box's earlier place outlined, and an open stretch of floor ahead. Viewpoints: front, and from the ramp's high end |
| Field | Lanes run down and along. Rings spread from the meeting. The lanes carry on a short way, then go on open to the edge |

**How each idiom treats the box's unknown end:**

| Idiom | How far the box slides | Where it ends (q1) |
|---|---|---|
| Kinetic | Open (range) | Open |
| Spatial, field | A rule constant (R4-4 stays provisional) | Open |

**Captures** (scratch folder, not in the repository):
- `shots/u1`, `u1b` and `u1c`: light and dark, five moments
- `u1f`: forced colours, and a refusal panel

**My reading (not a score):**

| | Fidelity | Comprehensibility | Composition |
|---|---|---|---|
| **Kinetic** | Says what U1 says. **Two assertions to judge:** the rise of the ramp is a rule constant (how high isn't said); and the ball drawn open after the hit is a choice: it avoids drawing the inferred "it stops" (i1), but it may read as the ball vanishing | Clear as a sequence: roll, hit, slide. The trace of the ball's way runs parallel above the slope and **reads like a second rail** (rule K4) | Clean; the names travel with their forms |
| **Spatial** | Holds, with the same constants (height, length, how far it moved) | The front view is clear. From the high end the ramp reads as a wedge | **Forced colours:** the floor plane disappears (its role draws no fill), leaving the forms on blank ground; the ramp is a dark fill |
| **Field** | Lanes and rings say "went down, hit, something spread"; the forms are, rightly, not drawn | **The rings read as a target or a sound wave** rather than "agitation". Of the three, it says least | Busy where the rings cross the lanes |

**A fidelity question I found in U1 itself:** U1's `above (ramp, floor)` is `implied`, with the basis "as E2" ("down … to"). No row in §5 licenses "down" as above. The blind writer, following §5 literally, made the same relation `inferred` in U3. So the licensed list lacks a rule that U1 and E2 both rely on. Recorded as OI-25.

## 4. The blind unseen cases (U2–U4)

**How they were written:**
- An agent wrote them, given only `representation-v0.md` (v0.2) and the task. It saw no idiom code, no corpus and no findings.
- They were run unedited, with no code changes (`unseen-blind.ts`).
- **The limit of this evidence:** this is weaker than cases written by a person outside the study. The agent shares the author's training, and it chose its texts knowing they would be drawn.

| Case | Text (short) | Result | Nearest pattern, and what it lacked |
|---|---|---|---|
| U2, psychology | Heart racing in a dentist's waiting room; two possible causes | Refused ×3 | Spatial `athome`: a reported home, `holds`, `receives`. Kinetic: nothing near (no exchange, no movement). Field `agitation` (P2's): exchanges, `holds`, two questions |
| U3, education | A river flows from hills to the sea, carrying sand and stones; its future course is open | Refused ×3 | **Motion, one step away:** two things carried where it draws one. In the field idiom, also a field of agitation (U3's is density) |
| U4, planning | Phase one of a stock count complete; phase two needs two people who may not be released | Refused ×3 | Kinetic `blocked` and field `held` (M1's): `precedes`, `absent`, `waiting` and a time question. U4's writer made `waiting` and `precedes` inferred, by §5's letter |

**What the refusals show:**
- **Coverage is the gap, not honesty.** Every refusal is reasoned, and the Lab lists each pattern's unmet needs.
- **U4 is the structure of M1** (a dependency, one part done). It is refused because the blind writer, by §5's letter, didn't license `waiting` from "needs … not yet clear whether". The rules needed a statement the text didn't license. That is the right outcome, but a pattern able to draw a dependency without `waiting` would cover it.
- **U2 has no pattern for a feeling in a place without an exchange.** The feeling pattern needs P2's whole exchange.
- **U3 shows that the general pattern is narrow:** one route, one meeting.

## 5. D5 and D8

**D5:**
- **What it fixes:** the alt text's agreement comes from the `own` flag and from an element's count, never from an id.
  - `word()` no longer special-cases `team`.
  - A word that has its article keeps it.
  - The spatial own-label uses the own presence's own word key.
  - `contact` and `displaced` read from the predicates' meaning ("comes into contact with", "is moved off its place by"), not from P6's wording ("catches hold of", "thrown off balance").
- **Errors it also fixed,** which were there before: "You sends apology", "The others is at train", "You waits for the reply".
- **A cost:** P6's alt text no longer says "catch hold of", which the account does say. The predicate can't carry it.
- **Left, recorded:**
  - "The someone" (P5): an indefinite pronoun given an article.
  - "at train" and "at room": places with no word.
  - Number for things: a word ending in -s is read as plural in `above`.

**D8:**
- **Where it applies:** descriptions in the patterns that more than one representation reaches. That is the cycles (E1, E2), the waits (P3, M2) and the path scene.
- **What changed:** those descriptions are built with `word(c, id)` from the statements.
- **Result:** "Blood" no longer leaks into E1's reworded field figure.
- **Left, recorded:** single-case patterns (P2, P5, P6, M1, P1) still describe their own case's things. That is harmless while each is reached only by its case. The pin in `pass-c.spec.ts` shows if that changes.

## 6. Measurements

**U1's figures:**
- **Work per frame:** 0.2–0.4 ms median, at most 0.7 ms, on both backends at ratios 1 and 2.
- **Frame pacing:** checked first because of OI-23, it was 60 fps this time. The 30 fps throttling seen earlier on 2026-11-22 did not recur, so OI-23 is intermittent.

## 7. Checks

**Specs:**
- **`golden.spec.ts`:** 108 figures pinned, shape and wording.
- **`revision-5.spec.ts`:**
  - the corpus choices
  - one able pattern each
  - U1 refused in every idiom when the motion pattern is left out
  - U1 drawn and valid
  - U2–U4 refused, with reasons
  - U3 one step away
  - refusals never throw
- **`pass-c.spec.ts`:** re-pinned to what remains.
  - Leaks: "You" only.
  - Content branches: `own` and `team` gone.
  - U1 draws, and its field idiom refuses other qualities.

**Runs:**
- **Unit tests:** 1,125 in 76 files, all pass.
- **Lab browser tests:** 30, all pass.

## 8. What waits for you

1. ~~Your look at U1's three figures.~~ Done on 2026-11-22; accepted (§9). The points I'd question stay open (OI-27 to OI-30).
2. **Whether to extend coverage next, and how.** The cheapest steps that the blind cases point to:
   - several things carried along one route (U3)
   - a dependency without `waiting` (U4)
   - a reported feeling in a place, with no exchange (U2)

   Each would be built, then judged as step 3 was. Each new pattern risks being "U-n's pattern" in turn, so new blind cases should test it, ideally written by a person.
3. **L-form, and the missing "down" licence (OI-25):** whether they belong in §5.

## 9. Your decision (2026-11-22)

**What you decided:** you looked at U1's three figures in the Lab and accepted them ("Good").

**What this adopts:** R5-1 (composition dispatch), R5-2 (settings by reported place), R5-3 (form from `form` statements) and R5-4 (the motion pattern).

**What it doesn't resolve,** kept open:
- **OI-27:** in forced colours, the spatial ground plane has no fill.
- **OI-28:** after the meeting, the kinetic mover is drawn open. This may read as the ball vanishing.
- **OI-29:** the kinetic trace runs parallel above a slope and reads like a second rail (K4).
- **OI-30:** the field's rings read as a target or a sound wave rather than agitation.
- **Constants for amounts the text doesn't give:** the ramp's rise, the slope's length, and how far the box moves in the spatial and field idioms (OI-4 family).
- **OI-25:** the missing "down" licence, and L-form under review.

**What it isn't:** evidence that the rules draw new content. The blind cases (§4) are all still refused.

