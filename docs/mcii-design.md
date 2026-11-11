# MCII exercise: design proposal

> **Status:** built 2026-11-06, **development only**: shown in the development build, refused by the API in production. Not released until the gates in §7 pass. The plan (revision 2) and the "Look at both" screen were approved; this file holds the exact texts and the corrections from reading the sources (`evidence-verification.md`, "MCII").

## Built (2026-11-06)
Implemented as designed, in the development build only. Changes made while building:
- **The wish is quoted back at steps 2 and 5:** "Your wish: “{wish}”". Without it, a wish rewritten under "Change it" would never appear again.
- **"Change it" rewrites only the wish.** The best part and the obstacle stay as written, and the plan is made for the new wish. Reviewers should say whether that reads naturally.
- **Picturing prompts appear after "Done":** the prompt comes after the person has named the thing, so it doesn't jump into view while they type. The button keeps its place and focus, and changes from Done to Next. There's still no timer.
- **The read-back works the same way,** so a screen reader isn't told the plan again at each keystroke.
- **The plan sentence tolerates the person's own wording:** "If I'm tired." and "Then I will rest!" both become one clean sentence.
- **`visual_source` is saved with step 1,** which is how "what was shown is recorded" works.
- **The area page now hides a topic with no visible exercises,** and a topic can have its own note under the cards.
- **The temporary preview page is gone.**
- **The likelihood questions name the wish (2026-11-06, content `mcii` v2):** they said "how likely do you think it is to happen?". On step 4 the wish wasn't on screen and "What's in the way" sat right above the question, so "it" could be read as the obstacle, which would make the comparison with step 1 unreliable. Steps 1 and 4 now say "that your wish will come true", and step 4 shows the wish first. v1 stays unchanged because practice runs of it exist.

## Contents
1. Corrections to the approved plan
2. Identity and placement
3. Screens and exact texts
4. What is recorded
5. Visual layer and scene policy
6. Science explanation
7. Release gates

---

## 1. Corrections to the approved plan
Reading the full texts changed four things. Everything else stands.

| # | The plan said | Now | Why |
|---|---|---|---|
| 1 | An app sits near the "document" figure, g = 0.28 | **That figure excludes the two largest online trials, which found g = 0.09 and 0.06.** For an app, about g = 0.07 is at least as relevant | Wang 2021, Table 1 and moderator section |
| 2 | Level 4 trial: about 270 or 700 per arm | **Adds a third scenario: about 3,200 per arm for d = .07** (80% power, two-sided α = .05) | Follows from 1 |
| 3 | WOOP = MCII mapping needs a primary source | **Confirmed:** a paper co-authored by Oettingen calls WOOP MCII's colloquial name | Voigt et al. 2022 |
| 4 | Step 3 steers towards inner obstacles | **Kept, but "mostly outside me" now gets its own honest note at step 4,** because the evidence suggests MCII does less for practical constraints | Kizilcec & Cohen 2017 (abstract); `evidence-verification.md` finding 7 |

**The expectancy question:** Wang, Adriaanse and Abdulla & Woods add to the doubt about feasibility-dependent effects, though field trials tested it poorly. This supports the existing rule that a rating never becomes advice. No design change.

**The SCORE report couldn't be found.** Per the plan, I checked whether it changes step 4's wording. It can't change it in the direction of giving advice, because step 4 gives none. The science text says "mixed results" and cites only sources I could read.

---

## 2. Identity and placement
| Field | Value |
|---|---|
| Registry id | `mcii` (`experiment: null`, `release: 'development'`, Try it only) |
| Name | Your wish, and what's in the way |
| Card description | Picture what you want and what gets in the way, then decide what to do about it. |
| Method (card link) | Picturing the obstacle, then planning (MCII) |
| Minutes | 6 (my estimate; usability timing replaces it) |
| Experimental badge | No, matching Cognitive shifts. The science text carries the caveats |
| Area and topic | Action and growth → **Choosing what to go after**: "For something you want, when you're not sure what's in the way or whether to go for it." |
| Note under the card | Practice exercises are saved in My records, without anything you write. They're never part of your experiment. |

