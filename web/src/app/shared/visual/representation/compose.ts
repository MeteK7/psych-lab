import type { Layer, SceneElement } from '../composition/scene';
import type { V3 } from '../generation/spatial/camera';
import { label, path, r2, shape } from './kit/elements';
import { form2d, formOf, solid } from './kit/forms';
import { Pt, circlePath, polyline } from './kit/paths';
import { FRAME, Space } from './kit/spatial';
import { PredicateName, Statement, drawable, isEstablished } from './contract';
import { EngineIdiom, Figure, SAFE, Subject, composed, coverage } from './setting';
import { dependencyField, dependencyKinetic, dependencyLacks, dependencySpatial } from './patterns/dependency';
import { FIELD_RULES, FieldTuning, headingElements, headings } from './idioms/field';
import { feltField, feltKinetic, feltLacks, feltSpatial } from './patterns/felt';
import { KINETIC_RULES, KineticTuning, ring, roundedRect } from './idioms/kinetic';
import { motionField, motionFieldLacks, motionKinetic, motionLacks, motionSpatial } from './patterns/motion';
import { SPATIAL_RULES, SpatialTuning } from './idioms/spatial';
import { DEPENDENCY, FELT, Lists, MOTION } from './patterns/lists';

/**
 * S12: composition across patterns (Stage 3, M3; written by the representation study, revision 7,
 * findings-revision-7.md). When no single pattern
 * can draw a case, one pattern (the base) draws the statements it can, and small general additions
 * draw each remaining statement onto the elements the base placed. A new element (one the base didn't
 * place) is set in free space beside what its statement relates it to: room, not nearness. Composition
 * is tried only when no single pattern is able, so no figure a single pattern draws can change.
 */

/** The predicates an addition can draw, by idiom (registered with the dispatch: general.ts). */
export const ADDS: Record<EngineIdiom, readonly PredicateName[]> = {
  kinetic: ['located-in', 'part-of', 'depends-on', 'waiting', 'question', 'alternatives', 'form'],
  field: ['located-in', 'part-of', 'depends-on', 'waiting', 'question', 'alternatives', 'form'],
  spatial: ['located-in', 'part-of', 'depends-on', 'waiting', 'question', 'alternatives', 'form'],
};

/** A general pattern that can serve as a composition's base, in each of the engine's idioms. */
export interface GeneralBase {
  name: string;
  /** What its coverage accounts for, as a base (draws.ts). */
  lists: Lists;
  /** The statements this base draws, of a case. */
  domain(c: Subject): Statement[];
  lacks(c: Subject): string[];
  kinetic(c: Subject, t: KineticTuning): Figure;
  spatial(c: Subject, t: SpatialTuning): Figure;
  field(c: Subject, t: FieldTuning): Figure;
}

const established = (c: Subject) => drawable(c.rep).filter((s) => isEstablished(s));
const questionsAbout = (c: Subject, ids: readonly string[], asks?: readonly string[]) =>
  drawable(c.rep).filter((s) => s.say.p === 'question' && ids.includes(s.say.about) && (!asks || asks.includes(s.say.asks)));

