# Pass E: procedure (prepared, not run)

> **Status:** prepared, decided (2026-11-23, §7), not yet run. No one has been recruited, no session has been held, and nothing is collected. You facilitate, with adults you ask yourself. This document says how a session goes, so the procedure can be reviewed before anyone sees a figure.

## 1. What pass E asks

Earlier passes checked the figures against their representations (the specs) and against your judgment. Pass E asks what people who have never seen the study read from the figures. There are two questions, asked in this order:

1. **Unprompted:** what does each figure say to someone who knows nothing of its text? This tests what a figure claims by itself, including what it says that its text doesn't.
2. **Matching:** given the texts, can a person tell which figure goes with which? This tests whether figures distinguish their texts, a weaker but countable result.

The order matters. Once a person has read the texts, they can't unread them, so unprompted descriptions must come first.

## 2. The page

Open `/lab/study/match` in the development build.

**What the page does:**
- **Two modes, in order.** Matching unlocks only after the last unprompted figure has been shown.
- **Unprompted:** one figure at a time, in the order the session's order number gives.
  - A sequence plays once by itself; a viewpoint figure holds, then moves through its positions once.
  - The participant can replay a sequence or move the viewpoint themself.
  - Under the operating system's reduced-motion setting, a sequence shows its last frame and a viewpoint move cuts.
  - The free-text box asks "What do you see happening?".
- **Matching:** the same figures in a second order, beside the texts lettered A onward.
  - Each figure has a choice of letter.
  - "Count the matches" shows the count and each figure's right letter. Press it only after the participant has finished (§3).
- **Nothing leaves the page.** Nothing is sent and nothing is stored (checked: no network request and no storage during a full run). Reloading clears everything. Anything to be kept must be written down by the facilitator (§4).
- **The figure's text alternative is not its accessible name here,** because it would give the answer to a screen-reader user. Each figure is named "Figure 1", "Figure 2", and so on. A screen-reader user can't take part in this pass as designed. Pass E for non-visual reading would need its own design.

**Settings for a session:**

| Setting | Values | Default | Note |
|---|---|---|---|
| Figures | One per case (12), All (36), Spatial, Kinetic, Field (12 each), Engine (20) | One per case | One per case gives each participant every case once, in a mix of idioms. Across order numbers 1, 2 and 3, each figure appears once. **Engine** shows the engine's own figures (Stage 3, M3): the seven accepted unseen cases (U1–U7) in every idiom that draws them, 20 figures over 7 texts. The corpus sets don't include them, because every corpus figure is drawn by its case's own pattern (checked by spec) |
| Order | A number | 1 | The same number gives the same order. The order is shown under the figure as case and idiom (P4-F, E3-S…) for the facilitator's record |
| Scheme | Light, dark | Light | One scheme per session |
| Framing words | On, off | On | Rule S1 shows framing words under a stand-in spatial figure. They also hint at the content, so a session fixes one setting and records it |

## 3. A session, step by step

1. **Before:**
   - Set the figures, the order number, the scheme and the framing words.
   - Note them on the record sheet (§4).
   - Reload the page, so it starts empty.
2. **The instruction,** read the same way each time: "You'll see some drawings, one at a time. Some move. For each one, please say or write what you see happening. There are no right answers. Take as long as you like."
3. **Unprompted:**
   - The participant sees each figure, watches it play, and describes it.
   - The participant may type, or speak while the facilitator writes. The record sheet notes which.
   - The facilitator doesn't prompt, beyond "Anything else?" once per figure.
   - Move on with "Next".
4. **Matching:**
   - Switch to matching, then read: "Here are the texts the drawings were made from. For each drawing, choose the text you think it shows. A text can go with more than one drawing."
   - The participant chooses. The facilitator doesn't help.
5. **Count:** press "Count the matches" only when the participant has finished, and copy the count and each choice onto the record sheet.
6. **After:**
   - Offer the participant the record of their descriptions to read and correct, and ask whether they may be quoted.
   - Give them the slip with the session number.
   - Reload the page, so nothing remains.

## 4. What to record (on paper or in a document the facilitator keeps, never in the app)

