import { boundsOf } from '../composition/bounds';
import { Composed, SHOWN, lookupOf } from '../composition/compose';
import { SceneDefinition, StateName, TextLookup } from '../composition/scene';
import { dotsPath, poissonDisc } from '../generation/distributions';
import { generate, generateEdge } from '../generation/registry';
import { deriveSeed } from '../generation/random';
import { QualityTier, planMotion } from '../motion/plan-motion';
import { DrawPaint, Drawable, FrameItem, ResolvedFrame, ResolvedTimeline, ResolvedTrack } from '../rendering/frame';
import { resolveState } from '../state/resolve-state';
import { resolveHalo, resolveLabel, resolveStyle } from '../styling/resolve';
import { LINE_HEIGHT, wrapText } from '../styling/type';
import { GRAIN, frameSize } from '../styling/vocabulary';

/**
 * The pipeline (docs/visual-system.md §3.2), assembled outside every capability: S3 gives the
 * elements and their geometry, S4 their targets for the state, S1 their paint. The result is a
 * resolved frame any backend can draw. It runs when a scene or state changes. Compositions built
 * from data (composition/compose.ts) go through it the same way; the dot game builds one per frame.
 * S2 Generation: a `generated` element's path is made here, from its generator, parameters and
 * its own seed, and kept, so a scene that changes state doesn't recompute it.
 */
const generated = new Map<string, string>();

/** A gradient carries its shape's bounding box, so a canvas backend needn't work it out. */
function withBox(scene: SceneDefinition, element: SceneDefinition['layers'][number]['elements'][number], paint: ReturnType<typeof resolveStyle>) {
  if (!paint.gradient) return paint;
  const box = boundsOf(scene, element);
  return box ? { ...paint, gradient: { ...paint.gradient, box } } : paint;
}
function generatedPath(scene: SceneDefinition, element: Extract<SceneDefinition['layers'][number]['elements'][number], { kind: 'generated' }>): string {
  const seed = deriveSeed(scene.seed ?? scene.id, element.id);
  const key = `${element.generator}|${seed}|${JSON.stringify(element.params)}`;
  let d = generated.get(key);
  if (d === undefined) {
    d = generate(element.generator, element.params, seed);
    if (generated.size > 500) generated.clear();
    generated.set(key, d);
  }
  return d;
}

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
          const words = text(element.text) ?? '';
          items.push({
            ...base,
            kind: 'text',
            text: words,
            x: element.at[0],
            y: element.at[1],
            anchor: element.align,
            fill: paint.fill,
            size: paint.size,
            ...(element.weight ? { weight: element.weight } : {}),
            // Wrapped here (S1 type), so every backend draws the same lines.
            ...(element.width !== undefined
              ? { lines: wrapText(words, paint.size, element.width, element.weight), lineHeight: paint.size * LINE_HEIGHT }
              : {}),
            ...(element.halo ? { halo: resolveHalo() } : {}),
          });
          break;
        }
        case 'shape':
        case 'generated': {
          const shape = element.kind === 'shape' ? element.geometry : ({ type: 'path', d: generatedPath(scene, element) } as const);
          let paint: DrawPaint = withBox(scene, element, resolveStyle(element.style, target.emphasis));
          if (element.style.grain) paint = { ...paint, grain: GRAIN.opacity };
          const edge = element.style.edge === 'top' ? topEdge(scene, element) : null;
          if (!edge) {
            items.push({ ...base, kind: 'shape', shape, paint });
            break;
          }
          // Top edge only (visual-language.md §7): the plane filled without an outline, then its silhouette.
          items.push({ ...base, kind: 'shape', shape, paint: { ...paint, stroke: 'none', width: 0 } });
          items.push({
            id: `${element.id}-edge`,
            layer: layer.id,
            kind: 'shape',
            shape: edge,
            paint: { fill: 'none', stroke: paint.stroke, width: paint.width, dash: paint.dash },
          });
          break;
        }
      }
    }
  }
  const { width, height } = frameSize(scene.frame);
  const grained = items.some((i) => i.kind === 'shape' && i.paint.grain);
  return { width, height, theme: scene.theme, items, ...(grained ? { grain: grainTile() } : {}) };
}

/** A plane's top silhouette: the top side of a rect, or the generator's edge line. */
function topEdge(scene: SceneDefinition, element: SceneDefinition['layers'][number]['elements'][number]): Drawable | null {
  if (element.kind === 'generated') {
    const d = generateEdge(element.generator, element.params, deriveSeed(scene.seed ?? scene.id, element.id));
    return d ? { type: 'path', d } : null;
  }
  if (element.kind === 'shape' && element.geometry.type === 'rect') {
    const { x, y, width } = element.geometry;
    return { type: 'line', x1: x, y1: y, x2: x + width, y2: y };
  }
  return null;
}

let grain: { tile: number; d: string } | null = null;
/** The platform's one grain tile, made once from its fixed seed. */
function grainTile(): { tile: number; d: string } {
  grain ??= {
    tile: GRAIN.tile,
    d: dotsPath(poissonDisc({ x: 0, y: 0, width: GRAIN.tile, height: GRAIN.tile, spacing: GRAIN.spacing, max: 400 }, GRAIN.seed), GRAIN.radius),
  };
  return grain;
}

/**
 * S5's timeline for a change, resolved for a backend: emphasis tracks become paint tracks through
 * S1, so a backend never sees an emphasis level. Labels take no emphasis, so only shapes get paint.
 */
export function buildTimeline(scene: SceneDefinition, from: StateName | null, to: StateName, tier: QualityTier): ResolvedTimeline {
  const shapes = new Map(scene.layers.flatMap((l) => l.elements).flatMap((e) => (e.kind !== 'label' ? [[e.id, e] as const] : [])));
  return planMotion(scene, from, to, tier).flatMap((track): ResolvedTrack[] => {
    if (track.property !== 'emphasis') return [track];
    const shape = shapes.get(track.id);
    if (!shape) return [];
    return [{ ...track, property: 'paint', from: resolveStyle(shape.style, track.from), to: resolveStyle(shape.style, track.to) }];
  });
}

/** A composition built from data, drawn: its one state, with its own words (composition/compose.ts). */
export function buildComposedFrame(composed: Composed): ResolvedFrame {
  return buildFrame(composed.scene, SHOWN, lookupOf(composed));
}

export { contentText } from './content-text';
