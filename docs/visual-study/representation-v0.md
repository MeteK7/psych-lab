# Representation v0.2, as tested in the study

> **v0.2 (revision 5, 2026-11-22):** the predicate list below now matches the study code (`representation.ts`), including what slices 2 and revision 4 added; `form` is new (§3, §7); `place` is open (§4); one licensed pattern is added, under review (§5, L-form). v0 and v0.1 are as the findings of slices 1 and 2 describe them.

This is the contract the study tests: what an application hands the engine, before any engine version exists. It is the investigation's §4 made specific enough to write 34 cases in. Every term is defined without a domain word. The study code mirrors it in `pages/lab/study/representation.ts`.

## 1. Commitment

Every statement carries exactly one commitment. The names are about a statement's relation to the source text, so they mean the same thing in every domain.

| Level | Meaning | May be drawn as |
|---|---|---|
| `reported` | The source asserts it. In a person's account, the person reported it; in a textbook, the text asserts it; in a plan, the plan commits to it | Established |
| `implied` | It follows from the language by a licensed pattern (§5) | Established |
| `inferred` | Added by an interpreter from pragmatics or world knowledge | Not drawn. Put to the person as a question; drawn only once confirmed, and then as `reported` with `confirmed: true` |
| `possible` | Compatible with the account and not asserted. Only as a set of two or more, from the person or from reviewed content | The possible register: equal weight, none preferred |
| `unknown` | A question the account raises and leaves open | The open register: deliberately unresolved, never filled in |

**The registers are the engine's rule:** an idiom draws `reported` and `implied` statements as established, `possible` sets as possible, `unknown` statements as open, and `inferred` statements not at all. The study's spec checks this on every figure.

## 2. The envelope

