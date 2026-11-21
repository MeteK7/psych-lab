# Findings, slice 2 (2026-11-21)

> **Status:** revision 3 of the rules applied to slice 1, eight new depth cases built (24 figures), checked and measured. The 24 new figures wait for your scoring (§6). Nothing in the engine (`shared/visual/`), an exercise or a policy document changed. §3 is my reading, labelled as mine.

## 1. What was done

| Part | Result |
|---|---|
| Your verdict on slice 1 | All twelve accepted; recorded in `findings-slice-1.md` §6 |
| **Revision 3** | Eleven hand changes from slice 1 became rules: framing for every spatial stance, the home's devices, contact shadows, and `part-of` with C9 (`idioms.md`, "Revision 3") |
| **Eight new cases** | P3 `no_reply`, P4 `meeting_moved` (CS3); P5 a remark in a meeting, P6 a crowded train (camera angle); E2 the water cycle, E3 two plants, two hypotheses (education); M2 a silent supplier, M3 a delay with three causes (planning) |
| New predicates | `reacts`, `contact`, `displaced`, `shifts`, `exceeds`, `behind`, `transforms`, and plural presences. Each is domain-neutral, with a pattern in all three idioms, all written before any figure (`idioms.md`, "Slice-2 patterns") |
| Checks | 291 study checks across 36 figures; the full unit suite (1,062) and the Lab browser tests (30) pass |

## 2. Revision 3 on the accepted figures

- **The content of every accepted figure is unchanged.** Captures were compared before and after, and pixel noise between captures was ruled out by eye.
- **What did change is cameras, in P2, M1 and E1's spatial figures,** now computed by the framing rule rather than set by hand:
  - **P2, through your own eyes:** your hands, the phone and the window ahead. This is closer to the accepted intent than before.
  - **P2, from behind:** the window is still cut at the top. **For your look.**
  - **M1 and E1:** the framing is slightly closer.
- **Two framing constants were set with sight of the accepted figures:** the held object weighs double in the aim, and the view from behind fills half the frame. This is logged in `idioms.md`.
- **Slice 1's hand changes dropped from 15 to 4:** P1-K1, P1-F1, P2-K1 and E1-S2 didn't generalise.

## 3. The 24 new figures

### 3.1 How far the rules went

| | Spatial | Kinetic | Field | Total |
|---|---|---|---|---|
| P3 (no reply) | 0 | 0 | 1 | 1 |
| P4 (meeting moved) | 0 | 0 | 1 | 1 |
| P5 (remark in a meeting) | 1 | 0 | 0 | 1 |
| P6 (crowded train) | 0 | 0 | 0 | 0 |
| E2 (water cycle) | 1 | 0 | 0 | 1 |
| E3 (two plants) | 1 | 0 | 1 | 2 |
| M2 (silent supplier) | 1 | 0 | 0 | 1 |
| M3 (behind plan) | 0 | 0 | 1 | 1 |
| **Total** | **4** | **0** | **4** | **8** |

Compared with slice 1, before revision 3: 15 changes in 12 figures. Now 8 in 24. Sixteen figures are exactly the rules' output.

**What the eight say:**
1. **Four are the same change.** P3-F1, P4-F1, E3-F1 and M3-F1 are all P1-F1, your accepted fix for headings that read as a burst. Five uses in two slices: it belongs in rule F4. I left it as finishing so that the count shows.
2. **One is a representation gap.** E2-S1 raises the clouds, because v0 can't say one place is above another (G-29).
3. **One is a primitives gap.** E3-S1 shrinks the leaves, and the plants still read as lollipops. Finishing can't fix a missing leaf form (PR-9).
4. **One is a missing rule.** M2-S1 moves "Launch" clear of the team; the rules don't avoid collisions (PR-10).
5. **One is a first-person camera.** P5-S1 widens the view at a table, where neighbours sit at the frame's edges.
6. **The kinetic idiom needed none.** Its patterns are the most rule-like. That is also why it looks most like a diagram.

