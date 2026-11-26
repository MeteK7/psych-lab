# Track A: AI-assisted interpretation development

> TRACK-A: AI-generated, development only, not validated.
>
> **Status (2026-11-26): live Gemini rounds have been run, and runs are now paused.** A1 is built, and the Gemini integration (a provider interface and an adapter on the free tier, replacing the Anthropic path at your instruction of 2026-11-25) is built and tested offline. With your approval, live rounds ran on 2026-11-24 to 2026-11-26. You ran each one yourself:
> - 6 connectivity checks (`runs/connectivity/`)
> - six candidate rounds: `dev-1-lite`, `dev-1-36flash` (one stopped record only), `dev-2-lite-critic`, `dev-3-lite-critic`, `dev-4-lite`, `dev-5-lite`
> - one critic-only review, `reviews/crit-1`
>
> That's 31 batch requests in the attempt logs, 6 of them failed with 503, plus dev-1-lite's first 3 requests, made before the attempt log existed. **What they showed:** the same model doesn't follow the interpretation rules consistently, even on the same input, and the critic changed nothing. **Gemini runs are paused** (2026-11-26). Going forward, the system doesn't need the model to be right every time. It needs to reliably detect, constrain or reject interpretations that go beyond what the source supports (`reliability-gaps.md`). The saved records and their provenance stay as they were made.

## What this track is

It builds and tests the interpretation layer (investigation §2): the interpreter, the validator and the mapping from an account to the engine's representation. Its proposals come from a model, and checks written in code can only lower what a model proposes.

**It is not human validation.** That is Track B, the human trial in `../interpretation-trial/`, kept unchanged for when two independent people can annotate. Nothing here is a human annotation, and nothing here is reported as agreement, κ, reliability, accuracy, or as validated or safe.

## Labels and limits

- **Every file this track generates carries the line** `TRACK-A: AI-generated, development only, not validated.` A spec fails if that line appears anywhere in `../interpretation-trial/`. The development set is the one exception: you write it, so it carries no AI mark.
- **Every result is labelled** "AI-generated exploratory interpretation, not a reference annotation."
- **Every candidate account records its provenance:**
  - who wrote it: a model, the assistant in a session, or a test fixture
  - the model asked for, and the model that answered
  - the prompt and guide versions, by hash
  - the date
