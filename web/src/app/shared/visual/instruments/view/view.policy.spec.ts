import { SHOWN, lookupOf } from '../../composition/compose';
import { spacingWarnings } from '../../composition/spacing';
import { validateScene } from '../../composition/validate';
import { controlsOf } from '../../interaction/controls';
import { targetsOf } from '../../interaction/regions';
import { valueAt } from '../../interaction/scales';
import { buildComposedFrame } from '../../integration/pipeline';
import { changeMovers, changeProblems } from '../../motion/plan-motion';
import { FURTHEST, POSITIONS, VIEW, VIEW_SIZE, ViewWords, composeView, inView, standpointX } from './view';

// "Change the camera angle" (camera-angle.view): what the figure promises, asserted at every
// position and for every change between two positions (view.ts, its policy header).

const WORDS: ViewWords = {
  standpoint: 'Where you look from',
  near: 'Close up',
  far: 'Further back',
  you: 'You',
  others: 'Others',
  before: 'Before',
  after: 'After',
  alts: ['Close up', 'One step back', 'From across the room', 'From further away'],
};
const composed = (position: number) => composeView({ position, words: WORDS });
const frame = (position: number) => buildComposedFrame(composed(position));
const ALL = Array.from({ length: POSITIONS }, (_, p) => p);
const PAIRS = ALL.flatMap((a) => ALL.filter((b) => b !== a).map((b) => [a, b] as const));
const item = (position: number, id: string) => frame(position).items.find((i) => i.id === id);
const ids = (position: number) => frame(position).items.map((i) => i.id);

