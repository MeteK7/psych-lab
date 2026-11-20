# An independent visual engine for semantic-to-visual generation: investigation, revision 3

> **Status (2026-11-17):** investigation only. Revision 3, after your review of revisions 1 and 2. Nothing in it is built.
> - **What accepting this report did not authorize:** Stage 1 or Stage 1b, any source code, any prototype, any dependency, any change to a policy document, any contact with an external service. Accepting the report is not accepting its recommendations.
> - **What waits for your decision:** the six decisions in §13. Stage 1 starts only when you say so, with the scope you choose in D2.
> - **Companion documents:** `visual-system.md` (the engine as built), `visual-policy.md` (the quality rubric used in §9.3).

## 0. The objective

**An independent, reusable visual engine.** It accepts domain-neutral visual representations and generates visual experiences from them. Applications differ in how they interpret their content and map it to a representation; the engine does not know which application it serves. The psychology application is the engine's first consumer, not its definition. Prepared compositions are a starting rung and never the ceiling.

Every recommendation below is weighed against that objective first, and against this application's convenience second.

---

## 1. What changed from revision 2

| Revision 2 | Status | Now |
|---|---|---|
| Statements carried the status "observed" | **Withdrawn** | The system observes nothing. It has a person's account. Five categories replace it (§3) |
| "But" was read as "a greeting was expected" | **Withdrawn** | That is an inference by the interpreter, not something the sentence says |
| The example's alternative said "nothing passes between them" | **Withdrawn** | The sentence says only that no hello was said. A nod is not excluded |
| Pointing at a span of text was listed as a guard | **Revised** | A span shows where a claim came from, not that it follows. Ten layered guards replace it (§3.3) |
| The representation was participants and relations | **Revised** | An envelope with optional facets. Relations are one facet of six (§4) |
| One synthesizer | **Revised** | Several visual idioms behind one contract. A new visual approach is a new idiom, not a new architecture (§5) |
| Validity was the test of a synthesized scene | **Revised** | Visual quality is a requirement with its own gates, and the study evaluates it directly (§6, §9) |
| A second domain was checked later, with one example each | **Revised** | Three domains are in the study corpus from the start, with explicit independence tests (§7, §9) |
| Existing frame timings were cited as evidence that SVG and canvas suffice | **Withdrawn** | They are evidence about today's figures only (§8) |
| Stage 1b needed agreement to send sample text to a service | **Revised** | Synthetic content only. No external call without a separate, explicit approval (§10) |
| Three layers; interpretation and mapping in the application; an independent engine; no AI in the engine; no image generation at runtime | **Stands** | |
| The findings on the existing code | **Stand** | §12 |

---

## 2. The architecture at a glance

```
APPLICATION  (psychology · education · project management · …)
  interpreter     content → account: what is reported, implied, inferred, possible, unknown
  mapping         account → representation            domain knowledge, reviewed by domain experts
  style pack      themes · limits · purposes · preferred idioms
═════ CONTRACT: the REPRESENTATION — an envelope plus optional facets; typed, versioned, no language ═════
ENGINE
  idioms          arrangement · spatial scene · kinetic sequence · field · metaphor frame · abstract
                  each: representation → scene, states, motion, alternative text, coverage report
  invariants      commitment → visual register · no accidental assertion · validation · quality gates
  core            scene → state · style · motion → resolved frame          (S1–S6, as built)
  renderers       resolved frame + timeline → SVG · canvas · export        (S7, as built)
```

**Fixed:** the envelope, the invariants, the scene and frame contracts, the review process.
**Open to growth:** facets (what can be said), idioms (how it is shown), primitives (what can be drawn).

---

## 3. Semantic interpretation

### 3.1 Five categories

Everything the interpreter produces is the person's **account**, never an established event. Each statement falls in exactly one category.

