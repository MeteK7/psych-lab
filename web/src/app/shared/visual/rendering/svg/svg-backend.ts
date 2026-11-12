import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input } from '@angular/core';

import { DrawPaint, Drawable, FrameItem, ResolvedFrame, ResolvedTimeline, ResolvedTrack } from '../frame';
import { FRAME_CLOCK } from '../frame-clock';
import { done, lerp, progress } from '../timing';
import { canMorph, tweenShape } from '../tween';

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

type ShapeTrack = Extract<ResolvedTrack, { property: 'shape' }>;
type TranslateTrack = Extract<ResolvedTrack, { property: 'translate' }>;
type ExitTrack = Extract<ResolvedTrack, { property: 'exit' }>;
type CssTrack = Exclude<ResolvedTrack, ShapeTrack | ExitTrack>;
const SVG = 'http://www.w3.org/2000/svg';

function keyframes(track: CssTrack): Keyframe[] {
  switch (track.property) {
    case 'translate':
      return [{ transform: `translate(${track.from[0]}px, ${track.from[1]}px)` }, { transform: `translate(${track.to[0]}px, ${track.to[1]}px)` }];
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
 * it with the Web Animations API (no timers) and cancels them when a new timeline arrives or the
 * surface goes away. Where the API is missing, the final state simply shows. A `reveal` track draws
 * its element through a mask, so a dashed line's dashes don't crawl.
 *
 * Shapes (M5), which CSS can't animate, glide frame by frame with the timing core: a frame loop
 * runs only while a glide is under way, and the browser pauses it when the page is hidden. A shape
 * that can't morph crossfades: a copy of its old drawing fades out over it. A new timeline that
 * arrives mid-glide starts each glide from where the shape is drawn now, and each label's move from
 * where it is now. A departing item, no longer in the frame, is drawn as it was, where it was, and
 * fades or is undrawn; then it is gone.
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
                [style.fill]="item.fill" [style.font-size.px]="item.size" [style.font-weight]="item.weight === 'bold' ? 700 : null"
                [style.stroke]="item.halo?.colour ?? null" [style.stroke-width.px]="item.halo?.width ?? null"
                >@if (item.lines; as lines) {@for (line of lines; track $index) {<tspan [attr.x]="item.x" [attr.y]="item.y + $index * item.lineHeight!">{{ line }}</tspan>}} @else {<ng-container>{{ item.text }}</ng-container>}</text>
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
    /* A halo is the text's own stroke, painted behind its fill (M3). */
    text { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; paint-order: stroke; stroke-linejoin: round; }
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
  /** Glides and moves under way (M5), with when they started, so a new timeline can pick them up. */
  private shapes: { track: ShapeTrack; start: number }[] = [];
  private moves: { track: TranslateTrack; start: number }[] = [];
  private ghosts: Element[] = [];
  private loop: number | null = null;
  private readonly clock = inject(FRAME_CLOCK);

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

  private find(attr: string, id: string): SVGElement | undefined {
    return [...this.host.querySelectorAll<SVGElement>(`[${attr}]`)].find((e) => e.getAttribute(attr) === id);
  }

  /** A new timeline's glides and moves, picked up from where the running ones have got to. */
  private carryOn(timeline: ResolvedTimeline, now: number): ResolvedTimeline {
    return timeline.map((track) => {
      if (track.property === 'shape') {
        const running = this.shapes.find((r) => r.track.id === track.id);
        if (!running) return track;
        const { from, to, morph } = running.track;
        const f = progress(running.track, now - running.start);
        const here = morph ? tweenShape(from, to, f) : f < 0.5 ? from : to;
        return { ...track, from: here, morph: canMorph(here, track.to) };
      }
      if (track.property === 'translate') {
        const running = this.moves.find((r) => r.track.id === track.id);
        if (!running) return track;
        const f = progress(running.track, now - running.start);
        const left = [0, 1].map((i) => lerp(running.track.from[i], running.track.to[i], f));
        return { ...track, from: [track.from[0] + left[0], track.from[1] + left[1]] as const };
      }
      return track;
    });
  }

  private play(timeline: ResolvedTimeline): void {
    const now = this.clock.now();
    const tracks = this.carryOn(timeline, now);
    this.stop();
    for (const track of tracks) {
      if (track.property === 'shape') {
        this.startShape(track, now);
        continue;
      }
      if (track.property === 'exit') {
        this.startExit(track);
        continue;
      }
      const target = this.find(track.property === 'reveal' ? 'data-vis-mask' : 'data-vis-id', track.id);
      if (typeof target?.animate !== 'function') continue;
      const { delay, duration, easing } = track;
      // `backwards`: the start value holds during the delay; afterwards the frame's own state shows.
      this.running.push(target.animate(keyframes(track), { delay, duration, easing, fill: 'backwards' }));
      if (track.property === 'translate') this.moves.push({ track, start: now });
    }
    if (this.shapes.some((r) => r.track.morph)) {
      this.loop = this.clock.request((t) => this.tick(t));
      // No frames to draw on: the final drawing shows at once.
      if (this.loop === null) this.settle();
    }
  }

  private startShape(track: ShapeTrack, now: number): void {
    const target = this.find('data-vis-id', track.id);
    if (!target) return;
    if (track.morph) {
      this.shapes.push({ track, start: now });
      this.draw(track, 0);
      return;
    }
    // Crossfade: a copy of the old drawing over the new one, fading out as the new one fades in.
    if (typeof target.animate !== 'function') return;
    const ghost = target.cloneNode() as SVGElement;
    ghost.removeAttribute('data-vis-id');
    ghost.setAttribute('data-vis-ghost', track.id);
    ghost.setAttribute('d', pathData(track.from));
    target.after(ghost);
    this.ghosts.push(ghost);
    this.shapes.push({ track, start: now });
    const { delay, duration, easing } = track;
    this.running.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { delay, duration, easing, fill: 'both' }));
    this.running.push(target.animate([{ opacity: 0 }, { opacity: 1 }], { delay, duration, easing, fill: 'backwards' }));
    // The copy goes when its fade is done.
    this.running[this.running.length - 2].finished?.then(() => ghost.remove(), () => undefined);
  }

  /** Draws a departing item as the template would, with the template's style scope. */
  private drawItem(item: FrameItem, scope: string | undefined): SVGElement {
    const make = (tag: string) => {
      const el = document.createElementNS(SVG, tag);
      if (scope) el.setAttribute(scope, '');
      return el;
    };
    if (item.kind === 'shape') {
      const path = make('path');
      path.setAttribute('d', pathData(item.shape));
      path.style.fill = item.paint.fill;
      path.style.stroke = item.paint.stroke;
      path.style.strokeWidth = `${item.paint.width}px`;
      if (item.paint.dash) path.style.strokeDasharray = item.paint.dash;
      return path;
    }
    const text = make('text');
    text.setAttribute('x', String(item.x));
    text.setAttribute('y', String(item.y));
    text.setAttribute('text-anchor', item.anchor);
    text.style.fill = item.fill;
    text.style.fontSize = `${item.size}px`;
    if (item.weight === 'bold') text.style.fontWeight = '700';
    if (item.halo) {
      text.style.stroke = item.halo.colour;
      text.style.strokeWidth = `${item.halo.width}px`;
    }
    if (item.lines) {
      item.lines.forEach((line, i) => {
        const span = make('tspan');
        span.setAttribute('x', String(item.x));
        span.setAttribute('y', String(item.y + i * item.lineHeight!));
        span.textContent = line;
        text.append(span);
      });
    } else text.textContent = item.text;
    return text;
  }

  private startExit(track: ExitTrack): void {
    const svg = this.host.querySelector('svg');
    if (!svg) return;
    const scope = [...svg.attributes].find((a) => a.name.startsWith('_ngcontent'))?.name;
    const el = this.drawItem(track.item, scope);
    el.setAttribute('data-vis-leaving', track.id);
    if (typeof el.animate !== 'function') return;
    const under = track.under ? this.find('data-vis-id', track.under) : null;
    if (under) under.before(el);
    else svg.append(el);
    this.ghosts.push(el);
    const { delay, duration, easing } = track;
    let animation: Animation;
    let mask: SVGElement | null = null;
    if (track.effect === 'undraw' && track.item.kind === 'shape') {
      // Taken back through a mask, as `reveal` draws, so a dashed line's dashes don't crawl: the
      // mask's band retracts from the end of the line to its start.
      const id = `${this.surface}-leaving-${track.id}`;
      mask = document.createElementNS(SVG, 'mask');
      for (const [k, v] of [['id', id], ['maskUnits', 'userSpaceOnUse'], ['x', '0'], ['y', '0'], ['width', String(this.frame().width)], ['height', String(this.frame().height)]])
        mask.setAttribute(k, v);
      const band = this.drawItem(track.item, scope);
      band.removeAttribute('style');
      for (const [k, v] of [['class', 'reveal'], ['pathLength', '1'], ['fill', 'none'], ['stroke', 'white'], ['stroke-width', '16'], ['stroke-dasharray', '1 2'], ['stroke-dashoffset', '0']])
        band.setAttribute(k, v);
      mask.append(band);
      svg.prepend(mask);
      this.ghosts.push(mask);
      el.setAttribute('mask', `url(#${id})`);
      animation = band.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], { delay, duration, easing, fill: 'both' });
    } else animation = el.animate([{ opacity: 1 }, { opacity: 0 }], { delay, duration, easing, fill: 'both' });
    this.running.push(animation);
    // Gone once it has left.
    animation.finished?.then(
      () => {
        el.remove();
        mask?.remove();
        this.ghosts = this.ghosts.filter((g) => g !== el && g !== mask);
      },
      () => undefined,
    );
  }

  /** One frame of every glide; the loop ends when they're all done. */
  private tick(time: number): void {
    this.loop = null;
    let going = false;
    for (const { track, start } of this.shapes) {
      if (!track.morph) continue;
      this.draw(track, progress(track, time - start));
      going ||= !done(track, time - start);
    }
    if (going) this.loop = this.clock.request((t) => this.tick(t));
    if (this.loop === null) this.settle();
  }

  private draw(track: ShapeTrack, f: number): void {
    const d = pathData(tweenShape(track.from, track.to, f));
    this.find('data-vis-id', track.id)?.setAttribute('d', d);
    this.find('data-vis-grain', track.id)?.setAttribute('d', d);
  }

  /** Every glided shape back to the frame's own drawing. */
  private settle(): void {
    const drawn = new Map(this.items().flatMap((i) => (i.kind === 'shape' ? [[i.id, i.d] as const] : [])));
    for (const { track } of this.shapes) {
      const d = drawn.get(track.id);
      if (d === undefined || !track.morph) continue;
      this.find('data-vis-id', track.id)?.setAttribute('d', d);
      this.find('data-vis-grain', track.id)?.setAttribute('d', d);
    }
    this.shapes = this.shapes.filter((r) => !r.track.morph);
  }

  private stop(): void {
    for (const animation of this.running) animation.cancel();
    this.running = [];
    if (this.loop !== null) this.clock.cancel(this.loop);
    this.loop = null;
    this.settle();
    this.shapes = [];
    for (const ghost of this.ghosts) ghost.remove();
    this.ghosts = [];
    this.moves = [];
  }
}