**For the session:**
- the session number, also written on the slip the participant takes away (`pass-e-information.md`)
- the date
- the facilitator
- the figure set, order number, scheme and framing setting
- whether descriptions were typed or spoken
- whether the participant read the record at the end, and any corrections they made
- whether the participant may be quoted: `yes` or `no`
- no participant name or other identifying detail

**Keeping the record:** until the pass E report is final, and 6 months at most, then destroyed. A participant who stops during the session: what was written is destroyed then. A participant who withdraws afterwards, by session number, before the report is final: that session's record is destroyed and not used.

**For each unprompted figure (by case and idiom, from the order line):**
- the description, verbatim

**For matching:**
- each figure's chosen letter
- the right letter
- the count

## 5. Scoring the unprompted descriptions

Each description is split into **claims**: single things it says ("someone walks past", "they are ignoring the other person", "the meeting is later").

**Each claim is scored against the case's representation** (`cases.ts`, and `corpus-*.md` for the reasoning), by the statement it matches:

| The claim matches | Score | What it says about the figure |
|---|---|---|
| A **reported** or **implied** statement | Supported | The figure carries what the text establishes |
| A **possible** statement (one of the listed possibilities), worded as a possibility | Supported, as open | The figure keeps the possibility open, as it should |
| A **possible** or **unknown** statement, worded as a fact ("he didn't see me") | **Over-read** | The figure closed something the text leaves open |
| An **inferred** statement (never drawn) | **Over-read** | The figure suggested what the text doesn't say (or the reader brought it) |
| Nothing in the representation | **Added** | The figure, or the reader, invented it. Note which, where the description shows it |
| Contradicts a statement | **Misread** | |

**For each figure the report gives:**
- how many of its established statements were read (coverage)
- its over-reads and additions, listed
- its misreads

**Patterns across participants matter more than single readings.** One person who sees a fight in P1's field figure is a reading; three are a finding about the figure.

**Two readers score independently,** then compare. Disagreements are settled by discussion and recorded. For the psychology cases (P1–P6), the psychology-trained reviewer is one of the two (D5).

**Questions this scoring answers, from the open issues:**
- **OI-1:** do readers take P1's possibilities as being about "you" (thoughts, worries) rather than about the classmate?
- **OI-2:** do the swirling open headings in P1 and P3 read as turbulence or distress?
- **OI-9:** does P2's closing ring read as cold or as tension?
- **OI-15:** do kinetic figures read as experiences, or as diagrams, once they play?
- **R4-4:** if a treatment for unspecified amounts is adopted first, do readers take the drawn amount as a measurement?

## 6. Matching

- **The count** per participant, and per figure across participants.
- **A confusion table:** which texts are taken for which. Confusing the structural twins (P3/M2, P4/M3) is expected and says the figures carry structure. Confusing different structures is a problem.
- **Labels in the figures** ("Meeting", "Clouds", "Licence") make matching easier than the drawing alone would. The report says so, and doesn't treat a high count as evidence about the drawing.

## 7. Your decisions (2026-11-23)

- **Who:** you facilitate, with adults you ask yourself who have never seen the study. No one is recruited, and nothing about who takes part is kept (§4).
- **Figures:** the page gains the **Engine** set (§2), so that pass E tests the figures it gates: adopting M3 (`../visual-engine-stage-3-proposal.md` §7). The corpus sets stay as prepared.
- **Framing words: on,** for every session. They are part of a stand-in spatial figure (rule S1), so the figures are tested as the engine draws them. The report says that they hint at the content.
- **Information sheet:** drafted for your review, `pass-e-information.md`. Whether a session also needs written consent stays yours.

**Still open:**
- Which sets each session shows, and in what order (for example the Engine set alone, or a corpus set first). Once a participant has read any texts, they know what kind of thing the figures show, so a session that shows two sets gives both sets' unprompted descriptions before either set's matching.
- How many people, and the second scorer for the unseen cases (§5). U2 and U5 are psychology cases, so the psychology-trained reviewer scores them (D5).

**For scoring the Engine set (§5):** an unseen case's representation is in `unseen.ts`, `unseen-blind.ts` and `unseen-blind-2.ts`, not `cases.ts`.
