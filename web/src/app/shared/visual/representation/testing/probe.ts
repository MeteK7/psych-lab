import type { Asks, Predicate, Representation, Statement } from '../contract';
import type { Coverage } from '../invariants';

/**
 * S12: the structural probe (Stage 3, M3; written by the representation study, revision 8). One
 * synthetic statement of every kind, in each variant its predicate allows, is added to an accepted
 * representation; whatever draws it must then draw it and account for it, or refuse by a declared
 * need. Never fail. An application runs it over its own accepted cases, through its own dispatch.
 */
export type ProbeVariant = 'fresh' | 'reuse' | 'self' | 'repeat';
export type ProbeOutcome = 'shown' | 'declared not shown' | 'refused by declared need' | 'failed';

/** What the probe adds to: a representation, and the words beside it. */
export interface ProbeCase {
  rep: Representation;
  words: Readonly<Record<string, string>>;
}

type Role = 'presence' | 'object' | 'place' | 'process';

/** Each kind's element arguments (with the role a fresh element takes) and its other arguments. */
const SHAPES: Record<string, { roles: Record<string, Role>; rest?: Record<string, unknown>; list?: string }> = {
  passes: { roles: { a: 'presence', b: 'presence' } },
  'exchange-absent': { roles: { from: 'presence', to: 'presence' }, rest: { kind: 'note' } },
  sends: { roles: { from: 'presence', item: 'object', to: 'presence' } },
  receives: { roles: { who: 'presence', item: 'object' } },
  holds: { roles: { who: 'presence', what: 'object' } },
  'located-in': { roles: { what: 'object', place: 'place' } },
  apart: { roles: { a: 'presence', b: 'presence' } },
  feels: { roles: { who: 'presence' }, rest: { charge: 0.5 } },
  reacts: { roles: { who: 'presence' }, rest: { kind: 'none' } },
  flows: { roles: { what: 'object', from: 'place', to: 'place' } },
  joins: { roles: { what: 'object', into: 'object', at: 'place' } },
  cycles: { roles: { what: 'object' }, list: 'through' },
  'part-of': { roles: { part: 'object', whole: 'object' } },
  complete: { roles: { what: 'process' } },
  precedes: { roles: { a: 'process', b: 'process' } },
  'depends-on': { roles: { what: 'process', on: 'process' } },
  absent: { roles: { what: 'object' } },
  waiting: { roles: { what: 'process', for: 'object' } },
  contact: { roles: { a: 'object', b: 'object' } },
  displaced: { roles: { what: 'object', by: 'object' } },
  shifts: { roles: { what: 'process' }, rest: { later: true } },
  exceeds: { roles: { a: 'object', b: 'object' }, rest: { aspect: 'size' } },
  behind: { roles: { what: 'process' }, rest: { amount: 'a week' } },
  above: { roles: { a: 'place', b: 'place' } },
  transforms: { roles: { what: 'object', at: 'place' }, rest: { from: 'one state', to: 'another' } },
  form: { roles: { what: 'object' }, rest: { feature: 'round' } },
};
const ASKED: readonly Asks[] = ['attention', 'whether', 'cause', 'time', 'intent', 'setting', 'fate', 'motion'];

/** The kinds the probe adds: every drawable predicate it has a shape for, every question, a possibility set. */
export const KINDS: readonly string[] = [...Object.keys(SHAPES), ...ASKED.map((a) => `question:${a}`), 'alternatives'];
/** The kinds also added twice. */
export const REPEATED: readonly string[] = ['exceeds', 'cycles', 'flows', 'depends-on', 'question:cause', 'alternatives'];

