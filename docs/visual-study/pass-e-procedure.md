# Pass E: procedure (prepared, not run)

> **Status:** preparation only. No one has been recruited, no session has been held, and nothing is collected. Who runs pass E, with whom, and when, waits for your decision. This document says how a session would go if it ran, so the procedure can be reviewed before anyone sees a figure.

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
| Figures | One per case (12), All (36), Spatial, Kinetic, Field (12 each) | One per case | One per case gives each participant every case once, in a mix of idioms. Across order numbers 1, 2 and 3, each figure appears once |
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
6. **After:** reload the page, so nothing remains.

## 4. What to record (on paper or in a document the facilitator keeps, never in the app)

**For the session:**
- the date
- the facilitator
- the figure set, order number, scheme and framing setting
- whether descriptions were typed or spoken
- no participant name or other identifying detail

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

## 7. What waits for you

- Whether pass E runs, who facilitates, and who takes part. This document assumes adults who have never seen the study, not people from the app's own audience, but that choice is yours.
- Any consent or information sheet a session would need. It isn't drafted here, because it depends on who takes part.
- Whether the framing words are on or off. One setting for all sessions keeps results comparable.
