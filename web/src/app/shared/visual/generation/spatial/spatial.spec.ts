import { NEAR, along, alongV, camera, clipNear, clipSegment, facesCamera, onFrame, place, toCamera } from './camera';
import { PART_NAMES, POSES, SEEN_FROM_WITHIN } from './figures';
import { paintersOrder, slabOf, splitPolygon, splitSegment } from './order';
import { boxFaces, capsulePath, floorEllipse, polygonPath } from './solids';

// S2 spatial geometry (pulled by camera-angle.room): the camera, the solids, the poses and the
// drawing order. Pure and deterministic.

describe('S2 spatial: the camera', () => {
  const cam = camera([0, 0, 0], [0, 0, 1], 500, 480, 270);

  it('puts what it looks at in the middle, and right, up and nearer where they belong', () => {
    expect(onFrame(cam, toCamera(cam, [0, 0, 5]))).toEqual([480, 270]);
    const [x, y] = onFrame(cam, toCamera(cam, [1, 1, 5]));
    expect(x).toBeCloseTo(580);
    expect(y).toBeCloseTo(170);
    expect(onFrame(cam, toCamera(cam, [1, 0, 2]))[0]).toBeGreaterThan(x);
  });

  it('turns towards its target and never rolls', () => {
    const turned = camera([0, 1.5, 0], [4, 0.5, 3], 500, 480, 270);
    expect(toCamera(turned, [4, 0.5, 3])[0]).toBeCloseTo(0);
    expect(toCamera(turned, [4, 0.5, 3])[1]).toBeCloseTo(0);
    expect(turned.right[1]).toBeCloseTo(0); // level
  });

  it('tells which faces turn towards it', () => {
    expect(facesCamera(cam, [0, 0, -1], [0, 0, 5])).toBe(true);
    expect(facesCamera(cam, [0, 0, 1], [0, 0, 5])).toBe(false);
  });

  it('cuts polygons and segments to the part in front of the near plane', () => {
    const cut = clipNear([[-1, 0, -1], [1, 0, -1], [1, 0, 2], [-1, 0, 2]]);
    expect(cut).toHaveLength(4);
    for (const p of cut) expect(p[2]).toBeGreaterThanOrEqual(NEAR - 1e-9);
    expect(clipNear([[0, 0, -2], [1, 0, -2], [1, 0, -1]])).toEqual([]);
    expect(clipSegment([0, 0, -1], [0, 0, 1])![0][2]).toBeCloseTo(NEAR);
    expect(clipSegment([0, 0, -1], [0, 0, -0.5])).toBeNull();
  });

  it('places a local point turned about the vertical axis', () => {
    const p = place([0, 1, 1], Math.PI, [2, 0, 3]);
    expect(p[0]).toBeCloseTo(2);
    expect(p[1]).toBeCloseTo(1);
    expect(p[2]).toBeCloseTo(2);
  });

  it('moves along a smooth path that lands exactly on each keyframe', () => {
    const keys = [0, 2, 3, 7];
    for (let i = 0; i < keys.length; i++) expect(along(i, keys)).toBeCloseTo(keys[i]);
    expect(along(-1, keys)).toBe(along(0, keys));
    expect(along(9, keys)).toBe(along(3, keys));
    expect(alongV(1, [[0, 0, 0], [1, 2, 3], [2, 2, 2]])).toEqual([1, 2, 3]);
    // No stop at a keyframe it passes through.
    expect(along(1.01, keys) - along(0.99, keys)).toBeGreaterThan(0.01);
  });
});

