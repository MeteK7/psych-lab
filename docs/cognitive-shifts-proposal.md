# Cognitive shifts: audit, research and Area proposal (Stages 1–2)

> **Status:** proposal, 2026-11-02, **for your review**. Nothing is designed in detail or built. Stage 3 (design) starts only after you approve this.
>
> **Evidence marks** (as in plan.md):
> - **✔A:** the primary record (PubMed abstract and citation) was checked for this proposal.
> - **◐:** found only through secondary summaries or search results; not verified.
> - **✔F:** full text read. **No source here is ✔F yet.**
>
> **T/S/B/P** = changes the target process · immediate state · real-world behaviour · persists.

---

## 1. Audit: what exists and what it means for this Area

**Platform (code):**
- **Areas are data** (`web/src/app/areas.ts`). Cognitive shifts already exists as a *planned* card with the text "Find other ways to see difficulties, mistakes, setbacks and unclear situations." Making it available means adding topics and exercises there; no page code changes.
- **Exercises are not yet a general concept.** Every exercise is one of the four n-of-1 *conditions*:
  - the `Condition` type and the database check constraint on `sessions.condition`
  - fixed step lists in `flow/conditions.ts`
  - a hard-coded switch in `flow/session-page.ts`
  - content mapped per step in `flow/session-record.ts`

  The plan foresaw this: "when there are more than ~5 experiences, a registry must be extracted" (plan §6.1).
  - **Consequence:** Stage 4 starts with a small, separate refactor: an **experience registry**. It holds each exercise's id, Area and topic, steps, content and science files, method name and icon, a "safe unsupervised" flag, and whether the experiment may use it. A migration allows the new ids in `sessions`, while the experiment keeps validating its own four conditions. Existing exercises and the protocol don't change.
- **Reusable as is:**
  - the session runner (preview, Begin, step progress, Stop, saves after each step)
  - rating scales
  - the science explanation standard and section (plan §3.1)
  - the method link on cards
  - the content-versioning and wording tests
  - the browser tests with axe
  - the content review checklist

**Plan:**
- **Interpretation Shift** (plan §3) is already a deferred candidate here: CBM-I, "lab and anxiety", conditional on a scenario review, with a "risk of invalidating people". This proposal replaces it with a broader, reviewed catalogue (§5).
- **Evidence the plan already holds:**
  - reappraisal d+ = .36 (Webb 2012 ✔A)
  - CBM-I for anxiety vs sham SMD −.30, with the reliability undermined by bias and heterogeneity (Fodor 2020 ✔A)
  - "Reappraisal can backfire when the problem is controllable" (Troy 2013, ◐ in the plan, now ✔A)
  - Attributional retraining is listed as background only.

## 2. Research: approaches evaluated

For each approach: the process it targets, what the intervention involves, what it has shown, in whom, how strong the evidence is, the risks, and whether it can be a short self-guided browser exercise. All effect sizes are as reported in the abstracts.

