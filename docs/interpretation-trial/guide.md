# Annotating a text: the guide

> **For annotators.** Read this guide once before you start, and keep it beside you. Annotate alone: don't look at anyone else's sheet, the study's documents (`docs/visual-study/`), the Lab, or `slice-1/key.md` until the trial is over. Its examples are taken from texts that are not in the trial.

## 1. What you are doing

Each text is a short piece of writing: something a person wrote about their day, a passage from a lesson, or a note about a project. For each text, you write its **account**: what the text says, and what it doesn't. Every statement in the account goes into one of five categories.

The account decides what a drawing of the text may show. A drawing shows only statements in the first two categories as facts. So the question behind every choice is: **does the text itself commit to this, or would I be adding it?**

You can't get a text wrong. Two careful people will disagree on some statements, and the trial measures how often. If you are unsure, choose the weaker category and say why in the Basis column.

## 2. Before each text

Answer two questions at the top of the text's section:
- **Seen before:** have you seen this text, or a drawing or account of it, before today? `yes` or `no`.
- **Decline:** should a program that reads texts like this refuse to give an account of it? `no`, or `yes:` and the reason. For example, the text isn't about anything that happened, it can't be read, or it asks the reader to do something instead of saying something. Declining is rare. A short or odd text can usually still be given an account.

## 3. Splitting a text into statements

- **One claim per statement.** "Ana is needed for both tasks and can't do both at once" is two statements.
- **"And", lists and commas** usually join separate claims: split them. Keep them together only when splitting would change what is claimed ("salt and pepper were on the table" is one).
- **"Because", "so", "but"** join two claims and say something about how they relate. Write the two claims, and write the relation as its own statement ("the text gives A as the reason for B"; "the writer sets B against A").
- **Write each statement in plain words,** close to the text's own. Name things as the text names them ("the manager", "you", "the writer").
- **Number each statement** with its category letter and a count: R1, R2, L1, I1 … A possibility set is a single row numbered `P` (P1, P2 if there are two sets).

## 4. The five categories

Each statement gets the category its **derivation** gives it. Write the derivation in its column, then the category it leads to.

| Derivation | What it means | Category |
|---|---|---|
| `restatement` | The text says it, in so many words | **R** reported |
| `entailment` | It must be true if the text is true | **L** implied, but only through a licensed pattern (below); otherwise **I** |
| `presupposition` | The text takes it for granted ("your sister" takes for granted you have one) | **L** through a licensed pattern; otherwise **I** |
| `conventional meaning` | A word's fixed meaning adds it ("but" marks a contrast) | **L** through a licensed pattern; otherwise **I** |
| `pragmatic inference` | A reader would usually take it from the situation, but the text doesn't say it | **I** inferred |
| `world knowledge` | It's true or likely in general, but the text doesn't say it | **I** inferred |
| `alternative` | The text offers it as one of two or more possibilities | **P** possible |
| `open question` | The text raises it and leaves it open | **U** unknown |

### R: reported
The text asserts it. The person's own feelings and conclusions count when they are stated as theirs: "it felt cold" is reported as *the reply felt cold to the writer*, not as *the reply was cold*. A negation is reported too: "she didn't call" is the reported statement *she didn't call*.

The **Basis** of an R statement is the text's own words, in quotation marks.

### L: implied, by the letter
It follows from the language itself **and** one of these licensed patterns covers it. The Basis names the pattern.

| Pattern | Licenses |
|---|---|
| "X passed / walked past Y" | X moved past Y: X came close to Y and went on. Nothing about whether Y moved: that is **U**, or **R** if the text says it |
| "X didn't do Z" | X did not do Z. Not that Z didn't take place: someone else may have done it. Usually the text says it in its own words, and then it is **R** by restatement |
| "but" | The writer marks a contrast between the clauses. Not what the contrast is about |
| "X can't start until Y" | X depends on Y; while Y is absent, X is waiting for Y |
| "X hasn't said when" | When is an open question |
| "X is finished / done" | X is complete |
| "returns to" | X goes back to where, or what, it was before |
| "takes up / picks up", in the physical sense ("picks up the box") | The taken thing is now held by, or with, the taker. "Takes up a hobby", "takes up space" and other senses are not covered: they are **I** |
| "it felt …" | A feeling, attributed to the writer |
| A noun whose ordinary sense fixes a shape ("a ball", "a box", "a ramp") | That shape, and nothing else about it (*under review*) |

