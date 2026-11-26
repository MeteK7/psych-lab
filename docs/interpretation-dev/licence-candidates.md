# Candidates for the licensed-pattern review, from Track A

> **TRACK-A: AI-generated, development only, not validated.** Evidence taken from model output on the synthetic development set, collected 2026-11-26. It shows where the model reached for a pattern the registry doesn't have. **This review is closed** (your decisions of 2026-11-26, below). Nothing in it adds a licence row, changes a rule, or promotes a saved statement.

**Where the review lives:** the licensed patterns are guide §4's table, and `web/src/app/pages/lab/interpret/licences.ts` holds them as data. Their review is open in `docs/visual-study/open-issues.md` (OI-8, OI-25). That open issue is unchanged. **The guide is also the human trial's guide** (Track B), and it is unchanged.

**What the evidence is not:** the same model doesn't follow the rules consistently, even on the same input (five rounds). **That a model keeps proposing something is not evidence that it should become a rule.** The counts below show where the model reached for a pattern, nothing more.

## The decisions (2026-11-26)

| Candidate | Decision | In force? |
|---|---|---|
| **1. "X hands Y a Z"** | Accepted in principle: a completed physical handover entails that the recipient received the object. **No licence row.** The requirements a safe licence would have to meet are below; none is implemented | No. It stays inferred, as now |
| **2. "X did Y without Z-ing"** | **Reported restatement, not a licence row:** "Deniz placed the pencil without saying anything" supports *Deniz did not speak while placing the pencil* as R, scoped to that action, never *Deniz never speaks*. Written as a proposed addendum, `guide-addendum-0.1-proposed.md` | No, until you approve the addendum's adoption |
| **3. "During X, A did Y"** | **An observation only.** No licence: taking part in something at a time doesn't establish being physically there | No |

**Saved records are not promoted.** dev-1-lite D001 S5 ("Deniz did not speak", lowered to I) and every handover lowered in the rounds below stay as they were recorded.

## 1. "X hands Y a Z"

### The evidence

The model proposed it **in every round that has D001: 5 of 5**. Each time it claimed the closest existing row, `takes-up`, whose trigger ("pick up", "take up") doesn't fire on "handed", so code lowered every one.

