import type { Layer, SceneElement } from '../../../../shared/visual/composition/scene';
import { poissonDisc } from '../../../../shared/visual/generation/distributions';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { Pt, Track, ease, polyline, smooth } from '../kit/paths';
import { FRAME } from '../kit/spatial';
import { Statement, find } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';
import { CX, CY, KineticTuning, contact, presence, roundedRect, trace } from './kinetic';

/**
 * STUDY CODE: the kinetic idiom's slice-2 patterns (docs/visual-study/idioms.md, "Slice-2
 * patterns"): W waiting on a reply, T a move in time, G a group reacts, C contact in a crowd,
 * D one exceeds another, L behind plan. Flat, moving, forms, direct, a fixed viewpoint.
 */
const AXES = { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' } as const;

/** Plural presences: `several` is four forms, `many` twelve (slice-2 common rule). */
export function countOf(c: StudyCase, id: string): number {
  const n = c.rep.elements.find((e) => e.id === id)?.count;
  return n === undefined ? 1 : n === 'several' ? 4 : n === 'many' ? 12 : n;
}

const question = (c: StudyCase, asks: string, about?: string): Statement | undefined =>
  c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === asks && (about === undefined || s.say.about === about));

/** K8: a possibility set as equal translucent marks on a ring, grown in after the movement. */
function ring(set: Statement | undefined, centre: Pt, radius: number, mark: number, g: number, also: readonly string[]): SceneElement[] {
  if (!set || set.say.p !== 'alternatives' || g <= 0) return [];
  const n = set.say.options.length;
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
    return shape(`possible-${k + 1}`, { type: 'circle', cx: r2(centre[0] + Math.cos(a) * radius), cy: r2(centre[1] + Math.sin(a) * radius), r: r2(mark * ease.arrive(g)) }, { role: 'context', material: 'translucent', line: 'hair' }, [set.id, ...also], 'One of the possible explanations: equal in size, weight and distance to every other, none chosen.');
  });
}

/** A presence that may be plural: one form, or a small cluster of equal forms. */
function presences(c: StudyCase, id: string, at: Pt, r: number, cites: readonly string[], why: string, shadows: boolean): SceneElement[] {
  const n = countOf(c, id);
  const own = !!c.rep.elements.find((e) => e.id === id)?.own;
  if (n === 1) return [...(shadows ? [contact(id, at, r, id)] : []), ...presence(id, at, r, own, cites, why)];
  const small = r * 0.62;
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + 0.4;
    const p: Pt = [at[0] + Math.cos(a) * small * 1.9, at[1] + Math.sin(a) * small * 1.3];
    return [...(shadows ? [contact(`${id}-${k + 1}`, p, small, `${id}-${k + 1}`)] : []), ...presence(`${id}-${k + 1}`, p, small, own, cites, why)];
  }).flat();
}

/**
 * R4-4 (c): a break in a line, where an amount isn't to scale: a short gap in the ground colour across
 * the line, with two slanted strokes. Under evaluation: a break may read as interruption.
 */
/** R4-4 range: a band from `from` toward `to`, its near end rounded and its far end left open. */
export function openRange(from: number, to: number, top: number, bottom: number, r: number): string {
  const d = Math.sign(to - from) || 1;
  const sweep = d > 0 ? 0 : 1;
  return `M${r2(to)} ${r2(top)}H${r2(from + d * r)}A${r} ${r} 0 0 ${sweep} ${r2(from)} ${r2(top + r)}V${r2(bottom - r)}A${r} ${r} 0 0 ${sweep} ${r2(from + d * r)} ${r2(bottom)}H${r2(to)}`;
}

export function breakMark(id: string, x: number, y: number, cites: readonly string[], height = 26): SceneElement[] {
  const h = height / 2;
  return [
    path(`${id}-gap`, `M${r2(x - 9)} ${r2(y + h)}L${r2(x - 1)} ${r2(y - h)}L${r2(x + 9)} ${r2(y - h)}L${r2(x + 1)} ${r2(y + h)}Z`, { role: 'ground', material: 'tonal' }, cites, 'A break: this length is not to scale (R4-4 c, under evaluation).'),
    path(`${id}-strokes`, `M${r2(x - 9)} ${r2(y + h)}L${r2(x - 1)} ${r2(y - h)}M${r2(x + 1)} ${r2(y + h)}L${r2(x + 9)} ${r2(y - h)}`, { role: 'context', line: 'hair' }, cites, 'The two strokes of the break.'),
  ];
}

