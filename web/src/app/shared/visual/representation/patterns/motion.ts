import type { Layer, SceneElement } from '../../composition/scene';
import type { V3 } from '../../generation/spatial/camera';
import { label, path, r2, shape } from '../kit/elements';
import { FormOf, extent2d, form2d, formOf, solid } from '../kit/forms';
import { Pt, Track, circlePath, ease, phaseProgress, polyline } from '../kit/paths';
import { FRAME, Key, Space, cameraOn, framedKey } from '../kit/spatial';
import { Stance, Statement, drawable, find, isEstablished } from '../contract';
import { Subject, Figure, SAFE, composed, coverage } from '../setting';
import type { FieldTuning } from '../idioms/field';
import { CY, KineticTuning, openRange } from '../idioms/kinetic';
import { carrying, carryingField, carryingKinetic, carryingSpatial } from './carrying';
import { needs } from '../needs';
import { SpatialTuning, centreOf, corners, keysFor, stances } from '../idioms/spatial';

/**
 * S12 general pattern (Stage 3, M3; written by the representation study, revision 5, step 3, findings-revision-5.md §3): things that move, meet and move one
 * another, in all three idioms. It is built from predicates and facets only: a route (`flows`), what
 * lies above what (`above`), a meeting (`contact`), a thing moved by another (`displaced`) and forms
 * (`form`, v0.2). The places come from those relations, not from a setting written for one case.
 *
 * It draws a representation only if it can draw all of its established statements; otherwise it
 * says what it lacks (registry.ts). Under evaluation: none of its figures counts as adopted until
 * the user has looked (the plan's step 3).
 */

interface Reading {
  flow?: Statement & { say: { p: 'flows'; what: string; from: string; to: string } };
  contact?: Statement & { say: { p: 'contact'; a: string; b: string } };
  moved?: Statement & { say: { p: 'displaced'; what: string; by: string } };
  /** The `above` statement that raises the route's start over its end. */
  raised?: Statement;
  /** The question about where the moved thing ends up. */
  fate?: Statement;
  /** The mover, and the thing it meets. */
  mover: string;
  met?: string;
  /** Phase indices (of `time.phases`) for the route, the meeting and the movement after it. */
  k: { flow: number; contact: number; moved: number; n: number };
}

/** What this pattern lacks for a case (registry.ts). */
export function motionLacks(c: Subject): string[] {
  const out: string[] = [];
  const flows = find(c.rep, 'flows');
  if (!flows.length && !find(c.rep, 'displaced').length) out.push('something that moves (a `flows` or `displaced` statement)');
  if (flows.length > 1) out.push('a single route (more than one is not built yet)');
  // Revision 8 (structural need, found by the probe): height is drawn only between the route's start and end.
  if (find(c.rep, 'above').some((s) => !flows[0] || s.say.a !== flows[0].say.from || s.say.b !== flows[0].say.to)) out.push('“above” only between where the route starts and ends');
  // Revision 6: several things carried by the mover (no meeting) are drawn by carrying.ts.
  if (find(c.rep, 'contact').length > 1 || (find(c.rep, 'displaced').length > 1 && !carrying(c))) out.push('a single meeting (more than one is not built yet)');
  // Revision 8: the kinds it draws are declared in draws.ts (MOTION); only structural needs stay here.
  if (c.rep.elements.some((e) => e.count !== undefined)) out.push('single things (not a plural presence)');
  if (!needs.own(c).length) out.push('a scene without the viewer’s own presence (drawing the viewer here is not built yet)');
  return out;
}

function read(c: Subject): Reading {
  const flow = find(c.rep, 'flows')[0];
  const contact = find(c.rep, 'contact')[0];
  const moved = find(c.rep, 'displaced')[0];
  const mover = flow?.say.what ?? moved?.say.by ?? contact?.say.a;
  const met = moved?.say.what ?? (contact ? (contact.say.a === mover ? contact.say.b : contact.say.a) : undefined);
  const raised = flow ? find(c.rep, 'above').find((s) => s.say.a === flow.say.from && s.say.b === flow.say.to) : undefined;
  const fate = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'fate' && s.say.about === met);
  const phases = c.rep.time.phases;
  const at = (s: Statement | undefined, fallback: number) => (s?.phases?.length ? phases.indexOf(s.phases[0]) : fallback);
  const n = Math.max(1, phases.length);
  return { flow, contact, moved, mover, met, raised, fate, k: { flow: at(flow, 0), contact: at(contact, Math.min(1, n - 1)), moved: at(moved, n - 1), n } };
}

