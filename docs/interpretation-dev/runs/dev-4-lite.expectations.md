# dev-4-lite: what counts as following the Track A rules

> **TRACK-A: AI-generated, development only, not validated.** Written 2026-11-26, before the run, so the result is read against criteria set in advance.

**The run:** a candidate-only round on `gemini-3.5-flash-lite`, D001–D005, 5 requests, with the prompt and schema of 2026-11-26 (a basis for every statement, the meant reading of sarcasm, a holder for possibility sets, statements that make sense on their own, S-numbering) and the widened conditional check.

**The question:** does the model follow the new prompt rules, and do the flags fall where they should? This is not a measure of accuracy.

## The criteria

| Rule | Followed when | Read from |
|---|---|---|
| **Basis** | Every inferred or unknown statement has a quote or a basis: no "no basis" flag | Flags (code) |
| **Sarcasm** (D003) | An inferred statement gives the meant reading ("the instructor meant it went badly", or the like), with "sarcasm" in its basis | My reading, labelled as such |
| **Holder** (D002) | The possibility set names Rana as its holder, and the statement says she considers them: no holder flag | Flags (code), and my reading of the wording |
| **On its own** (D005) | The else-branch is written as its own conditional ("If the projector doesn't work tomorrow, …"): no "points back" flag | Flags (code) |
| **Quotation marks** (D003) | The instructor's words keep their quotation marks: no quotation flag | Flags (code) |
| **Numbering** | Statement ids are S1, S2 … | The records (code) |
| **No new over-commitment** | No reported or implied statement claims more than the text says | My reading, labelled as such |

## How it will be read

- **Deterministic:** the flags, the categories and what was lowered, and the ids, straight from the records.
- **Qualitative:** whether the meant reading, the holder's wording and the absence of over-commitment hold. That is one reviewer's judgement, an AI's.
- **One run is one sample.** A rule followed once may not be followed every time.
