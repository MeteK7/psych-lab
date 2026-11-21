import type { Composed } from '../../../../shared/visual/composition/compose';
import { composeScene } from '../../../../shared/visual/composition/compose';
import type { Layer } from '../../../../shared/visual/composition/scene';
import type { StudyCase } from '../cases';
import { FRAME } from '../kit/spatial';
import { Representation, Statement, drawable, element, isEstablished, statement } from '../representation';

/**
 * STUDY CODE: the idiom contract (representation-v0.md §6). An idiom turns a representation into a
 * figure: a composition at any moment or viewpoint, a text alternative written from the statements,
 * a coverage report and its values on the five axes.
 */
export type IdiomId = 'spatial' | 'kinetic' | 'field';

export interface Axes {
  space: 'flat' | 'spatial';
  time: 'still' | 'moving';
  substance: 'forms' | 'field';
  mode: 'direct' | 'metaphorical';
  viewpoint: 'fixed' | 'movable';
}

export type Motion =
  /** Plays once when asked, over `duration` ms; `at` runs 0 to 1. */
  | { kind: 'timeline'; duration: number; steps: readonly string[] }
  /** A native slider moves the view between stances; `at` runs 0 to positions − 1. */
  | { kind: 'viewpoint'; positions: readonly string[] }
  | { kind: 'still' };

export interface Coverage {
  shown: { id: string; how: string }[];
  notShown: { id: string; why: string }[];
}

export interface Figure {
  caseId: StudyCase['id'];
  idiom: IdiomId;
  axes: Axes;
  motion: Motion;
  /** The composition at `at` (see Motion). */
  compose(at: number): Composed;
  alt: string;
  coverage: Coverage;
}

export const SAFE = Math.round(FRAME.height * 0.06);

/** A composition from layers, in the case's theme, sized to the study frame. */
export function composed(c: StudyCase, idiom: IdiomId, layers: readonly Layer[], alt: string, text: Record<string, string> = {}): Composed {
  return composeScene(
    {
      id: `study.${c.id.toLowerCase()}.${idiom}`,
      version: 1,
      theme: c.theme,
      size: FRAME,
      layers,
      alt,
      seed: `study-${c.id}-${idiom}`,
    },
    { ...c.words, ...text },
  );
}

/** The words for an element, in running text ("you" for the own presence). */
export function word(c: StudyCase, id: string): string {
  if (id === 'team') return 'the team';
  const e = c.rep.elements.find((x) => x.id === id);
  if (e?.own) return 'you';
  const w = c.words[id] ?? id;
  return e?.kind === 'presence' || e?.kind === 'place' || e?.kind === 'object' || e?.kind === 'process' ? `the ${w.toLowerCase()}` : w.toLowerCase();
}

/** One established statement as a clause, from its predicate only (rule C6). */
function clause(c: StudyCase, s: Statement): string | null {
  const w = (id: string) => word(c, id);
  const say = s.say;
  switch (say.p) {
    case 'passes': {
      if (!say.mover) return `${w(say.a)} and ${w(say.b)} pass each other`;
      const by = say.mover === say.a ? say.b : say.a;
      return `${w(say.mover)} walks past ${w(by)}`;
    }
    case 'exchange-absent': return `there is no ${say.kind} from ${w(say.from)}`;
    case 'sends': return `${w(say.from)} sends ${w(say.item)} to ${w(say.to)}`;
    case 'receives': return `${w(say.who)} ${say.who === 'own' ? 'read' : 'reads'} it`;
    case 'holds': return `${w(say.who)} ${say.who === 'own' ? 'hold' : 'holds'} ${w(say.what)}`;
    case 'located-in': return `${w(say.what)} ${say.what === 'own' ? 'are' : 'is'} at ${(c.words[say.place] ?? say.place).toLowerCase()}${say.alone ? ', alone' : ''}`;
    case 'apart': return `${w(say.a)} and ${w(say.b)} are in different places`;
    case 'feels': return `it presses on ${w(say.who)}, as ${w(say.who)} said`;
    case 'flows': return `${w(say.what)} goes from ${w(say.from)} to ${w(say.to)}`;
    case 'joins': return `at ${w(say.at)}, ${w(say.what)} joins ${w(say.into)}`;
    case 'cycles': return `${w(say.what)} goes round and back`;
    case 'reacts': return `${say.kind === 'laughter' ? 'a few of ' + w(say.who) + ' laugh' : w(say.who) + ' respond'}`;
    case 'contact': return `${w(say.a)} ${say.a === 'own' ? 'catch hold of' : 'catches hold of'} ${w(say.b)}`;
    case 'displaced': return `${w(say.what)} ${say.what === 'own' ? 'are' : 'is'} thrown off balance`;
    case 'shifts': return `${say.by ? w(say.by) + ' moves ' : ''}${w(say.what)} ${say.later ? 'later' : 'earlier'}, by an amount not given`;
    case 'exceeds': return `${w(say.a)} grows taller than ${w(say.b)}`;
    case 'behind': return `${w(say.what)} is ${say.amount} behind its plan`;
    case 'transforms': return `at ${w(say.at)}, ${w(say.what)} turns from ${say.from} to ${say.to}`;
    case 'above': return `${w(say.a)} are above ${w(say.b)}`;
    case 'part-of': return `${w(say.part)} is part of ${w(say.whole)}`;
    case 'complete': return `${w(say.what)} is finished`;
    case 'precedes': return `${w(say.b)} comes after ${w(say.a)}`;
    case 'depends-on': return `${w(say.what)} depends on ${w(say.on)}`;
    case 'absent': return `${w(say.what)} isn’t there yet`;
    case 'waiting': return `${w(say.what)} waits for ${w(say.for)}`;
    default: return null;
  }
}

