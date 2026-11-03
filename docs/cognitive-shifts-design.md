# Cognitive shifts: design proposal (Stage 3)

> **Status:** design **approved 2026-11-02 with four changes** (applied below: new science fields only for the three new exercises; temporal distancing cited for CS1 lens 3; a CS1 close for self-judgement readings; "It makes sense that this bothers you" moved off the fit board). Exercises stay development-only until the content review and full-text gates pass. Builds on the approved Stage 2 proposal (`cognitive-shifts-proposal.md`).
> - Nothing here is implemented.
> - The UI previews were shown in chat as temporary prototypes; they aren't part of the code and will be replaced by the real implementation in Stage 4.
> - The reviewer form is `cognitive-shifts-review-form.md`.

## Contents
1. The experience registry refactor, and how the experiment is protected
2. Shared rules for the three exercises
3. CS1 · Other ways to read it
4. CS2 · Why did it happen?
5. CS3 · Not enough to go on
6. Area page and cards
7. Science explanations
8. What is recorded, and what it can't show
9. Release gates: full texts, content review, tests

---

## Built (Stage 4, 2026-11-02)
Implemented as designed, in the development build only. Changes made while building:
- **Safety line:** "like learning, work or friends" instead of "like studying…", because "study" isn't used on screen (content wording test).
- **CS1:** an extra close for when nothing was placed in "Fits": "None of the readings fit right now. That's an honest answer too." It's in the review form.
- **CS3:** readings are shown in a fixed mixed order rather than shuffled (§5.1).
- **"Plan your first step"** is offered on the done screen, after Finish, rather than inside the last step, so leaving for it never leaves an exercise unfinished.
- **The fit board** uses three buttons per card; there's no drag and drop. Radio targets are 24 px, the WCAG 2.2 minimum the browser tests found missing at first.
- **The CS2 "heavy map" step** adds a cause in place, rather than going back a step.
- **Population lines:** where the abstract didn't say who took part or where, the line says "to be confirmed from the full text" instead of guessing.
- **"Write my own" is an option (2026-11-03):**
  - **Rule:** wherever one answer is picked from cards, "My own reading / explanation / cause" is the last option in the same radio group, and choosing it opens the text field. This is the pattern CS3's situation step already used.
  - **Why:** the selection is always visible; nothing is unticked while typing; switching to a card and back keeps the text; and screen readers announce one group.
  - **Exceptions:** multi-select steps (CS2 "Other possible causes", CS3 "How likely is each?") keep their always-visible "add your own" field. With no cards to pick (an own situation in CS3), the field is simply open.
  - **Content versions:** `cs-other-readings` v3, `cs-why-it-happened` v2, `cs-not-enough` v2.
- **Full-text corrections (2026-11-03):** the science texts in §7 are the approved drafts. The live wording, corrected after the full-text check, is in `web/src/content/science/cs-*.v1.json` (see `evidence-verification.md`).
- **"Why it's worth doing" (2026-11-03, all three exercises):**
  - **The part:** after "What you do", an explanation may have a part saying, in everyday terms, why the exercise is worth doing: what goes on when we read an unclear situation, and what the practice is for. It follows the same wording rules (no promises that the exercise works).
  - **CS3 changes:** CS3's method is now "Checking the facts, and finding out" (first renamed "Weighing several readings, and finding out", then changed with the redesign below). Its text explains what happens in your mind, and says this isn't about picking the nicest reading.
- **CS3 redesign (2026-11-03):** built from `cs3-redesign-proposal.md` revision 2. It supersedes §5 below for steps 2–5 and the readings; content `cs-not-enough` v3.
  - **Readings:** by rules (plausible, distinct, covering, same level of detail), five per scenario, and four general ones for an own situation.
  - **Step 3, "Could these explain it?":** the person ticks which other readings could also explain what happened. The facts of the moment ("What happened") are shown next to the question, so it reads as checking whether the facts can tell readings apart, not as CS1's sorting by fit. The note after "Done" reports only the person's own judgements.
  - **Step 4, "Can you find out?":** one choice with a short follow-up. The "ask" example is a suggestion, not a rule.
  - **Step 5:** the certainty question again, without judging the answer, then two questions to keep. A plan link appears after "ask" or "check".
