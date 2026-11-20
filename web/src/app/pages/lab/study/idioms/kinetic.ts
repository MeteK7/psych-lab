import type { Layer, SceneElement } from '../../../../shared/visual/composition/scene';
import type { StudyCase } from '../cases';
import { label, path, r2, shape } from '../kit/elements';
import { FRAME } from '../kit/spatial';
import { Pt, Track, ease, polyline, smooth } from '../kit/paths';
import { find } from '../representation';
import { Figure, SAFE, altText, composed, coverage } from './contract';

/**
 * STUDY CODE: the kinetic sequence idiom (docs/visual-study/idioms.md, K1–K11): flat, moving, made
 * of forms, direct, a fixed viewpoint. The rules choose a pattern from the predicates present; the
 * tuning holds every number a rule sets, so hand finishing (finish.ts) is a list of changes to it.
 */
export interface KineticTuning {
  /** K3: one step of a sequence, ms. */
  stepMs: number;
  /** K2: a presence's radius; a secondary one's. */
  radius: number;
  secondaryRadius: number;
  /** K5 passes: closest approach, in radii, and how far apart the paths start and end. */
  approach: number;
  spread: number;
  /** K8: the ring of possibilities. */
  ringRadius: number;
  ringMark: number;
  /** K5 sends: how high the arc rises. */
  arcLift: number;
  /** The cycle's layout: by the rules, places around one loop in the order the cycle names them. */
  layout: 'loop' | 'figure-eight';
  /** K4: traces of the way so far. */
  traces: boolean;
  /** C8: labels on forms that would be ambiguous without them. */
  labelForms: boolean;
  /** Not in the rules: a contact shadow under each presence (added by hand finishing only). */
  shadows: boolean;
}

export const KINETIC_RULES: KineticTuning = {
  stepMs: 1300,
  radius: 22,
  secondaryRadius: 16,
  approach: 3,
  spread: 60,
  ringRadius: 46,
  ringMark: 8,
  arcLift: 90,
  layout: 'loop',
  traces: true,
  labelForms: true,
  shadows: false,
};

/** A soft contact shadow under a flat form, on the plane it moves across. */
function contact(id: string, at: Pt, r: number, grounds: string): SceneElement {
  return shape(`${id}-shadow`, { type: 'ellipse', cx: r2(at[0] + r * 0.12), cy: r2(at[1] + r * 0.92), rx: r2(r * 0.95), ry: r2(r * 0.32) }, { role: 'ink', material: 'shadow' }, ['base:ground'], 'Sets the form on a surface, so it reads as something that moves across one.', { grounds }, ['understanding']);
}

const CX = FRAME.width / 2;
const CY = FRAME.height / 2;

/** A presence as a flat form (K2, C2, C3): the own one lit in the area colour; another, the ground with a context line. Round: no facing. */
function presence(id: string, at: Pt, r: number, own: boolean, cites: readonly string[], why: string): SceneElement[] {
  const g = { type: 'circle' as const, cx: r2(at[0]), cy: r2(at[1]), r };
  if (own) return [shape(id, g, { role: 'subject', material: 'lit', line: 'regular' }, cites, why)];
  return [shape(`${id}-back`, g, { role: 'ground', material: 'tonal' }, ['base:ground'], 'Keeps the form solid over the traces behind it.', {}, ['understanding']), shape(id, g, { role: 'context', line: 'regular' }, cites, why)];
}

function trace(id: string, track: Track, u: number, own: boolean, cites: readonly string[], why: string): SceneElement[] {
  if (u <= 0.002) return [];
  return [path(id, polyline(track.slice(0, u)), { role: own ? 'subject' : 'context', line: 'hair' }, cites, why)];
}

export function kinetic(c: StudyCase, finish: Partial<KineticTuning> = {}): Figure {
  const t: KineticTuning = { ...KINETIC_RULES, ...finish };
  const rep = c.rep;
  if (find(rep, 'passes').length) return encounter(c, t);
  if (find(rep, 'sends').length) return transmission(c, t);
  if (find(rep, 'cycles').length) return cycle(c, t);
  if (find(rep, 'waiting').length) return blocked(c, t);
  throw new Error(`kinetic: no pattern for ${c.id}`);
}

