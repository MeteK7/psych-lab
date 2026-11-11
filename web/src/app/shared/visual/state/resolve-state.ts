import type { ElementId, SceneDefinition, StateName } from '../composition/scene';
import type { Emphasis } from '../styling/vocabulary';

/**
 * S4 State: turns a named state into a target for every element, with no notion of time
 * (docs/visual-system.md §3.3). Emphasis is a level; S1 decides what it looks like.
 */
export interface ElementTarget {
  visible: boolean;
  emphasis: Emphasis;
}

export function resolveState(scene: SceneDefinition, state: StateName): Record<ElementId, ElementTarget> {
  const def = scene.states.states[state];
  if (!def) throw new Error(`Scene '${scene.id}' has no state '${state}'`);
  const targets: Record<ElementId, ElementTarget> = {};
  for (const layer of scene.layers) {
    for (const { id } of layer.elements) {
      targets[id] = { visible: def.visible.includes(id), emphasis: def.emphasis?.[id] ?? 'normal' };
    }
  }
  return targets;
}