- **CS3 ratings made explicit (2026-11-04, content `cs-not-enough` v4):** both 0–10 ratings stay as a before and after for the same first reading. Step 5, now titled "Your first reading, looked at again", quotes that reading, says other explanations have been checked and that no direction is expected, and shows both numbers once a rating is chosen. The earlier number appears only after rating, so it doesn't pull the new answer towards it. The comparison shows whether self-rated confidence changed, not why.
  - **CS1 and CS2 changes:** the methods are renamed in plain words, with the term in brackets: "Seeing it another way (reappraisal)" and "Looking at all the causes (attributional reframing)". To keep CS1 within 280 words, its method text, Troy and Kross lines, one limit and "About this exercise" are condensed. Their claims are unchanged.
  - **Scope:** the four experiment explanations don't get this part.

## 1. The experience registry refactor, and how the experiment is protected

### 1.1 What changes
- **Today:** "exercise" and "experiment condition" are the same thing. The four condition ids are fixed in:
  - the API schema (`Condition`) and the database check constraint (`ck_sessions_condition`)
  - `flow/conditions.ts` (steps, names, minutes, method)
  - the `@switch` in `flow/session-page.ts`
  - the content map in `flow/session-record.ts`
- **After the refactor:**
  - **One registry** (`web/src/app/experiences/registry.ts`) lists every exercise: id, Area and topic, on-screen name, description, "What happens" lines, minutes, method name and icon, steps, content files, science file, `experimental`, `safeUnsupervised`, and `experiment: 1 | 2 | null`, the experiment phase that compares it.
  - **The four existing entries are moved, not rewritten:** same ids, steps, texts, content files and versions.
  - **Session runner:** renders a step by looking up its component in the registry instead of a hard-coded switch. The existing four step components stay exactly as they are.
  - **API:** the type splits into `ExperimentCondition` (the four, unchanged) and `ExerciseId` (all exercises). `PUT /sessions` accepts any exercise id. Experiment checks stay on `ExperimentCondition`. A **new rule** refuses `self_use` mode or an `n1_reveal_id` for any id that isn't an experiment condition.
  - **Database:** one migration (`0005`) widens `ck_sessions_condition` to include the three new ids. No existing row, column or value changes. The n-of-1 tables don't change.
  - **Unchanged:**
    - the n-of-1 code (`n1.py`)
    - the schedule and its fingerprint
    - the analysis
    - the export
    - all experiment content versions

### 1.2 Tests that prove the experiment behaves identically
These are written **before** the refactor, run green on the current code, then must stay green unchanged afterwards. The refactor is only accepted if no golden file changes.

| Test | What it pins down |
|---|---|
| **Golden saved records** (Vitest, `flow/golden.spec.ts`) | For each of the four experiment exercises, run the session page through a scripted path with a fixed clock, fixed UUID and fixed inputs. Capture **every request body** sent to `PUT /sessions/{id}`: mode, condition, content_versions, step ids, content ids and versions, results, plan, ratings, status, timestamps, n1_reveal_id. Compare with JSON files in `flow/__golden__/` generated from the current code |
| **Golden screens** (Vitest) | The text of every step of the four exercises (headings, instructions, buttons), as a snapshot per step. Any wording drift fails |
| **Experiment mode paths** (Vitest) | The same golden comparison for `self_use` with a reveal id, and for Test mode (`dev` with a reveal) |
| **API compatibility** (pytest) | Existing `test_n1.py` and `test_sessions.py` unchanged and green. New tests: the four condition ids are accepted exactly as before; a new exercise id is refused in `self_use` mode or with a reveal; `n1.export` output for a fixed dataset is byte-identical before and after migration `0005` (SHA-256 compared) |
| **Browser tests** (Playwright) | The existing keyboard-only tests for the four exercises and the sound version run unchanged |
| **Schedule fingerprint** | `schedule-phase1.csv` SHA-256 still `5c22d984…c66c84e` |

