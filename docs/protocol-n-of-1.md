# n-of-1 protocol: phases 1 and 2

Version 1.3 (2026-10-31), **approved 2026-10-31**. It supersedes v1.2, approved 2026-10-30. Implements plan §4.2. **Fixed before the first phase-1 day; later changes are recorded in §13 and never applied to days already run.**

## 1. Purpose and questions
- **Phase 1 (plan factor):** does Action Bridge, compared with goal restatement, make it more likely that I start my planned study after the session, and sooner?
- **Phase 2 (core mechanic):** with Action Bridge held constant, does State Reset (holding the image while playing) make starting more likely, and sooner, than the same game without the image?
- **What this can show:** whether the procedure and measurement work in daily life, and a personal signal.
- **What it cannot show:** efficacy for anyone else.
- **Expected result for phase 1:** a small effect (bias-adjusted d ≈ .15, Sheeran et al. 2024 ✔F) that 20–28 days cannot detect reliably. **A null result is the expected outcome.**

## 2. Participant and conditions for running
- One participant: the operator, studying a self-chosen topic (the topic may vary day to day).
- Run phase 1 only during a period when the study goal is genuinely endorsed. Implementation intentions show ≈ 0 effect with weak intentions.

## 3. Materials and records
**All daily records are made in the app.** No files are edited by hand and no commands are run.

| Item | Where |
|---|---|
| The app, **Today** page (start the API and web app as in the runbook) | `http://localhost:4300` |
| Planned days, barriers, reveals, study starts | Database `app_dev`, tables `n1_days`, `n1_reveals`, `n1_study_starts`, written only by the app |
| Sessions (linked to their reveal) | `app_dev`, table `sessions` |
| Schedule (never opened directly) | `analysis/schedules/schedule-phase<N>.csv` (+ `.sha256`, `.meta.json`), read only by the server |
| Study log: readable mirror of each study start | `C:\Projects\new_project\study-log\YYYY-MM-DD.md`, appended to by the server only |

- **Dates are local**, Europe/Istanbul, never UTC, for every n-of-1 date and day boundary.
- Paths are relative to `C:\Projects\new_project\platform` unless absolute.
- **Phase 0 is a test phase** (walkthroughs and checks). Its sessions are development data and are never analysed.

**Day status** (derived by the app; not entered by hand):

| Status | Meaning | Uses a slot |
|---|---|---|
| `session` | a slot was revealed: a session day, analysed as assigned whether the session was completed, aborted, unfinished or never begun | yes |
| `ineligible` | a barrier was reported **before** the planned start | no |
| `eligible_no_session` | **its own outcome category, a feasibility measure.** A planned day that passed without a reveal, including late barriers. A revealed day is never in this category | no |

## 4. Daily procedure (all on the Today page)
1. **Plan tomorrow** (the evening before, or earlier): enter tomorrow's planned start time.
   - Only future days can be planned. A day not planned in advance isn't a study day.
2. **If you can't study** (illness, travel, no time): use **"I can't study today"** with a reason.
   - **Before the planned start**, this makes the day `ineligible`.
   - **After the planned start**, the barrier is recorded but flagged **late**. The page warns before you submit. The day then counts as `eligible_no_session`, not `ineligible`.
   - Not available once today's slot has been revealed.
3. **At the planned start: "Start today's session."**
   - The server checks the schedule hash and reveals the next unused slot.
   - The session opens with that condition **assigned and locked**.
   - One slot per day, and never a slot twice. "Continue today's session" reopens the same slot without revealing a new one.
   - The reveal time relative to the planned start is stored. **More than 15 minutes after the planned start is recorded automatically as a late start** (a deviation).
   - **From the reveal on, the day is a session day** and is analysed as assigned, even if the session is stopped, left unfinished or never begun (§5).
4. **Run the session** (Begin session → complete it). The session is saved with a link to its reveal.
5. **When you begin studying:** the **"I'm starting to study now"** box appears **at the top of Today** once the slot is revealed: after the session, or when it was stopped, left unfinished or never begun. Write one line about what you're starting and submit it.
   - Once the study start is recorded, the session can no longer be begun.
   - The **server's time** is the record of the start.
   - The line is also appended to `study-log\<session date>.md`.
   - A start logged after midnight still belongs to the evening session it follows.
6. **End of day:** add the follow-up in the app (History → Add follow-up).
7. **Rules:**
   - one session per day
   - **records only through the app**: never edit the database, study-log files or schedule files by hand
   - the experiences never mention the study-start box, by design. The Today page is identical in every condition.

