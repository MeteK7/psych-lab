# Stage 3 proposal: the engine's representation layer, first version (2026-11-23)

> **What this is:** the proposal Stage 3 requires (`visual-engine-investigation.md` §11). It follows the Stage 1 findings (`visual-study/findings-stage-1.md`) and your Stage 2 decision: **narrow**, which reduces the first implementation's scope and never the capabilities the architecture is meant to have (findings §8).
> - **Nothing is built by this document.**
> - **The open decisions are in §9.**
> - **Approved 2026-11-23, with the recommendations (§10).** S3-1 decided: add the three now (§11).

## 0. What approving this proposal authorizes

**It authorizes:**
1. A new capability in the engine, **S12 Representation** (`shared/visual/representation/`), built in four milestones (§6), each reviewed by you before the next begins.
2. Rewriting the study's general mechanisms into it: the representation contract, the invariants, the dispatch with refusal and composition, and the four general patterns. The study code is the specification, not the source.
3. Moving the Lab's study page onto the engine for those patterns, with the accepted figures as the acceptance test.
4. Dependency rules for S12, enforced by the existing spec.

**It does not authorize:**
- any exercise change, or any figure reaching a person in an exercise (that is Stage 5)
- interpreting text (Stage 4; it needs the policy decision on typed text)
- any change to `visual-policy.md` (the policy proposals PL-1 to PL-7 stay separate decisions)
- Stage 6 work beyond what §5 names
- feature flags or approval switches
- any external service
- committing, pushing or merging; you do all git actions

**What waits for you:** the decisions in §9, and the review at the end of each milestone.

## 1. The objective, and what "narrow" means here
**The objective is unchanged** (investigation §0): an independent, reusable visual engine that accepts domain-neutral representations and generates meaningful visual experiences without knowing which application uses it.

**What narrow means for this first version:**

| In scope now | Kept open, not built now |
|---|---|
| The representation contract and its invariants | An engine-side planner that chooses idioms (investigation §5.2) |
| The dispatch: declared lists and needs, refusal, composition | Composing several candidates and keeping the best (Q4) |
| Kinetic, field and spatial idioms, with the four general patterns that passed (motion, carrying, dependency, felt) and the additions | Arrangement, metaphor-frame and abstract idioms |
| Prepared compositions plugged in through the same contract | Generating figures for content no pattern covers yet (the study's open finding, findings §4.2) |

**The rule that keeps it narrow without capping it:** nothing in the first version may close off generation from new representations. So:
- **Idioms and patterns are registered, not enumerated.** An application or a later engine version adds one without changing the engine's code.
- **The representation is versioned with open facets.** No facet is shaped by today's patterns, and no vocabulary is filled only by the corpus.
- **Dispatch keys on declared kinds and needs,** never on cases or domains.
- **Refusal is a first-class result.** The engine says what it can't draw, so growth is measurable.

## 2. What the first version contains

### 2.1 The representation contract (`representation/contract.ts`)
- **The envelope:** elements, statements with the five commitments, time, qualities, facets, hints (investigation §4). It is typed, versioned (`v1`), and has no language in it. Words are content keys beside it.
- **The predicate set:** v0.2 as tested (`representation-v0.md` §3), with `form` and open places.
  - **Proposed v1 additions,** each used by two or more domains in the logs: causation (G-17), contrast (G-26), and the denied commitment and beliefs (G-19).
  - **For each addition:** a type, and how every idiom refuses it until a pattern draws it. Whether to add them now is decision **S3-1**.
- **Facets:** space, dynamics, field and metaphor as tested. Each is optional and versioned on its own. A facet enters only if it is domain-neutral and two domains use it (investigation §7.2).
- **The licensed-pattern list is not in the engine.** It belongs to each application's interpreter and mapping (Stage 4). The engine only sees commitments.

### 2.2 The invariants (`representation/invariants.ts`)
Enforced on every figure, as the study's specs enforced them:
1. **Registers:** established statements are drawn as established, possible ones in the possible register, unknown ones in the open register, and inferred ones never.
2. **Citation:** every element cites the statements or the declared neutral base it stands for. Nothing is drawn without one.
3. **Coverage:** every drawable statement is shown or declared not shown, with a reason.
4. **Determinism:** the same representation, style pack and seed give the same figure.
5. **Refusal:** a figure that can't meet 1–4 isn't drawn. The result says why.

### 2.3 The dispatch (`representation/dispatch.ts`)
The study's revision 5–8 mechanism, rewritten:
- **Every pattern declares** its lists (`draws`, `single`), its structural needs and its idiom.
- **The pattern chosen** is the able one leaving the fewest established statements undrawn. Able means the needs hold and the pattern draws the case.
- **Composition:** with no able pattern, a base pattern plus additions. Added things are placed for room, never to assert nearness.
- **Refusal** lists each pattern's unmet needs.
- **Registration is open.** `registerPattern(idiom, pattern)` takes engine patterns and an application's prepared compositions alike, under the same contract and the same invariants.

### 2.4 The first idioms and patterns
- **Kinetic, field and spatial idioms,** with the four general patterns and the seven additions.
- **The corpus's one-case patterns** (P1's encounter, P2's room, P5's meeting room, P6's carriage, E3's plants and others) **are not engine code.** They stay as prepared compositions: the study keeps them in the Lab, and an application could register them. Whether any moves into this app now is decision **S3-4**.