### 1.3 Timing and the protocol
- **Phase 1 hasn't started** (no planned days, no production setup). The refactor lands on `test` well before it.
- **Recommendation: finish the refactor and its golden tests before phase-1 day 1,** so the release your experiment starts on already contains it. The experiment then never sees a code change to its exercises mid-phase.
- **No protocol change is needed:** behaviour, content versions, allocation, the n-of-1 logic and the analysis are all unchanged, so protocol §13 gets no new version. I'd record it in the **plan** change log, with the golden tests as evidence.
- **If phase 1 has already started when it's released,** protocol §8 applies: the release is logged with its date as a release during a phase, with the golden tests showing the experiment's exercises are unchanged.

---

## 2. Shared rules for the three exercises
- **Try it only** (`try` mode). Never offered in My experiment; the experiment keeps its four conditions.
- **Fixed durations,** used everywhere (card, preview, science text):
  - CS1 **5 minutes**
  - CS2 **5 minutes**
  - CS3 **4 minutes**
- **Free text is never saved.** Anything a person writes about their own situation is shown back during the exercise only; the saved record holds choices, counts and ratings. This uses the same pattern as the State Reset picture, with a test that the text never appears in any saved record.
- **Every choice offers a way out:** "None of these fit" and "My first reading still seems right" (CS1, CS3); "Nothing to change right now" (CS2).
- **The safety line** appears on each exercise's first step, word for word:

  > These exercises are for everyday situations, like learning, work or friends. They aren't for painful experiences such as loss, abuse or health worries, or for times of crisis. If that's where you are, talk to someone you trust or a support line. You can stop at any time.

- **Controllable situations lead to action.** In CS1 and CS2, a "yes" or "partly" to "Can you do something about it?" ends with a link to "Plan your first step". There's no other cross-Area link.
- **Same building blocks as today:**
  - the step heading "Step x of n: …"
  - 0–10 rating scales built from radio buttons
  - Stop always available
  - keyboard paths for everything
  - no colour-only meaning
  - WCAG 2.2 AA
- **Distinct interactions** (your point 2):

  | Exercise | Core interaction | What the person does with the readings |
  |---|---|---|
  | **CS1** | **Lens cards + fit board:** each lens produces a card; all cards, including the first reading, are placed on a three-column board ("Fits" / "Partly fits" / "Doesn't fit") | Judges **how well each reading fits**; more than one can fit |
  | **CS2** | **Cause map:** causes are placed with three sliders and shown on a two-axis chart | Sorts **explanations** by whether they're about you, lasting, and general |
  | **CS3** | **Share of 10:** the person distributes 10 points of likelihood across competing readings (including "something I haven't thought of"), then chooses how to find out | Weighs readings **against each other as chances**, then looks for real information |

  CS1 is about *meaning* in your own situation (several readings can be true at once). CS3 is about *missing information* in an ambiguous situation (the readings compete; the answer is out there).

---

## 3. CS1 · Other ways to read it

**For:** "I keep seeing this one way." **Method:** reappraisal (cognitive reappraisal), with self-distancing as one lens. **5 minutes.** Six steps.