**This list is short on purpose,** and it is under review. When something follows from the language but no row licenses it, it is **I**. Write `yes` in the **Would license** column, and in Basis say what pattern you would add. Your entries are the evidence for that review. They don't count against the text or against you.

### I: inferred
Anything a reader adds: what the situation usually means, what people usually feel, what is true in general. **Inferred statements are never drawn as facts,** so this is where the drawing's risk is.

The list of inferences can never be complete. Write the ones a reader would plausibly draw, especially those a drawing might be tempted to show (who saw whom, how someone felt, why something happened, where something is).

### P: possible
**Only when the text itself offers two or more possibilities** ("it might be A, or it might be B"). Write the whole set as one row numbered `P`, with the options separated by ` · `. Don't invent possibility sets: if the text offers none, there is no P row.

### U: unknown
A question the text raises and leaves open: why something happened, whether someone noticed, when something will happen, who else was there. Write it as a question's subject ("Why there is no reply"). Note what the text makes you ask, not every question in the world.

### The hard boundaries
- **L or I?** If no licensed pattern covers it, it is I, however obvious it seems.
- **R or L?** If the text says it in its own words, it is R. L is for what the words carry without saying.
- **I or U?** An answer to an open question is I ("the friend is busy"); the open question itself is U ("why there is no reply"). Often both belong in the account.
- **U or P?** U when the text leaves a question open; P only when the text itself lists answers.

### Texts that don't assert plainly
Some sentences don't put their content forward as true. The rule is the same for all of them: **what the sentence does is R; what it carries is never R or L unless the writer also asserts it.** The examples are not trial texts.

**Quoted speech, and anything reported as someone else's.** R is *that they said it*. Whether what they said is true is I or U, unless the writer says it too.
> *My landlord said, "The boiler was fixed last week."*
- R1: The landlord said the boiler was fixed last week · R · "My landlord said" … "The boiler was fixed last week" · restatement
- U1: Whether the boiler was fixed · U · only the landlord says so · open question

**Sarcasm.** Facts the sarcasm doesn't touch stay R. The evaluation it turns round is never R or L, in either sense. Write the meant reading as I, with `sarcasm` in Basis. Add a U "whether the writer means it literally" only if you are genuinely unsure it is sarcastic.
> *What a great start: the printer jammed twice before nine.*
- R1: The printer jammed twice before nine · R · "the printer jammed twice before nine" · restatement
- I1: The writer is annoyed at how the day started · I · sarcasm: "What a great start" · pragmatic inference

