/**
 * S7 Rendering: the timing core (milestone M5). Where every track of a resolved timeline stands at
 * a moment: the same numbers for every backend, so they agree frame for frame. Pure: time is given,
 * never read. The SVG backend uses it for what CSS can't animate (shapes); the canvas backend plays
 * whole timelines with it (M6); the conformance suite checks the Web Animations playback against it.
 */

export interface TrackTiming {
  delay: number;
  duration: number;
  /** A CSS easing: `linear` or `cubic-bezier(x1, y1, x2, y2)`, from the S1 motion tokens. */
  easing: string;
}

const cache = new Map<string, (x: number) => number>();

/**
 * A CSS cubic Bézier timing function: x is time, y progress, from (0, 0) to (1, 1). Solved for x
 * by Newton's method, falling back to bisection, as browsers do.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-7) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let [lo, hi] = [0, 1];
    t = x;
    for (let i = 0; i < 40 && hi - lo > 1e-7; i++) {
      if (sx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}

/** The easing function a CSS easing string names (only the forms the S1 tokens use). */
export function easingOf(css: string): (x: number) => number {
  let f = cache.get(css);
  if (f) return f;
  const m = css.match(/^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/);
  if (m) f = cubicBezier(+m[1], +m[2], +m[3], +m[4]);
  else if (css === 'linear') f = (x) => Math.min(Math.max(x, 0), 1);
  else throw new Error(`Unsupported easing '${css}'`);
  cache.set(css, f);
  return f;
}

/** A track's eased progress `ms` after its change began: 0 during the delay, 1 once it's done. */
export function progress(track: TrackTiming, ms: number): number {
  if (track.duration <= 0) return ms >= track.delay ? 1 : 0;
  if (ms <= track.delay) return 0;
  if (ms >= track.delay + track.duration) return 1;
  return easingOf(track.easing)((ms - track.delay) / track.duration);
}

/** Whether a track is done `ms` after its change began. */
export function done(track: TrackTiming, ms: number): boolean {
  return ms >= track.delay + track.duration;
}

export function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}