describe('S2 spatial: solids and poses', () => {
  it('makes a box of faces with outward normals, its top cut into tiles', () => {
    const faces = boxFaces([0, 0, 0], [1, 1, 1], 2);
    expect(faces).toHaveLength(5 + 4);
    for (const f of faces) {
      const c = f.pts.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4, s[2] + p[2] / 4], [0, 0, 0]);
      // The normal points away from the box's centre.
      expect((c[0] - 0.5) * f.normal[0] + (c[1] - 0.5) * f.normal[1] + (c[2] - 0.5) * f.normal[2]).toBeGreaterThan(0);
    }
  });

  it('draws closed paths, the same each time', () => {
    expect(capsulePath([0, 0], [10, 0], 2, 1)).toMatch(/Z$/);
    expect(capsulePath([0, 0], [10, 0], 2, 1)).toBe(capsulePath([0, 0], [10, 0], 2, 1));
    expect(capsulePath([5, 5], [5, 5], 2, 3)).toMatch(/Z$/);
    expect(polygonPath([[0, 0], [1, 0], [1, 1]])).toBe('M0 0L1 0L1 1Z');
    expect(floorEllipse(0, 0, 1, 1)).toHaveLength(20);
  });

  it('has faceless figures of one build: the same parts and head in every pose', () => {
    for (const pose of Object.values(POSES)) {
      expect(pose.parts.map((p) => p.name).sort()).toEqual([...PART_NAMES].sort());
      expect(pose.head.r).toBe(0.105);
    }
    expect(SEEN_FROM_WITHIN).toEqual(['forearm-l', 'forearm-r']);
  });
});

describe('S2 spatial: drawing order by slabs', () => {
  const cuts = [0.48, 0.76];

  it('puts a height in its slab, a point on a cut below it', () => {
    expect(slabOf(0.2, cuts)).toBe(0);
    expect(slabOf(0.48, cuts)).toBe(0);
    expect(slabOf(0.6, cuts)).toBe(1);
    expect(slabOf(0.76, cuts)).toBe(1);
    expect(slabOf(1.2, cuts)).toBe(2);
  });

  it('cuts a polygon across slabs into pieces that stay within them', () => {
    const wall = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]] as const;
    const pieces = splitPolygon(wall, cuts);
    expect(pieces.map((p) => p.slab)).toEqual([0, 1, 2]);
    for (const piece of pieces) {
      const lo = piece.slab > 0 ? cuts[piece.slab - 1] : -Infinity;
      const hi = piece.slab < cuts.length ? cuts[piece.slab] : Infinity;
      for (const p of piece.pts) {
        expect(p[1]).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(p[1]).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
    expect(splitPolygon([[0, 1, 0], [1, 1, 0], [1, 1, 1]], cuts)).toEqual([{ slab: 2, pts: [[0, 1, 0], [1, 1, 0], [1, 1, 1]] }]);
    // With an overlap, a lower piece reaches just past its cut, under the piece above.
    const overlapped = splitPolygon(wall, cuts, 0.01);
    expect(Math.max(...overlapped[0].pts.map((p) => p[1]))).toBeCloseTo(0.49);
    expect(Math.min(...overlapped[1].pts.map((p) => p[1]))).toBeCloseTo(0.48);
  });

  it('cuts a limb at the slabs, its radius following along', () => {
    const pieces = splitSegment([0, 0.2, 0], [0, 1.2, 0], 0.1, 0.05, cuts);
    expect(pieces.map((p) => p.slab)).toEqual([0, 1, 2]);
    expect(pieces[0].to[1]).toBeCloseTo(0.48);
    expect(pieces[2].r1).toBeCloseTo(0.05);
    expect(splitSegment([0, 0.9, 0], [0, 1.1, 0], 0.1, 0.1, cuts)).toHaveLength(1);
  });

  it('paints slab by slab from the floor up, far to near within a slab', () => {
    const order = paintersOrder([
      { id: 'knee', slab: 1, depth: 1.2 },
      { id: 'table', slab: 1, depth: 2.0 },
      { id: 'forearm', slab: 2, depth: 1.5 },
      { id: 'seat', slab: 0, depth: 1.0 },
    ]);
    expect(order.map((o) => o.id)).toEqual(['seat', 'table', 'knee', 'forearm']);
  });
});