| Category | Definition | Who may put a statement here |
|---|---|---|
| **1. Reported** | What the text explicitly asserts, attributed to the writer. Includes the writer's own stated conclusions and feelings, marked as theirs | Only a statement that restates the text's own words in a fixed predicate form |
| **2. Linguistically implied** | What follows from the language itself: entailments, presuppositions, conventional meanings of words such as "but" | Only a statement matching a **reviewed list of licensed patterns** |
| **3. Interpreter inference** | Anything added from world knowledge or pragmatics | Everything else the interpreter proposes |
| **4. Possibility** | Something compatible with the account but not asserted by it | The person, or reviewed content. Never a single possibility on its own |
| **5. Unknown** | A question the account raises and does not answer | Unfilled roles of the situations the reported content evokes |

### 3.2 The example, done again

**Written:** "I passed a colleague, but they didn't say hello."

| # | Statement | Category | Basis |
|---|---|---|---|
| R1 | The writer passed a colleague | Reported | "I passed a colleague" |
| R2 | The colleague did not say hello | Reported | "they didn't say hello" |
| L1 | There is a colleague, and the two came past each other | Implied | Presupposition and entailment of R1 |
| L2 | The writer sets the second clause against the first | Implied | The conventional meaning of "but": a contrast, whose content is not specified |
| I1 | The writer expected a greeting | **Inference** | Pragmatic. Plausible, not stated |
| I2 | The missing greeting mattered to the writer | **Inference** | Pragmatic |
| I3 | No acknowledgement of any kind took place | **Inference** | R2 excludes a spoken hello only |
| P | The colleague did not see them; was absorbed in thought; felt awkward; … | Possibility | CS3's reviewed readings for this scenario, or the person's own |
| U1 | Whether the colleague noticed the writer | Unknown | Role of the encounter not filled |
| U2 | Whether the writer greeted | Unknown | Role not filled |
| U3 | Whether anything other than speech passed between them | Unknown | Role not filled |
| U4 | Why | Unknown | Not stated |

Revision 2 put I1 and I3 into the picture as facts. Under these rules neither can be drawn as established. L2 has one safe use: it tells the mapping where the writer's emphasis lies.

### 3.3 How unsupported conclusions are kept from becoming visual facts

1. **The category is computed, not chosen.** The interpreter states how each statement was derived, from a closed list (restatement, entailment, presupposition, conventional meaning, pragmatic inference, world knowledge, alternative). A table turns the derivation into a category.
2. **Category 2 is a closed, reviewed list.** "X passed Y" licenses "X and Y came past each other". "But" licenses "the writer marks a contrast". A claimed implication that matches no licensed pattern is category 3.
3. **Verification is independent of the interpreter.** A reported statement must be buildable from the words of its span in a fixed predicate form, which code can check. An implied statement must match the list. An optional second pass asks only "does the text entail this: yes, no, cannot tell", and anything but yes demotes.
4. **Commitment moves one way.** Automatic steps can lower a statement's category and never raise it. Only the person raises one, by confirming it: "yes, I expected a hello" turns I1 into a reported statement.
5. **The contract enforces it.** Every statement in the representation carries its commitment. The engine's **established register** accepts only categories 1 and 2. This is a type in the contract and a validator rule on every scene, not guidance.
6. **Inferences are questions, not picture elements.** An inference is put to the person in words. Unconfirmed, it is not drawn.
7. **Possibilities come as a set.** At least two, at equal visual weight, from the person or from reviewed content. A single machine-suggested reading of someone's situation would steer.
8. **No accidental assertion.** Every drawn thing has a size, a place and a direction, and each can be read as a claim. So every meaning-bearing visual property is either driven by a statement or drawn in a declared neutral form: a form with no facing, equal sizes, a symmetric placement. Each idiom returns a **coverage report**: which statements it showed, which it could not, and that it drew nothing no statement asked for.
9. **Back-reading.** Someone who has not seen the text describes the figure. Every claim in their description must match a statement of sufficient commitment. A claim with no match is an accidental assertion. This is a test in the study and in later review.
10. **The framing is stated.** Words beside the figure say it shows the account as written, as the room's line says "the drawing isn't your moment".