function question(c: StudyCase, s: Statement): string | null {
  if (s.say.p !== 'question') return null;
  const about = s.say.about;
  const x = c.rep.statements.some((t) => t.id === about) ? null : word(c, about);
  switch (s.say.asks) {
    case 'attention': return `what ${x} noticed`;
    case 'whether': return `what ${x} did`;
    case 'cause': return 'why';
    case 'time': return `when ${x} will come`;
    case 'intent': return `what ${x} meant`;
    case 'setting': return `where ${x} was`;
    case 'fate': return `what happens to ${x} after that`;
    case 'motion': return `whether ${x} ${x === 'you' ? 'were' : 'was'} moving too`;
  }
}

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The text alternative (C6): established statements first, then what is left open, then how many
 * possibilities fit. Nothing inferred. `shown` limits it to the statements the figure draws.
 */
export function altText(c: StudyCase, shown: (id: string) => boolean = () => true): string {
  const rep = c.rep;
  const established = drawable(rep).filter((s) => isEstablished(s) && shown(s.id));
  const clauses = established.map((s) => clause(c, s)).filter((x): x is string => !!x);
  const open = drawable(rep).filter((s) => s.commitment === 'unknown' && shown(s.id)).map((s) => question(c, s)).filter((x): x is string => !!x);
  const sets = drawable(rep).filter((s) => s.commitment === 'possible' && shown(s.id));
  const parts = [clauses.map(sentence).join('. ') + '.'];
  if (open.length) parts.push(`Left open: ${open.join('; ')}.`);
  for (const a of sets) if (a.say.p === 'alternatives') parts.push(`${a.say.options.length} explanations fit equally; none is shown as more likely.`);
  return parts.join(' ');
}

/**
 * Rule C9 (revision 3, accepted in slice 1 as E1-S1, E1-K1 and E1-F1): places that are parts of one
 * whole sit together. A cycle through two parts of one whole is laid out as two loops meeting there.
 */
export function layoutOf(c: StudyCase): 'loop' | 'figure-eight' {
  const cycle = drawable(c.rep).find((s) => s.say.p === 'cycles');
  if (!cycle || cycle.say.p !== 'cycles') return 'loop';
  const through = cycle.say.through;
  const wholes = new Map<string, number>();
  for (const s of drawable(c.rep)) if (s.say.p === 'part-of' && through.includes(s.say.part)) wholes.set(s.say.whole, (wholes.get(s.say.whole) ?? 0) + 1);
  return [...wholes.values()].some((n) => n >= 2) ? 'figure-eight' : 'loop';
}

/** The coverage entries for part-of statements: shown by placing the parts together. */
export function partsShown(c: StudyCase): Record<string, string> {
  return Object.fromEntries(drawable(c.rep).filter((s) => s.say.p === 'part-of').map((s) => [s.id, 'its parts sit side by side, meeting in the middle (C9)']));
}

/** A coverage report from what an idiom says it drew. Every drawable statement must be accounted for. */
export function coverage(rep: Representation, shown: Record<string, string>, notShown: Record<string, string>): Coverage {
  for (const s of drawable(rep)) if (!(s.id in shown) && !(s.id in notShown)) throw new Error(`${rep.id}: statement '${s.id}' is neither shown nor accounted for`);
  for (const id of [...Object.keys(shown), ...Object.keys(notShown)]) statement(rep, id);
  return {
    shown: Object.entries(shown).map(([id, how]) => ({ id, how })),
    notShown: Object.entries(notShown).map(([id, why]) => ({ id, why })),
  };
}

export { element };