const layers = (elements: SceneElement[], labels: SceneElement[], below: SceneElement[] = []): Layer[] => [
  { id: 'planes', plane: 'mid', elements: below },
  { id: 'forms', plane: 'subject', elements },
  { id: 'labels', plane: 'annotation', elements: labels },
];

/** W: the item crosses; the return way is only begun, tentatively, and stops short; the possibilities gather on it. */
export function awaiting(c: StudyCase, t: KineticTuning): Figure {
  const send = find(c.rep, 'sends')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const wait = find(c.rep, 'waiting')[0];
  const dep = find(c.rep, 'depends-on')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qTime = question(c, 'time');
  const qCause = question(c, 'cause');
  const qAttention = question(c, 'attention');
  const [from, to] = [send.say.from, send.say.to];
  const fromAt: Pt = [SAFE + 170, CY + 50];
  const toAt: Pt = [FRAME.width - SAFE - 170, CY + 50];
  const out = new Track(smooth([fromAt, [CX, CY - 110], toAt], false, 40));
  const back = new Track(smooth([toAt, [CX, CY + 170], fromAt], false, 40));
  const stop = 0.42;
  const awaited = back.at(stop);
  const duration = 3 * t.stepMs + (set ? 700 : 0);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['sent', 'waiting', ...(set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [send.id]: 'a mark crosses from sender to receiver on a high arc',
        [absent.id]: 'the way back is only begun, in the tentative dash, and nothing travels on it',
        [wait.id]: 'the way back stops short and holds',
        ...(dep ? { [dep.id]: 'the launch: an outline beside the team, not started' } : {}),
        ...(qTime ? { [qTime.id]: 'the way back stops short: when, if ever, is open' } : {}),
        ...(qCause ? { [qCause.id]: 'the point where the way back stops, where the possibilities gather' } : {}),
        ...(qAttention ? { [qAttention.id]: 'the receiver is round, with no facing' } : {}),
        ...(set ? { [set.id]: 'equal translucent marks on a ring where the way back stops' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const sent = ease.move(Math.min(1, ms / t.stepMs));
      const waiting = ease.move(Math.min(1, Math.max(0, (ms - t.stepMs) / (2 * t.stepMs))));
      const g = set ? Math.min(1, Math.max(0, (ms - 3 * t.stepMs) / 700)) : 0;
      const els: SceneElement[] = [];
      els.push(...trace('out-trace', out, sent, false, [send.id], 'The way the item went.'));
      if (waiting > 0.002) els.push(path('way-back', polyline(back.slice(0, stop * waiting)), { role: 'context', line: 'hair', dash: 'tentative' }, [absent.id, wait.id, ...(qTime ? [qTime.id] : [])], 'The way back: only begun, and open, because nothing has come back.'));
      els.push(...ring(set, awaited, t.ringRadius * 0.6, t.ringMark * 0.8, g, qCause ? [qCause.id] : []));
      if (dep) els.push(path('dependent', roundedRect(fromAt[0] - 55, fromAt[1] + 70, 110, 54, 14), { role: 'context', line: 'regular' }, [dep.id, wait.id], 'What depends on the reply: not started, so an outline.'));
      els.push(...presences(c, from, fromAt, t.radius, [send.id], 'The one who sent it.', t.shadows));
      els.push(...presences(c, to, toAt, t.radius, [send.id, ...(qAttention ? [qAttention.id] : [])], 'The one it went to: round, with no facing, because whether they have seen it is open.', t.shadows));
      if (sent < 1) {
        const [x, y] = out.at(sent);
        els.push(shape('item', { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: 'context', material: 'solid' }, [send.id], 'The item, on its way.'));
      }
      const own = c.rep.elements.find((e) => e.own)?.id;
      const labels: SceneElement[] = t.labelForms
        ? [
            label('from-label', from, [r2(fromAt[0]), r2(fromAt[1] - 42)], 'middle', [send.id], 'Names the sender.', { halo: true }),
            label('to-label', to, [r2(toAt[0]), r2(toAt[1] - 42)], 'middle', [send.id], 'Names the receiver.', { halo: true, tone: own === to ? 'label' : 'label-soft' }),
            ...(dep ? [label('dependent-label', dep.say.what, [r2(fromAt[0]), r2(fromAt[1] + 102)], 'middle', [dep.id], 'Names what waits.', { names: ['dependent'] })] : []),
          ]
        : [];
      return composed(c, 'kinetic', layers(els, labels), alt);
    },
  };
}

/** T: an item leaves its place (kept as an outline) and goes later along time, to a place drawn only tentatively. */
export function shifted(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'shifts')[0];
  const absent = find(c.rep, 'exchange-absent')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qCause = question(c, 'cause');
  const item = s1.say.what;
  const by = s1.say.by;
  const own = c.rep.elements.find((e) => e.own)?.id;
  const y = CY + 10;
  const [x0, x1] = [SAFE + 40, FRAME.width - SAFE - 40];
  const slot = x0 + (x1 - x0) * 0.32;
  // The amount is not given: a rule constant (slice-2 common rule), never shown as measured.
  const later = slot + (x0 + (x1 - x0) * (s1.say.later ? 0.72 : 0.12) - slot) * t.unspecified;
  // R4-4 range: from just past its slot, in the direction it moved, to the end of the course; open there.
  const dir = s1.say.later ? 1 : -1;
  const range = t.unscaled === 'range' ? { from: slot + dir * (130 / 2 + 24), to: dir > 0 ? x1 : x0 } : null;
  const [w, h] = [130, 64];
  const duration = 2 * t.stepMs + (set ? 700 : 0);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['its place', 'moved', ...(set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: range
          ? 'the item leaves its place (kept as an outline) and moves just past it; where it is now is an open stretch of later time in the tentative dash, with no far end, because how much later is not said'
          : 'the item leaves its place (kept as an outline) and goes later along time; where it ends is only an outline in the tentative dash, because the amount is not given',
        [absent.id]: 'nothing passes between the one who moved it and you',
        ...(qCause ? { [qCause.id]: 'the empty place, where the possibilities gather' } : {}),
        ...(set ? { [set.id]: 'equal translucent marks on a ring around the empty place' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const u = ease.move(Math.min(1, Math.max(0, (ms - t.stepMs * 0.4) / (t.stepMs * 1.4))));
      const g = set ? Math.min(1, Math.max(0, (ms - 2 * t.stepMs) / 700)) : 0;
      const x = slot + ((range ? range.from + (dir * w) / 2 : later) - slot) * u;
      const els: SceneElement[] = [
        shape('time', { type: 'line', x1: x0, y1: y + h / 2 + 18, x2: x1, y2: y + h / 2 + 18 }, { role: 'context', line: 'hair' }, [s1.id], 'Time, running left to right.'),
        path('slot', roundedRect(slot - w / 2, y - h / 2, w, h, 14), { role: 'context', line: 'fine' }, [s1.id], 'Where it was: it stays as an outline, because it was there.'),
      ];
      els.push(...ring(set, [slot, y], 24, 6, g, qCause ? [qCause.id] : []));
      if (u < 1) els.push(path(item, roundedRect(x - w / 2, y - h / 2, w, h, 14), { role: 'near', material: 'tonal' }, [s1.id], 'The item, moving later.'));
      else if (range) els.push(path(item, openRange(range.from, range.to, y - h / 2, y + h / 2, 14), { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'Somewhere later: an open stretch with no far end, because how much later is not said (R4-4).'));
      else els.push(path(item, roundedRect(later - w / 2, y - h / 2, w, h, 14), { role: 'context', line: 'fine', dash: 'tentative' }, [s1.id], 'Where it is now: only an outline, because how much later is not said.'));
      if (t.unscaled === 'break') els.push(...breakMark('break', (slot + later) / 2, y + h / 2 + 18, [s1.id]));
      if (by) els.push(...presences(c, by, [slot, y - 110], t.radius, [s1.id], 'The one who moved it: round, with no facing.', t.shadows));
      if (own) els.push(...presences(c, own, [x0 + 30, y - 110], t.radius, [absent.id], 'You.', t.shadows));
      const labels: SceneElement[] = t.labelForms
        ? [
            label('item-label', item, [r2(range ? (range.from + range.to) / 2 : later), r2(y + 5)], 'middle', [s1.id], 'Names what moved.', { halo: true }),
            ...(t.unscaled === 'labelled' ? [label('unscaled-label', 'unscaled', [r2((slot + later) / 2), r2(y + h / 2 + 42)], 'middle', [s1.id], 'Says the distance is not to scale (R4-4 a).', { tone: 'label-soft' })] : []),
            ...(by ? [label('by-label', by, [r2(slot), r2(y - 110 - 34)], 'middle', [s1.id], 'Names who moved it.', { tone: 'label-soft' })] : []),
            ...(own ? [label('own-label', own, [r2(x0 + 30), r2(y - 110 - 34)], 'middle', [absent.id], 'Names you.')] : []),
          ]
        : [];
      return composed(c, 'kinetic', layers(els, labels), alt, { unscaled: 'not to scale' });
    },
  };
}

/** G: in a place, marks cross from the speakers to the group; a few of the group pulse once, each by itself. */
export function reacting(c: StudyCase, t: KineticTuning): Figure {
  const at = find(c.rep, 'located-in')[0];
  const sends = find(c.rep, 'sends');
  const reacts = find(c.rep, 'reacts')[0];
  const group = reacts.say.who;
  const n = countOf(c, group);
  const own = c.rep.elements.find((e) => e.own)!.id;
  const others = [...new Set(sends.map((s) => s.say.from))].filter((x) => x !== own);
  const ownAt: Pt = [CX - 250, CY + 20];
  const groupAt: Pt[] = Array.from({ length: n }, (_, k) => [CX + 60 + (k % 2) * 110, CY - 60 + Math.floor(k / 2) * 120] as Pt);
  const otherAt: Pt[] = others.map((_, k) => [CX - 70, CY - 95 + k * 60] as Pt);
  const centre: Pt = [groupAt.reduce((s, p) => s + p[0], 0) / n, groupAt.reduce((s, p) => s + p[1], 0) / n];
  // Who reacts is a fixed choice (slice-2 common rule): the account says "a few", not which.
  const few = [1, 2].filter((k) => k < n);
  const steps = sends.length + 1;
  const duration = steps * t.stepMs;
  const qIntent = question(c, 'intent');
  const qAttention = question(c, 'attention');
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: [...sends.map((s) => String(s.say.p === 'sends' ? s.say.item : s.id)), 'reaction'] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [at.id]: 'a soft plane: the place, everyone in it',
        ...Object.fromEntries(sends.map((s) => [s.id, 'a mark crosses from the speaker to the group'])),
        [reacts.id]: `${few.length} of the group pulse once, each by itself, toward no one`,
        ...(qIntent ? { [qIntent.id]: 'the speaker of the remark is round, with no facing' } : {}),
        ...(qAttention ? { [qAttention.id]: 'the group are round, with no facing; the pulses point at no one' } : {}),
      },
      {},
    ),
    compose(time: number) {
      const ms = time * duration;
      const els: SceneElement[] = [];
      sends.forEach((s, k) => {
        if (s.say.p !== 'sends') return;
        const u = ease.move(Math.min(1, Math.max(0, (ms - k * t.stepMs) / t.stepMs)));
        const fromAt = s.say.from === own ? ownAt : otherAt[others.indexOf(s.say.from)];
        const track = new Track(smooth([fromAt, [(fromAt[0] + centre[0]) / 2, Math.min(fromAt[1], centre[1]) - 50], centre], false, 30));
        els.push(...trace(`said-${k + 1}`, track, u, s.say.from === own, [s.id], 'What was said, crossing to the group.'));
        if (u > 0 && u < 1) {
          const [x, y] = track.at(u);
          els.push(shape(`said-${k + 1}-mark`, { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: s.say.from === own ? 'subject' : 'context', material: 'solid' }, [s.id], 'What was said, on its way.'));
        }
      });
      const pulse = ease.arrive(Math.min(1, Math.max(0, (ms - sends.length * t.stepMs) / t.stepMs)));
      groupAt.forEach((p, k) => {
        els.push(...[...(t.shadows ? [contact(`${group}-${k + 1}`, p, 18, `${group}-${k + 1}`)] : []), ...presence(`${group}-${k + 1}`, p, 18, false, [at.id, ...(qAttention ? [qAttention.id] : [])], 'One of the group: round, with no facing.')]);
        if (few.includes(k) && pulse > 0) els.push(shape(`reaction-${k + 1}`, { type: 'circle', cx: r2(p[0]), cy: r2(p[1]), r: r2(18 + 12 * pulse) }, { role: 'context', line: 'hair' }, [reacts.id], 'A reaction: one pulse around this one, pointing at no one.'));
      });
      others.forEach((o, k) => els.push(...presences(c, o, otherAt[k], 18, [...sends.filter((s) => s.say.p === 'sends' && s.say.from === o).map((s) => s.id), ...(qIntent ? [qIntent.id] : [])], 'The one who made the remark: round, with no facing.', t.shadows)));
      els.push(...presences(c, own, ownAt, t.radius, [at.id], 'You.', t.shadows));
      const plane = path('place', roundedRect(CX - 400, CY - 190, 800, 380, 40), { role: 'mid', material: 'tonal' }, [at.id], 'The place: everyone is in it.');
      const labels: SceneElement[] = t.labelForms
        ? [
            label('own-label', own, [r2(ownAt[0]), r2(ownAt[1] + 48)], 'middle', [at.id], 'Names you.', { halo: true }),
            ...others.map((o, k) => label(`${o}-label`, o, [r2(otherAt[k][0] - 30), r2(otherAt[k][1] + 5)], 'end', [sends[0].id], 'Names who made the remark.', { halo: true, tone: 'label-soft' })),
            label('group-label', group, [r2(centre[0]), r2(groupAt[groupAt.length - 1][1] + 50)], 'middle', [reacts.id], 'Names the group.', { halo: true, tone: 'label-soft' }),
          ]
        : [];
      return composed(c, 'kinetic', layers(els, labels, [plane]), alt);
    },
  };
}

/** C: many still forms; only the own form is moved, until it touches the other; a mark crosses; nothing comes back. */
export function jostled(c: StudyCase, t: KineticTuning): Figure {
  const s2 = find(c.rep, 'displaced')[0];
  const s3 = find(c.rep, 'contact')[0];
  const s4 = find(c.rep, 'sends')[0];
  const s5 = find(c.rep, 'exchange-absent')[0];
  const places = find(c.rep, 'located-in');
  const crowd = c.rep.elements.find((e) => e.count !== undefined)!.id;
  const own = s3.say.a;
  const other = s3.say.b;
  const r = 18;
  const otherAt: Pt = [CX + 40, CY];
  const ownFrom: Pt = [CX - 90, CY];
  const ownTo: Pt = [otherAt[0] - 2 * r, CY];
  const plane = { x: CX - 400, y: CY - 120, w: 800, h: 240 };
  const many = poissonDisc({ x: plane.x + 30, y: plane.y + 25, width: plane.w - 60, height: plane.h - 50, spacing: 52, max: 80 }, `study-${c.id}-crowd`)
    .filter(([x, y]) => Math.hypot(x - CX, y - CY) > 150)
    .slice(0, countOf(c, crowd));
  const duration = 4 * t.stepMs;
  const qOther = question(c, 'attention', other);
  const qCrowd = question(c, 'attention', crowd);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: c.rep.time.phases },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(places.map((p) => [p.id, 'a long soft plane, everyone in it'])),
        [s2.id]: 'only your form moves, carried across by the braking',
        [s3.id]: 'your form comes to touch the other’s',
        [s4.id]: 'a mark crosses from you to the other',
        [s5.id]: 'nothing comes back',
        ...(qOther ? { [qOther.id]: 'the other form is round, with no facing' } : {}),
        ...(qCrowd ? { [qCrowd.id]: 'the others are still, round, with no facing' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const moved = ease.move(Math.min(1, ms / (t.stepMs * 1.4)));
      const sorry = ease.move(Math.min(1, Math.max(0, (ms - 2 * t.stepMs) / t.stepMs)));
      const ownAt: Pt = [ownFrom[0] + (ownTo[0] - ownFrom[0]) * moved, CY];
      const els: SceneElement[] = [];
      many.forEach(([x, y], k) => els.push(...presence(`${crowd}-${k + 1}`, [x, y], 12, false, [places[places.length - 1].id, ...(qCrowd ? [qCrowd.id] : [])], 'One of the others: still, round, with no facing.')));
      if (t.shadows) els.push(contact(other, otherAt, r, other), contact(own, ownAt, r, own));
      els.push(...trace('displaced-trace', new Track([ownFrom, ownTo]), moved, true, [s2.id], 'How far the braking carried you.'));
      els.push(...presence(other, otherAt, r, false, [s3.id, ...(qOther ? [qOther.id] : [])], 'The other person: round, with no facing.'));
      els.push(...presence(own, ownAt, r, true, [s2.id, s3.id], 'You, carried across until you touch them.'));
      if (sorry > 0 && sorry < 1) {
        const track = new Track(smooth([ownAt, [CX, CY - 46], otherAt], false, 16));
        const [x, y] = track.at(sorry);
        els.push(shape('apology', { type: 'circle', cx: r2(x), cy: r2(y), r: 4 }, { role: 'subject', material: 'solid' }, [s4.id], 'Your apology, crossing.'));
      }
      const labels: SceneElement[] = t.labelForms ? [label('own-label', own, [r2(ownAt[0] - 6), r2(CY + 44)], 'middle', [s2.id], 'Names you.', { halo: true })] : [];
      const ground = path('place', roundedRect(plane.x, plane.y, plane.w, plane.h, 60), { role: 'mid', material: 'tonal' }, places.map((p) => p.id), 'The place: everyone in it.');
      return composed(c, 'kinetic', layers(els, labels, [ground]), alt);
    },
  };
}

