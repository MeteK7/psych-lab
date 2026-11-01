# Research-led plan: a web platform of psychologically informed interactive experiences (revision 5.6)

> **Status:** revision 5.1 approved 2026-10-29. Stage 1 is partly done (§2.3). The Stage 2 level-A prototype is built and checked (see `docs/runbook.md`). Revisions 5.2–5.7 record the decisions made during implementation (5.3: the study-log outcome, protocol and analysis scripts; 5.4: no content lock, slot reveal tool, the eligible-day-no-session outcome, an earlier phase-1 start; 5.5: folder restructure, study log without git; 5.6: all daily n-of-1 records in the app; protocol v1.3 approved 2026-10-31; 5.7: platform structure and plain on-screen wording, protocol v1.4 awaiting approval). The user performs all git actions. If a branch is needed, base it on `test-n552vx`, never `main`. No AI attribution anywhere in files, comments or docs.
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
- **Stack:** Angular + TypeScript, Python + FastAPI, PostgreSQL, built as a lean modular monolith. **This phase runs on your Windows computer only.**

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
| 4 | Lally 2010 · Troy 2013 · Milkman 2021 · Avery 2017 · Sinha & Kapur 2021 · attributional retraining | Background only; no decision rests on them | During Stages 2–4 | Open |

**Deviation:** Stage 2 went ahead with two rank-1 papers still unread (Houben 2020, Engelhard 2010), on the user's go-ahead. State Reset's mechanism currently rests on Engelhard 2011 (✔F) plus the Houben abstract (✔A). Both papers must be ✔F before n-of-1 phase 2 starts.

## 3. Candidate mechanisms: decisions

| Candidate | Principle | Product hypothesis | Decision |
|---|---|---|---|
| **Action Bridge**: cue + if-then plan + obstacle plan + tiny first step, then reading the plan twice (rehearsal) | Implementation intentions (✔F; small after bias adjustment; larger with rehearsal and strong intentions) | Planning at the moment of hesitation raises the chance you start your own study | **Adopt (A).** First factor tested, in the n-of-1. Built |
| **Goal restatement**: write your goal and today's topic; no cue and no if-then | The standard active control in implementation-intention research | — | **Adopt (A)** as the comparison condition |
| **State Reset**: hold the anticipated "starting/struggling" image for 10 s, then play a dot-following tracking game in **8 sets of 24 s with 10 s pauses** (about 4.5 min, content v2) while keeping the image in mind; rate vividness and emotionality before and after | Working-memory taxation of imagery (Engelhard 2011 ✔F; Houben 2020 ✔A). The dose follows Engelhard 2011's 8 × 24 s sets | It dulls aversive anticipatory images and so lowers avoidance | **Adopt (A) as an experimental candidate**, not as an evidence-based component. Limited to study-related images. **Never for trauma memories.** A stop option is always available. Built |
| **Game-only control**: the same game, the same 8 × 24 s timing and a duration-matched "get ready" phase, without holding the image | Isolates distraction or break effects | — | **Adopt (A).** **Replaces neutral visual search,** which overlapped with State Reset. Built |
| **Interpretation Shift** | CBM-I (lab and anxiety) | Learning-setback scenarios change interpretation and lead to starting | **Defer the software (B, conditional).** Draft the scenarios and have them reviewed in Stage 1; build only if the review passes. Content-heavy, and has a risk of invalidating people |
| **Small Achievable Challenge** | Domain-specific mastery | In-domain success leads to attempting the harder task | **Defer (C).** Needs domain content |
| **Neutral visual search** | — | — | **Remove.** It overlaps with State Reset |

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
| Accounts and authentication | C | Local single machine. To be designed only if deployment is decided |
| Separate test database `app_test` | A | Keeps tests away from your n-of-1 data. Costs nothing on a native install |
| Database user: the `postgres` superuser (user decision, 2026-10-29) | A | Simplest local setup. **Trade-off:** the app and tests can reach every database on this server. Tests refuse to run when both URLs point to the same database. Revisit (dedicated role) before any deployment |
| Ports: web **4300**, API **8100** | A | 4200 and 8000 are used by other local projects on this machine |

### 6.2 Repository layout
```
C:\Projects\new_project\                 project root (git set up by the user)
  study-log\                             plain folder: daily notes YYYY-MM-DD.md only (no git)
  platform\
    api/  pyproject.toml (uv) · .python-version (3.13) · alembic.ini
          app/{main,config,db,models,schemas,security,manage,n1,clock}.py · app/routes/{health,sessions,n1}.py · participants (B)
          alembic/versions/{0001_create_sessions,0002_n1_daily_records,0003_session_last_saved_at}.py · tests/
    web/  src/app/{api,flow,shared,areas.ts,pages/{home,area,experiment,records,about}}
          src/app/experiences/{rating-step,action-bridge,goal-restatement,state-reset}
          src/content/{ratings.v1,action-bridge.v1,goal-restatement.v1,state-reset.v1,state-reset.v2}.json
          proxy.conf.json
    analysis/  pyproject.toml (uv) · make_schedule.py · n_of_1.py (reads the export-n1 JSON) · tests/ · schedules/schedule-phase<N>.{csv,sha256,meta.json}
    data/exports/  phase<N>.json, per-day tables   (git-ignored)
    docs/  plan.md · evidence-verification.md · runbook.md · protocol-n-of-1.md · usability-procedure.md (B) · consent-usability.md (B)
    scripts/  check.ps1
    .env · .env.example · .gitignore (.env, data/) · .gitattributes
```
All commands in §7 run from `C:\Projects\new_project\platform`.

