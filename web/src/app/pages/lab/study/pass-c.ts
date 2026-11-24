import { CASES, StudyCase } from './cases';
import type { Figure } from './idioms/contract';
import { IDIOMS } from './figures';
import { field } from './idioms/field';
import { kinetic } from './idioms/kinetic';
import { spatial } from './idioms/spatial';
import { samples } from './study-page';

/**
 * STUDY CODE, pass C (docs/visual-study/findings-pass-c.md): behavioural independence of the study's
 * rules. A case is rewritten with another domain's words only (ids, words, text, domain, source),
 * keeping its structure, and drawn by the same rules. If the rules depend only on structure, the two
 * drawings differ only in text. This tests the study's rules and contract, not the production engine.
 */
export interface Rewording {
  from: string;
  as: string;
  domain: StudyCase['domain'];
  text: string;
  /** Old element or option id → new id. */
  ids: Record<string, string>;
  /** New id → its word in the new domain. */
  words: Record<string, string>;
  possibilities?: readonly string[];
}

/** The twins, each worded as the other's domain. Structure is the source case's own. */
export const REWORDINGS: readonly Rewording[] = [
  {
    from: 'P3',
    as: 'P3 in planning words',
    domain: 'project management',
    text: 'The team sent the supplier an email, and the supplier hasn’t replied for a day.',
    ids: { own: 'team', friend: 'supplier', message: 'email', reply: 'confirmation' },
    words: { team: 'Team', supplier: 'Supplier', email: 'Email', confirmation: 'Confirmation' },
  },
  {
    from: 'M2',
    as: 'M2 in psychology words',
    domain: 'psychology',
    text: 'Your weekend plans depend on your friend answering, and they haven’t replied to your last two messages.',
    ids: { team: 'household', supplier: 'friend', launch: 'plans', confirmation: 'answer', email: 'message' },
    words: { household: 'You and yours', friend: 'Friend', plans: 'Weekend plans', answer: 'Answer', message: 'Messages' },
  },
  {
    from: 'P4',
    as: 'P4 in planning words',
    domain: 'project management',
    text: 'The client moves the design review without saying why.',
    ids: { own: 'lead', manager: 'client', meeting: 'review' },
    words: { lead: 'Lead', client: 'Client', review: 'Design review' },
  },
  {
    from: 'M3',
    as: 'M3 in psychology words',
    domain: 'psychology',
    text: 'My essay is two days late. It could be the noisy flat, the new medication, or just that I was ill.',
    ids: { build: 'essay', server: 'noise', upgrade: 'medication', sick: 'ill' },
    words: { essay: 'Essay', noise: 'The noisy flat', medication: 'The new medication', ill: 'Being ill' },
    possibilities: ['The noisy flat', 'The new medication', 'Being ill'],
  },
  {
    from: 'E1',
    as: 'E1 in water-cycle words',
    domain: 'education',
    text: 'The upper basin sends water to the marsh, where it takes up salt. It returns to the lower basin, which sends it out to the delta and back.',
    ids: { heart: 'valley', right: 'upper', lungs: 'marsh', left: 'lower', body: 'delta', blood: 'water', oxygen: 'salt' },
    words: { valley: 'Valley', upper: 'Upper basin', marsh: 'Marsh', lower: 'Lower basin', delta: 'Delta', water: 'Water', salt: 'Salt' },
  },
  {
    from: 'E2',
    as: 'E2 in circulation words',
    domain: 'education',
    text: 'Blood leaves the heart, changes in the lungs, is carried through the body, and returns to the heart.',
    ids: { sea: 'heart', sky: 'lungs', land: 'body', water: 'blood' },
    words: { heart: 'Heart', lungs: 'Lungs', body: 'Body', blood: 'Blood' },
  },
];

/** Rewrites every id the mapping names, anywhere in a value (statement fields, option lists). */
function swap<T>(v: T, ids: Record<string, string>): T {
  if (typeof v === 'string') return (ids[v] ?? v) as T;
  if (Array.isArray(v)) return v.map((x) => swap(x, ids)) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x, ids)])) as T;
  return v;
}

