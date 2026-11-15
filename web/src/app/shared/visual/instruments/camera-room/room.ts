import { Composed, composeScene } from '../../composition/compose';
import type { Point, Purpose, SceneElement } from '../../composition/scene';
import { Camera, V3, alongV, along, camera, clipNear, clipSegment, dot, facesCamera, length, mixV, normalize, onFrame, place, sub, toCamera } from '../../generation/spatial/camera';
import { POSES, Pose, SEEN_FROM_WITHIN } from '../../generation/spatial/figures';
import { paintersOrder, splitPolygon, splitSegment } from '../../generation/spatial/order';
import { Face, boxFaces, capsulePath, floorEllipse, polygonPath } from '../../generation/spatial/solids';
import type { ColorRole, Facing, StyleRef, ThemeId } from '../../styling/vocabulary';

/**
 * "Change the camera angle" (docs/camera-angle-design.md): the room. A spatial view
 * (visual-policy.md §3.4): a real room in constructed perspective, and a camera that steps back
 * through it along one path, from your own eyes to outside the building. Built from data: the
 * exercise's viewpoint, a continuous value from 0 to 3, composed again for every frame of a move
 * by the viewpoint figure (integration/viewpoint-figure.ts).
 *
 * Its policy (docs/visual-policy.md §8):
 *
 *   Scene:      camera-angle.room@2    Area theme: cognitive@1    Tier: instrument (a spatial view)
 *   Idea:       the same moment seen from further and further back, until you see yourself in it
 *               and the people and rooms around it.
 *   States:     one per viewpoint, continuous; at the four positions:
 *               0 through your own eyes: the person across the table; only your forearms of you
 *               1 behind your shoulder: you, in the picture for the first time
 *               2 from the far corner, a little higher: the whole room, the third person at their desk
 *               3 outside, above the walls drawn cut low: the room among others, people next door,
 *                 in the corridor and in the room behind getting on with their day
 *   Metaphor:   a film camera stepping back (the research instruction: "take a few steps back and
 *               watch it happen to you"). Known weakness: a generic room won't match every moment.
 *   Must:       you in the area colour at every position, never smaller or less clear than anyone
 *               else; people faceless and of one build (§7 exception); only your forearms through
 *               your own eyes; more people in view the further back, never fewer; the camera never
 *               looks up at anyone or straight down, never rolls; token colours only; one label, "You".
 *   Must not:   make any position look better (no light, colour or framing reward for distance);
 *               show a face, an expression or any of the person's own words.
 *   Motion:     only the viewpoint moves (§3.12, a viewpoint move); nothing in the room moves, and
 *               nothing appears at once: you enter from the picture's lower edge as the camera rises
 *               out of your head, and what lies beyond the walls comes into view over their tops.
 *   Version 2:  (2026-11-15, refinements to the approved @1) "You" from position 1; your forearms and
 *               hands clearly in view at position 0; the first step reshaped so you no longer appear
 *               all at once; the other rooms and the ground drawn when the camera is above the walls,
 *               not at a fixed point; only the moment's room has a tinted floor; a faint line where
 *               floors meet walls; a quieter door; the furthest view a little closer. Distant people's
 *               legs close into one form gradually, not in one frame (2026-11-16; stills unchanged).
 *   Alt texts:  the exercise gives one per position.
 *   Assertions: `room.policy.spec.ts`.
 *   Review:     R2 in the Visual Lab; R3 and the psychology-trained reviewer in the exercise.
 */
export const ROOM = { id: 'camera-angle.room', version: 2, theme: 'cognitive' as ThemeId } as const;
export const ROOM_SIZE = { width: 960, height: 540 };
export const ROOM_POSITIONS = 4;

export interface RoomWords {
  /** The label beside you, once you are in the picture. */
  you: string;
  /** The text alternative at each of the four positions. */
  alts: readonly string[];
}

export interface RoomInput {
  /** Where the camera is on its path: 0 (your own eyes) to 3 (furthest back), anything between. */
  view: number;
  words: RoomWords;
}