/** The case with one (or, for `repeat`, two) synthetic statements of `kind` added. */
export function withSynthetic<C extends ProbeCase>(c: C, kind: string, variant: ProbeVariant, n = 1): { c: C; ids: string[] } {
  const elements = [...c.rep.elements];
  const words: Record<string, string> = { ...c.words };
  const statements: Statement[] = [...c.rep.statements];
  let fresh = 0;
  const make = (role: Role): string => {
    const id = `zz${++fresh}x${n}`;
    elements.push({ id, kind: role });
    words[id] = `Thing ${fresh}`;
    return id;
  };
  const reuse = (role: Role, avoid: string[]): string => {
    const pick = elements.find((e) => e.kind === role && !avoid.includes(e.id) && !e.id.startsWith('zz')) ?? elements.find((e) => !avoid.includes(e.id) && !e.id.startsWith('zz'));
    return pick ? pick.id : make(role);
  };
  const ids: string[] = [];
  for (let k = 0; k < (variant === 'repeat' ? 2 : 1); k++) {
    const id = `zz-s${k}-${kind}`;
    let say: Predicate;
    let commitment: Statement['commitment'] = 'reported';
    if (kind.startsWith('question:')) {
      const about = variant === 'reuse' || variant === 'self' ? reuse('object', []) : make('object');
      say = { p: 'question', about, asks: kind.slice(9) as Asks };
      commitment = 'unknown';
    } else if (kind === 'alternatives') {
      const qid = `zz-q${k}`;
      statements.push({ id: qid, say: { p: 'question', about: reuse('object', []), asks: 'cause' }, commitment: 'unknown', basis: 'synthetic' });
      words[`zz-o${k}a`] = 'One reading';
      words[`zz-o${k}b`] = 'Another reading';
      say = { p: 'alternatives', question: qid, options: [`zz-o${k}a`, `zz-o${k}b`], origin: 'source' };
      commitment = 'possible';
    } else {
      const shape = SHAPES[kind];
      const args: Record<string, unknown> = { ...(shape.rest ?? {}) };
      const used: string[] = [];
      let self: string | undefined;
      for (const [arg, role] of Object.entries(shape.roles)) {
        let el: string;
        if (variant === 'self') el = self ??= make(role);
        else if (variant === 'reuse') el = reuse(role, used);
        else el = make(role);
        used.push(el);
        args[arg] = el;
      }
      if (shape.list) args[shape.list] = variant === 'self' ? [self ?? make('place')] : variant === 'reuse' ? [reuse('place', []), reuse('place', [reuse('place', [])])] : [make('place'), make('place')];
      if (kind === 'reacts') args['to'] = statements[0].id;
      say = { p: kind, ...args } as unknown as Predicate;
    }
    statements.push({ id, say, commitment, basis: 'synthetic (revision-8 probe)' });
    ids.push(id);
  }
  return { c: { ...c, words, rep: { ...c.rep, elements, statements } }, ids };
}

/** Which variants a kind allows: `self` only where it has two element roles or a list. */
export function variantsOf(kind: string): ProbeVariant[] {
  if (kind.startsWith('question:') || kind === 'alternatives') return ['fresh', 'reuse'];
  const shape = SHAPES[kind];
  const many = Object.keys(shape.roles).length + (shape.list ? 1 : 0) >= 2 || !!shape.list;
  return many ? ['fresh', 'reuse', 'self'] : ['fresh', 'reuse'];
}

/** Every run over one case: each kind in each of its variants, then the repeated kinds twice. */
export function runs(): [string, ProbeVariant][] {
  return [...KINDS.flatMap((k) => variantsOf(k).map((v): [string, ProbeVariant] => [k, v])), ...REPEATED.map((k): [string, ProbeVariant] => [k, 'repeat'])];
}

/** What a draw gave, as the probe reads it: a figure and the patterns that failed, or a refusal. */
export type Drawing = { figure: { coverage: Coverage }; choice: { pattern: string; failed?: readonly { pattern: string; reason: string }[] } } | { refusal: { tried: readonly { pattern: string; lacks: readonly string[] }[] } };

/** The outcome for the synthetic statement `id`: drawn and accounted for, refused by a declared need, or failed. */
export function outcomeOf(draw: () => Drawing, id: string): { outcome: ProbeOutcome; note: string } {
  let d: Drawing;
  try {
    d = draw();
  } catch (e) {
    return { outcome: 'failed', note: String(e).slice(0, 200) };
  }
  if ('refusal' in d) {
    const fails = d.refusal.tried.filter((x) => x.lacks.some((l) => l.includes('fails on this case')));
    return fails.length ? { outcome: 'failed', note: fails.map((x) => `${x.pattern}: ${x.lacks.find((l) => l.includes('fails on this case'))}`).join('; ') } : { outcome: 'refused by declared need', note: '' };
  }
  if (d.choice.failed?.length) return { outcome: 'failed', note: d.choice.failed.map((f) => `${f.pattern}: ${f.reason}`).join('; ') };
  if (d.figure.coverage.shown.some((x) => x.id === id)) return { outcome: 'shown', note: d.choice.pattern };
  if (d.figure.coverage.notShown.some((x) => x.id === id)) return { outcome: 'declared not shown', note: d.choice.pattern };
  return { outcome: 'failed', note: `drawn by ${d.choice.pattern} but ${id} not in its coverage` };
}
