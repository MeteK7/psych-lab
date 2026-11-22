# Idiom rules (written before any figure)

The three idioms chosen in D4: spatial scene, kinetic sequence and field. Each is written as rules from a representation to a composition. The study code (`pages/lab/study/idioms/`) implements these rules and nothing more. Its output is the **by the rules** figure. Hand finishing is listed separately, per figure, in `pages/lab/study/finish.ts`.

## Common rules (every idiom)

| # | Rule |
|---|---|
| C1 | **Registers.** `reported` and `implied` statements are drawn as established: solid lines, full tone. A `possible` set is drawn with every member at equal size, weight and distance, in the `tentative` dash or the `translucent` material, never focal. An `unknown` is drawn as open: the property it concerns is left in its neutral form, or the place where an answer would go is drawn only in the `tentative` dash. An `inferred` statement is never drawn |
| C2 | **The own presence** takes the `subject` role, the area colour. Others take `context`. Equal salience means equal size and weight |
| C3 | **Neutral forms.** A presence whose attention or intent is unknown has no facing: a round head, a round form, no direction cue other than reported movement |
| C4 | **Nothing without a statement.** Every element names the statement it stands for, or is a declared neutral base (a ground, a stand-in setting). Its purpose says which |
| C5 | **Frame.** 960 × 540. The 6% safe area is kept clear. At least a third of the frame is calm ground. The light comes from the upper left. Time and order run left to right |
| C6 | **Text alternative.** Written from the statements only: the established ones first, then what is left open, then how many possibilities fit. Nothing inferred |
| C7 | **Coverage.** Every statement is listed as shown (and how) or not shown (and why). Every element is listed with its statement or its neutral base |
| C8 | **Words.** Names come from content keys. A label is drawn only where a form would be ambiguous without it. Possibility wordings stay in the list beside the figure, never in it |

## Spatial scene (S)

Axes: spatial · still · forms · direct, or metaphorical when the representation has a metaphor facet · movable viewpoint.

| # | Rule |
|---|---|
| S1 | **Setting.** A reported setting is built from a small library: a room, a home, an open floor. A stand-in setting is the least specific place that holds the statements, an open floor to a horizon, and the figure's framing words say it is a stand-in |
| S2 | **Presences** are the platform's faceless figures (`generation/spatial/figures.ts`). `passes` puts two walking figures on parallel paths 1.2 m apart, facing their directions of travel. `located-in` puts a seated or standing figure inside the place |
| S3 | **Places in a process** (nothing about people) are shaded volumes on a ground. `flows` between them is a tube along a raised curve; `cycles` closes the tubes into loops |
| S4 | **Objects** are small shaded boxes in reach of the presence that holds them |
| S5 | **What a joined thing carries** (`joins`) is a row of small `lit` beads along the tube after the place where it joins. Where its fate is `unknown`, the beads continue in the `translucent` material |
| S6 | **An absent object** is drawn only as its outline, in the `tentative` dash, where it would be. A dependency in a `path` metaphor is a gate across the way, closed while what it waits for is absent |
| S7 | **Viewpoints.** Each stance in the representation is a key on one camera path. The figure is still; the person moves along the path with a native slider. A move is one movement of the whole view (`VIEWPOINT_MOVE`) and cuts under reduced motion |
| S8 | **One phase.** A still scene shows the phase in which the most established statements hold |
| S2r2 | **Revision 2, after your review of P1 (2026-11-21), replacing S2 for `passes`.** The encounter, not two people. The mover walks along one drawn way that passes close by the one passed: the way is the course the account reports. Only the presence the account says moved walks. A presence whose motion is unknown stands, the declared neutral pose, at the way's edge, square to it. Through your own eyes a standing body is out of view and isn't drawn |
| S7r2 | **Revision 2: the framing rule.** Every camera is computed from what it must show. From a fixed eye, the lens is chosen so the subject fills a set share of the frame's height. Otherwise, the distance is chosen so the people fill half the height with room ahead of whoever moves, and the view is re-aimed at their centre. Nothing is cropped or oversized by construction. "Across" stands square to the mover's course, so the course runs left to right, turned a little to whichever side separates the two people more |
| S8r2 | **Revision 2: the moment depends on the stance.** From across: one step past the closest point, the first moment at which "past" is visible. Through your own eyes the passing can't be seen in one still: one step past, the classmate is a metre from your eyes and then out of view. So that stance shows them coming along the way, and moving the viewpoint completes the passing |
| S9 | **Unplaced presences.** A presence whose setting is `unknown` is not placed in the scene. Its absence is stated in the coverage report and the text alternative |

## Kinetic sequence (K)

Axes: flat · moving · forms · direct · fixed viewpoint.

