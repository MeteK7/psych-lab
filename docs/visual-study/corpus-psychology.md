# Corpus: psychology (12 cases)

Pass A of the first slice. Each case has its **account**, every statement in one of the five categories (`representation-v0.md` §1), and its **representation** in v0 terms. **Gaps** name where v0 could not say what the case means; they are collected in `logs.md`. Depth cases (drawn in the Lab) are marked ◆.

Notation: `R` reported · `L` implied (licensed pattern, `representation-v0.md` §5) · `I` inferred · `P` possible · `U` unknown. "Own" is the writer, or the person addressed by CS3's second-person scenarios.

---

## Part 1: Not enough to go on (CS3), the six reviewed scenarios

The texts and the five readings for each are reviewed content (`cs-not-enough.v4.json`). Every possibility set below is those readings, unchanged.

### P-CS3-1 · `teacher_note`
> "Your teacher writes 'Come and see me after class' on your assignment."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The teacher wrote a note on own's assignment | R | "writes … on your assignment" |
| R2 | The note asks own to come and see the teacher after class | R | the quoted words |
| L1 | Own has an assignment the teacher has seen | L | presupposition of "your assignment" |
| I1 | The note is about the assignment | I | it is written on it; the text doesn't say what it is about |
| I2 | Something is wrong | I | the feared reading, not stated |
| U1 | What the teacher wants to talk about | U | not stated |
| U2 | Why in person rather than in writing | U | not stated |
| P | in_person · bad_grade · several · fix · liked | P | reviewed readings |

**Representation**
- Elements: `own` presence, own · `teacher` presence · `assignment` object, secondary · `meeting` process, pending
- Statements: `s1` sends(teacher, note, own) R · `s2` located-in(note, assignment) R · `s3` pending(meeting) R · `q1` question(meeting, content) U · `q2` question(s1, cause) U · `a1` alternatives(q1, 5) P
- Time: now → after class
- Facets: relations · dynamics (s1 now, meeting later)

**Gaps:** a request is not an event that took place, and `pending` loses who asked (G-01).

### P-CS3-2 · `no_reply`
> "A friend hasn't replied to your message for a day."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The friend has not replied | R | "hasn't replied" |
| R2 | A day has passed without a reply | R | "for a day" |
| L1 | Own sent the friend a message | L | presupposition of "replied to your message" |
| I1 | The friend has read the message | I | not stated |
| U1 | Whether the friend has seen it | U | not stated |
| U2 | Why there is no reply | U | not stated |
| U3 | Whether and when a reply will come | U | not stated |
| P | busy · dont_want · properly · bothered · forgot | P | reviewed readings |

**Representation**
- Elements: `own` presence, own · `friend` presence · `message` object
- Statements: `s1` sends(own, message, friend) L · `s2` exchange-absent(reply, friend, own) R · `q1` question(friend, attention) U · `q2` question(s2, cause) U · `q3` question(reply, time) U · `a1` alternatives(q2, 5) P
- Quantities: duration of s2, one day
- Facets: relations · dynamics (s1, then a held interval) · quantities

**Gaps:** a duration can't be attached to an absence; it sits in `quantities` with no link to `s2` (G-02).

### P-CS3-3 · `meeting_moved`
> "Your manager moves your weekly meeting without saying why."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The manager moved own's weekly meeting | R | "moves your weekly meeting" |
| R2 | The manager did not say why | R | "without saying why" |
| L1 | There is a recurring weekly meeting between them | L | presupposition of "your weekly meeting" |
| I1 | The move is about own | I | the feared and mild readings, not stated |
| U1 | Why it was moved | U | stated as not said |
| P | slot · bad_coming · attention · pressure · priority | P | reviewed readings |

**Representation**
- Elements: `own` presence, own · `manager` presence · `meeting` process (repeats)
- Statements: `s1` moves(manager, meeting, slot → slot) R · `s2` exchange-absent(explanation, manager, own) R · `q1` question(s1, cause) U · `a1` alternatives(q1, 5) P
- Time: the meeting's usual slot → its new slot
- Facets: relations · dynamics

**Gaps:** `moves` is movement in space; a move in time (rescheduling) needs the dimension named (G-03).

### P-CS3-4 · `no_reactions`
> "In a group chat, your suggestion gets no reactions."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own's suggestion in a group chat got no reactions | R | the sentence |
| L1 | Own made a suggestion to a group | L | presupposition of "your suggestion" |
| I1 | People read it | I | not stated |
| I2 | People disliked it | I | the feared reading |
| U1 | Whether people read it | U | not stated |
| U2 | What they think of it | U | not stated |
| P | buried · bad_idea · waiting · unclear · agree | P | reviewed readings |

**Representation**
- Elements: `own` presence, own · `group` presence, **plural** · `suggestion` object
- Statements: `s1` sends(own, suggestion, group) L · `s2` exchange-absent(reaction, group, own) R · `q1` question(group, attention) U · `q2` question(s2, cause) U · `a1` alternatives(q2, 5) P
- Facets: relations