**What interpretation is measured on:** the *over-commitment rate*, the share of statements given a stronger category than a careful human gave them. It gates any interpreter (§10).

**What remains:** the system cannot know whether the account is true and does not claim to. An interpreter can still mislabel a derivation, which is why 3, 4, 6 and 9 do not rely on it.

---

## 4. The representation: an envelope, not a vocabulary of relationships

### 4.1 The envelope (small and stable)

| Part | Carries |
|---|---|
| **Elements** | What the picture is about: a presence, an object, a place, a quantity, a quality. Each with a salience |
| **Statements** | What is said of them, each with a **commitment** (the five levels, domain-neutral: an education app has established and hypothesised, a planning app has committed and assumed) |
| **Time** | Phases, order, what changes between them |
| **Qualities** | Stillness, openness, weight, tension; bounded numbers whose limits the style pack sets |
| **Facets** | Optional, typed extensions (below) |
| **Hints** | Preferred idioms; reading order |

### 4.2 Facets (each optional, each versioned on its own)

| Facet | Says | Example |
|---|---|---|
| Relations | near, apart, linked, inside, blocked by, supports, precedes | A task blocked by a licence |
| Space | Places, positions, ground, a viewpoint and its path | A moment seen from further back |
| Dynamics | Events, forces, flows, rhythm, change | Blood pumped from heart to lungs |
| Fields | A quality spread over an extent and how it varies: density, direction, clarity, turbulence | Certainty that is clear in one region and unresolved in another |
| Metaphor | A named source frame and which element plays which role in it | A path with something on it |
| Quantities | Scales, proportions, counts | Three of five |

Relations are one facet. A representation may have none: "Everything has felt far away lately" has no participants and no relations; it has a quality and perhaps a field.

### 4.3 Why this does not harden into a diagram generator

The envelope says *what is meant and how firmly*. It does not say *how it is shown*. That is the idiom's job (§5). A new kind of meaning adds a facet; nothing existing changes. A facet enters the contract only when it is stated without domain words and at least two domains use it (§7).

---

## 5. Synthesis: visual idioms behind one contract

### 5.1 An idiom

An idiom is one way of turning meaning into a composition. Each implements the same contract: representation, style pack and frame in; scene, states, motion, alternative text and coverage report out. Each declares which facets it reads.

| Idiom | Shows meaning through | Draws on (existing) | Would need (new) |
|---|---|---|---|
| **Arrangement** | Forms and their placement | Layouts, `outline.ts`, `curveThrough`, `curve.lens` | Placement from relations; relation marks |
| **Spatial scene** | A constructed place, bodies, a viewpoint | Camera, clipping, solids, faceless figures, drawing order, the viewpoint figure | A general scene builder (the room is one hand-built scene of 634 lines) |
| **Kinetic sequence** | Movement and timing | Timing core, glides, frame-by-frame drawing | Movement along a path, sequenced beats, pause and replay |
| **Field** | A continuous surface that varies or changes | `field.flow`, `field.contours`, `dots.scatter`, noise, translucency, grain | Fields driven by parameters over time |
| **Metaphor frame** | A familiar scene standing for the meaning | `mcii.path` is one, authored by hand | Frames with roles, as data |
| **Abstract composition** | Proportion, rhythm, weight, balance | Forms, materials, light | Rules for composing from qualities alone |

Idioms combine: a field as the ground under an arrangement; a kinetic sequence inside a spatial scene.

### 5.2 Adding a fundamentally different approach

| To add | Changes | Does not change |
|---|---|---|
| A new idiom | One new synthesizer; perhaps a facet; perhaps primitives through the extension points the design doc already defines (§6.1: a generator, a material, an element kind, a motion effect, a backend) | The envelope, the invariants, the core pipeline, the frame contract, every other idiom, every application |

This is the pattern by which a browser gained grid layout beside flow layout without a new rendering engine.

**Who chooses the idiom:** at first the application, in its mapping or style pack, because the choice of a metaphor or a treatment is domain judgement. An engine-side planner that proposes idioms, composes several candidates and ranks them (§6) can come later.

