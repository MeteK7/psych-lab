import type { Drawable } from './frame';
import { lerp } from './timing';

/**
 * S7 Rendering: shapes between two drawings (milestone M5). Two drawables of the same type morph
 * number by number; two paths morph when they have the same commands (and the same arc flags);
 * anything else can't morph, and the pipeline asks for a crossfade instead. Pure.
 */

type Command = { letter: string; numbers: number[] };

const PARAMS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/** A path as commands with their numbers; repeated parameter groups become their own commands. */
export function parsePath(d: string): Command[] | null {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return [];
  const out: Command[] = [];
  let i = 0;
  while (i < tokens.length) {
    const letter = tokens[i++];
    const count = PARAMS[letter.toUpperCase()];
    if (count === undefined) return null;
    if (count === 0) {
      out.push({ letter, numbers: [] });
      continue;
    }
    let first = true;
    while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
      const numbers = tokens.slice(i, i + count).map(Number);
      if (numbers.length < count) return null;
      i += count;
      // After a moveto, further pairs are linetos (SVG 1.1 §8.3.2).
      out.push({ letter: first ? letter : letter === 'M' ? 'L' : letter === 'm' ? 'l' : letter, numbers });
      first = false;
    }
    if (first) return null;
  }
  return out;
}

function sameStructure(a: Command[], b: Command[]): boolean {
  return (
    a.length === b.length &&
    a.every((c, i) => c.letter === b[i].letter && (c.letter.toUpperCase() !== 'A' || (c.numbers[3] === b[i].numbers[3] && c.numbers[4] === b[i].numbers[4])))
  );
}

/** Whether two drawings can morph into each other. */
export function canMorph(from: Drawable, to: Drawable): boolean {
  if (from.type !== to.type) return false;
  if (from.type !== 'path' || to.type !== 'path') return true;
  const [a, b] = [parsePath(from.d), parsePath(to.d)];
  return !!a && !!b && sameStructure(a, b);
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** The drawing a fraction `f` of the way from one to the other; `to` when they can't morph. */
export function tweenShape(from: Drawable, to: Drawable, f: number): Drawable {
  if (f >= 1 || !canMorph(from, to)) return to;
  if (f <= 0) return from;
  const n = (a: number, b: number) => round(lerp(a, b, f));
  switch (to.type) {
    case 'circle': {
      const a = from as typeof to;
      return { type: 'circle', cx: n(a.cx, to.cx), cy: n(a.cy, to.cy), r: n(a.r, to.r) };
    }
    case 'ellipse': {
      const a = from as typeof to;
      return { type: 'ellipse', cx: n(a.cx, to.cx), cy: n(a.cy, to.cy), rx: n(a.rx, to.rx), ry: n(a.ry, to.ry) };
    }
    case 'rect': {
      const a = from as typeof to;
      return { type: 'rect', x: n(a.x, to.x), y: n(a.y, to.y), width: n(a.width, to.width), height: n(a.height, to.height), rx: n(a.rx ?? 0, to.rx ?? 0) };
    }
    case 'line': {
      const a = from as typeof to;
      return { type: 'line', x1: n(a.x1, to.x1), y1: n(a.y1, to.y1), x2: n(a.x2, to.x2), y2: n(a.y2, to.y2) };
    }
    case 'path': {
      const a = parsePath((from as typeof to).d)!;
      const b = parsePath(to.d)!;
      const d = b
        .map((c, i) => {
          // Arc flags stay as they are; every other number moves.
          const nums = c.numbers.map((v, k) => (c.letter.toUpperCase() === 'A' && (k === 3 || k === 4) ? v : n(a[i].numbers[k], v)));
          return c.letter + nums.join(' ');
        })
        .join(' ');
      return { type: 'path', d };
    }
  }
}
