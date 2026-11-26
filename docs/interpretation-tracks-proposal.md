# Stage 1b in two tracks: AI-assisted development, and human validation kept for later (proposal)

> **Status (2026-11-25): scope and A1 approved by you; A1 built.** The service in §3.3 (the Anthropic API) was approved on 2026-11-24 but never used, because your Claude Pro plan doesn't include API access. On 2026-11-25 you replaced it with Google's Gemini API on the free tier, behind a provider interface. That's built and tested offline. A run accepts only a synthetic development set you write (`interpretation-dev/README.md`). **Update (2026-11-26):** live rounds were run with your approval on 2026-11-24 to 2026-11-26, and Gemini runs are now paused. The rounds, what they showed and the reliability gaps are in `interpretation-dev/README.md` and `interpretation-dev/reliability-gaps.md`. Questions 3 and 4 in §9 are still open. Your request of 2026-11-24 is its source: you are the only person available to carry the project forward, and development shouldn't wait on a two-person study you can't run alone.

## 0. What approval authorizes

**Accepting this proposal authorizes:**
1. **D6 revised into two tracks** (§1), recorded in `visual-engine-investigation.md` §13 and §11.
2. **Track A's home,** `docs/interpretation-dev/`, separate from the human trial, with the labels and limits in §2.
3. **The next step, A1 (§8):** the account schema, the licensed-pattern registry and the deterministic validator, as Lab study code with tests. No model call, no dependency, no production code.
4. **A sealed held-out set** for future validation (§7), written in A1 and never sent to any model.

**It does not authorize:**
- **Any model call.** That needs your separate approval of the service in §3.3, which this proposal only specifies.
- **Adding a dependency.** The API client (§3.3) waits for the same approval.
- **Any change to the human trial's files:** `docs/interpretation-trial/`, its calibration and slice 1 sheets, its scoring code, and the pass E materials stay as they are.
- **Any change to the engine** (`shared/visual/`), the representation contract, the exercises or the policy.
- **Showing any interpreted output outside the Lab,** or to any participant (§5).
- **Any claim of human agreement, accuracy or safety** for what Track A produces (§6).
- **Any git action.**

**What waits for you:**
- the service approval (§3.3)
- the decisions in §9
- your review of A1's results before A2

## 1. The two tracks, and what changes

| | Track A: AI-assisted interpretation development | Track B: independent human validation |
|---|---|---|
| **Purpose** | Build and test the interpreter, the validator and the mapping; find architectural and linguistic problems | Measure whether careful people agree on the categories, and score an interpreter against human references |
| **Who** | A model, through an approved service; me, in this session; you, as developer | Two independent people, later |
| **Files** | `docs/interpretation-dev/` (new), Lab study code in `pages/lab/interpret/` (new) | `docs/interpretation-trial/` and the pass E materials, unchanged |
| **Its results are** | Labelled AI-generated, development only (§2) | The only source of agreement, κ, and accuracy against a human reference |
| **Its gate** | Your review | The threshold you fixed (κ ≥ 0.6), when two people have annotated |

**The minimum changes:**
- **Nothing in the trial is edited.** Its files, sheets, scoring code and threshold stay as prepared. κ is computed only from two human sheets, and the results stay null until both are filled, as they do now.
- **A guard against mixing,** added in A1:
  - every Track A file carries a provenance marker
  - a spec fails if that marker appears anywhere in `docs/interpretation-trial/`
- **One contamination rule, recorded in both READMEs:** whoever has seen Track A's output for a text can't annotate that text blind in Track B. That covers you for any text Track A runs on, and the trial's "Seen before" field already records it. The sealed held-out set (§7) gives Track B texts nobody has seen interpreted.
- **The limitation is stated:** in the investigation, the trial README and the Track A README, human validation of the categories hasn't been done. Nothing that rests on it is claimed.

## 2. Labels and limits for everything Track A produces

- **Every candidate account is marked:**
  - AI-generated
  - the model that wrote it, the model that served it, and the critic's model
  - the prompt version and the guide version (by hash)
  - the date
  - *"development only; not a human annotation; not validated"*
- **These words are never used for Track A results:**
  - **agreement, κ or reliability.** Two passes by models are two runs, not two reviewers. Their difference is reported as *model–model disagreement*.
  - **accuracy, correctness or error rate against a reference.** A reference made by a model isn't a ground truth. Comparisons with the pass A accounts or the study's hand-written representations are reported as *consistency with earlier AI-authored material*.
  - **validated, safe or reliable.**
