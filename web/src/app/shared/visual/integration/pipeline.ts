import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { FrameItem, ResolvedFrame } from '../rendering/frame';
import { resolveState } from '../state/resolve-state';
import { resolveLabel, resolveStyle } from '../styling/resolve';
import { FRAMES } from '../styling/vocabulary';

/**
 * The pipeline (docs/visual-system.md §3.2), assembled outside every capability: S3 gives the
 * elements and their geometry, S4 their targets for the state, S1 their paint. The result is a
 * resolved frame any backend can draw. It runs when a scene or state changes, never per frame.
 * S2 Generation and S5 Motion join here once a composition pulls them.
 */
export function buildFrame(scene: SceneDefinition, state: StateName, text: TextLookup): ResolvedFrame {
  const targets = resolveState(scene, state);
  const items: FrameItem[] = [];
  for (const layer of scene.layers) {
    for (const element of layer.elements) {
      const target = targets[element.id];
      if (!target.visible) continue;
      const base = { id: element.id, layer: layer.id };
      switch (element.kind) {
        case 'label': {
          const paint = resolveLabel(element.tone);
          items.push({
            ...base,
            kind: 'text',
            text: text(element.text) ?? '',
            x: element.at[0],
            y: element.at[1],
            anchor: element.align,
            fill: paint.fill,
            size: paint.size,
          });
          break;
        }
        case 'shape':
          items.push({ ...base, kind: 'shape', shape: element.geometry, paint: resolveStyle(element.style, target.emphasis) });
          break;
      }
    }
  }
  const { width, height } = FRAMES[scene.frame];
  return { width, height, theme: scene.theme, items };
}

/** Looks keys up in nested content objects: `contentText({ mcii: MCII })('mcii.scenes.future.alt')`. */
export function contentText(root: Record<string, unknown>): TextLookup {
  return (key) => {
    let node: unknown = root;
    for (const part of key.split('.')) {
      if (!node || typeof node !== 'object' || !Object.hasOwn(node, part)) return undefined;
      node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : undefined;
  };
}
