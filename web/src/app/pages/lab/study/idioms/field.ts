import type { SceneElement } from '../../../../shared/visual/composition/scene';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { Area, contour, streamline, thin } from '../kit/field';
import { FRAME } from '../kit/spatial';
import { Pt, Track, ease, polyline, smooth } from '../kit/paths';
import { find } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';
import { roundedRect } from './kinetic';

/**
 * STUDY CODE: the field idiom (docs/visual-study/idioms.md, F1–F7): the frame is a field of fine
 * lines whose order, spacing and tightness carry the meaning. Flat; moving only when the field
 * facet says it evolves; metaphorical unless the field is the thing itself (a flow).
 */
export interface FieldTuning {
  /** F5: how long an evolving field grows, ms. */
  evolveMs: number;
  /** F1 with C5: how far from its source the field reaches, so a third of the frame stays calm. */
  reach: number;
  /** F2 clarity: established bundles, lines per bundle and their spacing. */
  bundle: number;
  bundleGap: number;
  /** F4: lines per possible heading, how far from the source they start, and their common turn (radians). */
  perHeading: number;
  headingStart: number;
  turn: number;
  /** F2 agitation: how tight the contours are near the source (units at the first level). */
  tightness: number;
  /** F6: the scale at each stance. */
  scales: readonly number[];
  /** F2 density: lanes after something joins, and before. */
  lanesAfter: number;
  lanesBefore: number;
  laneGap: number;
  layout: 'loop' | 'figure-eight';
  /** F3, F7: marks and labels. */
  labels: boolean;
}

export const FIELD_RULES: FieldTuning = {
  evolveMs: 6000,
  reach: 210,
  bundle: 3,
  bundleGap: 6,
  perHeading: 5,
  headingStart: 64,
  turn: 0.28,
  tightness: 70,
  scales: [1, 1.7, 3, 5.5],
  lanesAfter: 7,
  lanesBefore: 3,
  laneGap: 5,
  layout: 'loop',
  labels: true,
};

const CX = FRAME.width / 2;
const CY = FRAME.height / 2;
const AREA: Area = { x: SAFE, y: SAFE, width: FRAME.width - 2 * SAFE, height: FRAME.height - 2 * SAFE };

export function field(c: StudyCase, finish: Partial<FieldTuning> = {}): Figure {
  const t: FieldTuning = { ...FIELD_RULES, ...finish };
  const f = c.rep.facets.field;
  if (!f) throw new Error(`field: ${c.id} has no field facet`);
  if (f.quality === 'clarity') return clarity(c, t);
  if (f.quality === 'agitation') return agitation(c, t);
  if (find(c.rep, 'cycles').length) return flow(c, t);
  return held(c, t);
}

/** Lines offset sideways from a track, `offset` units to its left. */
function offsetLine(track: Track, offset: number, u0: number, u1: number, n = 80): Pt[] {
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
  const gap = 66;
  const x0 = SAFE + 60;
  const x1 = FRAME.width - x0;
  const ownTrack = new Track(smooth([[x0, CY + gap / 2 + 60], [CX, CY + gap / 2], [x1, CY + gap / 2 + 60]], false, 32));
  const otherTrack = new Track(smooth([[x1, CY - gap / 2 - 60], [CX, CY - gap / 2], [x0, CY - gap / 2 - 60]], false, 32));
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
      const clear = pts.filter((p) => Math.abs(p[1] - CY) > gap / 2 + 14 || Math.abs(p[0] - CX) > 90);
      if (clear.length > 3) lines.push(clear);
    }
    return lines;
  });
  const duration = c.rep.facets.field!.evolves ? t.evolveMs : 0;
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'field',
    axes: { space: 'flat', time: duration ? 'moving' : 'still', substance: 'field', mode: 'metaphorical', viewpoint: 'fixed' },
    motion: duration ? { kind: 'timeline', duration, steps: ['what is known', 'what is open'] } : { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'two coherent bundles of lines that come close and part',
        q1: 'the other bundle ends in a plain mark, with no direction beyond its own way',
        q2: 'your bundle ends in a plain mark',
        q3: 'around the closest point the field stays unresolved, in the tentative dash',
        ...(set ? { [set.id]: `${n} headings of equal strength in the unresolved field` } : {}),
      },
      { s2: 'an absent greeting has no form in a field: the gap between the bundles stays empty' },
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
      bundle(own, ownTrack, true);
      const [ox, oy] = ownTrack.at(known);
      const labels = t.labels ? [label('own-label', own, [r2(ox), r2(oy + 26)], 'middle', [s1.id], 'Says which way is yours.', { names: [own, `${own}-bundle`], halo: true })] : [];
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
    caseId: c.id,
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
  const lanesOf = (u0: number, u1: number, count: number) => {
    const pts = (u: number) => (u > 1 ? u - 1 : u);
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * t.laneGap;
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
    caseId: c.id,
    idiom: 'field',
    axes: { space: 'flat', time: 'still', substance: 'field', mode: 'direct', viewpoint: 'fixed' },
    motion: { kind: 'still' },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(flows.map((f) => [f.id, 'lanes from one place to the next, with a chevron for the direction'])),
        [s6.id]: 'the lanes close into one loop',
        ...(joins ? { [joins.id]: `${t.lanesAfter} lanes after the lungs against ${t.lanesBefore} before, and a mark where it joins` } : {}),
        ...(fate ? { [fate.id]: 'past the body the lanes go on in the tentative dash: neither fewer nor the same is claimed' } : {}),
      },
      {},
    ),
    compose() {
      const elements: SceneElement[] = [];
      let carried = false;
      for (const seg of segments) {
        const st = segmentStatement(seg.k);
        if (seg.k === joinK) carried = true;
        const open = carried && fate && seg.k === (joinK + 2) % through.length;
        const count = carried ? t.lanesAfter : t.lanesBefore;
        elements.push(
          path(`lanes-${seg.k + 1}`, lanesOf(seg.a, seg.b, count), open ? { role: 'subject', line: 'hair', dash: 'tentative' } : { role: carried ? 'subject' : 'context', line: 'hair' }, open ? [st!.id, fate!.id] : [st!.id, ...(carried && joins ? [joins.id] : [])], open ? 'Past the body: the lanes go on, open, because the text doesn’t say what happens to the oxygen.' : carried ? 'Blood carrying the oxygen it took up: more lanes.' : 'Blood on its way to the lungs: fewer lanes.'),
        );
        elements.push(path(`direction-${seg.k + 1}`, chevron((seg.a + seg.b) / 2), { role: 'context', line: 'fine' }, [st!.id], 'Which way it flows.'));
      }
      if (joins) {
        const [x, y] = places[joinK];
        elements.push(shape('joins', { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: 'subject', material: 'solid' }, [joins.id], 'Where the oxygen joins the blood.'));
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
    caseId: c.id,
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