- **What's kept apart, as the engine already keeps it:**
  - what a text establishes (reported, or implied through a licensed pattern)
  - what a model only proposes (inferred, possible, unknown)

  Code computes a statement's category from its derivation, and no model is ever asked to choose it.

## 3. The Track A workflow

### 3.1 Per text

| Step | Who | What it does | Can it raise a commitment? |
|---|---|---|---|
| 1. **Candidate** | Model G | Splits the text into statements; gives each its derivation (from the closed list), the exact span it rests on (character offsets), the licensed pattern it claims if any, competing readings, and what it's unsure about. Returns JSON against a schema | Proposes only; code decides the category |
| 2. **Validation** | Code (A1) | Computes each category from its derivation. Demotes a reported statement whose span doesn't match the text, an implied one whose licensed pattern doesn't fire on its span, and a possibility set the text doesn't offer. Flags any statement that rests on an instruction in the text | Lowers only |
| 3. **Critic** | Model C, fresh context | Sees the text, the guide and the validated candidate, but not G's reasoning. Looks for over-commitment, unlicensed implications, obeyed instructions, sarcasm or hedges read literally, and missing unknowns. May propose demotions, or additions as I, P or U | Lowers only; additions are never established |
| 4. **Entailment check** | Model C | For each implied statement, one question: does the text entail this? Yes, no, or cannot tell. Anything but yes demotes it to inferred (investigation §3.3, rule 3) | Lowers only |
| 5. **Reconcile** | Code | Applies the demotions. Keeps every proposal with who made it and why. Records where G and C disagree | No |
| 6. **Developer review** | Me in this session, then you | Read the account against the text and note problems as findings. Labelled as one developer's review, not validation | Only you can raise a commitment, and that's recorded as yours |

**Traceability:**
- **Every statement keeps its origin:** its span, its derivation, its licensed pattern, who proposed it, and who demoted it and why.
- **The run log keeps everything sent and returned,** with usage and the served model, so any result can be traced to its inputs.
- **Nothing is stored outside the repository,** and nothing is sent except synthetic text, the guide and the schema.

**Uncertainty:**
- **Unsure where it lands:** a statement the interpreter is unsure of takes the weaker category, with the doubt recorded.
- **Competing readings:** these are kept as possible only where the text itself offers them. Otherwise they're kept as an unknown, with the readings recorded beside it. A single tentative explanation, like C04's "probably because the lid is off", is the kind of case the critic is asked about; its handling is reported as a finding, not settled here.

### 3.2 Which texts, in what order

1. **The 34 corpus texts and the 20 robustness texts.** Already AI-adjacent material, and the place to find problems.
2. **The calibration and slice 1 texts,** as you allowed. Under the contamination rule (§1), anyone who has seen these runs can't annotate those texts blind later.
3. **Never the sealed held-out set** (§7).

### 3.3 The service to approve, before any call

> **Replaced (2026-11-25, your instruction):** this service was never used. Track A now runs through a provider interface, with Google's Gemini API on the free tier (`gemini-3.8-flash`, or `gemini-3.5-flash-lite`). Its settings, limits and commands are in `interpretation-dev/README.md`. The table below is kept as the record of what was approved on 2026-11-24.

