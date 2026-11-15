# Change the camera angle: design (Stage 1)

> **Status (2026-11-15):** you reviewed and approved `camera-angle.room@1`. A refinement pass made it `camera-angle.room@2` (§3, "Version 2"): the same room, positions and meaning, with the changes listed there, for your look. The six steps were reviewed too: the findings, proposed wordings and the decisions that need you or the psychology-trained reviewer are in §9. The step texts in §2 are unchanged until those are decided. Stage 2 is still not built.
>
> **Status (2026-11-14):** you rejected `camera-angle.view@1` in review (an ellipse on a slider read as a UI component, not as a change of perspective), compared three prototyped directions, and chose the room. The figure is now `camera-angle.room@1` (§3), built in the Visual System and in the Visual Lab for your R1 (the `shaded` material) and R2. The rest of this document (steps, texts, records, evidence, safety) is unchanged.

> **The exercise isn't built.** Its steps, texts and records below are the design for Stage 2, which starts only after your verdict on the figure.
> - It is development-only and Try it only, like CS1–CS3, until its gates pass (§7).
> - The CS proposal listed self-distancing as "What would you tell a friend?" (CS6), "Not separate: used as a lens inside CS1 and CS2" (`cognitive-shifts-proposal.md` §4). This exercise is a different variant: a change of visual vantage on your own moment, not advice to a friend. CS1's lens is unchanged.
> - **Claim labels:** **[R]** supported by research (§5) · **[D]** a design choice of ours, not tested by any research.

## Contents
1. What it is for
2. The exercise, step by step (exact texts)
3. The figure
4. What is recorded
5. Evidence
6. Safety
7. Release gates
8. Questions for the reviewers
9. Review before Stage 2: findings and open decisions

---

## 1. What it is for
- **For:** "I keep replaying a moment, and it still stings." A recent, everyday, uncomfortable moment: a remark in a meeting, an awkward exchange, a small argument.
- **Method:** stepping back (self-distancing). The person goes back to the moment as they lived it, briefly, then steps back until they can see themselves in it, as an observer would, and asks from there why it went as it did [R].
- **Area:** Cognitive shifts, a fourth topic: **When you keep replaying a moment** · "For a moment that still stings when you go back over it." Distancing here serves a new reading of the moment; exercises whose aim is to feel calmer belong to Emotional regulation (`cognitive-shifts-proposal.md` §3).
- **Name and card:** "Change the camera angle" · "Go back over a moment, then step back and look at it as an observer would." · method "Stepping back (self-distancing)" · **about 6 minutes.**
- **What it doesn't claim:** that the person will feel better, or that the exercise works. Stepping back is a way to see more, never a way to feel less or to stop caring.

## 2. The exercise, step by step (exact texts)
Six steps, "Step x of 6: …", Stop on every step, keyboard paths throughout. The id is `cs_camera_angle`, `experiment: null`, `release: 'development'`.