| Round | Statement | Quoted | Claimed licence | Result | Would license |
|---|---|---|---|---|---|
| dev-1-lite | S4 "Deniz took the pencil" | "handed Deniz a pencil" | `takes-up` | L → I (licence doesn't fire) | — |
| dev-2-lite-critic | L1 "Deniz took the pencil from Alia" | "handed Deniz a pencil" | `takes-up` | L → I | yes |
| dev-3-lite-critic | L1 "Deniz held the pencil" | "Alia handed Deniz a pencil" | `takes-up` | L → I | — |
| dev-4-lite | L1 "Deniz took the pencil" | "Alia handed Deniz a pencil" | `takes-up` | L → I | yes |
| dev-5-lite | S4 "Deniz took the pencil" | "handed Deniz a pencil" | "takes up" (not an id) | L → I (unknown licence) | — |

### What the current contracts can and can't preserve (checked 2026-11-26)

| What a handover needs kept | Validator and account (Track A) | Representation contract (`shared/visual/representation/contract.ts`) |
|---|---|---|
| **The recipient and the object** | **Not preserved.** The Track A schema has no predicate field (`say`), so no account carries arguments. Where `say` exists (fixtures), the validator checks only the predicate's name against the licence's `maps` (the `form` rule), plus one argument rule (`passes`: only the one passing moved). Nothing checks which words are the giver, the recipient or the object | **Can be expressed.** `sends {from, item, to}` and `receives {who, item}` exist, beside `holds {who, what}` |
| **The physical sense** | **Not preserved.** Licences exclude senses by words only (`takes-up` excludes "a hobby", "space" …). Nothing says what kind of thing the object is | **Can be checked.** Elements have a `kind`, and `object` is one. Nothing requires it today |
| **Negation and modality** | **Partly.** A statement quoted without its hedge or conditional word is lowered. But the trigger fires inside a quote even when the verb is negated or modal ("didn't hand", "tried to hand", "would hand", "offered"), and nothing compares the statement with its quote. Probes show "was not cancelled" restated as "was cancelled" stays R (`reliability-gaps.md`) | **Partly.** Negation can be `denied` (v1) or `exchange-absent`. There is no modality: "tried to", "was about to" can't be expressed, only left out |
| **Temporal scope** | **Not preserved.** Accounts have no time, phase or tense field, and the validator has no notion of sequence | **Can be expressed, with a trap.** A statement holds in the `phases` it names, and **in all phases when it names none**. So a `holds (Deniz, pencil)` with no phases says Deniz holds it throughout: *is holding*, which D001's next clause ("placed it beside the sketchbook") contradicts |

**The conclusion:** today, nothing would stop a handover becoming an unqualified, persistent `holds`. The arguments, the sense and the time are each left to the interpreter.

### The minimum requirements for a safe, domain-neutral licence

These are requirements, not a design. None is implemented.

1. **What it licenses, and only that:** at the moment of the handover, Z passed from X to Y, and Y received it. Not that Y kept it, used it, wanted it, or holds it now.
2. **Its representation is an event, not a state.** It maps to `receives (Y, Z)`, with `sends (X, Z, Y)` when the giver is named. If `holds` is ever used, it must carry the handover's phase, and only that phase. **An unqualified `holds` is refused.** The mapping must also not carry the holding past a later clause that ends it (D001: "placed it beside the sketchbook").
3. **Each argument is anchored to the quoted words by its role:**
   - the recipient is the indirect object ("handed **Deniz** a pencil") or the object of "to" ("handed a pencil **to Deniz**")
   - a passive ("Deniz was handed a pencil") names the recipient, not the giver
   - "handed the pencil over" names no recipient, so no recipient is claimed
   - an argument that can't be anchored stays unmapped and is logged as a gap, never filled in
4. **Physical sense only:**
   - the object must be an element of kind `object`
   - the excluded senses are named: "hand in", "hand down", "hand out", "hand over" (control or responsibility), and abstract objects ("handed them a defeat", "an opportunity", "the job", "the lead", "the win")
5. **Completed, asserted handovers only.** It doesn't fire when the verb is:
   - negated ("didn't hand", "never handed")
   - modal or attempted ("tried to", "wanted to", "would", "could", "should", "was going to", "about to", "offered", "held out")
   - progressive ("was handing"), or present-habitual or generic ("hands out the post every day")
   - A negated handover maps to `denied` or `exchange-absent`, never to `receives` or `holds`.
6. **The existing checks still apply first.** A handover under a hedge, inside a conditional or inside quoted speech is lowered as now. The licence never raises it.
7. **Domain-neutral:**
   - it's named for the structure (a transfer between two presences), not a domain
   - it starts from a closed verb list ("hand"), each verb with its own exclusions
   - a broader verb such as "give" isn't covered, because it has many abstract senses ("gave advice", "gave a talk")
8. **Tested like every licence, and more:**
   - fixtures where it fires, doesn't fire, and has the wrong sense (as the proposal requires for every row)
   - also negation, modality, tense, a passive, a missing recipient, and an abstract object
   - and a mapping test that no handover yields a `holds` without a phase
9. **Requirements 3 to 5 need checks that don't exist yet** (anchored arguments, element kinds, tense and modality). That is why the decision is "no row": a row added now would be checked only by its trigger word.

**My reading** (one reviewer, an AI): in D001 the support is stronger than "handed" alone, because Deniz then "placed it beside the sketchbook", which he could only do with it in hand. That rests on two clauses, which a single-pattern licence can't see.

## 2. "X did Y without Z-ing"

**Decision: reported restatement.** The clarification, its scope and how to tell it apart from other uses of "without" are in `guide-addendum-0.1-proposed.md`, which is not in force.

### The evidence

The model proposed it as an implication only once. The other rounds restated it.

| Round | Statement | Quoted | Claimed licence | Result |
|---|---|---|---|---|
| dev-1-lite | S5 "Deniz did not speak" | "without saying anything" | `not-done` | L → I (licence doesn't fire). **Not promoted** |
| dev-2-lite-critic, dev-3-lite-critic | R4 "Deniz said nothing while doing so", R5 "Deniz did not say anything" | "without saying anything" | none: restatement | R |
| dev-4-lite, dev-5-lite | "Deniz placed … without saying anything" | the same, whole | none: restatement | R |

### What the validator does today (offline probes, 2026-11-26; nothing changed)

| Statement, quoting the "without" clause | Derivation | Today | Under the addendum | Match? |
|---|---|---|---|---|
| "Deniz did not speak while placing the pencil" | restatement | R | R | ✓ |
| "Deniz did not say anything" | restatement | R | R | ✓ |
| "Deniz did not speak" | entailment, licence `not-done` | L → I (licence doesn't fire) | Mislabelled: the addendum says restatement. With no row, an implication stays inferred | ✓ (it lowers, and must not raise) |
| **"Deniz never speaks"** | restatement | **R** | Not R: wider than the action | **✗ Mismatch** |
| **"Deniz said nothing during the workshop"** | restatement | **R** | Not R: wider than the action | **✗ Mismatch** |
| "He did not pay", from "He probably left without paying" | restatement | I (hedge) | I | ✓ |
| "He did not pay", from "If he leaves without paying, call me" | restatement | I (conditional) | I | ✓ |
| **"You entered", quoting "enter" from "You cannot enter without a ticket"** | restatement | **R** | Not R: the text reports a requirement, not an entry | **✗ Mismatch** |

**The mismatch is the validator's general one, not something specific to "without".** A reported statement only has to quote words that are in the text. Its wording is never compared with the quote, so a statement wider than its quote stays R. The validator is unchanged, as instructed. See `reliability-gaps.md`, gap 1.

**The regression tests that would cover the change,** if the addendum is adopted and a wording check is built (not written now):
1. A scoped restatement from "X did Y without Z-ing" ("X did not Z while doing Y") stays R. This pins today's behaviour.
2. A statement that widens it ("X never Zs", "X said nothing all day", "X is silent") and quotes only the "without" clause doesn't stay R.
3. "Without" with a noun ("left without her coat") doesn't yield a "did not Z" statement as R. Its restatement is about the noun ("she didn't have her coat with her").
4. "Without" in a requirement ("can't enter without a ticket") yields neither "you entered" nor "you had no ticket" as R. Only the requirement as a whole is R.
5. "Without" under a hedge or a conditional is still lowered. This pins today's behaviour.
6. A "without" statement labelled as an implication is never raised: no row, so it stays inferred.

They would go with the validator's generated variants in `interpret.spec.ts`.

## 3. "During X, A did Y"

**Decision: an observation only.** No licence. Taking part in something at a time doesn't establish being physically there: someone can join a workshop from elsewhere.

The evidence: dev-5-lite D001 (S5, S6), "Alia was in the drawing workshop" and "Deniz was in the drawing workshop", proposed as entailments with no licence and lowered to I. They stay as recorded.
