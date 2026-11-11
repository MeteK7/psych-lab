import { Pt, curveThrough, superellipsePoints } from './curves';
import { NOISE_LIMITS, fractalNoise } from './noise';

/**
 * S2 Generation: forms (docs/visual-language.md §8). Each is a pure function of its parameters
 * and a seed, returning SVG path data in scene units.
 */

const clampWobble = (wobble: number) => Math.min(NOISE_LIMITS.amplitude, Math.max(0, wobble));

/**
 * An organic closed form: a superellipse whose radius wobbles with seeded noise. `wobble` is a
 * share of the form's size (0 is the plain soft square), at most 12%.
 */
export function blob(
  p: { cx: number; cy: number; rx: number; ry: number; exponent: number; wobble: number; octaves: number },
  seed: string,
): string {
  const count = 36;
  const base = superellipsePoints(p.cx, p.cy, p.rx, p.ry, p.exponent, count);
  const noise = fractalNoise(seed, p.octaves);
  const wobble = clampWobble(p.wobble);
  const points: Pt[] = base.map(([x, y], i) => {
    const k = 1 + wobble * noise(i / count);
    return [p.cx + (x - p.cx) * k, p.cy + (y - p.cy) * k];
  });
  return curveThrough(points, true);
}

/**
 * A ridge: a calm line across from x0 to x1, whose height wobbles around a baseline. As a `band`,
 * it closes down to `floor`, so it can be filled (a ground, a horizon).
 */
export function ridge(
  p: { x0: number; x1: number; baseline: number; amplitude: number; octaves: number; floor?: number; band: boolean },
  seed: string,
): string {
  const count = 24;
  // The wobble is measured against the ridge's length, within the noise limits.
  const amplitude = Math.min(p.amplitude, NOISE_LIMITS.amplitude * Math.abs(p.x1 - p.x0));
  const noise = fractalNoise(seed, p.octaves);
  const points: Pt[] = Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    // Half a period of the periodic noise: the two ends are free, not tied together.
    return [p.x0 + (p.x1 - p.x0) * t, p.baseline + amplitude * noise(t / 2)];
  });
  const line = curveThrough(points);
  if (!p.band) return line;
  const floor = p.floor ?? p.baseline + amplitude * 4;
  return `${line}L${p.x1} ${floor}L${p.x0} ${floor}Z`;
}

/**
 * A rhythm curve: a calm wave from x0 to x1 around y, `periods` long, whose amplitude eases by
 * `decay` (0 keeps it even; 1 settles it to a straight line at the end). No seed: it's regular.
 */
export function rhythm(p: { x0: number; x1: number; y: number; amplitude: number; periods: number; decay: number }): string {
  const count = Math.max(8, Math.round(p.periods * 8));
  const points: Pt[] = Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const envelope = 1 - Math.min(1, Math.max(0, p.decay)) * t;
    return [p.x0 + (p.x1 - p.x0) * t, p.y + p.amplitude * envelope * Math.sin(t * p.periods * Math.PI * 2)];
  });
  return curveThrough(points);
}
