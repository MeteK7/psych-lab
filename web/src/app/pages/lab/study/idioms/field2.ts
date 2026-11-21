import type { SceneElement } from '../../../../shared/visual/composition/scene';
import { poissonDisc } from '../../../../shared/visual/generation/distributions';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { streamline } from '../kit/field';
import { Pt, Track, ease, polyline, smooth } from '../kit/paths';
import { FRAME } from '../kit/spatial';
import { Statement, find } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';
import { AREA, FieldTuning, offsetLine } from './field';
import { breakMark, countOf } from './kinetic2';

/**
 * STUDY CODE: the field idiom's slice-2 patterns (docs/visual-study/idioms.md): W, T, G, C, D, L.
 * Flat, field, metaphorical; moving where the field facet says it evolves.
 */
const CX = FRAME.width / 2;
const CY = FRAME.height / 2;

const question = (c: StudyCase, asks: string, about?: string): Statement | undefined =>
  c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === asks && (about === undefined || s.say.about === about));

/** F4: `n` headings of equal strength around a point, each a sector of outward lines with a common turn. */
function headings(centre: Pt, n: number, t: FieldTuning, clear: (p: Pt) => boolean = () => true, reach = t.reach): Pt[][][] {
  return Array.from({ length: n }, (_, k) => {
    const mid = -Math.PI / 2 + ((k + 0.5) / n) * Math.PI * 2;
    const width = (Math.PI * 2) / n;
    const lines: Pt[][] = [];
    for (let j = 0; j < t.perHeading; j++) {
      const a = mid - width * 0.32 + (width * 0.64 * j) / Math.max(1, t.perHeading - 1);
      const start: Pt = [centre[0] + Math.cos(a) * t.headingStart * 0.6, centre[1] + Math.sin(a) * t.headingStart * 0.6];
      const vec = (p: Pt) => {
        if (Math.hypot(p[0] - centre[0], p[1] - centre[1]) > reach) return null;
        const th = Math.atan2(p[1] - centre[1], p[0] - centre[0]) + t.turn;
        return [Math.cos(th), Math.sin(th)] as const;
      };
      const pts = streamline(start, vec, AREA, 4, reach).filter(clear);
      if (pts.length > 3) lines.push(pts);
    }
    return lines;
  });
}

function headingElements(lines: Pt[][][], open: number, set: Statement | undefined, also: readonly string[]): SceneElement[] {
  if (open <= 0.002) return [];
  return lines.flatMap((ls, k) =>
    ls.length ? [path(`heading-${k + 1}`, ls.map((l) => polyline(l.slice(0, Math.max(2, Math.round(l.length * open))))).join(''), { role: 'context', line: 'hair', dash: 'tentative' }, [...(set ? [set.id] : []), ...also], 'One possible heading: as many lines and as long as every other, unresolved.')] : [],
  );
}

const bundleOf = (id: string, track: Track, u: number, n: number, gap: number, style: { role: 'subject' | 'context'; line: 'fine' | 'hair' }, cites: readonly string[], why: string): SceneElement =>
  path(id, Array.from({ length: n }, (_, i) => polyline(offsetLine(track, (i - (n - 1) / 2) * gap, 0, Math.max(0.002, u)))).join(''), style, cites, why);

const dot = (id: string, at: Pt, r: number, role: 'subject' | 'context', cites: readonly string[], why: string) =>
  shape(id, { type: 'circle', cx: r2(at[0]), cy: r2(at[1]), r }, { role, material: 'solid' }, cites, why);

const progress = (duration: number, at: number, from: number, to: number) => (duration ? ease.move(Math.min(1, Math.max(0, (at * duration - from * duration) / ((to - from) * duration)))) : 1);

const timed = (c: StudyCase, t: FieldTuning) => (c.rep.facets.field?.evolves ? t.evolveMs : 0);

