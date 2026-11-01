# Reassessment: three coexisting usage models

> **Status:** proposal, 2026-10-31, **awaiting approval**. Nothing in `plan.md` (revision 5.7), `protocol-n-of-1.md` (v1.4) or the code has been changed. §10 lists the changes to make once this is approved.
>
> **Basis:** `plan.md` revision 5.7, `protocol-n-of-1.md` v1.4 and the current code. (The request referred to a plan "provided below"; none was attached, so the plan in this repository was used.)
>
> **Not legal advice.** Legal and regulatory points are questions to put to a qualified adviser for the jurisdiction concerned.

## 0. Correction first

- **The plan never proposed a practice lock.** The only lock it ever removed was the *content* lock (revision 5.4). The *condition* lock means that a revealed experiment slot can't be swapped for another exercise. That rule applies only to the assigned exercise; it doesn't restrict Try it, and it stays.
- **The perspective really was narrow, though.**
  - The plan treats the product as one person's local tool: accounts are deferred (§6.1), and there are no guests, no deployments and no organisations.
  - Try it is stored as `mode = "dev"`, the same value as Test mode. A first-class product mode is labelled as a developer artefact.
- **There is a real gap, and it is in research data, not access.**
  - The phase export (`api/app/n1.py`, `export`) includes only sessions linked to a reveal.
  - Try it sessions on an experiment day are stored, but the analysis never sees them.
  - That is exactly the "silently treat it as if it never happened" case. §6 fixes it without restricting access.

## 1. Revised product concept

**An adaptive psychological experience platform:** a browser-based platform of purposeful, interactive experiences informed by psychology, cognitive science and behavioural science.

- It is **not a therapy service**. It makes no clinical claims, and its claims stay proportional to the evidence (unchanged from §11 of the plan).
- **Central principle:** a person can have a complete, meaningful experience without committing to return. People who want continuity can build it. People in a professionally managed setting take part under explicit consent and permissions.

**One platform, used three ways:**
- **Independent (Try it):** the default and first-class way in.
- **Personal:** optional; adds continuity.
- **Organisational:** future; adds professional involvement on top of a personal account, only with consent.

The experience library and runtime are identical in all three. The models differ only in identity, retention, permissions and personalisation.

**Two things sit outside the usage models:**
- **Research participation** (the n-of-1 now; consented studies later) is governed by a protocol. It can sit on top of the personal model, which is where the operator's own n-of-1 lives, or on top of a consented research record. It never changes what Try it offers anyone else.
- **Deployment profiles** (normal web, booth) are configurations of the same web app. They are not separate products.

**Critical points about this vision:**

1. **"Meaningful in one visit" fits some experiences and not others.**
   - **Action Bridge** fits a single visit. In the studies reviewed, implementation intentions are usually formed in a single sitting (Gollwitzer & Sheeran 2006 ✔F), although the bias-adjusted effect is small (Sheeran et al. 2024 ✔F).
   - **State Reset** fits less well. Its effect was measured only immediately (Engelhard 2011 ✔F), and it is the least validated mechanism.
   - **So:** each experience needs a stated "standalone value" (what you leave with) and a safety rating for unsupervised use. A one-visit experience can't promise change; it can promise an experience, and sometimes a usable output, such as a written plan.
2. **One-time anonymous use is almost unmeasurable at the outcome level.**
   - Without a return visit there is no L3 (did the person start?) or L4. Model A can measure only L1 (use and completion) and immediate self-report.
   - That's acceptable for a product, but anonymous aggregates must never be presented as evidence of effect.
3. **Three models can dilute focus.** The research question (does anything here help people start?) is still unanswered. The models should be built in order (A, then B, then C only with a partner). Building them in parallel would let the infrastructure outrun the evidence.
4. **"Personal memory" is a sensitive-data magnet.**
   - A history of goals, feelings about starting and "what helped" says something about a person's mental state.
   - Under the GDPR (Art. 9) and Turkey's KVKK (Law 6698), data concerning health is special-category data. Whether this history counts is a question for legal review, but the design should assume it does.
   - Call it **"My history"**, never "therapy memory", even internally. The name sets expectations and may shape how it is classified.
