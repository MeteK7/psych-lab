# Stage 1 findings: the representation study (2026-11-23)

> **What this is:** the report Stage 1 ends in (`visual-engine-investigation.md` §9.6). It draws together passes A–D, slices 1 and 2, pass C and rules revisions 4–8. It ends with a recommendation for the Stage 2 decision, which is yours.
> - **What it covers:** the evidence the study produced, at the level of proof it reached.
> - **What it doesn't:** pass E (outside readers) and Stage 1b (interpretation) haven't run. §5 says what that leaves unproven.
> - **What changed while it ran:** nothing in `shared/visual/` (the engine), an exercise or a policy document. All study code is throwaway (D3).

## 1. The goal, and where Stage 1 leaves it

**The goal** (investigation §0): an independent, reusable visual engine that takes domain-neutral representations and generates visual experiences from them, without knowing which application it serves. Psychology is its first user, not its definition.

**Where Stage 1 leaves it:**
- **The goal is not reached, and Stage 1 was never meant to reach it.** It tests whether the architecture can work before any engine code is written.
- **The engine itself is unchanged.** It still has the nine couplings to this app recorded in investigation §7.4.
- **Stage 1 answers one question:** is the architecture worth building, and if so, which parts?

## 2. What was done

| Pass | Result | Record |
|---|---|---|
| **A. Breadth, on paper** | 34 synthetic cases in three domains plus stress cases, each as an account in the five categories and a v0 representation. 27 expressiveness gaps, the reuse matrix, 7 policy entries | `corpus-*.md`, `logs.md` |
| **B. Depth, in the Lab** | 12 cases × 3 directions = **36 working figures**, by the rules and finished, in light, dark, forced colours and reduced motion. All 36 accepted after review | `findings-slice-1.md`, `findings-slice-2.md` |
| **Rules revisions 2–4** | Hand changes cut from 15 (slice 1) to **4 left in 36 figures**. Each adopted rule is proven to draw what its hand change drew | `findings-revision-4.md`, `idioms.md` |
| **C. Reuse** | Six cases reworded into another domain draw identical geometry. A second style pack changes only colour. A domain-code audit. A first unseen case | `findings-pass-c.md` |
| **D. Measurement** | Every moving figure within the 60 Hz budget on both backends | `measurements.md` |
| **Revisions 5–8: unseen content** | Representation v0.2 (form); refusal with declared needs; four general patterns; composition across patterns; declared lists for every pattern; a structural probe. **Ten unseen cases**, nine of them written blind; 20 of their figures accepted | `findings-revision-5.md` to `-8.md` |
| **E. Review with outside readers** | **Prepared, not run** | `pass-e-procedure.md`, `/lab/study/match` |

## 3. The six questions (investigation §9.1)

| # | Question | Answer | Level of evidence |
|---|---|---|---|
| 1 | **Can the representation express different kinds of meaning?** | **Yes, with known gaps.** All 34 cases could be written. 27 gaps were logged; the two that reach three domains are **causation** (G-17) and **contrast** (G-26). Three gaps concern commitment itself: who confirms (G-14), where a set of possibilities comes from (G-18), and denial and beliefs (G-19). The blind writers used v0.2 without asking for new terms, but hit "down" (OI-25) and a missing question kind ("where it runs next", U3) | Written by one author, then by blind agents. Not by people outside the study |
| 2 | **Do different meanings produce genuinely different compositions?** | **Not tested as asked.** The matching test (outside readers pairing figures with texts) is pass E. What is shown: each case's three figures differ on at least two declared axes (checked by spec), and every figure draws only what its statements assert (checked by spec) | Checks by spec. No readers |
| 3 | **Do abstract and spatial approaches both have potential?** | **Yes, unevenly.** The kinetic idiom carried meaning most faithfully (R4-4 range adopted there). The field idiom needed the fewest hand changes. The spatial idiom needed the most: camera and layout work, organic forms and poses it lacks (PR-9, PR-11). It is also the weakest for composed unseen cases (U6 reads as a diagram, OI-37) | Your acceptance; deviation counts; my reading |
| 4 | **Do results meet the existing quality standard?** | **Accepted, not scored.** You accepted all 36 corpus figures and 20 unseen figures. No per-criterion rubric scores were recorded, and the psychology-trained reviewer's advice (D5) hasn't been recorded either. By-the-rules quality is strong: 32 of 36 corpus figures need no hand change | Your verdicts. No scores; no reviewer record |
| 5 | **Where does the architecture become restrictive?** | **Logged, and two limits matter most.** (a) The spatial idiom's primitives: no organic forms, four calm poses, no collision avoidance between words (PR-9 to PR-12, OI-22). (b) Policy: motion only on a state change and the element budget block kinetic and field figures (PL-1, PL-2, PL-7); the closed theme set and psychology-worded purposes block other domains (PL-3, PL-4, OI-18) | Logs |
| 6 | **Can the same visual concepts be reused across domains?** | **For structure, yes. For new content, not yet.** Structural twins in different domains draw identical figures, and a second style pack swaps colour only. But **every blind set was refused when it arrived**, and drawing it took patterns or additions built after seeing it | Pass C specs; blind sets |

