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

## Cognitive shifts (docs/cognitive-shifts-design.md): sources
The PubMed record (citation and abstract) of each was checked on 2026-11-02 (✔A). Each must be read in full (✔F) before the exercise that cites it is released, or its line is removed (design §9). Full-text reading started 2026-11-02 (review plan §9): open copies only, read on screen, no files kept in the project.

| Source | PMID | Used in | Status | Full text |
|---|---|---|---|---|
| Webb, Miles & Sheeran 2012, *Psychol Bull* 138(4):775–808 | 22582737 | CS1 | ✔A | **To obtain (you):** library |
| Troy, Shallcross & Mauss 2013, *Psychol Sci* 24(12):2505–14 | 24145331 | CS1 | ✔A | **To obtain (you):** no open copy found (no PMC copy, no author copy). A corrigendum exists on the journal site and should be read with it |
| Kross et al. 2014, *JPSP* 106(2):304–24 | 24467424 | CS1 | **✔F** | Published version, hosted by the Ayduk lab (UC Berkeley). Read: abstract, participants and procedure of every study, results on distress |
| Bruehlman-Senecal & Ayduk 2015, *JPSP* 108(2):356–375 | 25603380 | CS1 (lens 3) | **✔F** | Published version, hosted by the Ayduk lab. Read: abstract, participants of every study, Studies 1a–1b method and mediation results, design of Studies 2–6 |
| Brunwasser, Gillham & Kim 2009, *J Consult Clin Psychol* 77(6):1042–54 | 19968381 | CS2 | **✔F** | PMC author manuscript (PMC4667774). Read: abstract, introduction, method, all results, sensitivity analyses |
| Eyal, Steffel & Epley 2018, *JPSP* 114(4):547–571 | 29620401 | CS3 | **✔F** | Published version, hosted on an author site. Read: abstract, samples for Experiments 1–24, confidence measures, Experiment 25 (method and accuracy results) |
| Gillham et al. 2007, *J Consult Clin Psychol* 75(1):9–19 | 17295559 | CS2 (programme content, with Brunwasser) | **✔F** | PMC author manuscript (PMC4469032), added 2026-11-03. Read: abstract, participants, intervention description |
| Hallion & Ruscio 2011, *Psychol Bull* 137(6):940–58 | 21728399 | CS3 | ✔A | **To obtain (you):** library |
| Cristea, Kok & Cuijpers 2015, *Br J Psychiatry* 206(1):7–16 | 25561486 | CS3 | **✔F** | Free from the publisher (Cambridge). Read: abstract, introduction, method, all main and clinical-sample results, publication bias, discussion |
| Wang et al. 2021, *Nat Hum Behav* 5(8):1089–1110 | 34341554 | CS1 (pending; not shown) | **✔F** | PMC (PMC8742248). Read: abstract, introduction, main and exploratory results, limitations, method summary |
| Lazowski & Hulleman 2016, *Rev Educ Res* | — | CS2 (pending; not shown) | ◐ | **To obtain (you):** library |

### Full-text findings (2026-11-02)
Each entry compares the full text with what the exercise's explanation said before this check.
- **Applied 2026-11-03, before the content review,** so reviewers see the corrected texts in the walkthrough.
- **Edited in place in the v1 files** (`web/src/content/science/cs-*.v1.json`, `sources-cs.v1.json`): science texts aren't recorded with practice runs, and these were never released. The five sources read in full are marked `full_text`, and Wang 2021 is added.
- **Final wording** is the proposed wording below, shortened in CS1 to stay within the 280-word limit. Where a proposal used "studies" or "sessions" (not used on screen), it was reworded.

**Brunwasser et al. 2009 (CS2): supported, two precisions.**
- **Confirmed:**
  - 17 controlled evaluations, 2,498 young people aged 8–18.
  - Compared with no intervention, there were fewer depressive symptoms, with small effects: d ≈ 0.11 straight after, ≈ 0.2 at 6–12 months.
  - There was no advantage over active control programmes, in the 4 studies that had one.