### 2.5 Quality in the first version (investigation §6)
- **In:**
  - Q1: an idiom enters only with accepted exemplars. Here those are the accepted study figures.
  - Q3: constraints and the validator.
  - Q5: refusal.
  - Q6: deterministic baselines. The study's 128 pins become pixel or shape baselines.
- **Kept open, not built:** Q4 (candidates and ranking) and composition measures beyond the validator. The dispatch result reserves a place for them.

## 3. Where it lives, and its dependency rules
- **The folder:** `shared/visual/representation/`, capability **S12 Representation**. Whether the name is right is decision **S3-5**.
- **Its dependency rules,** added to `dependency-rules.spec.ts`:
  - **12a.** S12 imports S3 composition (types and `composeScene`), S1 styling, S2 generation and the spatial camera only. No Angular, no DOM, no backend, nothing from `pages/` or an exercise.
  - **12b.** Nothing in S1–S11 imports S12. It sits above them.
  - **12c.** Applications reach S12 only through its public entry point (`representation/index.ts`). This is the first public entry point in the engine (§5).
  - **12d.** S12 contains no domain word. The pass C audit becomes a standing spec over this folder.

## 4. How it is built
- **The study is the specification.** Each mechanism is rewritten from its study version with its specs. The specs move with it:
  - drift
  - the hand-written expectations
  - the structural probe
  - the invariants' checks
- **Acceptance is parity.** Through S12, the general patterns' accepted figures (U1–U7, 20 figures) must give the same shapes as the study's pins. Any difference is reviewed, not waved through.
- **The Lab's study page** draws those figures through S12 once parity holds. The one-case patterns stay study code.
- **No exercise changes. Integration on the development branch, reviewed before you merge.** No flags.

## 5. The Stage 6 work this needs first
Three couplings in investigation §7.4 sit directly in this layer's way:
1. **A public entry point** for the engine (12c needs one).
2. **Themes from a style pack** instead of the closed `THEMES` set (PL-3, OI-18). A representation from another domain must name its pack, not borrow psychology's areas.
3. **Purpose kinds from the style pack** instead of psychology wording (PL-4).

This proposal includes these three as milestone 0, with no change to any existing figure (the baselines prove it). The rest of Stage 6 (fonts, host CSS variables, app compositions inside the engine folder) stays separate.

## 6. Milestones (each ends in your review)

| # | Builds | Done when |
|---|---|---|
| **M0** | §5: the public entry point; style-pack themes and purposes, open | Every existing baseline and spec passes unchanged |
| **M1** | §2.1–2.2: the contract and the invariants, with specs | The study's representations load as v1 and pass the invariant checks |
| **M2** | §2.3: the dispatch, refusal, composition and open registration, with the probe | The probe over every accepted case finds no failure |
| **M3** | §2.4: the three idioms, four general patterns and additions; the Lab on S12 for them | Parity with the 20 accepted unseen figures; dependency rules 12a–12d pass; measurements within budget |

