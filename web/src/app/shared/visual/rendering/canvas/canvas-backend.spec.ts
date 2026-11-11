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

  it('fills a lit gradient across the shape’s box, and a radial shadow stretched to its ellipse', () => {
    const calls: string[] = [];
    const gradient = (kind: string) => ({ addColorStop: (o: number, c: string) => calls.push(`${kind} stop ${o} ${c}`) });
    const state: Record<string, unknown> = {};
    const ctx = new Proxy(state, {
      get(target, key: string) {
        if (key in target) return target[key];
        if (key === 'createLinearGradient') return (...a: number[]) => (calls.push(`linear ${a.join(',')}`), gradient('linear'));
        if (key === 'createRadialGradient') return (...a: number[]) => (calls.push(`radial ${a.join(',')}`), gradient('radial'));
        return (...a: unknown[]) => calls.push(`${key}(${a.filter((x) => typeof x !== 'object').join(',')})`);
      },
      set(target, key: string, value) {
        target[key] = value;
        return true;
      },
    }) as unknown as CanvasRenderingContext2D;
    paintFrame(
      ctx,
      {
        width: 200,
        height: 200,
        theme: 'action',
        items: [
          {
            kind: 'shape',
            id: 'shadow',
            layer: 'x',
            shape: { type: 'ellipse', cx: 100, cy: 150, rx: 40, ry: 5 },
            paint: { fill: 'none', stroke: 'none', width: 0, dash: null, gradient: { type: 'radial', stops: [{ offset: 0, colour: 'var(--vis-shadow)' }, { offset: 1, colour: 'var(--vis-shadow-edge)' }] } },
          },
          {
            kind: 'shape',
            id: 'ball',
            layer: 'x',
            shape: { type: 'circle', cx: 100, cy: 100, r: 40 },
            paint: { fill: 'var(--vis-subject-fill)', stroke: 'none', width: 0, dash: null, gradient: { type: 'linear', from: [0, 0], to: [1, 1], stops: [{ offset: 0, colour: 'var(--vis-subject-lit)' }, { offset: 1, colour: 'var(--vis-subject-shade)' }] } },
          },
        ],
      },
      colour,
    );
    expect(calls).toContain('radial 0,0,0,0,0,1');
    expect(calls).toContain('translate(100,150)');
    expect(calls).toContain('scale(40,5)');
    expect(calls).toContain('radial stop 0 resolved(var(--vis-shadow))');
    expect(calls).toContain('linear 60,60,140,140');
    expect(calls).toContain('linear stop 1 resolved(var(--vis-subject-shade))');
  });

  it('strokes a halo behind each wrapped line, then fills each line a line height lower', () => {
    const { ctx, calls } = recorder();
    paintFrame(
      ctx,
      {
        width: 200,
        height: 100,
        theme: 'action',
        items: [
          {
            kind: 'text',
            id: 't',
            layer: 'l',
            text: 'one two three',
            x: 10,
            y: 20,
            anchor: 'start',
            fill: 'var(--vis-label)',
            size: 14,
            lines: ['one two', 'three'],
            lineHeight: 16.8,
            halo: { colour: 'var(--vis-ground)', width: 4 },
          },
        ],
      },
      colour,
    );
    expect(calls.filter((c) => /Text/.test(c))).toEqual([
      'strokeText(one two,10,20)',
      'strokeText(three,10,36.8)',
      'fillText(one two,10,20)',
      'fillText(three,10,36.8)',
    ]);
    expect(ctx.strokeStyle).toBe('resolved(var(--vis-ground))');
    expect(ctx.lineWidth).toBe(4);
    expect(ctx.fillStyle).toBe('resolved(var(--vis-label))');
  });
});
