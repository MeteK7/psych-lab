// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { createHash } from 'node:crypto';
// @ts-expect-error: as above.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { directions, unscaledVariants, unseenDirections } from './figures';
import { isRefusal } from './idioms/registry';
import type { Figure } from './idioms/contract';
import { geometry } from './pass-c';
import { samples } from './study-page';

/**
 * STUDY CODE, revision 5: the accepted figures, pinned. Every corpus figure (by the rules and
 * finished) and every R4-4 variant, as two hashes over all its sampled moments:
 * - `full`: everything it draws and says (geometry, words, purposes, alt text, coverage, motion);
 * - `shape`: the same with every word masked (pass C's `geometry`), so a change of wording alone
 *   leaves it unchanged.
 * Revision 5 may not change any `shape`. A `full` hash may change only with an intended change of
 * wording, re-pinned on purpose: delete golden.json and run the suite once to write it again.
 */
const FILE = 'src/app/pages/lab/study/golden.json';

/** Unseen cases whose figures you have accepted, so they are pinned like the corpus. */
const ACCEPTED_UNSEEN = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7'];

const hash = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16) as string;

function pinned(f: Figure): { full: string; shape: string } {
  const drawn = { motion: f.motion, axes: f.axes, alt: f.alt, coverage: f.coverage, frames: samples(f).map((at) => f.compose(at)) };
  return { full: hash(drawn), shape: hash(geometry(drawn)) };
}

function current(): Record<string, { full: string; shape: string }> {
  const out: Record<string, { full: string; shape: string }> = {};
  for (const d of directions()) {
    out[`${d.case.id} ${d.idiom} rules`] = pinned(d.rules);
    out[`${d.case.id} ${d.idiom} finished`] = pinned(d.finished);
  }
  for (const v of unscaledVariants()) out[`${v.case.id} ${v.idiom} R4-4 ${v.treatment}`] = pinned(v.figure);
  // Accepted unseen figures (U1, revision 5; U2–U4, revision 6; U5–U7, revision 7, composed; all accepted 2026-11-22). U5's spatial figure is refused, so not pinned.
  for (const u of unseenDirections()) if (ACCEPTED_UNSEEN.includes(u.case.id) && !isRefusal(u.drawn)) out[`${u.case.id} ${u.idiom} unseen`] = pinned(u.drawn);
  return out;
}

describe('revision 5: the accepted figures are pinned', () => {
  const now = current();

  it('pins 128 figures: 36 by the rules, 36 finished, 36 R4-4 variants, U1–U4’s three each, and U5–U7’s eight', () => {
    expect(Object.keys(now).length).toBe(128);
  });

  it('pins every figure it draws (a new one is pinned on purpose, never silently)', () => {
    if (existsSync(FILE)) expect(Object.keys(now).filter((k) => !(k in JSON.parse(readFileSync(FILE, 'utf-8') as string)))).toEqual([]);
  });

  if (!existsSync(FILE)) {
    it('writes the pins (none were on disk)', () => {
      writeFileSync(FILE, JSON.stringify(now, null, 1) + '\n');
      expect(existsSync(FILE)).toBe(true);
    });
    return;
  }
  const pins = JSON.parse(readFileSync(FILE, 'utf-8') as string) as Record<string, { full: string; shape: string }>;

  it('draws every pinned figure in the same shape', () => {
    const changed = Object.keys(pins).filter((k) => now[k]?.shape !== pins[k].shape);
    expect(changed).toEqual([]);
  });

  it('draws and words every pinned figure exactly as pinned', () => {
    const changed = Object.keys(pins).filter((k) => now[k]?.full !== pins[k].full);
    expect(changed).toEqual([]);
  });
});