export function reworded(r: Rewording): StudyCase {
  const c = CASES.find((x) => x.id === r.from)!;
  const ids = r.ids;
  // Words for options the mapping doesn't name: a neutral word per option, so no source word survives.
  const optionWords = Object.fromEntries(
    Object.keys(c.words)
      .filter((k) => !(k in ids))
      .map((k, i) => [k, r.possibilities?.[i] ?? `Possibility ${i + 1}`]),
  );
  return {
    ...c,
    id: `${c.id}x`,
    domain: r.domain,
    source: `Pass C: ${r.as}`,
    text: r.text,
    words: { ...optionWords, ...r.words },
    possibilities: c.possibilities ? Object.values(optionWords) : undefined,
    rep: {
      ...c.rep,
      id: `${c.rep.id}x`,
      elements: c.rep.elements.map((e) => ({ ...e, id: ids[e.id] ?? e.id })),
      statements: c.rep.statements.map((s) => ({ ...s, say: swap(s.say, ids) })),
      facets: swap(c.rep.facets, ids),
    },
  };
}

export function drawn(c: StudyCase, idiom: (typeof IDIOMS)[number]): Figure {
  return idiom === 'spatial' ? spatial(c) : idiom === 'kinetic' ? kinetic(c) : field(c);
}

/** Keys whose string values are structure, not text: kept when two drawings are compared. */
const STRUCTURE = new Set(['kind', 'type', 'role', 'line', 'material', 'dash', 'plane', 'tone', 'anchor', 'facing', 'fill', 'stroke', 'scheme', 'theme', 'easing']);

/**
 * What a drawing is apart from its words: every number, in order, and the structural strings.
 * Ids, text, alt text and purposes become a placeholder, so only geometry, timing, motion and
 * style remain.
 */
export function geometry(v: unknown, key = ''): unknown {
  if (typeof v === 'string') return STRUCTURE.has(key) ? v : '§';
  if (Array.isArray(v)) return v.map((x) => geometry(x, key));
  // A map keyed by ids (a composition's `text`): its keys are words too, so only its values count.
  if (v && typeof v === 'object' && ID_KEYED.has(key)) return Object.values(v).map((x) => geometry(x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, geometry(x, k)]));
  return v;
}

const ID_KEYED = new Set(['text']);

export interface Equivalence {
  rewording: Rewording;
  idiom: (typeof IDIOMS)[number];
  /** Same motion kind, same samples, same axes. */
  sameMotion: boolean;
  /** The sample moments at which geometry differs. */
  differsAt: number[];
  /** Words of the source domain that survive in the rewritten drawing. */
  leaks: string[];
}

export function equivalence(r: Rewording): Equivalence[] {
  const source = CASES.find((x) => x.id === r.from)!;
  const twin = reworded(r);
  const sourceWords = Object.entries(source.words)
    .filter(([k]) => k in r.ids)
    .map(([, w]) => w);
  return IDIOMS.map((idiom) => {
    const a = drawn(source, idiom);
    const b = drawn(twin, idiom);
    const sameMotion = JSON.stringify(geometry(a.motion)) === JSON.stringify(geometry(b.motion)) && JSON.stringify(a.axes) === JSON.stringify(b.axes);
    const differsAt = samples(a).filter((at) => JSON.stringify(geometry(a.compose(at))) !== JSON.stringify(geometry(b.compose(at))));
    const text = samples(b)
      .map((at) => JSON.stringify(b.compose(at)))
      .join(' ') + b.alt;
    const leaks = sourceWords.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
    return { rewording: r, idiom, sameMotion, differsAt, leaks };
  });
}

/** The paths at which two drawings' geometry differs (first `max`), for the report. */
export function differences(a: unknown, b: unknown, max = 8, at = ''): string[] {
  const ga = geometry(a);
  const gb = geometry(b);
  const out: string[] = [];
  const walk = (x: unknown, y: unknown, p: string) => {
    if (out.length >= max) return;
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
      for (const k of keys) walk((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k], `${p}.${k}`);
    } else if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`${at}${p}: ${JSON.stringify(x)?.slice(0, 60)} ≠ ${JSON.stringify(y)?.slice(0, 60)}`);
  };
  walk(ga, gb, '');
  return out;
}
