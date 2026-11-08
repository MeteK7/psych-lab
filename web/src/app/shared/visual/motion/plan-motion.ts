import type { ElementId, SceneDefinition, SceneElement, StateName } from '../composition/scene';
import { resolveState } from '../state/resolve-state';
import { EMPHASIS_CHANGE, Emphasis, MOTION, MOTION_EFFECTS, MotionEffect } from '../styling/vocabulary';

/**
 * S5 Motion (docs/visual-system.md §3.3, §8): turns a change between two states into a timeline of
 * property tracks. It knows nothing about geometry, colour values or backends. The rules
 * (visual-policy.md §3.12):
 * - only on a state change, and only the elements that changed
 * - an element that appears enters with its scene-declared effect (default `fade`); elements that
 *   enter `with` another start at the same moment as it
 * - an element that stays but changes emphasis eases between the two paints
 * - an element that goes away goes at once: in the exercises so far the page changes at the same
 *   moment, and nothing needs a departure to be understood
 * - at most `MOTION.maxStaggered` elements move on their own, each one stagger after the previous
 * - under the reduced and static tiers, and on a first appearance, the timeline is empty: the
 *   final state is shown at once
 */
export type QualityTier = 'full' | 'reduced' | 'static';

interface Timing {
  id: ElementId;
  /** Milliseconds from the state change. */
  delay: number;
  duration: number;
  /** A CSS easing function, from the S1 motion tokens. */
  easing: string;
}

export type Track = Timing &
  (
    | { property: 'opacity'; from: number; to: number }
    /** Vertical offset from the element's place, in scene units (positive is lower). */
    | { property: 'offsetY'; from: number; to: number }
    /** The drawn fraction of the element, along its direction. */
    | { property: 'reveal'; from: number; to: number }
    | { property: 'emphasis'; from: Emphasis; to: Emphasis }
  );

export type Timeline = readonly Track[];

/** One element that moves on its own in a change, with the elements that move with it. */
export interface Mover {
  id: ElementId;
  change: { kind: 'enter'; effect: MotionEffect; why: string } | { kind: 'emphasis'; from: Emphasis; to: Emphasis };
  with: ElementId[];
}

function timing(id: ElementId, delay: number, preset: { duration: keyof typeof MOTION.durations; easing: keyof typeof MOTION.easing }): Timing {
  return { id, delay, duration: MOTION.durations[preset.duration], easing: MOTION.easing[preset.easing] };
}

function effectTracks(id: ElementId, effect: MotionEffect, delay: number): Track[] {
  const t = timing(id, delay, MOTION_EFFECTS[effect]);
  switch (effect) {
    case 'fade':
      return [{ ...t, property: 'opacity', from: 0, to: 1 }];
    case 'rise':
      return [
        { ...t, property: 'opacity', from: 0, to: 1 },
        { ...t, property: 'offsetY', from: MOTION_EFFECTS.rise.distance, to: 0 },
      ];
    case 'draw':
      return [{ ...t, property: 'reveal', from: 0, to: 1 }];
  }
}

/** What moves in a change from one state to another, in drawing order: the reviewable summary. */
export function movers(scene: SceneDefinition, from: StateName, to: StateName): Mover[] {
  const before = resolveState(scene, from);
  const after = resolveState(scene, to);
  const elements = scene.layers.flatMap((l) => l.elements);
  const entering = new Set(elements.filter((e) => after[e.id].visible && !before[e.id].visible).map((e) => e.id));
  // An element enters with its lead only when the lead enters too; otherwise it moves on its own.
  const leadOf = (e: SceneElement) => (e.enter?.with !== undefined && entering.has(e.enter.with) ? e.enter.with : null);

  const result: Mover[] = [];
  for (const e of elements) {
    if (entering.has(e.id) && !leadOf(e)) {
      const effect = (e.enter?.effect ?? 'fade') as MotionEffect;
      const why = e.enter?.with === undefined ? (e.enter?.why ?? '') : '';
      result.push({ id: e.id, change: { kind: 'enter', effect, why }, with: [] });
    } else if (before[e.id].visible && after[e.id].visible && before[e.id].emphasis !== after[e.id].emphasis) {
      result.push({ id: e.id, change: { kind: 'emphasis', from: before[e.id].emphasis, to: after[e.id].emphasis }, with: [] });
    }
  }
  for (const e of elements) {
    const lead = entering.has(e.id) ? leadOf(e) : null;
    if (lead) result.find((m) => m.id === lead)!.with.push(e.id);
  }
  return result;
}

/** The timeline for a change; empty on a first appearance, without a change, or below the full tier. */
export function planMotion(scene: SceneDefinition, from: StateName | null, to: StateName, tier: QualityTier): Timeline {
  if (tier !== 'full' || from === null || from === to) return [];
  const byId = new Map(scene.layers.flatMap((l) => l.elements).map((e) => [e.id, e]));
  const tracks: Track[] = [];
  let entered = 0;
  for (const m of movers(scene, from, to)) {
    if (m.change.kind === 'emphasis') {
      tracks.push({ ...timing(m.id, 0, EMPHASIS_CHANGE), property: 'emphasis', from: m.change.from, to: m.change.to });
      continue;
    }
    const delay = Math.min(entered++, MOTION.maxStaggered - 1) * MOTION.staggerMs;
    const lead = m.change.effect;
    tracks.push(...effectTracks(m.id, lead, delay));
    for (const id of m.with) {
      const own = byId.get(id)!;
      const effect = own.enter?.effect ?? (lead === 'draw' && own.kind === 'label' ? 'fade' : lead);
      tracks.push(...effectTracks(id, effect, delay));
    }
  }
  return tracks;
}

/** Motion-budget problems for each declared transition (visual-policy.md §3.12); empty when fine. */
export function motionProblems(scene: SceneDefinition): string[] {
  return (scene.transitions ?? []).flatMap(([from, to]) => {
    if (!scene.states.states[from] || !scene.states.states[to]) return [];
    const moving = movers(scene, from, to);
    return moving.length > MOTION.maxStaggered
      ? [`transition ${from} → ${to}: ${moving.length} elements move; at most ${MOTION.maxStaggered}`]
      : [];
  });
}