- **Every record also keeps each step's prompt and schema by hash** (`stepHashes`): the candidate's, and each optional stage's that ran. Records from before 2026-11-26 don't have them.
- **Every record and review also keeps the checks' version by hash** (`checksHash`): the files that turn a reply into categories (`account.ts`, `licences.ts`, `validate.ts`, `reconcile.ts`, `schema-check.ts`). Records from before the 2026-11-26 conditional change don't have it.
- **Every checked statement has a `label` from its computed category:** R1, R2, I1, P1, U1 …, in order, as the guide numbers rows. The model's own id stays in `id`, because the critic and the checks refer to it. Show the label: a model id such as "L1" can name a statement the checks lowered to I.
- **A statement's category is computed by code** from its derivation (guide §4), never chosen by a model. The checks only ever lower a category.
- **Comparisons with earlier material** (the pass A accounts, or the study's hand-written representations) are reported as *consistency with earlier AI-authored material*, not as accuracy.
- **Differences between two model passes** are reported as *model–model disagreement*, not as agreement between reviewers.

## The contamination rule

**Whoever has seen Track A's output for a text can't annotate that text blind in Track B.** That covers you, for every text Track A runs on, and the trial's "Seen before" field records it. The held-out set is the one set nobody sees interpreted.

## Files

| Path | What |
|---|---|
| `dev-set/texts.md` | **The synthetic development set, written by you.** The only texts a run accepts (contract below). Empty until you write it |
| `held-out/texts.md` | **Sealed.** 20 synthetic texts for future human validation and a final interpreter score. Never sent to any model, never run through this track, never shown in the Lab. A spec fails if the file changes |
| `runs/<round>/` | Each text's latest record (`D001.json` …), `summary.json` for the latest run, and two logs that are only ever appended to: `attempts.jsonl`, every attempt at every text, and `runs.jsonl`, every run's summary. `exploratory.json` is written by the unit tests. `runs/connectivity/` holds one file per connectivity check, named by its UTC time |
| `reviews/<round>/` | Critic-only reviews of saved candidates (below), one file per text, with `summary.json`, `attempts.jsonl` and `runs.jsonl` as for a round. Each review names the exact saved record it reviewed |
| `licence-candidates.md` | **Closed review (2026-11-26).** Patterns the model reached for that the registry doesn't have ("hands Y a Z", "without Z-ing", "during X"), with the evidence from the saved rounds and your three decisions. No licence row was added. It also sets out the requirements a safe handover licence would have to meet. For the licensed-pattern review (OI-8, OI-25) |
| `guide-addendum-0.1-proposed.md` | **Proposed, not in force.** Version 0.1 of a guide clarification: "X did Y without Z-ing" as a reported restatement, scoped to the action. The guide and Track B are unchanged until you approve its adoption |
| `reliability-gaps.md` | Which guarantees are enforced by code, which rest only on the prompt, and which forms the word-level checks are known to miss, with offline probes. Documentation only |
| `web/src/app/pages/lab/interpret/account.ts`, `licences.ts`, `validate.ts` | The account schema, the licensed patterns and the validator (A1). The licences are unchanged. The schema and validator changed on 2026-11-26: more conditional words, labels, flags, and the `basis` and `holder` fields |
| `…/interpret/provider.ts` | The provider interface: what the runner needs from a model service. It names no provider and imports no SDK |
| `…/interpret/runner.ts` | The runner: the request limit, spacing, stopping on errors, the allowlist, resuming, redaction, and each text's record |
| `…/interpret/review.ts` | The critic-only review of saved candidates |
| `…/interpret/map.ts`, `mapping-cases.ts`, `map.spec.ts` | A3: a reviewed account, typed, translated into the engine's representation, with time and phases from the second step (below). Its six test inputs, typed from reviewed corpus accounts, and its tests |
| `…/interpret/providers/gemini.ts` | The Gemini adapter, the only code that knows the provider: the checked models, schema translation, error mapping and client options |
| `…/interpret/schema-check.ts` | The local check of a reply against its schema, whatever the service enforced |
| `…/interpret/sources.ts` | The development set's contract, and the texts no run may take |
| `…/interpret/fixtures.ts` | Offline test fixtures, marked as such. The run script refuses their texts |
| `…/interpret/prompts.ts`, `reconcile.ts`, `explore.ts` | The prompts and schemas; the optional critic and entailment stages; exploratory counts |
| `web/scripts/interpret/run.mts`, `providers/gemini.mts` | The run script, and the only place the Gemini SDK (`@google/genai`, a development dependency) is imported |

## Running Gemini on the free tier

### What was checked (2026-11-25), and what wasn't

**Checked in Google's docs** (ai.google.dev, which now redirects to aistudio.google.com/docs):
- **The models:** `gemini-3.8-flash` and `gemini-3.5-flash-lite`, checked on 2026-11-25, and `gemini-3.6-flash`, added the same day at your request. Each is listed as stable, with a free tier ("Free of charge" for input and output), structured output and no announced shutdown. `gemini-3.6-flash` is the previous-generation Flash, which Google says "remains available for production use". These are the only models the adapter accepts. `gemini-3.1-flash-lite` was checked too and not added: it may be retired from May 7, 2027, and Google names `gemini-3.5-flash-lite` as its replacement.
- **How free-tier content is used:** the pricing page says "Content used to improve our products". That's why a run accepts only synthetic texts you write.
- **Rate limits:** applied per project, not per key. Requests per day reset at midnight Pacific time. A quota or rate error is `429 RESOURCE_EXHAUSTED`.

**Not published:** the free-tier requests per minute (RPM), tokens per minute (TPM) and requests per day (RPD) for these two models. The rate-limits page says limits "depend on a variety of factors (such as your usage tier) and can be viewed in Google AI Studio", and that they "are not guaranteed". So the run takes the RPM from you (`--rpm`, default 5) and spaces requests by it. Keep `--limit` below your RPD.

**Not checkable from here:** your project's billing, tier or eligibility. If billing is enabled on the project, it is no longer on the free tier, and **no code here can guarantee that a request costs nothing.**

### What you do in AI Studio before a live request

1. **Your tier:** open aistudio.google.com/projects, find the psych-lab project, and check that its tier is **Free**. A status such as "Verification needed", "Payment needed", "Restricted" or "Free tier unavailable" means it isn't ready.
2. **Billing:** check that no billing account is linked to the project. If one is, requests can be charged.
3. **Your limits:** open aistudio.google.com/rate-limit and note the RPM, TPM and RPD for the model you'll use. Use that RPM as `--rpm`, and keep `--limit` well under the RPD.
4. **The key:** create or copy an API key that belongs to that project.

### Setting the key for one PowerShell window, without showing it

**How the key is handled:**
- It's read from `GEMINI_API_KEY` only, and only by the Node script.
- It's never logged, printed or written, and every record and log line is redacted.

**How to set it,** in this order, so the key is never on screen or in the command history:
1. Paste this command into PowerShell and press Enter. It shows the prompt `Gemini API key:` and waits.
   ```powershell
   $env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new('', (Read-Host -AsSecureString "Gemini API key")).Password.Trim()
   ```
2. Copy the key in AI Studio.
3. Back in PowerShell, paste with a right-click (or Ctrl+Shift+V in Windows Terminal). Nothing appears on screen. Press Enter.

**Don't read the key from the clipboard with `Get-Clipboard`** when you copy commands from somewhere else. Copying a command replaces the key in the clipboard, so `Get-Clipboard` reads the command instead. The order above avoids that, and copying your next command clears the key from the clipboard.

**To check the key's shape without showing it** (its length, and two yes/no answers):
```powershell
$s = [string]$env:GEMINI_API_KEY; "Length: $($s.Length); contains a space: $($s.Contains(' ')); plain characters only: $($s -match '^[\x21-\x7E]+$')"; Remove-Variable s
```
A length of 0 means the key isn't set. A space, or anything that isn't plain characters, means something other than the key was pasted. The script refuses such a key, and says so without showing it.
**How long it lasts:** until the window closes. To clear it sooner:
```powershell
Remove-Item Env:GEMINI_API_KEY
```
**What the script refuses:** if `GOOGLE_GENAI_USE_VERTEXAI` or `GOOGLE_GENAI_USE_ENTERPRISE` is set to `true` in the window, the script won't run. Those settings switch the client to a paid surface.

### The commands, from `C:\Projects\new_project\platform\web`

**A dry run:** sends nothing, needs no key.
```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --dry --model gemini-3.8-flash
```
**The connectivity test:** exactly one request, with no study text. Recorded in `runs/connectivity/`.
```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --connectivity --model gemini-3.8-flash
```
**A batch:** at most five requests, one per text, spaced for 5 requests a minute.
```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --model gemini-3.8-flash --limit 5 --rpm 5 --only D001,D002,D003,D004,D005 --round dev-1
```

| Option | Meaning |
|---|---|
| `--model` | Required: `gemini-3.8-flash`, `gemini-3.5-flash-lite` or `gemini-3.6-flash`. No alias, no automatic choice, no fallback. Any other id is refused before a request. Use a separate `--round` per model |
| `--limit` | The most requests the run sends, every stage counted (default 10). Checked before each request. A text starts only if the limit leaves room for all its stages |
| `--rpm` | Requests per minute to keep under, from AI Studio (default 5). Requests are spaced by 60/rpm seconds |
| `--stages` | Optional: `critic`, `entailment` or both. Off by default: the first workflow is one candidate request per text, then the validator |
| `--only` | Just these development-set ids. An id not in the set is refused |
| `--round` | The records' folder (default `dev-1`). Running it again resumes it: a stopped text runs again, and a finished one is skipped, but only if it was made with the same model, text, prompt, guide and stages, and with the same prompt and schema for each stage and the same checks. A record from before step hashes or the checks' hash can't show them, so it counts as different. If any finished record differs, or can't be read, the run stops before any request and says which. Use a new round name when you change the model, a text, a prompt, the stages or the checks |
| `--timeout` | How long one request may take, in seconds (default 300, from 10 to 600). The SDK sends it to Google as the server's deadline, so a reply that takes longer ends in `504 DEADLINE_EXCEEDED` |

**On an error, the run records it and stops.** That covers a quota or rate error (429), an unknown model, an authorisation failure, an invalid request and any other failure. It never retries, and the SDK's own retries are off. A blocked or malformed reply is the exception: it is recorded for that text, and the run goes on.

### The critic-only review of saved candidates

**Why:** a round with `--stages critic` writes a new candidate account each time, so comparing it with a candidate-only round compares two different accounts, not the critic's effect. A failed critic call there also throws away the candidate it was meant to review. The critic-only review runs the critic, and nothing else, against the candidate accounts already saved in a round.

- **The saved records are only read.** No candidate is generated, and nothing in `runs/` is written.
- **The critic gets exactly what the critic stage sends:** the same prompt and schema, the text, and the saved account with its saved categories.
- **The saved validation must still be what the checks give.** If the validator now gives a candidate other categories, that text is refused before any request.
- **Each review is saved apart from the candidate,** in `reviews/<round>/`, and names the exact record it reviewed:
  - its round and file, and the file's hash as read
  - the candidate's hash, model, prompt hash, guide hash, date and provenance
  - the categories the critic was shown
- **A review holds:**
  - the critic's reply, or null if it was unusable
  - the saved validation with the reply applied, which only ever lowers
  - what the critic lowered and added, and anything rejected
  - the hash of exactly what was sent
- **One request per text, no retry.** A 503 or any other stopping error saves that review as stopped and stops the run; the saved candidate is untouched. Running the same command again reviews the same saved candidate again.
- **Resuming** skips a finished review only if it reviewed the same saved file with the same model, critic prompt and guide. Anything else stops the run before any request.

**A dry run** shows what would be reviewed, skipped or refused. It sends nothing and needs no key:
```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/interpret/register.mjs scripts/interpret/run.mts --dry --review-from dev-1-lite --round crit-1 --model gemini-3.5-flash-lite --only D003,D005
```

| Option | Meaning |
|---|---|
| `--review-from` | The round whose saved candidates are reviewed, for example `dev-1-lite`. Only complete records with a candidate account can be reviewed. Can't be combined with `--stages` |
| `--round` | Required with `--review-from`: the reviews' folder, `reviews/<round>/` |
| `--model`, `--limit`, `--rpm`, `--only`, `--timeout` | As above. `--model` is the critic's model, and the review records the candidate's model beside it |

### The development set's input contract

`dev-set/texts.md` holds one table, with the header `| Id | Domain | Text |`:
- **Id:** `D` and three digits, unique.
- **Domain:** free words.
- **Text:** one line, with no `|`. A row with an empty Text is ignored.

**The run accepts only these texts.** It refuses any that repeats or contains a protected text:
- the corpus, the robustness set and the unseen cases
- calibration, slice 1 and the held-out set
- the guide's examples and the test fixtures

Texts outside the set are refused before any request. The texts are yours to write; none are provided.

### What each text's record holds

- **The label:** "AI-generated exploratory interpretation, not a reference annotation"
- **The ids:** the model ID asked for and the one that answered, the text ID, and the date
- **The model's output:** the proposed account as returned, and the schema check's result
- **The checks:** the validator's result, every statement lowered with its rule and reason, everything rejected as malformed, and the Track A flags (below)
- **The run's cost:** the number of provider requests, token usage if returned, the duration, and any provider error

## A3, first step: mapping a reviewed account (2026-11-26)

**What it is:** `mapAccount` (`…/interpret/map.ts`), Lab study code. It takes a reviewed account, typed, and gives the engine's representation (contract v1), with a log of what it left out. The typed account has each statement's category, predicate form, basis and, for possibilities, holder, plus elements declared by the account's author. **It doesn't depend on Gemini:** its input is reviewed accounts, never model output. It changes nothing in `shared/visual/`. It only reads the contract and calls its check.

**What it does:**
- **It translates, and adds nothing.** R → `reported`, L → `implied`, I → `inferred`, P → `possible`, U → `unknown`, and a reported denial → `denied`. Each representation statement keeps its account id, and its basis starts with that id.
- **It never strengthens or weakens a statement to make it fit.** A statement it can't translate is left out, and the reason is logged:
  - no predicate form
  - a form the contract lacks or rejects
  - an implied statement with no licensed pattern from the registry, or one whose pattern doesn't give its predicate
  - a denial on anything but a reported statement
  - possibilities the contract can't attribute (a set held by a third person: the contract's sets come only from the person telling, the source, or reviewed content)
  - anything that depends on a statement left out
