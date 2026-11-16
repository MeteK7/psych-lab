import { Layer, SceneDefinition, SceneElement } from '../composition/scene';
import { ThemeId } from '../styling/vocabulary';

/**
 * Card figures (2026-11-16): the banner on each exercise card of an area page. One shared
 * pattern, so every card reads as the same kind of thing:
 * - one state, `card`, with nothing moving: a card is read, not played
 * - the area's tone as the ground, with its edge outside the frame, so the card's own hairline is the only line around it
 * - neutral (`context`) for what the person brings: the situation, the setback, the facts, the moment, the start
 * - the area colour (`subject`) for what the exercise does with it; `near` hairlines for the links between them
 * - no words, no people and nothing that reads as a face (docs/visual-policy.md; review, 2026-11-16)
 *
 * The text alternative is the card's, in `area-figures` content, keyed by exercise id.
 */
export const CARD_STATE = 'card';

/** The ground of every card figure: the area's lightest tone, edge to edge. */
export const CARD_GROUND: SceneElement = {
  kind: 'shape',
  id: 'ground',
  geometry: { type: 'rect', x: -2, y: -2, width: 484, height: 124 },
  style: { role: 'far', material: 'tonal' },
  purpose: {
    serves: ['identity'],
    why: "The area's own tone behind the figure, so the card belongs to its area at a glance. Its edge lies outside the frame: the card's hairline is the only line around the figure.",
  },
};

/** A card figure: the ground, then its forms, all shown in the one state. */
export function cardScene(id: string, exercise: string, theme: ThemeId, version: number, elements: readonly SceneElement[], changes?: readonly string[]): SceneDefinition {
  const layers: Layer[] = [
    { id: 'ground', plane: 'backdrop', elements: [CARD_GROUND] },
    { id: 'figure', plane: 'subject', elements },
  ];
  return {
    id,
    version,
    theme,
    frame: 'banner',
    layers,
    states: { initial: CARD_STATE, states: { [CARD_STATE]: { visible: ['ground', ...elements.map((e) => e.id)] } } },
    alt: { [CARD_STATE]: `figures.cards.${exercise}.alt` },
    changes,
  };
}

/** A circle as path data, so several can share one element. */
export const ring = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** A rounded rectangle as path data. */
export const box = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