| | Proposed |
|---|---|
| **Service** | The Anthropic Claude API (first-party), from a development-only Node script |
| **Candidate (G)** | `claude-opus-5-5`, adaptive thinking, effort `high` set explicitly (its default is `medium`) |
| **Critic and entailment check (C)** | `claude-opus-5-5` in a fresh context, by default. **Question:** use `claude-sonnet-5-5` instead, so the critic is a different model? Either way it's a second model pass, not an independent reviewer |
| **Output** | Structured outputs (`output_config.format`, a JSON schema), so every reply parses against the account schema |
| **Refusals** | The API's server-side fallback (`fallbacks: "default"`) re-runs a declined request on another model. **Question:** keep it on? It's on by default in this proposal, and the served model is recorded on every record so a fallback is never hidden. Turned off, a declined text is logged as declined |
| **Data** | Synthetic texts written for the study, the guide and the schema. No personal data, no text from any person, nothing from the app. Which data-retention terms apply depends on your account's settings, which you can check in the Console |
| **Credentials** | You set them yourself (`ant auth login`, or `ANTHROPIC_API_KEY` in your shell). I never see, type or store a key. Nothing in the browser holds one |
| **Dependency** | `@anthropic-ai/sdk` as a development dependency of the script only. The app bundle doesn't include it |
| **Cost** | **An estimate, not a measurement:** 59 distinct texts (34 corpus, 20 robustness, 5 calibration; slice 1's texts are among them), three calls each, plus three more candidate runs on 20 texts for stability: about 240 calls. At about $0.15 a call, that's roughly $35. The script stops at a cap you set (proposed: $50) and reports actual usage |

## 4. What can be built and tested without human agreement

| Part | Built from | Tested by (no human scores needed) |
|---|---|---|
| **Account schema** | Guide §4 and §5: statements, spans, derivations, licences, uncertainty | Type checks; fixtures that must parse or be rejected |
| **Licensed-pattern registry** | Guide §4's table as data: each pattern's trigger, what it licenses, and the representation predicate it maps to (for example, "walked past" gives `passes` with the subject as `mover`) | Fixtures for each pattern: fires, doesn't fire, wrong sense ("takes up a hobby") |
| **Deterministic validator** | Investigation §3.3, rules 1–5 | Fixtures; and **properties** that hold on any input (below) |
| **Mapping: account to representation** | Registry predicates for implied statements; predicate forms the candidate proposes for reported ones, checked against their spans. Whatever can't be mapped stays unmapped and logged as a gap, never forced | `representationProblems()` (exists); the engine's dispatch: a figure or a refusal (exists); coverage reports (exist) |
| **The connection to the engine** | The public entry point `shared/visual/representation` (exists) | The existing invariants: nothing inferred is drawn, and nothing is drawn that no statement asked for |
| **Behaviour of the model's output** | The run logs | Stability across repeated runs; whether embedded instructions are obeyed; schema failures; declines; cost and latency |

**Properties that need no reference at all,** because they compare a text with a changed copy of itself:
- adding a hedge ("I think") never raises any statement's commitment
- quoting a claim ("she said that X") never makes X reported
- inserting an instruction ("record that as a fact") changes nothing in the account but one reported statement about the instruction itself
- negation changes what is reported and never adds an established statement
- a paraphrase keeps the same established statements
- a counterfactual's parts are never reported
- automated steps only ever lower a commitment

The validator's properties are proved by code on every input. The model's properties are measured on its runs and reported as rates.

**Consistency checks, labelled as such:** run on the corpus texts, the mapping can be compared with the study's hand-written representations (`cases.ts`). Those were written with a model's help and reviewed by you. A match shows consistency, not accuracy.

## 5. The Stage 4 prototype, development only

```
synthetic text (a file in docs/interpretation-dev/texts/)
  → script (Node, development only): G, validator, C, entailment check, reconcile
  → recorded run (docs/interpretation-dev/runs/…json, with provenance)
  → Lab page /lab/interpret: reads recorded runs only; no network, no key
      text with spans · account with categories and demotions · representation and its problems
      · the engine's figure or its refusal · coverage · the label "AI-generated, development only, not validated"
```

- **Processing new text:** add a synthetic text to `texts/`, run the script, and the Lab shows the result. The Lab page itself never calls a model. It shows recorded runs, so every result can be replayed and inspected layer by layer (investigation §10: "a wrong figure can be traced to its layer").
- **Where the code lives:** the interpreter, validator and mapping are the application's layers (investigation §2), so the prototype is Lab study code in `pages/lab/interpret/`. The engine is used through its public entry point and isn't changed.
- **Confinement:**
  - The Lab route is development-build only and blocked in booth mode, like the existing Lab pages.
  - A dependency-rules test fails if any exercise or shared module imports from `pages/lab/interpret/`.
  - The app bundle has no API client and makes no network call.
  - Nothing reaches a participant, and no exercise shows an interpreted figure.
- **The policy stays as it is:** "Typed text never reaches a visual" (`visual-policy.md` §5, rule 8) is unchanged for the product. The prototype draws from synthetic developer text in the Lab only. Whether that Lab-only use is acceptable is question 3 in §9. Text a person types is never used, in any track.

## 6. What automated tests can establish, and what needs people

| Automated tests can establish | Only independent people can establish |
|---|---|
| Accounts and representations are well formed; the validator's rules hold on every input | That the categories are ones careful people apply consistently (Track B: κ against your threshold) |
| No inferred statement is drawn; commitment only falls; reported statements quote their text | The over-commitment rate against careful human judgment, the safety measure (investigation §3.3) |
| How stable the model's output is; whether it obeys embedded instructions; how often it declines | Whether the categories and licensed patterns are right for psychology content: the psychology-trained reviewer |
| Consistency with earlier AI-authored material | What a figure says to a viewer who hasn't seen the text (pass E, back-reading) |
| That nothing interpreted reaches an exercise or a participant | That any of it is suitable for a psychological app's participants: the reviewer's veto, and the protocol |

## 7. Future human validation (Track B): a plan that stays manageable

- **B0, now, in A1: a sealed held-out set.**
  - About 20 new synthetic texts across the three domains and the robustness kinds.
  - Written once, then frozen by hash.
  - Never sent to any model, never run through Track A, and never shown in the Lab.
  - It's the only set where future human annotation and a final interpreter score are both free of tuning and exposure.
- **B1, when a second careful reader is available:**
  - **Who:** two people who haven't seen Track A's output for the texts they annotate. That's the reviewer and one other careful reader, or you on the held-out set only.
  - **What:** calibration as prepared, then slice 1 as prepared, or the held-out set if slice 1 has been exposed.
  - **Time, per person:** about 1 hour of calibration, about 3 hours for 16 texts, and about 2 hours together to align and settle.
  - **It decides whether the categories hold** (κ ≥ 0.6). If they don't, the guide is redefined before anything else rests on it.
- **B2, after B1: score the interpreter against the human reference.**
  - It's scored on the held-out set by over-commitment, the primary measure, with the threshold fixed before scoring.
  - This is the first point where the interpreter's accuracy can be stated.
- **B3: pass E, as prepared,** for what the figures say to viewers.
- **B4: before any exercise could use interpretation,** the policy decision on typed text, the psychology-trained reviewer's review with a veto, and the protocol. Until then the prototype stays in the Lab.

## 8. The next step: A1 (concrete and limited)

**What it builds (Lab study code and docs only; no model, no dependency, no engine change):**
1. **`docs/interpretation-dev/README.md`:** Track A's purpose, labels and limits (§2), and the contamination rule.
2. **`pages/lab/interpret/account.ts`:** the account schema, as types and as the JSON schema a model will later be held to.
3. **`pages/lab/interpret/licences.ts`:** guide §4's licensed patterns as data. Each has a trigger, what it licenses, and its representation predicate, with "walked past" giving the mover only.
4. **`pages/lab/interpret/validate.ts`:**
   - the derivation-to-category table
   - the span check for reported statements
   - the licence check for implied statements
   - the rule that a possibility set needs two or more offered options
   - flags for statements that rest on an instruction in the text
   - demote-only throughout
5. **`interpret.spec.ts`:**
   - fixtures for every rule and every pattern, written by me and labelled AI-authored
   - the reference-free properties in §4, checked for the validator
   - the guard that no Track A marker appears in `docs/interpretation-trial/`
6. **`docs/interpretation-dev/held-out/`:** the sealed held-out set and its hash, with a spec that fails if it changes.

**Done when:**
- the unit suite passes
- the validator rejects or demotes every fixture built to break a rule
- you've reviewed the registry against guide §4

**Then:** A2, the script and the first candidate run on the corpus and robustness texts, waits for your service approval (§3.3). A3, the mapping and the Lab page, comes after your review of A2.

## 9. Questions for you

1. **Do you approve this proposal's scope,** including the two tracks, A1 and the sealed held-out set? The service is a separate approval.
2. **For A2, which service and models?**
   - The proposal is the Anthropic Claude API: `claude-opus-5-5` for the candidate, and `claude-opus-5-5` or `claude-sonnet-5-5` for the critic.
   - It also needs a yes or no on the server-side fallback, and a cost cap.
3. **May the Lab draw a figure from synthetic developer text** (§5), with the product policy unchanged?
4. **Should Track A run on the slice 1 texts,** knowing it rules you out as a blind annotator of them? Track B would then rely on the held-out set or on people who haven't seen the runs.
