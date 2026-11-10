import { lookupOf } from '../../composition/compose';
import { validateScene } from '../../composition/validate';
import { buildComposedFrame } from '../../integration/pipeline';
import type { FrameItem } from '../../rendering/frame';
import { RING_WIDTH, TRACKING, composeTracking, composeTrackingPreview } from './tracking';

const input = {
  size: { width: 480, height: 320 },
  target: { x: 100, y: 120 },
  cursor: { x: 240, y: 160 },
  ringRadius: 28,
};
const LABELS = { dot: 'the dot', ring: 'the ring', pointer: 'your pointer' };
const game = (onTarget: boolean) => buildComposedFrame(composeTracking({ ...input, onTarget }));
const preview = () => buildComposedFrame(composeTrackingPreview({ ringRadius: 28, labels: LABELS }));
const item = (items: readonly FrameItem[], id: string) => {
  const found = items.find((i) => i.id === id);
  if (!found || found.kind !== 'shape') throw new Error(`no shape '${id}'`);
  return found;
};

describe('state-reset.tracking (policy)', () => {
  it('shows the pointer inside the ring by weight as well as colour, and as focal in high contrast', () => {
    const inside = item(game(true).items, 'ring').paint;
    const outside = item(game(false).items, 'ring').paint;
    expect(inside.stroke).not.toBe(outside.stroke);
    expect(inside.width).toBe(RING_WIDTH.inside);
    expect(outside.width).toBe(RING_WIDTH.outside);
    expect(inside.width).toBeGreaterThanOrEqual(2 * outside.width);
    expect(inside.stroke).toContain('--vis-focal');
  });

  it('draws the ring, the dot and the marker at their places, and nothing else', () => {
    const frame = game(false);
    expect(frame.items.map((i) => i.id)).toEqual(['ring', 'dot', 'marker']);
    expect(item(frame.items, 'ring').shape).toEqual({ type: 'circle', cx: 100, cy: 120, r: 28 });
    const dot = item(frame.items, 'dot').shape;
    expect(dot.type === 'circle' && [dot.cx, dot.cy]).toEqual([100, 120]);
    expect(item(frame.items, 'marker').shape).toEqual({ type: 'path', d: 'M234 160H246M240 154V166' });
    expect([frame.width, frame.height, frame.theme]).toEqual([480, 320, TRACKING.theme]);
  });

  it('draws the preview from the same ring and dot, as the game shows them with the pointer inside', () => {
    const frame = preview();
    expect(item(frame.items, 'ring').paint).toEqual(item(game(true).items, 'ring').paint);
    expect(frame.items.flatMap((i) => (i.kind === 'text' ? [i.text] : []))).toEqual(['the dot', 'the ring', 'your pointer']);
  });

  it('uses token colours only, in the Action theme', () => {
    for (const frame of [game(true), preview()]) {
      expect(frame.theme).toBe('action');
      for (const i of frame.items) {
        const colours = i.kind === 'shape' ? [i.paint.fill, i.paint.stroke] : [i.fill];
        for (const c of colours) expect(c === 'none' || c.includes('var(--vis-')).toBe(true);
      }
    }
  });

  it('is a valid composition: the game inside and outside the ring, and the preview', () => {
    for (const composed of [
      composeTracking({ ...input, onTarget: true }),
      composeTracking({ ...input, onTarget: false }),
      composeTrackingPreview({ ringRadius: 28, labels: LABELS }),
    ]) {
      expect(validateScene(composed.scene, lookupOf(composed))).toEqual([]);
    }
  });
});
