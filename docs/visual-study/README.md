# The representation study (Stage 1), first slice

> **Status (2026-11-17):** first slice built: passes A and B done and measured; the twelve figures wait for your scoring (`findings-slice-1.md` §6). It tests the architecture in `visual-engine-investigation.md` (revision 3) as a working hypothesis (decision D1 (a)). Nothing here changes the engine (`shared/visual/`), an exercise or a policy.
>
> **Decided:** D1 (a) the architecture as written · D2 (b) this first slice · D3 (a) throwaway study code under `pages/lab/study/` · D4 (a) spatial, kinetic and field idioms first · D5 (b) you score; the psychology-trained reviewer advises on the two psychology cases. D6 (how Stage 1b begins) is still open.

## What this slice is

| Pass | What | Where |
|---|---|---|
| **A. Breadth, on paper** | For all 34 cases: the account in the five categories and the representation | `corpus-psychology.md`, `corpus-education.md`, `corpus-planning.md`, `corpus-stress.md` |
| **The representation, as tested** | The envelope, the facets, the commitment levels, the idiom contract | `representation-v0.md` |
| **The idiom rules** | Spatial scene, kinetic sequence, field: the rules written down before any figure | `idioms.md` |
| **B. Depth, in the Lab, four cases** | Three working directions for each, by the rules and then finished | `/lab/study`; code in `web/src/app/pages/lab/study/` |
| **Logs** | Expressiveness, reuse, policy, primitives, deviation | `logs.md` |
| **Measurement** | Frame cost of the twelve figures | `measurements.md` |
| **Findings** | What the slice shows, and what waits for your review | `findings-slice-1.md` |

**Not in this slice:** the other eight depth cases (after your review of these four), pass C (twins through one idiom; the style-pack swap), the matching test and back-reading with outside readers, and anything from Stage 1b.

## The four depth cases

| Case | Source | Text (synthetic) | Why this one |
|---|---|---|---|
| **P1** | CS3, reviewed content | "A classmate walks past you without saying hello." | A thin fact with several explanations; an absence; unknown attention |
| **P2** | Change the camera angle, written for the study | "I read a short reply from my manager on my phone, alone at home in the evening. It felt cold." | Vantage and distance, in a moment the existing room fits poorly |
| **E1** | Education, written for the study | "The right side of the heart pumps blood to the lungs, where it takes up oxygen. It returns to the left side, which pumps it out to the body and back." | A cycle and a transformation, with nothing unknown |
| **M1** | Project management, written for the study | "Design is finished, so build is next. But build can't start until the software licence arrives, and procurement hasn't said when that will be." | A dependency, a blocker and an unknown date |

## How a figure is made (the by-the-rules protocol, made literal)

1. The case's representation is written as data (`pages/lab/study/cases.ts`), word for word as on paper.
2. Each idiom is a function from a representation to a composition (`pages/lab/study/idioms/`), written from the rules in `idioms.md`. **By the rules** is that function's output, untouched.
3. **Finished** is the same output with the case's hand adjustments applied. Each adjustment is a named entry with a reason (`pages/lab/study/finish.ts`), so the deviation log is the code itself.
4. The Lab shows both versions side by side, in light and dark. Forced colours come from the system setting, and reduced motion from the system setting or a switch on the page.

Writing the rules as code turns "composed strictly by the rules" into something checkable instead of a judgement. It is study code only: none of it is the engine's representation layer, and Stage 3 would design that afresh from what the study finds.

## Five axes, declared in advance

Two figures count as different directions only if they differ on at least two of these axes. A spec in the study folder checks this for every pair within a case.

| Axis | Values |
|---|---|
| Space | flat · spatial |
| Time | still · moving |
| Substance | forms · field |
| Mode | direct · metaphorical |
| Viewpoint | fixed · movable |

## Review (yours, with the reviewer advising on P1 and P2)

The rubric is `visual-policy.md` §9.4, scored 2, 1 or 0 per §9.3, with its verdict rule. Two criteria are scored explicitly as well: **an experience, not a diagram** (§3.13), and **says only what is meant** (no element asserts more than its statement's commitment). Each figure sits beside `camera-angle.room@3` and `mcii.path@4` as anchors. The score sheet is in `findings-slice-1.md`.
