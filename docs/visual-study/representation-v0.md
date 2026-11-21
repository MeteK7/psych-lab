# Representation v0, as tested in the study

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
| `elements` | `id`; `kind`: `presence` (something that acts or experiences) · `object` · `place` · `process` · `quantity` · `quality`; `salience`: `primary` · `equal` · `secondary`; `own` (the viewer's own presence, at most one) |
| `statements` | `id`; `predicate` (§3); `args` (element ids); `commitment`; `phases` (when it holds); `basis` (the text span, or the licensed pattern, or the content it came from) |
| `time` | `phases` in order; `repeats` (a cycle) |
| `qualities` | Named, bounded values: `charge` (how much the moment presses on the own presence) · `stillness` · `openness` · `weight`; each 0–1, each `of` an element or the whole |
| `facets` | §4 |
| `hints` | Preferred idioms; reading order |

Words (an element's name, a possibility's wording) are carried as **content keys** beside the representation, never inside it. In the study they are sample text; in an application they are its own content. No typed text enters a figure in the study.

## 3. Predicates (closed list, v0)

| Group | Predicates |
|---|---|
| Place and nearness | `located-in` (a, place) · `near` (a, b) · `apart` (a, b) |
| Movement | `passes` (a, b, mover?): they come close and the mover goes on; the other is the point of reference, and its own motion is a separate `question` (`asks: motion`). Added in v0.1 after review of P1 · `moves` (a, from, to) · `approaches` (a, b) · `leaves` (a, b) |
| Exchange | `sends` (a, item, b) · `receives` (b, item) · `exchange-absent` (kind, a, b): an exchange of this kind did not take place |
| Order and dependency | `precedes` (a, b) · `depends-on` (b, a) · `blocks` (a, b) · `joins` (a, b): a becomes part of b |
| Flow and change | `flows` (a, from, to) · `transforms` (a, aspect, where): a changes in one aspect, at a place · `cycles` (a, through: places) |
| State | `complete` (a) · `pending` (a) · `absent` (a) · `waiting` (a, for b) |
| Felt | `feels` (a, quality): a reported feeling, always attributed to its presence |
| Open | `question` (about, what): `what` is `attention` · `intent` · `cause` · `time` · `whether` · `content` |
| Possible | `alternatives` (question, options): two or more |

## 4. Facets (each optional)

| Facet | Fields | Used for |
|---|---|---|
| `space` | `setting`: `reported` (the text names a place) or `stand-in` (the idiom must supply one, and say so in words); `viewpoints`: an ordered list of stances, `own` · `behind` · `across` · `above` · `outside` | Where things are; where the viewer looks from |
| `dynamics` | `events`: which statements happen, in which phase, in which order; `pace`: `still` · `slow` · `moderate` | What happens over time |
| `field` | `quality`: `clarity` · `density` · `direction` · `agitation`; `source` (an element or a statement); `falloff`: `radial` · `along` · `none`; `resolved` (whether the field settles) | A quality spread over an extent |
| `metaphor` | `frame`: a named source frame; `roles`: frame role → element | A familiar scene standing for the meaning |
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

A claimed implication that matches no row is `inferred`.

## 6. The idiom contract

Every idiom takes a representation, a style pack (the theme, the policy limits) and a frame. It returns:
- a **scene** (or a scene at time t or at viewpoint v, for figures that move);
- the **text alternative**, written from the representation's statements only;
- a **coverage report**: each statement shown, not shown (and why), and each element drawn with the statement or the declared neutral base it stands for;
- its **axis values** (README, five axes).

An idiom may draw nothing that no statement asked for, except a declared neutral base (a ground, a stand-in place), which its coverage report lists as such.