- **Precision 1:** the programme is a cognitive-behavioural group programme, "typically" in schools but also run in primary care and juvenile detention. "School groups" should be "mostly school groups".
- **Precision 2:** the paper doesn't describe the programme's content (it refers elsewhere). "Teaches young people to examine their explanations for setbacks" therefore needs a source that describes it, or a more general wording.
  - **Resolved 2026-11-03 with Gillham et al. 2007** (one of the 17 trials, cited by Brunwasser). Its description of the programme covers how beliefs, feelings and behaviour link; cognitive styles, including pessimistic explanatory style; and challenging negative thinking by checking whether beliefs are accurate and generating alternative interpretations. Other skills include assertiveness, negotiation, decision making, relaxation and problem solving.
  - **That trial:** 697 children in grades 6–8 at three US suburban middle schools; twelve weekly 90-minute groups after school.
  - **Applied:** the finding now says the programme "teaches them to check pessimistic explanations for things that go wrong and consider other ones", citing both sources. The who line adds "in one trial, 12 weekly meetings of 90 minutes".
- **Also worth knowing:** the effect straight after the programme lost significance after a publication-bias adjustment. The 6- and 12-month effects held up.
- **Proposed:** "A review of 17 evaluations of a cognitive-behavioural group programme for young people, mostly run in schools over several sessions, found slightly fewer low-mood symptoms than with no programme, up to a year later, but not fewer than with other active programmes." Who: "2,498 young people aged 8–18 · mostly school groups".

**Kross et al. 2014 (CS1): supported, two corrections.**
- **Confirmed:**
  - 585 people.
  - Non-first-person self-talk made people more self-distanced. In the first-impressions and public-speaking studies (Studies 2–3), those using it showed less distress and performed better, according to raters.
  - Trait social anxiety didn't change the results.
- **Correction 1, the manipulation:** it was non-first-person pronouns ("you", "he/she") **and** one's own name, not only the name. Proposed: "using your own name or 'you' instead of 'I'".
- **Correction 2, who took part:** "7 lab experiments" is wrong.
  - There were 6 studies plus a meta-analysis across them (Study 6).
  - Two studies (1b, 5) were online, with Mechanical Turk workers.
  - Distress was measured in two lab experiments with US undergraduates.
  - Proposed who: "585 people in 7 studies, mostly US students · distress measured in 2 lab experiments".

**Bruehlman-Senecal & Ayduk 2015 (CS1): supported, "who" corrected.**
- **Confirmed:**
  - Picturing a recent personal stressor from a distant-future perspective (e.g. 10 years) lowered distress, compared with a near-future (1 week) or unspecified-future perspective.
  - Focus on the stressor's impermanence mediated this. So did focus on an idealised future, and in one model avoidance. So "partly because" is right.
- **Correction:** the "who" line says "7 experiments". There were 7 studies, but Studies 4 and 5 were correlational; 5 manipulated something.
- **Who took part:** university students (mean age about 20), each reflecting on their own recent stressor. In Study 3 the stressor was a midterm exam.
- **Proposed who:** "7 studies, 5 of them experiments · university students reflecting on their own recent stressors".

**Eyal et al. 2018 (CS3): supported, one precision.**
- **Confirmed:**
  - There were 25 experiments, with tasks such as reading emotions from faces, spotting lies and predicting a partner's preferences. Perspective taking didn't increase accuracy; if anything it lowered it overall. It occasionally increased confidence.
  - A final experiment (Experiment 25) found that getting the other person's perspective directly, through conversation, increased accuracy. Perspective taking again didn't.
- **Precision:** "Asking them helped" rests on that one experiment, with romantic couples (aged 19–72) predicting their partner's opinions.
  - Proposed: "In a final experiment with couples, asking the other person directly helped."
  - The current "can make them more confident without being more accurate" matches "occasionally increased confidence", so it stays.
- **Who took part:**
  - students at a US and a non-US university
  - online workers (Mechanical Turk)
  - community volunteers
  - romantic couples, and strangers after a short conversation