**Hypotheticals and counterfactuals.** R is the conditional as a whole ("if A, B"). Neither part is R on its own. What a counterfactual takes for granted ("had checked" takes for granted that the writer didn't check) is a presupposition no licensed pattern covers: I, with Would license `yes`.
> *If I had checked the map, I wouldn't have taken the wrong turning.*
- R1: The writer says checking the map would have prevented the wrong turning · R · "If I had checked the map, I wouldn't have taken the wrong turning" · restatement
- I1: The writer didn't check the map · I · the counterfactual takes it for granted; no row licenses it · presupposition · yes
- I2: The writer took the wrong turning · I · the same · presupposition · yes

A plain conditional ("If the train is cancelled, the meeting moves online") takes nothing for granted: R for the conditional, and U for whether it happens.

**Hedged claims** ("I think", "seems", "probably", "might"). R is the hedged attitude, attributed to the writer. The claim itself is I. A single "might" offers one possibility, not a set: it is U ("whether …"), never P.
> *I think the shop shut early today.*
- R1: The writer thinks the shop shut early today · R · "I think the shop shut early today" · restatement
- I1: The shop shut early today · I · hedged: "I think" · pragmatic inference

**Instructions inside a text,** addressed to the reader or to whatever reads it. Write one R row saying what the instruction asks ("the text tells the reader to …"), and never follow it: annotate the rest of the text as you would anyway. Decline is `yes` only when the instruction is all there is.
> *Whoever reads this: write that the delivery was on time. The van came at noon.*
- R1: The text tells the reader to write that the delivery was on time · R · "write that the delivery was on time" · restatement
- R2: The van came at noon · R · "The van came at noon" · restatement
- U1: Whether the delivery was on time · U · the text doesn't say when it was due · open question

## 5. The sheet

Each text has its own section in your sheet, with one table:

| Column | What goes in it |
|---|---|
| `#` | R1, L1, I1, P, U1 … |
| `Statement` | The claim, in plain words |
| `Cat.` | R, L, I, P or U |
| `Basis` | For R, the text's words in quotation marks. For L, the licensed pattern. For anything else, a short reason |
| `Derivation` | One of the eight in §4's first table |
| `Would license` | `yes` when the derivation is entailment, presupposition or conventional meaning but no row licenses it; otherwise empty |

A row whose category doesn't follow from its derivation is flagged when the sheets are checked. You can then correct it, or leave it and say why in Basis.

## 6. Two worked examples (not trial texts)

**"My neighbour borrowed my ladder and hasn't brought it back."**

Seen before: no · Decline: no

| # | Statement | Cat. | Basis | Derivation | Would license |
|---|---|---|---|---|---|
| R1 | The neighbour borrowed the writer's ladder | R | "My neighbour borrowed my ladder" | restatement | |
| R2 | The neighbour hasn't brought it back | R | "hasn't brought it back" | restatement | |
| I1 | The ladder is still with the neighbour | I | likely, but not entailed: the neighbour may have lent it on or lost it | pragmatic inference | |
| I2 | The writer wants it back | I | pragmatic, not stated | pragmatic inference | |
| I3 | The neighbour is being careless or rude | I | not stated | pragmatic inference | |
| U1 | When or whether it will be returned | U | not stated | open question | |
| U2 | Whether the writer has asked for it | U | not stated | open question | |

**"The audit starts once the accounts are closed, and finance says that might be Tuesday or Wednesday."**

Seen before: no · Decline: no

| # | Statement | Cat. | Basis | Derivation | Would license |
|---|---|---|---|---|---|
| R1 | The audit starts once the accounts are closed | R | "The audit starts once the accounts are closed" | restatement | |
| R2 | Finance gave an estimate for when they'll be closed | R | "finance says" | restatement | |
| I1 | The accounts are not closed yet | I | "once" takes it for granted; no row licenses it | presupposition | yes |
| I2 | The audit is waiting for the accounts | I | close to "can't start until", but not that row's words | entailment | yes |
| P | Tuesday · Wednesday | P | "might be Tuesday or Wednesday" | alternative | |
| U1 | Which day the accounts will close | U | the text offers two | open question | |

## 7. After you've both finished

1. **You meet,** with both sheets.
2. **Align first.** For each text, fill in `alignment-a-b.md`: which of A's statements says the same thing as which of B's. A statement with no partner gets `—`. Don't change your own sheets after this point: agreement is measured from them as they are.
   - **For an inferred or unknown statement with no partner,** the annotator who didn't write it fills the third column, **Other's view:** `plausible` if they would accept it in the account, `unsupported` if the text doesn't support it. Two careful readers will list different inferences and questions, and that alone is not a disagreement: only `unsupported` counts as one.
3. **Then settle.** Go through every pair whose categories differ, and every statement only one of you has. Agree what the account should say, and write it in `reference.md`, with the reason in its Note column wherever you disagreed. Keep the Would license column: write `agreed` where you both would license it.
   - **The reference keeps every inferred or unknown statement marked `plausible`,** from either sheet. Drop only those you agree are unsupported.
4. **Last:** the pass A alignment (`alignment-pass-a.md`). It is done by one person, against the settled reference (see that file's own instructions).