/** Why each group of elements is there (visual-policy.md principle 6; §3.13, groups in a spatial view). */
export const ROOM_PURPOSES = {
  room: {
    serves: ['understanding'],
    why: 'The room the moment happens in: walls, floor, a window and a door to the world outside. From furthest back the walls are drawn cut low, as an architect’s section, so you can see into it.',
  },
  table: { serves: ['concept'], why: 'What the moment is about: the table you share with the person across it.' },
  furniture: { serves: ['understanding'], why: 'Chairs, a desk and a screen: what makes it a real place, and what the third person is busy with.' },
  you: {
    serves: ['concept', 'feedback'],
    why: 'You. Through your own eyes only your forearms are in view; one step back, you are in the picture for the first time, which is what makes a view an observer’s. In the area colour at every position, never smaller or less clear than anyone else.',
  },
  person: {
    serves: ['understanding'],
    why: 'The other people in the situation, each with their own part in it: the person across the table, the one at their own desk. Faceless and unexpressive, so they stand for anyone.',
  },
  elsewhere: {
    serves: ['concept'],
    why: 'From furthest back the moment is one room among others: people next door, in the corridor and in the room behind, getting on with their day.',
  },
  shadow: { serves: ['understanding'], why: 'Grounds the people and the table on the floor, so the space reads.' },
  outside: { serves: ['understanding'], why: 'The ground around the building, seen only from outside.' },
  label: { serves: ['understanding'], why: 'Names you, in the exercise’s words, once you are in the picture.' },
} as const satisfies Record<string, Purpose>;
export type RoomGroup = keyof typeof ROOM_PURPOSES;

/** The heights the drawing order cuts at: a seat, a table top (generation/spatial/order.ts). */
const CUTS = [0.48, 0.76];
/** How far a face cut at a slab reaches under its upper part, so they meet without a seam (metres). */
const SEAM_OVERLAP = 0.006;
const WALL_HEIGHT = 2.6;
/** The lowest the walls are drawn, from furthest back: an architect's cut. */
const CUT_HEIGHT = 1.05;
/** How far the camera must be from the middle of your head before the rest of you is drawn (metres). */
const SELF_CLEARANCE = 0.3;
/** The platform light (vocabulary LIGHT: from the upper left), as a direction in the room. */
const LIGHT = normalize([-0.5, 0.8, -0.35]);

interface Person {
  id: string;
  pose: Pose;
  at: V3;
  angle: number;
  group: 'you' | 'person' | 'elsewhere';
}

interface Box {
  id: string;
  min: V3;
  max: V3;
  role: 'near';
  group: 'table' | 'furniture' | 'elsewhere';
  tiles?: number;
  /** Casts a soft shadow on the floor. */
  shadow?: boolean;
}

type Side = 'x0' | 'x1' | 'z0' | 'z1';

interface Room {
  id: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  group: 'room' | 'elsewhere';
  fixtures: readonly { side: Side; from: number; to: number; y0: number; y1: number; kind: 'window' | 'door' }[];
  boxes: readonly Box[];
  people: readonly Person[];
  /** A screen on a desk: its base is a box; its face turns to whoever uses it. */
  screens?: readonly { pts: readonly V3[]; normal: V3 }[];
}

/** A chair at `at`, facing `angle` (only along x or z, so its boxes stay square to the room). */
function chair(id: string, at: V3, angle: number, group: Box['group']): Box[] {
  const turn = (p: V3) => place(p, angle, at);
  const box = (suffix: string, a: V3, b: V3): Box => {
    const [p, q] = [turn(a), turn(b)];
    return {
      id: `${id}-${suffix}`,
      min: [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.min(p[2], q[2])],
      max: [Math.max(p[0], q[0]), Math.max(p[1], q[1]), Math.max(p[2], q[2])],
      role: 'near',
      group,
    };
  };
  return [box('seat', [-0.22, 0.44, -0.4], [0.22, 0.48, 0.02]), box('back', [-0.22, 0.48, -0.44], [0.22, 0.92, -0.4])];
}

const YOU_AT: V3 = [0, 0, 1.05];
export const YOUR_HEAD = place(POSES.seated.head.at, 0, YOU_AT);
const OPPOSITE_AT: V3 = [0, 0, 2.95];
const THIRD_AT: V3 = [2.15, 0, 3.2];