### 6.3 API (`/api`)
| Endpoint | Level | Purpose |
|---|---|---|
| `GET /health` | A | Liveness and database connectivity |
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
| `sessions` | A | `id` uuid (client-generated) · `mode` (self_use, usability, dev) · `condition` · `content_versions` jsonb · `steps` jsonb (step, content id/version, started/ended, result) · `plan` jsonb · `ratings` jsonb · `followup` jsonb · `status` · timestamps |
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
```
- Set `listen_addresses = 'localhost'` and keep `scram-sha-256` authentication in `pg_hba.conf`.
- Copy `.env.example` to `.env` and set `DATABASE_URL` and `TEST_DATABASE_URL` (`postgresql+psycopg://postgres:…@localhost:5432/app_dev` and `…/app_test`). Percent-encode special characters in the password.
- `.env` is git-ignored. `.env.example` contains placeholders only.
- To check that the *saved* file works, use the one-line command in `docs/runbook.md`.

**Install and migrate:**
```bash
cd api; uv sync; uv run alembic upgrade head
```
```bash
cd web; npm ci
```

**Start (two terminals; PostgreSQL already runs as a service):**
```bash
cd api; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8100 --reload-dir app
```
```bash
cd web; npm start
```
Then open `http://localhost:4300`. The Angular proxy forwards `/api`, so everything is on one origin and no CORS setup is needed. `--reload-dir app` stops the reloader from watching `api/.venv`, which otherwise restarts the API constantly.

**Test:** runs ruff, pytest against `app_test`, `ng test`, `ng build`, and (B) Playwright with axe.
```bash
powershell -File scripts/check.ps1
```

**Reset the dev database:** drops and recreates the `public` schema, then runs `alembic upgrade head`. **This destroys n-of-1 data**, so it asks for confirmation and first writes a `pg_dump` backup to `data/backups/`.
```bash
cd api; uv run python -m app.manage reset-db
```
The test database resets itself on each test run (migrate once; roll back a transaction per test).

**Stop:** Ctrl+C in both terminals. PostgreSQL can keep running. To stop it, use `Stop-Service postgresql-x64-<version>` (requires admin).

## 8. Testing, security, privacy and accessibility

| Area | A (prototype) | B (usability) | C |
|---|---|---|---|
| Backend tests | pytest: idempotent session upsert; condition validation; health check; migrations upgrade on an empty `app_test` | Consent and delete cascade | Allocation engine; exports |
| Frontend tests | Vitest: flow order per condition; Action Bridge validation; State Reset timing and completion logic | Playwright keyboard-only path + axe scan; reduced-motion path | Broad end-to-end tests; CI |
| Local security | API bound to `127.0.0.1`; `TrustedHostMiddleware` (localhost only, against DNS rebinding); writes require `Content-Type: application/json` + an `X-Client` header + an allowed `Origin` (blocks drive-by writes from websites) | — | Production authentication, CSRF tokens, TLS |
| Privacy | Self-use data stays local; goal text is optional | Testers: pseudonymous code, hypothetical goals, no health questions beyond "made it worse", free text deleted after the report, all tester data deleted within 30 days | Lawful basis, DPIA and retention policy before formal research |
| Accessibility | Keyboard path for every interaction; `prefers-reduced-motion` | WCAG 2.2 AA check; NVDA screen-reader pass; a **non-visual State Reset variant** (an auditory or counting dual task, which also taxes working memory, ◐) | Full audit |

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
| **3. Technical and content validation** (weeks 4–5) | Level-B items: keyboard/axe tests, reduced-motion and non-visual variants; walkthrough of all conditions; content review; Interpretation Shift build **only if** its review passed | Stage 2 | Testers | No serious axe violations; scripted runs record correct step summaries; reviewers find no invalidating content | Readiness for usability testing · Not usability itself | Proceed; or fix and re-run |
| **4. Local usability and feasibility** (usability weeks 6–8; phase 1 may begin earlier, see prerequisites; overall to ~week 15 at the minimum day count, up to week 19 at the target) | Usability sessions in weeks 6–8; n-of-1 phase 1 (20 session days at ~4 per week, about 5 weeks; up to 7 weeks for 28); 2-day gap; n-of-1 phase 2 (about 5–7 weeks); feasibility report including the `eligible_no_session` count per phase | **Usability:** Stage 3; signed consents. **Phase 1 (deliberate deviation):** only the study log + the approved protocol version; it doesn't wait for Stage 3. **Phase 2:** unchanged: usability showed State Reset is tolerable, the rank-1/rank-2 claims are ✔F, and its own hashed schedule exists | Remote recruitment; efficacy claims | §5 go/amend criteria; **each phase** has ≥ 20 session days with ≥ 90% usable trace data | Usability, product feel, measurability, your personal signal · **Not efficacy** | — |
| **5. Decision gate** (week ~16 at the minimum day count; ~20 at the target) | A recorded decision | Stage 4 report | — | Decision justified by the data | — | **Refine** (amend criteria) · **Expand** (feasibility pilot design, then ethics review and a deployment decision) · **Redesign** (e.g., State Reset intolerable, or trace outcome unworkable) · **Stop** (no signal, and the redesign reasons are exhausted) |

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
  - The 8 × 24 s State Reset (about 4.5 min plus ratings) may feel long. Usability testing checks tolerability before phase 2.
