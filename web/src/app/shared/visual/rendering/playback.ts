import type { DrawPaint, FrameItem, ResolvedFrame, ResolvedTimeline, ResolvedTrack } from './frame';
import { lerp, progress } from './timing';
import { canMorph, tweenShape } from './tween';

/**
 * S7 Rendering: a whole timeline at one moment (milestone M6). The frame holds the final state;
 * this says how each item is drawn `ms` after the change began, from the timing core, exactly as the
 * SVG backend plays it with the Web Animations API and its shape loop:
 * - a track holds its start value during its delay (`fill: backwards`); afterwards the frame shows
 * - opacity multiplies; `offsetY` and `translate` move the item; `reveal` draws a fraction of it
 *   along its direction, through a band like the SVG mask
 * - a `paint` track paints flat colours between its two paints (as SVG's `fill`/`stroke` keyframes
 *   do, over a gradient), a fraction `f` of the way
 * - a `shape` track morphs, or crossfades with a copy of the old drawing just above the item
 * - an `exit` track draws the departing item just below `under` (on top when null), fading or
 *   taken back, and nothing once it has left
 * Pure: the canvas backend draws what this gives, every frame.
 */

export interface SampledItem {
  item: FrameItem;
  /** Multiplies the item's own colours: 1 is as drawn. */
  opacity: number;
  /** In scene units, added to the item's place. */
  offset: readonly [number, number];
  /** The drawn fraction along the item's direction from its start; null: all of it. */
  reveal: number | null;
  /** Flat paint between two paints, `f` of the way (a canvas resolves and mixes the colours). */
  paint: { from: DrawPaint; to: DrawPaint; f: number } | null;
}

/** When the last track of a timeline ends, in ms after the change began. */
export function timelineEnd(timeline: ResolvedTimeline): number {
  return timeline.reduce((end, t) => Math.max(end, t.delay + t.duration), 0);
}

const plain = (item: FrameItem): SampledItem => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null });

/** How every item is drawn `ms` after the change began, in drawing order, with copies and departing items. */
export function sampleTimeline(frame: ResolvedFrame, timeline: ResolvedTimeline, ms: number): SampledItem[] {
  const sampled = frame.items.map(plain);
  const byId = new Map(sampled.map((s) => [s.item.id, s]));
  const above = new Map<string, SampledItem[]>();
  const below = new Map<string | null, SampledItem[]>();
  const add = <K>(map: Map<K, SampledItem[]>, key: K, s: SampledItem) => map.set(key, [...(map.get(key) ?? []), s]);
  for (const track of timeline) {
    const f = progress(track, ms);
    if (track.property === 'exit') {
      if (f >= 1) continue;
      const leaving = plain(track.item);
      if (track.effect === 'undraw' && track.item.kind === 'shape') leaving.reveal = 1 - f;
      else leaving.opacity = 1 - f;
      add(below, track.under, leaving);
      continue;
    }
    const s = byId.get(track.id);
    if (!s) continue;
    switch (track.property) {
      case 'opacity':
        s.opacity *= lerp(track.from, track.to, f);
        break;
      case 'offsetY':
        s.offset = [s.offset[0], s.offset[1] + lerp(track.from, track.to, f)];
        break;
      case 'translate':
        s.offset = [s.offset[0] + lerp(track.from[0], track.to[0], f), s.offset[1] + lerp(track.from[1], track.to[1], f)];
        break;
      case 'reveal':
        s.reveal = lerp(track.from, track.to, f);
        break;
      case 'paint':
        if (f < 1) s.paint = { from: track.from, to: track.to, f };
        break;
      case 'shape':
        if (s.item.kind !== 'shape' || f >= 1) break;
        if (track.morph) s.item = { ...s.item, shape: tweenShape(track.from, track.to, f) };
        else {
          s.opacity *= f;
          add(above, track.id, { ...plain({ ...s.item, shape: track.from }), opacity: 1 - f });
        }
        break;
    }
  }
  const out: SampledItem[] = [];
  for (const s of sampled) {
    out.push(...(below.get(s.item.id) ?? []), s, ...(above.get(s.item.id) ?? []));
  }
  out.push(...(below.get(null) ?? []));
  return out;
}

/**
 * A new timeline's glides and moves, picked up from where the previous one has got to (M5): a
 * shape glides on from where it is drawn now, and a label's move adds the offset still to go.
 * The rule both backends follow when a change arrives mid-change.
 */
export function carryOn(previous: { timeline: ResolvedTimeline; start: number } | null, timeline: ResolvedTimeline, now: number): ResolvedTimeline {
  if (!previous) return timeline;
  const running = (id: string, property: ResolvedTrack['property']) => previous.timeline.find((t) => t.id === id && t.property === property);
  const at = now - previous.start;
  return timeline.map((track) => {
    if (track.property === 'shape') {
      const was = running(track.id, 'shape') as Extract<ResolvedTrack, { property: 'shape' }> | undefined;
      if (!was) return track;
      const f = progress(was, at);
      const here = was.morph ? tweenShape(was.from, was.to, f) : f < 0.5 ? was.from : was.to;
      return { ...track, from: here, morph: canMorph(here, track.to) };
    }
    if (track.property === 'translate') {
      const was = running(track.id, 'translate') as Extract<ResolvedTrack, { property: 'translate' }> | undefined;
      if (!was) return track;
      const f = progress(was, at);
      const left = [0, 1].map((i) => lerp(was.from[i], was.to[i], f));
      return { ...track, from: [track.from[0] + left[0], track.from[1] + left[1]] as const };
    }
    return track;
  });
}
