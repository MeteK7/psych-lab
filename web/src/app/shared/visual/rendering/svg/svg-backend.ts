import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input } from '@angular/core';

import { DrawPaint, Drawable, ResolvedFrame, ResolvedTimeline, ResolvedTrack } from '../frame';

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
    case 'ellipse': {
      const { cx, cy, rx, ry } = shape;
      return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
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

let surfaces = 0;

function keyframes(track: ResolvedTrack): Keyframe[] {
  switch (track.property) {
    case 'opacity':
      return [{ opacity: track.from }, { opacity: track.to }];
    case 'offsetY':
      return [{ transform: `translate(0px, ${track.from}px)` }, { transform: `translate(0px, ${track.to}px)` }];
    case 'reveal':
      // The mask's dash covers the drawn fraction: offset 1 shows nothing, offset 0 all of it.
      return [{ strokeDashoffset: 1 - track.from }, { strokeDashoffset: 1 - track.to }];
    case 'paint': {
      const paint = (p: DrawPaint) => ({ fill: p.fill, stroke: p.stroke, strokeWidth: `${p.width}px` });
      return [paint(track.from), paint(track.to)];
    }
  }
}

/**
 * S7 Rendering, the SVG backend. Draws a resolved frame and decides nothing: colours are S1 token
 * references evaluated by the host styles (tokens.css), so light, dark and forced colours need no
 * new frame. Line widths don't scale with the figure (visual-language.md §4.1). The surface is
 * hidden from assistive technology; the slot or the Lab gives the text alternative.
 *
 * Motion: the frame always holds the final state. The backend plays the timeline's tracks towards
 * it with the Web Animations API (no timers, no frame loop) and cancels them when a new timeline
 * arrives or the surface goes away. Where the API is missing, the final state simply shows. A
 * `reveal` track draws its element through a mask, so a dashed line's dashes don't crawl.
 */
@Component({
  selector: 'app-vis-svg',
  host: { '[attr.data-vis-theme]': 'frame().theme', '[attr.data-vis-scheme]': 'scheme()' },
  template: `
    <svg [attr.viewBox]="viewBox()" aria-hidden="true" focusable="false">
      @if (frame().grain; as grain) {
        <!-- The grain tile (M3), repeated over any fill that asks for it. -->
        <defs>
          <pattern [attr.id]="grainId" patternUnits="userSpaceOnUse" [attr.width]="grain.tile" [attr.height]="grain.tile">
            <path [attr.d]="grain.d" style="fill: var(--vis-grain)" />
          </pattern>
        </defs>
      }
      @if (gradients().length) {
        <!-- Gradient fills (lit, shadow): in the shape's own bounding box, stops as token colours. -->
        <defs>
          @for (g of gradients(); track g.id) {
            @if (g.gradient.type === 'linear') {
              <linearGradient [attr.id]="g.id" [attr.x1]="g.gradient.from[0]" [attr.y1]="g.gradient.from[1]"
                              [attr.x2]="g.gradient.to[0]" [attr.y2]="g.gradient.to[1]">
                @for (s of g.gradient.stops; track s.offset) {
                  <stop [attr.offset]="s.offset" [style.stop-color]="s.colour" />
                }
              </linearGradient>
            } @else {
              <radialGradient [attr.id]="g.id">
                @for (s of g.gradient.stops; track s.offset) {
                  <stop [attr.offset]="s.offset" [style.stop-color]="s.colour" />
                }
              </radialGradient>
            }
          }
        </defs>
      }
      @if (reveals().size) {
        <defs>
          @for (item of revealed(); track item.id) {
            <mask [attr.id]="maskId(item.id)" maskUnits="userSpaceOnUse" x="0" y="0" [attr.width]="frame().width" [attr.height]="frame().height">
              <path class="reveal" [attr.data-vis-mask]="item.id" [attr.d]="item.d" pathLength="1" fill="none" stroke="white"
                    stroke-width="16" stroke-dasharray="1 2" stroke-dashoffset="0" />
            </mask>
          }
        </defs>
      }
      @for (item of items(); track item.id) {
        @if (item.kind === 'text') {
          <text [attr.data-vis-id]="item.id" [attr.x]="item.x" [attr.y]="item.y" [attr.text-anchor]="item.anchor"
                [style.fill]="item.fill" [style.font-size.px]="item.size" [style.font-weight]="item.weight === 'bold' ? 700 : null">{{ item.text }}</text>
        } @else {
          <path [attr.data-vis-id]="item.id" [attr.d]="item.d" [style.fill]="item.paint.gradient ? 'url(#' + gradientId(item.id) + ')' : item.paint.fill" [style.stroke]="item.paint.stroke"
                [style.stroke-width.px]="item.paint.width" [style.stroke-dasharray]="item.paint.dash"
                [attr.mask]="reveals().has(item.id) ? 'url(#' + maskId(item.id) + ')' : null" />
          @if (item.paint.grain) {
            <path [attr.data-vis-grain]="item.id" [attr.d]="item.d" [style.fill]="'url(#' + grainId + ')'" [style.opacity]="item.paint.grain" />
          }
        }
      }
    </svg>
  `,
  styleUrls: ['../../styling/tokens.css'],
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; overflow: hidden; }
    path { vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; }
    /* The mask's own stroke is a plain band along the path: square ends, so nothing shows early. */
    path.reveal { vector-effect: none; stroke-linecap: butt; }
    text { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
  `,
})
export class SvgBackend {
  /** Recorded as the backend of a shown visual. */
  static readonly id = 'svg.v1';

  readonly frame = input.required<ResolvedFrame>();
  readonly scheme = input<SurfaceScheme>('auto');
  /** Tracks towards the frame's state; empty means show the frame as it is. */
  readonly timeline = input<ResolvedTimeline>([]);

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly surface = `vis-${++surfaces}`;
  private running: Animation[] = [];

  protected readonly viewBox = computed(() => `0 0 ${this.frame().width} ${this.frame().height}`);
  protected readonly items = computed(() =>
    this.frame().items.map((item) => (item.kind === 'text' ? item : { ...item, d: pathData(item.shape) })),
  );
  protected readonly gradients = computed(() =>
    this.frame().items.flatMap((item) =>
      item.kind === 'shape' && item.paint.gradient ? [{ id: this.gradientId(item.id), gradient: item.paint.gradient }] : [],
    ),
  );
  protected readonly reveals = computed(() => new Set(this.timeline().filter((t) => t.property === 'reveal').map((t) => t.id)));
  protected readonly revealed = computed(() => this.items().filter((i) => i.kind === 'shape' && this.reveals().has(i.id)) as { id: string; d: string }[]);

  constructor() {
    afterRenderEffect(() => this.play(this.timeline()));
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected maskId(id: string): string {
    return `${this.surface}-${id}`;
  }

  protected readonly grainId = `${this.surface}-grain`;

  /** Unique on the page, like mask ids: several figures can show the same element ids. */
  protected gradientId(id: string): string {
    return `${this.surface}-g-${id}`;
  }

  private play(timeline: ResolvedTimeline): void {
    this.stop();
    for (const track of timeline) {
      const attr = track.property === 'reveal' ? 'data-vis-mask' : 'data-vis-id';
      const target = [...this.host.querySelectorAll(`[${attr}]`)].find((e) => e.getAttribute(attr) === track.id);
      if (typeof target?.animate !== 'function') continue;
      const { delay, duration, easing } = track;
      // `backwards`: the start value holds during the delay; afterwards the frame's own state shows.
      this.running.push(target.animate(keyframes(track), { delay, duration, easing, fill: 'backwards' }));
    }
  }

  private stop(): void {
    for (const animation of this.running) animation.cancel();
    this.running = [];
  }
}
