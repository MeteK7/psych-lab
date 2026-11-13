import { hashSeed, rng } from './random';

/**
 * S2 Generation: seeded value noise (docs/visual-language.md §8). Organic forms stay calm: at most
 * three octaves, each at most half as strong as the one before, and the whole wobble at most 12%
 * of a form's extent. The generators clamp to these limits; they can't be exceeded by parameters.
 */
export const NOISE_LIMITS = { octaves: 3, persistence: 0.5, amplitude: 0.12 } as const;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Periodic one-dimensional value noise: `count` evenly spaced lattice values, interpolated
 * smoothly and wrapping around, so a closed form has no seam. Returns values in [-1, 1].
 */
export function periodicNoise(seed: string, lattice: number): (t: number) => number {
  const next = rng(seed);
  const values = Array.from({ length: lattice }, () => next() * 2 - 1);
  return (t: number) => {
    const x = (((t % 1) + 1) % 1) * lattice;
    const i = Math.floor(x);
    const f = smooth(x - i);
    return values[i % lattice] * (1 - f) + values[(i + 1) % lattice] * f;
  };
}

/** Octaves of periodic noise, within the limits; still in [-1, 1]. */
export function fractalNoise(seed: string, octaves: number, persistence = NOISE_LIMITS.persistence): (t: number) => number {
  const count = Math.max(1, Math.min(NOISE_LIMITS.octaves, Math.round(octaves)));
  const p = Math.min(NOISE_LIMITS.persistence, Math.max(0, persistence));
  const layers = Array.from({ length: count }, (_, k) => ({ noise: periodicNoise(`${seed}#${k}`, 4 << k), weight: p ** k }));
  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  return (t: number) => layers.reduce((sum, l) => sum + l.noise(t) * l.weight, 0) / total;
}

/**
 * Two-dimensional gradient noise: a seeded direction at each lattice point, blended smoothly (a
 * quintic fade). Unlike value noise, its hills don't line up with the lattice, so contour lines
 * and flow fields don't show the grid. Returns values in [-1, 1]. `x` and `y` are in lattice
 * cells: scale them to set how large the features are.
 */
export function gradientNoise2D(seed: string): (x: number, y: number) => number {
  const base = hashPoint(seed);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (i: number, j: number, x: number, y: number) => {
    const a = base(i, j) * Math.PI * 2;
    return Math.cos(a) * (x - i) + Math.sin(a) * (y - j);
  };
  return (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = fade(x - i);
    const v = fade(y - j);
    const top = dot(i, j, x, y) * (1 - u) + dot(i + 1, j, x, y) * u;
    const bottom = dot(i, j + 1, x, y) * (1 - u) + dot(i + 1, j + 1, x, y) * u;
    // The raw range is about ±0.71; scaled to ±1 and kept there.
    return Math.max(-1, Math.min(1, (top * (1 - v) + bottom * v) * Math.SQRT2));
  };
}

/**
 * Octaves of 2D noise, within the limits; still in [-1, 1]. Each octave halves the feature size and
 * is turned by a fixed angle, so the layers' grids never line up.
 */
export function fractalNoise2D(seed: string, octaves: number, persistence = NOISE_LIMITS.persistence): (x: number, y: number) => number {
  const count = Math.max(1, Math.min(NOISE_LIMITS.octaves, Math.round(octaves)));
  const p = Math.min(NOISE_LIMITS.persistence, Math.max(0, persistence));
  const layers = Array.from({ length: count }, (_, k) => ({
    noise: gradientNoise2D(`${seed}#${k}`),
    freq: 2 ** k,
    weight: p ** k,
    cos: Math.cos(0.6 * k),
    sin: Math.sin(0.6 * k),
  }));
  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  return (x: number, y: number) =>
    layers.reduce((sum, l) => sum + l.noise((x * l.cos - y * l.sin) * l.freq, (x * l.sin + y * l.cos) * l.freq) * l.weight, 0) / total;
}

/** A value in [0, 1) for each integer lattice point, from the seed: the same point always gets the same value. */
function hashPoint(seed: string): (i: number, j: number) => number {
  const s = hashSeed(seed);
  return (i: number, j: number) => {
    let h = Math.imul(s ^ Math.imul(i | 0, 0x27d4eb2d), 0x165667b1) ^ Math.imul(j | 0, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}
