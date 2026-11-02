# Cognitive shifts: review and release plan

> **Status:** approved 2026-11-02, with three changes: the walkthrough and the consolidation may happen remotely (§4), and the safety veto (§5). Covers the two release gates in `cognitive-shifts-design.md` §9: the **content review** and the **full-text check**. It ends with the steps that release the exercises once both pass.
> - Until then, the three exercises stay in the development build only.
> - The production API refuses them.

## 1. What has to be true before release
| Gate | Passes when | Who |
|---|---|---|
| **Content review** | Every card, scenario and fixed text meets the decision rule (§5) after at most two rounds | 3 reviewers; you lead |
| **Full texts** | Every source cited on screen is read in full (✔F) and logged in `evidence-verification.md`; each population line is confirmed or corrected; any finding the full text doesn't support is rewritten or removed | Me (open access); you obtain the rest |
| **Checks** | `check.ps1` green after any text changes, golden tests unchanged | Me |

The two gates can run at the same time. Neither depends on the other, except that a finding rewritten after the full-text check goes back to one reviewer for a plain-language read (§4, step 6).

## 2. Reviewers
- **Three reviewers, plus you as session lead.** You wrote and approved the texts, so you **lead and decide** but don't count as one of the three. That keeps the review independent of authorship.
- **At least one with psychology or counselling training.** Their safety concerns carry a veto (§5). The other two are ordinary adults who'd plausibly use the platform. Ideally they differ in age, background and first language, because the CS3 scenarios rely on everyday social meaning.
- **Not eligible:** anyone who has seen drafts of these texts.
- **Each reviewer gets a code** (R1–R3). Names stay with you only.