**Gaps:** v0 has no plural presence (a group of an unstated number) (G-04).

### P-CS3-5 · `essay_comment`
> "Your essay comes back with: 'Interesting, but is this the right question?'"

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own's essay was returned with a comment | R | "comes back with" |
| R2 | The comment's words | R | the quotation, as a content key |
| L1 | Someone read the essay and wrote the comment | L | presupposition |
| L2 | The comment sets "interesting" against a question | L | "but" |
| I1 | The marker thinks the question is wrong | I | a question is not an assertion |
| U1 | What the marker meant | U | not stated |
| P | marking · all_wrong · challenge · pushes · sharpen | P | reviewed readings |

**Representation**
- Elements: `own` presence, own · `marker` presence, secondary · `essay` object
- Statements: `s1` sends(marker, comment, own) R · `q1` question(s1, intent) U · `a1` alternatives(q1, 5) P
- Facets: relations

**Gaps:** none in v0. The comment's meaning is correctly left open; its words never enter the representation.

### P1 ◆ P-CS3-6 · `no_hello`
> "A classmate walks past you without saying hello."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | A classmate walked past own | R | "walks past you" |
| R2 | The classmate did not say hello | R | "without saying hello" |
| L1 | Their paths came close and continued | L | "X walked past Y" |
| I1 | The classmate saw own | I | needed by every reading except "didn't see me"; not stated |
| I2 | Own expected a hello | I | pragmatic |
| I3 | Nothing at all passed between them | I | R2 excludes a spoken hello only |
| U1 | Whether the classmate noticed own | U | not stated |
| U2 | Whether own said hello | U | not stated |
| U3 | Why | U | not stated |
| U4 | Whether own was walking or standing | U | **added in v0.1:** the account says only the classmate walked |
| P | didnt_see · dont_like · lost_thought · annoyed · awkward | P | reviewed readings |

**Representation**
- Elements: `own` presence, own, equal · `other` presence, equal
- Statements:
  - `s1` passes(own, other, mover: other) · L · "walks past": the classmate moved; you are the point of reference
  - `q4` question(own, motion) · U
  - `s2` exchange-absent(spoken greeting, other, own) · R · "without saying hello"
  - `q1` question(other, attention) · U
  - `q2` question(own, whether greeted) · U
  - `q3` question(s2, cause) · U
  - `a1` alternatives(q3, five readings) · P
- Time: approach → pass → apart
- Facets: space (setting **stand-in**; viewpoints own, across) · dynamics (s1 across the three phases; moderate) · field (clarity, from q3, radial, unresolved)
- Qualities: none. No feeling is reported, so nothing drives a charge.

**Gaps:** the setting must be a stand-in, and a stand-in asserts a kind of place, a corridor or a path (G-05). An idiom may not give `other` a facing, because attention is unknown (handled by the rules, not a gap).

---

## Part 2: Change the camera angle, six moments written for the study

Three are the kinds the exercise's design review found its room fits poorly (`camera-angle-design.md` §9.2): a message read alone, a mistake nobody saw, a moment in a crowd. None offers possibility sets: the exercise asks the person to look, not to choose explanations.

### P-CA-1 · a remark in a meeting
> "In the team meeting, when I gave my update, someone made a joke about how long it took, and a few people laughed."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own gave an update in the team meeting | R | |
| R2 | Someone joked about how long it took | R | |
| R3 | A few people laughed | R | |
| L1 | Others from the team were present | L | "team meeting" |
| I1 | The joke was meant unkindly | I | |
| I2 | They laughed at own | I | they laughed; at what is not stated |
| U1 | The joker's intent | U | |
| U2 | What the others thought | U | |

**Representation**
- Elements: `own` presence, own · `joker` presence · `team` presence, plural · `meeting` place (reported)
- Statements: `s1` sends(own, update, team) R · `s2` sends(joker, remark, team) R · `s3` reacts(team, s2) R · `q1` question(joker, intent) U · `q2` question(team, attention) U
- Facets: space (reported; own, behind, across, above) · dynamics (s1 → s2 → s3)

**Gaps:** no predicate for a reaction (`reacts`) (G-06); plural presence again (G-04).

### P-CA-2 · an argument at a table
> "At dinner my brother and I argued about money, and I raised my voice."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own and their brother argued about money at dinner | R | |
| R2 | Own raised their voice | R | |
| L1 | They were at a meal together | L | "at dinner" |
| I1 | The brother was hurt or angry | I | |
| U1 | Who else was there | U | |
| U2 | How the brother felt | U | |

**Representation**
- Elements: `own` presence, own · `brother` presence · `dinner` place (reported)
- Statements: `s1` exchange(argument, own, brother) R · `s2` intensity(own, s1, raised) R · `q1` question(brother, feeling) U · `q2` question(dinner, who else) U
- Facets: space (reported; own, behind, across, above) · dynamics (s1, s2)

**Gaps:** v0 has an absent exchange but no positive one (G-07); no intensity of an action (G-08).

