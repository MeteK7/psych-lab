# The Visual System: architecture and foundations (revision 3)

> **Status (2026-11-10):** v0.1 and v0.2 built and integrated (MCII scene, CS2 cause map), and the dot game drawn by the Visual System. **Direction revised 2026-11-10:** the system is shared infrastructure, completed through milestones M1–M8 (§14), built ahead of need and validated by reference compositions in the Visual Lab; what an exercise shows stays purpose-gated (§5.2). Where each subsystem stands: §3.0.
>
> **Earlier status:** v0.1 in progress, branch `test-visual-system`.
> - **Built so far:** S1 tokens and resolver, S3 types and validator, S4 visibility and emphasis, S5 motion for state changes, the SVG backend, the pipeline and a scene figure (S9), and the Visual Lab (development build, `/lab`). See the capability log (§15).
> - **Reviewed:** `mcii.path`'s states and transitions, accepted by you (`visual-reviews.md`, entries 1 and 2), with 12 screenshot baselines.
> - **Integrated (MCII step 4d):** the MCII exercise draws `mcii.path` on the development branch; the old built-in picture is removed.
> - **v0.2 (2026-11-08, scope revised by the pull rule):** the first instrument, the CS2 cause map (`cs2.cause-map@1`, `cs2-visual-proposal.md`), drawn from the exercise's answers and integrated into CS2 on the development branch. It's in the Visual Lab for R2; R3 and the psychology-trained reviewer follow in the test environment.
> - **Before you merge to production:** R3 (you, the exercise in context) and the psychology-trained reviewer's review of psychological suitability, both in the test environment (§10).
> - **Revision 3 (2026-11-08), after your review of `mcii.path@1`:**
>   - every element carries a purpose (§4.1, §4.3; `visual-policy.md` principle 6)
>   - compositions start from the existing picture (§5.1)
>   - the area studies and the generators only they and the v1 landscape used are removed (§5.3, §14, §15)
>   - S2 is back to DESIGNED until a composition pulls a generator
> - **Revision 2 (2026-11-07):** §3.4 rule 3, §4.1 (the frame and the roles), §13 (the `testing/` folder), §15.
> - It turns the approved direction (plan revision 3 of the Visual System, approved 2026-11-07 with five refinements) into the system's normative architecture.
> - **Companion documents:**
>   - `visual-policy.md`: visual quality criteria, conceptual clarity, scientific appropriateness, and human review
>   - `visual-language.md`: the S1 visual-language proposal, with a visual review sheet
> - **Claim labels:** **[F]** a verified fact, with a source or a file reference · **[J]** a technical judgement · **[A]** an assumption that still needs checking.
> - **Build status labels:**
>   - **NOW:** in the first release (v0.1)
>   - **DESIGNED:** the interface is fixed here, the code comes in a later release
>   - **TRIGGERED:** adopted only when a written condition is met

### How the five refinements are applied
| # | Refinement | Where |
|---|---|---|
| 1 | Keep the first implementation small; let real compositions decide how much the Scene Specification and generation core need | §5 (the pull rule, the capability log, the v0.1 scope) |
| 2 | Visual quality criteria beyond technical consistency and accessibility | `visual-policy.md` §3 |
| 3 | Generation, composition, styling, state, motion and rendering as independent capabilities | §3. "State and motion" from revision 3 is now two subsystems |
| 4 | Human visual review as an acceptance criterion alongside automated tests | §10 here; `visual-policy.md` §9 |
| 5 | Extensibility without bespoke renderers undermining the shared architecture | §6 (extension points, the backend contract, conformance, custom elements) |

---

## 1. Purpose and guiding principle
The Visual System is one platform capability for every visual experience the platform shows:
- illustrations
- interactive instruments
- precisely controlled experimental stimuli

Exercises use it; they don't contain their own visual machinery. It should make sophisticated, coherent, interactive and scientifically appropriate visuals possible across all areas. Its tools are procedural generation, mathematical geometry, composition, animation, conventional assets and, where justified, AI-generated assets.

**Guiding principle: the architecture is ambitious, the implementation is restrained, and the results are genuinely sophisticated.**

| Part | What it means in practice |
|---|---|
| Ambitious architecture | The boundaries, contracts and extension points are fixed now, for the platform's full range: all areas, three tiers, SVG, Canvas, GPU and 3D, conventional and AI assets. A later capability arrives as a new implementation behind an existing interface, never as a redesign |
| Restrained implementation | Code is written only for what a reviewed composition needs (§5). Interfaces for later capabilities are types and documents, not code |
| Sophisticated results | Quality is judged by people against explicit criteria (`visual-policy.md` §3). Passing automated tests is necessary but never sufficient (§10) |

## 2. Scope
**The system covers:**
- the visual language
- generation
- composition
- styling
- state
- motion
- interaction mapping
- rendering backends
- assets
- the integration tiers
- the Visual Lab
- the governance of all of these

**It doesn't cover:**
- **Exercise logic, steps, texts or records.** These stay in `*-logic.ts`, `*-store.ts` and versioned content.
- **Page layout and UI components** (buttons, cards, forms, navigation). The existing page design isn't redesigned.
- **The five existing colour tokens** (`--bg`, `--text`, `--muted`, `--border`, `--accent`). They stay unchanged. The visual language adds its own namespace (`visual-language.md` §2).
- **Icons** (`shared/icon.ts`). They stay as they are. They may later take their stroke weight from the visual language, which would be a separate decision.
- **The four experiment exercises.** During the development stage they can change like any exercise; they're frozen again only when participant data collection approaches (`plan.md` §9, "Development stage (2026-11-09)"). The n-of-1 study is postponed. Corrected 2026-11-12: this line first said they weren't touched while the n-of-1 study runs (plan decision D4).

---

## 3. Architecture

### 3.0 Where each subsystem stands (2026-11-10)
| # | Subsystem | Status | Built | Outstanding (milestone, §14) |
|---|---|---|---|---|
| S1 | Styling | **Built (M3, 2026-11-11); review R1 open** | Tokens: neutral and five area ramps; roles for light, dark and forced colours; emphasis; line weights; dashes; materials `line`, `tonal`, `solid`, and (M3) `lit` (shaded along the platform light), `translucent` with its defined `overlap`, and the contact `shadow`; planes drawn by their top edge (`edge: 'top'`); grain (`grain`, 5%, off by default); the platform light; motion tokens; type in figures (label sizes; wrapping within a width, lines 1.2 apart; a halo in the ground colour; the 8-unit clearance, checked); the review sheet in the Visual Lab | Your review of the visual language (R1) on the Lab's review sheet; changes from it go into `tokens.css` and `visual-language.md` together |
| S2 | Generation | **Built (M2, 2026-11-11)** | Seeded random; curves through points (centripetal Catmull-Rom), superellipse, arcs; periodic value noise and 2D gradient noise within the §8 limits; distributions (Poisson-disc, jittered grid); layouts (grid, radial, flow, circle packing) for compositions built from data. Generators: `form.blob`, `form.ridge`, `form.band`, `curve.rhythm`, `curve.arc`, `field.flow`, `field.contours`, `dots.scatter`, `dots.grid`; the `generated` scene element and scene seed | More generators as compositions ask for them (each a pure function with tests); running them in a Web Worker if one is measured slow |
| S3 | Composition | Partial | Scene Specification v0, validator, `mcii.path`; **compositions built from data** (`composition/compose.ts`, M1): the cause map, the rounds, the dot game and its preview are scenes, validated like `mcii.path` | Generator references, groups (M2); value transitions between data states (M5) |
| S4 | State | Partial | Visibility and emphasis per state | Parameter targets (M1, M5) |
| S5 | Motion | Built (M5) | Entrances, emphasis changes, reduced motion, budget, SVG playback; changes in figures built from data (M5): elements that `moves` glide to their new shape, place and paint as one movement (a reflow, up to 12 forms), labels that name them move with them, new elements enter; departures (`exit`: `fade`, `undraw`, with a reason) in state changes and data changes; quick glides (150 ms) that follow a person's own input in an interactive figure, its focus ring with it; the timing core (`rendering/timing.ts`) and shape tweening (`rendering/tween.ts`), shared by both backends; the SVG backend's frame loop for shapes (only while a glide plays, on an injectable frame clock), crossfades, departing items drawn as they were, and glides picked up mid-way ; `changeProblems` (the motion budget for changes of data, shown in the Lab); browser checks that the Web Animations playback follows the timing core | Canvas playback (M6) |
| S6 | Interaction | Built (M4) | Scales (`linear` with steps, `points`): a value to a position and back, snapped and clamped, keyboard steps and ends; targets in the scene spec (`handle` on one or two scales with its `track`, `region` with its option, `choices` with their words); hit testing on the real outlines, topmost first, small targets counted 24 × 24 units; a pointer on the page in scene units at any drawn size; validator rules (scales, targets serve `interaction` and have words, known scales and tracks, small targets kept clear, a handle on two scales names each axis, every choice has its words); the controller (drag with Escape to put the value back, press on a track, pick up and put down by clicks, a press chooses a region, keyboard steps per axis, arrows through a choice); `controlsOf`, the controls a figure stands for, read by the figure and by native controls alike; the interactive figure in S9: values in, values out, the moving handle focal, a focus ring, a cursor on hover, sliders and radio groups when the figure is the control, a picture when native controls hold the value | Touch gestures; the dot game's input and timing (M6); value motion (M5); first use in an exercise (a separate proposal) |
| S7 | Rendering | Partial (M6 stages A and B) | SVG backend (frames, timelines); canvas backend: still frames (the dot game) and, as a figure, every timeline track (`rendering/canvas/canvas-figure.ts`), on the shared playback (`rendering/playback.ts`: a timeline at a moment, and picking a change up mid-way) and frame clock; the parity suite against SVG (§6.2); the stimulus lane (`stimulus/`: specs with events in frames or ms, slots counted gap by gap, the check before a run, runs and their timing log) | Watchdog and overlay (stage C); GPU stays a trigger; display timing waits for the photodiode check |
| S8 | Assets | Outstanding | Nothing | Manifest, provenance, pipeline, offline export, optional AI adapter (M7) |
| S9 | Integration | Partial | Illustration tier (scene sources, the slot, provenance); instrument tier: one registry and one figure (`integration/instruments.ts`) drawn through the scene figure, `InstrumentSlot` for on-demand loading (M1) | Stimulus tier (M6) |
| S10 | Tooling | Partial | Visual Lab (scenes, transitions, instruments), screenshot baselines, purpose tables; the parity page and suite, the stimulus lane's section and the performance overlay (M6) | Capability catalog, export script (M7–M8) |
| S11 | Governance | Built | Policy, visual language, review log, dependency rules, capability log | The authoring guide for new exercises (M8) |