| Step | Screen | Interaction | Recorded (never in Try it) |
|---|---|---|---|
| Preview | **Change the camera angle** · method link *Stepping back (self-distancing)*. "What happens": 1. Pick a moment that still bothers you a little. 2. Go back to it through your own eyes. 3. Step back until you can see yourself in it. 4. Look at it from there. · "About 6 minutes. You can stop at any time." | — | — |
| 1 · The moment | The shared safety line, word for word (§6). "Think of a recent everyday moment that still bothers you a little when you go back over it. Pick one that's uncomfortable, not overwhelming." · Field: "The moment, in a few words (only you see this; it isn't saved)" · Scale: "How upsetting does it feel right now?" (0 = not at all, 10 = extremely) · At 8 or more, below the scale, not blocking: "That sounds like a lot right now. This exercise is meant for smaller things. You can pick a lighter moment, carry on, or stop." | Write (required); one scale | Upset before |
| 2 · Through your own eyes | The figure at position 0 (close up), display only. "Go back to the moment and see it as you saw it then, through your own eyes. What happened? What did you feel?" · "Keep this short. Write it down, or just think it through." · Multi-line field: "What happened, and what you felt (optional; only you see this; it isn't saved)" | Optional writing | — |
| 3 · Step back | The figure the person moves, beside the native slider **"Where you look from"**: "Through your own eyes" · "One step back" · "From across the room" · "From further away". "Take a few steps back, until you can see yourself in it, as if you were watching someone else. Picture it your own way; the drawing is only a sketch. Stop wherever feels right. You can stay close." | The slider, or a drag across the picture (it settles on a position when released) | Position 0–3 |
| 4 · From here | The figure at the chosen position, display only. "Watch it happen to the person in the picture. Why do you think they felt the way they did?" · Multi-line field, optional · "What's easier to notice from here?" (tick any): "What led up to it" · "What else was going on for them that day" · "What the other people may have been dealing with" · "That it was one moment, not the whole picture" · "What they needed just then" · "Nothing looks different from here" · "Add your own" field | Optional writing; multi-select | Card ids, "own", or "nothing" |
| 5 · How it feels now | The same upset scale. After rating: "Earlier you said {before}, and now you say {now}. No direction is expected." · "While you were answering just now, how did you see it?" Mostly through my own eyes / A bit of both / Mostly from the outside · "Can you do something about the situation itself?" Yes / Partly / No | One scale; two choices | Upset after; vantage; controllability |
| 6 · What you're keeping | What they ticked, and anything they wrote, shown back. "Looking closely at something difficult can leave it lighter, the same or heavier. All three happen, and none says anything about you. If it stays heavy, talk to someone you trust or a support line." · "Stepping back doesn't change what happened, and it isn't a way to stop caring about it." · If Yes or Partly: "You said you can do something about this. Planning a step might help more than looking at it again." The link to **Plan your first step** is offered on the done screen, as in CS1 | — | Completion; `visual_source` |

**Why the steps are in this order [D]:**
- In the research, the immersed view is the comparison condition, not a helpful technique, and nobody was asked to take both views in turn (§5). So step 2 is short and only descriptive (what happened, what you felt), with no "why". "Why" is asked only from the distance, where the research found it helps [R].
- The exercise always ends in the distanced view, and never sends the person back in.
- Staying close is a valid answer at step 3, and "Nothing looks different from here" at step 4.
- Step 5's vantage question shows the person how they actually saw it; it isn't a check that they did it right.

**New shared control:** a multi-line text field with no length cap, labelled like the existing fields, in `shared/`. Nothing typed in it is saved or reaches a visual.

## 3. The figure
`camera-angle.room@2` (`web/src/app/shared/visual/instruments/camera-room/room.ts`), drawn moving by the viewpoint figure (`integration/viewpoint-figure.ts`). Its policy header there is normative; this is the summary. It replaces `camera-angle.view@1`, which you rejected on 2026-11-14, after comparing three prototyped directions; you chose this one.
- **Tier:** instrument, a **spatial view** (`visual-policy.md` §3.4): a real room in constructed perspective, and a camera that steps back through it along one path. **Theme:** Cognitive. **Frame:** 960 × 540.
- **The idea in one sentence:** the same moment seen from further and further back, until you see yourself in it and the people and rooms around it.
- **Why a camera in a room:** it is the research instruction itself ("take a few steps back and watch it happen to you"), and the step from 0 to 1 is exactly the change from a field view to an observer view: you appear. The moment is never shrunk as a shape; it is seen from further away, with more of its surroundings in view.

| Position | Slider words | What you see |
|---|---|---|
| 0 | Through your own eyes | The person across the table; of yourself, only your forearms and hands, coming up from the lower edge onto the table |
| 1 | One step back | From behind your shoulder: you, in the picture for the first time, with the person opposite |
| 2 | From across the room | From the far corner, a little higher: the whole room, the table, and a third person at their own desk and screen |
| 3 | From further away | From outside, above the walls drawn cut low: the room among others, someone in the corridor, two people next door, someone in the room behind |