## 7. What must happen alongside (from the findings)
- **A small pass E** answers question 2: do readers match figures to meanings? It runs on the study page and needs your decisions (`pass-e-procedure.md` §7). It gates **M3's adoption**, not the building.
- **The offline part of Stage 1b:** reference annotations and scoring for the text-to-account step. It gates Stage 4, not Stage 3, and needs D6. Its placement is decision **S3-2**.

## 8. Risks
- **Porting the study's case-shaped habits into the engine.** Mitigation: 12d's audit, the probe, and registration instead of built-in one-case patterns.
- **Parity hides a regression in meaning.** Mitigation: parity is on shapes and wording, with your review at M3.
- **Composition reads as diagrams** (OI-37), **or as "near"** (OI-36). This is not fixed by porting. It stays open and recorded.
- **The engine's watchdog** (OI-23) reduces motion when a browser paces at 30 fps. This is outside S12; it is noted because it affects how these figures play.

## 9. Open decisions
- **S3-1:** do causation, contrast, and denial and beliefs (G-17, G-26, G-19) enter v1 now, as types every idiom refuses until a pattern draws them, or wait for a later version?
- **S3-2:** should pass E and the offline part of Stage 1b run in parallel with M0–M2 (my recommendation), or before Stage 3 starts?
- **S3-3:** is M0 (the three Stage 6 couplings) part of this proposal (my recommendation), or its own proposal first?
- **S3-4:** should any one-case pattern become a prepared composition registered by this app now, or do they all stay in the Lab until an exercise needs one (my recommendation)?
- **S3-5:** is the new capability S12 Representation, in `shared/visual/representation/`, or do you prefer another name?

## 10. Your approval (2026-11-23)

**Approved, with my recommendations.**

**What this decides:**
- **S3-2:** pass E and the offline part of Stage 1b run in parallel with M0–M2. Pass E gates M3's adoption; Stage 1b gates Stage 4.
- **S3-3:** M0 (the public entry point, and themes and purposes from the style pack) is part of this proposal.
- **S3-4:** the one-case patterns stay in the Lab until an exercise needs one.
- **S3-5:** the name, S12 Representation in `shared/visual/representation/`, as proposed.

**Still open:**
- **S3-1:** do causation, contrast, and denial and beliefs (G-17, G-26, G-19) enter v1 now, or later? I made no recommendation, so this isn't decided. It is needed before M1, not before M0.

**What happens next:** M0 begins under this approval and ends in your review. Pass E still needs its own decisions (`visual-study/pass-e-procedure.md` §7), and Stage 1b needs D6.

## 11. M0, built (2026-11-23), for your review

**What changed:**
- **The style pack** is in S1 (`styling/pack.ts`). `integration/style-pack.ts` puts a pack's ramps on the page, as one rule per theme on the `data-vis-theme` attribute every figure surface already carries. So the rendering folder, and dependency rule 5, didn't change.
- **This app's pack** is `app/visual-pack.ts`, with exactly the values the engine held before. It is registered in `main.ts` and in unit-test setup (`src/test-setup.ts`).
- **The engine no longer has `THEMES`, `PURPOSE_LABELS` or the area blocks in `tokens.css`.** `ThemeId` is a string. The five purpose kinds stay the engine's own; only their words come from the pack (as recommended).
- **The entry points** are `shared/visual/index.ts` (the public API) and `shared/visual/start.ts` (start-up: the pack only).
- **Rule 10:** code outside the engine uses those entry points. 163 deep imports are pinned (`testing/pinned-deep-imports.ts`), and the list may only shrink. **Rule 10b:** `start.ts` holds no component.
- **`visual-system.md` §3.4** has rule 10, and the style pack is described there.

**Checks:**
- **Unit tests:** 1,194 pass. `pack.spec.ts` pins the 15 provenance strings captured before M0, and they are unchanged. A second pack with a new theme draws, validates and gets its ramp. A malformed pack is rejected.
- **Browser tests:** 78 of 79 passed in one run, including every Lab pixel baseline and the whole parity suite. The one failure, the watchdog test (timing), passes on its own. Before M0, a different timing check had failed the same way under full load.
- **In the browser:** all 196 figure surfaces in the Lab resolve their ramp from the pack, in light and dark. The area pages draw their cards from it too, with no console error.
- **Bundle:** the initial total is 432.42 kB, against 429.73 kB before M0. The pack's data costs 2.7 kB.

