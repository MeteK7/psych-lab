import type { Layer, SceneElement } from '../../../../shared/visual/composition/scene';
import type { V3 } from '../../../../shared/visual/generation/spatial/camera';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { extent2d, form2d, formOf, solid } from '../kit/forms';
import { Pt, ease, phaseProgress, polyline } from '../kit/paths';
import { FRAME, Key, Space, cameraOn, framedKey } from '../kit/spatial';
import { Stance, Statement, drawable, find } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';
import type { FieldTuning } from './field';
import { CY, KineticTuning } from './kinetic';
import { openRange } from './kinetic2';
import { SpatialTuning, centreOf, corners, keysFor, stances } from './spatial';

/**
 * STUDY CODE, revision 6, step 1 (findings-revision-6.md §1): the motion pattern's carrying case.
 * Something goes along a route (`flows`) and moves other things with it (`displaced … by` it, with no
 * meeting): they ride with it while their statement holds, as what joins the blood rides with it in
 * E1. A question about the mover's motion, in a phase after its route, is its course from then on,
 * drawn open. Height is drawn only from an established `above`; a place's own `form` (a slope) is
 * drawn as its shape. Reached through motion.ts, only when nothing meets anything (U1 never comes
 * here, so its accepted figures keep their code).
 */
export interface Carrying {
  flow: Statement & { say: { p: 'flows'; what: string; from: string; to: string } };
  carried: (Statement & { say: { p: 'displaced'; what: string; by: string } })[];
  /** An established `above (from, to)`: a rise. */
  raised?: Statement;
  /** An inferred `above (from, to)`: drawn level, and said so. */
  notRaised?: Statement;
  /** The question about the mover's motion in a later phase: its course from then on. */
  course?: Statement;
  /** Phase indices: the route, and when the course opens. */
  k: { flow: number; course: number; n: number };
}

/** Whether a case is the carrying kind: things moved by the mover, and no meeting. */
export function carrying(c: StudyCase): Carrying | null {
  const flow = find(c.rep, 'flows')[0];
  if (!flow || find(c.rep, 'contact').length) return null;
  const moved = find(c.rep, 'displaced');
  if (!moved.length || moved.some((s) => s.say.by !== flow.say.what)) return null;
  const phases = c.rep.time.phases;
  const at = (s: Statement | undefined, fallback: number) => (s?.phases?.length ? phases.indexOf(s.phases[0]) : fallback);
  const kFlow = at(flow, 0);
  const course = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'motion' && s.say.about === flow.say.what && at(s, -1) > kFlow);
  const above = (s: Statement) => s.say.p === 'above' && s.say.a === flow.say.from && s.say.b === flow.say.to;
  return {
    flow,
    carried: moved,
    raised: find(c.rep, 'above').find(above),
    notRaised: c.rep.statements.find((s) => s.commitment === 'inferred' && above(s)),
    course,
    k: { flow: kFlow, course: course ? at(course, kFlow + 1) : -1, n: Math.max(1, phases.length) },
  };
}

function shown(c: StudyCase, k: Carrying, how: { flow: string; carried: string; course: string; form: string; raised: string }): Record<string, string> {
  return {
    [k.flow.id]: how.flow + (k.notRaised ? '; drawn level, because that the start is above the end is inferred, not licensed (OI-25)' : ''),
    ...Object.fromEntries(k.carried.map((s) => [s.id, how.carried])),
    ...(k.raised ? { [k.raised.id]: how.raised } : {}),
    ...(k.course ? { [k.course.id]: how.course } : {}),
    ...Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'form').map((s) => [s.id, how.form])),
  };
}

function others(c: StudyCase, k: Carrying): Record<string, string> {
  return Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'question' && s !== k.course).map((s) => [s.id, 'this pattern draws no place for this question']));
}

