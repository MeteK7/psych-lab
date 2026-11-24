import type { Composed } from '../../../../shared/visual/composition/compose';
import type { Layer } from '../../../../shared/visual/composition/scene';
import type { StudyCase } from '../cases';
import { Statement, drawable, element, isEstablished } from '../representation';
import { Axes as EngineAxes, Coverage as EngineCoverage, Figure as EngineFigure, FigureMotion, Setting, kit } from '../../../../shared/visual';

/**
 * STUDY CODE: the idiom contract (representation-v0.md §6). An idiom turns a representation into a
 * figure: a composition at any moment or viewpoint, a text alternative written from the statements,
 * a coverage report and its values on the five axes. Since Stage 3 M3 the figure is the engine's
 * (S12); what stays here is the study's: its words (the text alternative, in English) and its setting.
 */
export type IdiomId = 'spatial' | 'kinetic' | 'field';

export type Axes = EngineAxes;
export type Motion = FigureMotion;
export type Coverage = EngineCoverage;
export type Figure = EngineFigure;

export const SAFE = kit.SAFE;

/** The study's setting for a case: its theme and words, its scene ids and seeds, and its English text alternative. */
export function settingOf(c: StudyCase): Setting {
  return {
    theme: c.theme,
    words: c.words,
    scene: (idiom) => ({ id: `study.${c.id.toLowerCase()}.${idiom}`, seed: `study-${c.id}-${idiom}` }),
    alt: (rep) => altText({ ...c, rep }),
  };
}

/** A composition from layers, in the case's theme, sized to the study frame (the engine's, in the study's setting). */
export function composed(c: StudyCase, idiom: IdiomId, layers: readonly Layer[], alt: string, text: Record<string, string> = {}): Composed {
  return kit.composed({ rep: c.rep, setting: settingOf(c) }, idiom, layers, alt, text);
}

/** The words for an element, in running text ("you" for the own presence). */
export function word(c: StudyCase, id: string): string {
  const e = c.rep.elements.find((x) => x.id === id);
  if (e?.own) return 'you';
  const w = (c.words[id] ?? id).toLowerCase();
  // Revision 5 (D5): a word that already has its article keeps it; no element is special-cased.
  if (/^(the|a|an) /.test(w)) return w;
  return e?.kind === 'presence' || e?.kind === 'place' || e?.kind === 'object' || e?.kind === 'process' ? `the ${w}` : w;
}

/** Revision 5 (D5): the viewer's own presence is known by its flag, never by its id. */
const isOwn = (c: StudyCase, id: string) => !!c.rep.elements.find((x) => x.id === id)?.own;