/** D: two equal forms grow, one taller (the amount is a rule constant); the possibilities gather at the difference. */
export function compared(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'exceeds')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qCause = question(c, 'cause');
  const base = CY + 150;
  const short = 180;
  // The constant: a third taller. Under R4-4 range the taller one is drawn only the least visible
  // difference above the other (`lead`), its top solid, with an open line rising from it to the frame.
  const tall = short + 60 * t.unspecified;
  const ranged = t.unscaled === 'range';
  const lead = 16;
  const aHeight = ranged ? short + lead : tall;
  const [ax, bx] = [CX - 130, CX + 130];
  const duration = 2 * t.stepMs + (set ? 700 : 0);
  const alt = altText(c);
  const plant = (id: string, x: number, h: number, cites: readonly string[]): SceneElement[] => [
    shape(`${id}-stem`, { type: 'line', x1: x, y1: base, x2: x, y2: r2(base - h) }, { role: 'context', line: 'regular' }, cites, 'How tall it grew.'),
    path(`${id}-top`, roundedRect(x - 26, base - h - 22, 52, 30, 15), { role: 'near', material: 'tonal' }, cites, 'Its top: what grew.'),
    path(`${id}-base`, roundedRect(x - 30, base, 60, 26, 6), { role: 'context', line: 'fine' }, cites, 'Where it stands.'),
  ];
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['growing', 'grown', ...(set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: ranged
          ? 'both grow; the one by the window ends taller than the other, by the least visible difference, and an open line rises from its top with no end, because how much taller is not said'
          : 'both grow; the one by the window ends a third taller (the amount is a rule constant, not measured)',
        ...(qCause ? { [qCause.id]: 'the difference in height, where the possibilities gather' } : {}),
        ...(set ? { [set.id]: 'equal translucent marks at the difference' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const u = ease.move(Math.min(1, ms / (2 * t.stepMs)));
      const g = set ? Math.min(1, Math.max(0, (ms - 2 * t.stepMs) / 700)) : 0;
      const els = [...plant(s1.say.a, ax, 20 + (aHeight - 20) * u, [s1.id]), ...plant(s1.say.b, bx, 20 + (short - 20) * u, [s1.id])];
      if (ranged && u >= 1)
        els.push(shape(`${s1.say.a}-more`, { type: 'line', x1: ax, y1: r2(base - aHeight - 30), x2: ax, y2: SAFE + 8 }, { role: 'context', line: 'regular', dash: 'tentative' }, [s1.id], 'How much taller is not said: open, with no end (R4-4).'));
      if (t.unscaled === 'break') els.push(...breakMark('break', ax, base - short / 2, [s1.id], 18));
      els.push(...ring(set, [CX, ranged ? base - short - 60 : base - (tall + short) / 2 - 11], 22, 6, g, qCause ? [qCause.id] : []));
      const labels: SceneElement[] = t.labelForms
        ? [
            label('a-label', s1.say.a, [ax, base + 50], 'middle', [s1.id], 'Names it.', { names: [`${s1.say.a}-base`] }),
            label('b-label', s1.say.b, [bx, base + 50], 'middle', [s1.id], 'Names it.', { names: [`${s1.say.b}-base`] }),
            ...(t.unscaled === 'labelled' ? [label('unscaled-label', 'unscaled', [CX, base + 80], 'middle', [s1.id], 'Says the heights are not to scale (R4-4 a).', { tone: 'label-soft' })] : []),
          ]
        : [];
      return composed(c, 'kinetic', layers(els, labels), alt, { unscaled: 'heights not to scale' });
    },
  };
}

/** L: along a course, the item stops short of its planned mark; the shortfall is named; the possibilities gather in it. */
export function lagging(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'behind')[0];
  const set = find(c.rep, 'alternatives')[0];
  const qCause = question(c, 'cause');
  const y = CY + 10;
  const [x0, x1] = [SAFE + 40, FRAME.width - SAFE - 40];
  const planned = x0 + (x1 - x0) * 0.74;
  // M3's amount is stated ("two days"); what is not given is a scale, so its width stays a rule constant.
  const short = planned - 170 * t.unspecified;
  const [w, h] = [120, 64];
  const duration = 2 * t.stepMs + (set ? 700 : 0);
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['under way', 'now', ...(set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'the item moves along and stops short of its planned mark; the shortfall is named in words (its width is a rule constant, not to scale)',
        ...(qCause ? { [qCause.id]: 'the shortfall, where the possibilities gather' } : {}),
        ...(set ? { [set.id]: 'equal translucent marks in the shortfall' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const u = ease.move(Math.min(1, ms / (2 * t.stepMs)));
      const g = set ? Math.min(1, Math.max(0, (ms - 2 * t.stepMs) / 700)) : 0;
      const x = x0 + w / 2 + (short - w / 2 - x0 - w / 2) * u;
      const els: SceneElement[] = [
        shape('time', { type: 'line', x1: x0, y1: y + h / 2 + 18, x2: x1, y2: y + h / 2 + 18 }, { role: 'context', line: 'hair' }, [s1.id], 'Time, running left to right.'),
        shape('plan', { type: 'line', x1: planned, y1: y - h / 2 - 22, x2: planned, y2: y + h / 2 + 18 }, { role: 'context', line: 'fine' }, [s1.id], 'Where the plan said it would be now.'),
      ];
      els.push(...ring(set, [(short + planned) / 2, y - 62], 22, 6, g, qCause ? [qCause.id] : []));
      els.push(path(s1.say.what, roundedRect(x - w / 2, y - h / 2, w, h, 14), { role: 'near', material: 'tonal' }, [s1.id], 'The item, where it has got to.'));
      if (t.unscaled === 'range' && u >= 1) els.push(path('shortfall', roundedRect(short + 6, y - h / 2, planned - short - 12, h, 10), { role: 'context', line: 'hair', dash: 'tentative' }, [s1.id], 'The shortfall as an extent, not a measured length (R4-4 b).'));
      if (t.unscaled === 'break') els.push(...breakMark('break', (short + planned) / 2, y + h / 2 + 18, [s1.id]));
      const labels: SceneElement[] = t.labelForms
        ? [
            label('item-label', s1.say.what, [r2(x), r2(y + 5)], 'middle', [s1.id], 'Names it.', { halo: true }),
            label('amount-label', t.unscaled === 'labelled' ? 'amount-unscaled' : 'amount', [r2((short + planned) / 2), r2(y + h / 2 + 44)], 'middle', [s1.id], 'Names the shortfall.', { tone: 'label-soft' }),
            label('plan-label', 'plan', [r2(planned + 8), r2(y - h / 2 - 8)], 'start', [s1.id], 'Names the plan.', { tone: 'label-soft', names: ['plan'] }),
          ]
        : [];
      return composed(c, 'kinetic', layers(els, labels), alt, { amount: s1.say.amount, 'amount-unscaled': `${s1.say.amount}, not to scale`, plan: 'Plan' });
    },
  };
}
