import { boundsOf } from '../../composition/bounds';
import { lookupOf } from '../../composition/compose';
import type { SceneElement } from '../../composition/scene';
import { spacingWarnings } from '../../composition/spacing';
import { validateScene } from '../../composition/validate';
import { onFrame, toCamera } from '../../generation/spatial/camera';
import { POSES } from '../../generation/spatial/figures';
import { buildComposedFrame } from '../../integration/pipeline';
import { ROOM, ROOM_POSITIONS, ROOM_SIZE, RoomWords, YOUR_HEAD, cameraAt, composeRoom, groupOf, wallHeightAt } from './room';

// "Change the camera angle": camera-angle.room@2, a spatial view (room.ts, its policy header).
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

  it('carries only the words it is given: one label, "You", from position 1 on, inside the picture', () => {
    for (const v of VIEWS) {
      const labels = elements(v).filter((e) => e.kind === 'label');
      if (v < 1) expect(labels, `view ${v}`).toEqual([]);
      else {
        expect(labels.map((l) => (l.kind === 'label' ? l.text : '')), `view ${v}`).toEqual(['you']);
        const l = labels[0];
        if (l.kind !== 'label') throw new Error('a label');
        expect(l.at[0], `view ${v}`).toBeGreaterThan(0);
        expect(l.at[0], `view ${v}`).toBeLessThan(ROOM_SIZE.width - 30);
        expect(l.at[1], `view ${v}`).toBeGreaterThan(14);
        expect(l.at[1], `view ${v}`).toBeLessThan(ROOM_SIZE.height);
      }
      expect(composed(v).text['you']).toBe('You');
    }
    for (let p = 0; p < ROOM_POSITIONS; p++) expect(composed(p).text['alt']).toBe(WORDS.alts[p]);
  });

  it('through your own eyes, shows your forearms coming up from the lower edge on either side, well into the picture', () => {
    const c = composed(0);
    const arms = elements(0).filter((e) => e.id.startsWith('you-s'));
    expect(arms).toHaveLength(1);
    const box = boundsOf(c.scene, arms[0])!;
    // From below the lower edge, up a fifth of the picture or more, on both sides of its middle.
    expect(box.y + box.height).toBeGreaterThanOrEqual(ROOM_SIZE.height);
    expect(box.y).toBeLessThan(ROOM_SIZE.height * 0.8);
    expect(box.x).toBeLessThan(ROOM_SIZE.width / 2 - 100);
    expect(box.x + box.width).toBeGreaterThan(ROOM_SIZE.width / 2 + 100);
  });

  it('is one coherent move: the camera never jumps, and nothing appears at once', () => {
    const STEP = 0.01;
    const fine = Array.from({ length: Math.round((ROOM_POSITIONS - 1) / STEP) + 1 }, (_, i) => Math.round(i * STEP * 100) / 100);
    let head = false;
    let beyond = false;
    for (let i = 1; i < fine.length; i++) {
      const [a, b] = [cameraAt(fine[i - 1]), cameraAt(fine[i])];
      // No jump: in a hundredth of a position, the camera moves a little and turns a little.
      const moved = Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]);
      expect(moved, `camera at ${fine[i]}`).toBeLessThan(0.45);
      expect(a.ahead[0] * b.ahead[0] + a.ahead[1] * b.ahead[1] + a.ahead[2] * b.ahead[2], `turn at ${fine[i]}`).toBeGreaterThan(0.999);
      expect(Math.abs(wallHeightAt(fine[i]) - wallHeightAt(fine[i - 1])), `walls at ${fine[i]}`).toBeLessThan(0.03);
      // You come into the picture from its lower edge: when your head is first drawn, only its top shows.
      const c = composed(fine[i]);
      const yours = c.scene.layers[0].elements.filter((e) => e.id.startsWith('you-s') && e.id.includes('head'));
      if (yours.length && !head) {
        head = true;
        expect(fine[i], 'your head first shows between positions 0 and 1').toBeLessThan(1);
        // Where the top of your head is on the picture, from the camera and the pose.
        const h = toCamera(b, YOUR_HEAD);
        const top = onFrame(b, h)[1] - ((b.f * POSES.seated.head.r) / h[2]) * 1.12;
        expect(top, `the top of your head when it first shows, at ${fine[i]}`).toBeGreaterThan(ROOM_SIZE.height - 30);
      }
      // What lies beyond the walls is drawn exactly when the camera is above their tops, where they hid it.
      const over = b.pos[1] > wallHeightAt(fine[i]);
      const drawn = c.scene.layers[0].elements.some((e) => e.id === 'outside' || /^(corridor|next|back)-/.test(e.id));
      expect(drawn, `beyond the walls at ${fine[i]}`).toBe(over);
      if (over && !beyond) {
        beyond = true;
        expect(fine[i]).toBeGreaterThan(2);
      }
    }
    expect(head).toBe(true);
    expect(beyond).toBe(true);
  });

  it('keeps the room of the moment the picture’s subject from furthest back: the one tinted floor, and you clear to see', () => {
    const floors = elements(3).filter((e) => e.id.endsWith('-floor') && e.kind === 'shape');
    expect(floors.map((e) => [e.id, e.kind === 'shape' ? e.style.role : null]).sort()).toEqual([
      ['back-floor', 'far'],
      ['corridor-floor', 'far'],
      ['next-floor', 'far'],
      ['ours-floor', 'mid'],
    ]);
    // You, at the furthest: every part drawn (not merged, as the most distant people are), tall enough to see.
    const c = composed(3);
    const yours = elements(3).filter((e) => e.id.startsWith('you-s'));
    const boxes = yours.map((e) => boundsOf(c.scene, e)!);
    const top = Math.min(...boxes.map((b) => b.y));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    expect(bottom - top).toBeGreaterThan(40);
    expect(new Set(parts(3, 'you')).size).toBe(11);
    // And you are near the middle of the picture, not pushed to an edge.
    const middle = boxes.reduce((s, b) => s + b.x + b.width / 2, 0) / boxes.length;
    expect(Math.abs(middle - ROOM_SIZE.width / 2)).toBeLessThan(ROOM_SIZE.width / 4);
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
