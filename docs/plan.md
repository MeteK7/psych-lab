# Research-led plan: a web platform of psychologically informed interactive experiences (revision 6.5)

> **Status:** revision 5.1 approved 2026-10-29. Stage 1 is partly done (§2.3). The Stage 2 level-A prototype is built and checked (see `docs/runbook.md`). Revisions 5.2–5.7 record the decisions made during implementation (5.3: the study-log outcome, protocol and analysis scripts; 5.4: no content lock, slot reveal tool, the eligible-day-no-session outcome, an earlier phase-1 start; 5.5: folder restructure, study log without git; 5.6: all daily n-of-1 records in the app; protocol v1.3 approved 2026-10-31; 5.7: platform structure and plain on-screen wording; 6.0: three usage models released one at a time (`docs/product-model.md`), separate development and production environments, the exposure rule; protocol v1.4 approved 2026-11-01; 6.1: a science explanation for every experience, and memory reconsolidation as a future research candidate; 6.2: Stage 3 built: browser tests, the sound version of the dot game, usability procedure, consent and content review; 6.3: Cognitive shifts Area approved (Stages 2–3) and the experience registry built, with golden tests for the experiment exercises; 6.4: the three Cognitive shifts exercises built, development only; 6.5: Cognitive shifts revised before the content review, including the CS3 redesign). The user performs all git actions. If a branch is needed, base it on `test`, never `main`. No AI attribution anywhere in files, comments or docs.
>
> **Terminology:** descriptive and provisional ("the platform", "experiences"). There is no product name.
>
> **Evidence marks:**
> - **✔F**: full text checked. So far: Gollwitzer & Sheeran 2006, Sheeran et al. 2024, Engelhard 2011, Holmes 2010 (details in `docs/evidence-verification.md`).
> - **✔A**: the primary record or abstract was checked; full text not yet.
> - **◐**: secondary source, press release, or unverified.
>
> Only ✔F counts as a checked primary result. Stage 1 upgrades the rank-1 claims in §2.3 to ✔F; the others are upgraded during Stages 2–4, by the deadlines given in §2.3.
>
> **Scope levels:**
> - **A**: needed for the first local prototype
> - **B**: needed for local usability and feasibility evaluation
> - **C**: deferred to a justified future research or deployment stage
>
> **Claim levels:** *principle* (research, under stated conditions) · *product hypothesis* · *demonstrated product outcome* (none exists yet).

---

## 1. Vision and initial problem area
- **Vision:** an expandable, web-only platform of **purposeful interactive experiences** informed by psychology, behavioural science and relevant neuroscience. Users *do* something, for example:
  - track an object or solve a quick puzzle
  - interpret a situation
  - plan an action

  Each experience targets a named process. The vision stays ambitious; the first build stays small.
- **First area to investigate:** difficulty starting self-chosen learning, beginning with your own study. The topic varies (AI/ML is one of them), so nothing in the design is tied to one subject. It was chosen because it is observable and personally relevant. It does not define the product, and one person's experience is not evidence about others.
- **Product model** (revision 6.0, details in `docs/product-model.md`):
  - An adaptive psychological experience platform; **not a therapy service**.
  - Three usage models share one experience library and runtime:
    - **Try it** (independent, no account; first-class)
    - **Personal** (optional account and My history)
    - **Organisational** (professionals, with consent, permissions and an access log)
  - **Central principle:** a complete, meaningful experience needs no commitment to return.
  - Each model is **released on its own** once its acceptance criteria and isolation tests pass. Organisational use also needs supervised expert testing and a legal, regulatory, security and data-protection release gate.
  - A booth is a deployment profile of the same web app.
- **Scientific transparency** (revision 6.1): every experience includes a short, plain-language explanation of the method it uses, why, and what research supports it (§3.1).
  - It separates **evidence for the method** from **evidence for our exercise**. No cited study is presented as validating our exercise itself.
  - It is always available in Try it, and never interrupts a running step.
- **Stack:** Angular + TypeScript, Python + FastAPI, PostgreSQL, built as a lean modular monolith. **This phase runs on your Windows computer only**, in two environments: development (`test`) and production (`main`, which runs the n-of-1).

## 2. Problem analysis and evidence review

### 2.1 Why people resist starting

| Explanation | Evidence | Context | Addressable by a small web experience? |
|---|---|---|---|
| Task aversiveness; short-term mood repair | Strong, consistent correlate across 691 correlations (Steel 2007 ✔A). Theoretical framing (Sirois & Pychyl 2013 ✔A) | Mostly correlational | Partly: shrink the first step; state-oriented experiences |
| Low task-specific self-efficacy | Strong correlate (Steel ✔A). Self-efficacy is domain-specific (◐) | Broad | Yes, but only within the domain |
| Fear of failure; negative interpretation of difficulty | **Inconsistent**: no overall relation in one study; moderated by competence in another (◐) | Students | Plausible but unvalidated |
| Unclear next step; overload | Worked examples help novices; that benefit fades with expertise (◐) | Novices | Yes (decomposition). Sometimes the fix is easier material, which is practical rather than psychological |
| Immediate rewards; impulsiveness | Strong correlate (Steel ✔A). Nudge effects decay: about 45% of programmes worked during the programme, about 8% afterwards (Milkman 2021 ◐ via summary) | Broad | Mostly practical (friction, environment) |
| Intention–action gap | If-then plans: d = .65 [.60, .70] over 94 tests, N = 8,461, with no bias adjustment (Gollwitzer & Sheeran 2006 ✔F). Across 642 tests: d = .36 [.33, .40]; publication bias "substantial"; **bias-adjusted d = .15 [.08, .22]** (RoBMA); field .27, online .31; larger with high motivation and rehearsal; **≈ 0 when intentions are weak** (Sheeran et al. 2024 ✔F) | Requires an endorsed goal | Yes, but expect a small effect |
| Habits and cues | Median 66 days to automaticity, based on 39 analysed participants. The 18–254 day range is extrapolated, and the study has not been replicated (Lally 2010 ◐) | Health behaviours | Not within one session |
| Fatigue, attention problems, environment | Micro-breaks raise vigour but not performance on demanding tasks (✔A). Ego depletion failed to replicate across labs: d = .04 [−.07, .15] (✔A) | ADHD is clinical and out of scope | Mostly practical or clinical, not psychological exercises |

**Assumptions challenged:**
- **Discomfort helps only when designed.** Problem-solving before instruction beat instruction-first (g = .36 [.20, .51], ◐: the figure comes from a news report; the primary paper has not been checked). Unguided struggle hurts novices (◐).
- **Resistance can be a valid signal:** the goal isn't truly endorsed, you're fatigued or ill, the material is wrong, or there is a clinical issue.
- **Self-reported barriers are hypotheses, not diagnoses.** Multiple barriers can coexist.
- **Self-reported study time is inflated.** In one study, students reported a median 1.45 hours per logged hour (2025 ✔A).

### 2.2 Mechanism evidence (T = changes the target · S = changes immediate state · B = changes real-world behaviour · P = persists)

| Mechanism | T | S | B | P | Transfer to study avoidance |
|---|---|---|---|---|---|
| **Implementation intentions** (Action Bridge) | — | — | Established but small after bias adjustment (above, ✔F) | Limited | Direct principle. **Our implementation is untested.** The realistic effect is small (d ≈ .15 bias-adjusted, lower in online and field settings), so a 20–28 day n-of-1 cannot detect it reliably |
| **Interpretation-bias modification** (Interpretation Shift) | Established in the lab | Anxiety vs sham: SMD −.30 [−.50, −.10]; reliability "undermined" by bias and heterogeneity (Fodor 2020 ✔A). Youth: bias changes but anxiety does not (✔A) | Untested for learning | Multi-session apps beat controls short-term (HabitWorks, MindTrails ◐) | **Hypothesis.** The evidence comes from anxiety and threat content. Education motivation programmes (d = .49 ✔A) use different formats |
| **Working-memory taxation** (State Reset) | Dual tasks reduce the **vividness and emotionality of a recalled image**. Meta-analysis: 15 lab studies, N = 942. Eye movements beat other dual tasks only modestly (d = .29) (Houben 2020 ◐ summary). Some null results (◐) | Future-oriented images ("flashforwards") became less vivid after 8 × 24 s of eye movements vs recall only (post-test d = .37); emotionality showed only a trend (p = .077); immediate effects only; 37 female students with recurrent intrusive images (Engelhard 2011 ✔F). About 3 minutes of Tetris lowered craving strength and imagery (◐) | Tetris lowered craving intensity in the field **but not indulgence behaviour** (◐ thesis). Fewer trauma intrusions in week 1 (✔A) | Trauma intrusions: no difference at 1 month (✔A) | **Hypothesis, with 3 unverified links:** (1) your avoidance is driven by vivid anticipatory images; (2) taxation dulls those images; (3) dulled images lead you to start |
| Generic visual search / attention-bias modification | Lab only | Weak (◐) | None for concentration; far transfer ≈ 0 (✔A) | — | Not justified as an active intervention |
| Distraction (as an emotion-regulation strategy) | — | d+ = .27 (Webb 2012 ✔A) | — | — | Any game may help through **distraction alone**. A control must separate this |
| Reappraisal | — | d+ = .36 (✔A) | — | — | Can backfire when the problem is controllable (Troy 2013 ◐ press release) |
| **Memory reconsolidation** (future candidate, §3.2; **not** State Reset) | Animal work: a recalled memory can become changeable again for a limited time (Nader 2000 ◐). Human behavioural findings (reactivation followed by extinction) are mixed. A registered replication found no lasting effect (◐), and boundary conditions are debated: prediction error at recall, memory age and strength (◐) | Lab paradigms: reminder followed by a visuospatial task (Tetris) after an analogue trauma film (◐). **These are research paradigms.** Whether their effects come from reconsolidation, rather than other interference or attention processes, is not established | Not shown for everyday memories outside the lab (◐) | Outcomes are measured days later; durability is unknown (◐) | **Not applicable now.** It is not about starting learning; it is a candidate for a future area (§3.2). All marks ◐ until the evidence review |

**Specificity warning:** in one of two lab experiments, a verbal quiz game *increased* trauma-film flashbacks (d = .62 vs no task); in the other it did not differ from no task. Tetris reduced flashbacks in both (Holmes 2010 ✔F, text only). Task type matters, and some tasks may make things worse.

### 2.3 Claims to upgrade to ✔F, ranked by decision impact
| Rank | Claim | What depends on it | Must be ✔F by | Status (2026-10-30) |
|---|---|---|---|---|
| 1 | Gollwitzer & Sheeran 2006; Sheeran et al. 2024 (moderators, bias adjustment) | Whether Action Bridge is justified at all | **End of Stage 1. Blocks Stage 2** | **✔F both.** Justified, but the effect is small after bias adjustment |
| 1 | Houben 2020; Engelhard 2010/2011 | Whether State Reset's mechanism (taxing imagery) is real, and how big it is | **End of Stage 1. Blocks Stage 2** | Engelhard 2011 **✔F**. Houben 2020 and Engelhard 2010 **not accessed**; the user is to obtain them |
| 1 | Holmes 2010 (a verbal game *increased* flashbacks) | State Reset's game type and its harm risk | **End of Stage 1. Blocks Stage 2** | **✔F** (text only). The increase was seen in 1 of 2 experiments |
| 2 | Skorka-Brown 2015 (field: craving fell, behaviour did not change) | How much behaviour change to expect from State Reset | Before n-of-1 phase 2 starts | Open |
| 2 | Webb 2012 (distraction d+ = .27) | Why the game-only control is needed | Before n-of-1 phase 2 starts | Open |
| 3 | 2025 self-report vs logs | Outcome design (the trace is primary, self-report secondary) | Before Stage 4 | Open |
| 3 | Fodor 2020 | Interpretation Shift, which is conditional | Before any Interpretation Shift build | Open |
| 3 | Houben 2020 (also rank 1 above) | The published science explanation for State Reset (§3.1) | Before that explanation is published | Open; until then the explanation cites Engelhard 2011 only, as "one lab study" |
| 3 | Reconsolidation sources (`evidence-verification.md`, "Memory reconsolidation") | Whether the memory-update candidate (§3.2) goes any further | Before any design work on it | Open (all ◐) |
| 4 | Lally 2010 · Troy 2013 · Milkman 2021 · Avery 2017 · Sinha & Kapur 2021 · attributional retraining | Background only; no decision rests on them | During Stages 2–4 | Open |