**Corrections, not finishing** (in the rules' own code): the framing rule now includes a place's height (PR-12). Pass A also missed two changes of form in E2, now in the case data (G-30).

### 3.2 My reading, before your review (not a score)

| Figure | Where it stands, as I see it |
|---|---|
| **P5 spatial** | The strongest new figure: a meeting room, everyone faceless round one table, you at its end; from above, the room among its cut walls. Laughter isn't drawn, honestly. Through your own eyes the neighbours crowd the edges |
| **P6 spatial** | Strong: a carriage, seats down both sides, a standing crowd, you in the area colour a hand's breadth from the other person. A stumble can't be drawn (PR-11), so you simply stand. The standing pose's forward forearms make a crowd look stiff |
| **P5 field** | Ripples spreading once from you and from the remark, small ones round two of the group, pointing at no one. Clear and calm |
| **P6 field** | A still density of dots with two touching marks. Clear; possibly too plain |
| **P3, M2 (twins)** | Now one pattern across domains, as pass A asked. The spatial versions are a long way between two people: legible, a little empty |
| **P4** | All three are legible. The kinetic and field versions carry "moved later, amount unknown" well; the spatial path is the weakest of the three |
| **E2** | Kinetic: the water changes shape as it travels. Field: wide lanes for vapour. Spatial: a tube over three blocks, schematic even with the clouds raised |
| **E3** | All three read as diagrams; the spatial plants as toys (PR-9). The weakest case |
| **M3** | Legible in all three; the shortfall is named in words, at a width that is a rule constant (G-31) |
| **Field headings** | Even with P1-F1's change, open headings round a single point read as a swirl. In P3 they surround the friend and may read as turbulence round them, the same risk as P1's field. **For your look** |

### 3.3 Says only what is meant

- **The spec enforced it on every element at every sampled moment:** nothing inferred is drawn, possibilities only in the possible register, every element cites a statement.
- **Declared not shown, rather than invented:** laughter (P5); a stumble (P6); the apology and the silence in a still scene (P6); the cause in every still scene.
- **Assertions forced by drawing,** each recorded as a rule constant (G-31):
  - how much later the meeting is (P4)
  - how much taller the window plant is (E3)
  - how wide a two-day shortfall is (M3)
- **Who in the group laughs is a fixed choice** (P5): the account says "a few", not which.

## 4. Measurements

See `measurements.md`, "Slice 2".

## 5. Independence, as far as two slices show

- **The engine is still untouched.** Twelve cases in three domains are drawn through its existing contracts.
- **New predicates were added only in study code, and all are domain-neutral.** Three are psychology-only so far (`reacts`, `contact`, `displaced`), and four are still single-domain because the corpus is small.
- **The structural twins** P3/M2 (waiting) and P4/M3 (several explanations for one fact) now share patterns across domains. That is the first direct support for one representation serving several applications.
- **Coupling met again:** themes borrowed for education and planning; purpose kinds worded for psychology.

## 6. Your score sheet (24 figures)

Rubric as in `findings-slice-1.md` §6. Open `/lab/study`; the new cases follow the first four.

| Figure | Visual quality (§3) | Conceptual clarity (§4) | Appropriateness (§5) | An experience, not a diagram | Says only what is meant | Verdict | Notes |
|---|---|---|---|---|---|---|---|
| P3 spatial | | | | | | | |
| P3 kinetic | | | | | | | |
| P3 field | | | | | | | |
| P4 spatial | | | | | | | |
| P4 kinetic | | | | | | | |
| P4 field | | | | | | | |
| P5 spatial | | | | | | | |
| P5 kinetic | | | | | | | |
| P5 field | | | | | | | |
| P6 spatial | | | | | | | |
| P6 kinetic | | | | | | | |
| P6 field | | | | | | | |
| E2 spatial | | | | | | | |
| E2 kinetic | | | | | | | |
| E2 field | | | | | | | |
| E3 spatial | | | | | | | |
| E3 kinetic | | | | | | | |
| E3 field | | | | | | | |
| M2 spatial | | | | | | | |
| M2 kinetic | | | | | | | |
| M2 field | | | | | | | |
| M3 spatial | | | | | | | |
| M3 kinetic | | | | | | | |
| M3 field | | | | | | | |

The psychology-trained reviewer advises on P3 to P6 (D5).

**Your verdict (2026-11-21): all 24 accepted.** No per-criterion scores were recorded, and the reviewer's advice hasn't been recorded yet. Acceptance doesn't resolve the limitations these figures still have: they are kept in `open-issues.md`.

## 7. What waits

- **Your scoring of the 24 figures,** and your look at P2's view from behind.
- **Rule changes this slice supports, if your scoring agrees:**
  - P1-F1 into rule F4
  - `above` in the representation (G-29)
  - a collision rule for spatial scenes (PR-10)
  - a declared "unscaled" treatment for unknown amounts (G-31)
- **After slice 2:** pass C (twins through one idiom with outside readers; a second style pack), pass E, and D6 (Stage 1b). Choosing among these is yours.
