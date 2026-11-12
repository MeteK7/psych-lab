/**
 * S7 Rendering: how a figure's motion is drawn, frame by frame (milestone M6), and the watchdog's
 * rule. A backend tells its observer about each frame it draws while a change plays (the time the
 * browser gave the frame, and how long our own code took). From these:
 * - **effective frame rate**: the figure's own frames while it moves, over its last 1 s of motion
 *   (added up across changes): (frames − 1) ÷ the time from the first to the last. The first 2
 *   frames of each change don't count (a new frame is being built then), nor do gaps over 100 ms
 *   (the page hidden or stalled);
 * - **the watchdog**: motion drops to the reduced tier, for the rest of the page view, once the
 *   effective rate is below 50 fps over that second. A display running at its own rate never
 *   counts as missing frames, whatever the rate; 72 fps on a 144 Hz display is smooth and stays;
 *   a figure with less than 1 s of motion in all is never dropped;
 * - **diagnosis only** (the Lab's overlay): missed refreshes, against the display interval (the
 *   10th percentile of the gaps), as missed ÷ (missed + produced); and our code's work per frame,
 *   against half the display interval (8.3 ms at 60 Hz, 4.2 ms at 120 Hz, 3.5 ms at 144 Hz). With
 *   SVG, most of the cost is the browser's own styling and painting, which a page can't time frame
 *   by frame: it shows in the frame rate instead.
 * Pure: times come from the frame clock.
 */

export const WATCHDOG = { minFps: 50, motionMs: 1000, skipFrames: 2, breakMs: 100 } as const;

export interface FrameObserver {
  /** A change starts playing. */
  begin(time: number): void;
  /** A frame drawn while it plays: the browser's frame time, and our own code's time for it (ms). */
  frame(time: number, work: number): void;
}

export interface FrameReport {
  /** Motion counted (ms), up to the last second. */
  motionMs: number;
  frames: number;
  /** Frames per second while moving; null before any. */
  rate: number | null;
  /** The display interval estimated from the gaps (ms). */
  interval: number | null;
  missed: number;
  missedShare: number;
  work: { median: number; max: number; budget: number | null; over: number };
  /** The watchdog has moved this figure to the reduced tier. */
  dropped: boolean;
}

interface Sample {
  gap: number;
  work: number;
}

const quantile = (values: number[], q: number) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

export class FrameStats implements FrameObserver {
  private samples: Sample[] = [];
  private last: number | null = null;
  private skipped = 0;
  private droppedNow = false;

  /** Once true, it stays true: motion stays reduced for the rest of the page view. */
  get dropped(): boolean {
    return this.droppedNow;
  }

  begin(time: number): void {
    this.last = null;
    this.skipped = 0;
    void time;
  }

  frame(time: number, work: number): void {
    // The first frames of a change, and the gap after them, don't count.
    if (this.skipped < WATCHDOG.skipFrames) {
      this.skipped++;
      this.last = null;
      return;
    }
    const gap = this.last === null ? null : time - this.last;
    this.last = time;
    if (gap === null || gap > WATCHDOG.breakMs || gap <= 0) return;
    this.samples.push({ gap, work });
    // Keep the last second of motion.
    let total = this.samples.reduce((n, s) => n + s.gap, 0);
    while (this.samples.length > 1 && total - this.samples[0].gap >= WATCHDOG.motionMs) total -= this.samples.shift()!.gap;
    if (!this.droppedNow && total >= WATCHDOG.motionMs && (1000 * this.samples.length) / total < WATCHDOG.minFps) this.droppedNow = true;
  }

  report(): FrameReport {
    const gaps = this.samples.map((s) => s.gap);
    const motionMs = gaps.reduce((n, g) => n + g, 0);
    if (!gaps.length) return { motionMs: 0, frames: 0, rate: null, interval: null, missed: 0, missedShare: 0, work: { median: 0, max: 0, budget: null, over: 0 }, dropped: this.droppedNow };
    const interval = quantile(gaps, 0.1);
    const missed = gaps.reduce((n, g) => n + Math.max(0, Math.round(g / interval) - 1), 0);
    const works = this.samples.map((s) => s.work);
    const budget = interval / 2;
    return {
      motionMs,
      frames: gaps.length,
      rate: (1000 * gaps.length) / motionMs,
      interval,
      missed,
      missedShare: missed / (missed + gaps.length),
      work: { median: quantile(works, 0.5), max: Math.max(...works), budget, over: works.filter((w) => w > budget).length },
      dropped: this.droppedNow,
    };
  }
}
