# Findings, pass C: behavioural independence (2026-11-21)

> **What this shows, and what it doesn't.** Pass C tests the study's own rules and contract (`pages/lab/study/`), which draw through the engine's existing interfaces. It shows how far **the study's interpretation-to-figure layer** depends on any one domain. It says nothing new about the **production engine** (`shared/visual/`), which no change here touches; the engine's own coupling is recorded where it limited the study (§4). Every check is in `pass-c.spec.ts`. Known dependences are pinned there as findings, not passes, so that a change to any of them shows.

## Summary

| Test | Result |
|---|---|
| 1. Equivalent representations, reworded into another domain | **Holds.** Eighteen rewordings (6 cases × 3 idioms) give identical geometry, timing and motion apart from text |
| 2. Domain knowledge in the rules' code | **Mixed.** No rule names a case. But the spatial idiom binds each predicate to the setting of the case that introduced it, and nine branches key on corpus content |
| 3. A representation never seen (U1, physics) | **Fails in all three idioms.** Each reaches a pattern written for one case and breaks on what U1 doesn't have |
| 4. A second style pack | **Holds within the engine's limit.** Re-mapping domains onto other ramps changes only colour, and every figure stays valid. A new ramp would need an engine change |

**The plain conclusion:** the study's rules generalise across **structure** (twin texts in different domains draw the same) but not yet across **content**. A new combination of predicates reaches code that was written for one case. Independence is shown for re-wording, not for new meaning.

## 1. Equivalent representations, equivalent behaviour

**How it was tested:**
- Six cases (the twins P3/M2 and P4/M3, plus E1/E2) were each rewritten in another domain's words:
  - every element id
  - every word
  - the text, domain and source
  - the possibility wordings
- Structure was kept. Examples:
  - P3, a friend not replying, became a supplier not replying.
  - M3, a build two days late, became an essay two days late.
  - E1, blood through the heart, became water through basins.
- Each was drawn by the same rules, and compared at every sampled moment and viewpoint. Text, ids and descriptions were masked; numbers, roles, materials, dashes and motion were kept (`pass-c.ts`, `geometry`).

**Result:** all eighteen match exactly. The case's own id, which seeds the scene, doesn't affect any figure.

**Words that survive into a reworded figure:**

| Figure | Word | Why | Kind |
|---|---|---|---|
| P3 field, P4 spatial, P4 kinetic | "You" | The own presence is always "you" | Rule-justified: it comes from the `own` flag, not the domain |
| E1 field | "Blood" | E1's field pattern describes its lanes in circulation words | Dependent: in the descriptions only, nothing drawn; a screen-reader audit of purposes would read it |

## 2. Domain knowledge in the rules' code

**How it was audited:** the audit scans `idioms/` and `kit/`, with comments removed, for three things:
- case ids
- the corpus's element ids and their words
- comparisons against literal strings

**What is neutral:**
- **No rule names a case.** No `P1`, `E2` or other case id appears in any rule.
- **Every idiom dispatches on predicates and facets,** never on case ids or domains.
- **Places, ids and labels come from the statements.**

**What depends on content (pinned in the spec):**

| # | Where | What | Kind |
|---|---|---|---|
| D1 | `spatial()` | Each predicate is bound to its first case's setting:<br>• `contact` → a train carriage (P6)<br>• `reacts` → a meeting room (P5)<br>• `located-in` → a home with a phone and a window (P2)<br>• `exceeds` → two potted plants by a window (E3)<br>• the gated path → a way with a licence and a build (M1)<br><br>The slice-2 pattern table wrote these settings into the rules (`idioms.md`: patterns G, C, D) | **Dependent.** The largest finding: a new case with `contact` between objects gets a carriage of people |
| D2 | `facets.space.place` (representation) | The place list includes `meeting-room` and `carriage` | **Dependent:** the representation names corpus settings |
| D3 | `kinetic()`, `field()` | `contact` and `displaced` assume a plural presence (a crowd); field `agitation` assumes a `feels` statement | **Dependent:** a pattern written from one case (P6, P2) |
| D4 | kinetic and field cycles | Forms keyed to E2's states: `vapour`, `cloud`, `rain` | **Dependent:** another substance's states get the default form |
| D5 | `contract.ts` | `word()` special-cases `team`; the grammar keys "you are / is" to the id `own`, not to the `own` flag; the spatial own-label uses the word key `own` | **Dependent,** and small: a case whose own presence isn't called `own` reads "is" for "are" |
| D6 | `spatial.ts` | The home's window wall (`left`/`front`) and the `home` room id | **Dependent** (P2; with D1) |
| D7 | Identifiers | `sender`, `crowd`, `plant`, `phone`, `window`, `room` | **Mostly naming.** The pattern takes its parts from the statements, but `plant()` draws any two compared objects as plants (with D1) |
| D8 | Descriptions | About 250 purpose strings name corpus things ("The licence: not here…", "Blood carrying the oxygen…") | **Dependent in the metadata:** never drawn, but they misdescribe a figure drawn for other content (the "Blood" leak in §1) |