const axes = (moving: boolean) => ({ space: 'flat', time: moving ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' }) as const;

/** W with possibilities: the sent way a coherent bundle; around the receiver, the field stays unresolved. */
export function openWait(c: StudyCase, t: FieldTuning): Figure {
  const send = find(c.rep, 'sends')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const wait = find(c.rep, 'waiting')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const fromAt: Pt = [SAFE + 120, CY + 60];
  const toAt: Pt = [FRAME.width - SAFE - 230, CY - 20];
  const way = new Track(smooth([fromAt, [CX - 60, CY - 70], toAt], false, 40));
  const n = set && set.say.p === 'alternatives' ? set.say.options.length : 0;
  const lines = headings(toAt, n, t, (p) => !way.points.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 14), 160);
  const duration = timed(c, t);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: ['sent', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [send.id]: 'a coherent bundle from you to the friend',
        [wait.id]: 'around the friend the field stays unresolved',
        ...Object.fromEntries(qs.map((q) => [q.id, 'the unresolved field around the receiver'])),
        ...(set ? { [set.id]: `${n} headings of equal strength around the receiver` } : {}),
      },
      { [absent.id]: 'an exchange that didn’t happen has no form in a field: no way comes back' },
    ),
    compose(at: number) {
      const sent = progress(duration, at, 0, 0.45);
      const open = progress(duration, at, 0.45, 1);
      const els: SceneElement[] = [
        ...headingElements(lines, open, set, qs.map((q) => q.id)),
        bundleOf('sent', way, sent, t.bundle, t.bundleGap, { role: 'subject', line: 'fine' }, [send.id], 'What you sent: a coherent way, because it is reported.'),
        dot(send.say.from, fromAt, 6, 'subject', [send.id], 'You.'),
        dot(send.say.to, toAt, 6, 'context', [send.id, ...qs.map((q) => q.id)], 'The friend: a plain mark; what they have seen is open.'),
      ];
      const labels = t.labels
        ? [label('from-label', send.say.from, [fromAt[0], fromAt[1] + 26], 'middle', [send.id], 'Names you.', { halo: true }), label('to-label', send.say.to, [toAt[0], toAt[1] + 28], 'middle', [send.id], 'Names the friend.', { halo: true, tone: 'label-soft' })]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}

/** W without possibilities: lanes of what waits run up to an open boundary where the awaited thing would come, and hold. */
export function heldWait(c: StudyCase, t: FieldTuning): Figure {
  const dep = find(c.rep, 'depends-on')[0];
  const send = find(c.rep, 'sends')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const wait = find(c.rep, 'waiting')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const boundary = CX + 30;
  const lanes = 11;
  const fromX = SAFE + 30;
  const tracks = Array.from({ length: lanes }, (_, i) => {
    const y0 = CY - 40 + ((i - (lanes - 1) / 2) * 200) / (lanes - 1);
    const y1 = CY - 40 + (y0 - (CY - 40)) * 0.5;
    const stop = boundary - 10 - Math.abs(i - (lanes - 1) / 2) * 3;
    return new Track(Array.from({ length: 41 }, (_, k) => [fromX + ((stop - fromX) * k) / 40, y0 + (y1 - y0) * ease.move(k / 40)] as Pt));
  });
  const supplierAt: Pt = [FRAME.width - SAFE - 90, CY - 40];
  const mail = new Track(smooth([[fromX + 40, CY + 120], [CX + 120, CY + 160], [supplierAt[0] - 10, supplierAt[1] + 14]], false, 30));
  const duration = timed(c, t);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: ['flowing', 'held'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [dep.id]: 'the lanes of what depends on it run up to an open boundary',
        [wait.id]: 'the lanes close in at the boundary and hold',
        [send.id]: 'one fine way from the team to the supplier (the two emails are one way: counts are lost, G-02)',
        ...Object.fromEntries(qs.map((q) => [q.id, 'the boundary is drawn only in the tentative dash: nothing shows why or when'])),
      },
      { [absent.id]: 'an exchange that didn’t happen has no form in a field' },
    ),
    compose(at: number) {
      const d = tracks
        .map((tr, i) => {
          const startAt = (i % 4) * 0.12 + (i % 3) * 0.05;
          const u = duration ? ease.move(Math.min(1, Math.max(0, (at - startAt) / 0.62))) : 1;
          return u > 0.01 ? polyline(tr.slice(0, u)) : '';
        })
        .join('');
      const els: SceneElement[] = [];
      if (d) els.push(path('lanes', d, { role: 'subject', line: 'hair' }, [dep.id, wait.id], 'What depends on the confirmation, closing in where it waits.'));
      els.push(shape('boundary', { type: 'line', x1: boundary, y1: CY - 120, x2: boundary, y2: CY + 40 }, { role: 'context', line: 'fine', dash: 'tentative' }, [wait.id, ...qs.map((q) => q.id)], 'Where the confirmation would come: open, so only in the tentative dash.'));
      els.push(path('mail', polyline(mail.slice(0, progress(duration, at, 0, 0.5))), { role: 'context', line: 'hair' }, [send.id], 'The emails sent: one fine way to the supplier.'));
      els.push(dot(send.say.to, supplierAt, 6, 'context', [send.id, ...qs.map((q) => q.id)], 'The supplier: a plain mark.'));
      const labels = t.labels
        ? [
            label('dep-label', dep.say.what, [fromX + 4, CY - 160], 'start', [dep.id], 'Names what waits.'),
            label('to-label', send.say.to, [supplierAt[0], supplierAt[1] + 28], 'middle', [send.id], 'Names the supplier.', { tone: 'label-soft' }),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}

/** T: parallel lanes are time; the item is a knot in them that has moved later, drawn only tentatively; the empty place opens into the possibilities. */
export function shiftedField(c: StudyCase, t: FieldTuning): Figure {
  const s1 = find(c.rep, 'shifts')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const set = find(c.rep, 'alternatives')[0];
  const q = question(c, 'cause');
  const slot: Pt = [SAFE + 250, CY];
  const later: Pt = [FRAME.width - SAFE - 220, CY];
  const lanes = 9;
  const n = set && set.say.p === 'alternatives' ? set.say.options.length : 0;
  const lines = headings(slot, n, t, (p) => Math.abs(p[1] - CY) > 64, 150);
  const duration = timed(c, t);
  const alt = altText(c);
  // Each lane bends round the knot where the item is now.
  const lane = (i: number): Pt[] => {
    const y0 = CY + (i - (lanes - 1) / 2) * 16;
    return Array.from({ length: 81 }, (_, k) => {
      const x = SAFE + 10 + ((FRAME.width - 2 * SAFE - 20) * k) / 80;
      const d = Math.exp(-(((x - later[0]) / 60) ** 2));
      return [x, CY + (y0 - CY) * (1 + 0.9 * d)] as Pt;
    });
  };
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: ['time', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'the lanes of time bend round where the item is now, further along; the item there is only an outline, because how much later is not said',
        ...(q ? { [q.id]: 'the empty place, where the field stays unresolved' } : {}),
        ...(set ? { [set.id]: `${n} headings of equal strength from the empty place` } : {}),
      },
      { [absent.id]: 'an exchange that didn’t happen has no form in a field' },
    ),
    compose(at: number) {
      const shown = progress(duration, at, 0, 0.5);
      const open = progress(duration, at, 0.5, 1);
      const d = Array.from({ length: lanes }, (_, i) => {
        const pts = lane(i);
        return polyline(pts.slice(0, Math.max(2, Math.round(pts.length * shown))));
      }).join('');
      const els: SceneElement[] = [
        path('time', d, { role: 'context', line: 'hair' }, [s1.id], 'Time, as parallel lanes running left to right.'),
        ...headingElements(lines, open, set, q ? [q.id] : []),
        shape('slot', { type: 'ellipse', cx: slot[0], cy: slot[1], rx: 46, ry: 30 }, { role: 'ground', material: 'tonal' }, [s1.id], 'Where it was: a clear place in the lanes.'),
        shape('slot-edge', { type: 'ellipse', cx: slot[0], cy: slot[1], rx: 46, ry: 30 }, { role: 'context', line: 'hair' }, [s1.id], 'Its edge: it was there.'),
      ];
      if (shown >= 1 && t.unscaled === 'range') els.push(shape(s1.say.what, { type: 'ellipse', cx: r2((slot[0] + 80 + FRAME.width - SAFE - 30) / 2), cy: later[1], rx: r2((FRAME.width - SAFE - 30 - slot[0] - 80) / 2), ry: 20 }, { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'Somewhere later: an open range (R4-4 b).'));
      else if (shown >= 1) els.push(shape(s1.say.what, { type: 'ellipse', cx: later[0], cy: later[1], rx: 40, ry: 20 }, { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'Where it is now: an outline, because how much later is not said.'));
      if (t.unscaled === 'break') els.push(...breakMark('break', (slot[0] + later[0]) / 2, CY, [s1.id], 150));
      const labels = t.labels
        ? [
            label('item-label', s1.say.what, [later[0], later[1] + 62], 'middle', [s1.id], 'Names what moved.', { halo: true }),
            ...(t.unscaled === 'labelled' ? [label('unscaled-label', 'unscaled', [r2((slot[0] + later[0]) / 2), CY + 96], 'middle', [s1.id], 'Says the distance is not to scale (R4-4 a).', { tone: 'label-soft' })] : []),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt, { unscaled: 'not to scale' });
    },
  };
}

/** G: ripples spread once from each who speaks; small ripples round the few who react. */
export function ripples(c: StudyCase, t: FieldTuning): Figure {
  const at0 = find(c.rep, 'located-in')[0];
  const sends = find(c.rep, 'sends');
  const reacts = find(c.rep, 'reacts')[0];
  const own = c.rep.elements.find((e) => e.own)!.id;
  const group = reacts.say.who;
  const n = countOf(c, group);
  const others = [...new Set(sends.map((s) => s.say.from))].filter((x) => x !== own);
  const ownAt: Pt = [CX - 240, CY + 30];
  const otherAt: Pt[] = others.map((_, k) => [CX - 40, CY - 120 + k * 40] as Pt);
  const groupAt: Pt[] = Array.from({ length: n }, (_, k) => [CX + 90 + (k % 2) * 120, CY - 50 + Math.floor(k / 2) * 110] as Pt);
  const few = [1, 2].filter((k) => k < n);
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const duration = timed(c, t);
  const alt = altText(c);
  const rings = (id: string, centre: Pt, u: number, count: number, reach: number, cites: readonly string[], why: string, role: 'subject' | 'context') =>
    u > 0.01 ? [path(id, Array.from({ length: count }, (_, k) => { const r = 10 + (reach * (k + 1) * u) / count; return `M${r2(centre[0] - r)} ${r2(centre[1])}A${r2(r)} ${r2(r)} 0 1 0 ${r2(centre[0] + r)} ${r2(centre[1])}A${r2(r)} ${r2(r)} 0 1 0 ${r2(centre[0] - r)} ${r2(centre[1])}Z`; }).join(''), { role, line: 'hair' }, cites, why)] : [];
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: [...sends.map((_, k) => `said ${k + 1}`), 'reaction'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(sends.map((s) => [s.id, 'ripples spread once from the one who speaks'])),
        [reacts.id]: `small ripples round ${few.length} of the group, each centred on itself`,
        ...Object.fromEntries(qs.map((q) => [q.id, 'everyone is a plain mark; no ripple points at anyone'])),
      },
      { [at0.id]: 'a field doesn’t show places: the room has no form' },
    ),
    compose(at: number) {
      const steps = sends.length + 1;
      const els: SceneElement[] = [];
      sends.forEach((s, k) => {
        if (s.say.p !== 'sends') return;
        const centre = s.say.from === own ? ownAt : otherAt[others.indexOf(s.say.from)];
        els.push(...rings(`said-${k + 1}`, centre, progress(duration, at, k / steps, (k + 1) / steps), 4, 150, [s.id], 'What was said, spreading once.', s.say.from === own ? 'subject' : 'context'));
      });
      const r = progress(duration, at, sends.length / steps, 1);
      few.forEach((k) => els.push(...rings(`reaction-${k + 1}`, groupAt[k], r, 2, 26, [reacts.id], 'A reaction: small ripples round this one only.', 'context')));
      groupAt.forEach((p, k) => els.push(dot(`${group}-${k + 1}`, p, 5, 'context', [reacts.id, ...qs.map((q) => q.id)], 'One of the group: a plain mark.')));
      others.forEach((o, k) => els.push(dot(o, otherAt[k], 5, 'context', [...sends.filter((s) => s.say.p === 'sends' && s.say.from === o).map((s) => s.id), ...qs.map((q) => q.id)], 'The one who made the remark: a plain mark.')));
      els.push(dot(own, ownAt, 6, 'subject', sends.filter((s) => s.say.p === 'sends' && s.say.from === own).map((s) => s.id), 'You.'));
      const labels = t.labels ? [label('own-label', own, [ownAt[0], ownAt[1] + 28], 'middle', [sends[0].id], 'Names you.', { halo: true })] : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}

/** C: a still density of dots, the crowd; your mark and the other's touching, a short coherent streak for how you were moved. */
export function crowdField(c: StudyCase, t: FieldTuning): Figure {
  const places = find(c.rep, 'located-in');
  const s2 = find(c.rep, 'displaced')[0];
  const s3 = find(c.rep, 'contact')[0];
  const s4 = find(c.rep, 'sends')[0];
  const s5 = find(c.rep, 'exchange-absent')[0];
  const qs = c.rep.statements.filter((s) => s.say.p === 'question');
  const own = s3.say.a;
  const otherAt: Pt = [CX + 20, CY];
  const ownAt: Pt = [CX - 12, CY];
  const dots = poissonDisc({ x: SAFE + 20, y: CY - 150, width: FRAME.width - 2 * SAFE - 40, height: 300, spacing: 22, max: 900 }, `study-${c.id}-field`).filter(([x, y]) => Math.hypot(x - CX, y - CY) > 46);
  const d = dots.map(([x, y]) => `M${r2(x - 2.2)} ${r2(y)}A2.2 2.2 0 1 0 ${r2(x + 2.2)} ${r2(y)}A2.2 2.2 0 1 0 ${r2(x - 2.2)} ${r2(y)}Z`).join('');
  const alt = altText(c, (id) => id !== s4.id && id !== s5.id);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(false),
    motion: { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(places.map((p) => [p.id, 'a still density of dots: the crowd, everyone in one place'])),
        [s2.id]: 'a short coherent streak: how far you were carried',
        [s3.id]: 'your mark touches the other’s',
        ...Object.fromEntries(qs.map((q) => [q.id, 'every dot is plain and still'])),
      },
      { [s4.id]: 'a field carries qualities, not exchanges: the apology has no form', [s5.id]: 'as the apology' },
    ),
    compose() {
      const els: SceneElement[] = [
        path('crowd', d, { role: 'context', material: 'solid' }, places.map((p) => p.id), 'The others: a still density, the crowd.'),
        path('displaced', polyline([[ownAt[0] - 80, CY], ownAt]), { role: 'subject', line: 'fine' }, [s2.id], 'How far the braking carried you.'),
        dot(s3.say.b, otherAt, 8, 'context', [s3.id, ...qs.map((q) => q.id)], 'The other person: a plain mark.'),
        dot(own, ownAt, 8, 'subject', [s2.id, s3.id], 'You, touching them.'),
      ];
      const labels = t.labels ? [label('own-label', own, [ownAt[0] - 10, CY + 34], 'middle', [s2.id], 'Names you.', { halo: true })] : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt);
    },
  };
}

