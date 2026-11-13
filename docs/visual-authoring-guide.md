# Giving a new exercise its visuals

The authoring guide for the Visual System (milestone M8, S11). It is for whoever adds a visual to an exercise next: a person or a future session. It goes from "does this step need a picture at all?" to "it's reviewed and its baselines are in".

**The worked example** is `reference.guide.days@1`, a small instrument: how many days of a week a person plans to practise. It is real code, built and bound the way an exercise's instrument is, and the Visual Lab shows it ("Worked example: reference.guide.days"). No exercise uses it and no participant sees it. Each step below names the file where the example does that step, so the guide can't drift from code that works:

| What | File (from `web/src/app/`) |
|---|---|
| The composition | `shared/visual/instruments/guide-days/guide-days.ts` |
| Its policy tests | `shared/visual/instruments/guide-days/guide-days.policy.spec.ts` |
| Registered for exercises | `shared/visual/integration/instruments.ts` (`'guide-days'`) and `instrument-slot.ts` (its ratio) |
| Bound as an exercise binds it | `pages/lab/lab-guide.ts` |
| Drawn by both backends | `pages/lab/lab-parity-cases.ts` (`guide.days.*`, `change.guide-days`) |
| Its browser test | `web/e2e/visual-lab.spec.ts` ("the worked example keeps its native control and its figure in step") |

The rules this guide applies are set out in full in `visual-policy.md` (what a visual may do) and `visual-system.md` (how the system works). Where they and this guide differ, they win, and this guide should be corrected.

---

## Step 0. Does the step need a visual at all?

Start from "no". A visual is added only when it carries something the step needs and the words alone carry less well (`visual-policy.md` principles 1 and 6).

Ask, for the step as it is now:
- **What idea would the picture carry?** One sentence. If you can't write it, there's no visual.
- **Which purpose does each element serve?** `concept`, `understanding`, `interaction`, `feedback` or `identity` (`visual-policy.md` §2, principle 6). An element that serves none doesn't go in.
- **What would be lost without it?** If nothing, leave it out.
- **Could it judge, reward, push or predict?** If it could, it is redesigned or dropped (`visual-policy.md` §5).
- **Is it one of the experiment exercises?** During the development stage they change like any exercise. They're frozen again only when participant data collection approaches (`plan.md` §9, "Development stage"), and what a picture there may record is then the study's decision.

Whatever you add, **the exercise must work fully without it**. The step's words say everything the picture shows, every value is set by a native control, and a picture that fails to load leaves its space and nothing else.

In the worked example: the idea is "how many days of one week". The day marks serve `understanding` (counted at a glance), the line serves `interaction` (a bigger place to press), and the bar serves `interaction` and `feedback` (the number, moving as it is set). The native slider and its words ("3 of 7 days") carry the whole step without the figure.

---

## Step 1. Choose the tier

| If the picture… | Tier | What it is | Status |
|---|---|---|---|
| supports understanding and is never needed to finish the step | **1 · Illustration** | A scene with named states (`shared/visual/scenes/`), asked for by the exercise through the visual contract (`shared/visual/visual.ts`) | Built; `mcii.path` |
| shows the person's own answers, or is how they give them | **2 · Instrument** | A pure function from the exercise's data to a composition (`shared/visual/instruments/`) | Built; `cs2.cause-map`, `state-reset.rounds`, `state-reset.tracking`, and the worked example |
| is an experimental manipulation or measurement, timed to the refresh | **3 · Stimulus** | A versioned stimulus spec (`shared/visual/stimulus/spec.ts`), run on the stimulus surface | Lane built (M6), Lab only: no task uses it, and nothing is recorded with a session yet |
| is a fixed picture: a hand-drawn one, or an export of a composition | **Asset** | A file in `web/public/visuals/` with a manifest entry (`shared/visual/assets/`) | Built (M7); one reference asset, a draft |

How to tell them apart:
- **The person's data changes the picture:** an instrument. The cause map and the worked example are instruments.
- **Only the step changes the picture:** an illustration. MCII's path changes with the step, never with what the person wrote.
- **The timing is part of the method:** a stimulus. It isn't an illustration that happens to move.
- **The picture never changes and code can't reasonably draw it:** an asset. Prefer a composition whenever code can draw it: a composition follows light, dark and high contrast, and an asset needs a file per scheme.

Generated pictures (an AI provider) stay off: no provider is configured and there's no setting to turn one on (`visual-system.md` §14, M7; `plan.md` §10).

---