- **Proposed who:** "25 experiments · students, online and community volunteers, including couples and strangers".

**Cristea et al. 2015 (CS3): the current line overstates it; rewrite needed.**
- **Scope:** 49 RCTs (52 comparisons) in adults: 15 unselected samples, 16 high-symptom, 16 diagnosed, 2 with pain. 24 trials used students, and 21 trials had only one session.
- **All samples:**
  - Effects were small to moderate (g ≈ 0.4) and mostly **stayed significant** after outliers were removed (anxiety 0.23, depression 0.33). Only social anxiety lost significance.
  - After the publication-bias adjustment (trim and fill), the social anxiety and depression effects were **no longer significant**.
- **Diagnosed samples only:** the anxiety effect lost significance once one extreme outlier was removed. The depression effect lost significance after the publication-bias adjustment.
- **Mismatch:** the current text says effects "disappear when unpublished results and extreme outliers are taken into account", which doesn't hold for all samples. "Unpublished results" also isn't what was done: trim and fill *estimates* missing studies.
- **Scope note:** the review covers all bias-modification training (attention and interpretation), not only interpretation training.
- **Proposed:** "A later review of 49 trials of this kind of training in adults suggests the effects are smaller than they first looked: in people diagnosed with anxiety or depression they were mostly not reliable, and after allowing for studies that likely went unpublished, several shrank to near zero."
- **Proposed who:** "49 randomised trials in adults · students, volunteers, and 16 trials with people diagnosed with anxiety or depression".
- **Wording:** "found" is now allowed, but "suggests" fits a contested result better.