| Step | Screen (exact texts) | Interaction | Recorded |
|---|---|---|---|
| Preview | **Other ways to read it** · Method link: *Reappraisal*. "What happens": 1. Say how you read the situation now. 2. Look at it through three different lenses. 3. Sort the readings by how well they fit. 4. Rate how it feels now. · "About 5 minutes. You can stop at any time." · Begin / Back · "Why this exercise?" section | — | — |
| 1 · Your first reading | **Step 1 of 6: Your first reading** · *Safety line.* · "Think of an everyday situation you keep seeing one way." · "What does it seem to say? Write it in a few words, or pick one that's close:" · Cards: "It means I'm not good enough." · "It'll always be like this." · "Everyone will think less of me." · "I've ruined it." · Field label: "My first reading (only you see this; it isn't saved)" · Next | Write or pick (one) | Card id or "own" |
| 2 · How it feels | **Step 2 of 6: How it feels now** · "Your first reading: “{reading}”" · Scale A: "How much do you believe this reading right now?" (0 = not at all, 10 = completely) · Scale B: "How upsetting does it feel right now?" (0 = not at all, 10 = extremely) · "Can you do something about the situation itself?" Yes / Partly / No · Next | Two scales, three-way choice | Both ratings; controllability |
| 3 · Three lenses | **Step 3 of 6: Other ways to see it** · Shown one lens at a time ("Lens 1 of 3"):<br>**Lens 1, Other explanations:** "What else could explain what happened?" Cards: "It was harder than it looked." · "I didn't have what I needed this time." · "Other things were going on." · "It's one moment, not the whole picture."<br>**Lens 2, A friend's view:** "If a friend told you this about themselves, what would you say to them?" Cards: "That doesn't sound like the whole story." · "One time doesn't decide it." · "You're being harder on yourself than on anyone else." · "Anyone could struggle with this."<br>Under the cards, a supportive line that is **not** a reading and isn't placed on the board: "It makes sense that this bothers you. That isn't something you need to talk yourself out of."<br>**Lens 3, Later on** (temporal distancing): "In a month, what will probably matter about this?" Cards: "Most of it will have faded." · "What I learned from it." · "Whether I tried again." · "It may still matter, and that's real."<br>Each lens: pick a card, write your own, or "Nothing comes to mind" · Next lens / Next | One reading per lens (or none) | Per lens: card id, "own" or none |
| 4 · Sort them | **Step 4 of 6: Which readings fit?** · "Place each reading where it fits best. More than one can fit, and your first reading can stay where it is." · A board with three columns: **Fits** · **Partly fits** · **Doesn't fit**. Each reading is a card, the first one marked "Your first reading". · Below: "None of these fit" · Next | Each card has three buttons (also arrow keys) to move it; on wide screens cards can be dragged | Column per card (first reading flagged); "none fit" |
| 5 · How it feels now | **Step 5 of 6: How it feels now** · the two scales from step 2, unchanged | Two scales | Both ratings |
| 6 · Close | **Step 6 of 6: What you're keeping** · "Readings that fit: …" (list). If the first reading is in "Fits", one of two closes:<br>• **Self-judgement readings** ("It means I'm not good enough", "Everyone will think less of me", "I've ruined it") **and any own reading:** "It still feels like it fits. You can keep it alongside the other readings that fit." It acknowledges without endorsing.<br>• **Situation readings** ("It'll always be like this"): "Your first reading still fits. That's a real outcome: sometimes the first reading is right." · If the controllability answer was Yes or Partly: "You said you can do something about this. Changing how you see it isn't the goal then; planning a step might help more." with a link to **Plan your first step** · Finish | — | Completion |

**Text and design notes:**
- The lens cards are deliberately mixed: realistic, not cheerful, and some accept the difficulty ("It may still matter, and that's real.", "It makes sense that this bothers you.").
- No card says the problem isn't real.
- "It makes sense that this bothers you" is a supportive line under Lens 2, not a reading: it validates the feeling and can't be sorted as true or false.
- An own first reading gets the acknowledging close, because the app can't tell whether it is a self-judgement.

---

## 4. CS2 · Why did it happen?

**For:** "This proves I can't do it." **Method:** attributional reframing. **5 minutes.** Six steps.

