# The Visual System: architecture and foundations (revision 3)

> **Status:** v0.1 in progress, branch `test-visual-system`.
> - **Built so far:** S1 tokens and resolver, S3 types and validator, S4 visibility and emphasis, the SVG backend, the pipeline and a scene figure (S9), and the Visual Lab (development build, `/lab`). See the capability log (§15).
> - **For review before anything else is built:** R2 of `mcii.path@2` in the Lab, side by side with the picture participants see now. Motion (MCII 4c) and integration into the exercise (4d) wait for that review.
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
- **The four experiment exercises.** They aren't touched while the n-of-1 study runs (plan decision D4).

---

## 3. Architecture

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
4. **S4 State** imports S3 types. **S5 Motion** imports S4 types and S1 motion tokens.
5. **S7 Rendering** imports the resolved-frame and timeline types, and **nothing imports a backend except S9 Integration.**
6. **Exercises import only S9:** a visual source, the slot, an instrument component. They never import a backend, a generator or a rendering library.
7. **`*-logic.ts` and `*-store.ts` import nothing from the Visual System.**
8. **Heavy libraries load lazily,** through dynamic `import()` or `@defer` inside the backend that uses them.

### 3.5 Example: one MCII state change through the pipeline
| Step | Capability | What happens |
|---|---|---|
| 1 | S9 | `sceneFor('mcii_obstacle', …)` (in `mcii-scenes.ts`, unchanged in kind) asks for `mcii.contrast`, previously `mcii.future` |
| 2 | S3 | Scene `mcii.path` v2 gives the frame and the elements `path`, `now`, `wish`, `wish-centre`, `wall`, `wall-courses`, `bridge`, plus four labels, each with its purpose |
| 3 | S2 | Not used: every element is hand-placed geometry |
| 4 | S1 | Theme `action`, scheme light: `wall` and `wish` take the role `subject` with the `tonal` material; `path` takes `context` |
| 5 | S4 | State `contrast`: `wall` becomes visible; `wish` drops from `focal` to `normal`, so the wish and the obstacle have equal weight |
| 6 | S5 | From `future` to `contrast`: one change, `wall` appears with the `rise` effect and the `deliberate` preset. Under reduced motion the timeline is empty and the final state is shown at once |
| 7 | S7 | The SVG backend draws the resolved frame and plays the timeline |
| 8 | S9 | Provenance is recorded as `{ source: 'builtin.v2', scene: 'mcii.path@2', theme: 'action@1', tier: 'full' }` |

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

### 5.2 The pull rule and the capability log
- **The pull rule:** a field, element kind, generator, material or motion effect enters the system only when a composition under review needs it.
- **The capability log:** every addition gets one row in a log in `docs/visual-system.md` (§15), naming the composition that pulled it. A capability no composition has pulled doesn't exist in code, even if an interface for it is described here.
- **The rule of two** still applies to *utilities*. A helper written for one composition becomes shared when a second composition needs it. Because it's written against the shared interfaces from the start, sharing it is a move, not a rewrite.

### 5.3 v0.1 scope
| Capability | In v0.1 (NOW) | Interface only (DESIGNED) |
|---|---|---|
| S1 Styling | Neutral and area ramps, roles, line weights, dashes, the `line`, `tonal` and `solid` materials, emphasis resolution, motion tokens, forced-colours mapping, the five area themes (the palette under review R1, through the S1 sheet) | The `lit` and `translucent` materials, textures, light presets beyond the platform default: each one added when a scene pulls it |
| S2 Generation | Nothing (revision 3): `mcii.path@2` is hand-placed | Seeded random, noise, curves, ridges, blobs, arcs, layouts, distributions, flow fields, rhythm curves |
| S3 Composition | `SceneDefinition` with `shape` and `label` elements, each with a purpose; the validator | `generated`, `custom`, `asset`, `group` and `region` elements |
| S4 State | Visibility and emphasis | Parameter targets (v0.2) |
| S5 Motion | Only once MCII step 4c needs it: `fade`, `rise`, `draw`; the motion policy | Value transitions, layout transitions, the scalar tween, View Transitions |
| S6 Interaction | — | Everything (v0.2, with CS2) |
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
| `MciiPathScene` (`mcii-path-scene.ts`) | Legacy | Replaced in MCII step 4d by scene `mcii.path`; then removed |
| CS2 cause chart (`cs-why-it-happened.ts`) | Legacy | v0.2, as an instrument |
| CS1 and CS3 visuals | Legacy | v0.3 |
| `GamePreview`, `TrackingGame`, `ToneGame` | Experiment exercises: frozen | Only after the n-of-1 study, as a new protocol phase through the stimulus lane |
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
| Status | NOW | DESIGNED (v0.2) | DESIGNED (v0.4) |

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
| Reduced | `prefers-reduced-motion`, or the performance watchdog (v0.4) | Empty timelines (final states at once); no parallax or particles; GPU passes replaced by S1 materials |
| Static | No backend support, a lost context, forced colours where the backend can't follow system colours, print | The final state as static SVG, or an exported asset |

**The motion policy:**
- **When motion happens:** only on a state change (an explicit pacer excepted), and only for elements that changed.
- **Limits:** at most three elements per change; durations from S1 tokens; never during typing; never in reaction to a choice in progress.
- **Reduced motion is explicit.** Meaningful motion switches to a different representation and never relies on the global rule in `styles.css` (which shortens every CSS animation to 0.01 ms) [F]. Illustrations take the empty timeline.

**Fallback:** a missing, failing or slow source falls back to `none` (already built and tested) [F]. A backend that can't run falls back to the static tier. The exercise never knows which happened.

