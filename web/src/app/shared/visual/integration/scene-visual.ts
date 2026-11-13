import { SCENES } from '../scenes';
import { THEMES } from '../styling/vocabulary';
import { NO_VISUAL, Visual, VisualRequest } from '../visual';
import { SceneFigure } from './scene-figure';

/**
 * The part of the scene source that loads on demand (`scene-source.ts`): the scene registry and
 * the renderer. Answers one request with the registered scene, and says exactly what it draws.
 */
export function sceneVisual(sceneId: string, prefix: string, { scene: requested, facets }: VisualRequest): { id: string; visual: Visual } {
  const entry = SCENES.find((e) => e.scene.id === sceneId);
  if (!entry) throw new Error(`No scene '${sceneId}' is registered`);
  const { scene, text } = entry;
  const id = `scene:${scene.id}@${scene.version};theme:${scene.theme}@${THEMES[scene.theme]}`;

  const stateOf = (name: string | undefined) => {
    if (!name?.startsWith(`${prefix}.`)) return null;
    const state = name.slice(prefix.length + 1);
    return Object.hasOwn(scene.states.states, state) ? state : null;
  };
  const state = stateOf(requested);
  if (!state) return { id, visual: NO_VISUAL };
  return {
    id,
    visual: {
      kind: 'component',
      component: SceneFigure,
      inputs: { scene, state, text, from: stateOf(facets?.['from']) },
      alt: text(scene.alt[state]) ?? '',
    },
  };
}