| Part | Fields |
|---|---|
| `elements` | `id`; `kind`: `presence` (something that acts or experiences) · `object` · `place` · `process` · `quantity` · `quality`; `salience`: `primary` · `equal` · `secondary`; `own` (the viewer's own presence, at most one); `count` (a plural presence: a number, `several` or `many`) |
| `statements` | `id`; `predicate` (§3); `args` (element ids); `commitment`; `phases` (when it holds); `basis` (the text span, or the licensed pattern, or the content it came from) |
| `time` | `phases` in order; `repeats` (a cycle) |
| `qualities` | Named, bounded values: `charge` (how much the moment presses on the own presence) · `stillness` · `openness` · `weight`; each 0–1, each `of` an element or the whole |
| `facets` | §4 |
| `hints` | Preferred idioms; reading order |

Words (an element's name, a possibility's wording) are carried as **content keys** beside the representation, never inside it. In the study they are sample text; in an application they are its own content. No typed text enters a figure in the study.

## 3. Predicates (closed list, v0.2)

Each predicate's arguments are element ids unless said otherwise. This is the list the study code accepts (`representation.ts`).

| Group | Predicates |
|---|---|
| Place and nearness | `located-in` (what, place, alone?) · `apart` (a, b) · `above` (a, b): a is above b (revision 4) |
| Movement | `passes` (a, b, mover?): they come close and the mover goes on; the other is the point of reference, and its own motion is a separate `question` (`asks: motion`) (v0.1) · `flows` (what, from, to): what goes from one place to another |
| Contact and force | `contact` (a, b): a touches or holds onto b · `displaced` (what, by): what is moved off its place by a force, not of its own will |
| Exchange | `sends` (from, item, to) · `receives` (who, item) · `holds` (who, what) · `exchange-absent` (kind, from, to): an exchange of this kind did not take place |
| Order and dependency | `precedes` (a, b) · `depends-on` (what, on) · `joins` (what, into, at): what becomes part of into, at a place · `part-of` (part, whole) |
| Flow and change | `transforms` (what, from, to, at): what changes from one state to another, at a place · `cycles` (what, through: places) |
| Time and amount | `shifts` (what, by?, later): what's place in time moves later or earlier; the amount may be unknown · `exceeds` (a, b, aspect): a exceeds b in one aspect · `behind` (what, amount): what is behind its plan by an amount, in words |
| State | `complete` (what) · `absent` (what) · `waiting` (what, for) |
| Felt and reaction | `feels` (who, charge 0–1): a reported feeling, always attributed to its presence · `reacts` (who, to: a statement, kind: `laughter` or `none`) |
| Form (v0.2) | `form` (what, feature): what the thing's form is, as the text gives it (§7) |
| Open | `question` (about, asks): `asks` is `attention` · `whether` · `cause` · `time` · `intent` · `setting` · `fate` · `motion` |
| Possible | `alternatives` (question, options, origin): two or more |
| Inferred only | `notices`, `expects`, `intends`, `releases`, `late`: an interpreter may propose them; they appear only as `inferred` statements, and no idiom draws them |

## 4. Facets (each optional)

| Facet | Fields | Used for |
|---|---|---|
| `space` | `setting`: `reported` (the text names a place) or `stand-in` (the idiom must supply one, and say so in words); `place` (v0.2: open): the kind of place, in a word (`home`, `ground`, …); `viewpoints`: an ordered list of stances, `own` · `behind` · `across` · `outside` · `within` · `above` · `front` · `side` | Where things are; where the viewer looks from |
| `dynamics` | `events`: which statements happen, in which phase, in which order; `pace`: `still` · `slow` · `moderate` | What happens over time |
| `field` | `quality`: `clarity` · `density` · `agitation`; `source` (an element or a statement); `evolves` (whether it changes over time) | A quality spread over an extent |
| `metaphor` | `frame`: `path`; `stations` (elements along the way); `gate` (what blocks it, if anything) | A familiar scene standing for the meaning |
| `quantities` | `scale`, `value`, `of` | Counts and proportions |

**Metaphor frames in v0:** `path` (roles: traveller, way, station, obstacle, gate), `ripple` (roles: source, surface), `terrain` (roles: ground, rise, crossing). Every other frame is logged as a gap when a case needs one.

## 5. Licensed patterns for `implied` (v0, to be reviewed)

| Pattern | Licenses |
|---|---|
| "X passed / walked past Y" | X and Y came close and continued (`passes`) |
| "X didn't do Z" | Z did not take place, as reported (`exchange-absent` or `absent`) |
| "but" | The writer marks a contrast between the clauses. Its content is not licensed |
| "X can't start until Y" | `depends-on` (X, Y), and while Y is `absent`, X is `waiting` for Y |
| "X hasn't said when" | `question` (time) |
| "X is finished / done" | `complete` (X) |
| "returns to" | the movement closes a cycle (`cycles`) |
| "takes up / picks up" | `joins` (the taken thing, the taker) |
| "it felt …" | `feels` (the writer, the quality), attributed |
| **L-form** (v0.2, under review): a noun whose ordinary sense fixes a shape ("a ball", "a box", "a ramp") | `form` (the thing, the feature): `round`, `block`, `slope` … Only the shape the noun itself fixes, never size, colour or material. Borderline like OI-8: to be reviewed with the other licensed patterns |

A claimed implication that matches no row is `inferred`.

## 6. The idiom contract

Every idiom takes a representation, a style pack (the theme, the policy limits) and a frame. It returns:
- a **scene** (or a scene at time t or at viewpoint v, for figures that move);
- the **text alternative**, written from the representation's statements only;
- a **coverage report**: each statement shown, not shown (and why), and each element drawn with the statement or the declared neutral base it stands for;
- its **axis values** (README, five axes).

An idiom may draw nothing that no statement asked for, except a declared neutral base (a ground, a stand-in place), which its coverage report lists as such.

**Revision 5:** an idiom that has no pattern able to draw a representation refuses, and says what each pattern lacked. It never draws a figure written for another case.

**Revision 7:** before refusing, an idiom tries composition: one general pattern draws what it can, and small additions draw each remaining statement onto what it placed. A thing it adds is placed for room, which asserts no nearness, and the coverage says so. A pattern that fails on a case is refused, the failure named.

## 7. Form (v0.2)

A `form` statement says what shape a thing has, with a commitment and a basis like any other statement. Idioms draw a thing's form only from these statements, never from its name.

- **Features the study kit draws:** `round`, `block`, `slope`, `upright`, `flat`, `long`.
- **Open:** a representation may give any other feature. An idiom draws a thing whose feature it doesn't know, or whose form isn't given, as the **neutral form**, and its coverage says so.
- **One feature per statement.** A thing may have more than one.
- **Not size, colour or material.** Those aren't form, and v0.2 has no place for them.
