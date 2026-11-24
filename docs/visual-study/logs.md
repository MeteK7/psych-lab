# Study logs (first slice)

Five logs, as the investigation's §9.1 asks:
1. **Expressiveness:** where v0 couldn't say what a case means. Filled from pass A.
2. **Reuse:** which domains used each term. Filled from pass A.
3. **Policy:** rules that blocked a concept. Filled from passes A and B.
4. **Primitives:** what the resolved frame couldn't carry. Filled from pass B.
5. **Deviations:** hand finishing, by figure. Its source is `pages/lab/study/finish.ts`; summarised in `findings-slice-1.md`.

## 1. Expressiveness log

Each gap gives the cases that hit it, what v0 couldn't say, and a proposed remedy. "Domains" uses P for psychology, E for education, M for planning and S for the stress cases.

| # | Gap | Cases | Domains | Proposed remedy |
|---|---|---|---|---|
| G-01 | A request (something asked for, not yet done) | CS3-1 | P | `requested` (a, act, by b), or `pending` with its requester |
| G-02 | Durations, counts and instants attached to a statement | CS3-2, E-7, M-2, M-5 | P E M | A `when` on every statement (instant, interval, duration, count). The quantities facet can't link a value to a statement |
| G-03 | Movement in time (rescheduled, slipped, late) | CS3-3, M-4, M-8 | P M | `moves` takes a dimension: space or time |
| G-04 | Plural or unnamed presences ("a group", "anyone", "we") | CS3-4, CA-1, CA-4, CA-5, E-4, E-8, M1, M-5 | P E M | `count` on an element (a number, "several", "unspecified") and an unnamed collective |
| G-05 | A stand-in setting asserts a kind of place | P1, and any spatial figure of an unplaced account | P | Stand-ins are a declared neutral base with framing words (as the room's line); the idiom chooses the least specific place that works |
| G-06 | Reactions | CA-1 | P | `reacts` (a, to event) |
| G-07 | A positive exchange (an argument, a call) | CA-2, CA-6 | P | `exchange` (kind, a, b), the positive of `exchange-absent` |
| G-08 | The intensity of an action | CA-2 | P | An `intensity` on any event statement, bounded |
| G-09 | A felt quality reduced to a scalar loses its character ("cold") | CA-3 | P | Felt qualities as a small closed set with a character (cold, heavy, far, tight) as well as a strength; the mapping chooses |
| G-10 | Recurrence, and attending to something | CA-4, S-5, S-6 | P S | `recurs` (event, for a) and `attends` (a, to b) |
| G-11 | Forces and contact | CA-5, E-6 | P E | `force` (a, direction, magnitude) and `contact` (a, b) |
| G-13 | Viewpoint stances are named for a person | E-1, E-2, E-8 | E | Generic stances: `within`, `beside`, `front`, `side`, `above`, `outside`; a person-centred name is the application's word for one of them |
| G-14 | Who may confirm an inference differs by domain | E-1, M1 | E M | Confirmation carries its source: the person, an authority (a curriculum), a record (a plan) |
| G-15 | Quantities drawn as parts assert their sizes | E-3 | E | A `parts` value says equal, unequal or unstated; for unstated, idioms draw parts without measure (a count, not a pie) |
| G-16 | Comparisons and rates | E-4, E-5 | E | `exceeds` (a, b, aspect) and `rate` |
| G-17 | **Causation can only be asked about, never stated** | E-4, E-6, E-8, M-4, S-3 | E M S | `causes` (a, b), with the usual commitment. "So" and "because" become licensed patterns for a reported cause; "after" stays order only |
| G-18 | A possibility set offered by the source text itself | E-5, M-8 | E M | Origin `source` beside `person` and `content` |
| G-19 | Beliefs attributed to someone, and statements the source denies | E-8, S-3, S-6 | E S | `believes` (a, statement), and a sixth commitment, `denied`, drawn in a register of its own, never as established |
| G-20 | Exclusive demand | M-3 | M | `contends` (a, b, for c) |
| G-21 | Something missing *from* a thing | M-7 | M | `absent` (a, from b) |
| G-22 | A felt relation that isn't spatial ("everything feels far away") | S-1 | S | `feels` can take a relation as well as a quality |
| G-23 | Content that is a plain comparison of numbers | S-2 | S | Out of scope: an application should draw a chart |
| G-24 | Counterfactuals | S-3 | S | Out of scope for v0. Their premises are recorded; the counterfactual itself is the writer's view (G-19) |
| G-25 | Too many events for the element budget | S-4 | S | Statements can be grouped, so an idiom can draw a group as one form |
| G-26 | **A contrast ("but", "it's just that") has nowhere to go** | P1, CA-4, M1, M-6, S-6 | P M S | `contrasts` (a, b), licensed by "but": the mapping may use it for emphasis, never to add content |
| G-27 | Part and whole | E-3 | E | `part-of` (a, b) as a v0 predicate |
| G-28 | Growth and persistence of a quantity | M-6 | M | `grows` and `unchanged` |

**Summary:**
- 34 cases, 27 gaps (G-12, a call that ends, folds into G-07).
- Two gaps reach three domains or more and change what can be said: **causation (G-17)** and **contrast (G-26)**. They would be the first additions to v1.
- Three gaps concern commitment itself, not vocabulary: G-14 (who confirms), G-18 (where a set comes from) and G-19 (`denied`, and beliefs). These change the envelope, so they matter more than any single predicate.
- No case needed a predicate that only made sense in one domain's words. The candidates that stay inside one domain (`contends`, flows and cycles, `passes`) are stated without domain words; they are one-domain only because the corpus is small.

## 2. Reuse matrix (pass A)

Which domains used each term. The engine-first rule (investigation §7.2): a term enters the engine only if at least two domains use it.

| Term | P | E | M | S | Engine-first |
|---|---|---|---|---|---|
| `sends` | ● | | ● | ● | yes |
| `exchange-absent` | ● | | ● | | yes |
| `question` (cause) | ● | ● | ● | ● | yes |
| `question` (time) | ● | | ● | | yes |
| `question` (attention) | ● | | | | no: psychology only so far |
| `alternatives` | ● | ● | ● | | yes |
| `moves` | ● | ● | ● | | yes |
| `precedes` | | ● | ● | ● | yes |
| `complete` | ● | | ● | | yes |
| `absent` | | ● | ● | | yes |
| `apart` | ● | | | | no |
| `located-in` | ● | | | | no |
| `feels` | ● | | | ● | personal domains only |
| `passes` | ● | | | | no |
| `depends-on` | | | ● | | no: planning only |
| `flows`, `cycles`, `joins`, `transforms` | | ● | | | no: education only |
| *`causes`* (proposed) | | ● | ● | ● | yes |
| *`contrasts`* (proposed) | ● | | ● | ● | yes |
| *plural presence* (proposed) | ● | ● | ● | | yes |
| *`force` / `contact`* (proposed) | ● | ● | | | yes |
| *`believes` / `denied`* (proposed) | | ● | | ● | yes |
| *`recurs`* (proposed) | ● | | | ● | personal domains only |
| Facet: quantities | ● | ● | ● | ● | yes |
| Facet: dynamics | ● | ● | ● | ● | yes |
| Facet: field | ● | ● | ● | ● | yes |
| Facet: space | ● | ● | | | yes |
| Facet: metaphor | ● | | ● | | yes |

**What the matrix already shows:**
- The facets are shared across domains much more than the predicates are. That supports the envelope-and-facets design over a fixed relationship vocabulary.
- **The twins expose an inconsistency.** "A friend hasn't replied" (CS3-2) and "the supplier hasn't replied" (M-5) have the same structure. In pass A, CS3-2 was written as an absent reply plus a duration, and M-5 as a dependency plus an absent reply. Neither is wrong, but the same structure got two representations, so two figures could differ for no reason. Remedy: a waiting statement (`waiting` (a, for b)) used in both. Pass C's twin test will check this systematically.
- The stress cases are first-person, so they behave like the psychology cases. They test the envelope's limits, not domain neutrality.

## 3. Policy log

Rules that blocked or bent a concept, each with a proposal. None is changed: each change is its own decision.

| # | Rule | What it blocked | Proposal |
|---|---|---|---|
| PL-1 | `visual-policy.md` §3.12: motion "only on a state change"; "Never: looping in illustrations" | The kinetic and field idioms, whose motion **is** the meaning | An addition for **a sequence that depicts**, as the viewpoint move was added: plays once when asked, at most a stated length, can be paused and scrubbed with a native control, never loops, and shows its phases as stills under reduced motion. The study's figures follow this |
| PL-2 | §3.13, the element budget (about seven forms) | P1's five equal possibilities; E1's flow lines; M1's field | A field counts as one form, as a plane does; a possibility set counts as one group, with one purpose, like a spatial view's groups |
| PL-3 | Themes are the app's five areas (`THEMES`, `tokens.css`) | Education and planning cases have no theme of their own; the study borrows `attention` (education) and `recovery` (planning) | A style pack per application (investigation §5.3) |
| PL-4 | Purpose kinds are worded for psychology (`PURPOSE_LABELS`: "Communicates a psychological concept") | Education and planning elements had to be labelled with psychology wording | Purpose kinds come from the style pack |
| PL-5 | §3.4: "Diagrams and instruments are drawn flat" | Nothing: E1's spatial direction is an illustration of a system, not a chart of values | None. Noted because a planning chart in perspective would break it |
| PL-6 | §3.11 and §7: no text from the person in a figure | Nothing in the study (all text is synthetic) | The production decision stays where the investigation put it, after Stage 2 |

## 4. Primitives log (pass B)

Filled from the depth pass: see `findings-slice-1.md` §4.

## 5. Deviation log (pass B)

Generated from `pages/lab/study/finish.ts` and shown in the Lab under each finished figure; summarised in `findings-slice-1.md` §3.

## Slice 2 additions (2026-11-21)

### Expressiveness

| # | Gap | Cases | Domains | Remedy |
|---|---|---|---|---|
| G-29 | **One place above another** ("condenses into clouds" puts them above) can't be said, so every place sits on the ground | E2 | E (and any landscape, building, hierarchy) | A spatial relation `above` (a, b), or a vertical position in the space facet. Hand-fixed in E2-S1 |
| G-30 | **Pass A missed two changes of form** in E2: "falls as rain" and "in rivers" are changes of form as well as movement | E2 | E | Corrected in slice 2 (`s2b`, `s4b`). The second, "rain becomes river water", rests on the conventional meaning of *river*, a borderline implication that should be reviewed |
| G-31 | **Unknown amounts** (how much later, how much taller, how wide a two-day shortfall is) must still be drawn at some size | P4, E3, M3 | P E M | A fixed rule constant, said in the coverage report and never presented as measured. Proper remedy: a declared "unscaled" treatment (a break in the course, an ellipsis) |
| G-32 | **Counts of a repeated act** (two emails) are lost: one mark stands for both | M2 | M | A `count` on event statements (joins G-02) |

### Reuse (slice 2)

| Term | P | E | M | Engine-first |
|---|---|---|---|---|
| `waiting` | ● (P3) | | ● (M1, M2) | yes, now in two domains |
| `shifts` | ● (P4) | | (M-4, not yet drawn) | not yet |
| `exceeds` | | ● (E3) | | not yet |
| `behind` | | | ● (M3) | not yet |
| `transforms` | | ● (E2) | | not yet |
| `reacts`, `contact`, `displaced` | ● | | | psychology only so far |
| plural presence | ● (P5, P6) | | ● (M2) | yes |
| alternatives, origin `source` | | ● (E3) | ● (M3) | yes |

**The twins now share a structure.** P3 ("a friend hasn't replied") and M2 ("the supplier hasn't replied") are both drawn by the same waiting pattern, W, in all three idioms. That closes the inconsistency pass A found. Pass C still has to test it with outside readers.

### Primitives

| # | Gap | Met in | Effect |
|---|---|---|---|
| PR-9 | No organic forms in a spatial scene (a leaf, foliage): only boxes, capsules and beads | E3 | The plants read as lollipops, and smaller leaves (E3-S1) didn't fix it |
| PR-10 | No collision avoidance between things placed by different statements | M2 | "Launch" overlapped the team; moved by hand (M2-S1) |
| PR-11 | Only four poses, all calm. A stumble, a turn of the head or a gesture can't be drawn | P6, P5 | A stumble and laughter are declared not shown. This is honest, but limits what a spatial scene can carry |
| PR-12 | The framing rule ignored a place's height until fixed | E2 | A bug in the study's rule, fixed in the rule itself, not by hand |

### Policy

| # | Rule | What it bent | Proposal |
|---|---|---|---|
| PL-7 | §3.13, the element budget | P6's crowd: twelve figures, fourteen seat blocks | A crowd counts as one group (as PL-2 proposes for possibility sets) |
