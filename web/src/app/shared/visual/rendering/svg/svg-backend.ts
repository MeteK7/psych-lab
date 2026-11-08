import { Component, computed, input } from '@angular/core';

import { Drawable, ResolvedFrame } from '../frame';

/** How the surface picks light or dark: from the page, or pinned (the Visual Lab shows both side by side). */
export type SurfaceScheme = 'auto' | 'light' | 'dark';

/** Every drawable as SVG path data, so one element type carries all paint. */
export function pathData(shape: Drawable): string {
  switch (shape.type) {
    case 'path':
      return shape.d;
    case 'line':
      return `M${shape.x1} ${shape.y1} L${shape.x2} ${shape.y2}`;
    case 'circle': {
      const { cx, cy, r } = shape;
      return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
    }
    case 'rect': {
      const { x, y, width: w, height: h } = shape;
      const r = Math.min(shape.rx ?? 0, w / 2, h / 2);
      if (!r) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
      return (
        `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} ` +
        `A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
        `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
      );
    }
  }
}

/**
 * S7 Rendering, the SVG backend. Draws a resolved frame and decides nothing: colours are S1 token
 * references evaluated by the host styles (tokens.css), so light, dark and forced colours need no
 * new frame. Line widths don't scale with the figure (visual-language.md §4.1). The surface is
 * hidden from assistive technology; the slot or the Lab gives the text alternative.
 */
@Component({
  selector: 'app-vis-svg',
  host: { '[attr.data-vis-theme]': 'frame().theme', '[attr.data-vis-scheme]': 'scheme()' },
  template: `
    <svg [attr.viewBox]="viewBox()" aria-hidden="true" focusable="false">
      @for (item of items(); track item.id) {
        @if (item.kind === 'text') {
          <text [attr.data-vis-id]="item.id" [attr.x]="item.x" [attr.y]="item.y" [attr.text-anchor]="item.anchor"
                [style.fill]="item.fill" [style.font-size.px]="item.size">{{ item.text }}</text>
        } @else {
          <path [attr.data-vis-id]="item.id" [attr.d]="item.d" [style.fill]="item.paint.fill" [style.stroke]="item.paint.stroke"
                [style.stroke-width.px]="item.paint.width" [style.stroke-dasharray]="item.paint.dash" />
        }
      }
    </svg>
  `,
  styleUrls: ['../../styling/tokens.css'],
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; overflow: hidden; }
    path { vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; }
    text { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
  `,
})
export class SvgBackend {
  /** Recorded as the backend of a shown visual. */
  static readonly id = 'svg.v1';

  readonly frame = input.required<ResolvedFrame>();
  readonly scheme = input<SurfaceScheme>('auto');

  protected readonly viewBox = computed(() => `0 0 ${this.frame().width} ${this.frame().height}`);
  protected readonly items = computed(() =>
    this.frame().items.map((item) => (item.kind === 'text' ? item : { ...item, d: pathData(item.shape) })),
  );
}
