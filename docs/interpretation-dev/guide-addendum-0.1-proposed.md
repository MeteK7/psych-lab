# Proposed guide addendum 0.1: "without Z-ing" as a reported restatement

> **TRACK-A: AI-generated, development only, not validated.**
>
> **Status: proposed, not in force.** Version 0.1, 2026-11-26. It is not part of the annotation guide (`docs/interpretation-trial/guide.md`), and it changes nothing until you approve its adoption. The guide, the human trial's materials (Track B), the Track A prompt, the validator and the licensed patterns are all unchanged. No saved statement is promoted by it.

## What it clarifies

The guide's hard boundary *R or L?* (§4): "If the text says it in its own words, it is R. L is for what the words carry without saying." It doesn't say how that applies to "without". This addendum says so for one form. It adds no licensed pattern (your decision of 2026-11-26, recorded in `licence-candidates.md`).

## The clarification

**"X did Y without Z-ing" says, in its own words, that X did not Z while doing Y.** Write it as a reported statement (R, derivation `restatement`), with the words "without Z-ing" and the action in its Basis.

- **Scoped to that action.** It says X didn't Z *while doing Y*. Not before or after, not as a habit, not "never", and not why.
- **Write the scope into the statement:** "X did not Z while doing Y", or keep the clause whole ("X did Y without Z-ing").
- **Never wider than the action:** "X never Zs", "X said nothing all day" and "X is quiet" are not restatements of it.

> *The courier left the parcel at the gate without ringing the bell.* (Not a trial text.)
- R1: The courier left the parcel at the gate · R · "The courier left the parcel at the gate" · restatement
- R2: The courier did not ring the bell when leaving the parcel · R · "left the parcel at the gate without ringing the bell" · restatement
- Not R: *The courier never rings the bell.* It's wider than the action. If written at all, it is I
- U1: Why the courier didn't ring · U · the text doesn't say · open question

**The same form, with other verbs:**
- *He signed without reading the terms.* R: he did not read the terms when he signed.
- *She tidied the room without being asked.* R: she was not asked before she tidied it.

## Other uses of "without": not this form

| Use | Example (not trial texts) | How to annotate |
|---|---|---|
| **"Without" with a noun** | *She went out without an umbrella.* | R: she went out without an umbrella (she didn't have one with her). Not "she didn't open an umbrella": no action is negated |
| **A requirement or condition** | *No one may board without a ticket.* | R is the requirement as a whole. Neither "someone boarded" nor "someone had no ticket" is R |
| **A counterfactual** | *Without your help, we would have failed.* | The guide's hypotheticals rule: R is the whole ("the writer says they would have failed without the help"). "You helped" is taken for granted: I, Would license `yes`. "We would have failed" is never R on its own |
| **Under a hedge, a condition, quoted speech or an instruction** | *He probably left without paying.* | The guide's rules for those come first. Here: R is the hedged attitude, and "he did not pay" is I |

## What adopting it would change, and what it wouldn't

- **It would add one paragraph to the guide,** in §4 under *The hard boundaries* or *Texts that don't assert plainly*, worded by you. The `TRACK-A` line above must not go into the guide: a spec keeps it out of `docs/interpretation-trial/`.
- **It would change the human trial's guide,** so it should come before calibration, as a versioned change to the guide.
- **It would not change any category rule or licence,** or the validator. The validator already keeps a scoped restatement as R, and lowers a hedged or conditional one.
- **What the validator can't yet do is notice a statement that is wider than its quote** ("Deniz never speaks", quoting "without saying anything", stays R today). That gap is general, not specific to "without". The mismatch and the regression tests that would cover a fix are in `licence-candidates.md` §2, and the gap in `reliability-gaps.md`, gap 1.
- **It would not promote saved statements.** dev-1-lite D001 S5, "Deniz did not speak", proposed as an implication and lowered to I, stays as recorded.

## Versions

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-26 | Proposed. Not in force |
