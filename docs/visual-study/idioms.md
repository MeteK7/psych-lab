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
| F7 | **Direction in a still flow** is one fine chevron per segment. A field reaches at most 210 units from its source, so a third of the frame stays calm (C5; PL-2) |