/** The bases, in the order that breaks ties. Lazily, because the idioms and this module import each other. */
export const bases = (): readonly GeneralBase[] => [
  {
    name: 'motion',
    lists: MOTION,
    domain: (c) => {
      const own = established(c).filter((s) => ['flows', 'above', 'contact', 'displaced', 'form'].includes(s.say.p));
      const movers = own.flatMap((s) => (s.say.p === 'flows' ? [s.say.what] : s.say.p === 'displaced' ? [s.say.what, s.say.by] : []));
      const places = own.flatMap((s) => (s.say.p === 'flows' ? [s.say.from, s.say.to] : []));
      // Forms of things the base doesn't place are left to the additions.
      return [...own.filter((s) => s.say.p !== 'form' || [...movers, ...places].includes(s.say.what)), ...questionsAbout(c, movers, ['fate', 'motion'])];
    },
    lacks: motionLacks,
    kinetic: motionKinetic,
    spatial: motionSpatial,
    field: motionField,
  },
  {
    name: 'dependency',
    lists: DEPENDENCY,
    domain: (c) => {
      const deps = established(c).filter((s) => s.say.p === 'depends-on');
      if (!deps.length) return [];
      const d = deps[0];
      return [d, ...established(c).filter((s) => ['part-of', 'complete', 'located-in'].includes(s.say.p)), ...questionsAbout(c, [d.say.p === 'depends-on' ? d.say.on : ''])];
    },
    lacks: dependencyLacks,
    kinetic: dependencyKinetic,
    spatial: dependencySpatial,
    field: dependencyField,
  },
  {
    name: 'felt',
    lists: FELT,
    domain: (c) => {
      const own = c.rep.elements.find((e) => e.own)?.id;
      const feels = established(c).filter((s) => s.say.p === 'feels' && s.say.who === own);
      if (!feels.length) return [];
      const set = drawable(c.rep).find((s) => s.say.p === 'alternatives');
      const ask = set && set.say.p === 'alternatives' ? set.say.question : undefined;
      const q = ask ? drawable(c.rep).find((s) => s.id === ask) : undefined;
      return [...feels, ...established(c).filter((s) => s.say.p === 'located-in' && s.say.what === own), ...(set ? [set] : []), ...(q ? [q] : [])];
    },
    lacks: feltLacks,
    kinetic: feltKinetic,
    spatial: feltSpatial,
    field: feltField,
  },
];

/**
 * What a base lacks in an idiom, beyond its lists (which the engine reads), given its narrowed case
 * and the statements left to the additions.
 */
export function baseLacks(b: GeneralBase, idiom: EngineIdiom, sub: Subject, rest: readonly Statement[]): string[] {
  const own = idiom === 'field' && b.name === 'motion' ? motionFieldLacks(sub) : b.lacks(sub);
  const fieldQuality = idiom === 'field' && b.name === 'felt' && sub.rep.facets.field?.quality !== 'agitation' ? ['a field of agitation'] : [];
  const fieldClarity = idiom === 'field' && b.name === 'dependency' && sub.rep.facets.field?.quality !== 'clarity' ? ['a field of clarity'] : [];
  // A second place can't be set inside the room the felt pattern builds: it would say the thing is there.
  const roomed = idiom === 'spatial' && b.name === 'felt' && rest.some((s) => s.say.p === 'located-in') ? ['a second place beside a built room (the spatial idiom would put it inside the room)'] : [];
  return [...own, ...fieldQuality, ...fieldClarity, ...roomed];
}

export interface Composition {
  base: string;
  /** The statements drawn by additions. */
  added: string[];
}

/**
 * The composed figure: the base, drawn on its narrowed representation, with the additions drawing the
 * rest. The dispatch chooses the base and narrows the representation (dispatch.ts); this draws what it chose.
 */
export function drawComposition(c: Subject, idiom: EngineIdiom, finish: object, plan: { base: GeneralBase; rest: readonly Statement[]; sub: Subject }): Figure & { composition: Composition } {
  const { base, rest, sub } = plan;
  const alt = c.setting.alt(c.rep);
  const shown: Record<string, string> = {};
  const notShown: Record<string, string> = {};
  const adds = new AddedDrawing(c, rest, shown, notShown);
  let figure: Figure;
  if (idiom === 'spatial') {
    figure = base.spatial(sub, { ...SPATIAL_RULES, ...finish, add3: (space, anchors) => adds.spatial(space, anchors) } as SpatialTuning);
    // A dry compose fills the coverage of the additions.
    figure.compose(0);
  } else {
    figure = idiom === 'kinetic' ? base.kinetic(sub, { ...KINETIC_RULES, ...finish } as KineticTuning) : base.field(sub, { ...FIELD_RULES, ...finish } as FieldTuning);
    adds.flat(idiom, figure.compose(figure.motion.kind === 'timeline' ? 1 : 0).scene.layers, 1, idiom === 'field' ? ({ ...FIELD_RULES, ...finish } as FieldTuning) : undefined);
  }
  const merged = coverage(
    c.rep,
    { ...Object.fromEntries(figure.coverage.shown.map((x) => [x.id, x.how])), ...shown },
    { ...Object.fromEntries(figure.coverage.notShown.map((x) => [x.id, x.why])), ...notShown },
  );
  return {
    ...figure,
    alt,
    coverage: merged,
    composition: { base: base.name, added: rest.map((s) => s.id) },
    compose(at: number) {
      const out = figure.compose(at);
      const extra = { ...out.text } as Record<string, string>;
      delete extra['alt'];
      if (idiom === 'spatial') return composed(c, idiom, out.scene.layers, alt, extra);
      const layers = adds.flat(idiom, out.scene.layers, at, idiom === 'field' ? ({ ...FIELD_RULES, ...finish } as FieldTuning) : undefined);
      return composed(c, idiom, layers, alt, extra);
    },
  };
}

