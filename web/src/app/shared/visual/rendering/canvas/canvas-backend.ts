import { Component, ElementRef, inject, input } from '@angular/core';

import type { Drawable, ResolvedFrame } from '../frame';
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

/**
 * Paints a resolved frame on a 2D context. Decides nothing (docs/visual-system.md §6.2): geometry,
 * paint and text all come in the frame; `colour` turns its token references into colours.
 */
export function paintFrame(ctx: CanvasRenderingContext2D, frame: ResolvedFrame, colour: ColourOf): void {
  ctx.clearRect(0, 0, frame.width, frame.height);
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
    if (paint.fill !== NONE) {
      ctx.fillStyle = colour(paint.fill);
      if (path) ctx.fill(path);
      else ctx.fill();
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