**Deviation:** Stage 2 went ahead with two rank-1 papers still unread (Houben 2020, Engelhard 2010), on the user's go-ahead. State Reset's mechanism currently rests on Engelhard 2011 (✔F) plus the Houben abstract (✔A). Both papers must be ✔F before n-of-1 phase 2 starts.

## 3. Candidate mechanisms: decisions

| Candidate | Principle | Product hypothesis | Decision |
|---|---|---|---|
| **Action Bridge**: cue + if-then plan + obstacle plan + tiny first step, then reading the plan twice (rehearsal) | Implementation intentions (✔F; small after bias adjustment; larger with rehearsal and strong intentions) | Planning at the moment of hesitation raises the chance you start your own study | **Adopt (A).** First factor tested, in the n-of-1. Built |
| **Goal restatement**: write your goal and today's topic; no cue and no if-then | The standard active control in implementation-intention research | — | **Adopt (A)** as the comparison condition |
| **State Reset**: hold the anticipated "starting/struggling" image for 10 s, then play a dot-following tracking game in **8 sets of 24 s with 10 s pauses** (about 4.5 min, content v2) while keeping the image in mind; rate vividness and emotionality before and after | Working-memory taxation of imagery (Engelhard 2011 ✔F; Houben 2020 ✔A). The dose follows Engelhard 2011's 8 × 24 s sets | It dulls aversive anticipatory images and so lowers avoidance | **Adopt (A) as an experimental candidate**, not as an evidence-based component. Limited to study-related images. **Never for trauma memories.** A stop option is always available. Built |
| **Game-only control**: the same game, the same 8 × 24 s timing and a duration-matched "get ready" phase, without holding the image | Isolates distraction or break effects | — | **Adopt (A).** **Replaces neutral visual search,** which overlapped with State Reset. Built |
| **Interpretation Shift** | CBM-I (lab and anxiety) | Learning-setback scenarios change interpretation and lead to starting | **Replaced (6.3)** by the Cognitive shifts Area (`docs/cognitive-shifts-proposal.md`, `docs/cognitive-shifts-design.md`): CS3 "Not enough to go on" now; repeated ambiguity practice (CS5) later, with the Personal model and its own review |
| **Small Achievable Challenge** | Domain-specific mastery | In-domain success leads to attempting the harder task | **Defer (C).** Needs domain content |
| **Neutral visual search** | — | — | **Remove.** It overlaps with State Reset |
| **Memory update** (working title; reconsolidation-based) | Memory reconsolidation (animal evidence; human behavioural evidence mixed, ◐) | A guided reminder, a wait, then an updating or interference task might make an everyday unpleasant memory less upsetting days later | **Future research candidate (C), not an approved feature.** Not adopted, not designed. Gated (§3.2). **Never for traumatic memories**; no drugs; not a therapy |

### 3.1 Science explanation standard (every experience)
Every experience carries a **science explanation** in its own versioned content file, e.g. `content/science/<experience>.v1.json`, separate from the experience content so that experiment `content_versions` don't change. It's built in product phase **S** (§9).

**Five parts** (a part may hold several paragraphs):
1. **What you do.**
2. **The method:** named and explained in plain words, e.g. "planning *when* and *how* you'll start (implementation intentions)".
3. **What research says about the method:** the wording is fixed by the evidence mark.
   - ✔F (full text checked): "Research found…" or "A lab experiment found…", naming who took part and how, e.g. "in lab experiments with volunteers". The word "study" isn't used on screen, so explanations say "research" or "experiment".
   - ✔A (abstract checked): "Research suggests…".
   - ◐: **can't be used**.
4. **About this exercise:** a required statement separating the method from our implementation.
   - For example: "This exercise follows that method, but this version hasn't been tested itself. The studies above tested the method in their own form, not this app."
   - It also states what differs from the studied form (setting, dose, population).
5. **Limits and sources:**
   - effect size in plain words ("small", "measured only right afterwards"), and what is unknown
   - author, year, title and link, for ✔F and ✔A sources only

**Honesty rules:**
- **Citations attach to the method, never to the exercise.**
  - Never: "proven", "based on studies showing it works", "clinically tested", or any phrasing that implies a cited study validated this exercise.
  - The plan's claim levels apply: no *demonstrated product outcome* exists yet.
- **Experimental experiences say so,** e.g. State Reset: "The idea has some lab support, but it hasn't been shown to help people start."
- **Comparison exercises say what they are:** goal restatement is the comparison used to test whether the extra planning step adds anything; game only is the same game without the picture.
- **The section is named "Why this exercise?"**, not "Why this works". The exercises haven't been shown to work.

**Presentation:**
- **Preview screen** (before Begin): an expandable section in the page (native `<details>`), closed by default, accessible by keyboard and screen reader. Its bar shows a flask icon, "Why this exercise?" and "The science behind it: <method>". Opened, each part has its own icon heading; each research finding is a shaded block with its sources and evidence level ("Full text checked" or "Summary checked; full text not yet"); "About this exercise" is a highlighted callout; sources are numbered and open in a new tab. No pop-ups or overlays.
- **Done screen:** the same section.
- **Area page card:** the method the exercise rests on, as an icon and its name under the description (Implementation intentions, Goal intentions, Working-memory taxation, Distraction). It links to the preview screen with the section open. There is no separate "Why this exercise?" link on the cards.
- **Never inside a running step,** and no pop-ups.
- **Always available in Try it,** with no restriction.

**The experiment:** explanations aren't shown inside My experiment exercises during an active phase.
- The approved protocol fixes what the assigned exercises show, and a rationale on one condition only would add an expectancy confound (§4.2).
- This changes nothing in the protocol and nothing in Try it.

**Checks** (added in phase S):
- every experience has an explanation
- every "research found" sentence cites at least one ✔F or ✔A source, and none cites a ◐ source
- the wording matches the mark
- part 4 is present
- no forbidden claim words
- Stage 3 content review: accuracy against each cited source, and readability

### 3.2 Memory reconsolidation: future research candidate
**Status:** a research-backed **candidate**, not an approved feature and not a validated product intervention. Nothing is designed or built.

**State Reset is not reconsolidation.** State Reset uses **working-memory taxation**:
- **What it does:** an image held **during** a demanding task.
- **What it measures:** vividness and emotionality **straight after**.

Its description, the n-of-1 protocol and its data stay as they are. The two approaches never share a label, a description or a data field.

**What reconsolidation proposes:**
- Recalling a consolidated memory may, under certain conditions, make it changeable again for a limited time, and new information or interference in that window may update it.
- Human behavioural paradigms include reactivation followed by extinction, and a reminder followed by a visuospatial task (Tetris) after an analogue trauma film.
- **These are research paradigms, not proven reconsolidation interventions:**
  - Lasting effects of reactivation followed by extinction haven't replicated reliably.
  - In Tetris-after-reminder studies, other explanations are open, such as general visuospatial interference with intrusive imagery, or attention and mood effects.
  - Most results come from lab-conditioned fear or film analogues, not everyday autobiographical memories.
  - Outcomes are intrusion counts or fear responses measured days later.
- **Drug paradigms** (e.g. propranolol) are background only: they are medical and out of scope.

**Gates** (in order; any "no" stops it):
1. **Evidence review.** The sources in `evidence-verification.md` reach ✔F, and a written review answers:
   - Is there a behavioural, non-clinical paradigm with replicated effects?
   - Does it apply to everyday autobiographical memories?
   - What are the boundary conditions: prediction error, timing, memory age?
   - What harms have been reported?
   - Which effects are attributable to reconsolidation rather than other processes?
2. **Design feasibility.**
   - It needs a reminder that creates a prediction error, a timed wait, and a task, without supervision.
   - Outcomes come days later, so it needs return visits. **It depends on the Personal model (M2)** and can't work as a single Try it visit.
3. **Safety and ethics review:**
   - exclusion of trauma and crisis
   - distress handling, stop and signposting
   - independent review before any testing with people
4. **Usability:** comprehension and tolerability.
5. **Feasibility study** under its own protocol (n-of-1 or pilot).

It becomes an offered experience only after gate 5. Until then the Home page shows it as "planned" at most, with no claims.

**Area (provisional until gate 1 is complete): Emotional regulation**, with a topic such as "Memories that still bother you".
- **Why not the other areas:**
  - **Action and growth:** about moving from intention to action.
  - **Learning reinforcement:** this candidate targets a memory's emotional charge. A learning-oriented "retrieve and update" idea would be a separate candidate there.
  - **Recovery after setbacks:** too narrow, and focused on returning to chosen goals.
  - **Cognitive shifts:** reinterpretation is a different mechanism, and mixing them would blur the distinction.
- **Caveat:** classic emotion-regulation strategies act on emotions in the moment, while this candidate acts on a stored memory. The topic text will say so.
- **A separate Memory area isn't justified now:** there is one unvalidated candidate. Revisit if two or more memory-focused experiences pass their gates.
- **The placement is re-decided after the evidence review.**

## 4. Experimental design (provisional until Stage 3 review)

### 4.1 Which comparison answers which question
| Comparison | Can establish | Cannot establish |
|---|---|---|
| Action Bridge vs goal restatement | Whether *our* plan component changes starting | Pre-task effects |
| State Reset vs game-only | Whether **holding the image** adds anything beyond distraction or a break | The effect of no pre-task at all |
| State Reset vs image-only (recall without the game) | Whether the **taxation** adds anything beyond imagery exposure | — |
| 2 × 2 factorial (pre-task × plan) | Main effects and interaction with full-sample efficiency | **Deferred:** the pre-task factor now has 2–3 candidate levels, and testing an interaction needs a large N. Revisit after single-factor signals |

**Recommended sequence:**
1. n-of-1 phase 1: the plan factor (§4.2).
2. In usability testing, a check that the State Reset procedure is understood and tolerable, and that its mechanism measures work. This happens before n-of-1 phase 2.
3. n-of-1 phase 2: State Reset vs game-only, with Action Bridge held constant (§4.2).
4. Later effect studies (C): first the three-arm State Reset mechanism study, with Action Bridge held constant in every arm.

### 4.2 n-of-1 design (your own use, level A/B)

