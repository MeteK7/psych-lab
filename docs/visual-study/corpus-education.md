# Corpus: education (8 cases)

Pass A. The same notation as `corpus-psychology.md`. Here "reported" means the source text asserts it. The texts are written for the study as a teaching text might put them, and the accounts hold to what each text says, not to what the subject knows. Where the two differ, the difference is the finding.

### E1 ◆ E-1 · circulation between heart and lungs
> "The right side of the heart pumps blood to the lungs, where it takes up oxygen. It returns to the left side, which pumps it out to the body and back."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The right side pumps blood to the lungs | R | |
| R2 | In the lungs the blood takes up oxygen | R | |
| R3 | The blood returns to the left side | R | |
| R4 | The left side pumps it out to the body | R | |
| R5 | And back to the right side | R | "and back" |
| L1 | The movement is a cycle | L | "returns to", "and back" |
| L2 | Oxygen becomes part of what the blood carries | L | "takes up" |
| I1 | The body takes the oxygen from the blood | I | **true, and not in the text** |
| I2 | The two sides' blood doesn't mix | I | not in the text |
| U1 | What happens to the oxygen in the body | U | the text is silent |

**Representation**
- Elements: `right` place · `lungs` place · `left` place · `body` place · `blood` process (flows) · `oxygen` object
- Statements:
  - `s1` flows(blood, right, lungs) · R
  - `s2` joins(oxygen, blood) at lungs · R
  - `s3` flows(blood, lungs, left) · R
  - `s4` flows(blood, left, body) · R
  - `s5` flows(blood, body, right) · R
  - `s6` cycles(blood, right → lungs → left → body) · L
  - `q1` question(oxygen, fate at body) · U
- Time: four phases, repeating
- Facets: space (reported: four places; viewpoints front, side) · dynamics (s1–s5 in order; moderate; repeats) · field (density of oxygen, from s2, along the flow)

**Gaps:** viewpoint stances are named for a person (own, behind, across) and don't fit a system seen from the front or side (G-13). A cycle forces the figure to say what happens to the oxygen in the body: drawing it kept or lost asserts something the text didn't say, so the idiom must carry the oxygen on in the open register (rule, idioms.md). Who may confirm I1 differs by domain: a curriculum, not the reader (G-14).

### E-2 · the water cycle
> "Water evaporates from the sea, condenses into clouds, falls as rain, and flows back to the sea in rivers."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Water evaporates from the sea | R | |
| R2 | It condenses into clouds | R | |
| R3 | It falls as rain | R | |
| R4 | It flows back to the sea in rivers | R | |
| L1 | The rain falls on land | L | presupposition of "flows back … in rivers" |
| L2 | It is a cycle | L | "back to the sea" |
| I1 | The sun drives it | I | |

**Representation**
- Elements: `water` process · `sea` place · `sky` place · `land` place
- Statements: `s1` transforms(water, form: liquid → vapour, sea) R · `s2` transforms(water, form: vapour → cloud, sky) R · `s3` moves(water, sky → land) R · `s4` flows(water, land, sea) R · `s5` cycles(water) L
- Facets: space (reported; side) · dynamics (repeats)

**Gaps:** viewpoint stances again (G-13).

### E-3 · a fraction
> "Three of the five slices of the pizza have been eaten; two are left."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The pizza had five slices | R | |
| R2 | Three have been eaten | R | |
| R3 | Two are left | R | |
| I1 | The slices are equal | I | fractions assume it; the text doesn't say |

**Representation**
- Elements: `pizza` object · `slice` object, plural (five)
- Statements: `s1` part-of(slice × 5, pizza) R · `s2` absent(slice × 3) R, after · `s3` present(slice × 2) R, after
- Time: before → after
- Facets: quantities (5 parts; 3 gone, 2 left)

**Gaps:** any drawing of parts gives them sizes, so it asserts equal or unequal slices (G-15). The unit (a whole of countable parts) is in quantities but `part-of` isn't in v0's predicate list (G-27).