### 5.3 Where the present contracts would become the limit

Stated now so the study can test them:
- **The resolved frame** carries five shapes and text in a flat list, with linear and radial gradients, grain, and seven kinds of timeline track. It has no groups, clipping, blending or filters.
- **Motion** today explains a change of state. Movement that *is* the meaning, and fields that change continuously, go beyond `visual-policy.md` §3.12 and beyond the timeline's present tracks.
- **Generated elements** return one static path. A field that evolves needs parameters over time (S4 parameter targets, designed and not built).
- **Beyond the frame altogether:** true 3D shading, raster imagery, simulation. The design doc already names their routes (a GPU backend on a trigger, an asset element, a custom element).

---

## 6. Visual quality as an architectural requirement

A valid scene is not a good one. `visual-system.md` §10 already says automated checks cannot establish quality. The architecture has to carry quality by construction.

| # | Requirement | Mechanism |
|---|---|---|
| Q1 | **Idioms are designed, not emergent** | An idiom's rules are written down from hand-made compositions that passed review (the existing "composition first", §5.1 of the design doc). No idiom enters the engine without an accepted set of exemplars |
| Q2 | **The house standard is data** | The style pack carries the checkable parts of `visual-policy.md` §3: the 6% safe area, a third of the frame as calm ground, one focal element, about seven forms, consistent depth cues, the light's direction, no bounce or spin |
| Q3 | **Three levels of check** | Constraints reject (validator, contrast, spacing). Composition measures rank and set a floor (balance of visual weight as §3.1 defines it, empty space, hierarchy contrast, element count). People accept (review of the idiom and its corpus) |
| Q4 | **Compose several, keep the best** | An idiom produces a few seeded candidates and the measures choose. Deterministic for a given seed |
| Q5 | **No figure is better than a poor one** | Below the floor, the engine returns nothing, or the application falls back to a prepared composition |
| Q6 | **Quality cannot drift silently** | The corpus is re-rendered on every change. Outputs are deterministic, so reviewed outputs become pixel baselines in the existing harness |
| Q7 | **Stated limit** | Measures can reject a bad composition. They cannot certify a good one. Review remains the authority |

---

## 7. Independence across applications

### 7.1 Testable properties

1. No term in the envelope, a facet or an idiom is defined with a domain word.
2. The engine imports nothing from an application; an application reaches the engine through public entry points only.
3. The same representation renders under two style packs with no engine change.
4. A new domain's mapping can be written without touching the engine.
5. Structurally similar content from different domains yields the same shape of representation.

### 7.2 The engine-first rule

A capability enters the engine only if it is stated in domain-neutral terms **and** at least two domains use it. Otherwise it stays in the application's mapping or style pack. The study applies this from its first case.

### 7.3 How the study tests it (§9 has the corpus)

| Test | Method | A failure looks like |
|---|---|---|
| **Vocabulary audit** | Every term checked against property 1 | "Reading", "task", "organ" appearing in the engine's vocabulary |
| **Reuse matrix** | For each facet, term, form and idiom: which domains used it | A term used by one domain only |
| **Structural twins** | Sets of cases with one underlying structure across domains (below) | Twins needing different representations or different engine rules |
| **Structural strangers** | Cases particular to one domain: a cycle, a part–whole anatomy, a critical path, a vantage | The engine needing a domain concept to cope |
| **Style-pack swap** | One representation under this app's pack and a second pack | Calm-and-adult limits found inside the engine |
| **Clean mapping** | Education and planning mappings written against the frozen study vocabulary; every wish for a new engine term logged | Many logged wishes, or terms only one domain wants |

**Twins in the corpus:**
- *One fact, several explanations:* a classmate walks past without a hello (CS3) · one observation that fits two hypotheses (education) · a delay that could have three causes (planning).
- *Waiting on something not yet known:* a friend has not replied (CS3) · an experiment whose result is not in (education) · a supplier who has not answered (planning).
- *Several things lead to one:* causes of a setback · causes of a historical event · workstreams converging on a launch.
- *Where you look from changes what you see:* stepping back from a moment (camera angle) · a frame of reference in physics · a task seen alone and in the whole plan.