**Rules shared by both phases**
- **All daily records are made in the app** (the **My experiment** page); nothing is edited by hand or run from a command line. Dates are **local (Europe/Istanbul)**.
- **The experiment runs only in production:** the `main` build with its own database `app_prod`. Development (`test`, `app_dev`) runs Test mode only, enforced by the server. Releases during a phase are logged and must not change the experiment.
- **Try it stays unrestricted during the experiment** (no practice lock).
  - **Recorded:** runs are stored in `try` mode and exported without free text.
  - **Classified:** each session day is clean, extra exposure or **contaminated** (the other condition's active component was used between local midnight and the end of the outcome window).
  - **Analysed:** the primary analysis is unchanged. It adds two sensitivity analyses and exposure counts by condition (protocol §7).
- **Unit:** one session per *eligible day*. A day is eligible if it was **planned in advance** in the app (only future days can be planned) and no barrier was reported before its planned start. Ineligible days don't use up a schedule slot.
- **Day statuses** (derived by the app): `session` · `ineligible` · `eligible_no_session`.
  - **"Eligible day, no session" is its own outcome category**: a feasibility measure that uses no slot, with its count reported per phase.
  - A barrier reported **after** the planned start is flagged late and counts as `eligible_no_session`, not `ineligible`.
  - **A revealed slot is always a `session` day, analysed as assigned**, whether its session was completed, aborted, unfinished or not begun. Completion status is reported per day and by condition; completed-only is a sensitivity analysis.
- **Slot reveal:** by the server when **"Start today's session"** is clicked.
  - It verifies the schedule hash and reveals only the next unused slot: one per day, never a slot twice.
  - It opens the session with the condition **locked**, and links the session to its reveal.
  - The analysis uses that link.
- **Session timing:** the reveal time relative to the planned start is stored. **More than 15 minutes after the plan is recorded automatically as a late start** (deviation; sensitivity analysis excludes these days). The 120-minute window begins when the session ends; for an unfinished session, at its last saved step; for a slot not begun, at the reveal.
- **Measurement rule** (identical in all conditions, and **not part of any experience**):
  - After the session, the **"Starting to learn?"** box appears at the top of My experiment. When studying begins, write one line about what you're starting and press **I'm starting now**.
  - The **server time** is the record.
  - The line is also appended to the topic-neutral study log `C:\Projects\new_project\study-log\<session date>.md` (plain folder, no git) as a readable mirror.
  - A start logged after midnight belongs to the evening session.
  - Study material stays wherever it lives. No experience mentions the box, and the content test forbids trace words in all experience content.
- **Primary outcome:** the **server-recorded study start, if within 120 minutes after the session ends**, recorded as yes/no and as latency (censored at 120 minutes).
- **Phase 0** is a test phase for walkthroughs (development data, never analysed).
- **Full procedure:** `docs/protocol-n-of-1.md`.
- **Randomisation:** blocked pairs. Each consecutive pair of eligible days gets both conditions in random order. Each phase has its own schedule, generated before the phase starts, saved, and its SHA-256 hash recorded in the protocol. Deviations are logged.
- **Sample size:** minimum **20 session days per phase** (10 pairs, 1,024 possible assignments). Target 28.
- **Analysis:** within each phase, a prespecified two-sided randomisation test of the mean latency difference, permuting within pairs; the same for the yes/no outcome; a time-series plot. **The two phases are never compared with each other**, because phase order is confounded with time.
- **Secondary outcomes:** end-of-day self-reported minutes (labelled as self-report) · "starting feels unpleasant" (0–10) before and after the session · burden.

**Phase 1: plan factor**
- **Question:** does Action Bridge (vs goal restatement) make it more likely that I start my planned study, and sooner?
- **Expectation (Sheeran et al. 2024 ✔F):** the bias-adjusted effect is small (d ≈ .15) and is ≈ 0 when intentions are weak.
  - **A null result is the expected outcome** at 20–28 days. Phase 1 is mainly a feasibility and personal-signal study.
  - Run it only during a period when the study goal is genuinely endorsed.
- **Start condition:** phase 1 may start once the folder `C:\Projects\new_project\study-log` exists and the current protocol version is approved. It **does not wait for the rest of Stage 3**. This is a deliberate deviation from the roadmap (§9): the phase-1 conditions are built and checked, and Stage 3 items don't affect them.
- **Limits:**
  - unblinded and open to expectancy effects
  - n = 1
  - possible carryover of plans between days
  - only starts recorded in the study log are captured, and a note proves starting, not study quality
  - observation itself may change behaviour

**Phase 2: core mechanic** (starts after phase 1 ends and after the Stage 4 usability sessions show State Reset is tolerable)
- **Question:** with Action Bridge held constant, does State Reset (holding the image while playing) make it more likely that I start, and sooner, than playing the same game without holding the image?
- **Sequence each day:** the assigned pre-task (State Reset or game-only: same game, same 8 × 24 s timing, 272 timed seconds each), then Action Bridge.
- **Extra secondary outcome (State Reset days only):** vividness and emotionality of the image before and after. Game-only days ask for no image, because that would contaminate the control.
- **Washout:**
  - *Between days:* none required. There is at most one session per day. Engelhard 2011 (✔F) measured only immediate effects, so the duration of the effect is unknown. Assuming it lasts minutes, not days, remains ◐; the pair-order plot checks for carryover.
  - *Between phases:* at least 2 session-free calendar days. Phase 2 is analysed only within itself.
  - *Game practice:* the same game is played in both conditions, so practice is balanced across them. Pair-order trends are checked on the plot.
- **Limits:**
  - unblinded: I know which days involve holding the image, so expectancy effects can't be ruled out
  - n = 1
  - game practice and improving skill over time
  - only starts recorded in the study log are captured, and a note proves starting, not study quality
  - results don't generalise
  - a null result can't distinguish "no effect" from "too small for 20–28 days"

### 4.3 Local usability testing: a documented procedure, not randomisation
Each tester experiences **all conditions** in a fixed counterbalanced order (Latin square in the procedure document). The order is followed with the **Try it** buttons on the area page (practice mode). Usability testing asks whether people *can use* the platform; it does not measure effects.

### 4.4 Stage boundaries
| Stage | Answers | Never claims |
|---|---|---|
| Technical test | The software behaves correctly | Anything about people |
| Usability (5–8 in-person testers) | Comprehension, usability, accessibility, plausibility, credibility of the control, product feel | **Efficacy** |
| n-of-1 | Feasibility of measurement; your personal signal | Generalisable effects |
| Feasibility pilot (C) | Recruitment, completion, measurability, variance | Efficacy |
| Effect study (C) | Effects, under ethics approval | Beyond its design |

**On sample size and progression thresholds:**
- Pilot rules of thumb (12–35 per arm, ◐) are **conventions, not evidence**.
- Progression thresholds are **our prespecified choices** and must be justified in the protocol.
- A future trial is sized from the pilot's *control rate and attrition*, never from the pilot's effect estimate.

## 5. Outcomes and measurement strategy

| Level | Meaning | How it's measured | Limits |
|---|---|---|---|
| L1 | App interaction | Step completion, durations | Engagement only |
| L2 | Starting a standardised task | In-app unit (**C**) | Low ecological validity; demand effects; a standard lesson ≠ your own goals |
| L3 | **Starting your own intended learning** | Server-recorded study start in the app (n-of-1) + self-report | Proves a click, not study quality; a forgotten click counts as a non-start; self-report inflates |
| L4 | Sustained engagement | Trace density, self-reported minutes | Approximate |
| L5 | Learning or lasting change | Tests and repeated-days behaviour (C) | Needs designed studies |

| Stage | Primary | Secondary |
|---|---|---|
| Technical validation | L1 correctness | — |
| Usability | Comprehension, SUS, accessibility | **Product feel:** intention to use again tomorrow (1–5), "I felt supported" (1–5), best and worst moment (free text, deleted after the report); State Reset vividness/emotionality ratings; control credibility (adapted credibility/expectancy questionnaire ◐) |
| n-of-1 | L3 (trace) | L4, self-report, burden |
| Future pilot (C) | Measurability of L2 and L3; agreement between trace and self-report | — |

**Decisions on measurement:**
- The **standardised in-app learning unit moves to C.** It would cost a lot of content, and its validity as a stand-in for your own study is unproven. The local phase makes no cross-person effect claims, so nothing is lost now.
- Browser timing is not lab-grade. No outcome depends on millisecond timing.

**Usability go / amend / redesign criteria:**
| Criterion | Go | Amend | Redesign |
|---|---|---|---|
| SUS | ≥ 68 | 50–67 | < 50 |
| Intention to use again tomorrow (≥ 4/5) | ≥ 60% of testers | 40–59% | < 40% |
| Completed flow unaided | ≥ 80% | 60–79% | < 60% |
| "Made it worse" (any condition) | 0–1 tester | 2 | ≥ 3, or any distress needing support |

## 6. Lean local architecture (tags: A / B / C)

### 6.1 Components and decisions
| Component | Level | Decision and reason |
|---|---|---|
| FastAPI (sync) + SQLAlchemy 2.0 (sync, psycopg 3) | A | One user on one machine. Async adds complexity with no benefit |
| Alembic migrations | A | The schema will evolve, and resets must be repeatable |
| Pydantic request/response schemas; `pydantic-settings` reading `.env` | A | Validation at the edges and safe configuration; both are minimal |
| Content as **JSON files in `web/src/content/`**, typed by TypeScript interfaces, each with an `id` and `version` | A | Simplest form that versions content. The backend doesn't serve content |
| Immutable content copies stored in the database | C | Needed only for formal research. Migration later: import the versioned content files |
| Session-level content references (`content_versions` JSON on the session) | A | Cheap, and essential for interpreting the data. Superseded content files stay unchanged in the repo (e.g. `state-reset.v1.json` next to v2) |
| Session created only on **Begin session** | A | Opening or reloading a session page records nothing, so a refresh or hot reload can't create orphaned sessions |
| Saves run strictly one after another | A | An older in-progress save can never overwrite a finished session |
| **Simple TypeScript interface** (`completed: output<StepOutcome>`, in `web/src/app/flow/step-outcome.ts`); flows hard-coded per condition | A | Four experiences don't justify a registry or plugin system. **Consequence:** when there are more than ~5 experiences, a registry must be extracted (small refactor) |
| Generated API types | C | 4–7 endpoints; mirror the types by hand. Generate later (`openapi-typescript`) if the API grows |
| Raw interaction events | C | Store **step summaries** instead (start/end, completion, game score/errors, ratings). **Consequence:** no fine-grained interaction analysis; adding an `events` table later is additive |
| Idempotent writes | A | Sessions use client-generated UUIDs with `PUT` upsert. No batch-ingestion machinery |
| Participant and consent records | B | Self-use needs none. Testers need a pseudonymous code and a consent record |
| Allocation | A: a `condition` field set by the selector or schedule · B: a hashed n-of-1 schedule file · C: a concealed allocation engine | Randomisation in the local phase happens **offline** |
| Exports | A: none (local database) · B: documented `psql \copy` commands · C: pseudonymised export tooling | No export code yet |
| Analysis | B: n-of-1 randomisation-test script; usability summary · C: mixed models and analysis plans for trials | — |
| Accounts and authentication | M2 / M3 (`product-model.md`) | Optional personal accounts (M2), then organisation roles and grants (M3). Not built yet. Each starts with its own plan |
| **Environments** (`APP_ENV`) | A | Development on `test` (`app_dev`, `app_test`, Test mode only) and production on `main` (`app_prod`, `app_test_main`, the n-of-1). The server refuses to start if one environment's settings point at the other's database, schedules or study log. Tests refuse `app_prod`; `reset-db` refuses production |
| Production serves the built web app (FastAPI, falling back to `index.html`) | A | One process, no dev server or reload in the environment that runs the experiment; the tested build is what runs |
| Session mode `try` for Try it, separate from `dev` (Test mode) | A | The exposure rule needs Try it runs to be identifiable; earlier Try it rows were migrated (`0004`) |
| Separate test database `app_test` | A | Keeps tests away from your n-of-1 data. Costs nothing on a native install |
| Database user: the `postgres` superuser (user decision, 2026-10-29) | A | Simplest local setup. **Trade-off:** the app and tests can reach every database on this server. Tests refuse to run when both URLs point to the same database. Revisit (dedicated role) before any deployment |
| Ports: production **4300** (web and API in one process); development web **4310**, API **8110** | A | 4200 and 8000 are used by other local projects on this machine. My experiment's address stays http://localhost:4300 |

### 6.2 Repository layout
```
C:\Projects\new_project\                 project root (git set up by the user)
  study-log\                             plain folder: daily notes YYYY-MM-DD.md only (no git); written by production only
  platform-prod\                         production: git worktree of main (own .env, app_prod)
  platform\                              development: branch test
    api/  pyproject.toml (uv) · .python-version (3.13) · alembic.ini
          app/{main,config,db,models,schemas,security,manage,n1,clock,e2e_server}.py · app/routes/{health,sessions,n1}.py · participants (B)
          alembic/versions/{0001_create_sessions,0002_n1_daily_records,0003_session_last_saved_at,0004_session_mode_try,0005_exercise_ids}.py · tests/
    web/  src/app/{api,flow,shared,areas.ts,pages/{home,area,experiment,records,about}} · src/app/experiences/registry.ts · src/app/flow/__golden__/
          src/app/experiences/{rating-step,action-bridge,goal-restatement,state-reset}
          src/content/{ratings,action-bridge,goal-restatement,state-reset,state-reset-sound}.v<N>.json · src/content/science/
          e2e/ (Playwright browser tests) · playwright.config.ts · proxy.conf.json · proxy.e2e.conf.json
    analysis/  pyproject.toml (uv) · make_schedule.py · n_of_1.py (reads the export-n1 JSON) · tests/ · schedules/schedule-phase<N>.{csv,sha256,meta.json}
    data/exports/  phase<N>.json, per-day tables   (git-ignored)
    data/schedules-dev/, data/study-log-dev/   development's Test mode only (git-ignored)
    docs/  plan.md · product-model.md · evidence-verification.md · runbook.md · protocol-n-of-1.md · usability-procedure.md (B) · consent-usability.md (B) · content-review.md (B) · cognitive-shifts-{proposal,design,review-form}.md
    scripts/  check.ps1
    .env · .env.example · .gitignore (.env, data/) · .gitattributes
```
All commands in §7 run from `C:\Projects\new_project\platform`.

### 6.3 API (`/api`)
| Endpoint | Level | Purpose |
|---|---|---|
| `GET /health` | A | Liveness, database connectivity and environment (shown as a Development badge in the development build) |
| `PUT /sessions/{id}` | A | Idempotent upsert of a session: mode, condition, content versions, step summaries, plan, ratings, status |
| `GET /sessions` | A | My records (filterable by participant) |
| `PATCH /sessions/{id}/follow-up` | A | End-of-day self-report |
| `GET /n1/today` | A | My experiment page: plan, status, reveal, study-start box, tomorrow's plan, progress (local dates) |
| `PUT /n1/days/{date}` | A | Plan a future day's start time |
| `POST /n1/barrier` | A | "I can't study today"; flagged late after the planned start |
| `POST /n1/reveal` | A | Reveal today's slot (hash-checked, one per day, never twice); returns the same reveal if repeated |
| `POST /n1/study-start` | A | Record the study start (server time) for the latest finished session; appends the study-log note |
| `POST /participants` | B | Create a pseudonymous tester code |
| `POST /participants/{id}/consents` | B | Record a consent (kind, document version, timestamp) |
| `DELETE /participants/{id}` | B | Withdrawal plus cascade delete |

### 6.4 Data model
| Table / column | Level | Key fields |
|---|---|---|
| `sessions` | A | `id` uuid (client-generated) · `mode` (self_use, usability, try = Try it, dev = Test mode) · `condition` · `content_versions` jsonb · `steps` jsonb (step, content id/version, started/ended, result) · `plan` jsonb · `ratings` jsonb · `followup` jsonb · `status` · timestamps |
| `sessions.n1_reveal_id` (FK, unique, nullable) | A | Links an n-of-1 session to its reveal; condition and mode must match |
| `sessions.last_saved_at` | A | Server time of the last save while the session ran; starts the outcome window for an unfinished session |
| `n1_days` | A | (`phase`, `date`) · `planned_start` · `planned_at` · `barrier` · `barrier_at` · `barrier_late` |
| `n1_reveals` | A | `id` · `phase` · `slot` · `condition` · `session_date` · `revealed_at` · `minutes_after_planned`; unique (phase, slot) and (phase, session_date) |
| `n1_study_starts` | A | (`phase`, `session_date`) · `recorded_at` (server time) · `text` |
| `sessions.participant_id` (FK, nullable) | B | Null means you (self-use) |
| `participants` | B | `id`, random `code`, `created_at`. **No names or emails** |
| `consents` | B | `participant_id`, `kind`, `document_version`, `given_at`, `withdrawn_at` |
| `allocations`, `events`, `content_versions`, `adverse_reports`, `accounts` | C | Added when formal research or deployment needs them. Before then, "made it worse" is a rating, and operator notes are a session field |

## 7. Windows local setup and runbook (native PostgreSQL)

**Prerequisites:**
- PostgreSQL (a current supported major version, via the official Windows installer; it runs as a Windows service)
- `psql` and `pg_dump` on `PATH`: add the installer's `bin` folder, e.g. `C:\Program Files\PostgreSQL\<version>\bin`. `reset-db` and backups depend on them
- `uv` with Python 3.13 (`uv python install 3.13`). Checks run with `UV_PYTHON_DOWNLOADS=never`
- Node.js LTS (v24 in use)
- for level B browser tests: `npx playwright install chromium`

**One-time database setup** (run in psql as `postgres`):
```sql
CREATE DATABASE app_dev;
CREATE DATABASE app_test;
CREATE DATABASE app_prod;
CREATE DATABASE app_test_main;
```
- Set `listen_addresses = 'localhost'` and keep `scram-sha-256` authentication in `pg_hba.conf`.
- Each environment folder has its own `.env`, copied from the matching block of `.env.example`: development uses `app_dev` and `app_test`, production uses `app_prod` and `app_test_main`. Percent-encode special characters in the password.
- `.env` is git-ignored. `.env.example` contains placeholders only.
- To check that the *saved* file works, use the one-line command in `docs/runbook.md`.

**Install and migrate:**
```bash
cd api; uv sync; uv run alembic upgrade head
```
```bash
cd web; npm ci
```

**Two environments** (full steps, one-time setup and the release procedure in `docs/runbook.md`):
- **Production** (`platform-prod`, `main`): `npm run build` once per release, then `cd api; uv run fastapi run app/main.py --host 127.0.0.1 --port 4300`. Open `http://localhost:4300`.
- **Development** (`platform`, `test`), two terminals:
```bash
cd api; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8110 --reload-dir app
```
```bash
cd web; npm start
```
Then open `http://localhost:4310`. The Angular proxy forwards `/api`, so everything is on one origin and no CORS setup is needed. `--reload-dir app` stops the reloader from watching `api/.venv`, which otherwise restarts the API constantly.

**Test:** runs ruff, pytest against `app_test`, `ng test`, `ng build`, and (B) the browser tests: Playwright with axe, in the installed Microsoft Edge, against their own API on the test database (ports 4320/8120), about 4 minutes.
```bash
powershell -File scripts/check.ps1
```

**Reset the development database:** drops and recreates the `public` schema, then runs `alembic upgrade head`. It asks for confirmation and first writes a `pg_dump` backup to `data/backups/`. **Refused in production**, which holds the n-of-1 data (back it up with `app.manage backup`).
```bash
cd api; uv run python -m app.manage reset-db
```
The test database resets itself on each test run (migrate once; roll back a transaction per test).

**Stop:** Ctrl+C in both terminals. PostgreSQL can keep running. To stop it, use `Stop-Service postgresql-x64-<version>` (requires admin).

## 8. Testing, security, privacy and accessibility

| Area | A (prototype) | B (usability) | C |
|---|---|---|---|
| Backend tests | pytest: idempotent session upsert; condition validation; health check; migrations upgrade on an empty `app_test` | Consent and delete cascade | Allocation engine; exports |
| Frontend tests | Vitest: flow order per condition; Action Bridge validation; State Reset timing and completion logic | **Built (6.2):** Playwright keyboard-only path through every exercise, including the sound version; axe scans (WCAG 2.2 AA, no serious or critical violations) on every page, step and the dark scheme; reduced-motion path; saved step summaries checked; a test that the scan catches a planted problem | Broad end-to-end tests; CI |
| Local security | API bound to `127.0.0.1`; `TrustedHostMiddleware` (localhost only, against DNS rebinding); writes require `Content-Type: application/json` + an `X-Client` header + an allowed `Origin` (blocks drive-by writes from websites) | — | Production authentication, CSRF tokens, TLS |
| Privacy | Self-use data stays local; goal text is optional | Testers: pseudonymous code, hypothetical goals, no health questions beyond "made it worse", free text deleted after the report, all tester data deleted within 30 days | Lawful basis, DPIA and retention policy before formal research |
| Accessibility | Keyboard path for every interaction; `prefers-reduced-motion` | WCAG 2.2 AA check; NVDA screen-reader pass; a **non-visual State Reset variant**: **built (6.2)** as a tone task (respond to high tones; same timing and practice), offered in Try it only, never in experiment exercises; its evidence as a taxing task is ◐ until Houben 2020 is read. The NVDA screen-reader pass is a manual step in the usability preparation | Full audit |

**Isolation tests** (revision 6.0):
- **Before release:** every model passes its own isolation tests before it goes live (`product-model.md` §5).
- **Personal:** no cross-account reads or writes (404 for other accounts' ids; list routes filtered).
- **Organisational:** no cross-organisation reads, no reads without a grant, revocation takes effect straight away, and every professional read is logged.
- **Route coverage:** a test fails if a new API route has no isolation classification.

**Science explanation checks** (revision 6.1; level B, built in phase S): a content test checks every experience against the §3.1 standard:
- an explanation exists
- only ✔F and ✔A sources are cited
- the strength wording matches the mark
- the "About this exercise" statement is present
- no claim words imply that a cited study validated the exercise itself

**Ethics and data-protection baselines.** These are *design baselines, not legal advice*.
- **Research ethics:** the principles shared by the Belmont Report and the Declaration of Helsinki:
  - respect for persons and informed consent
  - beneficence and harm minimisation
  - justice
  - independent ethics review **before** formal research
- **Data protection:** GDPR-level practice as the reference:
  - a lawful basis
  - explicit consent for health-related data
  - minimisation and purpose limitation
  - retention limits
  - rights of access and deletion
- **Accessibility:** WCAG 2.2 AA.
- **Before any formal research or deployment,** check the actual laws of the operator's and participants' jurisdictions.
- **Local usability testing is not formal research.** It still uses written plain-language consent, voluntary participation, stopping at any time, and minimal data.

## 9. Staged roadmap with decision gates

| Stage | Purpose and deliverables | Prerequisites | Excluded | Acceptance criteria | Supports / doesn't | Proceed / revise / stop |
|---|---|---|---|---|---|---|
| **1. Research and problem definition** (weeks 1–3, overlaps Stage 2) | `problem-and-evidence.md` with the **rank-1** §2.3 claims at ✔F; n-of-1 protocol (both phases) + phase-1 hashed schedule; study log (`C:\Projects\new_project\study-log`, plain folder) created; usability procedure + consent; State Reset image prompts and game spec; Interpretation Shift scenario draft reviewed by ≥ 3 people | — | Formal research protocol; ethics submission | Every claim marked ✔F, ✔A or ◐; no decision rests on ◐ | Supports the design choices · Doesn't show any effects | Proceed if State Reset and Action Bridge remain defensible after ✔F. Revise the candidates if a key claim fails |
| **2. Minimal local prototype** (**working level-A build by end of week 3**) | Level-A API, data model, migrations; Action Bridge, goal restatement, State Reset, game-only control; condition selector; history; follow-up; `check.ps1` | Native PostgreSQL; protocol drafts; rank-1 claims at ✔F (must be done before the end of week 3) | Level B and C items | Clean setup from the runbook; all level-A tests pass; each condition runs end to end | Shows the software runs · Says nothing about people | — |
| **3. Technical and content validation** (weeks 4–5) | Level-B items: keyboard/axe tests, reduced-motion and non-visual variants; walkthrough of all conditions; content review; Interpretation Shift build **only if** its review passed | Stage 2 | Testers | No serious axe violations; scripted runs record correct step summaries; reviewers find no invalidating content. **Status (6.2):** tests and the sound variant built and passing; the content review (`content-review.md`) and the NVDA pass are yours to do | Readiness for usability testing · Not usability itself | Proceed; or fix and re-run |
| **4. Local usability and feasibility** (usability weeks 6–8; phase 1 may begin earlier, see prerequisites; overall to ~week 15 at the minimum day count, up to week 19 at the target) | Usability sessions in weeks 6–8; n-of-1 phase 1 (20 session days at ~4 per week, about 5 weeks; up to 7 weeks for 28); 2-day gap; n-of-1 phase 2 (about 5–7 weeks); feasibility report including the `eligible_no_session` count per phase | **Usability:** Stage 3; signed consents. **Phase 1 (deliberate deviation):** only the study log, the production environment and the approved protocol version; it doesn't wait for Stage 3. **Phase 2:** unchanged: usability showed State Reset is tolerable, the rank-1/rank-2 claims are ✔F, and its own hashed schedule exists | Remote recruitment; efficacy claims | §5 go/amend criteria; **each phase** has ≥ 20 session days with ≥ 90% usable trace data | Usability, product feel, measurability, your personal signal · **Not efficacy** | — |
| **5. Decision gate** (week ~16 at the minimum day count; ~20 at the target) | A recorded decision | Stage 4 report | — | Decision justified by the data | — | **Refine** (amend criteria) · **Expand** (feasibility pilot design, then ethics review and a deployment decision) · **Redesign** (e.g., State Reset intolerable, or trace outcome unworkable) · **Stop** (no signal, and the redesign reasons are exhausted) |

**The research track above is unchanged.** A **product track** runs alongside it (details, acceptance criteria and isolation tests in `docs/product-model.md`).
- **Go-live** means merged to `main` and running in local production. Public hosting is a later, extra gate for each model (hosting, TLS, production authentication, privacy notice).
- Each model starts with its own plan for approval.

| Phase | Covers | Depends on | Goes live when |
|---|---|---|---|
| **E: Environments** | Development/production split and guards; production served by the API; release procedure; `try` mode; exposure rule | — | Before phase-1 day 1 |
| **M1: Try it** | Result-sink boundary, end-of-visit choices, storage sentence, safe-unsupervised flag, booth profile | E | M1 acceptance criteria and isolation tests pass |
| **M2: Personal** | Optional accounts, owned records, My history, saving a guest visit, rule-based suggestions | M1 live | M2 criteria, including the cross-account isolation tests, pass |
| **M3: Organisational** | Organisations, roles, grants, access log, professional configuration | M2 live | Cross-organisation isolation tests pass; supervised expert testing (in person, ≥ 3 organisations, ≥ 5 qualified professionals, no real clients) is complete; release gate passed (legal and regulatory review of the intended use for each organisation type, including the medical-device question; security review; data-protection impact assessment) |
| **H: Public hosting** (per model) | Server, domain, TLS, production authentication, privacy notice, data-protection review | That model is live locally | Its own gate |
| **S: Science explanations** (revision 6.1) | A "Why this exercise?" explanation for the four current experiences (§3.1), plus its content test. From then on, every new experience ships with one | E; your content review. Until Houben 2020 is ✔F, State Reset's explanation cites only ✔F sources (Engelhard 2011, Holmes 2010) | The §3.1 checks pass; the content review finds every explanation accurate against its sources; experiment exercises unchanged; Try it unrestricted. **Status (2026-11-01):** built on `test` (`content/science/*.v1.json`, `app-science-section`, content test); awaiting your content review before release |

**Future research candidates** (not in any phase): **Memory update** (memory reconsolidation, §3.2). It passes gates 1–5 in §3.2 before any build, and it depends on M2 for return visits. Its area (provisionally Emotional regulation) is re-decided after the evidence review.

## 10. Assumptions, risks, open questions, deferred decisions
- **Assumptions:**
  - Whatever you study, you remember to press "I'm starting now" on My experiment when you begin (§4.2).
  - Testers attend in person.
  - Native PostgreSQL can be installed with admin rights.
- **Risks:**
  - State Reset is the least validated mechanism in the plan.
  - Holding an aversive image may briefly raise distress (mitigated by a stop option and by restricting images to study topics).
  - n-of-1 expectancy effects.
  - **A study-log note proves starting, not study quality or duration.**
  - The trace depends on following the rule. A missed note counts as a non-start unless the day log records an explaining deviation.
  - **A forgotten study-start click counts as a non-start.** The box is shown at the top of My experiment after each session to reduce this.
  - The study-start box sits in the same app as the sessions. It is identical in every condition, but returning to My experiment may act as a reminder for both conditions.
  - Accidental reset of n-of-1 data (mitigated by backup and confirmation).
  - The app connects as the `postgres` superuser, so a misconfigured URL could affect other databases on this server (mitigated: the test suite refuses identical dev and test databases).
  - Action Bridge's realistic effect (d ≈ .15 bias-adjusted) is too small for the n-of-1 to detect reliably.
  - **Try it during the experiment** may contaminate control days, and possibly more often on one condition (unblinded). This is recorded and analysed, not blocked (§4.2).
  - **A release to production during a phase** could change the experiment. Releases are logged, and changes that affect the experiment need a protocol amendment.
  - **Organisational use may change the product's intended use** (the medical-device question). Its release gate covers this; nothing is offered to clinics before it.
  - The 8 × 24 s State Reset (about 4.5 min plus ratings) may feel long. Usability testing checks tolerability before phase 2.
  - **Science explanations could overclaim,** or read as if a cited study validated our exercise (mitigated by the §3.1 standard, its content test and the content review). They could also raise expectations, which is why they aren't shown inside experiment exercises.
  - **Memory reconsolidation** carries several risks: popular accounts overstate it, and human replications have failed. Reactivating unpleasant memories may cause distress. These are mitigated by the §3.2 gates: no design before the evidence review, never trauma, and no drugs.
- **Open questions:**
  - Does vividness of anticipatory imagery predict avoidance for you?
  - Is 8 × 24 s tolerable in daily use, or does it need shortening (which would mean a new content version)?
  - Should the image-only control be built in Stage 3 or wait until the effect study?
  - Does any behavioural reconsolidation paradigm hold up for everyday memories, outside the lab (§3.2, gate 1)?
  - Is a separate Memory area ever justified? Revisit if two or more memory-focused experiences pass their gates.
- **Deferred decisions:** product name · hosting, sign-in method and anonymous-count consent mode (decided in the M2 and H plans) · formal studies · Interpretation Shift build (conditional) · Small Achievable Challenge · new experience families · recommendation algorithms · generative AI · the 2 × 2 factorial.

## 11. Departures from the original vision (confirm or overrule each)
| Your concept | This plan | One-line reason |
|---|---|---|
| Stealth: users don't know they are being helped | **Transparent**: each experience explains its purpose | Respect for persons; deception damages trust and consent |
| Subliminal or subconscious signals, colour or sound "triggers" | **Not used** | No reliable evidence (◐ replication failures); risk of misleading claims |
| Find each person's underlying cause | **Screening and routing only, no diagnosis** | Self-report can't reliably reveal causes; diagnosis is clinical |
| Any engaging puzzle can reset the mind | **Only State Reset, with image-holding and a game-only control** | Generic games show no far transfer; the effect may be distraction alone |
| A "magic wand" | **Claims proportional to the evidence** | Effects in this field are small and often fade |
| Tetris-style resets (from trauma research) | **Restricted to study-related images, never trauma** | Trauma work is clinical |
| Videos, sounds, positive visual atmosphere | **Not in the first build** | Not tied to the target outcome; possible later family |
| AI companion | **Deferred** | No current requirement; dependence risks (✔A) |
| Personalised matching | **Deferred** | No evidence that matching beats a good default |
| Every barrier gets an exercise | **Practical and clinical routes get no exercise** | Wrong intervention for the problem |
| "Therapy memory" | **"My history"**: a personal history the user controls (M2) | It isn't a clinical record. The name sets expectations and may affect how the data is classified |
| Clinical deployment | **Organisational model (M3)** only after supervised expert testing and a legal, regulatory, security and data-protection gate | Professional use for clients may make the software a regulated medical device |
| Experience booths | **A Try it deployment profile**; a staffed pop-up before any hardware | Demand and operating costs are unknown |
| Memory reconsolidation experience | **Future research candidate** (§3.2), gated by an evidence review; provisionally in Emotional regulation; never trauma; no drugs; **not** a reinterpretation of State Reset | Human evidence is mixed, and the lab paradigms aren't proven reconsolidation interventions |

## 12. Change log (from revision 4)
| Type | Item | Why |
|---|---|---|
| **Added** | State Reset candidate + game-only control; n-of-1 design with a trace outcome; outcome hierarchy L1–L5; product-feel measures and the return-intention criterion; ✔F/✔A/◐ marks; A/B/C levels; ethics and data baselines; departures table | User requirements; the core mechanic is restored with a testable mechanism |
| **Simplified** | 9 endpoints → 4 (A) + 3 (B); 9 tables → 1 (A) + 2 (B); YAML + Pydantic content with DB copies → versioned JSON files; host registry → simple interface; event batches → session upsert; three terminals → two | Build only what current requirements need |
| **Deferred (C)** | Allocation engine; raw events; DB content copies; standardised learning unit; exports; generated types; accounts; external pilot; 2 × 2 factorial; Interpretation Shift software (conditional) | No current requirement; each has a stated migration path |
| **Removed** | Docker/Compose; neutral visual search; screening/stratification machinery in the local build | Native PostgreSQL required; the search task overlapped with State Reset; no local randomised study |
| **Corrected** | Rev. 4's "✔" marks were mostly abstract-level → now ✔A. "9 endpoints" had listed 10 rows. Playwright browser install was missing. Async-free test fixtures are now explicit. Lally, Milkman and Troy downgraded to ◐ | Accuracy |
| **Retained** | Vision; stack; Action Bridge vs goal restatement; claim levels; stage boundaries; loopback-only security; WCAG 2.2 AA; deferral of AI, recommendations and deployment | Still justified |

### Revision 5.1 amendments
| Type | Item | Why |
|---|---|---|
| **Added** | n-of-1 **phase 2**: State Reset vs game-only, Action Bridge held constant; same randomisation, schedule hashing, outcome, minimum days and analysis as phase 1; washout rules; limits (unblinded image condition). Phases are analysed separately | Tests the core mechanic on your own use |
| **Changed** | The trace rule is now a standing study rule in a **fixed workspace**, identical across conditions and absent from all experience content. It replaces "first actions must leave a trace", which had sat inside Action Bridge | Removes measurement asymmetry between conditions |
| **Added** | Session timing: a planned start time recorded the evening before; the session starts then (±15 min); the 120-minute window starts at session end | The window has the same meaning every day |
| **Changed** | The secondary rating "starting felt easier" became "starting feels unpleasant" (0–10), asked before and after the session | A measure that works in both phase-2 conditions without introducing the image |
| **Changed** | Timeline rebuilt at ~4 eligible days per week: Stage 3 weeks 4–5; Stage 4 weeks 6–15 (up to 19 at target days); gate at week ~16 (up to ~20) | Realistic duration; removes the Stage 3/Stage 4 week-4 overlap |
| **Changed** | §2.3 is now ranked by decision impact. Only rank-1 claims (Action Bridge and State Reset) block Stage 2; rank-2 claims block phase 2; the rest are upgraded during Stages 2–4 | Upgrades are proportionate to the decisions they affect |
| **Corrected** | Sinha & Kapur 2021 downgraded to ◐ (the earlier link was a news article; the primary DOI is listed but not yet checked). `psql`/`pg_dump` on PATH added to prerequisites | Accuracy; reset-db depends on them |

### Revision 5.2 amendments (implementation decisions, 2026-10-29/30)
| Type | Item | Why |
|---|---|---|
| **Verified** | Gollwitzer & Sheeran 2006, Sheeran et al. 2024, Engelhard 2011 and Holmes 2010 upgraded to ✔F. Houben 2020 and Engelhard 2010 not accessed (user to obtain) | Stage 1 |
| **Changed** | Action Bridge expectations: bias-adjusted d ≈ .15, ≈ 0 with weak intentions. Phase 1 reframed as feasibility and personal signal; a null result is expected | Sheeran et al. 2024 (✔F) |
| **Changed** | State Reset dose: 10 s hold + **8 × 24 s** sets with 10 s pauses (content v2), for both phase-2 conditions. Was "~10 s hold + ~2 min game" | Matches the verified protocol (Engelhard 2011 ✔F); user decision |
| **Corrected** | The verbal-game harm finding appears in 1 of 2 experiments, not as a general result | Holmes 2010 (✔F) |
| **Deviation** | Stage 2 started before two rank-1 papers were read; both must be ✔F before phase 2 | User go-ahead; recorded in §2.3 |
| **Changed** | Database user `postgres` instead of a dedicated `app_user` | User decision; trade-off recorded in §6.1 and §10 |
| **Changed** | Ports 4300 (web) and 8100 (API); the API runs with `--reload-dir app` | Conflicts with other local projects; the reloader otherwise watches `.venv` |
| **Added** | Sessions are created only on **Begin session**; saves run one after another | Found in the live walkthrough: a reload silently created an orphaned session |
| **Added** | Game cursor: each fresh arrow-key press moves 8 px immediately | Found in the live walkthrough: quick taps barely moved the cursor |
| **Specified** | Game choice: dot-following tracking (Lissajous path, pointer or arrow keys; half speed with reduced motion). Python 3.13 via uv | Implementation detail settled during Stage 2 |

### Revision 5.3 amendments (2026-10-30)
| Type | Item | Why |
|---|---|---|
| **Changed** | The "fixed study workspace" became a **topic-neutral study log**, `C:\Projects\study-log`. The first study act is creating or saving and committing `YYYY-MM-DD.md` with one line naming what is started. Study material isn't moved | User decision: the study topic varies, so the trace must not be tied to one subject |
| **Changed** | Primary outcome: first save or commit in the study log within 120 min after session end; the source (`commit` or `save`) is recorded per day | Commits are robust; uncommitted saves are measured from file creation time only |
| **Added** | Day log (`data/n-of-1/day-log.csv`) for planned starts, eligibility and deviations, kept **outside** the study log | An evening entry in the study log could be miscounted as a start |
| **Added** | `docs/protocol-n-of-1.md` (v1.0); `analysis/` with `make_schedule.py` (blocked pairs, recorded seed, SHA-256, never overwrites) and `n_of_1.py` (outcome assembly, exact within-pair randomisation test), tested on synthetic data | Stage 1 deliverables on the phase-1 critical path |
| **Added** | Limitations: a note proves starting, not quality; the trace depends on rule-following; commit times are self-controlled; uncommitted save times are approximate | Recorded in §10 and in the protocol |

### Revision 5.4 amendments (2026-10-30; protocol v1.1)
| Type | Item | Why |
|---|---|---|
| **Removed** | The content lock (`content.lock.json` and its test) at every level: §6.1, §6.2, §8, Stage 3 in §9, and the earlier 5.0 change-log line. It was never implemented. Versioned content files and per-session `content_versions` remain | User decision: feature not wanted |
| **Added** | `analysis/next_slot.py` + reveal log (`data/n-of-1/reveal-log.csv`). The tool checks the schedule hash, prints only the next unused slot and its condition, never repeats a slot, and allows one reveal per day. The protocol now uses it instead of reading the CSV. The analysis maps each session day to the slot revealed that day | Prevents looking ahead; an unused revealed slot can no longer shift later days onto the wrong slot |
| **Added** | Day status `eligible_no_session` as its own outcome category (feasibility; uses no slot), counted per phase by the analysis, together with `session` and `ineligible`. Minimum sample wording changed to "20 **session** days" | User requirement; separates feasibility from the randomised comparison |
| **Deviation** | Phase 1 may start once the study log exists and protocol v1.1 is approved, without waiting for the rest of Stage 3. Phase 2 keeps its prerequisites (§4.2, §9 Stage 4) | User decision: the phase-1 conditions are already built and checked |
| **Recorded** | The phase-1 schedule was generated before protocol approval. It is kept (no allocation-relevant change; contents not viewed); regenerate only if slot count or allocation changes, never after day 1 (protocol §13) | Transparency |
| **Corrected** | §1: the study topic varies (not only AI/ML). §9 Stage 1: "study log" replaces "fixed study workspace" | Stale wording |

### Revision 5.5 amendments (2026-10-30; protocol v1.2)
| Type | Item | Why |
|---|---|---|
| **Changed** | Folder layout: `C:\Projects\new_project` is the project root. Everything that was in it moved to `platform\`, and `study-log\` sits beside it as a plain folder. Environments were rebuilt (`uv sync`, `npm ci`). Paths updated in plan, protocol, runbook, scripts and analysis defaults. No git repository created or changed | User decision; git is set up by the user |
| **Changed** | Study log without git. The primary outcome is the creation time of that day's note `study-log\YYYY-MM-DD.md`, if within 120 min after session end. Note status per day (`within_window`, `after_window`, `before_session_end`, `missing`) is reported | No commits exist to measure |
| **Removed** | The commit source and the save-vs-commit sensitivity analysis; Git from the prerequisites | Follows from the above |
| **Added** | Rule and limitation: notes are created only with `Add-Content` (never an editor) and only appended to; never edited, renamed, deleted or recreated, so the creation time is never reset. The data rest on this rule | File creation time is the only record |
| **Verified** | The phase-1 schedule was not regenerated; its SHA-256 still matches the protocol (`5c22d984…c84e`) | Allocation unchanged |

### Revision 5.6 amendments (2026-10-31; protocol v1.3)
| Type | Item | Why |
|---|---|---|
| **Changed** | All daily n-of-1 records move into the app (**Today** page): plan tomorrow, report a barrier, start today's session (server-side reveal with the condition locked), record the study start. Replaces the hand-edited day-log CSV, `next_slot.py` and `Add-Content` notes | Daily command-line records aren't feasible and invite deviations (user feedback). The app is still started developer-style |
| **Changed** | Primary outcome: the **server-recorded study start** within 120 min after session end. The study-log note is now a server-written, append-only mirror | More reliable than file creation times; no hand-made files |
| **Added** | Local time (Europe/Istanbul) for all n-of-1 dates and day boundaries, tested near midnight; a start after midnight belongs to the evening session | User requirement |
| **Added** | Automatic late-start deviation (> 15 min after the planned start); barrier counts as `ineligible` only before the planned start, otherwise flagged late and counts as `eligible_no_session` | User requirement; removes judgement calls from the records |
| **Added** | Phase 0 test phase (dev-mode sessions, never analysed) for walkthroughs | Live checks must not touch phase-1 records |
| **Added** | Tables `n1_days`, `n1_reveals`, `n1_study_starts`; `sessions.n1_reveal_id`; endpoints under `/api/n1`; `app.manage export-n1` (no free text); `n_of_1.py` reads that export and computes the sensitivity analyses automatically | Implementation |
| **Changed** | Every revealed slot is analysed as assigned, whether its session was completed, aborted, unfinished or not begun (an unfinished one timed from its last saved step, `sessions.last_saved_at`; one not begun from the reveal). A revealed day is never `eligible_no_session`. Completion status is reported per day and by condition; completed-only is a sensitivity analysis, never primary. The study-start box appears once a slot is revealed; after a recorded start the session can't be begun | Resolves a §5/§8 conflict in the protocol draft; the comparison stays as randomised from the reveal on |
| **Removed** | `analysis/next_slot.py`, `analysis/study_logs.py`, the day-log and reveal-log CSVs, and the note-creation-time outcome; the Development page no longer offers self-use mode | Superseded; prevents unlinked self-use sessions |
| **Added** | Limitations: a forgotten study-start click counts as a non-start (box shown prominently after a session); the box sits in the same app as the sessions | User requirement |
| **Security** | Database URLs are excluded from settings `repr`, so passwords can't appear in logs or test output | A test failure had printed the URL |

### Revision 5.7 amendments (2026-10-31; protocol v1.4)
| Type | Item | Why |
|---|---|---|
| **Added** | **Platform structure:** Home presents areas (Action and growth available; Cognitive shifts, Attention, Emotional regulation, Recovery after setbacks, Curiosity and exploration, Learning reinforcement planned) and an optional conversation guide as a planned cross-area band. The first feature is the topic "Getting started on learning" inside Action and growth. Areas are data (`web/src/app/areas.ts`), so research can reshape them | The first feature must not define the product's limits (user review) |
| **Changed** | Navigation: Home · My experiment · My records, About in the footer. Development is replaced by **Try it** (practice) on the area page; old links redirect | The tabs were unclear to new users |
| **Changed** | Plain on-screen wording: "exercise" for a session, "My experiment" for the n-of-1, no "study", no phase labels, on-screen names for the conditions. Content: `action-bridge` v2, `goal-restatement` v2 (parallel intros, no efficacy claims), `ratings` v2 | "Study" was ambiguous; internal names meant nothing to users |
| **Changed** | State Reset v3: an intro listing the parts; the picture chosen and described in its own step and quoted back (never saved); a labelled preview and a 15 s practice round in both variants; dose unchanged. Picture invitation broadened, limited to today's learning in the experiment | Instructions must be understandable when they appear; no exercise starts unseen |
| **Added** | `today_view.progress` (session days, planned days); the done screen no longer mentions the outcome window | Orientation for the user; the outcome stays unmentioned in exercises |

### Revision 6.0 amendments (2026-11-01; protocol v1.4 amended, then approved 2026-11-01)
| Type | Item | Why |
|---|---|---|
| **Added** | `docs/product-model.md`: three usage models (Try it, Personal, Organisational) on one shared library and runtime; data tiers; per-model acceptance criteria and isolation tests; the booth as a Try it profile. It replaces `usage-models-assessment.md` | Product decisions 1–2 (user, 2026-11-01). Try it without restrictions is a core requirement, not a design flaw |
| **Added** | Product track in §9 (E, M1, M2, M3, H): each model is built, integrated, tested and released on its own; public hosting is an extra gate for each model | Product decision 1; go-live means local production until there is a server |
| **Added** | Organisational release gate: supervised in-person expert testing with clinics and qualified professionals (no real clients), plus legal and regulatory review of the intended use for each organisation type (including the medical-device question), security review and a data-protection impact assessment | Product decision 2 |
| **Added** | **Environments:** development on `test` (`app_dev`, `app_test`, Test mode only, ports 4310/8110) and production on `main` in `platform-prod` (`app_prod`, `app_test_main`, port 4300, the n-of-1). Server guards, `reset-db` refused in production, `backup` command, production serving the built web app, a Development badge, and the release procedure (§6.1, §6.2, §7, runbook) | Product decision 3: development must never affect the experiment |
| **Added** | **Exposure rule:** `try` mode (migration `0004`), Try it runs in the phase export, day classification, two sensitivity analyses and counts by condition; the primary analysis is unchanged (§4.2, protocol §7) | Unrestricted Try it must be recorded and interpreted, not ignored and not blocked |
| **Changed** | Phase-1 prerequisite: the production environment must exist (§9, protocol §9) | The n-of-1 runs only in production |
| **Changed** | §1 product concept; §6.1 accounts row (now M2/M3); §8 isolation-test policy; §10 risks and deferred decisions; §11 three new departures | Follow from the product decisions |
| **Retained** | **Research track unchanged:** Stages 1–5, both n-of-1 phases, allocation and the phase-1 schedule (SHA-256 unchanged), primary analysis, evidence marks, safety boundaries | Product decision 4 |

### Revision 6.1 amendments (2026-11-01)
| Type | Item | Why |
|---|---|---|
| **Added** | **Science explanation for every experience** (§1, §3.1): five parts, wording tied to evidence marks, a required "About this exercise" statement separating evidence for the method from evidence for our exercise, a "Why this exercise?" section on the preview and done screens, content checks (§8), product phase **S** (§9) | User requirement: users should understand what they do, why, and what supports it |
| **Added** | **Memory reconsolidation as a future research candidate** ("Memory update", §2.2, §3, §3.2): five gates (evidence review, design feasibility, safety and ethics review, usability, feasibility study); depends on M2; area provisionally Emotional regulation, re-decided after the evidence review; sources to verify (§2.3, `evidence-verification.md`) | User requirement. Treated as a candidate, not a validated intervention; reminder-plus-Tetris and similar designs are research paradigms |
| **Clarified** | State Reset is working-memory taxation, **not** reconsolidation (§3.2) | Keeps the two mechanisms scientifically distinct |
| **Added** | Risks and open questions (§10); a departure row (§11) | Follow from the above |
| **Retained** | The n-of-1 protocol (v1.4, approved) and State Reset's description are unchanged. Explanations aren't added to experiment exercises; Try it access is unchanged and unrestricted | User instruction |
| **Built** | Phase S: four explanations (`web/src/content/science/*.v1.json`, sources with evidence marks in `sources.v1.json`); the "Why this exercise?" section on the practice preview and done screens, opened from a link on each area-page card; a content test enforcing §3.1; not shown in experiment or Test mode exercises | User go-ahead, 2026-11-01. Release waits for your content review |
| **Changed** | The "Why this exercise?" section is redesigned (design A, chosen from three previews): a panel bar with icon and method name, icon headings per part, findings as blocks with their evidence level, a highlighted "About this exercise" callout, numbered sources. Still in the page and collapsed by default; content unchanged. The length guideline is widened to about 120–280 words, to fit the expanded State Reset principle | User request; the expanded principle text is the user's own edit |
| **Changed** | Area-page cards name their method (icon and name, under the description) instead of repeating a "Why this exercise?" link; the method links to the explanation as before. The two baseline exercises are named by the research concepts they use (Goal intentions, Distraction), not "comparison" | User feedback: the repeated links cluttered the cards, and "comparison" means nothing to a Try it visitor |
| **Corrected** | §3.1 wording rule: "Research found…" (✔F) and "Research suggests…" (✔A), because "study" isn't used on screen. The Webb 2012 reference link pointed to the authors' 2013 reply; it now points to the 2012 meta-analysis (PMID 22582737) | Accuracy |

### Revision 6.2 amendments (2026-11-01; Stage 3)
| Type | Item | Why |
|---|---|---|
| **Added** | **Browser tests** (`web/e2e/`, Playwright with axe), run by `check.ps1`: every exercise completed keyboard-only with its saved step summary checked; axe scans for WCAG 2.2 AA on every page, every exercise step, every opened explanation and the dark scheme (no serious or critical violations); reduced motion halves the dot speed; a test proving the scan catches a planted problem. They use the installed Edge and their own API on the test database (`api/app/e2e_server.py`, ports 4320/8120), never `app_dev` or `app_prod`. The first run found no accessibility problems to fix | Stage 3 criteria: no serious axe violations; scripted runs record correct step summaries |
| **Added** | **Sound version of the dot game** (`state-reset-sound` v1, a tone game): respond to high tones with Space or a button, same timing, practice and hold. Offered in Try it only; experiment exercises keep the dot game. Recorded as `task: sound` with hits, misses and false alarms; its content version is recorded only when used | Plan §8: a non-visual State Reset variant for people who can't follow a moving dot. Evidence for tone tasks as working-memory taxation is ◐ (Houben 2020 not yet read); the offer says it hasn't been tested |
| **Added** | `docs/usability-procedure.md` (rotated order, questions including SUS and the "made it worse" item, distress handling, a separate `app_usability` database, deletion within 30 days, go/amend/redesign criteria) and `docs/consent-usability.md` (plain-language consent) | Stage 1 and Stage 4 deliverables; plan §5 and §8 |
| **Added** | `docs/content-review.md`: a checklist for on-screen texts and science explanations, the files to review, and a review record | Stage 3 criterion: reviewers find no invalidating content |
| **Not done** | Participant codes and consent records in the app (level B software) are left for later; paper consent covers 5–8 testers. Interpretation Shift stays conditional | Not needed for the first usability sessions |
| **Retained** | The protocol, the experiment's exercises and content versions, and Try it access are unchanged | — |

### Revision 6.3 amendments (2026-11-02; Cognitive shifts, Stage 4 begun)
| Type | Item | Why |
|---|---|---|
| **Approved** | **Cognitive shifts Area**, Stage 2 (`cognitive-shifts-proposal.md`: scope, boundary rule, catalogue; first release CS1 "Other ways to read it", CS2 "Why did it happen?", CS3 "Not enough to go on"; no standalone growth-mindset exercise; CS3 replaces Interpretation Shift, CS5 later) and Stage 3 with four changes (`cognitive-shifts-design.md`, `cognitive-shifts-review-form.md`) | User review, 2026-11-02 |
| **Added** | **Golden tests for the experiment exercises** (`web/src/app/flow/golden.spec.ts`, `__golden__/experiment-exercises.json`): ten scripted runs of the four exercises (Try it, experiment, Test mode, stopped) pin every saved request body and every screen's text, including the "Why this exercise?" texts. Generated from the code before the refactor; never regenerated | Proof that the refactor leaves the experiment unchanged |
| **Changed** | **Experience registry** (`web/src/app/experiences/registry.ts`): exercises now come from one registry (steps, names, minutes, method, experiment phase or none). The four experiment entries were moved unchanged; `flow/conditions.ts` keeps the experiment's view of them. The session runner refuses exercises outside the experiment unless in Try it without a reveal | Plan §6.1: a registry once there are more than about five exercises |
| **Changed** | **API and database:** `ExerciseId` adds the three Cognitive shifts ids; any exercise that isn't an experiment condition is refused in `self_use`/`dev` mode or with a reveal. Migration `0005` only widens `ck_sessions_condition`; a test shows the n-of-1 export is byte-identical before and after it | Stage 4 groundwork |
| **Retained** | The four experiment exercises' behaviour, saved records, texts, science texts and content versions; the n-of-1 code, schedule (SHA-256 unchanged), analysis and protocol. **No protocol change:** this release should precede phase-1 day 1; if it lands later, it is logged as a release during a phase (protocol §8) | Golden tests, export test and browser tests all unchanged and green |
| **Pending** | The three Cognitive shifts exercises (Try it, development only until the content review and the full-text gates pass) | Next Stage 4 step |

### Revision 6.4 amendments (2026-11-02; Cognitive shifts exercises built)
| Type | Item | Why |
|---|---|---|
| **Added** | **CS1 "Other ways to read it"** (reappraisal: three lenses, fit board, controllability check), **CS2 "Why did it happen?"** (attributional reframing: cause map on three scales, rule-based statements), **CS3 "Not enough to go on"** (perspective-getting: share of 10 points, finding out). Fixed durations 5, 5 and 4 minutes. Content `cs-*.v1.json`; code in `web/src/app/experiences/cognitive-shifts/` | Approved design (`cognitive-shifts-design.md`) |
| **Added** | **Cognitive shifts Area**, status `development`: open in the development build only (Home and area page ask `/api/health`), shown as planned in production. The API refuses saves for these exercises in production. Exercises open only in Try it, never in the experiment | Development-only until the content review and full-text gates pass |
| **Added** | Science explanations for the three exercises with evidence layers ("Research on the method" / "Research on similar exercises") and a population line per finding; their sources live in `science/sources-cs.v1.json`. The four experiment explanations and `sources.v1.json` are unchanged until phase 2 ends | Stage 3 changes 1 and 2 |
| **Added** | Tests: rules (`cs-logic.spec.ts`), full runs through the session page with "never saved" checks for every typed text (`cs-exercises.spec.ts`), science fields, Area visibility; browser tests (`e2e/cognitive-shifts.spec.ts`): keyboard-only paths with axe on every screen, dark mode, phone width. The first run found 18 px radio targets on the fit board (WCAG 2.2 target size); fixed | Stage 4 acceptance |
| **Retained** | Golden tests unchanged (fingerprint `0425afde…`); experiment exercises, content versions, science texts, n-of-1, schedule (SHA-256 unchanged), analysis and protocol unchanged | — |
| **Pending** | Release gates (design §9): full texts (✔F) for every cited source, content review by at least 3 reviewers with `cognitive-shifts-review-form.md`. Only then does the area become `available` and the API gate open | — |

### Revision 6.5 amendments (2026-11-03; Cognitive shifts revised before the content review)
| Type | Item | Why |
|---|---|---|
| **Added** | Review and release plan (`cognitive-shifts-review-plan.md`): 3 reviewers, remote walkthrough and consolidation allowed, safety veto for the psychology-trained reviewer, results spreadsheet | Release gate (design §9) |
| **Changed** | Science texts corrected after reading 7 sources in full (`evidence-verification.md`); "Why it's worth doing" added to all three explanations | Full-text gate; plain-language purpose |
| **Changed** | "Write my own" is an option among the cards in every pick-one step (content `cs-other-readings` v3, `cs-why-it-happened` v2) | Selection always visible; nothing unticked while typing |
| **Changed** | **CS3 redesign** (`cs3-redesign-proposal.md` revision 2; content `cs-not-enough` v3): readings by rules; the 10-point share replaced by "Could these explain it?" with the facts shown next to the question; one "Can you find out?" step; no judgement of the certainty change; two questions to keep | Listing alternatives shifts likelihood estimates by itself (support theory, read in full in Redelmeier et al. 1995), so the points couldn't show a change of belief; the step now practises checking whether the facts can tell readings apart |
| **Changed** | Review form part D (distinct and covering, per scenario) and part E (does step 3 read as a fact check; "what did this exercise teach you?"); CS3 scenario rule in the review plan | Revision 2, decisions 2 and 5 |
| **Changed** | CS3 step 5 (2026-11-04; content `cs-not-enough` v4): both ratings kept as a before and after for the same first reading; step 5 says so, says no direction is expected, and shows both numbers after rating | Step 5 looked like a repeat of step 2, with no visible purpose |
| **Changed** | CS1 step 5 (2026-11-04; content `cs-other-readings` v5): belief and upset kept as a before and after for the same first reading; step 5 says so, says no direction is expected, and shows both pairs of numbers after rating | Step 5 looked like a repeat of step 2, with no visible purpose |
| **Changed** | CS1 Lens 2 (2026-11-04; content `cs-other-readings` v4): the friend's perspective is set up above the question, replacing a fixed line below the options | The line read like feedback on the selected answer, and the roles weren't clear |
| **Removed** | The word limit on science explanations (§3.1 and its test). No length limit applies to explanations in any exercise | Each exercise has its own needs, so no shared length standard fits them all |
| **Retained** | Experiment exercises, golden tests, protocol, n-of-1 and schedule unchanged; Cognitive shifts still development-only; only ✔F sources added on screen | — |
| **Added** | **MCII exercise** (`mcii-design.md`; 2026-11-06): "Your wish, and what's in the way", Try it only and development only, in a new Action and growth topic. Wish, best part, obstacle, a decision about the wish, an if-then plan, a close. No typed text saved | Mental contrasting with implementation intentions; the method's evidence is kept apart by track in `evidence-verification.md` |
| **Added** | Visual contract (`web/src/app/shared/visual/`): an exercise asks for a scene and a bound source decides what to show, so a source can change without touching steps, rules, records or texts. Built-in path, wall and bridge picture only. **No image generation or provider is built or chosen**; generative AI stays deferred (§10), and the picture isn't presented as part of the method | Future visual assets, with a test that the exercise behaves the same with no picture or a failing one |
| **Added** | Migration `0006` widens `ck_sessions_condition` for `mcii`. No existing row changes, and the n-of-1 export hash is tested across it | Same pattern as `0005` |
| **Changed** | Area page hides a topic with no visible exercises; a topic can have its own note. `science.spec.ts` separates experiment explanations with `isCondition`, not the `cs_` prefix, and now requires an explanation for every registered exercise | A development-only topic in a released area would otherwise be an empty section in production |
| **Open** | **Before MCII goes to production, protocol §7 and `classify_exposure` need a versioned change:** it contains an if-then plan, the active component a Goal restatement day lacks, so it should count as contaminated, not extra exposure | While development-only the API refuses it in production, so the experiment is unaffected |
| **Changed** | MCII steps 1 and 4 (content `mcii` v2): the likelihood questions say "that your wish will come true", and step 4 shows the wish | "It" could be read as the obstacle on step 4, which would make the comparison with step 1 unreliable |
| **Added** | MCII review form and results workbook (`mcii-review-form.md`, `mcii-review-results.xlsx`), with the Cognitive shifts rules and a part on the picture | Content review gate (`mcii-design.md` §7) |
| **Fixed** | `cognitive-shifts-review-results.xlsx`: highlights now show in Excel (7 rules). Their colour was stored where Excel doesn't read it. Items, formulas and rules are unchanged; checked in Excel on a copy | "Fail", "Veto" and "Not allowed" were hard to spot during a review |
| **Retained** | Experiment exercises, golden tests, protocol, n-of-1 and schedule unchanged | — |

### Revision 6.6 amendments (2026-11-07; Visual System foundations, documentation only)
| Type | Item | Why |
|---|---|---|
| **Approved** | **Visual System direction** (2026-11-07), with five refinements: a restrained first implementation; explicit visual quality criteria; generation, composition, styling, state, motion and rendering as independent capabilities; human review as an acceptance criterion; extensibility without bespoke renderers | User review of the Visual System plan (revision 3) |
| **Added** | `docs/visual-system.md` (architecture and foundations), `docs/visual-policy.md` (quality, clarity, scientific appropriateness, human review), `docs/visual-language.md` (S1 visual-language proposal, with a separate review sheet). All three are proposals for review | Phase 2 deliverables |
| **Proposed** | §11 "Videos, sounds, positive visual atmosphere": purposeful, policy-bound visuals in **development exercises** (illustrations and instruments under `visual-policy.md`). Videos, sounds and decorative atmosphere stay out. The §11 row changes only once the documents are approved | Visual System decision D5 |
| **Retained** | No application code, configuration, dependency or content changed. Experiment exercises, golden tests, protocol, n-of-1 and schedule unchanged | User instruction: documentation only until review |

### Revision 6.7 amendments (2026-11-07; Visual System v0.1 started)
| Type | Item | Why |
|---|---|---|
| **Approved** | Go-ahead for Visual System v0.1 after the Phase 2 documents and the S1 sheet | User go-ahead, 2026-11-07 |
| **Added** | `web/src/app/shared/visual/` gains `styling/`, `composition/`, `state/`, `rendering/`, `integration/`, `scenes/` and `testing/`; the Visual Lab at `/lab` (development build only, loaded on demand); `e2e/visual-lab.spec.ts`. Composition: `mcii.path@3` (four static states), in the Lab only, side by side with the current picture | `visual-system.md` §5.3, §15 |
| **Changed** (2026-11-08) | After review of `mcii.path@1`: the landscape, the five area studies and the generation code they used are removed. `mcii.path@2` keeps the original picture's composition and uses S1 only where it adds value. New principle: every visual element earns its place (`visual-policy.md` principle 6), enforced by a `purpose` on every scene element | User review: decoration without meaning competed with the exercise's elements |
| **Changed** (2026-11-08) | `mcii.path@3`: when the wish is set aside it keeps its colour, and only the path to it gets quieter. New rule: a change of state never changes what an element means, so hope-bearing elements keep their colour in every state (`visual-policy.md` §3.9) | User review: the wish stands for hope; grey read as loss |
| **Approved** (2026-11-08) | Your review of `mcii.path@3`'s static states: accepted (`visual-reviews.md`, entry 1), with 12 screenshot baselines. The psychology-trained reviewer's R2 is still needed before integration | User review: "I approve all" |
| **Added** (2026-11-08) | MCII step 4c, motion: `motion/` (S5), entrances and transitions in the scene specification, timelines in the SVG backend, the Lab's "Transitions" section. `mcii.path@4`: the wall rises, the bridge draws, emphasis changes ease; nothing moves under reduced motion. For review in the Lab before 4d | `visual-system.md` §8, §15 |
| **Approved** (2026-11-08) | Your review of the `mcii.path@4` transitions: accepted (`visual-reviews.md`, entry 2) | User review |
| **Changed** (2026-11-08) | MCII step 4d: the MCII exercise draws `mcii.path` on the development branch (`provideSceneVisuals`), with the change between steps animated; `visual_source` records `scene:mcii.path@4;theme:action@1`. The old picture (`mcii-path-scene.ts`, `mcii-visual-source.ts`, `builtin.v1`) and the Lab's comparison with it are removed. The renderer and the scene load on demand, so the first download stays within budget | `visual-system.md` §7, §9, §15 |
| **Changed** (2026-11-08) | Review workflow: reviews gate your merge to production, not anything in the software. R3 and the psychology-trained reviewer's suitability review happen in the test environment; no feature flags or approval switches | User decision: one engineer, a conventional development/test/production workflow |
| **Retained** (superseded for MCII by step 4d above) | No exercise shows a new visual yet: MCII still uses `builtin.v1`. No dependency, configuration or content change. Experiment exercises and golden tests unchanged. The §11 row changes with the first integration (MCII step 4d), not before | Composition first (`visual-system.md` §5.1); reviews R1 and R2 come first |

## References
- ✔F: [Gollwitzer & Sheeran 2006 (open-access scan)](https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f) · [Sheeran, Listrom & Gollwitzer 2024 (author manuscript)](https://kops.uni-konstanz.de/handle/123456789/69905) · [Engelhard et al. 2011](https://www.ifemdr.fr/wp-content/uploads/2011/10/Engelhard-et-al-2011-Reducing-vividness-and-emotional-intensity-of-recurrent-flashforwards.pdf) · [Holmes et al. 2010, PLoS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0013706)
- ✔A: [Steel 2007](https://prism.ucalgary.ca/handle/1880/47914) · [Sirois & Pychyl 2013](https://eprints.whiterose.ac.uk/91793/) · [Fodor 2020](https://pubmed.ncbi.nlm.nih.gov/32445689/) · [Sicouri 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10933640/) · [Lazowski & Hulleman 2016](https://www.scinapse.io/papers/2273590095) · [Houben et al. 2020 (abstract)](https://cris.maastrichtuniversity.nl/en/publications/the-effects-of-eye-movements-and-alternative-dual-tasks-on-the-vi) · [Iyadurai 2018](https://ora.ox.ac.uk/objects/uuid:111fe953-8e08-465a-b490-a596b9f0e7e0) · [Webb, Miles & Sheeran 2012](https://pubmed.ncbi.nlm.nih.gov/22582737/) · [Sala & Gobet](https://livrepository.liverpool.ac.uk/3043493/) · [Albulescu 2022](https://doaj.org/article/c6f37b6ba159469296b2cb968b65505f) · [Hagger 2016](https://research.tilburguniversity.edu/en/publications/a-multi-lab-pre-registered-replication-of-the-ego-depletion-effec/) · [Self-report vs logs 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12445496/) · [Credibility/expectancy questionnaire](https://pubmed.ncbi.nlm.nih.gov/11132119/) · [Bridges 2020 timing](https://peerj.com/articles/9414.pdf) · [MIT/OpenAI chatbot RCT](https://arxiv.org/pdf/2503.17473)
- ◐: [Sinha & Kapur 2021, primary DOI (not yet checked; the publisher page was inaccessible)](https://doi.org/10.3102/00346543211019105) · [Houben 2020 full text, DOI (not yet accessed)](https://doi.org/10.1177/2043808720907744) · [Engelhard et al. 2010, DOI (subscription; not yet accessed)](https://doi.org/10.1016/j.brat.2010.01.003) · [WM-taxation null result](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2015.00016/pdf) · [Skorka-Brown Tetris cravings](https://pearl.plymouth.ac.uk/handle/10026.1/2925) · [Skorka-Brown thesis](https://pearl.plymouth.ac.uk/psy-theses/124) · [Lally 2010 summary](https://www.thebehavioralscientist.com/articles/how-long-to-form-a-habit) · [Milkman 2021 summary](https://www.scimex.org/newsfeed/which-programs-give-gym-goers-the-biggest-boost) · [Troy 2013 press](https://www.psychologicalscience.org/news/releases/keeping-emotions-in-check-may-not-always-benefit-psychological-health.html) · [Randomisation tests for single-case designs](https://rd.springer.com/content/pdf/10.3758/s13428-017-0885-7.pdf) · [Pilot sample-size rules](https://arxiv.org/pdf/2105.05483) · [Avery 2017](https://eprints.whiterose.ac.uk/113663/)