### 3.1 Six core capabilities, five supporting subsystems
The six core capabilities are independent: each has its own input and output types, its own folder and its own tests, and **none of them knows how another does its work.** Revision 3 combined state and motion in one subsystem (S4); they are now separate (S4, S5), and the later numbers move up by one.

| # | Subsystem | Kind | Responsibility in one line |
|---|---|---|---|
| S1 | **Styling** (the visual language) | Core | Turns semantic style references into concrete paint, line and material values, for light, dark and forced colours |
| S2 | **Generation** | Core | Turns parameters and a seed into geometry: path data, point sets, fields, layouts |
| S3 | **Composition** | Core | Arranges geometry into a scene: frame, layers, elements with ids and style references, labels, text alternatives |
| S4 | **State** | Core | Turns a named state into a target value for each element's properties (visible, emphasis, parameters), without any notion of time |
| S5 | **Motion** | Core | Turns a change from one state to another into a timeline of property changes, under the motion policy and the quality tier |
| S6 | **Interaction** | Supporting | Maps input to domain values and back: scales, regions, pointer and keyboard bindings, single-pointer alternatives |
| S7 | **Rendering** | Core | Draws a fully resolved frame on a surface (SVG now; Canvas, GPU and 3D later) and plays timelines; makes no decisions |
| S8 | **Assets** | Supporting | Manifest, provenance, the pipeline and offline export for non-procedural and exported images |
| S9 | **Integration** | Supporting | The three tiers through which exercises use the system: illustration, instrument, stimulus |
| S10 | **Tooling** | Supporting | The Visual Lab, the screenshot harness, the export script, the performance overlay |
| S11 | **Governance** | Supporting | Policies, the review procedure, versioning, the capability log |

### 3.2 The pipeline
```
                    exercise: scene id + state name (+ the previous state)      ── S9 Integration
                                        │
  ┌─────────────────────────────────────┼──────────────────────────────────────────────┐
  │                                     ▼                                              │
  │  S3 Composition   scene definition ─► scene graph: frame · layers · elements       │
  │       │              (ids, style refs, generator refs, label keys, alt keys)       │
  │       ▼                                                                            │
  │  S2 Generation    generator ref + params + seed ─► geometry (path data, points)    │
  │                                                                                    │
  │  S1 Styling       style refs + theme + scheme (light/dark/forced) ─► resolved      │
  │                   paint, line and material per element                             │
  │                                                                                    │
  │  S4 State         state name ─► property targets per element                       │
  │                   (visible, emphasis level, parameter values)                      │
  │                                                                                    │
  │  S5 Motion        previous targets → new targets + motion policy + tier ─►         │
  │                   timeline (which property, from, to, duration, easing)            │
  │                                     │                                              │
  └─────────────────────────────────────┼──────────────────────────────────────────────┘
                                        ▼
  S7 Rendering      resolved geometry + resolved style + property values + timeline ─► surface
```
The pipeline is assembled by one function per scene, outside every capability. It runs once when a scene or state changes, never per frame (the timeline is what runs per frame). Its result is a **resolved frame**: plain data that any backend can draw.

### 3.3 Boundaries
| Capability | Input | Output | Must not know about |
|---|---|---|---|
| S1 Styling | Style reference (role, line, material, emphasis level), theme, scheme | Concrete values (colour, width, dash, opacity, gradient stops) | Geometry, states, time, backends, exercises |
| S2 Generation | Generator id, numeric parameters, seed | Geometry (SVG path data strings, point arrays, numbers) | Colour, style, states, time, DOM, Angular, backends |
| S3 Composition | A scene definition (data) | A scene graph with element ids, style references and generator references | Colour values, durations, which backend draws it |
| S4 State | Scene graph ids, a state name | Per-element targets: `visible`, `emphasis` (`focal`, `normal` or `receded`), declared parameters | Time, colour values, geometry construction, backends |
| S5 Motion | Two sets of targets, the motion policy, the quality tier, motion tokens from S1 | A timeline: property, from, to, start, duration, easing | How geometry was made, colour values, backends |
| S7 Rendering | A resolved frame and a timeline | Pixels or DOM; lifecycle events | Exercises, states as names, why anything changed |

Each boundary carries an example of the independence it buys:
- **Emphasis is a level, not a colour.** S4 says an element is `receded`; S1 decides what `receded` looks like (`visual-language.md` §3.7). A new theme changes how emphasis looks without touching any state definition.
- **Motion animates properties, not drawings.** S5 never builds geometry. For a draw-on, it animates a reveal fraction from 0 to 1, and each backend implements that fraction in its own way (a mask in SVG, a clipped path in Canvas).
- **Rendering decides nothing.** Two backends given the same resolved frame produce the same composition. This is what the conformance suite checks (§6.2).
- **Generation is pure.** The same seed gives the same geometry in tests, a Web Worker, the browser, or Node for offline export.

