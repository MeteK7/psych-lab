/**
 * The stimulus lane's frame clock (milestone M6): which refresh slot each produced frame falls in,
 * from the browser's frame times. Each gap between produced frames is rounded on its own to a
 * whole number of slots, so an interval estimate that is slightly off can't add up over a long run
 * (a 0.1% error misrounds one gap only if that gap is about 500 slots long, and anything over 100 ms
 * is an interruption anyway). The interval is a running median of recent one-slot gaps. Pure.
 *
 * All times are browser frame times (estimated, not display time): the time the browser gave the
 * frame's callback, near the start of the refresh, not when light left the screen.
 */

/** A gap longer than this ends a run as interrupted: a stall, or the page hidden (§7, stimulus rules). */
export const INTERRUPT_MS = 100;
/** A gap this close (in slots) to halfway between two counts is marked uncertain in the log. */
export const UNCERTAIN_MARGIN = 0.15;
/** One-slot gaps kept for the running interval. */
const WINDOW = 60;

export interface SlotStep {
  /** The estimated refresh slot of this produced frame, from 0. */
  slot: number;
  /** Browser frame time of this frame (ms). */
  time: number;
  /** Since the previous produced frame (ms); null for the first. */
  gap: number | null;
  /** Slots that passed without a produced frame before this one. */
  missed: number;
  /** The gap was too near halfway between two counts to be sure of this slot. */
  uncertain: boolean;
  /** The gap was longer than INTERRUPT_MS: the run can't go on. */
  interrupted: boolean;
}

export function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export class SlotCounter {
  private recent: number[] = [];
  private last: SlotStep | null = null;

  /** `interval`: the frame interval measured before the run (ms). */
  constructor(private estimate: number) {}

  /** The current estimate of the refresh interval (ms). */
  get interval(): number {
    return this.estimate;
  }

  feed(time: number): SlotStep {
    const last = this.last;
    if (!last) return (this.last = { slot: 0, time, gap: null, missed: 0, uncertain: false, interrupted: false });
    const gap = time - last.time;
    const slots = gap / this.estimate;
    const count = Math.max(1, Math.round(slots));
    const fraction = slots - Math.floor(slots);
    const uncertain = slots >= 1 && Math.abs(fraction - 0.5) < UNCERTAIN_MARGIN;
    const step: SlotStep = { slot: last.slot + count, time, gap, missed: count - 1, uncertain, interrupted: gap > INTERRUPT_MS };
    if (count === 1 && !uncertain) {
      this.recent.push(gap);
      if (this.recent.length > WINDOW) this.recent.shift();
      if (this.recent.length >= 10) this.estimate = median(this.recent);
    }
    return (this.last = step);
  }
}
