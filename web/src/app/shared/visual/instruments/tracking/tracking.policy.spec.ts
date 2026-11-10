import { RING_WIDTH, TRACKING, ringPaint, trackingFrame, trackingPreviewFrame } from './tracking';

const input = {
  size: { width: 480, height: 320 },
  target: { x: 100, y: 120 },
  cursor: { x: 240, y: 160 },
  ringRadius: 28,
};
const LABELS = { dot: 'the dot', ring: 'the ring', pointer: 'your pointer' };

describe('state-reset.tracking (policy)', () => {
  it('shows the pointer inside the ring by weight as well as colour, and as focal in high contrast', () => {
    const inside = ringPaint(true);
    const outside = ringPaint(false);
    expect(inside.stroke).not.toBe(outside.stroke);
    expect(inside.width).toBe(RING_WIDTH.inside);
    expect(inside.width).toBeGreaterThanOrEqual(2 * outside.width);
    expect(inside.stroke).toContain('--vis-focal');
  });

  it('draws the ring, the dot and the marker at their places, and nothing else', () => {
    const frame = trackingFrame({ ...input, onTarget: false });
    expect(frame.items.map((i) => i.id)).toEqual(['ring', 'dot', 'marker']);
    const [ring, dot, marker] = frame.items;
    expect(ring.kind === 'shape' && ring.shape).toEqual({ type: 'circle', cx: 100, cy: 120, r: 28 });
    expect(dot.kind === 'shape' && dot.shape.type === 'circle' && [dot.shape.cx, dot.shape.cy]).toEqual([100, 120]);
    expect(marker.kind === 'shape' && marker.shape).toEqual({ type: 'path', d: 'M234 160H246M240 154V166' });
    expect([frame.width, frame.height, frame.theme]).toEqual([480, 320, TRACKING.theme]);
  });

  it('draws the preview from the same ring and dot, as the game shows them with the pointer inside', () => {
    const preview = trackingPreviewFrame({ ringRadius: 28, labels: LABELS });
    const ring = preview.items.find((i) => i.id === 'ring');
    expect(ring?.kind === 'shape' && ring.paint).toEqual(ringPaint(true));
    expect(preview.items.flatMap((i) => (i.kind === 'text' ? [i.text] : []))).toEqual(['the dot', 'the ring', 'your pointer']);
  });

  it('uses token colours only, in the Action theme', () => {
    const frames = [trackingFrame({ ...input, onTarget: true }), trackingPreviewFrame({ ringRadius: 28, labels: LABELS })];
    for (const frame of frames) {
      expect(frame.theme).toBe('action');
      for (const item of frame.items) {
        const colours = item.kind === 'shape' ? [item.paint.fill, item.paint.stroke] : [item.fill];
        for (const c of colours) expect(c === 'none' || c.includes('var(--vis-')).toBe(true);
      }
    }
  });
});