5. **The clinical model changes what the product is.**
   - When a professional configures experiences for a client as part of treatment, the *intended use* may become treatment.
   - Under rules such as the EU MDR (Rule 11) or the US FDA's software-as-a-medical-device framework, that intended use can make the software a regulated medical device. Saying that "the platform doesn't provide therapy" doesn't settle this; how it is deployed and described does.
   - This is the strongest argument for keeping Model C out of the build until a real deployment context exists and has been assessed.

## 2. Usage-model comparison

| | A · Independent (Try it) | B · Personal | C · Organisational / clinical |
|---|---|---|---|
| **Identity** | None. An anonymous visit | Optional account (email or passkey; method deferred) | Personal account plus organisation membership; professional roles |
| **Session continuity** | One visit. State lives in the browser tab and is gone when the visit ends or the booth resets | Across visits and devices | Across visits; the professional sees what was shared |
| **What is stored** | **Default: nothing identifiable on the server.** Optional anonymous aggregate events (§5.4) | Sessions, ratings, plans and goals the user chooses to keep; feedback; preferences | The same as B, with a share grant to a named professional or organisation for a defined scope |
| **Memory** | None between visits | "My history": user-controlled, viewable, exportable, deletable item by item and as a whole | The same history; the professional sees only the granted scope |
| **Privacy** | Data minimisation by design. No free text leaves the browser unless the user saves it | User is the controller of their own history; clear retention; delete is real delete | Consent per grant, purpose-limited, time-limited, revocable; reads audited; organisational policy and law decide the rest |
| **Personalisation** | Only within the visit: rule-based suggestions from what was chosen in this visit, e.g. "you planned; want to try the dot game?" | From history and feedback, rule-based first; algorithms deferred (no evidence that matching beats a good default, §11) | Professional configuration of existing experiences within allowed parameters |
| **Professional involvement** | None | None | Yes, permission-based |
| **Typical place** | Any browser; a booth | Own device | Clinic, institution |
| **Research use** | Anonymous aggregate usage only, never effect claims | Only with separate research consent (e.g. the n-of-1) | Only under a study protocol with ethics approval |

**Isolation rules (all models):**
- **A guest never sees anyone's data.**
- **An account sees only its own data.**
- **A professional sees only granted data, within their organisation.**
- **An organisation never sees another organisation's data.**
- **No model is a degraded version of another.** Model A gets every experience that is rated safe for unsupervised use, in full.

## 3. Try it assessment

**Why it is a core requirement:**
- It is the only model that works for a single visit and for booths, and the one people meet first.
- Gating it behind an account would contradict the central principle, and it would bias any later evaluation towards people already willing to commit.
- It is also how usability testers already go through the conditions (plan §4.3).

**How it should work:**
1. **Open, choose, do.** No sign-in, consent wall or history prerequisite. The "What happens" preview, the duration and Stop are already in place.
2. **No saving by default for guests.**
   - The runtime keeps the visit's state in memory. Text the person typed (goal, plan, picture description) stays in the browser.
   - At the end there are three choices:
     - **Done** (nothing kept)
     - **Take it with you** (show or copy the plan; on a booth, a QR code that holds the text itself, so no server copy is needed)
     - **Save to an account** (Model B, when it exists)
3. **Explain storage on the screen where it happens.** For example: "Nothing you type here is stored. If you choose to help improve the platform, we count which exercises are finished, without any of your answers." One sentence, shown at the moment it matters, and accurate.
4. **No artificial limits.** No caps, nags or "create an account to continue". Account creation may be offered once, at the end, as an option.
5. **Same runtime, same content versions.** A Try it exercise is the same code and content as an experiment exercise; only the wrapper (what happens to the record) differs. This is already true (`session-page.ts`, with `mode` and `reveal`).
6. **Locally, for the operator,** Try it keeps saving to My records. The operator is a consenting research participant whose exposure must be recorded (§6). "Locally the operator's runs are saved, and on a public deployment nothing is saved" is a deployment-profile difference, not a product contradiction.