interface Box { x0: number; y0: number; x1: number; y1: number }

/** A path's endpoint coordinates (M, L, H, V, C, S, Q, T, A; relative forms too). */
function pathPoints(d: string): Pt[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const count: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
  const out: Pt[] = [];
  let [x, y] = [0, 0];
  let cmd = 'M';
  let i = 0;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const up = cmd.toUpperCase();
    const n = count[up] ?? 0;
    if (n === 0) continue;
    const args = tokens.slice(i, i + n).map(Number);
    if (args.length < n || args.some((v) => Number.isNaN(v))) break;
    i += n;
    const rel = cmd !== up;
    if (up === 'H') x = rel ? x + args[0] : args[0];
    else if (up === 'V') y = rel ? y + args[0] : args[0];
    else {
      const [ex, ey] = [args[n - 2], args[n - 1]];
      x = rel ? x + ex : ex;
      y = rel ? y + ey : ey;
    }
    out.push([x, y]);
    if (up === 'M') cmd = rel ? 'l' : 'L';
  }
  return out;
}

/** Where each element sits in a flat figure (its shape's centre, else its label's place), and the boxes drawn. */
function anchors2d(layers: readonly Layer[]): { at: Record<string, Pt>; boxes: Box[] } {
  const at: Record<string, Pt> = {};
  const boxes: Box[] = [];
  const boxOf = (e: SceneElement): Box | null => {
    if (e.kind === 'label') return null;
    const g = (e as { geometry?: { type: string; cx?: number; cy?: number; r?: number; x1?: number; y1?: number; x2?: number; y2?: number; d?: string } }).geometry;
    if (!g) return null;
    if (g.type === 'circle') return { x0: g.cx! - g.r!, y0: g.cy! - g.r!, x1: g.cx! + g.r!, y1: g.cy! + g.r! };
    if (g.type === 'line') return { x0: Math.min(g.x1!, g.x2!), y0: Math.min(g.y1!, g.y2!), x1: Math.max(g.x1!, g.x2!), y1: Math.max(g.y1!, g.y2!) };
    if (g.type === 'path' && g.d) {
      const pts = pathPoints(g.d);
      if (!pts.length) return null;
      return { x0: Math.min(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), x1: Math.max(...pts.map((p) => p[0])), y1: Math.max(...pts.map((p) => p[1])) };
    }
    return null;
  };
  for (const l of layers)
    for (const e of l.elements) {
      const b = boxOf(e);
      if (!b) continue;
      boxes.push(b);
      const p: Pt = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
      at[e.id] ??= p;
      at[e.id.replace(/-\d+$/, '')] ??= p;
    }
  for (const l of layers) for (const e of l.elements) if (e.kind === 'label' && !at[e.text]) at[e.text] = [e.at[0], e.at[1] - 24];
  return { at, boxes };
}

const STEP = 150;
const AROUND: readonly Pt[] = [[1, 0], [0, -1], [-1, 0], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1]];

/** The additions, drawn onto what a base placed. */
class AddedDrawing {
  constructor(
    private readonly c: Subject,
    private readonly rest: readonly Statement[],
    private readonly shown: Record<string, string>,
    private readonly notShown: Record<string, string>,
  ) {}

  /** New elements' places, set once (from the figure's last moment) so nothing jumps while it plays. */
  private readonly placed: Record<string, Pt> = {};

