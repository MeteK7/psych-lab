# Change the camera angle: design and build

> **Where it stands (2026-11-16): the exercise is built.** It is under Cognitive shifts, in the topic "When you keep replaying a moment", in the development build only, and runs as practice (Try it) only, like CS1–CS3 and MCII. What the build shows is in §10.
> - **Done:** the figure (`camera-angle.room@2`, R2 accepted) and the `shaded` material (R1 approved), both on 2026-11-16 (`visual-reviews.md` entries 4 and 5); your decisions in §9.9; the build.
> - **Its texts are working texts** (§9.9), provisional until the psychology-trained reviewer and the content review decide. §2 keeps the original approved texts for comparison.
> - **Before release** (§7): the full texts of the remaining sources, the content review (`camera-angle-review-form.md`), your R3 and the psychology-trained reviewer in the test environment, then the "safe unsupervised" rating.
> - **Claim labels:** **[R]** supported by research (§5) · **[D]** a design choice of ours, not tested by any research.
> - The CS proposal listed self-distancing as "What would you tell a friend?" (CS6), "Not separate: used as a lens inside CS1 and CS2" (`cognitive-shifts-proposal.md` §4). This exercise is a different variant: a change of visual vantage on your own moment, not advice to a friend. CS1's lens is unchanged.
> - **"The build"** here means building this exercise; it is not the platform's Stage 2 in `plan.md`.

**History**
- **2026-11-16:**
  - You approved `room@2` (R2) and, separately, the `shaded` material (R1).
  - You decided the open points in §9.9, and the working texts.
  - The main sources were rechecked (§5, `evidence-verification.md`).
  - You authorized the build, and it was built.
- **2026-11-15:** You approved `camera-angle.room@1`. A refinement pass made it `room@2` (§3, "Version 2"), and the six steps were reviewed (§9).
- **2026-11-14:** You rejected `camera-angle.view@1` (an ellipse on a slider read as a UI component, not as a change of perspective), compared three prototyped directions, and chose the room.

## Contents
1. What it is for
2. The exercise, step by step (exact texts)
3. The figure
4. What is recorded
5. Evidence
6. Safety
7. Release gates
8. Questions for the reviewers
9. Review of the six steps: findings and decisions
10. What the build contains (2026-11-16)

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
- **Decided 2026-11-16 (§9.9):** no figure at step 2; it first appears at step 3, starting at position 0, and is shown still at step 4 at the chosen position.

## 4. What is recorded
| | |
|---|---|
| **Saved** (in a research record only; Try it keeps only `visual_source`. Exercises outside the experiment open in Try it only, so today nothing in this row except `visual_source` is ever saved) | upset before and after; position chosen (0–3); "easier to notice" card ids, "own" or "nothing"; vantage at step 5; controllability; completion; `visual_source` = `instrument:camera-angle.room@2;theme:cognitive@1` |
| **Never saved** | the moment, anything written in steps 2 and 4, an own "easier to notice" |

**What it can show:** whether people finish, where they stop, how far back they step, what they tick, and how the rating moves during the exercise. **What it can't show:** whether the exercise helps. The ratings are immediate and self-reported, and are labelled "how it feels right now".

## 5. Evidence
Every source starts as "summary checked" and its line says "suggests". Each is read in full and logged in `evidence-verification.md` before release, or the line is dropped. Both 2026-11-16 passes are logged there, with what each reading changes here. **On screen** (the science explanation) only sources read in full are cited, plus Troy 2013 from CS1; the rows marked *background* below are not on screen.

