import type { ResolvedFrame } from '../rendering/frame';

/**
 * The stimulus lane (milestone M6, docs/visual-system.md §7, Tier 3): a stimulus is a versioned
 * spec. Its picture is a pure function of the refresh slot, the time, its seed and its parameters,
 * and its events say when something is shown and for how long, in one of two units:
 * - `frames`: shown for exactly that many refresh slots, which last a different time at every
 *   refresh rate, so a spec with frame-based events names the rate it was designed for and how far
 *   a display may be from it; the check before a run refuses any other rate;
 * - `ms`: shown for that many milliseconds, rounded to whole slots (nearest slot at each edge).
 * Pure: no Angular, no DOM. Only S1 colours, S2 seeded randomness and frame types (rule 4e).
 */

export type Amount = { frames: number } | { ms: number };

export interface StimulusEvent {
  id: string;
  /** From the start of the run; in the same unit as `for`. */
  at: Amount;
  for: Amount;
}

/** What the picture function gets for one produced frame. */
export interface StimulusMoment {
  /** The estimated refresh slot since the run began (missed slots counted), from 0. */
  slot: number;
  /** Browser frame time since the run began, in ms (estimated, not display time). */
  ms: number;
  /** The events showing in this slot. */
  active: ReadonlySet<string>;
}

export interface StimulusSpec {
  id: string;
  version: number;
  seed: string;
  params: Readonly<Record<string, number | string>>;
  /** Needed when any event is frame-based: the refresh rate it was designed for. Tolerance defaults to 0.5 Hz. */
  design?: { refreshHz: number; toleranceHz?: number };
  events: readonly StimulusEvent[];
  /** How long a run lasts, in ms. */
  durationMs: number;
  /** The picture in one slot: pure, from the moment, the seed and the parameters. */
  draw(moment: StimulusMoment, seed: string, params: StimulusSpec['params']): ResolvedFrame;
}

export const unitOf = (a: Amount): 'frames' | 'ms' => ('frames' in a ? 'frames' : 'ms');
export const amountOf = (a: Amount): number => ('frames' in a ? a.frames : a.ms);

/** Every problem with a spec; empty when it's valid. */
export function stimulusProblems(spec: StimulusSpec): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const e of spec.events) {
    const where = `event '${e.id}'`;
    if (ids.has(e.id)) problems.push(`${where}: its id repeats`);
    ids.add(e.id);
    if (unitOf(e.at) !== unitOf(e.for)) problems.push(`${where}: 'at' and 'for' use one unit`);
    const [at, length] = [amountOf(e.at), amountOf(e.for)];
    if (unitOf(e.for) === 'frames' && (!Number.isInteger(at) || !Number.isInteger(length))) problems.push(`${where}: frames are whole numbers`);
    if (!(at >= 0)) problems.push(`${where}: it can't start before the run`);
    if (!(length > 0)) problems.push(`${where}: it lasts some time`);
    if (unitOf(e.for) === 'frames' && !spec.design) problems.push(`${where}: a frame-based event needs the refresh rate the spec was designed for ('design')`);
  }
  if (spec.design && !(spec.design.refreshHz > 0)) problems.push('design: a refresh rate is positive');
  const endMs = (e: StimulusEvent) =>
    unitOf(e.for) === 'ms' ? amountOf(e.at) + amountOf(e.for) : ((amountOf(e.at) + amountOf(e.for)) * 1000) / (spec.design?.refreshHz ?? 60);
  for (const e of spec.events) if (endMs(e) > spec.durationMs) problems.push(`event '${e.id}': it ends after the run (${spec.durationMs} ms)`);
  return problems;
}
