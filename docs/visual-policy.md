# Visual policy (revision 2)

> **Status:** 2026-11-08. Revision 2 adds principle 6, "Every element earns its place", from your review of `mcii.path@1`, and applies it in §3.13 and §9.4. The rest is unchanged and still under review.
> - This document is normative. Every illustration and instrument in the Visual System is designed and reviewed against it.
> - Stimuli follow their protocol first (`visual-system.md` §7). They use only the parts of this policy that the protocol allows.
> - **Companions:**
>   - `visual-system.md`: the architecture
>   - `visual-language.md`: the S1 values this policy refers to
> - **Claim labels:** **[F]** fact · **[J]** design judgement · **[A]** assumption.

## 1. Purpose
Technical consistency and accessibility are necessary, but they don't make a visual good. This policy states what good means for the platform's visuals, so that design and review work against explicit criteria rather than taste alone. It covers:
- **Visual quality:** composition, hierarchy, depth, perspective, geometry, organic form, light, material, colour, line, type, motion, and the balance between simplicity and sophistication.
- **Conceptual clarity:** whether the visual shows the idea it is for.
- **Scientific appropriateness:** whether it supports the method without steering, claiming or rewarding.
- **Review:** how the three are judged and recorded.

## 2. Principles
1. **Meaning first.** Every visual exists to carry one idea from the exercise. Visual richness serves that idea and is never an end in itself.
2. **Few elements, each finished to a high standard.** Sophistication comes from precision: proportion, tone, depth, light, line quality and timing. It doesn't come from the number of elements, ornament or effects.
3. **One visual language.** Every visual on the platform speaks the S1 language. An area has its own hue and form vocabulary, never its own style.
4. **Calm, adult and serious.** The platform is for people working on difficult things. Its visuals are quiet and considered, never playful, cute or celebratory.
5. **The person stays in charge.** Visuals never judge, reward, push or predict.
6. **Every element earns its place.** No shapes, layers, textures, gradients, illustrations or animations added to look sophisticated. Every element serves at least one of these purposes, and a composition can say which and how:

   | Purpose (`purpose.serves` in a scene) | It… |
   |---|---|
   | `concept` | communicates a psychological concept |
   | `understanding` | helps participants understand information or relationships |
   | `interaction` | supports an interaction or makes a task easier to perform |
   | `feedback` | gives meaningful feedback about a change of state |
   | `identity` | establishes visual identity without compromising clarity |

   An element that serves none of them doesn't belong in the composition. How this is applied:
   - **Start from the simplest version that communicates the concept:** the existing picture, when there is one. Change or add only what serves a named purpose.
   - **Area vocabularies are options, not obligations.** A form listed for an area (`visual-language.md` §11) is used only when a scene can name its purpose.
   - **It's checked in code:** every scene element carries a `purpose` (`serves` plus a sentence on why); the validator rejects an element without one, or one that no state shows. The Visual Lab prints each scene's purpose table next to the pictures.
   - **It's asked in review:** for each element, "What does this tell the participant? What would be lost without it?" (§9.4).
   - **Why it's here:** `mcii.path@1` added a layered landscape behind the path. It carried no meaning and competed with the exercise's elements, and the original picture's few elements communicated better (review, 2026-11-08).

**The guiding principle:** the architecture is ambitious, the implementation is restrained, and the results are genuinely sophisticated.

---

## 3. Visual quality criteria
Each criterion has three parts:
- **what good looks like**
- **rules** that a reviewer can check
- **typical failures** to watch for

Where a rule is a design judgement rather than a measured fact, it is marked [J].

### 3.1 Composition
**Good:** the frame is arranged around one clear subject, with deliberate balance and enough empty space for the subject to read at a glance.

**Rules:**
- **Frames:** every figure uses a frame ratio from `visual-language.md` §12 and keeps its safe area (a margin of 6% of the shorter side) free of essential content.
- **Placement [J]:**
  - The main subject sits near a third of the frame, not dead centre, unless the concept is symmetric (two equal options, a balance).
  - Horizons and ground lines sit near one third or two thirds of the height, never at the midline.
