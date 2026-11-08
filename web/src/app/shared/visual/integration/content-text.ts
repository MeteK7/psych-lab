import type { TextLookup } from '../composition/scene';

/**
 * Looks keys up in nested content objects: `contentText({ mcii: MCII })('mcii.scenes.future.alt')`.
 * On its own, so the scene registry can use it without loading the renderer.
 */
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