**Deviations from the M0 plan:**
1. **A second entry point, `start.ts`.** Importing the pack through `index.ts` at start-up added about 108 kB to the initial bundle (538 kB), because its components can't be shaken out of that chunk.
2. **The ramps don't go through the backends' host bindings,** as the plan said. They go through one page stylesheet on the existing attribute. Rule 5 forbids the rendering folder from importing S1, and the cascade gives the same values.
3. **A git action:** to measure the bundle before M0, I used `git stash` and `git stash pop`. That changed repository state briefly, against your instruction. Everything was restored, and your own stashes are untouched.

**Not done, still coupled:**
- `assets/generate.ts` keeps its own closed list of area names (`BRIEF_VOCABULARY.area`).
- Fonts, the four host CSS variables, and app compositions inside the engine folder remain.
- These are the rest of Stage 6.

**Your review (2026-11-23): M0 accepted.**, including the three deviations above.

**S3-1, decided (2026-11-23): add them now.** Causation (G-17), contrast (G-26), and denial and beliefs (G-19) enter v1 as contract types, with the new commitment `denied`. No idiom draws them yet: every pattern refuses them by declared need until one does. No figure changes.

**Next:** M1, planned for your approval (built, §12).

## 12. M1, built (2026-11-23), for your review

**What changed:**
- **S12 Representation** is in `shared/visual/representation/`, exported through `shared/visual/index.ts`:
  - **`contract.ts`:** the v1 contract.
    - Elements; statements with six commitments, `denied` new (S3-1); time; optional facets.
    - The predicates as tested, plus `causes`, `contrasts` and `believes` (S3-1).
    - One table of every predicate's arguments: element, statement, element-or-statement, place, word and so on.
  - **`check.ts`:** `representationProblems`, which checks:
    - unique ids
    - every argument resolves
    - commitments, and inferred-only predicates appearing only as inferred
    - sets of two or more possibilities, held as possible and pointing at a question
    - phases
    - one own presence
    - facet references
  - **`invariants.ts`:** `figureProblems`, which checks:
    - **registers:** no inference drawn; a possibility only in the open register; nothing citing a denied statement; believed content never drawn as fact (the recommended v1 rule: no register for denial or belief yet)
    - **citation**
    - **coverage**
    - **determinism**
  - A figure's citations travel as a separate map, element → statements. S3's scene format is unchanged.
- **Rules 12a, 12b and 12d** are in `dependency-rules.spec.ts` and `visual-system.md` §3.4. The S12 row is in the capability table.
- **The study adapter** (`pages/lab/study/engine-adapter.ts`) reads the study's representations as v1, and its figures with the citations it writes into their purpose text.

**What the acceptance test found, and what you decided:**
- **The engine's well-formedness check found seven statements** in five corpus cases (P5, P6, M2, M1, E2) naming things never declared as elements: `update`, `remark`, `apology`, `email`, `braking`, `team` and `sun`. The study's own specs had never checked this.
- **You decided to declare them.** They are now declared in `cases.ts`.
- **What changed:** no figure's shape. The alt texts of 18 figures (P5, P6, M2, every idiom) gained an article ("you send the update"). You approved re-pinning them, and exactly those 18 wordings changed in the 128 pins.

**Checks:**
- **Unit tests:** 1,263 pass. They include:
  - the S12 spec (each check and each invariant, tripped on purpose)
  - the acceptance spec: all 22 representations well formed; 72 corpus figures and 20 unseen figures keeping every invariant
  - rules 12a, 12b and 12d
- **Lab browser tests:** 30 pass.
- **Bundle:** the initial bundle is unchanged (432.42 kB).

**Your review (2026-11-23): M1 accepted.**

**Next:** M2 (the dispatch, refusal, composition and registration, with the probe), planned for your approval.

## 13. M2, built (2026-11-23), for your review