## Step 2. Write the composition: spec, purposes and text alternative

**Where:**
- an illustration: `shared/visual/scenes/<area>/<id>.scene.ts`, added to `SCENES` in `scenes/index.ts`
- an instrument: `shared/visual/instruments/<name>/<name>.ts`

**The header** is the per-scene policy (`visual-policy.md` §8): scene and version, area theme and tier, the idea, the states, the metaphor, the Must and Must not lines, motion, alt texts, the assertions and the review. The worked example's header is written that way; copy its shape.

**The id and version:**
- `id` names the exercise (`mcii.path`, `cs2.cause-map`); a reference composition starts with `reference.`
- `version` starts at 1 and goes up with every change to what is drawn. A version bump makes the composition's baselines stale until a review accepts the new version (step 9).

**The frame:**
- a scene uses a named frame (`banner` is 480 × 120)
- an instrument gives its design size in CSS px, with 1 unit = 1 px at its usual width. The worked example is 480 × 80. Labels and lines are sized for that width.

**Each element:**
- **A kind:** `shape` (a geometry), `label` (text by content key), or `generated` (geometry from an S2 generator and the scene's seed).
- **A style from S1, never a colour:** a role (`subject`, `context`, `focal`, …), and a material, line weight or dash where needed. The styles are listed in `styling/vocabulary.ts`. Colours come from `tokens.css` for each area, scheme and high contrast, so a composition never names one.
- **A `purpose`:** what it serves and why, in a sentence for reviewers. The validator rejects an element without one. Keep the purposes in one list next to the composition (`GUIDE_DAYS_PURPOSES`), so the Lab can print them.
- **Tell things apart without colour alone:** by shape, fill or weight. Planned days are filled and free days thin outlines; the policy test checks it.

**Words:**
- **Every word is the exercise's**, from its versioned content (`web/src/content/`), passed in as data. In the worked example, the bar's name `barLabel` would come from content; the Lab passes a fixed phrase.
- **Never the person's own typed words.** A visual request and a provenance record stay closed-vocabulary (`visual-system.md` §9).
- An instrument takes numbers, places and content words as inputs, and nothing else.

**The text alternative:**
- **The exercise gives the text people hear,** from its content: an illustration through the visual contract's `alt`, an instrument through the `aria-label` it puts on the slot or figure. The composition's own `alt` is for the validator and for reviewers.
- **The step's words say the same** as the picture. The cause map has a list under it, and the worked example has the slider's words.

---

## Step 3. States and motion, each with a reason

**An illustration's states** are named in the scene (`states`), one per step that shows it, each with what is visible and what is focal or receded. MCII has `future`, `contrast`, `plan` and `aside`. Emphasis moves attention; it never greys out something hope-bearing (`visual-policy.md` §3.9).

**An instrument has one state per set of inputs.** It is drawn again whenever the exercise's data changes. Changes between two drawings are found by comparing them.

**Motion is the exception, and always has a reason** (`visual-policy.md` §3.12):
- **An entrance** (`enter`: `fade`, `rise` or `draw`) says why the element appears. It is never used on an element shown in every state.
- **A departure** (`exit`: `fade` or `undraw`) says why the element goes.
- **A glide** (`moves`, in figures built from data) says why the element follows its value. In the worked example only the bar has one: "It follows the number a person sets, quickly, so each step can be seen." The marks change at once.
- **Between an illustration's states**, the scene lists its `transitions`.
- **The budget:** at most three movements in one change, and a reflow of at most 12 forms. `motionProblems` and `changeProblems` report anything over it.
- **Reduced motion** shows every change at once. That is the system's job: you don't write a reduced path.
- **A change that follows a person's own input** (a key, a drag, the native control) glides quickly (150 ms) for the elements that `moves`.

---

## Step 4. Interaction, with native controls as the main path

An instrument the person answers with has **a native control for every value**: a range input, radio buttons, a text field. The control is in the exercise's template, labelled from its content, and it holds the value. The figure is a second way to set it, never the only way (`visual-system.md` §7, tier 2).

**Declaring what the figure can set:**
- **`scales`:** each value's domain, its range in scene units and its step. The worked example's `DAYS_SCALE` puts 0–7 days at the bar's eight places.
- **`target` on an element:**
  - `handle`: moved along one or two scales, optionally with a `track` that a press places it on
  - `region`: chosen as a whole, with `choices` giving each option its words
- **Small targets** count 24 × 24 units around their centre (`MIN_TARGET`). The worked example's bar is 6 units wide; its line is the larger place to press.

**Binding the figure to the exercise's value** (`integration/interactive-figure.ts`):
- The exercise passes its values in and draws the figure again from them (`composed`).
- The figure reports changes as values (`valuesChange`), never positions, snapped to the scale's steps and held at its ends.
- **`controlledBy="native"`:** the figure takes the pointer only and is a picture named by its text alternative. The native control beside it is what keyboards and screen readers use. This is the usual choice in an exercise, and the worked example's.
- **`controlledBy="figure"`:** the figure itself is the control: one slider per axis, or a radio group, with a focus ring drawn in the figure. Use it only when the figure is the clearest control, and say why in the review.

**The figure and the native control must say the same.** `controlsOf` (in `interaction/controls.ts`) describes the controls a figure stands for. The worked example's policy test checks that it gives one slider named "Days you plan to practise", from 0 to 7 in steps of 1, at the exercise's value.

---

## Step 5. The validator and the policy test

**The validator** (`composition/validate.ts`, `validateScene`) checks what every composition must be:
- known styles, materials and generators
- a purpose on every element, and nothing that no state shows
- at most one focal element
- reasons for motion
- targets on known scales
- contrast of the subject on its plane

**The spacing check** (`composition/spacing.ts`, `spacingWarnings`) lists labels too close to a form they don't name.

**The policy test** is a spec next to the composition (`<name>.policy.spec.ts`). It asserts the header's Must and Must not lines, for every case the exercise can produce. The worked example's spec checks:
- it is valid, with no spacing warnings, for every number from 0 to 7
- it fills exactly the planned days, by fill and weight
- it draws inside its frame, in token colours only, in the Action theme
- it holds the number at 0 and 7
- the bar stands where its scale puts the number, and `controlsOf` matches the native control
- only the bar glides when the number changes, and the change keeps to the motion budget

A Must line that no test can check is written as a review question instead (step 9).

---

## Step 6. Show it in the Visual Lab

Reviewers see a composition in the Lab first (`/lab`, development builds only), in light and dark side by side. Forced colours are emulated by the browser tests.

**The Lab section:**
- every state or every case that matters
- the purpose table
- validation problems and spacing warnings, if there are any
- for a figure a person moves: its values, live
- **for an instrument, bound as the exercise will bind it:** the worked example's section (`pages/lab/lab-guide.ts`) has the native control, the figure that takes the pointer, the slot, and the recorded source

**Kept complete by tests:**
- **The contents and the catalog** (`pages/lab/lab-catalog-data.ts`): add the section to `SECTIONS`, and the composition to its capability row. `lab-catalog.spec.ts` fails if an instrument, scene or section is missing.
- **The parity cases** (`pages/lab/lab-parity-cases.ts`): add a case per state, and one per kind of change. The parity suite then checks that the canvas backend draws what SVG draws, and the export script can write it as SVG and PNG.
- **The Lab's browser test** (`e2e/visual-lab.spec.ts`): update its counts. Add a test that uses the figure the way a person would.

---

## Step 7. Bind it to the exercise

Exercises reach the system only through S9 (`visual-system.md` §3.4, rules 6 and 7):
- never a backend, a generator or a rendering library
- `*-logic.ts` and `*-store.ts` import nothing from the Visual System

**An illustration** (MCII):
1. Register the scene in `scenes/index.ts` with its words (`contentText`).
2. In the exercise's `providers`: `provideSceneVisuals('<scene id>', '<prefix>')`.
3. In the template: `<app-visual-slot [request]="…" />`, with requests named `<prefix>.<state>`. `facets.from` names the state shown on the step before, so the change plays.

**An instrument that only shows:**
1. Add it to `INSTRUMENTS` (`integration/instruments.ts`) and its ratio to `instrument-slot.ts`. That's one line each.
2. In the template, put `<app-vis-instrument-slot instrument="<name>" [inputs]="…" />` inside an element with `role="img"` and the exercise's `aria-label`. The slot loads the instrument on demand and holds its space meanwhile.

**An instrument the person moves:**
1. Draw it from the exercise's value: `composeInstrument('<name>', inputs)`.
2. Put `<app-vis-interactive [composed]="…" [values]="…" (valuesChange)="…" controlledBy="native" />` next to the exercise's own native control.
3. Both write the exercise's one value. The worked example's `LabGuide` does exactly this.

**An asset:** `provideAssetVisuals('<asset id>', '<request>')` in the exercise's providers. A draft asset shows nothing; only an approved one is served.

**A stimulus:** no exercise runs one yet. A measurement task is its own proposal, with the photodiode check first.

**Whatever the tier:** the exercise's own tests run with the visual absent, failing and slow (`visual-slot.spec.ts` covers the slot). The step must read and work the same in all three.

---

## Step 8. Provenance: record what was drawn

Each step records what it drew as its `visual_source`: one string, so the stored data keeps its shape (`visual-system.md` §9). Try it keeps it too.

| Tier | Recorded as | Made by |
|---|---|---|
| Illustration | `scene:<id>@<version>;theme:<theme>@<version>` | the scene source, once a picture has been drawn |
| Instrument | `instrument:<id>@<version>;theme:<theme>@<version>` | `instrumentSourceId(composed)`, in `integration/instruments.ts` |
| Asset | `asset:<id>@<version>` | the asset source, once an approved asset has been served |
| Stimulus | the spec version, seed and measured timing | the stimulus run's log (not yet recorded with a session) |

- The instrument's inputs are not part of the source. They are the person's answers, already recorded with the step.
- The worked example shows its source under the figure, as the exercise would record it.
- **Not yet wired:** the cause map and the dot game's instruments don't record their source yet. Doing so changes those exercises, so it is its own proposal.
- Experiment exercises record nothing new.

---

## Step 9. Reviews and baselines

Automated tests prove a visual is correct, consistent and accessible; only people can judge whether it is good, clear and appropriate (`visual-policy.md` §9). The reviews gate your merge to production, never anything in the software: no feature flags or approval switches.

| Review | When | Who | Where |
|---|---|---|---|
| **R1 Language** | a new theme, material or asset | you | the review sheet, the Lab |
| **R2 Composition** | every state and every change | you | the Lab, light and dark, reduced motion |
| **R3 In context** | the integrated exercise, start to end | you, and for exercise scenes the psychology-trained reviewer, with a veto | the test environment |
| **R4 Usability** | each exercise integration | participants | the usability sessions (`usability-procedure.md`) |

**The order:**
1. R2 in the Lab.
2. Integrate on the development branch.
3. R3 and the psychology-trained reviewer in the test environment.
4. You merge once they accept it.

**The review log** (`visual-reviews.md`). Each entry has:
- the date, the review and the reviewers
- the item, named `id@version` in its heading
- what was seen
- the scores (`visual-policy.md` §9.3)
- the verdict: **Accept**, Revise or Reject
- under "Baselines approved", the image files it approves

**Baselines,** once an entry accepts the composition:
1. Add one entry to `ACCEPTED` in `pages/lab/lab-baselines.ts`:
   - the composition and the version accepted
   - the review entries behind it
   - the width it was approved at
   - each shot's key and parity case
2. Run the browser tests once. The harness ("approved baselines") draws each shot on the parity page's test surface in light, dark and forced colours. On that first run Playwright writes each missing image and fails, saying it wrote it. Look at the new images; they are the files the review entry names. From the next run, each must match pixel for pixel.
3. The guards (`lab-baselines.spec.ts`) then check, on every run:
   - every image has an accepted entry naming it
   - every listed composition has all its images
   - none is stale

**A later change to what is drawn** means a new version. The guards fail, naming both versions, until a review entry accepts the new version, the list is updated, and the images are replaced with that entry.

The worked example has no review entry and no baselines: it is a reference, and it reaches no participant.

---

## Checklist

- [ ] **Step 0:** the idea in one sentence; a purpose for every element; the step works without the picture.
- [ ] **Step 1:** the tier chosen, and why.
- [ ] **Step 2:**
  - a composition with the policy header, an id and version 1
  - S1 styles only
  - a purpose on every element
  - words from content, never typed text
  - the exercise's text alternative
- [ ] **Step 3:** motion only with reasons, within the budget.
- [ ] **Step 4:**
  - a native control for every value
  - the figure's targets on its scales
  - `controlsOf` matching the control
- [ ] **Step 5:** the validator clean; a policy spec for every Must line it can test.
- [ ] **Step 6:**
  - a Lab section
  - the contents, the catalog and the parity cases
  - the Lab's browser test
- [ ] **Step 7:**
  - bound through S9 only
  - the exercise's tests with the visual absent, failing and slow
- [ ] **Step 8:** the visual source recorded.
- [ ] **Step 9:**
  - R2, then R3 and the psychology-trained reviewer
  - a review entry
  - baselines through the list
  - your merge
