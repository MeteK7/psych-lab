# Stage 1b: the interpretation trial (offline part)

> **Status (2026-11-23): slice 1 prepared, corrected before annotation; calibration next, then the freeze, then annotation.** No interpreter or model has run, and none may without your separate approval, which names the service and sends synthetic text only. Every text here is synthetic: none comes from any person's session.

## What it asks

Can a text be turned into an account in the five categories reliably enough (`../visual-engine-investigation.md` §10)? The engine draws only what an account commits to as established, so the measure that matters most is **over-commitment**: statements put as established that a careful person wouldn't establish.

The offline part makes the yardstick before anything is measured with it:
- the texts
- an annotation guide
- reference accounts written by two people, alone, then settled together
- the scoring

## Your decisions (2026-11-23)

- **D6 (a):** the offline part only. Model runs wait for a separate approval.
- **Annotators:** you and the psychology-trained reviewer, each alone, then together to settle the reference.
- **A first slice of 16 texts,** then your review, before the rest.
- **The pass A accounts are scored against the reference,** labelled as what they are: accounts written by a model (the assistant that ran the study), with the study's full context, revised over eight revisions. That is not an interpreter trial.

## Files

| File | What | Who |
|---|---|---|
| `guide.md` | How to annotate: splitting, the five categories, the licensed patterns, the sheet | Both annotators read it first |
| `robustness.md` | The 20 robustness texts | **You review it before annotation** |
| `slice-1/texts.md` | The 16 texts under neutral ids, for reading or printing | Annotators |
| `slice-1/annotator-a.md`, `annotator-b.md` | Each annotator's sheet, filled alone | One each |
| `calibration/texts.md`, `annotator-a.md`, `annotator-b.md`, `notes.md` | Five practice texts, annotated alone, then compared; what you found and the guide changes you agree. Not scored | Both, before slice 1 |
| `slice-1/alignment-a-b.md` | Which of A's statements is which of B's, filled together before settling; for an unpaired inferred or unknown statement, the other's view (`plausible` or `unsupported`) | Both |
| `slice-1/reference.md` | The settled reference, with the reasons for each settled disagreement | Both |
| `slice-1/alignment-pass-a.md` | Each pass A statement against the reference, with a verdict | One person, after the reference |
| `slice-1/key.md` | Which text is which case | **Annotators don't open it** until the trial is over |
| `results/slice-1.json` | Written by the spec once every sheet is filled | — |

## How it is checked and scored

`web/src/app/pages/lab/trial/` (study code, Lab only, no dependency, no network), run with the unit tests:
- **The packet:** 16 texts, each exactly as its source has it, and blind: no case id, category or account statement in it.
- **The sheets:** every row's category valid, its derivation leading to it, and a reported statement's basis quoted from its text. The pass A rows must be copied unchanged from the corpus.
- **Once every sheet is filled,** it computes:
  - **agreement between A and B,** from what each wrote alone: Cohen's κ over the five categories, over established against not, and on implied against inferred, with the confusion table. κ counts only statements both wrote, so two different lists of inferences don't lower it.
  - **how far the two lists match,** in two parts:
    - **anchored statements (R, L, P):** a statement with no partner counts against
    - **open-ended statements (I, U):** a statement with no partner counts against only if the other annotator marked it `unsupported`. Two careful readers list different inferences and questions, and that alone is not an error.
  - **the pass A measures:** over-commitment (the primary measure), possibilities stated as fact, reported/implied swaps, under-commitment, fabrication, and recall for R, L and P. For I and U it is reported as **coverage**: descriptive, not an error rate. An inference the reference doesn't list counts against pass A only if pass A put it as established.
  - Both measure sets are computed twice: by the licensed list as it stands, and as if every licence both annotators agreed were added to it.
- **Familiar and unfamiliar texts are reported apart,** as well as together, each with what it can show:
  - **the 12 corpus texts: retrospective.** These cases shaped the categories and the licensed patterns, and pass A was written with them in view (so the pass A measures are corpus-only). They show how the method does on familiar material, not that it generalizes.
  - **the 4 robustness texts:** written for the trial, outside that material. Four texts can't establish generalization, and slice 1 claims none.
  - Each annotator's "seen before" answers are reported per text.

## The threshold (your decision, 2026-11-23, before any annotation)

**The categories hold when Cohen's κ is at least 0.6 over the five categories, and also on implied against inferred.** Below that, the categories are redefined before slice 2. The results report `categoriesHold` as `yes`, `no`, or `not measurable` when either κ can't be computed (for example, no pair of statements where one annotator chose implied and the other inferred). In that case the rule can't be applied, and the findings say so instead of deciding. The value is fixed in the code (`THRESHOLD`, `results.ts`).

## Before annotation: calibration, then the freeze

1. **Calibration.** You and the reviewer each annotate the five texts in `calibration/` alone, then compare. In `calibration/notes.md`, write where you read the guide differently, and any change you agree. Nothing here is scored or reported. The spec checks that no calibration text is a trial, robustness, unseen or guide text.
2. **Guide changes,** if calibration leads to any: you agree them, I make them, and they are listed below.
3. **The freeze,** on your word: a spec pins the hashes of `guide.md`, `robustness.md`, `slice-1/texts.md`, `slice-1/key.md` and the scoring code (`pages/lab/trial/`). After that, any change to them fails the tests until you approve a re-pin.
4. **Then slice 1 is annotated.**

## Corrections before annotation (your request and approval, 2026-11-23)

- **Licensed patterns** (`guide.md` §4):
  - "Walked past" licenses only that X came close to Y and went on. Whether Y moved is not licensed: it was "X and Y came close and continued", which could be read as both moving.
  - "X didn't do Z" no longer licenses that Z didn't take place.
  - "Returns to" is plain: going back to where, or what, X was before.
  - "Takes up / picks up" covers the physical sense only.
  - The ladder example's "still with the neighbour" is a pragmatic inference, not an entailment.
  - `representation-v0.md` §5 keeps its wording until the licensed-pattern review (OI-25). The representation already records which one moved (`passes` has `mover`).
- **Texts that don't assert plainly:** a new guide section, with examples outside every measured text, for quoted speech, sarcasm, hypotheticals and counterfactuals, hedges, and instructions inside a text.
- **Open-ended statements:** the alignment's "Other's view" column; the reference keeps every plausible inference and question; splitting in two parts; coverage instead of recall for I and U.
- **Corpus and robustness texts reported apart,** with what each can show.
- **Calibration and the freeze,** above.
- **Pass E's information sheet:** the drawings, not the participant, are tested; and it now covers transcription, retention (6 months at most), withdrawal and quotations. Procedure §4 and §3 step 6 match it.

## Open question

- **The robustness set's other language** (R13, R14). Both annotators must read it. It's needed only in slice 2.

## Not in slice 1

- **The other texts:** 22 corpus texts, the 10 unseen texts and 16 robustness texts, in slice 2, after your review.
- **Stability, latency and cost:** they need model runs.