const ROOMS: readonly Room[] = [
  {
    id: 'ours',
    x0: -3,
    x1: 3,
    z0: -1,
    z1: 5,
    group: 'room',
    fixtures: [
      { side: 'x0', from: 1.0, to: 3.2, y0: 0.9, y1: 2.2, kind: 'window' },
      { side: 'z1', from: -2.2, to: -1.3, y0: 0, y1: 2.1, kind: 'door' },
    ],
    boxes: [
      { id: 'table-top', min: [-0.6, 0.72, 1.45], max: [0.6, 0.76, 2.55], role: 'near', group: 'table', shadow: true },
      { id: 'table-leg-a', min: [-0.55, 0, 1.5], max: [-0.5, 0.72, 1.55], role: 'near', group: 'table' },
      { id: 'table-leg-b', min: [0.5, 0, 1.5], max: [0.55, 0.72, 1.55], role: 'near', group: 'table' },
      { id: 'table-leg-c', min: [-0.55, 0, 2.45], max: [-0.5, 0.72, 2.5], role: 'near', group: 'table' },
      { id: 'table-leg-d', min: [0.5, 0, 2.45], max: [0.55, 0.72, 2.5], role: 'near', group: 'table' },
      ...chair('your-chair', YOU_AT, 0, 'furniture'),
      ...chair('opposite-chair', OPPOSITE_AT, Math.PI, 'furniture'),
      // The third person's own desk, by the wall, and their screen.
      { id: 'desk-top', min: [2.45, 0.72, 2.8], max: [2.95, 0.76, 3.6], role: 'near', group: 'furniture', shadow: true },
      // Its legs at the back edge, against the wall, clear of the knees of whoever sits at it.
      { id: 'desk-leg-a', min: [2.88, 0, 2.85], max: [2.93, 0.72, 2.9], role: 'near', group: 'furniture' },
      { id: 'desk-leg-b', min: [2.88, 0, 3.5], max: [2.93, 0.72, 3.55], role: 'near', group: 'furniture' },
      { id: 'laptop', min: [2.6, 0.76, 3.06], max: [2.84, 0.775, 3.34], role: 'near', group: 'furniture' },
      ...chair('third-chair', THIRD_AT, Math.PI / 2, 'furniture'),
    ],
    people: [
      { id: 'you', pose: POSES.seated, at: YOU_AT, angle: 0, group: 'you' },
      { id: 'opposite', pose: POSES.seated, at: OPPOSITE_AT, angle: Math.PI, group: 'person' },
      { id: 'third', pose: POSES['seated-at-screen'], at: THIRD_AT, angle: Math.PI / 2, group: 'person' },
    ],
    // The laptop's screen, tilted back, its face to the third person.
    screens: [{ pts: [[2.86, 0.775, 3.34], [2.86, 0.775, 3.06], [2.92, 0.98, 3.06], [2.92, 0.98, 3.34]], normal: normalize([-1, 0.28, 0]) }],
  },
  {
    id: 'corridor',
    x0: 3,
    x1: 4.6,
    z0: -1,
    z1: 8.5,
    group: 'elsewhere',
    fixtures: [],
    boxes: [],
    people: [{ id: 'corridor-walker', pose: POSES.walking, at: [3.8, 0, 1.4], angle: Math.PI, group: 'elsewhere' }],
  },
  {
    id: 'next',
    x0: 4.6,
    x1: 9,
    z0: -1,
    z1: 5,
    group: 'elsewhere',
    fixtures: [{ side: 'x1', from: 1.2, to: 3.6, y0: 0.9, y1: 2.2, kind: 'window' }],
    boxes: [
      { id: 'next-desk', min: [5.4, 0.72, 4.1], max: [6.8, 0.76, 4.7], role: 'near', group: 'elsewhere', shadow: true },
      ...chair('next-chair', [6.1, 0, 3.55], 0, 'elsewhere'),
    ],
    people: [
      { id: 'next-window', pose: POSES.standing, at: [8.3, 0, 2.4], angle: Math.PI / 2, group: 'elsewhere' },
      { id: 'next-worker', pose: POSES['seated-at-screen'], at: [6.1, 0, 3.55], angle: 0, group: 'elsewhere' },
    ],
  },
  {
    id: 'back',
    x0: -3,
    x1: 3,
    z0: 5,
    z1: 8.5,
    group: 'elsewhere',
    fixtures: [{ side: 'z1', from: -1.0, to: 1.4, y0: 0.9, y1: 2.2, kind: 'window' }],
    boxes: [{ id: 'back-counter', min: [-2.7, 0, 7.9], max: [-0.6, 0.9, 8.5], role: 'near', group: 'elsewhere' }],
    people: [{ id: 'back-counter', pose: POSES.standing, at: [-1.6, 0, 7.3], angle: 0, group: 'elsewhere' }],
  },
];

interface Key {
  pos: V3;
  target: V3;
  /** Focal length, in frame units. */
  f: number;
}

/** The camera at each of the four positions: where it stands and what it looks at. */
const POSITION_KEYS: readonly Key[] = [
  // Your own eyes, looking a little down across the table: your forearms and hands in view.
  { pos: [0, 1.14, 1.02], target: [0, 0.68, 2.9], f: 740 },
  { pos: [-0.7, 1.8, -0.2], target: [0.35, 0.85, 2.6], f: 640 },
  { pos: [-2.6, 2.25, -0.7], target: [0.6, 0.72, 2.4], f: 600 },
  { pos: [-6.2, 10.5, -8.4], target: [2.0, 0.2, 3.1], f: 900 },
];