- **Empty space [J]:** illustrations leave at least a third of the frame as calm ground (no elements other than planes).
- **Labels:** they stay in a label zone (`visual-language.md` §12) and don't overlap forms, except a label anchored to its own element.
- **Balance:** visual weight (size × contrast × chroma) is balanced across the frame, so the eye isn't pulled to an empty corner or out of the frame.
- **Reading direction:** in a left-to-right interface, progress and time run left to right (now on the left, the wish on the right, as in the existing MCII scene [F]).

**Typical failures:**
- the subject centred by default
- elements spread evenly with no focus
- a crowded frame
- labels colliding with forms
- a horizon cutting the frame in half

### 3.2 Visual hierarchy
**Good:** at a glance, the eye lands on the one thing that matters in this state, then finds the context, then the ground.

**Rules:** three levels, mapped to S1 roles (`visual-language.md` §3.4):

| Level | Roles | Contrast and colour |
|---|---|---|
| Focal | `subject`, `subject-fill`, `ink` on the focal element | The highest contrast and the only full-chroma colour in the frame |
| Supporting | `context`, `ink` | Clear (≥ 3:1) but neutral |
| Ground | `far`, `mid`, `near`, `ground` | Low contrast, low chroma |

- **One focal element** (or one focal group) per state. The validator enforces this (`visual-system.md` §4.3); a scene policy may allow two only when the concept is a comparison of equals.
- **A change of state** moves the focus to what changed, or leaves it where it was. It never creates a second competing focus.
- **Labels** are supporting, never focal: regular weight, text colour, no chroma.

**Typical failures:**
- two saturated elements competing
- labels louder than the forms
- the background tone as strong as the subject
- a focal change that leaves the old focus at full strength

### 3.3 Spatial depth
**Good:** the scene has a believable, calm sense of space that makes relationships (near, far, ahead, behind) readable, without drama.

**Rules:**
- **Planes:** at most four depth planes (`far`, `mid`, `near`, `subject`) plus annotation.
- **Depth cues, in order of preference:**
  1. **Overlap:** nearer forms occlude farther ones.
  2. **Aerial perspective:** farther planes move towards the ground colour in lightness and lose chroma. This is built into the S1 plane roles (`visual-language.md` §7).
  3. **Line-weight gradient:** farther lines are thinner.
  4. **Scale:** the same kind of object is smaller farther away.
  5. **Vertical position:** farther is higher, below the horizon.
  6. **Soft focus:** GPU only, later, and never on essential content.
- **Consistency:** all cues in a scene agree. A far form is never drawn with a near line weight or with more chroma than a near form.
- **Restraint [J]:** depth stays shallow and calm, enough for space but not a dramatic vista.

**Typical failures:**
- a flat diagram where space would help the concept
- contradictory cues (thin near lines, saturated far planes)
- too many planes
- a vista so deep that the subject gets small

### 3.4 Perspective
**Good:** one clear, consistent viewpoint that suits the concept and never makes the subject look overwhelming or trivial.

**Rules:**
- **One viewpoint per scene,** kept in every state.
- **Eye level [J]:** at or slightly above the horizon, looking slightly down on a landscape.
  - The person looks *over* the path, never up at an obstacle.
  - This supports the MCII policy that the obstacle stays low and surmountable [F: `mcii-design.md` §5].
- **Approach:** frontal or gently receding (one-point perspective with a vanishing point on the horizon). No dramatic wide-angle distortion, no worm's-eye or bird's-eye views.
- **Diagrams and instruments** (maps, scales, boards) are drawn flat, without perspective. Perspective would distort the values they show.
- **Constructed perspective:** where it is used, receding lines meet at a vanishing point on the horizon, and scale falls off consistently.

**Typical failures:**
- a looming low-angle obstacle
- mixed viewpoints in one scene
- perspective on a chart, so equal values look unequal