**Two design changes are needed:**
- **Separate Try it from Test mode in the data.** Today both are stored as `mode = "dev"`. A `try` mode should be added; `dev` stays for Test mode only.
- **Mark each experience for unsupervised use.** For example, State Reset stays experimental and is unavailable in a booth (§4) until usability data show it is tolerable.

## 4. Physical booth assessment

**Product value:**
- **Real:** discovery, a private pause in a public place, and an "experience" framing that suits the experiences.
- **Speculative:** whether people will enter a booth for a psychology experience; whether a 5-minute experience helps anyone in that setting; what a location would pay for it.
- **Main risk:** booths are expensive to operate (hardware, rent, cleaning, maintenance, supervision). Their cost isn't development but operations.

**Assessment:** a deployment profile worth preparing for cheaply, not worth building hardware for now. Validate demand first with a staffed pop-up: a laptop in a quiet room at an event or library, with the booth profile and an operator nearby.

**Booth profile requirements** (configuration of the same web app):

| Area | Requirement |
|---|---|
| **Session start and end** | A clear "Start" screen. An explicit "I'm done" ends the visit. An idle timeout (e.g. 90 s of no input, with a 20 s visible warning) ends it automatically |
| **Cleanup** | Ending a visit clears in-memory state and per-tab storage and reloads to the start screen. Nothing typed is ever sent to the server in booth mode. The browser runs in kiosk mode with a fresh profile per visit (or a clean profile on restart), with autofill and history off |
| **No leakage between visitors** | No back navigation into a previous visit, no autofill, no "recent" lists, no cached text. Tested explicitly: visitor 2 must find no trace of visitor 1 |
| **Continuity without an account** | "Take it with you": a QR code holding the plan text itself (generated in the browser; no server copy). Later, optionally: "save to my account" via a short-lived code redeemed on the person's own phone. Never mandatory |
| **Which experiences** | Only those rated safe for unsupervised use. **State Reset is excluded until usability shows it is tolerable.** Aversive imagery in an unsupervised public space needs its own safety review |
| **Safeguards** | Stop is always visible. Every exercise ends with a neutral close-out. A visible, local support line ("If you're struggling, you can talk to…" with local services) appears on start and stop screens, not as diagnosis. No health questions. A policy for minors (an age statement or an operator presence, decided per location) |
| **Accessibility and physical** | Wheelchair-accessible interior; adjustable or reachable screen; keyboard plus a large touch target layout (Action Bridge needs text entry: on-screen keyboard or physical keyboard); headphones with volume control if audio is added; the non-visual State Reset variant (plan §8 B) before State Reset enters booths; sound isolation; ventilation; easy-to-clean surfaces |
| **Operations** | Remote health check; a simple operator restart; content updates through normal web deploys; an incident log without personal data |
| **Measurement** | Only anonymous aggregates (§5.4): visits, which experience, completion, immediate ratings. No outcome claims |

**Limitations to state plainly:** no follow-up, so no behavioural outcomes. Also no supervision: the booth can't respond to distress beyond signposting.

## 5. Architecture assessment

**Recommendation: one modular monolith** (the current FastAPI + Angular + PostgreSQL stack), with module boundaries and no microservices. A dedicated service is justified only by real scale or isolation requirements. Neither exists.

### 5.1 Modules (most of them don't need to exist yet)

| Area | What it is | Now | Later |
|---|---|---|---|
| **Experience library** | Versioned content JSON plus the Angular experience components | Exists (4 experiences) | A registry once more than ~5 exist (already planned, §6.1) |
| **Experience runtime** | Runs a flow (an ordered list of experience steps), produces step summaries, knows nothing about identity | Exists in effect (`session-page.ts` + `StepOutcome`); needs only a small separation of "where results go" | Flow definitions from data instead of hard-coded per condition |
| **Result sinks** | Where a finished visit goes: *discard*, *anonymous aggregate*, *personal history*, *research record* | Today there is one sink (`PUT /sessions`) | Chosen by deployment profile and identity; the runtime emits the same result either way |
| **Session management** | Guest visit (in browser memory, no server identity) or authenticated session | Local only (no auth) | Server sessions for accounts; guest stays client-side |
| **Identity and access** | Anonymous, account, organisation member, professional role | None (localhost guard) | Accounts (B); organisation roles and grants (C) |
| **My history** | Owned records for an account | My records exists, but unowned (single user) | Add an `owner` to records |
| **Organisation management** | Organisations, memberships, grants, audit | — | Only with a partner (C) |
| **Personalisation** | Rules over the data the current model allows | — | Rule-based first; algorithms only after evidence |
| **Outcome and learning** | Anonymous aggregates, personal history, research records: three separate stores | Research record exists (n-of-1) | Aggregate events table; organisational records follow consent |