/**
 * Leaving your own eyes (halfway from position 0 to 1): the camera first rises out of your head,
 * looking down at your own arms on the table, and only then steps back. So you come into the picture
 * from its lower edge, head first, as the camera clears you, rather than appearing all at once.
 */
const LEAVING: Key = { pos: [-0.18, 1.6, 0.8], target: [0.1, 0.76, 2.4], f: 700 };

const midway = (a: Key, b: Key, c: Key, d: Key): Key => {
  // The point halfway along the smooth curve through four keys (Catmull-Rom at its middle).
  const m = (p: number, q: number, r: number, s: number) => (-p + 9 * q + 9 * r - s) / 16;
  const v = (k: 0 | 1 | 2, of: 'pos' | 'target') => m(a[of][k], b[of][k], c[of][k], d[of][k]);
  return { pos: [v(0, 'pos'), v(1, 'pos'), v(2, 'pos')], target: [v(0, 'target'), v(1, 'target'), v(2, 'target')], f: m(a.f, b.f, c.f, d.f) };
};

/** The camera's path: a key at every half position, so each step has its own shape. */
const [P0, P1, P2, P3] = POSITION_KEYS;
const KEYS: readonly Key[] = [P0, LEAVING, P1, midway(P0, P1, P2, P3), P2, midway(P1, P2, P3, P3), P3];

export function cameraAt(view: number): Camera {
  const u = view * 2;
  return camera(
    alongV(u, KEYS.map((k) => k.pos)),
    alongV(u, KEYS.map((k) => k.target)),
    along(u, KEYS.map((k) => k.f)),
    ROOM_SIZE.width / 2,
    ROOM_SIZE.height / 2,
  );
}

/** Which way a face turns to the platform light. */
function facingOf(normal: V3): Facing {
  const d = dot(normal, LIGHT);
  return d > 0.55 ? 'lit' : d > -0.1 ? 'base' : 'shade';
}

const purpose = (group: RoomGroup): Purpose => ROOM_PURPOSES[group];
const style = (role: ColorRole, facing: Facing): StyleRef => ({ role, material: 'shaded', facing });

interface Drawn {
  slab: number;
  depth: number;
  element: SceneElement;
}

type Shape = Extract<SceneElement, { kind: 'shape' }>;

/** Whether any of these points' box (grown by `margin`) is on the frame: what isn't in view isn't drawn. */
function inView(points: readonly (readonly [number, number])[], margin = 0): boolean {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return Math.max(...xs) + margin >= 0 && Math.min(...xs) - margin <= ROOM_SIZE.width && Math.max(...ys) + margin >= 0 && Math.min(...ys) - margin <= ROOM_SIZE.height;
}