- **Open questions:**
  - Does vividness of anticipatory imagery predict avoidance for you?
  - Is 8 × 24 s tolerable in daily use, or does it need shortening (which would mean a new content version)?
  - Should the image-only control be built in Stage 3 or wait until the effect study?
- **Deferred decisions:** product name · deployment and authentication · formal studies · Interpretation Shift build (conditional) · Small Achievable Challenge · new experience families · recommendation algorithms · generative AI · the 2 × 2 factorial.

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

## References
- ✔F: [Gollwitzer & Sheeran 2006 (open-access scan)](https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f) · [Sheeran, Listrom & Gollwitzer 2024 (author manuscript)](https://kops.uni-konstanz.de/handle/123456789/69905) · [Engelhard et al. 2011](https://www.ifemdr.fr/wp-content/uploads/2011/10/Engelhard-et-al-2011-Reducing-vividness-and-emotional-intensity-of-recurrent-flashforwards.pdf) · [Holmes et al. 2010, PLoS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0013706)
- ✔A: [Steel 2007](https://prism.ucalgary.ca/handle/1880/47914) · [Sirois & Pychyl 2013](https://eprints.whiterose.ac.uk/91793/) · [Fodor 2020](https://pubmed.ncbi.nlm.nih.gov/32445689/) · [Sicouri 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10933640/) · [Lazowski & Hulleman 2016](https://www.scinapse.io/papers/2273590095) · [Houben et al. 2020 (abstract)](https://cris.maastrichtuniversity.nl/en/publications/the-effects-of-eye-movements-and-alternative-dual-tasks-on-the-vi) · [Iyadurai 2018](https://ora.ox.ac.uk/objects/uuid:111fe953-8e08-465a-b490-a596b9f0e7e0) · [Webb 2012](https://pubmed.ncbi.nlm.nih.gov/23607434/) · [Sala & Gobet](https://livrepository.liverpool.ac.uk/3043493/) · [Albulescu 2022](https://doaj.org/article/c6f37b6ba159469296b2cb968b65505f) · [Hagger 2016](https://research.tilburguniversity.edu/en/publications/a-multi-lab-pre-registered-replication-of-the-ego-depletion-effec/) · [Self-report vs logs 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12445496/) · [Credibility/expectancy questionnaire](https://pubmed.ncbi.nlm.nih.gov/11132119/) · [Bridges 2020 timing](https://peerj.com/articles/9414.pdf) · [MIT/OpenAI chatbot RCT](https://arxiv.org/pdf/2503.17473)
- ◐: [Sinha & Kapur 2021, primary DOI (not yet checked; the publisher page was inaccessible)](https://doi.org/10.3102/00346543211019105) · [Houben 2020 full text, DOI (not yet accessed)](https://doi.org/10.1177/2043808720907744) · [Engelhard et al. 2010, DOI (subscription; not yet accessed)](https://doi.org/10.1016/j.brat.2010.01.003) · [WM-taxation null result](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2015.00016/pdf) · [Skorka-Brown Tetris cravings](https://pearl.plymouth.ac.uk/handle/10026.1/2925) · [Skorka-Brown thesis](https://pearl.plymouth.ac.uk/psy-theses/124) · [Lally 2010 summary](https://www.thebehavioralscientist.com/articles/how-long-to-form-a-habit) · [Milkman 2021 summary](https://www.scimex.org/newsfeed/which-programs-give-gym-goers-the-biggest-boost) · [Troy 2013 press](https://www.psychologicalscience.org/news/releases/keeping-emotions-in-check-may-not-always-benefit-psychological-health.html) · [Randomisation tests for single-case designs](https://rd.springer.com/content/pdf/10.3758/s13428-017-0885-7.pdf) · [Pilot sample-size rules](https://arxiv.org/pdf/2105.05483) · [Avery 2017](https://eprints.whiterose.ac.uk/113663/)