| # | Rule |
|---|---|
| K1 | **Ground only.** No ground line, horizon or setting unless one is reported |
| K2 | **Presences** are soft round forms of radius 22 in the `lit` material (own) or `tonal` (others). **Places** are soft tonal planes, in order left to right as the statements first name them, or around a loop for a cycle (K5) |
| K3 | **Timing.** Each phase takes 1300 ms, eased (`move`). A sequence plays once, when asked, and never loops; a native slider scrubs it; it can be paused. Under reduced motion it shows its last frame, and the slider still scrubs (PL-1) |
| K4 | **Traces.** A moving form leaves a hair-line trace of its path so far, so any still frame, the last one included, shows what happened |
| K5 | **Movement by predicate.** `passes`: two paths converge to a closest approach of three form radii and continue, symmetrically. `sends`: a small mark travels on a gentle arc. `flows` and `cycles`: a small form travels a closed loop through the places, one lap per play. `waiting`: a mark travels toward what it waits for and holds at the barrier. `joins`: the joined thing appears at its place and travels with the carrier |
| K6 | **Absent exchange.** Nothing is drawn where an exchange did not take place. Its absence is the empty space between two close forms |
| K7 | **Constant pace.** Forms move at a constant eased pace: a slowing or a hesitation would assert something the text didn't say |
| K8 | **A possibility set** appears after the last phase, around the point its question is about: one small translucent form per possibility, equal, evenly spaced on a ring |
| K9 | **Unknown time.** What is awaited travels a tentative path that stops short of arriving |
| K10 | **A reported feeling** of the own presence is a hair-line ring that closes slightly around it and holds, in the subject role, as strong as its charge |
| K5r2 | **Revision 2 (2026-11-21), for `passes` with a named mover and the other's motion open:** only the mover moves, along a course that comes close past the other's still form, which leaves no trace, and goes on left to right. The closest approach is five radii |
| K11 | **A presence that appears only in an absent exchange** is not drawn: drawing it would add someone for something that didn't happen. A secondary presence is smaller (radius 16); an object is a small solid mark beside whoever holds it |