### E-4 · natural selection
> "In a population of moths, darker moths were eaten less often on soot-covered trees, so over many generations most moths became dark."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | On soot-covered trees, darker moths were eaten less often | R | |
| R2 | Over many generations most moths became dark | R | |
| R3 | The text gives R1 as the reason for R2 | R | "so": the source asserts a cause |
| I1 | Individual moths changed colour | I | the common misreading; the text says the population changed |

**Representation**
- Elements: `population` presence, plural · `dark` quantity · `light` quantity · `trees` place (quality: soot)
- Statements: `s1` rate(eaten, dark) < rate(eaten, light) R · `s2` proportion(dark) rises over generations R · `s3` causes(s1, s2) R
- Time: many generations
- Facets: quantities (proportion over time) · dynamics (slow)

**Gaps:** comparative rates (G-16); causation can't be stated in v0, only asked about (G-17). "So" needs a licensed pattern.

### E-5 · one observation, two hypotheses (twin of P1)
> "The plant by the window grew taller than the plant in the corner. It might be the extra light, or it might be that the window plant was watered more."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The window plant grew taller than the corner plant | R | |
| P | extra light · more water | P | **offered by the text itself** |
| U1 | Which it is | U | |

**Representation**
- Elements: `window-plant` object · `corner-plant` object · `window` place · `corner` place
- Statements: `s1` exceeds(window-plant, corner-plant, height) R · `q1` question(s1, cause) U · `a1` alternatives(q1, 2, origin: source) P
- Facets: quantities (height) · relations

**Gaps:** a possibility set can come from the source text, which v0 doesn't list as an origin (G-18). Comparison (`exceeds`) isn't in v0 (G-16).

### E-6 · forces in balance
> "The weight of the bridge and its traffic pushes down; the two towers push up just as much, so the bridge stays still."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | The weight pushes down | R | |
| R2 | The towers push up just as much | R | |
| R3 | The bridge stays still | R | |
| R4 | It stays still because the pushes are equal | R | "so" |

**Representation**
- Elements: `bridge` object · `load` quantity · `towers` object, plural (two)
- Statements: `s1` force(load, down, m) R · `s2` force(towers, up, m) R · `s3` causes(s1 + s2, stillness of bridge) R
- Qualities: stillness 1, of bridge
- Facets: dynamics (balanced forces; still)

**Gaps:** forces (G-11); causation (G-17).

### E-7 · several causes of one event (twin)
> "The First World War began after decades of rivalry between alliances, an arms race, and the assassination of Archduke Franz Ferdinand in 1914."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | There were decades of rivalry between alliances | R | |
| R2 | There was an arms race | R | |
| R3 | The Archduke was assassinated in 1914 | R | |
| R4 | The war began after these | R | |
| I1 | They caused the war | I | **"after" licenses order only** |

**Representation**
- Elements: `rivalry` process (decades) · `arms-race` process · `assassination` process (an instant, 1914) · `war` process
- Statements: `s1`–`s3` precedes(each, war) R · `i1` causes(s1–s3, war) I, not drawn
- Time: decades → 1914 → the war
- Facets: dynamics (long processes and one instant)

**Gaps:** long processes and an instant on one time scale (G-02).

### E-8 · a misconception and the established account
> "Many people think summer is warmer because the Earth is closer to the Sun then. In fact it's because of the tilt of the Earth's axis, which makes sunlight fall more directly on one hemisphere."

| # | Statement | Cat. | Basis |
|---|---|---|---|
| R1 | Many people believe summer is warmer because the Earth is closer to the Sun | R | a belief, attributed |
| R2 | The source denies that belief | R | "in fact" |
| R3 | Summer is warmer because of the axis's tilt | R | |
| R4 | The tilt makes sunlight fall more directly on one hemisphere | R | |

**Representation**
- Elements: `earth` object · `sun` object · `axis` object · `hemisphere` place · `people` presence, plural
- Statements: `s1` believes(people, b1) R · `b1` causes(nearness, warmth) **denied** · `s2` causes(tilt, warmth) R · `s3` directness(sunlight, hemisphere) R
- Facets: space (side, above) · relations

**Gaps:** a statement the source says is false needs its own commitment, `denied` (G-19). A belief attributed to someone (`believes`) is missing too (G-19).