/** One established statement as a clause, from its predicate only (rule C6). */
function clause(c: StudyCase, s: Statement): string | null {
  const w = (id: string) => word(c, id);
  // Agreement from the own flag and the element's count, never from an id (D5).
  const plural = (id: string) => isOwn(c, id) || c.rep.elements.find((x) => x.id === id)?.count !== undefined;
  const be = (id: string) => (plural(id) ? 'are' : 'is');
  const verb = (id: string, plain: string, third: string) => (plural(id) ? plain : third);
  const say = s.say;
  switch (say.p) {
    case 'passes': {
      if (!say.mover) return `${w(say.a)} and ${w(say.b)} pass each other`;
      const by = say.mover === say.a ? say.b : say.a;
      return `${w(say.mover)} ${verb(say.mover, 'walk', 'walks')} past ${w(by)}`;
    }
    case 'exchange-absent': return `there is no ${say.kind} from ${w(say.from)}`;
    case 'sends': return `${w(say.from)} ${verb(say.from, 'send', 'sends')} ${w(say.item)} to ${w(say.to)}`;
    case 'receives': return `${w(say.who)} ${verb(say.who, 'read', 'reads')} it`;
    case 'holds': return `${w(say.who)} ${verb(say.who, 'hold', 'holds')} ${w(say.what)}`;
    case 'located-in': return `${w(say.what)} ${be(say.what)} at ${(c.words[say.place] ?? say.place).toLowerCase()}${say.alone ? ', alone' : ''}`;
    case 'apart': return `${w(say.a)} and ${w(say.b)} are in different places`;
    case 'feels': return `it presses on ${w(say.who)}, as ${w(say.who)} said`;
    case 'flows': return `${w(say.what)} goes from ${w(say.from)} to ${w(say.to)}`;
    case 'joins': return `at ${w(say.at)}, ${w(say.what)} joins ${w(say.into)}`;
    case 'cycles': return `${w(say.what)} goes round and back`;
    case 'reacts': return `${say.kind === 'laughter' ? 'a few of ' + w(say.who) + ' laugh' : w(say.who) + ' respond'}`;
    // Revision 5: from the predicate's meaning only (a touches b), not from one case's wording.
    case 'contact': return `${w(say.a)} ${verb(say.a, 'come', 'comes')} into contact with ${w(say.b)}`;
    case 'displaced': return `${w(say.what)} ${be(say.what)} moved off ${isOwn(c, say.what) ? 'your' : plural(say.what) ? 'their' : 'its'} place by ${w(say.by)}`;
    case 'shifts': return `${say.by ? w(say.by) + ' moves ' : ''}${w(say.what)} ${say.later ? 'later' : 'earlier'}, by an amount not given`;
    case 'exceeds': return `${w(say.a)} ${verb(say.a, 'grow', 'grows')} taller than ${w(say.b)}`;
    case 'behind': return `${w(say.what)} ${be(say.what)} ${say.amount} behind ${isOwn(c, say.what) ? 'your' : plural(say.what) ? 'their' : 'its'} plan`;
    case 'transforms': return `at ${w(say.at)}, ${w(say.what)} turns from ${say.from} to ${say.to}`;
    // Number isn't in v0 for things: a word ending in -s is read as plural (a limit, findings-revision-5.md).
    case 'above': return `${w(say.a)} ${plural(say.a) || /s$/.test(c.words[say.a] ?? '') ? 'are' : 'is'} above ${w(say.b)}`;
    case 'form': return null;
    case 'part-of': return `${w(say.part)} is part of ${w(say.whole)}`;
    case 'complete': return `${w(say.what)} ${be(say.what)} finished`;
    case 'precedes': return `${w(say.b)} ${verb(say.b, 'come', 'comes')} after ${w(say.a)}`;
    case 'depends-on': return `${w(say.what)} ${verb(say.what, 'depend', 'depends')} on ${w(say.on)}`;
    case 'absent': return `${w(say.what)} ${plural(say.what) ? 'aren’t' : 'isn’t'} there yet`;
    case 'waiting': return `${w(say.what)} ${verb(say.what, 'wait', 'waits')} for ${w(say.for)}`;
    default: return null;
  }
}

/** Whether a question holds in a phase after the movement of what it is about. */
function later(c: StudyCase, s: Statement): boolean {
  if (s.say.p !== 'question' || !s.phases?.length) return false;
  const about = s.say.about;
  const phases = c.rep.time.phases;
  const moves = c.rep.statements.find((m) => (m.say.p === 'flows' && m.say.what === about) || (m.say.p === 'passes' && m.say.mover === about));
  return !!moves?.phases?.length && phases.indexOf(s.phases[0]) > phases.indexOf(moves.phases[0]);
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
    // Revision 6: a question about motion in a phase after the thing's own movement asks about its
    // course from then on (phases are structure); otherwise, whether it moved too (P1).
    case 'motion': return later(c, s) ? `where ${x} goes after that` : `whether ${x} ${x === 'you' ? 'were' : 'was'} moving too`;
  }
}

export const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

/** A coverage report from what an idiom says it drew (the engine's). */
export const coverage = kit.coverage;

export { element };