/** D: two vertical bundles of unequal height; the difference opens into the possibilities. */
export function grownField(c: StudyCase, t: FieldTuning): Figure {
  const s1 = find(c.rep, 'exceeds')[0];
  const set = find(c.rep, 'alternatives')[0];
  const q = question(c, 'cause');
  const base = CY + 160;
  const tall = 260;
  const short = tall / (4 / 3);
  const [ax, bx] = [CX - 110, CX + 110];
  const n = set && set.say.p === 'alternatives' ? set.say.options.length : 0;
  const gapAt: Pt = [CX, base - (tall + short) / 2];
  const lines = headings(gapAt, n, t, (p) => Math.abs(p[0] - ax) > 18 && Math.abs(p[0] - bx) > 18, 120);
  const duration = timed(c, t);
  const alt = altText(c);
  const column = (id: string, x: number, h: number, u: number) =>
    path(id, [-6, 0, 6].map((dx) => polyline([[x + dx, base], [x + dx * 0.6, base - h * u]])).join(''), { role: 'context', line: 'fine' }, [s1.id], 'How tall it grew: a coherent bundle, because it is reported.');
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: ['grown', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'two bundles, the one by the window a third taller (the amount is a rule constant)',
        ...(q ? { [q.id]: 'the difference, where the field stays unresolved' } : {}),
        ...(set ? { [set.id]: `${n} headings of equal strength from the difference` } : {}),
      },
      {},
    ),
    compose(at: number) {
      const grown = progress(duration, at, 0, 0.5);
      const open = progress(duration, at, 0.5, 1);
      const ranged = t.unscaled === 'range' && grown >= 1;
      const els = [ranged ? column(s1.say.a, ax, short + 6, 1) : column(s1.say.a, ax, tall, grown), column(s1.say.b, bx, short, grown), ...headingElements(lines, open, set, q ? [q.id] : [])];
      if (ranged) els.push(path(`${s1.say.a}-more`, [-6, 0, 6].map((dx) => polyline([[ax + dx * 0.62, base - short - 6], [ax + dx * 0.6, base - tall]])).join(''), { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'How much taller is not said: open (R4-4 b).'));
      if (t.unscaled === 'break') els.push(...breakMark('break', ax, base - short / 2, [s1.id], 22));
      const labels = t.labels
        ? [
            label('a-label', s1.say.a, [ax, base + 28], 'middle', [s1.id], 'Names it.', { names: [s1.say.a] }),
            label('b-label', s1.say.b, [bx, base + 28], 'middle', [s1.id], 'Names it.', { names: [s1.say.b] }),
            ...(t.unscaled === 'labelled' ? [label('unscaled-label', 'unscaled', [CX, base + 56], 'middle', [s1.id], 'Says the heights are not to scale (R4-4 a).', { tone: 'label-soft' })] : []),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt, { unscaled: 'heights not to scale' });
    },
  };
}