(K11, F3's details and F7 were written while the rules were coded, before any figure was rendered.)

## Field (F)

Axes: flat · moving when the field facet says it evolves, otherwise still · field · metaphorical, or direct when the field is the thing itself (a flow) · fixed, or movable when the representation has viewpoints.

| # | Rule |
|---|---|
| F1 | **The field is the frame.** Fine lines, flow lines or contours, cover it. A field counts as one form for the element budget (PL-2) |
| F2 | **Qualities to properties.** `clarity`: coherent, parallel lines where statements are established, and lines in the `tentative` dash where things are open. `density`: line spacing. `agitation`: how tight the contours are around the source |
| F3 | **Elements** are at most three small solid marks, where the field has its source |
| F4 | **Established statements resolve the field locally.** Unknowns leave it unresolved. A possibility set is that many headings of equal strength in the unresolved part |
| F5 | **Evolution.** A field that evolves grows once, over at most 6 s, and holds; it never resolves an unknown over time. The same controls as K3 |
| F6 | **Scale.** With viewpoints, each stance is a scale. The field's strength never changes with scale; only the extent in the frame does. A field that calmed as the viewer stepped back would claim an outcome |
| F2r2 | **Revision 2 (2026-11-21), the same case:** only the mover's way is a coherent bundle; the other is a still mark beside it, with a gap of 110 units |
| F7 | **Direction in a still flow** is one fine chevron per segment. A field reaches at most 210 units from its source, so a third of the frame stays calm (C5; PL-2) |

## Revision 3 (2026-11-21, after your acceptance of slice 1)

Hand changes that repeated, or that the review showed to be rules, folded into the rules before any slice-2 figure was drawn:

| # | Rule | From |
|---|---|---|
| S1r3 | The home setting draws the room's own devices: a faint line where the floor meets the walls, the cut top edge of walls drawn low, and its window on the wall the person faces | P2-S2, P2-S3, P2-S4 |
| S7r3 | The framing rule (S7r2) for every stance of every spatial scene: each stance names what it must show and the direction it looks from. Two constants (P2: the held object weighs double in the aim; a fill of half the frame from behind) were set with sight of the accepted figures | P2-S1, P2-S5, M1-S1 |
| K2r3 | A soft contact shadow under each presence | P1-K2, P2-K2 |
| C9 | Places that are parts of one whole (`part-of`, G-27) sit together in every idiom; a cycle through two parts of one whole is two loops meeting there | E1-S1, E1-K1, E1-F1 |

## Slice-2 patterns (written before any slice-2 figure)

The eight new cases bring predicates v0 lacked (`representation.ts`: `reacts`, `contact`, `displaced`, `shifts`, `exceeds`, `behind`, `transforms`, plural presences). Each is a domain-neutral pattern in every idiom.

| # | Pattern | Kinetic | Field | Spatial |
|---|---|---|---|---|
| W | **Waiting on a reply** (`sends` + `exchange-absent` + `waiting`): P3, M2 | The item crosses on an arc; the return arc is drawn only as a tentative line that stops short (time unknown); the possibilities gather on it | As F2 clarity: the sent way is a coherent bundle; around the receiver the field stays unresolved, with one heading per possibility; with no possibilities, the waiting holds the lanes as in M1 | The `path` frame: a way between two stations; the sender at the near end, the receiver at the far end, the item near the receiver; nothing on the way back |
| T | **A move in time** (`shifts`): P4 | A course left to right is time; the item leaves its place, which stays as an outline (it was there), and goes later to a place drawn only in the tentative dash (the amount is unknown) | Parallel lanes are the weeks; the item is a knot in them that has moved later; the empty place opens into the possibilities | The `path` frame: the way is time; an empty outline where the item was, the item further along in the tentative dash |
| G | **A group reacts** (`reacts`, plural): P5 | Forms around a soft plane (the reported place); marks cross from the speakers to the group; a few of the group pulse once, each by itself, toward no one | Ripples spread once from each who speaks; small local ripples around the few who react | A room with a table, everyone seated (the least specific posture in a meeting), faceless; a reaction has no form in a still scene |
| C | **Contact in a crowd** (`displaced`, `contact`, plural `many`): P6 | Many small still forms; only the own form moves (displaced, reported), until it touches the other; a mark crosses (apology); nothing comes back | A still density of dots (the crowd); your mark and the other's touching, a short coherent streak for the displacement | A carriage with rows of seats and many standing figures; you a hand's breadth from the other person |
| X | **A cycle that changes form** (`transforms` with `cycles`): E2 | As the cycle (K5), the travelling form changes shape at each transformation (dots for vapour, a soft cloud, short falling strokes, a solid drop); never the tentative dash or translucency, which keep their register meanings | As the flow (F2 density): spacing carries the form, wide lanes for vapour, close lanes otherwise | As the system (S3); the tube shows the course, not the change of form |
| D | **One exceeds another** (`exceeds`): E3 | Two equal forms grow, one taller; the amount is not given, so the rule fixes it at one third more; then the possibilities gather at the difference | Two vertical bundles of unequal height; the difference opens into the possibilities | A room corner with a window; a pot by the window and one in the corner, the one by the window a third taller |
| L | **Behind plan** (`behind`): M3 | A course; a planned mark (established: a plan is implied); the item stops short of it, the shortfall named in words; then the possibilities gather in the shortfall | Lanes reach short of a planned line; the shortfall opens into the possibilities | The `path` frame: a marker post for the plan; the item on the way, short of it |

**Rules common to the new patterns:**
- An unknown amount (how much later, how much taller) is a fixed rule constant, recorded as a gap, never presented as measured.
- A plural presence of `several` is four forms, and `many` is twelve.
- Who in a group reacts is a fixed choice, the same every time, since the account doesn't say which.

## Revision 4 (2026-11-21, after your acceptance of slice 2)

Each candidate was adopted only after checking that the figures it touches keep or improve their meaning, how easily they're understood, and their composition (`findings-revision-4.md`). Fewer hand changes was not the aim.

| # | Rule | Replaces | Status |
|---|---|---|---|
| R4-1 | F4: open headings start further out (76), reach less far (170), with 4 per possibility, each turning 0.6 of the way round | P1-F1, P3-F1, P4-F1, E3-F1, M3-F1 | Adopted: every figure it touches is identical to the accepted finished figure |
| R4-2 | `above (a, b)` in the representation; the spatial idiom lifts whatever is above something by 1.6 m. The kinetic and field idioms don't enforce it: a cycle's places are drawn higher only because of the loop's order | E2-S1 | Adopted: E2's spatial figure is identical to the accepted finished figure |
| R4-3 | Placement: anything set beside a station is moved clear of everything else at it, checked in frame space from every viewpoint, in 1.3 m steps | M2-S1 | Adopted: M2's spatial figure is identical to the accepted finished figure |
| R4-4 | A treatment for an amount the text doesn't give: (a) the constant with "not to scale", (b) a range, (c) a break | The constants in P4, E3, M3 | **Kinetic: range, adopted (your decision, 2026-11-21).** The range shows only what the text gives: the direction (later), the qualitative relation (taller, by the least visible difference), and an open extent with no far end. **Spatial and field: open.** They keep the constant provisionally, with its limits recorded (`findings-revision-4.md` §4). Idioms may express the same uncertainty differently, provided they keep the same meaning |
| R4-5 | A leaf form in the study kit: nine tapered closed curves on each stem, shaded | E3-S1 | Adopted, for your look: the plants now read as plants; the leaves are dark against the room (`findings-revision-4.md` §2) |

After revision 4, four hand changes remain in 36 figures: P1-K1, P2-K1, E1-S2, P5-S1. None of them repeats.

## Revision 5 (2026-11-22): content independence

Adopted 2026-11-22, after you looked at U1's figures (`findings-revision-5.md` §9). Accepting them doesn't resolve the points questioned there (OI-27 to OI-30).

| # | Rule | Status |
|---|---|---|
| R5-1 | **Composition dispatch.** Each pattern declares what it needs. Every able pattern is drawn, and the one leaving the fewest established statements undrawn wins; ties keep the old order. With none able, the idiom refuses and says what each pattern lacked | Adopted. No corpus figure changed (pinned: `golden.spec.ts`) |
| R5-2 | **Settings by reported place.** The home, the meeting room and the carriage are reached only when the space facet reports that place | Adopted. No corpus figure changed |
| R5-3 | **Form from `form` statements** (v0.2), never from words; a thing with no known feature gets the neutral form, declared in the coverage | Adopted (`kit/forms.ts`) |
| R5-4 | **Motion:** a route (a slope where the start is above the end), a meeting marked at its moment, the thing met moving only from then, its extent open where the text gives none (kinetic: R4-4 range), and the mover drawn open after the meeting when the text says nothing more of it. Spatial: the moment just after the meeting (S8). Field: lanes, and rings spreading from the meeting (agitation only) | Adopted, after your look at U1 (its only figure so far). Open: OI-27 to OI-30 |

## Revision 6 (2026-11-22): coverage from the blind cases

Adopted 2026-11-22, after you looked at U2–U4's figures (`findings-revision-6.md` §9). Accepting them doesn't resolve the points questioned there (OI-31 to OI-35).

| # | Rule | Status |
|---|---|---|
| R6-1 | **Carrying** (motion pattern): things moved by what flows, with no meeting, ride along with it while their statement holds; a question about its motion in a later phase opens its course; height only from an established `above`; a mover with no form is drawn as the extent of its flow; the field draws carrying as density | Adopted (U3, its only figures so far). Open: OI-33 |
| R6-2 | **Dependency:** parts of one whole together (C9), a complete part filled, a dependent part outlined (its state not given), the dependency to a member of a group, an open question as an open ring; no `waiting` or `precedes` needed | Adopted (U4, its only figures so far). Open: OI-32; an outline may read as "not started" |
| R6-3 | **Felt in a place:** the viewer's reported feeling where they are (P2's ring and contours), possibilities after; nothing else placed | Adopted (U2, its only figures so far). Open: OI-32, OI-34, OI-35 |