**Level of evidence.** Passing these tests means the neutrality claim was not falsified across three domains by one team. Proof comes only when a second application is built on the engine.

### 7.4 Present coupling (unchanged findings)

58 of 79 files are plain TypeScript with no Angular and no DOM; 21 use Angular, all in `integration/`, the backend shells and the two root contract files. One outward import. No graphics library. This app's vocabulary is fused into the engine in nine places: area themes as a closed type, four host CSS variables, purpose kinds, house limits in the validator and generators, app compositions inside the engine folder, closed registries, English and Segoe UI, no public entry point, tests that reach into the app. The resolved frame is a sound interoperability base lacking a schema version, self-contained colour and a stated font assumption. Packages wait for a second consumer; the boundary can be drawn inside this repository earlier.

---

## 8. Performance: measured, estimated, unknown

### 8.1 Measured (existing figures, this machine: Intel HD 530, 60 Hz)

| What | Result | Source |
|---|---|---|
| Every Lab figure and parity change, about 20 animated objects at most | 60 fps; our work per frame at most 0.5 ms (SVG), 2.4 ms (canvas) | `visual-system.md` §14, 2026-11-12 |
| The room's viewpoint move, composed again every frame on canvas | 60 fps; 1.5–2.0 ms median, 6 ms at most (`@1`); 0.9–1.3 ms (`@2`) | §15, 2026-11-14 and 2026-11-15 |
| The same room with outlines on its surfaces | Paint time 6.4 ms against 2.3 ms; fell below the 50 fps watchdog; outlines dropped | §15, 2026-11-14 |

**What this supports:** today's figures have headroom, and frame-by-frame composition of one spatial scene is feasible. **What it also shows:** one added treatment took that scene past the budget. Nothing here measures synthesis.

### 8.2 Not measured: estimates and unknowns for the new capabilities

| Capability | Status | Why it is uncertain |
|---|---|---|
| Placement from relations | **Unknown** | Depends on the method, its iterations and the number of elements; composing several candidates multiplies it |
| Synthesis time per change (representation → scene) | **Unknown** | No synthesizer exists |
| Validation and quality measures on every scene | **Unknown**; the validator has never run in the app's path | |
| Larger compositions (50–200 elements; gradients, translucency, grain) | **Unknown** | SVG cost grows with node count; the outline result is a warning |
| Movement along paths, several forms at once | **Estimate: feasible on canvas**, by analogy with the room | Not measured on SVG's frame loop, which today runs only for glides |
| Fields that change over time | **Unknown, probably the heaviest** | A flow field of up to 200 lines regenerated every frame |
| General spatial scenes | **Estimate: near the room's cost for similar content** | One data point |
| Memory over many re-compositions | **Unknown** | The generator cache holds 500 entries and then clears |
| Bundle size | **Unknown**; the current size was not measured either | |
| Interpretation latency | **Unknown**; a network call or a model download | |

### 8.3 What the Lab study must measure

On the reference machine, with the Lab's existing performance overlay and frame statistics, in SVG and canvas, at device pixel ratios 1, 1.5 and 2:

- **Our work per frame** for every working figure, against the existing budget (half the frame interval: 8.3 ms at 60 Hz, 4.2 ms at 120 Hz), and frame rate against the 50 fps watchdog.
- **Movement:** 2, 4, 8 and 16 forms moving along paths at once.
- **Fields:** a field regenerated each frame at three sizes and line counts.
- **Composition size:** the same idiom at 25, 50, 100 and 200 elements.
- **Placement probes:** two or three candidate methods, timed at 2, 4, 8 and 16 elements and with 1, 4 and 8 candidates. Proposed budget to test, not yet a commitment: 50 ms for a composition that appears once, 16 ms for one that follows a drag.
- **Validation and quality measures** per scene.
- **Memory** after 100 re-compositions.