### 3.5 Geometry
**Good:** constructed forms are exact, proportionate and related to each other by a visible system.

**Rules:**
- **Grid:** construction uses an 8-unit grid in scene units, with a 4-unit half-step for detail (`visual-language.md` §8).
- **Proportions:** frame divisions and form sizes use simple ratios (1:1, 1:2, 2:3, 3:4) or the golden ratio. Unrelated sizes aren't mixed in one scene.
- **Radii:** corners use the S1 radius scale only.
- **Smooth joins:** curves join smoothly (tangent-continuous) unless a corner is intended. No accidental kinks, overshoots or wobble.
- **Exactness:** circles, arcs and concentric forms are exact. Concentric spacing follows a stated progression (equal or geometric).
- **Alignment:** shared edges, centres and baselines line up exactly. Optical adjustments are deliberate and recorded in the scene.

**Typical failures:**
- near-misses (two edges 1 unit apart)
- arbitrary sizes
- lumpy curves
- uneven concentric spacing

### 3.6 Organic forms
**Good:** natural forms (terrain, water, foliage-like masses, soft blobs) have the calm irregularity of real forms, made with the same precision as constructed ones.

**Rules:**
- **Generated:** organic forms come from seeded generators (S2), so they are reproducible and reviewable.
- **Parameter bounds [J]** (enforced as generator parameter limits):
  - lowest-octave amplitude at most 12% of the form's extent
  - at most three octaves
  - persistence at most 0.5
  - no high-frequency jitter
- **Silhouettes** read at 50% size: a form is recognisable from its outline alone.
- **No imitation of hand-drawn wobble,** sketchiness or brush texture. Organic means natural, not imprecise.
- **Seeds are design decisions.** A seed is chosen in review and pinned in the scene; it is never re-rolled at runtime.
- **Pairing:** organic forms are paired with constructed forms in the proportion each area theme sets (`visual-language.md` §11). Neither takes over unless the theme says so.

**Typical failures:**
- noisy outlines
- lumps of equal size (no octave hierarchy)
- forms that look random rather than natural
- runtime randomness, so two people see different pictures

### 3.7 Light
**Good:** light gives forms volume and the scene a quiet atmosphere. It is consistent across the platform, so every visual seems to sit in the same world.

**Rules:**
- **One platform light [J]:** soft, from the upper left (azimuth about 315°, elevation about 45°), in every scene and area. A scene may dim it, never move it.
- **Shading uses ramp steps.** For a form's base step, the lit side is one step lighter and the shaded side one step darker (`visual-language.md` §6). There are no arbitrary highlights.
- **Grounding:** objects that sit on a surface have a soft contact shadow (S1 token), never a long cast shadow. There are no drop shadows on flat, interface-like shapes.
- **Contrast stays gentle:** no strong chiaroscuro, glare, rim light or lens flare.
- **In dark mode the same light applies.** Lit sides lift towards the subject tone; shaded sides sink towards the ground.

**Typical failures:**
- light from different directions on neighbouring forms
- glossy highlights
- drop shadows as decoration
- dark-mode shading that inverts the light

### 3.8 Materials
**Good:** surfaces feel considered and tactile but not literal. The platform has a small, consistent set of matte materials.

**Rules:**
- **Only S1 materials** (`visual-language.md` §5):
  - `line`
  - `tonal`
  - `lit`
  - `translucent`
  - the ground, with an optional texture
- **All materials are matte.** No gloss, chrome, glass reflections, bevels, embossing or photoreal surfaces.
- **Texture** (when adopted) is subtle and uniform: at most 6% opacity, on the ground or large planes only, never on the subject or text.
- **Translucency** is for forms whose overlap carries meaning (for example two readings of one situation). Overlaps get a defined tone, not an accidental blend.

**Typical failures:**
- skeuomorphic shine
- textures that compete with the subject
- translucency used as decoration
- muddy overlaps

### 3.9 Colour
**Good:** a restrained palette with one hue per area, where colour clarifies hierarchy and never carries judgement.