- **People** (`visual-policy.md` §7, the exception for people in a situation): faceless, unexpressive, one neutral build, no clothing, hair, age or gender cues. You are in the area colour, labelled "You" from position 1 on; everyone else is neutral. In forced colours everyone is the text colour, and the label alone tells you apart.
- **Motion:** only the viewpoint moves (§3.12): one eased move to each new position (600 ms for one, 400 ms more for each further one, 1.6 s at most); a drag across the picture moves the camera with the pointer and settles on a position when released; a cut under reduced motion.
- **Version 2 (2026-11-15), refinements to the approved figure:**
  - **"You" from position 1** (it was from 1.5). It sits up to the left of your head at position 1 and to its right from 1.5, sliding over your head between, so it never lands on another person or their shadow.
  - **Your forearms at position 0** reach further onto the table, hands almost together, and the camera looks a little further down: two arms coming up from the lower corners, not two stubs at the edge.
  - **Leaving your own eyes is one move.** Before, the rest of you appeared all at once, a third of the way to position 1, as a head filling a quarter of the picture. Now the camera first rises out of your head, your arms still in view, and you come in from the lower edge as it steps back.
  - **What lies beyond the walls** (the other rooms, the ground outside) is drawn once the camera is above the walls' tops, where they stop hiding it, not at a fixed point just past position 2.
  - **Only the moment's room has a tinted floor.** The rooms around it are drawn by their walls on the ground's own tone, so from furthest back the room of the moment is still the picture's subject. The furthest view is also a little closer.
  - **A faint line where floors meet walls,** so the room's shape reads in light, and in forced colours, where walls and floor are both the page's ground.
  - **A quieter door:** a thin frame and a leaf in the wall's own shade.
  - **Distant people's legs close together gradually** (2026-11-16). Far away, a person's legs are drawn as one form (a gap thinner than a pixel draws differently in SVG and canvas). They used to switch to one form in a single frame during the move from position 2 to 3. Now they close together over a narrow band of sizes, taking 0.14 to 0.28 of a position, depending on the person. The four still pictures are unchanged.
- **What the system gained** (each in the capability log of `visual-system.md`): spatial geometry (S2), the `shaded` material (S1), the room (S3), the viewpoint figure (S9).
- **In the exercise:** step 3 binds the viewpoint figure beside the native slider, exactly as the Lab does (`pages/lab/lab-room.ts`); steps 2 and 4 can show it still, at position 0 and at the chosen position, through the instrument slot. Every word comes from the exercise's content; the Lab passes fixed phrases.
- **Not yet decided:** whether steps 2 and 4 need the figure at all. The words carry those steps without it.

## 4. What is recorded
| | |
|---|---|
| **Saved** (Test mode and usability only; Try it keeps only `visual_source`) | upset before and after; position chosen (0–3); "easier to notice" card ids, "own" or "nothing"; vantage at step 5; controllability; completion; `visual_source` = `instrument:camera-angle.room@2;theme:cognitive@1` |
| **Never saved** | the moment, anything written in steps 2 and 4, an own "easier to notice" |

**What it can show:** whether people finish, where they stop, how far back they step, what they tick, and how the rating moves during the exercise. **What it can't show:** whether the exercise helps. The ratings are immediate and self-reported, and are labelled "how it feels right now".

## 5. Evidence
Every source starts as "summary checked" and its line says "suggests". Each is read in full and logged in `evidence-verification.md` before release, or the line is dropped.

| Finding | Source | Checked |
|---|---|---|
| Analysing a negative experience from a distanced view ("take a few steps back… watch the experience unfold") gave less distress straight afterwards than analysing it immersed, with less recounting and more making sense of it | Kross, Ayduk & Mischel 2005, *Psychol Sci* 16(9):709–715; Kross & Ayduk 2008, *PSPB* 34(7):924–938; Ayduk & Kross 2010, *JPSP* 98(5):809–829; review: Kross & Ayduk 2017, *Adv Exp Soc Psychol* 55:81–136 | Not yet checked; citation details to confirm |
| Asking "why" helped from a distance, and tended towards going over it again when immersed | Kross, Ayduk & Mischel 2005 | Not yet checked |
| Across 230 comparisons, a distant perspective reduced emotional experience (g = 0.52), but less for self-conscious emotions such as shame and embarrassment (g = 0.29) | Moran & Eyal 2022, *Pers Soc Psychol Rev* 26(2) | Abstract |
| Not always replicated: in 355 people writing about a conflict, distanced reflection raised positive feeling but didn't lower negative feeling | Nasarudin, Moeck & Koval 2023, *Cogn Emot* 37(7):1281–1289 | Abstract |
| Third-person language is another route to distance | Kross et al. 2014, *JPSP* 106(2):304–324 | ✔F (on file) |
| Third-person reflection over weeks raised wise reasoning about conflicts | Grossmann et al. 2021, *Psychol Sci* 32(3):381–394 | Abstract |
| An observer view of a trauma memory went with more severe PTSD symptoms 12 months later, possibly as avoidance | Kenny et al. 2009, *Psychol Sci* 20(9):1049–1052 | Abstract |
| In veterans with PTSD, distancing lowered physiological but not felt reactivity | Wisco et al. 2015, *Clin Psychol Sci* 3(6):956–963 | Abstract |
| Reappraisal skill went with more depressive symptoms when the stress was controllable | Troy, Shallcross & Mauss 2013 | On file (CS1) |