Results decide what an idiom may do, and whether any technology trigger in `visual-system.md` §14 is met. None is assumed met.

---

## 9. Stage 1: the representation study

No synthesizer is built. Representations are written by hand, figures are composed by hand in the Lab, and the gap between "by the rules" and "by hand" is measured.

### 9.1 The six questions and how each is answered

| Question | Method | Evidence |
|---|---|---|
| **1. Can the representation express different kinds of meaning?** | An account and a representation written for every case | An **expressiveness log**: each place meaning was lost, distorted, or needed a new term |
| **2. Do different meanings produce genuinely different compositions?** | A **matching test**: figures and the alternative texts of their representations, shuffled; a reviewer pairs them | If figures cannot be matched to meanings well above chance, the output is generic |
| **3. Do abstract and spatial approaches both have potential?** | Each depth case composed in at least three idioms, at least one flat and one spatial | Scores per idiom per kind of meaning |
| **4. Do results meet the existing quality standard?** | The existing rubric (§9.3) and the by-the-rules protocol (§9.4) | Scored sheets; the **deviation log** |
| **5. Where does the architecture become restrictive?** | Logged as found | Expressiveness log; deviation log; a **primitives log** (what the frame could not carry, §5.3); a **policy log** (rules that blocked a concept, each with a proposed change) |
| **6. Can the same visual concepts be reused across domains?** | The tests of §7.3 | Reuse matrix; twin results; audit; pack swap |

### 9.2 The corpus (34 synthetic cases; no personal data)

| Source | Cases | Chosen to cover |
|---|---|---|
| **CS3** (6) | The six scenarios already in reviewed content: the teacher's note; a friend who has not replied; the manager who moved a meeting; a suggestion with no reactions; the essay comment; the classmate who walked past. Each has five reviewed readings | A reported fact with several possible explanations; absence; unknown intent |
| **Change the camera angle** (6) | Written for the study: a remark in a meeting; an argument at a table; a message read alone; a mistake nobody saw; a moment in a crowd; a call that ended abruptly | Vantage and distance. Three are kinds the design review found the room fits poorly (§9.2 of its design doc) |
| **Education** (8) | Circulation between heart and lungs; the water cycle; a fraction as part of a whole; natural selection over generations; one observation fitting two hypotheses; forces in balance on a bridge; several causes of one event; a common misconception against the established account | Flow, cycle, part–whole, change without an agent, force, belief against evidence |
| **Project management** (8) | Design before build, build blocked; three workstreams converging; one person needed by two tasks; a slip and its knock-on; a date that depends on a silent supplier; scope added mid-way; a handoff that loses context; a delay with three possible causes | Dependency, convergence, contention, propagation, unknowns |
| **Stress cases** (6) | No participants ("Everything has felt far away lately"); mostly quantity; negation and a hypothetical; a long account of several events; two words; a self-contradiction | Where the envelope or an idiom breaks |

### 9.3 How visual quality is evaluated

- **The rubric is the existing one:** `visual-policy.md` §9.4's checklist, scored 2, 1 or 0 per §9.3, with its verdict rule. That covers the thirteen quality criteria of §3, conceptual clarity (§4, including the paraphrase test), scientific appropriateness (§5) and coherence with approved scenes.
- **Two criteria are made explicit:** *an experience, not a diagram* (§3.13 already names "a generic diagram … flat shapes with no space or light" as the too-simple failure), and *says only what is meant* (back-reading, §3.3 guard 9).
- **Anchors:** each figure is shown in the Lab beside `camera-angle.room@3` and `mcii.path@4`. It must look like the same product at the same standard.
- **Genuinely different directions.** Directions are placed on five axes declared in advance: flat or spatial; still or moving; made of forms or of a field; direct or metaphorical; fixed or movable viewpoint. Two figures count as different directions only if they differ on at least two axes. Each depth case gets at least three.
- **Working figures:** in light, dark, forced colours and reduced motion, as R2 requires. Not descriptions or stills.
- **Reviewers:** you, as in R2. D5 asks whether the psychology-trained reviewer and a visual designer take part.

