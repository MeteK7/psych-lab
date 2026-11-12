import { rng } from '../../shared/visual/generation/random';
import type { FrameItem, ResolvedFrame } from '../../shared/visual/integration/frame-figure';
import type { StimulusSpec } from '../../shared/visual/integration/stimulus-surface';
import { resolveStyle } from '../../shared/visual/styling/resolve';

/**
 * The Visual Lab's reference stimulus (milestone M6): a fixation cross, and a mark that appears at
 * a seeded place for each of four events, two counted in frames and two in milliseconds, so the
 * timing log shows both units side by side. The frame-based events are designed for one refresh
 * rate, chosen in the Lab, so the check's refusal can be seen on a display that runs at another.
 * Participants never see it.
 */
export function referenceStimulus(designHz: number): StimulusSpec {
  const frames = (s: number) => Math.round(s * designHz);
  const seed = 'lab-stimulus-1';
  const events = [
    { id: 'frames-1', at: { frames: frames(0.5) }, for: { frames: frames(0.1) } },
    { id: 'ms-1', at: { ms: 1250 }, for: { ms: 100 } },
    { id: 'frames-2', at: { frames: frames(2) }, for: { frames: frames(0.05) } },
    { id: 'ms-2', at: { ms: 2750 }, for: { ms: 50 } },
  ];
  // Each event's place, from the seed: the same on every run.
  const random = rng(seed);
  const places = new Map(events.map((e) => [e.id, [80 + random() * 320, 40 + random() * 120] as const]));
  const cross = resolveStyle({ role: 'context' });
  const mark = resolveStyle({ role: 'subject', material: 'solid' });
  return {
    id: 'reference.stimulus.marks',
    version: 1,
    seed,
    params: { designHz },
    design: { refreshHz: designHz },
    events,
    durationMs: 3500,
    draw(moment): ResolvedFrame {
      const items: FrameItem[] = [
        { kind: 'shape', id: 'cross-h', layer: 'fixation', shape: { type: 'line', x1: 232, y1: 100, x2: 248, y2: 100 }, paint: cross },
        { kind: 'shape', id: 'cross-v', layer: 'fixation', shape: { type: 'line', x1: 240, y1: 92, x2: 240, y2: 108 }, paint: cross },
      ];
      for (const id of moment.active) {
        const [cx, cy] = places.get(id)!;
        items.push({ kind: 'shape', id: `mark-${id}`, layer: 'marks', shape: { type: 'circle', cx, cy, r: 12 }, paint: mark });
      }
      return { width: 480, height: 200, theme: 'attention', items };
    },
  };
}