/** A face on the frame, if it turns to the camera and any of it is in front of it and in view. */
function face(cam: Camera, id: string, pts: readonly V3[], normal: V3, role: ColorRole, group: RoomGroup, facing?: Facing): Shape | null {
  const centre = pts.reduce<V3>((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
  if (!facesCamera(cam, normal, centre)) return null;
  const clipped = clipNear(pts.map((p) => toCamera(cam, p)));
  if (clipped.length < 3) return null;
  const onFrameAt = clipped.map((c) => onFrame(cam, c));
  if (!inView(onFrameAt)) return null;
  return { kind: 'shape', id, geometry: { type: 'path', d: polygonPath(onFrameAt) }, style: style(role, facing ?? facingOf(normal)), purpose: purpose(group) };
}

function depthOf(cam: Camera, pts: readonly V3[]): number {
  return pts.reduce((s, p) => s + toCamera(cam, p)[2], 0) / pts.length;
}

/** A face cut into the slabs it crosses, each piece with its own place in the drawing order. */
function slabbedFace(cam: Camera, id: string, f: Face, role: ColorRole, group: RoomGroup): Drawn[] {
  return splitPolygon(f.pts, CUTS, SEAM_OVERLAP).flatMap((piece, i) => {
    const element = face(cam, `${id}-${i}`, piece.pts, f.normal, role, group);
    return element ? [{ slab: piece.slab, depth: depthOf(cam, piece.pts), element }] : [];
  });
}

/**
 * How far a person's legs have closed into one form, from 0 (as posed) to 1 (one form), by the size of
 * their head on the picture. Far away (a head under 12 units across) a gap between two legs would be
 * thinner than a pixel, which no backend draws the same way, so the legs are one form. Between a head
 * 12.9 and 11.9 units across they close together gradually, so as the camera pulls back the gap between
 * them narrows and goes, never vanishing in one frame. (The band lies between the sizes at the four
 * positions: everyone's legs are as posed at positions 0 to 2, and at position 3 yours are as posed and
 * everyone else's are one form, so the still pictures are what they were.)
 */
const LEGS_APART = 6.45;
const LEGS_TOGETHER = 5.95;
function legsClosed(headRadius: number): number {
  const x = Math.min(1, Math.max(0, (LEGS_APART - headRadius) / (LEGS_APART - LEGS_TOGETHER)));
  return x * x * (3 - 2 * x);
}

function closedFor(cam: Camera, p: Person): number {
  const head = toCamera(cam, place(p.pose.head.at, p.angle, p.at));
  return head[2] > 0.15 ? legsClosed((cam.f * p.pose.head.r) / head[2]) : 0;
}

/** How far each person's legs have closed at a viewpoint, by person id: for the policy spec. */
export function legsAt(view: number): Record<string, number> {
  const cam = cameraAt(Math.min(Math.max(view, 0), ROOM_POSITIONS - 1));
  return Object.fromEntries(ROOMS.flatMap((r) => r.people).map((p) => [p.id, closedFor(cam, p)]));
}

/** A pose's legs closed by `closed` (see legsClosed): at 1, one form each for thighs and shins, from the
 * middle of the pair to the middle of the pair, wide enough to cover both; between, each leg partway
 * there. Other parts as they are. */
function together(parts: Pose['parts'], closed: number): Pose['parts'] {
  if (closed <= 0) return parts;
  const by = new Map(parts.map((q) => [q.name, q]));
  const pair = (l: string, r: string, name: 'thigh-l' | 'shin-l') => {
    const a = by.get(l as never)!;
    const b = by.get(r as never)!;
    const mid = (u: V3, w: V3): V3 => [(u[0] + w[0]) / 2, (u[1] + w[1]) / 2, (u[2] + w[2]) / 2];
    const half = (u: V3, w: V3) => length(sub(u, w)) / 2;
    return { name, from: mid(a.from, b.from), to: mid(a.to, b.to), r0: Math.max(a.r0, b.r0) + half(a.from, b.from), r1: Math.max(a.r1, b.r1) + half(a.to, b.to) };
  };
  const thighs = pair('thigh-l', 'thigh-r', 'thigh-l');
  const shins = pair('shin-l', 'shin-r', 'shin-l');
  if (closed >= 1) return [thighs, shins, ...parts.filter((q) => !q.name.startsWith('thigh') && !q.name.startsWith('shin'))];
  // Partway: each leg moves toward the one form and widens to it, so at 1 the two are the same form.
  return parts.map((q) => {
    const to = q.name.startsWith('thigh') ? thighs : q.name.startsWith('shin') ? shins : null;
    if (!to) return q;
    return { ...q, from: mixV(q.from, to.from, closed), to: mixV(q.to, to.to, closed), r0: q.r0 + (to.r0 - q.r0) * closed, r1: q.r1 + (to.r1 - q.r1) * closed };
  });
}

/**
 * A person, as one shape per slab: all their parts in that slab (and their head, above the table) in a
 * single path, flat in one tone. One outline per piece, so both backends smooth the person's edge once,
 * as a whole, and a person costs a few shapes rather than a dozen. Its id names the parts it holds
 * (`you-s2-forearm-l+forearm-r`), so what is in view can be checked. (Limbs in lit and shaded tones, a
 * shaded head, and parts drawn one by one were tried first: SVG and canvas smooth the long curves
 * between close tones, or between overlapping forms, differently, past the parity suite's threshold.)
 */
function person(cam: Camera, p: Person, hideSelf: boolean): Drawn[] {
  const role: ColorRole = p.group === 'you' ? 'subject' : 'context';
  const slabs = new Map<number, { names: string[]; d: string; depths: number[] }>();
  const add = (slab: number, name: string, d: string, depth: number) => {
    const s = slabs.get(slab) ?? { names: [], d: '', depths: [] };
    if (!s.names.includes(name)) s.names.push(name);
    s.d += d;
    s.depths.push(depth);
    slabs.set(slab, s);
  };
  // Far away, a person's legs close into one form (see legsClosed). Up close, every part as posed.
  for (const part of together(p.pose.parts, closedFor(cam, p))) {
    if (hideSelf && !SEEN_FROM_WITHIN.includes(part.name)) continue;
    const pieces = splitSegment(place(part.from, p.angle, p.at), place(part.to, p.angle, p.at), part.r0, part.r1, CUTS);
    for (const piece of pieces) {
      // A sliver cut off at a slab is covered by its neighbour's rounded end: it isn't drawn.
      if (pieces.length > 1 && length(sub(piece.to, piece.from)) < 0.035) continue;
      const seg = clipSegment(toCamera(cam, piece.from), toCamera(cam, piece.to));
      if (!seg) continue;
      const [a, b] = seg;
      const [pa, pb] = [onFrame(cam, a), onFrame(cam, b)];
      const [ra, rb] = [(cam.f * piece.r0) / a[2], (cam.f * piece.r1) / b[2]];
      if (!inView([pa, pb], Math.max(ra, rb))) continue;
      add(piece.slab, part.name, capsulePath(pa, pb, ra, rb), (a[2] + b[2]) / 2);
    }
  }
  if (!hideSelf) {
    const h = toCamera(cam, place(p.pose.head.at, p.angle, p.at));
    if (h[2] > 0.15) {
      const [x, y] = onFrame(cam, h);
      const r = (cam.f * p.pose.head.r) / h[2];
      // The head: an ellipse, as two arcs turning the same way as the parts, so they fill as one.
      const [rx, ry] = [r1(r), r1(r * 1.12)];
      if (inView([[x, y]], ry)) add(CUTS.length, 'head', `M${r1(x - rx)} ${r1(y)}A${rx} ${ry} 0 1 0 ${r1(x + rx)} ${r1(y)}A${rx} ${ry} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`, h[2]);
    }
  }
  return [...slabs.entries()].map(([slab, s]) => ({
    slab,
    depth: s.depths.reduce((t, d) => t + d, 0) / s.depths.length,
    // The parts twice over: where their outlines cross inside the shape, a renderer's smoothing loses a
    // little coverage (a faint seam); filled twice, it sums past full there, so no renderer shows one.
    element: { kind: 'shape', id: `${p.id}-s${slab}-${s.names.join('+')}`, geometry: { type: 'path', d: s.d + s.d }, style: style(role, 'base'), purpose: purpose(p.group) },
  }));
}

const r1 = (n: number) => Math.round(n * 100) / 100;

/** A soft shadow on the floor, under the object it grounds. */
function shadow(cam: Camera, id: string, grounds: string, x: number, z: number, rx: number, rz: number, group: RoomGroup): SceneElement | null {
  const clipped = clipNear(floorEllipse(x, z, rx, rz).map((p) => toCamera(cam, p)));
  if (clipped.length < 3) return null;
  const pts = clipped.map((c) => onFrame(cam, c));
  if (!inView(pts)) return null;
  return { kind: 'shape', id, geometry: { type: 'path', d: polygonPath(pts) }, style: { role: 'ink', material: 'shadow' }, purpose: purpose(group === 'elsewhere' ? 'elsewhere' : 'shadow'), grounds };
}

function room(cam: Camera, r: Room, wallHeight: number, hideSelf: boolean): SceneElement[] {
  const out: SceneElement[] = [];
  const { x0, x1, z0, z1 } = r;
  const group: RoomGroup = r.group;
  // The room of the moment has the one tinted floor; the rooms around it lie on the ground's own tone,
  // drawn by their walls alone. So from furthest back the moment's room is still the picture's subject.
  const floor = face(cam, `${r.id}-floor`, [[x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]], [0, 1, 0], r.group === 'room' ? 'mid' : 'far', group, 'lit');
  // Where the floor meets the walls: a faint line around the floor, so the room's shape reads where a
  // wall and the floor are close in tone, and in forced colours, where both are the page's ground.
  const edge: SceneElement[] = floor ? [{ ...floor, id: `${r.id}-floor-edge`, style: { role: 'far', line: 'hair' } }] : [];
  // Walls face into the room, so a wall between the camera and the room is never drawn.
  const h = wallHeight;
  const walls: { side: Side; pts: V3[]; normal: V3; top: [V3, V3] }[] = [
    { side: 'x0', pts: [[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], normal: [1, 0, 0], top: [[x0, h, z0], [x0, h, z1]] },
    { side: 'x1', pts: [[x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]], normal: [-1, 0, 0], top: [[x1, h, z1], [x1, h, z0]] },
    { side: 'z0', pts: [[x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0]], normal: [0, 0, 1], top: [[x1, h, z0], [x0, h, z0]] },
    { side: 'z1', pts: [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], normal: [0, 0, -1], top: [[x0, h, z1], [x1, h, z1]] },
  ];
  const fixtures: SceneElement[] = [];
  for (const w of walls) {
    const wall = face(cam, `${r.id}-wall-${w.side}`, w.pts, w.normal, 'far', group);
    if (!wall) continue;
    out.push(wall);
    r.fixtures.forEach((f, i) => {
      if (f.side !== w.side) return;
      const y1 = Math.min(f.y1, h);
      if (y1 <= f.y0 + 0.05) return;
      const at = (a: number, y: number, inset: number): V3 =>
        w.side === 'x0' ? [x0 + inset, y, a] : w.side === 'x1' ? [x1 - inset, y, a] : w.side === 'z0' ? [a, y, z0 + inset] : [a, y, z1 - inset];
      const [p, q] = w.side === 'x1' || w.side === 'z0' ? [f.to, f.from] : [f.from, f.to];
      const outline = [at(p, f.y0, 0.01), at(q, f.y0, 0.01), at(q, y1, 0.01), at(p, y1, 0.01)];
      if (f.kind === 'window') {
        // Daylight: the window is the ground's own light, framed.
        const pane = face(cam, `${r.id}-window-${i}`, outline, w.normal, 'far', group, 'lit');
        if (pane) fixtures.push({ ...pane, style: { role: 'ground', material: 'tonal' } }, { ...pane, id: `${r.id}-window-${i}-frame`, style: { role: 'far', line: 'fine' } });
      } else {
        // A door: quiet, in the room's own steps (a thin frame in the floor's shade, its leaf the wall's), so it
        // reads as a way out without drawing the eye from the people.
        const frame = face(cam, `${r.id}-door-${i}`, outline, w.normal, 'mid', group, 'shade');
        const inner = [at(p + (q - p) * 0.06, f.y0, 0.012), at(q - (q - p) * 0.06, f.y0, 0.012), at(q - (q - p) * 0.06, y1 - 0.06, 0.012), at(p + (q - p) * 0.06, y1 - 0.06, 0.012)];
        const leaf = face(cam, `${r.id}-door-${i}-leaf`, inner, w.normal, 'far', group, 'shade');
        if (frame) fixtures.push(frame);
        if (leaf) fixtures.push(leaf);
      }
    });
    out.push(...fixtures.splice(0));
    // Cut walls show their cut edge, as in an architect's section.
    if (h < WALL_HEIGHT - 0.05) {
      const seg = clipSegment(toCamera(cam, w.top[0]), toCamera(cam, w.top[1]));
      if (seg) {
        const [a, b] = [onFrame(cam, seg[0]), onFrame(cam, seg[1])];
        out.push({ kind: 'shape', id: `${r.id}-cut-${w.side}`, geometry: { type: 'line', x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]) }, style: { role: 'context', line: 'regular' }, purpose: purpose(group) });
      }
    }
  }
  // What stands in the room, slab by slab, far to near.
  const drawn: Drawn[] = [];
  for (const b of r.boxes)
    boxFaces(b.min, b.max, b.tiles ?? 1).forEach((f, i) => drawn.push(...slabbedFace(cam, `${b.id}-${i}`, f, b.role, b.group)));
  for (const s of r.screens ?? []) {
    const element = face(cam, `${r.id}-screen`, s.pts, s.normal, 'far', r.group === 'room' ? 'furniture' : 'elsewhere', 'lit');
    const back = face(cam, `${r.id}-screen-back`, [...s.pts].reverse(), [-s.normal[0], -s.normal[1], -s.normal[2]], 'near', r.group === 'room' ? 'furniture' : 'elsewhere');
    for (const e of [element, back]) if (e) drawn.push({ slab: CUTS.length, depth: depthOf(cam, s.pts), element: e });
  }
  for (const p of r.people) drawn.push(...person(cam, p, hideSelf && p.group === 'you'));
  const ordered = paintersOrder(drawn).map((d) => d.element);
  // Soft shadows on the floor under people and tables, each naming the first piece of what it grounds.
  const ids = new Set(ordered.map((e) => e.id));
  const shadows: SceneElement[] = [];
  for (const p of r.people) {
    const grounds = [...ids].find((id) => id.startsWith(`${p.id}-s`));
    const seated = p.pose.id === 'seated' || p.pose.id === 'seated-at-screen';
    const centre = place([0, 0, seated ? 0.05 : 0], p.angle, p.at);
    const s = grounds ? shadow(cam, `${p.id}-shadow`, grounds, centre[0], centre[2], 0.36, 0.3, p.group === 'elsewhere' ? 'elsewhere' : 'shadow') : null;
    if (s) shadows.push(s);
  }
  for (const b of r.boxes) {
    if (!b.shadow) continue;
    const grounds = [...ids].find((id) => id.startsWith(`${b.id}-`));
    const s = grounds ? shadow(cam, `${b.id}-shadow`, grounds, (b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2, (b.max[0] - b.min[0]) * 0.62, (b.max[2] - b.min[2]) * 0.62, b.group === 'elsewhere' ? 'elsewhere' : 'shadow') : null;
    if (s) shadows.push(s);
  }
  // The floor, then its shadows, then the walls and what is on them, then what stands in the room.
  return [...(floor ? [floor] : []), ...edge, ...shadows, ...out, ...ordered];
}

/** How high the walls are drawn: full height up to position 2, then cut lower and lower to position 3. */
export function wallHeightAt(view: number): number {
  const x = Math.min(1, Math.max(0, view - 2));
  return WALL_HEIGHT - (WALL_HEIGHT - CUT_HEIGHT) * x * x * (3 - 2 * x);
}

export function composeRoom({ view, words }: RoomInput): Composed {
  const v = Math.min(Math.max(view, 0), ROOM_POSITIONS - 1);
  const cam = cameraAt(v);
  const wallHeight = wallHeightAt(v);
  // While the camera is inside your head, only your forearms are drawn; by the time it is clear of it,
  // the rest of you is still below the picture's lower edge (see LEAVING), so nothing appears at once.
  const hideSelf = length(sub(cam.pos, YOUR_HEAD)) < SELF_CLEARANCE;
  const elements: SceneElement[] = [];
  // What lies beyond the room's walls (the ground outside, the other rooms) is drawn only once the
  // camera is above the walls' tops. Below them, the walls hide all of it, so leaving it out changes
  // nothing in the picture, and it comes into view over the walls as the camera rises, not at a step.
  const seesOver = cam.pos[1] > wallHeight;
  if (seesOver) {
    const ground = face(cam, 'outside', [[-60, -0.01, 70], [70, -0.01, 70], [70, -0.01, -60], [-60, -0.01, -60]], [0, 1, 0], 'far', 'outside', 'lit');
    if (ground) elements.push(ground);
  }
  // Rooms far to near, so a nearer room's walls hide what lies behind them.
  const rooms = (seesOver ? ROOMS : ROOMS.filter((r) => r.id === 'ours')).slice();
  const centre = (r: Room): V3 => [(r.x0 + r.x1) / 2, 1, (r.z0 + r.z1) / 2];
  rooms.sort((p, q) => length(sub(cam.pos, centre(q))) - length(sub(cam.pos, centre(p))));
  for (const r of rooms) elements.push(...room(cam, r, wallHeight, hideSelf));
  // "You", once you are clearly in the picture, beside your head.
  const yh = toCamera(cam, YOUR_HEAD);
  const youHead = yh[2] > 0.3 ? { x: onFrame(cam, yh)[0], y: onFrame(cam, yh)[1], r: (cam.f * POSES.seated.head.r) / yh[2] } : null;
  const labels: SceneElement[] = [];
  const head = youHead;
  // From position 1 on (the design: "You" from one step back).
  if (v >= 1 && head) {
    // Beside your head, where nobody else is: up to its left while the third person is to your right
    // (position 1), to its right once they are behind you to the left (from 1.5 on). Between the two it
    // slides over your head, so it never jumps.
    const k = Math.min(1, Math.max(0, (v - 1.25) / 0.25));
    const side = k * k * (3 - 2 * k);
    const left: Point = [head.x - head.r * 0.75 - 20, head.y - head.r * 0.85];
    const right: Point = [head.x + head.r + 22, head.y - head.r * 0.3];
    const at: Point = [r1(left[0] + (right[0] - left[0]) * side), r1(left[1] + (right[1] - left[1]) * side - Math.sin(side * Math.PI) * head.r * 0.5)];
    // It names you: every part of you in view.
    const yours = elements.filter((e) => e.id.startsWith('you-') && e.kind === 'shape' && e.style.role === 'subject').map((e) => e.id);
    labels.push({ kind: 'label', id: 'you-label', text: 'you', at, align: 'middle', halo: true, names: yours, purpose: purpose('label') });
  }
  return composeScene(
    {
      id: ROOM.id,
      version: ROOM.version,
      theme: ROOM.theme,
      size: ROOM_SIZE,
      layers: [
        { id: 'room', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ],
      alt: words.alts[Math.round(v)] ?? '',
    },
    { you: words.you },
  );
}

/** The group an element belongs to, by its id: for the Lab's purpose table and the policy spec. */
export function groupOf(element: SceneElement): RoomGroup {
  return (Object.entries(ROOM_PURPOSES) as [RoomGroup, Purpose][]).find(([, p]) => p === element.purpose)?.[0] ?? 'room';
}