| Finding | Source | Checked |
|---|---|---|
| Analysing a recalled experience of strong anger or sadness from a distanced view ("take a few steps back… watch the experience unfold") gave less distress straight afterwards than analysing it immersed, with less recounting and more making sense of it. The effects were small to moderate, in students | Kross, Ayduk & Mischel 2005, *Psychol Sci* 16(9):709–715; Kross & Ayduk 2008, *PSPB* 34(7):924–938 | **✔F both** (2026-11-16) |
| A day or a week later, people who had analysed from a distance felt less low on thinking about it again, and had thought about it less often, than those who had analysed immersed (small effects). Straight afterwards, a neutral distraction did as well as stepping back | Kross & Ayduk 2008 | **✔F** |
| People who spontaneously took a distanced view while reflecting on a negative memory reported less emotional reactivity, and in one study less cardiovascular reactivity. Over about 7 weeks they also reported less reactivity and fewer intrusive thoughts. This went with less recounting and more reconstruing, not with avoidance. The distance was measured, not assigned, so it is an association. The authors separate distance while *recalling* a memory (linked to avoidance in PTSD) from distance while *reflecting* on it | Ayduk & Kross 2010, *JPSP* 98(5):809–829 | **✔F** (author manuscript; 2026-11-16; sections in the log) · background |
| Review of the method | Kross & Ayduk 2017, *Adv Exp Soc Psychol* 55:81–136 | Not checked (not openly accessible) · background |
| Asking "why" helped only from a distance. From the immersed view it went with more reliving and more recounting than from a distance. Asking "what" did not help from either view, and up close "what" and "why" were not told apart | Kross, Ayduk & Mischel 2005 | **✔F** |
| Across 230 comparisons, a distant perspective reduced emotional experience (g = 0.52), but less for self-conscious emotions such as shame and embarrassment (g = 0.29) | Moran & Eyal 2022, *Pers Soc Psychol Rev* 26(2) | Abstract (✔A); full text not openly accessible · background |
| Not always replicated: 355 online adults wrote once about an interpersonal conflict in the third person ("you", "she", their name) or the first person. Writing in the third person raised positive feeling but didn't lower negative feeling more than writing in the first person did. This was **distance by pronouns, not a visual vantage point** | Nasarudin, Moeck & Koval 2023, *Cogn Emot* 37(7):1281–1289 | **Preprint read in full** (2026-11-16); the published version not read · background |
| Third-person language is another route to distance | Kross et al. 2014, *JPSP* 106(2):304–324 | ✔F (on file) |
| Writing daily diary reflections in the third person for one or four weeks raised wise reasoning about later conflicts, compared with the first person (small to moderate effects, North American adults). Again distance by pronouns, practised over time | Grossmann et al. 2021, *Psychol Sci* 32(3):381–394 | Preprint, read in part (abstract, introduction, Study 1's sample and procedure, general discussion) · background |
| An observer view of a trauma memory went with more severe PTSD symptoms 12 months later, possibly as avoidance | Kenny et al. 2009, *Psychol Sci* 20(9):1049–1052 | Abstract (✔A); full text not openly accessible · background (the reason for the safety line) |
| 48 US veterans with PTSD analysed why they felt as they did about their worst trauma, from a distance or immersed. From a distance, heart rate and skin conductance didn't rise; immersed, they did. Felt distress rose equally in both. The authors suggest the effect on feelings may not extend to trauma memories, and that distancing in therapy could be harmful as well as helpful | Wisco et al. 2015, *Clin Psychol Sci* 3(6):956–963 | **✔F** (2026-11-16) · background (supports the safety line) |
| Reappraisal skill went with more depressive symptoms when the stress was controllable | Troy, Shallcross & Mauss 2013 | On file (CS1) |

**Science text as built** (`content/science/cs-camera-angle.v1.json`, v1):
- **Research on the method:** Kross 2005 and Kross & Ayduk 2008 (read in full), and Troy 2013 (from CS1). The sources at abstract level were left out of v1.
- **`similar_note`:** no research has tested an on-screen picture like this one, or both views one after the other.
- **About this exercise:** this version hasn't been tested itself.
- **Limits:** small, short-term differences; strong feelings in students, not everyday moments; distraction did as well straight afterwards; not for trauma; if you can act on it, planning a step may matter more; ratings show how it feels now.
- **Candidates for v2, now checked** (each your decision, after the content review):
  - "not always replicated" (Nasarudin 2023, preprint read in full, distance by pronouns)
  - "less for embarrassment and shame" (Moran & Eyal 2022, abstract only, so it would need a full reading first)

## 6. Safety
- **The shared safety line,** word for word: "These exercises are for everyday situations, like learning, work or friends. They aren't for painful experiences such as loss, abuse or health worries, or for times of crisis. If that's where you are, talk to someone you trust or a support line. You can stop at any time."
- **Everyday moments only,** "uncomfortable, not overwhelming". The trauma findings (§5) are the reason, and the science text's limits say so.
- **The high-upset note** at 8 or more never blocks. The threshold is the psychology-trained reviewer's to set.
- **The closing line** is shown to everyone, whatever their rating.
- **Not therapy:** the About page says so; nothing here promises a benefit.

## 7. Release gates
1. **R2** of `camera-angle.room@2` in the Lab: **passed 2026-11-16** (you; `visual-reviews.md` entry 4). **R1** of the `shaded` material: **passed 2026-11-16**, reviewed separately (entry 5). You authorized the build the same day, with the §9.9 decisions and working texts, and it is built on the development branch (§10).
2. **Full texts** of every new source, logged in `evidence-verification.md`, or their lines dropped. **State 2026-11-16:** everything on screen cites only sources read in full, plus Troy 2013 from CS1. Of the background sources in §5, three are read (Ayduk & Kross 2010, Wisco et al. 2015 in full; Nasarudin et al. 2023 as a full preprint), one in part (Grossmann et al. 2021, preprint). Three are not openly accessible (Moran & Eyal 2022 and Kenny et al. 2009 at abstract level; Kross & Ayduk 2017 not checked) and stay off screen unless you obtain them.
3. **Content review** (`camera-angle-review-form.md`, written 2026-11-16): every on-screen text and the picture, for plausibility and for whether anything could feel invalidating or pushy; at least 3 reviewers, one with psychology training who holds the safety veto and the veto on the figures. Not started.
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

## 9. Review of the six steps: findings and decisions (2026-11-15, decided 2026-11-16 in §9.9)
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
- **Decides: You,** with PR: one stand-in room for the first build (recommended; decided in §9.9), with a usability question on whether it got in the way; or, later and as its own proposal, a small choice of settings.

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

### 9.9 Decided by you, 2026-11-16
Product decisions. Where a wording is given, it is a proposal that still goes to the psychology-trained reviewer and the content review (gate 3); the behaviour is decided.

- **`room@2` is approved for the exercise** (R2, `visual-reviews.md` entry 4). The four positions read as the intended progression: your own eyes, then an observer's view, then the wider surroundings.
- **The build waited for R1 of `shaded`**, a separate gate, not implied by the room's approval. R1 was approved the same day (`visual-reviews.md` entry 5), and you then authorized the build.
- **One generic room** (§9.2). It is a stand-in, said explicitly where the figure first appears (step 3), so nobody takes it for a reconstruction of their own memory. Working line (§9.3): "The drawing isn't your moment. It's a stand-in: a room and a few people, to show where you're looking from. Picture your own."
- **No figure at step 2** (§9.3). The person recalls the moment through their own eyes with no drawn stranger competing with their own picture. The figure first appears at step 3, at position 0.
- **Step 2 has an explicit skip** (§9.1). A person can go on without going back into the moment or describing it. Making the field optional is not enough.
  - Proposed line, under the prompt: "If you'd rather not go back into it, skip this step. Nothing later depends on it."
  - Two buttons of equal weight, neither filled: "Next" and "Skip this step".
  - A skip isn't recorded: in the record it looks the same as leaving the field empty, so it adds no new data.
  - Step 6 shows back only what was written, so a skip leaves nothing missing.
- **Step 4 depends on where the person stopped.**
  - **At position 0 (stayed close): options only.** There is no person in the picture to watch, so the observer question doesn't fit.
    - The figure still, at position 0.
    - A neutral introductory sentence, not a question: "Looking at the moment through your own eyes:"
    - The options in the first person: "What led up to it" · "What else was going on for me that day" · "What the others may have been dealing with" · "What I needed just then" · "Something I could do or say about it" · "Nothing looks different from here". This is the §9.4 set, reworded.
    - "Nothing looks different from here" is kept, as a full answer.
    - **No reflection question and no writing field of any kind**, including no "Add your own" field.
  - **At positions 1 to 3 (stepped back): the observer path.**
    - The figure still, at the chosen position.
    - The observer reflection: "Watch it happen to the person in the picture. Why do you think they felt the way they did?", with its optional writing field.
    - Then "What do you notice from here, if anything?", with the §9.4 options in the third person and the "Add your own" field.
  - **Nothing invites them to move.** Step 3 stays as it is ("You can stay close"), and step 5's vantage question is asked either way.
  - **Closing at position 0:** "You looked at it again from your own view. That's a complete way to do this exercise." It replaces the "Stepping back doesn't change what happened…" line, which wouldn't apply.
  - **Why no question at position 0 [D]:** the 2005 study found "what" and "why" asked from the immersed view equally ineffective, so no research favours one question over the other there (§5, checked in full 2026-11-16). Leaving the question out avoids asking "why" up close, where it went with more reliving than from a distance, without claiming that a "what" question helps. It is a design choice, not a research finding.
- **Working texts for the first build: the §9.4 and §9.5 proposals,** not the original §2 wording. They stay provisional until the psychology-trained reviewer and the content review (gate 3) decide; §2 is kept as the approved original for comparison.
  - **Step 4, observer path:** "What do you notice from here, if anything?" and the rebalanced options (§9.4). "That it was one moment, not the whole picture" is dropped.
  - **Step 5:** titled "Where you ended up"; the vantage question first; "Any answer is fine. People picture things differently."; and the neutral comparison: "Earlier you said {before}; now you say {now}. This isn't a score, and no direction is expected." (§9.5).
- **The exercise's intention, to keep in every text and test:**
  - Moving further back is not better, and staying close is a complete answer.
  - The moment doesn't matter less from further away.
  - No feeling or rating is expected at the end. The purpose is to look from another vantage point and perhaps notice more of the context.
  - **Planned check:** a content test that no on-screen text uses improvement words ("better", "calmer", "less", "smaller", "lighter") about the moment or the person, except the closing's "lighter, the same or heavier".

## 10. What the build contains (2026-11-16)
Development only (`release: 'development'`; the API refuses it in production) and Try it only (`experiment: null`). The texts are the §9.9 working texts, provisional until the psychology-trained reviewer and the content review decide; a change to them is a new content version.

**Where it lives**
- **Area:** Cognitive shifts, a fourth topic, "When you keep replaying a moment".
- **Card:** "Change the camera angle", method "Stepping back (self-distancing)", about 6 minutes.

**The steps as built**
| Step | Id | What it shows | Reported by the step (a research record keeps it; Try it keeps only `visual_source`) |
|---|---|---|---|
| 1 · The moment | `cam_moment` | The safety line; the moment in a few words; the upset scale; at 8 or more, the note (never blocking) | `cam_upset_pre` |
| 2 · Through your own eyes | `cam_own_eyes` | No figure. The prompt, "keep this short", the skip line, an optional multi-line field; "Next" and "Skip this step" as equal buttons | Nothing, whether skipped or not |
| 3 · Step back | `cam_step_back` | The stand-in line; the prompt; the native slider "Where you look from" beside the moving room, loaded on demand (a drag across the picture works too) | `position` (0–3); `visual_source` once the figure has loaded |
| 4 · From here | `cam_from_here` | The room still, at the position chosen. At 0: the lead "Looking at the moment through your own eyes:" and the first-person options only. At 1–3: the observer question with its optional field, then "What do you notice from here, if anything?", the options and "Add your own" | `noticed`: option ids in screen order, plus "own" |
| 5 · Where you ended up | `cam_now` | The vantage question first; "Any answer is fine…"; the upset scale; after rating, the neutral comparison; can you do something about it | `cam_upset_post`; `vantage`; `control` |
| 6 · What you're keeping | `cam_close` | The moment, what was ticked and written (a skipped step 2 shows nothing); "lighter, the same or heavier"; the line for having stayed close or stepped back; the plan line if Yes or Partly. The done screen offers "Plan your first step" in that case | Nothing |

**Files**
- **Exercise:** `web/src/app/experiences/cognitive-shifts/cs-camera-angle.ts`; its state in `cs-store.ts`; its rules in `cs-logic.ts` (`HIGH_UPSET`, `stayedClose`, `canAct`, `noticedRecord`).
- **Shared:** `shared/text-area.ts` (the multi-line field, no length cap); `shared/visual/integration/viewpoint-slot.ts` (loads the moving figure on demand, holds its space, reports what it drew); a `camera` icon in `shared/icon.ts`.
- **Content:** `content/cs-camera-angle.v1.json`; `content/science/cs-camera-angle.v1.json`, with `science/sources-camera-angle.v1.json` (the two Kross papers, read in full). The science text cites only sources read in full, plus Troy 2013 from CS1.
- **Wiring:** `experiences/registry.ts`, `areas.ts`, `flow/conditions.ts`, `flow/session-record.ts`, `flow/session-page.ts`, `api/types.ts`; the API's `schemas.py` and `models.py`; migration `0007` widens the allowed-exercise check, as `0006` did for MCII.

**Tests**
- **Unit:**
  - both paths run through the session page: stepped back, and stayed close with step 2 skipped
  - nothing typed in any saved record
  - Try it sends only `visual_source`
  - never opens outside Try it
  - the rules
  - the content: no internal words; no improvement words about the moment except the two checked exceptions; no question and no field at position 0
  - the science explanation's sources and limits
- **API:** saved in Try it with its picture; a position refused in Try it; refused in the experiment, with a reveal, and in production.
- **Browser, keyboard only:**
  - both paths, with an axe scan on every step, light and dark at step 3
  - reduced motion: the picture cuts
  - the area lists four exercises

**Still open before release** (§7): gates 2–5, the psychology-trained reviewer's §9 decisions, and R3 in the test environment.
