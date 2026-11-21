# Measurements, first slice (2026-11-17)

**What was measured:** our work per frame for each of the twelve finished figures while it moves, read from the Lab's own performance overlay (`rendering/frame-stats.ts`). The overlay keeps the last second of motion and leaves out the first two frames of a change. Sequences played from start to end; viewpoints moved to the last stance and back. E1's field is still, so there is nothing to measure.

**How:** headless Microsoft Edge (Playwright) on this machine (Intel HD 530), at device pixel ratios 1, 1.5 and 2, on both backends, against the development server. The script is a scratch tool, not part of the repository.

**Two runs, because the figure component changed:**
- **Run 1** drew with the backends directly. It broke dependency rule 5 (only integration imports a backend), which the full unit suite caught.
- **Run 2** draws through the integration layer's `FrameFigure`, as the parity page does. Here "our work" is composing and resolving the scene on both backends, and painting is the backend's own.
- Run 1's canvas numbers are kept because they include canvas painting.

**What it doesn't show:**
- Frame rates are headless, so they say little.
- Painting outside "our work" (all of SVG in both runs, and canvas in run 2) shows only in the frame rate.
- Nothing was measured on the display itself, nor at 120 Hz or above (budget 4.2 ms).

## Run 2 (current): work per frame, median / max (ms); budget 8.3 ms at 60 Hz

| Figure | Canvas ×1 | Canvas ×1.5 | Canvas ×2 | SVG ×1 | SVG ×1.5 | SVG ×2 |
|---|---|---|---|---|---|---|
| P1 spatial (viewpoint) | 0.6 / 1.0 | 0.6 / 4.5 | 0.5 / 0.9 | 0.5 / 0.8 | 0.4 / 0.8 | 0.5 / 0.7 |
| P1 kinetic | 0.3 / 0.4 | 0.3 / 0.4 | 0.3 / 0.7 | 0.3 / 0.4 | 0.3 / 0.6 | 0.2 / 0.4 |
| P1 field | 0.8 / 1.0 | 0.8 / 2.0 | 0.7 / 1.2 | 0.6 / 1.3 | 0.7 / 0.9 | 0.7 / 1.3 |
| P2 spatial (viewpoint) | 0.6 / 1.5 | 0.7 / 1.7 | 0.7 / 1.5 | 0.5 / 1.4 | 0.5 / 1.4 | 0.5 / 1.3 |
| P2 kinetic | 0.3 / 0.5 | 0.3 / 0.5 | 0.3 / 0.4 | 0.2 / 0.4 | 0.2 / 0.4 | 0.3 / **12.6** (1 frame over) |
| P2 field (viewpoint) | 1.1 / 2.4 | 1.1 / 1.7 | 1.1 / 2.3 | 1.1 / 2.0 | 1.0 / 1.4 | 1.0 / 1.5 |
| E1 spatial (viewpoint) | 1.4 / 2.6 | 1.3 / 1.7 | 1.5 / 2.6 | 1.3 / 2.1 | 1.1 / 1.8 | 1.1 / 1.9 |
| E1 kinetic | 0.5 / 0.7 | 0.5 / 0.7 | 0.5 / 1.4 | 0.5 / 0.7 | 0.4 / 0.7 | 0.5 / 0.7 |
| M1 spatial (viewpoint) | 0.8 / 1.7 | 0.7 / 1.2 | 0.8 / 1.0 | 0.6 / 0.9 | 0.6 / 0.9 | 0.6 / 1.0 |
| M1 kinetic | 0.2 / 0.5 | 0.2 / 0.3 | 0.2 / 0.3 | 0.2 / 0.3 | 0.2 / 0.3 | 0.2 / 0.3 |
| M1 field | 0.4 / 0.6 | 0.4 / 0.7 | 0.4 / 0.7 | 0.4 / 0.5 | 0.4 / 0.6 | 0.4 / 0.6 |

## Run 1: canvas, with its painting included, median / max (ms)

| Figure | ×1 | ×1.5 | ×2 |
|---|---|---|---|
| P1 spatial | 0.8 / 5.7 | 0.9 / 7.7 | 0.9 / 6.4 |
| P2 field | 1.5 / 3.9 | 1.9 / 2.6 | 1.6 / 2.1 |
| E1 spatial | **3.0** / 3.9 | 2.9 / 3.8 | **3.4** / 4.4 |
| Every other figure | 0.4–1.1 median, at most 4.8 | | |

The watchdog never dropped a figure in either run: all stayed in the full tier.

## What this says, and what it doesn't

- **Within budget.** Composing and resolving every figure costs at most 1.5 ms (median) at any ratio, on either backend.
- **Canvas painting adds about as much again.** Run 1's heaviest figure is E1's spatial figure, at 3.0–3.4 ms with painting: a tube of about 110 capsules with beads, composed again every frame.
- **Single frames come close to the budget, or pass it.** P1's spatial figure on canvas reached 7.7 ms in one frame in run 1. P2's kinetic figure on SVG at ×2 reached 12.6 ms once in run 2. Both are single frames with medians under 1 ms, most likely the first frame at a new size or a garbage collection; the watchdog, which looks at a second of motion, did not react. At 120 Hz such frames, and E1's median with painting, would not fit.
- **Compared with existing figures** (investigation §8.1: at most 0.5 ms SVG and 2.4 ms canvas; the room 0.9–2.0 ms): the same range. E1's spatial figure with its painting is the heaviest yet.
- **Still unknown** (investigation §8.2):
  - placement from relations (the rules place by fixed patterns, so no placement method was built)
  - compositions of 50 to 200 elements
  - fields regenerated every frame at large sizes (P1's field reveals lines computed once, which is cheap)
  - memory over many recompositions
  - bundle size

## Slice 2 (2026-11-21): the 22 moving new figures

Same method as run 2 (our work: composing and resolving; painting is the backend's). Every figure on both backends at ratios 1, 1.5 and 2: 132 measurements. E2's and P6's fields are still.

| Figure | Highest median (ms) | Highest single frame (ms) |
|---|---|---|
| **P6 spatial** (12 standing people, 18 seat blocks: the crowd probe) | **2.4** (canvas ×1) | **5.4** (canvas ×1) |
| P5 spatial (meeting room, six seated people) | 1.0 | 1.9 |
| E2 spatial, M2 spatial | 0.9 | 2.0 |
| Every other new figure | 0.7 or less | 2.7 or less |

- **The watchdog never dropped a figure,** and no frame went over the 8.3 ms budget.
- **The crowd is the heaviest composition so far, and still well within budget:** a median of 2.4 ms on canvas, against 1.4–1.5 ms for E1's tube. My estimate, from comparing P6 with P1's two-person scene, not a measured fit: the cost grows by about 0.15 ms per standing person.
- **Measured here, unknown before:** a composition of roughly 150 elements (P6). Fifty to two hundred elements was left unknown in §8.2.
- **Still unknown:** canvas painting cost for the crowd (it is outside "our work" here), display-paced frame rates, and 120 Hz.
