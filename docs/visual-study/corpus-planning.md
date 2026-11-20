# Corpus: project management (8 cases)

Pass A. Here "reported" means the text, or the plan it comes from, commits to it.

### M1 ◆ M-1 · build blocked by a licence
> "Design is finished, so build is next. But build can't start until the software licence arrives, and procurement hasn't said when that will be."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Design is finished | R | |
| R2 | Build comes next after design | R | "so build is next" |
| R3 | Build can't start until the licence arrives | R | |
| R4 | Procurement hasn't said when it will arrive | R | |
| L1 | The licence hasn't arrived | L | "can't start until … arrives" |
| L2 | Build is waiting for the licence | L | same pattern |
| L3 | The writer sets the waiting against build being next | L | "But" |
| I1 | The licence will come late | I | |
| I2 | Procurement is at fault | I | |
| U1 | When the licence will arrive | U | stated as not said |
| U2 | Whether procurement knows | U | |

**Representation**
- Elements: `design` process · `build` process, primary · `licence` object · `procurement` presence, secondary
- Statements:
  - `s1` complete(design) · R
  - `s2` precedes(design, build) · R
  - `s3` depends-on(build, licence) · R
  - `s4` absent(licence) · L
  - `s5` waiting(build, licence) · L
  - `s6` exchange-absent(date, procurement, team) · R
  - `q1` question(licence, time) · U
- Time: now (design done, build waiting) → an unknown later (licence arrives, build starts)
- Facets: relations · dynamics (a held wait) · metaphor (`path`: way = the plan, stations = design and build, gate = licence) · field (density of work held, from s5, at the gate)

**Gaps:** a first draft wrote this field as "pressure", which is an inference (I1, or stress the text doesn't report); "waiting" licenses only work that is held. That was caught on rereading, not by a rule, and is exactly what Stage 1b's over-commitment measure is for. The team, who wait, appears only as the receiver of an absent exchange; v0 has no way to name an unnamed "we" (G-04). "But" licenses a contrast that v0 can't carry (G-26). Without R2, the text would not license any order between design and build, and an idiom drawing them left to right would assert one: the study changed the text to include it.

### M-2 · three workstreams converging (twin)
> "The app, the website and the training material all need to be ready for the launch on 3 March."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The launch is on 3 March | R | |
| R2 | The launch depends on the app, the website and the training material being ready | R | |
| U1 | How ready each is now | U | |

**Representation**
- Elements: `app`, `website`, `training` process · `launch` process (a date)
- Statements: `s1`–`s3` depends-on(launch, each) R · `q1`–`q3` question(each, state) U
- Facets: relations · dynamics (toward a fixed date)

**Gaps:** none in v0, except a fixed date as a point in time (G-02).

### M-3 · one person needed twice
> "Ana is needed for both the data migration and the customer workshop next week, and she can't do both at once."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Both pieces of work need Ana next week | R | |
| R2 | She can't do both at once | R | |
| U1 | Which will have her | U | |

**Representation**
- Elements: `ana` presence · `migration`, `workshop` process
- Statements: `s1` depends-on(migration, ana) R · `s2` depends-on(workshop, ana) R · `s3` contends(migration, workshop, ana) R · `q1` question(s3, outcome) U
- Facets: relations

**Gaps:** `contends` (exclusive demand) isn't in v0 (G-20).

### M-4 · a slip and its knock-on
> "Testing slipped by a week, so the release moves a week too, and the marketing campaign after it."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Testing slipped by a week | R | |
| R2 | The release moves by a week | R | |
| R3 | The campaign moves too | R | |
| R4 | R1 is the reason for R2 and R3 | R | "so" |

**Representation**
- Elements: `testing`, `release`, `campaign` process
- Statements: `s1` moves(testing, +1 week, time) R · `s2` moves(release, +1 week, time) R · `s3` moves(campaign, time) R · `s4` causes(s1, s2 + s3) R · `s5` precedes(release, campaign) R
- Facets: dynamics (propagation)

**Gaps:** a move in time (G-03); causation (G-17).

### M-5 · a supplier who hasn't replied (twin)
> "The launch date depends on the supplier confirming the parts, and they haven't replied to our last two emails."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The launch date depends on the supplier's confirmation | R | |
| R2 | They haven't replied to the last two emails | R | |
| L1 | The team sent two emails | L | presupposition |
| U1 | Why they haven't replied | U | |
| U2 | When they will confirm | U | |

**Representation**
- Elements: `launch` process · `supplier` presence · `confirmation` object
- Statements: `s1` depends-on(launch, confirmation) R · `s2` sends(team, email × 2, supplier) L · `s3` exchange-absent(reply, supplier, team) R · `q1` question(s3, cause) U · `q2` question(confirmation, time) U
- Facets: relations · dynamics (a held wait)

**Gaps:** a count of absent replies (G-02); "our" as an unnamed team (G-04).

### M-6 · scope added mid-way
> "Halfway through the project, the client added two new reports to the scope, but the deadline stayed the same."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Halfway through, the client added two reports | R | |
| R2 | The deadline stayed the same | R | |
| L1 | The writer sets the unchanged deadline against the added work | L | "but" |
| I1 | The team will be under pressure | I | |

**Representation**
- Elements: `scope` quantity · `deadline` process (a date) · `client` presence
- Statements: `s1` grows(scope, +2) at halfway R · `s2` unchanged(deadline) R
- Time: start → halfway → deadline
- Facets: quantities · dynamics

**Gaps:** growth of a quantity and persistence (`grows`, `unchanged`) aren't predicates (G-28); the contrast (G-26).

### M-7 · a handoff that lost its context
> "When Sam handed the project over to Lee, the notes didn't include why the earlier design was rejected."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Sam handed the project to Lee | R | |
| R2 | The notes didn't include the reason the earlier design was rejected | R | |
| L1 | An earlier design was rejected | L | presupposition |
| U1 | Whether Lee knows the reason some other way | U | |

**Representation**
- Elements: `sam`, `lee` presence · `project` object · `notes` object · `reason` object
- Statements: `s1` sends(sam, project, lee) R · `s2` absent(reason, from notes) R · `q1` question(lee, knows reason) U
- Facets: relations · dynamics (a handover)

**Gaps:** something missing *from* a thing that travels (G-21).

### M-8 · a delay with three possible causes (twin of P1)
> "The build is two days late. It could be the flaky test server, the new library upgrade, or just that two people were off sick."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The build is two days late | R | |
| P | test server · library upgrade · two people off sick | P | offered by the text |
| U1 | Which it is | U | |

**Representation**
- Elements: `build` process
- Statements: `s1` late(build, 2 days) R · `q1` question(s1, cause) U · `a1` alternatives(q1, 3, origin: source) P
- Facets: dynamics · quantities

**Gaps:** origin of a set from the source (G-18); lateness against a plan (G-03).