## 5. Schedule and allocation
- **Blocked pairs:** each consecutive pair of slots contains both conditions in random order. 28 slots per phase.
- **Generation:** `analysis/make_schedule.py`, with a random 63-bit seed recorded in the `.meta.json`. Each phase is generated **once**, before the phase starts, and its SHA-256 is recorded in §11. The server and the analysis both refuse a schedule whose hash doesn't match.
- **Slot use:** slots are revealed in order by the server, one per session day. Each session is analysed under **the slot of its reveal** (stored link), not by its position in time.
  - **Every revealed slot** is analysed under its **assigned** condition, whether its session was **completed, aborted, unfinished or not begun**. Its completion status is recorded per day.
  - `ineligible` and `eligible_no_session` days reveal and use no slot.

## 6. Outcomes
- **Primary, per session day:** the **server-recorded study start, if it falls within 120 minutes after the session ends.** The window starts:
  - for a completed or aborted session: at its end
  - for an unfinished session (no end time): at its last saved step (server time)
  - for a slot revealed but not begun: at the reveal time

  It is recorded two ways:
  - *started*: yes/no
  - *latency*: minutes, censored at 120
- **Secondary:**
  - completion status per session day: completed, aborted, unfinished or not begun
  - "starting feels unpleasant" (0–10), before and after the session (in the app)
  - end-of-day self-reported minutes, labelled as self-report (overestimates are documented)
  - burden (0–10)
- **Phase 2 only, State Reset days only:** image vividness and emotionality before and after.
- **Feasibility outcomes, per phase:**
  - the count of `eligible_no_session` days, reported alongside the `session` and `ineligible` counts. These days use no slot and are not part of the randomised comparison.
  - the completion status counts by condition (§7), including slots not begun.

## 7. Analysis (prespecified)
- **Tool:** `analysis/n_of_1.py`, run on the phase export (§10). The operator's assistant runs it on request.
- **As randomised (primary):** each session day takes the slot of its reveal. **Every revealed slot** is included, whether its session was completed, aborted, unfinished or not begun. Days are compared by the **assigned** condition, using **complete pairs** only.
- **Completion status** (completed / aborted / unfinished / not begun) is reported per day and **by condition**.
- **Primary test:** a two-sided, within-pair randomisation test of the mean latency difference (condition A − B). The test is exact (all 2^k sign patterns) up to 20 pairs, and Monte Carlo above that.
- **Secondary test:** the same test on the *started* difference. I also plot latency against slot to check for trends and carryover.
- **Timing:** analyse only once ≥ 20 session days exist (target 28). No outcome-based interim analysis; interim looks are for safety and burden only.
- **Sensitivity analyses** (computed automatically, reported next to the primary result and never replacing it):
  - excluding late starts (> 15 min)
  - excluding all flagged days (deviations, §8)
  - completed sessions only (excluding aborted, unfinished and not begun). Excluding incomplete sessions is allowed **only** here, never in the primary analysis.
- **Reporting:** report the estimate and its p-value together, and interpret both against the expectation in §1. Phases are analysed separately and **never compared with each other**.

## 8. Deviations
Flagged automatically where possible; otherwise noted in the follow-up note:
- start more than 15 min after the planned start (automatic)
- barrier reported after the planned start (automatic: counts as `eligible_no_session`)
- *Not a deviation:* an aborted, unfinished or not-begun session. Its completion status is recorded automatically, and the day stays in the primary analysis as assigned (§5, §7). A revealed slot is never `eligible_no_session` and never unused.
- wrong condition delivered (prevented by the locked condition; still checked)
- a forgotten study-start click (counts as a non-start)
- opening the schedule file or otherwise looking ahead
- any hand edit of records
- technical failure

## 9. Stopping and pausing
- **Pause:** for illness, travel, or anything that makes study inappropriate, simply don't plan the day, or report a barrier. No slot is used.
- **Stop the phase** if sessions repeatedly feel distressing, or burden is ≥ 8 on three consecutive session days. Record the reason.
- **Phase 1 may start** as soon as both of these hold:
  - the folder `C:\Projects\new_project\study-log` exists (no git)
  - this protocol version is approved

  It does **not** wait for the rest of Stage 3 (usability documents, Playwright/axe, the non-visual variant). This is a **deliberate deviation** from the plan's roadmap, where Stage 4 followed Stage 3. The phase-1 conditions are already built and checked, and Stage 3 items don't affect them.
- **Phase 2 may start only when all of these hold:**
  - phase 1 has ended, followed by ≥ 2 session-free days
  - usability testing found the 8 × 24 s State Reset tolerable
  - the rank-1 and rank-2 papers are ✔F (plan §2.3)
  - phase 2's schedule has been generated and its hash recorded in §11
  - the server's current phase is set to 2 (`N1_PHASE=2` in `.env`)