  /** A free place beside `near`: its own box (with room for a label) clear of everything drawn, inside the frame. */
  private free(near: Pt, boxes: readonly Box[]): Pt {
    const clear = (p: Pt) => boxes.every((b) => p[0] + 80 < b.x0 || p[0] - 80 > b.x1 || p[1] + 70 < b.y0 || p[1] - 70 > b.y1);
    for (const step of [STEP, STEP * 1.5, STEP * 2, STEP * 2.6])
      for (const [dx, dy] of AROUND) {
        const p: Pt = [near[0] + dx * step, near[1] + dy * step * 0.7];
        if (p[0] < SAFE + 80 || p[0] > FRAME.width - SAFE - 80 || p[1] < SAFE + 60 || p[1] > FRAME.height - SAFE - 60) continue;
        if (clear(p)) return p;
      }
    return [FRAME.width - SAFE - 90, SAFE + 70];
  }

  /** The kinetic and field additions, drawn on a flat figure's layers. */
  flat(idiom: 'kinetic' | 'field', layers: readonly Layer[], at: number, ft?: FieldTuning): Layer[] {
    const { at: a, boxes } = anchors2d(layers);
    const taken = Object.values(a);
    const placed = this.placed;
    const occupied: Box[] = [...boxes];
    const drawnNow = new Set<string>();
    const forms: SceneElement[] = [];
    const below: SceneElement[] = [];
    const labels: SceneElement[] = [];
    const c = this.c;
    const field = idiom === 'field';
    const anyAnchor = (): Pt => taken[0] ?? [FRAME.width / 2, FRAME.height / 2];
    const where = (id: string, near: Pt | undefined, cites: string[], open: boolean): Pt => {
      if (a[id] && !placed[id]) return a[id];
      if (drawnNow.has(id)) return placed[id];
      const p = placed[id] ?? this.free(near ?? anyAnchor(), occupied);
      placed[id] = p;
      drawnNow.add(id);
      occupied.push({ x0: p[0] - 75, y0: p[1] - 60, x1: p[0] + 75, y1: p[1] + 60 });
      const form = formOf(c, id);
      if (field) forms.push(shape(`${id}-added`, { type: 'circle', cx: r2(p[0]), cy: r2(p[1]), r: 5 }, open ? { role: 'context', line: 'fine', dash: 'tentative' } : { role: 'context', material: 'solid' }, cites, open ? 'Only open statements concern it: drawn open.' : 'Placed beside, for room, not because the text says near.'));
      else forms.push(form2d(`${id}-added`, form, p, 18, open ? { role: 'context', line: 'fine', dash: 'tentative' } : { role: 'near', material: 'tonal' }, [...cites, ...form.cites], open ? 'Only open statements concern it: drawn open.' : 'Placed beside, for room, not because the text says near.'));
      labels.push(label(`${id}-added-label`, id, [r2(p[0]), r2(p[1] + 34)], 'middle', cites, 'Names it.'));
      // Stage 3, M2 (found by the engine's coverage check): a field draws an added thing as a plain mark,
      // so its form is declared not shown (below), never claimed as drawn.
      if (!field) for (const f of form.cites) this.shown[f] = 'the added thing is drawn with this form';
      return p;
    };
    for (const s of this.rest) {
      const say = s.say;
      switch (say.p) {
        case 'located-in': {
          if (a[say.place] && a[say.what]) {
            this.shown[s.id] = 'it is drawn at that place by the base pattern';
            break;
          }
          const p = where(say.what, undefined, [s.id], false);
          if (field) labels.push(label(`${s.id}-place`, say.place, [r2(p[0]), r2(p[1] - 24)], 'middle', [s.id], 'Names where it is.', { tone: 'label-soft' }));
          else {
            below.push(path(`${s.id}-place`, roundedRect(p[0] - 70, p[1] - 52, 140, 104, 20), { role: 'mid', material: 'tonal' }, [s.id], 'Where it is.'));
            labels.push(label(`${s.id}-place-label`, say.place, [r2(p[0]), r2(p[1] - 62)], 'middle', [s.id], 'Names where it is.', { tone: 'label-soft' }));
          }
          this.shown[s.id] = field ? 'its place named beside it (a field doesn’t place things)' : 'a soft plane named for the place, around it (placed for room, not nearness)';
          break;
        }
        case 'part-of': {
          const p = where(say.part, undefined, [s.id], false);
          below.push(path(`${s.id}-whole`, roundedRect(p[0] - 80, p[1] - 58, 160, 116, 22), { role: 'context', line: 'hair' }, [s.id], 'The whole it is part of.'));
          labels.push(label(`${s.id}-whole-label`, say.whole, [r2(p[0] - 74), r2(p[1] - 66)], 'start', [s.id], 'Names the whole.', { tone: 'label-soft' }));
          this.shown[s.id] = 'an outline around it, named for the whole (C9)';
          break;
        }
        case 'depends-on': {
          const p = where(say.what, a[say.on], [s.id], false);
          const q = where(say.on, p, [s.id], false);
          if (field) forms.push(path(`${s.id}-lanes`, [-6, 0, 6].map((d) => polyline([[p[0], p[1] + d], [q[0], q[1] + d * 0.4]])).join(''), { role: 'subject', line: 'hair' }, [s.id], 'What depends on what: lanes from one towards the other.'));
          else forms.push(path(`${s.id}-line`, polyline([p, q]), { role: 'context', line: 'fine' }, [s.id], 'What depends on what.'));
          this.shown[s.id] = field ? 'lanes from what depends towards what it depends on' : 'a fine line from what depends to what it depends on';
          break;
        }
        case 'waiting': {
          const p = where(say.what, undefined, [s.id], false);
          const q = a[say.for] ?? placed[say.for] ?? where(say.for, p, [s.id], false);
          const stop: Pt = [p[0] + (q[0] - p[0]) * 0.55, p[1] + (q[1] - p[1]) * 0.55];
          forms.push(path(`${s.id}-held`, polyline([p, stop]), { role: 'context', line: 'fine', dash: 'tentative' }, [s.id], 'It waits: the way stops short, held.'));
          forms.push(shape(`${s.id}-boundary`, { type: 'line', x1: r2(stop[0]), y1: r2(stop[1] - 18), x2: r2(stop[0]), y2: r2(stop[1] + 18) }, { role: 'context', line: 'fine', dash: 'tentative' }, [s.id], 'Where it is held.'));
          this.shown[s.id] = 'its way towards what it waits for stops short at a boundary, in the tentative dash';
          break;
        }
        case 'question': {
          const p = where(say.about, undefined, [s.id], !this.rest.some((x) => x.id !== s.id && isEstablished(x) && Object.values(x.say).includes(say.about)) && !a[say.about]);
          forms.push(path(`${s.id}-open`, circlePath(p, 34), { role: 'context', line: 'fine', dash: 'tentative' }, [s.id], 'Something about it is open.'));
          this.shown[s.id] = 'an open ring around what it asks about';
          break;
        }
        case 'alternatives': {
          const q = drawable(c.rep).find((x) => x.id === say.question);
          const about = q && q.say.p === 'question' ? q.say.about : undefined;
          const p = about ? where(about, undefined, [s.id], true) : anyAnchor();
          if (field && ft) forms.push(...headingElements(headings(p, say.options.length, ft, () => true, 120), 1, s, q ? [q.id] : []));
          else forms.push(...ring(s, [p[0] + 70, p[1] - 40], 34, 8, Math.min(1, Math.max(0, (at - 0.8) / 0.2)), q ? [q.id] : []));
          this.shown[s.id] = field ? `${say.options.length} headings of equal strength from what it is about` : 'equal translucent marks on a ring beside what it is about, at the end';
          break;
        }
        case 'form': {
          if (placed[say.what] || !a[say.what]) where(say.what, undefined, [s.id], false);
          else if (field) this.notShown[s.id] = 'a field carries qualities, not forms';
          else this.notShown[s.id] = 'the base pattern draws this thing without forms';
          if (field && !this.notShown[s.id]) this.notShown[s.id] = 'a field carries qualities, not forms';
          break;
        }
      }
    }
    return [
      ...layers.map((l) => (l.plane === 'mid' ? { ...l, elements: [...below, ...l.elements] } : l.plane === 'subject' ? { ...l, elements: [...l.elements, ...forms] } : l.plane === 'annotation' ? { ...l, elements: [...l.elements, ...labels] } : l)),
      ...(layers.some((l) => l.plane === 'mid') ? [] : [{ id: 'added-planes', plane: 'mid', elements: below } as Layer]),
    ];
  }

