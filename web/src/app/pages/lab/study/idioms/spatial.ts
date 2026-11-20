import type { SceneElement } from '../../../../shared/visual/composition/scene';
import { V3, length, place, sub } from '../../../../shared/visual/generation/spatial/camera';
import { POSES, SEEN_FROM_WITHIN } from '../../../../shared/visual/generation/spatial/figures';
import type { StudyCase } from '../cases';
import { label } from '../kit/elements';
import { Pt, smooth } from '../kit/paths';
import { Key, Space, cameraOn, groundPlane } from '../kit/spatial';
import { Stance, find } from '../representation';
import { Figure, altText, composed, coverage } from './contract';

/**
 * STUDY CODE: the spatial scene idiom (docs/visual-study/idioms.md, S1–S9): a constructed place in
 * perspective, still, made of forms, with a viewpoint the person moves along one path. Built on the
 * engine's spatial geometry through the study's own builder (kit/spatial.ts).
 */
export interface SpatialTuning {
  /** S2: how far apart two passing paths are, metres. */
  passingGap: number;
  /** S8: where along the passing the still scene stands: 0 is side by side; positive, a step before. */
  passingOffset: number;
  /** S7: a key per stance; replaced whole by a finish. */
  keys: Partial<Record<Stance, Key>>;
  /** The open floor's extent (S1 stand-in). */
  floor: number;
  /** S3: the tube's radius and the beads' (E1). */
  tube: number;
  bead: number;
  layout: 'loop' | 'figure-eight';
  /** C8. */
  labels: boolean;
  /** Not in the rules (hand finishing only): the room's faint floor edge, the cut edge of walls drawn low, and which wall has the window. */
  floorEdges: boolean;
  cutEdges: boolean;
  window: 'left' | 'front';
}

export const SPATIAL_RULES: SpatialTuning = {
  passingGap: 1.2,
  passingOffset: 0,
  keys: {},
  floor: 40,
  tube: 0.07,
  bead: 0.035,
  layout: 'loop',
  labels: true,
  floorEdges: false,
  cutEdges: false,
  window: 'left',
};

export function spatial(c: StudyCase, finish: Partial<SpatialTuning> = {}): Figure {
  const t: SpatialTuning = { ...SPATIAL_RULES, ...finish, keys: { ...SPATIAL_RULES.keys, ...finish.keys } };
  if (find(c.rep, 'passes').length) return passing(c, t);
  if (find(c.rep, 'located-in').length) return athome(c, t);
  if (find(c.rep, 'cycles').length) return system(c, t);
  if (c.rep.facets.metaphor?.frame === 'path') return way(c, t);
  throw new Error(`spatial: no pattern for ${c.id}`);
}

function stances(c: StudyCase): readonly Stance[] {
  return c.rep.facets.space?.viewpoints ?? ['across'];
}

function keysFor(c: StudyCase, t: SpatialTuning, rules: Partial<Record<Stance, Key>>): Key[] {
  return stances(c).map((s) => t.keys[s] ?? rules[s] ?? rules.across!);
}

const youLabel = (space: Space, head: V3, names: readonly string[], cites: readonly string[]): SceneElement[] => {
  const at = space.anchor(head, 0.32);
  return at ? [label('own-label', 'own', at, 'middle', cites, 'Names you, once you are in the picture.', { names, halo: true })] : [];
};