## 4. What generalised, and what didn't

This is the centre of the decision.

### 4.1 What generalised: the mechanisms
Each item below was built once and then worked on content it wasn't written for:

| Mechanism | Evidence |
|---|---|
| **The envelope with five commitments,** drawn in their registers (established, possible, open), inferred never drawn | Every figure checked by spec; 20 unseen figures drawn without drawing an inference |
| **Domain-neutral structure:** twins in different domains give the same figure | 18 reworded figures identical apart from words (pass C) |
| **Style packs** separate from the engine | 36 figures, identical geometry under two packs |
| **Forms from statements, never from words** (v0.2) | Unseen cases drawn with their stated forms, or neutral where none is stated (your rule) |
| **Honest refusal with declared needs:** a pattern says what it lacks instead of drawing another case's figure | Nine blind figures refused with reasons; Lab panels show them |
| **Composition:** a general pattern draws what it can, and small additions draw the rest | U5–U7: 8 of 9 figures, accepted |
| **Declared lists and a structural probe:** every pattern states what it accounts for, and a probe of 5,415 variants finds no failure | `revision-8.spec.ts` |
| **Measured cost:** at most 2.4 ms median per frame for the heaviest figure | `measurements.md` |

### 4.2 What didn't generalise: the patterns
- **Most of the 38 patterns** across the three idioms **were written from one case.** In the corpus, every figure has exactly one pattern able to draw it (revision 5).
- **Six of them failed on the first unseen cases they met** (OI-39), until their needs were declared.
- **The four general patterns** (motion, carrying, dependency, felt) **each began as one blind case's pattern.**
- **Each blind set exposed the limit:**

| Blind set | On arrival | After work built from it |
|---|---|---|
| U2–U4 (revision 5) | refused, 9 of 9 | drawn by three new patterns |
| U5–U7 (revision 6) | refused, 9 of 9 | 8 of 9 drawn by composition |
| U8–U10 (revision 7) | refused, 9 of 9 | still refused: order, "more than", relations without an event, a cycle through one place |

**The plain conclusion:**
- **The mechanisms generalise.** The patterns, as written, are mostly prepared compositions in code form.
- **Each step widened coverage.** None yet drew a blind set on arrival.

## 5. What Stage 1 leaves unproven
1. **Whether people read the figures as meant.** The matching test and back-reading (pass E) haven't run, so question 2 is unanswered and "says only what is meant" rests on specs and one reviewer.
2. **Rubric scores, and the psychology reviewer's advice.** Neither was recorded.
3. **Whether text can become a reliable account.** That is Stage 1b, not started (D6). The whole chain depends on it, because the engine draws only what the account commits to.
4. **Independence from content.** Shown for structure, not for new meaning.
5. **Independence of the production engine.** The study drew through the existing engine without changing it. That shows the engine's lower layers (scene, frame, backends) can serve three domains, not that its representation layer is independent, because that layer doesn't exist yet.
6. **A second application.** Investigation §7.3: proof of neutrality comes only when a second application is built on the engine.