## 9. Provenance and recording
- **Illustrations and instruments** in development exercises record `{ source, scene@version, theme@version, tier }`, extending the `visual_source` already recorded with MCII step 1 [F: `mcii-logic.ts`].
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
| **R2 Composition** | Each scene: every state, light, dark, forced colours, reduced motion, each tier; each transition replayed | The Lab | You; for exercise scenes, also the psychology-trained reviewer (scientific appropriateness, with a veto) | Integration of that scene |
| **R3 In context** | The integrated exercise from start to end, at 1280 and 2560 px, 100% and 150% scaling | The development build (port 4310) | You | Release of the integration to the development build |
| **R4 Usability** | Participants' understanding and experience | `usability-procedure.md` sessions | Participants, with the questions in `visual-policy.md` §9.5 | The exercise's existing usability gate |

**Screenshot baselines are updated only with an accepted review entry** that names them, so automated checks can never quietly accept a visual change.

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
  - 8 ms per frame for animated compositions on reference hardware
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
  - visuals never take or move focus
  - anything moving for more than 5 s can be paused

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
  integration/  scene-source.ts · provenance.ts                                 S9
  scenes/       <area>/<scene>.scene.ts + <scene>.policy.spec.ts                compositions
  testing/      source-files.ts (reads project files in specs)                  tests only
web/src/app/pages/lab/                Visual Lab (development build only)        S10
docs/visual-system.md · visual-policy.md · visual-language.md · visual-reviews.md
```

## 14. Release plan and technology triggers
| Release | Contents | Validated by | Human review |
|---|---|---|---|
| **Phase 2 (this)** | These three documents; the S1 review sheet | — | R1 of the S1 proposal |
| **v0.1** | §5.3 scope | MCII 4a–4d (revision 3: the area studies were removed) | R1 on the S1 sheet; R2 each MCII state next to the original, then the transitions; R3 MCII |
| **v0.2** | S6 Interaction; S4 parameter targets; value transitions; instruments in the Lab | CS2 | R2, R3; CS2 usability |
| **v0.3** | The layout generators and layout transitions that CS1 and CS3 pull | CS1, CS3 | R2, R3 |
| **v0.4** | Canvas backend; stimulus lane; frame clock; timing log; watchdog | The first approved Attention task | R2; a timing validation report |
| **v0.5** | GPU backend (trigger) | Its first scene | R2; conformance |
| **v0.6** | Asset manifest, pipeline, offline export | The first conventional asset or exported fallback | R1 for each asset |
| **v0.7** | AI assets, stage A (trigger) | Its first scene | R1 and R2, with provenance |

**Technology triggers (each its own approval, with a licence note and a lazy entry point):**

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
| 2026-11-07 | Visibility and emphasis targets | S4 | `mcii.path@1` (set aside recedes; the wish is focal at the future step) | R2 pending |
| 2026-11-07 | SVG backend (every drawable drawn as one path type; non-scaling strokes) and the conformance suite | S7 | `mcii.path@1` | — |
| 2026-11-07 | Pipeline, `contentText`, scene figure | S9 | `mcii.path@1` | — |
| 2026-11-07 | Visual Lab (every scene × state, light and dark pinned); browser test with axe in light, dark and forced colours | S10 | v0.1 scope (§5.3) | — |
| 2026-11-08 | `purpose` on every element; validator rules for purposes and never-shown elements; the purpose table in the Lab | S3, S10 | Your review of `mcii.path@1` (`visual-policy.md` principle 6) | — |
| 2026-11-08 | `solid` material (dots and small marks in the line colour) | S1 | `mcii.path@2` (the wish's centre) | R2 pending |
| 2026-11-08 | Receded `context` lines keep their colour and recede by weight only, so they never get darker | S1 | `mcii.path@2` (set aside) | R2 pending |
| 2026-11-08 | The Lab compares a revision with the picture it replaces, drawn by the exercise's own source (`builtin.v1`) | S10 | `mcii.path@2` | — |

**Retired 2026-11-08** (removed from code before it was ever committed, so it isn't in git history; the designs stay described in §4–§5 and `visual-language.md` §8, and are rebuilt if a composition pulls them):

| Capability | Was pulled by | Why retired |
|---|---|---|
| The `mcii.path@1` landscape (far, mid and near ridges, open ground) | `mcii.path@1` | Added layers without meaning; competed with the exercise's elements (review, 2026-11-08) |
| Five area studies (`study.action`, `.cognitive`, `.attention`, `.regulation`, `.recovery`) | v0.1 scope | Mostly decorative; an area's language is tested in its first real composition instead |
| S2: seeded random, value noise, `ridge`, `curve`, `blob`, `wave`; the `generated` element kind and the scene seed | The landscape and the studies | No remaining composition uses them (the pull rule) |

**Not built in this step:** S5 Motion (waits for MCII 4c), `SceneSpecSource` and provenance (4d), screenshot baselines (added with the first accepted review, §10), the `lit` and `translucent` materials.

## 16. Decisions for your review
| # | Decision | Recommendation |
|---|---|---|
| V1 | The six core capabilities and five supporting subsystems, with the boundaries in §3.3 and the dependency rules in §3.4 | Approve |
| V2 | Scene Specification v0 as sketched in §4.1, including emphasis levels in state and motion rules derived from state changes | Approve |
| V3 | The pull rule, the capability log and the v0.1 scope in §5.3, with the size guard | Approve |
| V4 | The backend contract, the conformance suite and the custom-element limits in §6 | Approve |
| V5 | The four reviews R1–R4 as acceptance gates, the review log, and baselines updated only with an accepted review | Approve |
| V6 | The psychology-trained reviewer takes part in R2 for exercise scenes, with a veto on scientific appropriateness | Approve; confirm who that is for MCII |
| V7 | The S1 proposal (`visual-language.md`) | Review the sheet; changes go into revision 2 |