## Revision 7 (2026-11-22): composition across patterns

Adopted 2026-11-22, after you looked at U5–U7's figures (`findings-revision-7.md` §8). Accepting them doesn't resolve the points questioned there (OI-36, OI-37, OI-39).

| # | Rule | Status |
|---|---|---|
| R7-1 | **Composition:** with no able single pattern, a base pattern (motion, dependency or felt) draws its statements and additions draw the rest onto what it placed; a new thing is set in free space beside what it relates to (room, not nearness); nothing inferred is added | Adopted (U5–U7). A thing with no established form is drawn neutral (your decision). Open: OI-36, OI-37 |
| R7-2 | **Additions:** `located-in`, `part-of`, `depends-on`, `waiting`, `question`, `alternatives`, `form`; in the spatial idiom `waiting`, questions and possibilities stay in the words beside it, and a second place can't go inside a built room | Adopted |
| R7-3 | **Able means drawn:** a pattern whose needs hold but which fails on a case is refused, the failure named | Adopted. Found by U8–U10 (`findings-revision-7.md` §2); the needs themselves stay open (OI-39) |

## Revision 8 (2026-11-22): patterns that know what they draw

| # | Rule | Status |
|---|---|---|
| R8-1 | **Declared lists:** every pattern declares `draws` (the kinds its coverage accounts for: predicates, `question:<asks>` or `question:*`, `alternatives`) and `single` (kinds it takes once). Any drawable statement of another kind, or a repeat of a single kind, is a declared need; inferred statements never count (`draws.ts`) | Adopted under your approved plan; no accepted figure changed |
| R8-2 | **Structural needs found by the probe:** `jostled` (attention questions only about the one held or the group), `cycle` (a fate question only about what joins), motion (`above` only between the route's ends; one `above`), `felt` (the viewer placed once), `pathScene` (waiting and dependence only within a sending; an absent exchange only with a sending or a shift) | Adopted; each refuses no accepted case |