## 6. Recommendation: **narrow**

Of the three outcomes in §9.6, the evidence supports **narrow**:
- **Not stop.** The by-the-rules figures reached your standard (32 of 36 with no hand change). The mechanisms in §4.1 held on content they weren't written for.
- **Not go.** Go would mean a synthesizer of idioms that draws new meaning. Three blind sets show the patterns don't do that yet.

**Narrow, concretely.** A first engine representation layer (Stage 3) would contain:
1. **The representation contract:** the envelope, the five commitments, v0.2 with form, and the first v1 additions the logs ask for (causation G-17, contrast G-26, and denial and beliefs G-19). The licensed-pattern list is reviewed first, including "down" and L-form (OI-25, OI-8).
2. **The invariants:** commitment to visual register; nothing drawn without a statement; inferred never drawn; coverage accounting; determinism.
3. **The dispatch:** patterns with declared lists and needs, honest refusal, composition with additions, and the structural probe as a standing test.
4. **The general patterns:** motion, carrying, dependency and felt. Their figures are accepted, and their lists are probed.

**What stays a prepared composition, in the application:** the one-case corpus patterns (P1's encounter, P2's room, P5's meeting room, P6's carriage, E3's plants and others). They're selected by meaning when they fit, and they aren't promoted into the engine.

**What must come before Stage 3 is proposed:**
- **Pass E,** in at least a small form, to answer question 2.
- **The offline part of Stage 1b,** to know whether accounts can be produced reliably.

**What can start now, independent of the decision:**
- **Stage 6, boundary hardening in `shared/visual/`:** a public entry point; themes and purposes from a style pack instead of the app's closed sets (PL-3, PL-4, OI-18); no app compositions inside the engine folder. Investigation §11 marks it independent of Stages 3–5, and it removes couplings the study met directly.

## 7. Decisions for you
1. ~~**Stage 2:** go, narrow or stop.~~ **Decided: narrow** (§8).
2. **Pass E:** whether it runs, who facilitates, who takes part, and the framing-words setting (`pass-e-procedure.md` §7).
3. **D6:** how Stage 1b begins (offline first, as the investigation proposes).
4. **Stage 6 now, in parallel?** It needs its own proposal.
5. **The open policy proposals** PL-1 to PL-7, each its own decision. They block motion that depicts, possibility sets and crowds as one group, and other domains' themes and purposes.
6. **Open issues** stay recorded (`open-issues.md`, OI-1 to OI-39). Acceptance hasn't resolved them, and the first engine version shouldn't inherit them unexamined.

## 8. Your Stage 2 decision (2026-11-23): narrow, with architectural clarifications

**The decision:** narrow. You agree that the study has shown useful general mechanisms, but not yet enough content-independent generalisation of its visual patterns.

**The clarification, which governs every later stage:**
- **The objective is unchanged:** an independent, reusable visual engine that accepts domain-neutral representations and generates meaningful visual experiences without knowing which application uses it.
- **Narrow reduces the first implementation's scope. It does not reduce the capabilities the architecture is meant to have.**

**What this means for §6:**
- **The first engine version is small,** but it is built for growth: open facets, open idioms, open primitives, and a dispatch able to take generative patterns. Nothing in it fixes a ceiling.
- **The one-case corpus patterns are prepared compositions for now.** They are a starting rung, not the engine's limit (investigation §0: "prepared compositions are a starting rung and never the ceiling"). Generating figures for new content remains the engine's purpose, and the study's open finding (§4.2) is the work still ahead, not a boundary.
- **No design choice in Stage 3 may close off generation from new representations.** For example: a closed list of idioms, a vocabulary that only the corpus fills, dispatch keyed to cases, or a representation shaped by today's patterns.

**Next:** the Stage 3 proposal, `../visual-engine-stage-3-proposal.md` (2026-11-23), written under this decision. Its open decisions are S3-1 to S3-5.
