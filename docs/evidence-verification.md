# Evidence verification log (Stage 1)

Rank-1 claims from plan §2.3. These block Stage 2.
✔F is recorded only when the full text was read; the sections that were read are listed for each source.

| Claim | Source | Status | Sections read |
|---|---|---|---|
| Implementation intentions improve goal attainment | Gollwitzer & Sheeran (2006), *Adv. Exp. Soc. Psychol.* 38, 69–119. Green open-access PDF (scanned) from KOPS Konstanz | **✔F** (method and overall result) | Pp. 76–77, 82, 86–87, 92: method (sample of studies, meta-analytic strategy), overall effect size. Moderator sections not read |
| Moderators and bias adjustment for implementation intentions | Sheeran, Listrom & Gollwitzer (2025), *Eur. Rev. Soc. Psychol.* 36(1), 162–194 (online 2024). Green open-access author manuscript from KOPS Konstanz | **✔F** | Abstract, method, results (overall effect, publication bias, moderator table), discussion of weak intentions, limitations |
| Working-memory taxation reduces vividness/emotionality of future-oriented images | Engelhard et al. (2011), *J. Anxiety Disord.* 25, 599–603. PDF hosted by ifemdr.fr | **✔F** | Full article: participants, procedure, results, limitations |
| A verbal game can increase intrusions; Tetris reduces them | Holmes, James, Kilford & Deeprose (2010), *PLoS ONE* 5(11): e13706 (open access) | **✔F** (text); tables and figures not visible | Methods and results text for Experiments 1 and 2; discussion and limitations |
| Dual-task meta-analysis (vividness and emotionality) | Houben, Otgaar, Roelofs, Merckelbach & Muris (2020), *J. Exp. Psychopathol.* 11(1), DOI 10.1177/2043808720907744 (licence CC BY-NC 4.0) | **Not accessed**: the publisher returned HTTP 403 to automated access; no repository copy found | Abstract only (✔A) |
| Eye movements reduce vividness and emotionality of flashforwards | Engelhard, van den Hout, Janssen & van der Beek (2010), *Behav. Res. Ther.* 48, 442–447, DOI 10.1016/j.brat.2010.01.003 | **Not accessed**: subscription required; not in PMC or Europe PMC | Abstract only (✔A) |

## Verified findings

### Gollwitzer & Sheeran 2006 (✔F)
- **Scope:** 94 independent tests from 63 reports, searched January 1990 to December 2003.
- **Overall effect:** **d = .65, 95% CI [.60, .70], k = 94, N = 8,461**. Effects were weighted by inverse variance and heterogeneity was tested with Q.
- **Not addressed:** the method section read contains no publication-bias correction.

### Sheeran, Listrom & Gollwitzer 2024/2025 (✔F)
- **Overall effect:** across 642 tests, sample-weighted **d = .36 [.33, .40]**.
- **Publication bias:** judged "substantial" (Egger b = 1.06).
  - Trim-and-fill adjustment: d = .35 [.31, .38].
  - **Robust Bayesian meta-analysis (RoBMA): d = .15 [.08, .22]**. The authors call this "robust" but "small".
- **Moderators** (each d with its 95% CI; k = number of tests):

  | Moderator | Level | d [95% CI] | k |
  |---|---|---|---|
  | Setting | Lab | .49 [.44, .54] | — |
  | | Field | .27 [.23, .31] | — |
  | Delivery mode | Online | .31 [.26, .36] | — |
  | | In-person | .53 [.41, .65] | — |
  | Outcome measure | Self-report | .28 [.24, .33] | — |
  | | Objective | .43 [.38, .48] | — |
  | Control condition | Goal intention | .41 [.34, .47] | 235 |
  | Follow-up | Under 1 week | .48 | — |
  | | 1–4 weeks | .30 | — |
  | | 1–6 months | .19 | — |
  | Motivation | High vs low | .79 [.45, 1.14] | 8 |

- **Weak intentions:** for physical activity, planning helped when intentions were strong (d = .31) and had **no effect when intentions were weak** (d ≈ 0).
- **Authors' limitations:** substantial publication bias, "caution is warranted", and missing demographic data.

### Engelhard et al. 2011 (✔F)
- **Participants:** 37 female students (42 enrolled; 5 excluded) with recurrent intrusive images of feared *future* events.
- **Design:** within-subjects; recall with eye movements vs recall only, in counterbalanced order.
- **Dose:** **8 × 24-second sets with 10-second breaks**, about 3.2 minutes of taxation (about 4.5 minutes including breaks).
- **Vividness:**
  - condition × time interaction F(1,36) = 4.14, p < .05, ηp² = .10
  - post-test vividness lower after eye movements than after recall only: d = .37
  - the pre–post drop within the eye-movement condition alone was not significant (d = .26)
- **Emotionality:** the interaction was a trend only (p = .077).
- **Authors' limitations:**
  - immediate effects only; maintenance unknown
  - one still image per condition, and some participants found it hard to hold
  - female students only

### Holmes et al. 2010 (✔F, text only)
- **Common design:** non-clinical volunteers watched a trauma film, then played one of three conditions for 10 minutes: Tetris, Pub Quiz (verbal), or no task. The outcome was a one-week flashback diary.
- **Experiment 1** (n = 20 per group; game 30 minutes after the film):
  - Tetris had fewer flashbacks than no task (d = .70) and than Pub Quiz (d = 1.21).
  - **Pub Quiz had more flashbacks than no task (d = .62).**
- **Experiment 2** (4-hour delay; 75 or 78 participants, inconsistent in the text):
  - Tetris had fewer flashbacks than no task (d = .62).
  - Pub Quiz vs no task was **not significant**.
- **Recognition memory:** no difference between groups.
- **Authors' limitations:** film analogue rather than real trauma; diary self-report; mechanisms not established.

## Implications for the plan (proposed; plan.md not yet changed, pending your review)
1. **Action Bridge expectations.**
   - The bias-adjusted effect is small (d ≈ .15), and smaller still in field and online settings.
   - A 20–28 day n-of-1 cannot detect an effect of that size. Phase 1 is a feasibility and personal-signal study, as the plan already states; a null result is the expected outcome under the meta-analytic estimate.
   - Effects depend on strong intentions. The n-of-1 should run only during a period when the study goal is genuinely endorsed.
2. **State Reset dose.**
   - The supporting study used about 3.2 minutes of taxation in 24-second sets. The plan's "~10 s hold + ~2 min game" is below that.
   - Proposal: interleaved hold-and-play sets (e.g., 6–8 × 24 s), keeping the total session length comparable in both phase-2 conditions.
   - **Adopted 2026-10-30:** 8 × 24 s sets with 10 s pauses after a 10 s hold (State Reset content v2), used by both phase-2 conditions.
3. **State Reset effect size.** The verified evidence shows only immediate, modest effects on vividness (d ≈ .37 vs recall only) and a trend for emotionality, in 37 students with recurrent intrusive images. The plan's "product hypothesis" label remains correct.
4. **The verbal-game harm claim** should read "in one of two experiments". The specificity warning still stands (task type matters), but the evidence is weaker than plan §2.2 implies.

## Papers to obtain manually
- **Houben et al. (2020)**, DOI 10.1177/2043808720907744. Open licence; open the DOI in your browser and save the PDF.
- **Engelhard et al. (2010)**, DOI 10.1016/j.brat.2010.01.003. Subscription; use a library account or request it from the authors.

Put the files in a local folder outside the repository and tell me where they are; I will read them and update this log.