**Rules:**
- **One area ramp plus neutrals** per figure. Cross-area figures are rare and each needs its own review.
- **Chroma budget [J]:** ground planes keep low chroma (the S1 plane steps); only the focal element uses the ramp's peak chroma.
- **Never colour alone:** colour never carries meaning by itself (WCAG 1.4.1). Every distinction also has form, line, position or a label.
- **No valence colours:** no green for good or red for bad, no traffic lights, no warning colours for an emotion, a cause or a reading.
- **Contrast:** at least 3:1 for essential graphics and 4.5:1 for labels, in light, dark and forced colours (checked by tests, `visual-language.md` §3.5).
- **Mixing:** colour is mixed in OKLab. No mixing in sRGB, which goes muddy and greyish.

**Typical failures:**
- several saturated hues
- colour as the only cue
- valence-coded options
- dark-mode colours that are just inverted

### 3.10 Line
**Good:** lines are confident, even and consistent, and their weight carries depth and importance.

**Rules:**
- **Weights:** only S1 line weights; lines keep their weight at every figure size (non-scaling strokes).
- **Gradient by plane:** farther planes use thinner lines (`visual-language.md` §4.2).
- **Ends and joins:** round caps and round joins everywhere, continuing the existing icon language [F: `shared/icon.ts`].
- **Dashes have meaning:**
  - `intended` means planned, not yet done (the MCII bridge [F])
  - `tentative` means uncertain or possible
  - dashes are never decorative

**Typical failures:**
- mixed weights at random
- hairlines that disappear at 100% scaling
- decorative dashes that blur the meaning of the intended ones

### 3.11 Typography in figures
**Rules:**
- **Typeface and size:** system UI font, the same as the page; label size and weight from S1.
- **Content:** labels come from versioned content, never from typed text.
- **Placement:**
  - horizontal only
  - no text on paths
  - no rotated labels in illustrations
- **Contrast:** at least 4.5:1 against what they sit on.
- **Length:** a label is a few words. Anything longer belongs in the page text, not the figure.

### 3.12 Motion
**Good:** motion explains a change. It shows what is new, where it came from and that the rest stayed the same, and then stops.

**Rules:**
- **When:** only on a state change; only the elements that changed move; at most three per change.
- **Continuity:** an element present in both states persists and is never redrawn from nothing.
- **Direction carries meaning:**
  - things that appear rise from the ground or draw along their direction of travel (left to right for paths)
  - things that recede fade and desaturate, rather than flying away
- **Timing:** durations and easings come from S1 only. Ease-out for arrivals; no bounce, overshoot, elastic or spin.
- **Never:**
  - looping in illustrations
  - motion during typing
  - motion in response to a choice in progress
  - motion that delays the person or the focus move
- **Reduced motion:** the final state appears at once. If a motion carries meaning, it switches to a different representation.

**Typical failures:**
- everything animating on every step
- choreography for its own sake
- bouncy easing
- motion that implies success (zooming towards the goal)

### 3.13 Simplicity and sophistication
The aim is visuals that are **simple to read and sophisticated to look at.** They fail in two opposite ways, and review checks both.

| | Too simple | Balanced | Too complex |
|---|---|---|---|
| Looks like | A generic diagram, clip art, a large icon, flat shapes with no space or light | Few forms, each refined; depth, light and proportion doing quiet work; one clear idea | Ornament, many focal points, textures everywhere, effects |
| Reads as | Unfinished, cheap, or not serious | Calm, considered, professional | Busy, decorative, distracting |