| Step | Screen (exact texts) | Interaction | Recorded |
|---|---|---|---|
| Preview | **Why did it happen?** · Method link: *Attributional reframing*. "What happens": 1. Name a recent mistake or setback. 2. Collect possible causes. 3. Place each cause on a map. 4. Choose what, if anything, to change. · "About 5 minutes. You can stop at any time." | — | — |
| 1 · The setback | **Step 1 of 6: The setback** · *Safety line.* · "Think of a recent everyday mistake or setback, like a test that went badly or a deadline you missed." · Field label: "In a few words (only you see this; it isn't saved)" · Next | Write (required) | — |
| 2 · Your first explanation | **Step 2 of 6: Why do you think it happened?** · "Write your first explanation, or pick one that's close:" · Cards: "I'm just not good at this." · "I didn't try hard enough." · "It was too difficult." · "Bad luck." · Next | Write or pick | Card id or "own" |
| 3 · More possible causes | **Step 3 of 6: Other possible causes** · "Most things have more than one cause. Add at least two more; pick from these or write your own:" · Cards: "How I prepared (my method, not just the time)" · "How much time I had" · "How hard the task was" · "Instructions that weren't clear" · "Being tired or unwell" · "Something new to me" · "Other people involved" · "Chance" · Next (enabled at 3 causes, up to 6) | Pick or write; at least 3 causes in total | Card ids or "own", count |
| 4 · Map the causes | **Step 4 of 6: Place each cause** · For each cause, three five-point sliders:<br>"About me ↔ About the situation"<br>"Lasting ↔ Just this time"<br>"Affects everything ↔ Just this kind of task"<br>A chart beside the sliders places the causes by the first two answers. A text list gives the same information for screen readers ("How I prepared: mostly about me, just this time, just this kind of task") · Next | Sliders (keyboard: arrow keys); chart updates | Three positions per cause |
| 5 · What the map shows | **Step 5 of 6: What the map shows** · Statements chosen by rules, never by judgement:<br>• if any cause is "just this time" or "about the situation": "Some of these causes can change, or depend on the situation, not only on you."<br>• if any cause is "about me" and "lasting": "Some causes may really be about you. That's information, not a verdict on what you can do."<br>• if **all** causes are "about me", "lasting" and "affects everything": "That's a heavy way to see it. Is there any cause that's about this time only? You can go back and add one, or keep the map as it is."<br>Always: "Effort is one possible cause among many. It isn't the answer by default." · Back / Next | Read; optional Back | — |
| 6 · Next time | **Step 6 of 6: Anything to change?** · "Is there one cause you could do something about next time?" · List of the causes marked "just this time" or "about the situation" first, then the rest · "Nothing to change right now" · If a cause is chosen: "Want to plan a first step for it?" with a link to **Plan your first step** · Finish | Pick one or none | Chosen cause's position (not its text); none |

---

## 5. CS3 · Not enough to go on
> **Superseded in part (2026-11-03):** steps 2–5 and the readings now follow `cs3-redesign-proposal.md` revision 2 (see "Built" above; content `cs-not-enough` v3). This section shows the design as first approved.

**For:** "I don't know what they meant, and I'm assuming the worst." **Method:** perspective-getting, with alternative interpretations of ambiguity. **4 minutes.** Five steps.

| Step | Screen (exact texts) | Interaction | Recorded |
|---|---|---|---|
| Preview | **Not enough to go on** · Method link: *Perspective-getting*. "What happens": 1. Pick an unclear situation. 2. Say how you read it, and how sure you are. 3. Share out the chances between possible readings. 4. Decide whether and how to find out. · "About 4 minutes. You can stop at any time." | — | — |
| 1 · The situation | **Step 1 of 5: An unclear situation** · *Safety line.* · "Pick a situation, or describe your own:" · six scenario cards (§5.1) · "My own situation (only you see this; it isn't saved)" · Next | Pick a scenario or write | Scenario id or "own" |
| 2 · First reading | **Step 2 of 5: Your first reading** · "What's your first thought about what it means?" · the scenario's reading cards, or "Write your own" · Scale: "How sure are you of this reading?" (0 = not at all, 10 = completely) · Next | Pick or write; one scale | Card id or "own"; certainty |
| 3 · Share of 10 | **Step 3 of 5: How likely is each?** · "You have 10 points. Share them out by how likely each reading seems. Your first reading is already on the list." · The first reading plus **at least two others** from the scenario's cards (choose which), plus "Something I haven't thought of" · Each row: − / number / + buttons · "Points left: n" · "None of these fit" · Next (enabled when all 10 are placed, or "None of these fit" is chosen) | Distribute exactly 10 points with stepper buttons | Points per reading (card ids) and "something else" |
| 4 · Finding out | **Step 4 of 5: Is there a way to find out?** · "Guessing what someone meant is often less reliable than finding out." · Choices: "Ask them (for example: ‘I wasn't sure what you meant, could you tell me?’)" · "Wait for more information" · "Check something myself" · "It's not worth finding out" · Next | Pick one | Choice |
| 5 · How sure now | **Step 5 of 5: How sure are you now?** · "Your first reading: “{reading}”" · the certainty scale from step 2 · Finish · Close text: "Holding more than one reading open isn't indecision. It's an accurate picture of what you know." | One scale | Certainty |