### 5.2 Key questions

- **Can guests and accounts share the runtime?** Yes. They already do in effect: Try it and experiment exercises use the same component tree. The rule: **the runtime never reads identity; it emits a result to a sink chosen outside it.** This is the one boundary worth enforcing now.
- **Temporary state vs persistent history.**
  - A guest visit's state is memory in one browser tab and dies with it. No server row, so nothing to clean up.
  - History is a server row with an owner, a retention rule and a delete path.
  - Keeping guest state off the server is cheaper and safer than server-side guest rows with time-to-live cleanup.
- **Guest to account without losing work.**
  - At the end of a visit, "Save to an account" signs in or up and then sends the finished result, which is still in memory, to the personal sink.
  - Nothing is stored before the person decides, so nothing has to be "claimed" later.
  - The booth version is a short-lived code: the result is held encrypted for a few minutes and redeemed on the person's own device. This is the only case needing server-side temporary state (later, optional).
- **Isolation between users and organisations.**
  - Every owned row carries `owner_account_id`. Every read is filtered by owner in one query layer, which tests check.
  - Organisation access never reads the owner's tables directly; it goes through an explicit grant check.
  - PostgreSQL row-level security is an option at Model C, not before.
- **Professional access: granted, limited, audited, revoked.**
  - A `grant` names the account, the professional, the organisation, the scope (e.g. "sessions and ratings, not free text"), the purpose, `granted_at`, `expires_at` and `revoked_at`.
  - The user creates it and can revoke it at any time. Every professional read is written to an append-only `access_log`, and the user can see it.
  - There is no default access and no "break-glass" access. All of this is C, and is designed with the partner and their legal requirements.
- **Adapting experiences without copies.**
  - Each experience declares which parameters can be changed and their allowed ranges, e.g. State Reset sets (4–8), rest seconds, which prompts are shown. A configuration is a small validated object: (experience id, content version, parameter overrides).
  - A **flow** is an ordered list of these. Professionals and deployments create configurations and flows, never forked content.
  - Results record the configuration used, as `content_versions` already does.
- **Booths on the same web app.** A deployment profile with these settings:
  - sinks: anonymous aggregate only
  - idle reset: on
  - experiences: unsupervised-safe list
  - accounts: offered or hidden

  Same build, same code.

### 5.3 Data tiers

| Tier | Identifiable? | Contains | Retention | Model |
|---|---|---|---|---|
| **Ephemeral** | No (never leaves the browser) | Everything typed during a visit | Until the visit ends | A |
| **Anonymous aggregate** | No | Event type, experience id and version, deployment profile, coarse time (hour), completion, numeric immediate ratings. **No free text, no persistent device ID, no IP stored** | Defined (e.g. 24 months) | A (opt-in or opt-out per law), B |
| **Personal history** | Yes, to the owner | The user's saved sessions, plans, goals, feedback | Until the user deletes them or the account | B |
| **Organisational record** | Yes, to granted professionals | The granted scope of personal history, plus professional configurations | Per grant and organisational policy | C |
| **Research record** | Pseudonymous | Protocol-defined data under consent | Per protocol | n-of-1, studies |

**Anonymous analytics vs personal history.** Anonymous analytics answers "how is the platform used?" across people; no record can be linked to a person or to their other visits. Personal history answers "what have I done?" for one person, and it exists only because that person chose to keep it. They're different stores, with different purposes, legal bases and retention. Data never moves from aggregate to personal, and personal data enters aggregates only as counts with no identifiers.

