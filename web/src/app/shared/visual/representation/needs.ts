import { Predicate, Representation, find } from './contract';

/**
 * S12: needs, in words (Stage 3, M3; written by the representation study's revision 5). Each returns
 * what a representation lacks for a pattern, or nothing. A pattern's `lacks` is built from these, and
 * the dispatch shows them in a refusal.
 */
type Has = { rep: Representation };

export const needs = {
  /** An established statement of this predicate. */
  a(c: Has, p: Predicate['p']): string[] {
    return find(c.rep, p).length ? [] : [`a '${p}' statement`];
  },
  /** A plural presence (a crowd, a group): an element with a count. */
  plural(c: Has): string[] {
    return c.rep.elements.some((e) => e.kind === 'presence' && e.count !== undefined) ? [] : ['a plural presence'];
  },
  /** The viewer's own presence. */
  own(c: Has): string[] {
    return c.rep.elements.some((e) => e.own) ? [] : ['the viewer’s own presence'];
  },
  /** A question of this kind. */
  question(c: Has, asks: string): string[] {
    return c.rep.statements.some((s) => s.say.p === 'question' && s.say.asks === asks) ? [] : [`a question about ${asks}`];
  },
  /** The field facet's quality. */
  quality(c: Has, q: string): string[] {
    return c.rep.facets.field?.quality === q ? [] : [`a field of ${q}`];
  },
  /** The space facet's place. */
  place(c: Has, place: string): string[] {
    return c.rep.facets.space?.place === place ? [] : [`a place reported as ${place}`];
  },
  all(...lists: string[][]): string[] {
    return lists.flat();
  },
};
