# Findings, first slice (2026-11-17)

> **Status:** passes A and B of the first slice are done, and the measurements taken. The figures wait for your scoring (§6), with the psychology-trained reviewer advising on P1 and P2 (D5). Nothing here is a verdict on quality: §3 is my reading, labelled as mine, to say where to look first.

## 1. What was done

| Part | Result | Where |
|---|---|---|
| Pass A | 34 cases, each as an account in the five categories and a representation in v0 terms | `corpus-*.md` |
| Logs | 27 expressiveness gaps, the reuse matrix, 6 policy entries | `logs.md` |
| Idiom rules | Spatial (S1–S9), kinetic (K1–K11), field (F1–F7), plus 8 common rules, written before any figure | `idioms.md` |
| Pass B | 4 cases × 3 directions = 12 working figures, by the rules and finished, light and dark, in the Lab | `/lab/study`; `web/src/app/pages/lab/study/` |
| Checks | 99 study checks pass: valid scenes at every sampled moment, nothing drawn without a statement, nothing inferred drawn, possibilities only in the possible register, determinism, directions at least two axes apart. The whole unit suite passes (870 tests), including the dependency rules | `pages/lab/study/study.spec.ts` |
| Measurement | Work per frame for all 11 moving figures, both backends, ratios 1, 1.5 and 2: all within budget, with two single frames near or over it | `measurements.md` |

**Unchanged:** `shared/visual/` (the engine), every exercise, every policy document. **Changed outside the study folder:** one route (`/lab/study`) and one line in the Lab's contents list (`lab-catalog-data.ts`).

## 2. Pass A: what the representation could and couldn't say

- **Expressiveness.** All 34 cases could be written in v0, but 27 gaps were logged. Two change what can be said in three domains or more: **causation can only be asked about, never stated (G-17)**, and **a contrast ("but") has nowhere to go (G-26)**. Three change the envelope itself: who may confirm an inference (G-14), where a possibility set comes from (G-18), and statements the source denies (G-19).
- **The five categories worked, and catching over-commitment was hard.** Writing the accounts by hand, I made the mistake the categories exist to catch: M1's field was first written as "pressure", an inference, and was caught only on rereading (`corpus-planning.md`). E1 shows the same thing in a domain with no psychology in it: the text never says the body takes the oxygen, so a faithful figure must leave it open.
- **Reuse.** Facets are shared across domains far more than predicates are. That supports an envelope with facets over a fixed vocabulary of relationships. The twin pair "a friend hasn't replied" / "the supplier hasn't replied" got two different representations: the first sign of an inconsistency pass C must test properly.

## 3. Pass B: the figures

### 3.1 How far the rules went (the deviation log)

Every hand change is in `pages/lab/study/finish.ts`, and the Lab prints them under each figure.

| | Spatial | Kinetic | Field | Total |
|---|---|---|---|---|
| P1 (CS3) | 2 | 2 | 1 | 5 |
| P2 (camera angle) | 5 | 2 | 0 | 7 |
| E1 (education) | 2 | 1 | 1 | 4 |
| M1 (planning) | 1 | 0 | 0 | 1 |
| **Total** | **10** | **5** | **2** | **17** |

By kind: 4 camera, 5 layout, 8 form. Three figures needed no finishing at all: P2's field, M1's kinetic and M1's field.

**What the deviations say:**

1. **The spatial idiom's rules don't compose a picture; a camera does.** All 4 camera changes and both phase changes are spatial. Each fixed one of three faults: something cut off by the frame's edge, the subject too small or too large, or two figures standing one behind the other. These are checkable (bounds against the frame and the middle third), so a framing rule that fits the drawn elements to the frame would likely have replaced most of them. Being checkable is what makes this a candidate engine capability, not a designer's touch.
2. **One missing fact caused three deviations.** E1 needed the two sides of the heart side by side in all three idioms, because v0 can't say they are parts of one heart (G-27). A representation gap shows up as the same hand fix in every idiom.
3. **The rules missed the room's own devices.** P2's floor edge and cut wall edges are what `camera-angle.room` already does. Rules for a spatial idiom should be written from the accepted room, not from scratch.
4. **One rule conflict.** S8 picks the passing itself for P1, but at the passing the other person is beside you, out of view through your own eyes. The phase has to depend on the stance (P1-S1).
5. **The field idiom needed least.** It had 2 changes in 4 figures, and neither moved the meaning: one calmed P1's burst-like lines, the other was the heart adjacency above.

**Corrections, not finishing:** these were fixed in the study's own code, so they count as neither deviations nor rules:
- **E1's field drew no lanes** (a division by zero), found on the first render.
- **A window frame was drawn after the furniture**, also found on the first render.
- **The study figure first drew with the backends directly.** That broke dependency rule 5 (only integration imports a backend), which the full unit suite caught. It now draws through `integration/frame-figure.ts`, as the parity page does, and the rule is unchanged.

### 3.2 My reading, before your review (not a score)