**Rules:**
- **Purpose before polish (principle 6):** sophistication comes from precision, consistency and clarity: proportion, line quality, colour and timing applied to the elements the concept needs. It doesn't come from adding layers, depth or texture. Too simple is fixed by refining those elements, not by adding new ones.
- **The removal test:** for each element, ask whether removing it would change the meaning. If not, remove it. (Revision 1 also kept elements that only "weaken the space or light"; under principle 6, space and light aren't reasons on their own.)
- **The detail gradient [J]:** detail concentrates at the focal element and falls off towards the edges and background.
- **The element budget [J]:** an illustration state shows at most about seven distinct forms (planes count as one each). More needs a reason in the scene policy.
- **Where sophistication comes from:**
  - proportion
  - tonal depth
  - light
  - line quality
  - timing

  Never from the number of elements.

---

## 4. Conceptual clarity
**Good:** the visual shows the idea it is for, and nothing else.

**Rules:**
- **One idea per figure,** written in the scene policy as one sentence (for example "the same path to the same wish, now with an inner obstacle on it").
- **Metaphor fit:** the metaphor follows the method's concept, not a generic association. Known weaknesses are recorded (for example: the MCII wall could read as external, although the method's obstacle is inner [F: `mcii-design.md` §5]).
- **The paraphrase test:** a reviewer who knows the exercise but hasn't read the scene policy says in one sentence what the picture shows. It must match the policy's sentence.
- **The labels test:** without labels, a first-time viewer can still say what kind of situation it is (a path, a choice, a set of views). With labels, they can say what each part is.
- **Continuity across states:** the picture changes only where the concept changes, so the change itself communicates.

## 5. Scientific appropriateness
**Rules:**
1. **Never required:** an illustration is never needed to complete a step. The exercise works the same with no picture (tested [F: `visual-slot.spec.ts`]).
2. **No steering:**
   - no visual reacts to a choice in progress
   - options get equal visual weight
   - no option is made more attractive by colour, size, light or position
   - nothing previews a "right" answer
3. **No claims:**
   - nothing shows a plan as already achieved: the intended line stays dashed
   - nothing implies an outcome is likely or certain
   - nothing presents the picture as part of the method
4. **No reward:** no celebration, achievement imagery, badges, confetti, stars, trophies or summits after completing a step.
5. **No judgement:** nothing marks a reading, cause, feeling or decision as good or bad, through colour or any other means.
6. **Valence balance:** when an exercise contrasts a desired future with an obstacle, they get equal visual weight. That supports contrasting rather than indulging [F: `mcii-design.md` §5].
7. **Consistency where it matters:** visuals that differ between conditions of a comparison need a protocol decision. Experiment exercises aren't changed during the n-of-1 study.
8. **Privacy:** visuals are chosen only from closed-vocabulary requests. Typed text never reaches a visual.
9. **Stimuli** follow their protocol (`visual-system.md` §7); this policy can't override it.

**The psychology-trained reviewer** has a veto on this section in review R2, as in the content reviews [F: `cognitive-shifts-review-plan.md`].

## 6. Accessibility (summary; normative detail in `visual-system.md` §12)
- **Text alternatives:** one per state, from content; decorative layers hidden from assistive technology.
- **Colour and contrast:** no colour-only meaning; 3:1 for graphics; 4.5:1 for labels.
- **Forced colours:** mapped to system colours (`visual-language.md` §3.6).
- **Motion:** reduced motion is respected and meaningful motion has an alternative; nothing flashes; anything moving for more than 5 s can be paused.
- **Instruments:**
  - native controls first
  - a single-pointer alternative for any drag
  - 24 px targets
- **Focus:** visuals never take or move focus.

## 7. Never used
- **Characters:** mascots, faces, characters, avatars.
- **Reward imagery:** confetti, stars, badges, trophies, medals, summits, finish lines, fireworks, rewards of any kind.
- **Styles:** cartoon or childish styling; stock-illustration styling (blob people, generic tech gradients).
- **Effects:** glossy or skeuomorphic effects, decorative particles, celebratory motion.
- **Judgement and alarm imagery:** success, failure, judgement, danger or alarm; broken or shattered objects for setbacks.
- **Valence colours:** green for good and red for bad, or traffic lights.
- **Text from the person:** text typed by the person, in any form.

## 8. Per-scene policy (template)
Every scene has a short policy in its scene file's header, and policy assertions as tests next to it.