**"What happens" (before Begin):**
1. Choose a wish for the next four weeks.
2. Picture the best part of it.
3. Name what's in the way, and picture that too.
4. Look at both, and decide what to do with the wish.
5. If you keep it, make an if-then plan.

---

## 3. Screens and exact texts
"Next" is the button on each screen. All free-text labels end "(only you see this; it isn't saved)". Stop comes from the runner.

### Step 1 of 6: Your wish
- **Safety line:** "This exercise is for everyday wishes, like learning, work, friends or a habit. It isn't for painful experiences such as loss, abuse or health worries, or for times of crisis. If that's where you are, talk to someone you trust or a support line. It also isn't for wishes about changing another person, or for big changes to eating or your body. You can stop at any time."
- **Ask:** "Think of something you'd really like to happen in the next four weeks. It should matter to you and be a challenge, but be possible."
- **Field:** "My wish, in a few words". Example under it: "For example: finish the first draft of my essay."
- **Choice, "What's it about?":** Learning · Work · Friends or family · A habit or routine · Something else
- **Scale:** "How much does this matter to you?" (0 = not at all, 10 = very much)
- **Scale:** "How likely do you think it is that your wish will come true?" (0 = not at all likely, 10 = very likely)

### Step 2 of 6: The best part
- **Shown first:** "Your wish: “{wish}”"
- **Ask:** "What would be the best thing about this wish coming true? Name the one that matters most to you."
- **Field:** "The best part, in a few words"
- **Once written:** "Now picture it. Imagine it happening, as clearly as you can. Take as long as you like."

No timer, and Next is always available. A timed wait would be my invention, with nothing behind it.

### Step 3 of 6: What's in the way
- **Shown first:** "The best part: “{outcome}”"
- **Ask:** "Things can get in the way. What in you is most likely to get in the way of this? It might be a habit, a feeling or a thought."
- **Cards:**
  - I put it off when I'm tired.
  - I get distracted by my phone.
  - I avoid it when it feels hard.
  - I worry about how it will go.
  - I say yes to other things first.
  - My own (opens "What gets in the way, in a few words")
  - It's mostly something outside me (opens "What is it, in a few words")
- **Once chosen:** "Now picture the moment it happens. Where are you? What's going on? Take as long as you like."

### Step 4 of 6: Look at both
- **Shown first:** "Your wish: “{wish}”"
- **Lead:** "Here's what you want, and what's in the way."
- **Picture:** path and wall. **Alt:** "A path leading to a far marker, with a low wall across it."
- **Two labelled blocks, future first:** "The best part" · "What's in the way"
- **If "outside me" was chosen:** "You said this is mostly outside you. A plan can only cover the part you can do something about."
- **Scale:** "Now that you've looked at both, how likely do you think it is that your wish will come true?" (same anchors)
- **Once rated:** "Earlier you said {before}, and now you say {now}. No direction is expected. This shows how it looks to you right now, not whether your wish will come true."
- **Choice, "What do you want to do with this wish?":**
  - **Keep it:** "Go ahead with it as it is."
  - **Change it:** "Make it something you'd rather go for." (opens "My wish now, in a few words")
  - **Set it aside:** "Leave it for now."
- **Under the choice:** "Any of these is a fine answer. This exercise can't tell you whether your wish is realistic. That's up to you."

The picture doesn't react to the choice here, so it can't steer it.

### Step 5 of 6: What you'll do
**Keep or change:**
- **Shown first:** "Your wish: “{wish}”"
- **Lead:** "Plan for the moment it happens."
- **Field "If…":** filled in from the obstacle, and editable.
  - Each obstacle card carries its own "if" wording, so the sentence reads properly: "I'm tired and want to put it off" · "I reach for my phone" · "it starts to feel hard" · "I start to worry about how it will go" · "someone asks me to do something else first".
  - Own or outside: the person's text.
- **Choice, "then I will…":**
  - start with just five minutes.
  - put my phone in another room.
  - ask someone to do it with me.
  - remind myself of the best part.
  - write down one small next step.
  - My own (opens "Then I will, in a few words")
- **Read back, once both are filled in:** "Your plan: If {if}, then I will {then}." followed by "Say it to yourself slowly, once or twice."

