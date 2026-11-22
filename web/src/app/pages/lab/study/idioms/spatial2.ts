import type { SceneElement } from '../../../../shared/visual/composition/scene';
import { V3, onFrame, place, toCamera } from '../../../../shared/visual/generation/spatial/camera';
import { POSES, Pose, SEEN_FROM_WITHIN } from '../../../../shared/visual/generation/spatial/figures';
import { poissonDisc } from '../../../../shared/visual/generation/distributions';
import type { StudyCase } from '../cases';
import { label } from '../kit/elements';
import { Key, Space, aimedKey, cameraOn, framedKey, groundPlane } from '../kit/spatial';
import { Stance, Statement, find } from '../representation';
import { Figure, altText, composed, coverage, word } from './contract';
import { countOf } from './kinetic2';
import { SpatialTuning, centreOf, corners, keysFor, stances, youLabel } from './spatial';

/**
 * STUDY CODE: the spatial idiom's slice-2 patterns (docs/visual-study/idioms.md): the `path` frame
 * for W (waiting on a reply), T (a move in time) and L (behind plan); G (a meeting room); C (a
 * carriage); D (a room corner with two plants). Every camera from the framing rule (S7r3).
 */
const question = (c: StudyCase, asks: string, about?: string): Statement | undefined =>
  c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === asks && (about === undefined || s.say.about === about));

const near = (id: string, c: StudyCase) => !!c.rep.elements.find((e) => e.id === id)?.own;

/** Where `standing` puts each figure of a presence (kept in one place, so placement can check it). */
function standingAt(c: StudyCase, id: string, at: V3): V3[] {
  const n = countOf(c, id);
  return Array.from({ length: n }, (_, k) => [at[0] + (k - (n - 1) / 2) * 0.62, 0, at[2] + (k % 2) * 0.35] as V3);
}

/**
 * R4-3 (revision 4, replacing M2-S1): something placed beside a station moves outward, in steps of
 * 1.3 m from `from`, until its box overlaps nothing already there in any viewpoint's frame.
 */
function clearAside(keys: readonly Key[], obstacles: readonly V3[][], box: (x: number) => V3[], from: number): number {
  const extent = (cam: ReturnType<typeof cameraOn>, pts: readonly V3[]) => {
    const on = pts.map((p) => toCamera(cam, p)).filter((q) => q[2] > 0.1).map((q) => onFrame(cam, q));
    return on.length ? { x0: Math.min(...on.map((p) => p[0])), x1: Math.max(...on.map((p) => p[0])), y0: Math.min(...on.map((p) => p[1])), y1: Math.max(...on.map((p) => p[1])) } : null;
  };
  const meets = (a: NonNullable<ReturnType<typeof extent>>, b: NonNullable<ReturnType<typeof extent>>) => a.x0 < b.x1 + 8 && b.x0 < a.x1 + 8 && a.y0 < b.y1 + 8 && b.y0 < a.y1 + 8;
  for (let k = 0; k < 6; k++) {
    const x = from + k * 1.3;
    const clear = keys.every((_, i) => {
      const cam = cameraOn(keys, i);
      const me = extent(cam, box(x));
      return !me || obstacles.every((o) => { const e = extent(cam, o); return !e || !meets(me, e); });
    });
    if (clear) return x;
  }
  return from + 5 * 1.3;
}

/** Standing figures for a presence, one or a few side by side (plural: slice-2 common rule). */
function standing(space: Space, c: StudyCase, id: string, at: V3, angle: number, cites: readonly string[], why: string, insideOwn = false): string[] {
  const n = countOf(c, id);
  const own = near(id, c);
  const ids: string[] = [];
  for (const [k, p] of standingAt(c, id, at).entries()) {
    const pid = n === 1 ? id : `${id}-${k + 1}`;
    if (own && insideOwn) continue;
    if (space.person(pid, POSES.standing, p, angle, own ? 'subject' : 'context', cites, why)) {
      space.shadow(`${pid}-shadow`, pid, p[0], p[2], 0.32, 0.26, cites, 'Grounds them.');
      ids.push(pid);
    }
  }
  return ids;
}

