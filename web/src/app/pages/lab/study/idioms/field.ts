import type { SceneElement } from '../../../../shared/visual/composition/scene';
import type { StudyCase } from '../cases';
import { find } from '../representation';
import { Figure, SAFE, altText, composed, coverage, layoutOf, partsShown, sentence, word } from './contract';
import { crowdField, grownField, heldWait, lateField, openWait, ripples, shiftedField } from './field2';
import { Pattern, Refused, needs } from './registry';
import { Choice, studyChoice } from './dispatch';
import { listed } from './draws';
import { FIELD_RULES as ENGINE_FIELD_RULES, kit } from '../../../../shared/visual';
import type { FieldTuning as EngineFieldTuning, Unscaled } from '../../../../shared/visual';
const { AREA, FRAME, Track, contour, ease, label, path, polyline, r2, roundedRect, shape, smooth, streamline, thin } = kit;
type Area = kit.Area;
type Pt = kit.Pt;
type Track = kit.Track;

/**
 * STUDY CODE: the field idiom (docs/visual-study/idioms.md, F1–F7): the frame is a field of fine
 * lines whose order, spacing and tightness carry the meaning. Flat; moving only when the field
 * facet says it evolves; metaphorical unless the field is the thing itself (a flow).
 */
/** The field tuning: the engine's (S12, what its general patterns read), and what the study's own patterns read. */
export interface FieldTuning extends EngineFieldTuning {
  /** F2 clarity: established bundles, lines per bundle and their spacing. */
  bundle: number;
  bundleGap: number;
  /** F6: the scale at each stance. */
  scales: readonly number[];
  /** F2 density: lanes after something joins, and before. */
  lanesAfter: number;
  lanesBefore: number;
  laneGap: number;
  layout: 'loop' | 'figure-eight';
  /**
   * R4-4 (open for this idiom): how an amount the text doesn't give is drawn. The constant, provisionally:
   * it asserts a size the text doesn't give (findings-revision-4.md §3). Only the kinetic idiom adopted `range`.
   */
  unscaled: Unscaled;
}

export const FIELD_RULES: FieldTuning = {
  ...ENGINE_FIELD_RULES,
  bundle: 3,
  bundleGap: 6,
  scales: [1, 1.7, 3, 5.5],
  lanesAfter: 7,
  lanesBefore: 3,
  laneGap: 5,
  layout: 'loop',
  unscaled: 'constant',
};
const CX = FRAME.width / 2;
const CY = FRAME.height / 2;

export function field(c: StudyCase, finish: Partial<FieldTuning> = {}): Figure {
  return fieldChoice(c, finish).figure;
}

/**
 * Revision 5: the patterns, in the order that breaks ties, each with what it needs (registry.ts).
 * Before revision 5, `held` was the fallback for anything else; it needs the whole of a held
 * dependency, so it is now one pattern among the others.
 */
/** Revision 8: exported for the hand-written expectations (revision-8.spec.ts). */
export function fieldPatterns(): Pattern<FieldTuning>[] {
  return patterns();
}