### P2 ◆ P-CA-3 · a message read alone
> "I read a short reply from my manager on my phone, alone at home in the evening. It felt cold."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own read a reply from their manager | R | |
| R2 | The reply was short | R | |
| R3 | Own read it on their phone | R | |
| R4 | Own was alone at home | R | |
| R5 | It was evening | R | |
| R6 | The reply felt cold to own | R | "It felt cold": a feeling, attributed to own |
| L1 | Own had written to the manager first | L | presupposition of "reply" |
| L2 | The manager was somewhere else | L | own was alone |
| I1 | The manager meant it coldly | I | |
| I2 | The manager was annoyed | I | |
| U1 | What the manager meant | U | |
| U2 | Where the manager was, and what their evening was like | U | |

**Representation**
- Elements: `own` presence, own, primary · `sender` presence, secondary · `reply` object · `home` place
- Statements:
  - `s1` sends(sender, reply, own) · R
  - `s2` receives(own, reply) · R
  - `s3` located-in(own, home) · R, alone
  - `s4` apart(own, sender) · L
  - `s5` feels(own, charge 0.5) · R, attributed: the mapping turns "felt cold" into charge
  - `q1` question(sender, intent) · U
  - `q2` question(sender, setting) · U
- Time: one phase (the evening); the stepping back is a change of viewpoint, not of time
- Facets: space (reported: home, evening; viewpoints own, behind, across, outside) · field (agitation, from s5, radial, **not** resolved)

**Gaps:** "cold" becomes `charge`, losing the felt quality's own character (G-09). A field that calms as the viewer steps back would claim an outcome (`visual-policy.md` §5 rule 3); the field must keep its strength, and only the frame around it grows. That is a rule, not a gap.

### P-CA-4 · a mistake nobody saw
> "I sent the wrong file to a client this morning. I fixed it within minutes, and nobody mentioned it, but I keep replaying it."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own sent the wrong file to a client this morning | R | |
| R2 | Own fixed it within minutes | R | |
| R3 | Nobody mentioned it | R | |
| R4 | Own keeps replaying it | R | |
| L1 | The writer sets the replaying against no one mentioning it | L | "but" |
| I1 | Nobody noticed | I | not mentioning is not not noticing |
| U1 | Whether anyone noticed | U | |

**Representation**
- Elements: `own` presence, own · `client` presence, secondary · `file` object
- Statements: `s1` sends(own, file, client) R · `s2` complete(fix) R · `s3` exchange-absent(mention, anyone, own) R · `s4` recurs(s1, for own) R · `q1` question(client, attention) U
- Quantities: the fix's delay, minutes
- Facets: dynamics (s1 → s2 within minutes; s4 repeating) · field (agitation, from s4)

**Gaps:** an event that recurs in one presence's mind (`recurs`) (G-10); "anyone" as an unspecified presence (G-04).

### P-CA-5 · a moment in a crowd
> "On a crowded train, I stumbled when it braked and grabbed a stranger's arm. I apologised, and they said nothing."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Own was on a crowded train | R | |
| R2 | The train braked and own stumbled | R | |
| R3 | Own grabbed a stranger's arm | R | |
| R4 | Own apologised | R | |
| R5 | The stranger said nothing | R | |
| L1 | Many others were present | L | "crowded" |
| I1 | The stranger was annoyed | I | |
| U1 | Anything other than speech from the stranger | U | |
| U2 | Whether others noticed | U | |

**Representation**
- Elements: `own` presence, own · `stranger` presence · `crowd` presence, plural · `train` place
- Statements: `s1` located-in(all, train) R · `s2` moves(own, stumble) R · `s3` contact(own, stranger) R · `s4` sends(own, apology, stranger) R · `s5` exchange-absent(spoken reply, stranger, own) R · `q1` question(stranger, response) U · `q2` question(crowd, attention) U
- Facets: space (reported; own, behind, above) · dynamics (s2 → s3 → s4 → s5)

**Gaps:** contact and force (`contact`, braking) (G-11).

### P-CA-6 · a call that ended suddenly
> "My friend ended our phone call quite suddenly, saying she had to go."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The friend ended the call | R | |
| R2 | It ended suddenly, in own's words | R | "quite suddenly" |
| R3 | She said she had to go | R | |
| L1 | They were in different places | L | a phone call |
| I1 | She wanted to end the conversation with own | I | |
| U1 | Why she had to go | U | |
| U2 | Where she was | U | |

**Representation**
- Elements: `own` presence, own · `friend` presence
- Statements: `s1` exchange(call, own, friend) R · `s2` ends(friend, s1, suddenly) R · `s3` sends(friend, words, own) R · `s4` apart(own, friend) L · `q1` question(s2, cause) U · `q2` question(friend, setting) U
- Facets: space (two settings; own's reported, the friend's unknown) · dynamics (s1 → s2)

**Gaps:** a positive exchange (G-07) and its ending (`ends`) (G-12).
