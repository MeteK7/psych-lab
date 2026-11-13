import { Component, ElementRef, inject, input } from '@angular/core';

import type { DrawPaint, Drawable, FrameItem, ResolvedFrame } from '../frame';
import { SampledItem } from '../playback';
import { pathData } from '../svg/svg-backend';
import type { SurfaceScheme } from '../svg/svg-backend';
import { ColourOf, mixColours, tokenColours } from './colour';

export type { ColourOf };

const NONE = 'none';

function trace(ctx: CanvasRenderingContext2D, shape: Drawable): Path2D | null {
  ctx.beginPath();
  switch (shape.type) {
    case 'circle':
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      return null;
    case 'ellipse':
      ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
      return null;
    case 'rect':
      ctx.roundRect(shape.x, shape.y, shape.width, shape.height, shape.rx ?? 0);
      return null;
    case 'line':
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      return null;
    case 'path':
      return new Path2D(shape.d);
  }
}

/** A shape's bounding box: exact for circles, ellipses, rects and lines; paths bring theirs with the gradient. */
export function boundsOf(shape: Drawable): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'circle':
      return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: 2 * shape.r, height: 2 * shape.r };
    case 'ellipse':
      return { x: shape.cx - shape.rx, y: shape.cy - shape.ry, width: 2 * shape.rx, height: 2 * shape.ry };
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case 'line':
      return {
        x: Math.min(shape.x1, shape.x2),
        y: Math.min(shape.y1, shape.y2),
        width: Math.abs(shape.x2 - shape.x1),
        height: Math.abs(shape.y2 - shape.y1),
      };
    case 'path':
      // A path's box comes with its gradient from the pipeline (the backend decides nothing).
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/** The frame's grain tile as a repeating pattern, drawn once per paint; null where a canvas can't be made. */
function grainPattern(ctx: CanvasRenderingContext2D, grain: { tile: number; d: string }, colour: ColourOf): CanvasPattern | null {
  if (typeof document === 'undefined') return null;
  // The tile at the canvas's own resolution (device pixels per scene unit), so the dots are as fine
  // as SVG's at any pixel ratio, then mapped back to scene units (found by the M6 parity suite).
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const k = m ? Math.max(1, Math.hypot(m.a, m.b)) : 1;
  const size = Math.round(grain.tile * k);
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const t = tile.getContext('2d');
  if (!t) return null;
  t.scale(size / grain.tile, size / grain.tile);
  t.fillStyle = colour('var(--vis-grain)');
  t.fill(new Path2D(grain.d));
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern && size !== grain.tile) pattern.setTransform(new DOMMatrix().scale(grain.tile / size));
  return pattern;
}

/** Fills the current path (or `path`) with the paint's gradient, in the shape's bounding box. */
function fillGradient(ctx: CanvasRenderingContext2D, shape: Drawable, paint: DrawPaint, colour: ColourOf, path: Path2D | null): void {
  const g = paint.gradient!;
  const b = g.box ?? boundsOf(shape);
  if (g.type === 'linear') {
    // In the shape's own box units, as SVG's objectBoundingBox: on a box that isn't square, the
    // bands run along the box's other diagonal, not at right angles to the gradient (found by the
    // M6 parity suite). The current path keeps its place; a Path2D is mapped into the box first.
    const gradient = ctx.createLinearGradient(g.from[0], g.from[1], g.to[0], g.to[1]);
    for (const s of g.stops) gradient.addColorStop(s.offset, colour(s.colour));
    const [w, h] = [Math.max(b.width, 1e-6), Math.max(b.height, 1e-6)];
    ctx.save();
    ctx.transform(w, 0, 0, h, b.x, b.y);
    ctx.fillStyle = gradient;
    if (path) {
      const boxed = new Path2D();
      boxed.addPath(path, new DOMMatrix([1 / w, 0, 0, 1 / h, -b.x / w, -b.y / h]));
      ctx.fill(boxed);
    } else ctx.fill();
    ctx.restore();
    return;
  }
  // Radial: a unit circle stretched to the bounding box, so it fills an ellipse as in SVG. Radial
  // fills (shadows) are on circles and ellipses, whose path is already built: only the gradient is
  // set up in the stretched space. A Path2D would be stretched too, so it falls back to the centre tone.
  if (path) {
    ctx.fillStyle = colour(g.stops[0].colour);
    ctx.fill(path);
    return;
  }
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const s of g.stops) gradient.addColorStop(s.offset, colour(s.colour));
  ctx.save();
  ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
  ctx.scale(Math.max(b.width / 2, 1e-6), Math.max(b.height / 2, 1e-6));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