/** L: lanes reach short of the planned line; the shortfall opens into the possibilities. */
export function lateField(c: StudyCase, t: FieldTuning): Figure {
  const s1 = find(c.rep, 'behind')[0];
  const set = find(c.rep, 'alternatives')[0];
  const q = question(c, 'cause');
  const planned = FRAME.width - SAFE - 180;
  const reached = planned - 150;
  const lanes = 9;
  const n = set && set.say.p === 'alternatives' ? set.say.options.length : 0;
  const gapAt: Pt = [(reached + planned) / 2, CY];
  const lines = headings(gapAt, n, t, (p) => p[0] > reached + 6, 110);
  const duration = timed(c, t);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: axes(!!duration),
    motion: duration ? { kind: 'timeline', duration, steps: ['under way', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'the lanes stop short of the planned line; the shortfall is named in words (its width is a rule constant)',
        ...(q ? { [q.id]: 'the shortfall, where the field stays unresolved' } : {}),
        ...(set ? { [set.id]: `${n} headings of equal strength in the shortfall` } : {}),
      },
      {},
    ),
    compose(at: number) {
      const go = progress(duration, at, 0, 0.5);
      const open = progress(duration, at, 0.5, 1);
      const d = Array.from({ length: lanes }, (_, i) => {
        const y = CY + (i - (lanes - 1) / 2) * 14;
        return polyline([[SAFE + 30, y], [SAFE + 30 + (reached - SAFE - 30) * go, y]]);
      }).join('');
      const els: SceneElement[] = [
        path('lanes', d, { role: 'subject', line: 'hair' }, [s1.id], 'The work, as far as it has got: coherent, because it is reported.'),
        ...(t.unscaled === 'range' && go >= 1 ? [path('shortfall', `M${r2(reached + 6)} ${CY - 66}H${r2(planned - 6)}V${CY + 66}H${r2(reached + 6)}Z`, { role: 'context', line: 'hair', dash: 'tentative' }, [s1.id], 'The shortfall as an extent, not a measured length (R4-4 b).')] : []),
        ...(t.unscaled === 'break' ? breakMark('break', (reached + planned) / 2, CY, [s1.id], 140) : []),
        shape('plan', { type: 'line', x1: planned, y1: CY - 90, x2: planned, y2: CY + 90 }, { role: 'context', line: 'fine' }, [s1.id], 'Where the plan said it would be now.'),
        ...headingElements(lines, open, set, q ? [q.id] : []),
      ];
      const labels = t.labels
        ? [
            label('item-label', s1.say.what, [SAFE + 30, CY - 84], 'start', [s1.id], 'Names it.'),
            label('amount-label', t.unscaled === 'labelled' ? 'amount-unscaled' : 'amount', [r2(gapAt[0]), CY + 116], 'middle', [s1.id], 'Names the shortfall.', { tone: 'label-soft' }),
            label('plan-label', 'plan', [planned + 8, CY - 76], 'start', [s1.id], 'Names the plan.', { tone: 'label-soft', names: ['plan'] }),
          ]
        : [];
      return composed(c, 'field', [{ id: 'field', plane: 'subject', elements: els }, { id: 'labels', plane: 'annotation', elements: labels }], alt, { amount: s1.say.amount, 'amount-unscaled': `${s1.say.amount}, not to scale`, plan: 'Plan' });
    },
  };
}