function edges(min: V3, max: V3): V3[][] {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  return [
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x0, y1, z0]],
    [[x1, y0, z0], [x1, y1, z0]],
    [[x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z1], [x0, y1, z1]],
  ];
}

function wire(space: Space, id: string, min: V3, max: V3, style: Parameters<Space['outline']>[2], cites: readonly string[], why: string): void {
  edges(min, max).forEach((e, i) => space.outline(`${id}-${i}`, e, style, cites, why, e.length > 2));
}

const AXES_PATH = { space: 'spatial', time: 'still', substance: 'forms', mode: 'metaphorical', viewpoint: 'movable' } as const;
const AXES_PLACE = { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' } as const;

/** The `path` frame for W, T and L: a way across open ground; what stands on it depends on the pattern. */
export function pathScene(c: StudyCase, t: SpatialTuning): Figure {
  const send = find(c.rep, 'sends')[0];
  const wait = find(c.rep, 'waiting')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const dep = find(c.rep, 'depends-on')[0];
  const shift = find(c.rep, 'shifts')[0];
  const behind = find(c.rep, 'behind')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const own = c.rep.elements.find((e) => e.own)?.id;
  const far = 12;
  const content: V3[] = [...corners([-1.6, 0, -0.6], [1.6, 1.8, 0.6]), ...corners([-1.2, 0, far - 1], [1.6, 1.8, far + 0.6])];
  const rules: Partial<Record<Stance, Key>> = {
    within: framedKey(content, centreOf(content), [0.1, 0.16, -1], 520, 0.42, 0.85),
    above: framedKey(content, centreOf(content), [-0.75, 0.75, -0.35], 720, 0.6, 0.85),
  };
  const keys = keysFor(c, t, rules);
  const depBox = (x: number) => corners([x, 0, -0.5], [x + 1.2, 1.0, 0.7]);
  const aside = dep && send ? clearAside(keys, standingAt(c, send.say.from, [0, 0, 0]).map((p) => corners([p[0] - 0.3, 0, p[2] - 0.2], [p[0] + 0.3, 1.8, p[2] + 0.2])), depBox, t.aside) : t.aside;
  const alt = altText(c);
  const shown: Record<string, string> = {};
  const notShown: Record<string, string> = {};
  if (send) {
    shown[send.id] = 'the sender at the near end of the way, the receiver at the far end, the item near the receiver';
    if (wait) shown[wait.id] = 'nothing on the way back';
    if (absent) notShown[absent.id] = 'an exchange that didn’t happen has no form: the way back is empty';
    if (dep) shown[dep.id] = 'what depends on it: only its edges, beside the sender, not started';
  }
  if (shift) {
    shown[shift.id] = 'the way is time; an empty outline where the item was, the item further along only in the tentative dash (how much later is not said)';
    if (absent) notShown[absent.id] = 'an exchange that didn’t happen has no form';
  }
  if (behind) shown[behind.id] = 'a marker post where the plan says it would be; the item on the way, short of it; the shortfall named in words';
  for (const q of qs) notShown[q.id] = 'nothing in a still scene of the facts says why, or when';
  if (set) notShown[set.id] = 'a still scene of the facts has no place for possibilities: they are listed beside it';
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: AXES_PATH,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(c.rep, shown, notShown),
    compose(at: number) {
      const cam = cameraOn(keys, at);
      const space = new Space(cam);
      groundPlane(space, 'ground', 40, 'far', ['base:stand-in'], 'Open ground: the way across it is the path metaphor.');
      space.face('way', [[-0.9, 0.002, far + 2], [0.9, 0.002, far + 2], [0.9, 0.002, -2], [-0.9, 0.002, -2]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [(send ?? shift ?? behind)!.id], 'The way.', 0);
      const labels: SceneElement[] = [];
      const name = (id: string, key: string, p: V3, lift: number, cites: readonly string[], soft = false) => {
        const a = space.anchor(p, lift);
        if (a && t.labels) labels.push(label(id, key, a, 'middle', cites, 'Names it.', { halo: true, ...(soft ? { tone: 'label-soft' as const } : {}) }));
      };
      if (send) {
        standing(space, c, send.say.from, [0, 0, 0], 0, [send.id], 'The sender, at the near end.');
        standing(space, c, send.say.to, [0, 0, far], Math.PI, [send.id, ...qs.map((q) => q.id)], 'The receiver, at the far end: faceless.');
        space.box('item', [-0.18, 0, far - 1.2], [0.18, 0.22, far - 0.9], 'near', [send.id], 'What was sent, near the receiver.');
        if (dep) wire(space, 'dependent', [aside, 0, -0.5], [aside + 1.2, 1.0, 0.7], { role: 'context', line: 'regular' }, [dep.id, ...(wait ? [wait.id] : [])], `What depends on ${word(c, dep.say.on)}: only its edges, not started.`);
        name('from-label', send.say.from, [0, 1.7, 0], 0.3, [send.id]);
        name('to-label', send.say.to, [0, 1.7, far], 0.3, [send.id], true);
        if (dep) name('dep-label', dep.say.what, [aside + 0.6, 1.0, 0.1], 0.3, [dep.id]);
      }
      if (shift) {
        if (own) standing(space, c, own, [-1.3, 0, 0], 0, [absent?.id ?? shift.id], 'You, at the near end.');
        if (shift.say.by) standing(space, c, shift.say.by, [1.3, 0, 4.2], -Math.PI / 2, [shift.id], 'The one who moved it: faceless.');
        wire(space, 'slot', [-0.6, 0, 3.6], [0.6, 0.6, 4.8], { role: 'context', line: 'fine' }, [shift.id], 'Where it was: its edges stay, because it was there.');
        if (t.unscaled === 'range') wire(space, shift.say.what, [-0.6, 0, 6.0], [0.6, 0.6, 12.0], { role: 'context', line: 'fine', dash: 'tentative' }, [shift.id], 'Somewhere later along the way: an open range (R4-4 b).');
        else wire(space, shift.say.what, [-0.6, 0, 8.6], [0.6, 0.6, 9.8], { role: 'context', line: 'fine', dash: 'tentative' }, [shift.id], 'Where it is now: only in the tentative dash, because how much later is not said.');
        if (t.unscaled === 'break') space.face('break', [[-0.95, 0.004, 7.0], [0.95, 0.004, 6.6], [0.95, 0.004, 7.0], [-0.95, 0.004, 7.4]], [0, 1, 0], { role: 'ground', material: 'tonal' }, [shift.id], 'A break in the way: this length is not to scale (R4-4 c).', 0);
        if (t.unscaled === 'labelled') name('unscaled-label', 'unscaled', [1.2, 0.05, 6.9], 0, [shift.id], true);
        name('item-label', shift.say.what, [0, 0.6, 9.2], 0.3, [shift.id]);
      }
      if (behind) {
        space.box(behind.say.what, [-0.6, 0, 5.4], [0.6, 0.8, 6.6], 'near', [behind.id], 'Where the item has got to.');
        if (t.unscaled === 'range') wire(space, 'shortfall', [-0.6, 0, 6.8], [0.6, 0.02, 9.3], { role: 'context', line: 'hair', dash: 'tentative' }, [behind.id], 'The shortfall as an extent, not a measured length (R4-4 b).');
        if (t.unscaled === 'break') space.face('break', [[-0.95, 0.004, 8.0], [0.95, 0.004, 7.6], [0.95, 0.004, 8.0], [-0.95, 0.004, 8.4]], [0, 1, 0], { role: 'ground', material: 'tonal' }, [behind.id], 'A break in the way: this length is not to scale (R4-4 c).', 0);
        space.box('plan', [1.0, 0, 9.4], [1.12, 1.6, 9.52], 'near', [behind.id], 'Where the plan says it would be now: a marker post.');
        name('item-label', behind.say.what, [0, 0.8, 6.0], 0.32, [behind.id]);
        name('plan-label', 'plan', [1.06, 1.6, 9.46], 0.25, [behind.id], true);
        name('amount-label', t.unscaled === 'labelled' ? 'amount-unscaled' : 'amount', [0.4, 0.05, 8.0], 0, [behind.id], true);
      }
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt, { unscaled: 'not to scale', ...(behind ? { amount: behind.say.amount, 'amount-unscaled': `${behind.say.amount}, not to scale`, plan: 'Plan' } : {}) });
    },
  };
}

