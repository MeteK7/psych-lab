# Content review (Stage 3)

> **Status:** checklist and record, 2026-11-01. Every on-screen text and science explanation is reviewed with this checklist before usability testing, and again whenever its text changes. Implements plan §3.1 (science explanation standard) and the Stage 3 criterion "reviewers find no invalidating content" (plan §9).

## Who reviews
- **At least two reviewers per file:** you, and one other person.
- **Science explanations:** ideally the second reviewer has a psychology or research background.
- **Reviewers note problems;** they don't fix texts directly. Fixes go through the normal change process.
- **Versions:** a text that has already been shown in recorded exercises gets a **new content version** when it changes (e.g. `state-reset.v4.json`); the old file stays unchanged (plan §6.1). Experiment content in use during a phase isn't changed at all (protocol §8).

## What the automated checks already cover
`check.ps1` runs these on every change, so reviewers don't need to:
- banned on-screen words: "study", "phase", "session", internal exercise names
- no mention of how the experiment's outcome is recorded
- no claim words such as "proven", "it works" or "will help" in science explanations
- each science finding cites only checked sources (full text or summary), with wording to match: "found" only for full text
- the "hasn't been tested itself" statement in every explanation
- explanation length
- every page and exercise step free of serious accessibility problems (axe)

## Checklist

### A. Every on-screen text
1. **Plain language:** short sentences, everyday words, understandable at about age 12. Technical terms are explained the first time.
2. **Instructions** say what to do and when, and nothing important relies on sight alone. For example, "the ring changes colour" is also described in words, and the keyboard instructions are present.
3. **No implied promises:** nothing suggests an exercise is proven or will help, even without the banned words. Watch for phrases like "this will…", "you'll feel…" or "gets rid of…".
4. **Safety:** the picture step keeps its line, "an everyday situation, never a painful personal memory". Stopping is always offered, and nothing pressures the person to continue.
5. **Consistency:** exercise names and method names match everywhere: cards, start pages, explanations, records.
6. **Experiment fairness:** the two phase-1 intros stay parallel and claim-free (protocol §3), and no exercise text mentions the outcome or the study log.

### B. Science explanations (`web/src/content/science/`)
1. **Each finding is accurate against its source.** Open the source, or its notes in `evidence-verification.md`, and check numbers, population ("37 students"), setting ("lab experiment") and direction of the effect.
2. **The method is described as studied,** not as this exercise. Nothing implies a cited study tested our exercise.
3. **"About this exercise"** names how our version differs from the studied form (e.g. "eye movements, not a moving dot").
4. **Limits** state effect size in plain words, how long effects last or that it's unknown, and anything not shown.
5. **Evidence level is labelled correctly:** "Full text checked" only if the full text was read (`evidence-verification.md`).
6. **Sources:** the citation and title match the publication, and the link opens the right paper.
7. **Readable as a whole:** a non-specialist can say in one sentence what the method is and how sure we are about it.

## Files to review

| File | Version | Shown where |
|---|---|---|
| `web/src/content/ratings.v2.json` | 2 | Ratings in every exercise |
| `web/src/content/action-bridge.v2.json` | 2 | Plan your first step; the planning step after the dot exercises |
| `web/src/content/goal-restatement.v2.json` | 2 | Write down your goal |
| `web/src/content/state-reset.v3.json` | 3 | Both dot exercises |
| `web/src/content/state-reset-sound.v1.json` | 1 | Sound version of the dot game (Try it only) |
| `web/src/content/science/action-bridge.v1.json` | 1 | Why this exercise? (Plan your first step) |
| `web/src/content/science/goal-restatement.v1.json` | 1 | Why this exercise? (Write down your goal) |
| `web/src/content/science/state-reset.v1.json` | 1 | Why this exercise? (Picture it, then follow the dot) |
| `web/src/content/science/game-only.v1.json` | 1 | Why this exercise? (Follow the dot, then plan) |
| `web/src/content/science/sources.v1.json` | 1 | Sources in every explanation |
| `web/src/content/mcii.v2.json` | 2 | Your wish, and what's in the way (development only; also see `mcii-design.md` §7) |
| `web/src/content/science/mcii.v1.json` | 1 | Why this exercise? (Your wish, and what's in the way) |
| `web/src/content/science/sources-mcii.v1.json` | 1 | Sources in that explanation |
| `web/src/app/flow/conditions.ts` | — | Card names, descriptions, method names, "What happens" lists |
| `web/src/app/areas.ts` | — | Home and area texts |
| `web/src/app/pages/experiment/experiment-texts.ts` | — | My experiment page |

## Review record
Add one row per reviewer per file. "Result" is **pass** or **changes needed**; list the changes and the new version if one was made.

| Date | Reviewer | File | Version | Result | Notes and changes |
|---|---|---|---|---|---|
| | | | | | |