| Direction | Where it stands, as I see it |
|---|---|
| **Field** | The most promising. P2's contours around you, which keep their strength as the view steps back into a calm surrounding field, and M1's lanes closing in at the barrier both read as experiences, not diagrams, and both are the rules' own output. P1's field is busier, and its open headings still risk reading as agitation. E1's field reads as a schematic; its finished figure-eight is more correct and less tidy than the rules' loop |
| **Spatial** | Reaches toward the room's register where the content is people in a place (P1, P2). For a system (E1) or a plan (M1) it reads as a model on a table: legible, not an experience. It needed the most finishing |
| **Kinetic** | In any still frame these are diagrams: lines, circles and boxes. Whether motion lifts them can only be judged by playing them. I expect them to fall short of the standard, which is the "basic shapes" failure you named. They are also the most honest: they assert least |

**A tension the study made visible:** every rule that keeps a figure from asserting more than the text says (no facing, constant pace, nothing between two forms where an exchange didn't happen, open registers) also takes away expressive detail. The kinetic idiom shows it most clearly. Whether a figure can be both rich and honest is the question your scoring answers.

### 3.3 Says only what is meant

- The spec enforces the registers on every element at every sampled moment, and nothing inferred is drawn anywhere.
- Accidental assertions that remain, for back-reading to test:
  - **P2's room:** the armchair and window are a stand-in for "home", stated in the framing words.
  - **P1's open floor:** it reads as a corridor to some viewers, though nothing in the account says so.
  - **P2's kinetic "felt" ring:** closing it may read as tension rather than the reported "cold" (G-09).
- **Where honesty left a figure empty:** P1's kinetic ring of five equal marks means nothing without the list beside it. That is correct by the rules, and it may fail the conceptual-clarity criteria.

## 4. Primitives log (what the frame and the engine couldn't carry)

| # | Gap | Met in | Effect in the study |
|---|---|---|---|
| PR-1 | No per-element opacity in a composed scene; fading is only a timeline effect of a state change | P1 kinetic | The possibilities grow in place instead of fading in |
| PR-2 | No dash offset, so a line can't flow along itself | E1, M1 fields | Flow is shown by moving marks or by revealing lines |
| PR-3 | The engine's field generators take their shape from noise only | P1, P2, E1, M1 fields | The study wrote fields from functions (`kit/field.ts`) |
| PR-4 | The room's face, person and shadow builders are private to it | All spatial | The study wrote them again, simplified (`kit/spatial.ts`) |
| PR-5 | No groups | Persons, fields, possibility sets | A person is one path drawn twice; a field is one large path |
| PR-6 | No light-emitting role; time of day can't be shown | P2 ("in the evening") | The phone's screen uses the room's "lit" far tone; the evening is lost |
| PR-7 | Label placement in a spatial view is projection only | E1 spatial | "Right side" and "Left side" crowd each other |
| PR-8 | Composing again at every frame | All moving figures | Works at these sizes on both backends (measurements.md); no new backend needed |

## 5. Independence, as far as one slice shows

- **Positive:** the engine drew figures for three domains through its existing contracts (scene, pipeline, resolved frame, two backends) with no change to `shared/visual/`. All the domain-neutral meaning lived in study code above it, which is where the architecture puts it.
- **Coupling met directly:**
  - Education and planning had to borrow area themes (`attention`, `recovery`) (PL-3).
  - Purpose kinds are worded for psychology (PL-4).
  - The study reached the engine by deep imports into five of its folders (composition, generation, styling, integration, scenes), because there is no public entry point.
- **Not yet tested:** twins through one idiom, a second style pack, and outside readers matching figures to meanings (pass C and pass E).

## 6. Your score sheet

The rubric is `visual-policy.md` §9.3–§9.4, plus the two explicit criteria in the README. Open `/lab/study`; each figure is shown by the rules and finished, light and dark, beside the two anchors at the top. Play sequences with Play; move viewpoints with the slider; use "Reduced motion" and a Windows contrast theme for those checks. Score the finished version; the by-the-rules version is there to judge the gap.

| Figure | Visual quality (§3) | Conceptual clarity (§4) | Appropriateness (§5) | An experience, not a diagram | Says only what is meant | Verdict | Notes |
|---|---|---|---|---|---|---|---|
| P1 spatial | | | | | | | |
| P1 kinetic | | | | | | | |
| P1 field | | | | | | | |
| P2 spatial | | | | | | | |
| P2 kinetic | | | | | | | |
| P2 field | | | | | | | |
| E1 spatial | | | | | | | |
| E1 kinetic | | | | | | | |
| E1 field | | | | | | | |
| M1 spatial | | | | | | | |
| M1 kinetic | | | | | | | |
| M1 field | | | | | | | |

The psychology-trained reviewer advises on P1 and P2 (D5), against §5 in particular.

## 7. What waits

- **Your scoring**, then the other eight depth cases (D2 (b)).
- **Rule changes this slice suggests, to apply only if your scoring supports them:** a framing rule for the spatial idiom; spatial rules written from the room's devices; contact shadows in the kinetic idiom; the phase chosen per stance; `part-of`, `causes` and `contrasts` in the representation.
- **Pass C** (twins through one idiom, a second style pack) and **pass E** (matching and back-reading with outside readers).
- **D6** (how Stage 1b begins), still open.