const AXES = { space: 'flat', time: 'moving', substance: 'forms', mode: 'direct', viewpoint: 'fixed' } as const;

/** K5 passes, K6, K7, K8: two forms come close and continue; nothing passes between them; then the possibilities. */
function encounter(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'passes')[0];
  const set = find(c.rep, 'alternatives')[0];
  const own = c.rep.elements.find((e) => e.id === s1.say.a)!.own ? s1.say.a : s1.say.b;
  const other = own === s1.say.a ? s1.say.b : s1.say.a;
  const gap = t.approach * t.radius;
  const x0 = SAFE + t.radius + 40;
  const x1 = FRAME.width - x0;
  const lower = CY + gap / 2;
  const upper = CY - gap / 2;
  const ownTrack = new Track(smooth([[x0, lower + t.spread], [CX, lower], [x1, lower + t.spread]], false, 32));
  const otherTrack = new Track(smooth([[x1, upper - t.spread], [CX, upper], [x0, upper - t.spread]], false, 32));
  const moveMs = c.rep.time.phases.length * t.stepMs;
  const tailMs = set ? 700 : 0;
  const duration = moveMs + tailMs;
  const ringAt = (k: number, n: number): Pt => {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
    return [CX + Math.cos(a) * t.ringRadius, CY + Math.sin(a) * t.ringRadius];
  };
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: [...c.rep.time.phases, ...(set ? ['possibilities'] : [])] },
    alt,
    coverage: coverage(
      c.rep,
      {
        s1: 'two paths that come close and go on, at one constant pace',
        s2: 'nothing is drawn between the two forms at their closest',
        q1: 'the other form is round, with no facing',
        q2: 'your form is round, with no facing',
        q3: 'the point of closest approach, where the possibilities gather',
        ...(set ? { [set.id]: 'equal translucent marks on a ring around that point, after the movement' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const u = ease.move(Math.min(1, ms / moveMs));
      const ownAt = ownTrack.at(u);
      const otherAt = otherTrack.at(u);
      const forms: SceneElement[] = t.shadows ? [contact(other, otherAt, t.radius, other), contact(own, ownAt, t.radius, own)] : [];
      if (t.traces) {
        forms.push(...trace('own-trace', ownTrack, u, true, [s1.id], 'The way you came: what any still frame shows of the passing.'));
        forms.push(...trace('other-trace', otherTrack, u, false, [s1.id], 'The way the other person came.'));
      }
      const marks: SceneElement[] = [];
      const g = set ? Math.min(1, Math.max(0, (ms - moveMs) / tailMs)) : 0;
      if (set && g > 0) {
        const n = set.say.options.length;
        for (let k = 0; k < n; k++) {
          const [x, y] = ringAt(k, n);
          marks.push(shape(`possible-${k + 1}`, { type: 'circle', cx: r2(x), cy: r2(y), r: r2(t.ringMark * ease.arrive(g)) }, { role: 'context', material: 'translucent', line: 'hair' }, [set.id, 'q3'], 'One of the possible explanations: equal in size, weight and distance to every other, none chosen.'));
        }
      }
      forms.push(...presence(other, otherAt, t.radius, false, [s1.id, 'q1'], 'The other person: round, with no facing, because what they noticed is open.'));
      forms.push(...presence(own, ownAt, t.radius, true, [s1.id, 'q2'], 'You: the area colour, the same size as the other; round, because what you did is open.'));
      const labels: SceneElement[] = t.labelForms
        ? [label('own-label', own, [r2(ownAt[0]), r2(ownAt[1] + t.radius + 20)], 'middle', [s1.id], 'Says which form is you.', { names: [own], halo: true })]
        : [];
      const layers: Layer[] = [
        { id: 'marks', plane: 'subject', elements: marks },
        { id: 'forms', plane: 'subject', elements: forms },
        { id: 'labels', plane: 'annotation', elements: labels },
      ];
      return composed(c, 'kinetic', layers, alt);
    },
  };
}

/** K5 sends, K10: a mark crosses the distance from a presence whose setting is open to the own presence, who feels it. */
function transmission(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'sends')[0];
  const s2 = find(c.rep, 'receives')[0];
  const s3 = find(c.rep, 'located-in')[0];
  const s4 = find(c.rep, 'apart')[0];
  const s5 = find(c.rep, 'feels')[0];
  const s6 = find(c.rep, 'holds')[0];
  const own = s1.say.to;
  const sender = s1.say.from;
  // K2: left to right in the order the statements first name them; s1 names the sender first.
  const senderAt: Pt = [SAFE + 140, CY - 80];
  const ownAt: Pt = [FRAME.width - SAFE - 220, CY + 60];
  const phoneAt: Pt = [ownAt[0] - t.radius - 18, ownAt[1] + 6];
  const arc = new Track(smooth([senderAt, [(senderAt[0] + phoneAt[0]) / 2, Math.min(senderAt[1], phoneAt[1]) - t.arcLift], phoneAt], false, 40));
  const duration = 3 * t.stepMs;
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['sent', 'read', 'felt'] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'a small mark crossing from the manager to you',
        [s2.id]: 'the mark reaches your phone, which takes your colour',
        [s3.id]: 'a soft plane around you, with no one else in it',
        [s4.id]: 'the distance across the frame',
        [s5.id]: 'a fine ring that closes a little around you and holds, as strong as the feeling you reported',
        [s6.id]: 'a small mark beside you',
        q1: 'the manager’s form is round, with no facing',
        q2: 'the manager’s place is only an outline, in the tentative dash',
      },
      {},
    ),
    compose(at: number) {
      const ms = at * duration;
      const sent = ease.move(Math.min(1, ms / t.stepMs));
      const read = ms >= t.stepMs ? 1 : 0;
      const felt = ease.arrive(Math.min(1, Math.max(0, (ms - 2 * t.stepMs) / t.stepMs)));
      const planes: SceneElement[] = [
        path('home', roundedRect(ownAt[0] - 40, ownAt[1] - 70, 190, 140, 28), { role: 'mid', material: 'tonal' }, [s3.id], 'Home: where you were, alone; no one else is in it.'),
        path('sender-place', roundedRect(senderAt[0] - 70, senderAt[1] - 50, 140, 100, 24), { role: 'context', line: 'hair', dash: 'tentative' }, ['q2'], 'Where the manager was: open, so only its outline, in the tentative dash.'),
      ];
      const forms: SceneElement[] = t.shadows ? [contact(sender, senderAt, t.secondaryRadius, sender), contact(own, ownAt, t.radius, own)] : [];
      if (t.traces && sent > 0.002) forms.push(path('reply-trace', polyline(arc.slice(0, sent)), { role: 'context', line: 'hair' }, [s1.id, s4.id], 'The way the reply came: across the distance between you.'));
      forms.push(...presence(sender, senderAt, t.secondaryRadius, false, [s1.id, 'q1'], 'The manager: smaller, because the moment is yours; round, because what they meant is open.'));
      const ring = 46 - 12 * s5.say.charge * felt;
      if (felt > 0) forms.push(shape('felt', { type: 'circle', cx: r2(ownAt[0]), cy: r2(ownAt[1]), r: r2(ring) }, { role: 'subject', line: 'hair' }, [s5.id], 'How it felt: a ring that closes a little around you and holds, attributed to you.'));
      forms.push(...presence(own, ownAt, t.radius, true, [s2.id, s3.id], 'You, at home.'));
      forms.push(path('phone', roundedRect(phoneAt[0] - 5, phoneAt[1] - 8, 10, 16, 2.5), read ? { role: 'subject', material: 'solid' } : { role: 'context', material: 'solid' }, [s6.id, s2.id], 'Your phone: it takes your colour once you have read the reply.'));
      if (sent < 1) {
        const [x, y] = arc.at(sent);
        forms.push(shape('reply', { type: 'circle', cx: r2(x), cy: r2(y), r: 5 }, { role: 'context', material: 'solid' }, [s1.id], 'The reply, on its way.'));
      }
      const labels: SceneElement[] = t.labelForms
        ? [
            label('own-label', own, [r2(ownAt[0]), r2(ownAt[1] + 48 + 14)], 'middle', [s3.id], 'Says which form is you.', { names: [own, 'home', ...(felt > 0 ? ['felt'] : [])], halo: true }),
            label('sender-label', sender, [r2(senderAt[0]), r2(senderAt[1] + t.secondaryRadius + 22)], 'middle', [s1.id], 'Says who sent it.', { names: [sender, 'sender-place'], halo: true, tone: 'label-soft' }),
          ]
        : [];
      return composed(c, 'kinetic', [
        { id: 'planes', plane: 'mid', elements: planes },
        { id: 'forms', plane: 'subject', elements: forms },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** K5 flows and cycles, joins: a form goes round the places once; what joins it rides with it; where its fate is open, it turns open. */
function cycle(c: StudyCase, t: KineticTuning): Figure {
  const s6 = find(c.rep, 'cycles')[0];
  const joins = find(c.rep, 'joins')[0];
  const flows = find(c.rep, 'flows');
  const fate = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'fate' && s.say.about === joins?.say.what);
  const through = s6.say.through;
  const places: Pt[] =
    t.layout === 'figure-eight'
      ? [[CX - 60, CY], [CX, SAFE + 70], [CX + 60, CY], [CX, FRAME.height - SAFE - 70]]
      : through.map((_, k) => {
          // Around one loop, from the left, clockwise (time runs left to right along the top).
          const a = Math.PI + (k / through.length) * Math.PI * 2;
          return [CX + Math.cos(a) * 300, CY + Math.sin(a) * 165] as Pt;
        });
  const via: Pt[] =
    t.layout === 'figure-eight'
      ? [places[0], [CX - 230, CY - 120], places[1], [CX + 230, CY - 120], places[2], [CX + 230, CY + 120], places[3], [CX - 230, CY + 120]]
      : places;
  const loop = new Track(smooth(via, true, 32));
  // Where along the loop each place is: the fraction of the loop's length at its point.
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
  const joinAt = joins ? fractions[through.indexOf(joins.say.at)] : 1;
  const nextAfterJoin = joins ? fractions[(through.indexOf(joins.say.at) + 2) % through.length] : 1;
  const duration = c.rep.time.phases.length * t.stepMs;
  const alt = altText(c);
  const cites = (id: string) => flows.filter((f) => f.say.from === id || f.say.to === id).map((f) => f.id);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: c.rep.time.phases },
    alt,
    coverage: coverage(
      c.rep,
      {
        ...Object.fromEntries(flows.map((f) => [f.id, `the form travels from ${f.say.from} to ${f.say.to}`])),
        [s6.id]: 'one lap of a closed way, back to where it began',
        ...(joins ? { [joins.id]: 'a small mark joins the form at the lungs and rides with it' } : {}),
        ...(fate ? { [fate.id]: 'past the body, the mark is drawn only as an outline in the tentative dash: kept or lost is not said' } : {}),
      },
      {},
    ),
    compose(at: number) {
      const u = Math.min(1, Math.max(0, at));
      // One lap from the first place: the loop's fraction shifted to start there.
      const start = fractions[0];
      const f = (start + ease.move(u)) % 1;
      const travelled = ease.move(u);
      const formAt = loop.at(f);
      const elements: SceneElement[] = [];
      through.forEach((id, k) => {
        elements.push(path(`place-${id}`, blob(places[k], 60, 36), { role: 'mid', material: 'tonal' }, cites(id), `${c.words[id] ?? id}: a place the blood passes through.`));
      });
      if (t.traces && travelled > 0.002) {
        const pts = travelled + start <= 1 ? loop.slice(start, start + travelled) : [...loop.slice(start, 1), ...loop.slice(0, start + travelled - 1)];
        elements.push(path('route', polyline(pts), { role: 'context', line: 'hair' }, [s6.id], 'The way the blood has gone so far.'));
      }
      elements.push(shape('blood', { type: 'circle', cx: r2(formAt[0]), cy: r2(formAt[1]), r: 13 }, { role: 'subject', material: 'lit', line: 'regular' }, [...flows.map((x) => x.id), s6.id], 'The blood: the one thing that moves.'));
      // The joined mark: from the lungs on; past the place after next (the body), its fate is open.
      if (joins) {
        const lapFromJoin = (joinAt - start + 1) % 1;
        const lapToOpen = (nextAfterJoin - start + 1) % 1 || 1;
        if (travelled >= lapFromJoin) {
          const open = !!fate && travelled >= lapToOpen;
          const m: Pt = [formAt[0] + 15, formAt[1] - 15];
          elements.push(
            shape('oxygen', { type: 'circle', cx: r2(m[0]), cy: r2(m[1]), r: 5 }, open ? { role: 'subject', line: 'fine', dash: 'tentative' } : { role: 'subject', material: 'solid' }, open ? [fate!.id] : [joins.id], open ? 'The oxygen past the body: an outline only, because the text doesn’t say whether it stays.' : 'The oxygen, taken up in the lungs and carried.'),
          );
        }
      }
      const labels: SceneElement[] = t.labelForms
        ? through.map((id, k) => {
            const below = places[k][1] >= CY - 1;
            return label(`label-${id}`, id, [r2(places[k][0]), r2(places[k][1] + (below ? 36 + 22 : -36 - 12))], 'middle', cites(id), 'Names the place.', { names: [`place-${id}`], halo: true });
          })
        : [];
      return composed(c, 'kinetic', [
        { id: 'loop', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

/** K5 waiting, K9, K11: work moves from what is finished to the barrier and holds; what it waits for comes partway and stops short. */
function blocked(c: StudyCase, t: KineticTuning): Figure {
  const s1 = find(c.rep, 'complete')[0];
  const s2 = find(c.rep, 'precedes')[0];
  const s3 = find(c.rep, 'depends-on')[0];
  const s4 = find(c.rep, 'absent')[0];
  const s5 = find(c.rep, 'waiting')[0];
  const s6 = find(c.rep, 'exchange-absent')[0];
  const q1 = c.rep.statements.find((s) => s.say.p === 'question' && s.say.asks === 'time')!;
  const [a, b] = [s2.say.a, s2.say.b];
  const w = 150;
  const h = 96;
  const aAt: Pt = [SAFE + 40 + w / 2, CY + 20];
  const bAt: Pt = [FRAME.width - SAFE - 40 - w / 2, CY + 20];
  const barrierX = (aAt[0] + w / 2 + bAt[0] - w / 2) / 2;
  const absentAt: Pt = [barrierX, CY - 110];
  const work = new Track([[aAt[0] + w / 2 + 14, aAt[1]], [barrierX - 16, aAt[1]]]);
  const coming = new Track([[barrierX, SAFE], [absentAt[0], absentAt[1] - 22]]);
  const duration = 3 * t.stepMs;
  const alt = altText(c);
  return {
    caseId: c.id,
    idiom: 'kinetic',
    axes: AXES,
    motion: { kind: 'timeline', duration, steps: ['finished', 'to the barrier', 'held'] },
    alt,
    coverage: coverage(
      c.rep,
      {
        [s1.id]: 'design: a filled form',
        [s2.id]: 'design on the left, build on the right: order runs left to right',
        [s3.id]: 'a barrier on the way between them',
        [s4.id]: 'the licence: an outline in the tentative dash, where it would be',
        [s5.id]: 'a mark of work moves to the barrier and holds',
        [q1.id]: 'the licence’s way in stops short and never arrives',
      },
      { [s6.id]: 'an exchange that didn’t happen is drawn as nothing (K6); procurement appears only in it, so isn’t drawn (K11)' },
    ),
    compose(at: number) {
      const ms = at * duration;
      const moved = ease.move(Math.min(1, Math.max(0, (ms - t.stepMs * 0.3) / (t.stepMs * 1.4))));
      const comingU = 0.72 * ease.move(Math.min(1, Math.max(0, (ms - t.stepMs) / (t.stepMs * 1.6))));
      const elements: SceneElement[] = [
        path(a, roundedRect(aAt[0] - w / 2, aAt[1] - h / 2, w, h, 18), { role: 'near', material: 'tonal' }, [s1.id, s2.id], 'Design: finished, so filled.'),
        path(b, roundedRect(bAt[0] - w / 2, bAt[1] - h / 2, w, h, 18), { role: 'context', line: 'regular' }, [s2.id, s5.id], 'Build: next, and not started, so an outline.'),
        shape('barrier', { type: 'line', x1: r2(barrierX), y1: r2(aAt[1] - 64), x2: r2(barrierX), y2: r2(aAt[1] + 64) }, { role: 'ink', line: 'bold' }, [s3.id], 'The dependency: build can’t start until the licence arrives.'),
        path('licence', roundedRect(absentAt[0] - 22, absentAt[1] - 15, 44, 30, 5), { role: 'context', line: 'fine', dash: 'tentative' }, [s4.id], 'The licence: not here yet, so only its outline, where it would be.'),
      ];
      if (comingU > 0.002) elements.push(path('licence-way', polyline(coming.slice(0, comingU)), { role: 'context', line: 'hair', dash: 'tentative' }, [q1.id], 'The licence’s way in: it stops short, because when it will arrive is open.'));
      if (t.traces && moved > 0.002) elements.push(path('work-trace', polyline(work.slice(0, moved)), { role: 'context', line: 'hair' }, [s5.id], 'The way the work has come.'));
      const [x, y] = work.at(moved);
      elements.push(shape('work', { type: 'circle', cx: r2(x), cy: r2(y), r: 7 }, { role: 'subject', material: 'solid' }, [s5.id], 'The work, held at the barrier.'));
      const labels: SceneElement[] = t.labelForms
        ? [
            label(`${a}-label`, a, [r2(aAt[0]), r2(aAt[1] + h / 2 + 24)], 'middle', [s1.id], 'Names the step.', { names: [a] }),
            label(`${b}-label`, b, [r2(bAt[0]), r2(bAt[1] + h / 2 + 24)], 'middle', [s2.id], 'Names the step.', { names: [b] }),
            label('licence-label', s3.say.on, [r2(absentAt[0] + 34), r2(absentAt[1] + 5)], 'start', [s4.id], 'Names what build waits for.', { names: ['licence'], tone: 'label-soft' }),
          ]
        : [];
      return composed(c, 'kinetic', [
        { id: 'plan', plane: 'subject', elements },
        { id: 'labels', plane: 'annotation', elements: labels },
      ], alt);
    },
  };
}

export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const R = Math.min(r, w / 2, h / 2);
  const f = r2;
  return `M${f(x + R)} ${f(y)}L${f(x + w - R)} ${f(y)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w)} ${f(y + R)}L${f(x + w)} ${f(y + h - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w - R)} ${f(y + h)}L${f(x + R)} ${f(y + h)}A${f(R)} ${f(R)} 0 0 1 ${f(x)} ${f(y + h - R)}L${f(x)} ${f(y + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + R)} ${f(y)}Z`;
}

/** A soft place: a rounded form, a little wider than tall. */
function blob(c: Pt, rx: number, ry: number): string {
  return polyline(
    smooth(
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const k = Math.pow(Math.abs(Math.cos(a)) ** 2.6 + Math.abs(Math.sin(a)) ** 2.6, -1 / 2.6);
        return [c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k] as Pt;
      }),
      true,
      6,
    ),
    true,
  );
}