function patterns(): Pattern<FieldTuning>[] {
  const { a, all, plural, own, question, quality } = needs;
  return listed<FieldTuning>('field', [
    // D9 (revision 5): clarity and agitation name P1's and P2's statement ids (q1–q3, s1–s6) in their
    // coverage, so they need those statements' kinds too, or they would fail on a case without them.
    { name: 'clarity', lacks: (c) => all(quality(c, 'clarity'), a(c, 'passes'), a(c, 'exchange-absent'), question(c, 'attention'), question(c, 'whether'), question(c, 'cause')), draw: clarity },
    { name: 'openWait', lacks: (c) => all(quality(c, 'clarity'), a(c, 'sends'), a(c, 'exchange-absent'), a(c, 'waiting')), draw: openWait },
    { name: 'shiftedField', lacks: (c) => all(quality(c, 'clarity'), a(c, 'shifts'), a(c, 'exchange-absent')), draw: shiftedField },
    { name: 'grownField', lacks: (c) => all(quality(c, 'clarity'), a(c, 'exceeds')), draw: grownField },
    { name: 'lateField', lacks: (c) => all(quality(c, 'clarity'), a(c, 'behind')), draw: lateField },
    { name: 'agitation', lacks: (c) => all(quality(c, 'agitation'), a(c, 'feels'), a(c, 'sends'), a(c, 'receives'), a(c, 'located-in'), a(c, 'apart'), a(c, 'holds'), question(c, 'intent'), question(c, 'setting')), draw: agitation },
    { name: 'flow', lacks: (c) => a(c, 'cycles'), draw: flow },
    { name: 'ripples', lacks: (c) => all(a(c, 'reacts'), a(c, 'located-in'), own(c)), draw: ripples },
    { name: 'crowdField', lacks: (c) => all(a(c, 'contact'), a(c, 'displaced'), a(c, 'sends'), a(c, 'exchange-absent'), plural(c)), draw: crowdField },
    { name: 'heldWait', lacks: (c) => all(a(c, 'sends'), a(c, 'waiting'), a(c, 'depends-on'), a(c, 'exchange-absent')), draw: heldWait },
    {
      name: 'held',
      lacks: (c) => all(a(c, 'complete'), a(c, 'precedes'), a(c, 'depends-on'), a(c, 'absent'), a(c, 'waiting'), a(c, 'exchange-absent'), question(c, 'time')),
      draw: held,
    },
    // Then the engine's general patterns (motion, dependency, felt), registered after these (S12, M3: dispatch.ts).
  ]);
}

/** `without`: patterns left out, for the checks (to show what the idiom does without one). */
export function fieldChoice(c: StudyCase, finish: Partial<FieldTuning> = {}, only: { without?: readonly string[] } = {}): { figure: Figure; choice: Choice } {
  const t: FieldTuning = { ...FIELD_RULES, layout: layoutOf(c), ...finish };
  if (!c.rep.facets.field) throw new Refused({ caseId: c.id, idiom: 'field', tried: [{ pattern: 'every pattern', lacks: ['a field facet'] }] });
  // Stage 3, M2: through the engine's dispatch, which composes when no single pattern is able (revision 7) and else refuses, saying why.
  return studyChoice('field', c, t, finish, only.without);
}

/** Lines offset sideways from a track, `offset` units to its left. */
export function offsetLine(track: Track, offset: number, u0: number, u1: number, n = 80): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const u = u0 + ((u1 - u0) * k) / n;
    const a = track.at(Math.max(0, u - 0.002));
    const b = track.at(Math.min(1, u + 0.002));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const p = track.at(u);
    out.push([p[0] - ((b[1] - a[1]) / len) * offset, p[1] + ((b[0] - a[0]) / len) * offset]);
  }
  return out;
}