**Set aside:**
- "You've set this wish aside. That's a real decision too."
- "You can come back to it whenever you like, or try this exercise with a different wish."

### Step 6 of 6: Keeping it
- **If there's a plan:** the plan again, with the button **Copy my plan** and "It isn't saved here, so copy it if you want to keep it."
- **If there's a plan, scale:** "How ready do you feel to act on your plan?" (0 = not at all, 10 = completely). "This shows how it feels right now, not whether the exercise works."
- **Choice, "How has this left you feeling about the wish?":** More encouraged · About the same · More discouraged
- **If more discouraged:** "Looking closely at what's in the way can feel discouraging, and that's understandable. It doesn't say anything about you. If it stays with you, talk to someone you trust or a support line."
- **Button:** Finish

---

## 4. What is recorded
| Step | Saved | Never saved |
|---|---|---|
| Wish | `category`, ratings `mcii_matter_pre`, `mcii_likely_pre`, `visual_source` | The wish |
| Best part | Step timing only | The outcome |
| Obstacle | `obstacle`: card id, `own` or `outside` | Own text |
| Look at both | `choice`, rating `mcii_likely_post` | A changed wish |
| Plan | `then`: card id or `own` | Both parts of the plan |
| Close | `feeling`, rating `mcii_ready_post` | — |

**What this can show:** whether people finish, where they stop, which options they choose, how ratings move during the exercise, and how often people report feeling discouraged.
**What it can't show:** whether the exercise helps.

---

## 5. Visual layer and scene policy
The contract is in plan §5, and is built in `web/src/app/shared/visual/`. Since MCII step 4d (2026-11-08) the picture is the Visual System scene `mcii.path` (`shared/visual/scenes/action/mcii-path.scene.ts`; reviews in `visual-reviews.md`), bound in `mcii.ts` with `provideSceneVisuals('mcii.path', 'mcii')`. It replaces the built-in `builtin.v1` picture, which production keeps until the merge. `visual_source` now reads like `scene:mcii.path@4;theme:action@1`. When a step shows a different scene from the step before, the change plays (the wall rises; the bridge is drawn; the path to a wish set aside gets quieter), except under reduced motion. The path, wall and bridge illustrate the process. **They aren't part of the method, no research tested them, and the science text doesn't cite them.**

| Scene | Used at | Shows | Must not show | Alt text |
|---|---|---|---|---|
| `mcii.future` | Wish, best part | Path to a far marker | The wish achieved; reward or celebration; the person | A path leading to a far marker. |
| `mcii.contrast` | What's in the way, Look at both | Path, marker and a low wall, with equal weight for marker and wall | A towering or threatening wall; shame; a verdict on the wish | A path leading to a far marker, with a low wall across it. |
| `mcii.plan` | What you'll do, Keeping it (with a plan) | The same, plus a **dashed** bridge over the wall | A solid bridge or a completed crossing, which would suggest it's already solved | A path leading to a far marker, with a low wall across it and a dashed bridge over the wall. |
| `mcii.aside` | What you'll do, Keeping it (set aside) | The same path, quieter (lighter line); the marker keeps its colour | Failure, loss or a blocked sign; the wish greyed out | A faded path leading to a far marker. |

**Rules for any future source:**
- It doesn't depict the person's own wish achieved. Whether such pictures help or harm is unknown; my inference is that they risk the indulging the method warns against.
- The future is always followed by the obstacle, with equal visual weight. The step order guarantees this.
- The picture never reacts to a choice while it's being made.
- Requests carry scene ids only, never typed text.
- Personalised generated images are a research question, tested against no image before being offered.

**Known weakness of the metaphor:** a wall suggests something external, while step 3 mostly asks about the person's own habits and feelings. Usability should check whether this confuses anyone.

---

## 6. Science explanation
The live text is `content/science/mcii.v1.json`; the table below is the approved draft. Only ✔F and ✔A sources appear, and the wording follows the mark. "Found" is used for ✔F and "suggests" for ✔A. Each method line starts by naming its track ("Mental contrasting alone:", "If-then plans alone:", "The two together:"), and a test requires that.

