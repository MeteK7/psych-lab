import { INTERRUPT_MS, median } from './slots';
import { StimulusEvent, StimulusSpec, amountOf, unitOf } from './spec';

/**
 * The check before a run (milestone M6): a calibration of about 2 s with the page visible and
 * focused and nothing else moving, which tells three cases apart:
 * - a stable rate matching the spec's design rate: frame-based and time-based events run;
 * - a stable rate that doesn't match: time-based events run, rounded to it; frame-based refuse;
 * - an unstable rate (power saving, variable refresh, a background tab, throttling): all refuse.
 * Stable: at least 95% of the intervals within ±10% of the median, the medians of the first and
 * second second within 1% of each other, and no gap over 100 ms (a stall, or the page hidden, which
 * would end a run too). Pure: the intervals come from the frame clock.
 */

export const STABILITY = { within: 0.1, share: 0.95, secondsApart: 0.01, minFrames: 60 } as const;
export const DEFAULT_TOLERANCE_HZ = 0.5;

export interface DisplayCheck {
  /** Median frame interval (ms), browser frame time. */
  interval: number;
  hz: number;
  /** Share of intervals within ±10% of the median. */
  within: number;
  /** The first and second second's median intervals (ms). */
  seconds: [number, number];
  frames: number;
  stable: boolean;
  /** Why it isn't stable, in words; empty when stable. */
  reasons: string[];
}

export function checkDisplay(intervals: readonly number[]): DisplayCheck {
  const reasons: string[] = [];
  if (intervals.length < STABILITY.minFrames) {
    reasons.push(`too few frames to judge (${intervals.length}; at least ${STABILITY.minFrames} in 2 s)`);
    const interval = intervals.length ? median(intervals) : NaN;
    return { interval, hz: 1000 / interval, within: 0, seconds: [NaN, NaN], frames: intervals.length, stable: false, reasons };
  }
  const interval = median(intervals);
  const within = intervals.filter((g) => Math.abs(g - interval) <= STABILITY.within * interval).length / intervals.length;
  // Split at 1 s of browser time.
  let elapsed = 0;
  let split = intervals.length;
  for (let i = 0; i < intervals.length; i++) {
    elapsed += intervals[i];
    if (elapsed >= 1000) {
      split = i + 1;
      break;
    }
  }
  const first = intervals.slice(0, split);
  const second = intervals.slice(split);
  const seconds: [number, number] = [median(first), second.length ? median(second) : NaN];
  if (within < STABILITY.share)
    reasons.push(`frame intervals vary too much: ${(100 * (1 - within)).toFixed(1)}% are more than ±${STABILITY.within * 100}% from the median (at most ${(100 * (1 - STABILITY.share)).toFixed(0)}%)`);
  const longest = Math.max(...intervals);
  if (longest > INTERRUPT_MS) reasons.push(`the check was interrupted: a gap of ${longest.toFixed(0)} ms between frames (a stall, or the page hidden)`);
  const apart = Math.abs(seconds[0] - seconds[1]) / interval;
  if (!(apart <= STABILITY.secondsApart)) reasons.push(`the rate changed between the two seconds: ${seconds[0].toFixed(2)} ms, then ${seconds[1].toFixed(2)} ms`);
  return { interval, hz: 1000 / interval, within, seconds, frames: intervals.length, stable: reasons.length === 0, reasons };
}

export interface EventPlan {
  event: StimulusEvent;
  unit: 'frames' | 'ms';
  /** Whether it may run on this display, and why not. */
  runs: boolean;
  reason: string;
  /** The slots it shows in: from `on` up to, not including, `off`. */
  on: number;
  off: number;
}

export interface RunDecision {
  check: DisplayCheck;
  frames: { runs: boolean; reason: string };
  ms: { runs: boolean; reason: string };
  events: EventPlan[];
}

const hz = (h: number) => `${h.toFixed(h >= 100 ? 0 : 2)} Hz`;

/** What may run on this display, event by event, with the slots each shows in. */
export function decide(spec: StimulusSpec, check: DisplayCheck): RunDecision {
  const unstable = `this display's frame rate isn't stable: ${check.reasons.join('; ')}`;
  const design = spec.design;
  const tolerance = design?.toleranceHz ?? DEFAULT_TOLERANCE_HZ;
  const frames = !check.stable
    ? { runs: false, reason: unstable }
    : !design
      ? { runs: false, reason: 'the spec names no design rate' }
      : Math.abs(check.hz - design.refreshHz) <= tolerance
        ? { runs: true, reason: `designed for ${hz(design.refreshHz)} (±${tolerance} Hz); this display runs at ${hz(check.hz)}` }
        : { runs: false, reason: `designed for ${hz(design.refreshHz)}; this display runs at ${hz(check.hz)}` };
  const ms = check.stable ? { runs: true, reason: `rounded to whole frames at ${hz(check.hz)}, nearest frame at each edge` } : { runs: false, reason: unstable };
  const events = spec.events.map((event): EventPlan => {
    const unit = unitOf(event.for);
    if (unit === 'frames') {
      const on = amountOf(event.at);
      return { event, unit, ...frames, on, off: on + amountOf(event.for) };
    }
    const on = Math.round(amountOf(event.at) / check.interval);
    const off = Math.round((amountOf(event.at) + amountOf(event.for)) / check.interval);
    if (ms.runs && off - on < 1)
      return { event, unit, runs: false, reason: `${amountOf(event.for)} ms is shorter than one frame at ${hz(check.hz)}`, on, off };
    return { event, unit, ...ms, on, off };
  });
  return { check, frames, ms, events };
}