### 5.1 Scenarios (each needs reviewer approval, §9)
Each scenario has six reading cards: two that lean negative, two neutral, two that lean positive. They are shown in a fixed mixed order (neutral, negative, positive, repeated), so no lean comes first every time and the order is the same for every reviewer.

1. **"Your teacher writes ‘Come and see me after class’ on your assignment."**
   - Negative: "I've done something wrong." · "It's bad news about my grade."
   - Neutral: "They want to explain something." · "They're checking in with several people."
   - Positive: "They want to give me feedback in person." · "They liked something in it."
2. **"A friend hasn't replied to your message for a day."**
   - Negative: "They're annoyed with me." · "They don't want to talk to me."
   - Neutral: "They're busy and haven't seen it." · "They saw it and forgot to answer."
   - Positive: "They're thinking about what to reply." · "They're saving it to answer properly."
3. **"Your manager moves your weekly meeting without saying why."**
   - Negative: "They're unhappy with my work." · "Something bad is coming."
   - Neutral: "Their calendar changed." · "They're rearranging lots of meetings."
   - Positive: "They want more time for my topic." · "They're making room for something useful."
4. **"In a group chat, your suggestion gets no reactions."**
   - Negative: "They think it's a bad idea." · "They're ignoring me."
   - Neutral: "People haven't read it yet." · "Everyone's waiting for someone else to answer."
   - Positive: "They're thinking it over." · "They'll pick it up in the meeting."
5. **"Your essay comes back with: ‘Interesting, but is this the right question?’"**
   - Negative: "The whole essay is wrong." · "They think I missed the point."
   - Neutral: "They want me to sharpen the question." · "It's a standard prompt to think further."
   - Positive: "They found it interesting enough to push me." · "They see potential in it."
6. **"A classmate walks past you without saying hello."**
   - Negative: "They don't like me." · "They're upset with me."
   - Neutral: "They didn't see me." · "They were lost in thought."
   - Positive: "They were in a hurry to get somewhere." · "They meant to say hi later."

---

## 6. Area page and cards
- **Status:** `available`.
- **Intro:** "Exercises for looking at a situation from more than one side, and keeping the reading that fits best, even if it's the first one."
- **Topics and cards:**

  | Topic | Exercise | Card description | Method link | Icon |
  |---|---|---|---|---|
  | **When you're stuck on one reading** · "For situations you keep seeing one way." | Other ways to read it | "Look at a situation through three lenses and sort the readings by how well they fit. About 5 minutes." | Reappraisal | layers of a lens (circle with offset circle) |
  | **After a mistake or setback** · "For when something went wrong and it feels like proof." | Why did it happen? | "Collect possible causes and place them on a map. About 5 minutes." | Attributional reframing | map pin / chart |
  | **When things are unclear** · "For when you don't know what someone meant." | Not enough to go on | "Share out the chances between readings, then decide how to find out. About 4 minutes." | Perspective-getting | question in a speech bubble |

- **Under the cards:** "Practice exercises are saved in My records, without anything you write. They're never part of your experiment."
- **No experiment callout** in this Area.

---

## 7. Science explanations
**Structure:** the existing standard (plan §3.1), with two additions you asked for:
- **Three evidence layers, each under its own heading:**
  - "Research on the method"
  - "Research on similar exercises"
  - "About this exercise"
- **Every finding carries a population and setting line,** shown under the finding, e.g. "170 adults · questionnaire study".

**Implementation note:**
- The two new fields per finding, `layer` (`method` or `similar`) and `who` (population and setting), are added **only to the three new exercises' explanations**. The content test requires them there.
- **The four experiment exercises' science texts and files don't change until phase 2 has ended.** The golden screen tests include their "Why this exercise?" text, so any change fails.

**Wording:**
- All findings below are currently **✔A**, so they use "suggests". Wording is upgraded to "found" only for sources read in full (§9).
- Two sources aren't usable yet. Wang 2021 and the attributional retraining evidence are marked **pending**: they're shown only once read in full, or the line is dropped.