describe('camera-angle.view (policy)', () => {
  it('is a valid composition at every position, with no spacing warnings', () => {
    for (const p of ALL) {
      const c = composed(p);
      expect(validateScene(c.scene, lookupOf(c)), `position ${p}`).toEqual([]);
      expect(spacingWarnings(c.scene, lookupOf(c)), `position ${p}`).toEqual([]);
    }
  });

  it('shows exactly what is in view at each position', () => {
    expect(ids(0)).not.toContain('you');
    for (const p of ALL) {
      const shown = ids(p);
      const want = inView(p);
      expect(shown, `position ${p}`).toContain('moment');
      expect(shown.includes('you'), `you at ${p}`).toBe(want.you);
      expect(shown.includes('label-you'), `its label at ${p}`).toBe(want.you);
      expect(shown.includes('others-1') && shown.includes('others-2'), `others at ${p}`).toBe(want.others);
      expect(shown.includes('time'), `time at ${p}`).toBe(want.time);
      expect(shown.includes('label-before') && shown.includes('label-after'), `before and after at ${p}`).toBe(want.time);
    }
    expect(inView(1)).toEqual({ you: true, others: false, time: false });
    expect(inView(FURTHEST)).toEqual({ you: true, others: true, time: true });
  });

  it('keeps the moment and you in their colour and weight at every position', () => {
    const paint = (p: number, id: string) => {
      const i = item(p, id);
      if (i?.kind !== 'shape') throw new Error(`${id} is a shape at ${p}`);
      return i.paint;
    };
    for (const p of ALL) expect(paint(p, 'moment'), `moment at ${p}`).toEqual(paint(0, 'moment'));
    for (const p of ALL.slice(1)) expect(paint(p, 'you'), `you at ${p}`).toEqual(paint(1, 'you'));
    expect(paint(0, 'moment').fill).not.toBe('none');
    expect(paint(1, 'you').fill).not.toBe('none');
  });

  it('fills the view close up, and never draws the moment narrower than a quarter of the frame', () => {
    const width = (p: number) => {
      const i = item(p, 'moment');
      if (i?.kind !== 'shape' || i.shape.type !== 'ellipse') throw new Error('the moment is an ellipse');
      return i.shape.rx * 2;
    };
    expect(width(0)).toBeGreaterThan(VIEW_SIZE.width * 0.9);
    for (const p of ALL.slice(1)) expect(width(p), `position ${p}`).toBeLessThan(width(p - 1));
    expect(width(FURTHEST)).toBeGreaterThanOrEqual(VIEW_SIZE.width / 4);
  });

  it('draws inside its frame, in token colours only, in the Cognitive theme', () => {
    for (const p of ALL) {
      const f = frame(p);
      expect(f.theme).toBe(VIEW.theme);
      expect(f.theme).toBe('cognitive');
      for (const i of f.items) {
        if (i.kind !== 'shape') continue;
        for (const value of [i.paint.fill, i.paint.stroke]) expect(value === 'none' || value.includes('var(--vis-')).toBe(true);
        const s = i.shape;
        const box =
          s.type === 'ellipse' ? [s.cx - s.rx, s.cy - s.ry, s.cx + s.rx, s.cy + s.ry]
          : s.type === 'circle' ? [s.cx - s.r, s.cy - s.r, s.cx + s.r, s.cy + s.r]
          : s.type === 'rect' ? [s.x, s.y, s.x + s.width, s.y + s.height]
          : s.type === 'line' ? [Math.min(s.x1, s.x2), Math.min(s.y1, s.y2), Math.max(s.x1, s.x2), Math.max(s.y1, s.y2)]
          : null;
        if (!box) continue;
        expect(box[0], `${i.id} at ${p}`).toBeGreaterThanOrEqual(0);
        expect(box[1], `${i.id} at ${p}`).toBeGreaterThanOrEqual(0);
        expect(box[2], `${i.id} at ${p}`).toBeLessThanOrEqual(VIEW_SIZE.width);
        expect(box[3], `${i.id} at ${p}`).toBeLessThanOrEqual(VIEW_SIZE.height);
      }
    }
  });

  it('holds its position at the ends', () => {
    expect(composed(-1).scene).toEqual(composed(0).scene);
    expect(composed(7).scene).toEqual(composed(FURTHEST).scene);
  });

  it('the bar stands where its scale puts the position, and the figure’s control says what the native control says', () => {
    for (const p of ALL) {
      const c = composed(p);
      const [control] = controlsOf(c.scene, targetsOf(c.scene, SHOWN), { position: p }, lookupOf(c));
      expect(control).toMatchObject({ kind: 'slider', value: 'position', label: WORDS.standpoint, min: 0, max: FURTHEST, step: 1, now: p });
      expect(valueAt(c.scene.scales!['position'], standpointX(p))).toBe(p);
    }
  });

  it('carries only the words it is given: the text alternative is the exercise’s for each position', () => {
    for (const p of ALL) expect(composed(p).text['alt']).toBe(WORDS.alts[p]);
    const words = Object.values(composed(FURTHEST).text);
    for (const w of [WORDS.you, WORDS.others, WORDS.before, WORDS.after, WORDS.near, WORDS.far, WORDS.standpoint]) expect(words).toContain(w);
  });

  it('keeps every change between two positions within the motion budget, end to end included', () => {
    for (const [from, to] of PAIRS) expect(changeProblems(composed(from).scene, composed(to).scene), `${from} → ${to}`).toEqual([]);
  });

  it('glides the moment, the marks and the bar together; you fade in; the line from before to after is drawn', () => {
    const movers = (from: number, to: number) => changeMovers(composed(from).scene, composed(to).scene);
    const reflow = (from: number, to: number) => {
      const m = movers(from, to).find((x) => x.change.kind === 'moves')!;
      return [m.id, ...m.with];
    };
    expect(reflow(0, 1)).toEqual(expect.arrayContaining(['moment', 'standpoint']));
    expect(reflow(2, 3)).toEqual(expect.arrayContaining(['moment', 'you', 'others-1', 'others-2', 'standpoint', 'label-you', 'label-others']));
    expect(movers(0, 1).find((m) => m.id === 'you')?.change).toMatchObject({ kind: 'enter', effect: 'fade' });
    expect(movers(0, 1).find((m) => m.id === 'you')?.with).toEqual(['label-you']);
    expect(movers(2, 3).find((m) => m.id === 'time')?.change).toMatchObject({ kind: 'enter', effect: 'draw' });
    expect(movers(2, 3).find((m) => m.id === 'time')?.with).toEqual(['label-before', 'label-after']);
    // The others appear at once as the view widens; stepping closer, what leaves goes at once.
    expect(movers(1, 2).map((m) => m.id)).not.toContain('others-1');
    expect(movers(FURTHEST, 0).map((m) => m.change.kind)).toEqual(['moves']);
    // Every movement says why.
    for (const [from, to] of PAIRS)
      for (const m of movers(from, to)) {
        const why = m.change.kind === 'moves' || m.change.kind === 'enter' || m.change.kind === 'exit' ? m.change.why : 'emphasis';
        expect(why.length, `${m.id}, ${from} → ${to}`).toBeGreaterThan(0);
      }
  });
});