```
Scene:          <id>@<version>        Area theme: <theme>         Tier: illustration | instrument
Idea:           <one sentence: what this visual shows>
States:         <state>: <what is shown, what is focal>   (one line per state)
Metaphor:       <the metaphor and why it fits the method>; known weaknesses: <…>
Must:           <rules specific to this scene, each testable where possible>
Must not:       <scene-specific prohibitions>
Motion:         <which changes move, with which effect and preset>
Alt texts:      <content keys per state>
Assertions:     <the policy tests that enforce the Must and Must not lines>
Review:         <links to its R2 / R3 entries in visual-reviews.md>
```

---

## 9. Human review
Automated tests prove that a visual is correct, consistent and accessible. **Only people can judge whether it is good, clear and appropriate.** Review is an acceptance gate, not a courtesy (`visual-system.md` §10).

### 9.1 When
| Review | Subject | Material |
|---|---|---|
| R1 Language | The S1 proposal; each area study; each new theme, material or asset | The review sheet; the Lab |
| R2 Composition | Each scene, each state, each transition | The Lab: every state in light, dark, forced colours, reduced motion and each tier, at 1280 and 2560 px |
| R3 In context | Each integrated exercise | The development build, start to end |
| R4 Usability | Each exercise integration | The existing usability sessions |

### 9.2 Who
- **You** take part in R1, R2 and R3, covering visual quality, concept and product fit.
- **The psychology-trained reviewer** takes part in R2 for exercise scenes, covering scientific appropriateness, with a veto.
- **A visual designer, if one is available,** may take part in R1 and R2, advising on visual quality.
- **Participants** take part in R4.

### 9.3 Scoring
Each criterion is scored for the reviewed item:

| Score | Meaning |
|---|---|
| **2 · Meets** | Meets the criterion as stated |
| **1 · Concern** | Works, but should improve; a note says how |
| **0 · Fails** | Doesn't meet the criterion |

**Verdict:**
- **Accept:** no 0; every item in §5 scores 2; at most three 1s, each with a note on whether it is fixed now or tracked.
- **Revise:** any 0 outside §5, or more than three 1s. Fix and review again.
- **Reject:** a 0 in §5 or §4, or a veto. The concept or metaphor goes back to design.

### 9.4 Checklist
| Group | Criteria |
|---|---|
| Purpose (§2, principle 6) | For every element: what does it tell the participant, and what would be lost without it? Any element without a clear answer is removed |
| Visual quality (§3) | 3.1 Composition · 3.2 Hierarchy · 3.3 Depth · 3.4 Perspective · 3.5 Geometry · 3.6 Organic forms · 3.7 Light · 3.8 Materials · 3.9 Colour · 3.10 Line · 3.11 Type · 3.12 Motion · 3.13 Simplicity and sophistication |
| Conceptual clarity (§4) | One idea · Metaphor fit · Paraphrase test · Labels test · Continuity across states |
| Scientific appropriateness (§5) | Never required · No steering · No claims · No reward · No judgement · Valence balance · Consistency · Privacy |
| Coherence | Speaks the S1 language; sits with the other approved scenes when shown side by side in the Lab |
| Technical (from the automated run) | Tests, axe, screenshots, budgets: attached, not re-judged |

Criteria that don't apply (for example perspective in a flat instrument) are marked *n/a* with a reason.

### 9.5 Questions for R4 (added to `usability-procedure.md` for each integration)
- What did the picture show you, in your own words?
- Did it help you understand the step? Did it distract you while you were writing?
- Did it feel calm and professional, or something else?
- Did anything in it seem to suggest an answer, or to judge you?
- For MCII: did the obstacle in the picture seem to be inside you or outside you?

### 9.6 The review log
Reviews are recorded in `docs/visual-reviews.md`, created with the first review. Each entry has:
- date, review type and reviewers
- the item (`scene@version`, theme version, states and tiers seen)
- the score per criterion, with notes
- the verdict, and the screenshot baselines it approves

Baselines change only with an accepted entry that names them.