/** F2 clarity, F4, F5: two coherent bundles that come close and part; around their closest point, equal unresolved headings. */
function clarity(c: StudyCase, t: FieldTuning): Figure {
  const s1 = find(c.rep, 'passes')[0];
  const set = find(c.rep, 'alternatives')[0];
  const own = c.rep.elements.find((e) => e.id === s1.say.a)!.own ? s1.say.a : s1.say.b;
  const other = own === s1.say.a ? s1.say.b : s1.say.a;
  // F2r2 (revision 2, after review of P1): when the account names the one who moved and the other's
  // motion is open, only the mover's way is a bundle; the other is a still mark beside it, which the
  // way comes close to and leaves, left to right (C5). The gap widens so the open field around the
  // closest point lies clear between them.
  const motionOpen = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'motion' && s.say.about === own);
  const ownStill = !!s1.say.mover && s1.say.mover !== own && !!motionOpen;
  const gap = ownStill ? 110 : 66;
  const x0 = SAFE + 60;
  const x1 = FRAME.width - x0;
  const ownPoint: Pt = [CX, CY + gap / 2];
  const ownTrack = new Track(ownStill ? [ownPoint, ownPoint] : smooth([[x0, CY + gap / 2 + 60], [CX, CY + gap / 2], [x1, CY + gap / 2 + 60]], false, 32));
  const otherTrack = new Track(
    ownStill ? smooth([[x0, CY - gap / 2 - 30], [CX, CY - gap / 2], [x1, CY - gap / 2 - 30]], false, 32) : smooth([[x1, CY - gap / 2 - 60], [CX, CY - gap / 2], [x0, CY - gap / 2 - 60]], false, 32),
  );
  const nearCourse = (p: Pt) => otherTrack.points.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 14);
  const n = set ? set.say.options.length : 0;
  // F4: n headings of equal strength, each a sector of outward lines with a gentle common turn.
  const sectorLines: Pt[][][] = Array.from({ length: n }, (_, k) => {
    const centre = -Math.PI / 2 + ((k + 0.5) / n) * Math.PI * 2;
    const width = (Math.PI * 2) / n;
    const lines: Pt[][] = [];
    for (let j = 0; j < t.perHeading; j++) {
      const a = centre - width * 0.32 + (width * 0.64 * j) / Math.max(1, t.perHeading - 1);
      const start: Pt = [CX + Math.cos(a) * t.headingStart, CY + Math.sin(a) * t.headingStart];
      const vec = (p: Pt) => {
        const r = Math.hypot(p[0] - CX, p[1] - CY);
        if (r > t.reach) return null;
        const th = Math.atan2(p[1] - CY, p[0] - CX) + t.turn;
        return [Math.cos(th), Math.sin(th)] as const;
      };
      const pts = streamline(start, vec, AREA, 4, t.reach);
      // Not across the two bundles: what is established stays clear (F4).
      const clear = ownStill
        ? pts.filter((p) => !nearCourse(p) && Math.hypot(p[0] - ownPoint[0], p[1] - ownPoint[1]) > 22)
        : pts.filter((p) => Math.abs(p[1] - CY) > gap / 2 + 14 || Math.abs(p[0] - CX) > 90);
      if (clear.length > 3) lines.push(clear);
    }
    return lines;
  });
  const duration = c.rep.facets.field!.evolves ? t.evolveMs : 0;
  const alt = altText(c);
  return {
    idiom: 'field',
    axes: { space: 'flat', time: duration ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: duration ? { kind: 'timeline', duration, steps: ['what is known', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: ownStill ? 'one coherent bundle, the classmate’s way, that comes close by your still mark and goes on' : 'two coherent bundles of lines that come close and part',
        q1: 'the other bundle ends in a plain mark, with no direction beyond its own way',
        q2: ownStill ? 'your mark is plain' : 'your bundle ends in a plain mark',
        q3: 'around the closest point the field stays unresolved, in the tentative dash',
        ...(set ? { [set.id]: `${n} headings of equal strength in the unresolved field` } : {}),
        ...(motionOpen && ownStill ? { [motionOpen.id]: 'you are a still mark with no way of your own: nothing says you moved' } : {}),
      },
      {
        s2: 'an absent greeting has no form in a field: the gap between the bundle and your mark stays empty',
        ...(motionOpen && !ownStill ? { [motionOpen.id]: 'NOT RESPECTED: your bundle is a way travelled too' } : {}),
      },
    ),
    compose(at: number) {
      const ms = at * (duration || 1);
      const known = duration ? ease.move(Math.min(1, ms / (duration * 0.55))) : 1;
      const open = duration ? ease.move(Math.min(1, Math.max(0, (ms - duration * 0.55) / (duration * 0.45)))) : 1;
      const elements: SceneElement[] = [];
      sectorLines.forEach((lines, k) => {
        if (open <= 0.002) return;
        const d = lines.map((l) => polyline(l.slice(0, Math.max(2, Math.round(l.length * open))))).join('');
        elements.push(path(`heading-${k + 1}`, d, { role: 'context', line: 'hair', dash: 'tentative' }, set ? [set.id, 'q3'] : ['q3'], 'One possible heading: as many lines and as long as every other, unresolved.'));
      });
      const bundle = (id: string, track: Track, isOwn: boolean) => {
        const d = Array.from({ length: t.bundle }, (_, i) => polyline(offsetLine(track, (i - (t.bundle - 1) / 2) * t.bundleGap, 0, known))).join('');
        elements.push(path(`${id}-bundle`, d, { role: isOwn ? 'subject' : 'context', line: 'fine' }, [s1.id], isOwn ? 'Your way: coherent, because it is reported.' : 'The other person’s way: coherent, because it is reported.'));
        const [x, y] = track.at(known);
        elements.push(shape(id, { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: isOwn ? 'subject' : 'context', material: 'solid' }, [s1.id, isOwn ? 'q2' : 'q1'], isOwn ? 'You: a plain mark at the head of your way.' : 'The other person: a plain mark, with no facing.'));
      };
      bundle(other, otherTrack, false);
      if (ownStill)
        elements.push(shape(own, { type: 'circle', cx: r2(ownPoint[0]), cy: r2(ownPoint[1]), r: 6 }, { role: 'subject', material: 'solid' }, [s1.id, 'q2', motionOpen!.id], 'You: a still mark with no way of its own, because the account doesn’t say you moved.'));
      else bundle(own, ownTrack, true);
      const [ox, oy] = ownTrack.at(known);
      const labels = t.labels ? [label('own-label', own, [r2(ox), r2(oy + 26)], 'middle', [s1.id], ownStill ? 'Says which mark is you.' : 'Says which way is yours.', { names: ownStill ? [own] : [own, `${own}-bundle`], halo: true })] : [];
      return composed(c, 'field', [
        { id: 'field', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** F2 agitation, F6: contours tight around the own presence, as many as its charge; the surroundings calm; stepping back shows more of them, never a weaker field. */
function agitation(c: StudyCase, t: FieldTuning): Figure {
  const s5 = find(c.rep, 'feels')[0];
  const own = s5.say.who;
  const stances = c.rep.facets.space?.viewpoints ?? ['own'];
  const centre: Pt = [CX - 100, CY + 20];
  const levels = Math.round(10 * s5.say.charge) + 1;
  // In world units around the source: contours of a calm falloff, gently uneven.
  const wobble = (a: number) => 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.sin(5 * a + 1);
  const fn = (x: number, y: number) => Math.exp(-Math.hypot(x, y) / (t.tightness * wobble(Math.atan2(y, x))));
  const rings: Pt[][] = [];
  for (let k = 0; k < levels; k++) {
    const level = 0.78 * Math.pow(0.78, k);
    const R = -t.tightness * Math.log(level) * 1.2 + 10;
    for (const line of contour(fn, { x: -R, y: -R, width: 2 * R, height: 2 * R }, 3, level)) rings.push(thin(line, 2));
  }
  const reach = Math.max(...rings.flatMap((l) => l.map((p) => Math.hypot(p[0], p[1]))));
  const alt = altText(c, (id) => id === s5.id);
  return {
    idiom: 'field',
    axes: { space: 'flat', time: 'still', substance: 'field', mode: 'metaphorical', viewpoint: stances.length > 1 ? 'movable' : 'fixed' },
    motion: stances.length > 1 ? { kind: 'viewpoint', positions: stances } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      { [s5.id]: `${levels} contours around you, tight near you; the same at every scale` },
      {
        s1: 'a field carries qualities, not exchanges: the reply has no form here',
        s2: 'as s1',
        s3: 'the field doesn’t show places: your home has no form',
        s4: 'the manager isn’t placed, so the distance isn’t drawn',
        s6: 'objects have no form in this field',
        q1: 'the manager has no form here, so neither does what they meant',
        q2: 'as q1',
      },
    ),
    compose(at: number) {
      const v = Math.min(Math.max(at, 0), t.scales.length - 1);
      const i = Math.min(Math.floor(v), t.scales.length - 2);
      const scale = t.scales[i] + (t.scales[i + 1] - t.scales[i]) * ease.move(v - i);
      const toFrame = (p: Pt): Pt => [centre[0] + p[0] / scale, centre[1] + p[1] / scale];
      const agitated = rings.map((l) => polyline(l.map(toFrame), true)).join('');
      // The surroundings: calm horizontal lines in the frame (a texture, not world-bound), clear of the field.
      const clearR = reach / scale + 18;
      const calm: string[] = [];
      for (let y = AREA.y + 10; y < AREA.y + AREA.height; y += 22) {
        let run: Pt[] = [];
        for (let x = AREA.x; x <= AREA.x + AREA.width; x += 12) {
          const p: Pt = [x, y + 3 * Math.sin(x / 90 + y / 60)];
          if (Math.hypot(p[0] - centre[0], p[1] - centre[1]) < clearR) {
            if (run.length > 1) calm.push(polyline(run));
            run = [];
          } else run.push(p);
        }
        if (run.length > 1) calm.push(polyline(run));
      }
      const elements: SceneElement[] = [
        path('surroundings', calm.join(''), { role: 'context', line: 'hair' }, ['base:surroundings'], 'The rest of the evening: calm, the same at every scale.', {}, ['understanding']),
        path('agitation', agitated, { role: 'subject', line: 'hair' }, [s5.id], 'How it felt to you: contours tight around you, as strong as you said, whatever the distance.'),
        shape(own, { type: 'circle', cx: r2(centre[0]), cy: r2(centre[1]), r: 5 }, { role: 'subject', material: 'solid' }, [s5.id], 'You, at the source of the feeling.'),
      ];
      const labels = t.labels ? [label('own-label', own, [r2(centre[0]), r2(centre[1] + reach / scale + 30)], 'middle', [s5.id], 'Says whose feeling it is.', { names: [own, 'agitation'], halo: true })] : [];
      return composed(c, 'field', [
        { id: 'field', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** F2 density, F7: lanes around the cycle, denser after something joins; where its fate is open, the lanes go on in the tentative dash. */
function flow(c: StudyCase, t: FieldTuning): Figure {
  const s6 = find(c.rep, 'cycles')[0];
  const joins = find(c.rep, 'joins')[0];
  const flows = find(c.rep, 'flows');
  const fate = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'fate');
  const through = s6.say.through;
  // Revision 5 (D8): descriptions in the statements' own words, not one case's.
  const W = (id: string) => word(c, id);
  const moverW = W(s6.say.what);
  const atW = joins ? W(joins.say.at) : '';
  const pastW = joins ? W(through[(through.indexOf(joins.say.at) + 2) % through.length]) : '';
  const takenW = joins ? W(joins.say.what) : '';
  const places: Pt[] =
    t.layout === 'figure-eight'
      ? [[CX - 60, CY], [CX, SAFE + 70], [CX + 60, CY], [CX, FRAME.height - SAFE - 70]]
      : through.map((_, k) => {
          const a = Math.PI + (k / through.length) * Math.PI * 2;
          return [CX + Math.cos(a) * 300, CY + Math.sin(a) * 165] as Pt;
        });
  const via: Pt[] =
    t.layout === 'figure-eight'
      ? [places[0], [CX - 230, CY - 120], places[1], [CX + 230, CY - 120], places[2], [CX + 230, CY + 120], places[3], [CX - 230, CY + 120]]
      : places;
  const loop = new Track(smooth(via, true, 32));
  const fractions = places.map((p) => {
    let best = 0;
    let d = Infinity;
    for (let k = 0; k <= 400; k++) {
      const q = loop.at(k / 400);
      const e = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (e < d) [d, best] = [e, k / 400];
    }
    return best;
  });
  // Segments in cycle order, each from one place to the next (wrapping round the loop).
  const segments = through.map((_, k) => {
    const a = fractions[k];
    let b = fractions[(k + 1) % through.length];
    if (b <= a) b += 1;
    return { k, a, b };
  });
  const joinK = joins ? through.indexOf(joins.say.at) : -1;
  const transforms = find(c.rep, 'transforms');
  // Pattern X: the state after each place is its last change of form there.
  const changesAt = (k: number) => transforms.filter((x) => x.say.p === 'transforms' && x.say.at === through[k]);
  const stateAt = (k: number) => {
    const here = changesAt(k);
    return here.length ? (here[here.length - 1].say as { to: string }).to : 'liquid';
  };
  const lanesOf = (u0: number, u1: number, count: number, gap = t.laneGap) => {
    const pts = (u: number) => (u > 1 ? u - 1 : u);
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * gap;
      // Shortened at each end, so the lanes meet the places as a flow, not a joined drawing.
      const s = u0 + 0.012;
      const e = u1 - 0.012;
      const line: Pt[] = [];
      for (let k = 0; k <= 60; k++) {
        const u = pts(s + ((e - s) * k) / 60);
        line.push(offsetLine(loop, off, u, u, 1)[0]);
      }
      out.push(polyline(line));
    }
    return out.join('');
  };
  const chevron = (u: number): string => {
    const p = loop.at(u % 1);
    const q = loop.at((u + 0.004) % 1);
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const s = 7;
    const back = (da: number): Pt => [p[0] - Math.cos(a + da) * s, p[1] - Math.sin(a + da) * s];
    return polyline([back(0.6), p, back(-0.6)]);
  };
  const alt = altText(c);
  const segmentStatement = (k: number) => flows.find((f) => f.say.from === through[k] && f.say.to === through[(k + 1) % through.length]);
  return {
    idiom: 'field',
    axes: { space: 'flat', time: 'still', substance: 'field', mode: 'direct', viewpoint: 'fixed' },
    motion: { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(flows.map((f) => [f.id, 'lanes from one place to the next, with a chevron for the direction'])),
        [s6.id]: 'the lanes close into one loop',
        ...Object.fromEntries(find(c.rep, 'above').map((x) => [x.id, 'drawn higher here, but only because of the loop’s order: no flat rule enforces above (open)'])),
        ...partsShown(c),
        ...Object.fromEntries(transforms.map((x) => [x.id, 'the lanes’ spacing changes where the form changes: wide apart as vapour, close otherwise (pattern X)'])),
        ...(joins ? { [joins.id]: `${t.lanesAfter} lanes after ${atW} against ${t.lanesBefore} before, and a mark where it joins` } : {}),
        ...(fate ? { [fate.id]: `past ${pastW} the lanes go on in the tentative dash: neither fewer nor the same is claimed` } : {}),
      },
      {},
    ),
    compose() {
      const elements: SceneElement[] = [];
      let carried = false;
      for (const seg of segments) {
        const st = segmentStatement(seg.k) ?? changesAt(seg.k)[changesAt(seg.k).length - 1];
        if (transforms.length) {
          const state = stateAt(seg.k);
          elements.push(path(`lanes-${seg.k + 1}`, lanesOf(seg.a, seg.b, t.lanesAfter, state === 'vapour' ? t.laneGap * 3 : t.laneGap), { role: 'subject', line: 'hair' }, [st!.id, ...changesAt(seg.k).map((x) => x.id)], `${sentence(moverW)} as ${state}: ${state === 'vapour' ? 'lanes wide apart' : 'lanes close together'}.`));
          elements.push(path(`direction-${seg.k + 1}`, chevron((seg.a + seg.b) / 2), { role: 'context', line: 'fine' }, [st!.id], 'Which way it goes.'));
          continue;
        }
        if (seg.k === joinK) carried = true;
        const open = carried && fate && seg.k === (joinK + 2) % through.length;
        const count = carried ? t.lanesAfter : t.lanesBefore;
        elements.push(
          path(`lanes-${seg.k + 1}`, lanesOf(seg.a, seg.b, count), open ? { role: 'subject', line: 'hair', dash: 'tentative' } : { role: carried ? 'subject' : 'context', line: 'hair' }, open ? [st!.id, fate!.id] : [st!.id, ...(carried && joins ? [joins.id] : [])], open ? `Past ${pastW}: the lanes go on, open, because the text doesn’t say what happens to ${takenW}.` : carried ? `${sentence(moverW)} carrying ${takenW} it took up: more lanes.` : `${sentence(moverW)} on its way${joins ? ' to ' + atW : ''}: fewer lanes.`),
        );
        elements.push(path(`direction-${seg.k + 1}`, chevron((seg.a + seg.b) / 2), { role: 'context', line: 'fine' }, [st!.id], 'Which way it flows.'));
      }
      if (joins) {
        const [x, y] = places[joinK];
        elements.push(shape('joins', { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: 'subject', material: 'solid' }, [joins.id], `Where ${takenW} joins ${W(joins.say.into)}.`));
      }
      const labels: SceneElement[] = t.labels
        ? through.map((id, k) => {
            const below = places[k][1] >= CY - 1;
            const side = Math.abs(places[k][1] - CY) < 2;
            const at: Pt = side ? [places[k][0], places[k][1] + 34] : [places[k][0], places[k][1] + (below ? 34 : -24)];
            return label(`label-${id}`, id, [r2(at[0]), r2(at[1])], 'middle', flows.filter((f) => f.say.from === id || f.say.to === id).map((f) => f.id), 'Names the place.', { halo: true });
          })
        : [];
      return composed(c, 'field', [
        { id: 'field', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** F2 density, F5: lanes of work from what is finished, closing in as they reach the barrier, where they hold; beyond it, nothing yet. */
function held(c: StudyCase, t: FieldTuning): Figure {
  const s1 = find(c.rep, 'complete')[0];
  const s2 = find(c.rep, 'precedes')[0];
  const s3 = find(c.rep, 'depends-on')[0];
  const s4 = find(c.rep, 'absent')[0];
  const s5 = find(c.rep, 'waiting')[0];
  const s6 = find(c.rep, 'exchange-absent')[0];
  const q1 = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'time')!;
  const barrierX = CX + 40;
  const lanes = 13;
  const fromX = SAFE + 30;
  const top = CY - 110;
  const bottom = CY + 110;
  const lane = (i: number): Pt[] => {
    const y0 = top + ((bottom - top) * i) / (lanes - 1);
    // Closing in towards the barrier's own extent: denser where the work is held.
    const y1 = CY + (y0 - CY) * 0.45;
    const stop = barrierX - 8 - Math.abs(i - (lanes - 1) / 2) * 3;
    return Array.from({ length: 41 }, (_, k) => {
      const x = fromX + ((stop - fromX) * k) / 40;
      const f = ease.move((x - fromX) / (stop - fromX));
      return [x, y0 + (y1 - y0) * f] as Pt;
    });
  };
  const all = Array.from({ length: lanes }, (_, i) => new Track(lane(i)));
  const duration = c.rep.facets.field!.evolves ? t.evolveMs : 0;
  const alt = altText(c);
  return {
    idiom: 'field',
    axes: { space: 'flat', time: duration ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: duration ? { kind: 'timeline', duration, steps: ['flowing', 'held'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'the lanes start from design’s side, full',
        [s2.id]: 'design on the left, build on the right',
        [s3.id]: 'a barrier across the lanes',
        [s4.id]: 'the licence: an outline in the tentative dash above the barrier',
        [s5.id]: 'the lanes close in at the barrier and hold there',
        [q1.id]: 'nothing shows when: the field never opens',
      },
      { [s6.id]: 'an exchange that didn’t happen has no form in a field' },
    ),
    compose(at: number) {
      const ms = at * (duration || 1);
      const elements: SceneElement[] = [];
      const d = all
        .map((tr, i) => {
          // Lanes set off one after another and arrive one after another (K7's constant pace holds here too).
          const startAt = (i % 4) * 0.12 + (i % 3) * 0.05;
          const u = duration ? ease.move(Math.min(1, Math.max(0, (ms / duration - startAt) / 0.62))) : 1;
          return u > 0.01 ? polyline(tr.slice(0, u)) : '';
        })
        .join('');
      if (d) elements.push(path('lanes', d, { role: 'subject', line: 'hair' }, [s1.id, s5.id], 'Work from the finished design, closing in where it is held.'));
      elements.push(shape('barrier', { type: 'line', x1: r2(barrierX), y1: r2(CY - 70), x2: r2(barrierX), y2: r2(CY + 70) }, { role: 'ink', line: 'bold' }, [s3.id], 'The dependency on the licence.'));
      elements.push(path('licence', roundedRect(barrierX - 22, CY - 120, 44, 30, 5), { role: 'context', line: 'fine', dash: 'tentative' }, [s4.id, q1.id], 'The licence: not here yet, where it would be.'));
      elements.push(path('build', roundedRect(FRAME.width - SAFE - 200, CY - 60, 170, 120, 20), { role: 'context', line: 'hair' }, [s2.id, s5.id], 'Build: next, and not started: an empty outline the work hasn’t reached.'));
      const labels: SceneElement[] = t.labels
        ? [
            label('design-label', s2.say.a, [fromX + 4, r2(top - 18)], 'start', [s1.id], 'Names where the work comes from.'),
            label('build-label', s2.say.b, [r2(FRAME.width - SAFE - 115), r2(CY + 5)], 'middle', [s2.id], 'Names the step that waits.', { names: ['build'] }),
            label('licence-label', s3.say.on, [r2(barrierX + 34), r2(CY - 100)], 'start', [s4.id], 'Names what build waits for.', { tone: 'label-soft', names: ['licence'] }),
          ]
        : [];
      return composed(c, 'field', [
        { id: 'field', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}