**Science text** (`content/science/cs-camera-angle.v1.json`, Stage 2): the three layers, with a `who` line per finding.
- **Research on the method:** Kross 2005/2008, Moran & Eyal 2022, Nasarudin 2023.
- **`similar_note`:** "No research has tested an on-screen picture like this one, or both views one after the other."
- **About this exercise:** "This exercise uses stepping back, but this version hasn't been tested itself."
- **Limits:** effects measured were short-term; smaller for embarrassment and shame; not for painful memories (Kenny 2009); if you can act on it, planning a step may matter more (Troy 2013).

## 6. Safety
- **The shared safety line,** word for word: "These exercises are for everyday situations, like learning, work or friends. They aren't for painful experiences such as loss, abuse or health worries, or for times of crisis. If that's where you are, talk to someone you trust or a support line. You can stop at any time."
- **Everyday moments only,** "uncomfortable, not overwhelming". The trauma findings (§5) are the reason, and the science text's limits say so.
- **The high-upset note** at 8 or more never blocks. The threshold is the psychology-trained reviewer's to set.
- **The closing line** is shown to everyone, whatever their rating.
- **Not therapy:** the About page says so; nothing here promises a benefit.

## 7. Release gates
1. **R1** of the `shaded` material and **R2** of `camera-angle.room@2` in the Lab (you; `@1` approved 2026-11-15). The decisions in §9. Then Stage 2 is built on the development branch.
2. **Full texts** of every new source, logged in `evidence-verification.md`, or their lines dropped.
3. **Content review** (as `cognitive-shifts-review-form.md`): the step texts, the "easier to notice" cards and the closing lines, for plausibility and for whether anything could feel invalidating.
4. **R3 and the psychology-trained reviewer** (veto), in the test environment, before your merge.
5. **The "safe unsupervised" flag** only after the content review.

