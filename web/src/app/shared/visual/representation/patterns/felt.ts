import type { Layer, SceneElement } from '../../composition/scene';
import type { V3 } from '../../generation/spatial/camera';
import { POSES } from '../../generation/spatial/figures';
import { label, path, r2, shape } from '../kit/elements';
import { contour, thin } from '../kit/field';
import { Pt, ease, phaseProgress, polyline } from '../kit/paths';
import { Key, Space, aimedKey, cameraOn, framedKey } from '../kit/spatial';
import { Stance, Statement, drawable, find, isEstablished } from '../contract';
import { Subject, Figure, composed, coverage } from '../setting';
import { FieldTuning, headingElements, headings } from '../idioms/field';
import { CX, CY, KineticTuning, presence, roundedRect, ring } from '../idioms/kinetic';
import { SpatialTuning, keysFor, stances } from '../idioms/spatial';

/**
 * S12 general pattern (Stage 3, M3; written by the representation study, revision 6, step 3, findings-revision-6.md §3): a reported feeling, the viewer's own,
 * in a place, with no exchange. Built from `feels` and `located-in` only; questions and one set of
 * possibilities are allowed. The felt ring (kinetic) and contours (field) are P2's accepted forms;
 * the spatial idiom has no form for a feeling, as in P2, so it shows the person in the place and
 * says the feeling is in the words beside it.
 */

export function feltLacks(c: Subject): string[] {
  const out: string[] = [];
  const feels = find(c.rep, 'feels').filter(isEstablished);
  const own = c.rep.elements.find((e) => e.own)?.id;
  if (!feels.length) out.push("a reported 'feels' statement");
  else if (!own || feels.some((s) => s.say.who !== own)) out.push('a feeling that is the viewer’s own');
  if (!find(c.rep, 'located-in').some((s) => s.say.what === own)) out.push('the viewer placed somewhere (`located-in`)');
  // Revision 8 (structural need, found by the probe): it draws one place for the viewer.
  if (find(c.rep, 'located-in').filter((s) => s.say.what === own).length > 1) out.push('the viewer placed once');
  // Found by U5 (revision 6, step 4): it draws only where the viewer is; another thing's place would go
  // unaccounted for, so a case with one is refused, not drawn without it.
  if (find(c.rep, 'located-in').some((s) => s.say.what !== own)) out.push('nothing placed but the viewer (another thing’s place is not drawn yet)');
  // Revision 8: the kinds it draws, and that it draws one feeling and one set, are declared in draws.ts (FELT).
  return out;
}

interface Reading {
  feels: Statement & { say: { p: 'feels'; who: string; charge: number } };
  at: Statement & { say: { p: 'located-in'; what: string; place: string } };
  set?: Statement;
  /** The question the possibilities answer. */
  q?: Statement;
  k: number;
  n: number;
}

function read(c: Subject): Reading {
  const feels = find(c.rep, 'feels')[0];
  const at = find(c.rep, 'located-in').find((s) => s.say.what === feels.say.who)!;
  const set = find(c.rep, 'alternatives')[0];
  const q = set && set.say.p === 'alternatives' ? c.rep.statements.find((s) => s.id === set.say.question) : undefined;
  const phases = c.rep.time.phases;
  return { feels, at, set, q, k: feels.phases?.length ? phases.indexOf(feels.phases[0]) : 0, n: Math.max(1, phases.length) };
}

function remaining(c: Subject, r: Reading, how: string): Record<string, string> {
  return Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'question' && s !== r.q).map((s) => [s.id, how]));
}