  /** The spatial additions, drawn into the base's space. */
  spatial(space: Space, anchors: Readonly<Record<string, V3>>): SceneElement[] {
    const c = this.c;
    const placed: Record<string, V3> = {};
    const labels: SceneElement[] = [];
    const taken = () => [...Object.values(anchors), ...Object.values(placed)];
    const free = (near: V3): V3 => {
      for (const step of [2.2, 3.2, 4.2])
        for (const [dx, dz] of [[0, -1], [1, 0], [-1, 0], [0, 1]] as const) {
          const p: V3 = [near[0] + dx * step, 0, near[2] + dz * step * 0.7];
          if (taken().every((q) => Math.hypot(q[0] - p[0], q[2] - p[2]) > 1.3)) return p;
        }
      return [near[0], 0, near[2] - 2.2];
    };
    const any = (): V3 => Object.values(anchors)[0] ?? [0, 0, 0];
    const where = (id: string, near: V3 | undefined, cites: string[]): V3 => {
      if (anchors[id]) return anchors[id];
      if (placed[id]) return placed[id];
      const p = free(near ?? any());
      placed[id] = p;
      const form = formOf(c, id);
      solid(space, `${id}-added`, form, p, 0.5, cites, 'Placed beside, for room, not because the text says near.');
      const at = space.anchor([p[0], 0.85, p[2]], 0);
      if (at) labels.push(label(`${id}-added-label`, id, at, 'middle', cites, 'Names it.', { halo: true }));
      for (const f of form.cites) this.shown[f] = 'the added thing is drawn with this form';
      return p;
    };
    for (const s of this.rest) {
      const say = s.say;
      switch (say.p) {
        case 'located-in': {
          if (anchors[say.place] && anchors[say.what]) {
            this.shown[s.id] = 'it is drawn at that place by the base pattern';
            break;
          }
          const p = where(say.what, undefined, [s.id]);
          space.face(`${s.id}-place`, [[p[0] - 0.9, 0.004, p[2] - 0.7], [p[0] + 0.9, 0.004, p[2] - 0.7], [p[0] + 0.9, 0.004, p[2] + 0.7], [p[0] - 0.9, 0.004, p[2] + 0.7]], [0, 1, 0], { role: 'mid', material: 'shaded', facing: 'lit' }, [s.id], 'Where it is.', 0);
          const at = space.anchor([p[0], 0, p[2] - 0.9], 0);
          if (at) labels.push(label(`${s.id}-place-label`, say.place, at, 'middle', [s.id], 'Names where it is.', { tone: 'label-soft', halo: true }));
          this.shown[s.id] = 'a patch of ground named for the place, with it on it (placed for room, not nearness)';
          break;
        }
        case 'part-of': {
          const p = where(say.part, undefined, [s.id]);
          space.outline(`${s.id}-whole`, [[p[0] - 1, 0.006, p[2] - 0.9], [p[0] + 1, 0.006, p[2] - 0.9], [p[0] + 1, 0.006, p[2] + 0.9], [p[0] - 1, 0.006, p[2] + 0.9]], { role: 'context', line: 'hair' }, [s.id], 'The whole it is part of.');
          this.shown[s.id] = 'an outline on the ground around it, for the whole (C9)';
          break;
        }
        case 'depends-on': {
          const p = where(say.what, anchors[say.on], [s.id]);
          const q = where(say.on, p, [s.id]);
          space.outline(`${s.id}-line`, [[p[0], 0.01, p[2]], [q[0], 0.01, q[2]]], { role: 'context', line: 'fine' }, [s.id], 'What depends on what.', false);
          this.shown[s.id] = 'a line on the ground from what depends to what it depends on';
          break;
        }
        case 'waiting':
          this.notShown[s.id] = 'a still scene of the facts has no form for waiting: it is in the words beside it';
          break;
        case 'question':
          this.notShown[s.id] = 'nothing in a still scene of the facts says this';
          break;
        case 'alternatives':
          this.notShown[s.id] = 'a still scene of the facts has no place for possibilities: they are listed beside it';
          break;
        case 'form':
          if (!anchors[say.what]) where(say.what, undefined, [s.id]);
          else this.notShown[s.id] = 'the base pattern draws this thing without forms';
          break;
      }
    }
    return labels;
  }
}