- **A statement with several forms is mapped whole or not at all.**
- **The contract's own check passes on every result.** An account the contract can't take as a whole (two own presences, a duplicate id) is refused, and nothing is mapped from it.

**What it leaves out:**
- ordering checks between statements (for example, that what a question asks about holds in the question's phases)
- facets, salience, words and drawing
- the free-text and model path
- any new licence, including the handover (`licence-candidates.md`)
- deriving element kinds or counts: the author declares them

**Its test inputs:** three reviewed corpus accounts (`mapping-cases.ts`), one per domain, none of them a slice-1, calibration, robustness or held-out text. A spec checks that their rows are the corpus's, unchanged, and that no trial or held-out text is among them. Each predicate form is the one pass A's representation gives that row. **Typing choices:**
- `group` (P-CS3-4) given count `several`, for pass A's "plural"
- `people` (E-8) given count `many`
- `nearness`, `warmth` and `tilt` (E-8) declared as qualities, because pass A named them only inside predicates

**The results, as consistency with pass A's representations** (earlier AI-authored material, not a reference):

| Case | Pass A's statements | Reproduced | Not reproduced, and why |
|---|---|---|---|
| **P-CS3-4** | 5 | 2: the reported absence of reactions, and the open question whether people saw it | `sends` (L1): pass A's implication rests on a presupposition ("your suggestion") no registry pattern covers. Pass A's `question(s2, cause)`: no row of the account holds it, so the mapping can't produce it. The reviewed readings (P): their question is that same missing row. Account rows with no form in pass A (I1, I2, U2) are gaps too |
| **M-2** | 6 | 3: the three dependencies of the launch (R2) | The three questions about each workstream's readiness: the contract can't ask about a "state". The date (R1): no predicate for a fixed date, as pass A noted (G-02) |
| **E-8** | 4 | 3: the people's belief (`believes`), its content as **denied**, and the source's own account as reported | `directness`: not a predicate of the contract |

**What this shows** (my reading of 3 cases, not a measure):
- **Where the mapping couldn't translate, it left the statement out and said why,** in every case.
- **The representation can no longer say more than its account.** Pass A's P-CS3-4 representation held a question its account didn't.
- **Attribution and denial survive the translation** (E-8): the belief stays the people's, and the content the source denies stays denied.
- **The gaps it logged are the contract's and the registry's,** named, not hidden:
  - a fixed date
  - asking about a state
  - "directness"
  - a third person's possibilities
  - a possessive presupposition

### Second step: time and phases (2026-11-26)

**The rules:**
1. **An account may declare its phases, in order,** as its author takes them from the text, and `repeats` only if the text says so. An account without phases gets one neutral phase, as in the first step.
2. **In an account with phases, every statement says when:** the phases it names, or `throughout`. **A statement that says neither is left out, with the reason logged.** The contract reads "no phases" as "every phase", so without this rule a state such as `holds` would hold through the whole account: a handover would become *is holding*. Persistence now comes only from an explicit `throughout`.
3. **Phases are copied exactly:** never inferred from tense or word order, and never extended. A statement with several forms has one set of phases for all of them.
4. **Left out or refused:**
   - a statement naming a phase the account doesn't declare is left out
   - so is one naming phases and `throughout`, or phases in an account with none
   - an account declaring no phases, or one phase twice, is refused
5. **Every reason the account's own rules find is logged together,** for example an unstated time and a missing licence.

**Its test inputs:** three more reviewed corpus accounts with phases, none a trial or held-out text: E-3 (before → after), E-7 (decades → 1914 → the war) and P-CS3-1 (now → after class). **Pass A's phases are kept as pass A gives them, and a statement pass A gave no phase is left unstated** (your decision, 2026-11-26). Only E-3's R2 and R3 ("after") carry a phase. **Typing choices** are in each case's `source`:
- `slice` given count 5
- pass A's "slice × 3" and "slice × 2" kept as written, since no declared element names *some* of the slices
- `note` declared (P-CS3-1)
- E-7's inferred causes typed one per event

**The results** (as consistency with pass A, not a reference):

| Case | Pass A's statements | Reproduced | Why not |
|---|---|---|---|
| **E-3** | 3 | 0 | "The pizza had five slices" has no phase in pass A, so pass A's own representation says five slices in *after* too. It's left out. "Three eaten": the contract can't name three of the five slices. "Two left": `present` isn't a predicate |
| **E-7** | 4 (3 orders, 1 inferred cause) | 0 | Pass A gave the order of the events, and the inferred causes, no phase |
| **P-CS3-1** | 6 | 0 | The note, the request to meet after class, the question and the readings: none has a phase in pass A that covers it. Pass A phases the sending "now" but not where the note is, and one statement holds both. Behind the time gaps, `pending` and asking about "content" aren't in the contract either |

**What this shows** (my reading of 3 cases):
- **Pass A rarely phased its statements.** Under the contract, those statements held in every phase: E-3's "five slices" after three were eaten, P-CS3-1's note at the meeting. The mapping now refuses that silent persistence instead of passing it on.
- **The positive path is tested on offline fixtures,** not on these cases. A handover maps to `sends` and `receives` in its phase, `holds` stays in the phase named, and a later `located-in` is in its own phase. A `holds` with no stated time is left out.
- **To map these accounts, their phases have to be reviewed,** statement by statement, by whoever owns them. The mapping won't supply them.

## What the validator checks (A1)

| Check | Demotes |
|---|---|
| **Derivation table** | Category from derivation (guide §4). An unknown derivation is a problem and is never established |
| **Reported: quotes** | A reported statement whose quotes aren't all in the text → inferred |
| **Implied: licence** | No licence, an unknown one, a trigger that doesn't fire on its quotes, an excluded sense ("takes up a hobby"), a derivation the licence doesn't cover, or a predicate form the licence doesn't give → inferred. "Walked past" gives the mover only: a form that has the passed thing move → inferred |
| **Possible: two or more** | A set with fewer than two options, or an option that isn't in the text → unknown |
| **Hedges** | An established statement taken from a hedged clause without the hedge in its quotes → inferred. Hedges include "seems", "probably", "I think", "unsure", "wonder(s, ed, ing) if/whether", "asked if", and any "whether" clause |
| **Quoted speech** | An established statement quoted only from inside quotation marks, without the attribution → inferred |
| **Conditionals** | An established statement from a conditional or counterfactual sentence that doesn't quote its conditional word → inferred. The words: "if"; an inverted "had", "were" or "should"; and, from 2026-11-26, "unless", "or else", "as long as", "so long as", "provided that" or "providing that", "provided" or "providing" opening a clause, and "otherwise" opening a clause ("Otherwise, …", "…; otherwise …"). Quoted with its word, a conditional stays reported as a whole |
| **Instructions in the text** | An established statement quoted only from an instruction addressed to the reader or the system → inferred, unless it reports the instruction itself ("the text tells the reader to …") |

### Track A rules beyond the guide (2026-11-26)

These are in the Track A candidate prompt and schema only. **The guide is unchanged,** so the human trial (Track B) works to the guide as it was. Track A therefore works to slightly stricter rules than the human annotators, on these points:

| Rule | In the prompt | Checked in code |
|---|---|---|
| **A basis for every statement** | Each statement has a `basis` (the guide's Basis column, which the Track A schema had left out). For anything not restated, a short reason, naming the device ("sarcasm: …", "hedged: …"). An inference or open question rests on something in the text, quoted or named in its basis | **Flag:** an inferred or unknown statement with neither a quote nor a basis |
| **The meant reading of sarcasm** | The inferred statement is the meant reading ("the instructor meant the experiment went badly"), with "sarcasm" in its basis, not that someone was sarcastic. This restates the guide's sarcasm rule | No |
| **Whose possibilities** | A possibility set names its `holder`, in the text's words ("Rana") or "the writer", and the statement says so. A set someone considers is theirs, not the text's complete list. `holder` is required on every statement and empty for anything else: left optional, it was left out (dev-4-lite, D002) | **Flag:** a set with no holder, or a holder the text doesn't name |
| **Statements that make sense on their own** | "If the projector doesn't work tomorrow, …", not "Otherwise, …". The text's attribution and quotation marks stay in the wording | **Flag** (your decision, 2026-11-26: flag, not lower): a reported or implied statement whose wording opens with a word pointing back to another statement ("otherwise", "if not", "if so", "in that case", "in which case", "or else", "else", "instead"), or that carries someone's quoted words (eight characters or more, from inside the text's quotation marks) without quotation marks |

**First run with these rules (dev-4-lite, 2026-11-26, one sample, AI-generated):** the rules with a field of their own were followed (every inference and open question had a basis; quotation marks stayed in the wording). The rules given only as instructions mostly weren't: sarcasm was still named, not given its meant reading (D003); "Otherwise, …" stayed (D005, flagged); 4 of 5 accounts used R1/L1 ids (the labels make up for it). D002's wording named Rana, but its optional `holder` was left out (flagged), so `holder` was made required. Criteria: `runs/dev-4-lite.expectations.md`.

**Flags lower nothing.** A flagged statement is already never established. They are reported for review, in the validation's `flags`, and counted in the exploratory counts. The critic's additions are checked the same way, with the critic's reason as their basis.

**On the saved rounds,** recomputed offline: no category changes. The flags fall on:
- dev-2 and dev-3 D001's inferences with no quote ("indoors", "so Deniz could draw"), and dev-2 D001's open question with no basis
- D002's possibility set in all three rounds, which names no holder
- D003's "The instructor said Well, that went perfectly." in dev-1 and dev-2, which drops the quotation marks
- D005's "Otherwise, they will distribute printed copies" in dev-1-lite

**Limits of A1:**
- **The checks for hedges, quotation, conditionals and instructions are word-level heuristics.** They catch the common forms and miss others.
- **Conditional words left out on purpose:** "in case" ("we took umbrellas in case it rained" reports that they took umbrellas) and "when" ("when I arrived, the door was open" is a report). A generic "when" ("when the bell rings, the class ends") is therefore not caught.
- **Known over-lowering:** "as long as" also has a comparative sense ("she waited as long as she could"), and there "she waited" is lowered to inferred. That only ever weakens a statement. An imperative before "or else" or "; otherwise" is lowered too.
- **Sarcasm has no check in code.** The optional critic stage is asked about it.
- **The critic's "obeyed an instruction" is about instructions inside the text only.** In round `dev-2-lite-critic` the question was worded loosely, and the critic said yes for D001 and D002, which contain no instruction. Its wording was tightened on 2026-11-26, so that round's flags aren't comparable with later ones.
- **What the checks establish is only that they behave as specified,** on the fixtures and on generated variants. They establish nothing about whether a model's accounts are right.