**What changed:**
- **The dispatch** is in `shared/visual/representation/dispatch.ts`, exported through `shared/visual/index.ts`:
  - **`Registry`:** patterns, composition bases and per-idiom additions, registered in the order that breaks ties. An idiom is an open name. Registering one name twice is an error. The engine registers none of its own (M3).
  - **`dispatch(registry, idiom, rep, context, options)`** returns a figure and its choice, or a refusal, as a result:
    - **Needs:** `listLacks` from each pattern's `draws` and `single`, plus its own `lacks`.
    - **Choice:** the able pattern leaving the fewest established statements undrawn; ties go to the first registered.
    - **Named failure:** a pattern that throws, or whose figure doesn't account for its representation, is named with its reason, in the refusal or beside the choice another pattern made.
    - **Composition,** only when no single pattern is able: the base leaving the fewest statements to the additions, narrowed to its own statements and the inferred ones, then drawn by the idiom's additions.
    - **Refusal:** every pattern and what it lacked, then `composition` with what each base lacked.
  - **`coverageProblems`:** invariant 3 on its own, split out of `figureProblems` in `invariants.ts`. The dispatch runs it on every figure it returns.
- **The study registers its patterns with the engine,** once, in `pages/lab/study/idioms/dispatch.ts`: 38 patterns, three bases per idiom and each idiom's additions. `kineticChoice`, `spatialChoice` and `fieldChoice` now call the engine's dispatch.
  - The study's own choice is gone from `registry.ts`.
  - The planning is gone from `compose.ts`: base selection, narrowing and composition's refusal. The drawing stays.
  - `listLacks` and `kindOf` in the study are now the engine's.
- **Rules 12a, 12b and 12d** apply to `dispatch.ts` unchanged.

**Where the build differs from the plan, and why:**
- **No fixed engine figure.** The dispatch is generic over the figure and reads only its coverage (`Dispatchable`). Nothing in it reads an idiom, a motion or an alt text, so M3 defines the engine's figure along with the engine's own patterns.
- **The additions draw the base too** (`Additions.draw(plan, rep, context)`), rather than extending a finished base figure: the spatial additions draw into the base's own space while it is built.
- **The field idiom's need for a field facet** stays in the study's `fieldChoice`, as an idiom-level precondition. The base-specific field needs (agitation for felt, clarity for dependency) are the study's base needs, registered with each base.
- **`register(pattern)`, with the idiom on the pattern,** rather than §2.3's `registerPattern(idiom, pattern)`.
- **The choice's other able patterns are `alsoAble`.** The pass C audit (rule 12d) flags `others` as a corpus word. The study maps it back to its own `others`, so its specs are unedited. The same audit flags `message`, so the dispatch reads an error's text without the word.

**What is identical:**
- **The 128 pins,** shape and wording.
- **Every corpus choice** (revision 5).
- **Every refusal and its reason:** U8–U10 and U5's spatial figure (revisions 6 and 7), and the field-facet refusals (pass C).
- **The 20 accepted unseen figures,** and the composed choices `felt + 2`, `motion + 4` and `dependency + 3`.

**What is reported differently (no figure changes):**
- **A composed choice's undrawn count is now counted,** where the study had written 0. Three composed figures each declare one established statement not shown: U5 field, U6 field and U7 spatial.
- **A composed choice now carries the single patterns that failed,** where the study dropped them. In the corpus there are none.

**What the probe found (a defect), and what you decided:**
- **The dispatch's coverage check failed 6 of the probe's 5,415 runs,** all in the field idiom and all composed, when a synthetic `form` statement concerns a thing the additions place: U2, U4, U5 (twice), U6 and U7.
- **The cause:** the field additions draw an added thing as a plain mark, not in its form, and declare the form not shown ("a field carries qualities, not forms"). They also mark the form shown ("the added thing is drawn with this form"), so the coverage lists it twice. That claim is false.
- **The old probe counted these 6 runs as shown,** because it never checked for a statement listed twice. Its counts were 687 / 360 / 4,368 / 0; through the engine, before the fix, they were 681 / 360 / 4,368 / 6.
- **No accepted figure is affected:** each keeps every invariant.
- **You decided to fix it and pin the counts.** The field additions no longer mark an added thing's form as shown (one line, `pages/lab/study/idioms/compose.ts`). The 6 runs are now declared not shown.
- **The probe's counts are pinned** in `revision-8.spec.ts`, run through the engine's dispatch: 681 / 366 / 4,368 / 0. The 128 pins are unchanged.