**Why it's worth doing:** "Picturing a future you want can feel good, but on its own it doesn't show you what stands in the way. Looking at the wish and then at the obstacle gives you a clearer picture of both, so you can decide whether to go for it. If you do, you can prepare for the moment the obstacle shows up."

**What you do:** "You picture the best part of a wish, then what's in the way. You decide what to do with the wish, and if you keep it, you make an if-then plan for that obstacle."

**The method: Picturing the obstacle, then planning (MCII):** "This method joins two techniques. Mental contrasting means imagining a future you want, then the obstacle in the present. If-then planning (implementation intentions) means linking a situation to what you'll do: 'If it happens, then I will…'. Together they're called mental contrasting with implementation intentions (MCII). Their everyday form is known as WOOP: Wish, Outcome, Obstacle, Plan. It was developed by Gabriele Oettingen and Peter Gollwitzer and their colleagues."

**Research, each line naming its own track:**

| Track | Layer | Finding | Who | Source |
|---|---|---|---|---|
| Mental contrasting alone | method | "A review of health behaviour research suggests a small-to-moderate effect of mental contrasting over the following weeks." | 12 reports, 1,528 people · clinical, student and general groups | Cross & Sheffield 2019 ✔A |
| If-then plans alone | method | "A review of 642 experiments found that, after allowing for experiments that were never published, the benefit of if-then plans is small. It was close to zero when people didn't strongly want the goal." | 642 experiments · many settings | Sheeran et al. 2025 ✔F |
| The two together | method | "A review of 24 field experiments found a small-to-moderate effect of MCII on reaching goals, and smaller after allowing for likely unpublished results." | 15,907 people · adults, students, children and patients; 87% of them in two online course experiments | Wang et al. 2021 ✔F |
| The two together | method | "Two experiments compared MCII with each part alone. One found MCII ahead of both, by people's own reports. In the other, it was ahead of if-then plans but not clearly ahead of mental contrasting. Neither had a comparison group doing neither, so whether the two parts really add up is still open." | 59 female students, over one week · 66 pairs in a negotiation task | Adriaanse et al. 2010 ✔F; Kirk et al. 2013 ✔F |
| Online, MCII | similar | "Two large online course experiments suggest a very small benefit: more learners from individualist cultures finished, and no difference for learners from collectivist cultures." | 17,963 learners · written online exercise, about 8 minutes | Kizilcec & Cohen 2017 ✔A |
| Online, MCII | similar | "A preregistered online experiment with smokers found no overall difference in cutting down compared with another written strategy." | 325 moderate-to-heavy smokers · 4 weeks, self-reported | Voigt et al. 2022 ✔F |
| Against other planning | similar | "An experiment suggests MCII may be no better than other carefully designed planning methods." | 98 female students · one week | Abdulla & Woods 2021 ✔A |

**About this exercise:** "This exercise follows the structure of MCII, but this version hasn't been tested itself. It's one visit in this app, and it adds a step where you decide what to do with the wish. Some of the research above also used practice rounds, reminders or repeats. The path picture is only an illustration: no research has tested it."

**Limits:**
- "Expect a small effect at most, and only for wishes you really want. The largest online experiments found very little."
- "One idea behind the method, that it helps people commit when success seems likely and let go when it doesn't, has had mixed results. So this exercise never tells you what to do with your wish."
- "It may do less for practical limits, like not having the time or the means, than for things you can prepare for."
- "Little research has looked for unwanted effects, such as feeling discouraged."
- "The ratings show how it feels right now, not whether the exercise works."

---

## 7. Release gates
1. **Sources:** every line ✔A or ✔F. Currently met for the table above. Try to upgrade the four ✔A sources (`evidence-verification.md`, "Still open").
2. **Content review** (`mcii-review-form.md`, results in `mcii-review-results.xlsx`): at least 3 reviewers, including one with psychology training who holds a safety veto. They rate every on-screen text for plausibility or clarity, and for whether it could feel blaming or discouraging.
3. **Usability:** think-aloud sessions (`consent-usability.md`). Check understanding of "future, then obstacle", discouragement, the wall metaphor, and timing against the 6-minute estimate.
4. **Protocol amendment, required before production:** protocol §7 and `classify_exposure` must treat `mcii` as containing the if-then component (plan §6.6).
5. **Tests:** plan §7.