### 9.4 The by-the-rules protocol (what stands in for "generated")

For each idiom, its composition rules are written down first. Each figure is then composed **strictly by those rules** from its representation and scored. Only after that may it be finished by hand, with every departure from the rules recorded in the deviation log, and scored again.

- A small gap between the two scores means the rules can carry the quality, so a synthesizer could.
- A large gap, or many one-off departures, means the idiom depends on a designer's hand each time and should stay a prepared composition.

### 9.5 Passes

| Pass | What | Output |
|---|---|---|
| **A. Breadth, on paper** | Accounts (five categories) and representations for all 34 cases | Documents; the expressiveness log; the first reuse matrix |
| **B. Depth, in the Lab** | 12 cases, three from each source, in at least three directions each | About 36 working figures, by the rules and then finished; scored |
| **C. Reuse** | The four twin sets through the same idiom rules; three figures under a second style pack | Twin results; audit; pack-swap result |
| **D. Measurement** | §8.3 | Timings against budgets |
| **E. Review and findings** | Your scoring; the matching test; back-reading | A findings report with a recommendation |

### 9.6 What the study ends in

One of three recommendations, each tied to evidence:
- **Go:** which idioms carried quality by the rules, which facets were needed, what the first engine version would contain.
- **Narrow:** some idioms stay prepared compositions; the engine layer is smaller.
- **Stop:** no direction reached the standard by the rules. Dynamic generation stays at prepared compositions selected by meaning.

### 9.7 What the study does not include

No synthesizer and no change to the engine folder. No exercise integration. No policy change (conflicts are logged with proposals). No personal data. No external service. Study figures live under the Lab only, which rule 9 exempts from "every figure through the system" (D3).

---

## 10. Stage 1b: the interpretation trial

**Purpose:** find out whether text can be turned into an account in the five categories reliably enough. It is scored on accounts only and never by looking at a picture. Stage 1 uses hand-written representations, so the two results cannot contaminate each other.

**Content:** synthetic only: the 34 corpus texts plus a robustness set written for the trial (hedges, sarcasm, quoted speech, hypotheticals, questions, typos, another language, very short and very long texts, strong emotion, and text that tries to instruct the interpreter). No text from any person's session, ever.

**Reference annotations:** each text annotated by hand in the five categories before any interpreter is run. Ideally by two people, because "implied" against "inferred" is a judgement; if two careful people often disagree, the categories need redefining before any machine is blamed.

| Measure | Meaning |
|---|---|
| **Over-commitment rate** (primary) | Statements given a stronger category than the reference. The safety measure |
| Fabrication rate | Statements with no basis in the text |
| Recall per category | What the reference had that the interpreter missed, unknowns included |
| Stability | The same text run several times: does the structure change? |
| Robustness | The same measures on the robustness set; whether embedded instructions are obeyed |
| Declining | Does it say "cannot interpret" when it should? |
| Latency and cost | Per interpretation |

**Sequence:** the offline part first (texts, annotations, scoring scheme, the licensed-pattern list). Running any hosted model is a separate step that needs your explicit approval naming the service, and would send synthetic text only. Local options can be compared without that step if you allow the dependencies.

**How the two results combine later:** a wrong figure can be traced to its layer, because each hand-off (account, representation, scene) can be inspected on its own.

---

## 11. Progression

| Stage | What | Gate |
|---|---|---|
| 0 | Decisions D1–D6 | You |
| 1 | The representation study (§9), in the scope chosen in D2 | Your review of its findings |
| 1b | The interpretation trial (§10): offline part, then model runs if separately approved | Over-commitment rate; your review |
| 2 | **Decision point:** go, narrow or stop | You |
| 3 | The engine's representation layer, first version: the envelope, the invariants, and only the idioms that passed by the rules | Its own proposal |
| 4 | Interpretation and mapping in this application, behind an interface. Needs the policy decision on typed text | Its own proposal; the psychology-trained reviewer |
| 5 | First exercise integration | R2, R3, the reviewer |
| 6 | Boundary hardening in this repository; packages when a second application exists | Independent of 3–5 |

