# The visual language (S1): proposal (revision 2)

> **Status:** in code since 2026-11-07 (`web/src/app/shared/visual/styling/`), with the values below unchanged; **review R1 still open.**
> - The values entered code when v0.1 started, so the area studies could be reviewed in the Visual Lab (`/lab`, development build). Review changes go into `tokens.css` and this document together; a spec checks every contrast pair in §3.5 on `tokens.css`.
> - **Revision 2:** token names in §2 match the code; the `500` area step isn't written because no role uses it yet; §5 adds the `solid` material; §11 makes the area forms optional, after your review of `mcii.path@1`.
> - **Visual review sheet:** in the Visual Lab (`/lab`, development build), at the end: "Visual language review sheet" (M3 stage C, 2026-11-11). It's drawn from the tokens the figures use, so a token change shows there at once: the ranges and every role per area with the value each takes, in light and dark; line weights and dashes; every material, the light and the depth planes in each area; type. Motion is replayed in the Lab's Transitions sections. The earlier sheet (<https://claude.ai/artifact/U6pbq8LDPgeqUGejrWE9Pm>, private, outside the repository) is superseded.
> - **Companions:**
>   - `visual-system.md`: S1's place in the architecture
>   - `visual-policy.md`: the criteria these values serve
> - **Claim labels:** **[F]** fact (computed values are facts about the proposal) · **[J]** design judgement · **[A]** assumption.

## 1. What S1 is
S1 is the platform's look, written as data. Every backend (SVG now, Canvas, GPU and 3D later) and every scene takes its colours, lines, materials, light, depth, geometry rules, type and motion from here. Scenes contain only *semantic* references, such as "this is the subject, on the near plane, drawn with a regular line". S1 turns them into values for the current scheme: light, dark or forced colours.

**S1 doesn't change the page.**
- **Existing tokens:** the five existing colour tokens (`--bg`, `--text`, `--muted`, `--border`, `--accent`) and every page style stay exactly as they are [F: `web/src/styles.css`].
- **New namespace:** S1 adds its own tokens under a `--vis-` prefix, used only inside figures.
- **Shared values:** it reuses `--bg` (the ground), `--text` (ink and labels) and `--muted` (soft labels), so figures sit on the page without a visible edge.

## 2. Structure and names
| Part | Form | Example |
|---|---|---|
| Neutral ramp | `--vis-n-<step>` | `--vis-n-600` |
| Area ramp | `--vis-a-<step>`, set by the theme attribute | `--vis-a-600` |
| Roles | `--vis-<role>`, set per scheme from ramp steps | `--vis-subject`, `--vis-near`, `--vis-near-edge` |
| Emphasis | `--vis-receded`, `--vis-receded-fill`; `--vis-focal` exists only under forced colours | |
| Lines and motion | Numbers in `styling/vocabulary.ts` (S5 and every backend read them there) | `LINE_WEIGHTS.regular` |
| Theme | An attribute on the figure root | `data-vis-theme="action"` |
| Scheme | An attribute on the figure root: `auto` follows the page; `light` or `dark` pins it (the Lab) | `data-vis-scheme="auto"` |

**Source of truth:** `styling/tokens.css` for colour, `styling/vocabulary.ts` for lines, dashes, frames and motion.
- **How backends read it:** SVG uses the custom properties directly. Canvas and GPU backends read the resolved values from the figure with `getComputedStyle`, as `TrackingGame` already does with the page tokens [F: `tracking-game.ts`]. Offline export reads the same file.
- **Contrast checks:** a test parses the file and checks every contrast pair in §3.5.

---

## 3. Colour

### 3.1 One lightness ladder, one chroma envelope
Every ramp, neutral and area, shares the same eleven lightness steps (OKLCH *L*) and the same chroma envelope (a fraction of the ramp's peak chroma). Two consequences:
- **Equal weight across areas.** Step 600 of every area has the same lightness, so no area looks heavier than another, and a figure can change theme without its hierarchy changing.
- **Emphasis without contrast loss.** A receded element swaps to the neutral step with the same index, so it keeps its lightness, and with it its contrast (§3.7).

| Step | 050 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lightness *L* | 0.975 | 0.945 | 0.89 | 0.81 | 0.72 | 0.62 | 0.53 | 0.45 | 0.37 | 0.29 | 0.235 |
| Chroma (× peak) | 0.12 | 0.22 | 0.40 | 0.62 | 0.85 | 1.0 | 1.0 | 0.90 | 0.72 | 0.50 | 0.36 |

- **Mixing and interpolation** happen in OKLab [F: MDN `oklch()`].
- **Gamut:** where a colour falls outside sRGB, its chroma is reduced until it fits, at the same lightness and hue.

### 3.2 Area hues
| Ramp | Area | Hue (OKLCH *H*) | Peak chroma | Reasoning [J] |
|---|---|---|---|---|
| `neutral` | All | 262.8 | 0.012 | A grey with a slight bias towards the platform accent, matching the existing neutrals (`--muted` is *H* ≈ 271, *C* 0.010) [F] |
| `action` | Action and growth | 262.8 | 0.16 | The hue of the existing `--accent` (#2457c5: *L* 0.49, *C* 0.181, *H* 262.8) [F]. Action is the platform's first area, so its figures share the accent's hue, one step softer |
| `cognitive` | Cognitive shifts | 300 | 0.14 | Violet: next to the accent, distinct from it, reflective rather than urgent |
| `attention` | Attention | 230 | 0.06 | Slate, deliberately low in chroma: stimuli take their colours from their protocol, and illustrations around them stay quiet |
| `regulation` | Emotional regulation | 178 | 0.10 | Sage teal: calm, low-arousal, and not the green of "good" |
| `recovery` | Recovery after setbacks | 68 | 0.12 | Ochre: warm, morning-like; deliberately away from red and alarm |
| `curiosity` | Curiosity and exploration (planned) | 345 | 0.13 | Reserved. Not a theme until the area is designed |
| `learning` | Learning reinforcement (planned) | 140 | 0.11 | Reserved. Not a theme until the area is designed |

**Controls stay strongest [F, computed].** The peak chroma of every illustration ramp (at most 0.16) is below the UI accent's chroma (0.181). Buttons, links and focus rings therefore stay the most saturated things on any page, and figures never compete with controls.

### 3.3 The ramps (sRGB hex, computed from §3.1 and §3.2)
| Ramp | 050 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| neutral | `#f6f7f8` | `#ecedef` | `#d9dbde` | `#bec1c6` | `#a1a5ab` | `#82868e` | `#686c73` | `#52555b` | `#3d4044` | `#2a2b2e` | `#1d1e20` |
| action | `#f3f7ff` | `#e4edff` | `#c8dbff` | `#a0c1ff` | `#76a3fa` | `#5082e5` | `#3766c7` | `#274fa4` | `#1d3c7c` | `#152953` | `#0f1d39` |
| cognitive | `#f8f5ff` | `#f0e9ff` | `#e0d3fb` | `#c9b5f1` | `#b093e4` | `#9470cd` | `#7955b0` | `#614190` | `#49316c` | `#312249` | `#221832` |
| attention | `#f2f8fb` | `#e4eff4` | `#cbdee8` | `#a9c6d5` | `#84abbf` | `#608da4` | `#457388` | `#345b6e` | `#264452` | `#1b2e37` | `#132026` |
| regulation | `#effaf7` | `#def2ed` | `#c0e4db` | `#96cfc1` | `#65b6a5` | `#2f9a86` | `#007e6c` | `#006455` | `#004b40` | `#05332b` | `#07241e` |
| recovery | `#fef5ed` | `#f9eadb` | `#f1d6ba` | `#e1b88d` | `#cf985b` | `#b57727` | `#975d00` | `#784900` | `#5b3600` | `#3f2503` | `#2b1a05` |
| curiosity | `#fff3f9` | `#fce6f1` | `#f5cee3` | `#e8accd` | `#d688b4` | `#bc6398` | `#9e497d` | `#813664` | `#61284b` | `#411d33` | `#2d1423` |
| learning | `#f2f9f1` | `#e5f1e2` | `#cce2c7` | `#aacca3` | `#85b37b` | `#619655` | `#477b3b` | `#35622a` | `#274a1f` | `#1c3217` | `#142310` |

The steps where the requested chroma didn't fit sRGB and was reduced:
- the lightest action steps (050–300)
- cognitive and curiosity 050
- regulation 600–800
- recovery 600–800

### 3.4 Roles
Scenes use roles, never ramp steps. A role resolves to a ramp step (or an existing page token) for each scheme.

| Role | Meaning | Light | Dark |
|---|---|---|---|
| `ground` | The figure's background: the page itself | `--bg` (#ffffff) | `--bg` (#17181b) |
| `far` | The farthest depth plane | area 050 | area 950 |
| `mid` | The middle depth plane | area 100 | area 900 |
| `near` | The nearest depth plane | area 200 | area 800 |
| `subject-fill` | The fill of the focal form | area 100 | area 800 |
| `subject` | The focal line or form | area 600 | area 300 |
| `context` | Supporting lines (a path, an axis, a link) | neutral 500 | neutral 400 |
| `ink` | Essential neutral lines; the intended (dashed) line | `--text` (#1c1c1e) | `--text` (#ececef) |
| `label` | Labels in figures | `--text` | `--text` |
| `label-soft` | Secondary labels | `--muted` (#55575d) | `--muted` (#a9abb2) |
| `focus` | The keyboard focus ring on a figure that is itself the control (M4): 2 px, 3 units outside the target, the page's own focus colour so it looks like every other control's focus; at least 3:1 on the ground and every plane | `--accent` (#2457c5) | `--accent` (#8fb0ff) |

**Example (Action and growth):**

| | ground | far | mid | near | subject-fill | subject | context | ink |
|---|---|---|---|---|---|---|---|---|
| Light | `#ffffff` | `#f3f7ff` | `#e4edff` | `#c8dbff` | `#e4edff` | `#3766c7` | `#82868e` | `#1c1c1e` |
| Dark | `#17181b` | `#0f1d39` | `#152953` | `#1d3c7c` | `#1d3c7c` | `#a0c1ff` | `#a1a5ab` | `#ececef` |

The dark scheme follows the same principle as the light one, rather than inverting it: farther planes move towards the ground colour (§7).

### 3.5 Contrast (computed for all seven themes; the lowest ratio across them)
Requirements:
- **graphics:** at least 3:1 (WCAG 1.4.11)
- **labels:** at least 4.5:1 (WCAG 1.4.3)

| Pair | Minimum | Light | Dark |
|---|---|---|---|
| `subject` on `ground` | 3:1 | 5.00 | 9.48 |
| `subject` on `far` | 3:1 | 4.69 | 9.07 |
| `subject` on `mid` | 3:1 | 4.29 | 7.74 |
| `subject` on `near` | 3:1 | 3.66 | 5.69 |
| `subject` on `subject-fill` | 3:1 | 4.29 | 5.69 |
| `ink` on `ground` | 3:1 | 17.01 | 15.06 |
| `ink` on `near` | 3:1 | 12.01 | 8.54 |
| `context` on `ground` | 3:1 | 3.65 | 7.17 |
| `context` on `far` | 3:1 | 3.38 | 6.63 |
| `context` on `mid` | 3:1 | 3.08 | 5.59 |
| `label` on `ground` / `far` / `mid` / `near` | 4.5:1 | 17.01 / 15.75 / 14.36 / 12.01 | 15.06 / 13.91 / 11.73 / 8.54 |
| `label-soft` on `ground` / `far` / `mid` | 4.5:1 | 7.22 / 6.69 / 6.10 | 7.74 / 7.15 / 6.03 |

**Two pairs fail, so they aren't allowed** (the validator rejects them):

| Pair | Lowest ratio | Rule |
|---|---|---|
| `context` on `near` | 2.58 (light) | Lines on the near plane use `ink` or `subject` |
| `label-soft` on `near` | 4.39 (dark) | Labels on the near plane use `label` |

### 3.6 Forced colours (Windows High Contrast)
Figures set `forced-color-adjust: none` and map every role to a system colour explicitly, under `@media (forced-colors: active)` [F: MDN `forced-colors`]. That way, the meaning carried by line weight and dashes survives, and no tonal fill turns into an unreadable block.

| Role or material | Forced colours |
|---|---|
| `ground`, every plane fill, `subject-fill` | `Canvas` |
| Plane outlines (where a plane has a visible edge) | `GrayText`, hair line |
| `subject` | `CanvasText` |
| The focal element | `Highlight`, one line weight heavier |
| `context`, `ink` | `CanvasText` |
| `label`, `label-soft` | `CanvasText` |
| `receded` elements | `GrayText` |
| The focus ring | `Highlight` |
| Dashes | Kept |
| `lit`, `translucent` and textures | Become `line` (stroke only), with no gradient, transparency or texture |

### 3.7 Emphasis levels (resolved by S1, set by S4)
| Level | Colour | Line weight |
|---|---|---|
| `focal` | The role as defined (only one focal element or group per state) | One step heavier |
| `normal` | The role as defined | As defined |
| `receded` | The **neutral** step with the same index (subject 600 becomes neutral 600, and so on) | One step lighter |

**Why the neutral swap:** a receded element keeps its lightness, so it stays legible: receded subject on ground is 5.27:1 in light and 9.83:1 in dark [F, computed]. Fading it towards the ground would drop it below 3:1 (1.8–2.1:1 for a 50–60% mix [F, computed]). The existing MCII "aside" picture fades to 45% opacity [F: `mcii-path-scene.ts`]; the swap replaces that.

**What may recede:** context and supporting elements. An element that stands for something the participant hopes for or values never recedes, because a neutral swap turns it grey and grey reads as loss (`visual-policy.md` §3.9). A `context` element is already neutral, so it recedes by weight only.

---

## 4. Line

### 4.1 Weights
| Token | Width (CSS px, at every figure size) | Typical use |
|---|---|---|
| `hair` | 1 | Far plane edges, leader lines |
| `fine` | 1.5 | Mid plane, secondary detail |
| `regular` | 2 | Near plane, context lines; the same weight as the icons at 24 px [F: `icon.ts`] |
| `strong` | 2.5 | Subject lines; the intended line |
| `bold` | 3 | The focal subject |

- **Fixed weights:** lines keep their width at every figure size (`vector-effect: non-scaling-stroke` in SVG; the Canvas and GPU backends divide by the drawing scale). A 480 px figure and a 960 px figure therefore have the same line language.
- **Ends and joins:** round caps and round joins everywhere, continuing the icon language.

### 4.2 Weight by depth plane
`far` uses `hair` · `mid` uses `fine` · `near` uses `regular` · `subject` uses `strong`, or `bold` when focal. Thinner farther lines are one of the depth cues (`visual-policy.md` §3.3).

### 4.3 Dashes (meaning only, never decoration)
| Token | Pattern | Meaning |
|---|---|---|
| `intended` | 7 on, 7 off (the existing MCII bridge [F]) | Planned, not yet done |
| `tentative` | Round dots: 0.1 on, 6 off, round caps | Uncertain or possible |

[A] How dash lengths behave with non-scaling strokes differs between browsers. This is verified in v0.1, and the dash lengths are fixed in CSS px if needed.

## 5. Materials (all matte)
| Material | What it is | Status |
|---|---|---|
| `line` | A stroke only; the ground shows through | NOW |
| `tonal` | A flat fill from the role, optionally with a stroke | NOW |
| `solid` | A small mark filled in the role's line colour, with no stroke (dots, the centre of a marker) | NOW (pulled by `mcii.path@2`) |
| `lit` | A gradient along the platform light (§6): base step −1 on the lit side, base step +1 on the shaded side. The subject's only | Built (M3, 2026-11-11) |
| `translucent` | Area 400 at 35% opacity (light), area 600 at 40% (dark). An overlap is drawn as its own shape with a defined tone (`overlap`: area 400 at 58%, 600 at 64%), never left to blending, so it stays predictable in forced colours | Built (M3, 2026-11-11) |
| `shadow` | The contact shadow of §6, as a material on an ellipse under its object: the tone held across the middle, fading to nothing at the edge | Built (M3, 2026-11-11) |
| Ground texture | A pre-generated grain tile, at most 6% opacity, on the ground and large planes only | Built (M3, 2026-11-11): fine seeded dots at 5%, off unless a figure asks for it (`grain`) |

## 6. Light
| Token | Value | Notes |
|---|---|---|
| Direction | Azimuth 315° (from the upper left), elevation 45° | The same in every scene and area [J] |
| Shading | Lit side: base step −1. Shaded side: base step +1 | The same rule in dark mode: the ladder runs the same way |
| Contact shadow | A soft ellipse 0.9 × the object's width and 0.12 × that width high, drawn as a radial gradient (no blur filter) | Light: neutral 900 at 10% at the centre. Dark: black at 35% |
| Never | Specular highlights, glare, rim light, long cast shadows, drop shadows on flat shapes | `visual-policy.md` §3.7 |

## 7. Depth
| Plane | Fill (light / dark) | Edge (light / dark) | Line | Typical scale [J] | Position |
|---|---|---|---|---|---|
| `far` | 050 / 950 | 200 / 800 | `hair` | 0.5 | Highest, nearest the horizon |
| `mid` | 100 / 900 | 300 / 700 | `fine` | 0.75 | |
| `near` | 200 / 800 | 400 / 600 | `regular` | 1 | Lowest |
| `subject` | role `subject` / `subject-fill` | — | `strong` / `bold` | — | In front of the plane it stands on |

- **Plane edges** are the top silhouette of a plane, two steps darker than its fill (lighter in dark mode).
- **They're decorative:** essential information never depends on them, so they have no contrast requirement. Under forced colours they become `GrayText`.

**Aerial perspective is built into the ramps.** Farther planes are closer to the ground colour in lightness and lower in chroma: light far is *C* ≤ 0.02, near is *C* ≤ 0.06 [F, computed]. In dark mode, the far plane is the closest to the dark ground in the same way. Scenes don't tune this themselves.

## 8. Geometry and form
| Rule | Value |
|---|---|
| Scene units | One unit = 1 CSS px at the figure's design width |
| Construction grid | 8 units; half-step 4 units for detail |
| Radii | 2, 4, 8, 16 units |
| Proportions | 1:1, 1:2, 2:3, 3:4, and the golden ratio for frame divisions |
| Curves through points | Centripetal Catmull-Rom (α = 0.5) converted to cubic Béziers, so every curve is tangent-continuous and has no loops or cusps |
| Soft constructed forms | Superellipse, exponent 4 (between a rounded rectangle and a circle) |
| Organic forms | Seeded value noise: at most 3 octaves, persistence at most 0.5, lowest-octave amplitude at most 12% of the form's extent. The seed is pinned per scene |

## 9. Typography in figures
| Token | Value |
|---|---|
| Face | The page's system UI stack [F: `styles.css`] |
| `label` | 14 px, weight 400, colour `label` (the existing MCII labels [F]) |
| `label-soft` | 13 px, weight 400, colour `label-soft` |
| Line height | 1.2 |
| Placement | Horizontal only; at least 8 units from any form it doesn't name |
| Wrapping | Built (M3, 2026-11-11): a label with a `width` wraps at spaces, never inside a word. Lines are measured with the face's advance widths (Segoe UI) plus 8% for wider system faces, so a line may break a little early but never runs past its width [J] |
| Halo | Built (M3): a 4-unit stroke of the ground colour behind the glyphs (2 units show around them), for a label over a plane or across its edge [J] |
| Clearance check | Built (M3): the validator lists a label closer than 8 units to a form it doesn't `names` as a warning in the Lab. A plane counts by its lines, a label with a halo may cross a plane's edge, and a form hidden under an opaque form that holds the label doesn't count |

## 10. Motion
| Token | Value | Use |
|---|---|---|
| `quick` | 150 ms | Small confirmations; matches the app's one existing transition [F] |
| `moderate` | 300 ms | Value changes in instruments; recede |
| `deliberate` | 600 ms | A form appearing between steps |
| `slow` | 900 ms | Drawing a long path; the upper limit between steps |
| `ease-arrive` | `cubic-bezier(0.2, 0, 0, 1)` | Arrivals: quick start, long calm settle |
| `ease-depart` | `cubic-bezier(0.3, 0, 1, 1)` | Departures |
| `ease-move` | `cubic-bezier(0.4, 0, 0.2, 1)` | Something already visible moving |
| Stagger | 60 ms, at most 3 elements | |

**Effects:**

| Effect | What changes | Typical preset |
|---|---|---|
| `fade` | Opacity 0 → 1 (or 1 → 0) | `quick` / `moderate` |
| `rise` | Moves up 8 units from below its place while fading in | `deliberate` |
| `draw` | A reveal fraction 0 → 1 along the line's direction (left to right for paths). Dashed lines are revealed through a mask, so the dashes don't crawl | `deliberate` / `slow` |
| Emphasis change | An element that stays eases from one emphasis to the other: line weight and colour (§3.7). Built for MCII as the form of `recede` | `moderate`, `ease-move` |
| `recede` | A cross-fade to the `receded` emphasis (§3.7). Not built: the emphasis change covers what MCII needs | `moderate` |
| Move (M5) | In a figure built from data, an element that `moves` glides to its new shape, place and paint; all of them in one change move together. A shape that can't morph (a path with other commands) crossfades | `moderate`, `ease-move` |

**Under reduced motion,** every timeline is empty and the final state appears at once. No bounce, overshoot, elastic, spin or looping.

**Departures** happen at once (as built): nothing so far needs a departure to be understood, and the page changes at the same moment. The presets live in `styling/vocabulary.ts` (`MOTION_EFFECTS`, `EMPHASIS_CHANGE`).

## 11. Area themes
**The forms below are options, not obligations** (revision 2, `visual-policy.md` principle 6). A form is used only when a scene can name what it tells the participant. The hue and the line language are what make an area recognisable; ridges, lenses, rings or terrain are not added for atmosphere. The Action terrain, for example, was tried in `mcii.path@1` and removed, because it carried no meaning.

| | Action and growth | Cognitive shifts | Attention | Emotional regulation | Recovery after setbacks |
|---|---|---|---|---|---|
| Ramp | `action` | `cognitive` | `attention` | `regulation` | `recovery` |
| Idea family | Paths, terrain, horizon, direction | Lenses, views, relations | Precision | Rhythm, breath, containment | Interruption and return |
| Constructed : organic [J] | 50 : 50 | 70 : 30 | 100 : 0 | 40 : 60 | 50 : 50 |
| Forms | A receding path (curve), low ridges (noise), markers (circles) | Circles and overlapping lenses, soft forms for situations, equal-weight links | Exact primitives on a neutral field, a grid | Exact concentric rings, slow waves, soft masses | Terrain; a line that pauses and continues; a bearing re-established (an arc) |
| Materials | `tonal`, `line` | `translucent`, `line` | `line` only | `tonal`, `lit` | `tonal`, `line` |
| Light | Platform light, clear | Platform light, diffuse: lit and shaded half a step apart | Flat, no shading | Platform light, soft | Platform light, clear |
| Motion character | One purposeful reveal (`rise`, `draw`) | Focus shifts (`recede`), gliding placement | Only the stimulus moves, under its protocol | Slow and regular (`slow`); a paced rhythm only in a pacer, with a static alternative | Gentle re-orientation (`draw`, `deliberate`) |
| Avoid | Summits, finish lines, trophies, upward arrows of progress | Right/wrong colours, fog implying a hidden truth, magnifying-glass clichés | Any decoration in or near a stimulus field | Good/bad emotion colours, tempo faster than calm breathing, overwhelming water | Broken or shattered objects, failure signs, red |

## 12. Frames
| Ratio | Size at design width | Use | Label zone |
|---|---|---|---|
| `banner` 4:1 | 480 × 120 | Illustrations above a step (the existing MCII figure is 480 × 116 [F]) | Bottom 22% |
| `wide` 2:1 | 640 × 320 | Larger illustrations; instruments with a horizontal layout | Bottom 15% |
| `standard` 3:2 | 600 × 400 | Instruments (maps, boards) | Outside the plot area |
| `square` 1:1 | 400 × 400 | Radial layouts; a pacer | Outside the form |

- **Safe area:** 6% of the shorter side on every edge.
- **Width on the page:** the figure keeps the existing content-column behaviour. The slot's maximum width becomes a per-scene setting (`visual-system.md` §13); the page layout itself doesn't change.

---

## 13. Questions for your review
1. **Hues:** do the five area hues fit their areas? The ones to look at most closely are Recovery (ochre: warm and morning-like, but brown in its darker steps) and Cognitive shifts (violet).
2. **The relation to the UI accent:** should Action share the UI accent's hue, one step softer, with every figure kept below the accent's chroma?
3. **Dark-mode planes:** in dark mode the planes are deep tones of the area hue (navy, deep teal, umber). Should they be more neutral instead?
4. **Line weights:** is the gradient from 1 px (far) to 3 px (focal) right? It matches the existing MCII figure's heaviest line.
5. **Light:** one platform light from the upper left, everywhere?
6. **Texture:** leave it out of v0.1 unless an area study pulls it in (recommended)?
7. **Reserved hues:** rose for Curiosity and green for Learning reinforcement. Green needs care, because the policy bans green-for-good.
8. **Motion:** are the four durations, with 600 ms for a form appearing between steps, right?

## 14. How the values were produced
- **Ramps:** computed from §3.1 and §3.2 by converting OKLCH to sRGB, reducing chroma where a colour fell outside sRGB, and rounding to hex.
- **Contrast:** ratios computed with the WCAG 2.x relative-luminance formula. The existing tokens were measured from `styles.css`.
- **Where the scripts are:** they were run outside the repository. In v0.1 the same checks become a test over `styling/tokens.css`.
