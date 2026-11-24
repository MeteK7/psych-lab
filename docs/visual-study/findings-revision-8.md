# Findings, rules revision 8: patterns that know what they draw (2026-11-22)

> **Status: complete.**
> - **Where it stopped:** work stopped once, as the plan requires (amendment 3), when a structural need I wrote would have refused P4. You then approved a narrower need for `pathScene` and "a single `above`" for motion (§4).
> - **The probe** now finds **no failure**.
> - **Accepted outcomes are unchanged:** the 128 pins, the corpus choices and the drift check all pass.
> - **Unchanged elsewhere:** nothing in `shared/visual/`, an exercise or a policy document changed, and no case was edited.

## 1. What was done

**Lists** (`idioms/draws.ts`):
- Every pattern in the three idioms, 38 entries in all, declares `draws`: the kinds of statement its coverage accounts for.
- Patterns also declare `single`: the kinds they account for only once.
- **How they were read:** from each pattern's code (which statements it takes, and whether with `[0]`), and from the coverage of its accepted cases.
- **The general patterns** (motion, dependency, felt) moved onto the same mechanism. Their own "other kinds" checks were removed, and only their structural needs stayed in code.

**The rule, applied to every pattern (amendment 6):**
- **Any drawable statement of a kind outside `draws` is a declared need:** an established statement, an open question (by what it asks; `question:*` where a pattern accounts for every question), or a possibility set.
- **A repeat of a kind in `single`** is a declared need.
- **Inferred statements never count.**

**The registry** (`registry.ts`):
- It adds those needs to every pattern's own.
- A pattern whose needs hold but which fails is still refused with the failure named (R7-3).
- Its choice now also records such failures, so a failure can't hide behind another pattern that draws the case.

**Checks** (`revision-8.spec.ts`):
- **Drift:** each accepted case's pattern lists every kind its coverage accounts for, and its lists give no need for its own case. Passes.
- **Hand-written expectations (amendment 4):** 35, one per pattern and idiom. Each pattern must draw its own case and must refuse that case with a kind it doesn't draw, or a second one of a kind it draws once. All pass.
- **The probe (amendment 1):**
  - It runs over the 19 accepted cases (the corpus and U1–U7).
  - Each of the 26 kinds that can be established, the 8 kinds of question and possibility sets is added in each variant it allows: fresh elements; reusing the case's own elements; one element in every role (for example a cycle through one place, or a flow from a place to itself).
  - Targeted repeats cover `exceeds`, `cycles`, `flows`, `depends-on`, `question:cause` and `alternatives`.
  - Everything is drawn in all three idioms.

## 2. The probe's counts (amendment 2)

| Outcome | At the stop | Final |
|---|---|---|
| **shown:** drawn, the added statement in the coverage's shown list | 687 | 687 |
| **declared not shown:** drawn, the statement in the not-shown list | 360 | 360 |
| **refused by declared need** | 4,350 | 4,368 |
| **failed** | 18 | **0** |

The probe did not pass by refusing everything: 1,047 results were drawn with the added statement accounted for. The two new needs moved exactly the 18 failures into declared refusals; nothing drawn before is refused now.

## 3. Breakages found, and how each was handled (amendment 3)

**The first run** found 46 failures and one gap in the probe: `reacts` was missing from its shapes and is now included. Each failure was classified before any need was declared.

| Pattern | Breaks on | Class | Handled |
|---|---|---|---|
| `jostled` (kinetic) | an attention question about a third thing (P6 + one) | (a) shape: it takes attention questions only about the one held and the group | Declared need. Refuses no accepted case |
| `cycle` (kinetic) | a fate question about something other than what joins (E2 + one) | (a) shape: its fate drawing is the joined thing past the last place | Declared need. Refuses no accepted case |
| motion and carrying | an `above` not between the route's start and end (U1, U3, U6 + one) | (a) shape: height is drawn only for the route | Declared need. Refuses no accepted case |
| `felt` | the viewer placed twice (U2 + one) | (a) shape: one place for the viewer | Declared need. Refuses no accepted case (U5 places the viewer once) |
| `pathScene` (spatial) | waiting, dependence or an absent exchange in a case with no sending (P4, M3 + one) | (a) shape: it draws waiting and dependence only within a sending | **Stopped.** The need as I wrote it ("only with a sending") refuses **P4**, which has an absent exchange and no sending. Withdrawn; 15 failures remain |

**The 18 failures left:**
- **`pathScene`, 15:** P4 + `depends-on` or `waiting`; M3 + `exchange-absent`, `depends-on` or `waiting`, each in three variants.
- **motion, 3:** U1 + a second `above` between its route's start and end (the "reuse" variant repeats U1's own), in each idiom.

The motion case is class (a): motion takes one `above`. I haven't declared it, because the work stopped first.

## 4. Decisions for you
1. **`pathScene`:** a narrower need would leave P4 drawn: waiting and dependence only with a sending, and an absent exchange only with a sending or a shift. That is still class (a), written from the shape, and on my reading it refuses neither P4 nor M3. Should I declare it?
2. **motion:** declare "a single `above`" (class a; U1 has one)?
3. **Whether the probe should keep writing its counts** to `C:\Projects\new_project\probe-r8.json`, outside the repository, as it does now.

Until you decide, the probe's "finds no failure" check fails, and the failures are recorded here and in `open-issues.md` (OI-39).

## 5. The limit of this work
A list says what a pattern accounts for, not that its figure is good for a case it wasn't written for. "Declared not shown" is an honest account, not a drawing.