---

## 12. Findings on the existing system that stand

- Compositions built from data exist and work: a pure function from typed data to a new scene, composed again on each change and animated by comparing the two scenes.
- The pipeline from scene to resolved frame is pure and deterministic; two backends and an exporter agree under a parity suite.
- Colours are roles, so contrast, dark mode and forced colours hold for any composition.
- Nothing in the repository analyses text or uses a language model. No typed text from the Cognitive Shifts exercises leaves the browser.
- No existing figure depends on the meaning of anything written.
- `validateScene` runs only in the Lab and in tests.
- Built and unused by any exercise: the fields and distributions, the layouts, the interactive figure.
- "Typed text never reaches a visual" is written in policy (§3.11, §5 rule 8, §7) and in code comments; §5 is under the psychology-trained reviewer's veto.
- A picture competes with a person's own image of a moment (`camera-angle-design.md` §9.3), which is why the room is presented as a stand-in.

---

## 13. Decisions for the next stage

**D1. Is this architecture the working hypothesis the study tests?**
Three layers; an envelope with facets; idioms behind one contract; commitment as an invariant; quality gates.
(a) Yes. (b) Yes with changes you name. (c) No.
**Recommendation: (a).** It is a hypothesis to test, not a design to build.

**D2. How large is Stage 1 at first?**
(a) All of it: 34 cases on paper, 12 in depth. (b) A first slice: all 34 on paper, then 4 depth cases (one per source) in three directions each; your review; then the other 8. (c) Paper only.
**Recommendation: (b).** The main risk is quality, and twelve working figures show it early.

**D3. May the study's figures use throwaway code under the Lab?**
Movement along a path and changing fields do not exist in the engine. The Lab may hold its own drawing (rule 9).
(a) Yes: Lab-only, marked as study code, engine untouched. (b) No: only what the engine draws today.
**Recommendation: (a).** Under (b) the kinetic and field idioms cannot be judged.

**D4. Which idioms does the depth pass explore first?**
(a) Spatial scene, kinetic sequence, field: the three furthest from each other and from a diagram; metaphor where a case suits it. (b) Arrangement, spatial, kinetic. (c) Your selection.
**Recommendation: (a).**

**D5. Who reviews?**
(a) You. (b) You, and the psychology-trained reviewer on the psychology cases, advising. (c) As (b), with a visual designer advising on quality.
**Recommendation: (b);** (c) if a designer is available.

**D6. How does Stage 1b begin?**
(a) The offline part only; model runs wait for a separate approval. (b) Local options as well, with the dependencies they need. (c) Not yet.
**Recommendation: (a).**

**Decided (2026-11-17):** D1 (a), D2 (b), D3 (a), D4 (a), D5 (b). D6 is still open; it affects only Stage 1b. The first slice's work and results are in `docs/visual-study/`.

**Decisions that can wait until Stage 2 or later:** whether typed text may determine a figure, and where it may be interpreted; whether the layer is named a twelfth capability; when packages are extracted.

---

## How this was checked, and what was not

**Read first-hand for this revision:** `visual-policy.md` §1–§3.4, §3.12–§3.13, §5–§9; `visual-system.md` §6.1, §14, §15 (the measurements); `cs-not-enough.v4.json` (scenarios and readings); `cs-camera-angle.v1.json`; `camera-angle-design.md` §9.2–§9.3; `spatial/figures.ts`; `viewpoint-figure.ts`; `camera-room/room.ts` (policy header); the files listed in revision 2.

**Not done, by instruction:** nothing implemented, no prototype, no policy changed, no service contacted.

**Open to error:** the linguistic classification in §3.2 is mine and is exactly the kind of judgement the trial's two-annotator step exists to check. The six idioms and six facets are a proposal the study may cut or extend. The claim of domain neutrality is a hypothesis. The budgets in §8.3 are proposals to test.