### 3.4 Dependency rules (enforced by a spec in the test suite, from v0.1)
1. **S2 Generation imports nothing** from the project, Angular or the DOM.
2. **S1 Styling** is data plus a resolver. It imports only its own types.
3. **S3 Composition** imports type definitions only: S1's style-reference vocabulary and S2's generator ids. Its validator also reads S1's vocabulary lists and S2's parameter checks (revision 2), and nothing else.
4. **S4 State** imports S3 types. **S5 Motion** imports S3 and S4 (the scene's entrances and the state targets) and S1 motion tokens.
5. **S7 Rendering** imports the resolved-frame and timeline types, and **nothing imports a backend except S9 Integration.**
5a. **Stimuli** (`stimulus/`, M6): pure; they import S1 styling, S2 generation and the resolved-frame types only (no Angular, no DOM, no backend). The surface that runs them is in S9.
5b. **Instruments** (`instruments/`) are compositions built from data (M1, 2026-11-10): pure functions that import S3 composition, S1 styling and S2 generation only (no Angular, no rendering types); S2's layouts place their elements (M2 stage C). They go through the same pipeline as scenes; one figure in S9 (`integration/instruments.ts`) draws them all.
6. **Exercises import only S9:** a visual source, the slot, an instrument component. They never import a backend, a generator or a rendering library.
7. **`*-logic.ts` and `*-store.ts` import nothing from the Visual System.**
8. **Heavy libraries load lazily,** through dynamic `import()` or `@defer` inside the backend that uses them.

### 3.5 Example: one MCII state change through the pipeline
| Step | Capability | What happens |
|---|---|---|
| 1 | S9 | `sceneFor('mcii_obstacle', …)` (in `mcii-scenes.ts`, unchanged in kind) asks for `mcii.contrast`, previously `mcii.future` |
| 2 | S3 | Scene `mcii.path` v4 gives the frame and the elements `path`, `now`, `wish`, `wish-centre`, `wall`, `wall-courses`, `bridge`, plus four labels, each with its purpose |
| 3 | S2 | Not used: every element is hand-placed geometry |
| 4 | S1 | Theme `action`, scheme light: `wall` and `wish` take the role `subject` with the `tonal` material; `path` takes `context` |
| 5 | S4 | State `contrast`: `wall` becomes visible; `wish` drops from `focal` to `normal`, so the wish and the obstacle have equal weight |
| 6 | S5 | From `future` to `contrast`: one change, `wall` appears with the `rise` effect and the `deliberate` preset. Under reduced motion the timeline is empty and the final state is shown at once |
| 7 | S7 | The SVG backend draws the resolved frame and plays the timeline |
| 8 | S9 | The exercise records its visual source as `scene:mcii.path@4;theme:action@1` (§9) |

---

## 4. The Scene Specification, version 0 (type design)
The Scene Specification is how compositions are written: typed TypeScript data, with **no DSL, no runtime parser and no scenes delivered by the server.**
- **Separate sections:** each is read by exactly one capability (composition, state, motion), so they can change independently.
- **Small v0:** version 0 contains only what the first compositions are expected to need.
- **Grows by demand:** every later field is added through the pull rule (§5.2).

### 4.1 Shape
The code is in `web/src/app/shared/visual/composition/scene.ts`. It follows this sketch, with these refinements:
- **Purpose (revision 3):** every element has `purpose: { serves: PurposeKind[]; why: string }`. The kinds are `concept`, `understanding`, `interaction`, `feedback` and `identity` (`visual-policy.md` principle 6). A scene may also list `changes`, which says what it changes compared with the picture it replaces, for reviewers.
- **Generated elements and the seed (revision 3):** removed for now. No composition uses a generator, so they come back with the first one that does, under the pull rule.
- **Frame (revision 2):** a scene names only its ratio (`frame: 'banner'`); the size at design width comes from S1.
- **Roles:** scene roles are `ground`, `far`, `mid`, `near`, `subject`, `context` and `ink`. `subject-fill` is a token, not a scene role: a `subject` drawn with the `tonal` material takes it as its fill, and planes drawn `tonal` take their edge colour as their stroke.
- **Emphasis:** only `subject`, `context` and `ink` elements take emphasis; planes are already aerial, and labels keep their colour so they stay legible.

The sketch as reviewed:
```ts
// ── S3 Composition ───────────────────────────────────────────────────────────────
interface SceneDefinition {
  id: SceneId;                      // 'mcii.path'
  version: number;                  // bumped on any visible change; recorded in provenance
  theme: ThemeId;                   // a reference into S1, never colour values
  frame: Frame;
  seed?: string;                    // for generated elements
  layers: Layer[];                  // drawn in order
  states: StateModel;               // read only by S4
  motion?: MotionPlan;              // read only by S5; absent = state changes are instant
  alt: Record<StateName, ContentKey>;   // text alternative per state, from versioned content
}
interface Frame { width: number; height: number; ratio: FrameRatio }  // FrameRatio from S1 (visual-language §12)
type PlaneRole = 'backdrop' | 'far' | 'mid' | 'near' | 'subject' | 'annotation';
interface Layer { id: string; plane: PlaneRole; elements: Element[] }

interface StyleRef {                // semantic: says what the element IS, S1 says how it looks
  role: ColorRole;                  // 'ground' | 'far' | 'mid' | 'near' | 'subject' | 'subject-fill' | 'context' | 'ink'
  line?: LineWeight;                // 'hair' | 'fine' | 'regular' | 'strong' | 'bold'
  dash?: DashPattern;               // 'intended' | 'tentative'
  material?: MaterialId;            // 'line' | 'tonal' | 'lit' | 'translucent'
}
type Element =
  | { kind: 'shape'; id: ElementId; geometry: Geometry; style: StyleRef }              // literal geometry
  | { kind: 'generated'; id: ElementId; generator: GeneratorId; params: Params; style: StyleRef }
  | { kind: 'label'; id: ElementId; text: ContentKey; anchor: Point; align: 'start' | 'middle' | 'end' }
  | { kind: 'custom'; id: ElementId; renderer: CustomRendererId; params: Params; style: StyleRef }; // §6.3
  // DESIGNED, added by the pull rule: 'asset' (S8), 'group', 'region' (S6)

// ── S4 State ─────────────────────────────────────────────────────────────────────
interface StateModel { initial: StateName; states: Record<StateName, StateDef> }
interface StateDef {
  visible: ElementId[];
  emphasis?: Partial<Record<ElementId, 'focal' | 'receded'>>;   // default 'normal'
  // DESIGNED: params?: Partial<Record<ElementId, Params>> for instruments (v0.2)
}

// ── S5 Motion ────────────────────────────────────────────────────────────────────
interface MotionPlan { changes: MotionRule[] }
interface MotionRule {
  element: ElementId | '*';
  when: 'appears' | 'disappears' | 'emphasis';         // derived from the two state targets
  effect: 'fade' | 'rise' | 'draw' | 'recede';          // vocabulary from S1 (visual-language §10)
  preset: MotionPreset;                                 // 'quick' | 'moderate' | 'deliberate'
}
```

### 4.2 Why these choices
- **No coordinates or colours in the state and motion sections.** States name elements and levels; motion names effects and presets. That is what keeps S3, S4 and S5 independent.
- **Motion rules aren't written per transition.** They follow from what changed between the two states (an element appeared, disappeared, or changed emphasis). Any pair of states gets correct motion without listing every pair. This also guarantees the policy rule that only elements that changed may move (`visual-policy.md` §3.12).
- **Style references are semantic.** An element is a `subject` on the `near` plane, not "blue, 3 px". That keeps every composition inside the visual language, and a theme can change without editing scenes.
- **`frame.ratio` comes from a small fixed set,** so figures line up with each other across the platform.

### 4.3 Validation (a pure function, tested from v0.1)
The validator rejects:
- an element without a purpose, with an unknown purpose kind, or that no state shows (revision 3)
- duplicate or unknown element ids, in layers, states or motion rules
- a state without a text alternative, or a content key that doesn't exist
- an unknown generator, role, line weight, dash, material, effect or preset
- more than one `focal` element (or focal group) in a state, unless the scene policy allows it (`visual-policy.md` §3.2)
- a `custom` element without a registry entry (§6.3)
- any raw colour value anywhere in a scene

A scene's **policy assertions** (for example "the bridge is dashed in every state") are written as tests against the validated scene, next to it.

### 4.4 Identity and versioning
- **What identifies a shown visual:** `scene@version + state + theme@version + tier`, plus the seed once a scene uses generated elements. This is what is recorded (§9).
- **Scene version:** any visible change to a scene bumps its version, even when its id stays.
- **Theme version:** a theme change bumps the theme version, without touching scenes.

### 4.5 What the specification deliberately doesn't do
- **No layout engine, constraint solver, expressions or conditional logic.** If a composition needs computed placement, a generator computes it (S2).
- **No per-frame logic.** Continuous behaviour (a pacer, a particle field) is a timeline or a `custom` element.
- **No stimuli.** Stimuli have their own `StimulusSpec` with protocol timing (§7).

---

## 5. Restraint: how the first implementation stays small

### 5.1 Composition first
Every capability is built **from a composition, not ahead of one**:
0. **Start from what exists** (revision 3). When an exercise already has a picture, the revision begins as that picture. Each change must name its purpose (`visual-policy.md` principle 6), and the Lab shows the two side by side.
1. **Design** the composition as a static picture: a hand-placed SVG in the Lab, or a sketch.
2. **Review** it as a picture, before writing any system code for it (`visual-policy.md` §9, review R2).
3. **Express** the approved composition as a scene definition.
4. **Add generators** only where generation earns its place: seeded variation, reuse across scenes, or geometry that is easier to compute than to draw. A hand-placed shape stays a `shape` element.
5. **Add states and motion** only once the static states are approved.

### 5.2 Building capabilities, and the capability log
- **Revised 2026-11-10: two rules, kept apart.**
  - **Capabilities are infrastructure, built ahead of need.** The system is completed through milestones M1–M8 (§14). Each capability is built and tested in the Visual System and shown in the Visual Lab by reference compositions, in light, dark and forced colours, for review. A reference composition exists to show and test a capability; participants never see it.
  - **What an exercise shows is purpose-gated** (`visual-policy.md` principle 6): an exercise uses a capability only where every element it adds serves a named purpose.
  - Why: the pull rule below kept the infrastructure only as large as the exercises' immediate needs, and retired the generation layer. Your direction is a shared visual generation and interaction system for the whole application (2026-11-10).
- **The pull rule (2026-11-08 to 2026-11-10, superseded):** a field, element kind, generator, material or motion effect entered the system only when a composition under review needed it.
- **The capability log:** every addition gets one row in a log in `docs/visual-system.md` (§15), naming the composition that pulled it. A capability no composition has pulled doesn't exist in code, even if an interface for it is described here.
- **The rule of two** still applies to *utilities*. A helper written for one composition becomes shared when a second composition needs it. Because it's written against the shared interfaces from the start, sharing it is a move, not a rewrite.

### 5.3 v0.1 scope
| Capability | In v0.1 (NOW) | Interface only (DESIGNED) |
|---|---|---|
| S1 Styling | Neutral and area ramps, roles, line weights, dashes, the `line`, `tonal` and `solid` materials, emphasis resolution, motion tokens, forced-colours mapping, the five area themes (the palette under review R1, through the S1 sheet) | The `lit` and `translucent` materials, textures, light presets beyond the platform default: each one added when a scene pulls it |
| S2 Generation | Nothing (revision 3): `mcii.path@3` is hand-placed | Seeded random, noise, curves, ridges, blobs, arcs, layouts, distributions, flow fields, rhythm curves |
| S3 Composition | `SceneDefinition` with `shape` and `label` elements, each with a purpose; the validator | `generated`, `custom`, `asset`, `group` and `region` elements |
| S4 State | Visibility and emphasis | Parameter targets (v0.2) |
| S5 Motion | Built for MCII step 4c: entrances with `fade`, `rise` and `draw`; emphasis changes eased between paints; the motion budget; departures at once | `recede` as a cross-fade, departures with motion, value transitions, layout transitions, the scalar tween, View Transitions |
| S6 Interaction | — | Everything, when a composition first needs pointer input on a figure. CS2 doesn't: its sliders stay the controls (`cs2-visual-proposal.md` §5.4) |
| S7 Rendering | The SVG backend | Canvas, GPU, 3D, embedded runtimes |
| S8 Assets | Static images through the existing contract (already built) | The manifest, pipeline and export |
| S9 Integration | `SceneSpecSource` for illustrations; `facets.from`; provenance | Instruments (v0.2), stimuli (v0.4) |
| S10 Tooling | A Lab gallery: every scene × state × scheme × tier; the screenshot harness | Parameter controls, the instrument playground, the performance overlay, export |
| S11 Governance | This document, `visual-policy.md`, `visual-language.md`, the review log, the capability log | — |

**Size guard for v0.1 [J]:**
- the system code at most **15 kB gzipped**, in a lazy chunk
- each scene definition at most **6 kB**
- no new runtime packages

If the guard is exceeded, the cause is reviewed before anything is added.

### 5.4 What is not built in v0.1
- **Rendering and media:** Canvas, GPU, 3D, the embedded runtimes, textures and the asset manifest.
- **Instruments, stimuli and export.**
- **Motion beyond what MCII step 4c needs.**
- **Any interface that no reviewed composition has used.**

---

## 6. Extensibility without bespoke renderers
The system has to accept things nobody has planned yet: new generators, new materials, a GPU backend, a Rive animation, an artist's Blender asset. It must do so **without each exercise or each new technology growing its own private rendering path**, which would end the coherence the system exists for.

### 6.1 Extension points
| To add | How | Approval |
|---|---|---|
| A generator | A pure function in S2 with unit and determinism tests | The pull rule; the capability log |
| A material, line weight, dash or texture | A row in S1, resolved for light, dark and forced colours, with contrast checked | The pull rule; a visual-language review (R1) |
| A theme (a new area) | A theme file in S1, reviewed on the S1 sheet and then in the area's first real composition (revision 3: no stand-alone area studies) | Review R1 |
| An element kind | A union member in S3 plus support in **every** active backend, with conformance tests | The pull rule; this document updated |
| A motion effect | A vocabulary entry in S1, a timeline rule in S5, support in every active backend, and a reduced-motion equivalent | The pull rule; review R2 of a scene using it |
| A backend | An implementation of the backend contract (§6.2) that passes the conformance suite | Its trigger (§14); a separate approval |
| An embedded runtime (Rive, PixiJS, Three.js) | Only **inside** a backend or as a `custom` element (§6.4), never imported by an exercise | Its trigger; a licence note |
| A custom element | A registry entry (§6.3) | Review R2; reviewed again under the rule of two |

### 6.2 The backend contract and the conformance suite
Every backend implements the same contract:
- **Input:** a resolved frame and a timeline (§3.2). The backend never reads a scene definition, a theme, a state name or an exercise.
- **Colours:** it uses only resolved S1 values; it has no palette of its own.
- **States:** it has no state machine of its own.
- **Motion:** it plays the timeline it is given. It doesn't add motion, and with an empty timeline it shows the final state.
- **Quality tiers:** it supports `full`, `reduced` and `static`. If it can't run (no support, context lost, forced colours where it can't follow system colours), it hands over to the static tier.
- **Lifecycle:** it releases what it uses (animation frames, contexts, textures) when destroyed, and stays idle when nothing changes.
- **Provenance:** it reports its id for the recorded tier.

