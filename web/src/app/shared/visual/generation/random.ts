/**
 * S2 Generation: seeded random numbers (docs/visual-system.md §3.3). The same seed gives the same
 * sequence everywhere: in tests, the browser, a Web Worker or Node. Nothing here reads the clock,
 * `Math.random` or the DOM, and nothing is imported (dependency rule 1).
 */

/** A text seed as a 32-bit number (FNV-1a), so any string can seed a generator. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A stream of numbers in [0, 1) from a seed (mulberry32): small, fast and well spread. */
export function rng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * An element's own seed, from the scene's seed and the element's id. Adding or removing another
 * element never changes this one's geometry.
 */
export function deriveSeed(sceneSeed: string, elementId: string): string {
  return `${sceneSeed}/${elementId}`;
}