### 7.1 CS1 · Reappraisal
- **What you do:** You write how you read a situation, look at it through three lenses, and sort the readings by how well they fit.
- **The method: Reappraisal (cognitive reappraisal)**
  - How we read a situation shapes how we feel about it. Reappraisal means looking for other realistic ways to read the same situation, not pretending it's fine.
  - One lens asks what you'd say to a friend. Taking a step back like this is called self-distancing.
  - Another asks what will matter in a month. Looking ahead in time like this is called temporal distancing.
- **Research on the method:**
  - "A review of emotion-regulation experiments suggests that reconsidering what a situation means reduces negative feelings, with a small-to-moderate effect, measured straight afterwards." · *Mostly adults in short lab tasks* · Webb, Miles & Sheeran, 2012 (summary checked)
  - "A study of 170 adults suggests reappraisal isn't always helpful: being good at it went with fewer depressive symptoms when stress was out of people's control, but with more when it was within their control. That's why this exercise asks whether you can do something about the situation." · *170 adults · questionnaire study, not an experiment* · Troy, Shallcross & Mauss, 2013 (summary checked)
  - "Experiments suggest that talking about yourself from a distance, using your own name instead of ‘I’, can lower distress in stressful tasks." · *Adults · 7 lab studies, 585 people* · Kross et al., 2014 (summary checked)
  - "Experiments suggest that picturing how a recent stressful event will look from the distant future can lower distress, partly because it draws attention to how temporary the event is." · *7 studies from one research group · who took part and the settings to be confirmed from the full text before release* · Bruehlman-Senecal & Ayduk, 2015 (summary checked)
- **Research on similar exercises:**
  - *Pending:* a large online trial of short written reappraisal instructions (Wang et al., 2021). Shown only once read in full.
- **About this exercise:** This exercise uses reappraisal, but this version hasn't been tested itself. The research above used other instructions and measured feelings right afterwards.
- **Limits:**
  - Effects measured were short-term.
  - Changing how you see something doesn't change the situation. If you can act on it, planning a step may matter more.
  - The before-and-after ratings show how it feels right now, not whether the exercise works.

### 7.2 CS2 · Attributional reframing
- **What you do:** You collect possible causes of a setback and place each one on a map: about you or the situation, lasting or just this time, everything or just this kind of task.
- **The method: Attributional reframing**
  - The explanations we give for setbacks matter. "I'm just bad at this" is about you, lasting and general. Other causes are about the situation, this time only, or this kind of task.
  - Looking at the full range of causes can give a more accurate picture. Some causes may really be about you; that's information, not a verdict.
- **Research on the method:**
  - "A review of 17 evaluations of a school program that, over several sessions, teaches young people to examine their explanations for setbacks suggests that those taking part report slightly fewer low-mood symptoms than those without it, but not fewer than with other active programs." · *Children and adolescents · school groups, multi-session program* · Brunwasser, Gillham & Kim, 2009 (summary checked)
- **Research on similar exercises:**
  - *Pending:* attributional retraining for students (Lazowski & Hulleman, 2016, or a review). Shown only once read in full.
  - Until then: "No study has tested a short, self-guided cause map like this one."
- **About this exercise:** This exercise uses attributional reframing, but this version hasn't been tested itself. The program above ran over many sessions with young people in schools.
- **Limits:**
  - Effects in programs were small.
  - Looking for outside causes can turn into excuses, and looking for inside causes into blame. The map is meant to show both honestly.
  - No evidence yet on whether a single short exercise changes anything.

### 7.3 CS3 · Perspective-getting
- **What you do:** For an unclear situation, you share 10 points of likelihood between several readings, then decide whether and how to find out what was meant.
- **The method: Perspective-getting, and other readings of ambiguity**
  - When information is missing, we often fill the gap with one reading, sometimes the most negative.
  - Two things are known to help: considering several readings, and getting real information instead of guessing what someone else thinks.
- **Research on the method:**
  - "A series of 25 experiments suggests that imagining how someone else sees things doesn't make people more accurate about what they think, and can make them more confident without being more accurate. Asking them helped." · *Adults · lab and online experiments* · Eyal, Steffel & Epley, 2018 (summary checked)
  - "A review of 45 studies suggests that repeated practice at reading ambiguous situations less negatively changes how people read new situations, but has only a small effect on anxiety and low mood." · *Mostly adults · lab and computer training, often several sessions* · Hallion & Ruscio, 2011 (summary checked)
  - "A later review suggests that even these small effects on anxiety and low mood disappear when unpublished studies and outliers are taken into account." · *Adults · 49 controlled trials* · Cristea, Kok & Cuijpers, 2015 (summary checked)