**Wang et al. 2021 (CS1 candidate, not shown): could fill the "similar exercises" layer.**
- **Design:** 21,644 adults in 87 countries, online, randomly assigned to brief written reappraisal instructions with examples, or to one of two control conditions. They then looked at news photos about COVID-19.
- **Results:** compared with control, reappraisal reduced negative feelings and increased positive ones straight afterwards, across the outcome measures (e.g. overall change d ≈ 0.4).
- **Limits (the authors'):**
  - a convenience sample
  - possible demand effects
  - only immediate effects measured
  - self-report only
- **Proposed new "Research on similar exercises" finding for CS1:** "A study with 21,644 adults in 87 countries found that short written instructions in reappraisal, used online once, reduced negative feelings straight afterwards, compared with control instructions."
- **Proposed who:** "21,644 adults, 87 countries · one online session, measured straight afterwards".
- **Knock-on change:** CS1's `similar_note` ("No research has tested a short, self-guided exercise like this one…") would then become "…with three lenses and a fit board".

**Note for Hallion & Ruscio 2011 (to read when you have it):** CS3's line describes it as practice at "reading ambiguous situations less negatively". If the review pools attention and interpretation training, as Cristea's does, the line must say so, or use the interpretation-training subgroup.

Also checked for the proposal (not cited on screen): Menne-Lothmann 2014 (PMID 24968234), Sisk 2018 (29505339), Macnamara & Burgoyne 2023 (36326645), Burnette 2023 (36227318), Schleider & Weisz 2017 (28117056), Powers & LaBar 2019 (30502352), Fodor 2020 (32445689).

## MCII (`mcii-design.md`): source verification, 2026-11-06
**Status marks below describe what was actually read.** Anything marked ◐ or "not accessed" can't appear on screen (plan §3.1). The three evidence tracks are kept apart on purpose: mental contrasting alone (MC), implementation intentions alone (II), and the combination (MCII).

| Source | Track | Status | What was read |
|---|---|---|---|
| Sheeran, Listrom & Gollwitzer 2024/2025 | II | **✔F** | Already logged above |
| Wang, Wang & Gai 2021, *Front. Psychol.* 12:565202 (open access) | MCII | **✔F** | Whole article, including Tables 1–2. Not the raw data |
| Voigt, Mutter & Oettingen 2022, *Front. Psychol.* 13:801028 (open access) | MCII | **✔F** | Whole article. Not the supplementary appendix or the exact instructions |
| Adriaanse et al. 2010, *Eur. J. Soc. Psychol.* 40, 1277–1293 (Konstanz copy) | MCII vs parts | **✔F (Study 2)** | Study 2 method, results, discussion, limitation. Study 1 only from the abstract and summary lines |
| Kirk, Oettingen & Gollwitzer 2013, *Int. J. Confl. Manag.* 24(2), 148–165 (Konstanz copy) | MCII vs parts | **✔F** | Hypotheses, method, results, discussion, caveats |
| Kizilcec & Cohen 2017, *PNAS* 114(17), 4348–4353, PMC5410783 | MCII | **✔A** | Abstract from Europe PMC. Effect sizes as listed in Wang 2021 Table 1. Full text refused (HTTP 403 and 500) |
| Cross & Sheffield 2019, *Health Psychol. Rev.* 13(2), DOI 10.1080/17437199.2019.1594332 | MC, MCII | **✔A** | Abstract only; subscription. Moderator and publication-bias sections unread |
| Abdulla & Woods 2021, *Sch. Psychol. Int.* 42(4), 398–421 | MCII | **✔A** | Abstract only. Repository copy refused (HTTP 403) |
| Wang & Gai 2016, *Soc. Behav. Pers.* 44(5), 767–784 | MCII | **✔A** | The journal's article page, through a summarising tool. PDF not read |
| Fritzsche et al. 2016, *Cogn. Ther. Res.* 40(4), 557–564 | MCII | **✔A** | Abstract only. Three copies failed to load |
| Keeler, Nydegger & Crano 2023, *Front. Psychol.* 14:1145969 | MCII | **✔A** (not cited on screen) | Most of the text through a summarising tool, which is not the same as reading it |
| Sheeran, Webb & Gollwitzer 2005, *PSPB* | II | **✔A** | Abstract |
| Kappes, Singmann & Oettingen 2012; Kappes & Oettingen 2011, 2014; Wittleder et al. 2020; Oettingen, Mayer & Portnow 2016 | MC | **◐** | Search snippets of abstracts only. Hamburg copies returned HTTP 500 |
| SCORE replication of Kappes 2012 (Milyavskaya et al. 2026) | MC | **Not accessed** | Only the FORRT atlas summary. No OSF address could be found |
| Kizilcec et al. 2020, *PNAS* | II | **◐** | A university press summary. Whether it tested MC or MCII is unconfirmed |

### Findings that change what the plan said
1. **The largest online MCII trials found very small effects.** Wang's Table 1 lists Kizilcec & Cohen at **g = 0.09 (N = 9,619) and g = 0.06 (N = 4,290)**.
   - Wang's "document" figure (g = 0.277) **excludes these two studies**, along with all other moderator analyses. It doesn't describe large-scale online delivery.
   - Random-effects pooling gives small trials a lot of weight, which is how a sample dominated by g ≈ 0.07 still yields g = 0.34.
   - So for an app, g ≈ 0.07 is at least as relevant as 0.24 or 0.28. These were course-completion outcomes, so they don't transfer directly either.
2. **WOOP is MCII, confirmed by a paper Oettingen co-authored:** Voigt et al. 2022 calls WOOP the colloquial name of MCII. Oettingen's 2015 article, the woopmylife.org science page and the TK page don't use the abbreviation.
3. **Expectancy moderation looks weaker than the theory suggests.**
   - Wang 2021: high g = 0.297 (k = 5), low g = 0.481 (k = 4), not significant. The authors blame a ceiling effect, since all reported means were above 4 of 7 and only 9 studies reported expectations.
   - Adriaanse 2010: no moderation, again with mostly high scores.
   - Abdulla & Woods 2021: no moderation.
   - None of this shows moderation is false. Field trials asked people to choose feasible goals, so they tested it poorly.
4. **Direct comparisons with the parts** (as the plan already said):
   - Adriaanse Study 2 (59 female students): MCII 5.37, MC 4.47, II 4.08 on a self-rated success index, 1 week. No control arm; the authors say additive or interactive effects can't be concluded. Participants were also told to repeat the exercise every morning.
   - Kirk 2013 (66 dyads): MCII 24,845; MC 24,114; II 23,400 joint points. MCII vs II p = .02; **MCII vs MC p = .24**; MC vs II p = .24. No control arm.
5. **A search for a crossed MC × II trial found none** (two further searches). Wang & Gai 2016 looked likely but is MCII vs control. It found no difference in reading time, and the control group read about more paintings. Wang lists it at g = -0.11.
6. **Delivery detail worth copying or noting:**
   - Adriaanse Study 2 used one best aspect and one obstacle, and is precedent for a single round. Kirk used two of each, alternating, starting with the future. Voigt used two rounds, plus a reminder 3 days later.
   - Several tested versions had repetition or reminders, unlike ours.
   - In Voigt, **fewer MCII participants completed the first survey than controls (90% vs 98%, p = .001)**. It is more effort, so drop-off should be watched.
7. **Which obstacles it worked for:** Kizilcec & Cohen's language analysis suggests MCII worked best for predictable, surmountable obstacles (work or family duties), and not for practical constraints or simply lacking time. In Wang & Gai 2016, more internal obstacles went with *less* reading time within the MCII group (r = -.40), a small within-group correlation. So the literature doesn't settle how internal an obstacle should be.
8. **Depression:** Keeler et al. 2023 used online MCII with a help-seeking goal, in US online workers with raised BDI-II scores. Study 1 found no effect on help-seeking; Study 2 found more self-reported success than a control (p = .013). High attrition, unequal groups, self-report. No harms were reported in what I read, but harms don't appear to have been a measured outcome, so this isn't evidence of safety.

### Still open
- **SCORE report:** please check the OSF project if you can find it. If it shows mental contrasting behaving as predicted at high expectations, the "mixed results" wording stays accurate. If it failed outright, the limits line should be stronger.
- **WOOP trademark:** no statement found. The site's notice page didn't load, and registers weren't searched. A question for a qualified adviser before using the name beyond attribution.
- **To upgrade to ✔F if you can get the PDFs:** Kizilcec & Cohen 2017, Cross & Sheffield 2019, Abdulla & Woods 2021, Fritzsche 2016.

## Change the camera angle (`camera-angle-design.md`): source verification, 2026-11-16

Levels, kept apart: **✔F** the full article was read, and the sections read are listed. **✔A** only the abstract was read; the text may say "suggests", never "found". **◐** not checked; not cited anywhere on screen. The release gate is unchanged: every source cited in the science text is ✔F before release, or its line is dropped.

| Source | Status | What was read |
|---|---|---|
| Kross, Ayduk & Mischel (2005), "When asking 'why' does not hurt", *Psychol. Sci.* 16(9), 709–715. PDF on the second author's lab site (rascl.studentorg.berkeley.edu) | **✔F** | The whole article: introduction, both studies' method and results, Figure 1, Table 1, discussion |
| Kross & Ayduk (2008), "Facilitating adaptive emotional analysis", *Pers. Soc. Psychol. Bull.* 34(7), 924–938, DOI 10.1177/0146167208315938. PDF on the same site | **✔F** | The whole article: both studies' method and results, Tables 1–2, Figures 1–3, discussion, caveats, notes |
| Ayduk & Kross (2010), "From a distance", *J. Pers. Soc. Psychol.* 98(5), 809–829, DOI 10.1037/a0019205. Author manuscript in PubMed Central (PMC2881638) | **✔A** | The abstract and the samples of Studies 1–3, through an automatic summary of the first half of the manuscript, not read directly. The full text is open and still to be read |
| Kross & Ayduk (2017), "Self-distancing: theory, research, and current directions", in Olson & Zanna (Eds.), *Adv. Exp. Soc. Psychol.* 55, 81–136 | **◐** | Citation details confirmed from a citing article. The publisher's page refused automated access (HTTP 403), and no abstract was found elsewhere. Not cited |

Not rechecked in this pass (status as in the design doc §5): Moran & Eyal 2022, Nasarudin et al. 2023, Grossmann et al. 2021, Kenny et al. 2009, Wisco et al. 2015 (all ✔A); Kross et al. 2014 and Troy et al. 2013 (on file from CS1).

### Kross, Ayduk & Mischel 2005 (✔F)
- **Who and what:** undergraduates, guided alone by taped instructions. They recalled an interpersonal experience of overwhelming anger and hostility. Study 1: 155 people. Study 2: 133 people, 10 excluded for not following instructions.
- **Study 1 design:** 2 × 2. Perspective: self-immersed (relive it as if it were happening again) or self-distanced (take a few steps back and watch it happen to "the distant you"). Focus: what was felt, or why (the reasons underlying the feelings). About 39 people in each group.
- **Study 1 result:** measured straight afterwards. The distanced-why group, against the average of the other three: less implicit anger (d = 0.45), less explicit anger (d = 0.69), less negative affect (d = 0.59).
- **The other three groups** (immersed-what, immersed-why, distanced-what) were reported as equally ineffective, and were not compared with each other. There was no group that did not reflect. So Study 1 does not show that asking "why" up close raises distress, or that asking "what" up close is better than asking "why" up close. It shows that "what" did not help even from a distance.
- **Study 2 design:** distanced-why against immersed-why only.
- **Study 2 result:** reliving of the original emotions, self-rated on 1–7, was lower from a distance: 3.90 against 4.58, d = 0.46. The immersed group's written thoughts had more concrete recounting and blame (d = 0.50) and marginally fewer insight and closure statements (p = .07). That difference in thoughts accounted for the effect on reliving. Whether the conflict was resolved made no difference to the effect.
- **Limits:** students; anger only; one session; measured straight afterwards. The authors say the long-term effect was not tested.

### Kross & Ayduk 2008 (✔F)
- **Who and what:** people affiliated with one US university, guided by taped instructions. They recalled an experience of overwhelming sadness and depression. Then one of three: analyse the feelings immersed, analyse them from a distance (the same two instructions as in 2005), or a neutral distraction task. Analysis lasted 30 seconds.
- **Study 1** (141 people): depressed feeling straight afterwards was higher after immersed analysis than after distanced analysis (η² = .04) or distraction (η² = .06). Distanced analysis and distraction did not differ. Distanced analysis went with less recounting and more reconstruing, which accounted for its effect.
- **Study 2** (328 recruited; came back after 1 day or 7 days; 42 did not return, most from the 7-day group): the straight-afterwards result repeated (η² = .02). On coming back and thinking about the same experience with no instruction:
  - depressed feeling was lower after distanced than after immersed analysis (η² = .02), and marginally lower than after distraction (p = .08)
  - fewer recurring thoughts about the experience in between, against both other groups (η² = .03 and .02).
- **Caveats the authors give:**
  - The reverse path (feeling shaping thoughts) was also significant.
  - It is unknown whether the findings hold for clinical groups or beyond a week.
  - For trauma or phobia, where facing the feeling is the treatment, analysing from a distance might get in the way.
- **Limits:** the effects are small; one university; depressive experiences only.

### Ayduk & Kross 2010 (✔A)
- The abstract suggests that people who spontaneously took a distanced view of a negative memory showed less emotional and cardiovascular reactivity, and less intrusive thinking later, through less recounting and more reconstruing. Three studies of Berkeley undergraduates and dating couples (56, 71 and 53 couples).
- The distance was measured, not assigned, so this is an association, not an effect of an instruction.

### What this changes in `camera-angle-design.md`
1. **Supported as written [R]:** the immersed view was the comparison condition; "why" asked from a distance is the combination that helped; less recounting and more making sense of it from a distance.
2. **Corrected in §5:** "tended towards going over it again when immersed" overstated Study 1. What was found: from the immersed view, asking why went with more reliving and more recounting than asking why from a distance.
3. **Not supported:** that a "what" question is better than a "why" question for someone who stays close. The two were equally ineffective in 2005. A different question at position 0 is a design choice [D], justified by there being no person in the picture to watch, not by research.
4. **To add to the science text's limits:** the studies used strong recalled feelings (anger, sadness) in students, not mild everyday moments; straight afterwards, a neutral distraction did as well as stepping back; the effects are small.
5. **Still supports the safety line:** the 2008 authors themselves say distance might not suit trauma.


### Second pass, 2026-11-16: the background sources
Same levels as above. Full texts were read as text taken directly from the article (PubMed Central pages, or the authors' preprint files on OSF), not through a summary.

| Source | Status | What was read |
|---|---|---|
| Ayduk & Kross (2010), *J. Pers. Soc. Psychol.* 98(5), 809–829. Author manuscript, PubMed Central PMC2881638 | **✔F** (author manuscript) | Abstract; introduction; Study 1's sample, procedure and measures; each study's summary; general discussion; caveats. The results sections of Studies 1–3 were read only through their summaries |
| Wisco, Marx, Sloan, Gorman, Kulish & Pineles (2015), "Self-distancing from trauma memories reduces physiological but not subjective emotional reactivity among Veterans with posttraumatic stress disorder", *Clin. Psychol. Sci.* 3(6), 956–963. PubMed Central PMC4667807 | **✔F** | The whole article: introduction, method, results, discussion, limitations, notes |
| Nasarudin, Moeck & Koval, "Re-appraising stressors from a distance", preprint (PsyArXiv, doi 10.31234/osf.io/p587d), published 2023 in *Cogn. Emot.* 37(7) | **Full preprint** (not peer reviewed; the published version not read) | The whole preprint: introduction, method, results, discussion |
| Grossmann, Dorfman, Oakes, Santos, Vohs & Scholer, "Training for wisdom: the distanced-self-reflection diary method", preprint (PsyArXiv, doi 10.31234/osf.io/a5fgu), published 2021 in *Psychol. Sci.* 32(3) | **Preprint, in part** | Abstract, statement of relevance, introduction, Study 1's sample and procedure, general discussion with its caveats. Results not read |
| Moran & Eyal (2022), *Pers. Soc. Psychol. Rev.* 26(2) | **✔A** | Not openly accessible: the publisher refused access, and there is no open copy in Europe PMC |
| Kenny et al. (2009), "Distant memories: a prospective study of vantage point of trauma memories", *Psychol. Sci.* 20(9) | **✔A** | Not openly accessible: no open copy in Europe PMC |

### Ayduk & Kross 2010 (✔F, author manuscript)
- **What it is:** three studies that *measured* how much people spontaneously took a distanced view while reflecting on a negative memory. Nothing was assigned, so these are associations.
- **Who:**
  - Study 1: 56 Berkeley undergraduates, a rejection memory, followed up after about 7 weeks
  - Study 2: an anger memory, with heart and blood-pressure measures
  - Study 3: 53 dating couples, a 21-day diary and a filmed conflict discussion
- **Found:**
  - More distance went with less felt reactivity in all three studies, and less cardiovascular reactivity in Study 2.
  - In Study 1, it went with less reactivity and less intrusive thinking about 7 weeks later.
  - This went through less recounting and more reconstruing, not through avoidance. Distance was unrelated to avoidance in all three studies.
  - In couples, more distance went with more problem-solving and less returning of hostility.
- **The authors' point that matters here:** in PTSD, distance while *recalling* a memory has been linked to avoidance. Their work concerns distance while *reflecting* on a memory already recalled, and they suggest the two may work differently. The step 5 vantage question uses their measure's wording almost exactly: "saw the event replay through their own eyes vs. watched the event unfold as an observer".

### Wisco et al. 2015 (✔F)
- **Who and what:** 48 US military veterans with PTSD, mostly men, aged about 54, randomly assigned. Each analysed why they felt as they did about their worst trauma for about 90 seconds, immersed or distanced (the Kross 2005 instructions).
- **Found:**
  - Immersed, heart rate and skin conductance rose; distanced, they didn't (η²p ≈ .10).
  - Felt arousal, negative feeling and re-experiencing rose equally in both groups.
- **The authors:**
  - The effect on feelings "may not extend to extremely distressing memories".
  - Spontaneous distancing has been linked to PTSD risk (Kenny 2009), so distancing in therapy "might be harmful rather than helpful" until tested.
  - Short-term only.
- **For this exercise:** it supports keeping trauma out (the safety line) and making no claim about strong memories.

### Nasarudin, Moeck & Koval (full preprint)
- **Who and what:** 355 US adults online (MTurk). They recalled an unresolved interpersonal conflict, then wrote about it once in the third person ("you", "she", their name) or the first person.
- **Found:**
  - Positive feeling rose after third-person writing and not after first-person writing.
  - Negative feeling fell a little in both, with no difference between them.
  - Third-person writing also raised how "advantageous" the event seemed.
- **Matters here:** this is distance by **pronouns, written once**, not a visual vantage point. It is a limit on the method's evidence, not a test of this exercise.

### Grossmann et al. (preprint, in part)
- **Who and what:** two experiments, 555 North American adults. Daily diary reflections on the day's main social event, in the third person or the first person, for four weeks (Study 1) or one week (Study 2).
- **Found:** wise reasoning about a later conflict rose more after third-person reflection. Wise reasoning here means intellectual humility, seeing other viewpoints and looking for a resolution. The effects were small to moderate.
- **The authors' caveats:**
  - English-speaking North America only
  - independent replication awaited
  - it may not work uniformly
  - no no-diary control
- **Matters here:** repeated practice with pronouns, not one visual step back. Background only.

### What this second pass changes
- **Nothing on screen.** The science explanation v1 cites none of these sources.
- **The design doc's §5** now gives each source its level, and corrects two summaries:
  - Nasarudin is distance by pronouns, not a visual step back.
  - Wisco: physiology fell, felt distress didn't.
- **For a later content version, your decision:** a "not always replicated" limit could cite Nasarudin, if the full preprint counts as full text. That is for you to say, since the published version wasn't read.

## Memory reconsolidation (future candidate, plan §3.2): sources to verify
**Status:** nothing here has been checked; every entry is **◐** until it is read. Titles and details come from memory. Each is confirmed (exact title, DOI, sample, outcome) when obtained, and anything that can't be found is removed, not cited.

| Source | Why it matters | Status |
|---|---|---|
| Nader, Schafe & LeDoux (2000), *Nature*: fear memories and protein synthesis after retrieval (rats) | Animal foundation of reconsolidation | ◐, to obtain |
| Kindt, Soeter & Vervliet (2009), *Nature Neuroscience*: propranolol after reactivation in humans | Background only; drug paradigms are out of scope | ◐, to obtain |
| Schiller et al. (2010), *Nature*: extinction within the reconsolidation window in humans | Main behavioural "reactivation, then extinction" result | ◐, to obtain |
| Elsey, Van Ast & Kindt (2018), *Psychological Bulletin*: a framework and critical review of human reconsolidation | Boundary conditions and the state of the evidence | ◐, to obtain |
| James et al. (2015), *Psychological Science*: reminder followed by Tetris after an analogue trauma film | Visuospatial-interference paradigm described as reconsolidation-based | ◐, to obtain |
| Chalkia et al. (2020), *Cortex*: registered replication of the reactivation-extinction effect | Reported no lasting attenuation; tests robustness | ◐, to obtain |

**Questions the review must answer** (plan §3.2, gate 1):
- Which behavioural, non-clinical paradigm, if any, has replicated effects?
- Do the effects apply to everyday autobiographical memories, not just lab-conditioned fear or film analogues?
- What are the boundary conditions: prediction error at recall, timing, memory age and strength?
- What harms or worsening have been reported?
- Which effects can be attributed to reconsolidation rather than other processes, e.g. general visuospatial interference with imagery, attention or mood?

**Note:** Tetris-after-reminder and reactivation-extinction are **research paradigms**. A paradigm described as reconsolidation-based is not, on that basis alone, a proven reconsolidation intervention, and none of these studies tested anything like a web exercise.