/** How a frame's items are painted: line widths and dashes in CSS px at any drawn size (as SVG's non-scaling strokes). */
interface PaintContext {
  frame: ResolvedFrame;
  colour: ColourOf;
  /** CSS px per scene unit: lines keep their CSS width (visual-language.md §4.1). */
  scale: number;
  grain?: CanvasPattern | null;
}

const lengths = new Map<string, number>();
/** A drawing's length along its direction, measured by the browser (for a reveal band). */
function lengthOf(shape: Drawable): number {
  const d = pathData(shape);
  let length = lengths.get(d);
  if (length === undefined) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
    if (lengths.size > 500) lengths.clear();
    lengths.set(d, length);
  }
  return length;
}

function paintText(ctx: CanvasRenderingContext2D, item: Extract<FrameItem, { kind: 'text' }>, colour: ColourOf): void {
  ctx.fillStyle = colour(item.fill);
  ctx.font = `${item.weight === 'bold' ? 700 : 400} ${item.size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.textAlign = item.anchor === 'middle' ? 'center' : item.anchor === 'end' ? 'right' : 'left';
  const lines = item.lines ?? [item.text];
  if (item.halo) {
    ctx.strokeStyle = colour(item.halo.colour);
    ctx.lineWidth = item.halo.width;
    ctx.setLineDash([]);
    lines.forEach((line, i) => ctx.strokeText(line, item.x, item.y + i * (item.lineHeight ?? 0)));
  }
  lines.forEach((line, i) => ctx.fillText(line, item.x, item.y + i * (item.lineHeight ?? 0)));
}

/**
 * A colour a fraction `f` of the way between two paints' colours, as the browser animates SVG's
 * `fill` and `stroke`: two colours blend; 'none' doesn't blend with a colour, so it switches at
 * halfway (found by the M6 parity suite: an option's fill appearing as it is chosen).
 */
function blend(from: string, to: string, f: number, colour: ColourOf): string {
  if (from === NONE || to === NONE) {
    const now = f < 0.5 ? from : to;
    return now === NONE ? NONE : colour(now);
  }
  return mixColours(colour(from), colour(to), f);
}

/** One shape, in its paint, or flat between two paints while a paint track plays (as SVG's keyframes). */
function paintShape(ctx: CanvasRenderingContext2D, item: Extract<FrameItem, { kind: 'shape' }>, between: SampledItem['paint'], p: PaintContext): void {
  const { colour, scale } = p;
  const paint = between
    ? { ...between.to, gradient: undefined, grain: item.paint.grain, width: between.from.width + (between.to.width - between.from.width) * between.f }
    : item.paint;
  const fill = between ? blend(between.from.fill, between.to.fill, between.f, colour) : paint.fill;
  const stroke = between ? blend(between.from.stroke, between.to.stroke, between.f, colour) : paint.stroke;
  const path = trace(ctx, item.shape);
  if (paint.gradient) fillGradient(ctx, item.shape, paint, colour, path);
  else if (fill !== NONE) {
    ctx.fillStyle = between ? fill : colour(fill);
    if (path) ctx.fill(path);
    else ctx.fill();
  }
  if (paint.grain && p.frame.grain) {
    p.grain ??= grainPattern(ctx, p.frame.grain, colour);
    if (p.grain) {
      ctx.save();
      ctx.globalAlpha *= paint.grain;
      ctx.fillStyle = p.grain;
      if (path) ctx.fill(path);
      else ctx.fill();
      ctx.restore();
    }
  }
  if (stroke !== NONE && paint.width > 0) {
    ctx.strokeStyle = between ? stroke : colour(stroke);
    ctx.lineWidth = paint.width / scale;
    ctx.setLineDash(paint.dash ? paint.dash.split(/[\s,]+/).map((n) => Number(n) / scale) : []);
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}

let layerCanvas: HTMLCanvasElement | null = null;
/** A layer the size of `ctx`'s canvas, with its transform: for items drawn faded or in part. */
function layerFor(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  layerCanvas ??= document.createElement('canvas');
  const { width, height } = ctx.canvas;
  if (layerCanvas.width !== width || layerCanvas.height !== height) Object.assign(layerCanvas, { width, height });
  const layer = layerCanvas.getContext('2d');
  if (!layer) return null;
  layer.setTransform(1, 0, 0, 1, 0, 0);
  layer.clearRect(0, 0, width, height);
  layer.setTransform(ctx.getTransform());
  layer.lineCap = 'round';
  layer.lineJoin = 'round';
  return layer;
}

function paintOne(ctx: CanvasRenderingContext2D, s: SampledItem, p: PaintContext): void {
  if (s.opacity <= 0 || s.reveal === 0) return;
  const draw = (c: CanvasRenderingContext2D) => {
    c.translate(s.offset[0], s.offset[1]);
    if (s.item.kind === 'text') paintText(c, s.item, p.colour);
    else paintShape(c, s.item, s.paint, p);
  };
  if (s.opacity >= 1 && s.reveal === null) {
    // Still and in place (every item of a still frame, as the dot game draws): no state to keep.
    if (!s.offset[0] && !s.offset[1]) {
      if (s.item.kind === 'text') paintText(ctx, s.item, p.colour);
      else paintShape(ctx, s.item, s.paint, p);
      return;
    }
    ctx.save();
    draw(ctx);
    ctx.restore();
    return;
  }
  // Faded or drawn in part: on its own layer, so a fill and its line fade as one (as SVG's opacity),
  // and the drawn part is kept through a band along the line (as SVG's reveal mask, butt ends).
  const layer = layerFor(ctx);
  if (!layer) return;
  draw(layer);
  if (s.reveal !== null && s.item.kind === 'shape') {
    const length = lengthOf(s.item.shape);
    layer.globalCompositeOperation = 'destination-in';
    layer.lineCap = 'butt';
    layer.lineWidth = 16;
    layer.strokeStyle = '#fff';
    layer.setLineDash([length * s.reveal, length * 3]);
    layer.lineDashOffset = 0;
    layer.stroke(new Path2D(pathData(s.item.shape)));
    layer.globalCompositeOperation = 'source-over';
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = s.opacity;
  ctx.drawImage(layer.canvas, 0, 0);
  ctx.restore();
}

/** Paints sampled items (rendering/playback.ts) on a 2D context whose transform maps scene units to its pixels. */
export function paintItems(ctx: CanvasRenderingContext2D, frame: ResolvedFrame, items: readonly SampledItem[], colour: ColourOf, scale = 1): void {
  // The transform maps scene units to the canvas, so the frame's own size is the whole canvas.
  ctx.clearRect(0, 0, frame.width, frame.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const p: PaintContext = { frame, colour, scale };
  for (const s of items) paintOne(ctx, s, p);
}

/**
 * Paints items on a canvas at its CSS width, with a backing store of that size × the device pixel
 * ratio (resized when either changes), the frame mapped to fill it. Used by the canvas figure and
 * the stimulus surface (M6), so both draw the same way.
 */
export function paintOnCanvas(canvas: HTMLCanvasElement, frame: ResolvedFrame, items: readonly SampledItem[], colour: ColourOf): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // e.g. test environments without canvas support
  const css = canvas.clientWidth || frame.width;
  const ratio = globalThis.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(css * ratio));
  const height = Math.max(1, Math.round(((css * frame.height) / frame.width) * ratio));
  if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(width / frame.width, 0, 0, height / frame.height, 0, 0);
  paintItems(ctx, frame, items, colour, css / frame.width);
}

/**
 * Paints a resolved frame on a 2D context. Decides nothing (docs/visual-system.md §6.2): geometry,
 * paint and text all come in the frame; `colour` turns its token references into colours.
 */
export function paintFrame(ctx: CanvasRenderingContext2D, frame: ResolvedFrame, colour: ColourOf): void {
  paintItems(ctx, frame, frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null })), colour);
}

/**
 * S7 Rendering, the canvas backend: for frames that change every animation frame (the dot game).
 * It's the surface a canvas sits in: the S1 tokens apply here (tokens.css, as for the SVG backend),
 * so light, dark and high contrast follow the page, and it reads each token's colour from its own
 * styles. The canvas, its size and its input stay with whoever draws on it.
 */
@Component({
  selector: 'app-vis-canvas',
  host: { '[attr.data-vis-theme]': 'theme()', '[attr.data-vis-scheme]': 'scheme()' },
  template: `<ng-content />`,
  styleUrls: ['../../styling/tokens.css'],
  styles: `:host { display: block; }`,
})
export class CanvasBackend {
  /** Recorded as the backend of a shown visual. */
  static readonly id = 'canvas.v1';

  readonly theme = input.required<string>();
  readonly scheme = input<SurfaceScheme>('auto');

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly colour = tokenColours(this.host);

  /** Draws a frame on a canvas inside this surface. */
  draw(canvas: HTMLCanvasElement, frame: ResolvedFrame): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // e.g. test environments without canvas support
    paintFrame(ctx, frame, (value) => this.colour(value));
  }

}