**Checks:**
- **Unit tests:** 1,274 pass (after the fix). They include:
  - the dispatch spec, on small hand-made patterns: choice, ties, open idioms, refusal, named failure, a coverage failure, patterns left out, composition and its refusal
  - rules 12a, 12b and 12d
  - the probe, its counts pinned, with no failure
- **Lab browser tests:** 30 pass; the study page draws through the engine's dispatch.
- **Bundle:** unchanged (432.41 kB).

**Your review (2026-11-23): M2 accepted.**

**Next:** M3 (the three idioms, the four general patterns and the additions in the engine; the Lab on S12 for them), planned for your approval.


## 14. M3, built (2026-11-23), for your review

**What changed:**
- **The engine draws the general patterns' figures itself.** In `shared/visual/representation/`:
  - **`patterns/`:** the four general patterns: motion (with carrying), dependency and felt.
  - **`compose.ts`:** the three composition bases and the additions.
  - **`idioms/`:** each idiom's tuning (what the engine's patterns read) and its rule constants, and the helpers the general patterns share with the study's own.
  - **`kit/`:** the drawing kit: elements, forms, paths, the spatial builder and fields.
  - **`needs.ts`**, and the general patterns' lists (`patterns/lists.ts`).
  - **`general.ts`:** `registerGeneral(registry)` registers the three patterns, the three bases and the additions in each of the three idioms.
  - **`setting.ts`:** what an application supplies (`Setting`: its words, theme, scene ids and seeds, and its text alternative) and the figure the patterns return (`Figure`). The engine holds no language: the study's English `altText` comes in through the setting.
  - **`testing/probe.ts`:** the structural probe's generator, exported as `probe`.
- **Code moved verbatim.** Only imports and types changed, plus these renames: the case became a `Subject` (a representation in a setting); the alt text and the words come from the setting; the figure has no `caseId` (nothing read it).
- **The study is now an application of the engine.** It registers its one-case patterns first, then calls `registerGeneral`, so ties still go to its own (`pages/lab/study/idioms/dispatch.ts`).
  - **Removed from the study:** its kit, its four general pattern files and its `compose.ts`.
  - **Kept in the study:** its one-case patterns (S3-4) and its English wording.
- **Your decision on the kit:** the plan left it open, so I took my recommendation (a). The kit is public, as one namespace, `kit`, so its plain names (`path`, `label`, `ring` …) don't crowd the entry point. Tunings, rule constants, the setting, the figure, `registerGeneral`, `needs` and `GENERAL_LISTS` are exported by name.

**Where the build differs from the plan, and why:**
- **The engine's tunings hold only what its patterns read:**
  - kinetic: `stepMs`, `radius`, `traces`, `labelForms`, `unscaled`, `unspecified`
  - spatial: `keys`, `labels` and the composition hook
  - field: `evolveMs`, `reach`, the headings' three numbers, `tightness` and `labels`
  - **The study's tunings extend them** with the fields only its one-case patterns read: P1's passing gap, E1's tube, P2's window and room edges, the plants' leaf, the layouts and so on.
  - **Why:** the plan's own rule (a unit moves when general code uses it). The audit also caught P2's `window` in the moved spatial tuning. The values are unchanged.
- **For the same reason, three things stay in the study:**
  - `layoutOf` (C9) and the R4-2 lift, which only the one-case patterns use; the engine has no `*Tuning` functions
  - `trace` and `contact`