### 2.1 Cognitive reappraisal (reconstrual)
- **Targets:** the appraisal of a situation, in order to change the emotional response to it.
- **Involves:** reinterpreting what the situation means ("reappraising the stimulus"), or one's response to it.
- **Evidence:**
  - **Meta-analysis of experiments:** reappraising the *stimulus* d+ = .36, reappraising the *response* .23, perspective-taking .45 (Webb, Miles & Sheeran 2012, *Psychol Bull* 138(4):775–808, PMID 22582737 ✔A). Mostly short lab inductions; outcomes are immediate emotion.
  - **Brief online format:** a multi-country trial of brief online reappraisal instructions (reconstrual and repurposing) reduced negative and increased positive emotions versus controls (Wang et al. 2021, *Nat Hum Behav* 5(8):1089–1110, PMID 34341554; record ✔A, findings ◐ because the abstract couldn't be read).
  - **mHealth programs:** apps with a reappraisal component, SMD 0.34 over 30 RCTs, but the components are mixed (Morello 2023 ◐).
- **T/S/B/P:** T yes · S small to moderate · B little evidence · P unclear.
- **Risks:**
  - **Controllable problems:** in 170 adults, higher reappraisal ability went with *more* depression when stress was controllable, and less when it was uncontrollable (Troy, Shallcross & Mauss 2013, *Psychol Sci* 24(12):2505–14, PMID 24145331 ✔A; correlational).
  - **Can drift into forced positivity.**
- **Browser fit:** **good**, if the exercise checks controllability and allows the first reading to stand.

### 2.2 Cognitive restructuring (examining an interpretation)
- **Targets:** the believability of a specific negative interpretation.
- **Involves:** identifying the thought, looking at evidence for and against it, and forming a balanced alternative. It's a core component of CBT.
- **Evidence:**
  - **The method:** strong as part of multi-session CBT.
  - **A standalone, single, self-guided session:** no meta-analysis or trial found in this search. **This is a gap.**
  - **Format:** single-session interventions in general, mostly for youth, g = 0.32 over 50 RCTs. It's only 0.14 against active controls, and smaller beyond 13 weeks (Schleider & Weisz 2017, *JAACAP* 56(2):107–115, PMID 28117056 ✔A). That supports the *format*, not this content.
- **T/S/B/P:** T plausible · S unknown standalone · B/P unknown.
- **Risks:**
  - can become rumination, or a debate the user loses
  - can feel invalidating when the evidence does support the first thought
- **Browser fit:** **good as a structure** for weighing interpretations, **weak as a stand-alone claim**. Use it inside another exercise rather than as its own "method".

### 2.3 Attributional reframing and explanatory style
- **Targets:** explanations for failure that are internal, stable and global ("I'm just bad at this, always, at everything").
- **Involves:** considering changeable, specific causes such as strategy, effort, circumstances or timing (attributional retraining). Explanatory-style programs work with the *permanence*, *pervasiveness* and *personalisation* of explanations.
- **Evidence:**
  - **Penn Resiliency Program** (multi-session, youth, explanatory style): depressive symptoms d = 0.11–0.21 over 17 evaluations, and no evidence it beats active controls (Brunwasser, Gillham & Kim 2009, *J Consult Clin Psychol* 77(6):1042–54, PMID 19968381 ✔A).
  - **Attributional retraining in education:** reported as moderate, d ≈ 0.54. That figure comes only from secondary citation of Lazowski & Hulleman 2016 (◐). The plan holds that meta-analysis as ✔A for motivation interventions in general.
- **T/S/B/P:** T yes · S some · B some in education (◐) · P some in education (◐).
- **Risks:**
  - **Blame:** "it was your effort" can read as "you didn't try hard enough".
  - **Self-deception:** pushing external causes ("bad luck") can be self-serving and untrue.
- **Browser fit:** **good**, as an explanation *map*. The person sorts their own possible causes rather than being told the right one.

### 2.4 Self-distancing (including distanced self-talk)
- **Targets:** emotional reactivity and rumination, by viewing one's situation from a distance (third person, an observer, "advise a friend").
- **Evidence:**
  - Using one's own name instead of "I" reduced distress and improved performance in stress tasks, over 7 studies, N = 585 (Kross et al. 2014, *JPSP* 106(2):304–24, PMID 24467424 ✔A).
  - Neural evidence of reduced reactivity without extra effort (Moser et al. 2017, *Sci Rep*, ◐).
  - Meta-analyses report small to moderate effects with risk-of-bias concerns: g ≈ 0.26 over 48 studies, and g = 0.52 for psychological distance (Moran & Eyal 2022), all ◐. A 2022 ERP replication was partial (◐).
- **T/S/B/P:** T yes · S small to moderate · B one lab-task result · P unknown.
- **Risks:** low. Distance can feel cold if it's overdone.
- **Browser fit:** **good as a lens inside exercises** ("what would you say to a friend?"). It doesn't need its own exercise.
- **Overlap:** it's equally an emotion-regulation strategy (§3).

### 2.5 Temporal distancing ("this too shall pass")
- **Targets:** the sense that a setback or stressor is permanent.
- **Involves:** viewing the event from the distant future, which directs attention to its impermanence.
- **Evidence:** over 7 studies, a distant-future perspective reduced distress versus near-future and control perspectives. The effect ran through *impermanence focus*, which was also linked to academic and psychological functioning (Bruehlman-Senecal & Ayduk 2015, *JPSP* 108(2):356–375, PMID 25603380 ✔A). It comes mainly from one lab.
- **T/S/B/P:** T yes · S yes (lab) · B/P not shown.
- **Risks:** it may feel dismissive of something that really does matter. It mustn't say "it doesn't matter".
- **Browser fit:** **good** and short. It matches the illustrative situation "viewing a setback as a permanent conclusion".

### 2.6 Perspective-taking (other people's intentions)
- **Targets:** assumptions about what others think or meant.
- **Evidence:**
  - **For mood:** perspective-taking d+ = .45 (Webb 2012 ✔A).
  - **Against understanding others:** over 25 experiments, being told to *imagine* another person's perspective didn't improve accuracy about their thoughts. It slightly reduced accuracy while sometimes raising confidence. *Getting* their perspective, by asking, did improve accuracy (Eyal, Steffel & Epley 2018, *JPSP* 114(4):547–571, PMID 29620401 ✔A).
- **Consequence:** an exercise that has people imagine what someone else "really meant" could make them more confident in a made-up answer.
- **Browser fit:**
  - Only as **perspective-getting**: generate several possible reasons, hold them loosely, and consider whether and how to ask.
  - "Imagine their mind" on its own is **excluded**.

### 2.7 Ambiguity interpretation and CBM-I
- **Targets:** the habit of resolving ambiguous situations negatively.
- **Involves:** typically many short scenarios over several sessions, in which the person repeatedly completes ambiguous scenarios in a benign direction.
- **Evidence:**
  - **Bias changes reliably:** interpretation bias g = 0.81, but symptoms only g = 0.13, over 45 studies (Hallion & Ruscio 2011, *Psychol Bull* 137(6):940–58, PMID 21728399 ✔A).
  - **Mood:** benign CBM-I lowers negative mood but isn't consistently better than neutral control training (Menne-Lothmann et al. 2014, *PLoS ONE* 9(6):e100925, PMID 24968234 ✔A).
  - **Symptoms:** effects are small and become non-significant after adjusting for publication bias or removing outliers, over 49 RCTs (Cristea, Kok & Cuijpers 2015, *Br J Psychiatry* 206(1):7–16, PMID 25561486 ✔A). For anxiety vs sham, SMD −0.30, with reliability undermined by bias and heterogeneity; depression is inconclusive (Fodor et al. 2020, *Lancet Psychiatry* 7(6):506–514, PMID 32445689 ✔A).
- **T/S/B/P:** T yes (strong) · S small · B/P doubtful.
- **Risks:** classic CBM-I *forces* the benign reading, which conflicts with your boundary that the first interpretation may be right. It works through repetition, not one visit.
- **Browser fit:**
  - **Training format:** poor as a single visit. Defer it to a repeated-practice format with the Personal model, after its own review.
  - **The ambiguous scenario as a prompt to generate interpretations** (not training): good.

### 2.8 Growth-oriented interpretations (growth mindset)
- **Targets:** beliefs that ability is fixed.
- **Evidence:**
  - **Weak overall:** both the mindset–achievement association and intervention effects are weak (Sisk et al. 2018, *Psychol Sci* 29(4):549–571, PMID 29505339 ✔A).
  - **Doubtful for academic effects:** d = 0.05, not significant after correcting for publication bias, and d = 0.02 in high-quality studies. Larger effects came from authors with financial incentives (Macnamara & Burgoyne 2023, *Psychol Bull* 149(3–4):133–173, PMID 36326645 ✔A).
  - **A competing meta-analysis:** d = 0.14 for academic outcomes in targeted subgroups with high-fidelity delivery, d = 0.32 for mental health, with wide prediction intervals (Burnette et al. 2023, *Psychol Bull* 149(3–4):174–205, PMID 36227318 ✔A).
- **T/S/B/P:** T yes · S unclear · B contested · P contested.
- **Browser fit:**
  - **No standalone "growth mindset" exercise,** and no mindset claims.
  - The *content* (a mistake isn't proof of fixed inability) appears naturally in attributional reframing (§2.3), explained by that method's evidence instead.

### 2.9 Considered and placed elsewhere
| Approach | Decision | Reason |
|---|---|---|
| Cognitive defusion, decentering (ACT) | Emotional regulation | Its target is the relationship to thoughts, not their content |
| Benefit finding, "silver lining" | Excluded | High risk of forced positivity and of dismissing real problems |
| Attention-bias modification | Attention, and not justified there either (plan §2.2) | Not about interpretation |
| Memory reconsolidation | Not here (plan §3.2) | Its own future evaluation |
| Self-compassion | Emotional regulation (to be evaluated) | It targets the response to oneself, not the interpretation |

## 3. Scope and identity of Cognitive shifts

**Identity:** Cognitive shifts is about **how a specific situation is read**. It helps you notice your current interpretation of a mistake, setback or unclear situation, generate realistic alternatives, weigh them, and keep whichever fits best. That may be the original one.

**The rule for what belongs here:** an exercise belongs in Cognitive shifts if its *main target is an interpretation, explanation or appraisal*, and its outcome is a revised or confirmed reading. An exercise doesn't belong here just because it involves thinking.

**Boundaries with other Areas:**

| Area | Its target | How overlap is handled |
|---|---|---|
| **Action and growth** | Moving from intention to action | If a situation is **controllable**, a Cognitive shifts exercise ends by offering "Plan your first step" rather than more reinterpretation. Cognitive shifts never duplicates planning |
| **Emotional regulation** | The emotional response itself (distraction, acceptance, breathing, defusion, self-compassion) | Reappraisal and self-distancing serve both. Here they are used to *change the reading of a situation*; exercises whose aim is "feel calmer now" belong to Emotional regulation |
| **Recovery after setbacks** | Reflecting on a setback and returning to goals over time | Cognitive shifts handles *what the setback means* (cause, permanence). Recovery handles *getting back on track*. An attributional exercise may hand over to Recovery once that exists |
| **Attention** | Attention processes | No overlap; attention-bias training is excluded here |
| **Learning reinforcement** | Recall, practice, retention | No overlap |
| *(Memory reconsolidation)* | — | Explicitly not here |

**Area texts (draft, refined in Stage 3):**
- **Card (unchanged):** "Find other ways to see difficulties, mistakes, setbacks and unclear situations."
- **Intro:** "Exercises for looking at a situation from more than one side, and keeping the reading that fits best, even if it's the first one."

## 4. Psychological boundaries applied to every exercise
1. **Realistic alternatives only**, never artificially positive ones. Options are written to be plausible for an ordinary person, and checked by reviewers (§7).
2. **The first reading can stand.** Every choice includes "None of these fit" and "My first reading still seems right". Keeping it isn't a failure.
3. **Interpretation isn't circumstance.** Each exercise asks whether something can be done. If yes, it points to action ("Plan your first step") and says changing the reading isn't the goal.
4. **No blame.** Causes are framed as factors, not faults. Effort is one possible cause, never the default answer.
5. **Feelings and problems aren't dismissed.** No "it doesn't matter" or "look on the bright side".
6. **Everyday situations only:** studying, work, friends, everyday feedback. Never trauma, abuse, grief, health or crisis. A clear line at the start says what this is for, and offers a way out with a support line.
7. **Not therapy, not diagnosis.** No symptom language and no disorder labels.
8. **Free text stays private.** What a person writes about their own situation is shown back during the exercise and **never saved**, like the picture in State Reset.

## 5. Exercise catalogue

| # | Exercise (working name) | Situation | Method | Evidence for method | Comparable implementation tested? | Decision |
|---|---|---|---|---|---|---|
| CS1 | **Other ways to read it** | Stuck on one reading of a difficult everyday situation | Reappraisal (reconstrual), with a controllability check | Moderate for immediate emotion (✔A); brief online format (◐) | Partly: brief online reappraisal instructions (◐) | **First release** |
| CS2 | **Why did it happen?** | A mistake or setback taken as proof of inability | Attributional reframing / explanatory style (permanence, pervasiveness, personal cause) | Small for multi-session programs (✔A); education AR moderate (◐) | Not as a self-guided map; AR usually video or text in class (◐) | **First release** |
| CS3 | **Not enough to go on** | Ambiguous feedback or unclear intentions of others | Generating interpretations for ambiguity, plus perspective-*getting* | Bias change strong but outcome effects small and contested (✔A); perspective-getting beats perspective-taking for accuracy (✔A) | No: CBM-I differs (forced, repeated) | **First release**, with extra review |
| CS4 | **A year from now** | A setback that feels permanent | Temporal distancing (impermanence) | Lab, one research group (✔A) | No | **Second wave** |
| CS5 | Repeated ambiguity practice | Habitual negative reading | CBM-I training | Small, bias-sensitive (✔A) | Lab and app studies (✔A) | **Deferred**: needs the Personal model (repeated sessions) and its own review; replaces "Interpretation Shift" |
| CS6 | What would you tell a friend? | Harsh self-judgement | Self-distancing | Small to moderate (✔A/◐) | Lab | **Not separate**: used as a lens inside CS1 and CS2 |
| — | Growth-mindset exercise | — | Mindset intervention | Weak, contested (✔A) | — | **Excluded** as a standalone exercise |
| — | Silver lining | — | Benefit finding | — | — | **Excluded** |

**Why these three first:**
- **Distinct processes and formats:** CS1 generates and weighs alternative readings, CS2 maps causes on dimensions, CS3 holds several explanations open and plans how to find out.
- **Coverage:** together they cover four of your six example situations directly: mistakes as inability, failure predicting future failure, ambiguous feedback, others' intentions. The fifth, being stuck on one reading, is CS1 itself. The sixth, setbacks as permanent, is partly CS2 (permanence) and fully CS4.
- **Honest evidence:** each method has abstract-checked evidence, and the gaps (no tested comparable implementation) are explicit.

## 6. First-release exercises in outline
Full screens, texts and journeys come in Stage 3. All three run in Try it; durations are estimates.

### CS1 · Other ways to read it (about 4–5 min)
- **Objective:** loosen the grip of one interpretation by generating and weighing realistic alternatives, without pushing a positive one.
- **Steps:**
  1. **Choose the kind of situation:** studying, work, friends or family, or something else everyday. The safety line is shown here.
  2. **Your first reading:** write it in a few words (never saved), or pick a common pattern such as "It means I'm not good enough" or "It'll always be like this".
  3. **Rate it:** how much you believe the first reading, and how upsetting it is (0–10).
  4. **Can you do something about it?** (yes / partly / no)
     - If yes or partly: note that the aim isn't to talk yourself out of it, and offer "Plan your first step" at the end.
  5. **Other readings, through three lenses** (one at a time; write or pick):
     - "What else could explain this?"
     - "What would you say to a friend in the same spot?" (self-distancing)
     - "What will matter about this in a month?"
  6. **Weigh them:** mark which seem realistic, including "None of these fit" and "My first reading still seems right".
  7. **Rate again:** belief in the first reading, and how upsetting it is.
  8. **Close:** a summary of the readings you kept. If it's controllable, the link to "Plan your first step".
- **Recorded:**
  - ratings before and after, the controllability answer, the number of alternatives, which options were marked, completion
  - **no free text**
- **What it can't show:** the change in ratings is immediate and self-reported, open to demand effects. It shows use, not effect.
- **Safe unsupervised:** yes, with the safeguards in §4.

### CS2 · Why did it happen? (about 5 min)
- **Objective:** turn "it proves I can't" into a map of possible causes, some lasting and some not, some personal and some not, without blaming or excusing.
- **Steps:**
  1. **Pick the setback:** a recent everyday mistake or setback, in a few words (never saved), e.g. a failed test or a missed deadline.
  2. **First explanation:** "Why do you think it happened?"
  3. **More possible causes:** add at least two others, from your own words or cards (preparation strategy, time available, difficulty of the task, unclear instructions, tiredness, something new to you, other people, chance…).
  4. **Sort each cause on three sliders:**
     - "about me ↔ about the situation"
     - "lasting ↔ this time"
     - "everything ↔ just this kind of task"

     The causes appear as points on a simple chart. This is the core interaction.
  5. **Look at the map:** a short reflection shows which causes are changeable or specific. "Some causes may really be about you. That's information, not a verdict."
  6. **Next time:** pick one changeable cause, if any, to act on, with a link to "Plan your first step"; or choose "nothing to change right now".
- **Recorded:** the number of causes, the slider positions (no cause text), the next-step choice, completion. Again, no claims.
- **Safe unsupervised:** yes. Risks are blame and self-serving bias, so the cards stay neutral and reviewers check them.

### CS3 · Not enough to go on (about 4 min)
- **Objective:** with ambiguous information, keep more than one reading open and look for real information instead of guessing.
- **Steps:**
  1. **Pick a scenario:** your own (a few words, never saved), or one of six reviewed everyday scenarios, e.g. "Your teacher writes 'Come see me after class'" or "A friend hasn't replied for a day".
  2. **First reading:** write it or pick it; rate how sure you are (0–10).
  3. **Other possible reasons:** pick or write at least two. Reviewed cards range from negative to neutral to positive, so it isn't a positivity exercise.
  4. **Plausibility:** rate each reading, including the first. "None of these fit" is always available.
  5. **Finding out:** "Is there a way to find out?", e.g. ask, check, wait for more information, or "not worth finding out". This is the perspective-getting step, backed by the 25-experiment finding that asking beats imagining.
  6. **Rate certainty again.**
- **Recorded:** the scenario id (or "own"), certainty before and after, the number of readings considered, the finding-out choice. No free text.
- **Safe unsupervised:** yes, for reviewed everyday scenarios. Interpersonal scenarios get **extra reviewer attention**, because ambiguity about others can touch on real conflict or exclusion. Own-scenario entry carries the safety line.

**Each exercise's science explanation** follows plan §3.1, with three separate layers:
- **Evidence for the method:** e.g. reappraisal meta-analysis.
- **Evidence for a comparable implementation:** e.g. brief online reappraisal instructions, or "none tested yet" for CS2 and CS3.
- **Our exercise:** "hasn't been tested itself".

Drafts come in Stage 3.

## 7. Evidence gaps and risks to resolve before release
- **Full texts (✔F) needed before release:**
  - Webb 2012, Troy 2013, Kross 2014, Bruehlman-Senecal & Ayduk 2015, Eyal 2018, plus one attributional retraining source (Lazowski & Hulleman 2016, or a review of attributional retraining).
  - Wang 2021 (Nature Human Behaviour) is open access, so it can be read in full.
- **Gaps that no source here fills:**
  - a tested *single-session, self-guided* version of restructuring or attributional reframing
  - any evidence that these exercises change behaviour
- **Content review** (your rule): at least 3 reviewers, ideally one with psychology training, rate every scenario and option for plausibility and for whether it could feel invalidating. The form comes in Stage 3. Scenarios that fail are dropped, not argued for.
- **Architecture:** the experience registry refactor (§1) comes before any new exercise. It's the one change that touches existing code, and it must leave the four existing exercises, the experiment and the protocol unchanged.
- **Measurement honesty:** before/after ratings inside an exercise invite demand effects. They're labelled "how it feels right now" and never presented as results.

## 8. What I need from you (Stage 2 review)
1. **Scope and identity** (§3), and the boundary rule.
2. **The catalogue decisions** (§5), especially:
   - excluding a standalone growth-mindset exercise
   - replacing Interpretation Shift with CS3 now and CS5 later
3. **First release:** CS1, CS2 and CS3, or a different set.
4. **Starting Stage 4 with the experience registry refactor,** once Stage 3 is approved.

After your review I'll do Stage 3: full journeys, exact texts, the science explanations, temporary UI previews, and the reviewer form. Then I stop again.
