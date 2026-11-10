import type { ResolvedFrame } from '../frame';
import { paintFrame } from './canvas-backend';

/** Records what is painted, in order. */
function recorder() {
  const calls: string[] = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, key: string) {
      if (key in target) return target[key];
      return (...args: unknown[]) => {
        const style = key === 'fill' ? target['fillStyle'] : key === 'stroke' ? `${target['strokeStyle']}@${target['lineWidth']}` : '';
        calls.push(`${key}(${args.filter((a) => typeof a !== 'object').join(',')})${style ? ' ' + style : ''}`);
      };
    },
    set(target, key: string, value) {
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const colour = (value: string) => `resolved(${value})`;

const frame: ResolvedFrame = {
  width: 480,
  height: 320,
  theme: 'action',
  items: [
    {
      kind: 'shape',
      id: 'ring',
      layer: 'target',
      shape: { type: 'circle', cx: 10, cy: 20, r: 5 },
      paint: { fill: 'none', stroke: 'var(--vis-subject)', width: 5, dash: null },
    },
    {
      kind: 'shape',
      id: 'dot',
      layer: 'target',
      shape: { type: 'circle', cx: 10, cy: 20, r: 2 },
      paint: { fill: 'var(--vis-ink)', stroke: 'none', width: 0, dash: null },
    },
    {
      kind: 'shape',
      id: 'line',
      layer: 'x',
      shape: { type: 'line', x1: 0, y1: 0, x2: 4, y2: 4 },
      paint: { fill: 'none', stroke: 'var(--vis-context)', width: 1, dash: '4 3' },
    },
  ],
};

describe('canvas backend (S7)', () => {
  it('paints each item in order, with its own paint, and decides nothing', () => {
    const { ctx, calls } = recorder();
    paintFrame(ctx, frame, colour);
    expect(calls).toEqual([
      'clearRect(0,0,480,320)',
      'beginPath()',
      'arc(10,20,5,0,6.283185307179586)',
      'setLineDash()',
      'stroke() resolved(var(--vis-subject))@5',
      'beginPath()',
      'arc(10,20,2,0,6.283185307179586)',
      'fill() resolved(var(--vis-ink))',
      'beginPath()',
      'moveTo(0,0)',
      'lineTo(4,4)',
      'setLineDash()',
      'stroke() resolved(var(--vis-context))@1',
    ]);
  });

  it('fills nothing marked none and strokes nothing without a width', () => {
    const { ctx, calls } = recorder();
    paintFrame(ctx, { ...frame, items: [frame.items[1]] }, colour);
    expect(calls.some((c) => c.startsWith('stroke'))).toBe(false);
  });
});