/** Coverage shared by the idioms: questions other than the moved thing's fate aren't drawn. */
function otherQuestions(c: Subject, r: Reading): Record<string, string> {
  return Object.fromEntries(
    drawable(c.rep)
      .filter((s) => s.say.p === 'question' && s !== r.fate)
      .map((s) => [s.id, 'this pattern draws no place for this question']),
  );
}

function formsShown(c: Subject, how: string): Record<string, string> {
  return Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'form').map((s) => [s.id, how]));
}

const KINETIC_AXES = { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' } as const;
const SPATIAL_AXES = { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' } as const;
const fieldAxes = (moving: boolean) => ({ space: 'flat', time: moving ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' }) as const;

/**
 * The flat layout, shared by the kinetic and field figures: the route's start (raised, when the text
 * says it is above the end) slopes down to the end, a level surface. How high is not said: the rise
 * is a rule constant, the least that reads as "above".
 */
function layout(r: Reading) {
  const ground = CY + 120;
  const x0 = SAFE + 60;
  const x1 = FRAME.width - SAFE - 40;
  const foot = x0 + (x1 - x0) * 0.4;
  const rise = r.raised ? 150 : 0;
  // The thing met stands just past the foot: "at the bottom" is where the route arrives.
  const metAt = foot + 90;
  return { ground, x0, x1, foot, rise, metAt, surfaceAt: (x: number) => (x <= foot ? ground - rise * (1 - (x - x0) / (foot - x0)) : ground) };
}

/** The field idiom's need (revision 6): agitation for a meeting (U1), density for carrying (U3). */
export function motionFieldLacks(c: Subject): string[] {
  const q = c.rep.facets.field?.quality;
  const kind = carrying(c) ? 'density' : 'agitation';
  return [...(q === kind ? [] : [`a field of ${kind}`]), ...motionLacks(c)];
}

export function motionKinetic(c: Subject, t: KineticTuning): Figure {
  const k = carrying(c);
  if (k) return carryingKinetic(c, t, k);
  const r = read(c);
  const L = layout(r);
  const moverForm = formOf(c, r.mover);
  const metForm: FormOf | null = r.met ? formOf(c, r.met) : null;
  const R = 18;
  const RM = 26;
  const ranged = t.unscaled === 'range';
  const lead = 60;
  const moverHalf = extent2d(moverForm, R);
  const metHalf = metForm ? extent2d(metForm, RM) : { w: 0, h: 0 };
  // The mover's way: down the start's surface and along the end's, to touching the thing met.
  const stopX = r.met ? L.metAt - metHalf.w - moverHalf.w : L.x1 - 40;
  const way: Pt[] = Array.from({ length: 41 }, (_, i) => {
    const x = L.x0 + moverHalf.w + ((stopX - L.x0 - moverHalf.w) * i) / 40;
    return [x, L.surfaceAt(x) - moverHalf.h];
  });
  const track = new Track(way);
  // How far the thing met is moved is not said (R4-4 range, adopted for this idiom): it moves the least
  // visible distance and an open band runs on to the end of the surface, with no end point.
  const movedBy = ranged ? lead : 220 * t.unspecified;
  const duration = r.k.n * t.stepMs;
  const alt = c.setting.alt(c.rep);
  const fromStmt = r.flow ? [r.flow.id] : [];
  return {
    idiom: 'kinetic',
    axes: KINETIC_AXES,
    motion: { kind: 'timeline', duration, steps: [...c.rep.time.phases] },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...(r.flow ? { [r.flow.id]: 'the form travels down and along its way, left to right (C5), its trace behind it' } : {}),
        ...(r.raised ? { [r.raised.id]: 'the start of the way stands above its end; how high is not said (the rise is a rule constant)' } : {}),
        ...(r.contact ? { [r.contact.id]: 'the two forms touch, and a fine ring marks the moment' } : {}),
        ...(r.moved
          ? {
              [r.moved.id]: ranged
                ? 'the form that was hit starts moving only when it is hit; it moves a short way and an open band runs on with no end, because how far is not said'
                : 'the form that was hit starts moving only when it is hit (the distance is a rule constant)',
            }
          : {}),
        ...(r.fate ? { [r.fate.id]: 'the open band ahead of it, in the tentative dash, with no end' } : {}),
        ...formsShown(c, 'the form is drawn with this feature'),
      },
      otherQuestions(c, r),
    ),
    compose(at: number) {
      const u = Math.min(1, Math.max(0, at));
      const pFlow = ease.move(phaseProgress(u, r.k.flow, r.k.n));
      const pHit = phaseProgress(u, r.k.contact, r.k.n);
      const pMoved = ease.move(phaseProgress(u, r.k.moved, r.k.n));
      const below: SceneElement[] = [];
      // The places: the start's surface (a slope when it stands above the end), the end's level surface.
      if (r.flow) {
        const start = r.flow.say.from;
        const end = r.flow.say.to;
        below.push(
          L.rise
            ? path(start, `M${r2(L.x0)} ${r2(L.ground - L.rise)}L${r2(L.foot)} ${r2(L.ground)}L${r2(L.x0)} ${r2(L.ground)}Z`, { role: 'mid', material: 'tonal' }, [r.flow.id, ...(r.raised ? [r.raised.id] : []), ...formOf(c, start).cites], 'Where the way starts: above where it ends, so it slopes down.')
            : shape(start, { type: 'line', x1: L.x0, y1: L.ground, x2: L.foot, y2: L.ground }, { role: 'context', line: 'regular' }, [r.flow.id], 'Where the way starts.'),
          shape(end, { type: 'line', x1: L.foot, y1: L.ground, x2: L.x1, y2: L.ground }, { role: 'context', line: 'regular' }, [r.flow.id, ...formOf(c, end).cites], 'Where the way arrives: a level surface.'),
        );
      } else {
        below.push(shape('ground', { type: 'line', x1: L.x0, y1: L.ground, x2: L.x1, y2: L.ground }, { role: 'context', line: 'fine' }, ['base:ground'], 'A stand-in surface: the text names none.'));
      }
      const els: SceneElement[] = [];
      const moverAt = track.at(pFlow);
      if (t.traces && pFlow > 0.002) els.push(path('mover-trace', polyline(track.slice(0, pFlow)), { role: 'context', line: 'hair' }, fromStmt, 'The way it came.'));
      // After the meeting the text says nothing more of the mover: it is drawn open from then on.
      const after = r.contact && pHit >= 1;
      els.push(
        form2d(r.mover, moverForm, moverAt, R, after ? { role: 'subject', line: 'fine', dash: 'tentative' } : { role: 'subject', material: 'solid' }, [...fromStmt, ...(r.contact ? [r.contact.id] : [])], after ? 'What it does after the meeting is not said: drawn open.' : 'What moves.'),
      );
      if (r.contact && pHit > 0 && pHit < 1) {
        const touch: Pt = [moverAt[0] + moverHalf.w, moverAt[1]];
        els.push(shape('meeting', { type: 'circle', cx: r2(touch[0]), cy: r2(touch[1]), r: r2(8 + 22 * ease.arrive(pHit)) }, { role: 'context', line: 'hair' }, [r.contact.id], 'The moment they meet.'));
      }
      if (r.met && metForm) {
        const x = L.metAt + movedBy * pMoved;
        const y = L.ground - metHalf.h;
        if (r.moved && ranged && pMoved > 0) {
          const from = L.metAt + metHalf.w + 18;
          els.push(path(`${r.met}-range`, openRange(from, L.x1, y - metHalf.h * 0.6, y + metHalf.h * 0.6, 8), { role: 'context', line: 'fine', dash: 'tentative' }, [r.moved.id, ...(r.fate ? [r.fate.id] : [])], 'How far it goes, and where it ends, is not said: open, with no end.'));
        }
        els.push(form2d(r.met, metForm, [x, y], RM, { role: 'near', material: 'tonal' }, [...(r.contact ? [r.contact.id] : []), ...(r.moved ? [r.moved.id] : [])], 'What is met, and moved by it.'));
      }
      const labels: SceneElement[] = t.labelForms
        ? [
            ...(r.flow ? [label('start-label', r.flow.say.from, [r2(L.x0 + 50), r2(L.ground + 28)], 'middle', [r.flow.id], 'Names where it starts.', { names: [r.flow.say.from] })] : []),
            ...(r.flow ? [label('end-label', r.flow.say.to, [r2(L.x1 - 60), r2(L.ground + 28)], 'middle', [r.flow.id], 'Names where it arrives.', { names: [r.flow.say.to] })] : []),
            // Names travel with their forms, so a still frame names what is where.
            label('mover-label', r.mover, [r2(moverAt[0]), r2(moverAt[1] - moverHalf.h - 20)], 'middle', fromStmt.length ? fromStmt : ['base:ground'], 'Names what moves.', { names: [r.mover] }),
            ...(r.met ? [label('met-label', r.met, [r2(L.metAt + movedBy * pMoved), r2(L.ground - 2 * metHalf.h - 22)], 'middle', [r.contact?.id ?? r.moved!.id], 'Names what is met.', { names: [r.met] })] : []),
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

export function motionSpatial(c: Subject, t: SpatialTuning): Figure {
  const k = carrying(c);
  if (k) return carryingSpatial(c, t, k);
  const r = read(c);
  const moverForm = formOf(c, r.mover);
  const metForm = r.met ? formOf(c, r.met) : null;
  // The world: the end is the ground (y = 0); a raised start slopes down to it. How high, how long and
  // how far the thing met moves are not said: rule constants (R4-4 stays at the constant here).
  const rise = r.raised ? 1.0 : 0;
  const [sx0, foot] = [-3.2, -0.8];
  const depth = 0.5;
  const moverSize = 0.3;
  const metSize = 0.5;
  const metRest = foot + moverSize + metSize / 2 + 0.02;
  const movedBy = r.moved ? 0.2 : 0;
  const far = 4.0;
  // S8: the moment just after the meeting: the mover where it met the other, the other just set moving.
  const moverAt: V3 = [metRest - metSize / 2 - moverSize / 2, 0, 0];
  const content: V3[] = [...corners([sx0, 0, -depth], [far, Math.max(rise, metSize), depth])];
  const rules: Partial<Record<Stance, Key>> = {
    front: framedKey(content, centreOf(content), [0.1, 0.35, -1], 640, 0.6, 0.85),
    // From the start's side, above: the way down, the meeting and the open ground ahead in one view.
    side: framedKey(content, centreOf(content), [-0.75, 0.26, -0.6], 640, 0.6, 0.85),
    across: framedKey(content, centreOf(content), [0.1, 0.35, -1], 640, 0.6, 0.85),
  };
  const keys = keysFor(c, t, rules);
  const alt = c.setting.alt(c.rep);
  return {
    idiom: 'spatial',
    axes: SPATIAL_AXES,
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...(r.flow ? { [r.flow.id]: 'the form at the foot of the slope, the way it came traced down it' } : {}),
        ...(r.raised ? { [r.raised.id]: 'the start rises above the ground the way ends on (how high is a rule constant)' } : {}),
        ...(r.contact ? { [r.contact.id]: 'the moment just after they met: the mover where the other stood (S8)' } : {}),
        ...(r.moved ? { [r.moved.id]: 'the other a little way on from where it stood, its earlier place outlined (the distance is a rule constant)' } : {}),
        ...(r.fate ? { [r.fate.id]: 'an open stretch of ground ahead of it, in the tentative dash, with no end' } : {}),
        ...formsShown(c, 'the solid is drawn with this feature'),
      },
      otherQuestions(c, r),
    ),
    compose(v: number) {
      const space = new Space(cameraOn(keys, v));
      const endCites = r.flow ? [r.flow.id, ...formOf(c, r.flow.say.to).cites] : ['base:ground'];
      space.face(r.flow?.say.to ?? 'ground', [[sx0 - 0.4, 0, -1.2], [far, 0, -1.2], [far, 0, 1.2], [sx0 - 0.4, 0, 1.2]], [0, 1, 0], { role: 'far', material: 'shaded', facing: 'lit' }, endCites, 'Where the way ends: the ground.', 0);
      if (r.flow && rise) {
        const cites = [r.flow.id, ...(r.raised ? [r.raised.id] : []), ...formOf(c, r.flow.say.from).cites];
        const why = 'Where the way starts: above the ground, so it slopes down to it.';
        const len = foot - sx0;
        const n: V3 = [rise / Math.hypot(rise, len), len / Math.hypot(rise, len), 0];
        space.face(`${r.flow.say.from}-top`, [[sx0, rise, -depth], [foot, 0, -depth], [foot, 0, depth], [sx0, rise, depth]], n, { role: 'near', material: 'shaded' }, cites, why);
        space.face(`${r.flow.say.from}-back`, [[sx0, 0, -depth], [sx0, rise, -depth], [sx0, rise, depth], [sx0, 0, depth]], [-1, 0, 0], { role: 'near', material: 'shaded' }, cites, why);
        space.face(`${r.flow.say.from}-near`, [[sx0, 0, -depth], [foot, 0, -depth], [sx0, rise, -depth]], [0, 0, -1], { role: 'near', material: 'shaded' }, cites, why);
        space.face(`${r.flow.say.from}-far`, [[sx0, 0, depth], [sx0, rise, depth], [foot, 0, depth]], [0, 0, 1], { role: 'near', material: 'shaded' }, cites, why);
        space.outline('mover-trace', [[sx0 + 0.2, rise * (1 - 0.2 / len) + 0.01, 0], [foot, 0.01, 0], [moverAt[0], 0.01, 0]], { role: 'context', line: 'hair' }, [r.flow.id], 'The way it came, down the slope.', false);
      }
      solid(space, r.mover, moverForm, moverAt, moverSize, [...(r.flow ? [r.flow.id] : []), ...(r.contact ? [r.contact.id] : [])], 'What moved, where it met the other.');
      if (r.met && metForm) {
        const x = metRest + movedBy;
        if (r.moved)
          space.outline(`${r.met}-was`, [[metRest - metSize / 2, 0.005, -metSize / 2], [metRest + metSize / 2, 0.005, -metSize / 2], [metRest + metSize / 2, 0.005, metSize / 2], [metRest - metSize / 2, 0.005, metSize / 2]], { role: 'context', line: 'hair' }, [r.moved.id], 'Where it stood before it was moved.');
        if (r.fate)
          space.outline(`${r.met}-ahead`, [[x + metSize / 2 + 0.08, 0.005, -metSize / 2], [far - 0.05, 0.005, -metSize / 2], [far - 0.05, 0.005, metSize / 2], [x + metSize / 2 + 0.08, 0.005, metSize / 2]], { role: 'context', line: 'fine', dash: 'tentative' }, [r.fate.id, ...(r.moved ? [r.moved.id] : [])], 'How far it goes, and where it ends, is not said: open.');
        solid(space, r.met, metForm, [x, 0, 0], metSize, [...(r.contact ? [r.contact.id] : []), ...(r.moved ? [r.moved.id] : [])], 'What was met, and moved by it.');
      }
      const labels: SceneElement[] = [];
      if (t.labels) {
        const put = (id: string, key: string, p: V3, cites: string[], why: string) => {
          const a = space.anchor(p, 0);
          if (a) labels.push(label(id, key, a, 'middle', cites, why, { halo: true }));
        };
        const cited = r.flow ? [r.flow.id] : ['base:ground'];
        put('mover-label', r.mover, [moverAt[0] - 0.1, moverSize + 0.35, 0], cited, 'Names what moved.');
        if (r.met) put('met-label', r.met, [metRest + movedBy, metSize + 0.3, 0], [r.contact?.id ?? r.moved!.id], 'Names what was met.');
        if (r.flow && rise) put('start-label', r.flow.say.from, [sx0 + 0.6, rise + 0.25, 0], cited, 'Names where it started.');
        if (r.flow) put('end-label', r.flow.say.to, [far - 0.8, 0, -0.9], cited, 'Names the ground it arrived on.');
      }
      if (t.add3) labels.push(...t.add3(space, { [r.mover]: moverAt, ...(r.met ? { [r.met]: [metRest + movedBy, 0, 0] as V3 } : {}), ...(r.flow ? { [r.flow.say.from]: [sx0 + 1, rise, 0] as V3, [r.flow.say.to]: [far - 1, 0, 0] as V3 } : {}) }));
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

export function motionField(c: Subject, t: FieldTuning): Figure {
  const k = carrying(c);
  if (k) return carryingField(c, t, k);
  const r = read(c);
  const L = layout(r);
  const duration = c.rep.facets.field?.evolves ? t.evolveMs : 0;
  const lanes = 5;
  const gap = 7;
  const meetX = r.met ? L.metAt - 30 : L.x1 - 60;
  const lane = (i: number, x0: number, x1: number): Pt[] =>
    Array.from({ length: 31 }, (_, k) => {
      const x = x0 + ((x1 - x0) * k) / 30;
      return [x, L.surfaceAt(x) - 14 - i * gap] as Pt;
    });
  const alt = c.setting.alt(c.rep);
  const p = (at: number, k: number) => (duration ? ease.move(phaseProgress(at, k, r.k.n)) : 1);
  return {
    idiom: 'field',
    axes: fieldAxes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: [...c.rep.time.phases] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...(r.flow ? { [r.flow.id]: `${lanes} coherent lanes run down and along the way, because it is reported` } : {}),
        ...(r.raised ? { [r.raised.id]: 'the lanes start high and descend (how high is a rule constant)' } : {}),
        ...(r.contact ? { [r.contact.id]: 'a disturbance spreads in rings from where they meet' } : {}),
        ...(r.moved ? { [r.moved.id]: 'from the meeting the lanes carry on a short way (a rule constant)' } : {}),
        ...(r.fate ? { [r.fate.id]: 'then they go on open, in the tentative dash, to the edge' } : {}),
      },
      {
        ...otherQuestions(c, r),
        ...Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'form').map((s) => [s.id, 'a field carries qualities, not forms'])),
      },
    ),
    compose(at: number) {
      const pFlow = p(at, r.k.flow);
      const pHit = p(at, r.k.contact);
      const pMoved = p(at, r.k.moved);
      const els: SceneElement[] = [];
      const flowCites = r.flow ? [r.flow.id, ...(r.raised ? [r.raised.id] : [])] : ['base:ground'];
      const reach = L.x0 + (meetX - L.x0) * pFlow;
      if (pFlow > 0.002) els.push(path('lanes', Array.from({ length: lanes }, (_, i) => polyline(lane(i - (lanes - 1) / 2, L.x0, reach))).join(''), { role: 'subject', line: 'fine' }, flowCites, 'The way it went: coherent, because it is reported.'));
      if (r.contact && pHit > 0) {
        const centre: Pt = [meetX, L.ground - 14];
        const rings = [0, 1, 2, 3].filter((k) => pHit > k / 4).map((k) => circlePath(centre, r2(14 + (k + 1) * 16 * Math.min(1, pHit * 1.2))));
        els.push(path('disturbance', rings.join(''), { role: 'subject', line: 'hair' }, [r.contact.id], 'Where they meet: a disturbance spreading from it.'));
      }
      if (r.moved && pMoved > 0) {
        const on = meetX + 40 + 120 * pMoved;
        els.push(path('moved-lanes', Array.from({ length: 3 }, (_, i) => polyline(lane(i - 1, meetX + 40, on))).join(''), { role: 'subject', line: 'fine' }, [r.moved.id], 'From the meeting, what was moved goes on.'));
        if (r.fate && pMoved >= 1) els.push(path('open-lanes', Array.from({ length: 3 }, (_, i) => polyline(lane(i - 1, on + 8, L.x1))).join(''), { role: 'context', line: 'hair', dash: 'tentative' }, [r.fate.id, r.moved.id], 'How far it goes, and where it ends, is not said: open.'));
      }
      const labels: SceneElement[] = t.labels
        ? [
            ...(r.flow ? [label('start-label', r.flow.say.from, [r2(L.x0 + 50), r2(L.ground + 28)], 'middle', [r.flow.id], 'Names where it starts.')] : []),
            ...(r.flow ? [label('end-label', r.flow.say.to, [r2(L.x1 - 60), r2(L.ground + 28)], 'middle', [r.flow.id], 'Names where it arrives.')] : []),
            ...(r.met ? [label('met-label', r.met, [r2(meetX + 60), r2(L.ground - 70)], 'middle', [r.contact?.id ?? r.moved!.id], 'Names what is met.')] : []),
            label('mover-label', r.mover, [r2(L.x0 + 40), r2(L.ground - L.rise - 52)], 'middle', flowCites, 'Names what moves.'),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}