**Caveat:** small numbers can re-identify people, for example one booth with three visits a day. Publish aggregates only above a minimum count.

## 6. Experimental evaluation implications

**Three separate things:**

| | Governs | Rule |
|---|---|---|
| 1. **Product access policy** | Everyone | Try it is unrestricted, always, including during an experiment |
| 2. **Assigned-session rules** | The experiment participant's assigned slot | Condition locked to the reveal; as-assigned from the reveal (protocol v1.3–1.4, unchanged) |
| 3. **Data interpretation** | The analysis | **Additional exposure** is recorded, classified, reported and handled by prespecified sensitivity analyses |

**What additional exposure does to the n-of-1:**
- **Phase 1:** a Try it run of "Plan your first step" on a goal-restatement day gives that day the active ingredient, which pushes the comparison towards null.
  - It is plausibly **asymmetric**: on a control day, the unblinded participant may want the "real" plan.
  - At 20–28 days, a few such days matter.
- **Phase 2:** a picture-holding run on a game-only day contaminates the control the same way.
- **Runs of the assigned condition or unrelated exercises** add dose or distraction. They are less damaging, but they are not nothing.
- **Exposure before day 1** (practice in Test mode or Try it) builds familiarity. This is a general limitation, already acknowledged as practice and carryover.

**Proposed protocol rule** (a v1.4 amendment; phase 1 hasn't started, so it can go in before approval):

1. **Record.** Every Try it session already stores its condition and timestamps. The phase export also includes every non-assigned session that starts within an experiment day's **exposure window**, from 00:00 local on the session date until the outcome window closes (window start + 120 min). It holds id, condition, mode, start, end and status, and no free text.
2. **Classify each experiment day:**
   - **contaminated**: the other condition's active component was used. Phase 1: any exercise containing Action Bridge on a goal-restatement day. Phase 2: the picture variant on a game-only day.
   - **extra exposure, not contaminating**: any other additional session.
   - **clean**
3. **Analyse.**
   - **Primary analysis unchanged:** as assigned, all session days.
   - **Prespecified sensitivity analyses:**
     - excluding contaminated days
     - excluding all days with any additional exposure
   - Counts per condition are reported, including an explicit check for asymmetry.
   - Excluding days breaks blocked pairs, so the sensitivity tests drop the whole pair. This is simple, conservative, and already how the analysis handles pairs.
4. **Interpret.**
   - If contaminated days are few and evenly spread, the primary result stands, with a note.
   - If they cluster in one condition, the conclusion is limited to "the comparison is biased towards null" and stated as such.
   - Any contaminated day makes "no difference" weaker evidence, never stronger.
5. **Participant instruction (narrow, research-only, recommended).**
   - During phase 1, the operator agrees not to use Try it for "Plan your first step" or "Follow the dot, then plan" on an experiment day until that day's window closes. During phase 2, the same applies to "Picture it, then follow the dot".
   - This is a self-commitment written into the protocol, **not a software lock**. Try it stays fully available, and a run anyway is simply recorded and classified.
   - **Justification:** n is small, the design is unblinded, and asymmetric contamination is plausible. It answers this experiment's question and nothing else.
   - **Alternative:** skip the instruction and rely on recording and sensitivity analyses alone. More honest to everyday use, but at risk of losing pairs.

**What can and can't be concluded:**
- **Can:** with exposure recorded, the n-of-1 can say whether the assigned exercise was followed by earlier starts in this person's everyday use, *including* their real access to everything else.
- **Can't:** it can never say what a single anonymous Try it visit does for anyone. Model A data can describe use, completion and immediate feelings. It can't describe effects.

**What doesn't change:** scientific standards, evidence marks, stage boundaries, as-assigned analysis, prespecification, the schedule (SHA-256 `5c22d984…c66c84e`), and the safety boundaries (no trauma imagery, Stop always available, no diagnosis).

## 7. Revised first-release scope

**Two "first releases" exist, and they should not be confused:**
- **Now: the local research prototype.** It is running, and phase 1 is about to start.
- **First public release.** It is gated by the research and safety evidence the plan already demands. The plan defers deployment to C, and that stays until Stage 5 decides to expand.

### Build now (small, local, no new infrastructure)
1. **Protocol amendment** (§6): exposure window, classification and sensitivity analyses. The export adds non-assigned sessions in the window, and the analysis adds classification and the two sensitivity tests. All of this is needed before phase-1 day 1.
2. **`try` mode** in the data model, separate from `dev` (Test mode). Existing Try it rows are migrated by rule: `dev` sessions without a reveal become `try`.
3. **Result sink boundary in the runtime:** the session page decides where a finished result goes; experiences don't. This is a refactor only, with no behaviour change locally.
4. **"Unsupervised-safe" flag** per experience in the condition and experience metadata. This is data only; it is used later by profiles.

### Prepare architecturally (decisions written down, little or no code)
- The data tiers (§5.3) and the rule that the runtime never reads identity.
- `owner_account_id` as the future ownership column on records. It isn't added until accounts exist.
- The configuration and flow model (parameter overrides with declared ranges). Written down only; there is no second deployment to need it yet.
- The booth profile requirements (§4), as a checklist.

### Defer
- **Hosted deployment, accounts, guest-to-account transfer, anonymous aggregate events:** first public release (Phase P1 below).
- **Personalisation beyond simple rules, AI companion:** deferred, as in plan §11.
- **Organisations, professional roles, grants, audit, professional configuration:** Model C, only with a partner and a legal and regulatory assessment.
- **Booth hardware.**

## 8. Revised roadmap

The research track (plan §9, Stages 1–5) continues unchanged. A **product track** runs alongside it, with explicit dependencies on research results.

| Phase | Deliverables | Depends on | Acceptance criteria |
|---|---|---|---|
| **P0 · Local, now** | §7 "Build now" items; protocol v1.4 with the exposure rule approved; phase 1 runs | — | Checks pass; export includes in-window exposure; analysis tests cover clean, contaminated and extra-exposure days; Try it unchanged for the user |
| **P1 · Usability with guest flow** (fits Stage 3–4) | Usability sessions include the Try it guest flow and the end-of-visit choices; a simulated booth profile (idle reset, cleanup) tested with testers on a laptop | P0; Stage 3 | §5 usability criteria met; testers can say correctly what was and wasn't stored (≥ 80%); visitor-leakage test passes (no trace of visitor 1 for visitor 2) |
| **P2 · First public release: Try it only** | Hosted web app; deployment and security (TLS, auth-less public API with rate limits, CSRF-safe writes, no admin surface); privacy notice; anonymous aggregate events (opt-in unless the lawful basis allows otherwise); unsupervised-safe experiences only; support signposting | Stage 5 decision "expand"; ethics and data-protection review of the public version; DPIA if required | No identifiable data stored for guests (verified by a database inspection); aggregate publication threshold enforced; accessibility WCAG 2.2 AA audit passed; safety review signed off per experience |
| **P3 · Optional accounts and My history** | Account creation (method decided then); owned records; view, export and delete; guest-to-account save at the end of a visit; rule-based suggestions | P2 in use; evidence that people want continuity (e.g. return intention, requests) | Isolation tests (no cross-account reads); delete removes everything within the stated time; Try it unaffected (same flows, no new prompts beyond the one end-of-visit offer) |
| **P4 · Booth pilot** | One staffed pop-up first, then possibly one booth; kiosk profile; QR take-away; operator procedures | P2 (P3 only if "continue later" is wanted) | Visitor-leakage test in the real setting; idle reset works; incident log empty of personal data; demand measured (visits, completions) against a prespecified threshold |
| **P5 · Organisational / clinical** | Organisations, roles, grants, audit log, professional configuration of existing experiences | A real partner; legal and regulatory assessment (medical device question, health data law, professional obligations); ethics; a defined intended use | Grant, revoke and audit verified; a professional can read only the granted scope; regulatory position documented before any clinical use |

**Decisions to postpone until there is evidence and context:**
- account method
- hosting provider and region
- anonymous analytics consent mode
- AI companion
- recommendation algorithms
- whether booths make sense commercially
- everything in Model C

## 9. Risks and unresolved decisions

**Scientific**
- Contamination in the n-of-1 is plausibly asymmetric (§6). There's a decision for you: whether to add the narrow participant instruction.
- One-visit value isn't evidence-based for State Reset. Its effect duration is unknown.
- Anonymous aggregates will tempt people to make effect claims. The rule: aggregates describe use, never effects.

**Technical**
- Moving from a localhost-guarded app to a public one changes the whole security model (plan §8 C items).
- Shared booth machines leak through browser features (autofill, history, back/forward cache). This needs explicit tests.
- Text entry on touch screens in booths may make Action Bridge hard to use.

**Privacy**
- Free text (goals, plans, picture descriptions) is the most sensitive content. It is kept out of every anonymous and organisational channel by default.
- Small-number re-identification in aggregates.
- Professional access drifting beyond its scope. Prevented by grants with a defined scope, expiry dates, and an access log the user can see.

**Operational**
- Booth cost, cleaning, vandalism and support.
- Responding to distress without staff. Booths can only signpost.
- Content updates need a release process once the app is public.

**Legal and regulatory** (questions for an adviser, per jurisdiction)
- Is "My history" health data under the GDPR (Art. 9) and KVKK (Law 6698)?
- Lawful basis for anonymous analytics (consent vs legitimate interest), and whether cookies or local storage need consent.
- Minors in public booths.
- **Model C:** does professional configuration for clients make the platform a medical device (EU MDR Rule 11, FDA software-as-a-medical-device, Turkish equivalents)? What do professional confidentiality rules require? Who is the data controller in a clinic deployment?
- Wording: "adaptive psychological experience platform" and every claim on screen must avoid implying treatment.

**Contradictions to resolve**
- **Personal model vs experiment practice:** locally, Try it must be recorded for research, while the public Try it records nothing. This is resolved by deployment profile; documented here so it isn't mistaken for inconsistency.
- **"Adaptive" vs "no evidence that matching helps":** for now, "adaptive" means the platform adapts within a visit and to stated preferences, not algorithmic matching. The word should be used carefully until evidence exists.

## 10. Changes to the original plan (once approved)

| Plan section | Change |
|---|---|
| Status, header | Revision 6.0. The three usage models and the central principle |
| §1 Vision | **Revise:** add the product concept (§1 here), the three models, deployment profiles, and "not a therapy service" |
| §2 Evidence, §3 Mechanisms | **Unchanged.** Add per experience: standalone value and unsupervised-safe rating (State Reset: not yet) |
| §4.1, §4.3, §4.4 | **Unchanged** |
| §4.2 n-of-1 | **Expand:** the three-way separation (access, assignment, interpretation); exposure window, classification, sensitivity analyses; the optional participant instruction |
| §5 Outcomes | **Expand:** what Model A can and cannot measure; aggregates describe use, never effects |
| §6.1 Components | **Revise:** "Accounts and authentication: C" becomes the Model B/C path; add the runtime and result-sink boundary, deployment profiles, and data tiers |
| §6.4 Data model | **Expand:** `mode` adds `try`; future `owner_account_id`, `grants`, `access_log`, `aggregate_events` (all deferred) |
| §8 Security, privacy, accessibility | **Expand:** privacy per data tier; booth safeguards and accessibility; the regulatory questions for Model C |
| §9 Roadmap | **Expand:** the product track P0–P5 alongside Stages 1–5 |
| §10 Risks | **Expand** with §9 here |
| §11 Departures | **Add rows:** clinical use (deferred; separate assessment); "therapy memory" becomes "My history"; booth (deployment profile, no hardware now). AI companion and personalised matching **stay deferred** |
| `protocol-n-of-1.md` | **v1.4 amendment before approval:** §5 (no change to allocation), §7 (exposure classification and sensitivity analyses), §8 (additional exposure as a recorded deviation type), §10 (export includes in-window non-assigned sessions), §12 (limitation: residual contamination), §13 row |
