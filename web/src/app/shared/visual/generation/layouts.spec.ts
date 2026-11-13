import { Pt } from './curves';
import { jitteredGrid, poissonDisc } from './distributions';
import { flowLayout, gridLayout, packCircles, radialLayout } from './layouts';

const area = { x: 10, y: 20, width: 300, height: 150 };
const closest = (points: readonly Pt[]) => {
  let min = Infinity;
  for (let a = 0; a < points.length; a++)
    for (let b = a + 1; b < points.length; b++) min = Math.min(min, Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1]));
  return min;
};
const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width - 1e-9 && b.x < a.x + a.width - 1e-9 && a.y < b.y + b.height - 1e-9 && b.y < a.y + a.height - 1e-9;

describe('S2 Generation: distributions and layouts (stage C)', () => {
  describe('Poisson-disc points', () => {
    const points = poissonDisc({ ...area, spacing: 15, max: 1000 }, 'p');

    it('keeps every point inside and no two closer than the spacing', () => {
      expect(points.length).toBeGreaterThan(60);
      expect(closest(points)).toBeGreaterThanOrEqual(15);
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(10);
        expect(x).toBeLessThanOrEqual(310);
        expect(y).toBeGreaterThanOrEqual(20);
        expect(y).toBeLessThanOrEqual(170);
      }
    });

    it('covers the area: no empty patch much wider than twice the spacing', () => {
      for (let x = 30; x <= 290; x += 20)
        for (let y = 40; y <= 150; y += 20) {
          const near = Math.min(...points.map(([px, py]) => Math.hypot(px - x, py - y)));
          expect(near).toBeLessThanOrEqual(2 * 15 * 1.1);
        }
    });

    it('stops at the maximum, keeps to the ellipse when round, and repeats for a seed', () => {
      expect(poissonDisc({ ...area, spacing: 15, max: 7 }, 'p')).toHaveLength(7);
      for (const [x, y] of poissonDisc({ ...area, spacing: 12, max: 500, round: true }, 'p')) {
        expect(((x - 160) / 150) ** 2 + ((y - 95) / 75) ** 2).toBeLessThanOrEqual(1 + 1e-9);
      }
      expect(poissonDisc({ ...area, spacing: 15, max: 1000 }, 'p')).toEqual(points);
      expect(poissonDisc({ ...area, spacing: 15, max: 1000 }, 'q')).not.toEqual(points);
    });
  });

  it('keeps a jittered grid point inside its own cell', () => {
    const points = jitteredGrid({ ...area, spacing: 30, jitter: 0.5 }, 'j');
    expect(points).toHaveLength(10 * 5);
    points.forEach(([x, y], k) => {
      const [i, j] = [k % 10, Math.floor(k / 10)];
      expect(x).toBeGreaterThanOrEqual(10 + i * 30);
      expect(x).toBeLessThanOrEqual(10 + (i + 1) * 30);
      expect(y).toBeGreaterThanOrEqual(20 + j * 30);
      expect(y).toBeLessThanOrEqual(20 + (j + 1) * 30);
    });
  });

  it('fills a grid in reading order, in bounds, without overlaps', () => {
    const cells = gridLayout({ ...area, count: 7, columns: 3, gap: 6 });
    expect(cells).toHaveLength(7);
    expect(cells[1].x).toBeGreaterThan(cells[0].x);
    expect(cells[3].y).toBeGreaterThan(cells[0].y);
    for (const c of cells) {
      expect(c.x + c.width).toBeLessThanOrEqual(310 + 1e-9);
      expect(c.y + c.height).toBeLessThanOrEqual(170 + 1e-9);
    }
    for (let a = 0; a < cells.length; a++) for (let b = a + 1; b < cells.length; b++) expect(overlaps(cells[a], cells[b])).toBe(false);
  });

  it('spaces places evenly around a circle, starting at twelve o’clock', () => {
    const places = radialLayout({ count: 6, cx: 100, cy: 100, r: 50 });
    expect(places[0][0]).toBeCloseTo(100, 9);
    expect(places[0][1]).toBeCloseTo(50, 9);
    for (const [x, y] of places) expect(Math.hypot(x - 100, y - 100)).toBeCloseTo(50, 9);
    expect(closest(places)).toBeCloseTo(50, 9); // a hexagon's side equals its radius
  });

  it('wraps items like words: in order, never wider than the area, never overlapping', () => {
    const widths = [80, 40, 120, 60, 90, 30, 200, 50];
    const boxes = flowLayout({ ...area, widths, rowHeight: 20, gap: 8 });
    expect(boxes.map((b) => b.width)).toEqual(widths);
    for (const b of boxes) expect(b.x + b.width).toBeLessThanOrEqual(310 + 1e-9);
    for (let k = 1; k < boxes.length; k++) {
      const [a, b] = [boxes[k - 1], boxes[k]];
      expect(b.y > a.y || (b.y === a.y && b.x > a.x)).toBe(true); // reading order
    }
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) expect(overlaps(boxes[a], boxes[b])).toBe(false);
    const centred = flowLayout({ ...area, widths: [100], rowHeight: 20, gap: 8, align: 'middle' });
    expect(centred[0].x).toBe(10 + 100);
  });

  it('packs circles closely around the centre without any overlap', () => {
    const radii = [30, 24, 22, 18, 16, 14, 12, 10, 10, 8, 8, 6];
    const circles = packCircles({ radii, cx: 200, cy: 100, padding: 3 });
    expect(circles.map((c) => c.r)).toEqual(radii);
    for (let a = 0; a < circles.length; a++)
      for (let b = a + 1; b < circles.length; b++) {
        const [p, q] = [circles[a], circles[b]];
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(p.r + q.r + 3 - 1e-6);
      }
    // Close: everything sits within a circle of about twice the radius of a disc with the same total area.
    const reach = Math.max(...circles.map((c) => Math.hypot(c.x - 200, c.y - 100) + c.r));
    const equal = Math.sqrt(radii.reduce((s, r) => s + (r + 3) ** 2, 0));
    expect(reach).toBeLessThanOrEqual(equal * 2);
    expect(packCircles({ radii, cx: 200, cy: 100, padding: 3 })).toEqual(circles);
  });
});
