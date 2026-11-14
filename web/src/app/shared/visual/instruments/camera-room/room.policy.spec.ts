import { lookupOf } from '../../composition/compose';
import type { SceneElement } from '../../composition/scene';
import { spacingWarnings } from '../../composition/spacing';
import { validateScene } from '../../composition/validate';
import { POSES } from '../../generation/spatial/figures';
import { buildComposedFrame } from '../../integration/pipeline';
import { ROOM, ROOM_POSITIONS, ROOM_SIZE, RoomWords, cameraAt, composeRoom, groupOf } from './room';

// "Change the camera angle": camera-angle.room@1, a spatial view (room.ts, its policy header).
// Asserted at every quarter of the camera's path, not only at the four positions.

const WORDS: RoomWords = { you: 'You', alts: ['Through your own eyes.', 'One step back.', 'From across the room.', 'From further away.'] };
const VIEWS = Array.from({ length: (ROOM_POSITIONS - 1) * 4 + 1 }, (_, i) => i / 4);
const composed = (view: number) => composeRoom({ view, words: WORDS });
const elements = (view: number): SceneElement[] => composed(view).scene.layers.flatMap((l) => [...l.elements]);
const ids = (view: number) => elements(view).map((e) => e.id);
/** A person's pieces are named `<who>-s<slab>-<part>+<part>…`: the parts of someone in view. */
const PIECE = /^(.+)-s(\d)-([a-z+-]+)$/;
const parts = (view: number, who: string): string[] =>
  ids(view).flatMap((id) => {
    const m = id.match(PIECE);
    return m && m[1] === who ? m[3].split('+') : [];
  });
const heads = (view: number) => PEOPLE.filter((who) => parts(view, who).includes('head')).map((who) => `${who}-head`);
const PEOPLE = ['you', 'opposite', 'third', 'corridor-walker', 'next-window', 'next-worker', 'back-counter'];

describe('camera-angle.room (policy)', () => {
  it('is a valid composition all along the camera’s path, with no spacing warnings', () => {
    for (const v of VIEWS) {
      const c = composed(v);
      expect(validateScene(c.scene, lookupOf(c)), `view ${v}`).toEqual([]);
      expect(spacingWarnings(c.scene, lookupOf(c)), `view ${v}`).toEqual([]);
    }
  });

  it('draws in token colours only, in the Cognitive theme', () => {
    for (const v of VIEWS) {
      const f = buildComposedFrame(composed(v));
      expect(f.theme).toBe(ROOM.theme);
      expect(f.width).toBe(ROOM_SIZE.width);
      for (const item of f.items) {
        const colours = item.kind === 'text' ? [item.fill] : [item.paint.fill, item.paint.stroke, ...(item.paint.gradient?.stops.map((s) => s.colour) ?? [])];
        for (const c of colours) expect(c === 'none' || c.startsWith('var(--vis-'), `${item.id}: ${c}`).toBe(true);
      }
    }
  });

  it('through your own eyes shows only your forearms of you; from one step back, all of you', () => {
    expect(new Set(parts(0, 'you'))).toEqual(new Set(['forearm-l', 'forearm-r']));
    for (const v of [1, 1.5, 2, 2.5, 3]) {
      expect(parts(v, 'you'), `view ${v}`).toContain('head');
      expect(parts(v, 'you'), `view ${v}`).toContain('torso');
    }
  });

  it('brings more people into view the further back, never fewer, and everyone at the furthest', () => {
    const counts = VIEWS.map((v) => heads(v).length);
    for (let i = 1; i < counts.length; i++) expect(counts[i], `from ${VIEWS[i - 1]} to ${VIEWS[i]}`).toBeGreaterThanOrEqual(counts[i - 1]);
    expect(heads(0)).toEqual(['opposite-head']);
    expect(heads(3).sort()).toEqual(PEOPLE.map((p) => `${p}-head`).sort());
  });

  it('keeps you in the area colour at every position, and no larger or more detailed than anyone else', () => {
    for (const v of VIEWS)
      for (const e of elements(v)) {
        if (e.kind !== 'shape') continue;
        if (e.id.startsWith('you-') && !e.id.endsWith('-shadow')) expect(e.style.role, e.id).toBe('subject');
        else if (groupOf(e) !== 'you') expect(e.style.role, e.id).not.toBe('subject');
      }
    // One build: every figure has the same parts and head, in the declared poses only.
    for (const pose of Object.values(POSES)) expect(pose.head.r).toBe(POSES.seated.head.r);
    // Near enough to be drawn in full, you and the person opposite are made of the same parts.
    expect(new Set(parts(2, 'you'))).toEqual(new Set(parts(2, 'opposite')));
    expect(new Set(parts(2, 'you')).size).toBe(11);
    // Far away, a person's legs are one form (no gap thinner than a pixel), never more detail than near.
    for (const who of PEOPLE) expect(new Set(parts(3, who)).size, who).toBeLessThanOrEqual(11);
  });

  it('shows no face, expression or detail on anyone: a head is one rounded form', () => {
    for (const v of VIEWS)
      for (const id of ids(v)) expect(id).not.toMatch(/(^|-)(face|eyes?|mouth|nose|hair|brows?)(-|$)/);
    // A person is one tone and a few closed shapes, never a detail drawn on them.
    for (const who of PEOPLE)
      for (const e of elements(3)) if (e.id.startsWith(`${who}-s`) && e.kind === 'shape') expect(e.style.facing ?? 'base', e.id).toBe('base');
  });

  it('carries only the words it is given: one label, "You", once you are in the picture', () => {
    for (const v of VIEWS) {
      const labels = elements(v).filter((e) => e.kind === 'label');
      if (v < 1.5) expect(labels).toEqual([]);
      else expect(labels.map((l) => (l.kind === 'label' ? l.text : ''))).toEqual(['you']);
      expect(composed(v).text['you']).toBe('You');
    }
    for (let p = 0; p < ROOM_POSITIONS; p++) expect(composed(p).text['alt']).toBe(WORDS.alts[p]);
  });

  it('never looks up at anyone, never straight down, and never rolls', () => {
    for (const v of VIEWS) {
      const cam = cameraAt(v);
      expect(cam.right[1], `view ${v}`).toBeCloseTo(0); // no roll
      expect(cam.ahead[1], `view ${v}`).toBeLessThanOrEqual(0); // level or looking down
      expect(cam.ahead[1], `view ${v}`).toBeGreaterThan(-0.9); // never straight down
      expect(cam.pos[1], `view ${v}`).toBeGreaterThanOrEqual(1.1); // at seated eye height or above
    }
  });

  it('is the same picture each time for the same viewpoint, and holds at the ends', () => {
    expect(composed(1.37)).toEqual(composed(1.37));
    expect(composed(-1).scene.layers).toEqual(composed(0).scene.layers);
    expect(composed(5).scene.layers).toEqual(composed(3).scene.layers);
  });
});