## 3. Materials
1. **The review form,** `cognitive-shifts-review-form.md`, one copy per reviewer, printed or as a document they can type into.
2. **The briefing,** §8 of this document, printed.
3. **The exercises in context.** Each reviewer goes through all three exercises once in the development app (http://localhost:4310/areas/cognitive-shifts) before rating. Cards read differently on screen than in a list.
   - **In person** at your computer, or **by screen-share video call** with you operating the app: the reviewer says what to choose and what to type, and you enter it.
   - Use **made-up situations**.
   - Anything typed isn't saved; the walkthrough only adds practice records to `app_dev`, with no text.
4. **The results spreadsheet,** `cognitive-shifts-review-results.xlsx` (§6), for collecting the ratings.

## 4. Procedure
| Step | What happens | Time |
|---|---|---|
| 1. Briefing | You go through §8 with each reviewer, alone or together | 10 min |
| 2. Walkthrough | Each reviewer completes CS1, CS2 and CS3 once in the app, with a made-up situation, in person or by screen-share video call (§3). You note any confusion they voice, but don't explain the texts | 15 min |
| 3. Independent rating | Each reviewer fills in the form **alone**, without discussing it with the others | 45 min |
| 4. Collect | You enter every rating into the results spreadsheet (§6). It flags the items that need consolidation | 30 min |
| 5. Consolidation | **Only the items that failed or were flagged** (§5). For each one, the outcome is keep, rewrite or drop. Either way below | 30–45 min, or about a week by message |
| 6. Round 2 | Rewritten items, and any science finding changed by the full-text check, go back on a short form to the three reviewers, rated the same way. An item that fails twice is **dropped** | 15 min each |
| 7. Record | Results go into `content-review.md` (review record) and a short summary in the plan change log | — |

**Consolidation (step 5) can happen in either of two ways:**
- **By video call** (or in person): all three reviewers and you go through the flagged items together and agree each outcome, with any new wording.
- **By message:**
  1. You send each reviewer the flagged items, each with the concerns raised (by reviewer code) and your proposed decision: keep, rewrite (with the proposed wording) or drop.
  2. Each reviewer replies to every item with **agree**, **disagree** (with a reason) or **rewrite** (with their wording).
  3. A proposed decision stands when at least two of the three agree, subject to the safety veto (§5).
  4. Where the replies conflict, or two rewrites differ, you settle the item by proposing one wording to all three. Rewritten items then go to round 2 in either case.
  5. A reviewer who hasn't replied after a week gets one reminder. No reply is never counted as agreement.

**Timeline:** about two weeks:
- week 1: steps 1–4
- week 2: steps 5–7, with the full-text reading alongside

## 5. Decision rules (from the review form)
- **Item rule:** an item stays if its **mean plausibility is ≥ 4 of 5** and **no reviewer's invalidation concern is unresolved** after consolidation. "Resolved" means at least two of the three agreed the concern doesn't apply, or the item was rewritten and passed round 2.
- **Safety veto:** an invalidation or safety concern raised by the **psychology-trained reviewer** is resolved only if:
  - the item is **rewritten and re-rated in round 2**, or
  - the item is **dropped**.

  It's never resolved by discussion or by majority alone, including when the other two reviewers agree it doesn't apply. If more than one reviewer has that training, the veto applies to each.
- **Scenario rule (CS3):** a scenario stays only if **at least two of three** reviewers rate its six readings as balanced. Otherwise its readings are rebalanced and go to round 2.
- **Overall questions** (form part E):
  - Any "this pushes towards a positive reading" or "this suggests blame" answer is discussed in the meeting, even if every item passed.
  - If two or more reviewers raise the same overall concern, it's treated as a failed item.
- **Minimum content after the review:**
  - CS1 needs at least 3 first-reading cards and 3 cards per lens.
  - CS2 needs at least 3 first-explanation cards and 6 cause cards.
  - CS3 needs at least 4 scenarios.
  - Falling below these means redesigning that exercise, not releasing it thinner.

## 6. Results spreadsheet
`cognitive-shifts-review-results.xlsx` has one row per item on the review form, in the same order and with the same wording.
- **What you enter:** each reviewer's plausibility rating and concern, the round-2 ratings, and the final decision.
- **What it works out:** the mean, whether the item passes the rating rule, and whether the safety veto applies.
- **A second sheet** collects the CS3 balance answers and checks the two-of-three rule.
- **A third sheet** holds the overall answers (form part E).
- **Reviewer details:** reviewer codes and training go on the first sheet; names never go in the file.
- **Keeping it:** keep the filled-in copy with the paper forms, outside the repository. The outcome goes into `content-review.md`.

## 7. After both gates pass: release steps
These are the only changes needed. I'd do them as one release on `test`, then you merge to `main`.
1. **Apply the review's changes to the content:**
   - Rewritten or dropped texts get **new content versions** (e.g. `cs-other-readings.v2.json`), because practice runs of v1 exist in `app_dev`. The v1 files stay unchanged.
   - Science texts upgraded after the full-text check say "found" where the full text supports it.
2. **Open the gates:**
   - `areas.ts`: Cognitive shifts `status: 'available'`.
   - `registry.ts`: the three exercises `release: 'released'`.
   - `api/app/schemas.py`: empty `DEVELOPMENT_ONLY_EXERCISES`.
3. **Run the checks:** `check.ps1` green, golden tests unchanged.
4. **Record it:** plan change log with the review outcome, reviewer count and training (no names), the ✔F list, and the release date. The product model marks Cognitive shifts as released in Try it.
5. **Not part of this release:** the "safe without supervision" flag for booths (product model M1) is set separately. CS3's interpersonal scenarios may need extra thought there.

## 8. Reviewer briefing (to print)

> **Thank you for reviewing.** These are three short exercises on a website that helps people look at everyday situations in more than one way. They aren't therapy, and they're only for everyday situations such as learning, work or friends.
>
> **What we need from you:**
> - Does each option sound like something an ordinary person could realistically think, or that could realistically be true?
> - Could any option feel dismissive, blaming, falsely cheerful or preachy to someone reading it about their own situation?
>
> **How:**
> 1. First, try each exercise once using a made-up situation, either at my computer or on a video call where I share my screen and enter what you tell me. Nothing typed is saved.
> 2. Then fill in the form on your own. Rate every line from 1 (not plausible) to 5 (very plausible), and tick "invalidating" if it could feel that way, with a few words on why.
> 3. Rewrites are welcome but optional.
>
> **Please don't:** discuss your ratings with the other reviewers before handing in the form, or use real painful experiences in the walkthrough.
>
> **Afterwards:** I go through only the lines that got low ratings or concerns, either in a short video call or by sending you a list with proposed decisions, to which you reply agree, disagree or with a rewrite. Your form is identified by a code, not your name. It's kept only until the results are recorded, then destroyed.

## 9. Decisions (2026-11-02)
1. **Reviewers:** three people besides you; you lead and don't rate.
2. **Results:** as a spreadsheet (§6).
3. **Full texts:**
   - **I read the openly available ones:** Wang 2021, Cristea 2015, and the author manuscripts I can find (Troy 2013, Kross 2014, Bruehlman-Senecal & Ayduk 2015, Brunwasser 2009, Eyal 2018).
   - **You obtain the library-only ones:** Webb 2012, Hallion & Ruscio 2011, Lazowski & Hulleman 2016.
   - Any of the "author manuscript" ones I can't find goes on your list.
4. **Remote options:** the walkthrough by screen-share video call, and the consolidation by message or video call (§3–4).
5. **Safety veto** for the psychology-trained reviewer (§5).