- **Research on similar exercises:**
  - "The training studies above repeated many scenarios over several sessions and always steered towards a positive reading. This exercise does neither: it's one visit, and you decide how likely each reading is."
  - No study has tested this format.
- **About this exercise:** This exercise draws on these methods, but this version hasn't been tested itself.
- **Limits:**
  - Asking isn't always possible or wise.
  - Sharing out chances shows how sure you feel, not what's true.
  - The research on reading ambiguity mostly measured effects in the lab.

---

## 8. What is recorded, and what it can't show

| | CS1 | CS2 | CS3 |
|---|---|---|---|
| **Saved** | first-reading card id or "own"; belief and upset before and after; controllability; per lens card id, "own" or none; column per card; "none fit"; completion | first-explanation card id or "own"; cause card ids or "own"; three positions per cause; chosen cause's positions or "none"; completion | scenario id or "own"; first-reading card id or "own"; certainty before and after; points per reading; "none fit"; finding-out choice; completion |
| **Never saved** | anything written | the setback, own causes | own situation, own readings |

**What it can show:**
- whether people use and finish the exercises
- where they stop
- which options they choose
- how ratings move **during** the exercise

**What it can't show:** whether the exercise helps. Ratings at the end are immediate, self-reported and open to wanting to give the "right" answer. They're labelled "how it feels right now" and never reported as results.

---

## 9. Release gates

**1. Full texts (✔F) before release** (your point 5): each source must be read in full and logged in `evidence-verification.md`, or its line is removed from the explanation.

| Source | Used in | How to get it |
|---|---|---|
| Webb, Miles & Sheeran 2012, *Psychol Bull* 138(4):775–808 | CS1 | Library or author copy |
| Troy, Shallcross & Mauss 2013, *Psychol Sci* 24(12):2505–14 | CS1 | PubMed Central author manuscript (likely) |
| Kross et al. 2014, *JPSP* 106(2):304–24 | CS1 | Author's lab website (likely) |
| Bruehlman-Senecal & Ayduk 2015, *JPSP* 108(2):356–375 | CS1 (lens 3) | Author's website (likely) |
| Wang et al. 2021, *Nat Hum Behav* 5(8):1089–1110 | CS1 (pending line) | Open access, PubMed Central |
| Brunwasser, Gillham & Kim 2009, *J Consult Clin Psychol* 77(6):1042–54 | CS2 | PubMed Central author manuscript (likely) |
| Lazowski & Hulleman 2016, *Rev Educ Res* | CS2 (pending line) | Library |
| Eyal, Steffel & Epley 2018, *JPSP* 114(4):547–571 | CS3 | Author's website (likely) |
| Hallion & Ruscio 2011, *Psychol Bull* 137(6):940–58 | CS3 | Library |
| Cristea, Kok & Cuijpers 2015, *Br J Psychiatry* 206(1):7–16 | CS3 | Open access (likely) |

I'll read whatever is openly available myself. For the rest, put the PDFs in a local folder outside the repository and tell me where they are.

**2. Content review** (`cognitive-shifts-review-form.md`):
- **Reviewers:** at least 3, ideally one with psychology training.
- **What they rate:** every scenario, reading card, lens card and cause card, for plausibility and for whether it could feel invalidating.
- **Decision rule:** a card stays only if its mean plausibility is ≥ 4 of 5 and no reviewer's invalidation concern remains unresolved. Failing cards are rewritten and reviewed again, or dropped.

**3. Tests** (Stage 4):
- the golden experiment tests (§1.2)
- unit tests for each exercise's logic (fit board, cause map rules, the 10-point share)
- "free text never saved"
- science content tests with the new `layer` and `who` fields
- browser tests: keyboard-only path, axe scans, responsive layout at phone width

**4. Product gates:** each exercise gets its "safe unsupervised" flag only after the content review passes; until then it's Try it in development only.