**Also known to depend on one case (from the plan; still true):**
- **P1's approach distance** is a fixed constant written for that encounter.
- **The hand-built settings** (P2's room, P5's meeting room, P6's carriage) are geometry written for one kind of place (OI-16).

## 3. A representation the rules have never seen

**The case:** U1 (`unseen.ts`) is a physics text: "A ball rolls down a ramp and hits a box at the bottom, which slides across the floor."
- It was written after the rules were frozen at revision 4, in pass A's conventions, before it was drawn.
- It uses only predicates the rules already have: `flows`, `above`, `contact`, `displaced`, an inferred statement and an open question.

**How it was run:** through all three idioms, with no code changes.

| Idiom | What happened |
|---|---|
| Spatial | **Throws.** `contact` dispatches to the carriage (P6), which looks for a plural presence |
| Kinetic | **Throws.** `contact` dispatches to `jostled` (P6), which looks for a plural presence |
| Field | **Throws.** U1's field quality, `agitation`, dispatches to P2's pattern, which needs a `feels`. Given `density` or `clarity` instead, `contact` reaches the crowd pattern (P6) and throws there |

**What this means:**
- **The dispatch is the weak point.** It tests for one predicate, first match wins, and each match leads to a pattern built from one case. A composition of predicates the corpus never combined has no pattern.
- **Even if the code didn't throw,** the spatial idiom would have drawn the ball and box as people on a train (D1). That is a worse failure than a crash.
- **Nothing was fixed.** The plan said to record failures, not hide them, and the spec pins them.

## 4. A second style pack

**What the pack does:**
- `subjects` (`figures.ts`, `PACKS`) draws education in the engine's `regulation` ramp and planning in its `action` ramp.
- Previously both borrowed psychology's area themes (PL-3). Psychology is unchanged.
- To view it, open `/lab/study?pack=subjects`.

**Result:**
- **Only colour changes.** Every one of the 36 figures has identical geometry under both packs.
- **Every education and planning figure validates in its new ramp.** Captures in light and dark look right.

**The limit:** the engine's theme set is closed (`THEMES`: five named ramps).
- A pack can only re-map domains onto those five ramps, and each still carries a psychology area's name.
- A ramp of its own for education or planning would be a change to `shared/visual/`, which was outside this pass (OI-18).
- The wording of the engine's purpose kinds was not varied. It belongs to the engine too.

## 5. What would be needed, for later (not done)

These are recorded for the next design step. None is part of this pass.
1. **Dispatch on compositions of predicates,** with a pattern able to say "I can't draw this" instead of reaching one built for another case.
2. **Settings drawn from facets,** not bound to predicates. Then `contact` between two objects needs no carriage.
3. **The `own` flag as the only marker of the viewer,** and no special words (D5).
4. **Purpose strings built from the statements' words** (D8).
5. **More unseen cases,** written by someone other than the rules' author.

## 6. Checks

`pass-c.spec.ts`, 17 checks, all passing, with the dependences pinned as described:
- 6 rewordings
- the leak list
- no case ids
- the content branches
- the identifiers
- U1 in three idioms, and its field qualities
- the pack's three checks