/** S1 stand-in, S2 passes, S8, C3: two walking figures on an open floor, at the passing. */
function passing(c: StudyCase, t: SpatialTuning): Figure {
  const s1 = find(c.rep, 'passes')[0];
  const set = find(c.rep, 'alternatives')[0];
  const own = c.rep.elements.find((e) => e.id === s1.say.a)!.own ? s1.say.a : s1.say.b;
  const other = own === s1.say.a ? s1.say.b : s1.say.a;
  const half = t.passingGap / 2;
  const ownAt: V3 = [-half, 0, -t.passingOffset];
  const otherAt: V3 = [half, 0, t.passingOffset];
  const ownHead = place(POSES.walking.head.at, 0, ownAt);
  const otherHead = place(POSES.walking.head.at, Math.PI, otherAt);
  // S7 by the rules: from your eyes, looking towards the other person; from across, side-on to both.
  const rules: Partial<Record<Stance, Key>> = {
    own: { pos: [ownHead[0], ownHead[1] - 0.02, ownHead[2] + 0.06], target: [otherHead[0], otherHead[1] - 0.25, otherHead[2]], f: 520 },
    across: { pos: [6.2, 2.3, -1.2], target: [0, 0.9, 0], f: 720 },
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'two walking figures side by side on their two ways, at the passing',
        q1: 'the other person is faceless, and only their walking says which way they face',
        q2: 'you are faceless too',
        q3: 'nothing in the scene says why',
      },
      {
        s2: 'an absent greeting has no form in a still scene: nothing is drawn between them',
        ...(set ? { [set.id]: 'a still scene of the facts has no place for possibilities: they are listed beside it' } : {}),
      },
    ),
    compose(at: number) {
      const cam = cameraOn(keys, at);
      const space = new Space(cam);
      groundPlane(space, 'floor', t.floor, 'mid', ['base:stand-in'], 'A stand-in floor: the account names no place, so the least specific one.');
      const insideOwn = length(sub(cam.pos, ownHead)) < 0.3;
      const ownPerson = space.person(own, POSES.walking, ownAt, 0, 'subject', [s1.id, 'q2'], 'You, walking your way: faceless, in the area colour.', insideOwn ? SEEN_FROM_WITHIN : undefined);
      const otherPerson = space.person(other, POSES.walking, otherAt, Math.PI, 'context', [s1.id, 'q1'], 'The other person, walking theirs: faceless, the same build.');
      if (ownPerson && !insideOwn) space.shadow(`${own}-shadow`, own, ownAt[0], ownAt[2], 0.34, 0.28, [s1.id], 'Grounds you on the floor.');
      if (otherPerson) space.shadow(`${other}-shadow`, other, otherAt[0], otherAt[2], 0.34, 0.28, [s1.id], 'Grounds the other person on the floor.');
      const labels = t.labels && ownPerson && !insideOwn ? youLabel(space, ownHead, [own], [s1.id]) : [];
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** S1 reported (a home), S2 located-in, S4, S9: you, seated with your phone, alone in a room; from further back, the rooms beside it. */
function athome(c: StudyCase, t: SpatialTuning): Figure {
  const s3 = find(c.rep, 'located-in')[0];
  const s6 = find(c.rep, 'holds')[0];
  const s2 = find(c.rep, 'receives')[0];
  const s5 = find(c.rep, 'feels')[0];
  const own = s3.say.what;
  const seatAt: V3 = [0.4, 0, 1.6];
  const head = place(POSES.seated.head.at, 0, seatAt);
  const W = { x0: -2.4, x1: 2.4, z0: -0.6, z1: 4.0, h: 2.6 };
  const rules: Partial<Record<Stance, Key>> = {
    own: { pos: [head[0], head[1], head[2] - 0.02], target: [seatAt[0], 0.7, seatAt[2] + 1.8], f: 720 },
    behind: { pos: [-0.25, 1.78, 0.7], target: [0.55, 0.78, 2.7], f: 620 },
    across: { pos: [-1.9, 2.05, 3.7], target: [0.3, 0.72, 1.6], f: 600 },
    outside: { pos: [-7.4, 10.2, -6.4], target: [0.6, 0, 1.8], f: 900 },
  };
  const keys = keysFor(c, t, rules);
  const n = keys.length;
  const alt = altText(c);
  // What is beside the room, seen only from above the walls (the room's own approach): empty rooms.
  const rooms = [
    { id: 'home', x0: W.x0, x1: W.x1, cites: [s3.id], why: 'Your home: the room you were in, alone.' },
    { id: 'beside-left', x0: -7.2, x1: W.x0, cites: ['base:surroundings'], why: 'The rooms beside yours, from further back: empty, so they claim nothing about anyone.' },
    { id: 'beside-right', x0: W.x1, x1: 7.2, cites: ['base:surroundings'], why: 'The rooms beside yours, from further back: empty, so they claim nothing about anyone.' },
  ];
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s3.id]: 'a room with a window, an armchair and you in it, no one else',
        [s6.id]: 'a phone in your hands',
        [s2.id]: 'its screen lit',
        s4: 'the manager isn’t in the scene: the room holds only you',
        q2: 'the manager isn’t placed anywhere: where they were is open',
      },
      {
        s1: 'the reply’s journey has no form in a still scene',
        [s5.id]: 'a feeling has no form in this scene; it is in the words beside it',
        q1: 'the manager isn’t drawn, so neither is what they meant',
      },
    ),
    compose(at: number) {
      const v = Math.min(Math.max(at, 0), n - 1);
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      // The walls cut low from the last stance but one onwards, as the room does (an architect's section).
      const x = Math.min(1, Math.max(0, v - (n - 2)));
      const h = W.h - (W.h - 1.05) * x * x * (3 - 2 * x);
      const over = cam.pos[1] > h;
      if (over) groundPlane(space, 'outside', 60, 'far', ['base:surroundings'], 'The ground around the building, seen only from above.');
      for (const r of over ? rooms : rooms.slice(0, 1)) {
        const mine = r.id === 'home';
        const floor: V3[] = [[r.x0, 0, W.z1], [r.x1, 0, W.z1], [r.x1, 0, W.z0], [r.x0, 0, W.z0]];
        space.face(`${r.id}-floor`, floor, [0, 1, 0], { role: mine ? 'mid' : 'far', material: 'shaded', facing: 'lit' }, r.cites, r.why, 0);
        if (t.floorEdges) space.face(`${r.id}-floor-edge`, floor, [0, 1, 0], { role: 'far', line: 'hair', material: 'line' }, r.cites, 'Where the floor meets the walls: the room reads where they are close in tone, as the room does.', 0);
        const walls: { id: string; pts: V3[]; normal: V3 }[] = [
          { id: 'x0', pts: [[r.x0, 0, W.z0], [r.x0, 0, W.z1], [r.x0, h, W.z1], [r.x0, h, W.z0]], normal: [1, 0, 0] },
          { id: 'x1', pts: [[r.x1, 0, W.z1], [r.x1, 0, W.z0], [r.x1, h, W.z0], [r.x1, h, W.z1]], normal: [-1, 0, 0] },
          { id: 'z0', pts: [[r.x1, 0, W.z0], [r.x0, 0, W.z0], [r.x0, h, W.z0], [r.x1, h, W.z0]], normal: [0, 0, 1] },
          { id: 'z1', pts: [[r.x0, 0, W.z1], [r.x1, 0, W.z1], [r.x1, h, W.z1], [r.x0, h, W.z1]], normal: [0, 0, -1] },
        ];
        for (const w of walls) {
          const d = space.face(`${r.id}-wall-${w.id}`, w.pts, w.normal, { role: 'far', material: 'shaded' }, r.cites, r.why, 0);
          // The home's one window: daylight framed, as the room draws it.
          const windowWall = t.window === 'left' ? 'x0' : 'z1';
          if (d && mine && w.id === windowWall && h > 0.95) {
            const y1 = Math.min(2.1, h);
            const pane: V3[] =
              t.window === 'left'
                ? [[r.x0 + 0.01, 0.9, 1.2], [r.x0 + 0.01, 0.9, 2.8], [r.x0 + 0.01, y1, 2.8], [r.x0 + 0.01, y1, 1.2]]
                : [[-0.7, 0.9, W.z1 - 0.01], [1.5, 0.9, W.z1 - 0.01], [1.5, y1, W.z1 - 0.01], [-0.7, y1, W.z1 - 0.01]];
            space.face('home-window', pane, w.normal, { role: 'ground', material: 'tonal' }, r.cites, 'The window: it makes the room a room.', 0);
            space.face('home-window-frame', pane, w.normal, { role: 'far', line: 'fine', material: 'line' }, r.cites, 'The window’s frame.', 0);
          }
          // Walls drawn low show their cut edge, as in an architect's section (the room's own way).
          if (t.cutEdges && h < W.h - 0.05) space.outline(`${r.id}-cut-${w.id}`, [w.pts[2], w.pts[3]], { role: 'context', line: 'regular' }, r.cites, 'The cut top of the wall: from further back the walls are drawn low, so you can see in.', false);
        }
        // An armchair in each room: in yours, the one you sit in.
        const cx = mine ? seatAt[0] : (r.x0 + r.x1) / 2;
        const cz = mine ? seatAt[2] : 2.2;
        const seat = (id: string, a: V3, b: V3) => space.box(`${r.id}-${id}`, [cx + a[0], a[1], cz + a[2]], [cx + b[0], b[1], cz + b[2]], 'near', r.cites, mine ? 'Your armchair.' : 'An armchair in the room beside yours.');
        seat('seat', [-0.42, 0.0, -0.5], [0.42, 0.42, 0.08]);
        seat('back', [-0.42, 0.42, -0.62], [0.42, 0.98, -0.44]);
        seat('arm-l', [-0.56, 0.0, -0.6], [-0.42, 0.62, 0.08]);
        seat('arm-r', [0.42, 0.0, -0.6], [0.56, 0.62, 0.08]);
      }
      const inside = length(sub(cam.pos, head)) < 0.3;
      const me = space.person(own, POSES.seated, seatAt, 0, 'subject', [s3.id], 'You, seated, alone: faceless, in the area colour.', inside ? SEEN_FROM_WITHIN : undefined);
      // The phone in your hands, its screen towards you, lit: what you were reading.
      space.box('phone', [seatAt[0] - 0.045, 0.79, seatAt[2] + 0.5], [seatAt[0] + 0.045, 0.805, seatAt[2] + 0.62], 'near', [s6.id], 'Your phone, in your hands.');
      space.face('phone-screen', [[seatAt[0] - 0.04, 0.806, seatAt[2] + 0.51], [seatAt[0] + 0.04, 0.806, seatAt[2] + 0.51], [seatAt[0] + 0.04, 0.806, seatAt[2] + 0.61], [seatAt[0] - 0.04, 0.806, seatAt[2] + 0.61]], [0, 1, 0], { role: 'far', material: 'shaded', facing: 'lit' }, [s2.id, s6.id], 'Its screen, lit: the reply you read.');
      const chair = space.drawn.find((d) => d.element.id.startsWith('home-seat-'));
      if (chair) space.shadow(`${own}-shadow`, chair.element.id, seatAt[0], seatAt[2] - 0.2, 0.55, 0.45, [s3.id], 'Grounds the armchair and you on the floor.');
      const labels = t.labels && me && !inside && v >= 0.9 ? youLabel(space, head, [own], [s3.id]) : [];
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** S3, S5: the places as volumes on a ground; the flow a tube from one to the next, closing a loop; beads for what it carries. */
function system(c: StudyCase, t: SpatialTuning): Figure {
  const s6 = find(c.rep, 'cycles')[0];
  const joins = find(c.rep, 'joins')[0];
  const flows = find(c.rep, 'flows');
  const fate = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'fate');
  const through = s6.say.through;
  // Places on the ground in the cycle's order: by the rules, round one loop from the left.
  const at: [number, number][] =
    t.layout === 'figure-eight'
      ? [[-0.55, 0], [0, 2.3], [0.55, 0], [0, -2.1]]
      : through.map((_, k) => {
          const a = Math.PI + (k / through.length) * Math.PI * 2;
          return [Math.cos(a) * 2.6, -Math.sin(a) * 1.8];
        });
  const via: [number, number][] =
    t.layout === 'figure-eight'
      ? [at[0], [-1.9, 1.2], at[1], [1.9, 1.2], at[2], [1.9, -1.2], at[3], [-1.9, -1.2]]
      : at;
  const ring = smooth(via.map(([x, z]) => [x, z] as Pt), true, 24).map(([x, z]) => [x, 0.62, z] as V3);
  // Where each place falls on the ring: the nearest point.
  const index = at.map(([x, z]) => {
    let best = 0;
    let d = Infinity;
    ring.forEach((p, i) => {
      const e = Math.hypot(p[0] - x, p[2] - z);
      if (e < d) [d, best] = [e, i];
    });
    return best;
  });
  const joinI = joins ? index[through.indexOf(joins.say.at)] : -1;
  const openI = joins && fate ? index[(through.indexOf(joins.say.at) + 2) % through.length] : -1;
  const startI = index[0];
  const between = (from: number, to: number) => {
    const out: V3[] = [];
    for (let i = from; ; i = (i + 1) % ring.length) {
      out.push(ring[i]);
      if (i === to) break;
    }
    return out;
  };
  const rules: Partial<Record<Stance, Key>> = {
    front: { pos: [0, 3.6, -7.4], target: [0, 0.3, 0.1], f: 640 },
    side: { pos: [-7.4, 3.2, -0.6], target: [0, 0.3, 0.1], f: 640 },
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(flows.map((f) => [f.id, `the tube from ${f.say.from} to ${f.say.to}`])),
        [s6.id]: 'the tube closes into one loop',
        ...(joins ? { [joins.id]: 'beads on the tube from the lungs on' } : {}),
        ...(fate ? { [fate.id]: 'past the body the beads go on, translucent: kept or lost is not said' } : {}),
      },
      {},
    ),
    compose(v: number) {
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      groundPlane(space, 'ground', 30, 'far', ['base:ground'], 'The ground the places stand on.');
      through.forEach((id, k) => {
        const [x, z] = at[k];
        const cites = flows.filter((f) => f.say.from === id || f.say.to === id).map((f) => f.id);
        space.box(`place-${id}`, [x - 0.38, 0, z - 0.3], [x + 0.38, 0.5, z + 0.3], 'near', cites, `${c.words[id] ?? id}: a place the blood passes through.`);
      });
      space.tube('blood', [...ring, ring[0]], t.tube, { role: 'subject', material: 'shaded', facing: 'base' }, [...flows.map((f) => f.id), s6.id], 'The blood’s way: one closed tube.');
      if (joins) {
        const carried = between(joinI, openI >= 0 ? openI : (joinI + ring.length - 1) % ring.length).filter((_, i) => i % 5 === 2);
        space.beads('oxygen', carried.map((p) => [p[0], p[1] + t.tube + t.bead * 0.6, p[2]] as V3), t.bead, { role: 'subject', material: 'lit', line: 'hair' }, [joins.id], 'The oxygen taken up in the lungs, carried on.');
        if (openI >= 0) {
          const open = between(openI, startI).filter((_, i) => i % 5 === 2);
          space.beads('oxygen-open', open.map((p) => [p[0], p[1] + t.tube + t.bead * 0.6, p[2]] as V3), t.bead, { role: 'context', material: 'translucent', line: 'hair' }, [fate!.id], 'Past the body: the beads go on, translucent, because the text doesn’t say whether the oxygen stays.');
        }
      }
      const labels: SceneElement[] = t.labels
        ? through.flatMap((id, k) => {
            const p = space.anchor([at[k][0], 0.5, at[k][1]], 0.34);
            return p ? [label(`label-${id}`, id, p, 'middle', flows.filter((f) => f.say.from === id || f.say.to === id).map((f) => f.id), 'Names the place.', { halo: true })] : [];
          })
        : [];
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** S6, the `path` metaphor: a way across open ground, a finished station, a closed gate, the next station not yet built. */
function way(c: StudyCase, t: SpatialTuning): Figure {
  const s1 = find(c.rep, 'complete')[0];
  const s2 = find(c.rep, 'precedes')[0];
  const s3 = find(c.rep, 'depends-on')[0];
  const s4 = find(c.rep, 'absent')[0];
  const s5 = find(c.rep, 'waiting')[0];
  const s6 = find(c.rep, 'exchange-absent')[0];
  const q1 = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'time')!;
  const [a, b] = [s2.say.a, s2.say.b];
  const gateZ = 5;
  const rules: Partial<Record<Stance, Key>> = {
    within: { pos: [0, 1.6, -2.6], target: [0, 1.0, 8], f: 600 },
    above: { pos: [-9.5, 9.5, 0.5], target: [0, 0, 6.2], f: 720 },
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  const boxEdges = (min: V3, max: V3): V3[][] => {
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
  };
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'metaphorical', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'design: a solid block beside the way',
        [s2.id]: 'build further along the same way',
        [s3.id]: 'a gate across the way between them',
        [s4.id]: 'the licence: an outline in the tentative dash at the gate',
        [s5.id]: 'the gate is closed',
        [q1.id]: 'nothing in the scene says when it opens',
      },
      { [s6.id]: 'an exchange that didn’t happen has no form; procurement appears only in it (S9)' },
    ),
    compose(v: number) {
      const cam = cameraOn(keys, v);
      const space = new Space(cam);
      groundPlane(space, 'ground', 40, 'far', ['base:stand-in'], 'Open ground: the plan as a way across it (the path metaphor).');
      space.face('way', [[-0.9, 0.002, 12.5], [0.9, 0.002, 12.5], [0.9, 0.002, -3.5], [-0.9, 0.002, -3.5]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [s2.id], 'The way: design, then build.', 0);
      space.box(a, [-2.5, 0, 0.4], [-1.3, 1.0, 1.6], 'near', [s1.id], 'Design: finished, so a solid block.');
      for (const [i, e] of boxEdges([1.3, 0, 8.4], [2.5, 1.0, 9.6]).entries())
        space.outline(`${b}-${i}`, e, { role: 'context', line: 'regular' }, [s2.id, s5.id], 'Build: next, not started, so only its edges.', e.length > 2);
      space.box('gate-post-l', [-1.06, 0, gateZ - 0.06], [-0.94, 1.3, gateZ + 0.06], 'near', [s3.id], 'The gate: build depends on the licence.');
      space.box('gate-post-r', [0.94, 0, gateZ - 0.06], [1.06, 1.3, gateZ + 0.06], 'near', [s3.id], 'The gate: build depends on the licence.');
      space.box('gate-bar', [-0.94, 0.9, gateZ - 0.04], [0.94, 1.02, gateZ + 0.04], 'near', [s3.id, s5.id], 'Closed, because the licence isn’t here.');
      for (const [i, e] of boxEdges([-0.22, 1.2, gateZ - 0.03], [0.22, 1.5, gateZ + 0.03]).entries())
        space.outline(`licence-${i}`, e, { role: 'context', line: 'fine', dash: 'tentative' }, [s4.id, q1.id], 'The licence: not here, so an outline where it would be.', e.length > 2);
      const block = space.drawn.find((d) => d.element.id.startsWith(`${a}-`));
      if (block) space.shadow(`${a}-shadow`, block.element.id, -1.9, 1.0, 0.85, 0.85, [s1.id], 'Grounds the design block.');
      const labels: SceneElement[] = [];
      if (t.labels) {
        const la = space.anchor([-1.9, 1.0, 1.0], 0.35);
        const lb = space.anchor([1.9, 1.0, 9.0], 0.35);
        const ll = space.anchor([0.4, 1.35, gateZ], 0);
        if (la) labels.push(label(`${a}-label`, a, la, 'middle', [s1.id], 'Names the step.', { halo: true }));
        if (lb) labels.push(label(`${b}-label`, b, lb, 'middle', [s2.id], 'Names the step.', { halo: true }));
        if (ll) labels.push(label('licence-label', s3.say.on, [ll[0] + 8, ll[1]], 'start', [s4.id], 'Names what build waits for.', { halo: true, tone: 'label-soft' }));
      }
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}
