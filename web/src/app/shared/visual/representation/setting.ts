import { Composed, composeScene } from '../composition/compose';
import type { Layer } from '../composition/scene';
import type { ThemeId } from '../styling/vocabulary';
import { Representation, Statement, drawable } from './contract';
import type { Coverage } from './invariants';
import { FRAME } from './kit/spatial';

/**
 * S12: what an application supplies, and the figure the engine's patterns return (Stage 3, M3).
 *
 * The engine holds no language and names no application. Everything that is the application's own
 * comes through the setting: the words for its elements and options, its theme, the id and seed of
 * each scene, and the text alternative, which it writes from the representation in its own language.
 */
export interface Setting {
  theme: ThemeId;
  /** The words beside the representation: element names and option wordings, by key. */
  words: Readonly<Record<string, string>>;
  /** Each idiom's scene id and seed. */
  scene(idiom: string): { id: string; seed: string };
  /** The text alternative for a representation (the whole one, or a composition base's narrowed one). */
  alt(rep: Representation): string;
}

/** What a pattern draws: a representation, in an application's setting. */
export interface Subject {
  rep: Representation;
  setting: Setting;
}

/** A figure's values on the five axes. */
export interface Axes {
  space: 'flat' | 'spatial';
  time: 'still' | 'moving';
  substance: 'forms' | 'field';
  mode: 'direct' | 'metaphorical';
  viewpoint: 'fixed' | 'movable';
}

export type FigureMotion =
  /** Plays once when asked, over `duration` ms; `at` runs 0 to 1. */
  | { kind: 'timeline'; duration: number; steps: readonly string[] }
  /** A native slider moves the view between stances; `at` runs 0 to positions − 1. */
  | { kind: 'viewpoint'; positions: readonly string[] }
  | { kind: 'still' };

/** A figure: a composition at any moment or viewpoint, its text alternative, its coverage and its axes. */
export interface Figure<I extends string = string> {
  idiom: I;
  axes: Axes;
  motion: FigureMotion;
  /** The composition at `at` (see FigureMotion). */
  compose(at: number): Composed;
  alt: string;
  coverage: Coverage;
}

/** The safe margin inside the frame. */
export const SAFE = Math.round(FRAME.height * 0.06);

/** A composition from layers, in the setting's theme, sized to the frame. */
export function composed(c: Subject, idiom: string, layers: readonly Layer[], alt: string, text: Record<string, string> = {}): Composed {
  const { id, seed } = c.setting.scene(idiom);
  return composeScene({ id, version: 1, theme: c.setting.theme, size: FRAME, layers, alt, seed }, { ...c.setting.words, ...text });
}

/** A coverage report from what a pattern says it drew. Every drawable statement must be accounted for. */
export function coverage(rep: Representation, shown: Record<string, string>, notShown: Record<string, string>): Coverage {
  for (const s of drawable(rep)) if (!(s.id in shown) && !(s.id in notShown)) throw new Error(`${rep.id}: statement '${s.id}' is neither shown nor accounted for`);
  for (const id of [...Object.keys(shown), ...Object.keys(notShown)]) statementOf(rep, id);
  return {
    shown: Object.entries(shown).map(([id, how]) => ({ id, how })),
    notShown: Object.entries(notShown).map(([id, why]) => ({ id, why })),
  };
}

function statementOf(rep: Representation, id: string): Statement {
  const s = rep.statements.find((x) => x.id === id);
  if (!s) throw new Error(`${rep.id}: no statement '${id}'`);
  return s;
}

/** The engine's own idioms. An application may register patterns under any other idiom name. */
export type EngineIdiom = 'spatial' | 'kinetic' | 'field';
