# Usability procedure (Stage 4)

> **Status:** draft, 2026-11-01, for your review before any tester session. Implements plan §4.3, §4.4 and §5 (usability criteria) and the privacy rules in §8. Consent form: `consent-usability.md`.

## 1. What this is, and what it is not
- **Is:** 5–8 people, in person, try the four exercises and tell us whether they can understand and use them, and how they feel about them.
- **Is not:** a study of whether the exercises work. No effect is measured or claimed (plan §4.4). Local usability testing is not formal research, but it still uses written consent, voluntary participation, stopping at any time and minimal data (plan §8).

## 2. Before the sessions
1. **Separate database for testers.** Create `app_usability` (`CREATE DATABASE app_usability;`) and run the development app against it for test days only, so tester data never mixes with your own records and can be deleted in one step:
   - In `platform\.env`, set `DATABASE_URL` to `…/app_usability` for test days, then run `uv run alembic upgrade head` in `api`.
   - Switch back to `app_dev` afterwards.
2. **Checks green:** `powershell -File scripts/check.ps1` passes, including the browser tests.
3. **Content review done** for every exercise and explanation (`content-review.md`).
4. **Materials:**
   - two printed copies of the consent form per tester
   - this procedure
   - the question sheet (§5)
   - the code list (§3)
   - headphones for the sound version
5. **Computer:** laptop with mouse and keyboard, sound on, browser at 100% zoom, opened at http://localhost:4310/areas/action-growth.

## 3. Tester codes and order
- **Codes:** each tester gets a random code (e.g. `T7Q`). Names appear only on the signed consent form, kept on paper and separate from the code list.
- **Order:** testers take the four exercises in a rotated order (a balanced Latin square), so each exercise comes first, second, third and fourth equally often:

  | Tester | 1st | 2nd | 3rd | 4th |
  |---|---|---|---|---|
  | 1 and 5 | Plan your first step | Write down your goal | Follow the dot, then plan | Picture it, then follow the dot |
  | 2 and 6 | Write down your goal | Picture it, then follow the dot | Plan your first step | Follow the dot, then plan |
  | 3 and 7 | Picture it, then follow the dot | Follow the dot, then plan | Write down your goal | Plan your first step |
  | 4 and 8 | Follow the dot, then plan | Plan your first step | Picture it, then follow the dot | Write down your goal |

- **Sound version:** offer it to anyone who prefers it, and ask at least one tester to try it for one of the two dot exercises.

## 4. The session (about 60 minutes)
1. **Welcome and consent (5 min).** Explain the purpose in your own words (§1). Go through the consent form; both sign; the tester keeps one copy. Make clear that stopping is always fine and needs no reason.
2. **Goal for the session.** Ask the tester to think of something they'd like to start learning. A **made-up goal is fine and preferred**; nothing personal is needed. For the picture exercise, the picture must be an everyday situation, **never a painful personal memory** (the exercise says so too).
3. **The four exercises (about 30 min), in the tester's order.** For each:
   - The tester opens it with **Try it** from the area page and works through it alone. **Don't help** unless they're stuck for more than about a minute or ask to stop.
   - Note on the sheet: completed unaided (yes / with help / stopped), where they hesitated, what they said.
   - After each exercise, ask the per-exercise questions (§5.2).
   - Offer a short break after the second exercise.
4. **After all four (10 min):** the overall questions (§5.3), including the SUS.
5. **Close (5 min):** thank them; remind them their data is deleted within 30 days and how to withdraw before that. If anything upset them, see §6.

## 5. Questions
### 5.1 Observation, per exercise
- completed unaided / with help / stopped (and at which step)
- moments of hesitation or confusion, in the tester's words where possible
- for the dot or sound game: could they follow the instructions? did the practice round help?

### 5.2 After each exercise
1. "Did anything in this exercise make you feel worse?" (yes / no; if yes, what, in a few words). This is the only question about how they feel, and there are no health questions.
2. "I felt supported by this exercise." (1 = not at all … 5 = very much)
3. **Credibility** (adapted from the credibility/expectancy questionnaire, ◐; 1 = not at all … 9 = very):
   - "How logical does this exercise seem to you?"
   - "How useful do you think it would be for getting started on learning?"
4. **Picture exercise only:** the vividness and unpleasantness ratings are already inside the exercise. Note only whether the tester understood them.

### 5.3 After all four
1. "How likely are you to use one of these exercises again tomorrow?" (1 = not at all … 5 = very likely), and which one.
2. Best moment and worst moment (free text; **deleted after the report**).
3. The System Usability Scale (SUS; Brooke, 1996), the 10 standard statements, each from 1 = strongly disagree to 5 = strongly agree:
   1. I think that I would like to use this system frequently.
   2. I found the system unnecessarily complex.
   3. I thought the system was easy to use.
   4. I think that I would need the support of a technical person to be able to use this system.
   5. I found the various functions in this system were well integrated.
   6. I thought there was too much inconsistency in this system.
   7. I would imagine that most people would learn to use this system very quickly.
   8. I found the system very cumbersome to use.
   9. I felt very confident using the system.
   10. I needed to learn a lot before I could get going with this system.

   **Scoring:** for odd items, score − 1; for even items, 5 − score. Sum the ten, multiply by 2.5, giving 0–100.

## 6. If something goes wrong
- **The tester is upset or distressed:** stop the session, stay with them, and don't continue the exercises. Note it as "made it worse" with "distress needing support". This is a redesign trigger on its own (plan §5).
- **Support:** have the contact details of a local support line ready before each session.
- **The tester wants to stop or withdraw:** stop straight away; no reason needed. If they withdraw, delete their data that day (§7).
- **Technical failure:** note it, restart the exercise once if the tester agrees, otherwise move on.

## 7. Data
- **What is stored:**
  - the app's exercise records in `app_usability`, under no name
  - the question sheets, under the tester's code
  - the signed consent forms, on paper and separate from the code list
- **What is never stored:** names next to answers; health information beyond the "made it worse" answer.
- **Free text** (best/worst moment, notes in the tester's words) is deleted once the report is written.
- **All tester data is deleted within 30 days of the session:** drop `app_usability` (`DROP DATABASE app_usability;`), shred the sheets and the code list. Consent forms are kept only as long as needed to show consent was given, then destroyed.
- **Before any formal research or deployment,** the actual legal requirements must be checked (plan §8).

## 8. Analysis and decision
- **Per criterion (plan §5):**

  | Criterion | Go | Amend | Redesign |
  |---|---|---|---|
  | SUS (mean) | ≥ 68 | 50–67 | < 50 |
  | Intention to use again tomorrow, ≥ 4 out of 5 | ≥ 60% of testers | 40–59% | < 40% |
  | Completed unaided | ≥ 80% of exercise runs | 60–79% | < 60% |
  | "Made it worse" (any exercise) | 0–1 tester | 2 testers | ≥ 3, or any distress needing support |

- **Report also:**
  - credibility per exercise, including whether the two comparison exercises seem as credible as the others
  - how State Reset was tolerated: this is the gate for phase 2 of the experiment (plan §4.2)
  - every point of confusion, with a proposed fix
- **The report makes no claims about effects.**
