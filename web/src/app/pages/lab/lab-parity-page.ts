import { Component, inject, signal } from '@angular/core';

import { AppEnvironment } from '../../shared/app-environment';
import { FRAME_CLOCK, FrameClock, FrameFigure, FrameItem, ResolvedFrame, ResolvedTimeline } from '../../shared/visual/integration/frame-figure';
import { LabOverlay } from './lab-overlay';
import { ParityCase, parityCases } from './lab-parity-cases';

type Scheme = 'light' | 'dark';

/**
 * The frame clock on this page: the browser's, until the parity suite takes it over (`?harness`)
 * and moves time by hand, so both backends are captured at the same moment of a change.
 */
class HarnessClock implements FrameClock {
  manual = false;
  time = 0;
  private waiting = new Map<number, (time: number) => void>();
  private next = 1;
  now(): number {
    return this.manual ? this.time : performance.now();
  }
  request(callback: (time: number) => void): number | null {
    if (!this.manual) return requestAnimationFrame(callback);
    const handle = this.next++;
    this.waiting.set(handle, callback);
    return handle;
  }
  cancel(handle: number): void {
    if (this.manual) this.waiting.delete(handle);
    else cancelAnimationFrame(handle);
  }
  /** Moves time to `ms` and runs the frames waiting for it. */
  advance(ms: number): void {
    this.time = ms;
    const due = [...this.waiting.values()];
    this.waiting.clear();
    for (const callback of due) callback(ms);
  }
}

/** The page's frame clock (one per page: the harness shows one case at a time). */
const PARITY_CLOCK = new HarnessClock();

interface Shown {
  token: number;
  case: ParityCase;
  scheme: Scheme;
  frame: ResolvedFrame;
  /** The canvas's frame: the same, unless a test swaps a colour on purpose (it must then fail). */
  canvasFrame: ResolvedFrame;
  timeline: ResolvedTimeline;
}

/** An item the suite checks is visibly drawn: text, small marks, the subject (M6, point 2). */
interface Checked {
  id: string;
  kind: FrameItem['kind'];
  /** In scene units (= CSS px: the harness draws at design size). */
  box: { x: number; y: number; width: number; height: number };
}

/**
 * The Visual Lab's parity page (milestone M6, S10): every case drawn by the SVG backend and the
 * canvas backend side by side, in light and dark, for review. The parity suite (e2e) uses it with
 * `?harness`: one case at a time, at its design size, at the top left of the page, with the frame
 * clock moved by hand, and a small API on `window.__parity`.
 */
@Component({
  selector: 'app-lab-parity-page',
  imports: [FrameFigure, LabOverlay],
  providers: [{ provide: FRAME_CLOCK, useValue: PARITY_CLOCK }],
  styleUrls: ['./lab.css'],
  styles: `
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .pair .panel { padding: 0.4rem; }
    .stage { position: fixed; left: 0; top: 0; margin: 0; padding: 0; z-index: 2147483647; }
    .holder { position: absolute; left: 0; background: var(--bg); }
  `,
  template: `
    @if (env.showsDevelopment()) {
      @if (harness) {
        @for (s of shown(); track s.token) {
          <div class="stage" [class]="s.scheme" data-parity-stage>
            <div class="holder" data-parity="svg" [style.top.px]="0" [style.width.px]="s.frame.width" [style.height.px]="s.frame.height">
              <app-vis-frame backend="svg" [frame]="s.frame" [timeline]="s.timeline" [scheme]="s.scheme" />
            </div>
            <div class="holder" data-parity="canvas" [style.top.px]="gap(s.frame)" [style.width.px]="s.frame.width" [style.height.px]="s.frame.height">
              <app-vis-frame backend="canvas" [frame]="s.canvasFrame" [timeline]="s.timeline" [scheme]="s.scheme" />
            </div>
          </div>
        }
      } @else {
        <h1>Rendering parity</h1>
        <p class="lead">Every composition drawn by the SVG backend (left) and the canvas backend (right), in light and dark.</p>
        <app-lab-overlay />
        <ul class="notes muted">
          <li>The parity suite compares them in the browser at device pixel ratios 1, 1.5 and 2: no difference inside fills, lines and the
            ground beyond the measured rendering noise; differences only at edges, on at most 0.5% of the pixels; each label in the same
            place (within a pixel) with the same ink (within 5%); and every label, small mark and subject visibly drawn by both.</li>
          <li>Changes play here as they do in the exercises. The suite captures both backends at the same moments of each change.</li>
        </ul>
        @for (group of groups; track group.name) {
          <section class="scene" [attr.aria-labelledby]="'parity-' + $index">
            <h2 [id]="'parity-' + $index">{{ group.name }}</h2>
            @for (c of group.cases; track c.key) {
              <h3>{{ c.name }}</h3>
              <div class="grid">
                @for (scheme of schemes; track scheme) {
                  <div class="panel" [class]="scheme">
                    <span class="tag">SVG · canvas · {{ scheme }}</span>
                    <div class="pair">
                      <div role="img" [attr.aria-label]="c.name + ', drawn by SVG'"><app-vis-frame backend="svg" [frame]="c.frame" [timeline]="c.timeline ?? []" [scheme]="scheme" /></div>
                      <div role="img" [attr.aria-label]="c.name + ', drawn on a canvas'"><app-vis-frame backend="canvas" [frame]="c.frame" [timeline]="c.timeline ?? []" [scheme]="scheme" /></div>
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }
      }
    } @else {
      <h1>Rendering parity</h1>
      <p>The Visual Lab is part of the development build only.</p>
    }
  `,
})
export class LabParityPage {
  protected readonly env = inject(AppEnvironment);
  protected readonly schemes: Scheme[] = ['light', 'dark'];
  protected readonly harness = typeof location !== 'undefined' && new URLSearchParams(location.search).has('harness');
  private readonly cases = parityCases();
  protected readonly groups = [...new Set(this.cases.map((c) => c.group))].map((name) => ({ name, cases: this.cases.filter((c) => c.group === name) }));
  protected readonly shown = signal<Shown[]>([]);
  private token = 0;