- State Reset images are limited to today's study, **never** other memories; stop any time.

## 10. Data and export
- All data stays on this computer, in `app_dev` and `C:\Projects\new_project\study-log`.
- **Export and analysis** are done on request by the operator's assistant. For reference (run from `platform\`):
  ```powershell
  cd api; uv run python -m app.manage export-n1 --phase 1 --out ../data/exports/phase1.json
  ```
  ```powershell
  cd analysis; uv run python n_of_1.py --phase 1 --export ../data/exports/phase1.json --out ../data/exports/phase1-days.csv
  ```
- The export holds no free text: no study-start lines and no barrier reasons.

## 11. Schedule record
| Phase | Generated (UTC) | SHA-256 of `schedule-phase<N>.csv` |
|---|---|---|
| 1 | 2026-10-30T10:32:14Z | `5c22d984525f0dc334c7221c562367b4c28a9a86097e9faab43a7b739b66c84e` |
| 2 | not yet generated (see §9) | — |

## 12. Limitations
- **A recorded study start proves starting, not study quality or duration.**
- For an unfinished session, the last saved step only approximates when the session was left. For a slot not begun, the window runs from the reveal, so its latency includes no session time.
- **A forgotten study-start click counts as a non-start.** The box is shown at the top of Today after each session to reduce this, but the outcome depends on remembering to use it.
- **The study-start box is in the same app as the sessions.** It is identical in every condition, but returning to Today after a session may act as a reminder to start, for both conditions alike.
- The study start is self-reported in the sense that I choose when to click. The server records only the time of the click, not whether study actually began.
- Unblinded: the session shows its condition, so expectancy effects can't be excluded. In phase 2, I also know whether I held the image.
- n = 1, so results don't generalise. Possible carryover between days, time trends and practice effects; the slot plot checks for these.
- 20–28 days cannot detect small effects. A null result doesn't mean "no effect".
- Observation itself may change behaviour.

## 13. Changes to this protocol
| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-30 | Initial version. Approved in substance |
| — | 2026-10-30 | **Schedule timing note:** the phase-1 schedule (§11) was generated before protocol approval. It is kept, because no allocation-relevant change was made and its contents have not been viewed. Regenerate only if a later change affects the slot count or allocation, and **never after phase-1 day 1** |
| 1.1 | 2026-10-30 | Slots are revealed only through `analysis/next_slot.py` (hash check, next slot only, reveal log, no repeat reveals, one per day); the analysis maps days to slots through the reveal log. `eligible_no_session` added as its own day status and feasibility outcome (uses no slot; count reported per phase). Phase 1 may start once the study log exists and this version is approved, without waiting for the rest of Stage 3 (deliberate deviation, §9). Phase 2 prerequisites are unchanged. No change to slot count or allocation. **Approved 2026-10-30** |
| 1.2 | 2026-10-30 | **Folder layout:** the project root is `C:\Projects\new_project`; the platform moved to `platform\`, and the study log is the plain folder `C:\Projects\new_project\study-log` (no git). **Outcome:** the creation time of that day's note, within 120 min after session end; the commit source and the save-vs-commit sensitivity analysis are removed. **New rule and limitation:** notes are created only with `Add-Content` and only appended to (never edited, renamed, deleted or recreated). Note status per day is reported. The phase-1 schedule was not regenerated; its SHA-256 still matches §11. No change to slot count or allocation. **Approved 2026-10-30** |
| 1.3 | 2026-10-31 | **All daily records move into the app** (Today page): planning, barriers, the slot reveal and the study start. No hand-edited CSVs, no `next_slot.py`, no `Add-Content`. **Outcome:** the server-recorded study start, within 120 min after session end; the study-log note is a server-written mirror. **Local time** (Europe/Istanbul) for all dates; a start after midnight belongs to the evening session. **Late start** (> 15 min after the planned start) recorded automatically. **Barrier** counts as `ineligible` only before the planned start; later it is flagged late and counts as `eligible_no_session`. Condition locked to the reveal. **Phase 0** test phase. New limitations: forgotten click = non-start; the box sits in the same app. **Completion status** (amended before approval): every session begun after a reveal is analysed as assigned, whether completed, aborted or unfinished; an unfinished session is timed from its last saved step; completion status is reported per day and by condition; excluding incomplete sessions is a sensitivity analysis only. This resolves the conflict between §5 and §8 in the first v1.3 draft. **As-assigned from the reveal** (final amendment before approval): every revealed slot is analysed as assigned, including one never begun (completion status "not begun", window from the reveal time); a revealed day is never `eligible_no_session`. The phase-1 schedule was not regenerated; its SHA-256 still matches §11. No change to slot count or allocation. **Approved 2026-10-31** |