/** A room: floor, walls, the room's own floor edge and cut wall edges (S1r3). */
function room(space: Space, x0: number, x1: number, z0: number, z1: number, h: number, cites: readonly string[], why: string): void {
  const floor: V3[] = [[x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]];
  space.face('floor', floor, [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, cites, why, 0);
  space.face('floor-edge', floor, [0, 1, 0], { role: 'far', line: 'hair', material: 'line' }, cites, 'Where the floor meets the walls.', 0);
  const walls: { id: string; pts: V3[]; normal: V3 }[] = [
    { id: 'x0', pts: [[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], normal: [1, 0, 0] },
    { id: 'x1', pts: [[x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]], normal: [-1, 0, 0] },
    { id: 'z0', pts: [[x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0]], normal: [0, 0, 1] },
    { id: 'z1', pts: [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], normal: [0, 0, -1] },
  ];
  for (const w of walls) {
    space.face(`wall-${w.id}`, w.pts, w.normal, { role: 'far', material: 'shaded' }, cites, why, 0);
    if (h < 2.5) space.outline(`cut-${w.id}`, [w.pts[2], w.pts[3]], { role: 'context', line: 'regular' }, cites, 'The cut top of the wall: from above, the walls are drawn low.', false);
  }
}

/** The walls' height for a camera: full inside, cut low once it is above them (the room's own way). */
const wallsFor = (camY: number) => (camY > 2.6 ? 1.05 : 2.6);

/** G: a meeting room, everyone seated round a table (the least specific posture in a meeting), faceless. */
export function meetingRoom(c: StudyCase, t: SpatialTuning): Figure {
  const at0 = find(c.rep, 'located-in')[0];
  const sends = find(c.rep, 'sends');
  const reacts = find(c.rep, 'reacts')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const own = c.rep.elements.find((e) => e.own)!.id;
  const group = reacts.say.who;
  const others = [...new Set(sends.map((s) => s.say.from))].filter((x) => x !== own);
  const seats: { id: string; at: V3; angle: number }[] = [{ id: own, at: [0, 0, 0.55], angle: 0 }];
  const n = countOf(c, group);
  for (let k = 0; k < n; k++) seats.push({ id: `${group}-${k + 1}`, at: [k % 2 ? 1.25 : -1.25, 0, 1.35 + Math.floor(k / 2) * 0.9], angle: k % 2 ? -Math.PI / 2 : Math.PI / 2 });
  others.forEach((o) => seats.push({ id: o, at: [0, 0, 3.35], angle: Math.PI }));
  const head = place(POSES.seated.head.at, 0, seats[0].at);
  const table: [V3, V3] = [[-0.6, 0.72, 1.0], [0.6, 0.76, 3.0]];
  const content: V3[] = [...corners([-1.6, 0, 0.2], [1.6, 1.3, 3.6])];
  const outside: V3[] = corners([-2.4, 0, -0.6], [2.4, 1.05, 4.4]);
  const rules: Partial<Record<Stance, Key>> = {
    own: aimedKey([head[0], head[1], head[2] - 0.02], corners([-1.3, 0.7, 1.2], [1.3, 1.3, 3.4]), 0.55),
    behind: framedKey(content, centreOf(content), [-0.4, 0.55, -0.85], 620, 0.55),
    across: framedKey(content, centreOf(content), [-0.85, 0.42, 0.5], 620, 0.5),
    above: framedKey(outside, centreOf(outside), [-0.5, 0.85, -0.55], 800, 0.65, 0.9),
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: AXES_PLACE,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        [at0.id]: 'a meeting room with a table; you seated at its end',
        ...Object.fromEntries(qs.map((q) => [q.id, 'everyone faceless, seated the same way'])),
      },
      {
        ...Object.fromEntries(sends.map((s) => [s.id, 'speaking has no form in a still scene of faceless figures'])),
        [reacts.id]: 'laughter has no form in a still scene of faceless figures: no one is drawn laughing',
      },
    ),
    compose(v: number) {
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      const h = wallsFor(cam.pos[1]);
      if (h < 2.5) groundPlane(space, 'outside', 40, 'far', ['base:surroundings'], 'The ground around the room, seen only from above.');
      room(space, -2.4, 2.4, -0.6, 4.4, h, [at0.id], 'The meeting room.');
      space.box('table', table[0], table[1], 'near', [at0.id], 'The table everyone sits round.');
      const inside = Math.hypot(cam.pos[0] - head[0], cam.pos[1] - head[1], cam.pos[2] - head[2]) < 0.3;
      for (const s of seats) {
        const mine = s.id === own;
        space.box(`${s.id}-chair`, place([-0.22, 0.4, -0.42], s.angle, s.at).map((x, i) => Math.min(x, place([0.22, 0.46, 0.0], s.angle, s.at)[i])) as unknown as V3, place([-0.22, 0.4, -0.42], s.angle, s.at).map((x, i) => Math.max(x, place([0.22, 0.46, 0.0], s.angle, s.at)[i])) as unknown as V3, 'near', [at0.id], 'A chair.');
        space.person(s.id, POSES.seated as Pose, s.at, s.angle, mine ? 'subject' : 'context', mine ? [at0.id] : [at0.id, ...qs.map((q) => q.id)], mine ? 'You, seated at the end of the table.' : 'Someone at the table: faceless, seated like everyone.', mine && inside ? SEEN_FROM_WITHIN : undefined);
      }
      const labels = t.labels && !inside ? youLabel(space, head, [own], [at0.id]) : [];
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** C: a carriage, seats along both sides, many standing figures facing along it; you a hand's breadth from the other. */
export function carriage(c: StudyCase, t: SpatialTuning): Figure {
  const places = find(c.rep, 'located-in');
  const s2 = find(c.rep, 'displaced')[0];
  const s3 = find(c.rep, 'contact')[0];
  const s4 = find(c.rep, 'sends')[0];
  const s5 = find(c.rep, 'exchange-absent')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const own = s3.say.a;
  const other = s3.say.b;
  const crowd = c.rep.elements.find((e) => e.count !== undefined)!.id;
  const ownAt: V3 = [0, 0, 0];
  const otherAt: V3 = [0.36, 0, 0.32];
  const head = place(POSES.standing.head.at, 0, ownAt);
  const many = poissonDisc({ x: -0.75, y: -5.5, width: 1.5, height: 11, spacing: 0.75, max: 80 }, `study-${c.id}-carriage`)
    .filter(([x, z]) => Math.hypot(x - 0.15, z - 0.15) > 1.0)
    .slice(0, countOf(c, crowd));
  const content: V3[] = corners([-1.4, 0, -2.5], [1.4, 1.9, 3.5]);
  const whole: V3[] = corners([-1.5, 0, -6], [1.5, 1.05, 6]);
  const rules: Partial<Record<Stance, Key>> = {
    own: aimedKey([head[0], head[1], head[2] + 0.06], [[otherAt[0], 1.1, otherAt[2]], [otherAt[0], 1.75, otherAt[2]], [-0.6, 1.4, 3], [0.8, 1.4, 3]], 0.6),
    behind: framedKey(content, centreOf(content), [-0.35, 0.45, -1], 600, 0.55),
    above: framedKey(whole, centreOf(whole), [-0.7, 0.9, -0.4], 800, 0.6, 0.9),
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: AXES_PLACE,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(places.map((p) => [p.id, 'a carriage, seats along both sides, many standing figures'])),
        [s3.id]: 'you stand a hand’s breadth from the other person',
        ...Object.fromEntries(qs.map((q) => [q.id, 'everyone faceless, all facing along the carriage'])),
      },
      {
        [s2.id]: 'a stumble has no pose in this idiom: you stand (the declared neutral pose)',
        [s4.id]: 'speaking has no form in a still scene of faceless figures',
        [s5.id]: 'as the apology',
      },
    ),
    compose(v: number) {
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      const h = cam.pos[1] > 2.3 ? 1.05 : 2.2;
      if (h < 2) groundPlane(space, 'outside', 40, 'far', ['base:surroundings'], 'The ground beside the carriage, seen only from above.');
      room(space, -1.5, 1.5, -6, 6, h, places.map((p) => p.id), 'The carriage.');
      for (let z = -5.4; z < 5.6; z += 1.2)
        for (const sx of [-1, 1]) space.box(`seat-${sx > 0 ? 'r' : 'l'}-${Math.round((z + 6) * 10)}`, [sx > 0 ? 1.0 : -1.48, 0, z], [sx > 0 ? 1.48 : -1.0, 0.45, z + 0.9], 'near', places.map((p) => p.id), 'Seats along the side.');
      many.forEach(([x, z], k) => {
        const id = `${crowd}-${k + 1}`;
        if (space.person(id, POSES.standing, [x, 0, z], 0, 'context', [places[places.length - 1].id, ...qs.map((q) => q.id)], 'One of the others: faceless, facing along the carriage.')) space.shadow(`${id}-shadow`, id, x, z, 0.3, 0.24, [places[0].id], 'Grounds them.');
      });
      const inside = Math.hypot(cam.pos[0] - head[0], cam.pos[1] - head[1], cam.pos[2] - head[2]) < 0.3;
      if (space.person(other, POSES.standing, otherAt, 0, 'context', [s3.id, ...qs.map((q) => q.id)], 'The other person: faceless, facing along the carriage like everyone.')) space.shadow(`${other}-shadow`, other, otherAt[0], otherAt[2], 0.3, 0.24, [s3.id], 'Grounds them.');
      if (!inside && space.person(own, POSES.standing, ownAt, 0, 'subject', [s3.id], 'You, a hand’s breadth from them.')) space.shadow(`${own}-shadow`, own, 0, 0, 0.3, 0.24, [s3.id], 'Grounds you.');
      const labels = t.labels && !inside ? youLabel(space, head, [own], [s3.id]) : [];
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** D: a room corner with a window; a pot by the window and one in the corner, the one by the window a third taller. */
export function plants(c: StudyCase, t: SpatialTuning): Figure {
  const s1 = find(c.rep, 'exceeds')[0];
  const set = find(c.rep, 'alternatives')[0];
  const q = question(c, 'cause');
  const tall = 1.0;
  const short = tall / (4 / 3);
  const aAt: V3 = [0.35, 0, 2.55];
  const bAt: V3 = [-1.15, 0, 2.55];
  const content: V3[] = corners([-1.5, 0, 2.1], [1.0, 1.5, 3.0]);
  const rules: Partial<Record<Stance, Key>> = {
    front: framedKey(content, centreOf(content), [0.1, 0.35, -1], 640, 0.6, 0.8),
    side: framedKey(content, centreOf(content), [0.9, 0.35, -0.6], 640, 0.6, 0.8),
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  const plant = (space: Space, id: string, at: V3, h: number) => {
    space.box(`${id}-pot`, [at[0] - 0.14, 0, at[2] - 0.14], [at[0] + 0.14, 0.26, at[2] + 0.14], 'near', [s1.id], 'Its pot.');
    space.tube(`${id}-stem`, [[at[0], 0.26, at[2]], [at[0], 0.26 + h * 0.5, at[2]], [at[0], 0.26 + h, at[2]]], 0.016, { role: 'context', material: 'shaded', facing: 'base' }, [s1.id], 'How tall it grew.', 4);
    // R4-5 (revision 4, replacing E3-S1): leaves as tapered closed curves set along the upper stem,
    // turning round it, each tilted up; their number and size are rule constants, the same for both.
    const count = 9;
    for (let k = 0; k < count; k++) {
      const y = 0.26 + h * (0.45 + (0.55 * k) / (count - 1));
      const a = k * 2.4;
      const dir: V3 = [Math.cos(a) * 0.86, 0.5, Math.sin(a) * 0.86];
      const side: V3 = [-Math.sin(a), 0, Math.cos(a)];
      const len = t.leaf * (k === count - 1 ? 0.8 : 1);
      const pts: V3[] = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const w = Math.sin(Math.PI * u) * len * 0.32;
        pts.push([at[0] + dir[0] * len * u + side[0] * w, y + dir[1] * len * u, at[2] + dir[2] * len * u + side[2] * w]);
      }
      for (let i = 7; i >= 1; i--) {
        const u = i / 8;
        const w = Math.sin(Math.PI * u) * len * 0.32;
        pts.push([at[0] + dir[0] * len * u - side[0] * w, y + dir[1] * len * u, at[2] + dir[2] * len * u - side[2] * w]);
      }
      const normal: V3 = [dir[1] * side[2] - dir[2] * side[1], dir[2] * side[0] - dir[0] * side[2], dir[0] * side[1] - dir[1] * side[0]];
      space.face(`${id}-leaf-${k + 1}`, pts, normal, { role: 'subject', material: 'shaded' }, [s1.id], 'A leaf: what grew.', 2, true);
    }
  };
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: AXES_PLACE,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      { [s1.id]: 'two plants, the one by the window a third taller (the amount is a rule constant)' },
      {
        ...(q ? { [q.id]: 'nothing in a still scene of the facts says why' } : {}),
        ...(set ? { [set.id]: 'a still scene of the facts has no place for possibilities: they are listed beside it' } : {}),
      },
    ),
    compose(v: number) {
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      const floor: V3[] = [[-1.6, 0, 3.0], [1.4, 0, 3.0], [1.4, 0, 0], [-1.6, 0, 0]];
      space.face('floor', floor, [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, ['base:setting'], 'The floor of the room the text names (a window, a corner).', 0);
      space.face('wall-back', [[-1.6, 0, 3.0], [1.4, 0, 3.0], [1.4, 2.4, 3.0], [-1.6, 2.4, 3.0]], [0, 0, -1], { role: 'far', material: 'shaded' }, ['base:setting'], 'The wall with the window.', 0);
      space.face('wall-side', [[-1.6, 0, 0], [-1.6, 0, 3.0], [-1.6, 2.4, 3.0], [-1.6, 2.4, 0]], [1, 0, 0], { role: 'far', material: 'shaded' }, ['base:setting'], 'The wall that makes the corner.', 0);
      const pane: V3[] = [[-0.1, 0.9, 2.99], [0.9, 0.9, 2.99], [0.9, 2.0, 2.99], [-0.1, 2.0, 2.99]];
      space.face('window', pane, [0, 0, -1], { role: 'ground', material: 'tonal' }, [s1.id], 'The window one plant stands by.', 0);
      space.face('window-frame', pane, [0, 0, -1], { role: 'far', line: 'fine', material: 'line' }, [s1.id], 'Its frame.', 0);
      // R4-4 for the plants: (b) the taller one drawn surely to the other's height, the rest of its stem
      // open; (c) a break has no sensible form on a stem in a room, so it is drawn as the constant.
      plant(space, s1.say.a, aAt, t.unscaled === 'range' ? short : tall);
      if (t.unscaled === 'range') space.outline(`${s1.say.a}-more`, [[aAt[0], 0.26 + short, aAt[2]], [aAt[0], 0.26 + tall, aAt[2]]], { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'How much taller is not said: open (R4-4 b).', false);
      plant(space, s1.say.b, bAt, short);
      const labels: SceneElement[] = [];
      if (t.labels) {
        const la = space.anchor([aAt[0], 0, aAt[2] - 0.3], -0.12);
        const lb = space.anchor([bAt[0], 0, bAt[2] - 0.3], -0.12);
        if (la) labels.push(label('a-label', s1.say.a, la, 'middle', [s1.id], 'Names it.', { halo: true }));
        if (lb) labels.push(label('b-label', s1.say.b, lb, 'middle', [s1.id], 'Names it.', { halo: true }));
        const lu = space.anchor([-0.4, 0, 2.0], 0);
        if (lu && t.unscaled === 'labelled') labels.push(label('unscaled-label', 'unscaled', lu, 'middle', [s1.id], 'Says the heights are not to scale (R4-4 a).', { tone: 'label-soft', halo: true }));
      }
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt, { unscaled: 'heights not to scale' });
    },
  };
}