  constructor() {
    if (this.harness) (globalThis as Record<string, unknown>)['__parity'] = this.api();
  }

  /** The canvas sits below the SVG at an even number of CSS px, so both start on a device pixel at ratio 1.5. */
  protected gap(frame: ResolvedFrame): number {
    return Math.ceil((frame.height + 8) / 2) * 2;
  }

  private api() {
    const clock = PARITY_CLOCK;
    const frames = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return {
      cases: () => this.cases.map((c) => ({ key: c.key, group: c.group, name: c.name, width: c.frame.width, height: c.frame.height, change: !!c.timeline, gap: this.gap(c.frame) })),
      /** Shows a case: whole, without one item, or that item alone; a change starts at time 0 on the hand-moved clock. */
      show: async (
        key: string,
        scheme: Scheme,
        variant: { without?: string; only?: string; none?: boolean; play?: boolean; swap?: [string, string]; nudge?: { id: string; dx: number } } = {},
      ) => {
        const c = this.cases.find((x) => x.key === key);
        if (!c) throw new Error(`No parity case '${key}'`);
        const items = variant.none ? [] : c.frame.items.filter((i) => (variant.only ? i.id === variant.only : i.id !== variant.without));
        const frame = { ...c.frame, items };
        const { swap, nudge } = variant;
        // Deliberate faults on the canvas side only (the suite checks that they fail): a fill drawn in
        // another colour, or a round mark moved sideways by `dx` units.
        const canvasFrame = {
          ...frame,
          items: items.map((i) => {
            if (i.kind !== 'shape') return i;
            if (swap && i.paint.fill === swap[0]) return { ...i, paint: { ...i.paint, fill: swap[1] } };
            if (nudge && i.id === nudge.id && i.shape.type === 'circle') return { ...i, shape: { ...i.shape, cx: i.shape.cx + nudge.dx } };
            return i;
          }),
        };
        clock.manual = !!variant.play;
        clock.time = 0;
        this.shown.set([]);
        await frames();
        this.shown.set([{ token: ++this.token, case: c, scheme, frame, canvasFrame, timeline: variant.play ? (c.timeline ?? []) : [] }]);
        await document.fonts.ready;
        await frames();
      },
      /** Moves a playing change to `ms`: the canvas draws that moment; SVG's animations are paused there. */
      at: async (ms: number) => {
        for (const a of document.getAnimations()) {
          const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
          if (!target?.closest('[data-parity="svg"]')) continue;
          a.pause();
          a.currentTime = ms;
        }
        clock.advance(ms);
        await frames();
      },
      /** When the change being played ends. */
      end: () => this.shown()[0]?.timeline.reduce((e, t) => Math.max(e, t.delay + t.duration), 0) ?? 0,
      /** How far each moving label travels in the change being played (its translate's start offset). */
      moves: () =>
        (this.shown()[0]?.timeline ?? []).flatMap((t) => (t.property === 'translate' ? [{ id: t.id, dx: t.from[0], dy: t.from[1] }] : t.property === 'offsetY' ? [{ id: t.id, dx: 0, dy: t.from }] : [])),
      /** Each text item's box as SVG draws it, in CSS px from the holder's top left. */
      textBoxes: () =>
        [...document.querySelectorAll<SVGTextElement>('[data-parity="svg"] text[data-vis-id]')].map((t) => {
          const b = t.getBBox();
          return { id: t.getAttribute('data-vis-id')!, x: b.x, y: b.y, width: b.width, height: b.height };
        }),
      /** The items checked for visibility: text, marks smaller than 24 × 24 units, and the subject. */
      checked: (): Checked[] => {
        const shown = this.shown()[0];
        if (!shown) return [];
        return shown.frame.items.flatMap((item): Checked[] => {
          const el = document.querySelector<SVGGraphicsElement>(`[data-parity="svg"] [data-vis-id="${CSS.escape(item.id)}"]`);
          if (!el) return [];
          const b = el.getBBox();
          const grow = item.kind === 'shape' ? item.paint.width / 2 + 1 : 2;
          const box = { x: b.x - grow, y: b.y - grow, width: b.width + 2 * grow, height: b.height + 2 * grow };
          const subject = item.kind === 'shape' && /--vis-(subject|focal)/.test(`${item.paint.fill} ${item.paint.stroke}`);
          const small = item.kind === 'shape' && Math.max(b.width, b.height) < 24;
          return item.kind === 'text' || small || subject ? [{ id: item.id, kind: item.kind, box }] : [];
        });
      },
    };
  }
}

