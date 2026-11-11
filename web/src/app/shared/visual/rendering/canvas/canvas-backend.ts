import { Component, ElementRef, inject, input } from '@angular/core';

import type { DrawPaint, Drawable, ResolvedFrame } from '../frame';
import type { SurfaceScheme } from '../svg/svg-backend';

/** Reads a colour the frame names (an S1 token reference, or 'none') as the canvas can use it. */
export type ColourOf = (value: string) => string;

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
  const tile = document.createElement('canvas');
  tile.width = grain.tile;
  tile.height = grain.tile;
  const t = tile.getContext('2d');
  if (!t) return null;
  t.fillStyle = colour('var(--vis-grain)');
  t.fill(new Path2D(grain.d));
  return ctx.createPattern(tile, 'repeat');
}

/** Fills the current path (or `path`) with the paint's gradient, in the shape's bounding box. */
function fillGradient(ctx: CanvasRenderingContext2D, shape: Drawable, paint: DrawPaint, colour: ColourOf, path: Path2D | null): void {
  const g = paint.gradient!;
  const b = g.box ?? boundsOf(shape);
  if (g.type === 'linear') {
    const gradient = ctx.createLinearGradient(
      b.x + g.from[0] * b.width,
      b.y + g.from[1] * b.height,
      b.x + g.to[0] * b.width,
      b.y + g.to[1] * b.height,
    );
    for (const s of g.stops) gradient.addColorStop(s.offset, colour(s.colour));
    ctx.fillStyle = gradient;
    if (path) ctx.fill(path);
    else ctx.fill();
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

/**
 * Paints a resolved frame on a 2D context. Decides nothing (docs/visual-system.md §6.2): geometry,
 * paint and text all come in the frame; `colour` turns its token references into colours.
 */
export function paintFrame(ctx: CanvasRenderingContext2D, frame: ResolvedFrame, colour: ColourOf): void {
  ctx.clearRect(0, 0, frame.width, frame.height);
  let grain: CanvasPattern | null | undefined;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const item of frame.items) {
    if (item.kind === 'text') {
      ctx.fillStyle = colour(item.fill);
      ctx.font = `${item.weight === 'bold' ? 700 : 400} ${item.size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
      ctx.textAlign = item.anchor === 'middle' ? 'center' : item.anchor === 'end' ? 'right' : 'left';
      ctx.fillText(item.text, item.x, item.y);
      continue;
    }
    const { paint } = item;
    const path = trace(ctx, item.shape);
    if (paint.gradient) fillGradient(ctx, item.shape, paint, colour, path);
    else if (paint.fill !== NONE) {
      ctx.fillStyle = colour(paint.fill);
      if (path) ctx.fill(path);
      else ctx.fill();
    }
    if (paint.grain && frame.grain) {
      grain ??= grainPattern(ctx, frame.grain, colour);
      if (grain) {
        ctx.save();
        ctx.globalAlpha = paint.grain;
        ctx.fillStyle = grain;
        if (path) ctx.fill(path);
        else ctx.fill();
        ctx.restore();
      }
    }
    if (paint.stroke !== NONE && paint.width > 0) {
      ctx.strokeStyle = colour(paint.stroke);
      ctx.lineWidth = paint.width;
      ctx.setLineDash(paint.dash ? paint.dash.split(/[\s,]+/).map(Number) : []);
      if (path) ctx.stroke(path);
      else ctx.stroke();
    }
  }
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
  private readonly colours = new Map<string, string>();
  private coloursAt = 0;

  /** Draws a frame on a canvas inside this surface. */
  draw(canvas: HTMLCanvasElement, frame: ResolvedFrame): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // e.g. test environments without canvas support
    paintFrame(ctx, frame, (value) => this.colour(value));
  }

  /**
   * A token's colour as this surface resolves it now, in a form a canvas accepts (a canvas doesn't
   * follow CSS by itself). Read again at most once a second, so a theme change shows at once enough.
   */
  private colour(value: string): string {
    const now = performance.now();
    if (now - this.coloursAt > 1000) {
      this.colours.clear();
      this.coloursAt = now;
    }
    let resolved = this.colours.get(value);
    if (resolved === undefined) {
      const probe = document.createElement('span');
      probe.style.display = 'none';
      probe.style.color = value;
      this.host.append(probe);
      resolved = getComputedStyle(probe).color;
      probe.remove();
      this.colours.set(value, resolved);
    }
    return resolved;
  }
}
