import type { Layer, SceneElement } from '../../../../shared/visual/composition/scene';
import type { V3 } from '../../../../shared/visual/generation/spatial/camera';
import { POSES } from '../../../../shared/visual/generation/spatial/figures';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { formOf, solid } from '../kit/forms';
import { Pt, circlePath, ease, phaseProgress, polyline } from '../kit/paths';
import { FRAME, Key, Space, cameraOn, framedKey } from '../kit/spatial';
import { Stance, Statement, drawable, find, isEstablished } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';
import type { FieldTuning } from './field';
import { CY, KineticTuning, roundedRect } from './kinetic';
import { countOf } from './kinetic2';
import { needs } from './registry';
import { SpatialTuning, centreOf, corners, keysFor, stances } from './spatial';

/**
 * STUDY CODE, revision 6, step 2 (findings-revision-6.md §2): a dependency, with parts of one whole.
 * Built from `depends-on`, `part-of`, `complete` and `located-in` only. Parts of one whole sit
 * together (C9). A complete part is drawn filled; a part that depends is drawn as an outline, because
 * nothing establishes its state (not "not started": that would need `waiting` or `absent`). What it
 * depends on is drawn with the group it is part of; an open question about it puts it in the open
 * register. `waiting` and `precedes` are not needed, and not drawn when inferred.
 */

export function dependencyLacks(c: StudyCase): string[] {
  const out = [...needs.a(c, 'depends-on')];
  // Revision 7: no longer needs a part done or a whole: a single dependency is drawable on its own.
  // Revision 8: the kinds it draws, and that it draws one dependency, are declared in draws.ts (DEPENDENCY).
  if (!needs.own(c).length) out.push('a scene without the viewer’s own presence (not built yet)');
  return out;
}

interface Reading {
  dep: Statement & { say: { p: 'depends-on'; what: string; on: string } };
  /** The parts shown side by side: those of the dependent's whole, else the dependent alone. */
  parts: string[];
  whole?: Statement & { say: { p: 'part-of'; part: string; whole: string } };
  complete: Set<string>;
  /** Where each part is, when the text says. */
  placeOf: Map<string, Statement & { say: { p: 'located-in'; what: string; place: string } }>;
  /** The group the source is part of, when it is a plural presence. */
  group?: Statement & { say: { p: 'part-of'; part: string; whole: string } };
  /** An open question about the source. */
  open?: Statement;
  k: { dep: number; n: number };
  completeAt: Map<string, number>;
}

function read(c: StudyCase): Reading {
  const dep = find(c.rep, 'depends-on')[0];
  const partOf = find(c.rep, 'part-of');
  const whole = partOf.find((s) => s.say.part === dep.say.what);
  const parts = whole ? partOf.filter((s) => s.say.whole === whole.say.whole).map((s) => s.say.part) : [dep.say.what];
  const completes = find(c.rep, 'complete');
  const phases = c.rep.time.phases;
  const n = Math.max(1, phases.length);
  const at = (s: Statement, fallback: number) => (s.phases?.length ? phases.indexOf(s.phases[0]) : fallback);
  return {
    dep,
    parts,
    whole,
    complete: new Set(completes.map((s) => s.say.what)),
    completeAt: new Map(completes.map((s) => [s.say.what, at(s, 0)])),
    placeOf: new Map(find(c.rep, 'located-in').map((s) => [s.say.what, s])),
    group: partOf.find((s) => s.say.part === dep.say.on),
    open: c.rep.statements.find((s) => s.say.p === 'question' && s.say.about === dep.say.on),
    k: { dep: at(dep, n - 1), n },
  };
}

function covered(c: StudyCase, r: Reading, how: { dep: string; part: string; complete: string; place: string; group: string; open: string }): Record<string, string> {
  return Object.fromEntries(
    drawable(c.rep).flatMap((s): [string, string][] => {
      if (s === r.dep) return [[s.id, how.dep]];
      if (s === r.open) return [[s.id, how.open]];
      if (s === r.group) return [[s.id, how.group]];
      if (s.say.p === 'part-of') return [[s.id, how.part]];
      if (s.say.p === 'complete') return [[s.id, how.complete]];
      if (s.say.p === 'located-in') return [[s.id, how.place]];
      return [];
    }),
  );
}

