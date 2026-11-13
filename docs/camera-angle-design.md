# Change the camera angle: design (Stage 1)

> **Status (2026-11-13):** the figure, `camera-angle.view@1`, is built and in the Visual Lab for your R2. **The exercise isn't built.** Its steps, texts and records below are the design for Stage 2, which starts only after your verdict on the figure.
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
| 3 · Step back | The figure the person moves, beside the native slider **"Where you look from"**: "Through your own eyes" · "One step back" · "From across the room" · "From further away". "Take a few steps back, until you can see yourself in it, as if you were watching someone else. Picture it your own way; the drawing is only a sketch. Stop wherever feels right. You can stay close." | The slider, or the figure's bar (drag, press the line, or click the bar and then where it goes) | Position 0–3 |
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
`camera-angle.view@1` (`web/src/app/shared/visual/instruments/view/view.ts`). Its policy header there is normative; this is the summary.
- **Tier:** instrument: the person's position changes the picture. **Theme:** Cognitive. **Frame:** 480 × 240, one frontal view at four distances.
- **The idea in one sentence:** the same moment, seen from further back, with more around it in view.
- **Why a pull-back and not a rotation:** the research's distanced view is "step back and watch", which is a change of distance. One sentence in `visual-policy.md` §3.4 now allows a figure whose idea is the viewing distance to change it; the direction of view never changes. A rotated or raised view would contradict §3.4 and meet the Three.js trigger.

| Position | Slider words | In view |
|---|---|---|
| 0 | Through your own eyes | The moment fills the view. You aren't in it: through your own eyes you don't see yourself |
| 1 | One step back | The whole moment, with you in it (a small solid mark, "You") |
| 2 | From across the room | The other people, beside it (two thin outlines, "Others") |
| 3 | From further away | A line from before to after, through the moment |

- **Motion:** each step glides in 150 ms (it follows the person's input): the moment, the marks and the bar together, as one movement. You fade in; the line from before to after is drawn left to right; the others appear at once. That keeps every change, a jump from end to end included, within three movements. Stepping closer, what is no longer in view goes at once. Under reduced motion every change shows at once.
- **What the system did and didn't need:** nothing was added to the Visual System. There is no camera or zoom in it; the pull-back is the same forms composed again at each distance, which M1 (figures built from data), M4 (a handle with its track) and M5 (glides that follow input) already do.
- **In the exercise:** step 3 binds the figure beside the native slider (`controlledBy="native"`), exactly as the Lab does (`pages/lab/lab-view.ts`); steps 2 and 4 show it through the instrument slot. Every word comes from the exercise's content; the Lab passes fixed phrases.
- **Not yet decided:** whether steps 2 and 4 need the figure at all. The words carry those steps without it.

## 4. What is recorded
| | |
|---|---|
| **Saved** (Test mode and usability only; Try it keeps only `visual_source`) | upset before and after; position chosen (0–3); "easier to notice" card ids, "own" or "nothing"; vantage at step 5; controllability; completion; `visual_source` = `instrument:camera-angle.view@1;theme:cognitive@1` |
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
1. **R2** of `camera-angle.view@1` in the Lab (you). Then Stage 2 is built on the development branch.
2. **Full texts** of every new source, logged in `evidence-verification.md`, or their lines dropped.
3. **Content review** (as `cognitive-shifts-review-form.md`): the step texts, the "easier to notice" cards and the closing lines, for plausibility and for whether anything could feel invalidating.
4. **R3 and the psychology-trained reviewer** (veto), in the test environment, before your merge.
5. **The "safe unsupervised" flag** only after the content review.

## 8. Questions for the reviewers
- Does the smaller moment read as "seen whole", or as "made trivial"?
- Does anything in the figure suggest that further back is the right answer?
- Do the two thin outlines read as other people? Is "Others" enough?
- Should steps 2 and 4 show the figure, or only step 3?
- Is 8 the right threshold for the high-upset note, and is its wording right?
- Should step 2 be skippable altogether, for someone who would rather not go back in?
