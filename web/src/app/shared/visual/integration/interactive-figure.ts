import { Component, ElementRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { Composed, SHOWN, lookupOf } from '../composition/compose';
import type { Pt } from '../composition/outline';
import type { ElementId, Target } from '../composition/scene';
import { InteractionState, Values, escape, keyStep, lost, move, moving, press, putDown, release } from '../interaction/controller';
import { Hit, hitTest, targetsOf, toScenePoint } from '../interaction/regions';
import { endsOf } from '../interaction/scales';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { frameSize } from '../styling/vocabulary';
import { buildFrame } from './pipeline';

export type { Values };

/**
 * Who takes the keyboard for an interactive figure (docs/visual-system.md §12):
 * - `figure`: the figure is itself the control. Each axis of each handle is a focus stop, a slider
 *   for assistive technology, stepped by arrows, Page Up and Down, Home and End, with the focus ring.
 * - `native`: a native control next to the figure holds the same value and takes the keyboard and
 *   assistive technology; the figure takes the pointer only and is a picture to everything else.
 */
export type ControlledBy = 'figure' | 'native';

type Handle = Extract<Target, { kind: 'handle' }>;

interface Stop {
  key: string;
  handle: ElementId;
  target: Handle;
  axis: 'x' | 'y';
  label: string;
  now: number;
  min: number;
  max: number;
  text: string;
  orientation: 'horizontal' | 'vertical';
  /** Over the handle's least area, in percent of the figure, so a screen magnifier follows focus. */
  box: { left: number; top: number; width: number; height: number };
}

/**
 * S9 Integration: a composition a person can move (milestone M4 stage B). It takes the exercise's
 * values and reports changes as values, never positions: the exercise draws the figure again from
 * them (`composed`), so a handle always sits where its value is and snaps as it moves. Pointer
 * input: drag a handle, press its track, or click a handle and then where it should go (no drag
 * needed); Escape during a drag or a pick-up puts the value back. The handle being moved is focal.
 * Hovering shows only a cursor.
 */
@Component({
  selector: 'app-vis-interactive',
  imports: [SvgBackend],
  host: {
    '[attr.role]': "controlledBy() === 'figure' ? 'group' : 'img'",
    '[attr.aria-label]': 'alt()',
    '[style.cursor]': 'cursor()',
    '(pointerdown)': 'onPress($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onRelease()',
    '(pointercancel)': 'onLost()',
    '(lostpointercapture)': 'onLost()',
    '(pointerleave)': 'hover.set(null)',
    '(document:keydown)': 'onDocumentKey($event)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  template: `
    <app-vis-svg [frame]="frame()" [scheme]="scheme()" />
    @if (controlledBy() === 'figure') {
      @for (stop of stops(); track stop.key) {
        <span class="stop" role="slider" tabindex="0" [attr.data-stop]="stop.key" [attr.aria-label]="stop.label"
              [attr.aria-valuenow]="stop.now" [attr.aria-valuemin]="stop.min" [attr.aria-valuemax]="stop.max"
              [attr.aria-valuetext]="stop.text" [attr.aria-orientation]="stop.orientation"
              [style.left.%]="stop.box.left" [style.top.%]="stop.box.top" [style.width.%]="stop.box.width" [style.height.%]="stop.box.height"
              (keydown)="onKey(stop, $event)" (focus)="onFocus(stop, $event)" (blur)="focused.set(null)"></span>
      }
    }
  `,
  styles: `
    :host { display: block; position: relative; user-select: none; -webkit-user-select: none; }
    /* The focus ring is drawn in the figure, around the handle (S1 focus token). */
    .stop { position: absolute; outline: none; }
  `,
})
export class InteractiveFigure {
  /** The figure, drawn by the exercise from `values`. */
  readonly composed = input.required<Composed>();
  readonly values = input.required<Values>();
  readonly controlledBy = input<ControlledBy>('figure');
  readonly scheme = input<SurfaceScheme>('auto');
  /** Every change, in the exercise's own values: while dragging (snapped), on a click, a key, or Escape. */
  readonly valuesChange = output<Values>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly state = linkedSignal<Values, InteractionState>({
    source: this.values,
    computation: (values, previous) => ({ values, gesture: previous?.value.gesture ?? null }),
  });
  private pressed = false;
  protected readonly hover = signal<Hit['kind'] | null>(null);
  protected readonly focused = signal<{ handle: ElementId; visible: boolean } | null>(null);

  private readonly lookup = computed(() => lookupOf(this.composed()));
  private readonly targets = computed(() => targetsOf(this.composed().scene, SHOWN));
  protected readonly alt = computed(() => this.composed().text['alt']);

  protected readonly frame = computed(() => {
    const handle = moving(this.state());
    const focus = this.focused();
    return buildFrame(this.composed().scene, SHOWN, this.lookup(), {
      emphasis: handle ? { [handle]: 'focal' } : {},
      focus: focus?.visible ? focus.handle : null,
    });
  });

  protected readonly cursor = computed(() => {
    const g = this.state().gesture;
    if (g?.kind === 'drag') return 'grabbing';
    if (g?.kind === 'picked') return 'crosshair';
    const over = this.hover();
    return over === 'handle' ? 'grab' : over === 'track' ? 'pointer' : null;
  });

  protected readonly stops = computed<Stop[]>(() => {
    const { scene } = this.composed();
    const { width, height } = frameSize(scene.frame);
    const values = this.state().values;
    const words = this.lookup();
    return this.targets().flatMap((t) => {
      if (t.hit.kind !== 'handle') return [];
      const { id, target } = t.hit;
      const box = { left: (t.area.x / width) * 100, top: (t.area.y / height) * 100, width: (t.area.width / width) * 100, height: (t.area.height / height) * 100 };
      return (['x', 'y'] as const).flatMap((axis): Stop[] => {
        const a = target[axis];
        const scale = a && scene.scales?.[a.scale];
        if (!a || !scale) return [];
        const value = values[a.value] ?? endsOf(scale)[0];
        const name = words(target.label) ?? '';
        const label = a.label ? `${name}, ${words(a.label) ?? ''}` : name;
        const orientation = axis === 'x' ? 'horizontal' : 'vertical';
        if (scale.kind === 'points') {
          const now = Math.max(0, scale.values.indexOf(value));
          return [{ key: `${id}-${axis}`, handle: id, target, axis, label, now, min: 0, max: scale.values.length - 1, text: String(value), orientation, box }];
        }
        const [min, max] = endsOf(scale) as [number, number];
        return [{ key: `${id}-${axis}`, handle: id, target, axis, label, now: Number(value), min: Math.min(min, max), max: Math.max(min, max), text: String(value), orientation, box }];
      });
    });
  });

  private point(event: PointerEvent): Pt | null {
    const svg = this.host.querySelector('svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return toScenePoint({ x: event.clientX, y: event.clientY }, rect, frameSize(this.composed().scene.frame));
  }

  /** Applies a new interaction state and reports the values when they changed. */
  private apply(next: InteractionState): void {
    const before = this.state().values;
    this.state.set(next);
    if (next.values !== before) this.valuesChange.emit(next.values);
  }

  protected onPress(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary) return;
    const p = this.point(event);
    if (!p) return;
    const { state, capture } = press(this.composed().scene, this.targets(), this.state(), p);
    if (state === this.state()) return;
    event.preventDefault();
    this.apply(state);
    if (capture) {
      this.pressed = true;
      this.host.setPointerCapture?.(event.pointerId);
    }
    // A figure that is the control takes focus where it was pressed, as a native slider does.
    const g = state.gesture;
    if (this.controlledBy() === 'figure' && g && g.kind !== 'cancelled') {
      const stop = [...this.host.querySelectorAll<HTMLElement>('[data-stop]')].find((s) => s.dataset['stop']?.startsWith(`${g.handle}-`));
      stop?.focus({ preventScroll: true });
    }
  }

  protected onMove(event: PointerEvent): void {
    const p = this.point(event);
    if (!p) return;
    if (this.pressed) this.apply(move(this.composed().scene, this.state(), p));
    else this.hover.set(hitTest(this.targets(), p)?.kind ?? null);
  }

  protected onRelease(): void {
    if (!this.pressed) return;
    this.pressed = false;
    this.apply(release(this.state()));
  }

  protected onLost(): void {
    this.pressed = false;
    this.apply(lost(this.state()));
  }

  protected onDocumentKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    const { state, handled } = escape(this.state(), this.pressed);
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    this.apply(state);
  }

  /** A click anywhere else puts a picked-up handle down where it was. */
  protected onOutside(event: PointerEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.apply(putDown(this.state()));
  }

  protected onFocus(stop: Stop, event: FocusEvent): void {
    const el = event.target as HTMLElement;
    this.focused.set({ handle: stop.handle, visible: el.matches?.(':focus-visible') ?? true });
  }

  protected onKey(stop: Stop, event: KeyboardEvent): void {
    const next = keyStep(this.composed().scene, stop.target, stop.axis, this.state().values, event.key);
    if (!next) return;
    event.preventDefault();
    this.focused.set({ handle: stop.handle, visible: true });
    this.apply({ values: next, gesture: null });
  }
}
