# Visual reviews

The review log (`visual-policy.md` §9.6). Each entry records a human review of a visual item: who reviewed it, what was seen, the verdict, and the screenshot baselines it approves. **Baselines change only with an accepted entry that names them** (`visual-system.md` §10).

---

## Entry 1 · R2 Composition · `mcii.path@3` (static states)

| | |
|---|---|
| **Date** | 2026-11-08 |
| **Review** | R2 Composition, the static states. The transitions are reviewed separately (entry 2, once motion is built) |
| **Reviewers** | You (visual quality, concept, product fit) |
| **Still needed** | The psychology-trained reviewer (psychological suitability, with a veto; `visual-policy.md` §9.2), in the integrated exercise in the test environment, before your merge to production (workflow revised 2026-11-08) |
| **Item** | Scene `mcii.path@3`, theme `action@1`, frame `banner` |
| **States seen** | `future`, `contrast`, `plan`, `aside`, in light and dark, side by side with the picture participants see now (`builtin.v1`), in the Visual Lab |
| **Tiers seen** | Full. The tiers look the same while the scene has no motion. Forced colours were checked by the automated run (axe), not reviewed by eye |

### How it got here
| Version | Your review | What changed |
|---|---|---|
| `@1` | The layered landscape added complexity without meaning; the original picture communicated better | `@2` keeps the original's composition, with no landscape. New principle: every element earns its place (`visual-policy.md` principle 6) |
| `@2` | In "set aside", the wish turned grey. The wish stands for hope and aspiration and shouldn't look like loss | `@3` keeps the wish in its colour in every state; only the path to it gets quieter. New rule: hope-bearing elements keep their colour (`visual-policy.md` §3.9) |
| `@3` | The set-aside state is distinct enough: the step's own words carry the decision. Approved all | — |

**Note (2026-11-08):** `@4` adds motion between the states and changes nothing in them. Its states still match these baselines, which the browser tests check.

### Scores
Not scored per criterion: you approved the comparison as a whole ("I approve all"). Two criteria were decided explicitly along the way:
- **Purpose (principle 6):** every element is explained in the Lab's purpose table; the landscape was removed because it served no purpose.
- **Scientific appropriateness, no judgement (§5) and colour (§3.9):** the wish keeps its colour when set aside.

### Verdict
**Accept** (yours). The psychology-trained reviewer's review follows in the test environment, before your merge.

### Baselines approved
In `web/e2e/visual-lab.spec.ts-snapshots/`, checked by `e2e/visual-lab.spec.ts` ("approved baselines"):

| State | Light | Dark | Forced colours |
|---|---|---|---|
| `future` | `mcii-path-future-light-win32.png` | `mcii-path-future-dark-win32.png` | `mcii-path-future-forced-win32.png` |
| `contrast` | `mcii-path-contrast-light-win32.png` | `mcii-path-contrast-dark-win32.png` | `mcii-path-contrast-forced-win32.png` |
| `plan` | `mcii-path-plan-light-win32.png` | `mcii-path-plan-dark-win32.png` | `mcii-path-plan-forced-win32.png` |
| `aside` | `mcii-path-aside-light-win32.png` | `mcii-path-aside-dark-win32.png` | `mcii-path-aside-forced-win32.png` |

---

## Entry 2 · R2 Composition · `mcii.path@4` (transitions)

| | |
|---|---|
| **Date** | 2026-11-08 |
| **Review** | R2 Composition, the transitions (MCII step 4c) |
| **Reviewers** | You (visual quality, concept, product fit) |
| **Item** | Scene `mcii.path@4`, theme `action@1`; states unchanged from `@3` (entry 1) |
| **Transitions seen** | `future → contrast` (the wall rises; the wish eases to equal weight), `contrast → plan` (the bridge is drawn left to right), `contrast → aside` (the path eases lighter; the wall goes at once), in light and dark, full and reduced motion, replayed in the Visual Lab |

### Verdict
**Accept** (yours): all three transitions.

### Baselines approved
None new: motion has no static baseline. The browser tests check that each transition ends on entry 1's approved states, and that nothing moves under reduced motion.

**Re-captured with step 4d (2026-11-08), no change to any drawing:** removing the old picture from the Lab moved the figures on the page, which shifted their anti-aliasing. The 12 baselines from entry 1 (same file names) are now captured on a fixed surface, 480 px wide at the page's top left, so the Lab's layout can't affect them again. The scene, its states and their drawing markup are unchanged (`mcii.path@4`, states as `@3`). Look at them when you review the step 4d changes.

### Next
The scene is integrated into the MCII exercise on the development branch (MCII step 4d). R3 (you, in context) and the psychology-trained reviewer's review of psychological suitability happen in the test environment, before you merge to production (`visual-policy.md` §9.2).
