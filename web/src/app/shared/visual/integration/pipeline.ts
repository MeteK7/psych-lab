import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { QualityTier, planMotion } from '../motion/plan-motion';
import { FrameItem, ResolvedFrame, ResolvedTimeline, ResolvedTrack } from '../rendering/frame';
import { resolveState } from '../state/resolve-state';
import { resolveLabel, resolveStyle } from '../styling/resolve';
import { FRAMES } from '../styling/vocabulary';

/**
 * The pipeline (docs/visual-system.md §3.2), assembled outside every capability: S3 gives the
 * elements and their geometry, S4 their targets for the state, S1 their paint. The result is a
 * resolved frame any backend can draw. It runs when a scene or state changes, never per frame.
 * S2 Generation joins here once a composition pulls it.
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

/**
 * S5's timeline for a change, resolved for a backend: emphasis tracks become paint tracks through
 * S1, so a backend never sees an emphasis level. Labels take no emphasis, so only shapes get paint.
 */
export function buildTimeline(scene: SceneDefinition, from: StateName | null, to: StateName, tier: QualityTier): ResolvedTimeline {
  const shapes = new Map(scene.layers.flatMap((l) => l.elements).flatMap((e) => (e.kind === 'shape' ? [[e.id, e] as const] : [])));
  return planMotion(scene, from, to, tier).flatMap((track): ResolvedTrack[] => {
    if (track.property !== 'emphasis') return [track];
    const shape = shapes.get(track.id);
    if (!shape) return [];
    return [{ ...track, property: 'paint', from: resolveStyle(shape.style, track.from), to: resolveStyle(shape.style, track.to) }];
  });
}

export { contentText } from './content-text';