const KINETIC_AXES = { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' } as const;
const SPATIAL_AXES = { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' } as const;

function flat(k: Carrying) {
  const ground = CY + 110;
  const x0 = SAFE + 60;
  const x1 = FRAME.width - SAFE - 40;
  const foot = x0 + (x1 - x0) * 0.32;
  const rise = k.raised ? 150 : 0;
  return { ground, x0, x1, foot, rise, surfaceAt: (x: number) => (x <= foot ? ground - rise * (1 - (x - x0) / (foot - x0)) : ground) };
}

export function carryingKinetic(c: StudyCase, t: KineticTuning, k: Carrying): Figure {
  const L = flat(k);
  const { from, to, what } = k.flow.say;
  const moverForm = formOf(c, what);
  const R = 20;
  const half = extent2d(moverForm, R);
  const startForm = formOf(c, from);
  const duration = k.k.n * t.stepMs;
  const alt = altText(c);
  // A stream lies on the ground from the start's foot; a thing travels on it, resting on its own extent.
  const lift = moverForm.feature ? half.h : 3;
  // The way starts where the start place ends: at its shape's edge when it has one, else at its foot.
  const startAt = startForm.feature ? L.x0 + 60 + 45 - 4 : L.foot - 6;
  const route = (u: number): Pt => {
    const x = startAt + (moverForm.feature ? 14 : 0) + (L.x1 - 50 - startAt) * u;
    return [x, L.surfaceAt(x) - lift];
  };
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: KINETIC_AXES,
    motion: { kind: 'timeline', duration, steps: [...c.rep.time.phases] },
    alt,
    coverage: coverage(
      c.rep,
      shown(c, k, {
        flow: moverForm.feature ? 'the form travels from where it starts to where it ends, left to right (C5), its trace behind it' : 'with no form given, what flows is drawn as its extent, reaching from where it starts to where it ends, left to right (C5)',
        carried: moverForm.feature ? 'small marks ride with it, one for each thing it carries' : 'small marks travel along it, for each thing it carries',
        course: 'after that, its course is an open band along the whole way, with no end',
        form: 'the form is drawn with this feature',
        raised: 'the start stands above the end; how high is a rule constant',
      }),
      others(c, k),
    ),
    compose(at: number) {
      const u = Math.min(1, Math.max(0, at));
      const pFlow = ease.move(phaseProgress(u, k.k.flow, k.k.n));
      const pCourse = k.course ? phaseProgress(u, k.k.course, k.k.n) : 0;
      const below: SceneElement[] = [
        shape(to, { type: 'line', x1: L.x0, y1: L.ground, x2: L.x1, y2: L.ground }, { role: 'context', line: 'regular' }, [k.flow.id], 'The ground the way runs along, to where it ends.'),
        startForm.feature
          ? form2d(from, startForm, [L.x0 + 60, L.ground - 45], 45, { role: 'mid', material: 'tonal' }, [k.flow.id], 'Where it starts, with the shape the text gives it.')
          : shape(from, { type: 'line', x1: L.x0, y1: L.ground, x2: L.foot, y2: L.ground }, { role: 'context', line: 'regular' }, [k.flow.id], 'Where it starts.'),
      ];
      const els: SceneElement[] = [];
      if (pCourse > 0)
        els.push(path('course-open', openRange(startAt, L.x1, L.ground - 30, L.ground - 2, 12), { role: 'context', line: 'fine', dash: 'tentative' }, [k.course!.id], 'Where it runs from now on is not said: open, with no end.'));
      // A mover with a form is a thing that travels, carrying marks on it. A mover with no form (what
      // flows, such as a stream) is drawn as the extent of its flow, the carried marks travelling
      // along it: drawing it as one travelling lump would make it an object (findings-revision-6.md §1).
      const stream = !moverForm.feature;
      const at0 = route(pFlow);
      if (stream) {
        if (pFlow > 0.002) els.push(path(what, polyline(Array.from({ length: 31 }, (_, i) => route((pFlow * i) / 30))), { role: 'subject', line: 'regular' }, [k.flow.id], 'What flows, reaching from where it starts as far as it has gone.'));
        k.carried.forEach((s, i) => {
          for (let j = 0; j < 3; j++) {
            const f = (((j + i / k.carried.length) / 3 + 0.35 * u) % 1) * pFlow;
            if (pFlow < 0.05) continue;
            const q = route(f);
            els.push(form2d(`${s.say.what}-${j + 1}`, formOf(c, s.say.what), [q[0], q[1] - 7 + i * 5], 4, { role: 'subject', material: 'solid' }, [s.id], 'Something it carries, moving along with it.'));
          }
        });
      } else {
        if (t.traces && pFlow > 0.002) els.push(path('mover-trace', polyline(Array.from({ length: 21 }, (_, i) => route((pFlow * i) / 20))), { role: 'context', line: 'hair' }, [k.flow.id], 'The way it has gone.'));
        els.push(form2d(what, moverForm, at0, R, { role: 'subject', material: 'lit', line: 'regular' }, [k.flow.id], 'What goes along the way.'));
        k.carried.forEach((s, i) => {
          const q: Pt = [at0[0] - half.w + 8 + i * 14, at0[1] - half.h - 7];
          els.push(form2d(s.say.what, formOf(c, s.say.what), q, 5, { role: 'subject', material: 'solid' }, [s.id], 'Something it carries, riding with it.'));
        });
      }
      const nameAt: Pt = stream ? route(Math.max(0.05, pFlow * 0.5)) : at0;
      const labels: SceneElement[] = t.labelForms
        ? [
            label('start-label', from, [r2(L.x0 + 60), r2(L.ground + 28)], 'middle', [k.flow.id], 'Names where it starts.', { names: [from] }),
            label('end-label', to, [r2(L.x1 - 60), r2(L.ground + 28)], 'middle', [k.flow.id], 'Names where it ends.', { names: [to] }),
            label('mover-label', what, [r2(nameAt[0]), r2(nameAt[1] - half.h - 30)], 'middle', [k.flow.id], 'Names what goes along the way.', stream && pFlow <= 0.002 ? {} : { names: [what] }),
            label('carried-label', 'carried', [r2(nameAt[0]), r2(L.ground + 50)], 'middle', k.carried.map((s) => s.id), 'Names what it carries.', { tone: 'label-soft' }),
          ]
        : [];
      const layers: Layer[] = [
        { id: 'planes', plane: 'mid', elements: below },
        { id: 'forms', plane: 'subject', elements: els },
        { id: 'labels', plane: 'annotation', elements: labels },
      ];
      return composed(c, 'kinetic', layers, alt, { carried: k.carried.map((s) => c.words[s.say.what] ?? s.say.what).join(', ') });
    },
  };
}

export function carryingSpatial(c: StudyCase, t: SpatialTuning, k: Carrying): Figure {
  const { from, to, what } = k.flow.say;
  const rise = k.raised ? 1.0 : 0;
  const [sx0, foot, far] = [-3.4, -1.2, 4.2];
  const startForm = formOf(c, from);
  const content: V3[] = corners([sx0, 0, -1.2], [far, Math.max(rise, 1.0), 1.2]);
  const rules: Partial<Record<Stance, Key>> = {
    side: framedKey(content, centreOf(content), [0.15, 0.4, -1], 640, 0.62, 0.85),
    above: framedKey(content, centreOf(content), [0.1, 1.0, -0.45], 640, 0.62, 0.85),
    front: framedKey(content, centreOf(content), [0.15, 0.4, -1], 640, 0.62, 0.85),
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  const way: V3[] = Array.from({ length: 25 }, (_, i) => {
    const x = foot + ((far - 0.4 - foot) * i) / 24;
    return [x, 0.07, 0.25 * Math.sin(i / 4)] as V3;
  });
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: SPATIAL_AXES,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      shown(c, k, {
        flow: 'a tube runs along the ground from where it starts to where it ends',
        carried: 'beads ride on the tube, one kind for each thing it carries',
        course: 'a wide open stretch around the tube: where it runs from now on is not said',
        form: 'the place is drawn with this shape',
        raised: 'the start rises above the ground (how high is a rule constant)',
      }),
      others(c, k),
    ),
    compose(v: number) {
      const space = new Space(cameraOn(keys, v));
      space.face('ground', [[sx0 - 0.4, 0, -1.4], [far, 0, -1.4], [far, 0, 1.4], [sx0 - 0.4, 0, 1.4]], [0, 1, 0], { role: 'far', material: 'shaded', facing: 'lit' }, ['base:ground'], 'A stand-in ground: the text names the places, not the land between.', 0);
      space.face(to, [[far - 1.6, 0.005, -1.3], [far, 0.005, -1.3], [far, 0.005, 1.3], [far - 1.6, 0.005, 1.3]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [k.flow.id], 'Where the way ends.', 0);
      if (startForm.feature === 'slope') {
        const cites = [k.flow.id, ...startForm.cites];
        const h = 0.8;
        const why = 'Where it starts, with the shape the text gives it (a slope).';
        space.face(`${from}-top`, [[sx0, h, -1], [foot, 0, -1], [foot, 0, 1], [sx0, h, 1]], [h / Math.hypot(h, foot - sx0), (foot - sx0) / Math.hypot(h, foot - sx0), 0], { role: 'near', material: 'shaded' }, cites, why);
        space.face(`${from}-near`, [[sx0, 0, -1], [foot, 0, -1], [sx0, h, -1]], [0, 0, -1], { role: 'near', material: 'shaded' }, cites, why);
        space.face(`${from}-back`, [[sx0, 0, -1], [sx0, h, -1], [sx0, h, 1], [sx0, 0, 1]], [-1, 0, 0], { role: 'near', material: 'shaded' }, cites, why);
      } else {
        space.face(from, [[sx0, 0.005, -1.3], [foot, 0.005, -1.3], [foot, 0.005, 1.3], [sx0, 0.005, 1.3]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [k.flow.id], 'Where it starts.', 0);
      }
      if (k.course)
        space.outline('course-open', [[foot, 0.01, -0.9], [far - 0.1, 0.01, -1.15], [far - 0.1, 0.01, 1.15], [foot, 0.01, 0.9]], { role: 'context', line: 'fine', dash: 'tentative' }, [k.course.id], 'Where it runs from now on is not said: open.');
      space.tube(what, way, 0.07, { role: 'subject', material: 'shaded', facing: 'base' }, [k.flow.id], 'What goes along the way: one tube from where it starts to where it ends.');
      k.carried.forEach((s, i) => {
        const pts = way.filter((_, j) => j % 3 === i % 3 && j > 0).map((p) => [p[0], p[1] + 0.09, p[2] + (i - (k.carried.length - 1) / 2) * 0.05] as V3);
        if (formOf(c, s.say.what).feature) for (const [j, p] of pts.entries()) solid(space, `${s.say.what}-${j}`, formOf(c, s.say.what), p, 0.05, [s.id], 'Something it carries.');
        else space.beads(s.say.what, pts, 0.03 + i * 0.012, { role: 'subject', material: 'lit', line: 'hair' }, [s.id], 'Something it carries: beads riding on it, one size for each thing carried.');
      });
      const labels: SceneElement[] = [];
      if (t.labels) {
        const put = (id: string, key: string, p: V3, cites: string[], why: string) => {
          const a = space.anchor(p, 0);
          if (a) labels.push(label(id, key, a, 'middle', cites, why, { halo: true }));
        };
        put('start-label', from, [sx0 + 0.7, (startForm.feature === 'slope' ? 0.8 : 0) + 0.3, -0.6], [k.flow.id], 'Names where it starts.');
        put('end-label', to, [far - 0.8, 0, -1.1], [k.flow.id], 'Names where it ends.');
        put('mover-label', what, [0.8, 0.45, 0], [k.flow.id], 'Names what goes along the way.');
        put('carried-label', 'carried', [2.2, 0.45, 0.2], k.carried.map((s) => s.id), 'Names what it carries.');
      }
      if (t.add3) labels.push(...t.add3(space, { [what]: [0.8, 0, 0], [from]: [sx0 + 1, 0, 0], [to]: [far - 0.8, 0, 0], ...Object.fromEntries(k.carried.map((s) => [s.say.what, [2, 0, 0] as V3])) }));
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt, { carried: k.carried.map((s) => c.words[s.say.what] ?? s.say.what).join(', ') });
    },
  };
}

export function carryingField(c: StudyCase, t: FieldTuning, k: Carrying): Figure {
  const L = flat(k);
  const { from, to, what } = k.flow.say;
  const duration = c.rep.facets.field?.evolves ? t.evolveMs : 0;
  // Density (F2): carrying is drawn as lanes closer together than an empty way's.
  const lanes = 7;
  const gap = 4;
  const lane = (i: number, x0: number, x1: number): Pt[] =>
    Array.from({ length: 31 }, (_, j) => {
      const x = x0 + ((x1 - x0) * j) / 30;
      return [x, L.surfaceAt(x) - 24 - i * gap] as Pt;
    });
  const alt = altText(c);
  const p = (at: number, kk: number) => (duration ? ease.move(phaseProgress(at, kk, k.k.n)) : 1);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: { space: 'flat', time: duration ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: duration ? { kind: 'timeline', duration, steps: [...c.rep.time.phases] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      shown(c, k, {
        flow: `${lanes} coherent lanes run from where it starts to where it ends, because it is reported`,
        carried: 'the lanes run close together: the way is dense with what it carries',
        course: 'tentative lanes on either side of the way: where it runs from now on is open',
        form: 'a field carries qualities, not forms: the shape is not drawn',
        raised: 'the lanes start high (how high is a rule constant)',
      }),
      others(c, k),
    ),
    compose(at: number) {
      const pFlow = p(at, k.k.flow);
      const pCourse = k.course ? p(at, k.k.course) : 0;
      const reach = L.x0 + (L.x1 - 30 - L.x0) * pFlow;
      const els: SceneElement[] = [];
      if (pFlow > 0.002)
        els.push(path('lanes', Array.from({ length: lanes }, (_, i) => polyline(lane(i - (lanes - 1) / 2, L.x0, reach))).join(''), { role: 'subject', line: 'hair' }, [k.flow.id, ...k.carried.map((s) => s.id)], 'The way it goes, dense with what it carries.'));
      if (k.course && pCourse > 0) {
        // Beside the whole way, not at its end: an end that fans out would read as a mouth (a delta).
        const side = [-1, 1].map((d) => polyline(lane(d * ((lanes - 1) / 2 + 4 + 3 * pCourse), L.x0 + 30, L.x1 - 30))).join('');
        els.push(path('course-open', side, { role: 'context', line: 'hair', dash: 'tentative' }, [k.course.id], 'Where it runs from now on is not said: open, on either side of the way.'));
      }
      const labels: SceneElement[] = t.labels
        ? [
            label('start-label', from, [r2(L.x0 + 40), r2(L.ground + 28)], 'middle', [k.flow.id], 'Names where it starts.'),
            label('end-label', to, [r2(L.x1 - 60), r2(L.ground + 28)], 'middle', [k.flow.id], 'Names where it ends.'),
            label('mover-label', what, [r2(L.x0 + 40), r2(L.ground - 90)], 'middle', [k.flow.id], 'Names what goes along the way.'),
            label('carried-label', 'carried', [r2((L.x0 + L.x1) / 2), r2(L.ground - 70)], 'middle', k.carried.map((s) => s.id), 'Names what it carries.', { tone: 'label-soft' }),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt, { carried: k.carried.map((s) => c.words[s.say.what] ?? s.say.what).join(', ') });
    },
  };
}