## 8. Questions for the reviewers
- Do the faceless figures read as people without suggesting anyone in particular, or how anyone feels? (The psychology-trained reviewer's veto applies, `visual-policy.md` §7.)
- Does anything in the room suggest that further back is the right answer, or that the moment matters less from there?
- From furthest back, do the other rooms read as other people's days, or as a distraction from the moment?
- Is a generic room (a table, a desk, a corridor) close enough to everyday moments, or does it narrow what people picture?
- Should steps 2 and 4 show the figure, or only step 3?
- Is 8 the right threshold for the high-upset note, and is its wording right?
- Should step 2 be skippable altogether, for someone who would rather not go back in?

## 9. Review before Stage 2: findings and open decisions (2026-11-15)
A critical read of the six steps in §2, before any of them is built. Nothing here changes §2: each item gives the finding, a proposed wording where there is one, and who decides. **PR** marks a decision for the psychology-trained reviewer; **You** marks a product decision.

### 9.1 Step 2, through your own eyes: should it be skippable?
- **Finding:** it already is, silently: the writing is optional and Next is always there. The step doesn't say so, and a person who would rather not go back in is left to guess.
- **Why skipping is defensible [R]:** in the research the immersed look is the comparison condition, not the helpful part (§5). The moment is already named in step 1, so the distanced "why" in step 4 has something to work on without it.
- **What skipping costs [D]:** the contrast. Stepping back from a view you never took is a smaller step.
- **Proposed line:** "If you'd rather not go back in, go straight on to the next step."
- **Decides: PR.** Not recorded either way: a skip would be new data.

### 9.2 Does the room work for moments that aren't a conversation at a table?
- **Finding:** it fits face-to-face moments (a remark in a meeting, an argument). It fits poorly a message read alone, a mistake nobody saw, a moment in a crowd or on a call. Position 0 always shows someone opposite; step 4 offers "the other people".
- **Kept within the approved design:** one room, as a stand-in, said plainly (9.3). The position names stay ("From across the room" is the figure's word, not a claim about the person's moment).
- **Decides: You,** with PR: one stand-in room for Stage 2 (recommended), with a usability question on whether it got in the way; or, later and as its own proposal, a small choice of settings.

### 9.3 Is it clear the drawing is a sketch, not their memory?
- **Finding:** not early enough. "The drawing is only a sketch" is in the middle of step 3's paragraph, after the figure has already been shown at step 2.
- **Proposed line, at the figure's first appearance, on its own:** "The drawing isn't your moment. It's a stand-in: a room and a few people, to show where you're looking from. Picture your own."
- **A second finding:** showing the figure at step 2 puts a drawn stranger opposite the person while they recall their own moment. A picture competes with a person's own mental image (the mechanism the dot game uses on purpose), and it is the wrong picture for a moment with nobody opposite. **Proposed:** no figure at step 2; the figure first appears at step 3, starting at position 0, and is shown still at step 4.
- **Decides: PR** (the wording), **You** (where the figure appears; §3 lists it as not yet decided).

### 9.4 Step 4's options: balanced and non-prescriptive?
- **Finding 1, the question leads:** "What's easier to notice from here?" presumes something is. **Proposed:** "What do you notice from here, if anything?"
- **Finding 2, the options lean one way:** four of the five substantive options point at something that softens the moment. None lets the wider view confirm the first reading, or point to something to do.
- **Finding 3, one option minimises:** "That it was one moment, not the whole picture" tells the person the moment counts for less, which the exercise must never suggest (§1). **Proposed:** drop it, or PR rewords it.
- **Finding 4, the pronouns blur:** "them" means the person themself in one option and other people in the next.
- **Proposed set** (fixed order, equal weight, every one to the content review):
  - "What led up to it"
  - "What else was going on that day"
  - "What the others may have been dealing with"
  - "What the person in the picture needed just then"
  - "Something I could do or say about it"
  - "Nothing looks different from here" (kept, as a full answer, not a fallback)
  - an "add your own" field
- **Unchanged [R]:** "Why do you think they felt the way they did?" stays in the third person and stays the only "why", asked only from the distance.
- **Decides: PR,** through the content review.

### 9.5 Step 5: do the rating and the vantage question imply that feeling better is required?
- **Finding:** the wording doesn't, but the frame does. A step called "How it feels now" that shows "Earlier you said 7, and now you say 5" reads as the result of the exercise, and makes it an exercise about feeling better. Its purpose is a different reading (§1).
- **What the second rating is for:** in Try it nothing is saved, so its only use to the person is the comparison. In Test mode and usability it is the one sign that a moment got heavier.
- **Proposed, keeping the rating:**
  - title the step "Where you ended up", and ask the vantage question first
  - add under it: "Any answer is fine. People picture things differently."
  - reword the comparison: "Earlier you said {before}; now you say {now}. This isn't a score, and no direction is expected."
- **The alternative:** drop the comparison line, or the second rating, for people; keep the rating in Test mode only.
- **Unchanged:** the question on whether the person can do something about the situation [R, Troy 2013].
- **Decides: PR.**

### 9.6 The closing: supportive without being therapeutic or patronising?
- **Finding:** broadly yes. It is said to everyone, whatever they rated; it doesn't praise or diagnose; "a support line" matches the shared safety line.
- **Two small points:**
  - "it isn't a way to stop caring about it" answers a charge nobody made. **Proposed:** "Stepping back doesn't change what happened, or make it matter less. It's one more way of looking at it."
  - there is no line for a person who chose "Nothing looks different from here". **Proposed,** as CS1 has: "Nothing looked different from further back. That's an honest answer too."
- **Decides: PR.**

### 9.7 Carried over, still open
- **The high-upset note:** the threshold of 8 and its wording. **PR.**
- **The figures:** whether faceless figures read as people without suggesting anyone in particular or how anyone feels (`visual-policy.md` §7; PR has a veto).
- **The other rooms at position 3:** other people's days, or a distraction? **PR and You,** in R3.

### 9.8 What the review did not find
- No claim that the exercise works, and no claim that this figure has been tested: §5's `similar_note` and "About this exercise" say it hasn't.
- The immersed step asks only what happened and what was felt; "why" is asked only from the distance. Both are as designed and should stay.