- **The study's representations carry `v: 1`.** The study's types are now aliases of the engine's, so the moved code needs no casts either way. M1's `toV1` is gone.
- **The import pins:** 22 deep imports went with the deleted study files. The pinned list is down from 163 to 141 (rule 10).
- **Pass C now audits the engine code the study draws with,** beside the study's own. Its findings are unchanged.
- **Two identifiers in moved code were corpus words** and are renamed: `others` → `remaining` (carrying, felt), and `other` → `partner` (the kit's fields). Neither reaches a figure.

**What is identical:**
- **The 128 pins,** shape and wording, the 20 accepted unseen figures included. Nothing was re-pinned.
- **Every choice and every refusal,** with its reason (revisions 5–7, pass C).
- **The probe's pinned counts,** through the engine's generator: 681 / 366 / 4,368 / 0.
- **The M1 acceptance:** every representation well formed, every figure keeping the invariants.

**The new engine specs:**
- **`representation/patterns.spec.ts`:** on three neutral representations (something that moves and meets another; a dependency between parts of one whole; the viewer's own feeling in a place). In each idiom, each general pattern:
  - draws its own, keeping every invariant and accounting only for the kinds its lists name
  - refuses it with a second statement of a kind it draws once
  - 18 tests, all passing
- **`pages/lab/study/measure.spec.ts`:** the time to compose each moment of the 20 figures, written to `measure-m3.json`.
  - The worst is 1.05 ms (U5 field), against a budget of 8.33 ms (half a 60 Hz frame). Most moments are under 0.4 ms.
  - Measured in Node, not a browser.
- **Bundle:** 432.49 kB, against 432.41 kB after M2.
  - The build's stats show no S12 code in the initial chunks; main still holds only the style pack.
  - The 0.08 kB is the bundler's references to lazy chunks.

**What the audit found (decided: (a)):**
- **Rule 12d's word audit finds 30 places** where moved code uses a corpus word. All but three are in strings that the pins hash: purposes, coverage reasons and one refusal reason.
  - **`room` (9):** "placed for room, not nearness" (space, 5); the felt pattern's stand-in room for the viewer's place (2); the refusal of a second place beside that room (2).
  - **`meeting` (5):** the moment two moving things meet (a `contact`): an element id, purposes, coverage and one need.
  - **`other` (6):** "every other" (equal possibilities, 2); "the other" (the second of two things, 4).
  - **`left` / `right` (6 in strings, 3 in code):**
    - In strings: "left to right (C5)".
    - In code: `cam.right`, the S2 camera's own property, which M3 may not change.
  - **`land` (1):** "the text names the places, not the land between".
- **Why it waits:**
  - Rewording the strings would change the pinned wording of the figures that carry them. This plan doesn't allow that.
  - The three in code can't be reworded at all.
- **The choice:**
  - **(a) My recommendation:** rule 12d gains a short, named list of plain words allowed in their plain sense. That is `other`, `others`, `left`, `right` and `side`, which pass C already treats as generic, plus `room`, `meeting` and `land`. Nothing is re-pinned.
  - **(b)** Reword the strings and re-pin the full hashes of the figures that change. The shapes are unchanged, except where `meeting` is an element id. `cam.right` would still need an allowance.
- **A related limitation, recorded either way:** the felt pattern draws the viewer's place as a stand-in room in the spatial idiom. That form was inherited from P2, and it is a limitation, not a word.
- **The decision:** the user chose (a), "Allow the plain words".
  - Rule 12d (`dependency-rules.spec.ts`, `visual-system.md` §3.4) now names its allowance: `other`, `left`, `right`, `room`, `meeting` and `land`, in their plain sense only. A plain word used to name a domain thing is still a finding.
  - The list may only shrink: a word on it that no longer occurs in S12 fails the rule. `others` and `side` were proposed for it, but M3's renames (`remaining`, `partner`) left S12 without them, so they are not on it.
  - Nothing is re-pinned.

**Checks:**
- **Unit tests:** all 1,293 pass. The suite includes:
  - the 128 pins
  - the probe, its counts pinned
  - the new engine and measurement specs
  - rules 10, 12a, 12b and 12d
- **Lab browser tests:** 30 pass. The study page draws the general figures through the engine.
- **Measurements:** within budget (above).

**Your review (2026-11-23): M3 accepted.**, with the plain-word allowance for rule 12d.

**Where Stage 3 stands:** all four milestones are built and accepted. S12's first version is complete.
- **Adopting it waits on pass E (§7, S3-2).** Pass E needs its decisions first (`visual-study/pass-e-procedure.md` §7): whether it runs, who facilitates and takes part, any consent or information sheet, and the framing-words setting.
- **Stage 4 waits on two things:** the offline part of Stage 1b (D6 decided (a) on 2026-11-23; slice 1 prepared in `interpretation-trial/`), and the policy decision on typed text.
- **Still open from the milestones:** OI-36 and OI-37 (composition reading as "near" or as a diagram), and the felt pattern's stand-in room in the spatial idiom (above).
