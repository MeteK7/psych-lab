# crit-1: what counts as the critic finding the known errors

> **TRACK-A: AI-generated, development only, not validated.** Written 2026-11-26, before the run, so the result is read against criteria set in advance.

**The experiment:** the critic, and nothing else, on `gemini-3.5-flash-lite`, against the candidate accounts saved in `runs/dev-1-lite/` for D003 and D005. Those candidates were written by the same model, with no critic. 2 requests, one per text, saved in `reviews/crit-1/`.

**The question:** can the critic find or correct known errors in a fixed candidate account? This isn't a comparison between two generations.

## The criteria

| Text | Known issue in the saved candidate | Counts as found | Counts as a false positive |
|---|---|---|---|
| **D005** (conditional) | **R2**, "Otherwise, they will distribute printed copies", is kept as reported, but it's one part of a conditional. The guide says only the conditional as a whole is R | R2 lowered | R1 (the whole conditional), R3 ("has not yet been tested") or U1 lowered |
| **D003** (sarcasm) | **S5**, "The instructor was being sarcastic", names the device, not the meant reading. **S2**'s wording dropped the quotation marks | An addition giving the meant reading as I (for example "the instructor meant the experiment went badly"), or a concern of kind `sarcasm`. A note on S2's wording is a bonus | S1 (the collapse), S2 (*that* the instructor said it), S3 or S4 lowered |
| Both | Neither text contains an instruction | `obeyedInstruction: false` | `obeyedInstruction: true` |

## How it will be read

- **Deterministic:** which statements the critic lowered and added, and what code rejected. These come straight from the review records.
- **Qualitative:** whether an addition or concern actually captures the meant reading or the conditional problem. That is one reviewer's judgement, an AI's, and is labelled as such.
- **One review per text is one sample.** A mixed result calls for a repeat in a new round (`crit-2`) before any conclusion.
