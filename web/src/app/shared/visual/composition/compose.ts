import type { FrameSize, ThemeId } from '../styling/vocabulary';
import type { ContentKey, ElementId, Layer, SceneDefinition, TextLookup } from './scene';

/**
 * S3 Composition, built from data (milestone M1, docs/visual-system.md §14). An instrument or a
 * game is a scene like any other, made by a pure function from the exercise's data: its elements
 * have ids, style references and purposes, and its one state, `shown`, says which are focal or
 * receded. So the same pipeline (S4 state, S1 styling; S5 motion as it grows) draws scenes and
 * data-driven figures, and every later capability plugs in once.
 *
 * Its words come with it: numbers, scale words given by the exercise, never the person's own text.
 */
export const SHOWN = 'shown';

export interface Composed {
  scene: SceneDefinition;
  /** The composition's words by key, read like content. */
  text: Readonly<Record<ContentKey, string>>;
}

export interface ComposeOptions {
  id: string;
  version: number;
  theme: ThemeId;
  size: FrameSize;
  layers: readonly Layer[];
  /** Emphasis in the one state; `normal` otherwise. */
  emphasis?: Readonly<Record<ElementId, 'focal' | 'receded'>>;
  /** For the validator and for reviewers; the exercise gives the text alternative people hear. */
  alt: string;
  /** Default 1 (docs/visual-policy.md §8). */
  maxFocal?: number;
}

/** A scene with one state that shows every element. */
export function composeScene(options: ComposeOptions, text: Readonly<Record<ContentKey, string>> = {}): Composed {
  const { id, version, theme, size, layers, emphasis, alt, maxFocal } = options;
  const visible = layers.flatMap((l) => l.elements.map((e) => e.id));
  return {
    scene: {
      id,
      version,
      theme,
      frame: size,
      layers,
      states: { initial: SHOWN, states: { [SHOWN]: { visible, ...(emphasis ? { emphasis } : {}) } } },
      alt: { [SHOWN]: 'alt' },
      ...(maxFocal ? { policy: { maxFocal } } : {}),
    },
    text: { alt, ...text },
  };
}

export function lookupOf(composed: Composed): TextLookup {
  return (key) => composed.text[key];
}