function notCovered(c: StudyCase, r: Reading): Record<string, string> {
  return Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'question' && s !== r.open).map((s) => [s.id, 'this pattern draws no place for this question']));
}

const cites = (c: StudyCase, id: string) =>
  drawable(c.rep)
    .filter((s) => Object.values(s.say).includes(id) && s.say.p !== 'question')
    .map((s) => s.id);

export function dependencyKinetic(c: StudyCase, t: KineticTuning): Figure {
  const r = read(c);
  const { what, on } = r.dep.say;
  const [w, h] = [150, 84];
  const gap = 40;
  const x0 = SAFE + 80;
  const y = CY - 10;
  const partAt = (k: number): Pt => [x0 + w / 2 + k * (w + gap), y];
  const n = r.group ? countOf(c, r.group.say.whole) : countOf(c, on);
  const m = Math.min(n, countOf(c, on));
  const gx = FRAME.width - SAFE - 150;
  const members: Pt[] = Array.from({ length: n }, (_, k) => [gx + (k % 2) * 56 - 28, y - 40 + Math.floor(k / 2) * 56] as Pt);
  const source = members.slice(0, m);
  const sc: Pt = [source.reduce((s, p) => s + p[0], 0) / m, source.reduce((s, p) => s + p[1], 0) / m];
  const dependentAt = partAt(r.parts.indexOf(what));
  const duration = r.k.n * t.stepMs;
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' },
    motion: { kind: 'timeline', duration, steps: [...c.rep.time.phases] },
    alt,
    coverage: coverage(
      c.rep,
      covered(c, r, {
        dep: 'a fine line from the part that depends to what it depends on',
        part: 'the parts sit side by side inside one outline, the whole (C9)',
        complete: 'the complete part fills in',
        place: 'each part stands on a base named for its place',
        group: 'what it depends on is drawn among its group, which has its own count',
        open: 'an open ring around what it depends on, in the tentative dash',
      }),
      notCovered(c, r),
    ),
    compose(at: number) {
      const u = Math.min(1, Math.max(0, at));
      const pDep = ease.move(phaseProgress(u, r.k.dep, r.k.n));
      const below: SceneElement[] = [];
      const els: SceneElement[] = [];
      if (r.whole) below.push(path(r.whole.say.whole, roundedRect(x0 - 24, y - h / 2 - 34, r.parts.length * (w + gap) - gap + 48, h + 96, 22), { role: 'context', line: 'hair' }, [r.whole.id], 'The whole the parts belong to.'));
      r.parts.forEach((p, k) => {
        const [cx, cy] = partAt(k);
        const done = r.complete.has(p) ? ease.move(phaseProgress(u, r.completeAt.get(p)!, r.k.n)) : 0;
        const place = r.placeOf.get(p);
        if (place) below.push(shape(`${p}-base`, { type: 'line', x1: cx - w / 2, y1: cy + h / 2 + 12, x2: cx + w / 2, y2: cy + h / 2 + 12 }, { role: 'context', line: 'regular' }, [place.id], 'Where this part is.'));
        els.push(path(p, roundedRect(cx - w / 2, cy - h / 2, w, h, 14), done >= 1 ? { role: 'near', material: 'tonal' } : { role: 'context', line: 'regular' }, cites(c, p), r.complete.has(p) ? 'A part that is complete: filled.' : 'A part whose state the text doesn’t give: an outline.'));
        if (done > 0 && done < 1) els.push(path(`${p}-filling`, roundedRect(cx - w / 2, cy + h / 2 - h * done, w, h * done, 6), { role: 'near', material: 'tonal' }, find(c.rep, 'complete').filter((s) => s.say.what === p).map((s) => s.id), 'Becoming complete.'));
      });
      members.forEach((p, k) => {
        const isSource = k < m;
        els.push(shape(isSource ? `${on}-${k + 1}` : `${r.group?.say.whole ?? on}-${k + 1}`, { type: 'circle', cx: r2(p[0]), cy: r2(p[1]), r: 16 }, isSource ? { role: 'subject', material: 'solid' } : { role: 'context', material: 'solid' }, isSource ? cites(c, on) : [r.group!.id], isSource ? 'What it depends on.' : 'The rest of their group.'));
      });
      if (pDep > 0) {
        const from: Pt = [dependentAt[0] + w / 2, dependentAt[1]];
        const to: Pt = [sc[0] - 50, sc[1]];
        els.push(path('depends', polyline([from, [from[0] + (to[0] - from[0]) * pDep, from[1] + (to[1] - from[1]) * pDep]]), { role: 'context', line: 'fine' }, [r.dep.id], 'What depends on what.'));
        if (r.open && pDep >= 1) els.push(path('open', circlePath(sc, 30 + 22 * (m - 1)), { role: 'context', line: 'fine', dash: 'tentative' }, [r.open.id], 'Whether it can be had is open.'));
      }
      const labels: SceneElement[] = t.labelForms
        ? [
            ...r.parts.map((p, k) => label(`${p}-label`, p, [r2(partAt(k)[0]), r2(partAt(k)[1] + 5)], 'middle', cites(c, p), 'Names the part.')),
            ...r.parts.filter((p) => r.placeOf.has(p)).map((p) => label(`${p}-place-label`, r.placeOf.get(p)!.say.place, [r2(partAt(r.parts.indexOf(p))[0]), r2(y + h / 2 + 34)], 'middle', [r.placeOf.get(p)!.id], 'Names where it is.', { tone: 'label-soft' })),
            ...(r.whole ? [label('whole-label', r.whole.say.whole, [r2(x0 - 10), r2(y - h / 2 - 16)], 'start', [r.whole.id], 'Names the whole.', { tone: 'label-soft' })] : []),
            label('source-label', on, [r2(sc[0]), r2(members[members.length - 1][1] + 44)], 'middle', cites(c, on), 'Names what it depends on.'),
            ...(r.group ? [label('group-label', r.group.say.whole, [r2(gx), r2(members[0][1] - 62)], 'middle', [r.group.id], 'Names their group.', { tone: 'label-soft' })] : []),
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

export function dependencySpatial(c: StudyCase, t: SpatialTuning): Figure {
  const r = read(c);
  const { what, on } = r.dep.say;
  const size = 1.4;
  const gap = 0.8;
  const partAt = (k: number): V3 => [k * (size + gap), 0, 0];
  const n = r.group ? countOf(c, r.group.say.whole) : countOf(c, on);
  const m = Math.min(n, countOf(c, on));
  const gx = r.parts.length * (size + gap) + 1.2;
  const members: V3[] = Array.from({ length: n }, (_, k) => [gx + (k % 2) * 0.8, 0, -0.4 + Math.floor(k / 2) * 0.8] as V3);
  const content: V3[] = corners([-1, 0, -1.2], [gx + 1.2, 1.9, 1.2]);
  const rules: Partial<Record<Stance, Key>> = {
    above: framedKey(content, centreOf(content), [0.1, 1.0, -0.5], 640, 0.62, 0.85),
    side: framedKey(content, centreOf(content), [0.2, 0.35, -1], 640, 0.62, 0.85),
    front: framedKey(content, centreOf(content), [0.2, 0.35, -1], 640, 0.62, 0.85),
  };
  const keys = keysFor(c, t, rules);
  const alt = altText(c);
  const edges = (min: V3, max: V3): V3[][] => {
    const [a, b] = [min, max];
    const v = (x: number, y: number, z: number): V3 => [x ? b[0] : a[0], y ? b[1] : a[1], z ? b[2] : a[2]];
    return [
      [v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)],
      [v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1)],
      [v(0, 0, 0), v(0, 1, 0)], [v(1, 0, 0), v(1, 1, 0)], [v(1, 0, 1), v(1, 1, 1)], [v(0, 0, 1), v(0, 1, 1)],
    ];
  };
  return {
    caseId: c.id,
    idiom: 'spatial',
    axes: { space: 'spatial', time: 'still', substance: 'forms', mode: 'direct', viewpoint: 'movable' },
    motion: { kind: 'viewpoint', positions: stances(c) },
    alt,
    coverage: coverage(
      c.rep,
      covered(c, r, {
        dep: 'a line on the ground from the part that depends to what it depends on',
        part: 'the parts stand side by side (C9)',
        complete: 'the complete part is a solid block',
        place: 'each part stands on a patch of ground named for its place',
        group: 'what it depends on stands among its group, which has its own count',
        open: 'an open ring on the ground around what it depends on, in the tentative dash',
      }),
      notCovered(c, r),
    ),
    compose(v: number) {
      const space = new Space(cameraOn(keys, v));
      space.face('ground', [[-1.6, 0, -1.6], [gx + 1.8, 0, -1.6], [gx + 1.8, 0, 1.6], [-1.6, 0, 1.6]], [0, 1, 0], { role: 'far', material: 'shaded', facing: 'lit' }, ['base:ground'], 'A stand-in ground: the text names places, not the ground between.', 0);
      r.parts.forEach((p, k) => {
        const [x] = partAt(k);
        const place = r.placeOf.get(p);
        if (place) space.face(`${p}-place`, [[x - 0.2, 0.004, -0.95], [x + size + 0.2, 0.004, -0.95], [x + size + 0.2, 0.004, 0.95], [x - 0.2, 0.004, 0.95]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [place.id], 'Where this part is.', 0);
        if (r.complete.has(p)) space.box(p, [x, 0, -0.6], [x + size, 0.9, 0.6], 'near', cites(c, p), 'A part that is complete: solid.');
        else edges([x, 0, -0.6], [x + size, 0.9, 0.6]).forEach((e, i) => space.outline(`${p}-${i}`, e, { role: 'context', line: 'regular' }, cites(c, p), 'A part whose state the text doesn’t give: its edges only.', e.length > 2));
      });
      members.forEach((p, k) => {
        const isSource = k < m;
        const id = isSource ? `${on}-${k + 1}` : `${r.group?.say.whole ?? on}-${k + 1}`;
        // Revision 7: what it depends on is drawn as people only if it is a presence; a thing gets its form.
        const kindOf = c.rep.elements.find((e) => e.id === (isSource ? on : r.group?.say.whole))?.kind;
        if (kindOf !== 'presence') solid(space, id, formOf(c, isSource ? on : r.group!.say.whole), p, 0.5, isSource ? cites(c, on) : [r.group!.id], isSource ? 'What it depends on.' : 'The rest of its group.');
        else if (space.person(id, POSES.standing, p, Math.PI, isSource ? 'subject' : 'context', isSource ? cites(c, on) : [r.group!.id], isSource ? 'What it depends on.' : 'The rest of their group.'))
          space.shadow(`${id}-shadow`, id, p[0], p[2], 0.3, 0.24, isSource ? cites(c, on) : [r.group!.id], 'Grounds them.');
      });
      const di = r.parts.indexOf(what);
      const sx = members.slice(0, m).reduce((s, p) => s + p[0], 0) / m;
      const sz = members.slice(0, m).reduce((s, p) => s + p[2], 0) / m;
      space.outline('depends', [[partAt(di)[0] + size, 0.01, 0], [sx - 0.5, 0.01, sz]], { role: 'context', line: 'fine' }, [r.dep.id], 'What depends on what.', false);
      if (r.open) space.outline('open', Array.from({ length: 24 }, (_, i) => [sx + Math.cos((i / 24) * Math.PI * 2) * (0.45 + 0.3 * (m - 1)), 0.012, sz + Math.sin((i / 24) * Math.PI * 2) * 0.55] as V3), { role: 'context', line: 'fine', dash: 'tentative' }, [r.open.id], 'Whether they can be had is open.');
      const labels: SceneElement[] = [];
      if (t.labels) {
        const put = (id: string, key: string, p: V3, cs: string[], why: string, tone?: 'label-soft') => {
          const a = space.anchor(p, 0);
          if (a) labels.push(label(id, key, a, 'middle', cs, why, { halo: true, ...(tone ? { tone } : {}) }));
        };
        r.parts.forEach((p, k) => put(`${p}-label`, p, [partAt(k)[0] + size / 2, 1.15, 0], cites(c, p), 'Names the part.'));
        r.parts.forEach((p, k) => r.placeOf.has(p) && put(`${p}-place-label`, r.placeOf.get(p)!.say.place, [partAt(k)[0] + size / 2, 0, -1.1], [r.placeOf.get(p)!.id], 'Names where it is.', 'label-soft'));
        put('source-label', on, [sx, 2.05, sz], cites(c, on), 'Names what it depends on.');
      }
      if (t.add3) labels.push(...t.add3(space, { ...Object.fromEntries(r.parts.map((p, k) => [p, [partAt(k)[0] + size / 2, 0, 0] as V3])), [on]: [sx, 0, sz], ...(r.group ? { [r.group.say.whole]: [gx + 0.4, 0, 0] as V3 } : {}) }));
      return composed(c, 'spatial', [
        { id: 'space', plane: 'subject', elements: space.elements() },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

export function dependencyField(c: StudyCase, t: FieldTuning): Figure {
  const r = read(c);
  const { what, on } = r.dep.say;
  const alt = altText(c);
  const y = CY;
  const x0 = SAFE + 80;
  const span = 200;
  const partX = (k: number) => x0 + k * (span + 60);
  const di = r.parts.indexOf(what);
  const boundary = FRAME.width - SAFE - 190;
  const sourceAt: Pt = [FRAME.width - SAFE - 90, y];
  const lanes = 9;
  const laneGap = 7;
  return {
    caseId: c.id,
    idiom: 'field',
    axes: { space: 'flat', time: 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      covered(c, r, {
        dep: `${lanes} lanes run from the part that depends towards what it depends on`,
        part: 'the parts are bundles side by side (C9)',
        complete: 'the complete part is a closed, settled bundle',
        place: 'a field doesn’t place things: shown only by the parts’ names',
        group: 'what it depends on is a mark among its group’s marks',
        open: 'the lanes stop at an unresolved boundary, in the tentative dash, before what they depend on',
      }),
      notCovered(c, r),
    ),
    compose() {
      const els: SceneElement[] = [];
      r.parts.forEach((p, k) => {
        if (k === di) return;
        const x = partX(k);
        const settled = Array.from({ length: lanes }, (_, i) => polyline([[x, y - 30 + i * laneGap], [x + span, y - 30 + i * laneGap]])).join('');
        els.push(path(p, settled, r.complete.has(p) ? { role: 'subject', line: 'hair' } : { role: 'context', line: 'hair' }, cites(c, p), r.complete.has(p) ? 'A part that is complete: a settled bundle.' : 'A part.'));
      });
      const dx = partX(di);
      const reach = r.open ? boundary : sourceAt[0] - 30;
      els.push(path(what, Array.from({ length: lanes }, (_, i) => polyline([[dx, y - 30 + i * laneGap], [reach, y - 8 + i * laneGap * 0.4]])).join(''), { role: 'subject', line: 'hair' }, [...cites(c, what)], 'The part that depends, running towards what it depends on.'));
      if (r.open) els.push(shape('open', { type: 'line', x1: boundary + 8, y1: y - 60, x2: boundary + 8, y2: y + 60 }, { role: 'context', line: 'fine', dash: 'tentative' }, [r.open.id], 'Whether what it depends on can be had is open: the field is unresolved here.'));
      const n = r.group ? countOf(c, r.group.say.whole) : countOf(c, on);
      const m = Math.min(n, countOf(c, on));
      for (let k = 0; k < n; k++) {
        const p: Pt = [sourceAt[0] + (k % 2) * 26 - 13, y - 26 + Math.floor(k / 2) * 26];
        els.push(shape(k < m ? `${on}-${k + 1}` : `${r.group?.say.whole ?? on}-${k + 1}`, { type: 'circle', cx: r2(p[0]), cy: r2(p[1]), r: 5 }, k < m ? { role: 'subject', material: 'solid' } : { role: 'context', material: 'solid' }, k < m ? cites(c, on) : [r.group!.id], k < m ? 'What it depends on.' : 'The rest of their group.'));
      }
      const labels: SceneElement[] = t.labels
        ? [
            ...r.parts.map((p, k) => label(`${p}-label`, p, [r2(partX(k) + span / 2), r2(y - 50)], 'middle', cites(c, p), 'Names the part.')),
            label('source-label', on, [r2(sourceAt[0]), r2(y + 52)], 'middle', cites(c, on), 'Names what it depends on.'),
            ...(r.whole ? [label('whole-label', r.whole.say.whole, [r2(x0), r2(y - 80)], 'start', [r.whole.id], 'Names the whole.', { tone: 'label-soft' })] : []),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}