**Conformance suite (from v0.1, run for every backend):**
- every scene × state shows the right elements
- the text alternative is present
- reduced motion gives the final state with no running animations
- forced colours give system colours or the static tier
- destroying the backend leaves nothing running
- from the second backend on, the same scene in two backends gives the same elements in the same order, compared in the Lab side by side

A backend that fails the suite isn't used.

**Standing rule (M6):** every backend passes the full parity suite against SVG before it draws anything a person sees: shapes, small-element visibility, fill colours, text and timelines. A backend that fails isn't used.

**The parity suite (M6, `e2e/visual-parity.spec.ts`, cases on the Lab's parity page `/lab/parity`):**
- every scene state, every instrument answer set and every Lab reference, drawn by SVG and canvas at its design size on an opaque ground, captured by the browser at device pixel ratios 1, 1.5 and 2, in light and dark; a change of every kind captured at a quarter, half and three quarters of its time, both backends on the same hand-moved frame clock
- d = the largest difference in red, green or blue (0–255); a pixel differs when d is above the **fill threshold**, 3: measured rendering noise inside fills is 1, and the smallest gap between two distinct fill colours is 6 (Cognitive, light: the near plane and translucent over the ground), so the threshold is at most half of it; a test fills a swatch in the nearest other colour and must fail
- no differing pixel away from edges (an edge pixel's neighbourhood varies by more than 16 in either capture)
- at edges, **the neighbourhood rule** (chosen 2026-11-12): a differing pixel passes if each of its channels lies within the range of the other capture's 3 × 3 neighbourhood, give or take the fill threshold, checked both ways. Smoothing only blends the colours on either side of an edge, so it passes when both backends put the edge in the same place, within a device pixel; a shift of more than a pixel, a wrong colour, or a missing or extra part fails. Pixels outside the rule: at most 0.05% of all pixels on a still frame (worst measured 0.03%: thin lines crossing, painted a little darker by SVG) and 0.5% at a moment of a change (worst 0.38%: crossfades at ratio 1.5; a few pixels inside fading items count here too). A test moves one mark on the canvas by 2 px (must fail) and by half a pixel (must pass). The first allowance, 0.5% of all pixels as differing edge pixels, failed on smoothing alone (28 of 384 still comparisons, worst 2.75%) and didn't check where differences were
- text: each label's box within 1 device pixel, its ink (summed in luminance, as SVG text may be smoothed with colour fringes) within 5%; text regions are left out of the pixel criteria
- every label, mark smaller than 24 × 24 units and subject visibly drawn by both (ratio 1 and 2): it changes at least 30% of its own area in each, the two within 30% (+2 pixels) of each other; an item SVG itself shows less than 30% of is listed as covered by design
- forced colours: away from edges, both draw in system colours only

### 6.3 Custom elements (the escape hatch, kept small)
A `custom` element lets a composition contain drawing the system can't express yet, without leaving the system. It must:
- **be registered:** id, owner, reason, and the scenes that use it
- **take style references** like every element, using S1 values only
- **leave state to S4:** take visibility and emphasis from S4, with no hidden states of its own
- **follow S5 and the motion policy:** no motion of its own outside a timeline
- **provide a static rendering** for the static tier
- **stay inside its element:** it may not own layers, labels, text alternatives, other elements or the frame

A custom element can't become a whole scene, so a bespoke renderer can't come in disguised as one.

**Review:** when a second scene needs the same custom element, it is promoted to a generator or an element kind, or retired. A custom element older than two releases without promotion is reviewed.

### 6.4 Embedded runtimes
- **Where they live:** Rive, PixiJS, Three.js or GSAP/Motion come in only behind a backend, or as the implementation of a registered custom element.
- **What they must follow:** they take S1 values (Rive through data binding [F: rive.app data binding docs]), state from S4 and the motion policy, and must have a static tier.
- **What they can't do:** an exercise never knows which runtime draws its visual.

### 6.5 What isn't allowed
- **No private rendering by exercises.** After a scene is migrated, the exercise doesn't keep its own SVG or Canvas component for illustrations.
- **No private palettes or motion.** No backend or custom element has its own palette, state machine or motion.
- **No direct library imports.** An exercise never imports a rendering library or a backend.
- **No styling outside S1.** No raw colours, line widths or durations in scenes or backends.

**The one sanctioned separate lane is stimuli** (§7). It has its own contract because its timing rules differ, and it still takes colours from S1 and randomness from S2.

### 6.6 Existing visuals (legacy until migrated)
| Visual | Status | Migration |
|---|---|---|
| `MciiPathScene` (`mcii-path-scene.ts`) and its source `builtin.v1` | Removed | Replaced in MCII step 4d (2026-11-08) by scene `mcii.path`. Production keeps it until you merge |
| CS2 cause chart (`cs-why-it-happened.ts`) | Migrated (2026-11-08) | The instrument `cs2.cause-map@1` (v0.2); the inline chart is removed. Production keeps it until you merge |
| CS1 and CS3 | Audited 2026-11-08: no figure. CS1's fit board is an HTML control; CS3 has no visual element (`cs1-cs3-visual-audit.md`) | Nothing to migrate (decision A1, 2026-11-09) |
| `GamePreview`, `TrackingGame` | Migrated (2026-11-10) | `state-reset.tracking@2` (2026-11-12: the preview's labels wrap within the frame), drawn by the canvas backend (the game) and the SVG backend (the preview) |
| `ToneGame` | Outside scope | The sound version has no figure: a box with a "High tone" button |
| `icon.ts` | Outside scope | Unchanged |

---

## 7. Integration tiers (S9)
| | Tier 1 · Illustration | Tier 2 · Instrument | Tier 3 · Stimulus |
|---|---|---|---|
| Purpose | Supports understanding; never needed to complete a step | How the person answers, or sees their answers | An experimental manipulation or measurement |
| Exercise interface | `VisualRequest` through the existing contract (`shared/visual/visual.ts`) [F] | Typed domain inputs and events (for example `move({cause, axis, value})`), with native controls as the main path | A `StimulusSpec` in versioned content, plus outcome fields |
| Capabilities used | S1–S5, S7, S8 | S1–S7 | S1 colours, S2 random, a stimulus backend with its own frame clock |
| Can be absent | Yes (`none`, fallback tested) [F] | No: the native controls and the text equivalent are always there | No |
| Quality tiers | Full, reduced, static | Full, reduced, static (the controls never degrade) | Fixed by the protocol; if the device can't meet it, the task says so and doesn't run |
| Recorded | Provenance (§9) | Provenance | Spec version, seed, measured timing |
| Status | NOW | NOW (v0.2): `cs2.cause-map`, display only (no pointer input yet) | LANE BUILT (M6), Lab only: no task uses it, nothing is recorded with a session, and its timing is browser frame time until the photodiode check |

**Stimulus rules (unchanged from revision 3):**
- **Determinism:** pure `f(t, seed, params)`.
- **Timing:** a frame clock with a cap (the existing `MAX_FRAME_MS`) [F]; measured timing is recorded; timing is validated on our own setup before any measurement use [F: Bridges et al. 2020].
- **No silent degrading:** no decoration in or near the field.
- **Change control:** any change is a new spec version, plus a protocol amendment for experiments.
- **Scientific repeatability wins** over visual richness whenever they conflict.

## 8. Quality tiers, the motion policy and fallback
| Tier | When | Effect |
|---|---|---|
| Full | Default | Everything the scene defines |
| Reduced | `prefers-reduced-motion`, or the performance watchdog (M6: a figure's own motion below 50 fps over a second of motion, for the rest of the page view) | Empty timelines (final states at once); no parallax or particles; GPU passes replaced by S1 materials |
| Static | No backend support, a lost context, forced colours where the backend can't follow system colours, print | The final state as static SVG, or an exported asset |

**The motion policy:**
- **When motion happens:** only on a state change (an explicit pacer excepted), and only for elements that changed.
- **What moves (as built):** an element that appears enters with the effect its scene names (`enter`; default `fade`), and the elements that belong to it (`enter.with`) move with it. An element that stays but changes emphasis eases between its two paints. An element that goes away goes at once: in MCII the page changes at the same moment, and no departure needs motion to be understood. A scene that needs one pulls it.
- **Reviewed changes:** a scene lists the state changes its exercise makes (`transitions`). Each is checked against the budget and replayed in the Lab.
- **Limits:** at most three elements per change; durations from S1 tokens; never during typing; never in reaction to a choice in progress.
- **Reduced motion is explicit.** Meaningful motion switches to a different representation and never relies on the global rule in `styles.css` (which shortens every CSS animation to 0.01 ms) [F]. Illustrations take the empty timeline.

**Fallback:** a missing, failing or slow source falls back to `none` (already built and tested) [F]. A backend that can't run falls back to the static tier. The exercise never knows which happened.

## 9. Provenance and recording
- **Illustrations** in development exercises record what was drawn in the `visual_source` already recorded with MCII step 1 [F: `mcii-logic.ts`]: `scene:<scene>@<version>;theme:<theme>@<version>`, for example `scene:mcii.path@4;theme:action@1`. One string, so the stored data keeps its shape. The quality tier isn't recorded: the states look the same in every tier, and only motion differs. **Try it keeps it** (M1, 2026-11-09): `visual_source` is one of the three step metadata keys a Try it record may carry, so provenance survives where answers don't.
- **Instruments** (v0.2) will record the same, plus what they need.
- **Stimuli** record their spec version, seed and measured timing.
- **No typed text** reaches a visual request or a provenance record. Requests stay closed-vocabulary.
- **Experiment exercises record nothing new.**

---

## 10. Acceptance: automated tests *and* human review
A release, scene or integration is accepted only when **both** hold:
1. **Automated checks pass:**
   - unit, determinism, validator, policy and conformance tests
   - golden tests unchanged
   - e2e with axe in light, dark, reduced motion and forced colours
   - Lab screenshots match their approved baselines
   - budgets met
2. **Human review accepts it,** against the criteria in `visual-policy.md` §3–§5, recorded in the review log (`docs/visual-reviews.md`, created with the first review).

Automated checks prove technical correctness, consistency and accessibility. **They can't establish visual quality, conceptual clarity or scientific appropriateness. Those are judged by people, and a green build with no accepted review isn't accepted.**

| Review | What is reviewed | Where | Reviewers | Gate for |
|---|---|---|---|---|
| **R1 Language** | The S1 sheet; each theme in its first real composition | The review sheet; the Lab | You | Phase 2 (this proposal); v0.1 themes; every new theme or material |
| **R2 Composition** | Each scene: every state, light, dark, forced colours, reduced motion, each tier; each transition replayed | The Lab | You | Integrating the scene on the development branch |
| **R3 In context** | The integrated exercise from start to end, at 1280 and 2560 px, 100% and 150% scaling | The test environment | You; for exercise scenes, also the psychology-trained reviewer (psychological suitability, with a veto) | Your merge to production |
| **R4 Usability** | Participants' understanding and experience | `usability-procedure.md` sessions | Participants, with the questions in `visual-policy.md` §9.5 | The exercise's existing usability gate |

**How reviews fit the workflow (2026-11-08):** reviews gate the merge to production, not anything in the software. Work is integrated normally on the development branch and reviewed in the test environment; you merge and deploy once the reviews it needs are complete. Production stays unchanged until then. There are no feature flags, approval switches or activation controls for visuals: a reviewer approves, and the merge carries the change.

**Screenshot baselines are updated only with an accepted review entry** that names them, so automated checks can never quietly accept a visual change. Each figure is captured on its own fixed 480-px surface, so a change to the Lab's layout doesn't move a pixel of it.

## 11. Automated testing
| Level | What |
|---|---|
| S2 | Pure unit tests; the same seed gives the same output (snapshot strings) |
| S1 | Every role resolves in light, dark and forced colours; contrast pairs meet their minimum (`visual-language.md` §3.5); no theme uses a raw colour outside its ramp |
| S3 | Validator tests (§4.3); every scene in the registry validates |
| S4, S5 | State targets per state; motion rules give only the changed elements; an empty timeline under reduced motion |
| Policies | Per-scene policy assertions (`visual-policy.md` §8) |
| S7 | The conformance suite (§6.2) |
| Integration | `*-scenes.ts` mapping per stage, including `from`; the exercise behaves the same with no visual, a failing one or a slow one (the existing slot tests) [F] |
| e2e | Keyboard-only paths; axe WCAG 2.2 AA in light, dark, reduced motion and forced colours (Playwright media emulation [A]) |
| Lab | Screenshot harness: every scene × state × scheme × tier; Chromium; Windows baselines; thresholds |
| Guards | Golden tests unchanged; the dependency-rule spec (§3.4) |

## 12. Desktop, performance and accessibility (normative summary)
- **Desktop range** (plan decision D9, still to be confirmed [A]):
  - 1280–2560 CSS px wide
  - Windows scaling 100–200%
  - 60–240 Hz
  - integrated and discrete GPUs
  - current Edge, Chrome and Firefox
- **No phone or tablet layouts or interactions.**
- **Resolution:** SVG scales with `viewBox`; lines keep their weight across sizes (`visual-language.md` §4). Canvas and GPU size their backing store as CSS size × device pixel ratio, and resize when it changes (a window moved to another monitor).
- **Timing and power:** animation is time-based, never frame-counted; nothing runs when nothing changes; animation pauses when the page is hidden.
- **Zoom:** usable at 400% browser zoom (WCAG 1.4.10).
- **Budgets [J]:**
  - our code's work per frame within half the display's frame interval (8.3 ms at 60 Hz, 4.2 ms at 120 Hz, 3.5 ms at 144 Hz): a diagnostic, shown in the Lab's performance overlay, never changing what a person sees; motion drops to the reduced tier only when a figure's own frame rate stays below 50 fps over a second of its motion (M6, replacing a fixed 8 ms budget, which was too loose at 144 Hz and couldn't see the browser's own painting of SVG)
  - at most one WebGL context per composition and two per page
  - initial bundle under the existing 500 kB warning [F: `angular.json`]
- **Accessibility:**
  - WCAG 2.2 AA, plus 2.3.3 adopted
  - text alternative per state
  - no colour-only meaning
  - 3:1 contrast for graphics, 4.5:1 for labels
  - forced colours mapped (`visual-language.md` §3.6)
  - single-pointer alternatives for any drag (WCAG 2.5.7)
  - 24 px targets
  - visuals never take or move focus on their own; a figure that is itself the control (M4) has one focus stop per value, in reading order (a slider per axis of a handle, one radio group per choice), with a visible focus ring; otherwise native controls beside it hold the same values
  - anything moving for more than 5 s can be paused
  - motion that follows a person's own input is quick (150 ms): a dragged handle is never more than one such glide behind the pointer (M5)

## 13. Directory layout (target; folders appear only when the pull rule fills them)
```
web/src/app/shared/visual/
  visual.ts, visual-slot.ts          existing contract (extended: provenance, facets.from, size)
  styling/      tokens.css · themes/<area>.ts · roles.ts · resolve.ts          S1
  generation/   random.ts · curve.ts · ridge.ts · …                             S2 (pure)
  composition/  scene.ts (types) · validate.ts                                  S3
  state/        resolve-state.ts                                                S4
  motion/       policy.ts · plan.ts · tokens.ts                                 S5
  interaction/  scales.ts · regions.ts · bindings.ts                            S6 (v0.2)
  rendering/    frame.ts (resolved-frame types) · conformance.spec.ts · svg/    S7 (canvas/, gpu/ later)
  integration/  scene-source.ts · scene-figure.ts · <instrument>.ts (+ -slot.ts) S9
  instruments/  <instrument>/<instrument>.ts + .policy.spec.ts (pure frames)    instruments (v0.2)
  scenes/       <area>/<scene>.scene.ts + <scene>.policy.spec.ts                compositions
  testing/      source-files.ts (reads project files in specs)                  tests only
web/src/app/pages/lab/                Visual Lab (development build only)        S10
docs/visual-system.md · visual-policy.md · visual-language.md · visual-reviews.md
```

## 14. Release plan and technology triggers
| Release | Contents | Validated by | Human review |
|---|---|---|---|
| **Phase 2 (this)** | These three documents; the S1 review sheet | — | R1 of the S1 proposal |
| **v0.1** | §5.3 scope | MCII 4a–4d (revision 3: the area studies were removed) | R1 on the S1 sheet; R2 each MCII state next to the original, then the transitions (done); R3 MCII and the psychology-trained reviewer, in the test environment, before your merge |
| **v0.2** (revised 2026-11-08 by the pull rule, decision C5) | The instrument tier: frames built from an exercise's data, an instrument component and its on-demand slot, instruments in the Lab; bold text items. Not S6, S4 parameter targets or value transitions: CS2 doesn't need them | CS2 (`cs2.cause-map@1`) | R2 in the Lab; R3 and the psychology-trained reviewer in the test environment; CS2 usability |
| **v0.3–v0.7** (superseded 2026-11-10) | Replaced by milestones M1–M8 below, with nothing dropped: v0.3's layout generators go into M2, v0.4's canvas backend and stimulus lane into M6, v0.5's GPU trigger into M6, v0.6's assets and export and v0.7's AI stage A into M7 | — | — |

**Milestones to completion (2026-11-10).** Each delivers a capability, tested in the Visual System, with Lab reference compositions for review; exercise integrations follow only where they serve a purpose. From M2 on, each starts with a short scope note before code.

| # | Milestone | Delivers | Why in this order |
|---|---|---|---|
| **M1** | One composition pipeline | Data-driven compositions in S3: built from data, then through S4 state, S5 motion and S1 styling like a scene. The instruments move onto it; one figure component and one slot for scenes and instruments | Every later capability plugs in once, not twice |
| **M2** | Generation (S2) | Seeded, deterministic, pure generators (curves and paths, organic forms, ridges, noise fields, point distributions, layouts: grid, radial, flow, packing), generator references in the scene spec, validator rules; stable across runs and safe for a Web Worker | The core of non-AI visual generation |
| **M3** | Styling depth (S1) | `lit` and `translucent` materials, gradients, patterns and textures from generators, depth planes (including drawing only a plane's top edge, so a generated ground isn't outlined on every side), typography in figures; R1 of the full sheet | Sophistication from materials and light on generated forms |
| **M4** | Interaction (S6) | Scales, regions, pointer, keyboard and single-pointer bindings, accessible drag, input mapped to domain values; native controls stay the main path | A generation **and interaction** system |
| **M5** | Motion completion (S5) | Value and parameter transitions, departures, layout transitions, motion for interactive figures, one timing core for both backends | Data-driven and interactive figures need motion that follows values |
| **M6** | Rendering parity and the stimulus lane (S7, S9) | Canvas timelines, the conformance suite on SVG and canvas, frame clock, timing log, watchdog, performance overlay; GPU stays a trigger | Measurement tasks need validated timing |
| **M7** | Assets and export (S8) | Manifest and provenance, offline export of any composition (PNG, SVG), the optional AI adapter behind the same asset interface, off by default | AI stays optional: an adapter, never a dependency |
| **M8** | Catalog and authoring guide (S10, S11) | The Lab as a catalog of every capability; "Giving a new exercise its visuals"; a generic baseline harness | The system becomes the default foundation for future exercises |

**Done:** M1–M8 built, tested and reviewed in the Lab, the authoring guide in place, and every exercise figure drawn through the one pipeline.

**Technology triggers (each its own approval, with a licence note and a lazy entry point).** Checked against measurements on 2026-11-12 (M6 stage C, this machine: Intel HD 530, 59.88 Hz): none is met. Every Lab figure and every parity change moved at 60 fps with no missed refreshes; our work per frame was at most 0.5 ms for SVG and 2.4 ms for canvas (budget 8.3 ms); the most animated objects in one change is about 20; no composition needs an effect SVG and canvas can't draw; one sequence per change, played by the Web Animations API and the timing core.

| Technology | Adopt when |
|---|---|
| WebGL2 | An approved composition needs effects SVG and Canvas can't render at quality or speed |
| Three.js | A method depends on depth, perspective or spatial navigation, or a Blender 3D asset is needed |
| PixiJS | More than about 500 animated objects, or measured Canvas frame misses on reference hardware |
| Rive | A motion designer authors assets that code can't reasonably produce |
| GSAP or Motion | Three or more choreographed, interruptible sequences in one composition become hard to maintain with the Web Animations API (Motion first; GSAP's licence is proprietary [F: gsap.com standard licence]) |

## 15. Capability log
One row per capability added to code, naming the composition that pulled it.

| Date | Capability | Subsystem | Pulled by (scene@version) | Review |
|---|---|---|---|---|
| 2026-11-07 | Tokens (`tokens.css`): neutral ramp, five area ramps, roles for light and dark, forced-colours mapping, pinned schemes for the Lab; resolver for roles, line weights, dashes, `line` and `tonal`, emphasis | S1 | `mcii.path@1` (the themes: the S1 sheet) | R1 pending |
| 2026-11-07 | Motion tokens (data only; nothing plays them yet) | S1 | v0.1 scope (§5.3) | R1 pending |
| 2026-11-07 | `SceneDefinition` v0 with `shape` and `label` elements; the validator (§4.3), including the near-plane contrast rule | S3 | `mcii.path@1` | — |
| 2026-11-07 | Visibility and emphasis targets | S4 | `mcii.path@1` (set aside recedes; the wish is focal at the future step) | Entry 1 |
| 2026-11-07 | SVG backend (every drawable drawn as one path type; non-scaling strokes) and the conformance suite | S7 | `mcii.path@1` | — |
| 2026-11-07 | Pipeline, `contentText`, scene figure | S9 | `mcii.path@1` | — |
| 2026-11-07 | Visual Lab (every scene × state, light and dark pinned); browser test with axe in light, dark and forced colours | S10 | v0.1 scope (§5.3) | — |
| 2026-11-08 | `purpose` on every element; validator rules for purposes and never-shown elements; the purpose table in the Lab | S3, S10 | Your review of `mcii.path@1` (`visual-policy.md` principle 6) | — |
| 2026-11-08 | `solid` material (dots and small marks in the line colour) | S1 | `mcii.path@2` (the wish's centre) | Entry 1 |
| 2026-11-08 | Receded `context` lines keep their colour and recede by weight only, so they never get darker | S1 | `mcii.path@2` (set aside) | Entry 1 |
| 2026-11-08 | Scene policy: hope-bearing elements keep their colour in every state (asserted in the scene's policy spec; no new code) | S3 | Your review of `mcii.path@2` (the wish turned grey when set aside; `visual-policy.md` §3.9) | — |
| 2026-11-08 | The Lab compares a revision with the picture it replaces, drawn by the exercise's own source (`builtin.v1`); removed with that picture in step 4d | S10 | `mcii.path@2` | — |
| 2026-11-08 | Screenshot baselines: every state of an accepted composition in light, dark and forced colours (12 for `mcii.path`) | S10 | `mcii.path@3` (`visual-reviews.md`, entry 1) | Accepted |
| 2026-11-08 | Effect presets (`fade`, `rise`, `draw`) and the emphasis-change preset, as data next to the motion tokens | S1 | `mcii.path@4` (the wall rises, the bridge draws, emphasis eases) | Entry 2 |
| 2026-11-08 | `enter` on elements (an effect with a reason, or `with` a lead) and `transitions` on scenes; validator rules: a reason for motion, known effects, only line shapes draw, no chains, no entrance on an element shown in every state | S3 | `mcii.path@4` | Entry 2 |
| 2026-11-08 | `planMotion` (timeline of opacity, offset, reveal and emphasis tracks), `movers` (the reviewable summary), `motionProblems` (the budget per transition); empty timelines on first appearance and below the full tier | S5 | `mcii.path@4` | Entry 2 |
| 2026-11-08 | The SVG backend plays a timeline with the Web Animations API (no timers), reveals through a mask so dashes don't crawl, cancels on change and destroy, and shows the final state where the API is missing; conformance tests for motion | S7 | `mcii.path@4` (the bridge) | — |
| 2026-11-08 | `buildTimeline` (emphasis tracks resolved to paint); the scene figure plays the change from the previous state, takes `from` for a figure created by a step change, and follows the reduced-motion setting | S9 | `mcii.path@4` | — |
| 2026-11-08 | `SceneSpecSource` and `provideSceneVisuals`: an exercise's requests (`<prefix>.<state>`, `facets.from`) answered with a registered scene; the scene and the renderer load on the first request, in their own chunk; its id (`scene:<id>@<v>;theme:<theme>@<v>`) is the recorded visual source | S9 | MCII step 4d | R3 pending |
| 2026-11-08 | Baselines captured on a fixed 480-px surface, independent of the Lab's layout; the Lab no longer shows the original picture, which is removed | S10 | MCII step 4d | Entry 2 |
| 2026-11-08 | Instrument tier: `instruments/cause-map/` (a pure frame from the exercise's answers: one mark per place listing its causes' numbers, the cause being placed as subject and focal with a bold number, solid scale lines, labels laid out inside the figure), its policy spec, the `CauseMap` component and `CauseMapSlot` (loads it on demand) in S9 | S3, S9 | `cs2.cause-map@1` (decisions C2–C5) | Entry 3 (R2 accepted); R3 pending |
| 2026-11-09 | Screenshot baselines for instruments: every answer set in the Lab in light, dark and forced colours (15 for `cs2.cause-map`), on the same fixed surface as the scenes | S10 | `cs2.cause-map@1` (`visual-reviews.md`, entry 3) | Accepted |
| 2026-11-08 | Bold text items (`weight: 'bold'`) in the resolved frame, drawn by the SVG backend; a conformance test | S7 | `cs2.cause-map@1` (the number of the cause being placed) | — |
| 2026-11-08 | Dependency rules 4c and 5 refined: instruments import composition types, S1 and the resolved-frame types only; only S9 imports a backend | Rules | `cs2.cause-map@1` | — |
| 2026-11-10 | The dot game's ring: heavier as well as coloured while the pointer is inside it, and system colours in high contrast (in the game's own canvas code; the game isn't on the Visual System yet) | — | `state-reset` (development stage) | Pending your look |
| 2026-11-10 | Second instrument, `state-reset.rounds@1`: one mark per round above the dot game (done filled, current in the Action colour and heavier, coming thin), still during a round; its policy spec. One `InstrumentSlot` (S9) now loads any instrument on demand and replaces the cause map's own slot | S3, S9 | `state-reset.rounds@1` | Pending your look |
| 2026-11-10 | The dot game on the Visual System: instrument `state-reset.tracking@1` (ring, dot and marker, and the labelled preview from the same parts; its policy spec), the **canvas backend** (S7: paints a resolved frame each animation frame, reading S1 token colours inside its own token scope, so light, dark and high contrast follow the page), and the game's surface and preview in S9. The game keeps its timing, scoring and input. Pulled ahead of v0.4: no stimulus lane, frame clock or timing log yet, which a measurement task still needs | S7, S9 | `state-reset.tracking@1` | Pending your look |
| 2026-11-10 | The Lab shows `state-reset.rounds` (first, middle and last round) and `state-reset.tracking` (the game as still canvas frames, outside and inside the ring, and the preview), light and dark, with their purpose tables; a browser test checks that the canvas stills paint | S10 | `state-reset.rounds@1`, `state-reset.tracking@1` | For your R2 |
| 2026-11-10 | **M1, one composition pipeline:** compositions built from data (`composeScene`: one state, an explicit size, words by key); S1 `width` for a line that must read while moving; bold labels in scenes; `buildComposedFrame`. The cause map, the rounds and the dot game (game and preview) are compositions now, each validated by `validateScene` in its policy spec; one instrument registry and figure (`integration/instruments.ts`) replaces the per-instrument components; rule 5b tightened (instruments import composition and S1 only). Drawn output unchanged: the 15 CS2 baselines pass pixel for pixel | S1, S3, S9 | M1 | For your look |
| 2026-11-10 | **M2 stage A, generation core:** `generation/` (seeded random, curves, noise, forms, registry with parameter checks); the `generated` element and the scene seed in S3, with validator rules (unknown generator, parameters, a missing seed, filling an open line); the pipeline draws generated elements (kept per seed), and they take emphasis and draw on like lines; the Lab's Generators section (reference compositions in light and dark, a new-seed button, parameter tables) | S2, S3, S9, S10 | M2 | For your look |
| 2026-11-11 | **M2 stage B, fields:** 2D gradient noise (seeded per lattice point, quintic fade, each octave turned, within the §8 octave limits); `field.flow` (streamlines through a direction field, kept at least `spacing` apart and inside their area) and `field.contours` (heights crossing evenly spaced levels, traced by marching squares with saddles resolved, joined into smooth lines); tests for range, smoothness, spacing and that every contour point lies on its level; both in the Lab's Generators section. Value noise was tried first and dropped: its hills lined up with the grid | S2, S10 | M2 | For your look |
| 2026-11-11 | **M2 stage C, distributions and layouts:** Poisson-disc points (Bridson: no two closer than the spacing, no wide gaps, optionally inside an ellipse) and the jittered grid, drawn by `dots.scatter` and `dots.grid`; layouts for compositions built from data (`gridLayout`, `radialLayout`, `flowLayout`, `packCircles`: in bounds, in order, never overlapping); rule 5b: instruments may use S2; the Lab's Layouts part. **M2 complete** | S2, S10 | M2 | For your look |
| 2026-11-11 | **M3 stage A, light and materials:** `lit` (the subject's fill shaded from the upper left: lit step, base, shaded step), `translucent` and `overlap` (the shared part drawn as its own shape, `curve.lens`), `shadow` (a soft radial fade under an object); tokens for light and dark, each flattened to system colours in forced colours; gradient paint in the resolved frame (with the shape's box from the pipeline); both backends draw gradients and ellipses; `pathBounds`; validator rules (lit is the subject's; filling materials need closed forms; a shadow is an ellipse naming the object it grounds, drawn first; translucent forms that overlap need their overlap, drawn after them); contrast of the subject line on its lit and shaded fills in every theme; the Lab's Materials and light section. The component style budget warning was raised from 4 to 6 kB for the token file | S1, S2, S3, S7, S9, S10 | M3 | For your look |
| 2026-11-11 | **M3 stage B, depth and grain:** `edge: 'top'` draws a tonal plane (far, mid, near) filled without an outline and only its top silhouette (a rect's top side, or a generator's `edge`, e.g. `form.band`'s ridge), in the plane edge colour; `grain` lays the platform's one grain tile (fine seeded dots, 5%, the `grain` token, Canvas in forced colours) over the ground and planes, drawn by both backends as a repeating pattern; validator rules (the top edge for tonal planes with an edge, grain for the ground and planes over a fill); the Lab's depth references (planes in depth with a lit subject and its shadow, with and without grain) | S1, S2, S7, S9, S10 | M3 | For your look |
| 2026-11-11 | **M3 stage C, type in figures and the review sheet:** labels wrap within a `width` at spaces, lines 1.2 apart, measured with the platform face's advance widths (Segoe UI, measured in Edge, with an 8% margin for wider system faces) so every backend and the validator see the same lines; a `halo` in the ground colour (the text's own stroke behind its fill, in both backends); labels say which forms they `names`; `spacingWarnings` lists labels closer than 8 units to a form they don't name (planes count by their lines, a halo may cross a plane's edge, forms hidden under an opaque form that holds the label don't count), shown in the Lab as warnings; `flattenPath` (every SVG command); the existing figures' labels name their forms (no visible change); the Lab's review sheet: the neutral and five area ranges and every role per area, read from the tokens, light and dark; line weights and dashes; materials and depth in each area; type | S1, S2, S3, S7, S9, S10 | M3 | For your review (R1) |
| 2026-11-12 | `state-reset.tracking@2`: the preview's labels wrap within the frame, 8 units clear of its edge, so "the ring: keep your pointer inside it" takes two lines instead of ending 3 units from the frame (found by the M3 spacing check); the dot game itself is unchanged. The golden screen texts were re-pinned for it (the figure's words now come as two lines) | S3, S9 | M3 | For your look |
| 2026-11-12 | **M4 stage A, scales and targets:** `interaction/` (new, pure; dependency rule 4d): `scales.ts` (`positionOf`, `valueAt`, `stepFrom`, `endsOf`) and `regions.ts` (`targetsOf`, `hitTest`, `placeAt`, `toScenePoint`); `scales` and element `target`s in the scene spec; `composition/outline.ts` (outlines and point geometry, shared with the spacing check); `MIN_TARGET` (24) in S1; validator rules for scales and targets; the Lab's Interaction section: a rating scale, a field with two axes and a choice of three, with their targets drawn over them and, under the pointer, the target and the value a click would set | S1, S3, S6, S10 | M4 | For your look |
| 2026-11-12 | **M4 stage B, moving a figure:** `interaction/controller.ts` (pure): drag a handle from where it was grabbed, snapped as it moves, Escape puts the value back; a press on a track places the handle there and the drag goes on; a click picks a handle up and the next click puts it down there (WCAG 2.5.7), Escape or a click elsewhere puts it down unchanged; keyboard steps for a figure that is itself the control (arrows, Page Up and Down, Home and End; each axis of a two-axis handle takes the arrows of its own direction). `InteractiveFigure` (S9): the exercise's values in, changes out as values, never positions; the exercise draws the figure again from them; pointer capture; the moving handle focal; one slider per axis when the figure is the control, a picture when a native control holds the value; a cursor on hover. `LiveInput` on `buildFrame` (emphasis and the focus ring, drawn last); the `focus` token (the page's accent, `Highlight` in forced colours, 3:1 on the ground and planes) and `FOCUS_RING` in S1; axis `label`s in the scene spec. The Lab's rating and field are live, one value per reference across its light and dark panels | S1, S3, S6, S9, S10 | M4 | For your look |
| 2026-11-12 | **M4 stage C, choices and native controls:** a press on a region chooses it; regions that set one value are a choice with its words (`choices` in the scene spec, a validator rule), a radio group when the figure is the control (one stop, the arrows move and choose, wrapping round; the focus ring around the option); `controlsOf` (pure) describes the controls a figure stands for, so the figure's own stops and native controls beside it say the same thing; the Lab's choice of three is live, and a switch puts native controls (range inputs and a radio group, made from `controlsOf`) beside every reference while the figures take the pointer only; browser tests for choosing by click and keyboard, native controls, axe with native controls, and the focus ring and a moving handle in the system highlight colour under forced colours. **M4 complete** | S3, S6, S9, S10 | M4 | For your look |
| 2026-11-12 | **M5 stage A, motion between values:** `moves` (with a reason) in the scene spec and the validator (only in figures built from data; an entrance there plays when the element is new); `changeMovers` and `planChange` in S5: what changed and `moves` glides as one movement, a reflow of up to 12 forms (`MOTION.maxReflow`, timing `MOVE_CHANGE`: 300 ms, `move`), labels that name a moving form move with it, new elements enter with their effect, everything else changes at once; `buildChangeTimeline` in S9 resolves them into `shape`, `paint` and `translate` tracks; the timing core (`rendering/timing.ts`: CSS cubic Béziers solved as browsers do, progress per track) and shape tweening (`rendering/tween.ts`: same-type drawings and same-command paths morph, anything else crossfades); the SVG backend draws shape glides frame by frame on an injectable frame clock (`FRAME_CLOCK`), only while one plays, crossfades through a fading copy, and picks a glide up from where it is when a new change arrives; the scene figure plays a change when the same figure is drawn again from new data. The instruments declare no motion, so the exercises are unchanged. The Lab's Motion section: bars whose values change and a set that reflows, light and dark, with what moved and why | S3, S5, S7, S9, S10 | M5 | For your look |
| 2026-11-12 | **M5 stage B, departures and motion for figures people move:** `exit` in the scene spec (`fade` or `undraw`, with a reason, or `with` a lead) and the validator (known effect, only lines undrawn, a reason, no unknown leads, never on an element shown in every state of a scene); `EXIT_EFFECTS` and `INPUT_CHANGE` in S1; S5 plans departures in state changes and data changes, on the same stagger as entrances; S9 gives each departing item as it was drawn and the item it sat under; the SVG backend draws it there and fades it or takes it back through a mask, then removes it, leaving nothing behind when a change is cut short. The interactive figure plays each change that follows input as a 150 ms glide (`moves` elements and their focus ring; nothing else), carried on from where it is, and at once under reduced motion. Visual policy §3.12: the narrow exception for motion that follows a person's own input. The Lab: the M4 references glide; a set member that leaves fades; a route whose legs are drawn and taken back | S1, S3, S5, S7, S9, S10 | M5 | For your look |
| 2026-11-12 | **M5 stage C, conformance and checks:** `changeProblems` in S5 (at most three movements in a change of data, a reflow counting as one; a reflow too large to glide is reported), shown in the Lab under each change and tested for every change the Lab references can make; browser checks that every Web Animations track (opacity, translations, a mask's dash offset, line widths) is where the timing core says at a quarter, half and three quarters of its time (shown to fail when compared with plain linear timing instead), that every change of data ends on the same picture as with reduced motion, that nothing in any figure changes over a second of quiet, that a change cut short carries on from where it was and leaves nothing behind, and that the budget holds. **M5 complete** | S5, S10 | M5 | For your look |
| 2026-11-12 | **M6 stage A, canvas timelines and rendering parity:** `rendering/playback.ts` (pure: every track of a timeline at a moment, as SVG plays it, with crossfade copies and departing items in place; the carry-on rule, now shared by both backends); the canvas figure (`app-vis-canvas-figure`: sizes its canvas to CSS size × device pixel ratio, again on resize or a ratio change, keeps lines at their CSS width, paints faded and drawn-in-part items on a layer as SVG's group opacity and reveal mask do, and runs a frame loop only while a change plays, on the frame clock); `integration/frame-figure.ts` (a frame drawn by the backend named); colours resolved per surface and eased in premultiplied sRGB; the Lab's parity page (`/lab/parity`) and the parity suite (§6.2). The suite found three canvas bugs, fixed: the lit gradient ran at right angles to the gradient instead of in the shape's box units; the grain tile was drawn at 1 device pixel per unit and scaled up; a fill appearing from "none" blended in instead of switching at halfway as SVG does. The dot game's drawing is unchanged (`paintFrame` takes the same path for still frames). The edge allowance is the neighbourhood rule (your choice, after the first allowance, 0.5% of all pixels, failed on smoothing alone), with a test that a mark moved by 2 px fails | S7, S9, S10 | M6 | For your look |
| 2026-11-12 | **M6 stage B, the stimulus lane:** `stimulus/` (pure; rule 5a): the stimulus spec (a picture drawn from its slot, time, seed and parameters; events in `frames`, needing the spec's design rate and tolerance, default 0.5 Hz, or in `ms`; a validator); the frame clock (`SlotCounter`: each gap between frames rounded to whole slots on its own, so nothing drifts, exact over 10 minutes at 59.94 Hz from a 60 Hz estimate; a gap near halfway marked uncertain; over 100 ms ends a run); the check before a run (2 s; stable = 95% of intervals within ±10% of the median, both seconds' medians within 1%, no gap over 100 ms; stable and matching runs both units, stable and different runs time-based events only, unstable refuses all, each with the reason); runs and the timing log (requested, estimated slots, produced frames, and physical presentation never claimed; times labelled browser frame time; nearest slot at each edge; verdicts *as specified*, *late onset*, *too long*, *unstable*, *interrupted*, *refused*; no compensation); the stimulus surface in S9 (the canvas backend's painting, the frame clock; refused or interrupted when the page is hidden or loses focus); the Lab's reference stimulus (four events, two in frames, two in ms, at seeded places; the design rate chosen in the Lab). **On this machine** (a laptop, Intel HD 530 and GTX 950M, two displays): Windows reports 60 Hz with minimum and maximum both 60, so no dynamic refresh rate; the check measures 59.88 Hz, every interval within ±10%, on either display, stable every time; every event as specified, time-based edges +2 to +6 ms (within half a frame); designed for 144 Hz, frame-based events are refused with the reason. Two things learned and built in: after a frame where the page is busy for 25 ms, the browser still stamps the next frame one slot later, but its code starts about 9 ms late, so a frame whose code starts more than half a slot late is marked uncertain; a window minimized under test automation kept producing steady frames and reporting focus, so losing focus or visibility is watched directly, and losing it refuses a check or interrupts a run. Not verified: a real background tab or minimized window (test automation keeps pages focused and visible, so the browser tests send the events themselves); to try by hand, switch tabs during a check or a run | S7, S9, S10 | M6 | For your look |
| 2026-11-12 | **M6 stage C, watchdog and performance overlay:** `rendering/frame-stats.ts` (pure): a figure's own frame rate while it moves, over its last second of motion added up across changes, leaving out the first 2 frames of each change and gaps over 100 ms; the watchdog's rule (below 50 fps over a second of motion: the reduced tier for the rest of the page view; less than a second of motion is never dropped; variable refresh can't cause a drop, since the rule doesn't depend on a refresh estimate); missed refreshes and our work per frame against half the display interval, for diagnosis only. Both backends tell an observer about each frame while a change plays (SVG samples the change to its end, even where only the Web Animations API moves things); the scene figure and the interactive figure apply the watchdog when their tier follows the person's setting; `integration/frame-watch.ts` follows them for the Lab's performance overlay (on the Lab page and the parity page; read twice a second while open). §12's budget reworded. **Measured on this machine:** every figure at 60 fps, no missed refreshes, our work at most 0.5 ms (SVG) and 2.4 ms (canvas) against 8.3 ms; a browser test keeps the page busy so a figure draws at about 30 fps, and its next change shows at once while other figures keep moving. The GPU and library triggers (§14) are all unmet. Not measured: the dot game's own canvas loop (an exercise; unchanged). **M6 complete** | S7, S9, S10 | M6 | For your look |
| 2026-11-08 | The Lab's instrument section: five answer sets (start, placing, spread, heavy, six in one place) in light and dark, with the purpose table | S10 | `cs2.cause-map@1` | — |
| 2026-11-08 | The Lab's "Transitions" section: each declared change, replayable, in full or reduced motion, with what moves and why; browser tests that each change ends on the approved state and that nothing moves under reduced motion | S10 | `mcii.path@4` | — |

**Retired 2026-11-08** (removed from code before it was ever committed, so it isn't in git history; the designs stay described in §4–§5 and `visual-language.md` §8, and are rebuilt if a composition pulls them):

| Capability | Was pulled by | Why retired |
|---|---|---|
| The `mcii.path@1` landscape (far, mid and near ridges, open ground) | `mcii.path@1` | Added layers without meaning; competed with the exercise's elements (review, 2026-11-08) |
| Five area studies (`study.action`, `.cognitive`, `.attention`, `.regulation`, `.recovery`) | v0.1 scope | Mostly decorative; an area's language is tested in its first real composition instead |
| S2: seeded random, value noise, `ridge`, `curve`, `blob`, `wave`; the `generated` element kind and the scene seed | The landscape and the studies | No remaining composition uses them (the pull rule) |

**Not built yet:** the `lit` and `translucent` materials, departures with motion, recording the quality tier with the visual source (the states look the same in every tier; only motion differs).

## 16. Decisions for your review
| # | Decision | Recommendation |
|---|---|---|
| V1 | The six core capabilities and five supporting subsystems, with the boundaries in §3.3 and the dependency rules in §3.4 | Approve |
| V2 | Scene Specification v0 as sketched in §4.1, including emphasis levels in state and motion rules derived from state changes | Approve |
| V3 | The pull rule, the capability log and the v0.1 scope in §5.3, with the size guard | Approve |
| V4 | The backend contract, the conformance suite and the custom-element limits in §6 | Approve |
| V5 | The four reviews R1–R4 as acceptance gates, the review log, and baselines updated only with an accepted review | Approve |
| V6 | The psychology-trained reviewer reviews exercise scenes for psychological suitability, with a veto, in the test environment before your merge (revised 2026-11-08: reviews gate merges, not software) | Approve; confirm who that is for MCII |
| V7 | The S1 proposal (`visual-language.md`) | Review the sheet; changes go into revision 2 |
