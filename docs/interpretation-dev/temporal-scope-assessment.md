# A3: is statement-level temporal scope expressive enough?

> **TRACK-A: AI-generated, development only, not validated.** An assessment written 2026-11-26, from reading the code and the reviewed corpus accounts. Investigation only: nothing in `shared/visual/`, the mapping, the validator, the licences, the exercises or the figures was changed. Agreement with pass A's accounts, which are earlier AI-authored material, is not independent validation.

## The answer

**Yes, for the next mapping milestone, with two review conventions and one small typing change. No contract change.**

1. **A reviewed row whose parts hold at different times is split into atomic statements,** each naming the row it comes from. P-CS3-1's "the teacher wrote a note on own's assignment" is the example: a sending, and where the note then is.
2. **A relation that isn't located in time is marked `throughout` explicitly,** as the current rule already allows. That covers order and causation.
3. **The safeguard stays as it is:** a statement in an account with phases names its phases or is marked `throughout`, or it's left out.

None of the 17 unmapped statements in E-3, E-7 and P-CS3-1 needs more temporal expressiveness than this (section 6):
- 4 are **missing annotations** that review could supply. One of them, P-CS3-1's readings, stays blocked by its question
- 11 are **unsupported predicates or values**
- 1 is a **counting limit:** some members of a counted thing
- 1 is a **compound row** that needs splitting

The real limits are in the predicates, not the time model:
- nothing says that an event or process took place
- nothing names some members of a counted thing
- a request or plan isn't an event

## 1. What the contract and its consumers do with time (read only)

- **The contract** (`shared/visual/representation/contract.ts`) declares `time.phases`, in order, and an optional `repeats`. Each `Statement` has optional `phases`, which the contract defines as *"the phases in which it holds; all phases when absent"*. Elements have no time.
- **The check** (`check.ts`) tests only that a statement's phases are among the declared ones.
- **Every consumer reads only a statement's first phase.** The motion, carrying, dependency and felt patterns, and the Lab's kinetic idiom, all use `phases.indexOf(s.phases[0])`, falling back to the first or a fixed phase when there's none.
- **No pattern or idiom reads where a statement stops holding.** The ten predicates the patterns draw are `above`, `alternatives`, `complete`, `contact`, `depends-on`, `displaced`, `feels`, `flows`, `located-in` and `part-of`. `holds`, `sends`, `receives`, `precedes` and `causes` aren't drawn by any pattern.
- **The consequence:** the representation can state an interval, and the mapping now preserves it exactly. **Drawing honours only when a statement starts.** That's a limit for the drawing stage, not the mapping. It's recorded here, with no change.

## 2. Predicates by temporal kind

What a statement's phases mean depends on the kind of claim:

| Kind | Its phases mean | Contract predicates (v1), as usually used |
|---|---|---|
| **An event or action within a phase** | The phase it happens in | `passes`, `sends`, `receives`, `joins`, `transforms`, `reacts`, `shifts`, `releases`, `displaced` |
| **A process over its phases** | Every phase it runs in, plus `repeats` for a cycle | `flows`, `cycles` |
| **A state that persists over an interval** | Every phase it holds in, and no others | `holds`, `located-in`, `apart`, `feels`, `part-of`, `absent`, `waiting`, `behind`, `above`, `form`, `exchange-absent` (no exchange during the interval), `believes` (the believer's state), `expects`, `intends`, `late`; and `question` and `alternatives` (open over an interval) |
| **A relation between elements or statements, not located in a phase** | Nothing: `throughout` | `precedes` (between elements), `causes` (between elements or statements), `contrasts` (between statements) |

**The kind belongs to the claim, not the predicate name.**
- `contact` is an event in "the ball hits the box", and a state in "the cup is touching the shelf".
- `complete` is a state reached at a moment.
- `depends-on` can be a standing relation or a state that ends when the thing arrives.
- `notices` can be a moment or a state.
- `exceeds` holds at a time, or as a general fact.

So **no rule by predicate name can set a statement's time.** A scope must come from review of each claim, which is why the current rule asks the account to state it.

## 3. Does `precedes` say anything the phase order doesn't?

**When each event has a statement placed in its own phase: no.** The phase order already says the order, and a `precedes` between them adds nothing. It could only contradict the phase order, and the contract has no check that they agree. S-4 is the example: each day's event is in its own phase, and pass A's "R1–R3 lead to R4" is already said by Monday → Thursday.

**But in this contract it often does say something,** for two reasons:
1. **`precedes` relates elements, and elements have no time.** Phases belong to statements only.
2. **No predicate says that an event or process took place.** In E-7, the rivalry, the arms race, the assassination and the war are elements with no other statement about them. Nothing places them in "decades", "1914" or "the war", so those phase names hold nothing. **There, `precedes` is the only carrier of the order.**

**And it can't relate statements.** Pass A's S-4 "precedes(s1–s3, s4)" orders statements. The contract can't say that with `precedes`, only through the phase order.

**So:**
- Order between events that are placed in phases needs no `precedes`.
- `precedes` between elements that aren't placed is a relation, scoped `throughout`.
- The missing "took place" predicate is a predicate gap, not a time-model gap. It's out of scope here: no new predicates.

## 4. Statements with several predicate forms

Today a statement's forms share one scope. **They can share it safely only when they are claims of the same temporal kind over the same phases:**
- **Parallel claims of one kind:** M-2's three `depends-on`, all standing over the same interval.
- **The two sides of one event:** a handover's `sends` and `receives`, both in the phase it happens.

**They can't share it when one form is an event and another is the state that event begins or ends.** P-CS3-1's R1, "the teacher wrote a note on own's assignment", holds:
- `sends (teacher, note, own)`: an event, in the phase the writing happens
- `located-in (note, assignment)`: a state from then on. Whether it still holds *after class*, the text doesn't say

Whichever single scope is chosen:
- **"now" only** narrows the state. That's safe, but it loses something.
- **"now" and "after class"** says the sending happened twice, or lasted. **That's wrong.**

**Domain-neutral answer:** an event and the state it starts or ends are two claims. The guide's own rule says one claim per statement (§3). **Such a row is split at review into atomic statements.** The mapping can't detect the mix by itself, since kinds are use-dependent (section 2). So this is a review convention, backed by the property tests, not an automatic check.

## 5. The smallest approaches, compared

| Approach | Contract change | Mapping change | Cost |
|---|---|---|---|
| **A. Statement-level scope, and split mixed rows into atomic statements** (recommended) | None | One optional field on a typed statement, `row`: the reviewed row it comes from, its own id by default. Several typed statements may share a row. The basis and the `mapped` record carry the row. **Time rules unchanged** | Review must split mixed rows. The test that rows are copied unchanged compares by `row` |
| **B. Scope per predicate form** | None, since each form already becomes its own representation statement | Each form may carry its own `phases` or `throughout`, inheriting the statement's otherwise | Two places for time on one statement, and rules for when they conflict. The account's row stays whole, but now carries claims with different times |
| **C. Treat cross-phase relations specially** | Not needed | Not needed | **The contract doesn't require it:** `throughout` already scopes a relation, and nothing draws `precedes` or `causes` |

**A is the smallest coherent choice:**
- one place for time
- the guide's one-claim rule
- no contract change, and no new rule in the mapping

B would be justified only if splitting changed what a reviewed row claims. It doesn't: the split statements together claim exactly the row.

**What would justify changing the contract later** (none is needed now):
- **A boundary inside a phase,** such as "by Thursday", "until", "since". Phases can only approximate it. "By Thursday" → *Thursday* is the narrower, safe reading: it held then, and whether it held earlier is left unsaid.
- **Drawing the end of a state** (section 1). That's a drawing-stage change.

## 6. The three regression cases, classified (kept unchanged)

They stay in `mapping-cases.ts` exactly as typed, mapping nothing, as regression examples of the safeguard.

| Case | Row | Typed form | Classification | What review could supply, or why not |
|---|---|---|---|---|
| E-3 | R1 "The pizza had five slices" | `part-of (slice, pizza)` | **Missing annotation** | Its phases. **Unresolved:** *before* only, or `throughout`, depending on whether eaten slices are still "of the pizza" |
| E-3 | R2 "Three have been eaten" | `absent (slice × 3)`, *after* | **Expressiveness limit, not temporal** | The contract can't name some members of a counted element |
| E-3 | R3 "Two are left" | `present (slice × 2)`, *after* | **Unsupported predicate** (`present`), and the same limit | — |
| E-3 | I1 "The slices are equal" | none | **Unsupported predicate:** no form for equal size. It's inferred, so never drawn anyway | — |
| E-7 | R1–R3 (the rivalry, the arms race, the assassination) | none | **Unsupported predicate:** nothing says a process took place, so they can't be placed in phases | — |
| E-7 | R4 "The war began after these" | 3 × `precedes` | **Missing annotation** | `throughout`: an order relation isn't located in a phase. Here it's the only carrier of the order (section 3) |
| E-7 | I1 "They caused the war" | 3 × `causes` (inferred) | **Missing annotation** | `throughout`. It's inferred, so never drawn |
| P-CS3-1 | R1 the note | `sends` + `located-in` | **Compound row** | Split it: the sending in *now* (pass A phases it so); where the note is, **unresolved** (section 4) |
| P-CS3-1 | R2 the request to meet after class | `pending (meeting)` | **Unsupported predicate,** and a limit of modality, not time: a requested meeting hasn't taken place | — |
| P-CS3-1 | L1 own has an assignment | none | **Unsupported:** no form, and no registry pattern for the presupposition | — |
| P-CS3-1 | I1, I2, U2 | none | **Unsupported:** no form (I1 and I2 are inferred, so never drawn) | — |
| P-CS3-1 | U1 what the teacher wants to talk about | `question (meeting, content)` | **Missing annotation, and an unsupported value** (`asks: content`) | Its scope (*now*, or `throughout`) wouldn't be enough: "content" isn't one of the contract's questions |
| P-CS3-1 | P the reviewed readings | `alternatives (U1)` | **Missing annotation,** and it depends on U1 | It can't be mapped while U1 isn't |

One more note: pass A's phase name "now" in P-CS3-1 comes from the text's present tense ("writes"). Under the rule of not inferring time from tense, a reviewer would have to justify it.

## 7. The next positive-path case: S-4 "a long account"

**Why S-4:**
- **It isn't protected:** it's not a slice-1, calibration, robustness or held-out text, and no stress case is in the trial.
- **It has phases.**
- **Its phases are the text's own words:** "On Monday … on Tuesday … on Wednesday … by Thursday". They're days in their fixed order, not tense or word order.
- **Pass A phased it,** one event per day.

The other open phased cases:
- E-4 has one span ("many generations"), and M-6 rests on `grows` and `unchanged`, which aren't predicates.
- E-3, E-7 and P-CS3-1 stay as regressions.

> *"On Monday my presentation got moved, on Tuesday I missed the bus and was late, on Wednesday my landlord emailed about the rent, and by Thursday I just felt behind on everything."* (corpus-stress.md, S-4; the account below is pass A's, unchanged)

**The proposed temporal annotations.** They're separate from pass A's account, which stays as it is. Each has its source, and **⚠ marks a choice for your review**:

| | Proposal | Source | Status |
|---|---|---|---|
| **Phases** | `Monday`, `Tuesday`, `Wednesday`, `Thursday` | The text's day words; pass A's "Time: four phases", one per day | Supported. ⚠ "By Thursday" names a deadline, not a phase. Thursday as a phase is the text's own word, and the claim it holds then is entailed by "by" |
| **Elements** | `own` (presence, own), `landlord` (presence, secondary), and ⚠ `email` (object) | Pass A: `own`, `landlord`. `email` comes from the verb "emailed", not a noun in the text | ⚠ Whether to declare `email` as the thing sent. Without it, R3 has no form |
| **R1** "Monday: own's presentation was moved" | **No form** | `shifts` needs `later: true/false`, and the text doesn't say earlier or later | Not mappable without inventing a direction. Would be phase `Monday` |
| **R2** "Tuesday: own missed the bus and was late" | **No form** | No predicate for missing something. `late` may only be inferred, never reported | Not mappable. Would be phase `Tuesday` |
| **R3** "Wednesday: own's landlord emailed about the rent" | `sends (landlord, email, own)`, phase `Wednesday` | "on Wednesday my landlord emailed" | Supported, if `email` is approved. ⚠ "about the rent" is lost: the contract has no argument for a topic. It's an omission, not an addition |
| **R4** "By Thursday own felt behind on everything" | `feels (own, charge ?)`, phase `Thursday` | "by Thursday I just felt behind on everything"; basis "attributed" | ⚠ **`charge` must be a number from 0 to 1, and the text gives no strength.** Pass A's 0.7 is its own reading. **I recommend no value:** R4 then stays a gap, a limit of the contract (a feeling with no stated strength) |
| **L1** "The writer puts R1–R3 in one sequence leading to R4" | **No form** | Pass A's `precedes (s1–s3, s4)` relates statements, which `precedes` can't. The order is carried by the phases themselves (section 3) | Not mappable, and not needed. It's also implied with no registry pattern ("and by Thursday") |
| **I1** "R1–R3 caused R4" | 3 × `causes (R1/R2/R3, R4)`, `throughout` | Pass A's inferred causation | Left out whole: R1 and R2 can't be mapped, so its causes don't exist. Inferred, never drawn |

**The expected result, if you approve `email` and give R4 no charge:**
- **R3 maps** as `sends` in *Wednesday*, and only there. That's an event in a non-first phase, from a reviewed account.
- **The other five rows are gaps,** each with its reason.

It's a small positive path, but every part of it is supported by the text.

## 8. What the next implementation would change and test

**What approving it would authorize:** the changes below, in the Lab's Track A code and docs only.
**What it would not authorize:** any change to `shared/visual/`, the validator, licences, exercises or figures; any new predicate; deriving phases from tense or word order; any model request.
**What waits:** drawing the end of a state (the drawing stage), any "took place" predicate, and the open choices in section 7, which you decide.

**What would change:**
1. **`map.ts`:**
   - an optional `row` on a typed statement: the reviewed row it comes from, its id by default
   - the basis, starting with the row and its id, and `mapped` entries gaining `row`
   - nothing else: the time rules, the safeguard, whole-or-nothing for forms, and the contract check all stay as they are
2. **`mapping-cases.ts`:**
   - **S-4** typed with exactly the annotations you approve from section 7. A choice left open stays unstated, as now, so that statement is a gap.
   - **E-3, E-7, P-CS3-1 unchanged.**
3. **`map.spec.ts`:**
   - The test that rows are copied unchanged compares typed statements to their reviewed row by `row`: each typed statement's wording, category and basis equal its row's, and every row appears.
   - **S-4:**
     - R3 maps as `sends (landlord, email, own)` with phases exactly `['Wednesday']`, and nothing maps in another phase
     - R1, R2, L1 and I1 are gaps with the reasons above, and R4 is a gap if no charge is approved
     - every property holds
   - **A split row (offline fixture):** one reviewed row typed as two statements, an event in one phase and the state it starts in the phases named. Both trace to the row, each keeps its own phases, and dropping either statement's phases leaves it out.
   - **The regressions:** E-3, E-7 and P-CS3-1 still map nothing, with the same reasons (the existing tests).
4. **`README.md`** and this document: the result, as consistency with pass A.

**Your decisions before it is built** (section 7):
1. Declare `email`, from "emailed", as the thing R3 sends?
2. Give R4's feeling a charge? I recommend not: it stays a gap.
3. Accept *Thursday* as the phase for "by Thursday"?
4. Should P-CS3-1's R1 be split at review now, or later? It stays unchanged as a regression either way, unless you say otherwise.