export function feltKinetic(c: Subject, t: KineticTuning): Figure {
  const r = read(c);
  const own = r.feels.say.who;
  const ownAt: Pt = [CX - 60, CY + 10];
  const moveMs = r.n * t.stepMs;
  const tailMs = r.set ? 700 : 0;
  const duration = moveMs + tailMs;
  const alt = c.setting.alt(c.rep);
  return {
    idiom: 'kinetic',
    axes: { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' },
    motion: { kind: 'timeline', duration, steps: [...c.rep.time.phases, ...(r.set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [r.feels.id]: 'a fine ring that closes a little around you and holds, as strong as the feeling you reported',
        [r.at.id]: 'a soft plane around you: where you were',
        ...(r.set ? { [r.set.id]: 'equal translucent marks on a ring beside you, after the feeling: none chosen' } : {}),
        ...(r.q ? { [r.q.id]: 'the ring of possibilities: why is open' } : {}),
      },
      remaining(c, r, 'this pattern draws no place for this question'),
    ),
    compose(at: number) {
      const ms = at * duration;
      const felt = ease.move(phaseProgress(Math.min(1, ms / moveMs), r.k, r.n));
      const g = r.set ? Math.min(1, Math.max(0, (ms - moveMs) / tailMs)) : 0;
      const below: SceneElement[] = [path(r.at.say.place, roundedRect(ownAt[0] - 120, ownAt[1] - 90, 240, 180, 30), { role: 'mid', material: 'tonal' }, [r.at.id], 'Where you were.')];
      const els: SceneElement[] = [];
      const radius = 46 - 12 * r.feels.say.charge * felt;
      if (felt > 0) els.push(shape('felt', { type: 'circle', cx: r2(ownAt[0]), cy: r2(ownAt[1]), r: r2(radius) }, { role: 'subject', line: 'hair' }, [r.feels.id], 'How it felt: a ring that closes a little around you and holds, attributed to you.'));
      els.push(...presence(own, ownAt, t.radius, true, [r.at.id, r.feels.id], 'You, where you were.'));
      els.push(...ring(r.set, [ownAt[0] + 230, ownAt[1] - 10], 40, 9, g, r.q ? [r.q.id] : []));
      const labels: SceneElement[] = t.labelForms
        ? [
            label('own-label', own, [r2(ownAt[0]), r2(ownAt[1] + 48 + 14)], 'middle', [r.at.id], 'Says which form is you.', { names: [own, r.at.say.place, ...(felt > 0 ? ['felt'] : [])], halo: true }),
            label('place-label', r.at.say.place, [r2(ownAt[0]), r2(ownAt[1] - 90 - 14)], 'middle', [r.at.id], 'Names where you were.', { tone: 'label-soft' }),
          ]
        : [];
      const layers: Layer[] = [
        { id: 'planes', plane: 'mid', elements: below },
        { id: 'forms', plane: 'subject', elements: els },
        { id: 'labels', plane: 'annotation', elements: labels },
      ];
      return composed(c, 'kinetic', layers, alt);
    },
  };
}

export function feltSpatial(c: Subject, t: SpatialTuning): Figure {
  const r = read(c);
  const own = r.feels.say.who;
  const at: V3 = [0, 0, 1.6];
  const head: V3 = [0, 1.6, 0];
  // A stand-in room (S1): the text names the place but not its shape, so a plain corner is drawn and
  // declared as a base. Standing is the declared neutral pose (OI-3): the text's "sat" has no predicate.
  const walls: V3[] = [[-2, 0, 3.2], [2, 0, 3.2], [2, 2.4, 3.2], [-2, 2.4, 3.2]];
  const rules: Partial<Record<Stance, Key>> = {
    own: aimedKey(head, [...walls, [-2, 0, 0.6], [2, 0, 0.6]], 0.7),
    within: framedKey([[-0.4, 0, 1.2], [0.4, 1.8, 2]], [0, 0.9, 1.6], [0.55, 0.25, -1], 640, 0.55, 0.8),
    across: framedKey([[-0.4, 0, 1.2], [0.4, 1.8, 2]], [0, 0.9, 1.6], [0.55, 0.25, -1], 640, 0.55, 0.8),
  };
  const keys = keysFor(c, t, rules);
  const alt = c.setting.alt(c.rep);
  return {
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      { [r.at.id]: 'you in a stand-in room: the text names the place, not its shape (a declared base)' },
      {
        [r.feels.id]: 'a feeling has no form in this scene; it is in the words beside it',
        ...(r.set ? { [r.set.id]: 'a still scene of the facts has no place for possibilities: they are listed beside it' } : {}),
        ...(r.q ? { [r.q.id]: 'nothing in a still scene of the facts says why' } : {}),
        ...remaining(c, r, 'nothing in a still scene of the facts says this'),
      },
    ),
    compose(v: number) {
      const space = new Space(cameraOn(keys, v));
      space.face('floor', [[-2, 0, 0], [2, 0, 0], [2, 0, 3.2], [-2, 0, 3.2]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, ['base:setting'], 'A stand-in floor: the text names the room, not its shape.', 0);
      space.face('wall', walls, [0, 0, -1], { role: 'far', material: 'shaded' }, ['base:setting'], 'A stand-in wall.', 0);
      space.face('wall-side', [[-2, 0, 0], [-2, 0, 3.2], [-2, 2.4, 3.2], [-2, 2.4, 0]], [1, 0, 0], { role: 'far', material: 'shaded' }, ['base:setting'], 'A stand-in wall.', 0);
      // Through your own eyes you are not in the picture; from within the room you are.
      const inside = v < 0.5 && stances(c)[0] === 'own';
      if (!inside && space.person(own, POSES.standing, at, Math.PI, 'subject', [r.at.id], 'You, in the place you were.')) space.shadow(`${own}-shadow`, own, at[0], at[2], 0.32, 0.26, [r.at.id], 'Grounds you.');
      const labels: SceneElement[] = [];
      if (t.labels && !inside) {
        const a = space.anchor([at[0], 2.05, at[2]], 0);
        if (a) labels.push(label('own-label', own, a, 'middle', [r.at.id], 'Names you.', { halo: true }));
      }
      if (t.labels) {
        const p = space.anchor([1.2, 2.15, 3.2], 0);
        if (p) labels.push(label('place-label', r.at.say.place, p, 'middle', [r.at.id], 'Names the place.', { tone: 'label-soft', halo: true }));
      }
      if (t.add3) labels.push(...t.add3(space, { [own]: at, [r.at.say.place]: [0, 0, 2] }));
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

export function feltField(c: Subject, t: FieldTuning): Figure {
  const r = read(c);
  const own = r.feels.say.who;
  const centre: Pt = [CX - 120, CY + 10];
  const levels = Math.round(10 * r.feels.say.charge) + 1;
  // P2's contours: a calm falloff, gently uneven, as many as the reported charge gives.
  const wobble = (a: number) => 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.sin(5 * a + 1);
  const fn = (x: number, y: number) => Math.exp(-Math.hypot(x, y) / (t.tightness * wobble(Math.atan2(y, x))));
  const rings: Pt[][] = [];
  for (let k = 0; k < levels; k++) {
    const level = 0.78 * Math.pow(0.78, k);
    const R = -t.tightness * Math.log(level) * 1.2 + 10;
    for (const line of contour(fn, { x: -R, y: -R, width: 2 * R, height: 2 * R }, 3, level)) rings.push(thin(line, 2).map((p) => [p[0] + centre[0], p[1] + centre[1]] as Pt));
  }
  const reach = Math.max(...rings.flatMap((l) => l.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1]))));
  const n = r.set && r.set.say.p === 'alternatives' ? r.set.say.options.length : 0;
  const lines = headings(centre, n, t, (p) => Math.hypot(p[0] - centre[0], p[1] - centre[1]) > reach + 8, reach + t.reach * 0.7);
  const alt = c.setting.alt(c.rep);
  return {
    idiom: 'field',
    axes: { space: 'flat', time: 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [r.feels.id]: `${levels} contours around you, tight near you, as many as the feeling you reported`,
        ...(r.set ? { [r.set.id]: `${n} headings of equal strength from the edge of the feeling, in the tentative dash` } : {}),
        ...(r.q ? { [r.q.id]: 'the headings: why is open' } : {}),
      },
      { [r.at.id]: 'the field doesn’t show places: where you were is in the words beside it', ...remaining(c, r, 'this pattern draws no place for this question') },
    ),
    compose() {
      const els: SceneElement[] = [
        path('agitation', rings.map((l) => polyline(l, true)).join(''), { role: 'subject', line: 'hair' }, [r.feels.id], 'How it felt to you: contours tight around you, as strong as you said.'),
        shape(own, { type: 'circle', cx: r2(centre[0]), cy: r2(centre[1]), r: 5 }, { role: 'subject', material: 'solid' }, [r.feels.id], 'You, at the source of the feeling.'),
        ...headingElements(lines, 1, r.set, r.q ? [r.q.id] : []),
      ];
      const labels = t.labels ? [label('own-label', own, [r2(centre[0]), r2(centre[1] + reach + 30)], 'middle', [r.feels.id], 'Says whose feeling it is.', { names: [own, 'agitation'], halo: true })] : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}
